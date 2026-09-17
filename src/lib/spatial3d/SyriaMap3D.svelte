<!-- Three.js map renderer — full parity with SyriaMap.svelte (2D):
     regional context + governorates + health ramp, stat clusters with
     hover flood / halo / % pill, migration arrows with tooltips, seasonal
     weather (wind lines, snow quads), keyboard shape navigation, and the
     CRT tube as a post-process pass (deck toggle honors uiStore.crtTube).
     Same stores, same selectors, same interaction contract as the 2D map:
     click gov = select, click empty = deselect, Esc clears. -->
<script lang="ts">
  import * as THREE from 'three';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
  import { get } from 'svelte/store';
  import { gameStore } from '../stores/game-store';
  import { projectedTurnStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import { theme } from '../stores/theme-store';
  import { SYRIA_2D_GOVERNORATES } from './syria-2d-paths';
  import { REGION_NEAR, REGION_FAR, REGION_FAR_LABELS } from './syria-region-context';
  import { GLYPHS } from '../ui/GameIcon.svelte';
  import { cssRgbTriplet, type RgbTriplet } from '../themes';
  import type { GovernorateNode, MigrationFlow } from '../engine/types';

  // Live theme snapshot (CSS vars are read once per theme change, never per
  // frame — getComputedStyle in the hot loop would force style recalc).
  // Every value the 2D map themes must be here; region land/sea/label
  // colors are literals on both maps by design (SyID identity colors).
  interface ThemeVars {
    ok: string; warn: string; danger: string; midGold: string;
    ink: string; shadow: string; selected: string; hover: string;
    arrowPred: string; divider: string;
    canvas: string; grid: string;
    rampWorst: RgbTriplet; rampMid: RgbTriplet; rampBest: RgbTriplet;
  }
  function readThemeVars(): ThemeVars {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string, fb: string): string => cs.getPropertyValue(n).trim() || fb;
    return {
      ok: v('--map-ok', '#3fb950'),
      warn: v('--map-warn', '#f5d547'),
      danger: v('--map-danger', '#ce1126'),
      midGold: v('--map-arrow-hist', '#b9a779'),
      ink: v('--map-ink', '#0d1117'),
      shadow: v('--map-shadow', '#050a09'),
      selected: v('--map-selected-stroke', '#b9a779'),
      hover: v('--map-hover-stroke', '#e6edf3'),
      arrowPred: v('--map-arrow-pred', '#e6edf3'),
      divider: v('--color-charcoal-white', '#ffffff'),
      canvas: v('--map-canvas', '#0e1715'),
      grid: v('--map-grid', '#edebe0'),
      rampWorst: cssRgbTriplet('--map-ramp-worst', [74, 21, 30]),
      rampMid: cssRgbTriplet('--map-ramp-mid', [152, 133, 97]),
      rampBest: cssRgbTriplet('--map-ramp-best', [46, 107, 95]),
    };
  }

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

  // Governorate stroke as a closed flat ribbon: GL line width is capped at
  // 1px on every platform, so real strokes are extruded geometry (same trick
  // as the arrow ribbons). Vertex normals average adjacent edges; consumed
  // with DoubleSide so winding never matters.
  function ringStrokeGeometry(pts: [number, number][], width: number, z: number): THREE.BufferGeometry {
    const n = pts.length;
    const half = width / 2;
    const pos = new Float32Array(n * 6);
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[(i - 1 + n) % n];
      const [nx2, ny2] = pts[(i + 1) % n];
      let dx = nx2 - px;
      let dy = ny2 - py;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const ox = -dy * half;
      const oy = dx * half;
      pos.set([x - ox, y - oy, z], i * 6);
      pos.set([x + ox, y + oy, z], i * 6 + 3);
      const a = i * 2;
      const b = ((i + 1) % n) * 2;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    return geo;
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
  // Ramp colors derived from the live theme triplets (--map-ramp-*); re-set
  // whenever the theme changes so the health fill tracks the active theme
  // exactly like the 2D map. The triplet is CSS sRGB, so it must be declared
  // as such (setRGB with SRGBColorSpace) — the plain component constructor
  // treats numbers as linear working-space values and shifts the tones.
  // Seeded with the default-theme values so gov creation can run before the
  // first theme snapshot lands.
  const srgbRgb = (t: RgbTriplet): THREE.Color =>
    new THREE.Color().setRGB(t[0] / 255, t[1] / 255, t[2] / 255, THREE.SRGBColorSpace);
  let rampColors = {
    worst: srgbRgb([74, 21, 30]),
    mid: srgbRgb([152, 133, 97]),
    best: srgbRgb([46, 107, 95]),
  };
  function setRampColors(t: ThemeVars): void {
    rampColors = {
      worst: srgbRgb(t.rampWorst),
      mid: srgbRgb(t.rampMid),
      best: srgbRgb(t.rampBest),
    };
  }

  function healthColor(gov: GovernorateNode | undefined): THREE.Color {
    const ramp = rampColors;
    const health = 1 - Math.min(1, Math.max(0, (attentionIndex(gov) - 0.25) / 0.5));
    const c = new THREE.Color();
    if (health < 0.5) c.lerpColors(ramp.worst, ramp.mid, health * 2);
    else c.lerpColors(ramp.mid, ramp.best, (health - 0.5) * 2);
    return c;
  }

  // Arabic-shaping-safe label: canvas 2D shapes complex script correctly,
  // unlike SDF text stacks. Same heading face as the UI — font read from the
  // --font-heading var so the label stack always follows the game's font
  // system; text em maps to the 2D map's 24-unit font-size.
  const LABEL_FONT_PX = 56;
  const LABEL_CANVAS_H = 128;
  function headingFontStack(): string {
    if (typeof document === 'undefined') return "'Thmanyah Serif Display', serif";
    const cs = getComputedStyle(document.documentElement);
    return cs.getPropertyValue('--font-heading').trim() || "'Thmanyah Serif Display', serif";
  }
  function makeLabel(text: string): THREE.Sprite {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = LABEL_CANVAS_H;
    const ctx = c.getContext('2d')!;
    ctx.font = `700 ${LABEL_FONT_PX}px ${headingFontStack()}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9a8a5f';
    ctx.globalAlpha = 0.85;
    ctx.fillText(text, 256, 66);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    const emFrac = LABEL_FONT_PX / LABEL_CANVAS_H;
    const h = 24 / emFrac; // em box = 24 world units, matching 2D font-size
    sprite.scale.set(h * 4, h, 1);
    sprite.renderOrder = 10;
    return sprite;
  }
  const ensureHeadingFont = async (): Promise<void> => {
    if (typeof document === 'undefined' || !document.fonts) return;
    try {
      await document.fonts.load(`700 ${LABEL_FONT_PX}px "Thmanyah Serif Display"`);
      await document.fonts.ready;
    } catch {
      /* label falls back to the stack's next family */
    }
  };

  // Stat icon art: rasterize the same GameIcon glyphs (white fill, ink
  // outline in the themed --map-ink), then tint per state via material
  // color. One texture per glyph name, shared by all governorates; re-baked
  // when the theme changes the ink color.
  const iconTexCache = new Map<string, THREE.CanvasTexture>();
  async function iconTexture(name: string, ink: string): Promise<THREE.CanvasTexture> {
    const hit = iconTexCache.get(name);
    if (hit) return hit;
    const g = GLYPHS[name] ?? GLYPHS['flame'];
    const vbw = Number(g.vb.split(' ')[2] ?? 512);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.vb}">` +
      `<g stroke="${ink}" stroke-width="${vbw * 0.04}" paint-order="stroke" fill="#ffffff">` +
      `${g.body.replaceAll('currentColor', '#ffffff')}</g></svg>`;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error(`icon ${name}`));
      img.src = url;
    });
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    c.getContext('2d')!.drawImage(img, 0, 0, 96, 96);
    URL.revokeObjectURL(url);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    iconTexCache.set(name, tex);
    return tex;
  }

  interface GovStat {
    key: string;
    name: string;
    color: string;
    pct: number;
  }

  // Mirrors SyriaMap.svelte getGovStats (colors from the theme snapshot).
  function getGovStats(gov: GovernorateNode, t: ThemeVars): GovStat[] {
    const powerColor = gov.dailyBlackoutHours <= 12 ? t.ok : gov.dailyBlackoutHours <= 16 ? t.warn : t.danger;
    const rebuildName = gov.reconstructionScore >= 0.85 ? 'stone-wall' : gov.reconstructionScore >= 0.55 ? 'brick-wall' : 'broken-wall';
    const rebuildColor = gov.reconstructionScore >= 0.85 ? t.ok : gov.reconstructionScore >= 0.55 ? t.midGold : t.danger;
    const faceName = gov.tier === 'CALM' ? 'emotion-happy-fill' : gov.tier === 'TENSE' ? 'emotion-normal-fill' : 'emotion-sad-fill';
    const faceColor = gov.tier === 'CALM' ? t.ok : gov.tier === 'TENSE' ? t.warn : t.danger;
    return [
      { key: 'mines', name: 'minefield', color: t.danger, pct: Math.min(100, Math.max(0, gov.mineSaturationPct)) },
      { key: 'power', name: 'power-generator', color: powerColor, pct: Math.max(0, Math.min(100, ((24 - gov.dailyBlackoutHours) / 24) * 100)) },
      { key: 'rebuild', name: rebuildName, color: rebuildColor, pct: Math.max(0, Math.min(100, gov.reconstructionScore * 100)) },
      { key: 'mood', name: faceName, color: faceColor, pct: Math.max(0, Math.min(100, 100 - gov.prri)) },
    ];
  }

  // Tooltip + test-only weather override live outside the WebGL effect
  // (plain Svelte reactivity; the effect reads them through closures).
  let tooltip = $state<{ x: number; y: number; text: string } | null>(null);
  let weatherOverride: 'snow' | 'wind' | null = null;
  let hostKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  // Dev tuning panel for the CRT lens (dev builds only). The uniforms live
  // on the module-level CRTShader object, so the sliders drive the live
  // pass directly; the $state mirrors exist purely for the readout. Once
  // the values feel right, bake them into the CRTShader defaults.
  const CRT_DEFAULTS = { uBulge: 0.12, uRadius: 0.62 };
  let crtBulge = $state(CRT_DEFAULTS.uBulge);
  let crtRadius = $state(CRT_DEFAULTS.uRadius);
  // ShaderPass clones the uniforms object, so the live values must be read
  // from the pass instance itself — this ref is set when the pass is built.
  let crtUniforms: { uBulge: { value: number }; uRadius: { value: number } } | null = null;
  function setCrtUniform(name: 'uBulge' | 'uRadius', v: number): void {
    if (crtUniforms) crtUniforms[name].value = v;
    if (name === 'uBulge') crtBulge = v;
    else crtRadius = v;
  }
  function resetCrt(): void {
    setCrtUniform('uBulge', CRT_DEFAULTS.uBulge);
    setCrtUniform('uRadius', CRT_DEFAULTS.uRadius);
  }

  // Center-lens CRT: a fisheye magnifier in the middle that relaxes to a
  // 1:1 mapping toward the edges. Implemented as a SHRINK of the sampling
  // radius (s <= 1 everywhere), so no sample can ever fall outside the
  // frame — the image stretches edge to edge with no dark border ring, no
  // vignette and no masking (unlike the earlier barrel-out mapping).
  // Knobs: uBulge = center magnification (0.12 ≈ 12%), uRadius = where the
  // lens has fully relaxed, in half-diagonal units.
  const CRTShader = {
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      uBulge: { value: CRT_DEFAULTS.uBulge },
      uRadius: { value: CRT_DEFAULTS.uRadius },
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
      uniform float uBulge;
      uniform float uRadius;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p);
        float s = 1.0 - uBulge * (1.0 - smoothstep(0.0, uRadius, r));
        vec2 uv = p * s + 0.5;
        gl_FragColor = vec4(texture2D(tDiffuse, uv).rgb, 1.0);
      }
    `,
  };

  $effect(() => {
    const el = host;
    if (!el) return;
    let alive = true;
    // Live theme snapshot; re-applied on every theme change below.
    let themeVars = readThemeVars();
    setRampColors(themeVars);
    let themeUnsub: (() => void) | null = null;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(new THREE.Color(themeVars.canvas), 1);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const scene = new THREE.Scene();
    // Ortho camera mirroring the 2D viewBox (y negated frame). Parked at
    // z=10 looking down -z: content lives at z -1..6, and raycaster rays
    // start at the camera — at z=0 they began INSIDE the content stack and
    // missed everything above it (icons, arrows, labels all unhittable).
    const camera = new THREE.OrthographicCamera(0, WORLD_W, 0, -WORLD_H, -10, 10);
    camera.position.z = 10;
    // Live viewport bounds in SVG coords (y down), refreshed by fitCamera:
    // weather uses these so flakes/streaks spawn and recycle OUTSIDE the
    // visible frame instead of popping in and out inside it.
    const viewSvg = { left: -500, right: 1500, top: -100, bottom: 980 };

    // The floating command hub overlays the canvas bottom, so the map keeps
    // a safe margin above it — the 2D map's pb-[112px] container padding,
    // reproduced in the projection: fit the world box into (w × h−reserve)
    // and center it in that upper region.
    const BOTTOM_SAFE_PX = 112;
    const fitCamera = (w: number, h: number): void => {
      const effH = Math.max(1, h - BOTTOM_SAFE_PX);
      const scale = Math.min(w / WORLD_W, effH / WORLD_H);
      const halfW = w / (2 * scale);
      const halfH = h / (2 * scale);
      camera.left = WORLD_W / 2 - halfW;
      camera.right = WORLD_W / 2 + halfW;
      camera.top = -WORLD_H / 2 + halfH * (effH / h);
      camera.bottom = camera.top - 2 * halfH;
      camera.updateProjectionMatrix();
      // World units per screen px — snow sizes are authored in px.
      worldPerPx = 1 / scale;
      viewSvg.left = camera.left;
      viewSvg.right = camera.right;
      viewSvg.top = -camera.top;
      viewSvg.bottom = -camera.bottom;
    };

    // ── Stack discipline (hard-won): after the camera moved to z=10 (needed
    // for raycasting), flat geometry below z≈0 does not rasterize with this
    // ortho setup — a z-ladder test clipped -0.1 but drew 0.2+. So every
    // flat layer lives at z=0.5 (the governorates stay at their proven 0)
    // and ALL layering is explicit renderOrder + depth-write control:
    //   grid -105 · sea -100 · countries -90 · snow -80 · shadow -70 ·
    //   wind -60 · governorates 0 · flood 3 · divider 4 · arrows 5 ·
    //   stats/UI 7-10.
    // The grid + sea composite exactly like the 2D map: dotted grid (24px
    // pitch, 0.04 opacity, --map-grid) under the 0.6 sea over the themed
    // --map-canvas clear color.
    const GRID_PITCH = 24;
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = GRID_PITCH;
    gridCanvas.height = GRID_PITCH;
    const gridTex = new THREE.CanvasTexture(gridCanvas);
    gridTex.wrapS = THREE.RepeatWrapping;
    gridTex.wrapT = THREE.RepeatWrapping;
    gridTex.colorSpace = THREE.SRGBColorSpace;
    const redrawGrid = (): void => {
      const gctx = gridCanvas.getContext('2d')!;
      gctx.clearRect(0, 0, GRID_PITCH, GRID_PITCH);
      gctx.fillStyle = themeVars.grid;
      gctx.beginPath();
      gctx.arc(GRID_PITCH / 2, GRID_PITCH / 2, 1, 0, Math.PI * 2);
      gctx.fill();
      gridTex.needsUpdate = true;
    };
    const gridPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(12000, 12000),
      new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.04, depthWrite: false }),
    );
    gridTex.repeat.set(12000 / GRID_PITCH, 12000 / GRID_PITCH);
    gridPlane.position.set(500, -440, 0.5);
    gridPlane.renderOrder = -105;
    scene.add(gridPlane);
    redrawGrid();

    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(12000, 12000),
      new THREE.MeshBasicMaterial({ color: 0x0d323c, transparent: true, opacity: 0.6, depthWrite: false }),
    );
    sea.position.set(500, -440, 0.5);
    sea.renderOrder = -100;
    scene.add(sea);

    // Neighbor lands (flat, decorative for now — data-region ids kept).
    // Country borders get the same ribbon treatment as governorates (1.8,
    // #4a3d24 like the 2D region layer) so they stay clearly visible.
    const regionBorderMat = new THREE.MeshBasicMaterial({
      color: 0x4a3d24, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    for (const n of [...REGION_FAR, ...REGION_NEAR]) {
      const rings = parsePaths(n.path);
      const g = shapeMesh(rings, 0x221b11, 0.92, 0.5);
      g.userData.regionId = n.id;
      const lineLoops: THREE.Object3D[] = [];
      g.traverse((o) => {
        o.renderOrder = -90;
        const mesh = o as THREE.Mesh;
        const mat = mesh.material as THREE.Material | undefined;
        if (mat) {
          mat.transparent = true;
          mat.depthWrite = false;
        }
        if ((o as THREE.LineLoop).isLineLoop) lineLoops.push(o);
      });
      for (const loop of lineLoops) g.remove(loop);
      for (const pts of rings) {
        const border = new THREE.Mesh(ringStrokeGeometry(pts, 1.8, 0), regionBorderMat);
        border.renderOrder = -90;
        g.add(border);
      }
      scene.add(g);
    }

    // Governorates (interactive). Fills dim while a stat flood is active,
    // exactly like the 2D map (fill-opacity 0.35 vs 0.78). Each governorate
    // also gets an "accent" border loop (scaled ~1.2% about its center) that
    // mimics the 2D hover stroke-width bump (2.8 vs 1.6) that GL line width
    // cannot express.
    const govMeshes = new Map<string, THREE.Mesh[]>();
    const govStrokes = new Map<string, THREE.Mesh[]>();
    const govAccents = new Map<string, THREE.Mesh[]>();
    const govGroups = new Map<string, THREE.Group>();
    const govBaseZ = new Map<string, number>();
    const govRings = new Map<string, [number, number][][]>();
    const govBBox = new Map<string, [number, number, number, number]>();
    const shadowGroup = new THREE.Group();
    const strokeMat = new THREE.MeshBasicMaterial({
      color: themeVars.ink, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    const accentHoverMat = new THREE.MeshBasicMaterial({
      color: themeVars.hover, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    const accentSelMat = new THREE.MeshBasicMaterial({
      color: themeVars.selected, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    for (const [gi, gov] of SYRIA_2D_GOVERNORATES.entries()) {
      const state = get(gameStore).governorates[gov.id];
      const rings = parsePaths(gov.path);
      govRings.set(gov.id, rings);
      let minx = Infinity;
      let miny = Infinity;
      let maxx = -Infinity;
      let maxy = -Infinity;
      for (const pts of rings) {
        for (const [x, y] of pts) {
          if (x < minx) minx = x;
          if (y < miny) miny = y;
          if (x > maxx) maxx = x;
          if (y > maxy) maxy = y;
        }
      }
      govBBox.set(gov.id, [minx, miny, maxx, maxy]);
      // Solid fills, painter-ordered: each governorate sits a hair above the
      // previous one so shared borders draw exactly once (the later index
      // covers the earlier) with zero coplanar z-fighting — the 2D map's
      // DOM-order painting, done with depth. Hover/select lift further in
      // the frame loop (0.02 / 0.03) to pull the whole shape to the front.
      const baseZ = 0.001 * (gi + 1);
      govBaseZ.set(gov.id, baseZ);
      const group = shapeMesh(rings, 0xffffff, 1, baseZ);
      const meshes: THREE.Mesh[] = [];
      const strokes: THREE.Mesh[] = [];
      const accents: THREE.Mesh[] = [];
      const lineLoops: THREE.Object3D[] = [];
      for (const child of group.children) {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.transparent = true;
          mat.color.copy(healthColor(state));
          child.userData.govId = gov.id;
          meshes.push(child);
          // Two offset silhouette layers approximate the 2D map's hard
          // offset plus its soft CSS drop-shadow (0 12px 36px).
          for (const [dx2, dy2, op] of [[2, -6, 0.3], [5, -13, 0.12]] as const) {
            const dark = child.clone();
            dark.material = new THREE.MeshBasicMaterial({
              color: new THREE.Color(themeVars.shadow),
              transparent: true,
              opacity: op,
              depthWrite: false,
            });
            dark.position.set(dx2, dy2, 0.5);
            dark.renderOrder = -70;
            dark.userData.govId = '';
            shadowGroup.add(dark);
          }
        } else if (child instanceof THREE.LineLoop) {
          lineLoops.push(child);
        }
      }
      // Swap shapeMesh's 1px LineLoops for extruded ribbon strokes. Widths
      // mirror the 2D map's 1.6 / 2.8 viewBox strokes converted to world
      // units at a ~1600px viewport (worldPerPx ~1.2): 3.0 base, 5.0 accent
      // — GL lines cannot exceed 1px, ribbons can.
      for (const loop of lineLoops) group.remove(loop);
      for (const pts of rings) {
        const base = new THREE.Mesh(ringStrokeGeometry(pts, 3.0, 0), strokeMat);
        base.renderOrder = 1;
        strokes.push(base);
        group.add(base);
        const accent = new THREE.Mesh(ringStrokeGeometry(pts, 5.0, 0), accentHoverMat);
        accent.visible = false;
        accent.renderOrder = 2;
        accents.push(accent);
        group.add(accent);
      }
      govMeshes.set(gov.id, meshes);
      govStrokes.set(gov.id, strokes);
      govAccents.set(gov.id, accents);
      govGroups.set(gov.id, group);
      scene.add(group);
    }
    scene.add(shadowGroup);

    // Place-name sprites — created after the heading font has actually
    // loaded, so canvas rasterization never bakes a fallback face.
    const labelData = [
      ...REGION_NEAR.map((n) => ({ name: n.nameAr, at: n.labelAt })),
      ...REGION_FAR_LABELS.map((n) => ({ name: n.nameAr, at: n.labelAt })),
    ];
    void ensureHeadingFont().then(() => {
      if (!alive) return;
      for (const l of labelData) {
        const sprite = makeLabel(l.name);
        sprite.position.set(l.at[0], -l.at[1], 5);
        scene.add(sprite);
      }
    });

    // --- Status clusters: 4 stat icons per governorate + hover flood. ---
    // Icon layout mirrors the 2D map (dx/dy offsets, 24px, 28px active).
    const govCenter = new Map(SYRIA_2D_GOVERNORATES.map((g) => [g.id, g.center] as const));
    interface IconRec {
      sprite: THREE.Sprite;
      statKey: string;
      dx: number;
      dy: number;
      wx: number;
      wy: number;
    }
    const govIcons = new Map<string, IconRec[]>();
    const iconTexs = new Map<string, THREE.CanvasTexture>();
    const ICON_NAMES = [
      'minefield', 'power-generator', 'stone-wall', 'brick-wall', 'broken-wall',
      'emotion-happy-fill', 'emotion-normal-fill', 'emotion-sad-fill',
    ];
    // Re-runnable: theme changes drop the ink-baked cache and re-bake. The
    // frame loop swaps materials' maps whenever the texture set changes.
    const bakeIcons = async (): Promise<void> => {
      const entries = await Promise.all(
        ICON_NAMES.map(async (name) => [name, await iconTexture(name, themeVars.ink)] as const),
      );
      iconTexs.clear();
      for (const [name, tex] of entries) iconTexs.set(name, tex);
    };
    void bakeIcons().then(() => {
      if (!alive) return;
      for (const gov of SYRIA_2D_GOVERNORATES) {
        const [cx, cy] = gov.center;
        const recs: IconRec[] = [];
        for (let i = 0; i < 4; i++) {
          const dx = i % 2 === 0 ? -26 : 2;
          const dy = i < 2 ? -26 : 2;
          const mat = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
          const sprite = new THREE.Sprite(mat);
          sprite.position.set(cx + dx + 12, -(cy + dy + 12), 1);
          sprite.scale.set(24, 24, 1);
          sprite.renderOrder = 8;
          sprite.userData.govId = gov.id;
          sprite.userData.statIndex = i;
          recs.push({ sprite, statKey: '', dx, dy, wx: cx + dx + 12, wy: -(cy + dy + 12) });
          scene.add(sprite);
        }
        govIcons.set(gov.id, recs);
      }
    });
    const STAT_KEYS = ['mines', 'power', 'rebuild', 'mood'];

    // Active-icon halo: dark disc + colored ring, one pair reused.
    const haloDisc = new THREE.Mesh(
      new THREE.CircleGeometry(17, 40),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.75, depthTest: false }),
    );
    const haloRing = new THREE.Mesh(
      new THREE.RingGeometry(16, 18, 40),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide }),
    );
    haloDisc.renderOrder = 7;
    haloRing.renderOrder = 7;
    haloDisc.visible = false;
    haloRing.visible = false;
    scene.add(haloDisc, haloRing);

    // % pill: single reusable sprite, redrawn when its content key changes.
    const pillCanvas = document.createElement('canvas');
    pillCanvas.width = 208;
    pillCanvas.height = 80;
    const pillTex = new THREE.CanvasTexture(pillCanvas);
    pillTex.colorSpace = THREE.SRGBColorSpace;
    const pill = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: pillTex, transparent: true, depthTest: false }),
    );
    pill.scale.set(52, 20, 1);
    pill.renderOrder = 9;
    pill.visible = false;
    scene.add(pill);
    let pillKey = '';
    function drawPill(pct: number, color: string): void {
      const ctx = pillCanvas.getContext('2d')!;
      ctx.clearRect(0, 0, 208, 80);
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = themeVars.ink;
      ctx.beginPath();
      ctx.roundRect(2, 2, 204, 76, 16);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(4, 4, 200, 72, 14);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '700 44px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(pct)}%`, 104, 44);
      pillTex.needsUpdate = true;
    }

    // Flood fill: one reusable plane + per-governorate shape-mask textures.
    // The plane always spans the full bbox; the level comes from sampling
    // the bottom fraction of the mask (repeat.y), like the 2D clip rect.
    const floodMasks = new Map<string, THREE.CanvasTexture>();
    for (const gov of SYRIA_2D_GOVERNORATES) {
      const [minx, miny, maxx, maxy] = govBBox.get(gov.id)!;
      const bw = Math.max(1, maxx - minx);
      const bh = Math.max(1, maxy - miny);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(bw));
      c.height = Math.max(1, Math.round(bh));
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (const pts of govRings.get(gov.id)!) {
        // Rings are stored world-frame (y negated); the mask canvas uses
        // the svg frame (y down), so un-negate against the bbox top.
        pts.forEach(([x, y], i) => {
          const px = x - minx;
          const py = maxy - y;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
      }
      ctx.fill('evenodd');
      const tex = new THREE.CanvasTexture(c);
      floodMasks.set(gov.id, tex);
    }
    const floodMat = new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0.85, depthWrite: false,
    });
    // NOTE: the fill level is driven by baking a v-range into the plane's
    // UV attribute (uv.y *= frac) instead of texture.repeat — repeat on an
    // alphaMap proved unreliable, while vertex UVs are always respected.
    // Plane UV layout: verts 0,1 = top row (v=1), verts 2,3 = bottom (v=0),
    // and v=0 samples the canvas bottom = the southern (bottom) fraction.
    const floodGeo = new THREE.PlaneGeometry(1, 1);
    const floodPlane = new THREE.Mesh(floodGeo, floodMat);
    floodPlane.renderOrder = 3;
    floodPlane.visible = false;
    scene.add(floodPlane);
    // Divider: clipped to the governorate shape like the 2D map (the same
    // mask drives its alpha along the fill-level row; a full-width line
    // would run out across the sea).
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
    const dividerGeo = new THREE.PlaneGeometry(1, 3);
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.renderOrder = 4;
    divider.visible = false;
    scene.add(divider);
    const dividerUv = dividerGeo.attributes.uv as THREE.BufferAttribute;

    // --- Internal migration arrows (gov-to-gov). Ported routing from
    // SyriaMap.svelte: tries offset/bow side combos, keeps the path farthest
    // from foreign centers. Runs in world coords (y negated vs svg).
    const MIGRATION_MIN_PEOPLE = 1000;
    const MIGRATION_LATERAL = 34;
    const MIGRATION_CLEAR_RADIUS = 70;
    const govCenterWorld = new Map(
      [...govCenter.entries()].map(([id, [x, y]]) => [id, [x, -y] as [number, number]]),
    );
    function quadSample(
      sx: number, sy: number, cx: number, cy: number,
      ex: number, ey: number, t: number,
    ): [number, number] {
      const u = 1 - t;
      return [u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey];
    }
    function migrationArrowPath(
      fromId: string, toId: string,
      from: readonly [number, number], to: readonly [number, number],
    ): { sx: number; sy: number; cx: number; cy: number; ex: number; ey: number; score: number } {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;
      const nx = -uy;
      const ny = ux;
      let nearestForeign = Infinity;
      for (const [id, c] of govCenterWorld) {
        if (id === fromId || id === toId) continue;
        const d = Math.hypot(c[0] - from[0], c[1] - from[1]);
        if (d < nearestForeign) nearestForeign = d;
      }
      const off = Number.isFinite(nearestForeign)
        ? Math.min(MIGRATION_LATERAL, Math.max(14, nearestForeign * 0.4))
        : MIGRATION_LATERAL;
      const trimS = Math.min(12, dist * 0.2);
      const trimE = Math.min(24, dist * 0.3);
      const bow = Math.min(70, Math.max(18, dist * 0.25));
      const foreigners = [...govCenterWorld.entries()].filter(([id]) => id !== fromId && id !== toId);
      const build = (offSide: number, bowSide: number) => {
        const sx = from[0] + ux * trimS + nx * off * offSide;
        const sy = from[1] + uy * trimS + ny * off * offSide;
        const ex = to[0] - ux * trimE + nx * off * offSide;
        const ey = to[1] - uy * trimE + ny * off * offSide;
        const cx = (sx + ex) / 2 + nx * bow * bowSide;
        const cy = (sy + ey) / 2 + ny * bow * bowSide;
        let score = 0;
        const STEPS = 8;
        for (let i = 0; i <= STEPS; i++) {
          const t = i / STEPS;
          const [px, py] = quadSample(sx, sy, cx, cy, ex, ey, t);
          const w = i === 0 || i === STEPS ? 2.5 : 1;
          for (const [, c] of foreigners) {
            const dd = Math.hypot(px - c[0], py - c[1]);
            if (dd < MIGRATION_CLEAR_RADIUS) score += w * (MIGRATION_CLEAR_RADIUS - dd);
          }
        }
        return { sx, sy, cx, cy, ex, ey, score };
      };
      const candidates = [build(1, 1), build(-1, -1), build(1, -1), build(-1, 1)];
      let best = candidates[0];
      for (const c of candidates) if (c.score < best.score) best = c;
      return best;
    }
    interface MigArrow {
      pts: [number, number][];
      width: number;
      history: number;
      predicted: number;
      fromId: string;
      toId: string;
    }
    function computeArrows(): MigArrow[] {
      const ledger: Record<string, number> = get(gameStore).migrationLedger ?? {};
      const predicted: MigrationFlow[] = get(projectedTurnStore).migrationFlows ?? [];
      const acc = new Map<string, { fromId: string; toId: string; history: number; predicted: number }>();
      for (const [key, count] of Object.entries(ledger)) {
        const sep = key.indexOf('>');
        if (sep <= 0) continue;
        const fromId = key.slice(0, sep);
        const toId = key.slice(sep + 1);
        if (fromId === toId || !govCenterWorld.has(fromId) || !govCenterWorld.has(toId)) continue;
        acc.set(key, { fromId, toId, history: count, predicted: 0 });
      }
      for (const f of predicted) {
        if (f.fromId === f.toId || !govCenterWorld.has(f.fromId) || !govCenterWorld.has(f.toId)) continue;
        const key = `${f.fromId}>${f.toId}`;
        const cur = acc.get(key) ?? { fromId: f.fromId, toId: f.toId, history: 0, predicted: 0 };
        cur.predicted += f.count;
        acc.set(key, cur);
      }
      const arrows: MigArrow[] = [];
      for (const a of acc.values()) {
        const total = a.history + a.predicted;
        if (total < MIGRATION_MIN_PEOPLE) continue;
        const from = govCenterWorld.get(a.fromId)!;
        const to = govCenterWorld.get(a.toId)!;
        const c = migrationArrowPath(a.fromId, a.toId, from, to);
        const pts: [number, number][] = [];
        const N = 18;
        for (let i = 0; i <= N; i++) pts.push(quadSample(c.sx, c.sy, c.cx, c.cy, c.ex, c.ey, i / N));
        arrows.push({
          pts,
          width: Math.min(3.5, Math.max(1, Math.sqrt(total) / 34)),
          history: a.history,
          predicted: a.predicted,
          fromId: a.fromId,
          toId: a.toId,
        });
      }
      arrows.sort((x, y) => y.history + y.predicted - (x.history + x.predicted));
      return arrows.slice(0, 24);
    }
    const arrowGroup = new THREE.Group();
    arrowGroup.renderOrder = 5;
    scene.add(arrowGroup);
    const dashCanvas = document.createElement('canvas');
    dashCanvas.width = 64;
    dashCanvas.height = 8;
    {
      const ctx = dashCanvas.getContext('2d')!;
      ctx.clearRect(0, 0, 64, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 32, 8);
    }
    const dashTex = new THREE.CanvasTexture(dashCanvas);
    dashTex.wrapS = THREE.RepeatWrapping;
    const arrowHistMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(themeVars.midGold), transparent: true, opacity: 0.32, depthWrite: false,
    });
    const arrowPredMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(themeVars.arrowPred), transparent: true, opacity: 0.6, depthWrite: false, alphaMap: dashTex,
    });
    // Invisible fat hit-ribbons (arrows are 1–3.5u thin; 14u is hoverable).
    // colorWrite off + no depth write: zero visual, still raycastable.
    const arrowHitMat = new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false, colorWrite: false, depthTest: false,
    });
    const arrowHitMeshes: THREE.Mesh[] = [];
    const arrowHitMeta: { fromId: string; toId: string; history: number; predicted: number }[] = [];
    const headGeo = new THREE.ConeGeometry(7, 16, 6);
    const headHistMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(themeVars.midGold), transparent: true, opacity: 0.8, depthWrite: false });
    const headPredMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(themeVars.arrowPred), transparent: true, opacity: 0.85, depthWrite: false });
    const UP = new THREE.Vector3(0, 1, 0);
    function ribbonGeometry(pts: [number, number][], width: number): THREE.BufferGeometry {
      const n = pts.length;
      const pos = new Float32Array(n * 2 * 3);
      const uv = new Float32Array(n * 2 * 2);
      const idx: number[] = [];
      let dist = 0;
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const pPrev = pts[Math.max(0, i - 1)];
        const pNext = pts[Math.min(n - 1, i + 1)];
        let dx = pNext[0] - pPrev[0];
        let dy = pNext[1] - pPrev[1];
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        if (i > 0) dist += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
        const hw = width / 2;
        pos.set([p[0] - dy * hw, p[1] + dx * hw, 0.4], i * 6);
        pos.set([p[0] + dy * hw, p[1] - dx * hw, 0.4], i * 6 + 3);
        uv.set([dist / 10, 0], i * 4);
        uv.set([dist / 10, 1], i * 4 + 2);
        if (i < n - 1) {
          const a = i * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setIndex(idx);
      return geo;
    }
    let arrowSig = '';
    let lastTurnSeen = 0;
    function syncArrows(): void {
      const turn = get(gameStore).turnNumber;
      if (lastTurnSeen > 0 && turn < lastTurnSeen) uiStore.setMigrationArrows(true);
      lastTurnSeen = turn;
      const show = get(uiStore).showMigrationArrows;
      arrowGroup.visible = show;
      if (!show) return;
      const ledger = get(gameStore).migrationLedger ?? {};
      const predicted: MigrationFlow[] = get(projectedTurnStore).migrationFlows ?? [];
      // Value-complete signature: every ledger entry + every predicted flow
      // (a key-count-only signature missed same-shape different-value edits).
      const sig =
        `${turn}|` +
        Object.entries(ledger).map(([k, v]) => `${k}:${v}`).join(',') + '|' +
        predicted.map((f) => `${f.fromId}>${f.toId}:${f.count}`).join(',');
      if (sig === arrowSig) return;
      arrowSig = sig;
      while (arrowGroup.children.length > 0) {
        const child = arrowGroup.children.pop()!;
        // Head geometry is shared — everything else owns its geometry.
        if (child instanceof THREE.Mesh && child.geometry !== headGeo) child.geometry.dispose();
      }
      arrowHitMeshes.length = 0;
      arrowHitMeta.length = 0;
      for (const a of computeArrows()) {
        const end = a.pts[a.pts.length - 1];
        const prev = a.pts[a.pts.length - 2];
        const tangent = new THREE.Vector3(end[0] - prev[0], end[1] - prev[1], 0).normalize();
        const hit = new THREE.Mesh(ribbonGeometry(a.pts, 14), arrowHitMat);
        hit.renderOrder = 5;
        arrowGroup.add(hit);
        arrowHitMeshes.push(hit);
        arrowHitMeta.push({ fromId: a.fromId, toId: a.toId, history: a.history, predicted: a.predicted });
        const headScale = 0.6 + a.width * 0.15;
        if (a.history > 0) {
          arrowGroup.add(new THREE.Mesh(ribbonGeometry(a.pts, a.width), arrowHistMat));
          const head = new THREE.Mesh(headGeo, headHistMat);
          head.quaternion.setFromUnitVectors(UP, tangent);
          head.scale.setScalar(headScale);
          head.position.set(end[0] - tangent.x * 8, end[1] - tangent.y * 8, 0.4);
          arrowGroup.add(head);
        }
        if (a.predicted > 0) {
          arrowGroup.add(new THREE.Mesh(ribbonGeometry(a.pts, a.width), arrowPredMat));
          const head = new THREE.Mesh(headGeo, headPredMat);
          head.quaternion.setFromUnitVectors(UP, tangent);
          head.scale.setScalar(headScale);
          head.position.set(end[0] - tangent.x * 8, end[1] - tangent.y * 8, 0.4);
          arrowGroup.add(head);
        }
      }
    }

    // --- Ambient seasonal weather (snow / wind), ported math from the 2D
    // canvas engine. Simulated in svg coords, rendered in world coords,
    // layered between countries (z=-1) and governorates (z=0) like the 2D map.
    interface Flake {
      x: number; y: number; r: number; speed: number;
      swayAmp: number; swayFreq: number; phase: number; alpha: number;
      rot: number; rotSpeed: number;
    }
    interface Streak {
      x: number; y: number; len: number; speed: number; alpha: number;
      width: number; phase: number; bobAmp: number; bobFreq: number;
    }
    type WeatherMode = 'snow' | 'wind';
    const seasonToMode = (s: string): WeatherMode => (s === 'H2_WINTER' ? 'snow' : 'wind');
    let flakes: Flake[] = [];
    let streaks: Streak[] = [];
    let gustT = 0;
    // Spawn/recycle margin: everything enters and leaves this far OUTSIDE
    // the live viewport (viewSvg), never mid-screen.
    const WMARGIN = 60;
    const viewW = (): number => viewSvg.right - viewSvg.left;
    const viewH = (): number => viewSvg.bottom - viewSvg.top;
    function seedWeather(mode: WeatherMode): void {
      if (mode === 'snow') {
        flakes = Array.from({ length: 130 }, () => ({
          x: viewSvg.left - 40 + Math.random() * (viewW() + 80),
          y: viewSvg.top - WMARGIN + Math.random() * (viewH() + WMARGIN * 2),
          r: 1 + Math.random() * 2.2,
          speed: 12 + Math.random() * 26,
          swayAmp: 8 + Math.random() * 18,
          swayFreq: 0.3 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.25 + Math.random() * 0.45,
          rot: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.8,
        }));
        streaks = [];
      } else {
        streaks = Array.from({ length: 22 }, () => ({
          x: viewSvg.left - 40 + Math.random() * (viewW() + 80),
          y: viewSvg.top - 40 + Math.random() * (viewH() + 80),
          len: 80 + Math.random() * 130,
          speed: 22 + Math.random() * 30,
          alpha: 0.1 + Math.random() * 0.12,
          width: Math.random() < 0.65 ? 1 : 2,
          phase: Math.random() * Math.PI * 2,
          bobAmp: 4 + Math.random() * 10,
          bobFreq: 0.4 + Math.random() * 0.8,
        }));
        flakes = [];
      }
      seedWindColors();
    }
    // Snow: ONE plain Mesh holding all flake quads (positions rewritten per
    // frame, texture from canvas). Hard-won context: THREE.Points, its
    // LineSegments cross variant, InstancedMesh, and Sprite pools were all
    // tried — sprites z-clip below z≈0 with this ortho camera and the others
    // never rasterized. Plain meshes are verified at every depth (sea -2,
    // flood 0.2, governorates 0), so the flakes are quads in one Mesh at the
    // wind lines' z — between the country layer and the governorates, the
    // exact slot the 2D map paints weather into. Flake size is authored in
    // px and converted through worldPerPx so it reads the same on any
    // viewport; per-flake alpha rides in vertex colors (2D's 0.25–0.7).
    const SNOW_MAX = 130;
    const flakeTex = (() => {
      // Asterisk flake mirroring the 2D drawFlake: three diameters at 60°,
      // double-stroked for a soft edge.
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      const R = 26;
      for (const [lw, a] of [[4, 0.45], [2, 1]] as const) {
        ctx.globalAlpha = a;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const ang = (i * Math.PI) / 3;
          ctx.moveTo(32 - R * Math.cos(ang), 32 - R * Math.sin(ang));
          ctx.lineTo(32 + R * Math.cos(ang), 32 + R * Math.sin(ang));
        }
        ctx.stroke();
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(SNOW_MAX * 4 * 3);
    const snowCol = new Float32Array(SNOW_MAX * 4 * 3);
    const snowUv = new Float32Array(SNOW_MAX * 4 * 2);
    const snowIdx: number[] = [];
    for (let i = 0; i < SNOW_MAX; i++) {
      const v = i * 4;
      snowUv.set([0, 1, 1, 1, 0, 0, 1, 0], i * 8);
      // TL, BL, TR then TR, BL, BR — CCW, front-facing toward the camera.
      snowIdx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    snowGeo.setAttribute('color', new THREE.BufferAttribute(snowCol, 3));
    snowGeo.setAttribute('uv', new THREE.BufferAttribute(snowUv, 2));
    snowGeo.setIndex(snowIdx);
    // Layering is by DRAW ORDER, not depth: quads at z<≈0.5 clip away under
    // this ortho setup (verified with a z-ladder), and depth-testing is the
    // wrong tool anyway. renderOrder -80 + depthTest off paints the flakes
    // right after the country layer; every later pass (shadow, wind,
    // governorates, arrows, icons, labels, flood) draws over them — the
    // exact 2D stacking.
    const snowMat = new THREE.MeshBasicMaterial({
      map: flakeTex, transparent: true, opacity: 0.7, vertexColors: true,
      depthWrite: false, depthTest: false,
    });
    const snow = new THREE.Mesh(snowGeo, snowMat);
    snow.position.z = 0.5;
    snow.renderOrder = -80;
    snow.frustumCulled = false;
    snow.visible = false;
    scene.add(snow);
    let worldPerPx = 1;
    // Wind: soft smudge ribbons — ONE mesh, 6 quads per streak, rewritten
    // per frame. GL 1px lines read as wires; dragging a texture that fades
    // at both ends AND both edges across a bent ribbon reads as a blurred
    // gust, with the same cost as the old lines (single draw call, one
    // preallocated buffer — no per-frame allocation).
    const WIND_SEGS = 6;
    const WIND_MAX = 22;
    const WIND_VERTS = (WIND_SEGS + 1) * 2; // 14 per streak
    const windGeo = new THREE.BufferGeometry();
    const windPos = new Float32Array(WIND_MAX * WIND_VERTS * 3);
    const windCol = new Float32Array(WIND_MAX * WIND_VERTS * 3);
    const windUv = new Float32Array(WIND_MAX * WIND_VERTS * 2);
    const windIdx: number[] = [];
    for (let s = 0; s < WIND_MAX; s++) {
      const base = s * WIND_VERTS;
      for (let i = 0; i <= WIND_SEGS; i++) {
        const u = i / WIND_SEGS;
        const v0 = base + i * 2;
        windUv.set([u, 0, u, 1], v0 * 2);
        if (i < WIND_SEGS) {
          windIdx.push(v0, v0 + 1, v0 + 2, v0 + 1, v0 + 3, v0 + 2);
        }
      }
    }
    windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
    windGeo.setAttribute('color', new THREE.BufferAttribute(windCol, 3));
    windGeo.setAttribute('uv', new THREE.BufferAttribute(windUv, 2));
    windGeo.setIndex(windIdx);
    const windTex = (() => {
      // Lengthwise fade (2D stroke gradient 0 -> alpha -> 0) times a soft
      // crosswise falloff — destination-in keeps the ends and edges blurred.
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 32;
      const ctx = c.getContext('2d')!;
      const across = ctx.createLinearGradient(0, 0, 128, 0);
      across.addColorStop(0, 'rgba(255,255,255,0)');
      across.addColorStop(0.3, 'rgba(255,255,255,1)');
      across.addColorStop(0.7, 'rgba(255,255,255,1)');
      across.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = across;
      ctx.fillRect(0, 0, 128, 32);
      ctx.globalCompositeOperation = 'destination-in';
      const along = ctx.createLinearGradient(0, 0, 0, 32);
      along.addColorStop(0, 'rgba(255,255,255,0)');
      along.addColorStop(0.5, 'rgba(255,255,255,1)');
      along.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = along;
      ctx.fillRect(0, 0, 128, 32);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const wind = new THREE.Mesh(
      windGeo,
      // Vertex colors carry the per-streak alpha (0.10-0.22); the material
      // opacity is the normalization base. The texture carries the shape.
      new THREE.MeshBasicMaterial({
        map: windTex, vertexColors: true, transparent: true, opacity: 0.22,
        depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    wind.position.set(0, 0, 0.5);
    wind.renderOrder = -60;
    wind.frustumCulled = false;
    wind.visible = false;
    scene.add(wind);
    // Streak colors are seed-static: write once per seed (normalized alpha).
    function seedWindColors(): void {
      for (let si = 0; si < streaks.length; si++) {
        const a = Math.min(1, streaks[si].alpha / 0.22);
        const base = si * WIND_VERTS;
        for (let v = 0; v < WIND_VERTS; v++) {
          const o = (base + v) * 3;
          windCol[o] = a;
          windCol[o + 1] = a;
          windCol[o + 2] = a;
        }
      }
      windGeo.attributes.color.needsUpdate = true;
      windGeo.setDrawRange(0, streaks.length * WIND_SEGS * 6);
    }
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let weatherMode: WeatherMode = seasonToMode(get(gameStore).season);
    seedWeather(weatherMode);
    // Scratch for the 7 sample points of one streak (x,y pairs); reused so
    // the per-frame update allocates nothing.
    const windScratch = new Float32Array((WIND_SEGS + 1) * 2);
    function streakPointAt(s: Streak, t: number, time: number, out: Float32Array, o: number): void {
      // Gentle S-curve with an eastward-traveling ripple (matches 2D feel).
      out[o] = s.x + s.len * t;
      out[o + 1] = s.y
        + Math.sin(t * Math.PI) * 8 * 0.3
        + Math.sin(t * 6 - time * 2 + s.phase) * 3
        + Math.sin(time * s.bobFreq + s.phase) * s.bobAmp * 0.2;
    }
    function updateWeather(dt: number): void {
      const mode = weatherOverride ?? seasonToMode(get(gameStore).season);
      if (mode !== weatherMode) {
        weatherMode = mode;
        seedWeather(mode);
      }
      if (reducedMotion) {
        // 2D parity: the weather canvas is hidden entirely under reduced
        // motion, so the 3D layers hide too.
        snow.visible = false;
        wind.visible = false;
        return;
      }
      if (weatherMode === 'snow') {
        snow.visible = true;
        wind.visible = false;
        for (let i = 0; i < flakes.length; i++) {
          const f = flakes[i];
          if (!reducedMotion) {
            f.phase += dt * f.swayFreq;
            f.rot += f.rotSpeed * dt;
            f.y += f.speed * dt;
            // Recycle fully below the frame back to fully above it.
            if (f.y > viewSvg.bottom + WMARGIN) {
              f.y = viewSvg.top - WMARGIN;
              f.x = viewSvg.left - 40 + Math.random() * (viewW() + 80);
            }
          }
          const cxp = f.x + Math.sin(f.phase) * f.swayAmp;
          const cyp = -(f.y);
          const hz = ((f.r * 2.4 + 1.5) * worldPerPx) / 2;
          const cosR = Math.cos(f.rot);
          const sinR = Math.sin(f.rot);
          const o = i * 12;
          // TL, TR, BL, BR — rotated about the flake center like the 2D
          // flakes' slow spin.
          snowPos[o] = cxp + (-hz * cosR - hz * sinR);
          snowPos[o + 1] = cyp + (-hz * sinR + hz * cosR);
          snowPos[o + 3] = cxp + (hz * cosR - hz * sinR);
          snowPos[o + 4] = cyp + (hz * sinR + hz * cosR);
          snowPos[o + 6] = cxp + (-hz * cosR + hz * sinR);
          snowPos[o + 7] = cyp + (-hz * sinR - hz * cosR);
          snowPos[o + 9] = cxp + (hz * cosR + hz * sinR);
          snowPos[o + 10] = cyp + (hz * sinR - hz * cosR);
          // Per-flake opacity (2D: alpha 0.25–0.7) as vertex brightness.
          const k = Math.min(1, f.alpha / 0.7);
          for (let c2 = 0; c2 < 12; c2++) snowCol[o + c2] = k;
        }
        snowGeo.attributes.position.needsUpdate = true;
        snowGeo.attributes.color.needsUpdate = true;
        snowGeo.setDrawRange(0, flakes.length * 6);
      } else {
        snow.visible = false;
        wind.visible = true;
        if (!reducedMotion) gustT += dt;
        for (let si = 0; si < streaks.length; si++) {
          const s = streaks[si];
          if (!reducedMotion) {
            const gust = 0.7 + 0.5 * (0.5 + 0.5 * Math.sin(gustT * 0.6 + s.phase));
            s.x += s.speed * gust * dt;
            s.y += Math.sin(gustT * s.bobFreq + s.phase) * s.bobAmp * dt;
            // Travel fully off the right edge before recycling back in
            // fully off the left edge.
            if (s.x - s.len > viewSvg.right + WMARGIN) {
              s.x = viewSvg.left - s.len - WMARGIN;
              s.y = viewSvg.top - 40 + Math.random() * (viewH() + 80);
            }
            if (s.y < viewSvg.top - 40) s.y = viewSvg.bottom + 40;
            else if (s.y > viewSvg.bottom + 40) s.y = viewSvg.top - 40;
          }
          // Sample the spine, then extrude +-half width into the ribbon.
          for (let i = 0; i <= WIND_SEGS; i++) {
            streakPointAt(s, i / WIND_SEGS, gustT, windScratch, i * 2);
          }
          const half = (3 + s.width * 2.5) / 2;
          const base = si * WIND_VERTS * 3;
          for (let i = 0; i <= WIND_SEGS; i++) {
            const ip = Math.max(0, i - 1);
            const inx = Math.min(WIND_SEGS, i + 1);
            let dx = windScratch[inx * 2] - windScratch[ip * 2];
            let dy = windScratch[inx * 2 + 1] - windScratch[ip * 2 + 1];
            const len = Math.hypot(dx, dy) || 1;
            dx /= len;
            dy /= len;
            const ox = -dy * half;
            const oy = dx * half;
            const cx = windScratch[i * 2];
            const cy = windScratch[i * 2 + 1];
            const o = base + i * 6;
            windPos[o] = cx - ox;
            windPos[o + 1] = -(cy - oy);
            windPos[o + 2] = 0;
            windPos[o + 3] = cx + ox;
            windPos[o + 4] = -(cy + oy);
            windPos[o + 5] = 0;
          }
        }
        windGeo.attributes.position.needsUpdate = true;
      }
    }

    // Theme engine hook: re-apply every themed piece the moment the theme
    // store changes — clear color, health ramp triplets, grid dot color and
    // icon ink textures — so the 3D map follows themes exactly like the 2D
    // map's CSS-var repaint.
    const applyTheme = (): void => {
      setRampColors(themeVars);
      renderer.setClearColor(new THREE.Color(themeVars.canvas), 1);
      redrawGrid();
      for (const t of iconTexCache.values()) t.dispose();
      iconTexCache.clear();
      void bakeIcons();
    };
    themeUnsub = theme.subscribe(() => {
      themeVars = readThemeVars();
      applyTheme();
    });
    applyTheme();

    // Post: render + CRT tube pass.
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const crtPass = new ShaderPass(CRTShader);
    // Point the dev-panel sliders at the LIVE pass uniforms (the pass cloned
    // the shader's uniforms, so the module object is no longer authoritative).
    crtUniforms = crtPass.uniforms as unknown as typeof crtUniforms;
    composer.addPass(crtPass);
    composer.addPass(new OutputPass());

    // Smooth responsive resize (2D-map behavior). Buffer resizes are
    // DEFERRED into the render frame: as the sidebar's 300ms CSS transition
    // animates the container, ResizeObserver only records the latest size
    // and the frame loop applies it immediately before rendering, so the
    // cleared canvas/targets are redrawn in the same paint — no blink, no
    // intermediate blank frames, and DPR is only touched when it changes.
    let pendingW = 1;
    let pendingH = 1;
    let pendingDpr = 1;
    let curW = 0;
    let curH = 0;
    let curDpr = 0;
    const requestResize = (): void => {
      const rect = el.getBoundingClientRect();
      pendingW = Math.max(1, Math.round(rect.width));
      pendingH = Math.max(1, Math.round(rect.height));
      pendingDpr = Math.min(2, window.devicePixelRatio || 1);
    };
    const applyResize = (): void => {
      if (pendingW === curW && pendingH === curH && pendingDpr === curDpr) return;
      curW = pendingW;
      curH = pendingH;
      curDpr = pendingDpr;
      if (renderer.getPixelRatio() !== curDpr) {
        renderer.setPixelRatio(curDpr);
        composer.setPixelRatio(curDpr);
      }
      renderer.setSize(curW, curH, false);
      composer.setSize(curW, curH);
      fitCamera(curW, curH);
    };
    requestResize();
    applyResize();
    const ro = new ResizeObserver(requestResize);
    ro.observe(el);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickMeshes: THREE.Object3D[] = [];
    for (const meshes of govMeshes.values()) pickMeshes.push(...meshes);
    let hovered: string | null = null;
    let hoveredStat: { govId: string; key: string } | null = null;

    interface PickHit {
      govId: string | null;
      statKey: string | null;
    }
    const pick = (e: PointerEvent): PickHit => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.set(nx, ny);
      // Icon boxes first (they sit above shapes). Math-tested, not raycast:
      // THREE.Sprite raycasting is unreliable under ortho cameras, while the
      // icons are axis-aligned boxes at known world positions.
      const wx = camera.left + ((nx + 1) / 2) * (camera.right - camera.left);
      const wy = camera.bottom + ((ny + 1) / 2) * (camera.top - camera.bottom);
      for (const [gid, recs] of govIcons) {
        for (let i = 0; i < recs.length; i++) {
          const r = recs[i];
          if (Math.abs(wx - r.wx) <= 13 && Math.abs(wy - r.wy) <= 13) {
            return { govId: gid, statKey: STAT_KEYS[i] ?? null };
          }
        }
      }
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickMeshes, false);
      if (hits.length === 0) return { govId: null, statKey: null };
      const govId = (hits[0].object.userData.govId as string) ?? null;
      return { govId, statKey: null };
    };

    const fmtPeople = (n: number): string => Math.round(n).toLocaleString('en-US');
    const govNameAr = (id: string): string => get(gameStore).governorates[id]?.nameAr ?? id;
    const pickArrow = (e: PointerEvent): { fromId: string; toId: string; history: number; predicted: number } | null => {
      if (!get(uiStore).showMigrationArrows || arrowHitMeshes.length === 0) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(arrowHitMeshes, false);
      if (hits.length === 0) return null;
      const idx = arrowHitMeshes.indexOf(hits[0].object as THREE.Mesh);
      return idx >= 0 ? arrowHitMeta[idx] : null;
    };

    const onMove = (e: PointerEvent): void => {
      const hit = pick(e);
      hovered = hit.govId;
      hoveredStat = hit.govId && hit.statKey ? { govId: hit.govId, key: hit.statKey } : null;
      if (hoveredStat) {
        tooltip = null;
      } else {
        const a = pickArrow(e);
        if (a) {
          const rect = renderer.domElement.getBoundingClientRect();
          tooltip = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            text: `نزوح داخلي من ${govNameAr(a.fromId)} إلى ${govNameAr(a.toId)} — الدورات السابقة: ${fmtPeople(a.history)}، المتوقع: ${fmtPeople(a.predicted)}`,
          };
        } else {
          tooltip = null;
        }
      }
      renderer.domElement.style.cursor = hit.govId ? 'pointer' : 'default';
    };
    const activateGov = (id: string): void => {
      const current = get(uiStore).selectedGovernorateId;
      if (current === id) {
        uiStore.selectGovernorate(null);
        if (get(uiStore).activeCommandPanel === 'provincial') uiStore.closeCommandPanel();
      } else {
        uiStore.selectGovernorate(id);
      }
    };
    const onClick = (e: PointerEvent): void => {
      const id = pick(e).govId;
      if (!id) {
        uiStore.selectGovernorate(null);
        uiStore.closeCommandPanel();
      } else {
        activateGov(id);
      }
    };
    // Keyboard shape navigation: arrows move a shared highlight, Enter/Space
    // activates, Escape clears. (Pointer users get hover; hub buttons cover
    // the rest — same contract as the 2D map's note.)
    const onKey = (e: KeyboardEvent): void => {
      const ids = SYRIA_2D_GOVERNORATES.map((g) => g.id);
      const anchor = hovered ?? get(uiStore).selectedGovernorateId;
      const idx = anchor ? ids.indexOf(anchor) : -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        hovered = ids[(idx + 1 + ids.length) % ids.length];
        hoveredStat = null;
        tooltip = null;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        hovered = ids[(idx - 1 + ids.length) % ids.length];
        hoveredStat = null;
        tooltip = null;
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (hovered) activateGov(hovered);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        hovered = null;
        hoveredStat = null;
        tooltip = null;
        uiStore.selectGovernorate(null);
        uiStore.closeCommandPanel();
      }
    };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('click', onClick);
    hostKeyHandler = onKey;

    // Minimal test surface for headless screenshot verification (same pick
    // path as real pointer events; iconScreen + debugSeason exist so tooling
    // can place exact hovers and preview weather out of season).
    (window as unknown as Record<string, unknown>).__syria3d = {
      hover: (x: number, y: number): PickHit => {
        const hit = pick({ clientX: x, clientY: y } as PointerEvent);
        hovered = hit.govId;
        hoveredStat = hit.govId && hit.statKey ? { govId: hit.govId, key: hit.statKey } : null;
        return hit;
      },
      clear: (): void => {
        hovered = null;
        hoveredStat = null;
      },
      debugSeason: (m: 'snow' | 'wind' | null): void => {
        weatherOverride = m;
      },
      iconScreen: (govId: string, idx: number): [number, number] | null => {
        const rec = govIcons.get(govId)?.[idx];
        if (!rec) return null;
        const v = new THREE.Vector3(rec.wx, rec.wy, 1).project(camera);
        const rect = renderer.domElement.getBoundingClientRect();
        return [
          Math.round(rect.left + ((v.x + 1) / 2) * rect.width),
          Math.round(rect.top + ((1 - v.y) / 2) * rect.height),
        ];
      },
    };

    let raf = 0;
    let lastT = 0;
    const selected = (): string | null => get(uiStore).selectedGovernorateId;
    const frame = (): void => {
      if (!alive) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
      lastT = now;
      updateWeather(dt);
      const sel = selected();
      const activeKey = hoveredStat ? hoveredStat.key : null;
      for (const gov of SYRIA_2D_GOVERNORATES) {
        const id = gov.id;
        const govState = get(gameStore).governorates[id];
        const isHovered = hovered === id;
        const isSelected = sel === id;
        const meshes = govMeshes.get(id)!;
        // Base dim while a flood is active (mirrors fill-opacity 0.35/0.78).
        const flooding = activeKey && hoveredStat!.govId === id;
        const base = healthColor(govState);
        if (id === hovered) base.offsetHSL(0, 0, 0.07);
        if (isSelected) base.offsetHSL(0, 0, 0.12);
        // Solid fills (nothing underneath shows); flooding dims like the 2D
        // map's 0.35 fill-opacity so the flood color reads through.
        for (const m of meshes) {
          const mat = m.material as THREE.MeshBasicMaterial;
          mat.color.copy(base);
          mat.opacity = flooding ? 0.35 : 1;
        }
        // Painter order: selected on top, then hovered, else creation order
        // (2D orderedGovernorates ranks).
        govGroups.get(id)!.position.z = isSelected
          ? 0.03
          : isHovered
            ? 0.02
            : govBaseZ.get(id)!;
        // Base stroke for idle shapes; the wider accent ribbon (2D's 2.8px
        // hover/selected stroke) replaces it while active.
        const active = isHovered || isSelected;
        for (const sm of govStrokes.get(id)!) sm.visible = !active;
        for (const am of govAccents.get(id)!) {
          am.visible = active;
          if (active) am.material = isSelected ? accentSelMat : accentHoverMat;
        }
        // Icons + halo + flood + pill follow the active stat, if any.
        const recs = govIcons.get(id);
        const stats = govState ? getGovStats(govState, themeVars) : [];
        const [cx, cy] = gov.center;
        if (recs) {
          for (let i = 0; i < recs.length; i++) {
            const rec = recs[i];
            const st = stats[i];
            if (!st) continue;
            rec.statKey = st.key;
            const isActive = flooding && activeKey === st.key;
            const isDimmed = flooding && !isActive;
            const isNominalMine = st.key === 'mines' && !(govState && govState.mineSaturationPct > 12);
            const size = isActive ? 28 : 24;
            rec.sprite.scale.set(size, size, 1);
            const mat = rec.sprite.material as THREE.SpriteMaterial;
            const glyphTex = iconTexs.get(st.name);
            if (glyphTex && mat.map !== glyphTex) {
              mat.map = glyphTex;
              mat.needsUpdate = true;
            }
            mat.color.set(st.color);
            mat.opacity = isDimmed ? 0.35 : isNominalMine && !isActive ? 0.45 : 1;
            if (isActive) {
              haloDisc.visible = true;
              haloRing.visible = true;
              haloDisc.position.set(cx + rec.dx + 12, -(cy + rec.dy + 12), 0.9);
              haloRing.position.copy(haloDisc.position);
              (haloDisc.material as THREE.MeshBasicMaterial).color.set(themeVars.ink);
              (haloRing.material as THREE.MeshBasicMaterial).color.set(st.color);
            }
          }
        }
        if (flooding) {
          const st = stats.find((s) => s.key === activeKey)!;
          const frac = Math.min(1, Math.max(0, st.pct / 100));
          const [minx, miny, maxx, maxy] = govBBox.get(id)!;
          const bw = maxx - minx;
          const bh = maxy - miny;
          // Bottom-anchored level (world y grows upward): the plane shrinks
          // to the bottom fraction AND samples the matching mask rows.
          // (miny = world bottom = svg south; v=0 reads the canvas bottom.)
          const tex = floodMasks.get(id)!;
          const uv = floodGeo.attributes.uv as THREE.BufferAttribute;
          uv.setY(0, frac);
          uv.setY(1, frac);
          uv.setY(2, 0);
          uv.setY(3, 0);
          uv.needsUpdate = true;
          floodMat.color.set(st.color);
          if (floodMat.alphaMap !== tex) {
            floodMat.alphaMap = tex;
            floodMat.needsUpdate = true;
          }
          const levelH = Math.max(0.001, bh * frac);
          floodPlane.visible = true;
          floodPlane.scale.set(bw, levelH, 1);
          floodPlane.position.set(minx + bw / 2, miny + levelH / 2, 0.2);
          const fillY = miny + bh * frac;
          const showDivider = frac > 0.02 && frac < 0.98;
          divider.visible = showDivider;
          if (showDivider) {
            divider.scale.set(bw, 1, 1);
            divider.position.set(minx + bw / 2, fillY, 0.25);
            // Sample the mask along the fill-level row (same v as the flood
            // plane's top edge) so the line only spans the shape.
            dividerUv.setY(0, frac);
            dividerUv.setY(1, frac);
            dividerUv.setY(2, frac);
            dividerUv.setY(3, frac);
            dividerUv.needsUpdate = true;
            if (dividerMat.alphaMap !== tex) {
              dividerMat.alphaMap = tex;
              dividerMat.needsUpdate = true;
            }
          }
          const key = `${id}|${st.key}|${Math.round(st.pct)}|${st.color}`;
          if (key !== pillKey) {
            pillKey = key;
            drawPill(st.pct, st.color);
          }
          pill.visible = true;
          pill.position.set(cx, -cy + 42, 6);
        }
      }
      if (!hoveredStat) {
        pill.visible = false;
        floodPlane.visible = false;
        divider.visible = false;
        haloDisc.visible = false;
        haloRing.visible = false;
        pillKey = '';
      }
      // Theme-driven colors stay live; arrow rebuilds happen on data change.
      arrowHistMat.color.set(themeVars.midGold);
      headHistMat.color.set(themeVars.midGold);
      arrowPredMat.color.set(themeVars.arrowPred);
      headPredMat.color.set(themeVars.arrowPred);
      dividerMat.color.set(themeVars.divider);
      accentHoverMat.color.set(themeVars.hover);
      accentSelMat.color.set(themeVars.selected);
      strokeMat.color.set(themeVars.ink);
      crtPass.enabled = get(uiStore).crtTube;
      syncArrows();
      applyResize();
      composer.render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeUnsub?.();
      hostKeyHandler = null;
      crtUniforms = null;
      delete (window as unknown as Record<string, unknown>).__syria3d;
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

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -- Canvas viewport: keyboard shape navigation via arrows/Enter/Escape; hub buttons cover the rest. -->
<div
  bind:this={host}
  class="relative w-full h-full overflow-hidden select-none focus:outline-none focus-visible:outline-2 focus-visible:outline-wheat-gold"
  role="region"
  aria-label="الخارطة الاستراتيجية للجمهورية العربية السورية"
  tabindex={0}
  onkeydown={(e: KeyboardEvent) => hostKeyHandler?.(e)}
>
  {#if tooltip}
    <div
      class="pointer-events-none absolute z-10 px-2 py-1 text-[11px] font-arabic text-wheat-light bg-forest-deep/95 border border-wheat-mid/40 rounded-none whitespace-nowrap"
      style="left:{tooltip.x + 14}px;top:{tooltip.y + 12}px;"
    >{tooltip.text}</div>
  {/if}

  <!-- CRT lens tuning (dev builds only): live sliders on the shader
       uniforms. Bake the chosen values into CRT_DEFAULTS when happy. -->
  {#if import.meta.env.DEV}
    <div
      dir="rtl"
      class="absolute top-10 left-3 z-20 w-[236px] px-3 py-2.5 space-y-2.5 bg-forest-deep/95 border border-wheat-mid/40 text-wheat-light font-arabic text-[11px] shadow-xl"
    >
      <div class="flex items-center justify-between border-b border-charcoal-mid pb-1.5">
        <span class="text-wheat-gold font-bold font-heading">ضبط عدسة CRT</span>
        <button
          onclick={resetCrt}
          class="px-1.5 py-0.5 text-[10px] border border-charcoal-mid text-wheat-dark hover:text-wheat-gold hover:border-wheat-mid/60 cursor-pointer"
        >إعادة الضبط</button>
      </div>
      <label class="block space-y-1">
        <span class="flex justify-between"><span>قوة الانتفاخ</span><bdi class="font-mono text-wheat-gold">{crtBulge.toFixed(3)}</bdi></span>
        <input
          type="range" min="0" max="0.4" step="0.005" value={crtBulge}
          oninput={(e) => setCrtUniform('uBulge', Number(e.currentTarget.value))}
          class="w-full h-1.5 cursor-pointer"
          style="accent-color: var(--color-wheat-gold, #d8c58a);"
        />
      </label>
      <label class="block space-y-1">
        <span class="flex justify-between"><span>نصف قطر العدسة</span><bdi class="font-mono text-wheat-gold">{crtRadius.toFixed(2)}</bdi></span>
        <input
          type="range" min="0.2" max="1" step="0.01" value={crtRadius}
          oninput={(e) => setCrtUniform('uRadius', Number(e.currentTarget.value))}
          class="w-full h-1.5 cursor-pointer"
          style="accent-color: var(--color-wheat-gold, #d8c58a);"
        />
      </label>
    </div>
  {/if}
</div>
