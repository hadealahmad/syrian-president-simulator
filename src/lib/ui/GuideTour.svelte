<script lang="ts">
  import { tick } from 'svelte';
  import GameIcon from './GameIcon.svelte';
  import { TOUR_STEPS } from './tour-steps';
  import { tourActive, tourIndex, tourNext, tourPrev, stopGuideTour } from './guide-tour';

  const PAD = 8;
  const GAP = 18;
  const CARD_W = 348;

  let popEl: HTMLDivElement | null = $state(null);
  let target = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let pop = $state<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: CARD_W, h: 220 });
  let placedSide: 'top' | 'bottom' | 'center' = $state('bottom');
  // Layout-space viewport of this overlay. Under the HUD zoom the overlay
  // lives inside a scaled layer, so rect measurements (visual px) and the
  // window size must be divided by the zoom before being used in here.
  let vpW = $state(0);
  let vpH = $state(0);
  const hudZoom = (): number =>
    Number(getComputedStyle(document.documentElement).getPropertyValue('--hud-zoom')) || 1;

  let isActive = $derived($tourActive);
  let idx = $derived($tourIndex);
  let step = $derived(TOUR_STEPS[idx] ?? TOUR_STEPS[0]);
  let isFirst = $derived(idx === 0);
  let isLast = $derived(idx === TOUR_STEPS.length - 1);

  async function measure(): Promise<void> {
    await tick();
    if (!$tourActive) return;
    const z = hudZoom();
    vpW = window.innerWidth / z;
    vpH = window.innerHeight / z;
    const el = step.selector ? document.querySelector(step.selector) : null;
    const r = el?.getBoundingClientRect() ?? null;
    target =
      r && r.width > 0 && r.height > 0
        ? {
            x: r.x / z - PAD,
            y: r.y / z - PAD,
            w: r.width / z + PAD * 2,
            h: r.height / z + PAD * 2,
          }
        : null;
    const w = popEl?.offsetWidth || CARD_W;
    const h = Math.min(popEl?.offsetHeight || 220, vpH - 20);
    place(w, h);
  }

  function place(w: number, h: number): void {
    const z = hudZoom();
    const vw = window.innerWidth / z;
    const vh = window.innerHeight / z;
    if (!target || step.side === 'center') {
      placedSide = 'center';
      pop = { x: Math.max(8, (vw - w) / 2), y: Math.max(8, (vh - h) / 2), w, h };
      return;
    }
    const cx = Math.min(Math.max(target.x + target.w / 2, w / 2 + 8), vw - w / 2 - 8);
    const spaceBelow = vh - (target.y + target.h) - GAP;
    const spaceAbove = target.y - GAP;
    const wantBottom = step.side === 'bottom';
    const useBottom = wantBottom ? spaceBelow >= h || spaceBelow >= spaceAbove : spaceAbove < h && spaceBelow > spaceAbove;
    placedSide = useBottom ? 'bottom' : 'top';
    const rawY = useBottom ? target.y + target.h + GAP : target.y - GAP - h;
    pop = {
      x: Math.min(Math.max(cx - w / 2, 8), Math.max(8, vw - w - 8)),
      y: Math.max(8, Math.min(rawY, Math.max(8, vh - h - 8))),
      w,
      h,
    };
  }

  // Connector endpoints: popover edge <-> target edge (facing each other).
  let line = $derived.by(() => {
    if (!target || placedSide === 'center') return null;
    const pcx = pop.x + pop.w / 2;
    if (placedSide === 'bottom') {
      return { x1: pcx, y1: pop.y, x2: target.x + target.w / 2, y2: target.y + target.h };
    }
    return { x1: pcx, y1: pop.y + pop.h, x2: target.x + target.w / 2, y2: target.y };
  });

  let cutout = $derived(
    target
      ? `M ${target.x},${target.y} h ${target.w} v ${target.h} h ${-target.w} Z`
      : '',
  );

  $effect(() => {
    // Re-run measurement on step/visibility change + after slide transitions.
    void $tourActive;
    void $tourIndex;
    measure();
    const t = setTimeout(measure, 380);
    return () => clearTimeout(t);
  });

  function onKey(e: KeyboardEvent): void {
    if (!$tourActive) return;
    if (e.key === 'Escape') stopGuideTour();
    else if (e.key === 'ArrowLeft') tourNext();
    else if (e.key === 'ArrowRight') tourPrev();
  }
</script>

<svelte:window onkeydown={onKey} onresize={measure} />

{#if isActive}
  <div class="pointer-events-auto fixed inset-0 z-[200] font-arabic select-none" dir="rtl" role="dialog" aria-label="الجولة التعريفية">
    <!-- Dim + cutout -->
    <svg class="absolute inset-0 h-full w-full" onmousedown={stopGuideTour} aria-hidden="true">
      <path
        d={`M 0,0 H ${vpW} V ${vpH} H 0 Z ${cutout}`}
        fill="rgb(from var(--color-charcoal-deep) r g b / 0.82)"
        fill-rule="evenodd"
      />
      {#if line}
        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="var(--color-wheat-gold)" stroke-width="2" />
        <rect
          x={line.x2 - 5}
          y={line.y2 - 5}
          width="10"
          height="10"
          transform={`rotate(45 ${line.x2} ${line.y2})`}
          fill="var(--color-wheat-gold)"
          stroke="var(--color-charcoal-deep)"
          stroke-width="2"
        />
      {/if}
    </svg>

    {#if target}
      <!-- Viewfinder corner brackets -->
      {@const c = target}
      <div class="pointer-events-none absolute" style="left:{c.x}px;top:{c.y}px;width:{c.w}px;height:{c.h}px;">
        <span class="tb-corner" style="top:-2px;right:-2px;border-top:3px solid var(--color-wheat-gold);border-right:3px solid var(--color-wheat-gold);"></span>
        <span class="tb-corner" style="top:-2px;left:-2px;border-top:3px solid var(--color-wheat-gold);border-left:3px solid var(--color-wheat-gold);"></span>
        <span class="tb-corner" style="bottom:-2px;right:-2px;border-bottom:3px solid var(--color-wheat-gold);border-right:3px solid var(--color-wheat-gold);"></span>
        <span class="tb-corner" style="bottom:-2px;left:-2px;border-bottom:3px solid var(--color-wheat-gold);border-left:3px solid var(--color-wheat-gold);"></span>
        <span class="absolute inset-0 border border-wheat-gold/40 shadow-[0_0_35px_rgba(242,207,119,0.35)]"></span>
      </div>
    {/if}

    <!-- Card -->
    <div
      bind:this={popEl}
      class="absolute w-[348px] max-w-[calc(100vw-16px)] max-h-[calc(100dvh-16px)] scroll-area overflow-y-auto border border-wheat-mid/25 text-wheat-light shadow-[0_20px_60px_rgba(0,0,0,0.85)] shell-round-pop"
      style="left:{pop.x}px;top:{pop.y}px;background: var(--shell-surface);"
    >
      <div class="px-4 pt-3">
        <div class="flex items-center justify-between gap-2">
          <span class="border border-wheat-gold/40 bg-wheat-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-wheat-gold shell-round-chip">
            {step.badge}
          </span>
          <button
            type="button"
            onclick={stopGuideTour}
            class="flex min-h-11 items-center px-2 text-[10.5px] text-wheat-dark transition-colors hover:text-wheat-gold phone-p:min-h-11"
            aria-label="تخطي الجولة"
          >
            تخطي ✕
          </button>
        </div>
        <div class="flex items-center gap-2.5 pt-1">
          <GameIcon name={step.icon} cls="w-7 h-7 shrink-0 text-wheat-gold/85" />
          <h3 class="font-heading text-[16px] font-bold leading-snug text-wheat-light">{step.title}</h3>
        </div>
        <div class="mt-2 h-[2px] w-14 bg-wheat-gold/80"></div>
      </div>

      <div class="tour-body px-4 py-2.5 text-[12px] leading-[1.95] text-wheat-light/90">
        {@html step.body}
      </div>

      <div class="sticky bottom-0 border-t border-wheat-mid/10 bg-charcoal-deep/90 px-4 pb-3 pt-1">
        <div class="flex items-center gap-2 py-1.5">
          <div class="relative h-1 flex-1 bg-charcoal-mid" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={1} aria-valuemax={TOUR_STEPS.length}>
            <div class="absolute inset-y-0 right-0 bg-wheat-gold transition-all" style="width: {((idx + 1) / TOUR_STEPS.length) * 100}%"></div>
          </div>
          <span class="shrink-0 font-mono text-[10px] text-wheat-dark"><bdi>{idx + 1} / {TOUR_STEPS.length}</bdi></span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            onclick={tourPrev}
            disabled={isFirst}
            class="flex min-h-9 items-center border border-charcoal-mid px-3.5 text-[11px] font-bold transition-all phone-p:min-h-11 phone-l:min-h-11 shell-round-item {isFirst
              ? 'cursor-not-allowed text-wheat-dark opacity-30'
              : 'text-wheat-mid hover:border-wheat-mid hover:text-wheat-light'}"
          >
            السابق
          </button>
          <button
            type="button"
            onclick={tourNext}
            class="flex min-h-9 items-center border border-wheat-gold bg-wheat-gold px-4 text-[11px] font-bold text-forest-deep shadow-md transition-all hover:bg-wheat-light phone-p:min-h-11 phone-l:min-h-11 shell-round-item"
          >
            {isLast ? 'بدء الحكم' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .tb-corner {
    position: absolute;
    width: 22px;
    height: 22px;
    filter: drop-shadow(0 0 6px rgba(242, 207, 119, 0.6));
  }
  .tour-body :global(b),
  .tour-body :global(strong) {
    color: var(--color-wheat-gold);
  }
  /* Numeric/mixed tokens stay LTR-isolated so comparisons never scramble */
  .tour-body :global(bdi) {
    unicode-bidi: isolate;
    font-family: 'Thmanyah Sans', system-ui, sans-serif;
  }
  .tour-body :global(.lead) {
    color: rgb(from var(--color-wheat-light) r g b / 0.95);
  }
  /* Takeaway lists: square gold markers keep the angular marker language */
  .tour-body :global(ul) {
    display: grid;
    gap: 7px;
    margin-top: 9px;
  }
  .tour-body :global(li) {
    position: relative;
    padding-right: 17px;
    color: rgb(from var(--color-wheat-light) r g b / 0.82);
  }
  .tour-body :global(li::before) {
    content: "";
    position: absolute;
    right: 0;
    top: 13px;
    width: 7px;
    height: 7px;
    background: var(--color-wheat-gold);
    opacity: 0.85;
  }
  /* RRI legend tones */
  .tour-body :global(li[data-tone="good"]::before) { background: var(--color-forest-accent); }
  .tour-body :global(li[data-tone="warn"]::before) { background: var(--color-status-warn); }
  .tour-body :global(li[data-tone="bad"]::before) { background: var(--color-umber-crimson); }
</style>
