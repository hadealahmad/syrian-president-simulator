<script lang="ts">
  import { fx } from '../../../../lib/ui/fx/feedback';
  import { PLAYER_TRAITS, type DeckCard, type RunState } from '../../engine';
  import { applyTrainChoice } from '../../stores';
  import BdiText from '../BdiText.svelte';
  import Card from '../Card.svelte';
  import Glyph from '../Glyph.svelte';
  import RunHeader from '../RunHeader.svelte';

  let { run }: { run: RunState } = $props();

  const offers = $derived(run.train?.offers ?? {});
  const trainableCards = $derived(run.deck.filter((c) => Boolean(offers[c.uid])));

  let selectedUid = $state<string | null>(null);
  let upgradeIdx = $state<0 | 1>(0);

  $effect(() => {
    if (trainableCards.length > 0 && !trainableCards.some((c) => c.uid === selectedUid)) {
      selectedUid = trainableCards[0].uid;
      upgradeIdx = 0;
    }
  });

  const selectedCard = $derived(trainableCards.find((c) => c.uid === selectedUid) ?? null);
  const selectedPair = $derived(selectedUid ? offers[selectedUid] ?? null : null);

  const previewUpgraded = $derived.by((): DeckCard | null => {
    if (!selectedCard || !selectedPair) return null;
    const up = selectedPair[upgradeIdx];
    const clone: DeckCard = { ...selectedCard };
    if (up.kind === 'power') clone.powerBonus += up.amount;
    else if (up.kind === 'health') clone.healthBonus += up.amount;
    else if (up.kind === 'trait') clone.addedTrait = up.trait;
    return clone;
  });
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader {run} subtitle="معسكر التدريب" />

  <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-4">
    <div class="mx-auto max-w-[680px] space-y-4">
      <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 text-start">
        <span class="block text-[11.5px] font-bold text-[var(--c-accent)]">تأهيل ميداني</span>
        <h2 class="font-heading text-[17px] font-bold text-[var(--c-text)]">
          اختر فريقًا ثم حدد مسار الترقية
        </h2>
      </div>

      {#if selectedCard && selectedPair && previewUpgraded}
        <div class="flex flex-col items-center gap-4 border border-[var(--c-line-strong)] bg-[var(--c-panel)] p-4 sm:flex-row">
          <div class="shrink-0">
            <Card deckCard={previewUpgraded} size="lg" selected={true} />
          </div>
          <div class="w-full flex-1 space-y-2">
            <span class="block text-[12px] font-bold text-[var(--c-muted)]">خيارات الترقية المتاحة</span>
            {#each [0, 1] as const as idx (idx)}
              {@const opt = selectedPair[idx]}
              <button
                type="button"
                onclick={() => {
                  fx('select');
                  upgradeIdx = idx;
                }}
                aria-pressed={upgradeIdx === idx}
                class="pressable flex min-h-[48px] w-full items-center justify-between gap-2 border px-3.5 py-2 text-start {upgradeIdx ===
                idx
                  ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)] text-[var(--c-text)]'
                  : 'border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-text-2)]'}"
              >
                <div class="min-w-0">
                  <b class="block text-[13.5px]"><BdiText text={opt.label} /></b>
                  {#if opt.kind === 'trait'}
                    <small class="block text-[11.5px] text-[var(--c-muted)]">
                      <BdiText text={PLAYER_TRAITS[opt.trait].description} />
                    </small>
                  {/if}
                </div>
                <Glyph
                  name={opt.kind === 'power' ? 'power' : opt.kind === 'health' ? 'health' : opt.trait}
                  cls="h-5 w-5 shrink-0 text-[var(--c-accent)]"
                />
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="space-y-2">
        <span class="block text-[12px] font-bold text-[var(--c-muted)]">فرق الإضبارة القابلة للتدريب</span>
        <div class="grid grid-cols-3 justify-items-center gap-2.5 sm:grid-cols-4 md:grid-cols-5">
          {#each trainableCards as card (card.uid)}
            <button
              type="button"
              onclick={() => {
                fx('select');
                selectedUid = card.uid;
                upgradeIdx = 0;
              }}
              aria-pressed={selectedUid === card.uid}
              class="pressable p-0"
            >
              <Card deckCard={card} size="md" selected={selectedUid === card.uid} />
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
    <div class="mx-auto flex max-w-[680px] items-center justify-between gap-3">
      <button
        type="button"
        onclick={() => applyTrainChoice(null)}
        class="kit-btn sec min-h-[44px] px-4 text-[13px]"
      >
        غادر التدريب
      </button>
      <button
        type="button"
        disabled={!selectedUid}
        onclick={() => applyTrainChoice(selectedUid, upgradeIdx)}
        class="btn-primary-chamfer min-h-[44px] flex-1 px-6 text-[14px] font-bold sm:flex-none sm:min-w-[200px]"
      >
        اعتمد التدريب
      </button>
    </div>
  </footer>
</div>
