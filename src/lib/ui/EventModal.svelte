<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { canAffordEventOption } from '../engine/events';
  import GameIcon from './GameIcon.svelte';
  import FxChip from './kit/FxChip.svelte';
  import { focusTrap } from './actions/focus-trap';
  import { panelFocus } from './flow/panel-focus';
  import KbdHint from './flow/KbdHint.svelte';
  import { hasModifierKey, isTypingTarget } from './flow/kbd';
  import './flow/flow-desktop.css';
  import { shellLayout } from './shell/viewport';
  import { fx } from './fx/feedback';
  import { focusGovernorate, clearMapFocus } from './map/map-focus';
  import {
    CATEGORY_NAMES_AR,
    getGovName,
    resolveEventFocusGovId,
  } from './flow/event-focus';
  import { SUSPENDED_ICON } from './panels/shared';
  import { tourActive } from './guide-tour';

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatBillionSYP(syp: number): string {
    return (syp / 1_000_000_000).toFixed(2);
  }

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');

  let currentEvent = $derived(
    $gameStore.activeEvents.length > 0 ? $gameStore.activeEvents[0] : null
  );

  // Alert stage of the end-turn flow: visible after results ('events'), or
  // standalone on resume when events are pending and no flow is open ('closed').
  let showEventsModal = $derived(
    currentEvent !== null &&
      ($uiStore.turnFlowStage === 'events' || $uiStore.turnFlowStage === 'closed')
  );

  let focusGovId = $derived(resolveEventFocusGovId(currentEvent));
  let focusDismissedForId = $state<string | null>(null);
  let isFocusStep = $derived(
    showEventsModal &&
      currentEvent !== null &&
      focusGovId !== null &&
      focusDismissedForId !== currentEvent.id
  );
  let isCardStep = $derived(
    showEventsModal &&
      currentEvent !== null &&
      (focusGovId === null || focusDismissedForId === currentEvent.id)
  );

  $effect(() => {
    if ($uiStore.turnFlowStage === 'events' && !currentEvent) {
      uiStore.setTurnFlowStage('closed');
    }
  });

  // Dynamically evaluate whether each option can be chosen via engine gate.
  let evaluatedOptions = $derived(
    currentEvent
      ? currentEvent.options.map((opt) => {
          const verdict = canAffordEventOption($gameStore, opt);
          return {
            ...opt,
            canChoose: verdict.ok,
            deficitReason: verdict.ok ? null : verdict.reasonAr ?? null,
          };
        })
      : []
  );

  let canDoAnyOption = $derived(evaluatedOptions.some((opt) => opt.canChoose));

  let selectedOptionId = $state<string | null>(null);
  let selectedOptionForConfirm = $state<(typeof evaluatedOptions)[number] | null>(null);
  let isConfirmingPenalty = $state<boolean>(false);
  let errorShakeId = $state<string | null>(null);
  let expandedOptionIds = $state<Record<string, boolean>>({});
  let overflowingOptionIds = $state<Record<string, boolean>>({});
  let lastEventId: string | null = null;
  let lastPlayedEventId: string | null = null;
  let shakeTimer: ReturnType<typeof setTimeout> | null = null;
  let suppressBannerFocusRestore = false;

  let selectedOptionIndex = $derived(
    evaluatedOptions.findIndex((opt) => opt.id === selectedOptionId)
  );
  let selectedOption = $derived(
    selectedOptionIndex >= 0 ? evaluatedOptions[selectedOptionIndex] : null
  );
  let selectedCode = $derived(
    selectedOptionIndex >= 0 ? String(selectedOptionIndex + 1).padStart(2, '0') : ''
  );

  $effect(() => {
    const id = currentEvent?.id ?? null;
    if (id !== lastEventId) {
      lastEventId = id;
      selectedOptionId = null;
      selectedOptionForConfirm = null;
      isConfirmingPenalty = false;
      errorShakeId = null;
      expandedOptionIds = {};
      overflowingOptionIds = {};
      focusDismissedForId = null;
      suppressBannerFocusRestore = false;
    }
  });

  $effect(() => {
    if (showEventsModal && currentEvent) {
      if (lastPlayedEventId !== currentEvent.id) {
        lastPlayedEventId = currentEvent.id;
        fx('event');
      }
    } else {
      lastPlayedEventId = null;
    }
  });

  // Pan/zoom map and highlight target governorate during the pre-card focus step.
  let ownsFocus = false;
  $effect(() => {
    if (showEventsModal && currentEvent && focusGovId) {
      ownsFocus = true;
      focusGovernorate(focusGovId);
    } else if (ownsFocus) {
      ownsFocus = false;
      clearMapFocus();
    }
  });

  onDestroy(() => {
    if (ownsFocus) {
      ownsFocus = false;
      clearMapFocus();
    }
    if (shakeTimer) clearTimeout(shakeTimer);
  });

  function openFocusedEvent(): void {
    if (!currentEvent) return;
    suppressBannerFocusRestore = true;
    fx('tap');
    focusDismissedForId = currentEvent.id;
  }

  function triggerBlockedFeedback(optId: string): void {
    fx('error');
    errorShakeId = optId;
    if (shakeTimer) clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => {
      if (errorShakeId === optId) errorShakeId = null;
    }, 320);
  }

  function handleSelectOption(opt: (typeof evaluatedOptions)[number]): void {
    if (!opt.canChoose) {
      triggerBlockedFeedback(opt.id);
      return;
    }
    fx('select');
    selectedOptionId = opt.id;
  }

  function toggleExpandOption(optId: string, event: MouseEvent): void {
    event.stopPropagation();
    fx('tap');
    expandedOptionIds = {
      ...expandedOptionIds,
      [optId]: !expandedOptionIds[optId],
    };
  }

  function measureClampOverflow(node: HTMLElement, optId: string) {
    let currentId = optId;
    const measure = () => {
      if (expandedOptionIds[currentId]) return;
      const isOverflowing = node.scrollHeight > node.clientHeight + 2;
      if (Boolean(overflowingOptionIds[currentId]) !== isOverflowing) {
        overflowingOptionIds = {
          ...overflowingOptionIds,
          [currentId]: isOverflowing,
        };
      }
    };
    const rafId = requestAnimationFrame(measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(node);
    return {
      update(nextId: string) {
        currentId = nextId;
        requestAnimationFrame(measure);
      },
      destroy() {
        cancelAnimationFrame(rafId);
        ro?.disconnect();
      },
    };
  }

  function openConfirm(): void {
    if (!selectedOption) {
      fx('error');
      return;
    }
    fx('tap');
    selectedOptionForConfirm = selectedOption;
  }

  function handleExecuteConfirmedOption(): void {
    if (currentEvent && selectedOptionForConfirm) {
      fx('confirm');
      const optionId = selectedOptionForConfirm.id;
      selectedOptionForConfirm = null;
      selectedOptionId = null;
      clearMapFocus();
      gameStore.chooseEventOption(currentEvent.id, optionId);
    }
  }

  function handleExecutePenalty(): void {
    if (currentEvent) {
      fx('confirm');
      isConfirmingPenalty = false;
      clearMapFocus();
      gameStore.triggerUnresolvedCrisisPenalty(currentEvent.id);
    }
  }

  function signed(value: number): string {
    return `${value > 0 ? '+' : ''}${value}`;
  }

  function effectChips(opt: (typeof evaluatedOptions)[number]): { text: string; tone: 'good' | 'bad' }[] {
    const chips: { text: string; tone: 'good' | 'bad' }[] = [];
    if (opt.effectTrust !== 0) {
      chips.push({ text: `ثقة ${signed(opt.effectTrust)}`, tone: opt.effectTrust > 0 ? 'good' : 'bad' });
    }
    if (opt.effectRRI !== 0) {
      chips.push({ text: `احتقان ${signed(opt.effectRRI)}`, tone: opt.effectRRI > 0 ? 'bad' : 'good' });
    }
    if (opt.effectCorruption !== 0) {
      chips.push({ text: `فساد ${signed(opt.effectCorruption)}`, tone: opt.effectCorruption > 0 ? 'bad' : 'good' });
    }
    if (opt.effectCompetence !== 0) {
      chips.push({
        text: `كفاءة ${signed(opt.effectCompetence)}`,
        tone: opt.effectCompetence > 0 ? 'good' : 'bad',
      });
    }
    return chips;
  }

  function parseOptionDigit(e: KeyboardEvent): number | null {
    if (e.key >= '1' && e.key <= '9') {
      return Number(e.key) - 1;
    }
    const digitMatch = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (digitMatch) {
      return Number(digitMatch[1]) - 1;
    }
    return null;
  }

  function onCaptureKey(e: KeyboardEvent): void {
    if (!showEventsModal || !currentEvent) return;
    if (
      $uiStore.isSettingsOpen ||
      $uiStore.isAboutOpen ||
      $uiStore.isRestartModalOpen ||
      $tourActive
    ) {
      return;
    }
    if (isCardStep && e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (hasModifierKey(e) || isTypingTarget(e.target)) return;

    const targetEl = e.target as HTMLElement | null;

    if (selectedOptionForConfirm) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        fx('cancel');
        selectedOptionForConfirm = null;
      } else if (e.key === 'Enter' && !targetEl?.closest('[data-cancel-confirm]')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleExecuteConfirmedOption();
      }
      return;
    }

    if (isConfirmingPenalty) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        fx('cancel');
        isConfirmingPenalty = false;
      }
      return;
    }

    if (isFocusStep) {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = targetEl?.tagName;
        if (tag !== 'BUTTON' && tag !== 'A' && tag !== 'INPUT') {
          e.preventDefault();
          e.stopImmediatePropagation();
          openFocusedEvent();
        }
      }
      return;
    }

    if (!isCardStep) return;

    const digitIdx = parseOptionDigit(e);
    if (digitIdx !== null && digitIdx < evaluatedOptions.length) {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleSelectOption(evaluatedOptions[digitIdx]);
      return;
    }

    if (e.key === 'Escape' && selectedOptionId !== null) {
      e.preventDefault();
      e.stopImmediatePropagation();
      fx('cancel');
      selectedOptionId = null;
      return;
    }

    if (e.key === 'Enter' && selectedOption) {
      const btn = targetEl?.closest('button, a, input');
      const optRow = targetEl?.closest<HTMLElement>('[data-event-option-id]');
      const rowId = optRow?.dataset.eventOptionId;
      if (!btn && (!rowId || rowId === selectedOption.id)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openConfirm();
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  });

  let focusBannerStyle = $derived.by(() => {
    if (isDesktop) {
      return 'bottom: 24px; inset-inline-start: calc(var(--shell-rail-w, 92px) + 24px); width: min(var(--flow-banner-w, clamp(360px, 26vw, 480px)), calc(100vw - var(--shell-rail-w, 92px) - var(--shell-map-end, 0px) - 48px));';
    }
    if (isLandscape) {
      return 'bottom: 10px; inset-inline-start: calc(var(--shell-rail-w, 72px) + 10px); width: min(268px, calc(100vw - var(--shell-rail-w, 72px) - 20px));';
    }
    return 'bottom: calc(var(--shell-bottom-h, 58px) + 12px); inset-inline: 12px;';
  });
</script>

{#if isFocusStep && currentEvent && focusGovId}
  <!-- Pre-card map focus banner anchored bottom-start of the live map area -->
  <div
    use:panelFocus={{
      enabled: isDesktop,
      shouldRestore: () => !suppressBannerFocusRestore,
    }}
    role="region"
    aria-label="برقية عاجلة: {currentEvent.titleAr}"
    data-flow-stage="events-focus"
    data-focus-gov={focusGovId}
    class="focus-banner-enter pointer-events-auto fixed z-[55] flex select-none flex-col gap-2 border border-[var(--c-neg)] border-t-2 border-t-[var(--c-neg)] bg-[var(--c-bg)] p-3 text-[var(--c-text)] font-arabic phone-l:gap-1.5 phone-l:p-2.5 {isDesktop ? 'flow-desktop p-4 gap-2.5' : ''}"
    style={focusBannerStyle}
  >
    <div class="font-bold text-[var(--c-neg)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11.5px]'}">
      برقية عاجلة · {getGovName(focusGovId)} · {CATEGORY_NAMES_AR[currentEvent.category] ?? 'داخلي'}
    </div>
    <h2 class="line-clamp-2 font-heading font-bold leading-[1.4] text-[var(--c-text)] phone-l:text-[13px] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[14.5px]'}">
      {currentEvent.titleAr}
    </h2>
    <button
      type="button"
      data-autofocus
      onclick={openFocusedEvent}
      style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
      class="btn-primary-chamfer pressable mt-0.5 min-h-11 w-full gap-2 px-4 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-10 phone-l:text-[13px] {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'}"
    >
      <span>فتح البرقية</span>
      <KbdHint keys="Enter" tone="accent" />
    </button>
  </div>
{:else if isCardStep && currentEvent}
  <!-- Dimmed scrim covering rail, top strip, map, and panels consistently on desktop -->
  <div
    class="pointer-events-auto fixed inset-0 z-[60] {isDesktop ? 'bg-[rgb(from_var(--c-bg)_r_g_b/0.84)]' : 'bg-[var(--c-bg)]'}"
    aria-hidden="true"
  ></div>
  <div
    class="pointer-events-none fixed inset-0 z-[70] flex select-none font-arabic {isDesktop
      ? 'flow-desktop items-center justify-center p-6'
      : 'items-stretch justify-stretch p-0'}"
  >
    {#key currentEvent.id}
      <div
        use:focusTrap
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-label="برقية عاجلة: {currentEvent.titleAr}"
        data-flow-stage="events"
        class="event-slam pointer-events-auto relative flex flex-col overflow-hidden border-t-2 border-t-[var(--c-neg)] bg-[var(--c-bg)] text-[var(--c-text)] {isDesktop
          ? 'max-h-[calc(100dvh-48px)] w-[min(var(--flow-crisis-w,clamp(640px,44vw,820px)),calc(100vw-48px))] border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-neg)]'
          : 'h-full w-full pt-[env(safe-area-inset-top)]'}"
      >
        <!-- Dark-red kicker band -->
        <header class="flow-ev-head shrink-0 border-b border-[var(--c-line)] bg-[var(--c-ev-bg)] {isDesktop ? 'px-[var(--flow-pad-x)] py-2.5' : 'px-3.5 py-2.5 sm:px-5 phone-l:py-2'}">
          <div class="flex flex-wrap items-center justify-between gap-2 font-bold text-[var(--c-neg)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
            <span>
              برقية عاجلة · {CATEGORY_NAMES_AR[currentEvent.category] ?? 'داخلي'}
              {#if focusGovId}· {getGovName(focusGovId)}{/if}
              · الدور <span class="num">{String($gameStore.turnNumber).padStart(2, '0')}</span>
            </span>
            <span class="font-medium text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">{currentEvent.sourceAr}</span>
          </div>
        </header>

        <!-- Scrollable body -->
        <div class="flow-ev-body scroll-area scroll-umber min-h-0 flex-1 space-y-3 overflow-y-auto {isDesktop ? 'px-[var(--flow-pad-x)] py-[var(--flow-pad-y)]' : 'px-3.5 py-3.5 sm:px-5 phone-l:py-2.5'}">
          <h2 class="max-w-[52ch] font-heading font-bold leading-[1.35] text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-h2)]' : 'text-[clamp(18px,2.8vw,22px)]'}">
            {currentEvent.titleAr}
          </h2>
          <p class="reading-text max-w-[70ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.68]' : 'text-[13px] leading-[1.68]'}">
            {currentEvent.descriptionAr}
          </p>

          <!-- Ruled availability strip -->
          <div class="flow-ev-avail flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-2 {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
            <span class="text-[var(--c-muted)]">المتاح</span>
            <span class="flex flex-wrap items-center gap-3" dir="ltr">
              <b class="num text-[var(--c-text)]">{$gameStore.macro.politicalCapital} رصيد</b>
              <b class="num text-[var(--c-text)]">${formatMillionUSD($gameStore.macro.reservesUSD)}M</b>
              <b class="num text-[var(--c-text)]">{formatBillionSYP($gameStore.macro.treasurySYP)}B ل.س</b>
            </span>
          </div>

          <!-- Incapacity alert when no option is affordable -->
          {#if !canDoAnyOption}
            <div class="border border-[var(--c-neg)] bg-[var(--c-ev-bg)] p-3.5">
              <div class="font-heading font-bold text-[var(--c-neg)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}">
                عجز سيادي شامل — تعذر الوفاء بمتطلبات أي خيار!
              </div>
              <p class="mt-1.5 leading-[1.65] text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                لا تملك مؤسسات الدولة النقد الأجنبي ($) أو سيولة الخزينة (SP) أو الرصيد السياسي المطلوب لتنفيذ أي من خيارات الاستجابة المتاحة.
                سيؤدي التخلف عن المعالجة إلى فرض عقوبة سيادية كارثية (ارتفاع الاحتقان الشعبي +25 نقطة، انهيار الثقة -25، تآكل الرصيد السياسي -30، وارتكاسات ميدانية عبر المحافظات).
              </p>
              <div class="mt-3 flex justify-end">
                <button
                  type="button"
                  onclick={() => {
                    fx('tap');
                    isConfirmingPenalty = true;
                  }}
                  class="kit-btn danger min-h-11 w-full px-4 text-[13px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] sm:w-auto"
                >
                  تحمل العقوبة الكارثية ومحاولة الصمود
                </button>
              </div>
            </div>
          {/if}

          <!-- Stacked single-column option rows (number keys 1-9 select on desktop) -->
          <div class="flow-ev-opts flex flex-col gap-2 pb-1">
            {#each evaluatedOptions as opt, i (opt.id)}
              {@const isSelected = selectedOptionId === opt.id}
              {@const isExpanded = Boolean(expandedOptionIds[opt.id])}
              {@const canExpand = Boolean(overflowingOptionIds[opt.id]) || isExpanded}
              {@const chips = effectChips(opt)}
              {@const code = String(i + 1).padStart(2, '0')}
              <div
                data-event-option-id={opt.id}
                role="button"
                tabindex="0"
                aria-pressed={isSelected}
                aria-disabled={!opt.canChoose}
                title={isDesktop && i < 9 ? `اضغط ${i + 1} للاختيار` : undefined}
                onclick={() => handleSelectOption(opt)}
                onkeydown={(e) => {
                  if ((e.target as HTMLElement | null)?.closest('button')) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }
                }}
                class="flow-ev-opt pressable grid w-full grid-cols-[28px_1fr] items-start gap-x-2.5 border p-3 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {errorShakeId === opt.id ? 'option-error-shake' : ''} {opt.canChoose
                  ? isSelected
                    ? 'cursor-pointer border-[var(--c-text)] bg-[var(--c-chip-bg)]'
                    : 'cursor-pointer border-[var(--c-line)] bg-[var(--c-panel)] hover:border-[var(--c-line-strong)]'
                  : 'cursor-not-allowed border-dashed border-[var(--c-line-strong)] bg-[var(--c-strip)] opacity-75'}"
              >
                <!-- Neutral inverted number block for picked option; padlock for locked -->
                <span
                  class="num mt-0.5 flex h-7 w-7 items-center justify-center text-[12px] font-bold {isSelected
                    ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
                    : !opt.canChoose
                      ? 'border border-[var(--c-line-strong)] text-[var(--c-neg)]'
                      : 'border border-[var(--c-line)] text-[var(--c-muted)]'}"
                  aria-hidden="true"
                >
                  {#if !opt.canChoose}
                    <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="5" y="11" width="14" height="10" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  {:else}
                    {code}
                  {/if}
                </span>

                <div class="min-w-0">
                  <div class="font-heading font-bold leading-[1.45] text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[14px]'}">
                    {opt.labelAr}
                  </div>
                  <p
                    use:measureClampOverflow={opt.id}
                    class="mt-1 leading-[1.6] text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'} {isExpanded ? '' : 'line-clamp-3'}"
                  >
                    {opt.descriptionAr}{#if opt.customEffectAr}<br /><span class="text-[var(--c-text-2)]">{opt.customEffectAr}</span>{/if}
                  </p>
                  {#if canExpand}
                    <button
                      type="button"
                      onclick={(e) => toggleExpandOption(opt.id, e)}
                      class="mt-0.5 inline-flex min-h-8 items-center text-[11.5px] font-bold text-[var(--c-accent)] underline underline-offset-4 hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                    >
                      {isExpanded ? 'عرض أقل' : 'المزيد'}
                    </button>
                  {/if}

                  <!-- Cost, macro effects & governorate effects (wrap cleanly without horizontal clip) -->
                  <div class="ev-chips mt-2 flex flex-wrap items-center gap-1.5">
                    {#if opt.costUSD > 0}
                      <FxChip text={`-$${formatMillionUSD(opt.costUSD)}M`} tone="bad" />
                    {:else if opt.costUSD < 0}
                      <FxChip text={`+$${formatMillionUSD(-opt.costUSD)}M`} tone="good" />
                    {/if}

                    {#if opt.costSYP > 0}
                      <FxChip text={`-${formatBillionSYP(opt.costSYP)}B SP`} tone="bad" />
                    {:else if opt.costSYP < 0}
                      <FxChip text={`+${formatBillionSYP(-opt.costSYP)}B SP`} tone="good" />
                    {/if}

                    {#if opt.costPC > 0}
                      <FxChip text={`-${opt.costPC} رصيد`} tone={$gameStore.macro.politicalCapital < opt.costPC ? 'bad' : 'warn'} />
                    {/if}

                    {#if opt.costUSD === 0 && opt.costSYP === 0 && opt.costPC === 0}
                      <FxChip text="بدون كلفة مباشرة" tone="neutral" />
                    {/if}

                    {#each chips as chip}
                      <FxChip text={chip.text} tone={chip.tone} />
                    {/each}

                    {#if opt.governorateEffects && opt.governorateEffects.length > 0}
                      {#each opt.governorateEffects as eff}
                        {#if eff.customSummaryAr}
                          <FxChip text="{getGovName(eff.governorateId)}: {eff.customSummaryAr}" tone="neutral" />
                        {:else}
                          {#if eff.prri !== undefined}
                            <FxChip text="{getGovName(eff.governorateId)}: {eff.prri > 0 ? `+${eff.prri}` : eff.prri} احتقان" tone={eff.prri > 0 ? 'bad' : 'good'} />
                          {/if}
                          {#if eff.dailyBlackoutHours !== undefined}
                            <FxChip text="{getGovName(eff.governorateId)}: {eff.dailyBlackoutHours > 0 ? `+${eff.dailyBlackoutHours}` : eff.dailyBlackoutHours} س تقنين" tone={eff.dailyBlackoutHours > 0 ? 'bad' : 'good'} />
                          {/if}
                          {#if eff.securityEfficacy !== undefined}
                            <FxChip text="{getGovName(eff.governorateId)}: {eff.securityEfficacy > 0 ? `+${eff.securityEfficacy}` : eff.securityEfficacy} أمن" tone={eff.securityEfficacy > 0 ? 'good' : 'bad'} />
                          {/if}
                          {#if eff.reconstructionScore !== undefined}
                            <FxChip text="{getGovName(eff.governorateId)}: {eff.reconstructionScore > 0 ? `+${eff.reconstructionScore}` : eff.reconstructionScore} إعمار" tone={eff.reconstructionScore > 0 ? 'good' : 'bad'} />
                          {/if}
                          {#if eff.activeHospitalsPct !== undefined}
                            <FxChip text="{getGovName(eff.governorateId)}: {eff.activeHospitalsPct > 0 ? `+${eff.activeHospitalsPct}` : eff.activeHospitalsPct} مشافي" tone={eff.activeHospitalsPct > 0 ? 'good' : 'bad'} />
                          {/if}
                        {/if}
                      {/each}
                    {/if}
                  </div>

                  {#if !opt.canChoose && opt.deficitReason}
                    <div class="mt-1.5 flex items-start gap-1.5 text-[11.5px] font-bold leading-[1.45] text-[var(--c-neg)]">
                      <GameIcon name={SUSPENDED_ICON} cls="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span class="line-clamp-2">{opt.deficitReason}</span>
                    </div>
                  {:else if !opt.canChoose && opt.requirementsDescriptionAr}
                    <div class="mt-1.5 line-clamp-2 text-[11.5px] font-bold leading-[1.45] text-[var(--c-neg)]">
                      [متطلبات غير متوفرة]: {opt.requirementsDescriptionAr}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Pinned footer: phone keeps existing stacked/landscape bar; desktop shows picked option + end-aligned buttons with key hints -->
        <footer class="flow-ev-foot flex shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] {isDesktop
          ? 'flex-row items-center justify-end gap-3 px-[var(--flow-pad-x)] py-3'
          : 'flex-col items-stretch gap-2 px-3.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-5 phone-l:flex-row phone-l:items-center phone-l:py-2'}">
          {#if !canDoAnyOption}
            {#if focusGovId}
              <button
                type="button"
                onclick={() => {
                  fx('tap');
                  focusDismissedForId = null;
                }}
                style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
                class="kit-btn sec {isDesktop ? 'inline-flex px-4 text-[var(--flow-fs-sm)]' : 'hidden min-h-11 px-4 text-[13px] sm:inline-flex'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                معاينة المحافظة
              </button>
            {/if}
            <button
              type="button"
              onclick={() => {
                fx('tap');
                isConfirmingPenalty = true;
              }}
              style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
              class="btn-primary-chamfer pressable gap-2 bg-[var(--c-neg)] px-6 font-bold text-[var(--c-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop
                ? 'w-auto text-[var(--flow-fs-base)]'
                : 'min-h-12 w-full text-[13.5px] sm:w-auto phone-l:min-h-11'}"
            >
              <span>تحمل العقوبة الكارثية</span>
            </button>
          {:else}
            <div class="min-w-0 flex-1 leading-snug text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
              <b class="block truncate font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}">
                {selectedOption ? selectedOption.labelAr : 'لم يُتخذ قرار بعد'}
              </b>
              {#if isDesktop}
                <span>
                  {#if selectedOption}
                    سيُطبَّق أثره مع نتائج هذا الدور
                  {:else}
                    اختر برقم <span class="num">1–{Math.min(evaluatedOptions.length, 9)}</span> ثم اضغط <span class="num">Enter</span>
                  {/if}
                </span>
              {:else}
                <span class="hidden sm:inline phone-l:hidden">
                  {selectedOption ? 'سيُطبَّق أثره مع نتائج هذا الدور' : 'اختر أحد الخيارات لمتابعة البرقية'}
                </span>
              {/if}
            </div>

            <div class="flex shrink-0 items-center justify-end gap-2">
              {#if selectedOption}
                <button
                  type="button"
                  onclick={() => {
                    fx('cancel');
                    selectedOptionId = null;
                  }}
                  style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
                  class="kit-btn sec gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'inline-flex px-4 text-[var(--flow-fs-sm)]' : 'hidden min-h-11 px-4 text-[13px] sm:inline-flex'}"
                >
                  <span>إلغاء التحديد</span>
                  <KbdHint keys="Esc" />
                </button>
              {:else if focusGovId}
                <button
                  type="button"
                  onclick={() => {
                    fx('tap');
                    focusDismissedForId = null;
                  }}
                  style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
                  class="kit-btn sec focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'inline-flex px-4 text-[var(--flow-fs-sm)]' : 'hidden min-h-11 px-4 text-[13px] sm:inline-flex'}"
                >
                  معاينة المحافظة
                </button>
              {/if}

              <button
                type="button"
                disabled={!selectedOption}
                onclick={openConfirm}
                style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
                class="pressable gap-2 px-6 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop
                  ? 'flex-none min-w-[196px] text-[var(--flow-fs-base)]'
                  : 'min-h-12 flex-1 text-[14px] sm:flex-none sm:min-w-[190px] phone-l:min-h-11 phone-l:flex-none'} {selectedOption
                  ? 'btn-primary-chamfer'
                  : 'cursor-not-allowed border border-[var(--c-line-strong)] bg-[var(--c-bg)] text-[var(--c-muted)]'}"
              >
                <span>{selectedCode ? `تنفيذ القرار ${selectedCode}` : 'تنفيذ القرار'}</span>
                {#if selectedOption}
                  <KbdHint keys="Enter" tone="accent" />
                {/if}
              </button>
            </div>
          {/if}
        </footer>

        <!-- Confirmation prompt for the selected option -->
        {#if selectedOptionForConfirm}
          <div class="absolute inset-0 z-30 flex items-center justify-center bg-[rgb(from_var(--c-bg)_r_g_b/0.92)] p-4">
            <div
              role="dialog"
              aria-label="تأكيد الخيار"
              class="scroll-area max-h-full w-full max-w-[540px] overflow-hidden border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)]"
            >
              <div class="flex items-center gap-2 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-5 py-3">
                <GameIcon name="check-mark" cls="h-4 w-4 shrink-0 text-[var(--c-accent)]" />
                <h3 class="font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[15.5px]'}">تأكيد الخيار</h3>
              </div>

              <div class="space-y-3 p-5">
                <h4 class="font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[14px]'}">{selectedOptionForConfirm.labelAr}</h4>
                <p class="leading-[1.6] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                  {selectedOptionForConfirm.descriptionAr} {selectedOptionForConfirm.customEffectAr}
                </p>

                <!-- Before / after snapshot -->
                {#if selectedOptionForConfirm.costPC > 0 || selectedOptionForConfirm.costUSD !== 0 || selectedOptionForConfirm.costSYP !== 0}
                  <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                    <div class="bg-[var(--c-strip)] px-3 py-1.5 text-[11px] font-bold text-[var(--c-muted)]">
                      القيم قبل القرار وبعده
                    </div>
                    {#if selectedOptionForConfirm.costPC > 0}
                      <div class="flex items-center justify-between px-3 py-2">
                        <span class="text-[var(--c-muted)]">الرصيد السياسي</span>
                        <span dir="ltr" class="num font-bold">
                          <span class="text-[var(--c-text)]">{Math.round($gameStore.macro.politicalCapital)}</span>
                          <span class="text-[var(--c-muted)]"> → </span>
                          <span class="text-[var(--c-neg)]">{Math.round($gameStore.macro.politicalCapital - selectedOptionForConfirm.costPC)}</span>
                        </span>
                      </div>
                    {/if}
                    {#if selectedOptionForConfirm.costUSD !== 0}
                      <div class="flex items-center justify-between px-3 py-2">
                        <span class="text-[var(--c-muted)]">احتياطي النقد الأجنبي</span>
                        <span dir="ltr" class="num font-bold">
                          <span class="text-[var(--c-text)]">${formatMillionUSD($gameStore.macro.reservesUSD)}M</span>
                          <span class="text-[var(--c-muted)]"> → </span>
                          <span class={selectedOptionForConfirm.costUSD > 0 ? 'text-[var(--c-neg)]' : 'text-[var(--c-pos)]'}>${formatMillionUSD($gameStore.macro.reservesUSD - selectedOptionForConfirm.costUSD)}M</span>
                        </span>
                      </div>
                    {/if}
                    {#if selectedOptionForConfirm.costSYP !== 0}
                      <div class="flex items-center justify-between px-3 py-2">
                        <span class="text-[var(--c-muted)]">سيولة الخزينة</span>
                        <span dir="ltr" class="num font-bold">
                          <span class="text-[var(--c-text)]">{formatBillionSYP($gameStore.macro.treasurySYP)}B SP</span>
                          <span class="text-[var(--c-muted)]"> → </span>
                          <span class={selectedOptionForConfirm.costSYP > 0 ? 'text-[var(--c-neg)]' : 'text-[var(--c-pos)]'}>{formatBillionSYP($gameStore.macro.treasurySYP - selectedOptionForConfirm.costSYP)}B SP</span>
                        </span>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="flex flex-col gap-2 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-5 py-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  data-cancel-confirm
                  type="button"
                  onclick={() => {
                    fx('cancel');
                    selectedOptionForConfirm = null;
                  }}
                  style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
                  class="kit-btn sec gap-2 min-h-11 px-4 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  <span>تراجع واختيار آخر</span>
                  <KbdHint keys="Esc" />
                </button>
                <button
                  data-autofocus
                  type="button"
                  onclick={handleExecuteConfirmedOption}
                  style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
                  class="btn-primary-chamfer pressable gap-2 min-h-11 px-6 text-[13.5px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  <span>تأكيد واعتماد القرار</span>
                  <KbdHint keys="Enter" tone="accent" />
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Confirmation prompt for the catastrophic penalty -->
        {#if isConfirmingPenalty}
          <div class="absolute inset-0 z-30 flex items-center justify-center bg-[rgb(from_var(--c-bg)_r_g_b/0.92)] p-4">
            <div
              role="dialog"
              aria-label="تأكيد تحمل العقوبة الكارثية"
              class="scroll-area scroll-umber max-h-full w-full max-w-[540px] overflow-hidden border border-[var(--c-neg)] border-t-2 border-t-[var(--c-neg)] bg-[var(--c-bg)] text-[var(--c-text)]"
            >
              <div class="flex items-center gap-2 border-b border-[var(--c-line)] bg-[var(--c-ev-bg)] px-5 py-3">
                <GameIcon name="siren" cls="h-4 w-4 shrink-0 text-[var(--c-neg)]" />
                <h3 class="font-heading font-bold text-[var(--c-neg)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[15.5px]'}">تأكيد تحمل العقوبة الكارثية</h3>
              </div>

              <div class="p-5">
                <div class="space-y-2 border border-[var(--c-line)] bg-[var(--c-panel)] p-3.5 leading-[1.6] text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
                  <p class="font-bold text-[var(--c-neg)]">
                    هل أنت متأكد من العجز عن الاستجابة وتحمل الآثار الميدانية والسياسية الكاملة؟
                  </p>
                  <div class="space-y-1 pt-1 text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11.5px]'}">
                    <div>• ارتفاع حاد في الاحتقان الشعبي (+25 نقطة).</div>
                    <div>• انهيار فادح في الثقة المدنية والمجتمعية (-25 نقطة).</div>
                    <div>• تآكل رصيدك السياسي القيادي (-30 نقطة).</div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-5 py-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  data-autofocus
                  type="button"
                  onclick={() => {
                    fx('cancel');
                    isConfirmingPenalty = false;
                  }}
                  style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
                  class="kit-btn sec gap-2 min-h-11 px-4 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  <span>تراجع</span>
                  <KbdHint keys="Esc" />
                </button>
                <button
                  type="button"
                  onclick={handleExecutePenalty}
                  style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
                  class="btn-primary-chamfer pressable min-h-11 bg-[var(--c-neg)] px-6 text-[13.5px] font-bold text-[var(--c-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
                >
                  تأكيد تحمل العقوبة
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/key}
  </div>
{/if}

<style>
  .ev-chips :global(.fx-chip) {
    white-space: normal;
    text-align: start;
    line-height: 1.4;
  }

  /* Compact vertical rhythm on 1280x720 / 1366x768 laptops so typical 3-option crises fit without scrollbars */
  @media (max-height: 780px) {
    :global(.flow-desktop) .flow-ev-head {
      padding-block: 6px;
    }
    :global(.flow-desktop) .flow-ev-body {
      padding-block: 6px;
    }
    :global(.flow-desktop) .flow-ev-body > :global(* + *) {
      margin-block-start: 6px !important;
      margin-top: 6px !important;
    }
    :global(.flow-desktop) .flow-ev-body h2 {
      line-height: 1.25;
    }
    :global(.flow-desktop) .flow-ev-body p.reading-text {
      line-height: 1.45;
    }
    :global(.flow-desktop) .flow-ev-avail {
      padding-block: 4px;
    }
    :global(.flow-desktop) .flow-ev-opts {
      gap: 5px;
      padding-bottom: 0;
    }
    :global(.flow-desktop) .flow-ev-opt {
      padding: 5px 10px;
    }
    :global(.flow-desktop) .flow-ev-opt p {
      margin-top: 2px;
      line-height: 1.42;
    }
    :global(.flow-desktop) .flow-ev-opt .ev-chips {
      margin-top: 4px;
      gap: 4px;
    }
    :global(.flow-desktop) .flow-ev-foot {
      padding-block: 7px;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    @keyframes focus-banner-in {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: none; }
    }
    @keyframes event-slam-in {
      0% { opacity: 0; transform: translateY(-6px); }
      100% { opacity: 1; transform: none; }
    }
    @keyframes option-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      55% { transform: translateX(5px); }
      80% { transform: translateX(-2px); }
    }
    .focus-banner-enter {
      animation: focus-banner-in 0.16s ease-out both;
    }
    .event-slam {
      animation: event-slam-in 0.16s ease-out both;
    }
    .option-error-shake {
      animation: option-shake 0.26s ease-in-out both;
    }
  }
</style>


