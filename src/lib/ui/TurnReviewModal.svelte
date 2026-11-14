<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore, previewRangesStore, projectedTurnStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import GroupDivider from './kit/GroupDivider.svelte';
  import TurnResultsView from './TurnResultsView.svelte';
  import { focusTrap } from './actions/focus-trap';
  import { panelFocus } from './flow/panel-focus';
  import KbdHint from './flow/KbdHint.svelte';
  import { hasModifierKey, isTypingTarget } from './flow/kbd';
  import './flow/flow-desktop.css';
  import { shellLayout } from './shell/viewport';
  import { fx } from './fx/feedback';
  import {
    buildReviewGroups,
    formatBillionSYP,
    formatMillionUSD,
    type ReviewTrayItem,
    type ReviewValueTone,
  } from './flow/review-items';
  import { tourActive } from './guide-tour';

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');
  let isLandscape = $derived(layout === 'phone-l');
  let isSidePanel = $derived(isDesktop || isLandscape);
  let stage = $derived($uiStore.turnFlowStage);
  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));
  let deductionsOpen = $state(false);
  let resultsIsTransition = $state(true);
  let suppressFocusRestore = false;

  $effect(() => {
    if (stage === 'results') {
      resultsIsTransition = true;
    } else if (stage === 'closed') {
      suppressFocusRestore = false;
    }
  });

  let reviewGroups = $derived(buildReviewGroups($gameStore, $draftStore));
  let pendingCount = $derived(reviewGroups.reduce((sum, g) => sum + g.items.length, 0));
  let hasAnyActions = $derived(pendingCount > 0);
  let showQuietNextBlock = $derived(pendingCount <= 3);
  let isOverBudget = $derived($budgetStore.remainingPC < 0 || $budgetStore.remainingUSD < 0);

  let initialPC = $derived(Math.round($budgetStore.initialPC));
  let afterPC = $derived(Math.round($budgetStore.remainingPC));
  let initialUSD = $derived($gameStore.macro.reservesUSD);
  let afterUSD = $derived($budgetStore.remainingUSD);
  let initialTreasury = $derived($projectedTurnStore.treasurySYP.current);
  let afterTreasury = $derived($projectedTurnStore.treasurySYP.projected);

  let iranCouponRepudiated = $derived(
    ($gameStore.flags?.Debt_Repudiated_Iran_Formal ?? 0) === 1 ||
      ($draftStore.activePoliticalActions ?? []).includes('REPUDIATE_IRAN_FORMAL')
  );
  let activeIranCouponUSD = $derived(iranCouponRepudiated ? 0 : ($previewRangesStore.iranOilCouponUSD ?? 0));
  let netAutomaticUSD = $derived(
    ($previewRangesStore.facilityInflowUSD ?? 0) -
      ($previewRangesStore.debtServiceUSD ?? 0) -
      activeIranCouponUSD
  );
  let operatingDeficitSYP = $derived($previewRangesStore.operatingDeficitSYP ?? 0);

  let pcTone = $derived(
    afterPC < 0
      ? 'text-[var(--c-neg)]'
      : afterPC === initialPC
        ? 'text-[var(--c-text)]'
        : afterPC > initialPC
          ? 'text-[var(--c-pos)]'
          : 'text-[var(--c-accent)]'
  );

  let usdTone = $derived.by(() => {
    if (afterUSD < 0) return 'text-[var(--c-neg)]';
    const diff = afterUSD - initialUSD;
    if (Math.abs(diff) < 50_000) return 'text-[var(--c-text)]';
    return diff > 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]';
  });

  let treasuryTone = $derived.by(() => {
    if (afterTreasury < 0) return 'text-[var(--c-neg)]';
    const diff = afterTreasury - initialTreasury;
    if (Math.abs(diff) < 5_000_000) return 'text-[var(--c-text)]';
    return diff > 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]';
  });

  function costToneClass(tone: ReviewValueTone = 'muted'): string {
    if (tone === 'pos') return 'text-[var(--c-pos)]';
    if (tone === 'neg') return 'text-[var(--c-neg)]';
    if (tone === 'accent') return 'text-[var(--c-accent)]';
    return 'text-[var(--c-muted)]';
  }

  function handleConfirmEndTurn(): void {
    if (isOverBudget) {
      fx('error');
      return;
    }
    if (get(gameStore).isGameOver) return;
    suppressFocusRestore = true;
    fx('endTurn');
    gameStore.commitTurn($draftStore);
    draftStore.advanceToNextTurn();
    if (get(gameStore).isGameOver) {
      uiStore.setTurnFlowStage('closed');
    } else {
      uiStore.setTurnFlowStage('results');
    }
  }

  function handleContinueToNewTurn(): void {
    if (($gameStore.activeEvents?.length ?? 0) > 0) {
      uiStore.setTurnFlowStage('events');
    } else {
      uiStore.setTurnFlowStage('closed');
    }
  }

  function handleClose(): void {
    suppressFocusRestore = false;
    fx('cancel');
    uiStore.setTurnFlowStage('closed');
  }

  function handleJump(item: ReviewTrayItem): void {
    suppressFocusRestore = true;
    fx('tap');
    item.onJump();
  }

  function handleCancelItem(item: ReviewTrayItem): void {
    fx('cancel');
    item.onCancel();
  }

  function onDialogKeydown(event: KeyboardEvent): void {
    if (stage !== 'review' && stage !== 'results') return;
    if (event.key !== 'Tab') {
      event.stopPropagation();
    }
    if (hasModifierKey(event) || isTypingTarget(event.target)) return;
    if (event.key === 'Escape' && stage === 'review') {
      event.preventDefault();
      event.stopImmediatePropagation();
      handleClose();
    }
  }

  onMount(() => {
    const onCaptureKey = (event: KeyboardEvent): void => {
      if (stage !== 'review' && stage !== 'results') return;
      if ($uiStore.isSettingsOpen || $uiStore.isAboutOpen || $uiStore.isRestartModalOpen || $tourActive) {
        return;
      }
      if (stage === 'review' && event.key === 'Escape') {
        if (hasModifierKey(event) || isTypingTarget(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleClose();
      } else if (stage === 'results' && event.key !== 'Tab') {
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  });

  let dialogStyle = $derived.by(() => {
    if (stage !== 'review') return '';
    if (isDesktop) {
      return 'inset-block-start: var(--shell-top-h); inset-block-end: 0; inset-inline-end: 0; width: min(var(--shell-dock-w-wide, clamp(460px, 32vw, 640px)), calc(100vw - var(--shell-rail-w, 92px)));';
    }
    if (isLandscape) {
      return 'inset-block: 0; inset-inline-end: 0; width: min(500px, calc(100vw - var(--shell-rail-w, 72px)));';
    }
    return '';
  });
</script>

{#if stage === 'review' || stage === 'results'}
  {#if stage === 'results'}
    <!-- Solid flat backdrop so map and AlertsStack never bleed or flash between stages -->
    <div
      class="pointer-events-auto fixed inset-0 z-40 bg-[var(--c-bg)]"
      aria-hidden="true"
    ></div>
  {:else if isLandscape}
    <button
      type="button"
      tabindex="-1"
      aria-label="إغلاق المراجعة"
      onclick={handleClose}
      class="pointer-events-auto fixed inset-0 z-40 bg-[var(--c-bg)]/75"
    ></button>
  {/if}

  <div
    class="pointer-events-none fixed inset-0 z-50 flex select-none font-arabic {isDesktop ? 'flow-desktop' : ''} {stage === 'review' && isSidePanel
      ? ''
      : stage === 'results' && resultsIsTransition
        ? 'items-stretch justify-stretch p-0'
        : isDesktop
          ? 'items-center justify-center p-6'
          : 'items-stretch justify-stretch p-0'}"
  >
    <div
      use:focusTrap={{ enabled: stage === 'results' || !isDesktop }}
      use:panelFocus={{
        enabled: isDesktop && stage === 'review',
        shouldRestore: () => !suppressFocusRestore,
      }}
      role="dialog"
      tabindex="-1"
      aria-modal={stage === 'results' || !isDesktop ? 'true' : undefined}
      aria-label={stage === 'review' ? 'قرارات هذا الدور' : 'نتائج الدور'}
      data-flow-stage={stage}
      onkeydown={onDialogKeydown}
      class="pointer-events-auto flex flex-col overflow-hidden bg-[var(--c-bg)] text-[var(--c-text)] {stage === 'review' && isSidePanel
        ? 'fixed border-s border-[var(--c-line-strong)] shell-enter-side ' + (isLandscape ? 'border-t-2 border-t-[var(--c-accent)]' : '')
        : stage === 'results' && resultsIsTransition
          ? 'h-full w-full'
          : isDesktop
            ? 'h-[min(86dvh,840px)] max-h-[calc(100dvh-48px)] w-[min(var(--flow-stage-w),calc(100vw-48px))] border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] modal-enter'
            : 'h-full w-full border-t-2 border-t-[var(--c-accent)] pt-[env(safe-area-inset-top)] modal-enter'}"
      style={dialogStyle}
    >
      {#if stage === 'review'}
        <!-- Header -->
        <header class="flow-tray-head flex shrink-0 items-center justify-between gap-2 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-2.5 phone-l:py-1.5">
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-heading font-bold leading-[1.35] text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[16px]'}">
              قرارات هذا الدور · <span class="num text-[var(--c-accent)]">{pendingCount}</span>
            </h2>
            <div class="font-medium text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">
              الدور <span class="num">{turnText}</span> · {seasonText} <span class="num">{$gameStore.calendarYear}</span>
            </div>
          </div>
          <button
            type="button"
            onclick={handleClose}
            class="pressable flex h-11 w-11 shrink-0 items-center justify-center border border-transparent text-[var(--c-muted)] transition-colors hover:border-[var(--c-line)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            aria-label="إغلاق المراجعة والعودة إلى اللوحة"
            title="عودة (Esc)"
          >
            <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
          </button>
        </header>

        <!-- Pinned ruled 3-row budget ledger (stays fixed at the top while scrolling items) -->
        <section
          aria-label="ملخص الموازنة"
          class="flow-tray-ledger shrink-0 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-3.5 py-2.5 phone-l:py-1.5"
        >
          <table class="w-full table-fixed border-collapse {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}">
            <thead>
              <tr>
                <th class="px-2 pb-1 text-start font-normal text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">البند</th>
                <th class="w-[104px] px-2 pb-1 text-right font-normal text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">الآن</th>
                <th class="w-[112px] px-2 pb-1 text-right font-normal text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">بعد الدور</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="flow-ledger-cell border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 font-medium text-[var(--c-text)] phone-l:py-1">
                  الرصيد السياسي
                </td>
                <td dir="ltr" class="flow-ledger-cell num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold text-[var(--c-text)] phone-l:py-1 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'}">
                  {initialPC}
                </td>
                <td dir="ltr" class="flow-ledger-cell num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold phone-l:py-1 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'} {pcTone}">
                  {afterPC}
                </td>
              </tr>
              <tr>
                <td class="flow-ledger-cell border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 font-medium text-[var(--c-text)] phone-l:py-1">
                  النقد الأجنبي
                </td>
                <td dir="ltr" class="flow-ledger-cell num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold text-[var(--c-text)] phone-l:py-1 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'}">
                  ${formatMillionUSD(initialUSD)}M
                </td>
                <td dir="ltr" class="flow-ledger-cell num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold phone-l:py-1 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'} {usdTone}">
                  ${formatMillionUSD(afterUSD)}M
                </td>
              </tr>
              <tr>
                <td class="flow-ledger-cell border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 font-medium text-[var(--c-text)] phone-l:py-1">
                  الخزينة
                </td>
                <td dir="ltr" class="flow-ledger-cell num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold text-[var(--c-text)] phone-l:py-1 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'}">
                  {formatBillionSYP(initialTreasury)}B
                </td>
                <td dir="ltr" class="flow-ledger-cell num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold phone-l:py-1 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'} {treasuryTone}">
                  {formatBillionSYP(afterTreasury)}B
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Scrollable tray body -->
        <div class="scroll-area min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-2.5 phone-l:space-y-2 phone-l:py-2">
          <!-- Empty state or grouped queued decisions -->
          {#if !hasAnyActions}
            <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-3 text-start">
              <p class="font-medium leading-[1.55] text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}">
                لا توجد قرارات معدّلة — ستسري السياسات الافتراضية لهذا الدور.
              </p>
            </div>
          {:else}
            {#each reviewGroups as group (group.id)}
              <section aria-label={group.labelAr}>
                <div class="sticky top-0 z-10 -mx-0.5 bg-[var(--c-bg)] px-0.5 py-1">
                  <GroupDivider label={group.labelAr} count={group.items.length} tone="accent" class="!mt-0" />
                </div>
                <div class="mt-1 space-y-1">
                  {#each group.items as item (item.id)}
                    <div class="flex items-center gap-2 border border-[var(--c-line)] bg-[var(--c-panel)] ps-2.5 pe-1 py-1">
                      <button
                        type="button"
                        onclick={() => handleJump(item)}
                        title={`الانتقال إلى ${group.labelAr}`}
                        class="pressable flex min-h-11 min-w-0 flex-1 flex-col justify-center py-1 text-start transition-colors hover:text-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                      >
                        <span class="line-clamp-2 whitespace-normal font-medium leading-[1.45] text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}">
                          {item.title}
                        </span>
                        {#if item.note}
                          <span class="mt-0.5 line-clamp-1 text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">{item.note}</span>
                        {/if}
                      </button>
                      {#if item.costText}
                        <b dir="ltr" class="num min-w-[78px] shrink-0 whitespace-nowrap text-right font-bold {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12px]'} {costToneClass(item.costTone)}">
                          {item.costText}
                        </b>
                      {/if}
                      <button
                        type="button"
                        onclick={() => handleCancelItem(item)}
                        aria-label={`${item.cancelLabel ?? 'إلغاء'}: ${item.title}`}
                        title={item.cancelLabel ?? 'إلغاء'}
                        class="pressable flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center border border-transparent bg-transparent text-[var(--c-muted)] transition-colors hover:border-[var(--c-neg)] hover:bg-[var(--c-ev-bg)] hover:text-[var(--c-neg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                      >
                        <GameIcon name="cross-mark" cls="h-3.5 w-3.5 shrink-0" />
                      </button>
                    </div>
                  {/each}
                </div>
              </section>
            {/each}
          {/if}

          <!-- When <=3 items, show a quiet ruled "what happens next" block built only from existing modal data;
               with >3 items, keep it compact as a single collapsible row. -->
          {#if showQuietNextBlock}
            <section class="space-y-1.5 pt-1" aria-label="ما سيحدث عند إغلاق الدور">
              <GroupDivider label="ما سيحدث عند إغلاق الدور" />
              <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-strip)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                <div class="flex items-center justify-between gap-2 px-3 py-2">
                  <span class="text-[var(--c-muted)]">الاستقطاعات والتدفقات التلقائية (دولار)</span>
                  <span dir="ltr" class="num shrink-0 whitespace-nowrap font-bold {netAutomaticUSD >= 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-text)]'}">
                    {netAutomaticUSD >= 0 ? '+' : '-'}${formatMillionUSD(Math.abs(netAutomaticUSD))}M
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span class="text-[var(--c-muted)]">خدمة الدين المعترف به</span>
                  <span dir="ltr" class="num shrink-0 whitespace-nowrap font-bold text-[var(--c-text)]">
                    ${formatMillionUSD($previewRangesStore.debtServiceUSD)}M
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span class="text-[var(--c-muted)]">القسط النفطي الإيراني</span>
                  {#if iranCouponRepudiated}
                    <span class="shrink-0 whitespace-nowrap font-bold text-[var(--c-pos)]">مُسقط ($0.0M)</span>
                  {:else}
                    <span dir="ltr" class="num shrink-0 whitespace-nowrap font-bold text-[var(--c-text)]">
                      ${formatMillionUSD($previewRangesStore.iranOilCouponUSD)}M
                    </span>
                  {/if}
                </div>
                {#if ($previewRangesStore.facilityInflowUSD ?? 0) > 0}
                  <div class="px-3 py-1.5">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[var(--c-pos)]">تدفق التسهيلات المشروطة</span>
                      <span dir="ltr" class="num shrink-0 whitespace-nowrap font-bold text-[var(--c-pos)]">
                        +${formatMillionUSD($previewRangesStore.facilityInflowUSD)}M
                      </span>
                    </div>
                    {#each $previewRangesStore.facilityStatusAr ?? [] as line}
                      <div class="mt-0.5 text-[11px] text-[var(--c-pos)]">· {line}</div>
                    {/each}
                  </div>
                {/if}
                <div class="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span class="text-[var(--c-muted)]">العجز التشغيلي (قبل التمويل)</span>
                  <span dir="ltr" class="num shrink-0 whitespace-nowrap font-bold text-[var(--c-neg)]">
                    {formatBillionSYP(operatingDeficitSYP)}B
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span class="text-[var(--c-muted)]">الإنفاق الاستثماري</span>
                  <span dir="ltr" class="num shrink-0 whitespace-nowrap font-bold text-[var(--c-pos)]">
                    {formatBillionSYP($previewRangesStore.investmentSYP ?? 0)}B
                  </span>
                </div>
              </div>
            </section>
          {:else}
            <section class="border border-[var(--c-line)] bg-[var(--c-panel)]">
              <button
                type="button"
                onclick={() => {
                  fx('tap');
                  deductionsOpen = !deductionsOpen;
                }}
                aria-expanded={deductionsOpen}
                class="pressable flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                <span class="min-w-0 font-heading font-bold text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                  استقطاعات تلقائية
                </span>
                <span class="flex shrink-0 items-center gap-2">
                  <span dir="ltr" class="num font-bold text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11.5px]'}">
                    {netAutomaticUSD >= 0 ? '+' : '-'}${formatMillionUSD(Math.abs(netAutomaticUSD))}M · {formatBillionSYP(operatingDeficitSYP)}B
                  </span>
                  <span class="text-[11px] font-bold text-[var(--c-muted)]" aria-hidden="true">
                    {deductionsOpen ? '▲' : '▼'}
                  </span>
                </span>
              </button>
              {#if deductionsOpen}
                <div class="divide-y divide-[var(--c-line)] border-t border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-1">
                  <div class="flex items-center justify-between gap-2 py-1.5 {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                    <span class="text-[var(--c-muted)]">خدمة الدين المعترف به</span>
                    <span dir="ltr" class="num font-bold text-[var(--c-text)]">
                      ${formatMillionUSD($previewRangesStore.debtServiceUSD)}M
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-2 py-1.5 {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                    <span class="text-[var(--c-muted)]">القسط النفطي الإيراني</span>
                    {#if iranCouponRepudiated}
                      <span class="font-bold text-[var(--c-pos)]">مُسقط ($0.0M)</span>
                    {:else}
                      <span dir="ltr" class="num font-bold text-[var(--c-text)]">
                        ${formatMillionUSD($previewRangesStore.iranOilCouponUSD)}M
                      </span>
                    {/if}
                  </div>
                  {#if ($previewRangesStore.facilityInflowUSD ?? 0) > 0}
                    <div class="py-1.5">
                      <div class="flex items-center justify-between gap-2 {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                        <span class="text-[var(--c-pos)]">تدفق التسهيلات المشروطة المتوقع</span>
                        <span dir="ltr" class="num font-bold text-[var(--c-pos)]">
                          +${formatMillionUSD($previewRangesStore.facilityInflowUSD)}M
                        </span>
                      </div>
                      {#each $previewRangesStore.facilityStatusAr ?? [] as line}
                        <div class="mt-0.5 text-[11px] text-[var(--c-pos)]">· {line}</div>
                      {/each}
                    </div>
                  {/if}
                  <div class="flex items-center justify-between gap-2 py-1.5 {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                    <span class="text-[var(--c-muted)]">العجز الكلي المتوقع (قبل التمويل)</span>
                    <span dir="ltr" class="num font-bold text-[var(--c-neg)]">
                      {formatBillionSYP(operatingDeficitSYP)}B
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-2 py-1.5 {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                    <span class="text-[var(--c-muted)]">الإنفاق الاستثماري (يبني الغد)</span>
                    <span dir="ltr" class="num font-bold text-[var(--c-pos)]">
                      {formatBillionSYP($previewRangesStore.investmentSYP ?? 0)}B
                    </span>
                  </div>
                </div>
              {/if}
            </section>
          {/if}
        </div>

        <!-- Consolidated deficit & over-budget warnings pinned outside scroll area above footer -->
        {#if afterTreasury < 0 || isOverBudget}
          <section
            role={isOverBudget ? 'alert' : 'status'}
            class="flow-tray-warn shrink-0 border-t border-[var(--c-line)] bg-[var(--c-bg)] px-3.5 pt-2 pb-1.5"
          >
            <div class="space-y-1 border border-[var(--c-neg)] bg-[var(--c-ev-bg)] px-3 py-2 text-[var(--c-neg)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
              {#if isOverBudget}
                <div class="flex items-center gap-1.5 font-heading font-bold {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}">
                  <GameIcon name="barrier" cls="h-4 w-4 shrink-0" />
                  <span>تجاوز سقف الموازنة — لا يمكن تثبيت الدور</span>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-[var(--c-text)]">
                  {#if $budgetStore.remainingPC < 0}
                    <span>
                      · الرصيد السياسي: عجز
                      <span dir="ltr" class="num font-bold text-[var(--c-neg)]">{Math.abs(Math.round($budgetStore.remainingPC))}</span>
                    </span>
                  {/if}
                  {#if $budgetStore.remainingUSD < 0}
                    <span>
                      · النقد الأجنبي: عجز
                      <span dir="ltr" class="num font-bold text-[var(--c-neg)]">${formatMillionUSD(Math.abs($budgetStore.remainingUSD))}M</span>
                    </span>
                  {/if}
                </div>
              {/if}
              {#if afterTreasury < 0}
                <p class="font-bold leading-[1.45]">
                  الخزينة ستنتهي بعجز، سيُغطى بالطباعة ما لم تعدّل القرارات.
                </p>
              {/if}
            </div>
          </section>
        {/if}

        <!-- Pinned footer -->
        <footer class="flow-tray-foot grid shrink-0 grid-cols-[1fr_1.4fr] gap-2 border-t border-[var(--c-line)] bg-[var(--c-panel)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] phone-l:py-2">
          <button
            type="button"
            data-autofocus
            onclick={handleClose}
            style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
            class="kit-btn sec min-h-12 gap-2 bg-[var(--c-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-11 {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13.5px]'}"
          >
            <span>عودة</span>
            <KbdHint keys="Esc" />
          </button>
          <button
            type="button"
            disabled={isOverBudget}
            onclick={handleConfirmEndTurn}
            style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
            class="btn-primary-chamfer pressable min-h-12 px-4 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-11 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[14px]'}"
          >
            تأكيد وإنهاء الدور
          </button>
        </footer>
      {:else}
        <TurnResultsView
          onContinue={handleContinueToNewTurn}
          onTransitionChange={(active) => (resultsIsTransition = active)}
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  @media (max-height: 780px) {
    .flow-desktop .flow-tray-head {
      padding-block: 7px;
    }
    .flow-desktop .flow-tray-ledger {
      padding-block: 6px;
    }
    .flow-desktop .flow-ledger-cell {
      padding-block: 4px;
    }
    .flow-desktop .flow-tray-warn {
      padding-block: 6px;
    }
    .flow-desktop .flow-tray-foot {
      padding-block: 8px;
    }
  }
</style>


