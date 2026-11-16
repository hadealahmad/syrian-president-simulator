<script lang="ts">
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import ExtrasBar from '../../shared/ExtrasBar.svelte';
  import { ACTS, MODIFIERS, type ModifierId, type RunState } from '../engine';
  import { deckSheetMode, howToOpen, openTitleScreen, settingsOpen } from '../stores';
  import Glyph from './Glyph.svelte';

  let {
    run,
    subtitle = '',
    modifierId,
    showSubStrip = true,
  }: {
    run: RunState;
    subtitle?: string;
    modifierId?: ModifierId;
    showSubStrip?: boolean;
  } = $props();

  const actMeta = $derived(ACTS[run.act]);
  const modMeta = $derived(modifierId ? MODIFIERS[modifierId] : undefined);
</script>

<ExtrasBar title="غرفة الأزمات" backLabel="القائمة" onBack={() => { fx('tap'); openTitleScreen(); }}>
  <div class="flex min-w-0 flex-1 items-stretch justify-end divide-x divide-x-reverse divide-[var(--c-line)]">
    <!-- Lives (الثقة) -->
    <div
      class="flex items-center gap-1 px-2 sm:px-3"
      title={`الثقة: ${run.lives} من ${run.maxLives}`}
      aria-label={`الثقة ${run.lives} من ${run.maxLives}`}
    >
      {#each Array.from({ length: run.maxLives }) as _, idx (idx)}
        <Glyph
          name="life"
          cls="h-3.5 w-3.5 sm:h-4 sm:w-4 {idx < run.lives
            ? 'text-[var(--c-pos)]'
            : 'text-[var(--c-line-strong)] opacity-45'}"
        />
      {/each}
    </div>

    <!-- Grants (المنح) -->
    <div
      class="flex items-center gap-1 px-2 sm:px-3"
      title="المنح المتاحة"
      aria-label={`المنح ${run.grants}`}
    >
      <Glyph name="grants" cls="h-3.5 w-3.5 text-[var(--c-accent)] sm:h-4 sm:w-4" />
      <span class="num text-[14px] font-bold text-[var(--c-text)] sm:text-[15px]">
        <bdi dir="ltr">{run.grants}</bdi>
      </span>
    </div>

    <!-- Deck viewer button (>= 44x44 touch target) -->
    <button
      type="button"
      onclick={() => {
        fx('tap');
        deckSheetMode.set('deck');
      }}
      class="pressable flex min-h-[44px] min-w-[48px] items-center justify-center gap-1 px-2.5 text-[var(--c-text-2)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
      title="اعرض بطاقات الإضبارة"
      aria-label={`الإضبارة ${run.deck.length} بطاقات`}
    >
      <Glyph name="deck" cls="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span class="num text-[13px] font-bold sm:text-[14px]">
        <bdi dir="ltr">{run.deck.length}</bdi>
      </span>
    </button>
  </div>
</ExtrasBar>

{#if showSubStrip}
  <div
    class="flex min-h-[44px] shrink-0 items-stretch justify-between border-b border-[var(--c-line)] bg-[var(--c-panel)] ps-3"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden py-1">
      <span class="truncate text-[12px] font-bold text-[var(--c-text)] sm:text-[13px]">
        الفصل <bdi dir="ltr">{run.act}</bdi>: {actMeta.name}
        {#if subtitle}
          <span class="text-[var(--c-muted)]"> · </span>
          <span class="text-[var(--c-text-2)]">{subtitle}</span>
        {/if}
      </span>

      {#if modMeta}
        <span
          class="game-chip shrink-0 border-[var(--c-line-strong)] text-[var(--c-text-2)]"
          title={modMeta.description}
        >
          <Glyph name={modMeta.glyph} cls="h-3 w-3 text-[var(--c-accent)]" />
          <span>{modMeta.name}</span>
        </span>
      {/if}
    </div>

    <div class="flex shrink-0 items-stretch">
      <button
        type="button"
        onclick={() => {
          fx('tap');
          howToOpen.set(true);
        }}
        aria-label="كيف تلعب"
        title="كيف تلعب"
        class="pressable flex min-h-[44px] min-w-[44px] items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:bg-[var(--c-chip-bg)] hover:text-[var(--c-text)]"
      >
        <GameIcon name="help" cls="h-4 w-4" />
      </button>
      <button
        type="button"
        onclick={() => {
          fx('tap');
          settingsOpen.set(true);
        }}
        aria-label="الإعدادات"
        title="الإعدادات"
        class="pressable flex min-h-[44px] min-w-[44px] items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:bg-[var(--c-chip-bg)] hover:text-[var(--c-text)]"
      >
        <GameIcon name="gear" cls="h-4 w-4" />
      </button>
    </div>
  </div>
{/if}
