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

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  let p = $derived($projectedTurnStore);
  let runwayMonths = $derived($previewRangesStore.runwayMonthsEstimated);
  let runwayAlertTier = $derived(
    runwayMonths <= 3.0 ? 'CRITICAL' : runwayMonths <= 6.0 ? 'WARNING' : 'STABLE'
  );

  let seasonText = $derived(
    $gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء'
  );
</script>

<header
  class="fixed top-0 left-[390px] right-[390px] z-20 h-16 px-3 flex items-center justify-between bg-forest-deep border-b border-charcoal-mid shadow-2xl select-none rounded-none font-arabic overflow-x-auto scrollbar-none gap-2 flex-nowrap"
>
  <!-- CLUSTER 1: FISCAL RESERVES & SOVEREIGN CALENDAR -->
  <div class="flex items-center gap-2.5 shrink-0">
    <!-- Item 1: Turn & Calendar -->
    <div class="flex flex-col shrink-0 min-w-[70px]">
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

    <div class="h-7 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 2: Public Treasury SYP -->
    <div
      class="flex flex-col shrink-0 min-w-[85px]"
      title="الخزينة العامة: الحالي {formatTrillion(p.treasurySYP.current)}T ل.س {p.treasurySYP.current < 0 ? '(عجز)' : ''} | المتوقع للدور القادم {formatTrillion(p.treasurySYP.projected)}T ل.س {p.treasurySYP.projected < 0 ? '(عجز)' : ''} ({p.treasurySYP.pctChange > 0 ? '+' : ''}{p.treasurySYP.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">الخزينة</span>
        {#if p.treasurySYP.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold {p.treasurySYP.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.treasurySYP.pctChange > 0 ? '+' : ''}{p.treasurySYP.pctChange.toFixed(1)}%
          </span>
        {:else if p.treasurySYP.current < 0}
          <span class="px-1 py-0 rounded-full bg-umber-deep border border-umber-border text-umber-crimson text-[8px] font-bold">
            عجز
          </span>
        {/if}
      </div>
      <div class="flex items-baseline gap-1 font-mono">
        <span dir="ltr" class="text-xs font-bold {p.treasurySYP.current < 0 ? 'text-umber-crimson' : 'text-wheat-light'}">{formatTrillion(p.treasurySYP.current)}T</span>
        {#if p.treasurySYP.isChanged}
          <span class="text-[9px] text-wheat-dark">➔</span>
          <span dir="ltr" class="text-xs font-bold {p.treasurySYP.projected < 0 ? 'text-umber-crimson' : p.treasurySYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {formatTrillion(p.treasurySYP.projected)}T
          </span>
        {:else}
          <span class="text-[9px] {p.treasurySYP.current < 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">ل.س</span>
        {/if}
      </div>
    </div>

    <div class="h-7 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 3: FX Reserves USD + Runway Badge -->
    <div
      class="flex flex-col shrink-0 min-w-[85px]"
      title="احتياطي النقد الأجنبي: الحالي ${formatMillionUSD(p.reservesUSD.current)}M | المتوقع للدور القادم ${formatMillionUSD(p.reservesUSD.projected)}M ({p.reservesUSD.pctChange > 0 ? '+' : ''}{p.reservesUSD.pctChange.toFixed(1)}%) | كفاية الاحتياطي: {runwayMonths} شهراً"
    >
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">الاحتياطي ($)</span>
        {#if p.reservesUSD.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold {p.reservesUSD.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.reservesUSD.pctChange > 0 ? '+' : ''}{p.reservesUSD.pctChange.toFixed(1)}%
          </span>
        {:else if runwayAlertTier === 'CRITICAL'}
          <span class="px-1 py-0 bg-umber-deep border border-umber-crimson text-umber-crimson text-[8px] font-bold animate-pulse">
            خطر
          </span>
        {:else if runwayAlertTier === 'WARNING'}
          <span class="px-1 py-0 bg-forest-mid border border-wheat-mid text-wheat-gold text-[8px] font-semibold">
            تنبيه
          </span>
        {/if}
      </div>
      <div class="flex items-baseline gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-light">${formatMillionUSD(p.reservesUSD.current)}M</span>
        {#if p.reservesUSD.isChanged}
          <span class="text-[9px] text-wheat-dark">➔</span>
          <span class="text-xs font-bold {p.reservesUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            ${formatMillionUSD(p.reservesUSD.projected)}M
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- THEMATIC CENTRAL DIVIDER -->
  <div class="h-8 w-[1px] bg-charcoal-mid/80 shrink-0"></div>

  <!-- CLUSTER 2: LIVING STANDARDS, CURRENCY, TRUST & UNREST -->
  <div class="flex items-center gap-2.5 shrink-0">
    <!-- Item 4: Parallel Rate -->
    <div
      class="flex flex-col shrink-0 min-w-[85px] text-center"
      title="سعر صرف الليرة بالسوق الموازي: الحالي 1$ = {formatNumber(p.parallelRateSYP.current)} | المتوقع 1$ = {formatNumber(p.parallelRateSYP.projected)} ({p.parallelRateSYP.pctChange > 0 ? '+' : ''}{p.parallelRateSYP.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">السوق الموازي</span>
        {#if p.parallelRateSYP.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold {p.parallelRateSYP.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.parallelRateSYP.pctChange > 0 ? '+' : ''}{p.parallelRateSYP.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-mid">{formatNumber(p.parallelRateSYP.current)}</span>
        {#if p.parallelRateSYP.isChanged}
          <span class="text-[9px] text-wheat-dark">➔</span>
          <span class="text-xs font-bold {p.parallelRateSYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {formatNumber(p.parallelRateSYP.projected)}
          </span>
        {/if}
      </div>
    </div>

    <div class="h-7 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 5: Real Wage -->
    <div
      class="flex flex-col shrink-0 min-w-[70px] text-center"
      title="أجر الموظف الحقيقي بالدولار: الحالي ${p.realWageUSD.current} | المتوقع ${p.realWageUSD.projected} ({p.realWageUSD.pctChange > 0 ? '+' : ''}{p.realWageUSD.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">أجر الموظف</span>
        {#if p.realWageUSD.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold {p.realWageUSD.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.realWageUSD.pctChange > 0 ? '+' : ''}{p.realWageUSD.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline justify-center gap-1 font-mono">
        <span class="text-xs font-bold text-forest-accent">${p.realWageUSD.current}</span>
        {#if p.realWageUSD.isChanged}
          <span class="text-[9px] text-wheat-dark">➔</span>
          <span class="text-xs font-bold {p.realWageUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            ${p.realWageUSD.projected}
          </span>
        {:else}
          <span class="text-[9px] text-wheat-dark font-normal">/ش</span>
        {/if}
      </div>
    </div>

    <div class="h-7 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 6: Political Capital -->
    <div
      class="flex flex-col shrink-0 min-w-[75px]"
      title="الرصيد السياسي السيادي: الحالي {p.politicalCapital.current}% | المتوقع {p.politicalCapital.projected}% ({p.politicalCapital.pctChange > 0 ? '+' : ''}{p.politicalCapital.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-between gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">الرصيد السياسي</span>
        {#if p.politicalCapital.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold {p.politicalCapital.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
          >
            {p.politicalCapital.pctChange > 0 ? '+' : ''}{p.politicalCapital.pctChange.toFixed(1)}%
          </span>
        {/if}
      </div>
      <div class="flex items-baseline gap-1 font-mono">
        <span class="text-xs font-bold text-wheat-gold">{p.politicalCapital.current}%</span>
        {#if p.politicalCapital.isChanged}
          <span class="text-[9px] text-wheat-dark">➔</span>
          <span class="text-xs font-bold {p.politicalCapital.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.politicalCapital.projected}%
          </span>
        {/if}
      </div>
    </div>

    <div class="h-7 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 7: National Unrest / RRI (مؤشر الاحتقان الوطني) -->
    <div
      class="flex flex-col shrink-0 min-w-[75px] text-center"
      title="مؤشر الاحتقان الوطني: الحالي {p.nationalRRI.current}/100 | المتوقع للدور القادم {p.nationalRRI.projected}/100 ({p.nationalRRI.pctChange > 0 ? '+' : ''}{p.nationalRRI.pctChange.toFixed(1)}%)"
    >
      <div class="flex items-center justify-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading whitespace-nowrap">مؤشر الاحتقان</span>
        {#if p.nationalRRI.isChanged}
          <span
            class="px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold {p.nationalRRI.isBeneficial ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}"
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
          <span class="text-[9px] text-wheat-dark">➔</span>
          <span class="text-xs font-bold {p.nationalRRI.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
            {p.nationalRRI.projected}
          </span>
        {:else}
          <span class="text-[9px] text-wheat-dark">/100</span>
        {/if}
      </div>
    </div>

    <div class="h-7 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Meta Utility: Presidential Protocol Guidebook Button -->
    <button
      onclick={() => uiStore.setGuideModal(true, 0)}
      class="p-1.5 bg-charcoal-surface hover:bg-forest-mid text-wheat-dark hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/50 transition-colors cursor-pointer rounded-none shrink-0"
      title="دليل البروتوكول الرئاسي (إرشادات إدارة الدولة وطريقة اللعب)"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>

    <div class="h-7 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Meta Utility: Restart Simulation Button -->
    <button
      onclick={() => uiStore.setRestartModal(true)}
      class="p-1.5 bg-charcoal-surface hover:bg-forest-mid text-wheat-dark hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/50 transition-colors cursor-pointer rounded-none shrink-0"
      title="إعادة تشغيل المحاكاة (بدء ولاية جديدة)"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  </div>
</header>
