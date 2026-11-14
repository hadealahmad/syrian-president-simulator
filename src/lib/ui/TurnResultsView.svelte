<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { tourActive } from './guide-tour';
  import StatTile from './kit/StatTile.svelte';
  import GroupDivider from './kit/GroupDivider.svelte';
  import KbdHint from './flow/KbdHint.svelte';
  import { hasModifierKey, isTypingTarget } from './flow/kbd';
  import { shellLayout } from './shell/viewport';
  import { fx } from './fx/feedback';
  import { parseHeroDelta, formatHeroDeltaAt, prefersReducedMotion } from './flow/count-up';
  import {
    buildTurnHeadlines,
    formatBillionSYP,
    formatMillionUSD,
    formatNumber,
  } from './flow/turn-headlines';

  /** Results phase of the end-turn modal: full-screen turn-transition stamp (stage 0),
      then staged headline cards one at a time with count-up hero numbers,
      followed by the financial & service ledger. */
  let {
    onContinue,
    onTransitionChange,
  }: {
    onContinue: () => void;
    onTransitionChange?: (active: boolean) => void;
  } = $props();

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  let audit = $derived($gameStore.lastTurnAudit);
  let headlines = $derived(buildTurnHeadlines($gameStore));
  // Stage 0 = turn-transition stamp, stages 1..headlines.length = headlines, last = ledger
  let total = $derived(headlines.length + 2);
  let stage = $state(0);
  let isTransition = $derived(stage === 0);
  let headlineIndex = $derived(stage - 1);
  let isLedger = $derived(stage >= headlines.length + 1);
  let isLast = $derived(stage >= total - 1);
  let card = $derived(
    !isTransition && !isLedger
      ? (headlines[Math.max(0, Math.min(headlineIndex, headlines.length - 1))] ?? null)
      : null
  );
  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let completedTurn = $derived(String(Math.max(0, $gameStore.turnNumber - 1)).padStart(2, '0'));
  let nextTurnLabel = $derived(String($gameStore.turnNumber).padStart(2, '0'));

  let realWage = $derived(
    ($gameStore.macro.civilServiceWageSYP / $gameStore.macro.parallelRateSYP).toFixed(1)
  );
  let provincesInRevoltCount = $derived(
    Object.values($gameStore.governorates).filter((g) => g.tier === 'REVOLT').length
  );
  let insurrectionRisk = $derived(
    $gameStore.macro.nationalRRI >= 80 && provincesInRevoltCount >= 4
  );
  let opShare = $derived(
    audit && audit.expendedSYP > 0
      ? Math.round(((audit.operatingExpendedSYP ?? audit.expendedSYP) / audit.expendedSYP) * 100)
      : 0
  );

  let sortedGovernorates = $derived(
    Object.values($gameStore.governorates).sort((a, b) => b.prri - a.prri)
  );

  let animatedDelta = $state('');
  let lastStageFx = -1;
  let initialStampAutoHandled = false;
  let stampTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelStampTimer(): void {
    if (stampTimer !== null) {
      clearTimeout(stampTimer);
      stampTimer = null;
    }
  }

  onDestroy(() => {
    cancelStampTimer();
    onTransitionChange?.(false);
  });

  $effect(() => {
    onTransitionChange?.(isTransition);
  });

  // Auto-advance the transition stamp once after ~1.2s on initial entry (instant with reduced motion).
  $effect(() => {
    if (stage === 0 && !initialStampAutoHandled && audit) {
      initialStampAutoHandled = true;
      cancelStampTimer();
      const delay = prefersReducedMotion() ? 0 : 1200;
      stampTimer = setTimeout(() => {
        stampTimer = null;
        if (stage === 0) {
          fx('tap');
          stage = 1;
        }
      }, delay);
    } else if (stage !== 0) {
      cancelStampTimer();
    }
  });

  $effect(() => {
    const activeCard = card;
    const currentStage = stage;

    if (currentStage !== lastStageFx) {
      if (lastStageFx !== -1 && activeCard) {
        if (activeCard.tone === 'good') fx('good');
        else if (activeCard.tone === 'bad') fx('bad');
        else fx('tap');
      }
      lastStageFx = currentStage;
    }

    if (!activeCard) {
      animatedDelta = '';
      return;
    }

    const parsed = parseHeroDelta(activeCard.delta);
    if (!parsed || prefersReducedMotion()) {
      animatedDelta = activeCard.delta;
      return;
    }

    let rafId = 0;
    const duration = 520;
    const start = performance.now();
    animatedDelta = formatHeroDeltaAt(parsed, 0);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      animatedDelta = t >= 1 ? activeCard.delta : formatHeroDeltaAt(parsed, eased);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  });

  // Pointer swipe support for headline & transition cards
  let swipeStartX = 0;
  let swipeStartY = 0;
  let pointerTracked = false;

  function onCardPointerDown(e: PointerEvent): void {
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
    pointerTracked = true;
  }

  function onCardPointerUp(e: PointerEvent): void {
    if (!pointerTracked) return;
    pointerTracked = false;
    const dx = e.clientX - swipeStartX;
    const dy = e.clientY - swipeStartY;
    if (Math.abs(dy) > 48 && Math.abs(dy) > Math.abs(dx)) return;
    if (dx <= -42) {
      next();
    } else if (dx >= 42) {
      prev();
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const sel = window.getSelection?.()?.toString();
      if (!sel) next();
    }
  }

  function next(): void {
    cancelStampTimer();
    initialStampAutoHandled = true;
    if (isLast) return;
    if (stage === 0 || isLedger) fx('tap');
    stage += 1;
  }
  function prev(): void {
    cancelStampTimer();
    initialStampAutoHandled = true;
    if (stage <= 0) return;
    fx('tap');
    stage -= 1;
  }
  function jump(index: number): void {
    cancelStampTimer();
    initialStampAutoHandled = true;
    const target = Math.max(0, Math.min(total - 1, index));
    if (target === stage) return;
    if (target === 0 || target >= headlines.length + 1) fx('tap');
    stage = target;
  }
  function skipToLedger(): void {
    cancelStampTimer();
    initialStampAutoHandled = true;
    if (isLast) return;
    fx('tap');
    stage = total - 1;
  }
  function primaryAction(): void {
    cancelStampTimer();
    initialStampAutoHandled = true;
    if (!isLast) {
      next();
      return;
    }
    fx('confirm');
    onContinue();
  }

  function handleResultsKeydown(e: KeyboardEvent): void {
    if ($uiStore.isSettingsOpen || $uiStore.isAboutOpen || $uiStore.isRestartModalOpen || $tourActive) {
      return;
    }
    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (hasModifierKey(e) || isTypingTarget(e.target)) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopImmediatePropagation();
      next();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopImmediatePropagation();
      prev();
    } else if (e.code === 'KeyS' || e.key.toLowerCase() === 's') {
      if (!isLast) {
        e.preventDefault();
        e.stopImmediatePropagation();
        skipToLedger();
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag !== 'BUTTON' && tag !== 'A' && tag !== 'INPUT') {
        e.preventDefault();
        e.stopImmediatePropagation();
        primaryAction();
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleResultsKeydown, true);
    return () => window.removeEventListener('keydown', handleResultsKeydown, true);
  });

  function indexLabel(index: number): string {
    if (index === 0) return `إغلاق الدور ${completedTurn}`;
    if (index >= headlines.length + 1) return 'الملخص المالي';
    return headlines[index - 1]?.title ?? '';
  }

  function tierLabel(tier: string): string {
    if (tier === 'REVOLT') return 'تمرد';
    if (tier === 'RIOT') return 'اضطراب';
    if (tier === 'TENSE') return 'توتر';
    return 'هادئ';
  }

  function tierClass(tier: string): string {
    if (tier === 'REVOLT') return 'border-[var(--c-neg)] bg-[var(--c-ev-bg)] text-[var(--c-neg)]';
    if (tier === 'RIOT') return 'border-[var(--c-neg)] bg-[var(--c-bg)] text-[var(--c-neg)]';
    if (tier === 'TENSE') return 'border-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-accent)]';
    return 'border-[var(--c-pos)] bg-[var(--c-bg)] text-[var(--c-pos)]';
  }

  function heroToneClass(tone: string): string {
    if (tone === 'good') return 'text-[var(--c-pos)]';
    if (tone === 'bad') return 'text-[var(--c-neg)]';
    return 'text-[var(--c-text)]';
  }

  function heroSizeStyle(text: string): string {
    if (!isDesktop) return '';
    const len = text.length;
    if (len >= 11) return 'font-size: var(--flow-fs-hero-long);';
    if (len >= 8) return 'font-size: var(--flow-fs-hero-mid);';
    return 'font-size: var(--flow-fs-hero);';
  }

  function heroSizeClass(text: string): string {
    if (isDesktop) return '';
    const len = text.length;
    if (len >= 11) return 'text-[26px] sm:text-[32px] phone-l:text-[24px]';
    if (len >= 8) return 'text-[30px] sm:text-[38px] phone-l:text-[26px]';
    return 'text-[36px] sm:text-[42px] phone-l:text-[28px]';
  }
</script>

<div class="flex min-h-0 flex-1 flex-col bg-[var(--c-bg)] text-[var(--c-text)]">
  {#if audit}
    {#if isTransition}
      <!-- Full-screen flat transition stamp (advances on tap or after ~1.2s) -->
      <div
        class="stamp-enter flex min-h-0 flex-1 flex-col border-t-2 border-t-[var(--c-accent)] bg-[var(--c-bg)] pt-[env(safe-area-inset-top)]"
        data-results-stage={stage}
      >
        <div
          role="button"
          tabindex="0"
          aria-label="الانتقال إلى البطاقة التالية"
          onpointerdown={onCardPointerDown}
          onpointerup={onCardPointerUp}
          class="flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center px-6 py-6 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:py-3"
        >
          <span class="border border-[var(--c-accent)] bg-[var(--c-panel)] px-3.5 py-1 font-bold text-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[11.5px]'}">
            تم تثبيت الدور <span class="num">{completedTurn}</span> والمصادقة
          </span>

          <div class="mt-6 font-bold text-[var(--c-muted)] phone-l:mt-2.5 {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13px]'}">
            مطلع الدور
          </div>
          <h3 class="mt-1 font-display font-bold leading-[1.02] text-[var(--c-text)] phone-l:text-[52px] {isDesktop ? 'text-[clamp(76px,7vw,118px)]' : 'text-[clamp(64px,15vw,96px)]'}">
            <span class="tabular-nums text-[var(--c-accent)]">{nextTurnLabel}</span>
          </h3>
          <p class="mt-2 font-heading font-bold text-[var(--c-text-2)] phone-l:mt-1 phone-l:text-[13px] {isDesktop ? 'text-[var(--flow-fs-lg)]' : 'text-[15px]'}">
            {seasonText} · <span class="num text-[var(--c-text)]">{$gameStore.calendarYear}</span>
          </p>

          <!-- Two ruled figures for treasury & reserves change -->
          <div class="mt-7 grid w-full divide-x divide-x-reverse divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)] text-start phone-l:mt-3 {isDesktop ? 'max-w-[580px] grid-cols-2' : 'max-w-[520px] grid-cols-2'}">
            <div class="p-3.5 phone-l:p-2 {isDesktop ? 'px-5 py-4' : ''}">
              <span class="block text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">تغيّر الخزينة</span>
              <b
                dir="ltr"
                class="num mt-0.5 block text-right font-bold leading-snug {audit.netSYPDelta >= 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]'} phone-l:text-[17px] {isDesktop ? 'text-[clamp(22px,1.6vw,30px)]' : 'text-[20px]'}"
              >
                {audit.netSYPDelta >= 0 ? '+' : '-'}{formatBillionSYP(Math.abs(audit.netSYPDelta))}B
              </b>
            </div>
            <div class="p-3.5 phone-l:p-2 {isDesktop ? 'px-5 py-4' : ''}">
              <span class="block text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">تغيّر الاحتياطي</span>
              <b
                dir="ltr"
                class="num mt-0.5 block text-right font-bold leading-snug {audit.netUSDDelta >= 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]'} phone-l:text-[17px] {isDesktop ? 'text-[clamp(22px,1.6vw,30px)]' : 'text-[20px]'}"
              >
                {audit.netUSDDelta >= 0 ? '+' : '-'}${formatMillionUSD(Math.abs(audit.netUSDDelta))}M
              </b>
            </div>
          </div>

          <span class="mt-6 text-[var(--c-muted)] phone-l:mt-2.5 {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[11.5px]'}">
            {isDesktop ? 'اضغط في أي مكان أو Enter للمتابعة إلى نشرة النتائج' : 'اضغط في أي مكان للمتابعة إلى نشرة النتائج'}
          </span>
        </div>

        <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] phone-l:py-2">
          <div class="mx-auto flex w-full items-center gap-2.5 {isDesktop ? 'max-w-[var(--flow-stage-w)] justify-end' : 'max-w-[520px] justify-between'}">
            <button
              type="button"
              onclick={skipToLedger}
              style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
              class="kit-btn sec min-h-11 gap-2 bg-[var(--c-bg)] px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}"
            >
              <span>تخطي إلى الملخص</span>
              <KbdHint keys="S" />
            </button>
            <button
              type="button"
              data-autofocus
              onclick={primaryAction}
              style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
              class="btn-primary-chamfer pressable min-h-11 gap-2 px-6 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[14px]'}"
            >
              <span>التالي</span>
              <KbdHint keys="Enter" tone="accent" />
            </button>
          </div>
        </footer>
      </div>
    {:else}
      <!-- Ruled header: title + k/n counter only -->
      <header class="flow-res-head flex shrink-0 items-center justify-between gap-2 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-2.5 phone-l:py-1.5 {isDesktop ? 'px-[var(--flow-pad-x)]' : ''}">
        <div class="min-w-0">
          <h2 class="truncate font-heading font-bold leading-[1.35] text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[16px]'}">
            نتائج الدور <span class="num">{completedTurn}</span>
          </h2>
          <div class="text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">
            {seasonText} <span class="num">{$gameStore.calendarYear}</span>
          </div>
        </div>

        <span class="num shrink-0 border border-[var(--c-line)] bg-[var(--c-bg)] px-2.5 py-1 font-heading font-bold text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12px]'}" dir="ltr">
          {stage + 1} / {total}
        </span>
      </header>

      <!-- Flat segmented progress bar across the stage (done = grey, current = amber, rest = track) -->
      <div
        class="flow-res-prog flex shrink-0 gap-0.5 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-1 phone-l:py-0.5 {isDesktop ? 'gap-1.5 px-[var(--flow-pad-x)] py-2' : 'sm:gap-1 sm:px-3.5 sm:py-2'}"
        role="tablist"
        aria-label="تقدم بطاقات النتائج"
      >
        {#each Array.from({ length: total }, (_, i) => i) as i (i)}
          <button
            type="button"
            onclick={() => jump(i)}
            aria-label={indexLabel(i)}
            title={indexLabel(i)}
            aria-current={i === stage ? 'step' : undefined}
            class="pressable flex min-h-8 flex-1 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop ? 'min-h-6' : 'sm:min-h-6 phone-l:min-h-7'}"
          >
            <span
              class="block h-1 w-full {i === stage
                ? 'bg-[var(--c-accent)]'
                : i < stage
                  ? 'bg-[var(--c-disabled)]'
                  : 'bg-[var(--c-track)]'}"
            ></span>
          </button>
        {/each}
      </div>

      <div class="flex min-h-0 flex-1">
        <div
          class="flow-res-scroll scroll-area min-h-0 flex-1 overflow-y-auto p-3 phone-l:p-2.5 {isDesktop ? 'p-[var(--flow-pad-y)_var(--flow-pad-x)]' : 'sm:p-5'}"
          data-results-stage={stage}
        >
          {#if isLedger}
            <!-- Ruled ledger summary -->
            <div class="flex flex-col gap-3.5 pb-4 {isDesktop ? 'gap-4' : ''}">
              <h3 class="font-heading font-bold text-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[16px]'}">
                الملخص المالي والخدمي
              </h3>

              <!-- Five-figure KPI tiles (always 5 in 1 row on desktop) -->
              <div class="kpi-tiles grid gap-2 {isDesktop ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-5'}">
                <StatTile
                  label="الخزينة"
                  value="{formatBillionSYP($gameStore.macro.treasurySYP)}B"
                  delta="{audit.netSYPDelta >= 0 ? '+' : ''}{formatBillionSYP(audit.netSYPDelta)}B"
                  deltaTone={audit.netSYPDelta >= 0 ? 'pos' : 'neg'}
                />
                <StatTile
                  label="الاحتياطي"
                  value="${formatMillionUSD($gameStore.macro.reservesUSD)}M"
                  delta="{audit.netUSDDelta >= 0 ? '+' : ''}${formatMillionUSD(audit.netUSDDelta)}M"
                  deltaTone={audit.netUSDDelta >= 0 ? 'pos' : 'neg'}
                />
                <StatTile
                  label="الرصيد السياسي"
                  value={String(Math.round($gameStore.macro.politicalCapital))}
                  unit="/200"
                />
                <StatTile
                  label="الثقة الشعبية"
                  value="{$gameStore.macro.civicTrust}%"
                  unit="/100"
                />
                <StatTile
                  label="الاحتقان"
                  value={String($gameStore.macro.nationalRRI)}
                  unit="/100"
                  class={isDesktop ? '' : 'col-span-2 sm:col-span-1'}
                />
              </div>

              <!-- FX + Treasury tables (side by side on desktop) -->
              <div class={isDesktop ? 'grid grid-cols-2 items-start gap-4' : 'contents'}>
                <!-- Foreign currency ruled 2-col table -->
                <section class="space-y-1.5" aria-label="صافي النقد الأجنبي">
                <GroupDivider label="صافي النقد الأجنبي (الدولار)" tone="accent" />
                <table class="w-full table-fixed border-collapse text-[12.5px]">
                  <tbody>
                    {#if (audit.debtServiceUSD ?? 0) > 0}
                      <tr>
                        <td class="w-[56%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          خدمة الدين
                        </td>
                        <td dir="ltr" class="num w-[44%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-text)]">
                          ${formatMillionUSD(audit.debtServiceUSD)}M
                        </td>
                      </tr>
                    {/if}
                    {#if (audit.iranOilCouponUSD ?? 0) > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          القسط النفطي الإيراني
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-text)]">
                          ${formatMillionUSD(audit.iranOilCouponUSD)}M
                        </td>
                      </tr>
                    {:else if ($gameStore.flags?.Debt_Repudiated_Iran_Formal ?? 0) === 1}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          القسط الإيراني
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-pos)]">
                          $0.0M <bdi dir="rtl">(مُسقط)</bdi>
                        </td>
                      </tr>
                    {/if}
                    {#if (audit.mortgageDrainUSD ?? 0) > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          نزيف الرهون
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-neg)]">
                          ${formatMillionUSD(audit.mortgageDrainUSD)}M
                        </td>
                      </tr>
                    {/if}
                    {#if (audit.debtRepaymentPaidUSD ?? 0) > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          سداد أصل الدين
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-pos)]">
                          ${formatMillionUSD(audit.debtRepaymentPaidUSD)}M
                        </td>
                      </tr>
                    {/if}
                    <tr>
                      <td class="w-[56%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                        صافي التغيّر هذا الدور
                      </td>
                      <td dir="ltr" class="num w-[44%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold {audit.netUSDDelta >= 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]'}">
                        {audit.netUSDDelta >= 0 ? '+' : '-'}${formatMillionUSD(Math.abs(audit.netUSDDelta))}M
                      </td>
                    </tr>
                    <tr class="bg-[var(--c-strip)]">
                      <td class="border border-[var(--c-line-strong)] px-3 py-2 font-bold text-[var(--c-text)]">
                        الرصيد الختامي للاحتياطي
                      </td>
                      <td dir="ltr" class="num border border-[var(--c-line-strong)] px-3 py-2 text-right text-[14px] font-bold text-[var(--c-accent)]">
                        ${formatMillionUSD($gameStore.macro.reservesUSD)}M
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <!-- Treasury ruled 2-col table -->
              <section class="space-y-1.5" aria-label="رصيد الخزينة">
                <GroupDivider label="رصيد الخزينة (ل.س)" tone="accent" />
                <table class="w-full table-fixed border-collapse text-[12.5px]">
                  <tbody>
                    <tr>
                      <td class="w-[56%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                        المحصّل مقابل المصروف
                      </td>
                      <td dir="ltr" class="num w-[44%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-text)]">
                        {formatBillionSYP(audit.grossCapturedSYP)}B − {formatBillionSYP(audit.expendedSYP)}B
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-2">
                        <div class="flex items-center justify-between gap-2 text-[11.5px] text-[var(--c-muted)]">
                          <span>
                            تشغيلي <b dir="ltr" class="num text-[var(--c-text-2)]">{formatBillionSYP(audit.operatingExpendedSYP ?? audit.expendedSYP)}B</b>
                            (<span class="num">{opShare}%</span>)
                          </span>
                          <span>
                            استثماري <b dir="ltr" class="num text-[var(--c-pos)]">{formatBillionSYP(audit.investmentExpendedSYP ?? 0)}B</b>
                            (<span class="num">{100 - opShare}%</span>)
                          </span>
                        </div>
                        <div class="mt-1.5 flex h-1.5 w-full bg-[var(--c-track)]" aria-hidden="true">
                          <div class="h-full bg-[var(--c-accent)]" style="width: {opShare}%"></div>
                          <div class="h-full bg-[var(--c-pos)]" style="width: {100 - opShare}%"></div>
                        </div>
                      </td>
                    </tr>
                    {#if (audit.capacityRevenueBonusSYP ?? 0) > 0 || (audit.projectRevenueSYP ?? 0) > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          إيراد متكرر جديد من النمو
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-pos)]">
                          +{formatBillionSYP((audit.capacityRevenueBonusSYP ?? 0) + (audit.projectRevenueSYP ?? 0))}B
                        </td>
                      </tr>
                    {/if}
                    <tr>
                      <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                        المسار قبل نفاد الاحتياطي
                      </td>
                      <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-text)]">
                        ~{audit.runwayTurnsEstimate ?? 99} <bdi dir="rtl">دوراً</bdi>
                      </td>
                    </tr>
                    <tr>
                      <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                        عبء الفوائد من الإيرادات
                      </td>
                      <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-text)]">
                        {audit.interestBurdenPct ?? 0}%
                      </td>
                    </tr>
                    {#if (audit.facilityInflowUSD ?? 0) > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          تسهيلات هذا الدور
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-pos)]">
                          +${formatMillionUSD(audit.facilityInflowUSD)}M
                        </td>
                      </tr>
                    {/if}
                    {#if $gameStore.macro.treasurySYP < 0}
                      <tr>
                        <td colspan="2" class="border border-[var(--c-neg)] bg-[var(--c-ev-bg)] px-3 py-1.5 font-bold text-[var(--c-neg)]">
                          عجز مالي متراكم على الخزينة العامة
                        </td>
                      </tr>
                    {:else if audit.seignioragePrintedSYP > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          إصدار نقدي
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-accent)]">
                          +{formatBillionSYP(audit.seignioragePrintedSYP)}B
                        </td>
                      </tr>
                    {/if}
                    {#if (audit.overdraftInterestSYP ?? 0) > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          فوائد العجز
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-neg)]">
                          {formatBillionSYP(audit.overdraftInterestSYP)}B
                        </td>
                      </tr>
                    {/if}
                    {#if (audit.auctionAbsorbedSYP ?? 0) > 0}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          امتصاص المزاد (أُتلف)
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-text)]">
                          {formatBillionSYP(audit.auctionAbsorbedSYP)}B
                        </td>
                      </tr>
                    {/if}
                    <tr>
                      <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                        الصافي هذا الدور
                      </td>
                      <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold {audit.netSYPDelta >= 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]'}">
                        {audit.netSYPDelta >= 0 ? '+' : '-'}{formatBillionSYP(Math.abs(audit.netSYPDelta))}B
                      </td>
                    </tr>
                    <tr class="bg-[var(--c-strip)]">
                      <td class="border border-[var(--c-line-strong)] px-3 py-2 font-bold text-[var(--c-text)]">
                        الرصيد الختامي للخزينة
                      </td>
                      <td dir="ltr" class="num border border-[var(--c-line-strong)] px-3 py-2 text-right text-[14px] font-bold {$gameStore.macro.treasurySYP < 0 ? 'text-[var(--c-neg)]' : 'text-[var(--c-accent)]'}">
                        {formatBillionSYP($gameStore.macro.treasurySYP)}B SP
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
              </div>

              <!-- Services + Fail distance tables (side by side on desktop) -->
              <div class={isDesktop ? 'grid grid-cols-2 items-start gap-4' : 'contents'}>
                <!-- Services & living standards ruled 2-col table -->
                <section class="space-y-1.5" aria-label="الخدمات ومعيشة المواطنين">
                  <GroupDivider label="الخدمات ومعيشة المواطنين" tone="accent" />
                  <table class="w-full table-fixed border-collapse {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}">
                    <tbody>
                      <tr>
                        <td class="w-[56%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          سعر الصرف الموازي
                        </td>
                        <td dir="ltr" class="num w-[44%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-accent)]">
                          {formatNumber($gameStore.macro.parallelRateSYP)} SP
                        </td>
                      </tr>
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          الأجر الحقيقي للموظف
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-pos)]">
                          ${realWage} <bdi dir="rtl">/ شهرياً</bdi>
                        </td>
                      </tr>
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          التوليد الكهربائي
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold text-[var(--c-text)]">
                          {$gameStore.macro.gridCapacityMW} MW ({$gameStore.macro.dailyPowerHours}<bdi dir="rtl"> س</bdi>)
                        </td>
                      </tr>
                      <tr class="bg-[var(--c-strip)]">
                        <td class="border border-[var(--c-line-strong)] px-3 py-2 font-bold text-[var(--c-text)]">
                          الاحتقان الوطني العام
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line-strong)] px-3 py-2 text-right font-bold {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[14px]'} {$gameStore.macro.nationalRRI < 40 ? 'text-[var(--c-pos)]' : $gameStore.macro.nationalRRI < 65 ? 'text-[var(--c-accent)]' : 'text-[var(--c-neg)]'}">
                          {$gameStore.macro.nationalRRI} / 100
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <!-- Distance from catastrophic fail states -->
                <section class="space-y-1.5" aria-label="المسافة من الانهيارات الكبرى">
                  <GroupDivider label="المسافة من الانهيارات الكبرى" tone="accent" />
                  <table class="w-full table-fixed border-collapse {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12.5px]'}">
                    <tbody>
                      <tr>
                        <td class="w-[52%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          غطاء النقد الأجنبي
                        </td>
                        <td dir="ltr" class="num w-[48%] border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold {audit.runwayMonths <= 3.0 ? 'text-[var(--c-neg)]' : audit.runwayMonths <= 6.0 ? 'text-[var(--c-accent)]' : 'text-[var(--c-pos)]'}">
                          {audit.runwayMonths} <bdi dir="rtl">شهراً {audit.runwayMonths <= 3.0 ? '[خطر]' : '[مستقر]'}</bdi>
                        </td>
                      </tr>
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-[var(--c-muted)]">
                          العصيان المسلح
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1.5 text-right font-bold {insurrectionRisk ? 'text-[var(--c-neg)]' : 'text-[var(--c-text)]'}">
                          <span>{provincesInRevoltCount} <bdi dir="rtl">متمردة</bdi> · {$gameStore.macro.nationalRRI}/100</span>
                          <span dir="rtl" class="block text-start text-[11px] font-normal text-[var(--c-muted)]">الانهيار: 4 متمردة واحتقان 80+</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              </div>

              <!-- Provinces ruled table -->
              <section class="space-y-1.5" aria-label="أوضاع المحافظات بعد الدور">
                <GroupDivider label="أوضاع المحافظات (بحسب الاحتقان)" count={sortedGovernorates.length} tone="accent" />
                <table class="w-full border-collapse {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[12px]'}">
                  <thead>
                    <tr>
                      <th class="px-2.5 pb-1 text-start text-[11px] font-normal text-[var(--c-muted)]">المحافظة</th>
                      <th class="px-2 pb-1 text-center text-[11px] font-normal text-[var(--c-muted)]">الحالة</th>
                      <th class="w-[62px] px-2.5 pb-1 text-right text-[11px] font-normal text-[var(--c-muted)]">RRI</th>
                      <th class="w-[62px] px-2.5 pb-1 text-right text-[11px] font-normal text-[var(--c-muted)]">التقنين</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each sortedGovernorates as gov (gov.id)}
                      <tr>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 font-medium text-[var(--c-text-2)]">
                          {gov.nameAr}
                        </td>
                        <td class="border border-[var(--c-line)] bg-[var(--c-panel)] px-2 py-1.5 text-center">
                          <span class="inline-block border px-1.5 py-0.5 text-[11px] font-bold leading-none {tierClass(gov.tier)}">
                            {tierLabel(gov.tier)}
                          </span>
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold text-[var(--c-text)]">
                          {gov.prri}
                        </td>
                        <td dir="ltr" class="num border border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-1.5 text-right font-bold text-[var(--c-muted)]">
                          {gov.dailyBlackoutHours}<bdi dir="rtl">س</bdi>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </section>
            </div>
          {:else if card}
            {@const heroValue = animatedDelta || card.delta}
            <!-- Single headline card: fixed-height kicker + max-3-line headline zone keeps .hero top constant across cards -->
            {#key card.id}
              <article
                onpointerdown={onCardPointerDown}
                onpointerup={onCardPointerUp}
                class="flow-res-card headline-enter flex min-h-full cursor-pointer flex-col justify-between gap-3 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 text-start phone-l:min-h-0 phone-l:gap-1.5 phone-l:p-2.5 {isDesktop ? 'p-[var(--flow-pad-y)_var(--flow-pad-x)] gap-4' : 'sm:p-5'}"
              >
                <div class="flow-res-card-inner space-y-3 phone-l:space-y-1.5 {isDesktop ? 'space-y-4' : ''}">
                  <!-- Fixed-height top zone (kicker + max 3 lines serif headline) so hero never jumps vertically -->
                  <div class="flex flex-col gap-2 phone-l:gap-1">
                    <div class="flex items-center justify-between gap-2 font-medium text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11.5px]'}">
                      <span>{card.kicker}</span>
                      <span>العدد <span class="num">{completedTurn}</span></span>
                    </div>

                    <h3 class="flow-res-title line-clamp-3 max-w-[44ch] overflow-hidden font-display font-bold leading-[1.38] text-[var(--c-text)] phone-l:h-[46px] phone-l:text-[17px] {isDesktop ? 'h-[104px] text-[clamp(22px,1.75vw,30px)]' : 'h-[86px] text-[20px] sm:h-[96px] sm:text-[24px]'}">
                      {card.title}
                    </h3>
                  </div>

                  <!-- Hero figure ruled above and below (constant vertical top position across cards) -->
                  <div class="flow-res-hero-band flex flex-wrap items-baseline justify-end gap-x-3 gap-y-1 border-y border-[var(--c-line)] py-3 phone-l:py-1.5 {isDesktop ? 'py-4' : ''}" dir="ltr">
                    <b
                      style={heroSizeStyle(heroValue)}
                      class="num whitespace-nowrap font-bold leading-[1.12] {heroSizeClass(heroValue)} {heroToneClass(card.tone)}"
                    >
                      {heroValue}
                    </b>
                    {#if card.note}
                      <small class="num whitespace-nowrap font-bold text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-base)]' : 'text-[13.5px]'}">{card.note}</small>
                    {/if}
                  </div>

                  <p class="reading-text max-w-[65ch] text-start text-[var(--c-text-2)] phone-l:leading-[1.55] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.72]' : 'text-[13px] leading-[1.7]'}">
                    {card.body}
                  </p>
                </div>

                <div class="flow-res-card-foot flex items-center justify-between gap-2 border-t border-[var(--c-line)] pt-2.5 text-[var(--c-muted)] phone-l:pt-1.5 {isDesktop ? 'pt-3 text-[var(--flow-fs-xs)]' : 'text-[11px]'}">
                  <span>{card.source}</span>
                  <span>{isDesktop ? 'انقر أو استخدم ← → للتنقل' : 'اضغط أو اسحب للتالي'}</span>
                </div>
              </article>
            {/key}
          {/if}
        </div>
      </div>

      <!-- Bottom-only pinned navigation footer (Previous appears from card 2+) -->
      <footer class="flow-res-foot flex shrink-0 items-center gap-2 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] phone-l:py-2 {isDesktop ? 'justify-end gap-2.5 px-[var(--flow-pad-x)] py-3' : ''}">
        {#if !isLast}
          {#if isDesktop}
            <button
              type="button"
              onclick={skipToLedger}
              aria-label="تخطي إلى الملخص المالي"
              style="min-height: var(--flow-btn-h);"
              class="kit-btn sec shrink-0 gap-2 bg-transparent px-3.5 text-[var(--flow-fs-sm)] text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <span>{stage >= 1 ? 'للملخص' : 'تخطي إلى الملخص'}</span>
              <KbdHint keys="S" />
            </button>
            {#if stage >= 1}
              <button
                type="button"
                onclick={prev}
                style="min-height: var(--flow-btn-h);"
                class="kit-btn sec shrink-0 gap-2 bg-[var(--c-bg)] px-4 text-[var(--flow-fs-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                <span>السابق</span>
                <KbdHint keys="→" />
              </button>
            {/if}
            <button
              type="button"
              onclick={primaryAction}
              style="min-height: var(--flow-btn-pri-h);"
              class="btn-primary-chamfer pressable shrink-0 gap-2 px-6 text-[var(--flow-fs-base)] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <span>التالي</span>
              <KbdHint keys="← · Enter" tone="accent" />
            </button>
          {:else}
            {#if stage >= 1}
              <button
                type="button"
                onclick={prev}
                class="kit-btn sec min-h-12 shrink-0 bg-[var(--c-bg)] px-3.5 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-11"
              >
                السابق
              </button>
            {/if}
            <button
              type="button"
              onclick={skipToLedger}
              aria-label="تخطي إلى الملخص المالي"
              class="kit-btn sec min-h-12 shrink-0 bg-transparent px-3 text-[12.5px] text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-11"
            >
              {stage >= 1 ? 'للملخص' : 'تخطي إلى الملخص'}
            </button>
            <button
              type="button"
              onclick={primaryAction}
              class="btn-primary-chamfer pressable min-h-12 flex-1 px-4 text-[14px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-11"
            >
              التالي
            </button>
          {/if}
        {:else if isDesktop}
          {#if stage >= 1}
            <button
              type="button"
              onclick={prev}
              style="min-height: var(--flow-btn-h);"
              class="kit-btn sec shrink-0 gap-2 bg-[var(--c-bg)] px-4 text-[var(--flow-fs-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <span>السابق</span>
              <KbdHint keys="→" />
            </button>
          {/if}
          <button
            type="button"
            onclick={primaryAction}
            style="min-height: var(--flow-btn-pri-h);"
            class="btn-primary-chamfer pressable shrink-0 gap-2 px-6 text-[var(--flow-fs-base)] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
          >
            <span>متابعة المهام الرئاسية للدور الجديد</span>
            <KbdHint keys="Enter" tone="accent" />
          </button>
        {:else}
          {#if stage >= 1}
            <button
              type="button"
              onclick={prev}
              class="kit-btn sec min-h-12 shrink-0 bg-[var(--c-bg)] px-3.5 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-11"
            >
              السابق
            </button>
          {/if}
          <button
            type="button"
            onclick={primaryAction}
            class="btn-primary-chamfer pressable min-h-12 flex-1 px-3 text-[13.5px] font-bold sm:text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] phone-l:min-h-11"
          >
            متابعة المهام الرئاسية للدور الجديد
          </button>
        {/if}
      </footer>
    {/if}
  {:else}
    <div class="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-[var(--c-muted)]">
      لا يوجد تقرير إغلاق متاح لهذا الدور.
    </div>
  {/if}
</div>

<style>
  .kpi-tiles :global(.tile-delta) {
    text-align: right;
  }
  @media (max-height: 780px) {
    :global(.flow-desktop) .flow-res-head {
      padding-block: 7px;
    }
    :global(.flow-desktop) .flow-res-prog {
      padding-block: 4px;
    }
    :global(.flow-desktop) .flow-res-scroll {
      padding: 12px 18px;
    }
    :global(.flow-desktop) .flow-res-card {
      padding: 14px 18px;
      gap: 10px;
    }
    :global(.flow-desktop) .flow-res-card-inner {
      gap: 10px;
    }
    :global(.flow-desktop) .flow-res-title {
      height: 82px;
    }
    :global(.flow-desktop) .flow-res-hero-band {
      padding-block: 10px;
    }
    :global(.flow-desktop) .flow-res-card-foot {
      padding-top: 8px;
    }
    :global(.flow-desktop) .flow-res-foot {
      padding-block: 8px;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes stamp-pop {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes headline-slide {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .stamp-enter {
      animation: stamp-pop 0.16s ease-out both;
    }
    .headline-enter {
      animation: headline-slide 0.16s ease-out both;
    }
  }
</style>


