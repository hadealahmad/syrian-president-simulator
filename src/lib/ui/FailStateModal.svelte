<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { startNewGame } from '../stores/new-game';
  import { focusTrap } from './actions/focus-trap';
  import StatTile from './kit/StatTile.svelte';
  import { MAX_TURNS } from '../engine/constants';
  import { shellLayout } from './shell/viewport';
  import { fx } from './fx/feedback';
  import KbdHint from './flow/KbdHint.svelte';
  import { hasModifierKey, isTypingTarget } from './flow/kbd';
  import './flow/flow-desktop.css';
  import GameIcon from './GameIcon.svelte';
  import { sortTopRuns } from '../records';
  import { mainRecords } from '../stores/main-records';

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  let failState = $derived($gameStore.failState);
  let playedTurn = $derived(Math.min($gameStore.turnNumber, MAX_TURNS));

  const runsListStore = mainRecords.runs;
  let currentRunRank = $derived.by(() => {
    const runId = $gameStore.runMeta?.runId;
    if (!runId) return null;
    const idx = sortTopRuns($runsListStore, 10).findIndex((r) => r.id === runId);
    return idx >= 0 ? idx + 1 : null;
  });

  let reservesM = $derived(($gameStore.macro.reservesUSD / 1_000_000).toFixed(1));
  let treasuryB = $derived(($gameStore.macro.treasurySYP / 1_000_000_000).toFixed(2));

  let playedFailFx = false;
  $effect(() => {
    if ($gameStore.isGameOver && failState) {
      if (!playedFailFx) {
        playedFailFx = true;
        fx('bad');
      }
    } else {
      playedFailFx = false;
    }
  });

  function handleRestart(): void {
    fx('confirm');
    startNewGame(undefined, 'fail_screen');
  }

  function handleOpenRuns(): void {
    fx('tap');
    uiStore.openRecords('runs');
  }

  function onCaptureKey(e: KeyboardEvent): void {
    if (!($gameStore.isGameOver && failState)) return;
    if (
      $uiStore.isSettingsOpen ||
      $uiStore.isAboutOpen ||
      $uiStore.isRecordsOpen ||
      $uiStore.isRestartModalOpen
    ) {
      return;
    }
    if ((e.target as Element | null)?.closest?.('[data-focus-trap-exempt]')) return;

    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (hasModifierKey(e) || isTypingTarget(e.target)) return;

    if (e.key === 'Enter') {
      const targetEl = e.target as HTMLElement | null;
      const onOtherAction = targetEl?.closest('button:not([data-fail-restart]), a');
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

{#if $gameStore.isGameOver && failState}
  <div
    class="pointer-events-auto fixed inset-0 z-[80] flex select-none font-arabic {isDesktop
      ? 'flow-desktop items-center justify-center bg-[var(--c-bg)] p-6'
      : 'items-stretch justify-stretch bg-[var(--c-bg)] p-0'}"
  >
    <div
      use:focusTrap
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label="نهاية المحاكاة — انهيار سيادي"
      class="fail-slam relative flex flex-col overflow-hidden bg-[var(--c-bg)] text-[var(--c-text)] border-t-2 border-t-[var(--c-neg)] {isDesktop
        ? 'max-h-[calc(100dvh-48px)] w-[min(var(--flow-stage-w,clamp(640px,46vw,880px)),calc(100vw-48px))] border border-[var(--c-neg)] border-t-2 border-t-[var(--c-neg)]'
        : 'h-full w-full pt-[env(safe-area-inset-top)]'}"
    >
      <!-- Dark-red kicker band -->
      <header class="shrink-0 border-b border-[var(--c-line)] bg-[var(--c-ev-bg)] {isDesktop ? 'px-[var(--flow-pad-x)] py-3' : 'px-5 py-2.5 sm:px-7 phone-l:py-2'}">
        <div class="flex flex-wrap items-center justify-between gap-2 font-bold text-[var(--c-neg)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
          <span>نهاية المحاكاة · انهيار سيادي</span>
          <span class="num font-medium text-[var(--c-muted)]">
            الدور <bdi dir="ltr">{String(playedTurn).padStart(2, '0')}</bdi> · <bdi dir="ltr">{$gameStore.calendarYear}</bdi>
          </span>
        </div>
      </header>

      <!-- Scrollable content area -->
      <div class="scroll-area scroll-umber min-h-0 flex-1 overflow-y-auto {isDesktop ? 'px-[var(--flow-pad-x)] py-[var(--flow-pad-y)]' : 'px-5 py-5 sm:px-7 phone-l:py-3'}">
        <div class="space-y-1.5 text-start">
          <h2 class="font-display font-bold leading-[1.35] text-[var(--c-text)] {isDesktop ? 'text-[clamp(26px,2.2vw,40px)]' : 'text-[clamp(24px,4vw,34px)] phone-l:text-[22px]'}">
            {failState.titleAr}
          </h2>
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="num block text-[var(--c-muted)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
              سقطت الدولة في الدور <bdi dir="ltr">{playedTurn}</bdi> (<bdi dir="ltr">{$gameStore.calendarYear}</bdi>)
            </span>
            {#if currentRunRank !== null}
              <span class="inline-flex items-center gap-1.5 border border-[var(--c-accent)] bg-[var(--c-chip-bg)] px-2 py-0.5 font-heading text-xs font-bold text-[var(--c-accent)]">
                <GameIcon name="podium" cls="w-3.5 h-3.5 shrink-0" />
                <span>جولة رقم <bdi dir="ltr" class="num">{currentRunRank}</bdi> في أفضل جولاتك</span>
              </span>
            {/if}
          </div>
        </div>

        <!-- Ruled key stats tiles: 1 row of 4 on desktop -->
        <div class="kpi-tiles mt-4 grid gap-2 phone-l:mt-3 {isDesktop ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}">
          <StatTile
            label="الدور الأخير"
            value={String(playedTurn).padStart(2, '0')}
            delta={String($gameStore.calendarYear)}
          />
          <StatTile
            label="الاحتياطي"
            value="${reservesM}M"
            valueTone="accent"
            delta="نقد أجنبي"
          />
          <StatTile
            label="الخزينة"
            value="{treasuryB}B"
            valueTone={$gameStore.macro.treasurySYP < 0 ? 'neg' : 'default'}
            delta="ليرة سورية"
          />
          <StatTile
            label="الاحتقان"
            value="{$gameStore.macro.nationalRRI}/100"
            valueTone="neg"
            delta="المؤشر العام"
          />
        </div>

        {#if failState.narrativeAr}
          <div class="mt-4 border-y border-[var(--c-line)] py-4 phone-l:mt-3 phone-l:py-3">
            <p class="reading-text max-w-[65ch] text-start text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-base)] leading-[1.78]' : 'text-[13.5px] leading-[1.75]'}">
              {failState.narrativeAr}
            </p>
          </div>
        {/if}
      </div>

      <!-- Pinned bottom actions -->
      <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] {isDesktop
        ? 'flex items-center justify-between gap-3 px-[var(--flow-pad-x)] py-3'
        : 'flex flex-col gap-2 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-7 phone-l:py-2'}">
        <button
          type="button"
          onclick={handleOpenRuns}
          style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
          class="kit-btn sec flex min-h-11 items-center justify-center gap-2 bg-[var(--c-bg)] px-5 font-heading font-bold {isDesktop
            ? 'w-auto text-[var(--flow-fs-sm)]'
            : 'w-full text-[13.5px] sm:w-auto'}"
        >
          <GameIcon name="podium" cls="w-4 h-4 shrink-0 text-[var(--c-accent)]" />
          <span>سجل الجولات</span>
        </button>

        <button
          data-autofocus
          data-fail-restart
          type="button"
          onclick={handleRestart}
          style={isDesktop ? 'min-height: var(--flow-btn-pri-h);' : ''}
          class="btn-primary-chamfer pressable flex gap-2 items-center justify-center bg-[var(--c-neg)] px-7 py-2.5 font-bold text-[var(--c-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)] {isDesktop
            ? 'w-auto text-[var(--flow-fs-base)]'
            : 'min-h-12 w-full text-[14px] sm:w-auto phone-l:min-h-11'}"
        >
          <span>إعادة المحاولة من البداية</span>
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
    @keyframes fail-slam-in {
      0% { opacity: 0; transform: translateY(-6px); }
      100% { opacity: 1; transform: none; }
    }
    .fail-slam {
      animation: fail-slam-in 0.2s ease-out both;
    }
  }
</style>

