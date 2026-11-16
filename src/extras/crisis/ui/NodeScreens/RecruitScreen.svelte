<script lang="ts">
  import { fx } from '../../../../lib/ui/fx/feedback';
  import { getCardDef, type RunState } from '../../engine';
  import { pickRecruitUnit } from '../../stores';
  import BdiText from '../BdiText.svelte';
  import Card from '../Card.svelte';
  import RunHeader from '../RunHeader.svelte';

  let { run }: { run: RunState } = $props();

  const units = $derived(run.recruit?.units ?? []);
  let selectedUid = $state<string | null>(null);

  $effect(() => {
    if (units.length > 0 && !units.some((c) => c.uid === selectedUid)) {
      selectedUid = units[0].uid;
    }
  });

  const selectedCard = $derived(units.find((c) => c.uid === selectedUid) ?? null);
  const selectedDef = $derived(selectedCard ? getCardDef(selectedCard.defId) : null);
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader {run} subtitle="مركز التجنيد" />

  <div class="scroll-area flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4">
    <div class="w-full max-w-[600px] space-y-4">
      <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 text-start">
        <span class="block text-[11.5px] font-bold text-[var(--c-accent)]">تعزيز الكوادر</span>
        <h2 class="font-heading text-[18px] font-bold text-[var(--c-text)]">
          اختر فريقًا واحدًا للانضمام إلى غرفة العمليات
        </h2>
      </div>

      <div class="flex flex-wrap items-stretch justify-center gap-3 sm:gap-5">
        {#each units as card, idx (card.uid)}
          {@const isSel = selectedUid === card.uid}
          <button
            type="button"
            data-recruit-index={idx}
            onclick={() => {
              fx('select');
              selectedUid = card.uid;
            }}
            aria-pressed={isSel}
            class="pressable flex flex-col items-center gap-1.5 border p-2.5 {isSel
              ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)]'
              : 'border-[var(--c-line)] bg-[var(--c-panel)] hover:border-[var(--c-line-strong)]'}"
          >
            <Card deckCard={card} size="lg" selected={isSel} />
          </button>
        {/each}
      </div>

      {#if selectedDef}
        <div class="border border-[var(--c-line)] bg-[var(--c-strip)] px-4 py-2.5 text-center text-[13.5px] leading-[1.55] text-[var(--c-text-2)]">
          <b class="text-[var(--c-text)]">{selectedDef.name}:</b> <BdiText text={selectedDef.description} />
        </div>
      {/if}
    </div>
  </div>

  <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
    <div class="mx-auto flex max-w-[600px] items-center justify-between gap-3">
      <button
        type="button"
        onclick={() => pickRecruitUnit(null)}
        class="kit-btn sec min-h-[44px] px-4 text-[13px]"
      >
        تخطَّ التجنيد
      </button>
      <button
        type="button"
        disabled={!selectedUid}
        onclick={() => pickRecruitUnit(selectedUid)}
        class="btn-primary-chamfer min-h-[44px] flex-1 px-6 text-[14px] font-bold sm:flex-none sm:min-w-[200px]"
      >
        جنّد الفريق
      </button>
    </div>
  </footer>
</div>
