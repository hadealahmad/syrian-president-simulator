<script lang="ts">
  import { fx } from '../../../../lib/ui/fx/feedback';
  import { getCardDef, type RunState } from '../../engine';
  import {
    cardDetailTarget,
    exitMarketNode,
    purchaseMarketLife,
    purchaseMarketRemove,
    purchaseMarketSlot,
  } from '../../stores';
  import BdiText from '../BdiText.svelte';
  import Card from '../Card.svelte';
  import Glyph from '../Glyph.svelte';
  import RunHeader from '../RunHeader.svelte';

  let { run }: { run: RunState } = $props();

  const market = $derived(run.market!);
  let removingMode = $state(false);

  const canRemove = $derived(
    !market.removeUsed && run.grants >= market.removePrice && run.deck.length > 4,
  );
  const canBuyLife = $derived(
    market.lifeAvailable && run.grants >= market.lifePrice && run.lives < run.maxLives,
  );
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader {run} subtitle="سوق الإمداد" />

  <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-4">
    <div class="mx-auto max-w-[700px] space-y-4">
      <div class="flex items-center justify-between border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-2.5">
        <div>
          <span class="block text-[11px] font-bold text-[var(--c-accent)]">تجهيز الجبهات</span>
          <h2 class="font-heading text-[17px] font-bold text-[var(--c-text)]">سوق الإمداد والدعم</h2>
        </div>
        <div class="flex items-center gap-1.5 border border-[var(--c-accent)] bg-[var(--c-bg)] px-3 py-1">
          <Glyph name="grants" cls="h-4 w-4 text-[var(--c-accent)]" />
          <span class="num text-[16px] font-bold text-[var(--c-accent)]">
            <bdi dir="ltr">{run.grants}</bdi>
          </span>
          <span class="text-[12px] text-[var(--c-muted)]">منح</span>
        </div>
      </div>

      <!-- 4 Market card offers -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {#each market.items as item (item.slotId)}
          {@const def = getCardDef(item.card.defId)}
          {@const affordable = !item.sold && run.grants >= item.price}
          <div
            class="flex flex-col items-center justify-between gap-2 border p-2.5 {item.sold
              ? 'border-dashed border-[var(--c-line)] bg-[var(--c-strip)] opacity-55'
              : 'border-[var(--c-line)] bg-[var(--c-panel)]'}"
          >
            <button
              type="button"
              onclick={() => {
                fx('tap');
                cardDetailTarget.set({ kind: 'deckCard', card: item.card });
              }}
              aria-label={`تفاصيل ${def.name}`}
              class="pressable p-0"
            >
              <Card deckCard={item.card} size="md" unaffordable={item.sold || !affordable} />
            </button>

            <span class="w-full truncate text-center text-[11px] leading-[1.4] text-[var(--c-muted)]">
              <BdiText text={def.description} />
            </span>

            {#if item.sold}
              <span class="flex min-h-[44px] w-full items-center justify-center border border-dashed border-[var(--c-line)] text-[12px] font-bold text-[var(--c-muted)]">
                نفدت
              </span>
            {:else}
              <button
                type="button"
                data-market-slot={item.slotId}
                disabled={!affordable}
                onclick={() => purchaseMarketSlot(item.slotId)}
                class="kit-btn {affordable ? 'sec' : 'lock'} min-h-[44px] w-full text-[12.5px] font-bold"
              >
                <span>اشترِ</span>
                <span class="num inline-flex items-center gap-0.5 text-[var(--c-accent)]">
                  <Glyph name="grants" cls="h-3.5 w-3.5" />
                  <bdi dir="ltr">{item.price}</bdi>
                </span>
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Market services: Remove card + Buy life -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="flex items-center justify-between gap-2 border border-[var(--c-line)] bg-[var(--c-panel)] p-3">
          <div class="min-w-0 text-start">
            <b class="block text-[13.5px] text-[var(--c-text)]">تنقية الإضبارة</b>
            <small class="block text-[11.5px] text-[var(--c-muted)]">
              {market.removeUsed ? 'استنفدت خدمة الاستبعاد هنا.' : 'استبعد بطاقة واحدة نهائيًا.'}
            </small>
          </div>
          <button
            type="button"
            disabled={!canRemove}
            onclick={() => {
              fx('select');
              removingMode = !removingMode;
            }}
            class="kit-btn {canRemove ? 'sec' : 'lock'} min-h-[44px] shrink-0 px-3 text-[12.5px]"
          >
            <span>استبعد</span>
            <span class="num inline-flex items-center gap-0.5 text-[var(--c-accent)]">
              <Glyph name="grants" cls="h-3.5 w-3.5" />
              <bdi dir="ltr">{market.removePrice}</bdi>
            </span>
          </button>
        </div>

        <div class="flex items-center justify-between gap-2 border border-[var(--c-line)] bg-[var(--c-panel)] p-3">
          <div class="min-w-0 text-start">
            <b class="block text-[13.5px] text-[var(--c-text)]">تعزيز الثقة</b>
            <small class="block text-[11.5px] text-[var(--c-muted)]">
              {!market.lifeAvailable
                ? run.marketLifeBought
                  ? 'اشتريت نقطة الثقة في هذه الجولة.'
                  : 'الثقة في حدها الأقصى.'
                : 'استعد نقطة ثقة واحدة (مرة في الجولة).'}
            </small>
          </div>
          <button
            type="button"
            disabled={!canBuyLife}
            onclick={purchaseMarketLife}
            class="kit-btn {canBuyLife ? 'sec' : 'lock'} min-h-[44px] shrink-0 px-3 text-[12.5px]"
          >
            <span>استعد</span>
            <span class="num inline-flex items-center gap-0.5 text-[var(--c-accent)]">
              <Glyph name="grants" cls="h-3.5 w-3.5" />
              <bdi dir="ltr">{market.lifePrice}</bdi>
            </span>
          </button>
        </div>
      </div>

      {#if removingMode && canRemove}
        <div class="space-y-2 border border-[var(--c-accent)] bg-[var(--c-strip)] p-3.5">
          <div class="flex items-center justify-between">
            <span class="text-[12.5px] font-bold text-[var(--c-accent)]">
              اختر البطاقة المراد استبعادها مقابل <bdi dir="ltr">{market.removePrice}</bdi> منح
            </span>
            <button
              type="button"
              onclick={() => (removingMode = false)}
              class="kit-btn sec min-h-[44px] px-3 text-[12px]"
            >
              تراجع
            </button>
          </div>
          <div class="grid grid-cols-3 justify-items-center gap-2.5 sm:grid-cols-4 md:grid-cols-5">
            {#each run.deck as card (card.uid)}
              <button
                type="button"
                onclick={() => {
                  removingMode = false;
                  purchaseMarketRemove(card.uid);
                }}
                aria-label={`استبعد ${getCardDef(card.defId).name}`}
                class="pressable p-0"
              >
                <Card deckCard={card} size="md" />
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
    <div class="mx-auto flex max-w-[700px] justify-end">
      <button
        type="button"
        data-action="leave-market"
        onclick={exitMarketNode}
        class="btn-primary-chamfer min-h-[44px] w-full px-7 text-[14px] font-bold sm:w-auto sm:min-w-[200px]"
      >
        غادر السوق
      </button>
    </div>
  </footer>
</div>
