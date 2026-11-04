<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { previewRangesStore, projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import KpiTile from './KpiTile.svelte';
  import LedgerBlock from './LedgerBlock.svelte';
  import {
    KPI_STATS,
    METER_FILL,
    explainerFor,
    fmtVal,
    formatBillion,
    formatNumber,
    meterTone,
    signed,
    signedPct,
    suffixFor,
    valueTone,
  } from './stat-catalog';

  let p = $derived($projectedTurnStore);
  let macro = $derived($gameStore.macro);
  let ranges = $derived($previewRangesStore);
  let selectedStat = $derived($uiStore.selectedStatForOptions);

  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));

  // Current-only macro figures — the same five rows the table listed under
  // "مؤشرات كلية حالية".
  let macroRows = $derived([
    { label: 'السعر الرسمي للدولار', value: formatNumber(macro.officialRateSYP), suffix: 'SP' },
    { label: 'سلة الغذاء الشهرية', value: formatNumber(macro.monthlyFoodBasketSYP), suffix: 'SP' },
    { label: 'الراتب الاسمي للموظف', value: formatNumber(macro.civilServiceWageSYP), suffix: 'SP' },
    { label: 'التضخم السنوي', value: `${macro.annualInflationPct}%` },
    { label: 'قدرة التوليد المتاحة', value: formatNumber(macro.gridCapacityMW), suffix: 'م.و' },
  ]);

  // Rehearsal bands — unchanged numbers from `previewRangesStore`.
  let rangeRows = $derived([
    {
      label: 'كفاية الاحتياطي',
      value: `${ranges.runwayMonthsEstimated}`,
      suffix: 'شهراً',
      tone: ranges.runwayMonthsEstimated <= 6 ? 'text-umber-crimson' : 'text-forest-accent',
    },
    { label: 'عجز الموازنة', value: `${formatBillion(ranges.deficitSYP)}B`, suffix: 'SP' },
    {
      label: 'النطاق المرجح للصرف',
      value: `${formatNumber(ranges.fxRateMin)} - ${formatNumber(ranges.fxRateMax)}`,
    },
    {
      label: 'نطاق الأجر المتوقع',
      value: `$${Math.round(ranges.realWageMin)} - $${Math.round(ranges.realWageMax)}`,
    },
    {
      label: 'نطاق تغير الاحتقان',
      value: `${signed(ranges.rriChangeMin)} .. ${signed(ranges.rriChangeMax)}`,
    },
    {
      label: 'الطباعة النقدية المطلوبة',
      value: `${formatBillion(ranges.requiresPrintingSYP)}B`,
      suffix: 'SP',
    },
  ]);

  function useStatFilter(id: string): void {
    uiStore.openStatRelatedOptions(id);
  }
</script>

<div class="space-y-3">
  <!-- Turn context + fiscal runway (the old table header, kept intact). -->
  <div
    class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-wheat-mid/15 bg-forest-mid/20 px-2.5 py-2 shell-round-item"
  >
    <span class="font-mono text-[10px] text-wheat-dark">
      الدور <span dir="ltr" class="font-bold text-wheat-mid">{turnText}/40</span>
      · <span dir="ltr">{$gameStore.calendarYear}</span>
      · {seasonText}
    </span>
    <span class="text-[10px] text-wheat-dark">
      كفاية الاحتياطي:
      <span
        dir="ltr"
        class="font-mono font-bold {ranges.runwayMonthsEstimated <= 6
          ? 'text-umber-crimson'
          : 'text-forest-accent'}"
      >
        {ranges.runwayMonthsEstimated}
      </span>
      شهراً
    </span>
  </div>

  <section class="space-y-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <h3 class="flex items-center gap-2 text-[9px] font-bold tracking-[1.2px] text-forest-accent/90">
        <span class="h-px w-3 bg-forest-accent/50" aria-hidden="true"></span>
        المؤشرات المسقطة للدور القادم
      </h3>
      <span class="text-[8.5px] text-wheat-dark">الحالي ← المتوقع</span>
    </div>

    <div class="grid grid-cols-2 items-stretch gap-2">
      {#each KPI_STATS as spec, i (spec.key)}
        {@const stat = p[spec.key]}
        <KpiTile
          label={spec.labelAr}
          icon={spec.icon}
          value={fmtVal(spec.fmt, stat.current)}
          suffix={suffixFor(spec.fmt)}
          projected={stat.isChanged ? fmtVal(spec.fmt, stat.projected) : ''}
          delta={stat.isChanged ? signedPct(stat.pctChange) : ''}
          changed={stat.isChanged}
          beneficial={stat.isBeneficial}
          valueClass={valueTone(spec.statId, spec.key, stat.current)}
          fillClass={METER_FILL[meterTone(spec.statId, spec.key, stat.current)]}
          min={spec.range?.min ?? Number.NaN}
          max={spec.range?.max ?? Number.NaN}
          dangerAt={spec.range?.dangerAt}
          current={stat.current}
          projectedValue={stat.isChanged ? stat.projected : null}
          explainer={explainerFor(spec.statId)}
          statId={spec.statId}
          selected={selectedStat === spec.statId}
          onfilter={useStatFilter}
          wide={i === KPI_STATS.length - 1 && KPI_STATS.length % 2 === 1}
        />
      {/each}
    </div>
  </section>

  <LedgerBlock title="مؤشرات كلية حالية" rows={macroRows} />
  <LedgerBlock title="التوقعات النطاقية للبروفة" rows={rangeRows} />

  <p class="text-[9px] leading-relaxed text-wheat-dark">
    اضغط «الخيارات المرتبطة» في أي بطاقة لتصفية القرارات التي تحرّك هذا المؤشر، أو «؟» لقراءة الشرح.
  </p>
</div>
