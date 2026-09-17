<!-- Three.js map spike: same stores, same data, WebGL renderer.
     Scope: static scene (governorates + neighbors + labels) with raycast
     hover/click wired into uiStore, plus a fullscreen CRT pass (barrel +
     vignette + scanlines). Weather, migration arrows, and stat icons come
     later IF this proves 60fps. Hit-testing parity: click gov = select,
     click empty = deselect (mirrors SyriaMap.svelte). -->
<script lang="ts">
  import * as THREE from 'three';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
  import { get } from 'svelte/store';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { SYRIA_2D_GOVERNORATES } from './syria-2d-paths';
  import { REGION_NEAR, REGION_FAR, REGION_FAR_LABELS, REGION_SEA } from './syria-region-context';
  import type { GovernorateNode } from '../engine/types';

  // SVG map frame: x 0..1000 right, y 0..880 DOWN. Three.js is y-up, so all
  // geometry is built with y negated; the ortho camera mirrors the viewBox.
  const WORLD_W = 1000;
  const WORLD_H = 880;

  let host: HTMLDivElement | null = $state(null);

  // Parse "M x y L x y ... Z (M ... Z)*" into rings of [x, -y] points.
  function parsePaths(d: string): [number, number][][] {
    const rings: [number, number][][] = [];
    for (const sub of d.split(/(?=M\s)/g)) {
      const nums = sub.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      const pts: [number, number][] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], -nums[i + 1]]);
      if (pts.length >= 3) rings.push(pts);
    }
    return rings;
  }

  function shapeMesh(
    rings: [number, number][][],
    color: number,
    opacity: number,
    z: number,
  ): THREE.Group {
    const group = new THREE.Group();
    for (const pts of rings) {
      const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
      group.add(new THREE.Mesh(geo, mat));
      const edge = new THREE.BufferGeometry().setFromPoints([
        ...pts.map(([x, y]) => new THREE.Vector3(x, y, 0)),
      ]);
      group.add(new THREE.LineLoop(edge, new THREE.LineBasicMaterial({ color: 0x0d1117 })));
    }
    group.position.z = z;
    return group;
  }

  // Health ramp (mirrors SyriaMap.svelte: worst red -> mid gold -> best green).
  function attentionIndex(gov: GovernorateNode | undefined): number {
    if (!gov) return 0.3;
    return (
      gov.mineSaturationPct / 100 +
      gov.dailyBlackoutHours / 24 +
      (1 - gov.reconstructionScore) +
      gov.prri / 100
    ) / 4;
  }
  function healthColor(gov: GovernorateNode | undefined): THREE.Color {
    // Hex strings are interpreted as sRGB and converted to the linear
    // working space (ColorManagement on) — matches the 2D ramp exactly.
    const worst = new THREE.Color('#4a151e');
    const mid = new THREE.Color('#988561');
    const best = new THREE.Color('#2e6b5f');
    const health = 1 - Math.min(1, Math.max(0, (attentionIndex(gov) - 0.25) / 0.5));
    const c = new THREE.Color();
    if (health < 0.5) c.lerpColors(worst, mid, health * 2);
    else c.lerpColors(mid, best, (health - 0.5) * 2);
    return c;
  }

  // Arabic-shaping-safe label: canvas 2D shapes complex script correctly,
  // unlike SDF text stacks. Same heading face as the UI.
  function makeLabel(text: string): THREE.Sprite {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.font = '700 56px "Thmanyah Serif Display", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9a8a5f';
    ctx.globalAlpha = 0.9;
    ctx.fillText(text, 256, 66);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(130, 32.5, 1);
    sprite.renderOrder = 10;
    return sprite;
  }

  const CRTShader = {
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      uBarrel: { value: 0.16 },
      uVig: { value: 0.55 },
      uScan: { value: 0.05 },
      uRes: { value: new THREE.Vector2(1600, 900) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform float uBarrel;
      uniform float uVig;
      uniform float uScan;
      uniform vec2 uRes;
      varying vec2 vUv;
      void main() {
        vec2 cc = vUv - 0.5;
        float r2 = dot(cc, cc);
        vec2 uv = vUv + cc * r2 * uBarrel;
        float mask = step(abs(uv.x - 0.5), 0.5) * step(abs(uv.y - 0.5), 0.5);
        vec3 col = texture2D(tDiffuse, uv).rgb * mask;
        float vig = smoothstep(0.95, 0.3, length(cc * vec2(1.0, 1.25)));
        col *= mix(1.0, vig, uVig);
        col *= 1.0 - uScan * (0.5 + 0.5 * sin(vUv.y * uRes.y * 3.14159));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  };

  $effect(() => {
    const el = host;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x0b1512, 1);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const scene = new THREE.Scene();
    // Ortho camera mirroring the 2D viewBox (y negated frame).
    const camera = new THREE.OrthographicCamera(0, WORLD_W, 0, -WORLD_H, -10, 10);

    const fitCamera = (w: number, h: number): void => {
      const boxAspect = WORLD_W / WORLD_H;
      const aspect = w / Math.max(1, h);
      let halfW = WORLD_W / 2;
      let halfH = WORLD_H / 2;
      if (aspect > boxAspect) halfW = halfH * aspect;
      else halfH = halfW / aspect;
      camera.left = WORLD_W / 2 - halfW;
      camera.right = WORLD_W / 2 + halfW;
      camera.top = -WORLD_H / 2 + halfH;
      camera.bottom = -WORLD_H / 2 - halfH;
      camera.updateProjectionMatrix();
    };

    // Sea backdrop.
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(12000, 12000),
      new THREE.MeshBasicMaterial({ color: 0x0d323c }),
    );
    sea.position.set(500, -440, -2);
    scene.add(sea);

    // Neighbor lands (flat, decorative for now — data-region ids kept).
    for (const n of [...REGION_FAR, ...REGION_NEAR]) {
      const g = shapeMesh(parsePaths(n.path), 0x221b11, 0.92, -1);
      g.userData.regionId = n.id;
      scene.add(g);
    }

    // Governorates (interactive).
    const govMeshes = new Map<string, THREE.Mesh[]>();
    for (const gov of SYRIA_2D_GOVERNORATES) {
      const state = get(gameStore).governorates[gov.id];
      const group = shapeMesh(parsePaths(gov.path), 0xffffff, 0.78, 0);
      const meshes: THREE.Mesh[] = [];
      for (const child of group.children) {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshBasicMaterial).color.copy(healthColor(state));
          child.userData.govId = gov.id;
          meshes.push(child);
        }
      }
      govMeshes.set(gov.id, meshes);
      scene.add(group);
    }

    // Place-name sprites.
    const labelData = [
      ...REGION_NEAR.map((n) => ({ name: n.nameAr, at: n.labelAt })),
      ...REGION_FAR_LABELS.map((n) => ({ name: n.nameAr, at: n.labelAt })),
    ];
    for (const l of labelData) {
      const sprite = makeLabel(l.name);
      sprite.position.set(l.at[0], -l.at[1], 5);
      scene.add(sprite);
    }

    // Post: render + CRT tube pass.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const crtPass = new ShaderPass(CRTShader);
    composer.addPass(crtPass);
    composer.addPass(new OutputPass());

    const resize = (): void => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      composer.setPixelRatio(dpr);
      composer.setSize(w, h);
      (crtPass.uniforms['uRes'].value as THREE.Vector2).set(w * dpr, h * dpr);
      fitCamera(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickMeshes: THREE.Object3D[] = [];
    for (const meshes of govMeshes.values()) pickMeshes.push(...meshes);
    let hovered: string | null = null;

    const pick = (e: PointerEvent): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickMeshes, false);
      return hits.length > 0 ? (hits[0].object.userData.govId as string) ?? null : null;
    };

    const onMove = (e: PointerEvent): void => {
      hovered = pick(e);
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
    };
    const onClick = (e: PointerEvent): void => {
      const id = pick(e);
      const current = get(uiStore).selectedGovernorateId;
      if (!id) {
        uiStore.selectGovernorate(null);
        uiStore.closeCommandPanel();
      } else if (current === id) {
        uiStore.selectGovernorate(null);
        if (get(uiStore).activeCommandPanel === 'provincial') uiStore.closeCommandPanel();
      } else {
        uiStore.selectGovernorate(id);
      }
    };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('click', onClick);

    let raf = 0;
    let alive = true;
    const selected = (): string | null => get(uiStore).selectedGovernorateId;
    const frame = (): void => {
      if (!alive) return;
      const sel = selected();
      for (const [id, meshes] of govMeshes) {
        const base = healthColor(get(gameStore).governorates[id]);
        if (id === hovered) base.offsetHSL(0, 0, 0.07);
        if (id === sel) base.offsetHSL(0, 0, 0.12);
        for (const m of meshes) (m.material as THREE.MeshBasicMaterial).color.copy(base);
      }
      composer.render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('click', onClick);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      composer.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  });
</script>

<div
  bind:this={host}
  class="relative w-full h-full overflow-hidden select-none"
  role="region"
  aria-label="الخارطة الاستراتيجية للجمهورية العربية السورية"
></div>
