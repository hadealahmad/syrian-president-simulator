<script lang="ts">
  interface Props {
    min: number;
    max: number;
    current: number;
    projected?: number | null;
    dangerAt?: number;
    fillClass?: string;
    sizeClass?: string;
  }

  let {
    min,
    max,
    current,
    projected = null,
    dangerAt,
    fillClass = 'bg-[var(--c-pos)]',
    sizeClass = 'h-1',
  }: Props = $props();

  const span = $derived(Math.max(1, max - min));

  function pct(value: number): number {
    return Math.max(0, Math.min(100, ((value - min) / span) * 100));
  }

  let currentPct = $derived(pct(current));
  let projectedPct = $derived(projected === null ? null : pct(projected));
  let dangerPct = $derived(dangerAt === undefined ? null : pct(dangerAt));
</script>

<div
  class="relative w-full overflow-hidden bg-[var(--c-track)] {sizeClass}"
  aria-hidden="true"
>
  <span
    class="block h-full transition-[width] duration-500 motion-reduce:transition-none {fillClass}"
    style="width: {currentPct}%; margin-inline-start: 0;"
  ></span>
  {#if dangerPct !== null}
    <span
      class="absolute inset-y-0 w-px bg-[var(--c-neg)]"
      style="inset-inline-start: {dangerPct}%"
      aria-hidden="true"
    ></span>
  {/if}
  {#if projectedPct !== null && Math.abs(projectedPct - currentPct) > 0.4}
    <span
      class="absolute inset-y-0 w-0.5 bg-[var(--c-text)]"
      style="inset-inline-start: {projectedPct}%"
      aria-hidden="true"
    ></span>
  {/if}
</div>
