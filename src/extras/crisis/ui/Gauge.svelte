<script lang="ts">
  import { Spring } from 'svelte/motion';
  import type { GaugeFlyChip } from '../animate';

  let {
    balance,
    projectedBalance,
    lanePlayerHits,
    laneCrisisHits,
    flyChips = [],
    wouldTriggerBossPhase2 = false,
  }: {
    balance: number;
    projectedBalance: number;
    lanePlayerHits: [number, number, number, number];
    laneCrisisHits: [number, number, number, number];
    flyChips?: GaugeFlyChip[];
    wouldTriggerBossPhase2?: boolean;
  } = $props();

  // Slight overshoot spring for tactile needle movement
  const needleSpring = new Spring(0, { stiffness: 0.22, damping: 0.44 });

  function isReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  $effect(() => {
    const clamped = Math.max(-5, Math.min(5, balance));
    if (isReducedMotion()) {
      void needleSpring.set(clamped, { instant: true });
    } else {
      void needleSpring.set(clamped);
    }
  });

  const solidPct = $derived(
    Math.max(0.5, Math.min(99.5, ((needleSpring.current + 5) / 10) * 100)),
  );
  const ghostClamped = $derived(Math.max(-5, Math.min(5, projectedBalance)));
  const ghostPct = $derived(((ghostClamped + 5) / 10) * 100);

  function fmtSigned(n: number): string {
    if (n > 0) return `+${n}`;
    if (n < 0) return `−${Math.abs(n)}`;
    return '0';
  }

  const hasAnyLaneHit = $derived(
    flyChips.length > 0 ||
      lanePlayerHits.some((h) => h > 0) ||
      laneCrisisHits.some((h) => h > 0),
  );

  const NOTCHES = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
</script>

<div
  data-coach="gauge-preview"
  class="crisis-board-group flex flex-col gap-[2px]"
  aria-label={`الميزان الحالي ${fmtSigned(balance)} والمتوقع ${fmtSigned(projectedBalance)}`}
>
  <!-- Lane-aligned gauge hit chips (larger, crisp chips when any lane hits gauge) -->
  {#if hasAnyLaneHit}
    <div class="crisis-board-row min-h-[19px] lg:min-h-[23px]">
      {#each [0, 1, 2, 3] as lane (lane)}
        {@const pHit = lanePlayerHits[lane]}
        {@const cHit = laneCrisisHits[lane]}
        {@const fly = flyChips.find((f) => f.lane === lane)}
        <div class="flex items-center justify-center gap-1">
          {#if fly}
            <span
              class="num border border-[var(--c-ink)] px-1.5 py-[1.5px] text-[12.5px] font-extrabold leading-none lg:px-2 lg:py-[2px] lg:text-[14px] {fly.tone ===
              'pos'
                ? 'bg-[var(--c-pos)] text-[var(--c-ink)]'
                : 'bg-[var(--c-neg)] text-[var(--c-ink)]'}"
            >
              <bdi dir="ltr">{fly.text}</bdi>
            </span>
          {:else}
            {#if cHit > 0}
              <span
                class="num inline-flex items-center gap-0.5 border border-[var(--c-neg)] bg-[var(--c-ev-bg)] px-1.5 py-[1.5px] text-[12px] font-extrabold leading-none text-[var(--c-neg)] lg:px-2 lg:py-[2px] lg:text-[13.5px]"
                title={`ضربة أزمة على الميزان: −${cHit}`}
              >
                <span class="text-[10px]" aria-hidden="true">▼</span><bdi dir="ltr">−{cHit}</bdi>
              </span>
            {/if}
            {#if pHit > 0}
              <span
                class="num inline-flex items-center gap-0.5 border border-[var(--c-pos)] bg-[var(--c-panel)] px-1.5 py-[1.5px] text-[12px] font-extrabold leading-none text-[var(--c-pos)] lg:px-2 lg:py-[2px] lg:text-[13.5px]"
                title={`دفع الميزان لصالحك: +${pHit}`}
              >
                <span class="text-[10px]" aria-hidden="true">▲</span><bdi dir="ltr">+{pHit}</bdi>
              </span>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Header line just above the bar: «الميزان» + big current number + preview arrow («0 ← +2») -->
  <div class="flex items-baseline justify-between gap-2 leading-none">
    <div class="flex items-baseline gap-1.5">
      <span class="text-[10.5px] font-bold text-[var(--c-muted)] lg:text-[11.5px]">الميزان</span>
      <bdi
        dir="ltr"
        class="num text-[17px] font-extrabold leading-none sm:text-[18px] lg:text-[21px] {balance > 0
          ? 'text-[var(--c-pos)]'
          : balance < 0
            ? 'text-[var(--c-neg)]'
            : 'text-[var(--c-text)]'}"
      >
        {fmtSigned(balance)}
      </bdi>
      {#if projectedBalance !== balance || wouldTriggerBossPhase2}
        <span aria-hidden="true" class="text-[11.5px] font-bold text-[var(--c-muted)] lg:text-[13px]">←</span>
        <bdi
          dir="ltr"
          class="num text-[14.5px] font-extrabold leading-none sm:text-[15.5px] lg:text-[18px] {wouldTriggerBossPhase2
            ? 'text-[var(--c-accent)]'
            : projectedBalance > balance
              ? 'text-[var(--c-pos)]'
              : 'text-[var(--c-neg)]'}"
        >
          {fmtSigned(projectedBalance)}
        </bdi>
      {/if}
    </div>

    {#if wouldTriggerBossPhase2}
      <span class="text-[10px] font-bold text-[var(--c-accent)] lg:text-[11px]">
        بلوغ المرحلة 2
      </span>
    {/if}
  </div>

  <!-- 11-notch stability bar (-5 crisis collapse .. +5 player relief) -->
  <div
    dir="ltr"
    class="relative flex h-[19px] w-full items-center border border-[var(--c-line-strong)] bg-[var(--c-strip)] px-2 sm:h-[22px] lg:h-[26px]"
  >
    <!-- End danger/victory zones -->
    <div
      class="pointer-events-none absolute inset-y-0 left-0 w-[18%]"
      style="background: color-mix(in srgb, var(--c-neg) 22%, transparent);"
    ></div>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-[18%]"
      style="background: color-mix(in srgb, var(--c-pos) 22%, transparent);"
    ></div>

    <!-- End labels: crisis side (انهيار −5) and player side (+5 انفراج) -->
    <span class="pointer-events-none relative z-10 flex items-center gap-1 text-[9.5px] font-bold text-[var(--c-neg)] lg:text-[11px]">
      <span class="num">−5</span>
      <span dir="rtl">انهيار</span>
    </span>

    <div class="relative mx-2 h-full flex-1">
      <!-- 11 notches (-5..+5) -->
      {#each NOTCHES as n (n)}
        {@const pct = ((n + 5) / 10) * 100}
        <span
          class="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 {n === 0
            ? 'h-[13px] w-[2px] bg-[var(--c-line-strong)]'
            : Math.abs(n) === 5
              ? 'h-[11px] w-[1px] bg-[var(--c-muted)]'
              : 'h-[7px] w-[1px] bg-[var(--c-line)]'}"
          style="left: {pct}%;"
        ></span>
      {/each}

      <!-- Ghost needle at projectedBalance -->
      {#if projectedBalance !== balance || wouldTriggerBossPhase2}
        <div
          class="pointer-events-none absolute -inset-y-[1px] z-20 -translate-x-1/2 border-l-2 border-dashed {wouldTriggerBossPhase2
            ? 'border-[var(--c-accent)]'
            : projectedBalance > balance
              ? 'border-[var(--c-pos)]'
              : 'border-[var(--c-neg)]'}"
          style="left: {ghostPct}%;"
          title={`الميزان المتوقع: ${fmtSigned(projectedBalance)}`}
        >
          <span
            class="absolute -top-[2px] left-1/2 h-[4px] w-[6px] -translate-x-1/2 {wouldTriggerBossPhase2
              ? 'bg-[var(--c-accent)]'
              : projectedBalance > balance
                ? 'bg-[var(--c-pos)]'
                : 'bg-[var(--c-neg)]'}"
          ></span>
        </div>
      {/if}

      <!-- Solid current needle (Spring animated with slight overshoot) -->
      <div
        class="pointer-events-none absolute -inset-y-[2px] z-30 w-[5px] -translate-x-1/2 border border-[var(--c-ink)] bg-[var(--c-text)]"
        style="left: {solidPct}%;"
      ></div>
    </div>

    <span class="pointer-events-none relative z-10 flex items-center gap-1 text-[9.5px] font-bold text-[var(--c-pos)] lg:text-[11px]">
      <span dir="rtl">انفراج</span>
      <span class="num">+5</span>
    </span>
  </div>
</div>
