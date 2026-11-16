<script lang="ts">
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import { ACTS, CATEGORIES, TEAMS, type CategoryId } from '../engine';
  import {
    continueSavedRun,
    howToOpen,
    metaStore,
    openTeamSelect,
    runStore,
    settingsOpen,
  } from '../stores';
  import Glyph from './Glyph.svelte';

  const CAT_IDS: CategoryId[] = ['energy', 'food', 'security', 'money', 'society'];

  const savedRun = $derived($runStore && $runStore.screen !== 'ended' ? $runStore : null);
  const meta = $derived($metaStore);
</script>

<div
  class="flex min-h-0 flex-1 flex-col overflow-hidden border-t-2 border-t-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-text)] select-none lg:flex-row"
>
  <!-- Start-side command curtain -->
  <section
    class="scroll-area flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-5 py-6 sm:px-8 lg:w-[clamp(390px,32vw,490px)] lg:flex-none lg:border-e lg:border-[var(--c-line-strong)] lg:px-9 lg:py-8"
  >
    <div class="my-auto flex flex-col gap-5">
      <header class="space-y-2 text-start">
        <span class="block text-[12px] font-bold tracking-wide text-[var(--c-accent)] lg:text-[13px]">
          من عالم رئيس الجمهورية
        </span>
        <h1
          class="font-display text-[clamp(32px,7.5vw,46px)] font-bold leading-[1.2] text-[var(--c-text)]"
        >
          غرفة الأزمات
        </h1>
        <p class="text-[14px] leading-[1.6] text-[var(--c-text-2)] lg:text-[15px]">
          قُد فرق الطوارئ عبر أربع جبهات، واقرأ الموجة المقبلة لحسم ميزان الاستقرار.
        </p>
      </header>

      {#if savedRun}
        <div class="border border-[var(--c-line-strong)] bg-[var(--c-panel)] p-3">
          <div class="flex items-center justify-between gap-2 text-[11px] text-[var(--c-muted)]">
            <span class="font-bold text-[var(--c-accent)]">جولة جارية محفوظة</span>
            <span>{TEAMS[savedRun.teamId].name}</span>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-3 border-t border-[var(--c-line)] pt-2 text-[12px]">
            <span class="font-bold text-[var(--c-text)]">
              الفصل <span class="num"><bdi dir="ltr">{savedRun.act}</bdi></span> · {ACTS[savedRun.act].name}
            </span>
            <span class="inline-flex items-center gap-1 text-[var(--c-text-2)]">
              <Glyph name="life" cls="h-3.5 w-3.5 text-[var(--c-neg)]" />
              <span class="num font-bold"><bdi dir="ltr">{savedRun.lives}/{savedRun.maxLives}</bdi></span>
            </span>
            <span class="inline-flex items-center gap-1 text-[var(--c-text-2)]">
              <Glyph name="grants" cls="h-3.5 w-3.5 text-[var(--c-accent)]" />
              <span class="num font-bold"><bdi dir="ltr">{savedRun.grants}</bdi></span>
            </span>
            <span class="inline-flex items-center gap-1 text-[var(--c-text-2)]">
              <Glyph name="deck" cls="h-3.5 w-3.5 text-[var(--c-muted)]" />
              <span class="num font-bold"><bdi dir="ltr">{savedRun.deck.length}</bdi></span>
            </span>
          </div>
        </div>
      {/if}

      <!-- Primary & Secondary Actions -->
      <div class="flex flex-col gap-2.5">
        {#if savedRun}
          <button
            type="button"
            onclick={continueSavedRun}
            class="btn-primary-chamfer pressable flex min-h-[48px] w-full items-center justify-center px-5 py-3 text-[16px] font-bold"
          >
            تابع الجولة
          </button>
          <button
            type="button"
            onclick={openTeamSelect}
            class="kit-btn sec pressable flex min-h-[44px] w-full items-center justify-center px-4 py-2.5 text-[14px] font-bold"
          >
            ابدأ جولة جديدة
          </button>
        {:else}
          <button
            type="button"
            onclick={openTeamSelect}
            class="btn-primary-chamfer pressable flex min-h-[48px] w-full items-center justify-center px-5 py-3 text-[16px] font-bold"
          >
            ابدأ جولة جديدة
          </button>
        {/if}

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            onclick={() => {
              fx('tap');
              howToOpen.set(true);
            }}
            class="kit-btn sec pressable flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 text-[13px] font-bold"
          >
            <GameIcon name="help" cls="h-4 w-4 text-[var(--c-muted)]" />
            <span>كيف تلعب</span>
          </button>
          <button
            type="button"
            onclick={() => {
              fx('tap');
              settingsOpen.set(true);
            }}
            class="kit-btn sec pressable flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 text-[13px] font-bold"
          >
            <GameIcon name="gear" cls="h-4 w-4 text-[var(--c-muted)]" />
            <span>الإعدادات</span>
          </button>
        </div>

        <a
          href="../index.html"
          class="kit-btn sec pressable flex min-h-[44px] w-full items-center justify-center px-4 py-2 text-[13px] font-medium text-[var(--c-text-2)] no-underline"
        >
          ارجع إلى الألعاب الجانبية
        </a>
      </div>
    </div>

    <!-- Compact mobile record footer -->
    <footer
      class="mt-5 flex items-center justify-between border-t border-[var(--c-line)] pt-3 text-[11px] text-[var(--c-muted)] lg:hidden"
    >
      <span>
        الجولات: <strong class="num text-[var(--c-text-2)]"><bdi dir="ltr">{meta.runsPlayed}</bdi></strong>
      </span>
      <span>
        الانتصارات: <strong class="num text-[var(--c-pos)]"><bdi dir="ltr">{meta.runsWon}</bdi></strong>
      </span>
      <span>
        الفرق المفتوحة: <strong class="num text-[var(--c-text-2)]"><bdi dir="ltr">{meta.unlockedTeams.length}/3</bdi></strong>
      </span>
    </footer>
  </section>

  <!-- Desktop tactical briefing board -->
  <aside
    class="hidden min-h-0 flex-1 flex-col justify-between bg-[var(--c-strip)]/45 p-10 lg:flex"
  >
    <div class="my-auto mx-auto w-full max-w-[680px] space-y-6">
      <div class="border border-[var(--c-line-strong)] bg-[var(--c-panel)] p-6">
        <div class="flex items-center justify-between border-b border-[var(--c-line)] pb-3">
          <span class="text-[12px] font-bold text-[var(--c-accent)]">لوحة الجبهات الخمس</span>
          <span class="text-[12px] text-[var(--c-muted)]">تطابق الفئة يمنح <bdi dir="ltr">+1</bdi> قوة</span>
        </div>

        <div class="mt-4 grid grid-cols-5 gap-3">
          {#each CAT_IDS as catId (catId)}
            {@const cat = CATEGORIES[catId]}
            <div
              data-cat={catId}
              class="flex flex-col items-center gap-2 border border-[var(--c-line)] border-t-[3px] border-t-[var(--cat-color)] bg-[var(--c-bg)] px-3 py-4"
            >
              <Glyph name={cat.glyph} cls="h-7 w-7 text-[var(--cat-color)]" />
              <span class="text-[13px] font-bold text-[var(--c-text)]">{cat.name}</span>
            </div>
          {/each}
        </div>

        <!-- Schematic stability bar -->
        <div class="mt-6 border border-[var(--c-line)] bg-[var(--c-bg)] p-4">
          <div class="flex items-center justify-between text-[12px] font-bold">
            <span class="text-[var(--c-neg)]">انهيار <bdi dir="ltr">−5</bdi></span>
            <span class="text-[var(--c-muted)]">ميزان الاستقرار</span>
            <span class="text-[var(--c-pos)]">انفراج <bdi dir="ltr">+5</bdi></span>
          </div>
          <div class="relative mt-2.5 flex h-3 w-full border border-[var(--c-line-strong)] bg-[var(--c-strip)]">
            <div class="h-full w-1/5 bg-[var(--c-neg)]/30"></div>
            <div class="h-full flex-1"></div>
            <div class="h-full w-1/5 bg-[var(--c-pos)]/30"></div>
            <div class="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-[var(--c-text)]"></div>
          </div>
        </div>
      </div>

      <!-- Meta stats row -->
      <div class="grid grid-cols-4 gap-3">
        <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3">
          <div class="text-[11px] text-[var(--c-muted)]">الجولات الملعوبة</div>
          <div class="num mt-1 text-[22px] font-bold text-[var(--c-text)]">
            <bdi dir="ltr">{meta.runsPlayed}</bdi>
          </div>
        </div>
        <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3">
          <div class="text-[11px] text-[var(--c-muted)]">الأعوام المحسومة</div>
          <div class="num mt-1 text-[22px] font-bold text-[var(--c-pos)]">
            <bdi dir="ltr">{meta.runsWon}</bdi>
          </div>
        </div>
        <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3">
          <div class="text-[11px] text-[var(--c-muted)]">أبعد فصل</div>
          <div class="mt-1 text-[18px] font-bold text-[var(--c-text)]">
            {ACTS[meta.highestActReached].name}
          </div>
        </div>
        <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3">
          <div class="text-[11px] text-[var(--c-muted)]">الفرق المفتوحة</div>
          <div class="num mt-1 text-[22px] font-bold text-[var(--c-accent)]">
            <bdi dir="ltr">{meta.unlockedTeams.length}/3</bdi>
          </div>
        </div>
      </div>
    </div>
  </aside>
</div>
