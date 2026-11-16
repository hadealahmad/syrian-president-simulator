<script lang="ts">
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import { getCardDef, type DeckCard } from '../engine';
  import { cardDetailTarget, deckSheetMode, runStore } from '../stores';
  import Card from './Card.svelte';

  let mode = $derived($deckSheetMode);
  let run = $derived($runStore);

  function close(): void {
    fx('cancel');
    deckSheetMode.set(null);
  }

  const displayedCards = $derived.by((): DeckCard[] => {
    if (!run || !mode) return [];
    let list: DeckCard[] = [];
    if (mode === 'deck') list = [...run.deck];
    else if (mode === 'draw' && run.battle) list = [...run.battle.drawPile];
    else if (mode === 'discard' && run.battle) list = [...run.battle.discardPile];

    return list.sort((a, b) => {
      const da = getCardDef(a.defId);
      const db = getCardDef(b.defId);
      return da.cost - db.cost || da.name.localeCompare(db.name, 'ar');
    });
  });

  const titleText = $derived(
    mode === 'draw'
      ? 'كومة السحب (مرتبة بالكلفة)'
      : mode === 'discard'
        ? 'كومة المستبعد'
        : 'بطاقات الإضبارة',
  );
</script>

{#if mode && run}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
    class="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-0 sm:p-6"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titleText}
      class="flex h-full w-full max-w-[760px] flex-col border-t-2 border-t-[var(--c-accent)] bg-[var(--c-bg)] sm:max-h-[calc(100dvh-48px)] sm:border sm:border-[var(--c-line-strong)] sm:border-t-2 sm:border-t-[var(--c-accent)]"
    >
      <header class="flex min-h-[50px] shrink-0 items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-strip)] ps-4">
        <div class="flex items-center gap-2">
          <h2 class="font-heading text-[15px] font-bold text-[var(--c-text)] sm:text-[17px]">
            {titleText}
          </h2>
          <span class="game-chip num text-[var(--c-accent)]">
            <bdi dir="ltr">{displayedCards.length}</bdi>
          </span>
        </div>
        <button
          type="button"
          onclick={close}
          aria-label="إغلاق عرض البطاقات"
          class="pressable flex min-h-[44px] min-w-[44px] items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
        >
          <GameIcon name="cross-mark" cls="h-4 w-4" />
        </button>
      </header>

      {#if run.battle}
        <div class="subtabs shrink-0">
          <button
            type="button"
            class={mode === 'deck' ? 'on' : ''}
            onclick={() => { fx('select'); deckSheetMode.set('deck'); }}
          >
            الإضبارة (<bdi dir="ltr">{run.deck.length}</bdi>)
          </button>
          <button
            type="button"
            class={mode === 'draw' ? 'on' : ''}
            onclick={() => { fx('select'); deckSheetMode.set('draw'); }}
          >
            السحب (<bdi dir="ltr">{run.battle.drawPile.length}</bdi>)
          </button>
          <button
            type="button"
            class={mode === 'discard' ? 'on' : ''}
            onclick={() => { fx('select'); deckSheetMode.set('discard'); }}
          >
            المستبعد (<bdi dir="ltr">{run.battle.discardPile.length}</bdi>)
          </button>
        </div>
      {/if}

      <div class="scroll-area min-h-0 flex-1 overflow-y-auto p-4">
        {#if displayedCards.length === 0}
          <p class="py-12 text-center text-[14px] text-[var(--c-muted)]">لا توجد بطاقات في هذا القسم حاليًا.</p>
        {:else}
          <div class="grid grid-cols-3 justify-items-center gap-3 sm:grid-cols-4 md:grid-cols-5">
            {#each displayedCards as card (card.uid)}
              <button
                type="button"
                onclick={() => {
                  fx('tap');
                  cardDetailTarget.set({ kind: 'deckCard', card });
                }}
                class="pressable p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                aria-label={`اعرض تفاصيل ${getCardDef(card.defId).name}`}
              >
                <Card deckCard={card} size="md" />
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
