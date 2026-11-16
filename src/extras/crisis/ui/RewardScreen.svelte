<script lang="ts">
  import { fx } from '../../../lib/ui/fx/feedback';
  import { getCardDef, type RunState } from '../engine';
  import { pickBattleReward } from '../stores';
  import BdiText from './BdiText.svelte';
  import Card from './Card.svelte';
  import Glyph from './Glyph.svelte';
  import RunHeader from './RunHeader.svelte';

  let { run }: { run: RunState } = $props();

  const reward = $derived(run.reward!);
  let selectedUid = $state<string | null>(null);

  $effect(() => {
    if (reward.cards.length > 0 && !reward.cards.some((c) => c.uid === selectedUid)) {
      selectedUid = reward.cards[0].uid;
    }
  });

  const selectedCard = $derived(reward.cards.find((c) => c.uid === selectedUid) ?? null);
  const selectedDef = $derived(selectedCard ? getCardDef(selectedCard.defId) : null);
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader {run} subtitle={reward.isBossReward ? 'غنائم الزعيم' : 'غنائم المعركة'} />

  <div class="scroll-area flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4">
    <div class="w-full max-w-[600px] space-y-4">
      <!-- Grants earned banner -->
      <div class="flex flex-wrap items-center justify-between gap-2 border border-[var(--c-line-strong)] bg-[var(--c-panel)] px-4 py-3">
        <div>
          <span class="block text-[11.5px] font-bold text-[var(--c-accent)]">
            {reward.isBossReward ? 'سقط زعيم الفصل' : 'انتصرت الجبهة'}
          </span>
          <h2 class="font-heading text-[18px] font-bold text-[var(--c-text)]">
            اختر بطاقة لتعزيز إضبارتك
          </h2>
        </div>

        <div class="flex items-center gap-1.5 border border-[var(--c-accent)] bg-[var(--c-bg)] px-3 py-1.5">
          <Glyph name="grants" cls="h-4 w-4 text-[var(--c-accent)]" />
          <span class="num text-[15px] font-bold text-[var(--c-accent)]">
            <bdi dir="ltr">+{reward.grantsEarned}</bdi>
          </span>
          <span class="text-[12px] font-bold text-[var(--c-text-2)]">منح</span>
          {#if reward.overflowGrants > 0}
            <span class="text-[11px] text-[var(--c-pos)]">
              (فائض <bdi dir="ltr">+{reward.overflowGrants}</bdi>)
            </span>
          {/if}
        </div>
      </div>

      <!-- 3 Big Reward Cards -->
      <div class="flex flex-wrap items-stretch justify-center gap-3 sm:gap-5">
        {#each reward.cards as card, idx (card.uid)}
          {@const def = getCardDef(card.defId)}
          {@const isSel = selectedUid === card.uid}
          <button
            type="button"
            data-reward-index={idx}
            onclick={() => {
              fx('select');
              selectedUid = card.uid;
            }}
            aria-pressed={isSel}
            class="pressable flex flex-col items-center gap-2 border p-2.5 transition-colors {isSel
              ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)]'
              : 'border-[var(--c-line)] bg-[var(--c-panel)] hover:border-[var(--c-line-strong)]'}"
          >
            <Card deckCard={card} size="lg" selected={isSel} />
            <span class="text-[11px] font-bold text-[var(--c-muted)]">
              {def.rarity === 'rare' ? 'نادر' : def.rarity === 'uncommon' ? 'متقدم' : 'أساسي'}
            </span>
          </button>
        {/each}
      </div>

      <!-- Selected card 1-line description -->
      {#if selectedDef}
        <div class="border border-[var(--c-line)] bg-[var(--c-strip)] px-4 py-2.5 text-center text-[13.5px] leading-[1.55] text-[var(--c-text-2)]">
          <b class="text-[var(--c-text)]">{selectedDef.name}:</b> <BdiText text={selectedDef.description} />
        </div>
      {/if}
    </div>
  </div>

  <!-- Footer CTA -->
  <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
    <div class="mx-auto flex max-w-[600px] items-center justify-between gap-3">
      <button
        type="button"
        data-action="skip-reward"
        onclick={() => pickBattleReward(null)}
        class="kit-btn sec min-h-[44px] px-4 text-[13px]"
      >
        تخطَّ البطاقات
      </button>

      <button
        type="button"
        data-action="take-reward"
        disabled={!selectedUid}
        onclick={() => pickBattleReward(selectedUid)}
        class="btn-primary-chamfer min-h-[44px] flex-1 px-6 text-[14px] font-bold sm:flex-none sm:min-w-[200px]"
      >
        ضمّ البطاقة
      </button>
    </div>
  </footer>
</div>
