<script lang="ts">
  import { onMount } from 'svelte';
  import GameIcon from '../../ui/GameIcon.svelte';
  import { focusTrap } from '../../ui/actions/focus-trap';
  import { fx } from '../../ui/fx/feedback';
  import { formatDatePartsAr } from '../format';
  import { sortTopRuns } from '../store';
  import type {
    AchievementDef,
    AchievementGroup,
    RecordsStore,
    RecordsTab,
  } from '../types';
  import TopRunsList from './TopRunsList.svelte';

  interface Props {
    defs: readonly AchievementDef[];
    store: RecordsStore;
    title?: string;
    initialTab?: RecordsTab;
    topLimit?: number;
    onClose: () => void;
  }

  let {
    defs,
    store,
    title = 'رئيس الجمهورية',
    initialTab = 'achievements',
    topLimit = 10,
    onClose,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let activeTab = $state<RecordsTab>(initialTab);

  $effect(() => {
    activeTab = initialTab;
  });

  const unlockedStore = $derived(store.unlocked);
  const runsStore = $derived(store.runs);
  const unlockedMap = $derived($unlockedStore);
  const rankedRuns = $derived(sortTopRuns($runsStore, topLimit));

  const unlockedCount = $derived(
    defs.reduce((acc, def) => acc + (unlockedMap[def.id] ? 1 : 0), 0)
  );
  const progressPct = $derived(
    defs.length > 0 ? Math.round((unlockedCount / defs.length) * 100) : 0
  );

  const GROUP_ORDER: { id: AchievementGroup; label: string; glyph: string }[] = [
    { id: 'ending', label: 'النهايات', glyph: 'scroll-quill' },
    { id: 'turns', label: 'الأدوار', glyph: 'hourglass' },
    { id: 'special', label: 'إنجازات خاصة', glyph: 'crown-coin' },
  ];

  const groupedDefs = $derived(
    GROUP_ORDER.map((g) => {
      const items = defs.filter((d) => d.group === g.id);
      const done = items.reduce((n, d) => n + (unlockedMap[d.id] ? 1 : 0), 0);
      return { ...g, items, done };
    }).filter((g) => g.items.length > 0)
  );

  function selectTab(tab: RecordsTab) {
    if (activeTab === tab) return;
    fx('select');
    activeTab = tab;
  }

  function handleClose() {
    fx('cancel');
    onClose();
  }

  function segmentBdi(text: string): { text: string; ltr: boolean }[] {
    const regex = /([0-9][0-9.,:%/$−+-]*)/g;
    const out: { text: string; ltr: boolean }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) out.push({ text: text.slice(last, m.index), ltr: false });
      out.push({ text: m[0], ltr: true });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last), ltr: false });
    return out;
  }

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
</script>

<div
  use:focusTrap
  dir="rtl"
  role="dialog"
  aria-modal="true"
  aria-label="الإنجازات وأفضل الجولات"
  class="fixed inset-0 z-[210] flex flex-col overflow-x-hidden bg-[var(--c-bg)] text-[var(--c-text)]"
>
  <header class="shrink-0 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-2.5 sm:px-6">
    <div class="mx-auto flex w-full max-w-[960px] items-center justify-between gap-3">
      <div class="min-w-0">
        <span class="block truncate font-heading text-[11px] font-bold text-[var(--c-accent)]">
          {title}
        </span>
        <h1 class="truncate font-display text-xl font-bold text-[var(--c-text)] sm:text-2xl">
          سجل الإنجازات والجولات
        </h1>
      </div>

      <button
        data-autofocus
        type="button"
        onclick={handleClose}
        aria-label="أغلق السجل"
        class="kit-btn sec min-h-[44px] min-w-[44px] shrink-0 gap-2 px-3 font-heading text-xs font-bold text-[var(--c-text-2)] hover:text-[var(--c-text)]"
      >
        <GameIcon name="cross-mark" cls="w-4 h-4 shrink-0" />
        <span class="hidden sm:inline">أغلق السجل</span>
      </button>
    </div>
  </header>

  <div class="shrink-0 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-4 sm:px-6">
    <div
      role="tablist"
      aria-label="أقسام السجل"
      class="mx-auto grid w-full max-w-[960px] grid-cols-2 gap-0"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'achievements'}
        onclick={() => selectTab('achievements')}
        class="pressable flex min-h-[46px] items-center justify-center gap-2 border-b-2 px-3 font-heading text-sm font-bold transition-colors {activeTab === 'achievements'
          ? 'border-[var(--c-accent)] bg-[var(--c-panel)] text-[var(--c-accent)]'
          : 'border-transparent text-[var(--c-muted)] hover:text-[var(--c-text)]'}"
      >
        <GameIcon name="crown-coin" cls="w-4 h-4 shrink-0" />
        <span>الإنجازات</span>
        <span class="num border border-[var(--c-line)] bg-[var(--c-chip-bg)] px-1.5 py-0.5 text-[11px] text-[var(--c-text-2)]">
          <bdi dir="ltr">{unlockedCount}/{defs.length}</bdi>
        </span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'runs'}
        onclick={() => selectTab('runs')}
        class="pressable flex min-h-[46px] items-center justify-center gap-2 border-b-2 px-3 font-heading text-sm font-bold transition-colors {activeTab === 'runs'
          ? 'border-[var(--c-accent)] bg-[var(--c-panel)] text-[var(--c-accent)]'
          : 'border-transparent text-[var(--c-muted)] hover:text-[var(--c-text)]'}"
      >
        <GameIcon name="podium" cls="w-4 h-4 shrink-0" />
        <span>أفضل الجولات</span>
        <span class="num border border-[var(--c-line)] bg-[var(--c-chip-bg)] px-1.5 py-0.5 text-[11px] text-[var(--c-text-2)]">
          <bdi dir="ltr">{rankedRuns.length}</bdi>
        </span>
      </button>
    </div>
  </div>

  <div class="scroll-area min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
    <div class="mx-auto w-full max-w-[960px] space-y-6 pb-8">
      {#if activeTab === 'achievements'}
        <section class="border border-[var(--c-line)] bg-[var(--c-panel)] p-3.5 sm:p-4">
          <div class="flex items-baseline justify-between gap-3">
            <span class="font-heading text-xs font-bold text-[var(--c-muted)]">
              التقدم الكلي
            </span>
            <span class="num font-heading text-lg font-bold text-[var(--c-text)] sm:text-xl">
              <bdi dir="ltr">{unlockedCount}</bdi> من <bdi dir="ltr">{defs.length}</bdi>
            </span>
          </div>
          <div class="mt-2.5 h-2 w-full border border-[var(--c-line)] bg-[var(--c-strip)]">
            <div
              class="h-full bg-[var(--c-accent)] transition-[width] duration-200"
              style="width: {progressPct}%;"
            ></div>
          </div>
        </section>

        {#if defs.length === 0}
          <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-10 text-center text-sm text-[var(--c-muted)]">
            لا توجد إنجازات معرّفة بعد
          </div>
        {:else}
          {#each groupedDefs as group (group.id)}
            <section class="space-y-2.5">
              <header class="flex items-center justify-between gap-2 border-b border-[var(--c-line)] pb-2">
                <h2 class="flex items-center gap-2 font-heading text-sm font-bold text-[var(--c-text)] sm:text-base">
                  <GameIcon name={group.glyph} cls="w-4 h-4 shrink-0 text-[var(--c-accent)]" />
                  <span>{group.label}</span>
                </h2>
                <span class="num text-xs font-bold text-[var(--c-muted)]">
                  <bdi dir="ltr">{group.done}/{group.items.length}</bdi>
                </span>
              </header>

              <div class="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {#each group.items as def (def.id)}
                  {@const entry = unlockedMap[def.id]}
                  {@const isUnlocked = Boolean(entry)}
                  {@const maskHidden = Boolean(def.hidden && !isUnlocked)}
                  {@const dateParts = entry ? formatDatePartsAr(entry.at) : null}
                  <article
                    class="flex items-start gap-3 border p-3 transition-colors {isUnlocked
                      ? 'border-[var(--c-line-strong)] bg-[var(--c-panel)]'
                      : 'border-[var(--c-line)] bg-[var(--c-strip)] opacity-75'}"
                  >
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center border {isUnlocked
                        ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)] text-[var(--c-accent)]'
                        : 'border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-muted)]'}"
                    >
                      {#if maskHidden}
                        <span class="font-display text-lg font-bold leading-none">؟</span>
                      {:else if isUnlocked}
                        <GameIcon name={def.glyph} cls="w-5 h-5" />
                      {:else}
                        <GameIcon name="lock" cls="w-4 h-4" />
                      {/if}
                    </div>

                    <div class="min-w-0 flex-1 space-y-1">
                      <div class="flex items-start justify-between gap-2">
                        <h3 class="font-heading text-sm font-bold leading-snug {isUnlocked ? 'text-[var(--c-text)]' : 'text-[var(--c-text-2)]'}">
                          {maskHidden ? 'إنجاز مخفي' : def.title}
                        </h3>
                        <div
                          class="mt-1 flex shrink-0 items-center gap-1"
                          aria-label="الصعوبة {def.difficulty} من 3"
                          title="الصعوبة {def.difficulty} من 3"
                        >
                          {#each [1, 2, 3] as lvl (lvl)}
                            <span
                              class="h-2 w-2 {lvl <= def.difficulty
                                ? isUnlocked
                                  ? 'bg-[var(--c-accent)]'
                                  : 'bg-[var(--c-muted)]'
                                : 'border border-[var(--c-line-strong)] bg-transparent'}"
                            ></span>
                          {/each}
                        </div>
                      </div>

                      <p class="text-xs leading-relaxed {isUnlocked ? 'text-[var(--c-text-2)]' : 'text-[var(--c-muted)]'}">
                        {#if maskHidden}
                          ؟
                        {:else}
                          {#each segmentBdi(def.description) as seg, i (i)}
                            {#if seg.ltr}<bdi dir="ltr" class="num">{seg.text}</bdi>{:else}{seg.text}{/if}
                          {/each}
                        {/if}
                      </p>

                      <div class="flex items-center gap-1.5 pt-0.5 text-[11px] text-[var(--c-muted)]">
                        {#if isUnlocked && dateParts}
                          <GameIcon name="check-mark" cls="w-3.5 h-3.5 shrink-0 text-[var(--c-pos)]" />
                          <span class="text-[var(--c-text-2)]">
                            <bdi dir="ltr" class="num">{dateParts.day}</bdi>
                            {dateParts.month}
                            <bdi dir="ltr" class="num">{dateParts.year}</bdi>
                          </span>
                        {:else}
                          <GameIcon name="lock" cls="w-3 h-3 shrink-0" />
                          <span>مقفل</span>
                        {/if}
                      </div>
                    </div>
                  </article>
                {/each}
              </div>
            </section>
          {/each}
        {/if}
      {:else}
        <TopRunsList runs={rankedRuns} />
      {/if}
    </div>
  </div>
</div>
