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

  let isActive = $derived($tourActive);
  let idx = $derived($tourIndex);
  let step = $derived(TOUR_STEPS[idx] ?? TOUR_STEPS[0]);
  let isFirst = $derived(idx === 0);
  let isLast = $derived(idx === TOUR_STEPS.length - 1);

  async function measure(): Promise<void> {
    await tick();
    if (!$tourActive) return;
    const el = step.selector ? document.querySelector(step.selector) : null;
    const r = el?.getBoundingClientRect() ?? null;
    target =
      r && r.width > 0 && r.height > 0
        ? { x: r.x - PAD, y: r.y - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 }
        : null;
    const w = popEl?.offsetWidth || CARD_W;
    const h = popEl?.offsetHeight || 220;
    place(w, h);
  }

  function place(w: number, h: number): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!target || step.side === 'center') {
      placedSide = 'center';
      pop = { x: Math.max(12, (vw - w) / 2), y: Math.max(12, (vh - h) / 2), w, h };
      return;
    }
    const cx = Math.min(Math.max(target.x + target.w / 2, w / 2 + 12), vw - w / 2 - 12);
    const spaceBelow = vh - (target.y + target.h) - GAP;
    const spaceAbove = target.y - GAP;
    const wantBottom = step.side === 'bottom';
    const useBottom = wantBottom ? spaceBelow >= h || spaceBelow >= spaceAbove : spaceAbove < h && spaceBelow > spaceAbove;
    placedSide = useBottom ? 'bottom' : 'top';
    const y = useBottom ? target.y + target.h + GAP : target.y - GAP - h;
    pop = { x: Math.min(Math.max(cx - w / 2, 12), vw - w - 12), y: Math.max(12, Math.min(y, vh - h - 12)), w, h };
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
  <div class="fixed inset-0 z-[200] font-arabic select-none" dir="rtl" role="dialog" aria-label="الجولة التعريفية">
    <!-- Dim + cutout -->
    <svg class="absolute inset-0 h-full w-full" onmousedown={stopGuideTour} aria-hidden="true">
      <path
        d={`M 0,0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z ${cutout}`}
        fill="rgba(7, 18, 16, 0.78)"
        fill-rule="evenodd"
      />
      {#if line}
        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#f2cf77" stroke-width="2" />
        <rect
          x={line.x2 - 5}
          y={line.y2 - 5}
          width="10"
          height="10"
          transform={`rotate(45 ${line.x2} ${line.y2})`}
          fill="#f2cf77"
          stroke="#0a1b18"
          stroke-width="2"
        />
      {/if}
    </svg>

    {#if target}
      <!-- Viewfinder corner brackets -->
      {@const c = target}
      <div class="pointer-events-none absolute" style="left:{c.x}px;top:{c.y}px;width:{c.w}px;height:{c.h}px;">
        <span class="tb-corner" style="top:-2px;right:-2px;border-top:3px solid #f2cf77;border-right:3px solid #f2cf77;"></span>
        <span class="tb-corner" style="top:-2px;left:-2px;border-top:3px solid #f2cf77;border-left:3px solid #f2cf77;"></span>
        <span class="tb-corner" style="bottom:-2px;right:-2px;border-bottom:3px solid #f2cf77;border-right:3px solid #f2cf77;"></span>
        <span class="tb-corner" style="bottom:-2px;left:-2px;border-bottom:3px solid #f2cf77;border-left:3px solid #f2cf77;"></span>
        <span class="absolute inset-0 border border-wheat-gold/40 shadow-[0_0_35px_rgba(242,207,119,0.35)]"></span>
      </div>
    {/if}

    <!-- Card -->
    <div
      bind:this={popEl}
      class="absolute w-[348px] max-w-[calc(100vw-24px)] modal-card scroll-area overflow-y-auto bg-forest-deep border-2 border-wheat-mid/80 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-wheat-light"
      style="left:{pop.x}px;top:{pop.y}px;"
    >
      <div class="px-5 pt-4">
        <div class="flex items-center justify-between gap-2">
          <span class="px-1.5 py-0.5 bg-wheat-gold/20 text-wheat-gold text-[9px] font-bold border border-wheat-gold/40">
            {step.badge}
          </span>
          <button
            onclick={stopGuideTour}
            class="px-2 py-0.5 text-[11px] text-wheat-dark hover:text-wheat-gold hover:bg-forest-mid transition-colors cursor-pointer font-heading"
            aria-label="تخطي الجولة"
          >
            تخطي ✕
          </button>
        </div>
        <div class="flex items-center gap-2.5 pt-2">
          <GameIcon name={step.icon} cls="w-8 h-8 shrink-0" />
          <h3 class="text-[17px] font-bold font-heading leading-snug">{step.title}</h3>
        </div>
        <div class="h-[3px] w-14 bg-wheat-gold/80 mt-2"></div>
      </div>

      <div class="tour-body px-5 py-3 text-[12.5px] leading-[2] text-wheat-light/90">
        {@html step.body}
      </div>

      <div class="px-5 pb-4 pt-1 bg-charcoal-deep border-t border-charcoal-mid">
        <div class="flex items-center gap-2 py-2.5">
          <div class="relative flex-1 h-1 bg-charcoal-mid" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={1} aria-valuemax={TOUR_STEPS.length}>
            <div class="absolute inset-y-0 right-0 bg-wheat-gold transition-all" style="width: {((idx + 1) / TOUR_STEPS.length) * 100}%"></div>
          </div>
          <span class="text-[11px] text-wheat-dark font-mono shrink-0"><bdi>{idx + 1} / {TOUR_STEPS.length}</bdi></span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <button
            onclick={tourPrev}
            disabled={isFirst}
            class="px-3.5 py-1.5 border border-charcoal-mid text-xs font-heading font-bold transition-all {isFirst
              ? 'opacity-30 cursor-not-allowed text-wheat-dark'
              : 'text-wheat-mid hover:text-wheat-light hover:border-wheat-mid cursor-pointer'}"
          >
            السابق
          </button>
          <button
            onclick={tourNext}
            class="px-4 py-1.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep text-xs font-heading font-bold transition-all shadow-md cursor-pointer"
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
    color: #f2cf77;
  }
  /* Numeric/mixed tokens stay LTR-isolated so comparisons never scramble */
  .tour-body :global(bdi) {
    unicode-bidi: isolate;
    font-family: 'Thmanyah Sans', system-ui, sans-serif;
  }
  .tour-body :global(.lead) {
    color: rgba(242, 234, 211, 0.95);
  }
  /* Takeaway lists: square gold markers match the zero-radius UI language */
  .tour-body :global(ul) {
    display: grid;
    gap: 7px;
    margin-top: 9px;
  }
  .tour-body :global(li) {
    position: relative;
    padding-right: 17px;
    color: rgba(242, 234, 211, 0.82);
  }
  .tour-body :global(li::before) {
    content: "";
    position: absolute;
    right: 0;
    top: 13px;
    width: 7px;
    height: 7px;
    background: #f2cf77;
    opacity: 0.85;
  }
  /* RRI legend tones */
  .tour-body :global(li[data-tone="good"]::before) { background: #4ec7b4; }
  .tour-body :global(li[data-tone="warn"]::before) { background: #fbbf24; }
  .tour-body :global(li[data-tone="bad"]::before) { background: #f87171; }
</style>
