<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { projectedTurnStore, previewRangesStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import { STAT_EXPLAINERS_AR, STAT_STATE_TEXT, statState } from './panels/shared';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function formatBillion(syp: number): string {
    const val = Number((syp / 1_000_000_000).toFixed(2));
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
  let isRightOpen = $derived($uiStore.isStatsSidebarOpen);
  let p = $derived($projectedTurnStore);
  let runwayMonths = $derived($previewRangesStore.runwayMonthsEstimated);
  let runwayAlertTier = $derived(
    runwayMonths <= 3.0 ? 'CRITICAL' : runwayMonths <= 6.0 ? 'WARNING' : 'STABLE'
  );

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  // Value-state tiers (identity lives on the neutral icon; state on the value).
  let corruptionState = $derived(statState('systemicCorruption', p.systemicCorruption.current));
  let trustState = $derived(statState('civicTrust', p.civicTrust.current));
  let unrestState = $derived(statState('unrestIndex', p.nationalRRI.current));
  let wageState = $derived(statState('civilServiceWageUSD', p.realWageUSD.current));

  let seasonText = $derived(
    $gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء'
  );
</script>

<header
  data-tour="treasury"
  class="fixed top-0 z-20 h-[84px] bg-forest-deep shadow-2xl select-none rounded-none font-arabic flex flex-col justify-between overflow-x-auto scrollbar-none transition-all duration-300 ease-in-out {isLeftOpen ? 'left-[390px]' : 'left-0'} {isRightOpen ? 'right-[390px]' : 'right-0'}"
>
  <div class="h-full w-full min-w-[660px] grid grid-cols-6 grid-rows-2 bg-forest-deep">
    <!-- End Turn: spans both rows, one column wide -->
    <div
      data-tour="end-turn"
      role="button"
      tabindex="0"
      onclick={() => uiStore.setTurnReviewModal(true)}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.setTurnReviewModal(true); }}
      class="row-span-2 h-full px-2 flex flex-col justify-center items-center text-center gap-0.5 bg-wheat-gold hover:bg-wheat-light border-r border-wheat-mid/40 border-b border-charcoal-mid cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-forest-deep/50 transition-colors min-w-0"
      title="مراجعة القرارات المعتمدة لهذا الدور والمصادقة عليها"
    >
      <span class="relative inline-block leading-none">
        <GameIcon name="hourglass" cls="w-7 h-7 text-forest-deep shrink-0" />
        <GameIcon name="check-mark" cls="absolute -top-1 -right-1 w-3.5 h-3.5 text-forest-deep shrink-0" />
      </span>
      <span class="text-sm text-forest-deep font-bold font-heading whitespace-nowrap">إنهاء الدور {String($gameStore.turnNumber).padStart(2, '0')}/40</span>
      <span class="text-[10px] text-forest-deep/70 font-mono whitespace-nowrap">{$gameStore.calendarYear} · {seasonText}</span>
      {#if p.hasSelections}
        <span class="px-1.5 py-0 rounded-full bg-forest-deep text-forest-accent text-[8px] font-bold whitespace-nowrap">
          تخطيط
        </span>
      {/if}
    </div>
    <!-- ROW 1: RESOURCES (treasury & state means) -->
<!-- Item 2: Political Capital -->
    <div
      data-tour="capital"
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('politicalCapital')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('politicalCapital'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-y-transparent {selectedStat === 'politicalCapital' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.politicalCapital}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="crown-coin" cls="w-6 h-6 text-wheat-gold shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
      <div class="flex items-center justify-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">الرصيد السياسي</span>
        {#if p.politicalCapital.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.politicalCapital.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.politicalCapital.pctChange > 0 ? '+' : ''}{p.politicalCapital.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-gold">{p.politicalCapital.current} نقطة</span>
        {#if p.politicalCapital.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.politicalCapital.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.politicalCapital.projected} نقطة
          </span>
        {/if}
      </div>
      </div>
    </div>
<!-- Item 3: Public Treasury SYP -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('treasurySYP')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('treasurySYP'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-y-transparent {selectedStat === 'treasurySYP' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.treasurySYP}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="money-stack" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
      <div class="flex items-center justify-center gap-1">
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
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span dir="ltr" class="text-xs font-bold {p.treasurySYP.current < 0 ? 'text-umber-crimson' : 'text-wheat-light'}">{formatBillion(p.treasurySYP.current)}B</span>
        {#if p.treasurySYP.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span dir="ltr" class="text-xs font-bold {p.treasurySYP.projected < 0 ? 'text-umber-crimson' : p.treasurySYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {formatBillion(p.treasurySYP.projected)}B
          </span>
        {:else}
          <span class="text-[8.5px] {p.treasurySYP.current < 0 ? 'text-umber-crimson' : 'text-wheat-dark'}">SP</span>
        {/if}
      </div>
      </div>
    </div>
<!-- Item 4: FX Reserves USD -->
    <div
      data-tour="reserves"
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('reservesUSD')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('reservesUSD'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-y-transparent {selectedStat === 'reservesUSD' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.reservesUSD}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="coins" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
      <div class="flex items-center justify-center gap-1">
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
          <span class="px-1 py-0 bg-forest-mid border border-wheat-mid text-wheat-mid text-[7.5px] font-semibold">
            تنبيه
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold {runwayAlertTier === 'CRITICAL' ? 'text-umber-crimson' : 'text-wheat-light'}">${formatMillionUSD(p.reservesUSD.current)}M</span>
        {#if p.reservesUSD.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.reservesUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            ${formatMillionUSD(p.reservesUSD.projected)}M
          </span>
        {/if}
      </div>
      </div>
    </div>
<!-- Item 2: External Sovereign Debt USD -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('sovereignDebtUSD')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('sovereignDebtUSD'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-y-transparent {selectedStat === 'sovereignDebtUSD' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.sovereignDebtUSD}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="scales" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
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
        <span class="text-xs font-bold text-wheat-light">${formatBillionUSD(p.sovereignDebtUSD.current)}B</span>
        {#if p.sovereignDebtUSD.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.sovereignDebtUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            ${formatBillionUSD(p.sovereignDebtUSD.projected)}B
          </span>
        {/if}
      </div>
      </div>
    </div>
<!-- RESOURCE 5: Tax Compliance Rate (revenue engine) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('taxCompliancePct')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('taxCompliancePct'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-y-transparent {selectedStat === 'taxCompliancePct' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.taxCompliancePct}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="abacus" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
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
    </div>
        <!-- ROW 2: CRITICAL STATS (top-5 ending watchlist — no Suwayda tiles) -->
<!-- CRITICAL 2: Parallel Rate (drives real wage + treasury) -->
    <div
      data-tour="fx-rate"
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('parallelRate')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('parallelRate'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-charcoal-mid {selectedStat === 'parallelRate' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.parallelRate}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="trade" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
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
        <span class="text-xs font-bold text-wheat-light">{formatNumber(p.parallelRateSYP.current)}</span>
        {#if p.parallelRateSYP.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.parallelRateSYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {formatNumber(p.parallelRateSYP.projected)}
          </span>
        {/if}
      </div>
      </div>
    </div>
<!-- CRITICAL 1: Real Wage USD (mutiny watch: soldier wage < $8 + corruption) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('civilServiceWageUSD')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('civilServiceWageUSD'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-charcoal-mid {selectedStat === 'civilServiceWageUSD' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.civilServiceWageUSD}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="banknote" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
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
        <span class="text-xs font-bold {STAT_STATE_TEXT[wageState]}">${p.realWageUSD.current}</span>
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
    </div>
<!-- CRITICAL 3: Systemic Corruption (mutiny >75, garrison >70, phoenix <40) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('systemicCorruption')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('systemicCorruption'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-charcoal-mid {selectedStat === 'systemicCorruption' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.systemicCorruption}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="blindfold" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
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
        <span class="text-xs font-bold {STAT_STATE_TEXT[corruptionState]}">{p.systemicCorruption.current}</span>
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
    </div>
<!-- CRITICAL 4: Civic Trust (paralysis pair + century social pillar) -->
    <div
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('civicTrust')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('civicTrust'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-charcoal-mid {selectedStat === 'civicTrust' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.civicTrust}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="crowned-heart" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
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
        <span class="text-xs font-bold {STAT_STATE_TEXT[trustState]}">{p.civicTrust.current}%</span>
        {#if p.civicTrust.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.civicTrust.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.civicTrust.projected}%
          </span>
        {/if}
      </div>
      </div>
    </div>
<!-- CRITICAL 5: National Unrest / RRI (insurrection >=80, collapse >=90) -->
    <div
      data-tour="unrest"
      role="button"
      tabindex="0"
      onclick={() => uiStore.openStatRelatedOptions('unrestIndex')}
      onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") uiStore.openStatRelatedOptions('unrestIndex'); }}
      class="h-full flex flex-row items-stretch text-center cursor-pointer gloss-hover hover:ring-1 hover:ring-inset hover:ring-wheat-mid/70 transition-all rounded-none border-r border-charcoal-mid/60 min-w-0 border-y border-charcoal-mid {selectedStat === 'unrestIndex' ? 'bg-forest-surface ring-2 ring-wheat-gold shadow-md' : ''}"
      title={STAT_EXPLAINERS_AR.unrestIndex}
    >
      <div class="flex items-center justify-center aspect-square h-full shrink-0">
        <GameIcon name="flame" cls="w-6 h-6 text-wheat-dark shrink-0" />
      </div>
      <div class="flex-1 flex flex-col justify-center items-center min-w-0 border-r border-charcoal-mid/60">
      <div class="flex items-center justify-center gap-1">
        <span class="text-[9.5px] text-wheat-dark font-medium font-heading whitespace-nowrap">الاحتقان الوطني</span>
        {#if p.nationalRRI.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8px] font-mono font-bold {p.nationalRRI.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.nationalRRI.pctChange > 0 ? '+' : ''}{p.nationalRRI.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span
          class="text-xs font-bold {STAT_STATE_TEXT[unrestState]} {unrestState === 'crit' ? 'animate-pulse' : ''}"
        >
          {p.nationalRRI.current}
        </span>
        {#if p.nationalRRI.isChanged}
          <span class="text-[8.5px] text-wheat-dark">←</span>
          <span class="text-xs font-bold {p.nationalRRI.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.nationalRRI.projected}
          </span>
        {:else}
          <span class="text-[8.5px] text-wheat-dark font-normal">/100</span>
        {/if}
      </div>
      </div>
    </div>
  </div>
</header>
