<script lang="ts">
  // Grouped read-only ledger used by the general tab for current macro figures
  // and rehearsal ranges (replaces the dense table's remaining rows).
  interface Row {
    label: string;
    value: string;
    suffix?: string;
    tone?: string;
  }

  interface Props {
    title: string;
    rows: Row[];
  }

  let { title, rows }: Props = $props();
</script>

<section class="space-y-1.5">
  <h3 class="flex items-center gap-2 text-[9px] font-bold tracking-[1.2px] text-forest-accent/90">
    <span class="h-px w-3 bg-forest-accent/50" aria-hidden="true"></span>
    {title}
  </h3>
  <dl class="border border-wheat-mid/15 bg-charcoal-deep/25 shell-round-item">
    {#each rows as row, i (row.label)}
      <div
        class="flex items-baseline justify-between gap-2 border-wheat-mid/8 px-2.5 py-1.5 {i > 0
          ? 'border-t'
          : ''}"
      >
        <dt class="min-w-0 text-[10px] leading-snug text-wheat-dark">{row.label}</dt>
        <dd class="flex shrink-0 items-baseline gap-1 font-mono text-[11px] font-bold {row.tone ?? 'text-wheat-light'}">
          <span dir="ltr">{row.value}</span>
          {#if row.suffix}<span class="text-[8px] font-normal text-wheat-dark">{row.suffix}</span>{/if}
        </dd>
      </div>
    {/each}
  </dl>
</section>
