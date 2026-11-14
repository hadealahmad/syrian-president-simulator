<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { previewRangesStore, projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import { selectStatAndJump } from '../shell/section-nav';
  import { statState } from '../panels/shared';
  import KpiTile from './KpiTile.svelte';
  import LedgerBlock from './LedgerBlock.svelte';
  import TickValue from './TickValue.svelte';
  import {
    KPI_STATS,
    METER_FILL,
    explainerFor,
    fmtAbsDelta,
    fmtVal,
    formatBillion,
    formatNumber,
    meterTone,
    signed,
    signedPct,
    suffixFor,
    type ProjectedKey,
  } from './stat-catalog';

  let p = $derived($projectedTurnStore);
  let macro = $derived($gameStore.macro);
  let ranges = $derived($previewRangesStore);
  let selectedStat = $derived($uiStore.selectedStatForOptions);

  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));

  function kpiValueTone(statId: string, key: ProjectedKey, value: number): 'default' | 'neg' {
    if (key === 'treasurySYP' && value < 0) return 'neg';
    if (statState(statId, value) === 'crit') return 'neg';
    return 'default';
  }

  let macroRows = $derived([
    { label: 'السعر الرسمي للدولار', value: formatNumber(macro.officialRateSYP), suffix: 'SP' },
    { label: 'سلة الغذاء الشهرية', value: formatNumber(macro.monthlyFoodBasketSYP), suffix: 'SP' },
    { label: 'الراتب الاسمي للموظف', value: formatNumber(macro.civilServiceWageSYP), suffix: 'SP' },
    { label: 'التضخم السنوي', value: `${macro.annualInflationPct}%` },
    { label: 'قدرة التوليد المتاحة', value: formatNumber(macro.gridCapacityMW), suffix: 'م.و' },
  ]);

  let rangeRows = $derived([
    {
      label: 'كفاية الاحتياطي',
      value: `${ranges.runwayMonthsEstimated}`,
      numericValue: ranges.runwayMonthsEstimated,
      formatNum: (n: number) => `${Math.round(n)}`,
      suffix: 'شهراً',
    },
    {
      label: 'عجز الموازنة',
      value: `${formatBillion(ranges.deficitSYP)}B`,
      numericValue: ranges.deficitSYP,
      formatNum: (n: number) => `${formatBillion(n)}B`,
      suffix: 'SP',
      emphasize: true,
    },
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
      numericValue: ranges.requiresPrintingSYP,
      formatNum: (n: number) => `${formatBillion(n)}B`,
      suffix: 'SP',
      emphasize: true,
    },
  ]);

  function useStatFilter(id: string): void {
    selectStatAndJump(id);
  }
</script>

<div class="space-y-2">
  <!-- Slim single-line turn context + fiscal runway -->
  <div
    class="flex items-center justify-between gap-2 border border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 py-1.5 text-[11px]"
  >
    <span class="truncate leading-[1.4] text-[var(--c-muted)]">
      الدور <span dir="ltr" class="oc-kit-num font-bold text-[var(--c-text)]">{turnText}/40</span>
      · <span dir="ltr" class="oc-kit-num">{$gameStore.calendarYear}</span>
      · {seasonText}
    </span>
    <span class="shrink-0 text-[var(--c-muted)]">
      الاحتياطي:
      <TickValue
        value={ranges.runwayMonthsEstimated}
        format={(n) => `${Math.round(n)}`}
        class="font-bold {ranges.runwayMonthsEstimated <= 6
          ? 'text-[var(--c-neg)]'
          : 'text-[var(--c-pos)]'}"
      />
      شهراً
    </span>
  </div>

  <section class="space-y-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <h3 class="text-[11.5px] font-bold text-[var(--c-muted)]">
        المؤشرات المسقطة للدور القادم
      </h3>
      <span class="text-[11px] text-[var(--c-disabled)]">الحالي ← المتوقع</span>
    </div>

    <div class="oc-kpi-grid">
      {#each KPI_STATS as spec, i (spec.key)}
        {@const stat = p[spec.key]}
        <KpiTile
          label={spec.labelAr}
          icon={spec.icon}
          fmt={spec.fmt}
          value={fmtVal(spec.fmt, stat.current)}
          suffix={suffixFor(spec.fmt)}
          projected={stat.isChanged ? fmtVal(spec.fmt, stat.projected) : ''}
          pctChange={stat.pctChange}
          pctText={stat.isChanged ? signedPct(stat.pctChange) : ''}
          delta={stat.isChanged ? fmtAbsDelta(spec.fmt, Math.abs(stat.projected - stat.current)) : ''}
          deltaArrow={stat.isChanged ? (stat.projected > stat.current ? '▲' : '▼') : ''}
          changed={stat.isChanged}
          beneficial={stat.isBeneficial}
          valueTone={kpiValueTone(spec.statId, spec.key, stat.current)}
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

  <p class="text-[11px] leading-relaxed text-[var(--c-muted)]">
    اضغط أيقونة التصفية في زاوية البطاقة لعرض القرارات المرتبطة، أو «؟» لقراءة الشرح.
  </p>
</div>
