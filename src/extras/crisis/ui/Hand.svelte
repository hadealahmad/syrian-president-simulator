<script lang="ts">
  import { skipBattleAnimation } from '../animate';
  import {
    getCardDef,
    getEffectiveCardCost,
    type BattleState,
    type DeckCard,
  } from '../engine';
  import BdiText from './BdiText.svelte';
  import Card from './Card.svelte';
  import Glyph from './Glyph.svelte';

  let {
    battle,
    isAnimating = false,
    selectedHandUid = null,
    draggingHandUid = null,
    statusHint = '',
    canPlayUntargeted = false,
    onCardTap,
    onDragStart,
    onDragMove,
    onDragEnd,
    onPlayUntargeted,
    onCancelSelection,
    onEndRound,
  }: {
    battle: BattleState;
    isAnimating?: boolean;
    selectedHandUid?: string | null;
    draggingHandUid?: string | null;
    statusHint?: string;
    canPlayUntargeted?: boolean;
    onCardTap: (card: DeckCard) => void;
    onDragStart: (card: DeckCard, x: number, y: number) => void;
    onDragMove: (card: DeckCard, x: number, y: number) => void;
    onDragEnd: (card: DeckCard, x: number, y: number) => void;
    onPlayUntargeted: () => void;
    onCancelSelection: () => void;
    onEndRound: () => void;
  } = $props();

  let handScrollEl: HTMLDivElement | null = $state(null);

  function canAffordAndPlay(card: DeckCard): boolean {
    if (isAnimating || battle.phase !== 'play') return false;
    const def = getCardDef(card.defId);
    if (!def.playable) return false;
    return getEffectiveCardCost(battle, card) <= battle.budget;
  }

  function handlePointerDown(e: PointerEvent, card: DeckCard): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (isAnimating || battle.phase !== 'play') return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startScroll = handScrollEl ? handScrollEl.scrollLeft : 0;
    const playable = canAffordAndPlay(card);
    let mode: 'idle' | 'pan' | 'drag' = 'idle';

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (mode === 'idle') {
        if (Math.hypot(dx, dy) < 8) return;
        const canScrollHand = Boolean(
          handScrollEl && handScrollEl.scrollWidth > handScrollEl.clientWidth + 4,
        );
        if (canScrollHand && Math.abs(dx) > Math.abs(dy) + 6) {
          mode = 'pan';
        } else if (playable) {
          mode = 'drag';
          onDragStart(card, ev.clientX, ev.clientY);
        } else {
          mode = 'pan';
        }
      }

      if (mode === 'pan' && handScrollEl) {
        handScrollEl.scrollLeft = startScroll - dx;
      } else if (mode === 'drag') {
        ev.preventDefault();
        onDragMove(card, ev.clientX, ev.clientY);
      }
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);

      if (mode === 'drag') {
        onDragEnd(card, ev.clientX, ev.clientY);
      } else if (mode === 'idle') {
        onCardTap(card);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  const overlapPx = $derived(
    battle.hand.length >= 5 ? -12 : battle.hand.length === 4 ? -6 : 6,
  );
</script>

<section
  data-coach="hand-dock"
  aria-label="الخزينة ويد البطاقات"
  class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-strip)]"
>
  <!-- Budget + draw/discard status bar -->
  <div
    class="border-b border-[var(--c-line)]/70 bg-[var(--c-panel)] px-2.5 py-0.5 text-[11px] sm:py-1 sm:text-[11.5px] lg:px-4 lg:py-1 lg:text-[12.5px]"
  >
    <div class="mx-auto flex min-h-[20px] w-full max-w-[860px] items-center justify-between gap-2 sm:min-h-[24px]">
      <div class="flex shrink-0 items-center gap-1.5">
        <Glyph name="cost" cls="h-3.5 w-3.5 text-[var(--c-accent)] lg:h-4 lg:w-4" />
        <span class="font-bold text-[var(--c-muted)]">الخزينة</span>
        <span class="num text-[14px] font-extrabold text-[var(--c-accent)] lg:text-[17px]">
          <bdi dir="ltr">{battle.budget}</bdi>
        </span>
        <div class="hidden items-center gap-[2px] sm:flex" aria-hidden="true">
          {#each Array.from({ length: 9 }) as _, i (i)}
            <span
              class="h-[6px] w-[6px] lg:h-[7px] lg:w-[7px] {i < battle.budget
                ? 'bg-[var(--c-accent)]'
                : 'border border-[var(--c-line-strong)] bg-transparent'}"
            ></span>
          {/each}
        </div>
      </div>

      {#if statusHint}
        <span class="min-w-0 flex-1 truncate text-center text-[11px] font-medium text-[var(--c-accent)] lg:text-[12.5px]">
          <BdiText text={statusHint} />
        </span>
      {/if}

      <div class="flex shrink-0 items-center gap-2.5 text-[11px] text-[var(--c-muted)] lg:text-[12px]">
        <span class="inline-flex items-center gap-1">
          <Glyph name="deck" cls="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          <span>سحب</span>
          <b class="num text-[var(--c-text-2)]"><bdi dir="ltr">{battle.drawPile.length}</bdi></b>
        </span>
        <span class="inline-flex items-center gap-1">
          <Glyph name="discard" cls="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          <span>مستبعد</span>
          <b class="num text-[var(--c-text-2)]"><bdi dir="ltr">{battle.discardPile.length}</bdi></b>
        </span>
      </div>
    </div>
  </div>

  <!-- Hand cards + primary action row:
       On phones: hand row on top, full-width End Round below.
       On desktop (>=1024px): centred cluster with «أنهِ الجولة» right at the start side of the hand! -->
  <div class="mx-auto flex w-full max-w-[980px] flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-5 lg:px-4 lg:py-1.5">
    <!-- Horizontally scrollable hand -->
    <div
      bind:this={handScrollEl}
      style="touch-action: none;"
      class="no-scrollbar flex w-full items-end overflow-x-auto px-2 pt-2 pb-1 sm:pt-3 lg:w-auto lg:max-w-[740px] lg:px-1 lg:pt-3 lg:pb-1"
    >
      {#if battle.hand.length === 0}
        <span class="mx-auto my-6 text-[12px] text-[var(--c-muted)] lg:my-10 lg:px-8 lg:text-[13px]">
          اليد فارغة في هذه الجولة
        </span>
      {:else}
        <div class="mx-auto flex items-end px-0.5">
          {#each battle.hand as card, idx (card.uid)}
            {@const cost = getEffectiveCardCost(battle, card)}
            {@const playable = canAffordAndPlay(card)}
            {@const isSelected = selectedHandUid === card.uid}
            {@const isDragging = draggingHandUid === card.uid}
            <button
              type="button"
              data-hand-uid={card.uid}
              onpointerdown={(e) => handlePointerDown(e, card)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCardTap(card);
                }
              }}
              aria-label={`${getCardDef(card.defId).name} — الكلفة ${cost}`}
              aria-pressed={isSelected}
              style="touch-action: none; {idx > 0 ? `margin-inline-start: ${overlapPx}px;` : ''}"
              class="relative shrink-0 p-0 transition-transform duration-150 focus-visible:z-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isSelected
                ? 'z-20 -translate-y-2 sm:-translate-y-2.5'
                : 'z-10 hover:z-20'} {isDragging ? 'opacity-30' : ''}"
            >
              <Card
                deckCard={card}
                size="hand"
                effectiveCost={cost}
                selected={isSelected}
                unaffordable={!playable}
              />
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Action bar: on desktop sits at the START side of the hand row (lg:order-first) -->
    <div class="flex shrink-0 items-center gap-2 px-2.5 pb-1 pt-0.5 sm:pb-1.5 lg:order-first lg:w-[176px] lg:flex-col lg:items-stretch lg:p-0">
      {#if isAnimating}
        <button
          type="button"
          onclick={skipBattleAnimation}
          class="kit-btn sec min-h-[44px] w-full text-[13px] font-bold lg:min-h-[50px]"
        >
          تخطَّ العرض
        </button>
      {:else}
        {#if canPlayUntargeted}
          <button
            type="button"
            onclick={onPlayUntargeted}
            class="kit-btn pri min-h-[44px] flex-1 px-3 text-[13px] font-bold lg:min-h-[48px] lg:w-full"
          >
            نفّذ القرار
          </button>
          <button
            type="button"
            onclick={onCancelSelection}
            class="kit-btn sec min-h-[44px] px-3 text-[12.5px]"
          >
            تراجع
          </button>
        {:else}
          <button
            type="button"
            data-coach="end-round-btn"
            disabled={battle.phase !== 'play'}
            onclick={onEndRound}
            class="btn-primary-chamfer min-h-[44px] w-full px-5 text-[14px] font-bold lg:min-h-[52px] lg:text-[15.5px]"
          >
            <span>أنهِ الجولة</span>
          </button>
        {/if}
      {/if}
    </div>
  </div>
</section>
