<script lang="ts">
  interface Props {
    label: string;
    /** Current value in the slider's own units. */
    value: number;
    min: number;
    max: number;
    step: number;
    /** Formatted current value shown in the gold pill. */
    display: string;
    hint?: string;
    minLabel?: string;
    maxLabel?: string;
    ariaLabel?: string;
    onchange: (value: number) => void;
  }

  let {
    label,
    value,
    min,
    max,
    step,
    display,
    hint = '',
    minLabel = '',
    maxLabel = '',
    ariaLabel = '',
    onchange,
  }: Props = $props();

  let clamped = $derived(Math.max(min, Math.min(max, value)));
  let percent = $derived(max > min ? ((clamped - min) / (max - min)) * 100 : 0);
  let canDecrease = $derived(clamped > min);
  let canIncrease = $derived(clamped < max);

  function setValue(next: number): void {
    const snapped = Math.round(next / step) * step;
    onchange(Math.max(min, Math.min(max, snapped)));
  }
</script>

<div class="border border-wheat-mid/15 bg-charcoal-surface/40 p-3 shell-round-pop">
  <div class="flex items-start justify-between gap-2">
    <div class="min-w-0">
      <div class="font-heading text-xs font-bold text-wheat-gold">{label}</div>
      {#if hint}
        <p class="mt-0.5 text-[9px] leading-snug text-wheat-dark">{hint}</p>
      {/if}
    </div>
    <span
      class="shrink-0 border border-wheat-mid/30 bg-forest-surface px-2 py-0.5 font-mono text-[10px] font-bold text-wheat-gold shell-round-chip"
    >
      {display}
    </span>
  </div>

  <div class="mt-2 flex items-center gap-2">
    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center border border-charcoal-mid bg-charcoal-surface text-lg font-bold text-wheat-mid transition-colors hover:border-wheat-gold hover:text-wheat-gold focus-visible:border-wheat-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="إنقاص {label}"
      disabled={!canDecrease}
      onclick={() => setValue(clamped - step)}
    >
      −
    </button>

    <input
      type="range"
      class="range-stepper min-w-0 flex-1"
      style="--range-pct: {percent}%"
      {min}
      {max}
      {step}
      value={clamped}
      aria-label={ariaLabel || label}
      oninput={(event) => setValue(Number(event.currentTarget.value))}
    />

    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center border border-charcoal-mid bg-charcoal-surface text-lg font-bold text-wheat-mid transition-colors hover:border-wheat-gold hover:text-wheat-gold focus-visible:border-wheat-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="زيادة {label}"
      disabled={!canIncrease}
      onclick={() => setValue(clamped + step)}
    >
      +
    </button>
  </div>

  <div class="mt-1 flex justify-between font-mono text-[9px] text-wheat-dark">
    <span>{minLabel || min}</span>
    <span>{maxLabel || max}</span>
  </div>
</div>

<style>
  input.range-stepper {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border: 1px solid var(--color-charcoal-mid);
    cursor: pointer;
    /* RTL: the minimum sits at the inline-start (right) edge, so the filled
       portion is painted from the right toward the left. */
    background: linear-gradient(
      to left,
      var(--color-wheat-gold) 0%,
      var(--color-wheat-gold) var(--range-pct, 0%),
      var(--color-charcoal-surface) var(--range-pct, 0%),
      var(--color-charcoal-surface) 100%
    );
  }

  input.range-stepper:focus-visible {
    outline: 2px solid var(--color-wheat-gold);
    outline-offset: 3px;
  }

  :global(input.range-stepper)::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50% !important;
    background: var(--color-wheat-gold);
    border: 2px solid var(--color-forest-deep);
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.5);
  }

  :global(input.range-stepper)::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50% !important;
    background: var(--color-wheat-gold);
    border: 2px solid var(--color-forest-deep);
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.5);
  }
</style>
