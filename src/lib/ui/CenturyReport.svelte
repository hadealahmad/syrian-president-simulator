<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { startNewGame } from '../stores/new-game';
  import { focusTrap } from './actions/focus-trap';
  import StatTile from './kit/StatTile.svelte';
  import GroupDivider from './kit/GroupDivider.svelte';
  import { shellLayout } from './shell/viewport';
  import { fx } from './fx/feedback';
  import KbdHint from './flow/KbdHint.svelte';
  import { hasModifierKey, isTypingTarget } from './flow/kbd';
  import './flow/flow-desktop.css';

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  let ending = $derived($gameStore.centuryEnding);
  let debtB = $derived(($gameStore.macro.sovereignDebtUSD / 1_000_000_000).toFixed(1));

  let playedVictoryFx = false;
  $effect(() => {
    if ($gameStore.isGameOver && ending) {
      if (!playedVictoryFx) {
        playedVictoryFx = true;
        fx('good');
      }
    } else {
      playedVictoryFx = false;
    }
  });

  function handleRestart(): void {
    fx('confirm');
    startNewGame(undefined, 'century_report');
  }

  function onCaptureKey(e: KeyboardEvent): void {
    if (!($gameStore.isGameOver && ending)) return;
    if ($uiStore.isSettingsOpen || $uiStore.isAboutOpen || $uiStore.isRestartModalOpen) return;
    if ((e.target as Element | null)?.closest?.('[data-focus-trap-exempt]')) return;

    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (hasModifierKey(e) || isTypingTarget(e.target)) return;

    if (e.key === 'Enter') {
      const targetEl = e.target as HTMLElement | null;
      const onOtherAction = targetEl?.closest('button:not([data-century-restart]), a');
      if (!onOtherAction) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleRestart();
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  });
</script>

{#if $gameStore.isGameOver && ending}
  <div
    class="pointer-events-auto fixed inset-0 z-50 flex select-none font-arabic {isDesktop
      ? 'flow-desktop items-center justify-center bg-[var(--c-bg)] p-6'
      : 'items-stretch justify-stretch bg-[var(--c-bg)] p-0'}"
  >
    <div
      use:focusTrap
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label="تقرير المئوية: مصير الجمهورية بعد 100 عام"
      class="century-enter relative flex flex-col overflow-hidden border-t-2 border-t-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)] {isDesktop
        ? 'max-h-[calc(100dvh-48px)] w-[min(var(--flow-stage-w,clamp(640px,46vw,880px)),calc(100vw-48px))] border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)]'
        : 'h-full w-full pt-[env(safe-area-inset-top)]'}"
    >
      <!-- Top kicker strip -->
      <header class="shrink-0 border-b border-[var(--c-line)] bg-[var(--c-panel)] {isDesktop ? 'px-[var(--flow-pad-x)] py-3' : 'px-5 py-2.5 sm:px-7 phone-l:py-2'}">
        <div class="flex flex-wrap items-center justify-between gap-2 {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
          <span class="font-bold text-[var(--c-accent)]">تقرير المئوية · مصير الجمهورية بعد مئة عام</span>
          <span class="border border-[var(--c-accent)] bg-[var(--c-bg)] px-2.5 py-0.5 font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11.5px]'}">
            الدرجة السيادية: <span class="num text-[var(--c-accent)]" dir="ltr">{ending.finalScore} / 100</span>
          </span>
        </div>
      </header>

      <!-- Scrollable report body -->
      <div class="scroll-area min-h-0 flex-1 overflow-y-auto {isDesktop ? 'px-[var(--flow-pad-x)] py-[var(--flow-pad-y)]' : 'px-5 py-5 sm:px-7 phone-l:py-3'}">
        <div class="space-y-1.5 text-start">
          <h1 class="font-display font-bold leading-[1.35] text-[var(--c-text)] {isDesktop ? 'text-[clamp(26px,2.2vw,40px)]' : 'text-[clamp(24px,4vw,36px)] phone-l:text-[22px]'}">
            {ending.titleAr}
          </h1>
          <h2 class="font-heading font-medium text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[14px]'}">
            {ending.subtitleAr}
          </h2>
        </div>

        <!-- Compact key stats tiles: 1 row of 4 on desktop -->
        <div class="kpi-tiles mt-4 grid gap-2 phone-l:mt-3 {isDesktop ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}">
          <StatTile
            label="الثقة الشعبية"
            value="{Math.round($gameStore.macro.civicTrust)}%"
            valueTone="pos"
          />
          <StatTile
            label="الرافعة السيادية"
            value="{Math.round($gameStore.macro.sovereignLeverage)}%"
            valueTone="accent"
          />
          <StatTile
            label="الفساد"
            value="{Math.round($gameStore.macro.systemicCorruption)}%"
            valueTone={$gameStore.macro.systemicCorruption <= 40 ? 'pos' : 'neg'}
          />
          <StatTile
            label="الدين العام"
            value="${debtB}B"
          />
        </div>

        <!-- Ruled historical retrospective narrative -->
        <div class="mt-5 space-y-5 text-start text-[var(--c-text)] phone-l:mt-3.5 phone-l:space-y-3.5">
          <section class="space-y-2">
            <GroupDivider label="المسار التنموي والمؤسسي العام" />
            <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.78]' : 'text-[13.5px] leading-[1.75]'}">
              {ending.reportAr}
            </p>
          </section>

          <section class="space-y-2 border-s-2 border-s-[var(--c-pos)] ps-3.5">
            <GroupDivider label="مسار الجبهة الجنوبية واستقرار الحدود" />
            <h3 class="font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[14px]'}">
              {ending.southernTitleAr}
            </h3>
            <p class="reading-text max-w-[65ch] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.78]' : 'text-[13.5px] leading-[1.75]'}">
              {ending.southernReportAr}
            </p>
          </section>
        </div>
      </div>

      <!-- Pinned bottom primary action -->
      <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] {isDesktop
        ? 'flex justify-end px-[var(--flow-pad-x)] py-3'
        : 'px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:px-7 phone-l:py-2'}">
        <button
          data-autofocus
          data-century-restart
          type="button"
          onclick={handleRestart}
          style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
          class="btn-primary-chamfer pressable flex gap-2 items-center justify-center px-7 py-2.5 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)] {isDesktop
            ? 'w-auto text-[var(--flow-fs-base)]'
            : 'min-h-12 w-full text-[14px] sm:w-auto phone-l:min-h-11'}"
        >
          <span>بدء عهد رئاسي جديد</span>
          <KbdHint keys="Enter" tone="accent" />
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .kpi-tiles :global(.tile-delta) {
    text-align: right;
  }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes century-pop-in {
      0% { opacity: 0; transform: translateY(6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .century-enter {
      animation: century-pop-in 0.2s ease-out both;
    }
  }
</style>

