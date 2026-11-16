<script lang="ts">
  import ExtrasBar from '../shared/ExtrasBar.svelte';
  import { sortTopRuns } from '../../lib/records';
  import GameIcon from '../../lib/ui/GameIcon.svelte';
  import { fx } from '../../lib/ui/fx/feedback';
  import { getSeasonLabel } from './engine/engine';
  import { METER_IDS, type DossierState } from './engine/types';
  import { DOSSIER_ACHIEVEMENTS, dossierRecords } from './records/store';
  import { METER_META, pad2 } from './ui-helpers';

  let {
    savedState,
    onStartNew,
    onContinue,
    onOpenHowTo,
    onOpenRecords,
  }: {
    savedState: DossierState | null;
    onStartNew: () => void;
    onContinue: () => void;
    onOpenHowTo: () => void;
    onOpenRecords: () => void;
  } = $props();

  const unlockedStore = dossierRecords.unlocked;
  const runsStore = dossierRecords.runs;

  let unlockedCount = $derived(
    DOSSIER_ACHIEVEMENTS.reduce((acc, def) => acc + ($unlockedStore[def.id] ? 1 : 0), 0)
  );
  const totalCount = DOSSIER_ACHIEVEMENTS.length;

  let bestScore = $derived.by<number | null>(() => {
    const top = sortTopRuns($runsStore, 1);
    return top.length > 0 ? Math.round(top[0].score) : null;
  });
</script>

<ExtrasBar title="قرارات عاجلة" backHref="../index.html" backLabel="الألعاب">
  <div class="ms-auto flex items-center">
    <button
      type="button"
      aria-label="كيف تلعب"
      title="كيف تلعب"
      onclick={() => {
        fx('tap');
        onOpenHowTo();
      }}
      class="pressable flex h-full min-h-[44px] min-w-[48px] items-center justify-center border-s border-[var(--c-line)] px-3 text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
    >
      <GameIcon name="help" cls="h-4 w-4" />
    </button>
  </div>
</ExtrasBar>

<main class="dos-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-8">
  <div
    class="my-auto mx-auto flex w-full max-w-[520px] flex-col border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] p-5 sm:p-8"
  >
    <header class="flex flex-col gap-2 text-start">
      <span class="text-[12.5px] font-bold tracking-wide text-[var(--c-accent)] sm:text-[13.5px]">
        من عالم رئيس الجمهورية
      </span>
      <h1 class="font-display text-[34px] font-bold leading-[1.18] text-[var(--c-text)] sm:text-[44px]">
        قرارات عاجلة
      </h1>
      <p class="mt-1 text-[14.5px] leading-[1.65] text-[var(--c-muted)] sm:text-[16px]">
        أربعون دورًا على مكتب الرئاسة الانتقالية — كل ملف يفرض مفاضلة حقيقية بين الخزينة والثقة والأمن والسيادة.
      </p>
    </header>

    {#if savedState}
      <section
        aria-label="ملخص الولاية المحفوظة"
        class="mt-5 border border-[var(--c-line)] bg-[var(--c-strip)]"
      >
        <div class="flex items-center justify-between border-b border-[var(--c-line)] px-3 py-2 text-[12px] text-[var(--c-muted)]">
          <span>ولاية جارية محفوظة</span>
          <span class="num font-bold text-[var(--c-accent)]">
            الدور <bdi dir="ltr">{pad2(savedState.turn)}/40</bdi> · <bdi dir="ltr">{savedState.year}</bdi> · {getSeasonLabel(savedState.season)}
          </span>
        </div>
        <div class="grid grid-cols-4 divide-x divide-x-reverse divide-[var(--c-line)]">
          {#each METER_IDS as id (id)}
            <div class="flex flex-col items-start px-2.5 py-2">
              <span class="text-[11px] text-[var(--c-muted)]">{METER_META[id].label}</span>
              <bdi
                dir="ltr"
                class="num mt-0.5 text-[16px] font-bold {savedState.meters[id] <= 20
                  ? 'text-[var(--c-neg)]'
                  : 'text-[var(--c-text)]'}"
              >
                {savedState.meters[id]}
              </bdi>
            </div>
          {/each}
        </div>
      </section>
    {:else}
      <div class="mt-5 grid grid-cols-4 border border-[var(--c-line)] bg-[var(--c-strip)]">
        {#each METER_IDS as id (id)}
          <div class="flex flex-col items-center gap-1 border-s border-[var(--c-line)] first:border-s-0 px-2 py-2.5 text-center">
            <GameIcon name={METER_META[id].icon} cls="h-4 w-4 text-[var(--c-accent)]" />
            <span class="text-[11.5px] font-bold text-[var(--c-text-2)]">{METER_META[id].label}</span>
          </div>
        {/each}
      </div>
    {/if}

    <nav aria-label="إجراءات البداية" class="mt-6 flex flex-col gap-2.5">
      {#if savedState}
        <button
          type="button"
          onclick={onContinue}
          class="btn-primary-chamfer pressable flex min-h-[52px] w-full items-center justify-between gap-3 px-5 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
        >
          <span class="font-heading text-[16px] font-bold sm:text-[17px]">متابعة</span>
          <span class="num text-[13px] font-bold">
            الدور <bdi dir="ltr">{pad2(savedState.turn)}/40</bdi> · {getSeasonLabel(savedState.season)}
          </span>
        </button>

        <button
          type="button"
          onclick={onStartNew}
          class="kit-btn sec pressable min-h-[48px] w-full bg-[var(--c-strip)] px-4 text-[14.5px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
        >
          ابدأ ولاية جديدة
        </button>
      {:else}
        <button
          type="button"
          onclick={onStartNew}
          class="btn-primary-chamfer pressable flex min-h-[52px] w-full items-center justify-center px-5 font-heading text-[16.5px] font-bold sm:text-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
        >
          ابدأ الولاية
        </button>
      {/if}

      <button
        type="button"
        onclick={() => {
          fx('tap');
          onOpenRecords();
        }}
        class="kit-btn sec pressable flex min-h-[48px] w-full items-center justify-between gap-3 bg-[var(--c-strip)] px-4 text-[14.5px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
      >
        <span class="inline-flex items-center gap-2">
          <GameIcon name="crown-coin" cls="h-4 w-4 shrink-0 text-[var(--c-accent)]" />
          <span>الإنجازات</span>
        </span>
        <span class="num border border-[var(--c-line-strong)] bg-[var(--c-chip-bg)] px-1.5 py-0.5 text-[12px] font-bold text-[var(--c-accent)]">
          <bdi dir="ltr">{unlockedCount}/{totalCount}</bdi>
        </span>
      </button>

      {#if bestScore !== null}
        <p class="px-1 text-center text-[12px] font-bold text-[var(--c-muted)]">
          أفضل نتيجة: <bdi dir="ltr" class="num text-[var(--c-accent)]">{bestScore}</bdi>
        </p>
      {/if}

      <button
        type="button"
        onclick={() => {
          fx('tap');
          onOpenHowTo();
        }}
        class="kit-btn sec pressable min-h-[48px] w-full bg-[var(--c-strip)] px-4 text-[14.5px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
      >
        كيف تلعب
      </button>
    </nav>
  </div>
</main>

