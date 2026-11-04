<script lang="ts">
  // Thin range meter for bounded KPIs: current fill, projected marker and an
  // optional danger tripwire (e.g. the $8 wage line). Purely presentational.
  interface Props {
    min: number;
    max: number;
    current: number;
    projected?: number | null;
    dangerAt?: number;
    fillClass?: string;
    /** Extra class for the track height (phones use a taller hit-visible bar). */
    sizeClass?: string;
  }

  let {
    min,
    max,
    current,
    projected = null,
    dangerAt,
    fillClass = 'bg-forest-accent',
    sizeClass = 'h-1.5',
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
  class="relative w-full overflow-hidden bg-wheat-light/8 shell-round-chip {sizeClass}"
  aria-hidden="true"
>
  <span
    class="block h-full shell-round-chip transition-[width] duration-500 motion-reduce:transition-none {fillClass}"
    style="width: {currentPct}%; margin-inline-start: 0;"
  ></span>
  {#if dangerPct !== null}
    <span
      class="absolute inset-y-0 w-px bg-umber-crimson/70"
      style="inset-inline-start: {dangerPct}%"
      aria-hidden="true"
    ></span>
  {/if}
  {#if projectedPct !== null && Math.abs(projectedPct - currentPct) > 0.4}
    <span
      class="absolute -top-0.5 -bottom-0.5 w-0.5 bg-wheat-light/90"
      style="inset-inline-start: {projectedPct}%"
      aria-hidden="true"
    ></span>
  {/if}
</div>
