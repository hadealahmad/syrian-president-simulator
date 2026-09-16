<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { projectedTurnStore } from '../stores/draft-store';
  import GameIcon from '../ui/GameIcon.svelte';
  import { get } from 'svelte/store';
  import { SYRIA_2D_GOVERNORATES, SYRIA_2D_VIEWBOX } from './syria-2d-paths';
  import type { GovernorateNode, MigrationFlow } from '../engine/types';
  import { theme } from '../stores/theme-store';
  import { cssRgbTriplet, cssVar } from '../themes';

  let hoveredGovId = $state<string | null>(null);
  let hoveredStat = $state<{ govId: string; key: string } | null>(null);

  // ── Theming: every color resolves live from CSS variables (app.css is the
  // single source of truth; `themes.ts` only reads them back). `themeId` is
  // read inside `mapCss` so a theme switch repaints the whole canvas.
  let themeId = $state('default');
  $effect(() => theme.subscribe((v) => { themeId = v; }));

  const mapCss = $derived.by(() => {
    void themeId;
    return {
      ok: cssVar('--map-ok', '#3fb950'),
      warn: cssVar('--map-warn', '#f5d547'),
      danger: cssVar('--map-danger', '#ce1126'),
      midGold: cssVar('--map-arrow-hist', '#b9a779'),
      ink: cssVar('--map-ink', '#0D1117'),
      shadow: cssVar('--map-shadow', '#050a09'),
      divider: cssVar('--color-charcoal-white', '#ffffff'),
      arrowHist: cssVar('--map-arrow-hist', '#b9a779'),
      arrowPred: cssVar('--map-arrow-pred', '#E6EDF3'),
      selectedStroke: cssVar('--map-selected-stroke', '#b9a779'),
      hoverStroke: cssVar('--map-hover-stroke', '#E6EDF3'),
      rampWorst: cssRgbTriplet('--map-ramp-worst', [74, 21, 30]),
      rampMid: cssRgbTriplet('--map-ramp-mid', [152, 133, 97]),
      rampBest: cssRgbTriplet('--map-ramp-best', [46, 107, 95]),
    };
  });

  // Sovereign border strokes (SyID identity); fills come from the health ramp.
  function syidStrokes(): { charcoalBorder: string; hoverStroke: string; selectedStroke: string } {
    return {
      charcoalBorder: mapCss.ink,
      hoverStroke: mapCss.hoverStroke,
      selectedStroke: mapCss.selectedStroke,
    };
  }

  // Composite attention index: mean of four normalized strains (mines, blackout,
  // unrebuilt share, unrest). 0 = needs nothing, 1 = needs everything. Drives the
  // fill heat so the eye goes where decisions are needed.
  function attentionIndex(gov: GovernorateNode | undefined): number {
    if (!gov) return 0.3;
    return (
      gov.mineSaturationPct / 100 +
      gov.dailyBlackoutHours / 24 +
      (1 - gov.reconstructionScore) +
      gov.prri / 100
    ) / 4;
  }

  // Dark red (worst) -> gold (mid) -> green (best) health ramp. Deep, muted tones
  // so the bright status glyphs always read on top of the fill.
  // Values come from `--map-ramp-*` (app.css) so themes recolor the ramp.
  function rampWorst(): [number, number, number] { return mapCss.rampWorst; }
  function rampMid(): [number, number, number] { return mapCss.rampMid; }
  function rampBest(): [number, number, number] { return mapCss.rampBest; }

  function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  }

  function healthFill(h: number): string {
    const t = Math.min(1, Math.max(0, h));
    const c = t < 0.5 ? lerp3(rampWorst(), rampMid(), t * 2) : lerp3(rampMid(), rampBest(), (t - 0.5) * 2);
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function getGovFillColor(gov: GovernorateNode | undefined): string {
    // Health is the inverse of the attention index, spread-calibrated to turn-1 values.
    // Selection / hover must NOT shift the fill — they only affect border (stroke).
    const health = 1 - Math.min(1, Math.max(0, (attentionIndex(gov) - 0.25) / 0.5));
    return healthFill(health);
  }

  function handleGovClick(govId: string): void {
    const current = get(uiStore).selectedGovernorateId;
    if (current === govId) {
      // Deselecting dismisses the governorate dossier panel with it.
      uiStore.selectGovernorate(null);
      if (get(uiStore).activeCommandPanel === 'provincial') {
        uiStore.closeCommandPanel();
      }
    } else {
      uiStore.selectGovernorate(govId);
    }
  }

  function handleCanvasClick(e: MouseEvent): void {
    // Empty map canvas dismisses any open panel (gov shapes/icons and the
    // overlay toggle opt out via [data-gov-click] / button guard below).
    const t = e.target as Element | null;
    if (t && typeof t.closest === 'function') {
      if (t.closest('[data-gov-click]') || t.closest('button')) return;
    }
    uiStore.selectGovernorate(null);
    uiStore.closeCommandPanel();
  }

  function handleGovMouseEnter(govId: string): void {
    hoveredGovId = govId;
    // Gov-shape hover alone shows no metric — clear any stale icon fill.
    hoveredStat = null;
  }

  function handleGovMouseLeave(): void {
    hoveredGovId = null;
    hoveredStat = null;
  }

  function handleStatEnter(govId: string, key: string): void {
    hoveredGovId = govId;
    hoveredStat = { govId, key };
  }

  function handleStatLeave(): void {
    // Icon sits above the shape, so leaving it may mean leaving the gov
    // entirely (underlying path won't fire leave). Clear both; entering the
    // shape right after will re-set the gov highlight without flicker issues.
    hoveredStat = null;
    hoveredGovId = null;
  }

  interface GovStat {
    key: string;
    name: string;
    labelAr: string;
    color: string;
    pct: number;
  }

  function getGovStats(gov: GovernorateNode): GovStat[] {
    const powerColor = gov.dailyBlackoutHours <= 12 ? mapCss.ok : gov.dailyBlackoutHours <= 16 ? mapCss.warn : mapCss.danger;
    const rebuildName = gov.reconstructionScore >= 0.85 ? 'stone-wall' : gov.reconstructionScore >= 0.55 ? 'brick-wall' : 'broken-wall';
    const rebuildColor = gov.reconstructionScore >= 0.85 ? mapCss.ok : gov.reconstructionScore >= 0.55 ? mapCss.midGold : mapCss.danger;
    const faceName = gov.tier === 'CALM' ? 'emotion-happy-fill' : gov.tier === 'TENSE' ? 'emotion-normal-fill' : 'emotion-sad-fill';
    const faceColor = gov.tier === 'CALM' ? mapCss.ok : gov.tier === 'TENSE' ? mapCss.warn : mapCss.danger;
    return [
      { key: 'mines', name: 'minefield', labelAr: 'المساحة الملغومة', color: mapCss.danger, pct: Math.min(100, Math.max(0, gov.mineSaturationPct)) },
      { key: 'power', name: 'power-generator', labelAr: 'التغذية الكهربائية', color: powerColor, pct: Math.max(0, Math.min(100, ((24 - gov.dailyBlackoutHours) / 24) * 100)) },
      { key: 'rebuild', name: rebuildName, labelAr: 'إعادة الإعمار', color: rebuildColor, pct: Math.max(0, Math.min(100, gov.reconstructionScore * 100)) },
      { key: 'mood', name: faceName, labelAr: 'الاستقرار الشعبي', color: faceColor, pct: Math.max(0, Math.min(100, 100 - gov.prri)) },
    ];
  }

  const bboxCache = new Map<string, [number, number, number, number]>();
  function govBBox(id: string, path: string): [number, number, number, number] {
    const hit = bboxCache.get(id);
    if (hit) return hit;
    const nums = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [0, 0];
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const box: [number, number, number, number] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    bboxCache.set(id, box);
    return box;
  }

  // Paint order: hovered governorate on top, then selected, then the rest —
  // so overlapping borders always show the active shape's border above others.
  // Stable sort keeps the base map order within the same rank.
  function orderedGovernorates(hoveredId: string | null, selectedId: string | null) {
    const rank = (id: string) => (id === hoveredId ? 2 : id === selectedId ? 1 : 0);
    return [...SYRIA_2D_GOVERNORATES].sort((a, b) => rank(a.id) - rank(b.id));
  }

  // --- Internal migration arrows (gov-to-gov, no external migration) ---
  // ON by default, including on a fresh game: a restart drops turnNumber, so
  // detect that transition and switch the toggle back on.
  let showMigration = $state(true);
  let lastSeenTurn = $state(0);
  $effect(() => {
    const t = $gameStore.turnNumber;
    if (lastSeenTurn > 0 && t < lastSeenTurn) showMigration = true;
    lastSeenTurn = t;
  });
  const MIGRATION_MIN_PEOPLE = 1000;
  const govCenterById = new Map(SYRIA_2D_GOVERNORATES.map((g) => [g.id, g.center]));
  const govNameArById = new Map(SYRIA_2D_GOVERNORATES.map((g) => [g.id, g.nameAr]));

  interface MigrationArrow {
    fromId: string;
    toId: string;
    history: number;
    predicted: number;
    total: number;
    d: string;
    width: number;
  }

  // Routing so each arrow reads as starting from the right governorate: in dense
  // clusters (south: Quneitra/Daraa/Damascus/Suwayda) a fixed side can push a
  // start/end into a neighbor's icons. We try offset side × bow side and keep
  // the path farthest from foreign centers — empty space wins. Ties prefer
  // left-of-travel, which also separates opposite legs to opposite sides.
  const MIGRATION_LATERAL = 34;
  const MIGRATION_CLEAR_RADIUS = 70;

  function quadSample(
    sx: number, sy: number, cx: number, cy: number,
    ex: number, ey: number, t: number
  ): [number, number] {
    const u = 1 - t;
    return [u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey];
  }

  function migrationArrowPath(
    fromId: string,
    toId: string,
    from: readonly [number, number],
    to: readonly [number, number]
  ): string {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const nx = -uy;
    const ny = ux;
    // Shrink lateral clearance where neighbors are tight (but keep a floor so
    // the line still clears the own ±26 icon block).
    let nearestForeign = Infinity;
    for (const [id, c] of govCenterById) {
      if (id === fromId || id === toId) continue;
      const d = Math.hypot(c[0] - from[0], c[1] - from[1]);
      if (d < nearestForeign) nearestForeign = d;
    }
    const off = Number.isFinite(nearestForeign)
      ? Math.min(MIGRATION_LATERAL, Math.max(14, nearestForeign * 0.4))
      : MIGRATION_LATERAL;
    // Start very close to the governorate center; lateral offset clears the icons.
    const trimS = Math.min(12, dist * 0.2);
    const trimE = Math.min(24, dist * 0.3);
    // Minimum bow keeps close-neighbor hops (e.g. Quneitra → Daraa) visible.
    const bow = Math.min(70, Math.max(18, dist * 0.25));
    const foreigners = [...govCenterById.entries()].filter(([id]) => id !== fromId && id !== toId);

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
      return {
        d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
        score,
      };
    };

    const candidates = [build(1, 1), build(-1, -1), build(1, -1), build(-1, 1)];
    let best = candidates[0];
    for (const c of candidates) if (c.score < best.score) best = c;
    return best.d;
  }

  function fmtPeople(n: number): string {
    return Math.round(n).toLocaleString('en-US');
  }

  // Previous committed turns combined (ledger) + predicted next turn under the
  // current unconfirmed draft directives (projection, updates live as choices change).
  let migrationData = $derived.by(() => {
    const ledger: Record<string, number> = $gameStore.migrationLedger ?? {};
    const predicted: MigrationFlow[] = $projectedTurnStore.migrationFlows ?? [];
    const acc = new Map<string, { fromId: string; toId: string; history: number; predicted: number }>();
    for (const [key, count] of Object.entries(ledger)) {
      const sep = key.indexOf('>');
      if (sep <= 0) continue;
      const fromId = key.slice(0, sep);
      const toId = key.slice(sep + 1);
      if (fromId === toId || !govCenterById.has(fromId) || !govCenterById.has(toId)) continue;
      acc.set(key, { fromId, toId, history: count, predicted: 0 });
    }
    for (const f of predicted) {
      if (f.fromId === f.toId || !govCenterById.has(f.fromId) || !govCenterById.has(f.toId)) continue;
      const key = `${f.fromId}>${f.toId}`;
      const cur = acc.get(key) ?? { fromId: f.fromId, toId: f.toId, history: 0, predicted: 0 };
      cur.predicted += f.count;
      acc.set(key, cur);
    }
    const arrows: MigrationArrow[] = [];
    let historyTotal = 0;
    let predictedTotal = 0;
    for (const a of acc.values()) {
      const total = a.history + a.predicted;
      if (total < MIGRATION_MIN_PEOPLE) continue;
      historyTotal += a.history;
      predictedTotal += a.predicted;
      const from = govCenterById.get(a.fromId);
      const to = govCenterById.get(a.toId);
      if (!from || !to) continue;
      arrows.push({
        ...a,
        total,
        d: migrationArrowPath(a.fromId, a.toId, from, to),
        width: Math.min(3.5, Math.max(1, Math.sqrt(total) / 34)),
      });
    }
    arrows.sort((x, y) => y.total - x.total);
    return { arrows: arrows.slice(0, 24), historyTotal, predictedTotal };
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -- Empty-canvas click-catcher (dismisses open panels); keyboard users toggle panels via the hub buttons. -->
<div
  class="relative w-full h-full overflow-hidden select-none bg-(--map-canvas) flex items-center justify-center box-border pb-[112px]"
  role="region"
  aria-label="الخارطة الاستراتيجية للجمهورية العربية السورية"
  onclick={handleCanvasClick}
>
  <!-- Faint Tactical Coordinate Grid Background -->
  <div class="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(var(--map-grid)_1px,transparent_1px)] [background-size:24px_24px]"></div>

  <!-- 2D Sovereign Vector Map (SVG) -->
  <svg
    viewBox={SYRIA_2D_VIEWBOX}
    preserveAspectRatio="xMidYMid meet"
    class="w-full h-full max-h-full max-w-full p-4 drop-shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
  >
    <defs>
      <!-- Per-governorate clip paths so an icon hover can flood-fill the solid shape -->
      {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
        <clipPath id={`gov-clip-${gov.id}`}>
          <path d={gov.path} />
        </clipPath>
      {/each}
      <!-- Migration arrowheads: solid wheat = past turns, dashed light = predicted -->
      <marker id="mig-head-hist" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="15" markerHeight="15" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill={mapCss.arrowHist} opacity="0.8" />
      </marker>
      <marker id="mig-head-pred" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="15" markerHeight="15" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill={mapCss.arrowPred} opacity="0.85" />
      </marker>
    </defs>

    <!-- Base Shadow Silhouette -->
    <g class="opacity-30 pointer-events-none transform translate-y-1.5 translate-x-0.5">
      {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
        <path d={gov.path} fill={mapCss.shadow} />
      {/each}
    </g>

    <!-- Governorates Polygons (Clean 2D, strictly without labels).
         Active (hovered/selected) shapes paint last so their borders sit on top of overlaps.
         Hover & selection touch border only — fill never shifts. -->
    <g class="cursor-pointer">
      {#each orderedGovernorates(hoveredGovId, $uiStore.selectedGovernorateId) as gov (gov.id)}
        {@const govState = $gameStore.governorates[gov.id]}
        {@const isHovered = hoveredGovId === gov.id}
        {@const isSelected = $uiStore.selectedGovernorateId === gov.id}
        {@const fill = getGovFillColor(govState)}
        {@const stroke = isSelected ? syidStrokes().selectedStroke : isHovered ? syidStrokes().hoverStroke : syidStrokes().charcoalBorder}
        {@const strokeWidth = isHovered ? 2.8 : 1.6}
        {@const bbox = govBBox(gov.id, gov.path)}
        {@const stats = govState ? getGovStats(govState) : []}
        {@const activeKey = hoveredStat && hoveredStat.govId === gov.id ? hoveredStat.key : null}
        {@const activeStat = activeKey ? stats.find((s) => s.key === activeKey) : undefined}
        {@const fillFrac = activeStat ? Math.min(1, Math.max(0, activeStat.pct / 100)) : 0}
        {@const bw = bbox[2] - bbox[0]}
        {@const bh = bbox[3] - bbox[1]}
        {@const fillY = bbox[3] - bh * fillFrac}

        <path
          d={gov.path}
          {fill}
          fill-opacity={activeStat ? 0.35 : 0.78}
          {stroke}
          stroke-width={strokeWidth}
          stroke-linejoin="round"
          stroke-linecap="round"
          data-gov-click={gov.id}
          class="transition-all duration-150 ease-out focus:outline-none [-webkit-tap-highlight-color:transparent]"
          onclick={() => handleGovClick(gov.id)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleGovClick(gov.id)}
          onmouseenter={() => handleGovMouseEnter(gov.id)}
          onpointerenter={() => handleGovMouseEnter(gov.id)}
          onmouseleave={handleGovMouseLeave}
          onpointerleave={handleGovMouseLeave}
          role="button"
          tabindex="0"
          aria-label={govState?.nameAr ?? gov.nameAr}
        />
        {#if activeStat}
          <g clip-path={`url(#gov-clip-${gov.id})`} class="pointer-events-none">
            <rect x={bbox[0]} y={fillY} width={bw} height={Math.max(0, bbox[3] - fillY)} fill={activeStat.color} opacity="0.85" />
            {#if fillFrac > 0.02 && fillFrac < 0.98}
              <rect x={bbox[0]} y={fillY - 1.5} width={bw} height={3} fill={mapCss.divider} opacity="0.9" />
            {/if}
          </g>
        {/if}
      {/each}
    </g>

    <!-- Internal migration arrows: solid = past turns combined, dashed = predicted next turn -->
    {#if showMigration}
      <g class="pointer-events-none">
        {#each migrationData.arrows as arrow (arrow.fromId + '>' + arrow.toId)}
          {@const fromName = govNameArById.get(arrow.fromId) ?? arrow.fromId}
          {@const toName = govNameArById.get(arrow.toId) ?? arrow.toId}
          <title>نزوح داخلي من {fromName} إلى {toName} — الدورات السابقة: {fmtPeople(arrow.history)}، المتوقع: {fmtPeople(arrow.predicted)}</title>
          {#if arrow.history > 0}
            <path
              d={arrow.d}
              fill="none"
              stroke={mapCss.arrowHist}
              stroke-width={arrow.width}
              opacity="0.32"
              stroke-linecap="round"
              marker-end="url(#mig-head-hist)"
            />
          {/if}
          {#if arrow.predicted > 0}
            <path
              d={arrow.d}
              fill="none"
              stroke={mapCss.arrowPred}
              stroke-width={arrow.width}
              opacity="0.6"
              stroke-linecap="round"
              stroke-dasharray="5 5"
              marker-end="url(#mig-head-pred)"
            />
          {/if}
        {/each}
      </g>
    {/if}

    <!-- On-Map Status Cluster: hovering an icon flood-fills its governorate shape -->
    <g class="pointer-events-none">
      {#each orderedGovernorates(hoveredGovId, $uiStore.selectedGovernorateId) as gov (gov.id)}
        {@const govState = $gameStore.governorates[gov.id]}
        {#if govState}
          {@const [cx, cy] = gov.center}
          {@const stats = getGovStats(govState)}
          {@const activeKey = hoveredStat && hoveredStat.govId === gov.id ? hoveredStat.key : null}
          {@const mined = govState.mineSaturationPct > 12}
          {#each stats as stat, i}
            {@const dx = i % 2 === 0 ? -26 : 2}
            {@const dy = i < 2 ? -26 : 2}
            {@const isActive = activeKey === stat.key}
            {@const isDimmed = activeKey !== null && !isActive}
            {@const isNominalMine = stat.key === 'mines' && !mined}
            <g
              style="pointer-events: auto; cursor: pointer;"
              data-gov-click={gov.id}
              opacity={isDimmed ? 0.35 : isNominalMine && !isActive ? 0.45 : 1}
              onclick={() => handleGovClick(gov.id)}
              onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleGovClick(gov.id)}
              onmouseenter={() => handleStatEnter(gov.id, stat.key)}
              onpointerenter={() => handleStatEnter(gov.id, stat.key)}
              onmouseleave={handleStatLeave}
              onpointerleave={handleStatLeave}
              onfocus={() => handleStatEnter(gov.id, stat.key)}
              onblur={handleStatLeave}
              role="button"
              tabindex="0"
              aria-label={`${gov.nameAr} — ${stat.labelAr}: ${Math.round(stat.pct)}%`}
            >
              <title>{stat.labelAr}: {Math.round(stat.pct)}%</title>
              {#if isActive}
                <circle cx={cx + dx + 12} cy={cy + dy + 12} r={17} fill={mapCss.ink} opacity="0.75" />
                <circle cx={cx + dx + 12} cy={cy + dy + 12} r={17} fill="none" stroke={stat.color} stroke-width={2} opacity="0.95" />
              {/if}
              <GameIcon name={stat.name} color={stat.color} outline={mapCss.ink} x={isActive ? cx + dx - 2 : cx + dx} y={isActive ? cy + dy - 2 : cy + dy} size={isActive ? 28 : 24} />
            </g>
          {/each}
          {#if activeKey}
            {@const activeStat = stats.find((s) => s.key === activeKey)}
            {#if activeStat}
              <g class="pointer-events-none">
                <rect x={cx - 26} y={cy - 52} width={52} height={20} rx={4} fill={mapCss.ink} opacity="0.88" stroke={activeStat.color} stroke-width={1.5} />
                <text x={cx} y={cy - 37.5} text-anchor="middle" font-size="13" font-weight="700" fill={activeStat.color} font-family="monospace">{Math.round(activeStat.pct)}%</text>
              </g>
            {/if}
          {/if}
        {/if}
      {/each}
    </g>
  </svg>

  <!-- Migration overlay toggle (Arabic): person with arrow to top-right -->
  <div class="absolute top-2 right-2 font-arabic">
    <button
      type="button"
      onclick={() => (showMigration = !showMigration)}
      aria-pressed={showMigration}
      aria-label="تبديل أسهم النزوح"
      class="flex items-center gap-1.5 text-[10px] px-2 py-1 bg-(--map-ink)/85 border transition-colors cursor-pointer {showMigration ? 'border-(--map-selected-stroke) text-(--map-cream)' : 'border-(--map-toggle-off) text-(--map-toggle-off-text) opacity-60 hover:opacity-100'}"
    >
      <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="4.5" cy="4" r="2.3" fill="currentColor" />
        <path d="M0.8 13.4c0-3.1 1.7-5 3.7-5s3.7 1.9 3.7 5" fill="currentColor" />
        <path d="M7.8 9.6 L12.4 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        <path d="M9.7 5 H12.4 V7.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>أسهم النزوح</span>
    </button>
  </div>

</div>
