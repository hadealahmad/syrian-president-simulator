<script lang="ts">
  import { get } from 'svelte/store';
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore, previewRangesStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import TurnResultsView from './TurnResultsView.svelte';
  import { focusTrap } from './actions/focus-trap';
  import { countPendingDraftActions } from './shell/pending-actions';
  import { shellLayout } from './shell/viewport';
  import {
    getOligarchSettlementIncome,
    getOligarchLiquidationIncome,
    getOligarchSettlementPCCost,
    getOligarchLiquidationPCCost,
    getOligarchNationalizePCEarned,
  } from '../engine/oligarch-helpers';
  import { CONCESSIONAL_FACILITIES } from '../engine/constants';

  type ChipTone = 'cost' | 'gain' | 'political' | 'muted';

  interface ReviewChip {
    text: string;
    tone?: ChipTone;
  }

  interface ReviewCard {
    title: string;
    detail?: string;
    note?: string;
    chips?: ReviewChip[];
    cancelLabel?: string;
    onCancel?: () => void;
  }

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatBillionSYP(syp: number): string {
    const val = Number((syp / 1_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  function clampPct(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function chipClass(tone: ChipTone = 'muted'): string {
    if (tone === 'cost') return 'border border-umber-border/60 bg-umber-deep/70 text-umber-crimson';
    if (tone === 'gain') return 'border border-forest-accent/40 bg-forest-mid/60 text-forest-accent';
    if (tone === 'political') return 'border border-wheat-gold/40 bg-wheat-gold/10 text-wheat-gold';
    return 'border border-wheat-mid/20 bg-charcoal-deep/60 text-wheat-mid';
  }

  const SOUTHERN_POLICY_NAMES_AR: Record<string, string> = {
    HISTORIC_ACCORD: "الوفاق التاريخي الشامل (وفاق السهل والجبل)",
    LOCAL_VOUCHERS: "قسائم الإغاثة المحلية المشروطة",
    UNCONDITIONAL_AID: "المساعدات الإنسانية المفتوحة",
    BLOCKADE: "الحصار الأمني المشدد وإغلاق المعابر",
  };

  const GOLAN_STANCE_NAMES_AR: Record<string, string> = {
    RESTRAINT: 'ضبط النفس',
    LOCAL_GENDARMERIE: 'درك محلي',
    DEPLOY_ARMOR: 'نشر الدروع (9.0B SP)',
    UN_LIAISON: 'ارتباط أندوف ($8M)',
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

  let layout = $derived($shellLayout);
  let isPortrait = $derived(layout === 'phone-p');
  let isDesktop = $derived(layout === 'desktop');
  let stage = $derived($uiStore.turnFlowStage);
  let pendingCount = $derived(countPendingDraftActions($draftStore));
  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));

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

  let isOverBudget = $derived($budgetStore.remainingPC < 0 || $budgetStore.remainingUSD < 0);

  // ── Group visibility (same predicates the old flat list rendered) ─────────
  let hasWageGroup = $derived(
    $draftStore.wageBumpPercent > 0 ||
      $draftStore.foodSubsidyLevel !== 'STANDARD' ||
      $draftStore.workforceStrategy !== 'MAINTAIN' ||
      $draftStore.wheatProcurement !== 'MARKET_PARITY' ||
      $draftStore.dieselSmuggling !== 'STANDARD' ||
      $draftStore.remittanceCaptureSpread !== 10
  );
  let hasFiscalGroup = $derived(
    $draftStore.corporateTaxRate !== 22 ||
      $draftStore.telecomExciseRate !== 15 ||
      $draftStore.nassibTransitFeeUSD !== 450 ||
      $draftStore.gridCapExUSD !== 35_000_000 ||
      $draftStore.dollarAuctionUSD > 0
  );
  let hasSocialGroup = $derived(
    !!$draftStore.expatriateBrainGainIncentive ||
      !!$draftStore.populistGrant ||
      !!$draftStore.charityFundActive ||
      !!$draftStore.importSurge
  );
  let hasFinanceGroup = $derived(
    ($draftStore.terminatedLoanIds?.length ?? 0) > 0 ||
      ($draftStore.signedLoanIds?.length ?? 0) > 0 ||
      ($draftStore.executedMortgageIds?.length ?? 0) > 0 ||
      ($draftStore.signedFacilityIds?.length ?? 0) > 0 ||
      ($draftStore.extraDebtRepaymentUSD ?? 0) > 0
  );
  let hasProvinceGroup = $derived(
    $draftStore.golanBorderStance !== 'RESTRAINT' ||
      $draftStore.deminingPriorityId !== null ||
      $draftStore.powerBoostGovId !== null ||
      ($draftStore.provincialProjects?.length ?? 0) > 0
  );
  let hasDecreeGroup = $derived(
    Object.keys($draftStore.oligarchDecisions || {}).length > 0 ||
      ($draftStore.activePoliticalActions?.length ?? 0) > 0 ||
      $draftStore.southernPolicy !== 'LOCAL_VOUCHERS'
  );

  // Identical to the retired flat modal's "any actions" predicate — including
  // propertyRestitution, which has no own row but still counts as a directive.
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
    ($draftStore.signedFacilityIds && $draftStore.signedFacilityIds.length > 0) ||
    ($draftStore.extraDebtRepaymentUSD ?? 0) > 0 ||
    $draftStore.golanBorderStance !== 'RESTRAINT' ||
    $draftStore.expatriateBrainGainIncentive ||
    $draftStore.populistGrant ||
    $draftStore.charityFundActive ||
    $draftStore.importSurge ||
    (($draftStore.terminatedLoanIds?.length ?? 0) > 0) ||
    ($draftStore.provincialProjects && $draftStore.provincialProjects.length > 0) ||
    ($draftStore.activePoliticalActions && $draftStore.activePoliticalActions.length > 0) ||
    $draftStore.southernPolicy !== 'LOCAL_VOUCHERS'
  );

  let pcUsed = $derived(
    clampPct(($budgetStore.committedPC / Math.max(1, $budgetStore.initialPC)) * 100)
  );
  let usdUsed = $derived(
    clampPct(($budgetStore.committedUSD / Math.max(1, $budgetStore.initialUSD)) * 100)
  );
  let sypUsed = $derived(
    clampPct(($budgetStore.committedSYP / Math.max(1, $budgetStore.initialSYP)) * 100)
  );

  function handleConfirmEndTurn(): void {
    if (isOverBudget) return;
    // The fail screen can sit above this modal; never commit another turn
    // from underneath it (keyboard activation used to reach this button).
    if (get(gameStore).isGameOver) return;
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

  function onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && stage === 'review') {
      event.stopPropagation();
      handleClose();
    }
  }

  let cardClass = $derived(
    isPortrait
      ? 'h-full w-full shell-round-sheet-bottom'
      : isDesktop
        ? 'h-[min(86vh,800px)] w-[min(980px,calc(var(--vp-w)-80px))] shell-round-pop'
        : 'h-full w-full max-w-[min(940px,calc(var(--vp-w)-24px))] shell-round-pop'
  );
  let overlayClass = $derived(
    isPortrait
      ? 'items-end pt-[var(--shell-top-h)]'
      : isDesktop
        ? 'items-center justify-center p-6'
        : 'items-center justify-center p-2'
  );
</script>

{#snippet reviewChip(chip: ReviewChip)}
  <span class="shell-round-chip px-1.5 py-0.5 font-mono text-[9.5px] font-bold leading-none {chipClass(chip.tone)}">
    {chip.text}
  </span>
{/snippet}

{#snippet actionCard(item: ReviewCard)}
  <div class="flex items-start gap-2 border border-wheat-mid/12 bg-forest-mid/35 p-2.5 shell-round-item">
    <div class="min-w-0 flex-1 space-y-1">
      <span class="block font-heading text-[12px] font-bold leading-snug text-wheat-light">
        {item.title}
      </span>
      {#if item.detail}
        <span class="block text-[10px] leading-relaxed text-wheat-dark">{item.detail}</span>
      {/if}
      {#if item.note}
        <span class="block font-mono text-[9.5px] leading-snug text-wheat-gold/90">{item.note}</span>
      {/if}
      {#if item.chips && item.chips.length > 0}
        <div class="flex flex-wrap items-center gap-1 pt-0.5">
          {#each item.chips as chip}
            {@render reviewChip(chip)}
          {/each}
        </div>
      {/if}
    </div>
    {#if item.onCancel}
      <button
        type="button"
        onclick={item.onCancel}
        aria-label={`إلغاء: ${item.title}`}
        class="flex min-h-11 shrink-0 items-center justify-center border border-charcoal-mid bg-forest-deep/60 px-2.5 text-[10px] font-bold text-wheat-mid transition-colors hover:border-umber-border hover:bg-umber-deep/60 hover:text-umber-crimson shell-round-item"
      >
        {item.cancelLabel ?? 'إلغاء'}
      </button>
    {/if}
  </div>
{/snippet}

{#snippet groupHeader(title: string, icon: string)}
  <div class="mb-1.5 flex items-center gap-1.5 border-b border-wheat-mid/10 pb-1">
    <GameIcon name={icon} cls="h-3.5 w-3.5 shrink-0 text-wheat-gold/80" />
    <span class="font-heading text-[11px] font-bold text-wheat-gold/90">{title}</span>
  </div>
{/snippet}

{#if stage !== 'closed'}
  <div class="pointer-events-auto fixed inset-0 z-40 bg-black/25" aria-hidden="true" onclick={handleClose}></div>
  <div
    class="pointer-events-none fixed inset-0 z-50 flex select-none font-arabic {overlayClass}"
  >
    <div
      use:focusTrap={{ enabled: stage !== 'events' }}
      role="dialog"
      aria-modal="true"
      aria-label="مراجعة وتثبيت القرارات الرئاسية"
      data-flow-stage={stage}
      onkeydown={onDialogKeydown}
      class="pointer-events-auto flex flex-col overflow-hidden border border-wheat-mid/20 bg-forest-deep text-wheat-light shadow-2xl transition-all duration-500 ease-out {cardClass} {stage ===
      'events'
        ? 'scale-[0.94] pointer-events-none opacity-40'
        : ''}"
      aria-hidden={stage === 'events'}
      inert={stage === 'events'}
      style="background: var(--shell-surface);"
    >
      {#if stage === 'review'}
        <!-- Header -->
        <header class="flex shrink-0 items-start gap-3 border-b border-wheat-mid/10 px-4 pb-3 pt-4">
          <span class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-wheat-gold/30 bg-wheat-gold/10 text-wheat-gold shell-round-item">
            <GameIcon name="hourglass" cls="h-5 w-5 shrink-0" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 text-[8.5px] tracking-[1.6px] text-forest-accent/90">
              <span class="h-px w-3.5 bg-forest-accent/60"></span>
              مراجعة الدور {turnText} · {seasonText} {$gameStore.calendarYear}
            </div>
            <h2 class="mt-0.5 truncate font-heading text-[20px] font-semibold leading-tight text-wheat-light">
              مراجعة وتثبيت القرارات الرئاسية
            </h2>
            <p class="mt-0.5 text-[10px] text-wheat-dark">
              راجع الالتزامات المعلّقة قبل تثبيت الدور نصف السنوي.
            </p>
          </div>
          <span class="hidden shrink-0 items-center gap-1 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-1 text-[9px] font-bold text-wheat-gold sm:flex shell-round-chip">
            <GameIcon name="check-mark" cls="h-3 w-3 shrink-0" />
            {pendingCount} قرار معلّق
          </span>
          <button
            type="button"
            onclick={handleClose}
            class="flex h-11 w-11 shrink-0 items-center justify-center border border-transparent text-wheat-dark transition-colors hover:border-wheat-mid/25 hover:bg-wheat-light/5 hover:text-wheat-light focus-visible:border-wheat-gold shell-round-item"
            aria-label="إغلاق المراجعة والعودة إلى اللوحة"
            title="إغلاق المراجعة"
          >
            <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
          </button>
        </header>

        <!-- Scrollable review body -->
        <div class="scroll-area min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <!-- Standing automatic deductions -->
          <section class="border border-wheat-mid/15 bg-charcoal-deep/50 shell-round-item">
            <div class="flex items-center justify-between gap-2 border-b border-wheat-mid/10 px-3 py-1.5">
              <span class="font-heading text-[11px] font-bold text-wheat-gold">
                استقطاعات تلقائية تُحصّل هذا الدور
              </span>
              <GameIcon name="money-stack" cls="h-3.5 w-3.5 shrink-0 text-wheat-dark" />
            </div>
            <div class="space-y-1 px-3 py-2">
              <div class="flex items-center justify-between gap-2 text-[10.5px]">
                <span class="text-wheat-dark">خدمة الدين المعترف به</span>
                <span dir="ltr" class="font-mono font-bold text-wheat-light">
                  ${formatMillionUSD($previewRangesStore.debtServiceUSD)}M
                </span>
              </div>
              <div class="flex items-center justify-between gap-2 text-[10.5px]">
                <span class="text-wheat-dark">القسط النفطي الإيراني</span>
                {#if (($gameStore.flags?.Debt_Repudiated_Iran_Formal ?? 0) === 1 || ($draftStore.activePoliticalActions ?? []).includes('REPUDIATE_IRAN_FORMAL'))}
                  <span class="font-mono font-bold text-forest-accent">مُسقط ✓ ($0.0M)</span>
                {:else}
                  <span dir="ltr" class="font-mono font-bold text-wheat-light">
                    ${formatMillionUSD($previewRangesStore.iranOilCouponUSD)}M
                  </span>
                {/if}
              </div>
              {#if ($previewRangesStore.facilityInflowUSD ?? 0) > 0}
                <div class="flex items-center justify-between gap-2 text-[10.5px]">
                  <span class="text-forest-accent">تدفق التسهيلات المشروطة المتوقع</span>
                  <span dir="ltr" class="font-mono font-bold text-forest-accent">
                    +${formatMillionUSD($previewRangesStore.facilityInflowUSD)}M
                  </span>
                </div>
                {#each $previewRangesStore.facilityStatusAr ?? [] as line}
                  <div class="font-mono text-[9.5px] text-forest-accent/90">· {line}</div>
                {/each}
              {/if}
              <div class="flex items-center justify-between gap-2 text-[10.5px]">
                <span class="text-wheat-dark">العجز الكلي المتوقع (قبل التمويل)</span>
                <span dir="ltr" class="font-mono font-bold text-umber-crimson">
                  {formatBillionSYP($previewRangesStore.operatingDeficitSYP ?? 0)}B SP
                </span>
              </div>
              <div class="flex items-center justify-between gap-2 text-[10.5px]">
                <span class="text-wheat-dark">الإنفاق الاستثماري (يبني الغد)</span>
                <span dir="ltr" class="font-mono font-bold text-forest-accent">
                  {formatBillionSYP($previewRangesStore.investmentSYP ?? 0)}B SP
                </span>
              </div>
            </div>
          </section>

          <!-- Budget envelope -->
          <section class="border border-wheat-mid/15 bg-forest-mid/25 p-3 shell-round-item">
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="font-heading text-[11px] font-bold text-wheat-gold">مغلّف الموازنة المعلّق</span>
              <span class="text-[8.5px] text-wheat-dark">الملتزم من المتاح</span>
            </div>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <div class="flex items-baseline justify-between gap-2 text-[9px]">
                  <span class="text-wheat-dark">الرصيد السياسي</span>
                  <span dir="ltr" class="font-mono font-bold {$budgetStore.remainingPC < 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">
                    {Math.round($budgetStore.remainingPC)} / {$budgetStore.initialPC}
                  </span>
                </div>
                <div class="mt-1 h-1.5 w-full overflow-hidden bg-charcoal-deep/80 shell-round-chip">
                  <div
                    class="h-full shell-round-chip {$budgetStore.remainingPC < 0 ? 'bg-umber-crimson' : 'bg-wheat-gold'}"
                    style="width: {pcUsed}%"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex items-baseline justify-between gap-2 text-[9px]">
                  <span class="text-wheat-dark">النقد الأجنبي</span>
                  <span dir="ltr" class="font-mono font-bold {$budgetStore.remainingUSD < 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">
                    ${formatMillionUSD($budgetStore.remainingUSD)}M
                  </span>
                </div>
                <div class="mt-1 h-1.5 w-full overflow-hidden bg-charcoal-deep/80 shell-round-chip">
                  <div
                    class="h-full shell-round-chip {$budgetStore.remainingUSD < 0 ? 'bg-umber-crimson' : 'bg-forest-accent'}"
                    style="width: {usdUsed}%"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex items-baseline justify-between gap-2 text-[9px]">
                  <span class="text-wheat-dark">الخزينة بالليرة</span>
                  <span dir="ltr" class="font-mono font-bold {$budgetStore.remainingSYP < 0 ? 'text-wheat-gold' : 'text-wheat-mid'}">
                    {formatBillionSYP($budgetStore.remainingSYP)}B
                  </span>
                </div>
                <div class="mt-1 h-1.5 w-full overflow-hidden bg-charcoal-deep/80 shell-round-chip">
                  <div
                    class="h-full shell-round-chip {$budgetStore.remainingSYP < 0 ? 'bg-wheat-gold' : 'bg-forest-surface'}"
                    style="width: {sypUsed}%"
                  ></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Over-budget block (hard guard stays on the confirm button too) -->
          {#if isOverBudget}
            <section
              role="alert"
              class="border border-umber-border bg-umber-deep/60 p-3 shell-round-item"
            >
              <div class="mb-1 flex items-center gap-1.5 font-heading text-[12px] font-bold text-umber-glow">
                <GameIcon name="barrier" cls="h-4 w-4 shrink-0 text-umber-crimson" />
                تجاوز سقف الموازنة — لا يمكن تثبيت الدور
              </div>
              <p class="text-[10.5px] leading-relaxed text-wheat-light">
                المغلّف المعلّق يتخطى الموارد المتاحة لهذا الدور. عدّل القرارات أو ألغِ بعضها أدناه قبل المصادقة.
              </p>
              <ul class="mt-1.5 space-y-0.5 text-[10px] text-umber-glow">
                {#if $budgetStore.remainingPC < 0}
                  <li>
                    · الرصيد السياسي: تجاوز بمقدار
                    <span dir="ltr" class="font-mono font-bold">{Math.abs(Math.round($budgetStore.remainingPC))}</span>
                    نقطة.
                  </li>
                {/if}
                {#if $budgetStore.remainingUSD < 0}
                  <li>
                    · النقد الأجنبي: تجاوز بمقدار
                    <span dir="ltr" class="font-mono font-bold">${formatMillionUSD(Math.abs($budgetStore.remainingUSD))}M</span>.
                  </li>
                {/if}
              </ul>
            </section>
          {/if}

          {#if !hasAnyActions}
            <div class="border border-wheat-mid/15 bg-forest-mid/25 p-6 text-center shell-round-item">
              <p class="font-heading text-[13px] font-bold text-wheat-light">
                لم يتم اعتماد أي قرارات أو تعديل في السياسات لهذا الدور
              </p>
              <p class="mt-1 text-[10.5px] leading-relaxed text-wheat-dark">
                ستسري السياسات الافتراضية والرواتب المعتادة وتستمر الدولة في مسارها التلقائي.
              </p>
            </div>
          {/if}

          {#if hasWageGroup}
            <section>
              {@render groupHeader('الأجور والدعم والمعيشة', 'meeple-group')}
              <div class="space-y-1.5">
                {#if $draftStore.wageBumpPercent > 0}
                  {@render actionCard({
                    title: `زيادة رواتب العاملين في الدولة: +${$draftStore.wageBumpPercent}%`,
                    detail:
                      'الأثر: تعزيز القدرة الشرائية وامتصاص الاحتقان المعيشي، مع زيادة كتلة الرواتب الممولة بـSP.',
                    onCancel: () => draftStore.setField('wageBumpPercent', 0),
                  })}
                {/if}
                {#if $draftStore.foodSubsidyLevel !== 'STANDARD'}
                  {@render actionCard({
                    title: `مستوى الدعم التمويني والخبز: ${$draftStore.foodSubsidyLevel === 'GENEROUS' ? 'دعم موسع وشامل' : 'ترشيد تقشفي صارم'}`,
                    detail:
                      $draftStore.foodSubsidyLevel === 'GENEROUS'
                        ? 'الأثر: تثبيت أسعار الخبز والسلة الغذائية وضمان الأمن الغذائي لكافة المحافظات.'
                        : 'الأثر: تقليص الإنفاق العام على الدعم بنسبة 50% مع تصاعد مخاطر الاحتقان المعيشي.',
                    onCancel: () => draftStore.setField('foodSubsidyLevel', 'STANDARD'),
                  })}
                {/if}
                {#if $draftStore.workforceStrategy !== 'MAINTAIN'}
                  {@render actionCard({
                    title: `إعادة هيكلة الوظيفة العامة: ${$draftStore.workforceStrategy === 'ABSORB_MILITIAS' ? 'استيعاب الفصائل في الجهاز المدني' : 'شطب التوظيف الوهمي وترشيد الملاك'}`,
                    detail:
                      $draftStore.workforceStrategy === 'ABSORB_MILITIAS'
                        ? 'الأثر: خفض التوتر الأمني الفصائلي مقابل زيادة فاتورة الرواتب وتكريس البيروقراطية.'
                        : 'الأثر: تنقية سجلات الرواتب وخفض النفقات بنسبة 25% مع تصاعد التذمر الوظيفي.',
                    onCancel: () => draftStore.setField('workforceStrategy', 'MAINTAIN'),
                  })}
                {/if}
                {#if $draftStore.wheatProcurement !== 'MARKET_PARITY'}
                  {@render actionCard({
                    title: `تسعير شراء القمح المحلي: ${$draftStore.wheatProcurement === 'PREMIUM_INCENTIVE' ? 'سعر تشجيعي مجزٍ للمزارعين' : 'شراء إلزامي بأسعار مدعومة منخفضة'}`,
                    detail:
                      $draftStore.wheatProcurement === 'PREMIUM_INCENTIVE'
                        ? 'الأثر: تحفيز تسليم كامل المحصول للدولة وتخفيض فاتورة استيراد القمح بالدولار.'
                        : 'الأثر: خفض نفقات الشراء بـSP ولكن تسرب المحصول لشبكات التهريب الخارجية.',
                    onCancel: () => draftStore.setField('wheatProcurement', 'MARKET_PARITY'),
                  })}
                {/if}
                {#if $draftStore.dieselSmuggling !== 'STANDARD'}
                  {@render actionCard({
                    title: `مكافحة تهريب المحروقات: ${$draftStore.dieselSmuggling === 'CRACKDOWN' ? 'حملة أمنية صارمة ومصادرة الصهاريج' : 'غض الطرف وتفادي الاحتكاك العشائري'}`,
                    detail:
                      $draftStore.dieselSmuggling === 'CRACKDOWN'
                        ? 'الأثر: الحد من تسرب المازوت ورفع وفر التوليد الكهربائي مقابل استنفار أمني.'
                        : 'الأثر: تهدئة مناطق التهريب الحدودية وتجنب الاشتباك مع شبكات النفوذ.',
                    onCancel: () => draftStore.setField('dieselSmuggling', 'STANDARD'),
                  })}
                {/if}
                {#if $draftStore.remittanceCaptureSpread !== 10}
                  {@render actionCard({
                    title: `هامش اقتطاع الحوالات الخارجية: ${$draftStore.remittanceCaptureSpread}%`,
                    detail:
                      $draftStore.remittanceCaptureSpread <= 8
                        ? 'الأثر: تشجيع تحويل أموال المغتربين عبر القنوات الرسمية للمصرف المركزي (+ثقة).'
                        : $draftStore.remittanceCaptureSpread <= 15
                          ? 'الأثر: جباية دولارية اعتيادية متوازنة للمركزي.'
                          : `الأثر: اقتطاع طوارئ قسري يوفر سيولة إنقاذية قصوى للمصرف المركزي (+${Math.round(150 + ($draftStore.remittanceCaptureSpread - 15) * 8.5)}M$) لدرء خطر الإفلاس، مع كلفة على الثقة والصرف.`,
                    onCancel: () => draftStore.setField('remittanceCaptureSpread', 10),
                  })}
                {/if}
              </div>
            </section>
          {/if}

          {#if hasFiscalGroup}
            <section>
              {@render groupHeader('الجباية والطاقة والسوق', 'abacus')}
              <div class="space-y-1.5">
                {#if $draftStore.corporateTaxRate !== 22}
                  {@render actionCard({
                    title: `ضريبة أرباح الشركات: ${$draftStore.corporateTaxRate}%`,
                    onCancel: () => draftStore.setField('corporateTaxRate', 22),
                  })}
                {/if}
                {#if $draftStore.telecomExciseRate !== 15}
                  {@render actionCard({
                    title: `رسم الإنفاق على الاتصالات: ${$draftStore.telecomExciseRate}%`,
                    onCancel: () => draftStore.setField('telecomExciseRate', 15),
                  })}
                {/if}
                {#if $draftStore.nassibTransitFeeUSD !== 450}
                  {@render actionCard({
                    title: `رسوم الترانزيت البري بكافة المعابر الحدودية: $${$draftStore.nassibTransitFeeUSD} / شاحنة`,
                    detail:
                      'الأثر: تعديل الرسوم المفروضة على الشاحنات الأجنبية بكافة المنافذ والمعابر الحدودية لتعظيم إيراد النقد الأجنبي ($).',
                    onCancel: () => draftStore.setField('nassibTransitFeeUSD', 450),
                  })}
                {/if}
                {#if $draftStore.gridCapExUSD !== 35_000_000}
                  {@render actionCard({
                    title: `الاستثمار الرأسمالي لشبكة الكهرباء: $${$draftStore.gridCapExUSD / 1_000_000}M`,
                    detail:
                      $draftStore.gridCapExUSD === 0
                        ? 'الأثر: تجميد مخصصات الصيانة يوفر السيولة ($0M كاش)، لكنه يسبب تراجع قدرة الشبكة (-120MW) وتمديد التقنين بالمحافظات.'
                        : 'الأثر: تخصيص ميزانية رأسمالية لتأهيل التوليد والشبكات وتقليص ساعات التقنين بالمحافظات.',
                    onCancel: () => draftStore.setField('gridCapExUSD', 35_000_000),
                  })}
                {/if}
                {#if $draftStore.dollarAuctionUSD > 0}
                  {@render actionCard({
                    title: `مزاد التدخل الدولاري للمصرف المركزي: $${$draftStore.dollarAuctionUSD / 1_000_000}M`,
                    detail: 'الأثر: ضخ دولارات في السوق الموازي لكبح تدهور سعر صرف SP.',
                    onCancel: () => draftStore.setField('dollarAuctionUSD', 0),
                  })}
                {/if}
              </div>
            </section>
          {/if}

          {#if hasSocialGroup}
            <section>
              {@render groupHeader('الحوافز الاجتماعية والاستيراد', 'crowned-heart')}
              <div class="space-y-1.5">
                {#if $draftStore.expatriateBrainGainIncentive}
                  {@render actionCard({
                    title: 'حوافز استقطاب الكفاءات والمهاجرين',
                    chips: [
                      { text: '-$20M', tone: 'cost' },
                      { text: '-3.50B SP', tone: 'cost' },
                      { text: '+8% كفاءة الوزارات', tone: 'gain' },
                      { text: '+4 ثقة', tone: 'gain' },
                    ],
                    onCancel: () => draftStore.setField('expatriateBrainGainIncentive', false),
                  })}
                {/if}
                {#if $draftStore.populistGrant}
                  {@render actionCard({
                    title: 'منحة شعبية استثنائية (مكافأة نصف سنوية)',
                    chips: [
                      { text: '-7.50B SP', tone: 'cost' },
                      { text: '+8 رصيد سياسي', tone: 'political' },
                      { text: '+2 ثقة', tone: 'gain' },
                      { text: '-2 احتقان', tone: 'gain' },
                    ],
                    onCancel: () => draftStore.setField('populistGrant', false),
                  })}
                {/if}
                {#if $draftStore.charityFundActive}
                  {@render actionCard({
                    title: 'صندوق الكرامة السيادي (مستمر دورياً)',
                    chips: [
                      { text: '-2.50B SP/دور', tone: 'cost' },
                      { text: '+3 رصيد سياسي كل دور', tone: 'political' },
                      { text: '+1 ثقة', tone: 'gain' },
                    ],
                    onCancel: () => draftStore.setField('charityFundActive', false),
                  })}
                {/if}
                {#if $draftStore.importSurge}
                  {@render actionCard({
                    title: 'دفعة استيراد إغاثية طارئة (غذاء ووقود)',
                    chips: [
                      { text: '-$40M', tone: 'cost' },
                      { text: '+6 رصيد سياسي', tone: 'political' },
                      { text: '-1 ساعة تقنين', tone: 'gain' },
                      { text: '-2 احتقان', tone: 'gain' },
                    ],
                    onCancel: () => draftStore.setField('importSurge', false),
                  })}
                {/if}
              </div>
            </section>
          {/if}

          {#if hasFinanceGroup}
            <section>
              {@render groupHeader('التمويل والدين', 'scales')}
              <div class="space-y-1.5">
                {#each ($draftStore.terminatedLoanIds ?? []) as loanId}
                  {@const tloan = $gameStore.foreignLoans.find((l) => l.id === loanId)}
                  {#if tloan && tloan.isSigned}
                    {@render actionCard({
                      title: `فسخ سيادي: ${tloan.titleAr}`,
                      chips: [
                        { text: `-$${formatMillionUSD(tloan.remainingPrincipalUSD ?? tloan.disbursementUSD)}M`, tone: 'cost' },
                        { text: '+6 رصيد سياسي', tone: 'political' },
                        { text: '+4 رافعة سيادية', tone: 'gain' },
                        { text: 'إطفاء خدمة الدين', tone: 'gain' },
                      ],
                      onCancel: () => draftStore.toggleLoanTermination(loanId),
                    })}
                  {/if}
                {/each}
                {#each ($draftStore.signedLoanIds ?? []) as loanId}
                  {@const sloan = $gameStore.foreignLoans.find((l) => l.id === loanId)}
                  {#if sloan && !sloan.isSigned}
                    {@render actionCard({
                      title: `توقيع قرض خارجي: ${sloan.titleAr}`,
                      chips: [
                        { text: `+$${formatMillionUSD(sloan.disbursementUSD)}M`, tone: 'gain' },
                        { text: `-${sloan.politicalCapitalCost} رصيد سياسي`, tone: 'political' },
                      ],
                      note: 'يبدأ سداد الفائدة من الدور التالي',
                      onCancel: () => draftStore.toggleLoan(loanId),
                    })}
                  {/if}
                {/each}
                {#each ($draftStore.executedMortgageIds ?? []) as mortgageId}
                  {@const smort = $gameStore.sovereignMortgages?.find((m) => m.id === mortgageId)}
                  {#if smort && !smort.isMortgaged}
                    {@render actionCard({
                      title: `رهن سيادي: ${smort.titleAr}`,
                      chips: [
                        { text: `+$${formatMillionUSD(smort.immediateCashUSD)}M`, tone: 'gain' },
                        { text: `-$${formatMillionUSD(smort.turnRevenueLossUSD)}M/دور`, tone: 'cost' },
                      ],
                      note: smort.sovereigntyPenaltyAr,
                      onCancel: () => draftStore.toggleMortgage(mortgageId),
                    })}
                  {/if}
                {/each}
                {#each ($draftStore.signedFacilityIds ?? []) as facilityId}
                  {@const sdef = CONCESSIONAL_FACILITIES.find((f) => f.id === facilityId)}
                  {#if sdef}
                    {@render actionCard({
                      title: `توقيع تسهيل مشروط: ${sdef.titleAr}`,
                      chips: [
                        ...(sdef.tranches.length > 0
                          ? [{ text: `+$${formatMillionUSD(sdef.tranches[0].amountUSD)}M (الشريحة 1)`, tone: 'gain' as const }]
                          : []),
                        { text: `-${sdef.politicalCapitalCost} رصيد سياسي`, tone: 'political' as const },
                      ],
                      note: `شرط: ${sdef.conditionAr}`,
                      onCancel: () => draftStore.toggleFacility(facilityId),
                    })}
                  {/if}
                {/each}
                {#if ($draftStore.extraDebtRepaymentUSD ?? 0) > 0}
                  {@render actionCard({
                    title: 'سداد مبكر لأصل الدين',
                    chips: [
                      { text: `-$${formatMillionUSD($draftStore.extraDebtRepaymentUSD)}M`, tone: 'cost' },
                      { text: '+2 رافعة سيادية لكل $100M مسددة', tone: 'gain' },
                    ],
                    onCancel: () => draftStore.setField('extraDebtRepaymentUSD', 0),
                  })}
                {/if}
              </div>
            </section>
          {/if}

          {#if hasProvinceGroup}
            <section>
              {@render groupHeader('الحدود والمحافظات', 'castle')}
              <div class="space-y-1.5">
                {#if $draftStore.golanBorderStance !== 'RESTRAINT'}
                  {@render actionCard({
                    title: `موقف حدود الجولان: ${GOLAN_STANCE_NAMES_AR[$draftStore.golanBorderStance] ?? $draftStore.golanBorderStance}`,
                    detail:
                      $draftStore.golanBorderStance === 'DEPLOY_ARMOR'
                        ? 'الأثر: خفض التحدي الدرعاوي والاحتقان المحلي مقابل تصعيد توتر الجولان وكلفة 9.0B SP.'
                        : $draftStore.golanBorderStance === 'UN_LIAISON'
                          ? 'الأثر: خفض توتر الجولان +2 ثقة، بكلفة بعثة $8M/دور.'
                          : 'الأثر: أمن محلي وتحسين تحصيل معبر نصيب مقابل توتر جولان محدود.',
                    onCancel: () => draftStore.setField('golanBorderStance', 'RESTRAINT'),
                  })}
                {/if}
                {#if deminingGov}
                  {@render actionCard({
                    title: `أولوية نزع الألغام الهندسية: محافظة ${deminingGov.nameAr}`,
                    chips: [
                      { text: '-$20M', tone: 'cost' },
                      { text: '-8.0B SP', tone: 'cost' },
                      { text: 'خفض مساحة الألغام 8% وتأمين الأراضي الزراعية', tone: 'gain' },
                    ],
                    onCancel: () => draftStore.setField('deminingPriorityId', null),
                  })}
                {/if}
                {#if powerGov}
                  {@render actionCard({
                    title: `أولوية تعزيز التغذية والكهرباء: محافظة ${powerGov.nameAr}`,
                    chips: [
                      { text: '-$10M', tone: 'cost' },
                      { text: '-3.0B SP', tone: 'cost' },
                      { text: 'خفض 4 ساعات ظلام إضافية', tone: 'gain' },
                    ],
                    onCancel: () => draftStore.setField('powerBoostGovId', null),
                  })}
                {/if}
                {#each activeProjects as item}
                  {@render actionCard({
                    title: `مشروع استراتيجي [${item.governorateName}]: ${item.project.titleAr}`,
                    chips: [
                      { text: `-$${item.project.costUSD / 1_000_000}M`, tone: 'cost' },
                      { text: `-${(item.project.costSYP / 1_000_000_000).toFixed(2)}B SP`, tone: 'cost' },
                      ...(item.project.costPoliticalCapital > 0
                        ? [{ text: `-${item.project.costPoliticalCapital} رصيد سياسي`, tone: 'political' as const }]
                        : []),
                    ],
                    note: item.project.effectDescriptionAr,
                    onCancel: () => draftStore.toggleProvincialProject(item.project.id),
                  })}
                {/each}
              </div>
            </section>
          {/if}

          {#if hasDecreeGroup}
            <section>
              {@render groupHeader('ثروات الحرب والمراسيم والجبهة الجنوبية', 'scroll-quill')}
              <div class="space-y-1.5">
                {#each Object.entries($draftStore.oligarchDecisions || {}) as [assetId, action]}
                  {@const asset = $gameStore.confiscatedAssets.find((a) => a.id === assetId)}
                  {#if asset && asset.status === 'PENDING'}
                    {@const settlementIncomeUSD = getOligarchSettlementIncome(asset.valuationUSD)}
                    {@const liquidationIncomeUSD = getOligarchLiquidationIncome(asset.valuationUSD)}
                    {@const settlementPCCost = getOligarchSettlementPCCost(asset.valuationUSD)}
                    {@const liquidationPCCost = getOligarchLiquidationPCCost(asset.valuationUSD)}
                    {@const nationalizePCEarned = getOligarchNationalizePCEarned(asset.valuationUSD)}
                    {@render actionCard({
                      title: `ثروات الحرب والأوليغارشيا: ${asset.titleAr} — ${action === 'SETTLEMENT_80_20' ? 'تسوية 80/20' : action === 'NATIONALIZE_SOE' ? 'تأميم حكومي' : 'تصفية خارجية'}`,
                      chips:
                        action === 'SETTLEMENT_80_20'
                          ? [
                              { text: `+$${formatMillionUSD(settlementIncomeUSD)}M`, tone: 'gain' as const },
                              { text: `-${settlementPCCost} رصيد سياسي`, tone: 'political' as const },
                              { text: 'استرداد أصول كاش بنسبة 80% وتثبيت الثقة السيادية', tone: 'muted' as const },
                            ]
                          : action === 'NATIONALIZE_SOE'
                            ? [
                                { text: `+${nationalizePCEarned} رصيد سياسي`, tone: 'political' as const },
                                { text: `+${(asset.soeVenueSYPPerTurn / 1_000_000_000).toFixed(2)}B SP/دور`, tone: 'gain' as const },
                                { text: 'ملكية عامة للدولة وتوفير 8000 وظيفة إنتاجية', tone: 'muted' as const },
                              ]
                            : [
                                { text: `+$${formatMillionUSD(liquidationIncomeUSD)}M`, tone: 'gain' as const },
                                { text: `-${liquidationPCCost} رصيد سياسي`, tone: 'political' as const },
                                { text: 'بيع عاجل بخصم 40% وضخ سيولة أجنبية فورية', tone: 'cost' as const },
                              ],
                      onCancel: () => draftStore.removeOligarchDecision(asset.id),
                    })}
                  {/if}
                {/each}
                {#each $draftStore.activePoliticalActions as actId}
                  {@render actionCard({
                    title: DECREE_TITLES_AR[actId] ?? actId,
                    note:
                      actId === 'MARTIAL_LAW'
                        ? '● حالة طوارئ مستمرة — تجميد للاحتجاجات وديبَف متواصل (-4% ثقة شعبية كل دور حتى الرفع)'
                        : ['ANTI_CORRUPTION_COMMISSION', 'PROPERTY_RESTITUTION_PORTAL', 'TRIBAL_CUSTOMS_COUNCIL', 'UNITY_SPEECH', 'OPPOSITION_SEATS', 'REPUDIATE_IRAN_INFORMAL', 'REPUDIATE_IRAN_FORMAL', 'REPUDIATE_RUSSIA', 'REPUDIATE_PARIS'].includes(actId)
                          ? 'مرسوم سيادي لمرة واحدة (سيصبح نافذاً دائماً بالقانون)'
                          : 'إجراء دوري لهذا الدور',
                    cancelLabel: actId === 'MARTIAL_LAW' ? 'إنهاء الطوارئ' : 'إلغاء',
                    onCancel: () => draftStore.togglePoliticalAction(actId),
                  })}
                {/each}
                {#if $draftStore.southernPolicy && $draftStore.southernPolicy !== 'LOCAL_VOUCHERS'}
                  {@render actionCard({
                    title: `الجبهة الجنوبية: ${SOUTHERN_POLICY_NAMES_AR[$draftStore.southernPolicy] ?? $draftStore.southernPolicy}`,
                    detail:
                      $draftStore.southernPolicy === 'HISTORIC_ACCORD'
                        ? 'رعاية وفاق تاريخي بين جبل العرب واللجاة (+18 اندماج، -15 احتمال انفصال)'
                        : $draftStore.southernPolicy === 'BLOCKADE'
                          ? 'إغلاق المعابر والحصار الأمني المشدد (+30% خطر انفصال)'
                          : 'مساعدات إغاثية غير مشروطة (+3 اندماج بحد أقصى، +20 غضب بدو اللجاة)',
                    cancelLabel: 'إلغاء التوجيه',
                    onCancel: () => draftStore.setField('southernPolicy', 'LOCAL_VOUCHERS'),
                  })}
                {/if}
              </div>
            </section>
          {/if}
        </div>

        <!-- Footer & final action -->
        <footer class="flex shrink-0 flex-row gap-2 border-t border-wheat-mid/10 px-4 py-3 phone-p:flex-col">
          <button
            type="button"
            disabled={isOverBudget}
            onclick={handleConfirmEndTurn}
            class="flex min-h-11 flex-1 items-center justify-center gap-2 border px-4 py-2.5 text-[12px] font-bold transition-colors shell-round-item {isOverBudget
              ? 'cursor-not-allowed border-charcoal-mid bg-charcoal-surface text-wheat-dark opacity-60'
              : 'cursor-pointer border-wheat-gold bg-wheat-gold text-forest-deep shadow-lg hover:bg-wheat-light'}"
          >
            <GameIcon name="check-mark" cls="h-4 w-4 shrink-0" />
            <span>تأكيد المراسيم وإنهاء الدور</span>
          </button>
          <button
            type="button"
            onclick={handleClose}
            class="flex min-h-11 flex-1 items-center justify-center border border-charcoal-mid bg-charcoal-surface px-4 py-2.5 text-[11px] font-bold text-wheat-mid transition-colors hover:border-wheat-mid/60 hover:text-wheat-light shell-round-item"
          >
            مواصلة تعديل القرارات
          </button>
        </footer>
      {:else}
        <TurnResultsView onContinue={handleContinueToNewTurn} />
      {/if}
    </div>
  </div>
{/if}
