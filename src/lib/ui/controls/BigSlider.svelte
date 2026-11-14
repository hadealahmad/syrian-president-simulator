<script lang="ts">
  import './econ-plates.css';
  import { triggerFx } from './feedback-bridge';

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
    /** Optional formatted value overriding the framed badge's `format`/raw output. */
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

  let pct = $derived(max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0);
  let defaultPct = $derived(
    defaultValue !== undefined && max > min
      ? Math.max(0, Math.min(100, ((defaultValue - min) / (max - min)) * 100))
      : null
  );
  let display = $derived(
    displayOverride ?? (format ? format(value) : value.toLocaleString('en-US'))
  );

  function clamp(next: number): number {
    const stepped = min + Math.round((next - min) / step) * step;
    return Number(Math.min(max, Math.max(min, stepped)).toFixed(6));
  }

  function commit(next: number, playFx: boolean): void {
    if (disabled) return;
    const clamped = clamp(next);
    if (playFx && clamped !== value) {
      triggerFx('select');
    }
    onchange(clamped);
  }
</script>

<div class="min-w-0 {disabled ? 'opacity-50' : ''} {framed ? 'game-plate p-3' : ''}">
  {#if framed}
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="font-heading text-[13px] font-bold text-wheat-light">{label}</div>
        {#if hint}
          <p class="mt-0.5 text-[11px] leading-snug text-wheat-dark">{hint}</p>
        {/if}
      </div>
      <span
        class="num shrink-0 px-1 text-[17px] font-bold text-wheat-gold"
        dir="ltr"
      >
        {display}
      </span>
    </div>
  {/if}

  <div class="flex items-center gap-2 {framed ? 'mt-2' : ''}">
    <button
      type="button"
      class="pressable flex h-9 w-9 phone-p:h-11 phone-p:w-11 phone-l:h-11 phone-l:w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-bg)] p-0 font-heading text-lg leading-none text-wheat-mid hover:border-[var(--c-line-strong)] hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="إنقاص {label}"
      disabled={disabled || value <= min}
      onclick={() => commit(value - step, true)}>−</button
    >

    <div class="relative h-11 min-w-0 flex-1">
      <!-- Flat tactical track -->
      <div
        class="pointer-events-none absolute inset-x-0 top-[18px] h-2 bg-[var(--c-track)]"
        aria-hidden="true"
      >
        <div
          class="h-full bg-[var(--c-accent)]"
          style="width: {pct}%;"
        ></div>
      </div>

      {#if defaultPct !== null}
        <span
          class="pointer-events-none absolute top-[14px] z-[1] h-4 w-0.5 bg-[var(--c-muted)]"
          style="inset-inline-start: {defaultPct}%;"
          aria-hidden="true"
        ></span>
      {/if}

      <input
        type="range"
        class="slider-input absolute inset-x-0 top-0 z-[2] h-9 w-full"
        {min}
        {max}
        {step}
        {value}
        {disabled}
        dir="rtl"
        aria-label={ariaLabel || label}
        aria-valuetext={display}
        oninput={(event) => commit(Number(event.currentTarget.value), false)}
        onchange={() => {
          if (!disabled) triggerFx('select');
        }}
      />

      {#if minLabel || maxLabel}
        <div
          class="num pointer-events-none absolute inset-x-0.5 bottom-0 flex justify-between text-[11px] leading-none text-wheat-dark"
          aria-hidden="true"
        >
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      {/if}
    </div>

    <button
      type="button"
      class="pressable flex h-9 w-9 phone-p:h-11 phone-p:w-11 phone-l:h-11 phone-l:w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-bg)] p-0 font-heading text-lg leading-none text-wheat-mid hover:border-[var(--c-line-strong)] hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="رفع {label}"
      disabled={disabled || value >= max}
      onclick={() => commit(value + step, true)}>+</button
    >
  </div>
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
    width: 14px;
    height: 24px;
    margin-top: -8px;
    border: 1px solid var(--c-ink);
    border-radius: 0;
    background: var(--c-text);
  }

  .slider-input:focus-visible {
    outline: none;
  }

  .slider-input:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--c-accent);
    outline-offset: 1px;
  }

  .slider-input::-moz-range-track {
    height: 8px;
    border: 0;
    background: transparent;
  }

  .slider-input::-moz-range-thumb {
    width: 14px;
    height: 24px;
    border: 1px solid var(--c-ink);
    border-radius: 0;
    background: var(--c-text);
  }

  .slider-input:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--c-accent);
    outline-offset: 1px;
  }
</style>
