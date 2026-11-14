<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { gameStore } from '../../stores/game-store';
  import { projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import {
    SYRIA_2D_GOVERNORATES,
    SYRIA_2D_VIEWBOX,
    type Syria2DGovernorate,
  } from '../../spatial3d/syria-2d-paths';
  import {
    REGION_NEAR,
    REGION_FAR_LABELS,
  } from '../../spatial3d/syria-region-context';
  import { shellLayout } from '../shell/viewport';
  import {
    governorateDamagePct,
    governoratePowerHours,
    MAP_MODES,
    modeBadge,
    modeById,
    modeSeverity,
    modeValue,
    tierDisplay,
    type MapModeId,
  } from './map-modes';
  import {
    buildMigrationArrows,
    formatPeople,
    GOVERNORATE_NAMES_AR,
  } from './migration-arrows';
  import {
    computeCenterOnPoint,
    computeFitTransform,
    computeFocusTransform,
    computePlayfieldInsets,
    VIEW_H,
    VIEW_W,
  } from './map-viewport';
  import { focusGovernorate, mapFocus } from './map-focus';
  import type { GovernorateNode } from '../../engine/types';

  import { fx, type FxKind } from '../fx/feedback';

  function triggerFx(kind: FxKind): void {
    try {
      fx(kind);
    } catch {
      /* never fail on fx */
    }
  }

  // ── Shell layout ───────────────────────────────────────────────────────────
  let layout = $derived($shellLayout);
  let isPhone = $derived(layout !== 'desktop');
  let isPortrait = $derived(layout === 'phone-p');

  // ── Active map layer ───────────────────────────────────────────────────────
  // `?mapmode=power|damage|mines` is a capture helper so screenshots can show
  // each layer directly without input.
  function initialMode(): MapModeId {
    if (typeof window === 'undefined') return 'unrest';
    const requested = new URLSearchParams(window.location.search).get('mapmode');
    return MAP_MODES.some((item) => item.id === requested)
      ? (requested as MapModeId)
      : 'unrest';
  }
  let mode = $state<MapModeId>(initialMode());
  let activeMode = $derived(modeById(mode));
  let modeBarH = $state(0);
  let legendH = $state(0);
  let legendW = $state(0);

  function cycleMode(): void {
    const idx = MAP_MODES.findIndex((item) => item.id === mode);
    const next = MAP_MODES[(idx + 1) % MAP_MODES.length];
    if (next) selectMode(next.id);
  }

  // ── Event focus (`$mapFocus`) & dev hook `?play=1&focus=<govId>` ───────────
  let focusTarget = $derived($mapFocus);
  let focusedGovId = $derived(focusTarget?.govId ?? null);
  let isFocused = $derived(focusTarget !== null);

  onMount(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const play = params.get('play') === '1';
    const focusParam = params.get('focus');
    if (play && focusParam && SYRIA_2D_GOVERNORATES.some((g) => g.id === focusParam)) {
      focusGovernorate(focusParam);
    }
    const onCycleMode = (): void => cycleMode();
    window.addEventListener('oc:cycle-map-mode', onCycleMode);
    return () => {
      window.removeEventListener('oc:cycle-map-mode', onCycleMode);
    };
  });

  // ── Selection / hover / tap ripples ────────────────────────────────────────
  let hoveredId = $state<string | null>(null);
  let selectedId = $derived($uiStore.selectedGovernorateId);

  interface TapRipple {
    id: number;
    x: number;
    y: number;
    tone: string;
  }
  let ripples = $state<TapRipple[]>([]);
  let nextRippleId = 1;

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
    footer?: string;
  }
  let tooltip = $state<TooltipState | null>(null);

  // ── Sheet awareness (`--shell-sheet-h` on <html> & landscape dialog overlap) ──
  let isProvinceSheetOpen = $derived($uiStore.activeCommandPanel === 'provincial');
  let anySheetOpen = $derived(
    $uiStore.activeCommandPanel !== null || $uiStore.isStatsSidebarOpen
  );
  let rawSheetH = $state(0);
  let rawLandscapeLeft = $state(0);
  let rawLandscapeRight = $state(0);
  let sheetH = $derived(
    layout === 'phone-p' && anySheetOpen && rawSheetH > 0 ? rawSheetH : 0
  );
  let provinceSheetH = $derived(isProvinceSheetOpen ? sheetH : 0);
  let landscapeSheetLeft = $derived(
    layout === 'phone-l' && isProvinceSheetOpen ? rawLandscapeLeft : 0
  );
  let landscapeSheetRight = $derived(
    layout === 'phone-l' && isProvinceSheetOpen ? rawLandscapeRight : 0
  );

  function readRawSheetHeight(): number {
    if (typeof document === 'undefined' || layout !== 'phone-p') return 0;
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--shell-sheet-h')
      .trim();
    if (raw !== '') {
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }
    const sheetOpen = $uiStore.activeCommandPanel !== null || $uiStore.isStatsSidebarOpen;
    if (!sheetOpen) return 0;
    const dialog = document.querySelector('[role="dialog"]');
    return dialog ? Math.max(0, dialog.getBoundingClientRect().height) : 0;
  }

  function readLandscapeSheetOverlap(): { left: number; right: number } {
    if (
      typeof document === 'undefined' ||
      layout !== 'phone-l' ||
      !isProvinceSheetOpen ||
      !mapBoxEl
    ) {
      return { left: 0, right: 0 };
    }
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { left: 0, right: 0 };
    const mapRect = mapBoxEl.getBoundingClientRect();
    const dlgRect = dialog.getBoundingClientRect();
    if (dlgRect.width <= 0 || mapRect.width <= 0) return { left: 0, right: 0 };
    if (dlgRect.left <= mapRect.left + 8 && dlgRect.right > mapRect.left) {
      return { left: Math.max(0, Math.round(dlgRect.right - mapRect.left)), right: 0 };
    }
    if (dlgRect.right >= mapRect.right - 8 && dlgRect.left < mapRect.right) {
      return { left: 0, right: Math.max(0, Math.round(mapRect.right - dlgRect.left)) };
    }
    return { left: 0, right: 0 };
  }

  function syncSheetState(): void {
    rawSheetH = readRawSheetHeight();
    const overlap = readLandscapeSheetOverlap();
    rawLandscapeLeft = overlap.left;
    rawLandscapeRight = overlap.right;
  }

  onMount(() => {
    syncSheetState();
    const observer = new MutationObserver(syncSheetState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    window.addEventListener('resize', syncSheetState);
    window.addEventListener('orientationchange', syncSheetState);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncSheetState);
      window.removeEventListener('orientationchange', syncSheetState);
    };
  });

  // Re-sync sheet dimensions whenever panel open state, layout, or map viewport settles.
  $effect(() => {
    void $uiStore.activeCommandPanel;
    void $uiStore.isStatsSidebarOpen;
    void layout;
    void boxW;
    void boxH;
    syncSheetState();
    if (typeof requestAnimationFrame === 'undefined') return;
    const raf = requestAnimationFrame(syncSheetState);
    return () => cancelAnimationFrame(raf);
  });

  // ── Auto-fit + sheet-aware framing + event-focus animation ─────────────────
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let boxW = $state(0);
  let boxH = $state(0);
  let stageEl = $state<HTMLDivElement | null>(null);
  let mapBoxEl = $state<HTMLDivElement | null>(null);

  let showLegend = $derived(
    !isFocused && !(isPortrait && isProvinceSheetOpen && provinceSheetH > 0)
  );
  let activeLegendH = $derived(showLegend ? legendH : 0);

  let baseInsets = $derived(
    computePlayfieldInsets(
      layout,
      0,
      modeBarH,
      activeLegendH,
      landscapeSheetLeft,
      landscapeSheetRight
    )
  );
  let baseFit = $derived(computeFitTransform(boxW, boxH, baseInsets));
  let visibleInsets = $derived(
    computePlayfieldInsets(
      layout,
      provinceSheetH,
      modeBarH,
      activeLegendH,
      landscapeSheetLeft,
      landscapeSheetRight
    )
  );
  let visibleFit = $derived(computeFitTransform(boxW, boxH, visibleInsets));
  let baseScale = $derived(baseFit.baseScale);

  function prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
  }

  let animFrame: number | null = null;
  function cancelAnimation(): void {
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function animateTo(
    targetZoom: number,
    targetPanX: number,
    targetPanY: number,
    durationMs = 280
  ): void {
    cancelAnimation();
    if (
      durationMs <= 0 ||
      prefersReducedMotion() ||
      typeof requestAnimationFrame === 'undefined'
    ) {
      zoom = targetZoom;
      panX = targetPanX;
      panY = targetPanY;
      return;
    }

    const startZ = zoom;
    const startX = panX;
    const startY = panY;
    let startTime: number | null = null;

    const step = (now: number): void => {
      if (startTime === null) startTime = now;
      const elapsed = Math.max(0, now - startTime);
      const t = Math.max(0, Math.min(1, elapsed / durationMs));
      const ease = 1 - Math.pow(1 - t, 3);
      zoom = startZ + (targetZoom - startZ) * ease;
      panX = startX + (targetPanX - startX) * ease;
      panY = startY + (targetPanY - startY) * ease;
      if (t < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        animFrame = null;
      }
    };
    animFrame = requestAnimationFrame(step);
  }

  onMount(() => () => cancelAnimation());

  // Auto-fit on mount, resize, orientation/layout change, docked panel change,
  // portrait sheet open/close, and event focus.
  const mountAt = typeof performance !== 'undefined' ? performance.now() : 0;
  let hasInitializedFit = false;
  let prevLayout: string | null = null;
  let prevWinW = 0;
  let prevWinH = 0;
  let prevBoxW = 0;
  let prevBoxH = 0;
  let prevBaseScale = 0;
  let prevSheetH = 0;
  let prevLandscapeOverlap = 0;
  let prevModeBarH = 0;
  let prevLegendH = 0;
  let prevFocusGovId: string | null = null;

  function rebaseForBoxChange(newW: number, newH: number, newBaseScale: number): void {
    if (prevBoxW <= 0 || prevBoxH <= 0 || prevBaseScale <= 0 || newBaseScale <= 0) return;
    const isRtl =
      stageEl && typeof getComputedStyle === 'function'
        ? getComputedStyle(stageEl).direction === 'rtl'
        : true;
    zoom = (prevBaseScale * zoom) / newBaseScale;
    if (isRtl) {
      const distFromRight = prevBoxW / 2 - panX;
      panX = newW / 2 - distFromRight;
    } else {
      const distFromLeft = prevBoxW / 2 + panX;
      panX = distFromLeft - newW / 2;
    }
    panY = panY + (prevBoxH - newH) / 2;
  }

  $effect(() => {
    const w = boxW;
    const h = boxH;
    const curLayout = layout;
    const curSheet = provinceSheetH;
    const curLandscapeOverlap = landscapeSheetLeft + landscapeSheetRight;
    const curProvOpen = isProvinceSheetOpen;
    const curAnySheet = anySheetOpen;
    const curSel = selectedId;
    const curModeBarH = modeBarH;
    const curLegendH = activeLegendH;
    const curFocusId = focusedGovId;
    const fit = baseFit;
    const vis = visibleFit;
    if (w <= 0 || h <= 0 || fit.baseScale <= 0) return;

    const winW = typeof window !== 'undefined' ? window.innerWidth : w;
    const winH = typeof window !== 'undefined' ? window.innerHeight : h;
    const winResized =
      prevWinW > 0 &&
      prevWinH > 0 &&
      (Math.abs(winW - prevWinW) > 1 || Math.abs(winH - prevWinH) > 1);
    const layoutChanged = prevLayout !== null && prevLayout !== curLayout;
    const boxChanged =
      prevBoxW > 0 &&
      prevBoxH > 0 &&
      (Math.abs(w - prevBoxW) > 1 || Math.abs(h - prevBoxH) > 1);
    const panelResizedBox = boxChanged && !winResized && !layoutChanged;
    const initialSettle =
      typeof performance === 'undefined' || performance.now() - mountAt < 300;
    const initialBarSettle = prevModeBarH === 0 && curModeBarH > 0;
    const initialLegendSettle = prevLegendH === 0 && curLegendH > 0 && initialSettle;
    const initialSheetSettle = prevSheetH === 0 && curSheet > 0 && initialSettle;
    const initialLandscapeSettle =
      prevLandscapeOverlap === 0 && curLandscapeOverlap > 0 && initialSettle;
    const nonProvSheetOnPortrait = curLayout === 'phone-p' && curAnySheet && !curProvOpen;

    untrack(() => {
      const hasSheetTarget =
        curLayout === 'phone-p' && curProvOpen && curSheet > 0 && Boolean(curSel);

      const sheetTargetTransform = (): { zoom: number; panX: number; panY: number } | null => {
        if (!hasSheetTarget || !curSel) return null;
        const gov = SYRIA_2D_GOVERNORATES.find((g) => g.id === curSel);
        if (!gov) return null;
        const target = computeCenterOnPoint(
          w,
          h,
          fit.baseScale,
          gov.center[0],
          gov.center[1],
          fit.fitZoom,
          vis.playCx,
          vis.playCy
        );
        return { zoom: fit.fitZoom, panX: target.panX, panY: target.panY };
      };

      const recordPrev = (focusId: string | null): void => {
        prevLayout = curLayout;
        prevWinW = winW;
        prevWinH = winH;
        prevBoxW = w;
        prevBoxH = h;
        prevBaseScale = fit.baseScale;
        prevSheetH = curSheet;
        prevLandscapeOverlap = curLandscapeOverlap;
        prevModeBarH = curModeBarH;
        prevLegendH = curLegendH;
        prevFocusGovId = focusId;
      };

      if (curFocusId) {
        hoveredId = null;
        clearTooltip();
        const focusGov = SYRIA_2D_GOVERNORATES.find((g) => g.id === curFocusId);
        if (!hasInitializedFit) {
          hasInitializedFit = true;
          if (focusGov) {
            const target = computeFocusTransform(w, h, fit, focusGov, curLayout);
            animateTo(target.zoom, target.panX, target.panY, 0);
          } else {
            animateTo(fit.fitZoom, fit.fitPanX, fit.fitPanY, 0);
          }
        } else if (curFocusId !== prevFocusGovId) {
          if (panelResizedBox) rebaseForBoxChange(w, h, fit.baseScale);
          if (focusGov) {
            const target = computeFocusTransform(w, h, fit, focusGov, curLayout);
            animateTo(target.zoom, target.panX, target.panY, winResized || layoutChanged ? 0 : 320);
          }
        } else if (
          layoutChanged ||
          winResized ||
          initialBarSettle ||
          initialLegendSettle ||
          boxChanged
        ) {
          if (focusGov) {
            const target = computeFocusTransform(w, h, fit, focusGov, curLayout);
            if (panelResizedBox && !initialSettle) {
              rebaseForBoxChange(w, h, fit.baseScale);
              animateTo(target.zoom, target.panX, target.panY, 260);
            } else {
              animateTo(target.zoom, target.panX, target.panY, 0);
            }
          }
        }
        recordPrev(curFocusId);
        return;
      }

      // Returning from event focus: animate smoothly back to resting view.
      if (prevFocusGovId !== null && !curFocusId) {
        if (panelResizedBox) rebaseForBoxChange(w, h, fit.baseScale);
        const sheetTarget = sheetTargetTransform();
        const dur = winResized || layoutChanged ? 0 : 300;
        if (sheetTarget) {
          animateTo(sheetTarget.zoom, sheetTarget.panX, sheetTarget.panY, dur);
        } else {
          animateTo(fit.fitZoom, fit.fitPanX, fit.fitPanY, dur);
        }
        recordPrev(null);
        return;
      }

      if (!hasInitializedFit) {
        hasInitializedFit = true;
        const sheetTarget = sheetTargetTransform();
        if (sheetTarget) {
          animateTo(sheetTarget.zoom, sheetTarget.panX, sheetTarget.panY, 0);
        } else {
          animateTo(fit.fitZoom, fit.fitPanX, fit.fitPanY, 0);
        }
      } else if (nonProvSheetOnPortrait && !layoutChanged && !winResized && !boxChanged) {
        // Non-province full-height sheet: leave the map viewport untouched.
        prevLayout = curLayout;
        prevWinW = winW;
        prevWinH = winH;
        prevBoxW = w;
        prevBoxH = h;
        prevBaseScale = fit.baseScale;
        prevModeBarH = curModeBarH;
        prevLegendH = curLegendH;
        prevFocusGovId = null;
        return;
      } else if (hasSheetTarget && curSel) {
        const sheetTarget = sheetTargetTransform();
        if (sheetTarget) {
          if (panelResizedBox && !initialSettle) {
            rebaseForBoxChange(w, h, fit.baseScale);
          }
          animateTo(
            sheetTarget.zoom,
            sheetTarget.panX,
            sheetTarget.panY,
            layoutChanged || winResized || initialBarSettle || initialSheetSettle ? 0 : 260
          );
        }
      } else {
        const sheetJustClosed = curLayout === 'phone-p' && prevSheetH > 0 && curSheet === 0;
        if (panelResizedBox && !initialSettle) {
          rebaseForBoxChange(w, h, fit.baseScale);
        }
        const snapNow =
          !sheetJustClosed &&
          (layoutChanged ||
            winResized ||
            initialBarSettle ||
            initialLegendSettle ||
            initialLandscapeSettle ||
            (initialSettle && !panelResizedBox));
        animateTo(fit.fitZoom, fit.fitPanX, fit.fitPanY, snapNow ? 0 : 260);
      }

      recordPrev(null);
    });
  });

  // ── Province markers ───────────────────────────────────────────────────────
  interface RectBox {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  function rectsOverlap(a: RectBox, b: RectBox, pad = 0): boolean {
    return (
      a.left - pad < b.right &&
      a.right + pad > b.left &&
      a.top - pad < b.bottom &&
      a.bottom + pad > b.top
    );
  }

  function overlapArea(a: RectBox, b: RectBox): number {
    const dx = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const dy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return dx * dy;
  }

  let desktopBadgeMetrics = $derived.by(() => {
    if (layout !== 'desktop' || baseScale <= 0) return null;
    const effScale = baseScale * zoom;
    const badgeH = Math.round(Math.max(26, Math.min(44, 15 + effScale * 18)));
    const badgeMinW = Math.round(badgeH * 1.25);
    const badgeFs = Math.round(badgeH * 0.48 * 2) / 2;
    const badgeSmallFs = Math.round(badgeH * 0.39 * 2) / 2;
    const badgePadX = Math.round(badgeH * 0.24);
    const nameFs = Math.round(Math.max(11.5, Math.min(15.5, 9 + effScale * 4.2)) * 2) / 2;
    const nameH = Math.round(nameFs * 1.45 + 6);
    return { badgeH, badgeMinW, badgeFs, badgeSmallFs, badgePadX, nameFs, nameH };
  });

  const DESKTOP_LABEL_PRIORITY: Record<string, number> = {
    damascus: 14,
    aleppo: 13,
    homs: 12,
    hama: 11,
    latakia: 10,
    idlib: 9,
    tartus: 8,
    deir_ez_zor: 7,
    raqqa: 6,
    hasakah: 5,
    rif_dimashq: 4,
    daraa: 3,
    as_suwayda: 2,
    quneitra: 1,
  };

  interface Marker {
    gov: Syria2DGovernorate;
    node: GovernorateNode | undefined;
    x: number;
    y: number;
    value: string;
    suffix: string;
    tone: string;
    isCrisis: boolean;
    isSelected: boolean;
    isFocusedGov: boolean;
    isDimmed: boolean;
    showName: boolean;
    nameAr: string;
    labelDx: number;
    labelAbove: boolean;
    badgeRect: RectBox;
  }

  let markers = $derived.by<Marker[]>(() => {
    if (!boxW || !boxH || baseScale <= 0) return [];
    const offsetX = (boxW - VIEW_W * baseScale) / 2;
    const offsetY = (boxH - VIEW_H * baseScale) / 2;
    const cx = boxW / 2;
    const cy = boxH / 2;
    const currentMode = mode;
    const mMetrics = desktopBadgeMetrics;
    // Slight nudge on phones keeps the tight southern cluster legible at rest,
    // and fades out automatically when event focus zooms in.
    const nudgeScale =
      layout === 'desktop'
        ? 0
        : Math.max(0, Math.min(1, (baseFit.fitZoom * 1.65 - zoom) / (baseFit.fitZoom * 0.65)));
    const sheetBottom =
      layout === 'phone-p' && provinceSheetH > 0 ? boxH - provinceSheetH : boxH;
    const legendReserved = showLegend && activeLegendH > 0 ? activeLegendH + 12 : 8;
    const effectiveBottom = Math.min(sheetBottom - 8, boxH - legendReserved);
    const effectiveTop = (modeBarH > 0 ? modeBarH : 44) + 6;
    const labelMinX = (layout === 'phone-l' ? landscapeSheetLeft : 0) + 8;
    const labelMaxX = boxW - (layout === 'phone-l' ? landscapeSheetRight : 0) - 8;

    const raw = SYRIA_2D_GOVERNORATES.map((gov) => {
      const node = $gameStore.governorates[gov.id];
      const baseX = offsetX + gov.center[0] * baseScale;
      const baseY = offsetY + gov.center[1] * baseScale;
      const rawNudge =
        gov.id === 'quneitra'
          ? { x: 4, y: -6 }
          : gov.id === 'daraa'
            ? { x: 8, y: 14 }
            : gov.id === 'as_suwayda'
              ? { x: 10, y: 5 }
              : { x: 0, y: 0 };
      const x = cx + (baseX - cx) * zoom + panX + rawNudge.x * nudgeScale;
      const y = cy + (baseY - cy) * zoom + panY + rawNudge.y * nudgeScale;
      const badge = node ? modeBadge(node, currentMode) : { value: '—', suffix: '' };
      const sev = modeSeverity(node, currentMode);
      const isSelected = !focusedGovId && selectedId === gov.id;
      const isFocusedGov = focusedGovId === gov.id;
      const isDimmed = focusedGovId
        ? !isFocusedGov
        : Boolean(selectedId && !isSelected);
      const isHovered = !focusedGovId && hoveredId === gov.id;
      const nameAr = node?.nameAr ?? gov.nameAr;

      const bH = mMetrics ? mMetrics.badgeH : 23;
      const bMinW = mMetrics ? mMetrics.badgeMinW : 27;
      const bPadX = mMetrics ? mMetrics.badgePadX : 5;
      const bFs = mMetrics ? mMetrics.badgeFs : 11.5;
      const textUnits = badge.value.length + (badge.suffix ? 0.9 : 0);
      const estBadgeW = Math.max(bMinW, bPadX * 2 + textUnits * (bFs * 0.68) + 4);
      const badgeRect: RectBox = {
        left: x - estBadgeW / 2,
        right: x + estBadgeW / 2,
        top: y - bH / 2,
        bottom: y + bH / 2,
      };

      const nameFs = mMetrics ? mMetrics.nameFs : 11;
      const estLabelW = Math.min(176, Math.max(46, nameAr.length * (nameFs * 0.68) + 14));
      const estLabelH = mMetrics ? mMetrics.nameH : 20;
      const halfW = estLabelW / 2;
      const minCenter = labelMinX + halfW;
      const maxCenter = Math.max(minCenter, labelMaxX - halfW);
      const clampedCenter = Math.max(minCenter, Math.min(maxCenter, x));
      const labelDx = Math.round(clampedCenter - x);
      const labelAbove = y + 42 > effectiveBottom && y - 42 >= effectiveTop;

      return {
        gov,
        node,
        x,
        y,
        value: badge.value,
        suffix: badge.suffix,
        tone: sev.tone,
        isCrisis: sev.isCrisis,
        isSelected,
        isFocusedGov,
        isDimmed,
        isHovered,
        showName: isSelected || isFocusedGov || isHovered,
        nameAr,
        labelDx,
        labelAbove,
        badgeRect,
        estLabelW,
        estLabelH,
        minCenter,
        maxCenter,
      };
    });

    if (layout !== 'desktop' || !mMetrics) {
      return raw.map(({ isHovered: _ih, estLabelW: _elw, estLabelH: _elh, minCenter: _mc, maxCenter: _xc, ...item }) => item);
    }

    // Desktop: non-overlapping static label placement around scaled badges.
    const vGap = Math.round(mMetrics.badgeH / 2 + 4);
    const isRtl =
      stageEl && typeof getComputedStyle === 'function'
        ? getComputedStyle(stageEl).direction === 'rtl'
        : true;
    const occupiedLabels: RectBox[] = [];
    const legendBoxes: RectBox[] = [];
    if (showLegend && activeLegendH > 0) {
      const wLeg = legendW > 0 ? legendW : 260;
      legendBoxes.push(
        isRtl
          ? {
              left: boxW - 14 - wLeg,
              right: boxW - 14,
              top: boxH - 14 - activeLegendH,
              bottom: boxH - 14,
            }
          : {
              left: 14,
              right: 14 + wLeg,
              top: boxH - 14 - activeLegendH,
              bottom: boxH - 14,
            }
      );
    }
    const allBadgeRects = raw.map((item) => item.badgeRect);

    const buildCandidate = (
      item: (typeof raw)[number],
      above: boolean,
      rawShift: number
    ): { dx: number; above: boolean; rect: RectBox } => {
      const halfW = item.estLabelW / 2;
      const center = Math.max(item.minCenter, Math.min(item.maxCenter, item.x + rawShift));
      const dx = Math.round(center - item.x);
      const top = above ? item.y - vGap - item.estLabelH : item.y + vGap;
      const bottom = top + item.estLabelH;
      return {
        dx,
        above,
        rect: { left: center - halfW, right: center + halfW, top, bottom },
      };
    };

    const fitsInPlayfield = (r: RectBox): boolean =>
      r.left >= labelMinX &&
      r.right <= labelMaxX &&
      r.top >= effectiveTop &&
      r.bottom <= effectiveBottom;

    const candidateClear = (r: RectBox): boolean =>
      fitsInPlayfield(r) &&
      !allBadgeRects.some((b) => rectsOverlap(r, b, 2)) &&
      !legendBoxes.some((l) => rectsOverlap(r, l, 4)) &&
      !occupiedLabels.some((o) => rectsOverlap(r, o, 3));

    const order = raw
      .map((item, idx) => ({ item, idx }))
      .sort((a, b) => {
        const aForced = a.item.isFocusedGov || a.item.isSelected || a.item.isHovered ? 1 : 0;
        const bForced = b.item.isFocusedGov || b.item.isSelected || b.item.isHovered ? 1 : 0;
        if (aForced !== bForced) return bForced - aForced;
        return (
          (DESKTOP_LABEL_PRIORITY[b.item.gov.id] ?? 0) -
          (DESKTOP_LABEL_PRIORITY[a.item.gov.id] ?? 0)
        );
      });

    for (const { item } of order) {
      const shift = Math.round(Math.min(34, item.estLabelW * 0.42));
      const candidates = [
        buildCandidate(item, false, 0),
        buildCandidate(item, true, 0),
        buildCandidate(item, false, shift),
        buildCandidate(item, false, -shift),
        buildCandidate(item, true, shift),
        buildCandidate(item, true, -shift),
      ];
      const chosen = candidates.find((c) => candidateClear(c.rect));
      const forced = item.isFocusedGov || item.isSelected || item.isHovered;

      if (chosen) {
        item.showName = true;
        item.labelDx = chosen.dx;
        item.labelAbove = chosen.above;
        occupiedLabels.push(chosen.rect);
      } else if (forced) {
        // Selected/hovered/focused markers always keep their Arabic label visible;
        // pick the in-bounds slot with least badge overlap.
        const inBounds = candidates.filter((c) => fitsInPlayfield(c.rect));
        const pool = inBounds.length > 0 ? inBounds : candidates;
        let best = pool[0];
        let bestScore = Number.POSITIVE_INFINITY;
        for (const c of pool) {
          const score = allBadgeRects.reduce((sum, b) => sum + overlapArea(c.rect, b), 0);
          if (score < bestScore) {
            bestScore = score;
            best = c;
          }
        }
        item.showName = true;
        item.labelDx = best.dx;
        item.labelAbove = best.above;
        occupiedLabels.push(best.rect);
      } else {
        item.showName = false;
      }
    }

    return raw.map(({ isHovered: _ih, estLabelW: _elw, estLabelH: _elh, minCenter: _mc, maxCenter: _xc, ...item }) => item);
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

  let selectedGovObj = $derived(
    !isFocused && selectedId
      ? SYRIA_2D_GOVERNORATES.find((g) => g.id === selectedId) ?? null
      : null
  );
  let hoveredGovObj = $derived(
    !isFocused && hoveredId && hoveredId !== selectedId
      ? SYRIA_2D_GOVERNORATES.find((g) => g.id === hoveredId) ?? null
      : null
  );

  function fillFor(node: GovernorateNode | undefined): string {
    return modeSeverity(node, mode).fill;
  }

  function ariaFor(gov: Syria2DGovernorate): string {
    const node = $gameStore.governorates[gov.id];
    if (!node) return gov.nameAr;
    const badge = modeBadge(node, mode);
    return `${node.nameAr} — ${activeMode.labelAr}: ${badge.value}${badge.suffix}`;
  }

  // ── Tooltips ───────────────────────────────────────────────────────────────
  function clampTip(
    clientX: number,
    clientY: number,
    avoidRect?: RectBox | null
  ): { x: number; y: number } {
    const rect = stageEl?.getBoundingClientRect();
    if (!rect) return { x: 8, y: 8 };
    const isDesktop = layout === 'desktop';
    const tipW = isDesktop ? (rect.width >= 1600 ? 272 : 248) : 224;
    const tipH = isDesktop ? 210 : 176;
    const minX = 10;
    const maxX = Math.max(minX, rect.width - tipW - 10);
    const minY = isDesktop ? (modeBarH > 0 ? modeBarH : 38) + 8 : 8;
    const maxY = Math.max(minY, rect.height - tipH - 10);
    const curX = clientX - rect.left;
    const curY = clientY - rect.top;

    if (!isDesktop || !avoidRect) {
      return {
        x: Math.max(8, Math.min(curX + 14, rect.width - tipW - 8)),
        y: Math.max(minY, Math.min(curY + 14, rect.height - tipH - 8)),
      };
    }

    const candidates = [
      { x: Math.max(curX, avoidRect.right) + 12, y: avoidRect.top - 12 },
      { x: Math.min(curX, avoidRect.left) - tipW - 12, y: avoidRect.top - 12 },
      { x: Math.max(curX, avoidRect.right) + 12, y: avoidRect.bottom - tipH },
      { x: Math.min(curX, avoidRect.left) - tipW - 12, y: avoidRect.bottom - tipH },
      { x: (avoidRect.left + avoidRect.right) / 2 - tipW / 2, y: avoidRect.bottom + 12 },
      { x: (avoidRect.left + avoidRect.right) / 2 - tipW / 2, y: avoidRect.top - tipH - 12 },
    ].map((pt) => ({
      x: Math.round(Math.max(minX, Math.min(pt.x, maxX))),
      y: Math.round(Math.max(minY, Math.min(pt.y, maxY))),
    }));

    let best = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const pt of candidates) {
      const box: RectBox = { left: pt.x, right: pt.x + tipW, top: pt.y, bottom: pt.y + tipH };
      const hoveredOv = overlapArea(box, avoidRect);
      const anyBadgeOv = markers.reduce((sum, m) => sum + overlapArea(box, m.badgeRect), 0);
      const score = hoveredOv * 100 + anyBadgeOv;
      if (score === 0) return pt;
      if (score < bestScore) {
        bestScore = score;
        best = pt;
      }
    }
    return best;
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
    const marker = markers.find((m) => m.gov.id === govId);
    const avoidRect = marker
      ? {
          left: marker.badgeRect.left - 8,
          right: marker.badgeRect.right + 8,
          top: marker.badgeRect.top - 8,
          bottom: marker.badgeRect.bottom + 8,
        }
      : null;
    const position = clampTip(clientX, clientY, avoidRect);
    const isDesktop = layout === 'desktop';
    tooltip = {
      ...position,
      title: node?.nameAr ?? meta.nameAr,
      kicker: tier.labelAr,
      tone: tier.tone,
      rows: node
        ? isDesktop
          ? [
              { label: 'الاحتقان', value: `${Math.round(node.prri ?? 0)}` },
              {
                label: 'ساعات الكهرباء',
                value: `${Number(governoratePowerHours(node).toFixed(1))} س`,
              },
              { label: 'الأضرار', value: `${governorateDamagePct(node)}%` },
              { label: 'الألغام', value: `${Math.round(node.mineSaturationPct ?? 0)}%` },
            ]
          : [
              { label: activeMode.labelAr, value: `${badge.value}${badge.suffix}` },
              {
                label: 'ساعات الكهرباء',
                value: `${Number(governoratePowerHours(node).toFixed(1))} س`,
              },
              { label: 'الألغام', value: `${Math.round(node.mineSaturationPct)}%` },
              {
                label: 'الضرر غير المُصلح',
                value: `$${Math.round(node.unrepairedDamageUSD / 1_000_000).toLocaleString('en-US')}M`,
              },
            ]
        : [],
      footer: isDesktop ? 'اضغط لفتح الملف' : undefined,
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
      tone: 'var(--c-accent)',
      rows: [
        { label: 'الدورات السابقة', value: formatPeople(arrow.history) },
        { label: 'المتوقع هذا الدور', value: formatPeople(arrow.predicted) },
      ],
    };
  }

  function clearTooltip(): void {
    tooltip = null;
  }

  // ── Selection & tap feedback ───────────────────────────────────────────────
  function spawnRipple(govId: string, clientX?: number, clientY?: number): void {
    if (prefersReducedMotion()) return;
    const rect = mapBoxEl?.getBoundingClientRect();
    let rx: number;
    let ry: number;
    if (rect && clientX !== undefined && clientY !== undefined) {
      rx = clientX - rect.left;
      ry = clientY - rect.top;
    } else {
      const m = markers.find((item) => item.gov.id === govId);
      if (!m) return;
      rx = m.x;
      ry = m.y;
    }
    const id = nextRippleId++;
    const sev = modeSeverity($gameStore.governorates[govId], mode);
    ripples = [...ripples, { id, x: rx, y: ry, tone: sev.tone }];
    setTimeout(() => {
      ripples = ripples.filter((r) => r.id !== id);
    }, 360);
  }

  function activateGovernorate(
    govId: string,
    clientX?: number,
    clientY?: number
  ): void {
    if (isFocused) return;
    spawnRipple(govId, clientX, clientY);
    if (selectedId === govId) {
      triggerFx('cancel');
      uiStore.selectGovernorate(null);
      if ($uiStore.activeCommandPanel === 'provincial') uiStore.closeCommandPanel();
    } else {
      triggerFx('select');
      uiStore.selectGovernorate(govId);
    }
  }

  function clearSelection(): void {
    if (isFocused) return;
    if (selectedId) triggerFx('cancel');
    uiStore.selectGovernorate(null);
    uiStore.closeCommandPanel();
  }

  // ── Pointer interaction: immediate tap/click select + desktop hover ────────
  function onMapClick(event: MouseEvent): void {
    if (isFocused) return;
    const target = event.target as Element | null;
    if (!target || typeof target.closest !== 'function') return;

    const govEl = target.closest('[data-gov-id]');
    const govId = govEl?.getAttribute('data-gov-id') ?? null;
    if (govId) {
      activateGovernorate(govId, event.clientX, event.clientY);
      clearTooltip();
      return;
    }

    const arrowEl = target.closest('[data-mig-index]');
    if (arrowEl) {
      const index = Number(arrowEl.getAttribute('data-mig-index'));
      if (Number.isFinite(index)) {
        triggerFx('tap');
        showArrowTooltip(index, event.clientX, event.clientY);
        return;
      }
    }

    clearSelection();
    clearTooltip();
  }

  function onPointerMove(event: PointerEvent): void {
    if (isFocused || event.pointerType === 'touch') return;
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

  function onPointerLeave(): void {
    hoveredId = null;
    clearTooltip();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (isFocused) return;
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

  function selectMode(id: MapModeId): void {
    if (mode === id) return;
    triggerFx('select');
    mode = id;
  }

  // ── Presentation helpers ───────────────────────────────────────────────────
  const LEGEND_STYLE = $derived(
    layout === 'desktop'
      ? 'inset-inline-start:14px;bottom:14px;'
      : 'inset-inline-start:8px;bottom:8px;'
  );

  let focusedGovObj = $derived(
    focusedGovId ? SYRIA_2D_GOVERNORATES.find((g) => g.id === focusedGovId) ?? null : null
  );

  let mapRootVars = $derived(
    desktopBadgeMetrics
      ? `--map-badge-h:${desktopBadgeMetrics.badgeH}px;--map-badge-mw:${desktopBadgeMetrics.badgeMinW}px;--map-badge-fs:${desktopBadgeMetrics.badgeFs}px;--map-badge-sfs:${desktopBadgeMetrics.badgeSmallFs}px;--map-badge-px:${desktopBadgeMetrics.badgePadX}px;--map-name-fs:${desktopBadgeMetrics.nameFs}px;`
      : ''
  );
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -- map viewport is a keyboard-navigable region (arrows/Enter/Escape); every province is also a focusable button. -->
<div
  bind:this={stageEl}
  class="map-root relative h-full w-full touch-manipulation select-none overflow-hidden bg-[var(--c-bg)] font-arabic outline-none focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[var(--c-accent)]"
  style={mapRootVars}
  role="region"
  tabindex="0"
  aria-label="الخارطة الاستراتيجية للجمهورية العربية السورية"
  onkeydown={onKeydown}
>
  <!-- Full-bleed flat fixed board; Syria auto-fits inside the unobstructed playfield. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={mapBoxEl}
    class="absolute inset-0 touch-manipulation overflow-hidden"
    bind:clientWidth={boxW}
    bind:clientHeight={boxH}
    onclick={onMapClick}
    onpointermove={onPointerMove}
    onpointerleave={onPointerLeave}
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
          markerWidth="14"
          markerHeight="14"
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
          markerWidth="14"
          markerHeight="14"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--map-arrow-pred)" opacity="0.9" />
        </marker>
      </defs>

      <!-- Flat neighbouring land silhouettes (separates sea vs land, zero gradients) -->
      <g class="map-neighbours" aria-hidden="true">
        {#each REGION_NEAR as region (region.id)}
          <path d={region.path} class="map-neighbour" />
        {/each}
      </g>

      <!-- Muted neighbour & sea labels -->
      <g class="map-context" aria-hidden="true">
        {#each REGION_NEAR as region (region.id)}
          {@const at = region.id === 'turkiye' ? [300, 110] : region.labelAt}
          <text class="map-country" x={at[0]} y={at[1]} text-anchor="middle">{region.nameAr}</text>
        {/each}
        {#if !isPhone}
          {#each REGION_FAR_LABELS as region (region.id)}
            <text class="map-country map-country-far" x={region.labelAt[0]} y={region.labelAt[1]} text-anchor="middle">{region.nameAr}</text>
          {/each}
        {/if}
        <text
          class="map-sea-label"
          x="48"
          y="400"
          text-anchor="middle"
          transform="rotate(-90 48 400)"
        >البحر المتوسط</text>
      </g>

      <!-- Governorates: flat --map-sev-0..3 fills, fixed DOM order so clicks never drop -->
      <g>
        {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
          {@const node = $gameStore.governorates[gov.id]}
          {@const isSelected = !isFocused && selectedId === gov.id}
          {@const isFocusedGov = focusedGovId === gov.id}
          {@const isHovered = !isFocused && hoveredId === gov.id}
          <path
            d={gov.path}
            fill={fillFor(node)}
            stroke="var(--c-bg)"
            stroke-width="1.2"
            stroke-linejoin="miter"
            vector-effect="non-scaling-stroke"
            fill-opacity={isFocused
              ? isFocusedGov
                ? 1
                : 0.34
              : selectedId && !isSelected
                ? 0.65
                : 1}
            class="map-prov {isSelected ? 'is-selected' : ''} {isHovered ? 'is-hovered' : ''} {isFocused ? 'is-locked' : ''}"
            data-gov-id={gov.id}
            role="button"
            tabindex={isFocused ? -1 : 0}
            aria-disabled={isFocused ? 'true' : undefined}
            aria-label={ariaFor(gov)}
            aria-pressed={isSelected}
            onkeydown={(event) => {
              if (isFocused) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
                event.preventDefault();
                activateGovernorate(gov.id);
              }
            }}
            onfocus={() => {
              if (!isFocused) hoveredId = gov.id;
            }}
            onblur={() => (hoveredId = null)}
          ></path>
        {/each}
      </g>

      <!-- Crisp top-layer borders for selected / hovered / focused governorates -->
      <g class="pointer-events-none" aria-hidden="true">
        {#if selectedGovObj}
          <path
            d={selectedGovObj.path}
            fill="none"
            stroke="var(--c-accent)"
            stroke-width="2.5"
            stroke-linejoin="miter"
            vector-effect="non-scaling-stroke"
          />
        {/if}
        {#if hoveredGovObj}
          <path
            d={hoveredGovObj.path}
            fill="none"
            stroke="var(--c-text)"
            stroke-width="1.8"
            stroke-linejoin="miter"
            vector-effect="non-scaling-stroke"
          />
        {/if}
        {#if focusedGovObj}
          <path
            d={focusedGovObj.path}
            fill="none"
            stroke="var(--c-neg)"
            stroke-width="2.6"
            stroke-linejoin="miter"
            vector-effect="non-scaling-stroke"
          />
        {/if}
      </g>

      <!-- Event focus: three concentric pulsing red rings (flat strokes, --c-neg) -->
      {#if focusedGovObj}
        <g
          class="map-focus-rings"
          transform="translate({focusedGovObj.center[0]}, {focusedGovObj.center[1]})"
          aria-hidden="true"
        >
          <circle
            r="34"
            class="map-focus-ring ring-1"
            fill="none"
            stroke="var(--c-neg)"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
          <circle
            r="62"
            class="map-focus-ring ring-2"
            fill="none"
            stroke="var(--c-neg)"
            stroke-width="1.5"
            vector-effect="non-scaling-stroke"
          />
          <circle
            r="92"
            class="map-focus-ring ring-3"
            fill="none"
            stroke="var(--c-neg)"
            stroke-width="1.2"
            vector-effect="non-scaling-stroke"
          />
        </g>
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
                opacity="0.34"
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
                opacity="0.72"
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
              data-mig-index={index}
              class="map-arrow-hit"
            />
          {/each}
        </g>
      {/if}
    </svg>

    <!-- Flat square tap feedback -->
    <div class="pointer-events-none absolute inset-0 z-[9]" aria-hidden="true">
      {#each ripples as r (r.id)}
        <span
          class="map-ripple"
          style="left:{r.x}px;top:{r.y}px;--ripple-tone:{r.tone};"
        ></span>
      {/each}
    </div>

    <!-- Screen-constant SQUARE province tokens -->
    <div class="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {#each markers as marker (marker.gov.id)}
        {@const onScreen =
          marker.x > -36 && marker.y > -36 && marker.x < boxW + 36 && marker.y < boxH + 36}
        {#if onScreen}
          <div
            class="map-token absolute h-0 w-0 {marker.isSelected || marker.isFocusedGov ? 'z-20' : ''}"
            style="left:{marker.x}px;top:{marker.y}px;"
          >
            <span
              data-gov-id={marker.gov.id}
              class="map-badge {isFocused ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'} {marker.isSelected
                ? 'is-selected'
                : marker.isFocusedGov
                  ? 'is-focused'
                  : marker.isDimmed
                    ? 'is-dimmed'
                    : ''} {marker.isCrisis ? 'is-crisis' : ''}"
              title={marker.nameAr}
              dir="ltr"
            >
              <span class="num">{marker.value}</span>{#if marker.suffix}<small>{marker.suffix}</small>{/if}
            </span>
            {#if marker.showName}
              <span
                class="map-prov-name {marker.isSelected ? 'is-selected' : ''} {marker.isFocusedGov ? 'is-focused' : ''}"
                style="left:0;{marker.labelAbove ? 'bottom:calc(var(--map-badge-h, 23px) / 2 + 4px);' : 'top:calc(var(--map-badge-h, 23px) / 2 + 4px);'}transform:translateX(calc(-50% + {marker.labelDx}px));"
              >{marker.nameAr}</span>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Ruled map mode strip: full-width 4 equal cells on phones; ruled strip along top of map area on desktop -->
  <div
    bind:clientHeight={modeBarH}
    class="pointer-events-auto absolute inset-x-0 top-0 z-20 border-b border-[var(--c-line)] bg-[var(--c-strip)]"
    role="group"
    aria-label="طبقات الخارطة"
  >
    <div
      class="grid grid-cols-4 {isPhone
        ? 'w-full'
        : 'w-[420px] min-[1600px]:w-[460px] min-[2200px]:w-[520px] max-w-full border-e border-[var(--c-line)]'}"
    >
      {#each MAP_MODES as item, idx (item.id)}
        {@const isActive = mode === item.id}
        <button
          type="button"
          onclick={() => selectMode(item.id)}
          aria-pressed={isActive}
          title={`طبقة ${item.labelAr}`}
          aria-label={`طبقة ${item.labelAr}`}
          class="pressable flex items-center justify-center text-center font-bold transition-colors {isPhone
            ? 'min-h-11 text-[12px]'
            : 'h-[var(--shell-map-mode-h,38px)] text-[13px] min-[1600px]:text-[14px] min-[2200px]:text-[15px]'} {idx > 0
            ? 'border-s border-[var(--c-line)]'
            : ''} {isActive
            ? 'bg-[var(--c-accent)] text-[var(--c-ink)]'
            : 'bg-transparent text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]'}"
        >
          <span class="whitespace-nowrap">{item.labelAr}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Flat legend box: 4 square swatches + labels at bottom-start corner -->
  {#if showLegend}
    <div
      bind:clientWidth={legendW}
      bind:clientHeight={legendH}
      class="pointer-events-auto absolute z-20 flex flex-wrap items-center gap-y-1 border border-[var(--c-line)] bg-[var(--c-bg)] leading-[1.4] text-[var(--c-text-2)] {isPhone
        ? 'gap-x-2.5 px-2 py-1 text-[11px]'
        : 'gap-x-3 px-2.5 py-1.5 text-[12px] min-[1600px]:text-[13px] min-[2200px]:text-[14px]'}"
      style={LEGEND_STYLE}
      aria-label={`مفتاح طبقة ${activeMode.labelAr}`}
    >
      {#each activeMode.legend as entry (entry.label)}
        <span class="flex items-center gap-1.5 whitespace-nowrap">
          <i
            class="inline-block shrink-0 {isPhone
              ? 'h-[11px] w-[11px]'
              : 'h-[12px] w-[12px] min-[1600px]:h-[13px] min-[1600px]:w-[13px] min-[2200px]:h-[14px] min-[2200px]:w-[14px]'}"
            style="background:{entry.color};"
            aria-hidden="true"
          ></i>
          <span dir="ltr">{entry.label}</span>
        </span>
      {/each}
    </div>
  {/if}

  <!-- Hover / tap tooltip (flat square box) -->
  {#if tooltip && !isFocused}
    <div
      class="pointer-events-none absolute z-30 border border-[var(--c-line-strong)] bg-[var(--c-bg)] px-3 py-2.5 {isPhone
        ? 'w-[224px]'
        : 'w-[248px] min-[1600px]:w-[272px]'}"
      style="left:{tooltip.x}px;top:{tooltip.y}px;"
      role="status"
    >
      <div class="flex items-start justify-between gap-2">
        <span class="font-bold text-[var(--c-text)] {isPhone ? 'text-[13.5px]' : 'text-[13.5px] min-[1600px]:text-[14.5px]'}">{tooltip.title}</span>
        <span class="shrink-0 font-bold {isPhone ? 'text-[11px]' : 'text-[11px] min-[1600px]:text-[12px]'}" style="color:{tooltip.tone};">{tooltip.kicker}</span>
      </div>
      {#if tooltip.rows.length > 0}
        <div class="mt-1.5 space-y-1 border-t border-[var(--c-line)] pt-1.5">
          {#each tooltip.rows as row (row.label)}
            <div class="flex items-baseline justify-between gap-3 {isPhone ? 'text-[11px]' : 'text-[11.5px] min-[1600px]:text-[12.5px]'}">
              <span class="text-[var(--c-muted)]">{row.label}</span>
              <b dir="ltr" class="num font-bold text-[var(--c-text-2)]">{row.value}</b>
            </div>
          {/each}
        </div>
      {/if}
      {#if tooltip.footer}
        <div class="mt-2 border-t border-[var(--c-line)] pt-1.5 text-[11px] font-bold text-[var(--c-accent)]">
          {tooltip.footer}
        </div>
      {/if}
    </div>
  {/if}

  <!-- CRT scanline overlay (pure SVG pattern, zero gradients/blur) -->
  {#if $uiStore.crtTube}
    <svg class="pointer-events-none absolute inset-0 z-[15] h-full w-full opacity-25" aria-hidden="true">
      <defs>
        <pattern id="map-crt-scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="4" height="1" fill="#000000" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#map-crt-scan)" />
    </svg>
  {/if}
</div>

<style>
  .map-svg {
    will-change: transform;
  }

  /* ── Flat neighbours & muted labels ──────────────────────────────────── */
  .map-neighbour {
    fill: #0d1216;
    stroke: #1c242b;
    stroke-width: 0.8;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .map-country {
    font-family: var(--font-arabic);
    font-size: 13px;
    fill: var(--c-muted);
    opacity: 0.25;
    pointer-events: none;
  }
  .map-country-far {
    opacity: 0.14;
  }
  .map-sea-label {
    font-family: var(--font-arabic);
    font-size: 11.5px;
    fill: var(--c-muted);
    opacity: 0.20;
    pointer-events: none;
  }

  /* ── Province shapes (flat, crisp) ───────────────────────────────────── */
  .map-prov {
    cursor: pointer;
    transition: fill-opacity 0.14s ease-out;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .map-prov.is-locked {
    cursor: default;
  }
  .map-prov:focus-visible {
    stroke: var(--c-accent);
    stroke-width: 2.5;
  }
  .map-prov.is-hovered {
    fill-opacity: 1;
  }
  .map-arrow {
    pointer-events: none;
  }
  .map-arrow-hit {
    cursor: help;
  }

  /* ── Flat square tap feedback ────────────────────────────────────────── */
  .map-ripple {
    position: absolute;
    width: 34px;
    height: 34px;
    margin-left: -17px;
    margin-top: -17px;
    border-radius: 0;
    border: 1.5px solid var(--ripple-tone, var(--c-accent));
    animation: map-ripple-out 0.18s ease-out forwards;
  }
  @keyframes map-ripple-out {
    from {
      transform: scale(0.7);
      opacity: 0.9;
    }
    to {
      transform: scale(1.65);
      opacity: 0;
    }
  }

  /* ── Square province tokens ──────────────────────────────────────────── */
  .map-badge {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    display: inline-flex;
    min-width: var(--map-badge-mw, 27px);
    height: var(--map-badge-h, 23px);
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 0 var(--map-badge-px, 5px);
    border: 1.5px solid var(--c-accent);
    border-radius: 0;
    background: var(--c-bg);
    color: var(--c-text);
    font-family: var(--font-arabic);
    font-size: var(--map-badge-fs, 11.5px);
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
  }
  .map-badge small {
    font-size: var(--map-badge-sfs, 10px);
    font-weight: 600;
    color: var(--c-muted);
  }
  @media (max-height: 500px) and (orientation: landscape) {
    .map-badge {
      min-width: 24px;
      height: 20px;
      padding: 0 4px;
      font-size: 10.5px;
    }
    .map-badge small {
      font-size: 9.5px;
    }
  }
  .map-badge.is-dimmed {
    opacity: 0.55;
  }
  .map-badge.is-selected {
    border-color: var(--c-accent);
    background: var(--c-accent);
    color: var(--c-ink);
  }
  .map-badge.is-selected small {
    color: var(--c-ink);
  }
  .map-badge.is-focused {
    border-color: var(--c-neg);
    background: var(--c-bg);
    color: var(--c-text);
  }

  .map-prov-name {
    position: absolute;
    max-width: 176px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 1px 6px;
    background: var(--c-bg);
    border: 1px solid var(--c-line);
    color: var(--c-text);
    font-family: var(--font-arabic);
    font-size: var(--map-name-fs, 11px);
    font-weight: 700;
    line-height: 1.35;
    pointer-events: none;
  }
  .map-prov-name.is-selected {
    border-color: var(--c-accent);
    color: var(--c-accent);
  }
  .map-prov-name.is-focused {
    border-color: var(--c-neg);
    color: var(--c-neg);
  }

  /* ── Crisis & event-focus ring animations (reduced-motion safe) ──────── */
  .map-focus-ring.ring-1 {
    opacity: 0.92;
  }
  .map-focus-ring.ring-2 {
    opacity: 0.58;
  }
  .map-focus-ring.ring-3 {
    opacity: 0.3;
  }

  @media (prefers-reduced-motion: no-preference) {
    .map-badge {
      transition: opacity 0.14s ease;
    }
    .map-badge.is-crisis::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 0;
      border: 1.5px solid var(--c-neg);
      pointer-events: none;
      animation: map-crisis-pulse 2.2s ease-out infinite;
    }
    .map-focus-ring.ring-1 {
      animation: map-focus-pulse-1 1.8s ease-out infinite;
    }
    .map-focus-ring.ring-2 {
      animation: map-focus-pulse-2 1.8s ease-out infinite 0.25s;
    }
    .map-focus-ring.ring-3 {
      animation: map-focus-pulse-3 1.8s ease-out infinite 0.5s;
    }
  }

  @keyframes map-crisis-pulse {
    0% {
      transform: scale(0.95);
      opacity: 0.85;
    }
    75% {
      transform: scale(1.32);
      opacity: 0;
    }
    100% {
      transform: scale(1.32);
      opacity: 0;
    }
  }

  @keyframes map-focus-pulse-1 {
    0%, 100% {
      transform: scale(0.96);
      opacity: 0.95;
    }
    50% {
      transform: scale(1.06);
      opacity: 0.65;
    }
  }
  @keyframes map-focus-pulse-2 {
    0%, 100% {
      transform: scale(0.96);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.08);
      opacity: 0.25;
    }
  }
  @keyframes map-focus-pulse-3 {
    0%, 100% {
      transform: scale(0.96);
      opacity: 0.32;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.08;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .map-prov {
      transition: none;
    }
  }
</style>
