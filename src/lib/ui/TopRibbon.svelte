<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { projectedTurnStore, previewRangesStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function formatTrillion(syp: number): string {
    const val = Number((syp / 1_000_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  function formatBillionUSD(usd: number): string {
    return (usd / 1_000_000_000).toFixed(2);
  }

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatMillionPeople(count: number): string {
    return (count / 1_000_000).toFixed(2);
  }

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
  let isRightOpen = $derived($uiStore.isMinistryDrawerOpen);
  let p = $derived($projectedTurnStore);
  let runwayMonths = $derived($previewRangesStore.runwayMonthsEstimated);
  let runwayAlertTier = $derived(
    runwayMonths <= 3.0 ? 'CRITICAL' : runwayMonths <= 6.0 ? 'WARNING' : 'STABLE'
  );

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  let seasonText = $derived(
    $gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء'
  );
</script>

<header
  class="fixed top-0 z-20 h-[84px] bg-forest-deep border-b border-charcoal-mid shadow-2xl select-none rounded-none font-arabic flex flex-col justify-between transition-all duration-300 ease-in-out {isLeftOpen ? 'left-[390px]' : 'left-0'} {isRightOpen ? 'right-[390px]' : 'right-0'}"
>
  <!-- ========================================================================= -->
  <!-- ROW 1: CALENDAR, POLITICAL CAPITAL, TREASURY, RESERVES, WAGES & FX    -->
  <!-- ========================================================================= -->
  <div class="h-[41px] px-3 flex items-center justify-between gap-2 border-b border-charcoal-mid/60 overflow-x-auto scrollbar-none flex-nowrap">
    <!-- Item 1: Turn & Calendar -->
    <div class="flex items-center gap-2 shrink-0 min-w-[125px]">
      <div class="flex flex-col">
        <div class="flex items-center gap-1">
          <span class="text-xs text-wheat-gold font-bold font-mono font-heading">الدور {String($gameStore.turnNumber).padStart(2, '0')}/40</span>
          <span class="text-[10px] text-wheat-mid font-mono">({$gameStore.calendarYear})</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[10px] text-wheat-dark font-heading leading-tight">{seasonText}</span>
          {#if p.hasSelections}
            <span class="px-1 py-0 rounded-full bg-forest-mid border border-forest-accent text-forest-accent text-[8px] font-bold">
              تخطيط
            </span>
          {/if}
        </div>
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item: Political Capital (الرصيد السياسي - moved to the left of الدور) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('politicalCapital')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('politicalCapital'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[75px] {selectedStat === 'politicalCapital' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title="الرصيد السياسي السيادي: الحالي {p.politicalCapital.current}% | المتوقع {p.politicalCapital.projected}% ({p.politicalCapital.pctChange > 0 ? '+' : ''}{p.politicalCapital.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-between gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">الرصيد السياسي</span>
        {#if p.politicalCapital.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.politicalCapital.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.politicalCapital.pctChange > 0 ? '+' : ''}{p.politicalCapital.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-gold">{p.politicalCapital.current}%</span>
        {#if p.politicalCapital.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.politicalCapital.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.politicalCapital.projected}%
          </span>
        {/if}
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 2: Public Treasury SYP -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('treasurySYP')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('treasurySYP'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[80px] {selectedStat === 'treasurySYP' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title="الخزينة العامة: الحالي {formatTrillion(p.treasurySYP.current)}T ل.س {p.treasurySYP.current < 0 ? '(عجز)' : ''} | المتوقع للدور القادم {formatTrillion(p.treasurySYP.projected)}T ل.س {p.treasurySYP.projected < 0 ? '(عجز)' : ''} ({p.treasurySYP.pctChange > 0 ? '+' : ''}{p.treasurySYP.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">الخزينة</span>
        {#if p.treasurySYP.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.treasurySYP.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.treasurySYP.pctChange > 0 ? '+' : ''}{p.treasurySYP.pctChange.toFixed(1)}%
          </span>
        {:else if p.treasurySYP.current < 0}
          <span class="px-1 py-0 rounded-full bg-umber-deep border border-umber-border text-umber-crimson text-[7.5px] font-bold">
            عجز
          </span>
        {/if}
      </div>
      <div class="flex items-baseline gap-1 font-mono">
        <span dir="ltr" class="text-xs font-bold {p.treasurySYP.current < 0 ? 'text-umber-crimson' : 'text-wheat-light'}">{formatTrillion(p.treasurySYP.current)}T</span>
        {#if p.treasurySYP.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span dir="ltr" class="text-xs font-bold {p.treasurySYP.projected < 0 ? 'text-umber-crimson' : p.treasurySYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {formatTrillion(p.treasurySYP.projected)}T
          </span>
        {:else}
          <span class="text-[8.5px] {p.treasurySYP.current < 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">ل.س</span>
        {/if}
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 3: FX Reserves USD -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('reservesUSD')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('reservesUSD'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[80px] {selectedStat === 'reservesUSD' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title="احتياطي النقد الأجنبي: الحالي ${formatMillionUSD(p.reservesUSD.current)}M | المتوقع للدور القادم ${formatMillionUSD(p.reservesUSD.projected)}M ({p.reservesUSD.pctChange > 0 ? '+' : ''}{p.reservesUSD.pctChange.toFixed(1)}%) | كفاية الاحتياطي: {runwayMonths} شهراً"
    >
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">الاحتياطي ($)</span>
        {#if p.reservesUSD.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.reservesUSD.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.reservesUSD.pctChange > 0 ? '+' : ''}{p.reservesUSD.pctChange.toFixed(1)}%
          </span>
        {:else if runwayAlertTier === 'CRITICAL'}
          <span class="px-1 py-0 bg-umber-deep border border-umber-crimson text-umber-crimson text-[7.5px] font-bold animate-pulse">
            خطر
          </span>
        {:else if runwayAlertTier === 'WARNING'}
          <span class="px-1 py-0 bg-forest-mid border border-wheat-mid text-wheat-gold text-[7.5px] font-semibold">
            تنبيه
          </span>
        {/if}
      </div>
      <div class="flex items-baseline gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-light">${formatMillionUSD(p.reservesUSD.current)}M</span>
        {#if p.reservesUSD.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.reservesUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            ${formatMillionUSD(p.reservesUSD.projected)}M
          </span>
        {/if}
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>



    <!-- Item: Cost of Wages (فاتورة الرواتب) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('civilPayrollSYP')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('civilPayrollSYP'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[78px] {selectedStat === 'civilPayrollSYP' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="فاتورة الرواتب والأجور (لكل دور 6 أشهر): الحالي {formatTrillion(p.civilPayrollSYP.current)}T ل.س | المتوقع {formatTrillion(p.civilPayrollSYP.projected)}T ل.س ({p.civilPayrollSYP.pctChange > 0 ? '+' : ''}{p.civilPayrollSYP.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">فاتورة الرواتب</span>
        {#if p.civilPayrollSYP.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.civilPayrollSYP.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.civilPayrollSYP.pctChange > 0 ? '+' : ''}{p.civilPayrollSYP.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-mid">{formatTrillion(p.civilPayrollSYP.current)}T</span>
        {#if p.civilPayrollSYP.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.civilPayrollSYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {formatTrillion(p.civilPayrollSYP.projected)}T
          </span>
        {:else}
          <span class="text-[8.5px] text-wheat-dark font-normal">ل.س</span>
        {/if}
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item: Real Civil Service Wage USD (أجر الموظف) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('civilServiceWageUSD')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('civilServiceWageUSD'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[70px] {selectedStat === 'civilServiceWageUSD' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="أجر الموظف الحقيقي بالدولار: الحالي ${p.realWageUSD.current} | المتوقع ${p.realWageUSD.projected} ({p.realWageUSD.pctChange > 0 ? '+' : ''}{p.realWageUSD.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">أجر الموظف</span>
        {#if p.realWageUSD.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.realWageUSD.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.realWageUSD.pctChange > 0 ? '+' : ''}{p.realWageUSD.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-forest-accent">${p.realWageUSD.current}</span>
        {#if p.realWageUSD.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.realWageUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            ${p.realWageUSD.projected}
          </span>
        {:else}
          <span class="text-[8.5px] text-wheat-dark font-normal">/ش</span>
        {/if}
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 6: Parallel Rate -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('parallelRate')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('parallelRate'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[80px] {selectedStat === 'parallelRate' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="سعر صرف الليرة بالسوق الموازي: الحالي 1$ = {formatNumber(p.parallelRateSYP.current)} | المتوقع 1$ = {formatNumber(p.parallelRateSYP.projected)} ({p.parallelRateSYP.pctChange > 0 ? '+' : ''}{p.parallelRateSYP.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">السوق الموازي</span>
        {#if p.parallelRateSYP.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.parallelRateSYP.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.parallelRateSYP.pctChange > 0 ? '+' : ''}{p.parallelRateSYP.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-mid">{formatNumber(p.parallelRateSYP.current)}</span>
        {#if p.parallelRateSYP.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.parallelRateSYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {formatNumber(p.parallelRateSYP.projected)}
          </span>
        {/if}
      </div>
    </div>




  </div>

  <!-- ========================================================================= -->
  <!-- ROW 2: WORKFORCE, DEBT, TAX, CORRUPTION, TRUST, LEVERAGE & UNREST       -->
  <!-- ========================================================================= -->
  <div class="h-[42px] px-3 flex items-center justify-between gap-2 bg-[#091210]/95 overflow-x-auto scrollbar-none flex-nowrap">
    <!-- Item 8: Civil Service Headcount -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('civilServiceHeadcount')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('civilServiceHeadcount'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[75px] {selectedStat === 'civilServiceHeadcount' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title="الجهاز الوظيفي العام: الحالي {formatMillionPeople(p.civilServiceHeadcount.current)}M موظف ({formatNumber(p.civilServiceHeadcount.current)}) | المتوقع {formatMillionPeople(p.civilServiceHeadcount.projected)}M ({p.civilServiceHeadcount.pctChange > 0 ? '+' : ''}{p.civilServiceHeadcount.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">الموظفون</span>
        {#if p.civilServiceHeadcount.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold bg-forest-mid border border-forest-accent text-forest-accent"
          >
            {p.civilServiceHeadcount.pctChange > 0 ? '+' : ''}{p.civilServiceHeadcount.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-light">{formatMillionPeople(p.civilServiceHeadcount.current)}M</span>
        {#if p.civilServiceHeadcount.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold text-forest-accent">
            {formatMillionPeople(p.civilServiceHeadcount.projected)}M
          </span>
        {/if}
      </div>
    </div>

    <div class="h-5 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item: External Sovereign Debt USD (الدين الخارجي - moved to bottom row) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('sovereignDebtUSD')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('sovereignDebtUSD'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[75px] {selectedStat === 'sovereignDebtUSD' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="الدين السيادي الخارجي: الحالي ${formatBillionUSD(p.sovereignDebtUSD.current)}B | المتوقع ${formatBillionUSD(p.sovereignDebtUSD.projected)}B ({p.sovereignDebtUSD.pctChange > 0 ? '+' : ''}{p.sovereignDebtUSD.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">الدين الخارجي</span>
        {#if p.sovereignDebtUSD.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.sovereignDebtUSD.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.sovereignDebtUSD.pctChange > 0 ? '+' : ''}{p.sovereignDebtUSD.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-mid">${formatBillionUSD(p.sovereignDebtUSD.current)}B</span>
        {#if p.sovereignDebtUSD.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.sovereignDebtUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            ${formatBillionUSD(p.sovereignDebtUSD.projected)}B
          </span>
        {/if}
      </div>
    </div>

    <div class="h-5 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 11: Tax Compliance Rate -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('taxCompliancePct')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('taxCompliancePct'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[75px] {selectedStat === 'taxCompliancePct' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="معدل الامتثال والتحصيل الضريبي: الحالي {p.taxCompliancePct.current}% | المتوقع {p.taxCompliancePct.projected}% ({p.taxCompliancePct.pctChange > 0 ? '+' : ''}{p.taxCompliancePct.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">الامتثال الضريبي</span>
        {#if p.taxCompliancePct.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.taxCompliancePct.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.taxCompliancePct.pctChange > 0 ? '+' : ''}{p.taxCompliancePct.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-light">{p.taxCompliancePct.current}%</span>
        {#if p.taxCompliancePct.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.taxCompliancePct.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.taxCompliancePct.projected}%
          </span>
        {/if}
      </div>
    </div>

    <div class="h-5 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 12: Systemic Corruption -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('systemicCorruption')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('systemicCorruption'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[75px] {selectedStat === 'systemicCorruption' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="مؤشر الفساد المؤسسي والتسرب: الحالي {p.systemicCorruption.current}/100 | المتوقع {p.systemicCorruption.projected}/100 ({p.systemicCorruption.pctChange > 0 ? '+' : ''}{p.systemicCorruption.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">الفساد المؤسسي</span>
        {#if p.systemicCorruption.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.systemicCorruption.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.systemicCorruption.pctChange > 0 ? '+' : ''}{p.systemicCorruption.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold {p.systemicCorruption.current > 65 ? 'text-umber-crimson' : 'text-wheat-gold'}">{p.systemicCorruption.current}</span>
        {#if p.systemicCorruption.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.systemicCorruption.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.systemicCorruption.projected}
          </span>
        {:else}
          <span class="text-[8.5px] text-wheat-dark font-normal">/100</span>
        {/if}
      </div>
    </div>

    <div class="h-5 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 13: Civic Trust -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('civicTrust')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('civicTrust'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[70px] {selectedStat === 'civicTrust' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="مؤشر الثقة الشعبية بالحكومة: الحالي {p.civicTrust.current}% | المتوقع {p.civicTrust.projected}% ({p.civicTrust.pctChange > 0 ? '+' : ''}{p.civicTrust.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">الثقة الشعبية</span>
        {#if p.civicTrust.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.civicTrust.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.civicTrust.pctChange > 0 ? '+' : ''}{p.civicTrust.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold {p.civicTrust.current < 35 ? 'text-umber-crimson' : 'text-forest-accent'}">{p.civicTrust.current}%</span>
        {#if p.civicTrust.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.civicTrust.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.civicTrust.projected}%
          </span>
        {/if}
      </div>
    </div>

    <div class="h-5 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 14: Sovereign Leverage -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('sovereignLeverage')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('sovereignLeverage'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[70px] {selectedStat === 'sovereignLeverage' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="مؤشر السيادة والاستقلال الاستراتيجي: الحالي {p.sovereignLeverage.current}% | المتوقع {p.sovereignLeverage.projected}% ({p.sovereignLeverage.pctChange > 0 ? '+' : ''}{p.sovereignLeverage.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">السيادة الوطنية</span>
        {#if p.sovereignLeverage.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.sovereignLeverage.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.sovereignLeverage.pctChange > 0 ? '+' : ''}{p.sovereignLeverage.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-light">{p.sovereignLeverage.current}%</span>
        {#if p.sovereignLeverage.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.sovereignLeverage.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.sovereignLeverage.projected}%
          </span>
        {/if}
      </div>
    </div>

    <div class="h-5 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 15: National Unrest / RRI -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('unrestIndex')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('unrestIndex'); }}
      class="cursor-pointer hover:bg-forest-surface hover:ring-1 hover:ring-wheat-mid/50 transition-all rounded-none text-right flex flex-col shrink-0 min-w-[75px] {selectedStat === 'unrestIndex' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''} text-center"
      title="مؤشر الاحتقان الوطني: الحالي {p.nationalRRI.current}/100 | المتوقع للدور القادم {p.nationalRRI.projected}/100 ({p.nationalRRI.pctChange > 0 ? '+' : ''}{p.nationalRRI.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">مؤشر الاحتقان</span>
        {#if p.nationalRRI.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.nationalRRI.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.nationalRRI.pctChange > 0 ? '+' : ''}{p.nationalRRI.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold {p.nationalRRI.current < 40 ? 'text-forest-accent' : p.nationalRRI.current < 65 ? 'text-wheat-gold' : 'text-umber-crimson'}">
          {p.nationalRRI.current}
        </span>
        {#if p.nationalRRI.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.nationalRRI.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.nationalRRI.projected}
          </span>
        {:else}
          <span class="text-[8.5px] text-wheat-dark">/100</span>
        {/if}
      </div>
    </div>
  </div>
</header>
