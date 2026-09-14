<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore, previewRangesStore } from '../stores/draft-store';
  import { uiStore, type MinistryTab } from '../stores/ui-store';

  interface PoliticalDecreeItem {
    id: string;
    titleAr: string;
    descAr: string;
    costAr: string;
    gainAr: string;
    category: 'DECREE' | 'POLITICAL';
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
    },
    {
      id: 'PROPERTY_RESTITUTION_PORTAL',
      titleAr: 'المنصة الرقمية لرد الملكيات العقارية للاجئين',
      descAr: 'إنفاذ المرسوم 16 لرد الملكيات وتثبيت القيود رقمياً عبر سندات الطابو وحجج الوقف الموثقة.',
      costAr: 'يستهلك 10 رصيد سياسي',
      gainAr: 'يشجع عودة اللاجئين ويخفض مؤشر الاحتقان في حمص وريف دمشق ويرفع الثقة (+4)',
      category: 'DECREE',
    },
    {
      id: 'SMUGGLING_BORDER_SWEEP',
      titleAr: 'الحملة الوطنية المشتركة لضبط الحدود ومكافحة التهريب',
      descAr: 'نشر سرايا الهجانة ومفارز الجمارك على المعابر غير الشرعية وضبط تهريب المازوت والسلع المدعومة.',
      costAr: 'يستهلك 12 رصيد سياسي',
      gainAr: 'يحد من نزيف العملة الأجنبية ويجلب سيولة جمركية (+15M$) ويقلص الفساد (-4)',
      category: 'DECREE',
    },
    {
      id: 'TRIBAL_CUSTOMS_COUNCIL',
      titleAr: 'ميثاق التفاهم العشائري وتأمين الترانزيت الشرقي',
      descAr: 'إشراك وجهاء العشائر في حماية قوافل الترانزيت على طريق M4 مقابل عوائد تنموية محلية.',
      costAr: 'يستهلك 8 رصيد سياسي',
      gainAr: 'يؤمن حركة الترانزيت ويخفض اضطرابات دير الزور والرقة (-10 بمؤشر الاحتقان)',
      category: 'DECREE',
    },
    {
      id: 'CABINET_HEARING',
      titleAr: 'جلسة مساءلة حكومية علنية ونشر الذمة المالية',
      descAr: 'استدعاء وزراء المالية والتجارة والكهرباء لمساءلة مفتوحة أمام وسائل الإعلام وبثها للرأي العام.',
      costAr: 'صفر رصيد سياسي (مجاني)',
      gainAr: 'يرفع الرصيد السياسي (+8) والثقة المجتمعية (+3) وكفاءة الوزارات (+2)',
      category: 'POLITICAL',
    },
    {
      id: 'UNITY_SPEECH',
      titleAr: 'خطاب المصالحة الوطنية والعهد المدني الشامل',
      descAr: 'إعلان رئاسي رسمي بإنهاء كافة الملاحقات الإدارية والترحيب بعودة الكفاءات ورؤوس الأموال المهاجرة.',
      costAr: 'صفر رصيد سياسي (مجاني)',
      gainAr: 'يرفع الرصيد السياسي (+4) والثقة (+2) ويخفض مؤشر الاحتقان (-3)',
      category: 'POLITICAL',
    },
    {
      id: 'OPPOSITION_SEATS',
      titleAr: 'توسيع التشكيل الحكومي واستيعاب معارضة التكنوقراط',
      descAr: 'تعيين وزيرين مستقلين في حقيبتي الشؤون الاجتماعية والصناعة لضمان إجماع أوسع.',
      costAr: 'يستهلك تفاهمات سياسية محدودة',
      gainAr: 'يمنح +18 رصيد سياسي و +4 ثقة شعبية بإشراك الكفاءات الوطنية',
      category: 'POLITICAL',
    },
    {
      id: 'MARTIAL_LAW',
      titleAr: 'إعلان حالة الطوارئ والأحكام العرفية',
      descAr: 'تجميد فوري لمؤشر الشغب والاحتجاجات وفرض منع التجوال في المناطق المشتعلة.',
      costAr: 'هبوط الثقة المدنية (-12) وخطر توتر أمني محتمل',
      gainAr: 'تخفيض فوري حاسم لمؤشر الاحتقان الوطني (-15 نقطة) والمحلي (-12)',
      category: 'POLITICAL',
    },
  ];

  function formatM(val: number): string {
    return (val / 1_000_000).toFixed(1);
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

  let maxCapEx = $derived(
    Math.max(0, Math.min(80, Math.floor(($budgetStore.remainingUSD + $draftStore.gridCapExUSD) / 1_000_000)))
  );

  let maxAuction = $derived(
    Math.max(0, Math.min(100, Math.floor(($budgetStore.remainingUSD + $draftStore.dollarAuctionUSD) / 1_000_000)))
  );

  let canAffordBrainGain = $derived(
    $draftStore.expatriateBrainGainIncentive ||
    ($budgetStore.remainingUSD >= 20_000_000 && $budgetStore.remainingSYP >= 350_000_000_000)
  );
</script>

<aside
  class="fixed top-0 right-0 bottom-0 w-[390px] h-screen z-30 bg-forest-deep border-l border-charcoal-mid shadow-2xl p-4 flex flex-col justify-between overflow-y-auto select-none rounded-none font-arabic text-wheat-light"
>
  <div class="space-y-4">
    <!-- Drawer Header & Tabs -->
    <div class="border-b border-charcoal-mid pb-3 space-y-2.5">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-wheat-light font-heading">
          غرفة مجلس الوزراء والسياسات الكلية
        </h2>
        <span class="text-[10px] text-wheat-gold font-mono border border-charcoal-mid px-2 py-0.5 bg-forest-mid">
          رصيد متاح: {$budgetStore.remainingPC} رصيد سياسي
        </span>
      </div>

      <!-- Navigation Tabs (3 Consolidated Sovereign Pillars) -->
      <div class="grid grid-cols-3 gap-1 bg-charcoal-surface p-1 border border-charcoal-mid rounded-none">
        {#each TABS as tab}
          <button
            onclick={() => uiStore.setMinistryTab(tab.id as MinistryTab)}
            class="py-1.5 px-2 text-[11px] font-semibold transition-colors rounded-none text-center truncate cursor-pointer {activePillar === tab.id ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
          >
            {tab.labelAr}
          </button>
        {/each}
      </div>
    </div>

    <!-- PILLAR 1: MACRO POLICIES & COMMODITIES -->
    {#if activePillar === 'macro'}
      <div class="space-y-3">
        <!-- 1. Civil Service Wages -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-wheat-light font-heading">زيادة أجور العاملين في الدولة</span>
            <span class="font-mono text-wheat-gold font-bold">+{$draftStore.wageBumpPercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={$draftStore.wageBumpPercent}
            oninput={(e) => draftStore.setField('wageBumpPercent', Number(e.currentTarget.value))}
            class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
          />
          <div class="flex justify-between text-[10px] text-wheat-dark">
            <span>0% (تقشف وتثبيت)</span>
            <span>+25% (امتصاص الاحتقان)</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
            <span class="text-wheat-gold font-medium">الأثر المباشر:</span>
            زيادة الرواتب بنسبة +{$draftStore.wageBumpPercent}% ترفع أجر الموظف الحقيقي ($) وتمتص الاحتقان الشعبي، مقابل زيادة كتلة الرواتب بالليرة السورية ومخاطر عجز الموازنة والتضخم.
          </div>
        </div>

        <!-- 2. Food Subsidies Tier -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <span class="font-bold text-wheat-light font-heading text-xs block">مستوى الدعم التمويني والخبز</span>
          <div class="grid grid-cols-3 gap-1 text-[11px]">
            {#each [
              { id: 'AUSTERE', label: 'تقشف' },
              { id: 'STANDARD', label: 'اعتيادي' },
              { id: 'GENEROUS', label: 'موسع' }
            ] as opt}
              <button
                onclick={() => draftStore.setField('foodSubsidyLevel', $draftStore.foodSubsidyLevel === opt.id ? null : (opt.id as any))}
                class="py-1.5 px-1 text-center border transition-colors rounded-none {$draftStore.foodSubsidyLevel === opt.id ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
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
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <span class="font-bold text-wheat-light font-heading text-xs block">إعادة هيكلة ملاك الدولة والتوظيف</span>
          <div class="grid grid-cols-3 gap-1 text-[11px]">
            {#each [
              { id: 'MAINTAIN', label: 'تثبيت الملاك' },
              { id: 'PRUNE_CIVIL_SERVICE', label: 'شطب الوهمي' },
              { id: 'ABSORB_MILITIAS', label: 'استيعاب المسلحين' }
            ] as opt}
              <button
                onclick={() => draftStore.setField('workforceStrategy', $draftStore.workforceStrategy === opt.id ? null : (opt.id as any))}
                class="py-1.5 px-1 text-center border transition-colors rounded-none {$draftStore.workforceStrategy === opt.id ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
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
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <span class="font-bold text-wheat-light font-heading text-xs block">تسعير شراء القمح المحلي من المزارعين</span>
          <div class="grid grid-cols-3 gap-1 text-[11px]">
            {#each [
              { id: 'SUBSIDIZED_LOW', label: 'سعر إلزامي مخفض' },
              { id: 'MARKET_PARITY', label: 'سعر السوق العادل' },
              { id: 'PREMIUM_INCENTIVE', label: 'علاوة تحفيز مجزية' }
            ] as opt}
              <button
                onclick={() => draftStore.setField('wheatProcurement', $draftStore.wheatProcurement === opt.id ? null : (opt.id as any))}
                class="py-1.5 px-1 text-center border transition-colors rounded-none {$draftStore.wheatProcurement === opt.id ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
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
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <span class="font-bold text-wheat-light font-heading text-xs block">مكافحة تهريب المشتقات النفطية</span>
          <div class="grid grid-cols-3 gap-1 text-[11px]">
            {#each [
              { id: 'CRACKDOWN', label: 'حملة أمنية صارمة' },
              { id: 'STANDARD', label: 'رقابة اعتيادية' },
              { id: 'PERMISSIVE', label: 'غض الطرف' }
            ] as opt}
              <button
                onclick={() => draftStore.setField('dieselSmuggling', $draftStore.dieselSmuggling === opt.id ? null : (opt.id as any))}
                class="py-1.5 px-1 text-center border transition-colors rounded-none {$draftStore.dieselSmuggling === opt.id ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer'}"
              >
                {opt.label}
              </button>
            {/each}
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
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
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-wheat-light font-heading">هامش اقتطاع الحوالات الخارجية للمصرف المركزي</span>
            <span class="font-mono text-wheat-gold font-bold">{$draftStore.remittanceCaptureSpread}%</span>
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
          <div class="flex justify-between text-[10px] text-wheat-dark">
            <span>5% (جذب التدفقات الرسمية)</span>
            <span>25% (اقتطاع جائر للمركزي)</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
            <span class="text-wheat-gold font-medium">الأثر:</span>
            نسبة اقتطاع المركزي ({$draftStore.remittanceCaptureSpread}%). الهامش المنخفض يحفز التحويل عبر القنوات الرسمية ويعظم تدفق الدولار، ورفعه يجبي سيولة سريعة لكن ينعش السوق الموازي.
          </div>
        </div>

        <!-- 7. National Power Grid CapEx Budget -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <div class="flex justify-between items-start text-xs">
            <div>
              <span class="font-bold text-wheat-light font-heading block">الاستثمار الرأسمالي القومي لشبكة الكهرباء</span>
              <span class="text-[10px] text-wheat-dark">تأهيل محطات التوليد وشبكات النقل الفائقة (أثر شامل على المحافظات)</span>
            </div>
            <span class="font-mono text-wheat-gold font-bold text-sm shrink-0">${$draftStore.gridCapExUSD / 1_000_000}M</span>
          </div>
          <input
            type="range"
            min="0"
            max={maxCapEx}
            step="5"
            value={$draftStore.gridCapExUSD / 1_000_000}
            oninput={(e) => draftStore.setField('gridCapExUSD', Number(e.currentTarget.value) * 1_000_000)}
            class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
          />
          <div class="flex justify-between text-[10px] text-wheat-dark">
            <span>$0M</span>
            <span>الحد الأقصى المتاح: ${maxCapEx}M</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
            <span class="text-forest-accent font-medium">الأثر:</span>
            استثمار ${$draftStore.gridCapExUSD / 1_000_000}M$ يضيف نحو {Math.round(((Math.max(0, $draftStore.gridCapExUSD) * 0.95) / 1_000_000) * 12)} ميغاواط للشبكة القومية، مما يرفع ساعات الكهرباء في كافة المحافظات ويدعم النشاط الصناعي والامتثال الضريبي.
          </div>
        </div>

        <!-- 8. Central Bank Dollar Auction -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="font-bold text-wheat-light font-heading">مزاد التدخل الدولاري لمصرف سورية المركزي</span>
            <span class="font-mono text-wheat-gold font-bold">${$draftStore.dollarAuctionUSD / 1_000_000}M</span>
          </div>
          <input
            type="range"
            min="0"
            max={maxAuction}
            step="5"
            value={$draftStore.dollarAuctionUSD / 1_000_000}
            oninput={(e) => draftStore.setField('dollarAuctionUSD', Number(e.currentTarget.value) * 1_000_000)}
            class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
          />
          <div class="flex justify-between text-[10px] text-wheat-dark">
            <span>$0M</span>
            <span>الحد الأقصى المتاح: ${maxAuction}M</span>
          </div>
          <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
            <span class="text-amber-300 font-medium">الأثر:</span>
            ضخ ${$draftStore.dollarAuctionUSD / 1_000_000}M$ في السوق الموازي لكبح تدهور سعر صرف الليرة السورية، على حساب استنزاف احتياطي النقد الأجنبي.
          </div>
        </div>
      </div>

    <!-- PILLAR 2: FINANCE, TAXES & CONFISCATED ASSETS -->
    {:else if activePillar === 'finance'}
      <div class="space-y-4">
        <!-- Section: Tax Compliance & Rates -->
        <div class="space-y-3">
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-1.5">
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
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-wheat-light font-heading">ضريبة أرباح الشركات والمنشآت التجارية</span>
              <span class="font-mono text-wheat-gold font-bold">{$draftStore.corporateTaxRate}%</span>
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
            <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
              <span class="text-wheat-gold font-medium">الأثر:</span>
              معدل الضريبة ({$draftStore.corporateTaxRate}%). رفعه يزيد إيرادات الخزينة بالليرة السورية لكن يقلص الاستثمار وقد يحفز التهرب الضريبي.
            </div>
          </div>

          <!-- Telecom Excise Tax -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-wheat-light font-heading">رسم الإنفاق الاستهلاكي على الاتصالات</span>
              <span class="font-mono text-wheat-gold font-bold">{$draftStore.telecomExciseRate}%</span>
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
            <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
              <span class="text-wheat-gold font-medium">الأثر:</span>
              رسم استهلاكي ({$draftStore.telecomExciseRate}%). جباية سريعة ومباشرة بالليرة للخزينة، لكن رفعه يثقل كاهل المواطنين ويزيد الاحتقان المعيشي.
            </div>
          </div>

          <!-- All Crossings Transit Fee (formerly Nassib) -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-wheat-light font-heading">رسوم الترانزيت البري بكافة المعابر الحدودية</span>
              <span class="font-mono text-wheat-gold font-bold">${$draftStore.nassibTransitFeeUSD} / شاحنة</span>
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
            <div class="text-[10px] text-wheat-dark leading-relaxed p-1.5 bg-charcoal-surface/60 border border-charcoal-mid/60">
              <span class="text-wheat-gold font-medium">الأثر:</span>
              تعرفة ${$draftStore.nassibTransitFeeUSD} على الشاحنات الأجنبية بكافة المعابر البرية (نصيب، البوكمال، التنف، كسب، باب الهوى) لتعظيم عوائد النقد الأجنبي المباشرة ($) للخزينة.
            </div>
          </div>
        </div>

        <!-- Section: Confiscated Assets & War Wealth -->
        <div class="space-y-2 pt-2 border-t border-charcoal-mid">
          <span class="text-xs text-wheat-mid font-semibold font-heading block">الأصول المصادرة وثروات الحرب</span>
          <div class="space-y-2">
            {#each Object.values($gameStore.confiscatedAssets) as asset}
              {@const decision = $draftStore.oligarchDecisions[asset.id] || asset.status}
              {@const canAffordSettlement = decision === 'SETTLEMENT_80_20' || $budgetStore.remainingPC >= 8}
              {@const canAffordLiquidation = decision === 'FOREIGN_LIQUIDATION' || $budgetStore.remainingPC >= 10}
              <div class="p-3 bg-charcoal-surface border border-charcoal-mid rounded-none space-y-2 text-[11px]">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-wheat-light font-bold block">{asset.titleAr}</span>
                    <span class="text-wheat-dark text-[10px]">المالك: {asset.ownerNameAr}</span>
                  </div>
                  <span class="font-mono text-wheat-gold text-xs font-bold">${formatM(asset.valuationUSD)}M</span>
                </div>
                {#if asset.status === 'PENDING'}
                  <div class="grid grid-cols-3 gap-1 text-[10px] pt-1">
                    <button
                      disabled={decision !== 'SETTLEMENT_80_20' && !canAffordSettlement}
                      onclick={() => {
                        if (decision === 'SETTLEMENT_80_20') {
                          draftStore.removeOligarchDecision(asset.id);
                        } else if (canAffordSettlement) {
                          draftStore.setOligarchDecision(asset.id, 'SETTLEMENT_80_20');
                        }
                      }}
                      class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center gap-0.5 {decision === 'SETTLEMENT_80_20' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : canAffordSettlement ? 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
                      title="تسوية 80/20: تحصيل 80% كاش (+${formatM(asset.valuationUSD * 0.8)}M$)، +2 ثقة، كلفة 8 رصيد سياسي"
                    >
                      <span>تسوية 80/20</span>
                      <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
                        +${formatM(asset.valuationUSD * 0.8)}M
                      </span>
                    </button>
                    <button
                      onclick={() => {
                        if (decision === 'NATIONALIZE_SOE') {
                          draftStore.removeOligarchDecision(asset.id);
                        } else {
                          draftStore.setOligarchDecision(asset.id, 'NATIONALIZE_SOE');
                        }
                      }}
                      class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center gap-0.5 {decision === 'NATIONALIZE_SOE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer'}"
                      title="تأميم حكومي: ضم الأصل لشركات الدولة، +8000 وظيفة، +5 رصيد سياسي، +5 فساد"
                    >
                      <span>تأميم حكومي</span>
                      <span class="px-1.5 py-0.2 rounded-full bg-forest-surface border border-charcoal-light text-wheat-gold font-mono font-bold text-[9px]">
                        +5 رصيد
                      </span>
                    </button>
                    <button
                      disabled={decision !== 'FOREIGN_LIQUIDATION' && !canAffordLiquidation}
                      onclick={() => {
                        if (decision === 'FOREIGN_LIQUIDATION') {
                          draftStore.removeOligarchDecision(asset.id);
                        } else if (canAffordLiquidation) {
                          draftStore.setOligarchDecision(asset.id, 'FOREIGN_LIQUIDATION');
                        }
                      }}
                      class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center gap-0.5 {decision === 'FOREIGN_LIQUIDATION' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : canAffordLiquidation ? 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
                      title="تصفية خارجية: بيع سريع بالدولار بخصم 40% لجلب +${formatM(asset.valuationUSD * 0.6)}M$ كاش، -4 ثقة، كلفة 10 رصيد سياسي"
                    >
                      <span>تصفية خارجية</span>
                      <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9px]">
                        +${formatM(asset.valuationUSD * 0.6)}M
                      </span>
                    </button>
                  </div>
                {:else}
                  <div class="text-[10px] text-wheat-mid font-mono pt-1 border-t border-charcoal-mid">
                    تمت المعالجة: {asset.status === 'SETTLED' ? 'تسوية مالية مصادقة' : asset.status === 'NATIONALIZED' ? 'تأميم حكومي قطاع عام' : asset.status === 'LIQUIDATED' ? 'تصفية خارجية' : asset.status}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Section: Foreign Loans & Sovereign Mortgages -->
        <div class="space-y-2 pt-2 border-t border-charcoal-mid">
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
                    {loan.isSigned ? 'تم التوقيع مسبقاً' : isSelected ? 'معتمد للتوقيع' : !canAffordLoan ? 'رصيد غير كافٍ' : 'طلب وتوقيع القرض'}
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <!-- Emergency Sovereign Mortgages -->
          <div class="space-y-2 pt-2">
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
            {@const isActive = $draftStore.activePoliticalActions.includes(dec.id)}
            {@const costPC = DECREE_PC_COSTS[dec.id] || 0}
            {@const canAfford = isActive || costPC <= $budgetStore.remainingPC}
            <div
              class="p-3 border transition-colors rounded-none {isActive ? 'bg-forest-surface border-wheat-gold shadow-md' : 'bg-charcoal-surface border-charcoal-mid'}"
            >
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-xs font-bold text-wheat-light font-heading leading-tight">{dec.titleAr}</h3>
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
                      رصيد غير كافٍ ({costPC})
                    {:else}
                      تفعيل
                    {/if}
                  </button>
                </div>

                <p class="text-[11px] text-wheat-dark leading-relaxed">{dec.descAr}</p>

                <div class="flex items-center gap-2 pt-1.5 border-t border-charcoal-mid/80 text-[11px]">
                  <span class="text-forest-accent font-medium">{dec.gainAr}</span>
                  <span class="text-charcoal-light">•</span>
                  <span class="text-wheat-gold font-medium">{dec.costAr}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Expatriate Brain-Gain Initiative -->
        <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-bold text-wheat-light block font-heading">حوافز استقطاب الكفاءات والمهاجرين</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] text-wheat-dark">الكلفة:</span>
              <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-$20M</span>
              <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-0.35T ل.س</span>
            </div>
            <span class="text-[10px] text-forest-accent block">الأثر: رفع كفاءة كافة الوزارات التنفيذية (+8%) وزيادة الثقة (+4)</span>
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
              مُفعّل
            {:else if !canAffordBrainGain}
              ميزانية غير كافية
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

  <!-- Footer Information -->
  <div class="border-t border-charcoal-mid pt-2.5 flex items-center justify-between text-[10px] text-wheat-dark">
    <span>غرفة القرارات والوزارات السيادية</span>
    <span class="font-mono text-wheat-mid">دورة التخطيط السداسية</span>
  </div>
</aside>
