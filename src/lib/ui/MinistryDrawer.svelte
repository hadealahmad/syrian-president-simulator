<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore, previewRangesStore } from '../stores/draft-store';
  import { uiStore, type MinistryTab } from '../stores/ui-store';
  import {
    getOligarchSettlementIncome,
    getOligarchLiquidationIncome,
    getOligarchSettlementPCCost,
    getOligarchLiquidationPCCost,
    getOligarchNationalizePCEarned,
  } from '../engine/oligarch-helpers';

  type DecreeBehaviorType = 'ONE_TIME' | 'CONTINUOUS_TOGGLE' | 'PERIODIC';

  interface PoliticalDecreeItem {
    id: string;
    titleAr: string;
    descAr: string;
    costAr: string;
    gainAr: string;
    category: 'DECREE' | 'POLITICAL';
    behavior: DecreeBehaviorType;
  }

  const DECREE_PC_COSTS: Record<string, number> = {
    ANTI_CORRUPTION_COMMISSION: 15,
    PROPERTY_RESTITUTION_PORTAL: 10,
    SMUGGLING_BORDER_SWEEP: 12,
    TRIBAL_CUSTOMS_COUNCIL: 8,
    CABINET_HEARING: 0,
    UNITY_SPEECH: 0,
    OPPOSITION_SEATS: 0,
    MARTIAL_LAW: 0,
  };

  const DECREES: PoliticalDecreeItem[] = [
    {
      id: 'ANTI_CORRUPTION_COMMISSION',
      titleAr: 'مرسوم إطلاق هيئة النزاهة وتدقيق الأصول',
      descAr: 'تفتيش مركزي على مناقصات الإعمار وكبار أمراء الحرب والمصادرة الوقائية للأموال المشبوهة.',
      costAr: 'يستهلك 15 رصيد سياسي',
      gainAr: 'يقلص الفساد الوطني (-8) ويحد من هدر الموازنة ويرفع الثقة (+5)',
      category: 'DECREE',
      behavior: 'ONE_TIME',
    },
    {
      id: 'PROPERTY_RESTITUTION_PORTAL',
      titleAr: 'المنصة الرقمية لرد الملكيات العقارية للاجئين',
      descAr: 'إنفاذ المرسوم 16 لرد الملكيات وتثبيت القيود رقمياً عبر سندات الطابو وحجج الوقف الموثقة.',
      costAr: 'يستهلك 10 رصيد سياسي',
      gainAr: 'يشجع عودة اللاجئين ويخفض مؤشر الاحتقان في حمص وريف دمشق ويرفع الثقة (+4)',
      category: 'DECREE',
      behavior: 'ONE_TIME',
    },
    {
      id: 'SMUGGLING_BORDER_SWEEP',
      titleAr: 'الحملة الوطنية المشتركة لضبط الحدود ومكافحة التهريب',
      descAr: 'نشر سرايا الهجانة ومفارز الجمارك على المعابر غير الشرعية وضبط تهريب المازوت والسلع المدعومة.',
      costAr: 'يستهلك 12 رصيد سياسي',
      gainAr: 'يحد من نزيف العملة الأجنبية ويجلب سيولة جمركية (+15M$) ويقلص الفساد (-4)',
      category: 'DECREE',
      behavior: 'PERIODIC',
    },
    {
      id: 'TRIBAL_CUSTOMS_COUNCIL',
      titleAr: 'ميثاق التفاهم العشائري وتأمين الترانزيت الشرقي',
      descAr: 'إشراك وجهاء العشائر في حماية قوافل الترانزيت على طريق M4 مقابل عوائد تنموية محلية.',
      costAr: 'يستهلك 8 رصيد سياسي',
      gainAr: 'يؤمن حركة الترانزيت ويخفض اضطرابات دير الزور والرقة (-10 بمؤشر الاحتقان)',
      category: 'DECREE',
      behavior: 'ONE_TIME',
    },
    {
      id: 'CABINET_HEARING',
      titleAr: 'جلسة مساءلة حكومية علنية ونشر الذمة المالية',
      descAr: 'استدعاء وزراء المالية والتجارة والكهرباء لمساءلة مفتوحة أمام وسائل الإعلام وبثها للرأي العام.',
      costAr: 'صفر رصيد سياسي (مجاني)',
      gainAr: 'يرفع الرصيد السياسي (+8) والثقة المجتمعية (+3) وكفاءة الوزارات (+2)',
      category: 'POLITICAL',
      behavior: 'PERIODIC',
    },
    {
      id: 'UNITY_SPEECH',
      titleAr: 'خطاب المصالحة الوطنية والعهد المدني الشامل',
      descAr: 'إعلان رئاسي رسمي بإنهاء كافة الملاحقات الإدارية والترحيب بعودة الكفاءات ورؤوس الأموال المهاجرة.',
      costAr: 'صفر رصيد سياسي (مجاني)',
      gainAr: 'يرفع الرصيد السياسي (+4) والثقة (+2) ويخفض مؤشر الاحتقان (-3)',
      category: 'POLITICAL',
      behavior: 'ONE_TIME',
    },
    {
      id: 'OPPOSITION_SEATS',
      titleAr: 'توسيع التشكيل الحكومي واستيعاب معارضة التكنوقراط',
      descAr: 'تعيين وزيرين مستقلين في حقيبتي الشؤون الاجتماعية والصناعة لضمان إجماع أوسع.',
      costAr: 'يستهلك تفاهمات سياسية محدودة',
      gainAr: 'يمنح +18 رصيد سياسي و +4 ثقة شعبية بإشراك الكفاءات الوطنية',
      category: 'POLITICAL',
      behavior: 'ONE_TIME',
    },
    {
      id: 'MARTIAL_LAW',
      titleAr: 'إعلان حالة الطوارئ والأحكام العرفية',
      descAr: 'تجميد فوري لمؤشر الشغب والاحتجاجات وفرض منع التجوال في المناطق المشتعلة.',
      costAr: 'ديبَف مستمر (-4% ثقة شعبية لكل دور)',
      gainAr: 'تجميد الاحتجاجات وتخفيض حاسم للاحتقان (-15 وطني / -12 محلي)',
      category: 'POLITICAL',
      behavior: 'CONTINUOUS_TOGGLE',
    },
  ];

  function formatM(val: number): string {
    return (val / 1_000_000).toFixed(1);
  }

  function formatTrillion(syp: number): string {
    const val = Number((syp / 1_000_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  const TABS = [
    { id: 'macro', labelAr: 'السلع والسياسات' },
    { id: 'finance', labelAr: 'المالية والأصول' },
    { id: 'governance', labelAr: 'المراسيم والسيادة' },
  ] as const;

  let activePillar = $derived(
    $uiStore.ministryTab === 'tax' || $uiStore.ministryTab === 'oligarch' || $uiStore.ministryTab === 'finance'
      ? 'finance'
      : $uiStore.ministryTab === 'decrees' || $uiStore.ministryTab === 'ministries' || $uiStore.ministryTab === 'governance'
        ? 'governance'
        : 'macro'
  );

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
  let auctionSypT = $derived(
    Number(((auctionM * 1_000_000 * ($gameStore.macro.parallelRateSYP * 0.95)) / 1_000_000_000_000).toFixed(2))
  );
  let auctionReliefPct = $derived(
    Math.min(25, Math.round((auctionM / 10) * 1.5))
  );

  let isRightOpen = $derived($uiStore.isMinistryDrawerOpen);

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  const SUBSIDY_NAMES_AR: Record<string, string> = {
    AUSTERE: 'تقشف',
    STANDARD: 'اعتيادي',
    GENEROUS: 'موسع',
  };

  const WORKFORCE_NAMES_AR: Record<string, string> = {
    MAINTAIN: 'تثبيت الملاك',
    PRUNE_CIVIL_SERVICE: 'شطب الوهمي',
    ABSORB_MILITIAS: 'استيعاب المسلحين',
  };

  const WHEAT_NAMES_AR: Record<string, string> = {
    SUBSIDIZED_LOW: 'سعر إلزامي',
    MARKET_PARITY: 'سعر عادل',
    PREMIUM_INCENTIVE: 'علاوة تحفيز',
  };

  const SMUGGLING_NAMES_AR: Record<string, string> = {
    CRACKDOWN: 'حملة صارمة',
    STANDARD: 'رقابة اعتيادية',
    PERMISSIVE: 'غض الطرف',
  };

  const ASSET_STATUS_AR: Record<string, string> = {
    PENDING: 'قيد الانتظار',
    SETTLED: 'تسوية مالية مصادقة',
    NATIONALIZED: 'تأميم حكومي قطاع عام',
    LIQUIDATED: 'تصفية خارجية',
  };

  const STAT_NAMES_AR: Record<string, string> = {
    treasurySYP: 'الخزينة العامة',
    reservesUSD: 'احتياطي النقد الأجنبي',
    sovereignDebtUSD: 'الدين السيادي الخارجي',
    m2MoneySupplySYP: 'الكتلة النقدية M2',
    parallelRate: 'سعر الصرف الموازي',
    politicalCapital: 'الرصيد السياسي',
    civilServiceHeadcount: 'ملاك موظفي الدولة',
    civilPayrollSYP: 'كتلة أجور الدولة',
    civilServiceWageUSD: 'متوسط الأجر الحقيقي',
    taxCompliancePct: 'الامتثال الضريبي',
    systemicCorruption: 'الفساد المؤسسي',
    civicTrust: 'الثقة المجتمعية',
    sovereignLeverage: 'الارتهان السيادي',
    unrestIndex: 'مؤشر الاحتقان الشعبي',
  };

  function isOptionRelated(optionKey: string): boolean {
    if (!selectedStat) return true;
    switch (optionKey) {
      case 'wageBumpPercent':
        return ['unrestIndex', 'civilServiceWageUSD', 'civilPayrollSYP', 'treasurySYP', 'm2MoneySupplySYP', 'civicTrust'].includes(selectedStat);
      case 'foodSubsidyLevel':
        return ['unrestIndex', 'treasurySYP', 'reservesUSD', 'civicTrust'].includes(selectedStat);
      case 'workforceStrategy':
        return ['civilServiceHeadcount', 'civilPayrollSYP', 'systemicCorruption', 'unrestIndex', 'treasurySYP'].includes(selectedStat);
      case 'wheatProcurement':
        return ['unrestIndex', 'treasurySYP', 'reservesUSD', 'civicTrust'].includes(selectedStat);
      case 'dieselSmuggling':
        return ['unrestIndex', 'systemicCorruption', 'taxCompliancePct', 'dailyPowerHours'].includes(selectedStat);
      case 'remittanceCaptureSpread':
        return ['reservesUSD', 'parallelRate', 'civicTrust', 'm2MoneySupplySYP'].includes(selectedStat);
      case 'gridCapExUSD':
        return ['dailyPowerHours', 'reservesUSD', 'taxCompliancePct', 'unrestIndex', 'civicTrust'].includes(selectedStat);
      case 'dollarAuctionUSD':
        return ['reservesUSD', 'parallelRate', 'treasurySYP', 'm2MoneySupplySYP'].includes(selectedStat);
      case 'corporateTaxRate':
        return ['taxCompliancePct', 'treasurySYP', 'm2MoneySupplySYP'].includes(selectedStat);
      case 'telecomExciseRate':
        return ['treasurySYP', 'unrestIndex', 'taxCompliancePct'].includes(selectedStat);
      case 'nassibTransitFeeUSD':
        return ['reservesUSD', 'treasurySYP'].includes(selectedStat);
      case 'taxOverview':
        return ['taxCompliancePct', 'systemicCorruption', 'civicTrust'].includes(selectedStat);
      case 'oligarchs':
        return ['reservesUSD', 'treasurySYP', 'politicalCapital', 'civicTrust', 'systemicCorruption', 'civilServiceHeadcount'].includes(selectedStat);
      case 'loans':
        return ['reservesUSD', 'sovereignDebtUSD', 'sovereignLeverage', 'politicalCapital'].includes(selectedStat);
      case 'mortgages':
        return ['reservesUSD', 'sovereignLeverage', 'politicalCapital', 'sovereignDebtUSD'].includes(selectedStat);
      case 'brainGain':
        return ['civicTrust', 'reservesUSD', 'treasurySYP', 'taxCompliancePct', 'politicalCapital'].includes(selectedStat);
      default:
        return false;
    }
  }

  function isDecreeRelated(decreeId: string): boolean {
    if (!selectedStat) return true;
    switch (decreeId) {
      case 'anti_corruption_tribunal':
        return ['systemicCorruption', 'politicalCapital', 'taxCompliancePct', 'civicTrust'].includes(selectedStat);
      case 'customs_digitization':
        return ['systemicCorruption', 'treasurySYP', 'taxCompliancePct', 'reservesUSD'].includes(selectedStat);
      case 'subsidies_smart_card':
        return ['treasurySYP', 'unrestIndex', 'systemicCorruption'].includes(selectedStat);
      case 'national_reconciliation':
        return ['unrestIndex', 'politicalCapital', 'civicTrust'].includes(selectedStat);
      case 'technocratic_cabinet':
        return ['civicTrust', 'politicalCapital', 'taxCompliancePct'].includes(selectedStat);
      case 'syrian_dialogue':
        return ['politicalCapital', 'unrestIndex', 'civicTrust'].includes(selectedStat);
      case 'currency_stabilization':
        return ['parallelRate', 'm2MoneySupplySYP', 'treasurySYP', 'politicalCapital'].includes(selectedStat);
      default:
        return false;
    }
  }

  function tabHasRelatedOptions(tabId: string): boolean {
    if (!selectedStat) return false;
    if (tabId === 'macro') {
      return ['wageBumpPercent', 'foodSubsidyLevel', 'workforceStrategy', 'wheatProcurement', 'dieselSmuggling', 'remittanceCaptureSpread', 'gridCapExUSD', 'dollarAuctionUSD'].some(isOptionRelated);
    }
    if (tabId === 'finance') {
      return ['corporateTaxRate', 'telecomExciseRate', 'nassibTransitFeeUSD', 'oligarchs', 'loans', 'mortgages', 'taxOverview'].some(isOptionRelated);
    }
    if (tabId === 'governance') {
      return isOptionRelated('brainGain') || DECREES.some(d => isDecreeRelated(d.id));
    }
    return false;
  }


  let canAffordBrainGain = $derived(
    $draftStore.expatriateBrainGainIncentive ||
    $budgetStore.canAffordWithFxCoverage(20_000_000, 350_000_000_000)
  );
  let isBrainGainCoveredByFX = $derived(
    !$draftStore.expatriateBrainGainIncentive &&
    $budgetStore.isCoveredByFX(20_000_000, 350_000_000_000)
  );
</script>

<aside
  class="fixed top-0 right-0 bottom-0 w-[390px] h-screen z-30 bg-forest-deep border-l border-charcoal-mid shadow-2xl p-4 flex flex-col justify-between overflow-y-auto select-none rounded-none font-arabic text-wheat-light transition-transform duration-300 ease-in-out {isRightOpen ? 'translate-x-0' : 'translate-x-full'}"
>
  <div class="space-y-4">
    <!-- Drawer Header & Tabs -->
    <div class="border-b border-charcoal-mid pb-3 space-y-2.5">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-wheat-light font-heading">
          غرفة مجلس الوزراء والسياسات الكلية
        </h2>

      </div>


    <!-- Active Filter Banner (When a Stat in Top Ribbon is Clicked) -->
    {#if selectedStat}
      <div class="p-2.5 bg-forest-surface border border-wheat-gold/80 flex items-center justify-between gap-2 shadow-md">
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="w-2 h-2 rounded-full bg-wheat-gold animate-pulse shrink-0"></span>
          <span class="text-[11px] font-bold text-wheat-gold truncate font-heading">
            عزل الخيارات المرتبطة بـ: {STAT_NAMES_AR[selectedStat] || selectedStat}
          </span>
        </div>
        <button
          onclick={() => uiStore.closeStatRelatedOptions()}
          class="px-2 py-0.5 text-[9.5px] bg-forest-mid hover:bg-forest-deep border border-charcoal-mid text-wheat-light hover:text-wheat-gold cursor-pointer shrink-0 font-bold transition-colors"
          title="إلغاء التصفية واستعادة تفاعل كافة الخيارات"
        >
          ✕ إلغاء التصفية
        </button>
      </div>
    {/if}

      <!-- Navigation Tabs (3 Consolidated Sovereign Pillars) -->
      <div class="grid grid-cols-3 gap-1 bg-charcoal-surface p-1 border border-charcoal-mid rounded-none">
        {#each TABS as tab}
          {@const hasMatches = tabHasRelatedOptions(tab.id)}
          <button
            onclick={() => uiStore.setMinistryTab(tab.id as MinistryTab)}
            class="py-1.5 px-2 text-[11px] font-semibold transition-colors rounded-none text-center truncate cursor-pointer relative {activePillar === tab.id ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
          >
            {tab.labelAr}
            {#if hasMatches}
              <span class="w-1.5 h-1.5 rounded-full bg-wheat-gold inline-block mr-1 align-middle"></span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- PILLAR 1: MACRO POLICIES & COMMODITIES -->
    {#if activePillar === 'macro'}
      <div class="space-y-3">
        <!-- 1. Civil Service Wages -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('wageBumpPercent') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start text-xs">
            <div>
              <span class="font-bold text-wheat-light font-heading block">زيادة أجور العاملين في الدولة (+{$draftStore.wageBumpPercent}%)</span>
              <span class="text-[10px] text-forest-accent">يمتص الاحتقان المعيشي ويرفع القدرة الشرائية</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-[10px]">
              +{$draftStore.wageBumpPercent}%
            </span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-wheat-dark">الأثر المباشر:</span>
            <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
              +{Math.round((($gameStore.macro.civilServiceWageSYP || 450_000) * ($draftStore.wageBumpPercent / 100)) / ($gameStore.macro.parallelRateSYP || 15000))} $/شهر
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[9px]">
              -{Math.min(45, Math.round(($draftStore.wageBumpPercent / 25) * 2.8))} احتقان
            </span>
            <span class="px-1.5 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9px]">
              -{(((($gameStore.macro.civilServiceHeadcount ?? 1_400_000) * ($gameStore.macro.civilServiceWageSYP || 450_000) * ($draftStore.wageBumpPercent / 100) * 6)) / 1_000_000_000_000).toFixed(2)}T ل.س
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
            <span>0% (تقشف وتثبيت)</span>
            <span>+400% (امتصاص الاحتقان)</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            زيادة الرواتب بنسبة +{$draftStore.wageBumpPercent}% ترفع متوسط الأجر الحقيقي لموظفي الدولة وتمتص الاحتقان الشعبي، مقابل زيادة كتلة الرواتب بالليرة ومخاطر عجز الموازنة.
          </div>
        </div>

        <!-- 2. Food Subsidies Tier -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('foodSubsidyLevel') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">مستوى الدعم التمويني والخبز</span>
              <span class="text-[10px] text-wheat-dark">التحكم في أسعار وتوفر الخبز والمواد الأساسية</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold text-[10px] font-mono font-bold">
              {SUBSIDY_NAMES_AR[$draftStore.foodSubsidyLevel || 'STANDARD'] ?? ($draftStore.foodSubsidyLevel || 'اعتيادي')}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
            <button
              onclick={() => draftStore.setField('foodSubsidyLevel', 'AUSTERE')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.foodSubsidyLevel === 'AUSTERE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">تقشف</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+15 احتقان</span>
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+0.80T توفير</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('foodSubsidyLevel', 'STANDARD')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.foodSubsidyLevel === 'STANDARD' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">اعتيادي</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">0 احتقان</span>
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">مستقر</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('foodSubsidyLevel', 'GENEROUS')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.foodSubsidyLevel === 'GENEROUS' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">موسع</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">-12 احتقان</span>
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">-1.20T كلفة</span>
              </div>
            </button>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            {#if $draftStore.foodSubsidyLevel === 'AUSTERE'}
              <span class="text-amber-300 font-medium">الأثر:</span> تقليص مخصصات الدعم بنسبة 50% وتوفير سيولة الليرة، لكن يرفع أسعار الخبز ويزيد الاحتقان الشعبي (+15 نقطة).
            {:else if $draftStore.foodSubsidyLevel === 'GENEROUS'}
              <span class="text-forest-accent font-medium">الأثر:</span> تثبيت شامل لأسعار الخبز والسلع وتخفيض الاحتقان (-12 نقطة)، مع استنزاف إضافي لسيولة الليرة والدولار لاستيراد القمح.
            {:else}
              <span class="text-wheat-mid font-medium">الأثر:</span> دعم متوازن يضمن توفير الخبز والمواد التموينية المدعومة ضمن الحدود المالية المقبولة للموازنة.
            {/if}
          </div>
        </div>

        <!-- 3. State Workforce Policy -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('workforceStrategy') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-bold text-wheat-light font-heading text-xs block">إعادة هيكلة ملاك الدولة والتوظيف</span>
              <span class="text-[10px] text-wheat-dark">إدارة الوظائف الحكومية والبطالة المقنعة</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold text-[10px] font-mono font-bold">
              {WORKFORCE_NAMES_AR[$draftStore.workforceStrategy || 'MAINTAIN'] ?? ($draftStore.workforceStrategy || 'تثبيت الملاك')}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
            <button
              onclick={() => draftStore.setField('workforceStrategy', 'MAINTAIN')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.workforceStrategy === 'MAINTAIN' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">تثبيت الملاك</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">استقرار</span>
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">اعتيادي</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('workforceStrategy', 'PRUNE_CIVIL_SERVICE')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">شطب الوهمي</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+0.45T توفير</span>
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">-5 فساد</span>
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+4 احتقان</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('workforceStrategy', 'ABSORB_MILITIAS')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.workforceStrategy === 'ABSORB_MILITIAS' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">استيعاب المسلحين</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8.5px]">+8000 وظيفة</span>
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">-6 توتر</span>
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+5 فساد</span>
              </div>
            </button>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            {#if $draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE'}
              <span class="text-amber-300 font-medium">الأثر:</span> شطب البطالة المقنعة والرواتب الوهمية يوفر سيولة الخزينة ويرفع كفاءة الوزارات، مع احتقان وظيفي مؤقت.
            {:else if $draftStore.workforceStrategy === 'ABSORB_MILITIAS'}
              <span class="text-amber-300 font-medium">الأثر:</span> استيعاب المقاتلين لتهدئة الجبهات واستقرار الأمن، مقابل تضخم كتلة الرواتب الحكومية وزيادة الفساد الإداري.
            {:else}
              <span class="text-wheat-mid font-medium">الأثر:</span> الحفاظ على قوام الموظفين ورواتب الملاك الحكومي الراهن دون تعديل.
            {/if}
          </div>
        </div>

        <!-- 4. Wheat Pricing -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('wheatProcurement') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-bold text-wheat-light font-heading text-xs block">تسعير شراء القمح المحلي من المزارعين</span>
              <span class="text-[10px] text-wheat-dark">ضمان الأمن الغذائي واستلام محصول القمح السوري</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold text-[10px] font-mono font-bold">
              {WHEAT_NAMES_AR[$draftStore.wheatProcurement || 'MARKET_PARITY'] ?? ($draftStore.wheatProcurement || 'سعر عادل')}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
            <button
              onclick={() => draftStore.setField('wheatProcurement', 'SUBSIDIZED_LOW')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.wheatProcurement === 'SUBSIDIZED_LOW' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">سعر إلزامي</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+0.50T توفير</span>
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+8 احتقان</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('wheatProcurement', 'MARKET_PARITY')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.wheatProcurement === 'MARKET_PARITY' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">سعر عادل</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">استقرار</span>
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">سوق حر</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('wheatProcurement', 'PREMIUM_INCENTIVE')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.wheatProcurement === 'PREMIUM_INCENTIVE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">علاوة تحفيز</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">توريد 100%</span>
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">-0.60T كلفة</span>
              </div>
            </button>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            {#if $draftStore.wheatProcurement === 'SUBSIDIZED_LOW'}
              <span class="text-amber-300 font-medium">الأثر:</span> خفض نفقات شراء القمح بالليرة، لكن يدفع المزارعين لتهريب المحصول وتراجع المخزون التمويني.
            {:else if $draftStore.wheatProcurement === 'PREMIUM_INCENTIVE'}
              <span class="text-forest-accent font-medium">الأثر:</span> علاوة مجزية تضمن توريد كامل القمح السوري وتقلص استيراد الحبوب بالدولار، مقابل زيادة نفقات الخزينة بالليرة.
            {:else}
              <span class="text-wheat-mid font-medium">الأثر:</span> تسعير عادل يضمن توريد القمح المحلي بالسعر الرائج واستقرار مخزون الطحين.
            {/if}
          </div>
        </div>

        <!-- 5. Diesel Smuggling Control -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('dieselSmuggling') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-bold text-wheat-light font-heading text-xs block">مكافحة تهريب المشتقات النفطية</span>
              <span class="text-[10px] text-wheat-dark">ضبط المازوت والفيول لدعم محطات التوليد</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold text-[10px] font-mono font-bold">
              {SMUGGLING_NAMES_AR[$draftStore.dieselSmuggling || 'STANDARD'] ?? ($draftStore.dieselSmuggling || 'رقابة اعتيادية')}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
            <button
              onclick={() => draftStore.setField('dieselSmuggling', 'CRACKDOWN')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.dieselSmuggling === 'CRACKDOWN' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">حملة صارمة</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+كهرباء وإنتاج</span>
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+6 توتر</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('dieselSmuggling', 'STANDARD')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.dieselSmuggling === 'STANDARD' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">رقابة اعتيادية</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">متوازن</span>
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">روتيني</span>
              </div>
            </button>

            <button
              onclick={() => draftStore.setField('dieselSmuggling', 'PERMISSIVE')}
              class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.dieselSmuggling === 'PERMISSIVE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
            >
              <span class="font-bold text-[10.5px]">غض الطرف</span>
              <div class="flex items-center gap-0.5 flex-wrap justify-center">
                <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">تفادي الصدام</span>
                <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">-كهرباء</span>
              </div>
            </button>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            {#if $draftStore.dieselSmuggling === 'CRACKDOWN'}
              <span class="text-forest-accent font-medium">الأثر:</span> ضبط تهريب المازوت وتوجيهه لمحطات التوليد لرفع ساعات الكهرباء، مع استنفار أمني واحتكاك مع شبكات التهريب.
            {:else if $draftStore.dieselSmuggling === 'PERMISSIVE'}
              <span class="text-amber-300 font-medium">الأثر:</span> تفادي الصدام العشائري، مقابل هدر المحروقات المدعومة وتراجع ساعات التغذية الكهربائية.
            {:else}
              <span class="text-wheat-mid font-medium">الأثر:</span> رقابة روتينية توازن بين حماية المحروقات وتجنب التصعيد الحدودي.
            {/if}
          </div>
        </div>

        <!-- 6. Remittance Spread Margin -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('remittanceCaptureSpread') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start text-xs">
            <div>
              <span class="font-bold text-wheat-light font-heading block">هامش اقتطاع الحوالات للمصرف المركزي ({$draftStore.remittanceCaptureSpread}%)</span>
              <span class="text-[10px] text-wheat-dark">التحكم في تسليم الحوالات الخارجية للمواطنين</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-[10px]">
              {$draftStore.remittanceCaptureSpread}%
            </span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-wheat-dark">الأثر المالي:</span>
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
            <span>5% (جذب الدولار)</span>
            <span class="text-wheat-gold">10% (محايد)</span>
            <span>15% (سقف آمن)</span>
            <span class="text-amber-400">25% (طوارئ: +${remittanceCapturedM}M)</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            {$draftStore.remittanceCaptureSpread <= 15
              ? `نسبة اقتطاع اعتيادية (${$draftStore.remittanceCaptureSpread}%). تحقق جباية دولارية بقيمة +\${remittanceCapturedM}M للخزينة عبر القنوات المصرفية الرسمية بأمان ودون إثارة مقاطعة المغتربين.`
              : `اقتطاع طوارئ استثنائي (${$draftStore.remittanceCaptureSpread}%): يوفر للمصرف المركزي سيولة دولارية إنقاذية ضخمة تصل إلى +\${remittanceCapturedM}M كاش لإنقاذ الاحتياطي ومنع العجز عن سداد الديون واستيراد القمح والفيول، مقابل كلفة مقبولة على الثقة الشعبية ونشاط الصرافة غير النظامي.`}
          </div>
        </div>

        <!-- 7. National Power Grid CapEx Budget -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('gridCapExUSD') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start text-xs">
            <div>
              <span class="font-bold text-wheat-light font-heading block">الاستثمار الرأسمالي لشبكة الكهرباء</span>
              <span class="text-[10px] text-wheat-dark">تأهيل محطات التوليد والشبكات القومية</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
              ${gridCapExM}M
            </span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-wheat-dark">المردود المتوقع:</span>
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
            <span>$0M (تجميد)</span>
            <span class="text-wheat-gold">$35M (صيانة اعتيادية)</span>
            <span>$80M (توسيع شامل)</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            {gridCapExM === 0
              ? 'تجميد الاستثمار الرأسمالي يوفر السيولة الدولارية ($0M كاش)، لكنه يسبب تراجع قدرة الشبكة بنحو 120 ميغاواط وتمديد ساعات التقنين في المحافظات (-0.5 سا/يوم) وزيادة الاحتقان.'
              : gridCapExM === 35
                ? 'الحالة المحايدة ($35M): صيانة دورية تؤمن +399 ميغاواط وتزيد التغذية بنحو +1.6 ساعة/يوم في كافة المحافظات، مما يدعم النشاط الاقتصادي واستقرار الشبكة.'
                : `استثمار \$${gridCapExM}M يضيف نحو ${effectiveGridMW} ميغاواط للشبكة القومية (${effectivePowerHoursDelta > 0 ? '+' : ''}${effectivePowerHoursDelta} سا/يوم)، مما يخفض ساعات التقنين بالمحافظات ويدعم النشاط الصناعي والامتثال الضريبي.`}
          </div>
        </div>

        <!-- 8. Central Bank Dollar Auction -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('dollarAuctionUSD') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start text-xs">
            <div>
              <span class="font-bold text-wheat-light font-heading block">مزاد التدخل الدولاري للمصرف المركزي</span>
              <span class="text-[10px] text-wheat-dark">ضخ سيولة نقدية لكبح انهيار سعر الليرة</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
              ${auctionM}M
            </span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] text-wheat-dark">الأثر:</span>
            <span class="px-1.5 py-0.2 rounded-full {auctionM === 0 ? 'bg-charcoal-surface border border-charcoal-mid text-wheat-dark' : 'bg-umber-deep border border-umber-border text-umber-crimson'} font-mono font-bold text-[9px]">
              {auctionM === 0 ? '$0M (حماية الاحتياطي)' : `-\$${auctionM}M من الاحتياطي`}
            </span>
            <span class="px-1.5 py-0.2 rounded-full {auctionM === 0 ? 'bg-charcoal-surface border border-charcoal-mid text-wheat-mid' : 'bg-forest-mid border border-forest-accent/60 text-forest-accent'} font-mono font-bold text-[9px]">
              {auctionM === 0 ? 'سعر صرف حر دون استنزاف للاحتياطي' : `كبح تدهور الصرف بنسبة ~${auctionReliefPct}% (+${auctionSypT}T ل.س ممتصة)`}
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
            <span>$0M (محايد: حماية الاحتياطي)</span>
            <span>الحد الأقصى المتاح: ${maxAuction}M</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
            {auctionM === 0
              ? 'الحالة المحايدة ($0M): صون احتياطي النقد الأجنبي بالكامل من الاستنزاف. يترك سعر الصرف الموازي يتحدد وفق قوى العرض والطلب لتجنب هدر الدولارات في معارك تثبيت غير مجدية.'
              : `ضخ \$${auctionM}M في السوق الموازي لامتصاص نحو ${auctionSypT} تريليون ليرة سورية وتثبيت سعر الصرف وكبح جماح التضخم، على حساب رصيد احتياطي النقد الأجنبي.`}
          </div>
        </div>
      </div>
        <!-- PILLAR 2: FINANCE, TAXES & CONFISCATED ASSETS -->
    {:else if activePillar === 'finance'}
      <div class="space-y-4">
        <!-- Section: Tax Compliance & Rates -->
        <div class="space-y-3">
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-1.5 transition-all duration-300 {selectedStat ? (isOptionRelated('taxOverview') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
            <div class="flex justify-between items-center text-xs">
              <span class="text-wheat-dark font-heading">معدل الامتثال الضريبي الوطني التقديري:</span>
              <span class="font-bold font-mono text-wheat-gold text-sm">
                {$gameStore.macro.taxCompliancePct ?? 42}%
              </span>
            </div>
            <p class="text-[10px] text-wheat-dark leading-relaxed">
              يُحسب الامتثال آلياً وفق الثقة المجتمعية ({$gameStore.macro.civicTrust}%)، وساعات الكهرباء ({$gameStore.macro.dailyPowerHours} س)، وكفاءة الوزارات، مطروحاً منه الفساد والتوتر الإقليمي.
            </p>
          </div>

          <!-- Corporate Tax Rate -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('corporateTaxRate') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
            <div class="flex justify-between items-start text-xs">
              <div>
                <span class="font-bold text-wheat-light font-heading block">ضريبة أرباح الشركات والمنشآت ({$draftStore.corporateTaxRate}%)</span>
                <span class="text-[10px] text-wheat-dark">الوعاء الضريبي للقطاع التجاري والصناعي</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
                {$draftStore.corporateTaxRate}%
              </span>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-wheat-dark">الإيراد المقدر:</span>
              <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
                +{((($draftStore.corporateTaxRate - 10) * 0.08) + 0.90).toFixed(2)}T ل.س/دور
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
              <span>10% (تشجيع الاستثمار)</span>
              <span>35% (جباية قصوى)</span>
            </div>
            <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
              معدل الضريبة ({$draftStore.corporateTaxRate}%). رفعه يزيد إيرادات الخزينة بالليرة السورية لكن يقلص الاستثمار وقد يحفز التهرب الضريبي.
            </div>
          </div>

          <!-- Telecom Excise Tax -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('telecomExciseRate') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
            <div class="flex justify-between items-start text-xs">
              <div>
                <span class="font-bold text-wheat-light font-heading block">رسم الإنفاق الاستهلاكي على الاتصالات ({$draftStore.telecomExciseRate}%)</span>
                <span class="text-[10px] text-wheat-dark">ضريبة مباشرة على بطاقات الشحن وباقات الإنترنت</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-sm shrink-0">
                {$draftStore.telecomExciseRate}%
              </span>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-wheat-dark">المردود:</span>
              <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
                +{((($draftStore.telecomExciseRate - 5) * 0.05) + 0.40).toFixed(2)}T ل.س/دور
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
              <span>5% (تخفيف الأعباء)</span>
              <span>30% (جباية سريعة)</span>
            </div>
            <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
              رسم استهلاكي ({$draftStore.telecomExciseRate}%). جباية سريعة ومباشرة بالليرة للخزينة، لكن رفعه يثقل كاهل المواطنين ويزيد الاحتقان المعيشي.
            </div>
          </div>

          <!-- All Crossings Transit Fee (formerly Nassib) -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated('nassibTransitFeeUSD') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
            <div class="flex justify-between items-start text-xs">
              <div>
                <span class="font-bold text-wheat-light font-heading block">رسوم الترانزيت بكافة المعابر الحدودية</span>
                <span class="text-[10px] text-wheat-dark">نصيب، البوكمال، التنف، كسب، باب الهوى</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-xs shrink-0">
                ${$draftStore.nassibTransitFeeUSD} / شاحنة
              </span>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-wheat-dark">العائد المقدر:</span>
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
              <span>$200 (تنشيط العبور)</span>
              <span>$800 (تعظيم العائد)</span>
            </div>
            <div class="text-[10px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid/60">
              تعرفة ${$draftStore.nassibTransitFeeUSD} على الشاحنات الأجنبية بكافة المنافذ والمعابر الحدودية لتعظيم عوائد النقد الأجنبي المباشرة ($) للخزينة.
            </div>
          </div>
        </div>
        <!-- Section: Confiscated Assets & War Wealth -->
        <div class="space-y-2 pt-2 border-t border-charcoal-mid transition-all duration-300 {selectedStat ? (isOptionRelated('oligarchs') ? 'ring-2 ring-wheat-gold/80 p-2 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <span class="text-xs text-wheat-mid font-semibold font-heading block">الأصول المصادرة وثروات الحرب</span>
          <div class="space-y-2">
            {#each Object.values($gameStore.confiscatedAssets) as asset}
              {@const decision = $draftStore.oligarchDecisions[asset.id] || asset.status}
              {@const settlementIncomeUSD = getOligarchSettlementIncome(asset.valuationUSD)}
              {@const liquidationIncomeUSD = getOligarchLiquidationIncome(asset.valuationUSD)}
              {@const settlementPCCost = getOligarchSettlementPCCost(asset.valuationUSD)}
              {@const liquidationPCCost = getOligarchLiquidationPCCost(asset.valuationUSD)}
              {@const nationalizePCEarned = getOligarchNationalizePCEarned(asset.valuationUSD)}
              {@const canAffordSettlement = decision === 'SETTLEMENT_80_20' || $budgetStore.remainingPC >= settlementPCCost}
              {@const canAffordLiquidation = decision === 'FOREIGN_LIQUIDATION' || $budgetStore.remainingPC >= liquidationPCCost}
              <div class="p-3 bg-charcoal-surface border border-charcoal-mid rounded-none space-y-2 text-[11px]">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-wheat-light font-bold block">{asset.titleAr}</span>
                    <span class="text-wheat-dark text-[10px]">المالك: {asset.ownerNameAr}</span>
                  </div>
                  <span class="font-mono text-wheat-gold text-xs font-bold">${formatM(asset.valuationUSD)}M</span>
                </div>
                {#if asset.status === 'PENDING'}
                  <div class="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
                    <!-- Option 1: 80/20 Settlement -->
                    <button
                      disabled={decision !== 'SETTLEMENT_80_20' && !canAffordSettlement}
                      onclick={() => {
                        if (decision === 'SETTLEMENT_80_20') {
                          draftStore.removeOligarchDecision(asset.id);
                        } else if (canAffordSettlement) {
                          draftStore.setOligarchDecision(asset.id, 'SETTLEMENT_80_20');
                        }
                      }}
                      class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 {decision === 'SETTLEMENT_80_20' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : canAffordSettlement ? 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
                      title="تسوية 80/20: تحصيل 80% كاش (+${formatM(settlementIncomeUSD)}M$)، كلفة {settlementPCCost} رصيد سياسي، +2 ثقة"
                    >
                      <span class="font-bold text-[10px]">تسوية 80/20</span>
                      <div class="flex items-center gap-1 flex-wrap justify-center">
                        <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">
                          +${formatM(settlementIncomeUSD)}M
                        </span>
                        <span class="px-1.5 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">
                          -{settlementPCCost} رصيد سياسي
                        </span>
                      </div>
                    </button>

                    <!-- Option 2: Nationalize SOE -->
                    <button
                      onclick={() => {
                        if (decision === 'NATIONALIZE_SOE') {
                          draftStore.removeOligarchDecision(asset.id);
                        } else {
                          draftStore.setOligarchDecision(asset.id, 'NATIONALIZE_SOE');
                        }
                      }}
                      class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 {decision === 'NATIONALIZE_SOE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer'}"
                      title="تأميم حكومي: ضم الأصل لشركات الدولة، كسب +{nationalizePCEarned} رصيد سياسي، +{formatTrillion(asset.soeVenueSYPPerTurn)}T ل.س/دور، +8000 موظف، +5 فساد"
                    >
                      <span class="font-bold text-[10px]">تأميم حكومي</span>
                      <div class="flex items-center gap-1 flex-wrap justify-center">
                        <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">
                          +{nationalizePCEarned} رصيد سياسي
                        </span>
                        <span class="px-1.5 py-0.2 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8.5px]">
                          +{formatTrillion(asset.soeVenueSYPPerTurn)}T/دور
                        </span>
                      </div>
                    </button>

                    <!-- Option 3: Foreign Liquidation -->
                    <button
                      disabled={decision !== 'FOREIGN_LIQUIDATION' && !canAffordLiquidation}
                      onclick={() => {
                        if (decision === 'FOREIGN_LIQUIDATION') {
                          draftStore.removeOligarchDecision(asset.id);
                        } else if (canAffordLiquidation) {
                          draftStore.setOligarchDecision(asset.id, 'FOREIGN_LIQUIDATION');
                        }
                      }}
                      class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 {decision === 'FOREIGN_LIQUIDATION' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : canAffordLiquidation ? 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
                      title="تصفية خارجية: بيع سريع بالدولار بخصم 40% (+${formatM(liquidationIncomeUSD)}M$)، كلفة {liquidationPCCost} رصيد سياسي، -4 ثقة"
                    >
                      <span class="font-bold text-[10px]">تصفية خارجية</span>
                      <div class="flex items-center gap-1 flex-wrap justify-center">
                        <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">
                          +${formatM(liquidationIncomeUSD)}M
                        </span>
                        <span class="px-1.5 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">
                          -{liquidationPCCost} رصيد سياسي
                        </span>
                      </div>
                    </button>
                  </div>
                {:else}
                  <div class="text-[10px] text-wheat-mid font-mono pt-1 border-t border-charcoal-mid">
                    تمت المعالجة: {ASSET_STATUS_AR[asset.status] ?? asset.status}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Section: Foreign Loans & Sovereign Mortgages -->
        <div class="space-y-2 pt-2 border-t border-charcoal-mid transition-all duration-300 {selectedStat ? (isOptionRelated('loans') ? 'ring-2 ring-wheat-gold/80 p-2 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <span class="text-xs text-wheat-mid font-semibold font-heading block">خطوط الائتمان والتمويل الخارجي</span>
          <div class="space-y-2">
            {#each $gameStore.foreignLoans as loan}
              {@const isSelected = $draftStore.signedLoanIds.includes(loan.id) || loan.isSigned}
              {@const canAffordLoan = isSelected || $budgetStore.remainingPC >= loan.politicalCapitalCost}
              <div class="p-3 bg-charcoal-surface border border-charcoal-mid rounded-none space-y-2 text-[11px]">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-wheat-light font-bold block">{loan.titleAr}</span>
                    <span class="text-wheat-dark text-[10px]">{loan.lenderAr}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[10px]">
                    +${loan.disbursementUSD / 1_000_000}M
                  </span>
                </div>
                <p class="text-[11px] text-wheat-dark leading-relaxed">{loan.concessionSummaryAr}</p>
                <div class="flex justify-between items-center pt-1.5 border-t border-charcoal-mid">
                  <span class="text-[10px] text-wheat-gold font-mono">فائدة {loan.interestRatePct}% | كلفة {loan.politicalCapitalCost} رصيد سياسي</span>
                  <button
                    disabled={loan.isSigned || (!isSelected && !canAffordLoan)}
                    onclick={() => {
                      if (!loan.isSigned && (isSelected || canAffordLoan)) {
                        draftStore.toggleLoan(loan.id);
                      }
                    }}
                    class="px-2.5 py-1 text-[10px] border transition-colors rounded-none {loan.isSigned ? 'bg-charcoal-surface border-charcoal-mid text-wheat-dark cursor-not-allowed' : isSelected ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold cursor-pointer' : canAffordLoan ? 'bg-forest-mid border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark cursor-not-allowed opacity-60'}"
                  >
                    {loan.isSigned ? 'تم التوقيع مسبقاً' : isSelected ? 'معتمد للتوقيع' : !canAffordLoan ? 'رصيد سياسي غير كافٍ' : 'طلب وتوقيع القرض'}
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <!-- Emergency Sovereign Mortgages -->
          <div class="space-y-2 pt-2 transition-all duration-300 {selectedStat ? (isOptionRelated('mortgages') ? 'ring-2 ring-wheat-gold/80 p-2 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
            <span class="text-xs text-wheat-mid font-semibold font-heading block">الرهون والامتيازات السيادية الطارئة</span>
            <div class="space-y-2">
              {#each $gameStore.sovereignMortgages as mort}
                {@const isMortgaged = $draftStore.executedMortgageIds.includes(mort.id) || mort.isMortgaged}
                <div class="p-3 bg-charcoal-surface border border-charcoal-mid rounded-none space-y-2 text-[11px]">
                  <div class="flex justify-between items-start">
                    <div>
                      <span class="text-wheat-light font-bold block">{mort.titleAr}</span>
                      <span class="text-wheat-dark text-[10px]">امتياز لـ {mort.concessionDurationYears} سنة</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[10px]">
                      +${mort.immediateCashUSD / 1_000_000}M
                    </span>
                  </div>
                  <p class="text-[10px] text-umber-crimson leading-relaxed">{mort.sovereigntyPenaltyAr}</p>
                  <div class="flex justify-between items-center pt-1.5 border-t border-charcoal-mid">
                    <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9px]">
                      -${mort.turnRevenueLossUSD / 1_000_000}M / دور
                    </span>
                    <button
                      disabled={mort.isMortgaged}
                      onclick={() => draftStore.toggleMortgage(mort.id)}
                      class="px-2.5 py-1 text-[10px] border transition-colors rounded-none {mort.isMortgaged ? 'bg-charcoal-surface border-charcoal-mid text-wheat-dark cursor-not-allowed' : isMortgaged ? 'bg-umber-crimson border-wheat-light text-forest-deep font-bold' : 'bg-umber-mid border-umber-border text-wheat-light hover:bg-umber-border cursor-pointer'}"
                    >
                      {mort.isMortgaged ? 'مرهون مسبقاً' : isMortgaged ? 'معتمد للرهن' : 'إبرام عقد الرهن'}
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

    <!-- PILLAR 3: DECREES & STATE GOVERNANCE -->
    {:else if activePillar === 'governance'}
      <div class="space-y-4">
        <!-- List of Presidential Decrees & Political Actions -->
        <div class="space-y-2">
          <span class="text-xs text-wheat-mid font-semibold font-heading block">المراسيم الرئاسية والقرارات السيادية</span>
          {#each DECREES as dec}
            {@const isEnacted = $gameStore.enactedDecrees?.includes(dec.id)}
            {@const isActive = $draftStore.activePoliticalActions.includes(dec.id)}
            {@const costPC = DECREE_PC_COSTS[dec.id] || 0}
            {@const canAfford = isActive || costPC <= $budgetStore.remainingPC}
            <div
              class="p-3 border transition-all duration-300 rounded-none {isEnacted ? 'bg-forest-surface/30 border-forest-accent/40 opacity-80' : isActive ? (dec.behavior === 'CONTINUOUS_TOGGLE' ? 'bg-umber-deep/40 border-umber-border shadow-md' : 'bg-forest-surface border-wheat-gold shadow-md') : 'bg-charcoal-surface border-charcoal-mid'} {selectedStat ? (isDecreeRelated(dec.id) ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}"
            >
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <h3 class="text-xs font-bold text-wheat-light font-heading leading-tight">{dec.titleAr}</h3>
                      {#if isEnacted}
                        <span class="px-1.5 py-0.2 rounded-none bg-forest-mid border border-forest-accent text-forest-accent font-bold text-[9px]">
                          ✓ صادر ونافذ رسمياً
                        </span>
                      {:else if dec.behavior === 'ONE_TIME'}
                        <span class="px-1.5 py-0.2 rounded-none bg-charcoal-surface border border-charcoal-mid text-wheat-dark text-[8.5px]">
                          مرسوم لمرة واحدة
                        </span>
                      {:else if dec.behavior === 'CONTINUOUS_TOGGLE'}
                        <span class="px-1.5 py-0.2 rounded-none bg-umber-deep/50 border border-umber-border text-umber-crimson font-bold text-[8.5px]">
                          {isActive ? '● طوارئ سارية' : 'أثر وديبَف مستمر'}
                        </span>
                      {:else}
                        <span class="px-1.5 py-0.2 rounded-none bg-charcoal-surface border border-charcoal-mid text-wheat-mid text-[8.5px]">
                          إجراء دوري
                        </span>
                      {/if}
                    </div>
                  </div>

                  {#if isEnacted}
                    <span class="px-2.5 py-1 text-[10.5px] font-bold shrink-0 border border-forest-accent/40 bg-forest-surface text-forest-accent select-none">
                      نافذ بالقانون
                    </span>
                  {:else if dec.behavior === 'CONTINUOUS_TOGGLE'}
                    <button
                      onclick={() => draftStore.togglePoliticalAction(dec.id)}
                      class="px-3 py-1 text-[11px] font-bold shrink-0 border transition-colors rounded-none cursor-pointer {isActive ? 'bg-umber-deep hover:bg-umber-crimson border-umber-border text-amber-200 hover:text-white' : 'bg-forest-mid text-wheat-mid hover:text-wheat-light border-charcoal-mid hover:border-charcoal-light'}"
                    >
                      {isActive ? 'إنهاء حالة الطوارئ' : 'إعلان الطوارئ'}
                    </button>
                  {:else}
                    <button
                      disabled={!isActive && !canAfford}
                      onclick={() => {
                        if (isActive || canAfford) {
                          draftStore.togglePoliticalAction(dec.id);
                        }
                      }}
                      class="px-3 py-1 text-[11px] font-bold shrink-0 border transition-colors rounded-none {isActive ? 'bg-wheat-gold text-forest-deep border-wheat-gold cursor-pointer' : canAfford ? 'bg-forest-mid text-wheat-mid hover:text-wheat-light border-charcoal-mid hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-60'}"
                    >
                      {#if isActive}
                        [مُفعّل]
                      {:else if !canAfford}
                        رصيد سياسي غير كافٍ ({costPC})
                      {:else}
                        تفعيل
                      {/if}
                    </button>
                  {/if}
                </div>

                <p class="text-[11px] text-wheat-dark leading-relaxed">{dec.descAr}</p>

                {#if dec.behavior === 'CONTINUOUS_TOGGLE' && isActive}
                  <div class="p-2 bg-umber-deep/60 border border-umber-border text-[10px] space-y-0.5 text-amber-200">
                    <span class="font-bold text-amber-300 block">ديبَف مستمر سارٍ:</span>
                    <span>تخفيض الاحتقان مستمر، مع هبوط متواصل في الثقة الشعبية (-4% كل دور) حتى تنهي حالة الطوارئ يدوياً.</span>
                  </div>
                {/if}

                {#if isEnacted}
                  <div class="pt-1 text-[10px] text-forest-accent/90 border-t border-forest-accent/20 flex items-center gap-1 font-mono">
                    <span>تم إصدار وإنفاذ هذا المرسوم بشكل دائم في الدولة.</span>
                  </div>
                {:else}
                  <div class="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-charcoal-mid/80 text-[10px]">
                    <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9.5px]">
                      {dec.gainAr}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9.5px]">
                      {dec.costAr}
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Expatriate Brain-Gain Initiative -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none flex items-center justify-between gap-2 transition-all duration-300 {selectedStat ? (isOptionRelated('brainGain') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-bold text-wheat-light block font-heading">حوافز استقطاب الكفاءات والمهاجرين</span>
              <span class="px-1.5 py-0.2 rounded-none bg-forest-surface border border-forest-accent/40 text-forest-accent text-[8.5px] font-mono">تفعيل مستمر دورياً</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-wheat-dark">الكلفة:</span>
              <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9.5px]">-$20M</span>
              <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9.5px]">-0.35T ل.س</span>
              <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9.5px]">+8% كفاءة</span>
              <span class="px-2 py-0.5 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[9.5px]">+4 ثقة</span>
              {#if isBrainGainCoveredByFX && !$draftStore.expatriateBrainGainIncentive}
                <span class="px-1.5 py-0.5 rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[9px]">
                  مغطى بالنقد الأجنبي
                </span>
              {/if}
            </div>
          </div>
          <button
            disabled={!$draftStore.expatriateBrainGainIncentive && !canAffordBrainGain}
            onclick={() => {
              if ($draftStore.expatriateBrainGainIncentive || canAffordBrainGain) {
                draftStore.setField('expatriateBrainGainIncentive', !$draftStore.expatriateBrainGainIncentive);
              }
            }}
            class="px-2.5 py-1 border text-[10px] rounded-none transition-colors {$draftStore.expatriateBrainGainIncentive ? 'bg-forest-surface border-forest-accent text-forest-accent font-bold cursor-pointer' : canAffordBrainGain ? 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
          >
            {#if $draftStore.expatriateBrainGainIncentive}
              مُفعّل (مستمر)
            {:else if !canAffordBrainGain}
              ميزانية غير كافية
            {:else if isBrainGainCoveredByFX}
              تفعيل (بتغطية النقد الأجنبي)
            {:else}
              مُعطّل
            {/if}
          </button>
        </div>

        <!-- Executive Ministries List -->
        <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
          <h3 class="text-xs text-wheat-mid font-semibold font-heading">الحقائب التنفيذية وتصنيف الكفاءة</h3>
          {#each Object.values($gameStore.ministries) as min}
            <div class="p-2.5 bg-charcoal-surface border border-charcoal-mid rounded-none text-[11px] space-y-1">
              <div class="flex justify-between items-center">
                <span class="font-bold text-wheat-light font-heading">{min.nameAr}</span>
                <span class="font-mono text-forest-accent font-bold">كفاءة {min.competence}%</span>
              </div>
              <div class="flex justify-between items-center text-[10px] text-wheat-dark">
                <span>الوزير: {min.ministerNameAr}</span>
                {#if min.isOpposition}
                  <span class="text-wheat-gold font-bold">[معارضة ائتلافية]</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>

        <!-- Sovereign Commissions List -->
        <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
          <h3 class="text-xs text-wheat-mid font-semibold font-heading">الهيئات واللجان السيادية</h3>
          {#each Object.values($gameStore.commissions) as comm}
            <div class="p-2.5 bg-charcoal-surface border border-charcoal-mid rounded-none text-[11px] space-y-1">
              <div class="flex justify-between items-center">
                <span class="font-bold text-wheat-light font-heading">{comm.nameAr}</span>
                <span class="font-mono text-wheat-gold font-bold">إنجاز {comm.progress}%</span>
              </div>
              {#if comm.leaderNameAr}
                <div class="text-[10px] text-wheat-dark">
                  رئيس الهيئة: {comm.leaderNameAr}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>


</aside>
