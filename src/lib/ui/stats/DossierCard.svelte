<script lang="ts">
  import MeterBar from './MeterBar.svelte';

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
    crit: 'border-[var(--c-line-strong)] bg-[var(--c-panel)]',
    warn: 'border-[var(--c-line)] bg-[var(--c-panel)]',
    ok: 'border-[var(--c-line)] bg-[var(--c-panel)]',
  };

  const CHIP_TONE: Record<DossierTone, string> = {
    crit: 'border-[var(--c-line-strong)] bg-[var(--c-strip)] text-[var(--c-neg)]',
    warn: 'border-[var(--c-line-strong)] bg-[var(--c-strip)] text-[var(--c-accent)]',
    ok: 'border-[var(--c-line-strong)] bg-[var(--c-strip)] text-[var(--c-pos)]',
  };

  const VALUE_TONE: Record<DossierTone, string> = {
    crit: 'text-[var(--c-neg)]',
    warn: 'text-[var(--c-accent)]',
    ok: 'text-[var(--c-pos)]',
  };

  const FILL_TONE: Record<DossierTone, string> = {
    crit: 'bg-[var(--c-neg)]',
    warn: 'bg-[var(--c-accent)]',
    ok: 'bg-[var(--c-pos)]',
  };
</script>

<article class="space-y-2 border p-2.5 {CARD_TONE[tone]}">
  <header class="flex items-start justify-between gap-2">
    <div class="min-w-0 flex-1">
      <h4 class="text-[12.5px] font-bold leading-snug text-[var(--c-text)]">
        {title}
      </h4>
      <p class="mt-0.5 text-[11.5px] leading-relaxed text-[var(--c-muted)]">
        {description}
      </p>
    </div>
    <span class="shrink-0 border px-2 py-0.5 text-[11px] font-bold leading-[1.38] {CHIP_TONE[tone]}">
      {statusAr}
    </span>
  </header>

  <div class="space-y-1">
    <div class="flex items-baseline justify-between gap-2 text-[11.5px]">
      <span class="min-w-0 text-[var(--c-muted)]">{metricLabel}</span>
      <span class="oc-kit-num shrink-0 font-bold {VALUE_TONE[tone]}">
        <span dir="ltr">{metricValue}</span>
        {#if metricNote}<span class="ms-1 text-[11px] font-normal text-[var(--c-muted)]">{metricNote}</span>{/if}
      </span>
    </div>
    <MeterBar
      min={0}
      max={100}
      current={metricPct}
      fillClass={FILL_TONE[tone]}
      sizeClass="h-[3px]"
    />
  </div>

  {#if subMetrics.length > 0}
    <div class="grid grid-cols-2 gap-2 border-t border-[var(--c-line)] pt-2">
      {#each subMetrics as sub (sub.label)}
        <div class="min-w-0 space-y-1">
          <div class="flex items-baseline justify-between gap-1 text-[11px] text-[var(--c-muted)]">
            <span class="min-w-0 truncate leading-[1.4]">{sub.label}</span>
            <span dir="ltr" class="oc-kit-num shrink-0 font-bold {VALUE_TONE[sub.tone]}">{sub.value}</span>
          </div>
          <MeterBar
            min={0}
            max={100}
            current={sub.pct}
            fillClass={FILL_TONE[sub.tone]}
            sizeClass="h-[3px]"
          />
          {#if sub.note}<span class="block text-[11px] text-[var(--c-muted)]">{sub.note}</span>{/if}
        </div>
      {/each}
    </div>
  {/if}
</article>
