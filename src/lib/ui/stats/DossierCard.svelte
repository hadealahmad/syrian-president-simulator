<script lang="ts">
  import MeterBar from './MeterBar.svelte';

  // Special-dossier card (Golan/Quneitra, Golan/Daraa, Suwayda): title,
  // watch-line description, one headline gauge, optional secondary gauges.
  // Every number/status string from the old inline blocks is kept verbatim.
  type DossierTone = 'ok' | 'warn' | 'crit';

  interface SubMetric {
    label: string;
    value: string;
    pct: number;
    tone: DossierTone;
    note?: string;
  }

  interface Props {
    title: string;
    description: string;
    statusAr: string;
    tone: DossierTone;
    metricLabel: string;
    metricValue: string;
    metricNote?: string;
    metricPct: number;
    subMetrics?: SubMetric[];
  }

  let {
    title,
    description,
    statusAr,
    tone,
    metricLabel,
    metricValue,
    metricNote = '',
    metricPct,
    subMetrics = [],
  }: Props = $props();

  const CARD_TONE: Record<DossierTone, string> = {
    crit: 'border-umber-border/70 bg-umber-deep/25',
    warn: 'border-wheat-mid/25 bg-forest-surface/30',
    ok: 'border-forest-accent/25 bg-forest-mid/20',
  };

  const CHIP_TONE: Record<DossierTone, string> = {
    crit: 'border-umber-border bg-umber-deep text-umber-crimson',
    warn: 'border-status-warn/40 bg-status-warn/10 text-status-warn',
    ok: 'border-forest-accent/40 bg-forest-accent/10 text-forest-accent',
  };

  const DOT_TONE: Record<DossierTone, string> = {
    crit: 'bg-umber-crimson',
    warn: 'bg-status-warn',
    ok: 'bg-forest-accent',
  };

  const VALUE_TONE: Record<DossierTone, string> = {
    crit: 'text-umber-crimson',
    warn: 'text-status-warn',
    ok: 'text-forest-accent',
  };

  const FILL_TONE: Record<DossierTone, string> = {
    crit: 'bg-umber-crimson',
    warn: 'bg-status-warn',
    ok: 'bg-forest-accent',
  };
</script>

<article class="space-y-2 border p-2.5 shell-round-item {CARD_TONE[tone]}">
  <header class="flex items-start justify-between gap-2">
    <div class="flex min-w-0 items-start gap-1.5">
      <span
        class="mt-1.5 h-1.5 w-1.5 shrink-0 shell-round-chip {DOT_TONE[tone]}"
        aria-hidden="true"
      ></span>
      <div class="min-w-0">
        <h4 class="text-[11.5px] font-bold leading-snug text-wheat-gold font-heading">
          {title}
        </h4>
        <p class="mt-0.5 text-[9.5px] leading-relaxed text-wheat-dark">
          {description}
        </p>
      </div>
    </div>
    <span class="shrink-0 border px-1.5 py-0.5 text-[8.5px] font-bold leading-tight shell-round-chip {CHIP_TONE[tone]}">
      {statusAr}
    </span>
  </header>

  <div class="space-y-1">
    <div class="flex items-baseline justify-between gap-2 text-[10px]">
      <span class="min-w-0 text-wheat-dark">{metricLabel}</span>
      <span class="shrink-0 font-mono font-bold {VALUE_TONE[tone]}">
        <span dir="ltr">{metricValue}</span>
        {#if metricNote}<span class="ms-1 text-[8.5px] font-normal text-wheat-dark">{metricNote}</span>{/if}
      </span>
    </div>
    <MeterBar
      min={0}
      max={100}
      current={metricPct}
      fillClass={FILL_TONE[tone]}
      sizeClass="h-2"
    />
  </div>

  {#if subMetrics.length > 0}
    <div class="grid grid-cols-2 gap-2 border-t border-wheat-mid/10 pt-2">
      {#each subMetrics as sub (sub.label)}
        <div class="min-w-0 space-y-0.5">
          <div class="flex items-baseline justify-between gap-1 text-[9.5px] text-wheat-dark">
            <span class="min-w-0 truncate">{sub.label}</span>
            <span dir="ltr" class="shrink-0 font-mono font-bold {VALUE_TONE[sub.tone]}">{sub.value}</span>
          </div>
          <div class="h-1 w-full overflow-hidden bg-charcoal-surface shell-round-chip">
            <span class="block h-full {FILL_TONE[sub.tone]}" style="width: {Math.min(100, Math.max(2, sub.pct))}%"></span>
          </div>
          {#if sub.note}<span class="block text-[8px] text-wheat-dark">{sub.note}</span>{/if}
        </div>
      {/each}
    </div>
  {/if}
</article>
