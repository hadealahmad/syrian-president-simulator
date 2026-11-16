<script lang="ts">
  import { onMount } from 'svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import { TEAMS, type RunState } from '../engine';
  import { openTeamSelect, openTitleScreen, runStore } from '../stores';
  import Glyph from './Glyph.svelte';

  let { run }: { run: RunState } = $props();

  const summary = $derived(
    run.summary ?? {
      won: false,
      kicker: 'نهاية الجولة',
      title: 'سقطت الحكومة',
      paragraph: 'تفاقمت الأزمات على الجبهات الأربع قبل استعادة التوازن.',
      actsCleared: run.actsCleared,
      battlesWon: run.battlesWon,
      deckSize: run.deck.length,
      grantsEarned: run.totalGrantsEarned,
    },
  );

  onMount(() => {
    fx(summary.won ? 'good' : 'bad');
  });

  function handleNewRun(): void {
    runStore.set(null);
    openTeamSelect();
  }

  function handleBackToTitle(): void {
    fx('tap');
    runStore.set(null);
    openTitleScreen();
  }
</script>

<div
  class="flex min-h-0 flex-1 items-stretch justify-center overflow-hidden bg-[var(--c-bg)] select-none lg:items-center lg:p-8"
>
  <div
    class="flex w-full flex-col overflow-hidden bg-[var(--c-bg)] text-[var(--c-text)] border-t-2 {summary.won
      ? 'border-t-[var(--c-pos)] lg:border lg:border-[var(--c-pos)] lg:border-t-2'
      : 'border-t-[var(--c-neg)] lg:border lg:border-[var(--c-neg)] lg:border-t-2'} lg:max-h-[calc(100dvh-64px)] lg:max-w-[760px]"
  >
    <!-- Kicker Band -->
    <header
      class="shrink-0 border-b border-[var(--c-line)] px-5 py-3 sm:px-7 {summary.won
        ? 'bg-[var(--c-panel)] text-[var(--c-pos)]'
        : 'bg-[var(--c-ev-bg)] text-[var(--c-neg)]'}"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 text-[12px] font-bold lg:text-[13px]">
        <span>{summary.kicker}</span>
        <span class="font-medium text-[var(--c-muted)]">{TEAMS[run.teamId].name}</span>
      </div>
    </header>

    <!-- Scrollable Body -->
    <div class="scroll-area min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7 lg:py-7">
      <div class="space-y-2 text-start">
        <h1
          class="font-display text-[clamp(26px,6vw,38px)] font-bold leading-[1.3] text-[var(--c-text)]"
        >
          {summary.title}
        </h1>
        <p class="text-[15px] leading-[1.65] text-[var(--c-text-2)] lg:text-[16px]">
          {summary.paragraph}
        </p>
      </div>

      <!-- 4 KPI Ruled Tiles -->
      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div class="border border-[var(--c-line-strong)] bg-[var(--c-panel)] px-3.5 py-3">
          <div class="flex items-center justify-between text-[11px] text-[var(--c-muted)]">
            <span>الفصول المنجزة</span>
            <Glyph name="node-boss" cls="h-3.5 w-3.5 text-[var(--c-muted)]" />
          </div>
          <div class="num mt-1.5 text-[22px] font-bold text-[var(--c-text)]">
            <bdi dir="ltr">{summary.actsCleared}/3</bdi>
          </div>
        </div>

        <div class="border border-[var(--c-line-strong)] bg-[var(--c-panel)] px-3.5 py-3">
          <div class="flex items-center justify-between text-[11px] text-[var(--c-muted)]">
            <span>المعارك المحسومة</span>
            <Glyph name="power" cls="h-3.5 w-3.5 text-[var(--c-pos)]" />
          </div>
          <div class="num mt-1.5 text-[22px] font-bold text-[var(--c-pos)]">
            <bdi dir="ltr">{summary.battlesWon}</bdi>
          </div>
        </div>

        <div class="border border-[var(--c-line-strong)] bg-[var(--c-panel)] px-3.5 py-3">
          <div class="flex items-center justify-between text-[11px] text-[var(--c-muted)]">
            <span>حجم الإضبارة</span>
            <Glyph name="deck" cls="h-3.5 w-3.5 text-[var(--c-muted)]" />
          </div>
          <div class="num mt-1.5 text-[22px] font-bold text-[var(--c-text)]">
            <bdi dir="ltr">{summary.deckSize}</bdi>
          </div>
        </div>

        <div class="border border-[var(--c-line-strong)] bg-[var(--c-panel)] px-3.5 py-3">
          <div class="flex items-center justify-between text-[11px] text-[var(--c-muted)]">
            <span>المنح المكتسبة</span>
            <Glyph name="grants" cls="h-3.5 w-3.5 text-[var(--c-accent)]" />
          </div>
          <div class="num mt-1.5 text-[22px] font-bold text-[var(--c-accent)]">
            <bdi dir="ltr">{summary.grantsEarned}</bdi>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <footer
      class="shrink-0 border-t border-[var(--c-line-strong)] bg-[var(--c-strip)] px-5 py-3.5 sm:px-7"
    >
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <button
          type="button"
          onclick={handleNewRun}
          class="btn-primary-chamfer pressable flex min-h-[48px] flex-1 items-center justify-center px-6 py-2.5 text-[15px] font-bold"
        >
          ابدأ جولة جديدة
        </button>

        <div class="flex gap-2">
          <button
            type="button"
            onclick={handleBackToTitle}
            class="kit-btn sec pressable flex min-h-[48px] flex-1 items-center justify-center px-4 py-2.5 text-[14px] font-bold sm:flex-none"
          >
            افتح العنوان
          </button>
          <a
            href="../index.html"
            class="kit-btn sec pressable flex min-h-[48px] flex-1 items-center justify-center px-5 py-2.5 text-[14px] font-bold no-underline sm:flex-none"
          >
            الألعاب
          </a>
        </div>
      </div>
    </footer>
  </div>
</div>
