<script lang="ts">
  import { onMount, tick } from 'svelte';
  import GameIcon from './GameIcon.svelte';
  import { TOUR_STEPS } from './tour-steps';
  import { fx } from './fx/feedback';
  import { focusTrap } from './actions/focus-trap';
  import { shellLayout } from './shell/viewport';
  import { uiStore } from '../stores/ui-store';
  import KbdHint from './flow/KbdHint.svelte';
  import { hasModifierKey, isTypingTarget } from './flow/kbd';
  import './flow/flow-desktop.css';
  import {
    tourActive,
    tourIndex,
    tourNext,
    tourPrev,
    tourSkipMissingStep,
    stopGuideTour,
  } from './guide-tour';

  const PAD = 4;
  const GAP = 12;
  const PHONE_CARD_W = 340;

  interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  let popEl: HTMLDivElement | null = $state(null);
  let target = $state<Rect | null>(null);
  let pop = $state<Rect>({ x: 12, y: 12, w: PHONE_CARD_W, h: 220 });
  let popMaxH = $state<number | null>(null);
  let placedSide: 'top' | 'bottom' | 'left' | 'right' | 'center' = $state('bottom');
  let vpW = $state(0);
  let vpH = $state(0);

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');
  let isActive = $derived($tourActive);
  let idx = $derived($tourIndex);
  let step = $derived(TOUR_STEPS[idx] ?? TOUR_STEPS[0]);
  let isFirst = $derived(idx === 0);
  let isLast = $derived(idx === TOUR_STEPS.length - 1);

  let consecutiveSkips = 0;

  function intersectArea(a: Rect, b: Rect): number {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    if (x2 <= x1 || y2 <= y1) return 0;
    return (x2 - x1) * (y2 - y1);
  }

  function toPaddedRect(r: DOMRect, pad: number, vw: number, vh: number): Rect {
    const cx = Math.max(2, r.left - pad);
    const cy = Math.max(2, r.top - pad);
    const cw = Math.max(12, Math.min(vw - 2, r.right + pad) - cx);
    const ch = Math.max(12, Math.min(vh - 2, r.bottom + pad) - cy);
    return { x: cx, y: cy, w: cw, h: ch };
  }

  async function measure(): Promise<void> {
    await tick();
    if (!$tourActive) return;
    vpW = window.innerWidth;
    vpH = window.innerHeight;

    let targetEl: Element | null = null;
    if (step.selector) {
      targetEl = document.querySelector(step.selector);
      const r = targetEl?.getBoundingClientRect() ?? null;
      if (!r || r.width <= 0 || r.height <= 0) {
        if (consecutiveSkips < TOUR_STEPS.length) {
          consecutiveSkips += 1;
          tourSkipMissingStep(idx);
          return;
        }
        consecutiveSkips = 0;
        target = null;
      } else {
        consecutiveSkips = 0;
        target = toPaddedRect(r, PAD, vpW, vpH);
      }
    } else {
      consecutiveSkips = 0;
      target = null;
    }

    popMaxH = null;
    await tick();
    const edgePad = isDesktop ? 24 : 16;
    const maxAllowedW = Math.max(240, vpW - edgePad);
    const maxAllowedH = Math.max(150, vpH - edgePad);
    const w = Math.min(popEl?.offsetWidth || PHONE_CARD_W, maxAllowedW);
    const h = Math.min(popEl?.offsetHeight || 220, maxAllowedH);
    place(w, h, targetEl);
  }

  function place(w: number, h: number, targetEl: Element | null): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = isDesktop ? 12 : 8;
    const clampedW = Math.min(w, Math.max(240, vw - margin * 2));
    const clampedH = Math.min(h, Math.max(150, vh - margin * 2));

    const clampX = (raw: number, boxW = clampedW) =>
      Math.max(margin, Math.min(raw, Math.max(margin, vw - boxW - margin)));
    const clampY = (raw: number, boxH = clampedH) =>
      Math.max(margin, Math.min(raw, Math.max(margin, vh - boxH - margin)));

    // Full-viewport or center-designated steps
    if (!target || step.side === 'center' || (target.w > vw * 0.72 && target.h > vh * 0.55)) {
      placedSide = 'center';
      popMaxH = null;
      const cx = target ? target.x + (target.w - clampedW) / 2 : (vw - clampedW) / 2;
      const cy = target ? target.y + (target.h - clampedH) / 2 : (vh - clampedH) / 2;
      pop = {
        x: clampX(cx),
        y: clampY(cy),
        w: clampedW,
        h: clampedH,
      };
      return;
    }

    // Desktop-aware placement: never cover target, docked Sheet body, or End Turn slab.
    if (isDesktop) {
      const topBarEl = document.querySelector('header.hud-chrome');
      const topClear = Math.max(margin, (topBarEl?.getBoundingClientRect().bottom ?? 0) + 10);

      const sheetEl =
        targetEl?.closest('[role="dialog"].hud-chrome') ??
        document.querySelector('[role="dialog"].hud-chrome');
      const rawSheet = sheetEl?.getBoundingClientRect() ?? null;
      const sheetRect: Rect | null =
        rawSheet && rawSheet.width > 0 && rawSheet.height > 0
          ? { x: rawSheet.left, y: rawSheet.top, w: rawSheet.width, h: rawSheet.height }
          : null;

      const endTurnEl = document.querySelector('[data-tour="end-turn"]');
      const rawEndTurn = endTurnEl?.getBoundingClientRect() ?? null;
      const endTurnRect: Rect | null =
        rawEndTurn && rawEndTurn.width > 0 && rawEndTurn.height > 0
          ? { x: rawEndTurn.left, y: rawEndTurn.top, w: rawEndTurn.width, h: rawEndTurn.height }
          : null;

      const avoidRects: Rect[] = [target];
      if (sheetRect) avoidRects.push(sheetRect);
      if (endTurnRect) avoidRects.push(endTurnRect);

      const targetInSheet = Boolean(
        sheetEl && targetEl && (sheetEl === targetEl || sheetEl.contains(targetEl))
      );
      const isRailTarget =
        target.w <= 140 && (target.x > vw * 0.65 || target.x + target.w < vw * 0.35);

      type Candidate = {
        side: 'top' | 'bottom' | 'left' | 'right';
        x: number;
        y: number;
        w: number;
        h: number;
        maxH: number | null;
      };
      const candidates: Candidate[] = [];

      const pushCandidate = (
        side: 'top' | 'bottom' | 'left' | 'right',
        rawX: number,
        rawY: number,
        boxW = clampedW,
        boxH = clampedH,
        maxH: number | null = null
      ) => {
        candidates.push({
          side,
          x: clampX(rawX, boxW),
          y: clampY(rawY, boxH),
          w: boxW,
          h: boxH,
          maxH,
        });
      };

      // 1. Target inside or equal to docked Sheet: place cleanly alongside the Sheet over the map.
      if (targetInSheet && sheetRect) {
        const rightSpace = vw - (sheetRect.x + sheetRect.w) - GAP - margin;
        const leftSpace = sheetRect.x - GAP - margin;
        if (rightSpace >= 260 || rightSpace >= leftSpace) {
          const boxW = Math.min(clampedW, Math.max(260, rightSpace));
          const x = sheetRect.x + sheetRect.w + GAP;
          const alignedY = Math.max(topClear, target.y - 12);
          pushCandidate('right', x, alignedY, boxW);
          pushCandidate('right', x, target.y + target.h / 2 - clampedH / 2, boxW);
          if (endTurnRect) {
            pushCandidate('right', x, endTurnRect.y - GAP - clampedH, boxW);
          }
        }
        if (leftSpace >= 260) {
          const boxW = Math.min(clampedW, leftSpace);
          const x = sheetRect.x - GAP - boxW;
          pushCandidate('left', x, Math.max(topClear, target.y - 12), boxW);
        }
      }

      // 2. Side rail targets: place horizontally beside the rail.
      if (isRailTarget && !targetInSheet) {
        const spaceLeft = target.x - GAP - margin;
        const spaceRight = vw - (target.x + target.w) - GAP - margin;
        const goLeft = spaceLeft >= clampedW || spaceLeft >= spaceRight;
        const boxW = Math.min(clampedW, Math.max(260, goLeft ? spaceLeft : spaceRight));
        const x = goLeft ? target.x - GAP - boxW : target.x + target.w + GAP;
        const side = goLeft ? 'left' : 'right';
        pushCandidate(side, x, Math.max(topClear, target.y + target.h / 2 - clampedH / 2), boxW);
        if (endTurnRect) {
          pushCandidate(side, x, Math.max(topClear, endTurnRect.y - GAP - clampedH), boxW);
        }
        pushCandidate(side, x, topClear, boxW);
      }

      // 3. TopBar or general targets: try preferred vertical side, opposite, then horizontals.
      if (!targetInSheet) {
        const wantBottom = step.side === 'bottom';
        const vOrder: Array<'bottom' | 'top'> = wantBottom ? ['bottom', 'top'] : ['top', 'bottom'];
        for (const s of vOrder) {
          const y = s === 'bottom' ? target.y + target.h + GAP : target.y - GAP - clampedH;
          pushCandidate(s, target.x + target.w / 2 - clampedW / 2, y);
          // Also try nudged away from left/right edges or rail
          pushCandidate(s, target.x, y);
        }
        const spaceLeft = target.x - GAP - margin;
        const spaceRight = vw - (target.x + target.w) - GAP - margin;
        if (spaceLeft >= 280) {
          const boxW = Math.min(clampedW, spaceLeft);
          pushCandidate('left', target.x - GAP - boxW, Math.max(topClear, target.y), boxW);
        }
        if (spaceRight >= 280) {
          const boxW = Math.min(clampedW, spaceRight);
          pushCandidate('right', target.x + target.w + GAP, Math.max(topClear, target.y), boxW);
        }
      }

      let best: Candidate | null = null;
      let bestPenalty = Number.POSITIVE_INFINITY;
      for (const cand of candidates) {
        const box: Rect = { x: cand.x, y: cand.y, w: cand.w, h: cand.h };
        let overlap = 0;
        for (const obs of avoidRects) {
          overlap += intersectArea(box, obs);
        }
        if (overlap === 0) {
          best = cand;
          break;
        }
        if (overlap < bestPenalty) {
          bestPenalty = overlap;
          best = cand;
        }
      }

      if (best) {
        placedSide = best.side;
        popMaxH = best.maxH;
        pop = { x: best.x, y: best.y, w: best.w, h: best.h };
        return;
      }
    }

    // Mobile / fallback placement (preserves existing approved phone layouts)
    const spaceBelow = vh - (target.y + target.h) - GAP - 8;
    const spaceAbove = target.y - GAP - 8;
    const spaceRight = vw - (target.x + target.w) - GAP - 8;
    const spaceLeft = target.x - GAP - 8;

    const wantBottom = step.side === 'bottom';
    const fitsBottom = spaceBelow >= clampedH;
    const fitsTop = spaceAbove >= clampedH;
    const fitsLeft = spaceLeft >= clampedW;
    const fitsRight = spaceRight >= clampedW;

    const isRailTarget =
      vw > 460 &&
      target.w <= 120 &&
      (target.x > vw * 0.65 || target.x + target.w < vw * 0.35);

    const placeHorizontal = (useRight: boolean, boxH = clampedH, maxH: number | null = null) => {
      placedSide = useRight ? 'right' : 'left';
      popMaxH = maxH;
      const boxW = Math.min(clampedW, useRight ? spaceRight : spaceLeft);
      pop = {
        x: clampX(useRight ? target!.x + target!.w + GAP : target!.x - GAP - boxW, boxW),
        y: clampY(target!.y + target!.h / 2 - boxH / 2, boxH),
        w: boxW,
        h: boxH,
      };
    };

    const placeVertical = (useBottom: boolean, boxH = clampedH, maxH: number | null = null) => {
      placedSide = useBottom ? 'bottom' : 'top';
      popMaxH = maxH;
      pop = {
        x: clampX(target!.x + target!.w / 2 - clampedW / 2),
        y: clampY(useBottom ? target!.y + target!.h + GAP : target!.y - GAP - boxH, boxH),
        w: clampedW,
        h: boxH,
      };
    };

    if (isRailTarget && (fitsLeft || fitsRight)) {
      placeHorizontal(fitsRight && (!fitsLeft || spaceRight >= spaceLeft));
      return;
    }

    if (wantBottom && fitsBottom) {
      placeVertical(true);
      return;
    }
    if (!wantBottom && fitsTop) {
      placeVertical(false);
      return;
    }

    if (fitsBottom || fitsTop) {
      placeVertical(fitsBottom && (!fitsTop || spaceBelow >= spaceAbove));
      return;
    }

    if (fitsLeft || fitsRight) {
      placeHorizontal(fitsRight && (!fitsLeft || spaceRight >= spaceLeft));
      return;
    }

    if (target.h > vh * 0.65 && Math.max(spaceBelow, spaceAbove) < 90) {
      placedSide = 'center';
      popMaxH = null;
      pop = {
        x: clampX((vw - clampedW) / 2),
        y: clampY((vh - clampedH) / 2),
        w: clampedW,
        h: clampedH,
      };
      return;
    }

    const bestVert = Math.max(spaceBelow, spaceAbove);
    const bestHoriz = Math.max(spaceLeft, spaceRight);
    if (bestHoriz >= 240 && bestHoriz > bestVert) {
      const useRight = spaceRight >= spaceLeft;
      placeHorizontal(useRight, clampedH, null);
      return;
    }
    if (bestVert >= 140) {
      const useBottom = spaceBelow >= spaceAbove;
      const capH = Math.floor(useBottom ? spaceBelow : spaceAbove);
      placeVertical(useBottom, Math.min(clampedH, capH), capH);
      return;
    }

    const useBottom = spaceBelow >= spaceAbove;
    const capH = Math.max(150, Math.floor(useBottom ? spaceBelow : spaceAbove));
    placeVertical(useBottom, Math.min(clampedH, capH), capH);
  }

  let line = $derived.by(() => {
    if (!target || placedSide === 'center') return null;
    const pcx = Math.max(pop.x + 12, Math.min(target.x + target.w / 2, pop.x + pop.w - 12));
    const pcy = Math.max(pop.y + 12, Math.min(target.y + target.h / 2, pop.y + pop.h - 12));
    const tcx = target.x + target.w / 2;
    const tcy = target.y + target.h / 2;
    if (placedSide === 'bottom') {
      return { x1: pcx, y1: pop.y, x2: tcx, y2: target.y + target.h };
    }
    if (placedSide === 'top') {
      return { x1: pcx, y1: pop.y + pop.h, x2: tcx, y2: target.y };
    }
    if (placedSide === 'right') {
      return { x1: pop.x, y1: pcy, x2: target.x + target.w, y2: tcy };
    }
    return { x1: pop.x + pop.w, y1: pcy, x2: target.x, y2: tcy };
  });

  $effect(() => {
    void $tourActive;
    void $tourIndex;
    measure();
    const t1 = setTimeout(measure, 210);
    const t2 = setTimeout(measure, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  });

  function handleNext(): void {
    fx(isLast ? 'confirm' : 'tap');
    tourNext();
  }

  function handlePrev(): void {
    if (isFirst) return;
    fx('tap');
    tourPrev();
  }

  function handleSkip(): void {
    fx('cancel');
    stopGuideTour();
  }

  function onCaptureKey(e: KeyboardEvent): void {
    if (!$tourActive) return;
    if ($uiStore.isSettingsOpen || $uiStore.isAboutOpen || $uiStore.isRecordsOpen || $uiStore.isRestartModalOpen) return;

    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (hasModifierKey(e) || isTypingTarget(e.target)) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleSkip();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleNext();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopImmediatePropagation();
      handlePrev();
    } else if (e.key === 'Enter' || e.key === ' ') {
      const targetEl = e.target as HTMLElement | null;
      const otherBtn = targetEl?.closest('button:not([data-tour-next]), a');
      if (!otherBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleNext();
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  });
</script>

<svelte:window onresize={measure} />

{#if isActive}
  <div
    class="pointer-events-auto fixed inset-0 z-[200] select-none font-arabic {isDesktop ? 'flow-desktop' : ''}"
    dir="rtl"
    role="dialog"
    aria-modal="true"
    aria-label="الجولة التعريفية"
  >
    <!-- 4 clean dim bands around target (or full screen when centered without target) -->
    {#if target}
      <div
        class="absolute inset-x-0 top-0 bg-[rgb(from_var(--c-bg)_r_g_b/0.82)]"
        style="height:{target.y}px;"
        onmousedown={handleSkip}
        aria-hidden="true"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 bg-[rgb(from_var(--c-bg)_r_g_b/0.82)]"
        style="top:{target.y + target.h}px;"
        onmousedown={handleSkip}
        aria-hidden="true"
      ></div>
      <div
        class="absolute left-0 bg-[rgb(from_var(--c-bg)_r_g_b/0.82)]"
        style="top:{target.y}px;width:{target.x}px;height:{target.h}px;"
        onmousedown={handleSkip}
        aria-hidden="true"
      ></div>
      <div
        class="absolute right-0 bg-[rgb(from_var(--c-bg)_r_g_b/0.82)]"
        style="top:{target.y}px;left:{target.x + target.w}px;height:{target.h}px;"
        onmousedown={handleSkip}
        aria-hidden="true"
      ></div>
      <!-- Single crisp 2px square outline around target -->
      <div
        class="pointer-events-none absolute border-2 border-[var(--c-accent)]"
        style="left:{target.x}px;top:{target.y}px;width:{target.w}px;height:{target.h}px;"
        aria-hidden="true"
      ></div>
    {:else}
      <div
        class="absolute inset-0 bg-[rgb(from_var(--c-bg)_r_g_b/0.82)]"
        onmousedown={handleSkip}
        aria-hidden="true"
      ></div>
    {/if}

    {#if line}
      <svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="var(--c-accent)" stroke-width="1.5" />
      </svg>
    {/if}

    <!-- Flat square tooltip card clamped inside viewport -->
    <div
      bind:this={popEl}
      use:focusTrap
      tabindex="-1"
      data-tour-card
      class="absolute flex flex-col overflow-hidden border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)] {isDesktop
        ? 'w-[min(var(--flow-tour-w,clamp(340px,24vw,440px)),calc(100vw-24px))] max-h-[calc(100dvh-24px)]'
        : 'w-[min(340px,calc(100vw-16px))] max-h-[calc(100dvh-16px)]'}"
      style="left:{pop.x}px;top:{pop.y}px;{popMaxH ? `max-height:${popMaxH}px;` : ''}"
    >
      <div class="shrink-0 border-b border-[var(--c-line)] bg-[var(--c-panel)] {isDesktop ? 'px-4 py-3' : 'px-3.5 py-2.5 phone-l:px-3 phone-l:py-1.5'}">
        <div class="flex items-center justify-between gap-2">
          <span class="min-w-0 truncate border border-[var(--c-accent)] bg-[var(--c-bg)] px-2 py-0.5 font-bold text-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">
            {step.badge}
          </span>
          <button
            type="button"
            onclick={handleSkip}
            class="pressable flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-2 font-bold text-[var(--c-muted)] transition-colors hover:text-[var(--c-accent)] md:min-h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}"
            aria-label="تخطي الجولة"
          >
            <span>تخطي ✕</span>
            <KbdHint keys="Esc" />
          </button>
        </div>
        <div class="mt-1.5 flex items-center gap-2 phone-l:mt-1">
          <GameIcon name={step.icon} cls="h-4.5 w-4.5 shrink-0 text-[var(--c-accent)]" />
          <h3 class="font-heading font-bold leading-snug text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[14px] phone-l:text-[13px]'}">{step.title}</h3>
        </div>
      </div>

      <div class="tour-body scroll-area min-h-0 flex-1 overflow-y-auto {isDesktop ? 'px-4 py-3 text-[var(--flow-fs-sm)] leading-[1.68]' : 'px-3.5 py-2.5 text-[12.5px] leading-[1.65] phone-l:px-3 phone-l:py-1.5 phone-l:text-[12px] phone-l:leading-[1.5]'} text-[var(--c-text-2)]">
        {@html step.body}
      </div>

      <div class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] {isDesktop ? 'px-4 pb-3.5 pt-2.5' : 'px-3.5 pb-3 pt-2 phone-l:px-3 phone-l:pb-2 phone-l:pt-1.5'}">
        <div class="flex items-center gap-2 pb-2 phone-l:pb-1.5">
          <span class="num shrink-0 font-heading font-bold text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}" dir="ltr">
            {idx + 1} / {TOUR_STEPS.length}
          </span>
          <div class="flex flex-1 gap-0.5" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={1} aria-valuemax={TOUR_STEPS.length}>
            {#each TOUR_STEPS as _, i (i)}
              <span
                class="block h-1 flex-1 {i === idx
                  ? 'bg-[var(--c-accent)]'
                  : i < idx
                    ? 'bg-[var(--c-disabled)]'
                    : 'bg-[var(--c-track)]'}"
              ></span>
            {/each}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            onclick={handlePrev}
            disabled={isFirst}
            style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
            class="kit-btn sec gap-1.5 min-h-11 px-3.5 font-bold disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}"
          >
            <span>السابق</span>
            {#if !isFirst}
              <KbdHint keys="→" />
            {/if}
          </button>
          <button
            data-autofocus
            data-tour-next
            type="button"
            onclick={handleNext}
            style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
            class="btn-primary-chamfer pressable gap-1.5 min-h-11 px-4 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}"
          >
            <span>{isLast ? 'بدء الحكم' : 'التالي'}</span>
            <KbdHint keys="←" tone="accent" />
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .tour-body :global(b),
  .tour-body :global(strong) {
    color: var(--c-accent);
  }
  .tour-body :global(bdi) {
    unicode-bidi: isolate;
    font-family: var(--font-arabic);
  }
  .tour-body :global(.lead) {
    color: var(--c-text);
  }
  .tour-body :global(ul) {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }
  .tour-body :global(li) {
    position: relative;
    padding-right: 14px;
    color: var(--c-text-2);
  }
  .tour-body :global(li::before) {
    content: "";
    position: absolute;
    right: 0;
    top: 8px;
    width: 6px;
    height: 6px;
    background: var(--c-accent);
  }
  .tour-body :global(li[data-tone="good"]::before) { background: var(--c-pos); }
  .tour-body :global(li[data-tone="warn"]::before) { background: var(--c-accent); }
  .tour-body :global(li[data-tone="bad"]::before) { background: var(--c-neg); }
</style>

