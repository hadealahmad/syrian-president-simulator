<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import ToggleSwitch from '../ToggleSwitch.svelte';
  import { isOptionRelated, SUSPENDED_CARD_CLASS, SUSPENDED_CONTENT_CLASS, SUSPENDED_ICON } from './shared';

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  // Collapsible per-card explainers (help icon before each title)
  let openExplainers = $state<Record<string, boolean>>({});
  function toggleExplainer(key: string): void {
    openExplainers[key] = !openExplainers[key];
  }

  // Grid CapEx has an independent policy envelope of $0M to $80M
  const maxCapEx = 80;

  // Central Bank Dollar Auction is bounded solely by central bank FX reserves
  let maxAuction = $derived(
    Math.max(0, Math.floor(($gameStore.macro.reservesUSD ?? 320_000_000) / 1_000_000))
  );

  $effect(() => {
    if ($draftStore.dollarAuctionUSD > maxAuction * 1_000_000) {
      draftStore.setField('dollarAuctionUSD', maxAuction * 1_000_000);
    }
  });

  // Reactive calculations for the 3 macro sliders matching plan specs
  let remittanceCapturedM = $derived(
    $draftStore.remittanceCaptureSpread <= 15
      ? Math.round(1000 * ($draftStore.remittanceCaptureSpread / 100))
      : Math.round(150 + ($draftStore.remittanceCaptureSpread - 15) * 8.5)
  );

  let gridCapExM = $derived($draftStore.gridCapExUSD / 1_000_000);
  let effectiveGridMW = $derived(
    gridCapExM === 0
      ? -120
      : Math.round(gridCapExM * 11.4)
  );
  let effectivePowerHoursDelta = $derived(
    gridCapExM === 0
      ? -0.5
      : Number(((effectiveGridMW / 6000) * 24).toFixed(1))
  );

  let auctionM = $derived($draftStore.dollarAuctionUSD / 1_000_000);
  let auctionSypB = $derived(
    Number(((auctionM * 1_000_000 * ($gameStore.macro.parallelRateSYP * 0.95)) / 1_000_000_000).toFixed(2))
  );
  let auctionReliefPct = $derived(
    Math.min(25, Math.round((auctionM / 10) * 1.5))
  );

  let canAffordBrainGain = $derived(
    $draftStore.expatriateBrainGainIncentive ||
    $budgetStore.canAffordWithFxCoverage(20_000_000, 350_000_000_000)
  );
  let isBrainGainCoveredByFX = $derived(
    !$draftStore.expatriateBrainGainIncentive &&
    $budgetStore.isCoveredByFX(20_000_000, 350_000_000_000)
  );

  // Populist patronage affordability (SYP-funded, FX backstop allowed)
  let canAffordCharity = $derived(
    $draftStore.charityFundActive ||
    $budgetStore.canAffordWithFxCoverage(0, 250_000_000_000)
  );
  let isCharityCoveredByFX = $derived(
    !$draftStore.charityFundActive &&
    $budgetStore.isCoveredByFX(0, 250_000_000_000)
  );

  // Decree-style box states for the two persistent toggles
  let brainGainOn = $derived($draftStore.expatriateBrainGainIncentive);
  let brainGainBlocked = $derived(!brainGainOn && !canAffordBrainGain);
  let charityOn = $derived($draftStore.charityFundActive);
  let charityBlocked = $derived(!charityOn && !canAffordCharity);
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2 border-b border-charcoal-mid pb-2">
    <GameIcon name="abacus" cls="w-5 h-5 text-wheat-gold shrink-0" />
    <h3 class="text-sm font-bold text-wheat-light font-heading">الضرائب والمالية</h3>
  </div>

  <!-- 1. Civil Service Wages -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'wageBumpPercent') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex justify-between items-start text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick={() => toggleExplainer("wage")} aria-label="إظهار الشرح" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
            <GameIcon name="help" cls="w-4 h-4" />
          </button>
          <span class="text-xs font-bold text-wheat-gold font-heading block">زيادة أجور العاملين في الدولة (+{$draftStore.wageBumpPercent}%)</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-[10px]">
        +{$draftStore.wageBumpPercent}%
      </span>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
        +{Math.round((($gameStore.macro.civilServiceWageSYP || 4_050) * ($draftStore.wageBumpPercent / 100)) / ($gameStore.macro.parallelRateSYP || 150))} $/شهر
      </span>
      <span class="px-1.5 py-0.2 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[9px]">
        -{Math.min(45, Math.round(($draftStore.wageBumpPercent / 25) * 2.8))} احتقان
      </span>
      <span class="px-1.5 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9px]">
        -{(((($gameStore.macro.civilServiceHeadcount ?? 1_400_000) * ($gameStore.macro.civilServiceWageSYP || 450_000) * ($draftStore.wageBumpPercent / 100) * 6)) / 1_000_000_000).toFixed(2)}B SP
      </span>
    </div>

    <input
      type="range"
      min="0"
      max="400"
      step="5"
      value={$draftStore.wageBumpPercent}
      oninput={(e) => draftStore.setField('wageBumpPercent', Number(e.currentTarget.value))}
      class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
    />
    <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
      <span>0%</span>
      <span>+400%</span>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.wage ? '' : 'hidden'}">
      زيادة الرواتب بنسبة +{$draftStore.wageBumpPercent}% ترفع متوسط الأجر الحقيقي لموظفي الدولة وتمتص الاحتقان الشعبي، مقابل زيادة كتلة الرواتب بـSP ومخاطر عجز الموازنة.
    </div>
  </div>

  <!-- 6. Remittance Spread Margin -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'remittanceCaptureSpread') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex justify-between items-start text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick={() => toggleExplainer("remit")} aria-label="إظهار الشرح" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
            <GameIcon name="help" cls="w-4 h-4" />
          </button>
          <span class="text-xs font-bold text-wheat-gold font-heading block">هامش اقتطاع الحوالات للمصرف المركزي ({$draftStore.remittanceCaptureSpread}%)</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-[10px]">
        {$draftStore.remittanceCaptureSpread}%
      </span>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-1.5 py-0.2 rounded-full {$draftStore.remittanceCaptureSpread > 15 ? 'bg-amber-900/60 border border-amber-600/60 text-amber-300' : 'bg-forest-mid border border-forest-accent/60 text-forest-accent'} font-mono font-bold text-[9px]">
        +${remittanceCapturedM}M دولار/دور
      </span>
      <span class="px-1.5 py-0.2 rounded-full {$draftStore.remittanceCaptureSpread > 15 ? 'bg-amber-900/40 border border-amber-600/50 text-amber-200' : ($draftStore.remittanceCaptureSpread <= 7 ? 'bg-forest-surface border border-wheat-mid/40 text-wheat-gold' : 'bg-forest-surface border border-charcoal-mid text-wheat-light')} font-mono font-bold text-[9px]">
        {$draftStore.remittanceCaptureSpread > 15 ? 'اقتطاع طوارئ قسري (سيولة إنقاذية قصوى)' : ($draftStore.remittanceCaptureSpread <= 7 ? 'تحفيز المغتربين والقنوات الرسمية (+ثقة)' : 'اقتطاع اعتيادي مستقر (الحالة المحايدة)')}
      </span>
    </div>

    <input
      type="range"
      min="5"
      max="25"
      step="1"
      value={$draftStore.remittanceCaptureSpread}
      oninput={(e) => draftStore.setField('remittanceCaptureSpread', Number(e.currentTarget.value))}
      class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
    />
    <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
      <span>5%</span>
      <span>25%</span>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.remit ? '' : 'hidden'}">
      {$draftStore.remittanceCaptureSpread <= 15
        ? `نسبة اقتطاع اعتيادية (${$draftStore.remittanceCaptureSpread}%). تحقق جباية دولارية بقيمة +${remittanceCapturedM}M للخزينة عبر القنوات المصرفية الرسمية بأمان ودون إثارة مقاطعة المغتربين.`
        : `اقتطاع طوارئ استثنائي (${$draftStore.remittanceCaptureSpread}%): يوفر للمصرف المركزي سيولة دولارية إنقاذية ضخمة تصل إلى +${remittanceCapturedM}M كاش لإنقاذ الاحتياطي ومنع العجز عن سداد الديون واستيراد القمح والفيول، مقابل كلفة مقبولة على الثقة الشعبية ونشاط الصرافة غير النظامي.`}
    </div>
  </div>

  <!-- 7. National Power Grid CapEx Budget -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'gridCapExUSD') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex justify-between items-start text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick={() => toggleExplainer("grid")} aria-label="إظهار الشرح" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
            <GameIcon name="help" cls="w-4 h-4" />
          </button>
          <span class="text-xs font-bold text-wheat-gold font-heading block">تأهيل محطات التوليد والشبكات القومية</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
        ${gridCapExM}M
      </span>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-1.5 py-0.2 rounded-full {gridCapExM === 0 ? 'bg-charcoal-surface border border-charcoal-mid text-wheat-dark' : 'bg-umber-deep border border-umber-border text-umber-crimson'} font-mono font-bold text-[9px]">
        {gridCapExM === 0 ? '$0M كاش (تقشف تام)' : `-\$${gridCapExM}M كاش`}
      </span>
      <span class="px-1.5 py-0.2 rounded-full {gridCapExM === 0 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : 'bg-forest-mid border border-forest-accent/60 text-forest-accent'} font-mono font-bold text-[9px]">
        {effectiveGridMW > 0 ? `+${effectiveGridMW}` : effectiveGridMW} ميغاواط
      </span>
      <span class="px-1.5 py-0.2 rounded-full {gridCapExM === 0 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : 'bg-forest-surface border border-wheat-mid/40 text-wheat-gold'} font-mono font-bold text-[9px]">
        {effectivePowerHoursDelta > 0 ? `+${effectivePowerHoursDelta}` : effectivePowerHoursDelta} س/يوم
      </span>
    </div>

    <input
      type="range"
      min="0"
      max={maxCapEx}
      step="5"
      value={gridCapExM}
      oninput={(e) => draftStore.setField('gridCapExUSD', Number(e.currentTarget.value) * 1_000_000)}
      class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
    />
    <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
      <span>$0M</span>
      <span>$80M</span>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.grid ? '' : 'hidden'}">
      {gridCapExM === 0
        ? 'تجميد الاستثمار الرأسمالي يوفر السيولة الدولارية ($0M كاش)، لكنه يسبب تراجع قدرة الشبكة بنحو 120 ميغاواط وتمديد ساعات التقنين في المحافظات (-0.5 سا/يوم) وزيادة الاحتقان.'
        : gridCapExM === 35
          ? 'الحالة المحايدة ($35M): صيانة دورية تؤمن +399 ميغاواط وتزيد التغذية بنحو +1.6 ساعة/يوم في كافة المحافظات، مما يدعم النشاط الاقتصادي واستقرار الشبكة.'
          : `استثمار \$${gridCapExM}M يضيف نحو ${effectiveGridMW} ميغاواط للشبكة القومية (${effectivePowerHoursDelta > 0 ? '+' : ''}${effectivePowerHoursDelta} سا/يوم)، مما يخفض ساعات التقنين بالمحافظات ويدعم النشاط الصناعي والامتثال الضريبي.`}
    </div>
  </div>

  <!-- 8. Central Bank Dollar Auction -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'dollarAuctionUSD') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex justify-between items-start text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick={() => toggleExplainer("auction")} aria-label="إظهار الشرح" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
            <GameIcon name="help" cls="w-4 h-4" />
          </button>
          <span class="text-xs font-bold text-wheat-gold font-heading block">ضخ سيولة نقدية لكبح انهيار سعر SP</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
        ${auctionM}M
      </span>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-1.5 py-0.2 rounded-full {auctionM === 0 ? 'bg-charcoal-surface border border-charcoal-mid text-wheat-dark' : 'bg-umber-deep border border-umber-border text-umber-crimson'} font-mono font-bold text-[9px]">
        {auctionM === 0 ? '$0M (حماية الاحتياطي)' : `-\$${auctionM}M من الاحتياطي`}
      </span>
      <span class="px-1.5 py-0.2 rounded-full {auctionM === 0 ? 'bg-charcoal-surface border border-charcoal-mid text-wheat-mid' : 'bg-forest-mid border border-forest-accent/60 text-forest-accent'} font-mono font-bold text-[9px]">
        {auctionM === 0 ? 'سعر صرف حر دون استنزاف للاحتياطي' : `كبح تدهور الصرف بنسبة ~${auctionReliefPct}% (+${auctionSypB}B SP ممتصة)`}
      </span>
    </div>

    <input
      type="range"
      min="0"
      max={Math.max(0, maxAuction)}
      step="5"
      disabled={maxAuction === 0}
      value={auctionM}
      oninput={(e) => draftStore.setField('dollarAuctionUSD', Number(e.currentTarget.value) * 1_000_000)}
      class="w-full accent-wheat-gold {maxAuction === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
    />
    <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
      <span>$0M</span>
      <span>${maxAuction}M</span>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.auction ? '' : 'hidden'}">
      {auctionM === 0
        ? 'الحالة المحايدة ($0M): صون احتياطي النقد الأجنبي بالكامل من الاستنزاف. يترك سعر الصرف الموازي يتحدد وفق قوى العرض والطلب لتجنب هدر الدولارات في معارك تثبيت غير مجدية.'
        : `ضخ \$${auctionM}M في السوق الموازي لامتصاص نحو ${auctionSypB}B SP وتثبيت سعر الصرف وكبح جماح التضخم، على حساب رصيد احتياطي النقد الأجنبي.`}
    </div>
  </div>

  <!-- Corporate Tax Rate -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'corporateTaxRate') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex justify-between items-start text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick={() => toggleExplainer("corp")} aria-label="إظهار الشرح" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
            <GameIcon name="help" cls="w-4 h-4" />
          </button>
          <span class="text-xs font-bold text-wheat-gold font-heading block">ضريبة أرباح الشركات والمنشآت ({$draftStore.corporateTaxRate}%)</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
        {$draftStore.corporateTaxRate}%
      </span>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
        +{((($draftStore.corporateTaxRate - 10) * 0.8) + 9.0).toFixed(2)}B SP/دور
      </span>
      <span class="px-1.5 py-0.2 rounded-full {$draftStore.corporateTaxRate > 25 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : 'bg-forest-surface border border-wheat-mid/40 text-wheat-gold'} font-mono font-bold text-[9px]">
        {$draftStore.corporateTaxRate > 25 ? 'يقلص الاستثمار' : 'يشجع الامتثال'}
      </span>
    </div>

    <input
      type="range"
      min="10"
      max="35"
      step="1"
      value={$draftStore.corporateTaxRate}
      oninput={(e) => draftStore.setField('corporateTaxRate', Number(e.currentTarget.value))}
      class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
    />
    <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
      <span>10%</span>
      <span>35%</span>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.corp ? '' : 'hidden'}">
      معدل الضريبة ({$draftStore.corporateTaxRate}%). رفعه يزيد إيرادات الخزينة بSP لكن يقلص الاستثمار وقد يحفز التهرب الضريبي.
    </div>
  </div>

  <!-- Telecom Excise Tax -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'telecomExciseRate') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex justify-between items-start text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick={() => toggleExplainer("telecom")} aria-label="إظهار الشرح" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
            <GameIcon name="help" cls="w-4 h-4" />
          </button>
          <span class="text-xs font-bold text-wheat-gold font-heading block">رسم الإنفاق الاستهلاكي على الاتصالات ({$draftStore.telecomExciseRate}%)</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
        {$draftStore.telecomExciseRate}%
      </span>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
        +{((($draftStore.telecomExciseRate - 5) * 0.5) + 4.0).toFixed(2)}B SP/دور
      </span>
      <span class="px-1.5 py-0.2 rounded-full {$draftStore.telecomExciseRate > 20 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : 'bg-forest-surface border border-wheat-mid/40 text-wheat-gold'} font-mono font-bold text-[9px]">
        {$draftStore.telecomExciseRate > 20 ? 'ضغط معيشي متصاعد' : 'عبء معتدل'}
      </span>
    </div>

    <input
      type="range"
      min="5"
      max="30"
      step="1"
      value={$draftStore.telecomExciseRate}
      oninput={(e) => draftStore.setField('telecomExciseRate', Number(e.currentTarget.value))}
      class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
    />
    <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
      <span>5%</span>
      <span>30%</span>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.telecom ? '' : 'hidden'}">
      رسم استهلاكي ({$draftStore.telecomExciseRate}%). جباية سريعة ومباشرة بـSP للخزينة، لكن رفعه يثقل كاهل المواطنين ويزيد الاحتقان المعيشي.
    </div>
  </div>

  <!-- All Crossings Transit Fee (formerly Nassib) -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'nassibTransitFeeUSD') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex justify-between items-start text-xs">
      <div>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick={() => toggleExplainer("transit")} aria-label="إظهار الشرح" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
            <GameIcon name="help" cls="w-4 h-4" />
          </button>
          <span class="text-xs font-bold text-wheat-gold font-heading block">رسوم الترانزيت بكافة المعابر الحدودية</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-xs shrink-0">
        ${$draftStore.nassibTransitFeeUSD} / شاحنة
      </span>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
        +${Math.round(($draftStore.nassibTransitFeeUSD / 450) * 22)}M دولار/دور
      </span>
      <span class="px-1.5 py-0.2 rounded-full {$draftStore.nassibTransitFeeUSD > 600 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : 'bg-forest-surface border border-wheat-mid/40 text-wheat-gold'} font-mono font-bold text-[9px]">
        {$draftStore.nassibTransitFeeUSD > 600 ? 'قد يخفض تدفق الشاحنات' : 'حركة ترانزيت نشطة'}
      </span>
    </div>

    <input
      type="range"
      min="200"
      max="800"
      step="50"
      value={$draftStore.nassibTransitFeeUSD}
      oninput={(e) => draftStore.setField('nassibTransitFeeUSD', Number(e.currentTarget.value))}
      class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
    />
    <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
      <span>$200</span>
      <span>$800</span>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.transit ? '' : 'hidden'}">
      تعرفة ${$draftStore.nassibTransitFeeUSD} على الشاحنات الأجنبية بكافة المنافذ والمعابر الحدودية لتعظيم عوائد النقد الأجنبي المباشرة ($) للخزينة.
    </div>
  </div>

  <!-- Expatriate Brain-Gain Initiative -->
  <div class="py-2.5 border-b border-charcoal-mid/50 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'brainGain') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div
      title={brainGainBlocked ? 'ميزانية غير كافية لتفعيل حوافز الاستقطاب' : 'حوافز استقطاب الكفاءات والمهاجرين'}
      class="flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {brainGainOn ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordBrainGain ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
    >
      <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 {brainGainBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span title="تفعيل مستمر دورياً"><GameIcon name="cycle" cls="w-4 h-4 text-forest-accent shrink-0" /></span>
          <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">حوافز استقطاب الكفاءات والمهاجرين</span>
        </div>
        <div class="flex items-center gap-1 flex-wrap">
          <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-$20M</span>
          <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-3.50B SP</span>
          <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+8% كفاءة</span>
          <span class="px-1.5 py-px rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8px]">+4 ثقة</span>
          {#if isBrainGainCoveredByFX && !brainGainOn}
            <span class="px-1.5 py-px rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[8px]">
              مغطى بالنقد الأجنبي
            </span>
          {/if}
        </div>
      </div>
      <div class="flex items-center px-2">
        <ToggleSwitch
          checked={brainGainOn}
          disabled={brainGainBlocked}
          label="حوافز استقطاب الكفاءات"
          onchange={(next) => {
            if (next ? canAffordBrainGain : true) draftStore.setField('expatriateBrainGainIncentive', next);
          }}
        />
      </div>
      {#if brainGainBlocked}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
        </div>
      {/if}
    </div>
  </div>

  <!-- Sovereign Charity Fund: persistent SYP drain buying +3 PC/turn -->
  <div class="py-2.5 border-b border-charcoal-mid/50 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'charityFund') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div
      title={charityBlocked ? 'ميزانية غير كافية لتفعيل صندوق الكرامة' : 'صندوق الكرامة السيادي (إعانات أسر الشهداء)'}
      class="flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {charityOn ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordCharity ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
    >
      <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 {charityBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span title="تفعيل مستمر دورياً"><GameIcon name="cycle" cls="w-4 h-4 text-forest-accent shrink-0" /></span>
          <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">صندوق الكرامة السيادي (إعانات أسر الشهداء)</span>
        </div>
        <div class="flex items-center gap-1 flex-wrap">
          <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-2.50B SP/دور</span>
          <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+3 رصيد سياسي/دور</span>
          <span class="px-1.5 py-px rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8px]">+1 ثقة</span>
          {#if isCharityCoveredByFX && !charityOn}
            <span class="px-1.5 py-px rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[8px]">
              مغطى بالنقد الأجنبي
            </span>
          {/if}
        </div>
      </div>
      <div class="flex items-center px-2">
        <ToggleSwitch
          checked={charityOn}
          disabled={charityBlocked}
          label="صندوق الكرامة السيادي"
          onchange={(next) => {
            if (next ? canAffordCharity : true) draftStore.setField('charityFundActive', next);
          }}
        />
      </div>
      {#if charityBlocked}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
        </div>
      {/if}
    </div>
  </div>
</div>
