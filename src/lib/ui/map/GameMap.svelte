<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import {
    SYRIA_2D_GOVERNORATES,
    SYRIA_2D_VIEWBOX,
    type Syria2DGovernorate,
  } from '../../spatial3d/syria-2d-paths';
  import { REGION_NEAR, REGION_FAR_LABELS } from '../../spatial3d/syria-region-context';
  import { shellLayout } from '../shell/viewport';
  import {
    MAP_MODES,
    modeBadge,
    modeById,
    modeValue,
    rampColor,
    tierDisplay,
    type MapModeId,
  } from './map-modes';
  import {
    buildMigrationArrows,
    formatPeople,
    GOVERNORATE_NAMES_AR,
  } from './migration-arrows';
  import type { GovernorateNode } from '../../engine/types';

  // ── Shell layout (labels/captions only make sense on desktop) ──────────────
  let layout = $derived($shellLayout);

  // ── Active map layer ───────────────────────────────────────────────────────
  // `?mapmode=power|damage|mines` is a capture helper (same spirit as the
  // shell's `?play=1`), so screenshots can show each layer without input.
  function initialMode(): MapModeId {
    if (typeof window === 'undefined') return 'unrest';
    const requested = new URLSearchParams(window.location.search).get('mapmode');
    return MAP_MODES.some((item) => item.id === requested)
      ? (requested as MapModeId)
      : 'unrest';
  }
  let mode = $state<MapModeId>(initialMode());
  let activeMode = $derived(modeById(mode));

  // ── Selection / hover ──────────────────────────────────────────────────────
  let hoveredId = $state<string | null>(null);
  let selectedId = $derived($uiStore.selectedGovernorateId);

  interface TooltipRow {
    label: string;
    value: string;
    tone?: string;
  }
  interface TooltipState {
    x: number;
    y: number;
    title: string;
    kicker: string;
    tone: string;
    rows: TooltipRow[];
  }
  let tooltip = $state<TooltipState | null>(null);

  // ── Zoom / pan ─────────────────────────────────────────────────────────────
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let boxW = $state(0);
  let boxH = $state(0);
  let stageEl = $state<HTMLDivElement | null>(null);
  let mapBoxEl = $state<HTMLDivElement | null>(null);

  const VIEW_W = 1000;
  const VIEW_H = 880;

  // The SVG is scaled with a CSS transform around the box centre, so screen
  // positions are deterministic: s = centre + (base - centre) * zoom + pan.
  let baseScale = $derived(
    boxW > 0 && boxH > 0 ? Math.min(boxW / VIEW_W, boxH / VIEW_H) : 0
  );

  interface Marker {
    gov: Syria2DGovernorate;
    node: GovernorateNode | undefined;
    x: number;
    y: number;
    value: string;
    suffix: string;
    tone: string;
    isSelected: boolean;
    nameAr: string;
  }

  let markers = $derived.by<Marker[]>(() => {
    if (!boxW || !boxH || baseScale <= 0) return [];
    const offsetX = (boxW - VIEW_W * baseScale) / 2;
    const offsetY = (boxH - VIEW_H * baseScale) / 2;
    const cx = boxW / 2;
    const cy = boxH / 2;
    const currentMode = mode;
    return SYRIA_2D_GOVERNORATES.map((gov) => {
      const node = $gameStore.governorates[gov.id];
      const baseX = offsetX + gov.center[0] * baseScale;
      const baseY = offsetY + gov.center[1] * baseScale;
      // Small southern-cluster nudge on phones only: Quneitra/Daraa are ~25px
      // apart at phone scale and their 28px badges would kiss.
      const nudge =
        layout === 'desktop'
          ? { x: 0, y: 0 }
          : gov.id === 'quneitra'
            ? { x: -14, y: -6 }
            : gov.id === 'daraa'
              ? { x: 8, y: 18 }
              : gov.id === 'as_suwayda'
                ? { x: 10, y: 6 }
                : { x: 0, y: 0 };
      const x = cx + (baseX - cx) * zoom + panX + nudge.x;
      const y = cy + (baseY - cy) * zoom + panY + nudge.y;
      const badge = node
        ? modeBadge(node, currentMode)
        : { value: '—', suffix: '' };
      return {
        gov,
        node,
        x,
        y,
        value: badge.value,
        suffix: badge.suffix,
        tone: tierDisplay(node?.tier).tone,
        isSelected: selectedId === gov.id,
        nameAr: node?.nameAr ?? gov.nameAr,
      };
    });
  });

  // ── Migration arrows ───────────────────────────────────────────────────────
  let migrationData = $derived(
    buildMigrationArrows($gameStore.migrationLedger, $projectedTurnStore.migrationFlows)
  );

  // A restart drops turnNumber: the arrows toggle returns to on, exactly like
  // the retired 2D/3D maps.
  let lastSeenTurn = $state(0);
  $effect(() => {
    const turn = $gameStore.turnNumber;
    if (lastSeenTurn > 0 && turn < lastSeenTurn) uiStore.setMigrationArrows(true);
    lastSeenTurn = turn;
  });

  // ── Paint ordering: hovered then selected paint last (borders on top) ─────
  function orderedGovernorates(
    hovered: string | null,
    selected: string | null
  ): Syria2DGovernorate[] {
    const rank = (id: string) => (id === hovered ? 2 : id === selected ? 1 : 0);
    return [...SYRIA_2D_GOVERNORATES].sort((a, b) => rank(a.id) - rank(b.id));
  }
  let ordered = $derived(orderedGovernorates(hoveredId, selectedId));

  function fillFor(node: GovernorateNode | undefined): string {
    if (!node) return 'var(--color-forest-mid)';
    return rampColor(activeMode.stops, modeValue(node, mode));
  }

  function ariaFor(gov: Syria2DGovernorate): string {
    const node = $gameStore.governorates[gov.id];
    if (!node) return gov.nameAr;
    const badge = modeBadge(node, mode);
    return `${node.nameAr} — ${activeMode.labelAr}: ${badge.value}${badge.suffix}`;
  }

  // ── Tooltips ───────────────────────────────────────────────────────────────
  function clampTip(clientX: number, clientY: number): { x: number; y: number } {
    const rect = stageEl?.getBoundingClientRect();
    if (!rect) return { x: 8, y: 8 };
    const tipW = 216;
    const tipH = 170;
    return {
      x: Math.max(8, Math.min(clientX - rect.left + 14, rect.width - tipW - 8)),
      y: Math.max(8, Math.min(clientY - rect.top + 14, rect.height - tipH - 8)),
    };
  }

  function showGovernorateTooltip(
    govId: string,
    clientX: number,
    clientY: number
  ): void {
    const node = $gameStore.governorates[govId];
    const meta =
      SYRIA_2D_GOVERNORATES.find((g) => g.id === govId) ??
      ({ nameAr: govId } as Syria2DGovernorate);
    const tier = tierDisplay(node?.tier);
    const badge = node ? modeBadge(node, mode) : { value: '—', suffix: '' };
    const position = clampTip(clientX, clientY);
    tooltip = {
      ...position,
      title: node?.nameAr ?? meta.nameAr,
      kicker: tier.labelAr,
      tone: tier.tone,
      rows: node
        ? [
            { label: activeMode.labelAr, value: `${badge.value}${badge.suffix}` },
            {
              label: 'ساعات الكهرباء',
              value: `${Number((24 - node.dailyBlackoutHours).toFixed(1))} س`,
            },
            { label: 'الألغام', value: `${Math.round(node.mineSaturationPct)}%` },
            {
              label: 'الضرر غير المُصلح',
              value: `$${Math.round(node.unrepairedDamageUSD / 1_000_000).toLocaleString('en-US')}M`,
            },
          ]
        : [],
    };
  }

  function showArrowTooltip(
    index: number,
    clientX: number,
    clientY: number
  ): void {
    const arrow = migrationData.arrows[index];
    if (!arrow) return;
    const fromName = GOVERNORATE_NAMES_AR.get(arrow.fromId) ?? arrow.fromId;
    const toName = GOVERNORATE_NAMES_AR.get(arrow.toId) ?? arrow.toId;
    const position = clampTip(clientX, clientY);
    tooltip = {
      ...position,
      title: 'نزوح داخلي',
      kicker: `${fromName} ← ${toName}`,
      tone: 'var(--color-wheat-gold)',
      rows: [
        { label: 'الدورات السابقة', value: formatPeople(arrow.history) },
        { label: 'المتوقع هذا الدور', value: formatPeople(arrow.predicted) },
      ],
    };
  }

  function clearTooltip(): void {
    tooltip = null;
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  function activateGovernorate(govId: string): void {
    if (selectedId === govId) {
      uiStore.selectGovernorate(null);
      if ($uiStore.activeCommandPanel === 'provincial') uiStore.closeCommandPanel();
    } else {
      uiStore.selectGovernorate(govId);
    }
  }

  function clearSelection(): void {
    uiStore.selectGovernorate(null);
    uiStore.closeCommandPanel();
  }

  // ── Zoom helpers ───────────────────────────────────────────────────────────
  function clampPan(): void {
    const maxX = ((zoom - 1) * boxW) / 2;
    const maxY = ((zoom - 1) * boxH) / 2;
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
  }

  /** Zoom keeping the content point under (px, py) fixed on screen. */
  function zoomAt(px: number, py: number, nextZoom: number): void {
    const z2 = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    if (Math.abs(z2 - zoom) < 0.0001) return;
    const cx = boxW / 2;
    const cy = boxH / 2;
    // content-space point that currently sits under the pointer
    const sx = cx + (px - cx - panX) / zoom;
    const sy = cy + (py - cy - panY) / zoom;
    zoom = z2;
    panX = px - cx - (sx - cx) * z2;
    panY = py - cy - (sy - cy) * z2;
    if (z2 <= MIN_ZOOM) {
      panX = 0;
      panY = 0;
    } else {
      clampPan();
    }
  }

  function stepZoom(delta: number): void {
    const next = Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta)) * 100) / 100;
    zoomAt(boxW / 2, boxH / 2, next);
  }

  function resetZoom(): void {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  function onWheel(event: WheelEvent): void {
    if (!boxW || !boxH) return;
    event.preventDefault();
    const rect = mapBoxEl?.getBoundingClientRect();
    if (!rect) return;
    const factor = Math.exp(-event.deltaY * 0.0015);
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, zoom * factor);
  }

  // ── Pointer interaction: drag / pinch / tap ────────────────────────────────
  const pointers = new Map<number, { x: number; y: number }>();
  let dragStart: { x: number; y: number; panX: number; panY: number } | null = null;
  let dragMoved = 0;
  /** Tap tolerance: a finger wobbles more than a mouse before/after a press. */
  let clickDrift = 5;
  let downGovId: string | null = null;
  let downArrowIndex: number | null = null;
  let pinchStart: {
    dist: number;
    zoom: number;
    sx: number;
    sy: number;
    midX: number;
    midY: number;
  } | null = null;
  let pinchActive = false;

  function pointerDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function pointerMidpoint(): { x: number; y: number } {
    const list = [...pointers.values()];
    return {
      x: (list[0].x + list[1].x) / 2,
      y: (list[0].y + list[1].y) / 2,
    };
  }

  function beginPinch(): void {
    if (pointers.size !== 2) return;
    const rect = mapBoxEl?.getBoundingClientRect();
    if (!rect || !boxW || !boxH) return;
    const mid = pointerMidpoint();
    const localX = mid.x - rect.left;
    const localY = mid.y - rect.top;
    const cx = boxW / 2;
    const cy = boxH / 2;
    pinchStart = {
      dist: Math.max(1, pointerDistance([...pointers.values()][0], [...pointers.values()][1])),
      zoom,
      sx: cx + (localX - cx - panX) / zoom,
      sy: cy + (localY - cy - panY) / zoom,
      midX: localX,
      midY: localY,
    };
    pinchActive = true;
    dragStart = null;
    dragMoved = 99;
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as Element | null;
    downGovId =
      target && typeof target.closest === 'function'
        ? (target.closest('[data-gov-id]') as Element | null)?.getAttribute('data-gov-id') ?? null
        : null;
    const arrowEl =
      target && typeof target.closest === 'function'
        ? (target.closest('[data-mig-index]') as Element | null)
        : null;
    downArrowIndex = arrowEl ? Number(arrowEl.getAttribute('data-mig-index')) : null;

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try {
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    } catch {
      /* synthetic/ended pointer: capture is an enhancement, not required */
    }

    if (pointers.size === 1) {
      dragStart = { x: event.clientX, y: event.clientY, panX, panY };
      dragMoved = 0;
      clickDrift = event.pointerType === 'touch' ? 12 : 4;
      pinchActive = false;
      pinchStart = null;
    } else if (pointers.size === 2) {
      beginPinch();
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (pointers.has(event.pointerId)) {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pinchActive && pointers.size >= 2 && pinchStart) {
      const rect = mapBoxEl?.getBoundingClientRect();
      if (!rect) return;
      const [a, b] = [...pointers.values()];
      const dist = Math.max(1, pointerDistance(a, b));
      const mid = pointerMidpoint();
      const nextZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, pinchStart.zoom * (dist / pinchStart.dist))
      );
      zoom = nextZoom;
      const cx = boxW / 2;
      const cy = boxH / 2;
      panX = mid.x - rect.left - cx - (pinchStart.sx - cx) * nextZoom;
      panY = mid.y - rect.top - cy - (pinchStart.sy - cy) * nextZoom;
      if (nextZoom <= MIN_ZOOM) {
        panX = 0;
        panY = 0;
      } else {
        clampPan();
      }
      event.preventDefault();
      return;
    }

    if (dragStart && pointers.size === 1 && event.pointerType !== 'touch') {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      dragMoved = Math.max(dragMoved, Math.hypot(dx, dy));
      if (dragMoved > 4 && zoom > 1) {
        panX = dragStart.panX + dx;
        panY = dragStart.panY + dy;
        clampPan();
      }
    } else if (dragStart && pointers.size === 1) {
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      dragMoved = Math.max(dragMoved, Math.hypot(dx, dy));
      if (dragMoved > 6 && zoom > 1) {
        panX = dragStart.panX + dx;
        panY = dragStart.panY + dy;
        clampPan();
      }
    }

    if (event.pointerType === 'touch' || pinchActive || dragMoved > 4) return;

    // Hover feedback (desktop): province path or migration arrow.
    const target = event.target as Element | null;
    if (!target || typeof target.closest !== 'function') return;
    const arrowEl = target.closest('[data-mig-index]');
    if (arrowEl) {
      hoveredId = null;
      showArrowTooltip(Number(arrowEl.getAttribute('data-mig-index')), event.clientX, event.clientY);
      return;
    }
    const govEl = target.closest('[data-gov-id]');
    const govId = govEl?.getAttribute('data-gov-id') ?? null;
    if (govId) {
      hoveredId = govId;
      showGovernorateTooltip(govId, event.clientX, event.clientY);
    } else {
      hoveredId = null;
      clearTooltip();
    }
  }

  function onPointerUp(event: PointerEvent): void {
    const wasPinch = pinchActive;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinchActive = false;
      pinchStart = null;
    }

    if (!wasPinch && dragMoved <= clickDrift) {
      if (downGovId) {
        activateGovernorate(downGovId);
        clearTooltip();
      } else if (downArrowIndex !== null && Number.isFinite(downArrowIndex)) {
        // Tap an arrow on touch: show its tooltip without deselecting.
        showArrowTooltip(downArrowIndex, event.clientX, event.clientY);
      } else {
        clearSelection();
        clearTooltip();
      }
    }

    if (pointers.size === 0) {
      dragStart = null;
      dragMoved = 0;
      downGovId = null;
      downArrowIndex = null;
    }
  }

  function onPointerCancel(event: PointerEvent): void {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinchActive = false;
      pinchStart = null;
    }
    if (pointers.size === 0) {
      dragStart = null;
      dragMoved = 0;
      downGovId = null;
      downArrowIndex = null;
    }
  }

  function onPointerLeave(): void {
    if (pointers.size === 0) {
      hoveredId = null;
      clearTooltip();
    }
  }

  function onKeydown(event: KeyboardEvent): void {
    const ids = SYRIA_2D_GOVERNORATES.map((g) => g.id);
    if (event.key === 'Escape') {
      hoveredId = null;
      clearTooltip();
      clearSelection();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.target !== event.currentTarget) return;
      const anchor = hoveredId ?? selectedId;
      if (anchor) {
        activateGovernorate(anchor);
        event.preventDefault();
      }
      return;
    }
    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown'
    ) {
      const anchor = hoveredId ?? selectedId;
      const idx = anchor ? ids.indexOf(anchor) : -1;
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const next = ids[(idx + (forward ? 1 : -1) + ids.length) % ids.length];
      hoveredId = next;
      clearTooltip();
      event.preventDefault();
    }
  }

  // ── Presentation helpers ───────────────────────────────────────────────────
  const MODE_STACK_STYLE = $derived(
    layout === 'desktop'
      ? 'left:50%;transform:translateX(-50%);top:12px;'
      : layout === 'phone-l'
        ? 'right:66px;top:6px;'
        : 'left:8px;top:8px;'
  );
  const ZOOM_STACK_STYLE = $derived(
    layout === 'phone-l'
      ? 'inset-inline-end:74px;bottom:8px;'
      : layout === 'phone-p'
        ? 'inset-inline-end:10px;bottom:76px;'
        : 'inset-inline-end:10px;bottom:112px;'
  );
  const MAP_BOX_STYLE = $derived(
    layout === 'phone-p'
      ? 'top:88px;bottom:auto;height:calc(100vw * 0.88);inset-inline-start:0;inset-inline-end:0;'
      : `top:0;bottom:${layout === 'phone-l' ? '8px' : '104px'};inset-inline-start:${
          layout === 'phone-l' ? '66px' : '0px'
        };inset-inline-end:0;`
  );
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -- map viewport is a keyboard-navigable region (arrows/Enter/Escape); every province is also a focusable button. -->
<div
  bind:this={stageEl}
  class="map-root relative h-full w-full touch-none select-none overflow-hidden bg-(--map-canvas) font-arabic"
  role="region"
  tabindex="0"
  aria-label="الخارطة الاستراتيجية للجمهورية العربية السورية"
  onkeydown={onKeydown}
>
  <!-- Sea, grid & atmospheric vignette -->
  <div class="pointer-events-none absolute inset-0 map-sea" aria-hidden="true"></div>
  <div class="pointer-events-none absolute inset-0 map-grid" aria-hidden="true"></div>

  <!-- The SVG stage keeps its viewBox; zoom/pan are pure CSS transforms. -->
  <div
    bind:this={mapBoxEl}
    class="absolute overflow-hidden"
    style={MAP_BOX_STYLE}
    bind:clientWidth={boxW}
    bind:clientHeight={boxH}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerCancel}
    onpointerleave={onPointerLeave}
    onwheel={onWheel}
    role="presentation"
  >
    <svg
      viewBox={SYRIA_2D_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      class="map-svg block h-full w-full"
      style="transform: translate3d({panX}px, {panY}px, 0) scale({zoom}); transform-origin: 50% 50%;"
    >
      <defs>
        <marker
          id="mig-head-hist"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="15"
          markerHeight="15"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--map-arrow-hist)" opacity="0.8" />
        </marker>
        <marker
          id="mig-head-pred"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="15"
          markerHeight="15"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--map-arrow-pred)" opacity="0.85" />
        </marker>
      </defs>
      <!-- Neighbour labels & sea name -->
      <g class="map-context" aria-hidden="true">
        {#each REGION_NEAR as region (region.id)}
          {@const at = region.id === 'turkiye' ? [300, 110] : region.labelAt}
          <text class="map-country" x={at[0]} y={at[1]} text-anchor="middle">{region.nameAr}</text>
        {/each}
        {#each REGION_FAR_LABELS as region (region.id)}
          <text class="map-country map-country-far" x={region.labelAt[0]} y={region.labelAt[1]} text-anchor="middle">{region.nameAr}</text>
        {/each}
        <text
          class="map-sea-label"
          x="38"
          y="400"
          text-anchor="middle"
          transform="rotate(-90 38 400)"
        >البحر المتوسط</text>
        <g transform="translate(946,790)" opacity="0.8">
          <circle class="map-compass-ring" r="20" />
          <circle class="map-compass-ring" r="14" opacity="0.5" />
          <path d="M0 -12 L4.4 6 L0 2.6 L-4.4 6 Z" fill="var(--color-wheat-gold)" opacity="0.7" />
          <text class="map-compass-n" y="-26">ش</text>
        </g>
      </g>

      <!-- Base shadow silhouette -->
      <g class="map-shadow" aria-hidden="true">
        {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
          <path d={gov.path} fill="var(--map-shadow)" />
        {/each}
      </g>

      <!-- Governorates: fill = active layer value, gold outline when selected -->
      <g>
        {#each ordered as gov (gov.id)}
          {@const node = $gameStore.governorates[gov.id]}
          {@const isSelected = selectedId === gov.id}
          {@const isHovered = hoveredId === gov.id}
          <path
            d={gov.path}
            fill={fillFor(node)}
            stroke={isSelected ? 'var(--color-wheat-gold)' : isHovered ? 'var(--color-wheat-light)' : 'var(--map-ink)'}
            stroke-width={isSelected ? 2.6 : isHovered ? 2 : 1.1}
            stroke-linejoin="round"
            stroke-linecap="round"
            fill-opacity={selectedId && !isSelected ? 0.9 : 1}
            class="map-prov {isSelected ? 'is-selected' : ''} {isHovered ? 'is-hovered' : ''}"
            data-gov-id={gov.id}
            role="button"
            tabindex="0"
            aria-label={ariaFor(gov)}
            aria-pressed={isSelected}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
                event.preventDefault();
                activateGovernorate(gov.id);
              }
            }}
            onfocus={() => (hoveredId = gov.id)}
            onblur={() => (hoveredId = null)}
          ></path>
        {/each}
      </g>

      <!-- Selected province halo -->
      {#if selectedId}
        {@const selectedGov = SYRIA_2D_GOVERNORATES.find((g) => g.id === selectedId)}
        {#if selectedGov}
          <circle
            class="map-sel-halo"
            cx={selectedGov.center[0]}
            cy={selectedGov.center[1]}
            r="30"
            fill="none"
          />
        {/if}
      {/if}

      <!-- Internal migration arrows: solid = past turns, dashed = projected -->
      {#if $uiStore.showMigrationArrows && migrationData.arrows.length > 0}
        <g>
          {#each migrationData.arrows as arrow, index (`${arrow.fromId}>${arrow.toId}`)}
            {#if arrow.history > 0}
              <path
                d={arrow.d}
                fill="none"
                stroke="var(--map-arrow-hist)"
                stroke-width={arrow.width}
                opacity="0.32"
                stroke-linecap="round"
                marker-end="url(#mig-head-hist)"
                class="map-arrow"
              />
            {/if}
            {#if arrow.predicted > 0}
              <path
                d={arrow.d}
                fill="none"
                stroke="var(--map-arrow-pred)"
                stroke-width={arrow.width}
                opacity="0.6"
                stroke-linecap="round"
                stroke-dasharray="5 5"
                marker-end="url(#mig-head-pred)"
                class="map-arrow"
              />
            {/if}
            <!-- transparent wide hit-ribbon for the arrow tooltip -->
            <path
              d={arrow.d}
              fill="none"
              stroke="transparent"
              stroke-width="14"
              stroke-linecap="round"
              data-mig-index={index}
              class="map-arrow-hit"
            />
          {/each}
        </g>
      {/if}
    </svg>

    <!-- Screen-constant numeric badges + province names (HTML overlay) -->
    <div class="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {#each markers as marker (marker.gov.id)}
        {@const onScreen =
          marker.x > -32 && marker.y > -32 && marker.x < boxW + 32 && marker.y < boxH + 32}
        {#if onScreen}
          <div
            class="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style="left:{marker.x}px;top:{marker.y}px;"
          >
            <span
              class="map-badge {marker.isSelected ? 'is-selected' : ''}"
              style="--tone:{marker.tone};"
              title={marker.nameAr}
              dir="ltr"
            >
              <span>{marker.value}</span>{#if marker.suffix}<small>{marker.suffix}</small>{/if}
            </span>
            {#if layout === 'desktop'}
              <span class="map-prov-name">{marker.nameAr}</span>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Map layer switch (top-centre on desktop, compact row under the bar on phones) -->
  <div
    class="pointer-events-auto absolute z-20 flex flex-col gap-1.5"
    style={MODE_STACK_STYLE}
    role="group"
    aria-label="طبقات الخارطة"
  >
    <div class="flex items-stretch gap-0.5 border border-wheat-mid/20 bg-forest-deep/92 p-1 shadow-xl backdrop-blur-md shell-round-pop">
      {#each MAP_MODES as item (item.id)}
        <button
          type="button"
          onclick={() => (mode = item.id)}
          aria-pressed={mode === item.id}
          title={`طبقة ${item.labelAr}`}
          class="flex min-h-11 items-center gap-1.5 px-2 text-[10.5px] font-bold transition-colors shell-round-item phone-p:px-1.5 phone-p:text-[9.5px] {mode === item.id
            ? 'bg-forest-accent/15 text-forest-accent shadow-[inset_0_0_0_1px_rgba(78,199,180,0.24)]'
            : 'text-wheat-dark hover:bg-wheat-light/5 hover:text-wheat-light'}"
        >
          <span
            class="h-1.5 w-1.5 shrink-0"
            style="background:{item.legend[1].color};border-radius:2px !important;"
            aria-hidden="true"
          ></span>
          <span class="whitespace-nowrap font-heading">{item.labelAr}</span>
        </button>
      {/each}
    </div>

    <div
      class="flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 border border-wheat-mid/10 bg-forest-deep/72 px-2 py-1.5 text-[9px] text-wheat-dark backdrop-blur-sm shell-round-pop"
      aria-label={`مفتاح طبقة ${activeMode.labelAr}`}
    >
      {#each activeMode.legend as entry (entry.label)}
        <span class="flex items-center gap-1 whitespace-nowrap">
          <i
            class="h-2.5 w-2.5 shrink-0"
            style="background:{entry.color};border-radius:2px !important;"
            aria-hidden="true"
          ></i>
          <span dir="ltr">{entry.label}</span>
        </span>
      {/each}
    </div>

    {#if layout === 'desktop'}
      <div class="px-0.5 text-[9px] tracking-[1.6px] text-wheat-mid/45">
        سوريا · <b class="font-normal text-wheat-mid">14 محافظة</b> · طبقة {activeMode.labelAr}
      </div>
    {/if}
  </div>

  <!-- Zoom / pan controls (44px targets) -->
  <div
    class="pointer-events-auto absolute z-20 flex flex-col gap-1"
    style={ZOOM_STACK_STYLE}
    role="group"
    aria-label="تكبير وتحريك الخارطة"
  >
    <button
      type="button"
      onclick={() => stepZoom(0.35)}
      disabled={zoom >= MAX_ZOOM}
      aria-label="تكبير الخارطة"
      title="تكبير الخارطة"
      class="flex h-11 w-11 items-center justify-center border border-wheat-mid/20 bg-forest-deep/90 font-mono text-lg font-bold text-wheat-mid shadow-lg backdrop-blur-md transition-colors hover:bg-forest-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40 shell-round-item"
    >+</button>
    <button
      type="button"
      onclick={() => stepZoom(-0.35)}
      disabled={zoom <= MIN_ZOOM}
      aria-label="تصغير الخارطة"
      title="تصغير الخارطة"
      class="flex h-11 w-11 items-center justify-center border border-wheat-mid/20 bg-forest-deep/90 font-mono text-lg font-bold text-wheat-mid shadow-lg backdrop-blur-md transition-colors hover:bg-forest-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40 shell-round-item"
    >−</button>
    <button
      type="button"
      onclick={resetZoom}
      disabled={zoom <= MIN_ZOOM}
      aria-label="إعادة ضبط الخارطة"
      title="إعادة ضبط الخارطة"
      class="flex h-11 w-11 items-center justify-center border border-wheat-mid/20 bg-forest-deep/90 text-base font-bold text-wheat-mid shadow-lg backdrop-blur-md transition-colors hover:bg-forest-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40 shell-round-item"
    >⟲</button>
  </div>

  <!-- Hover / tap tooltip -->
  {#if tooltip}
    <div
      class="pointer-events-none absolute z-30 w-[216px] border border-wheat-mid/25 bg-charcoal-deep/97 px-2.5 py-2 shadow-2xl backdrop-blur-md shell-round-pop"
      style="left:{tooltip.x}px;top:{tooltip.y}px;"
      role="status"
    >
      <div class="flex items-start justify-between gap-2">
        <span class="font-heading text-[13px] font-semibold text-wheat-light">{tooltip.title}</span>
        <span class="shrink-0 text-[8.5px]" style="color:{tooltip.tone};">{tooltip.kicker}</span>
      </div>
      {#if tooltip.rows.length > 0}
        <div class="mt-1.5 space-y-0.5 border-t border-wheat-mid/10 pt-1.5">
          {#each tooltip.rows as row (row.label)}
            <div class="flex items-baseline justify-between gap-3 text-[9.5px]">
              <span class="text-wheat-dark">{row.label}</span>
              <b dir="ltr" class="font-mono font-semibold text-wheat-mid">{row.value}</b>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- CRT tube glass (the settings toggle owns uiStore.crtTube) -->
  {#if $uiStore.crtTube}
    <div class="map-crt pointer-events-none absolute inset-0 z-[15]" aria-hidden="true"></div>
  {/if}
</div>

<style>
  /* ── Sea + grid backdrop ─────────────────────────────────────────────── */
  .map-sea {
    background:
      radial-gradient(
        ellipse 65% 55% at 52% 44%,
        rgb(from var(--color-forest-accent) r g b / 0.07),
        transparent 62%
      ),
      radial-gradient(
        ellipse 60% 40% at 50% 110%,
        rgb(from var(--color-wheat-gold) r g b / 0.055),
        transparent 60%
      );
  }
  .map-grid {
    background-image:
      linear-gradient(rgb(from var(--map-grid) r g b / 0.032) 1px, transparent 1px),
      linear-gradient(90deg, rgb(from var(--map-grid) r g b / 0.032) 1px, transparent 1px);
    background-size: 64px 64px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 50%, #000 10%, transparent 72%);
    mask-image: radial-gradient(ellipse at 50% 50%, #000 10%, transparent 72%);
  }
  .map-svg {
    filter: drop-shadow(0 22px 46px rgb(0 0 0 / 0.5));
    will-change: transform;
  }

  /* ── SVG map text & chrome ───────────────────────────────────────────── */
  .map-country {
    font-family: var(--font-arabic);
    font-size: 15px;
    letter-spacing: 3px;
    fill: var(--color-wheat-dark);
    opacity: 0.45;
    pointer-events: none;
  }
  .map-country-far {
    opacity: 0.22;
  }
  .map-sea-label {
    font-family: var(--font-arabic);
    font-size: 12px;
    letter-spacing: 2px;
    fill: var(--color-forest-accent);
    opacity: 0.28;
    pointer-events: none;
  }
  .map-compass-ring {
    fill: none;
    stroke: rgb(from var(--color-wheat-mid) r g b / 0.22);
    stroke-width: 1;
  }
  .map-compass-n {
    font-family: var(--font-arabic);
    font-size: 10px;
    fill: var(--color-wheat-mid);
    opacity: 0.6;
    text-anchor: middle;
  }
  .map-shadow {
    opacity: 0.3;
    pointer-events: none;
    transform: translate(1px, 6px);
  }

  /* ── Province shapes ─────────────────────────────────────────────────── */
  .map-prov {
    cursor: pointer;
    transition: filter 0.16s ease, fill-opacity 0.16s ease;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .map-prov:focus-visible {
    stroke: var(--color-wheat-gold);
    stroke-width: 2.4;
  }
  .map-prov.is-hovered {
    filter: brightness(1.22);
  }
  .map-prov.is-selected {
    filter: brightness(1.12)
      drop-shadow(0 0 5px rgb(from var(--color-wheat-gold) r g b / 0.65));
  }
  .map-sel-halo {
    stroke: var(--color-wheat-gold);
    opacity: 0.55;
    stroke-width: 1.2;
    stroke-dasharray: 4 6;
    pointer-events: none;
  }
  .map-arrow {
    pointer-events: none;
  }
  .map-arrow-hit {
    cursor: help;
  }

  /* ── Screen-constant province badges ─────────────────────────────────── */
  .map-badge {
    display: inline-flex;
    min-width: 29px;
    height: 28px;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 0 6px;
    border: 1.5px solid var(--tone, var(--color-wheat-gold));
    border-radius: 999px !important;
    background: rgb(from var(--color-charcoal-deep) r g b / 0.94);
    box-shadow: 0 3px 10px rgb(0 0 0 / 0.45);
    color: var(--color-wheat-light);
    font-family: var(--font-heading);
    font-size: 11.5px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }
  .map-badge small {
    margin-inline-start: 1px;
    font-family: var(--font-arabic);
    font-size: 8px;
    font-weight: 400;
    opacity: 0.8;
  }
  .map-badge.is-selected {
    border-color: var(--color-wheat-gold);
    background: color-mix(in srgb, var(--color-forest-mid) 82%, black);
    box-shadow:
      0 0 0 3px rgb(from var(--color-wheat-gold) r g b / 0.22),
      0 3px 12px rgb(0 0 0 / 0.5);
  }
  .map-prov-name {
    max-width: 112px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: rgb(from var(--color-wheat-mid) r g b / 0.85);
    font-family: var(--font-heading);
    font-size: 9.5px;
    line-height: 1.1;
    text-shadow:
      0 1px 3px rgb(0 0 0 / 0.9),
      0 0 8px rgb(0 0 0 / 0.6);
  }

  /* ── CRT glass ───────────────────────────────────────────────────────── */
  .map-crt {
    background:
      repeating-linear-gradient(
        to bottom,
        rgb(0 0 0 / 0.16) 0px,
        rgb(0 0 0 / 0.16) 1px,
        transparent 1px,
        transparent 3px
      ),
      repeating-linear-gradient(
        90deg,
        rgb(255 255 255 / 0.018) 0px,
        rgb(255 255 255 / 0.018) 1px,
        transparent 1px,
        transparent 3px
      );
    mix-blend-mode: multiply;
  }
  .map-crt::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 50%, transparent 55%, rgb(4 10 9 / 0.5) 100%);
  }

  @media (prefers-reduced-motion: no-preference) {
    .map-badge {
      transition: border-color 0.16s ease, box-shadow 0.16s ease;
    }
  }

  /* app.css's `* { border-radius: 0 !important }` lives in the `base` layer;
     layered important declarations beat unlayered ones, so Concept D's rounded
     map chrome is re-declared inside that layer with higher specificity. */
  @layer base {
    .map-root .map-badge {
      border-radius: 999px !important;
    }
    .map-root :global(.shell-round-pop) {
      border-radius: 12px !important;
    }
    .map-root :global(.shell-round-item) {
      border-radius: 9px !important;
    }
  }
</style>
