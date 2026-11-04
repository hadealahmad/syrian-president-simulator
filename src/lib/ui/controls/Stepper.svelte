<script lang="ts">
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
    onchange(clamp(next));
  }
</script>

<div
  class="inline-flex min-h-11 items-stretch overflow-hidden border border-charcoal-mid bg-charcoal-surface {disabled
    ? 'opacity-50'
    : ''}"
  role="group"
  aria-label={label}
>
  <button
    type="button"
    class="flex h-11 w-11 shrink-0 items-center justify-center border-e border-charcoal-mid font-mono text-lg leading-none text-wheat-mid transition-colors hover:bg-forest-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
    aria-label="إنقاص {label}"
    disabled={disabled || value <= min}
    onclick={() => commit(value - step)}>−</button
  >
  <span
    class="flex min-w-16 flex-1 items-center justify-center px-2 font-heading text-[13px] font-bold text-wheat-light"
    aria-live="polite"
    dir="ltr">{display}</span
  >
  <button
    type="button"
    class="flex h-11 w-11 shrink-0 items-center justify-center border-s border-charcoal-mid font-mono text-lg leading-none text-wheat-mid transition-colors hover:bg-forest-mid hover:text-wheat-gold disabled:cursor-not-allowed disabled:opacity-40"
    aria-label="رفع {label}"
    disabled={disabled || value >= max}
    onclick={() => commit(value + step)}>+</button
  >
</div>
