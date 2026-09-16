<script lang="ts">
  import { get } from 'svelte/store';
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore, previewRangesStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import TurnResultsView from './TurnResultsView.svelte';
  import {
    getOligarchSettlementIncome,
    getOligarchLiquidationIncome,
    getOligarchSettlementPCCost,
    getOligarchLiquidationPCCost,
    getOligarchNationalizePCEarned,
  } from '../engine/oligarch-helpers';

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatBillionSYP(syp: number): string {
    const val = Number((syp / 1_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  const SOUTHERN_POLICY_NAMES_AR: Record<string, string> = {
    HISTORIC_ACCORD: "الوفاق التاريخي الشامل (وفاق السهل والجبل)",
    LOCAL_VOUCHERS: "قسائم الإغاثة المحلية المشروطة",
    UNCONDITIONAL_AID: "المساعدات الإنسانية المفتوحة",
    BLOCKADE: "الحصار الأمني المشدد وإغلاق المعابر",
  };

  const DECREE_TITLES_AR: Record<string, string> = {
    ANTI_CORRUPTION_COMMISSION: 'مرسوم إطلاق هيئة النزاهة وتدقيق الأصول',
    PROPERTY_RESTITUTION_PORTAL: 'المنصة الرقمية لرد الملكيات العقارية للاجئين',
    SMUGGLING_BORDER_SWEEP: 'الحملة الوطنية المشتركة لضبط الحدود ومكافحة التهريب',
    TRIBAL_CUSTOMS_COUNCIL: 'ميثاق التفاهم العشائري وتأمين الترانزيت الشرقي',
    CABINET_HEARING: 'جلسة مساءلة حكومية علنية ونشر الذمة المالية',
    UNITY_SPEECH: 'خطاب المصالحة الوطنية والعهد المدني الشامل',
    OPPOSITION_SEATS: 'توسيع التشكيل الحكومي واستيعاب معارضة التكنوقراط',
    MARTIAL_LAW: 'إعلان حالة الطوارئ والأحكام العرفية',
    REPUDIATE_IRAN_INFORMAL: 'إعلان بطلان المطالب الإيرانية غير الموثقة ($30B)',
    REPUDIATE_IRAN_FORMAL: 'التنصل من خطوط الائتمان النفطية الإيرانية ($7B)',
    REPUDIATE_RUSSIA: 'التنصل من الديون الروسية الرسمية ($1.5B)',
    REPUDIATE_PARIS: 'التنصل من الديون الثنائية الباريسية ($4.6B)',
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
    $budgetStore.remainingUSD < 0
  );

  let hasAnyActions = $derived(
    $draftStore.wageBumpPercent > 0 ||
    $draftStore.foodSubsidyLevel !== 'STANDARD' ||
    $draftStore.workforceStrategy !== 'MAINTAIN' ||
    $draftStore.wheatProcurement !== 'MARKET_PARITY' ||
    $draftStore.dieselSmuggling !== 'STANDARD' ||
    $draftStore.remittanceCaptureSpread !== 10 ||
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
    $draftStore.populistGrant ||
    $draftStore.charityFundActive ||
    $draftStore.importSurge ||
    (($draftStore.terminatedLoanIds?.length ?? 0) > 0) ||
    ($draftStore.provincialProjects && $draftStore.provincialProjects.length > 0) ||
    ($draftStore.activePoliticalActions && $draftStore.activePoliticalActions.length > 0) ||
    $draftStore.southernPolicy !== 'LOCAL_VOUCHERS'
  );

  function handleConfirmEndTurn(): void {
    if (isOverBudget) return;
    gameStore.commitTurn($draftStore);
    draftStore.advanceToNextTurn();
    // Results swap in place inside this same modal — no close, no move —
    // unless the turn ended the game (FailStateModal takes over instead).
    if (get(gameStore).isGameOver) {
      uiStore.setTurnFlowStage('closed');
    } else {
      uiStore.setTurnFlowStage('results');
    }
  }

  function handleContinueToNewTurn(): void {
    // Events (if any were drawn) take over as the alert modal on top while
    // this modal recedes underneath; otherwise the flow simply closes.
    if (($gameStore.activeEvents?.length ?? 0) > 0) {
      uiStore.setTurnFlowStage('events');
    } else {
      uiStore.setTurnFlowStage('closed');
    }
  }

  function handleClose(): void {
    uiStore.setTurnFlowStage('closed');
  }
</script>

{#if $uiStore.turnFlowStage !== 'closed'}
  <div class="fixed inset-0 z-40 bg-black/25" aria-hidden="true" onclick={handleClose}></div>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none select-none font-arabic"
  >
    <div
      class="pointer-events-auto h-[70vh] aspect-[3/4] max-w-[94vw] bg-forest-deep/95 modal-frame-stripes modal-frame-green shadow-2xl p-6 space-y-4 text-wheat-light rounded-none flex flex-col overflow-hidden transition-all duration-500 ease-out {$uiStore.turnFlowStage === 'events' ? 'scale-[0.93] -translate-x-12 pointer-events-none' : ''}"
      aria-hidden={$uiStore.turnFlowStage === 'events'}
      inert={$uiStore.turnFlowStage === 'events'}
    >
    {#if $uiStore.turnFlowStage === 'review'}
      <!-- Header -->
      <div class="border-b border-charcoal-mid pb-3 shrink-0">
        <div class="flex items-center gap-2">
          <GameIcon name="hourglass" cls="w-5 h-5 shrink-0 text-status-ok" />
          <h2 class="text-base font-bold text-wheat-light font-heading">
            مراجعة وتثبيت القرارات الرئاسية — الدور {String($gameStore.turnNumber).padStart(2, '0')}
          </h2>
        </div>
      </div>

      <!-- Standing automatic deductions (debt collection visibility) -->
      <div class="p-3 bg-charcoal-surface border border-charcoal-mid rounded-none shrink-0 space-y-1.5">
        <span class="text-xs text-wheat-gold font-bold font-heading block">
          استقطاعات تلقائية تُحصّل هذا الدور:
        </span>
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-wheat-dark">خدمة الدين المعترف به</span>
          <span class="font-bold text-wheat-light">${formatMillionUSD($previewRangesStore.debtServiceUSD)}M</span>
        </div>
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-wheat-dark">القسط النفطي الإيراني</span>
          {#if (($gameStore.flags?.Debt_Repudiated_Iran_Formal ?? 0) === 1 || ($draftStore.activePoliticalActions ?? []).includes('REPUDIATE_IRAN_FORMAL'))}
            <span class="font-bold text-forest-accent">مُسقط ✓ ($0.0M)</span>
          {:else}
            <span class="font-bold text-wheat-light">${formatMillionUSD($previewRangesStore.iranOilCouponUSD)}M</span>
          {/if}
        </div>
        {#if ($previewRangesStore.facilityInflowUSD ?? 0) > 0}
          <div class="flex items-center justify-between text-[11px] font-mono">
            <span class="text-forest-accent">تدفق التسهيلات المشروطة المتوقع</span>
            <span class="font-bold text-forest-accent">+${formatMillionUSD($previewRangesStore.facilityInflowUSD)}M</span>
          </div>
          {#each $previewRangesStore.facilityStatusAr ?? [] as line}
            <div class="text-[10px] font-mono text-forest-accent/90 pr-2">· {line}</div>
          {/each}
        {/if}
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-wheat-dark">العجز التشغيلي المتوقع (المقلق)</span>
          <span class="font-bold text-umber-crimson">${formatBillionSYP($previewRangesStore.operatingDeficitSYP ?? 0)}B</span>
        </div>
        <div class="flex items-center justify-between text-[11px] font-mono">
          <span class="text-wheat-dark">الإنفاق الاستثماري (يبني الغد)</span>
          <span class="font-bold text-forest-accent">${formatBillionSYP($previewRangesStore.investmentSYP ?? 0)}B</span>
        </div>
      </div>

      <!-- Action Items Ledger List (Scrollable) -->
      <div class="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1 text-xs">
        {#if !hasAnyActions}
          <div class="p-8 text-center bg-charcoal-surface border border-charcoal-mid rounded-none text-wheat-dark space-y-2">
            <p class="font-heading text-sm text-wheat-light">لم يتم اعتماد أي قرارات أو تعديل في السياسات لهذا الدور</p>
            <p class="text-xs">
              ستسري السياسات الافتراضية والرواتب المعتادة وتستمر الدولة في مسارها التلقائي.
            </p>
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
                الأثر: تعزيز القدرة الشرائية وامتصاص الاحتقان المعيشي، مع زيادة كتلة الرواتب الممولة بـSP.
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
                {$draftStore.wheatProcurement === 'PREMIUM_INCENTIVE' ? 'الأثر: تحفيز تسليم كامل المحصول للدولة وتخفيض فاتورة استيراد القمح بالدولار.' : 'الأثر: خفض نفقات الشراء بـSP ولكن تسرب المحصول لشبكات التهريب الخارجية.'}
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
        {#if $draftStore.remittanceCaptureSpread !== 10}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                هامش اقتطاع الحوالات الخارجية: {$draftStore.remittanceCaptureSpread}%
              </span>
              <span class="text-[11px] text-wheat-dark">
                {$draftStore.remittanceCaptureSpread <= 8 ? 'الأثر: تشجيع تحويل أموال المغتربين عبر القنوات الرسمية للمصرف المركزي (+ثقة).' : ($draftStore.remittanceCaptureSpread <= 15 ? 'الأثر: جباية دولارية اعتيادية متوازنة للمركزي.' : `الأثر: اقتطاع طوارئ قسري يوفر سيولة إنقاذية قصوى للمصرف المركزي (+${Math.round(150 + ($draftStore.remittanceCaptureSpread - 15) * 8.5)}M$) لدرء خطر الإفلاس، مع كلفة على الثقة والصرف.`)}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('remittanceCaptureSpread', 10)}
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

        <!-- All Crossings Transit Fee -->
        {#if $draftStore.nassibTransitFeeUSD !== 450}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                رسوم الترانزيت البري بكافة المعابر الحدودية: ${$draftStore.nassibTransitFeeUSD} / شاحنة
              </span>
              <span class="text-[11px] text-wheat-dark">
                الأثر: تعديل الرسوم المفروضة على الشاحنات الأجنبية بكافة المنافذ والمعابر الحدودية لتعظيم إيراد النقد الأجنبي ($).
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('nassibTransitFeeUSD', 450)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- Grid CapEx -->
        {#if $draftStore.gridCapExUSD !== 35_000_000}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div>
              <span class="font-bold text-wheat-light block font-heading">
                الاستثمار الرأسمالي لشبكة الكهرباء: ${$draftStore.gridCapExUSD / 1_000_000}M
              </span>
              <span class="text-[11px] text-wheat-dark">
                {$draftStore.gridCapExUSD === 0
                  ? 'الأثر: تجميد مخصصات الصيانة يوفر السيولة ($0M كاش)، لكنه يسبب تراجع قدرة الشبكة (-120MW) وتمديد التقنين بالمحافظات.'
                  : 'الأثر: تخصيص ميزانية رأسمالية لتأهيل التوليد والشبكات وتقليص ساعات التقنين بالمحافظات.'}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('gridCapExUSD', 35_000_000)}
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
                الأثر: ضخ دولارات في السوق الموازي لكبح تدهور سعر صرف SP.
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

        <!-- Expatriate Brain-Gain -->
        {#if $draftStore.expatriateBrainGainIncentive}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div class="space-y-1">
              <span class="font-bold text-wheat-light block font-heading">
                حوافز استقطاب الكفاءات والمهاجرين
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-$20M</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-3.50B SP</span>
                <span class="text-[11px] text-forest-accent mr-2">| الأثر: رفع كفاءة الوزارات (+8%) والثقة (+4)</span>
              </div>
            </div>
            <button
              onclick={() => draftStore.setField('expatriateBrainGainIncentive', false)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- Populist Grant -->
        {#if $draftStore.populistGrant}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div class="space-y-1">
              <span class="font-bold text-wheat-light block font-heading">
                منحة شعبية استثنائية (مكافأة نصف سنوية)
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-7.50B SP</span>
                <span class="text-[11px] text-forest-accent mr-2">| الأثر: +8 رصيد سياسي و+2 ثقة وتهدئة الاحتقان (-2)</span>
              </div>
            </div>
            <button
              onclick={() => draftStore.setField('populistGrant', false)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- Charity Fund -->
        {#if $draftStore.charityFundActive}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div class="space-y-1">
              <span class="font-bold text-wheat-light block font-heading">
                صندوق الكرامة السيادي (مستمر دورياً)
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-2.50B SP/دور</span>
                <span class="text-[11px] text-forest-accent mr-2">| الأثر: +3 رصيد سياسي كل دور و+1 ثقة</span>
              </div>
            </div>
            <button
              onclick={() => draftStore.setField('charityFundActive', false)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- Import Surge -->
        {#if $draftStore.importSurge}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div class="space-y-1">
              <span class="font-bold text-wheat-light block font-heading">
                دفعة استيراد إغاثية طارئة (غذاء ووقود)
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-$40M</span>
                <span class="text-[11px] text-forest-accent mr-2">| الأثر: +6 رصيد سياسي و-1 سا تقنين وتهدئة الاحتقان (-2)</span>
              </div>
            </div>
            <button
              onclick={() => draftStore.setField('importSurge', false)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/if}

        <!-- Loan Terminations -->
        {#each ($draftStore.terminatedLoanIds ?? []) as loanId}
          {@const tloan = $gameStore.foreignLoans.find((l) => l.id === loanId)}
          {#if tloan && tloan.isSigned}
            <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
              <div class="space-y-1">
                <span class="font-bold text-wheat-light block font-heading">
                  فسخ سيادي: {tloan.titleAr}
                </span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                  <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-${formatMillionUSD(tloan.remainingPrincipalUSD ?? tloan.disbursementUSD)}M</span>
                  <span class="text-[11px] text-forest-accent mr-2">| الأثر: +6 رصيد سياسي و+4 رافعة سيادية وإطفاء خدمة الدين</span>
                </div>
              </div>
              <button
                onclick={() => draftStore.toggleLoanTermination(loanId)}
                class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          {/if}
        {/each}

        <!-- 10. Demining Priority -->
        {#if deminingGov}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div class="space-y-1">
              <span class="font-bold text-wheat-light block font-heading">
                أولوية نزع الألغام الهندسية: محافظة {deminingGov.nameAr}
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-$20M</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-8.0B SP</span>
                <span class="text-[11px] text-forest-accent mr-2">| الأثر: خفض مساحة الألغام بنسبة 8% من مساحة المحافظة وتأمين الأراضي الزراعية</span>
              </div>
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
            <div class="space-y-1">
              <span class="font-bold text-wheat-light block font-heading">
                أولوية تعزيز التغذية والكهرباء: محافظة {powerGov.nameAr}
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-$10M</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">-3.0B SP</span>
                <span class="text-[11px] text-forest-accent mr-2">| الأثر: خفض 4 ساعات ظلام إضافية وتهدئة الاحتقان الإقليمي</span>
              </div>
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
            <div class="space-y-1">
              <span class="font-bold text-wheat-light block font-heading">
                مشروع استراتيجي [{item.governorateName}]: {item.project.titleAr}
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                  -${item.project.costUSD / 1_000_000}M
                </span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                  -{(item.project.costSYP / 1_000_000_000).toFixed(2)}B SP
                </span>
                {#if item.project.costPoliticalCapital > 0}
                  <span class="px-2 py-0.5 rounded-full bg-forest-surface border border-charcoal-mid text-wheat-gold font-mono font-bold text-[10px]">
                    -{item.project.costPoliticalCapital} رصيد سياسي
                  </span>
                {/if}
                <span class="text-[11px] text-forest-accent mr-2">| {item.project.effectDescriptionAr}</span>
              </div>
            </div>
            <button
              onclick={() => draftStore.toggleProvincialProject(item.project.id)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        {/each}

        <!-- Oligarch Decisions -->
        {#each Object.entries($draftStore.oligarchDecisions || {}) as [assetId, action]}
          {@const asset = $gameStore.confiscatedAssets.find((a) => a.id === assetId)}
          {#if asset && asset.status === 'PENDING'}
            {@const settlementIncomeUSD = getOligarchSettlementIncome(asset.valuationUSD)}
            {@const liquidationIncomeUSD = getOligarchLiquidationIncome(asset.valuationUSD)}
            {@const settlementPCCost = getOligarchSettlementPCCost(asset.valuationUSD)}
            {@const liquidationPCCost = getOligarchLiquidationPCCost(asset.valuationUSD)}
            {@const nationalizePCEarned = getOligarchNationalizePCEarned(asset.valuationUSD)}
            <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
              <div class="space-y-1">
                <span class="font-bold text-wheat-light block font-heading">
                  ثروات الحرب والأوليغارشيا: {asset.titleAr} — {action === 'SETTLEMENT_80_20' ? 'تسوية 80/20' : action === 'NATIONALIZE_SOE' ? 'تأميم حكومي' : 'تصفية خارجية'}
                </span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  {#if action === 'SETTLEMENT_80_20'}
                    <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[10px]">
                      +${formatMillionUSD(settlementIncomeUSD)}M
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                      -{settlementPCCost} رصيد سياسي
                    </span>
                    <span class="text-[11px] text-forest-accent mr-2">| الأثر: استرداد أصول كاش بنسبة 80% وتثبيت الثقة السيادية</span>
                  {:else if action === 'NATIONALIZE_SOE'}
                    <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[10px]">
                      +{nationalizePCEarned} رصيد سياسي
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[10px]">
                      +{(asset.soeVenueSYPPerTurn / 1_000_000_000).toFixed(2)}B SP/دور
                    </span>
                    <span class="text-[11px] text-forest-accent mr-2">| الأثر: ملكية عامة للدولة وتوفير 8000 وظيفة إنتاجية</span>
                  {:else if action === 'FOREIGN_LIQUIDATION'}
                    <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[10px]">
                      +${formatMillionUSD(liquidationIncomeUSD)}M
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                      -{liquidationPCCost} رصيد سياسي
                    </span>
                    <span class="text-[11px] text-umber-crimson mr-2">| الأثر: بيع عاجل بخصم 40% وضخ سيولة أجنبية فورية</span>
                  {/if}
                </div>
              </div>
              <button
                onclick={() => draftStore.removeOligarchDecision(asset.id)}
                class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          {/if}
        {/each}

        <!-- 13. Presidential Decrees & Political Actions -->
        {#each $draftStore.activePoliticalActions as actId}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div class="space-y-0.5">
              <span class="font-bold text-wheat-light block font-heading">
                {DECREE_TITLES_AR[actId] ?? actId}
              </span>
              {#if actId === 'MARTIAL_LAW'}
                <span class="text-[10px] text-amber-300 block font-mono">
                  ● حالة طوارئ مستمرة — تجميد للاحتجاجات وديبَف متواصل (-4% ثقة شعبية كل دور حتى الرفع)
                </span>
              {:else if ['ANTI_CORRUPTION_COMMISSION', 'PROPERTY_RESTITUTION_PORTAL', 'TRIBAL_CUSTOMS_COUNCIL', 'UNITY_SPEECH', 'OPPOSITION_SEATS', 'REPUDIATE_IRAN_INFORMAL', 'REPUDIATE_IRAN_FORMAL', 'REPUDIATE_RUSSIA', 'REPUDIATE_PARIS'].includes(actId)}
                <span class="text-[10px] text-wheat-dark block font-mono">
                  مرسوم سيادي لمرة واحدة (سيصبح نافذاً دائماً بالقانون)
                </span>
              {:else}
                <span class="text-[10px] text-wheat-dark block font-mono">
                  إجراء دوري لهذا الدور
                </span>
              {/if}
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction(actId)}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              {actId === 'MARTIAL_LAW' ? 'إنهاء الطوارئ' : 'إلغاء'}
            </button>
          </div>
        {/each}

        <!-- 14. Southern Policy Directives -->
        {#if $draftStore.southernPolicy && $draftStore.southernPolicy !== 'LOCAL_VOUCHERS'}
          <div class="flex items-center justify-between p-3 bg-charcoal-surface border border-charcoal-mid rounded-none">
            <div class="space-y-0.5">
              <span class="font-bold text-wheat-light block font-heading">
                الجبهة الجنوبية: {SOUTHERN_POLICY_NAMES_AR[$draftStore.southernPolicy] ?? $draftStore.southernPolicy}
              </span>
              <span class="text-[10px] text-wheat-dark block font-mono">
                {$draftStore.southernPolicy === 'HISTORIC_ACCORD'
                  ? 'رعاية وفاق تاريخي بين جبل العرب واللجاة (+18 اندماج، -15 احتمال انفصال)'
                  : $draftStore.southernPolicy === 'BLOCKADE'
                    ? 'إغلاق المعابر والحصار الأمني المشدد (+30% خطر انفصال)'
                    : 'مساعدات إغاثية غير مشروطة (+3 اندماج بحد أقصى، +20 غضب بدو اللجاة)'}
              </span>
            </div>
            <button
              onclick={() => draftStore.setField('southernPolicy', 'LOCAL_VOUCHERS')}
              class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-umber-deep border border-charcoal-mid hover:border-umber-border text-wheat-mid hover:text-umber-crimson transition-colors cursor-pointer"
            >
              إلغاء التوجيه
            </button>
          </div>
        {/if}
      </div>

      <!-- Footer & Final Action -->
      <div class="border-t border-charcoal-mid pt-3 flex items-center gap-3 shrink-0">
        <button
          disabled={isOverBudget}
          onclick={handleConfirmEndTurn}
          class="flex-1 px-6 py-2.5 text-xs font-bold border transition-colors rounded-none flex items-center justify-center gap-2 font-heading {isOverBudget ? 'bg-charcoal-surface border-charcoal-mid text-wheat-dark cursor-not-allowed opacity-60' : 'bg-wheat-gold hover:bg-wheat-light text-forest-deep border-wheat-gold shadow-lg cursor-pointer gloss-hover'}"
        >
          <GameIcon name="check-mark" cls="w-4 h-4 shrink-0" />
          <span>تأكيد المراسيم وإنهاء الدور</span>
        </button>

        <button
          onclick={handleClose}
          class="flex-1 px-4 py-2.5 bg-charcoal-surface hover:bg-forest-mid text-wheat-dark hover:text-wheat-light text-xs rounded-none transition-colors cursor-pointer border border-charcoal-mid hover:border-wheat-mid/60 gloss-hover font-heading text-center"
        >
          مواصلة تعديل القرارات
        </button>
      </div>
    {:else}
      <TurnResultsView onContinue={handleContinueToNewTurn} />
    {/if}
    </div>
  </div>
{/if}
