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
  import { projectedTurnStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import { theme } from '../stores/theme-store';
  import { SYRIA_2D_GOVERNORATES } from './syria-2d-paths';
  import { REGION_NEAR, REGION_FAR, REGION_FAR_LABELS, REGION_SEA } from './syria-region-context';
  import { GLYPHS } from '../ui/GameIcon.svelte';
  import type { GovernorateNode, MigrationFlow } from '../engine/types';

  // Live theme snapshot (CSS vars are read once per theme change, never per
  // frame — getComputedStyle in the hot loop would force style recalc).
  interface ThemeVars {
    ok: string; warn: string; danger: string; midGold: string;
    ink: string; shadow: string; selected: string; hover: string;
    arrowPred: string;
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

  // Stat icon art: rasterize the same GameIcon glyphs (white fill, ink
  // outline baked in), then tint per state via material color. One texture
  // per glyph name, shared by all governorates.
  const iconTexCache = new Map<string, THREE.CanvasTexture>();
  async function iconTexture(name: string): Promise<THREE.CanvasTexture> {
    const hit = iconTexCache.get(name);
    if (hit) return hit;
    const g = GLYPHS[name] ?? GLYPHS['flame'];
    const vbw = Number(g.vb.split(' ')[2] ?? 512);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.vb}">` +
      `<g stroke="#0d1117" stroke-width="${vbw * 0.04}" paint-order="stroke" fill="#ffffff">` +
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

    // Governorates (interactive). Fills dim while a stat flood is active,
    // exactly like the 2D map (fill-opacity 0.35 vs 0.78).
    let themeVars = readThemeVars();
    const themeUnsub = theme.subscribe(() => {
      themeVars = readThemeVars();
    });
    const govMeshes = new Map<string, THREE.Mesh[]>();
    const govBorders = new Map<string, THREE.LineBasicMaterial[]>();
    const govRings = new Map<string, [number, number][][]>();
    const govBBox = new Map<string, [number, number, number, number]>();
    const shadowGroup = new THREE.Group();
    for (const gov of SYRIA_2D_GOVERNORATES) {
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
      const group = shapeMesh(rings, 0xffffff, 0.78, 0);
      const meshes: THREE.Mesh[] = [];
      const borders: THREE.LineBasicMaterial[] = [];
      for (const child of group.children) {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.transparent = true;
          mat.color.copy(healthColor(state));
          child.userData.govId = gov.id;
          meshes.push(child);
          const dark = child.clone();
          dark.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(themeVars.shadow),
            transparent: true,
            opacity: 0.3,
          });
          dark.position.set(2, -6, -0.4);
          dark.userData.govId = '';
          shadowGroup.add(dark);
        } else if (child instanceof THREE.LineLoop) {
          const mat = child.material as THREE.LineBasicMaterial;
          mat.color.set(themeVars.ink);
          borders.push(mat);
        }
      }
      govMeshes.set(gov.id, meshes);
      govBorders.set(gov.id, borders);
      scene.add(group);
    }
    scene.add(shadowGroup);

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
    void Promise.all(
      ['minefield', 'power-generator', 'stone-wall', 'brick-wall', 'broken-wall',
        'emotion-happy-fill', 'emotion-normal-fill', 'emotion-sad-fill'].map(
        async (name) => [name, await iconTexture(name)] as const,
      ),
    ).then((entries) => {
      for (const [name, tex] of entries) iconTexs.set(name, tex);
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
    const dividerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
    const divider = new THREE.Mesh(new THREE.PlaneGeometry(1, 3), dividerMat);
    divider.renderOrder = 4;
    divider.visible = false;
    scene.add(divider);

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
      const sig = `${turn}|${Object.keys(ledger).length}|${predicted.length}|${predicted.reduce((a, f) => a + f.count, 0)}`;
      if (sig === arrowSig) return;
      arrowSig = sig;
      while (arrowGroup.children.length > 0) {
        const child = arrowGroup.children.pop()!;
        // Head geometry is shared — only ribbons own their geometry.
        if (child instanceof THREE.Mesh && child.geometry !== headGeo) child.geometry.dispose();
      }
      for (const a of computeArrows()) {
        const end = a.pts[a.pts.length - 1];
        const prev = a.pts[a.pts.length - 2];
        const tangent = new THREE.Vector3(end[0] - prev[0], end[1] - prev[1], 0).normalize();
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
    const WVIEW = { x0: -140, y0: -140, x1: 1140, y1: 1020 };
    function seedWeather(mode: WeatherMode): void {
      if (mode === 'snow') {
        flakes = Array.from({ length: 130 }, () => ({
          x: WVIEW.x0 + Math.random() * (WVIEW.x1 - WVIEW.x0),
          y: WVIEW.y0 + Math.random() * (WVIEW.y1 - WVIEW.y0),
          r: 1 + Math.random() * 2.2,
          speed: 12 + Math.random() * 26,
          swayAmp: 8 + Math.random() * 18,
          swayFreq: 0.3 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.25 + Math.random() * 0.45,
        }));
        streaks = [];
      } else {
        streaks = Array.from({ length: 22 }, () => ({
          x: WVIEW.x0 + Math.random() * (WVIEW.x1 - WVIEW.x0),
          y: WVIEW.y0 + Math.random() * (WVIEW.y1 - WVIEW.y0),
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
    }
    // Soft round flake sprite (one shared texture).
    const flakeCanvas = document.createElement('canvas');
    flakeCanvas.width = 32;
    flakeCanvas.height = 32;
    {
      const ctx = flakeCanvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const flakeTex = new THREE.CanvasTexture(flakeCanvas);
    const SNOW_MAX = 130;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(SNOW_MAX * 3);
    const snowCol = new Float32Array(SNOW_MAX * 3);
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    snowGeo.setAttribute('color', new THREE.BufferAttribute(snowCol, 3));
    // Additive blending: per-flake brightness doubles as alpha (dark =
    // invisible), so no custom shader is needed for varied flake opacity.
    const snowMat = new THREE.PointsMaterial({
      size: 6, sizeAttenuation: false, map: flakeTex, transparent: true,
      vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true,
    });
    const snow = new THREE.Points(snowGeo, snowMat);
    snow.position.z = -0.5;
    snow.frustumCulled = false;
    snow.visible = false;
    scene.add(snow);
    // Wind: one LineSegments, 7 segments per streak, rewritten per frame.
    const WIND_SEGS = 7;
    const WIND_MAX = 22;
    const windGeo = new THREE.BufferGeometry();
    const windPos = new Float32Array(WIND_MAX * WIND_SEGS * 2 * 3);
    windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
    const wind = new THREE.LineSegments(
      windGeo,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    wind.position.z = -0.5;
    wind.frustumCulled = false;
    wind.visible = false;
    scene.add(wind);
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let weatherMode: WeatherMode = seasonToMode(get(gameStore).season);
    seedWeather(weatherMode);
    function streakPoint(s: Streak, t: number, time: number): [number, number] {
      // Gentle S-curve with an eastward-traveling ripple (matches 2D feel).
      const x = s.x + s.len * t;
      const bend = Math.sin(t * Math.PI) * 8;
      const wave = Math.sin(t * 6 - time * 2 + s.phase) * 3;
      const y = s.y + bend * 0.3 + wave + Math.sin(time * s.bobFreq + s.phase) * s.bobAmp * 0.2;
      return [x, y];
    }
    function updateWeather(dt: number): void {
      const mode = seasonToMode(get(gameStore).season);
      if (mode !== weatherMode) {
        weatherMode = mode;
        seedWeather(mode);
      }
      if (weatherMode === 'snow') {
        snow.visible = true;
        wind.visible = false;
        const W = WVIEW.x1 - WVIEW.x0;
        for (let i = 0; i < flakes.length; i++) {
          const f = flakes[i];
          if (!reducedMotion) {
            f.phase += dt * f.swayFreq;
            f.y += f.speed * dt;
            if (f.y > WVIEW.y1 + 6) {
              f.y = WVIEW.y0 - 6;
              f.x = WVIEW.x0 + Math.random() * W;
            }
          }
          snowPos[i * 3] = f.x + Math.sin(f.phase) * f.swayAmp;
          snowPos[i * 3 + 1] = -(f.y);
          snowPos[i * 3 + 2] = -0.5;
          snowCol[i * 3] = f.alpha;
          snowCol[i * 3 + 1] = f.alpha;
          snowCol[i * 3 + 2] = f.alpha;
        }
        snowGeo.attributes.position.needsUpdate = true;
        snowGeo.attributes.color.needsUpdate = true;
        snowGeo.setDrawRange(0, flakes.length);
      } else {
        snow.visible = false;
        wind.visible = true;
        if (!reducedMotion) gustT += dt;
        let v = 0;
        for (const s of streaks) {
          if (!reducedMotion) {
            const gust = 0.7 + 0.5 * (0.5 + 0.5 * Math.sin(gustT * 0.6 + s.phase));
            s.x += s.speed * gust * dt;
            s.y += Math.sin(gustT * s.bobFreq + s.phase) * s.bobAmp * dt;
            if (s.x - s.len > WVIEW.x1) {
              s.x = WVIEW.x0 - s.len;
              s.y = WVIEW.y0 + Math.random() * (WVIEW.y1 - WVIEW.y0);
            }
            if (s.y < WVIEW.y0 - 20) s.y = WVIEW.y1 + 20;
            else if (s.y > WVIEW.y1 + 20) s.y = WVIEW.y0 - 20;
          }
          let px = 0;
          let py = 0;
          for (let i = 0; i <= WIND_SEGS; i++) {
            const [qx, qy] = streakPoint(s, i / WIND_SEGS, gustT);
            if (i > 0) {
              windPos[v++] = px;
              windPos[v++] = -py;
              windPos[v++] = -0.5;
              windPos[v++] = qx;
              windPos[v++] = -qy;
              windPos[v++] = -0.5;
            }
            px = qx;
            py = qy;
          }
        }
        windGeo.attributes.position.needsUpdate = true;
        windGeo.setDrawRange(0, (v / 3) | 0);
      }
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

    const onMove = (e: PointerEvent): void => {
      const hit = pick(e);
      hovered = hit.govId;
      hoveredStat = hit.govId && hit.statKey ? { govId: hit.govId, key: hit.statKey } : null;
      renderer.domElement.style.cursor = hit.govId ? 'pointer' : 'default';
    };
    const onClick = (e: PointerEvent): void => {
      const id = pick(e).govId;
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

    // Test hook (drives the same pick path as real pointer events).
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
    let alive = true;
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
        for (const m of meshes) {
          const mat = m.material as THREE.MeshBasicMaterial;
          mat.color.copy(base);
          mat.opacity = flooding ? 0.35 : 0.78;
        }
        for (const b of govBorders.get(id)!) {
          b.color.set(isSelected ? themeVars.selected : isHovered ? themeVars.hover : themeVars.ink);
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
      // Arrow theme colors stay live; rebuilds happen inside on data change.
      arrowHistMat.color.set(themeVars.midGold);
      headHistMat.color.set(themeVars.midGold);
      arrowPredMat.color.set(themeVars.arrowPred);
      headPredMat.color.set(themeVars.arrowPred);
      syncArrows();
      composer.render();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeUnsub();
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

<div
  bind:this={host}
  class="relative w-full h-full overflow-hidden select-none"
  role="region"
  aria-label="الخارطة الاستراتيجية للجمهورية العربية السورية"
></div>
