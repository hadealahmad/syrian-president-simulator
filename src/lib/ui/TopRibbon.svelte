<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { previewRangesStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function formatTrillion(syp: number): string {
    return (syp / 1_000_000_000_000).toFixed(2);
  }

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  let runwayMonths = $derived($previewRangesStore.runwayMonthsEstimated);
  let runwayAlertTier = $derived(
    runwayMonths <= 3.0 ? 'CRITICAL' : runwayMonths <= 6.0 ? 'WARNING' : 'STABLE'
  );

  let realWage = $derived(
    ($gameStore.macro.civilServiceWageSYP / $gameStore.macro.parallelRateSYP).toFixed(1)
  );

  let seasonText = $derived(
    $gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء'
  );
</script>

<header
  class="fixed top-0 left-[390px] right-[390px] z-20 h-16 px-4 flex items-center justify-between bg-forest-deep border-b border-charcoal-mid shadow-2xl select-none rounded-none font-arabic overflow-hidden"
>
  <!-- CLUSTER 1: FISCAL RESERVES & SOVEREIGN CALENDAR -->
  <div class="flex items-center gap-3 shrink-0">
    <!-- Item 1: Turn & Calendar -->
    <div class="flex flex-col shrink-0">
      <div class="flex items-center gap-1">
        <span class="text-xs text-wheat-gold font-bold font-mono font-heading">الدور {String($gameStore.turnNumber).padStart(2, '0')}/40</span>
        <span class="text-[10px] text-wheat-mid font-mono">({$gameStore.calendarYear})</span>
      </div>
      <span class="text-[10px] text-wheat-dark font-heading leading-tight">{seasonText}</span>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 2: Public Treasury SYP -->
    <div class="flex flex-col shrink-0">
      <span class="text-[10px] text-wheat-dark font-medium font-heading">الخزينة العامة</span>
      <div class="flex items-baseline gap-1">
        <span class="text-sm font-bold text-wheat-light font-mono">{formatTrillion($gameStore.macro.treasurySYP)}T</span>
        <span class="text-[10px] text-wheat-mid">ل.س</span>
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 3: FX Reserves USD + Runway Badge -->
    <div class="flex flex-col shrink-0">
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-wheat-dark font-medium font-heading">احتياطي النقد ($)</span>
        {#if runwayAlertTier === 'CRITICAL'}
          <span class="px-1 py-0 bg-umber-deep border border-umber-crimson text-umber-crimson text-[9px] font-bold animate-pulse">
            خطر
          </span>
        {:else if runwayAlertTier === 'WARNING'}
          <span class="px-1 py-0 bg-forest-mid border border-wheat-mid text-wheat-gold text-[9px] font-semibold">
            تنبيه
          </span>
        {:else}
          <span class="w-1.5 h-1.5 bg-forest-accent rounded-none"></span>
        {/if}
      </div>
      <span class="text-sm font-bold text-wheat-light font-mono">${formatMillionUSD($gameStore.macro.reservesUSD)}M</span>
    </div>
  </div>

  <!-- THEMATIC CENTRAL DIVIDER -->
  <div class="h-8 w-[1px] bg-charcoal-mid/80 shrink-0 mx-2"></div>

  <!-- CLUSTER 2: LIVING STANDARDS & CIVIC TRUST -->
  <div class="flex items-center gap-3 shrink-0">
    <!-- Item 4: Parallel Rate -->
    <div class="flex flex-col shrink-0 text-center">
      <span class="text-[10px] text-wheat-dark font-medium font-heading">السوق الموازي</span>
      <span class="text-sm font-bold text-wheat-mid font-mono">1$={formatNumber($gameStore.macro.parallelRateSYP)}</span>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 5: Real Wage -->
    <div class="flex flex-col shrink-0 text-center">
      <span class="text-[10px] text-wheat-dark font-medium font-heading">أجر الموظف</span>
      <span class="text-sm font-bold text-forest-accent font-mono">${realWage}<span class="text-[10px] text-wheat-dark font-normal">/ش</span></span>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

    <!-- Item 6: Political Capital Meter & Progress Bar -->
    <div class="flex flex-col shrink-0">
      <div class="flex items-center justify-between gap-1.5">
        <span class="text-[10px] text-wheat-dark font-medium font-heading">الرصيد السياسي</span>
        <span class="text-xs font-bold text-wheat-gold font-mono">{$gameStore.macro.politicalCapital}%</span>
      </div>
      <div class="w-16 h-1.5 bg-charcoal-surface border border-charcoal-mid overflow-hidden rounded-none mt-1">
        <div
          class="h-full bg-wheat-gold transition-all duration-300 rounded-none"
          style="width: {$gameStore.macro.politicalCapital}%"
        ></div>
      </div>
    </div>

    <div class="h-6 w-[1px] bg-charcoal-mid shrink-0"></div>

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
