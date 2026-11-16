<script lang="ts">
  import { getCardDef, getEffectiveCardCost, type BattleState } from '../engine';
  import BdiText from './BdiText.svelte';
  import Card from './Card.svelte';

  let {
    battle,
    onPick,
  }: {
    battle: BattleState;
    onPick: (index: number) => void;
  } = $props();

  let pickingIndex = $state<number | null>(null);
  let peeking = $state(false);

  function choose(idx: number): void {
    if (pickingIndex !== null) return;
    pickingIndex = idx;
    setTimeout(() => {
      pickingIndex = null;
      onPick(idx);
    }, 150);
  }
</script>

{#if peeking}
  <div class="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] px-4 py-2">
    <span class="text-[13px] font-bold text-[var(--c-text)]">معاينة الميدان قبل اختيار الإمداد</span>
    <button
      type="button"
      onclick={() => (peeking = false)}
      class="btn-primary-chamfer min-h-[44px] px-5 text-[13px] font-bold"
    >
      اختر إمدادك
    </button>
  </div>
{:else}
  <div
    data-coach="supply-sheet"
    role="dialog"
    aria-modal="true"
    aria-label="اختر إمدادك"
    class="shell-enter-bottom fixed inset-x-0 bottom-0 z-40 border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6"
  >
    <div class="mx-auto max-w-[540px]">
      <div class="mb-2.5 flex items-center justify-between gap-2">
        <h2 class="font-heading text-[15px] font-bold text-[var(--c-text)] sm:text-[16px]">
          اختر إمدادك
        </h2>
        <button
          type="button"
          onclick={() => (peeking = true)}
          class="kit-btn sec min-h-[44px] px-3 text-[12px]"
        >
          اعرض الميدان
        </button>
      </div>

      <div class="flex items-stretch justify-center gap-2.5 sm:gap-4">
        {#each battle.supplyOptions as card, idx (card.uid)}
          {@const def = getCardDef(card.defId)}
          {@const cost = getEffectiveCardCost(battle, card)}
          <button
            type="button"
            data-supply-index={idx}
            onclick={() => choose(idx)}
            aria-label={`اختر ${def.name}`}
            class="pressable group flex flex-1 max-w-[148px] flex-col items-center gap-1.5 border border-[var(--c-line-strong)] bg-[var(--c-bg)] p-2 transition-transform hover:border-[var(--c-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {pickingIndex ===
            idx
              ? 'translate-y-6 scale-90 opacity-30'
              : ''}"
          >
            <Card deckCard={card} size="md" effectiveCost={cost} />
            <span class="line-clamp-2 min-h-[30px] text-center text-[10.5px] leading-[1.35] text-[var(--c-muted)] sm:text-[11px]">
              <BdiText text={def.description} />
            </span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
