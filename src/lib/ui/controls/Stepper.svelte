<script lang="ts">
  import './econ-plates.css';
  import { triggerFx } from './feedback-bridge';

  interface Props {
    value: number;
    min: number;
    max: number;
    step?: number;
    label: string;
    onchange: (value: number) => void;
    format?: (value: number) => string;
    disabled?: boolean;
  }

  let {
    value,
    min,
    max,
    step = 1,
    label,
    onchange,
    format,
    disabled = false,
  }: Props = $props();

  let display = $derived(format ? format(value) : value.toLocaleString('en-US'));

  function clamp(next: number): number {
    const stepped = min + Math.round((next - min) / step) * step;
    return Number(Math.min(max, Math.max(min, stepped)).toFixed(6));
  }

  function commit(next: number): void {
    if (disabled) return;
    const clamped = clamp(next);
    if (clamped !== value) {
      triggerFx('select');
    }
    onchange(clamped);
  }
</script>

<div
  class="inline-flex min-h-11 items-stretch border border-[var(--c-line)] bg-[var(--c-panel)] {disabled
    ? 'opacity-50'
    : ''}"
  role="group"
  aria-label={label}
>
  <button
    type="button"
    class="pressable flex h-11 w-11 shrink-0 items-center justify-center border-e border-[var(--c-line)] bg-[var(--c-bg)] p-0 font-heading text-lg leading-none text-wheat-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
    aria-label="إنقاص {label}"
    disabled={disabled || value <= min}
    onclick={() => commit(value - step)}>−</button
  >
  <span
    class="num flex min-w-16 flex-1 items-center justify-center px-2.5 text-[14px] font-bold text-wheat-gold"
    aria-live="polite"
    dir="ltr">{display}</span
  >
  <button
    type="button"
    class="pressable flex h-11 w-11 shrink-0 items-center justify-center border-s border-[var(--c-line)] bg-[var(--c-bg)] p-0 font-heading text-lg leading-none text-wheat-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
    aria-label="رفع {label}"
    disabled={disabled || value >= max}
    onclick={() => commit(value + step)}>+</button
  >
</div>
