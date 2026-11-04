<script lang="ts">
  interface Props {
    value: number;
    min: number;
    max: number;
    step?: number;
    /** Neutral / default value drawn as a tick on the track. */
    default?: number;
    label: string;
    onchange: (value: number) => void;
    format?: (value: number) => string;
    disabled?: boolean;
    minLabel?: string;
    maxLabel?: string;
    /** Optional formatted value overriding the bubble's `format`/raw output. */
    display?: string;
    /** Optional explanatory line, shown when the slider is framed. */
    hint?: string;
    /** Accessible name for the range input (defaults to `label`). */
    ariaLabel?: string;
    /** Draw the bordered card header used by the emergency panel. */
    framed?: boolean;
  }

  let {
    value,
    min,
    max,
    step = 1,
    default: defaultValue,
    label,
    onchange,
    format,
    disabled = false,
    minLabel = '',
    maxLabel = '',
    display: displayOverride,
    hint = '',
    ariaLabel = '',
    framed = false,
  }: Props = $props();

  let pct = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);
  let defaultPct = $derived(
    defaultValue !== undefined && max > min
      ? ((defaultValue - min) / (max - min)) * 100
      : null
  );
  let display = $derived(
    displayOverride ?? (format ? format(value) : value.toLocaleString('en-US'))
  );

  function clamp(next: number): number {
    const stepped = min + Math.round((next - min) / step) * step;
    return Number(Math.min(max, Math.max(min, stepped)).toFixed(6));
  }

  function commit(next: number): void {
    if (disabled) return;
    onchange(clamp(next));
  }
</script>

<div
  class="min-w-0 {disabled ? 'opacity-50' : ''} {framed
    ? 'border border-wheat-mid/15 bg-charcoal-surface/40 p-3 shell-round-pop'
    : ''}"
>
  {#if framed}
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
  {/if}

  <div class="flex items-center gap-1.5 {framed ? 'mt-2' : ''}">
    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center border border-charcoal-mid bg-charcoal-surface font-mono text-lg leading-none text-wheat-mid transition-colors hover:bg-forest-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="إنقاص {label}"
      disabled={disabled || value <= min}
      onclick={() => commit(value - step)}>−</button
    >

    <div class="relative min-w-0 flex-1 pt-5">
      <span
        class="slider-bubble pointer-events-none absolute top-0 z-10 whitespace-nowrap border border-wheat-gold/40 bg-forest-surface px-1.5 py-0.5 font-heading text-[10px] font-bold leading-tight text-wheat-gold"
        style="inset-inline-start: clamp(20px, {pct}%, calc(100% - 20px));"
        aria-hidden="true"
        >{display}</span
      >

      <div class="relative h-11">
        <div
          class="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden border border-charcoal-mid bg-charcoal-surface shell-round-chip"
          aria-hidden="true"
        >
          <div class="h-full bg-wheat-gold/60" style="width: {pct}%;"></div>
        </div>

        {#if defaultPct !== null}
          <span
            class="pointer-events-none absolute top-1/2 z-[1] h-4 w-px -translate-y-1/2 bg-wheat-light/70"
            style="inset-inline-start: {defaultPct}%;"
            aria-hidden="true"
          ></span>
        {/if}

        <input
          type="range"
          class="slider-input absolute inset-0 z-[2] h-11 w-full"
          {min}
          {max}
          {step}
          {value}
          {disabled}
          dir="rtl"
          aria-label={ariaLabel || label}
          aria-valuetext={display}
          oninput={(event) => commit(Number(event.currentTarget.value))}
        />
      </div>
    </div>

    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center border border-charcoal-mid bg-charcoal-surface font-mono text-lg leading-none text-wheat-mid transition-colors hover:bg-forest-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="رفع {label}"
      disabled={disabled || value >= max}
      onclick={() => commit(value + step)}>+</button
    >
  </div>

  {#if minLabel || maxLabel}
    <div class="mt-0.5 flex justify-between px-12 font-mono text-[9px] text-wheat-dark">
      <span>{minLabel}</span>
      <span>{maxLabel}</span>
    </div>
  {/if}
</div>

<style>
  .slider-input {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    touch-action: pan-y;
  }

  .slider-input:disabled {
    cursor: not-allowed;
  }

  .slider-input::-webkit-slider-runnable-track {
    height: 8px;
    border: 0;
    background: transparent;
  }

  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    margin-top: -10px;
    border: 2px solid var(--color-forest-deep);
    border-radius: 9999px;
    background: var(--color-wheat-gold);
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.45);
  }

  .slider-input:focus-visible {
    outline: none;
  }

  .slider-input:focus-visible::-webkit-slider-thumb {
    box-shadow:
      0 0 0 3px var(--color-forest-deep),
      0 0 0 5px var(--color-wheat-gold);
  }

  .slider-input::-moz-range-track {
    height: 8px;
    border: 0;
    background: transparent;
  }

  .slider-input::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-forest-deep);
    border-radius: 9999px;
    background: var(--color-wheat-gold);
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.45);
  }

  .slider-input:focus-visible::-moz-range-thumb {
    box-shadow:
      0 0 0 3px var(--color-forest-deep),
      0 0 0 5px var(--color-wheat-gold);
  }

  .slider-bubble {
    transform: translateX(50%);
  }

  :global([dir='ltr']) .slider-bubble {
    transform: translateX(-50%);
  }
</style>
