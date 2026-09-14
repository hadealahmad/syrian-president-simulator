<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore, previewRangesStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatTrillion(syp: number): string {
    return (syp / 1_000_000_000_000).toFixed(2);
  }

  const DECREE_TITLES_AR: Record<string, string> = {
    ANTI_CORRUPTION_COMMISSION: 'مرسوم إطلاق هيئة النزاهة وتدقيق الأصول',
    PROPERTY_RESTITUTION_PORTAL: 'المنصة الرقمية لرد الملكيات العقارية للاجئين',
    SMUGGLING_BORDER_SWEEP: 'الحملة الوطنية المشتركة لضبط الحدود ومكافحة التهريب',
    TRIBAL_CUSTOMS_COUNCIL: 'ميثاق التفاهم العشائري وتأمين الترانزيت الشرقي',
    CABINET_HEARING: 'جلسة مساءلة حكومية علنية ونشر الذمة المالية',
    UNITY_SPEECH: 'خطاب المصالحة الوطنية والعهد المدني الشامل',
    OPPOSITION_SEATS: 'توسيع التشكيل الحكومي واستيعاب معارضة التكنوقراط',
    MARTIAL_LAW: 'إعلان حالة الطوارئ والأحكام العرفية',
  };

  let deminingGov = $derived(
    $draftStore.deminingPriorityId ? $gameStore.governorates[$draftStore.deminingPriorityId] : null
  );

  let powerGov = $derived(
    $draftStore.powerBoostGovId ? $gameStore.governorates[$draftStore.powerBoostGovId] : null
  );

  let activeProjects = $derived(
    $draftStore.provincialProjects
      .map((projId) => {
        for (const gov of Object.values($gameStore.governorates)) {
          if (gov.strategicProject?.id === projId) {
            return {
              governorateName: gov.nameAr,
              project: gov.strategicProject,
            };
          }
        }
        return null;
      })
      .filter((p): p is { governorateName: string; project: NonNullable<typeof p>['project'] } => p !== null)
  );

  let isOverBudget = $derived(
    $budgetStore.remainingPC < 0 ||
    $budgetStore.remainingUSD < 0 ||
    $budgetStore.remainingSYP < 0
  );

  let hasAnyActions = $derived(
    $draftStore.wageBumpPercent > 0 ||
    $draftStore.foodSubsidyLevel !== 'STANDARD' ||
    $draftStore.workforceStrategy !== 'MAINTAIN' ||
    $draftStore.wheatProcurement !== 'MARKET_PARITY' ||
    $draftStore.dieselSmuggling !== 'STANDARD' ||
    $draftStore.remittanceCaptureSpread !== 15 ||
    $draftStore.corporateTaxRate !== 22 ||
    $draftStore.telecomExciseRate !== 15 ||
    $draftStore.nassibTransitFeeUSD !== 450 ||
    $draftStore.gridCapExUSD !== 35_000_000 ||
    $draftStore.dollarAuctionUSD > 0 ||
    $draftStore.deminingPriorityId !== null ||
    $draftStore.powerBoostGovId !== null ||
    Object.keys($draftStore.oligarchDecisions || {}).length > 0 ||
    $draftStore.propertyRestitution !== 'RESTITUTE_TO_REFUGEES' ||
    ($draftStore.signedLoanIds && $draftStore.signedLoanIds.length > 0) ||
    ($draftStore.executedMortgageIds && $draftStore.executedMortgageIds.length > 0) ||
    $draftStore.expatriateBrainGainIncentive ||
    ($draftStore.provincialProjects && $draftStore.provincialProjects.length > 0) ||
    ($draftStore.activePoliticalActions && $draftStore.activePoliticalActions.length > 0) ||
    $draftStore.southernPolicy !== 'LOCAL_VOUCHERS'
  );

  function handleConfirmEndTurn(): void {
    if (isOverBudget) return;
    gameStore.commitTurn($draftStore);
    draftStore.reset();
    uiStore.setTurnReviewModal(false);
  }

  function handleClose(): void {
    uiStore.setTurnReviewModal(false);
  }
</script>

{#if $uiStore.isTurnReviewModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-deep/90 backdrop-blur-md p-4 select-none font-arabic"
  >
    <div
      class="w-full max-w-2xl bg-forest-deep border border-wheat-mid shadow-2xl p-6 space-y-4 text-wheat-light rounded-none flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div class="border-b border-charcoal-mid pb-3 shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 bg-wheat-gold rounded-none"></span>
            <h2 class="text-base font-bold text-wheat-light font-heading">
              مراجعة وتثبيت القرارات الرئاسية — الدور {String($gameStore.turnNumber).padStart(2, '0')}
            </h2>
          </div>
          <button
            onclick={handleClose}
            class="text-wheat-dark hover:text-wheat-light text-sm px-2 py-1 bg-charcoal-surface hover:bg-forest-surface border border-charcoal-mid rounded-none transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <p class="text-xs text-wheat-dark mt-1">
          يرجى تدقيق القرارات والسياسات المعتمدة أدناه قبل المصادقة النهائية وإحالتها للتنفيذ الميداني.
        </p>

        <!-- Live Budget Remaining Bar -->
        <div class="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-charcoal-mid/80 text-[11px]">
          <div class="p-1.5 bg-charcoal-surface border border-charcoal-mid">
            <span class="text-[10px] text-wheat-dark block">الرصيد السياسي المتبقي:</span>
            <span class="font-bold font-mono text-wheat-gold">{$budgetStore.remainingPC} رصيد سياسي</span>
          </div>
          <div class="p-1.5 bg-charcoal-surface border border-charcoal-mid">
            <span class="text-[10px] text-wheat-dark block">احتياطي النقد المتبقي:</span>
            <span class="font-bold font-mono {$budgetStore.remainingUSD < 0 ? 'text-umber-crimson' : 'text-forest-accent'}">
              ${formatMillionUSD($budgetStore.remainingUSD)}M
            </span>
          </div>
          <div class="p-1.5 bg-charcoal-surface border border-charcoal-mid">
            <span class="text-[10px] text-wheat-dark block">سيولة الخزينة المتبقية:</span>
            <span class="font-bold font-mono {$budgetStore.remainingSYP < 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">
              {formatTrillion($budgetStore.remainingSYP)}T ل.س
            </span>
          </div>
        </div>

        <!-- Budget Deficit Warning Alert -->
        {#if isOverBudget}
          <div class="mt-2 p-2 bg-umber-deep border border-umber-crimson text-umber-crimson text-xs flex items-center justify-between">
            <div class="flex items-center gap-1.5 font-bold">
              <span class="w-2 h-2 bg-umber-crimson"></span>
              <span>تجاوز حدود الميزانية أو الرصيد السياسي! لا يمكن إنهاء الدور دون تعديل القرارات.</span>
            </div>
            <span class="font-mono text-[10px]">عجز سيادي</span>
          </div>
        {/if}
      </div>

      <!-- Turn Forecast Projection Card -->
      <div class="p-3 bg-charcoal-surface border border-charcoal-mid rounded-none shrink-0 space-y-2">
        <span class="text-xs text-wheat-gold font-bold font-heading block">
          توقعات المؤشرات المالية الكبرى للدور القادم:
        </span>
        <div class="grid grid-cols-4 gap-2 text-center text-xs">
          <!-- Deficit -->
          <div class="p-2 bg-forest-mid border border-charcoal-mid rounded-none">
            <span class="text-[10px] text-wheat-dark block mb-0.5">عجز الموازنة</span>
            <span class="font-bold text-wheat-light font-mono">
              {formatTrillion($previewRangesStore.deficitSYP)} تريليون ل.س
            </span>
          </div>

          <!-- Estimated Runway -->
          <div class="p-2 bg-forest-mid border border-charcoal-mid rounded-none">
            <span class="text-[10px] text-wheat-dark block mb-0.5">مدى كفاية الاحتياطي</span>
            <span class="font-bold font-mono {$previewRangesStore.runwayMonthsEstimated <= 6 ? 'text-umber-crimson' : 'text-forest-accent'}">
              {$previewRangesStore.runwayMonthsEstimated} شهراً
            </span>
          </div>

          <!-- Parallel FX Rate Range -->
          <div class="p-2 bg-forest-mid border border-charcoal-mid rounded-none">
            <span class="text-[10px] text-wheat-dark block mb-0.5">سعر الصرف الموازي المرجح</span>
            <span class="font-bold text-wheat-light font-mono">
              {formatNumber($previewRangesStore.fxRateMin)} - {formatNumber($previewRangesStore.fxRateMax)}
            </span>
          </div>

          <!-- Real Civil Service Wage Range -->
          <div class="p-2 bg-forest-mid border border-charcoal-mid rounded-none">
            <span class="text-[10px] text-wheat-dark block mb-0.5">أجر الموظف الحقيقي المتوقع</span>
            <span class="font-bold text-forest-accent font-mono">
              ${$previewRangesStore.realWageMin} - ${$previewRangesStore.realWageMax}
            </span>
          </div>
        </div>
      </div>

      <!-- Decisions List (Scrollable) -->
      <div class="space-y-2.5 overflow-y-auto pr-1 flex-1 text-xs">
        {#if !hasAnyActions}
          <div class="p-4 bg-charcoal-surface border border-charcoal-mid text-center text-wheat-dark">
            لم يتم اتخاذ أي قرارات استثنائية لهذا الدور. سيتم اعتماد السياسات الاعتيادية السابقة وإدارة المرافق دون تعديل.
          </div>
        {/if}

        <!-- 1. Civil Service Wages -->
        {#if $draftStore.wageBumpPercent > 0}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                زيادة رواتب العاملين في الدولة: +{$draftStore.wageBumpPercent}%
              </span>
              <span class="text-[11px] text-wheat-dark">
                الأثر: تعزيز القدرة الشرائية وامتصاص الاحتقان المعيشي، مع زيادة كتلة الرواتب الممولة بالليرة.
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('wageBumpPercent', 0)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 2. Food Subsidies -->
        {#if $draftStore.foodSubsidyLevel !== 'STANDARD'}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                مستوى الدعم التمويني والخبز: {$draftStore.foodSubsidyLevel === 'GENEROUS' ? 'دعم موسع وشامل' : 'ترشيد تقشفي صارم'}
              </span>
              <span class="text-[11px] text-wheat-dark">
                {$draftStore.foodSubsidyLevel === 'GENEROUS' ? 'الأثر: تثبيت أسعار الخبز والسلة الغذائية وضمان الأمن الغذائي لكافة المحافظات.' : 'الأثر: تقليص الإنفاق العام على الدعم بنسبة 50% مع تصاعد مخاطر الاحتقان المعيشي.'}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('foodSubsidyLevel', 'STANDARD')}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 3. Workforce Strategy -->
        {#if $draftStore.workforceStrategy !== 'MAINTAIN'}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                إعادة هيكلة الوظيفة العامة: {$draftStore.workforceStrategy === 'ABSORB_MILITIAS' ? 'استيعاب الفصائل في الجهاز المدني' : 'شطب التوظيف الوهمي وترشيد الملاك'}
              </span>
              <span class="text-[11px] text-wheat-dark">
                {$draftStore.workforceStrategy === 'ABSORB_MILITIAS' ? 'الأثر: خفض التوتر الأمني الفصائلي مقابل زيادة فاتورة الرواتب وتكريس البيروقراطية.' : 'الأثر: تنقية سجلات الرواتب وخفض النفقات بنسبة 25% مع تصاعد التذمر الوظيفي.'}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('workforceStrategy', 'MAINTAIN')}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 4. Wheat Procurement -->
        {#if $draftStore.wheatProcurement !== 'MARKET_PARITY'}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                تسعير شراء القمح المحلي: {$draftStore.wheatProcurement === 'PREMIUM_INCENTIVE' ? 'سعر تشجيعي مجزٍ للمزارعين' : 'شراء إلزامي بأسعار مدعومة منخفضة'}
              </span>
              <span class="text-[11px] text-wheat-dark">
                {$draftStore.wheatProcurement === 'PREMIUM_INCENTIVE' ? 'الأثر: تحفيز تسليم كامل المحصول للدولة وتخفيض فاتورة استيراد القمح بالدولار.' : 'الأثر: خفض نفقات الشراء بالليرة ولكن تسرب المحصول لشبكات التهريب الخارجية.'}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('wheatProcurement', 'MARKET_PARITY')}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 5. Diesel Smuggling -->
        {#if $draftStore.dieselSmuggling !== 'STANDARD'}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                مكافحة تهريب المحروقات: {$draftStore.dieselSmuggling === 'CRACKDOWN' ? 'حملة أمنية صارمة ومصادرة الصهاريج' : 'غض الطرف وتفادي الاحتكاك العشائري'}
              </span>
              <span class="text-[11px] text-wheat-dark">
                {$draftStore.dieselSmuggling === 'CRACKDOWN' ? 'الأثر: الحد من تسرب المازوت ورفع وفر التوليد الكهربائي مقابل استنفار أمني.' : 'الأثر: تهدئة مناطق التهريب الحدودية وتجنب الاشتباك مع شبكات النفوذ.'}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('dieselSmuggling', 'STANDARD')}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 6. Remittance Spread -->
        {#if $draftStore.remittanceCaptureSpread !== 15}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                هامش اقتطاع الحوالات الخارجية: {$draftStore.remittanceCaptureSpread}%
              </span>
              <span class="text-[11px] text-wheat-dark">
                {$draftStore.remittanceCaptureSpread < 15 ? 'الأثر: تشجيع تحويل أموال المغتربين عبر القنوات الرسمية للمصرف المركزي.' : 'الأثر: زيادة عوائد المركزي الدولارية المباشرة مع تنشيط قنوات الصرافة غير الرسمية.'}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('remittanceCaptureSpread', 15)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 7. Corporate Tax -->
        {#if $draftStore.corporateTaxRate !== 22}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                ضريبة أرباح الشركات: {$draftStore.corporateTaxRate}%
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('corporateTaxRate', 22)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 8. Telecom Excise -->
        {#if $draftStore.telecomExciseRate !== 15}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                رسم الإنفاق على الاتصالات: {$draftStore.telecomExciseRate}%
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('telecomExciseRate', 15)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 9. Dollar Auction -->
        {#if $draftStore.dollarAuctionUSD > 0}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                مزاد التدخل الدولاري للمصرف المركزي: ${$draftStore.dollarAuctionUSD / 1_000_000}M
              </span>
              <span class="text-[11px] text-wheat-dark">
                الأثر: ضخ دولارات في السوق الموازي لكبح تدهور سعر صرف الليرة السورية.
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('dollarAuctionUSD', 0)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 10. Demining Priority -->
        {#if deminingGov}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                أولوية نزع الألغام الهندسية: محافظة {deminingGov.nameAr}
              </span>
              <span class="text-[11px] text-wheat-dark">
                الكلفة: $20M + 0.8T ل.س | الأثر: خفض تلوث الألغام بنسبة 8% وتأمين الأراضي الزراعية.
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('deminingPriorityId', null)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 11. Power Boost Priority -->
        {#if powerGov}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                أولوية تعزيز التغذية والكهرباء: محافظة {powerGov.nameAr}
              </span>
              <span class="text-[11px] text-wheat-dark">
                الكلفة: $10M + 0.3T ل.س | الأثر: خفض 4 ساعات ظلام إضافية وتهدئة الاحتقان الإقليمي.
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('powerBoostGovId', null)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- 12. Committed Strategic Provincial Projects -->
        {#each activeProjects as item}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                مشروع استراتيجي [{item.governorateName}]: {item.project.titleAr}
              </span>
              <span class="text-[11px] text-wheat-dark">
                الكلفة: ${item.project.costUSD / 1_000_000}M + {item.project.costSYP / 1_000_000_000_000}T ل.س | {item.project.solutionDescriptionAr}
              </span>
            </div>
            <button
              onclick={() => draftStore.toggleProvincialProject(item.project.id)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/each}

        <!-- 13. Presidential Decrees & Political Actions -->
        {#each $draftStore.activePoliticalActions as actId}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                مرسوم أو قرار سيادي: {DECREE_TITLES_AR[actId] ?? actId}
              </span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction(actId)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/each}
      </div>

      <!-- Footer & Final Action -->
      <div class="border-t border-charcoal-mid pt-3 flex items-center justify-between shrink-0">
        <button
          onclick={handleClose}
          class="px-4 py-2 border border-charcoal-mid text-wheat-dark hover:text-wheat-light bg-forest-mid hover:bg-charcoal-surface text-xs rounded-none transition-colors cursor-pointer"
        >
          مواصلة تعديل القرارات
        </button>
        <button
          disabled={isOverBudget}
          onclick={handleConfirmEndTurn}
          class="px-6 py-2 border text-xs font-bold font-heading rounded-none transition-all duration-200 {isOverBudget ? 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-50' : 'bg-wheat-gold hover:bg-wheat-light text-forest-deep border-wheat-gold shadow-lg cursor-pointer active:translate-y-0.5'}"
        >
          {isOverBudget ? 'ميزانية متجاوزة — تعذر المصادقة' : 'مصادقة نهائية وإنهاء الدور'}
        </button>
      </div>
    </div>
  </div>
{/if}
