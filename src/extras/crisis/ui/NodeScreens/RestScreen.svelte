<script lang="ts">
  import { fx } from '../../../../lib/ui/fx/feedback';
  import { getCardDef, type RunState } from '../../engine';
  import { applyRestChoice } from '../../stores';
  import Card from '../Card.svelte';
  import Glyph from '../Glyph.svelte';
  import RunHeader from '../RunHeader.svelte';

  let { run }: { run: RunState } = $props();

  const canHeal = $derived(run.lives < run.maxLives);
  const canRemove = $derived(run.deck.length > 4);

  let mode = $state<'heal' | 'remove'>('heal');
  let removeUid = $state<string | null>(null);

  $effect(() => {
    if (!canHeal && canRemove && mode === 'heal') {
      mode = 'remove';
    }
    if (mode === 'remove' && (!removeUid || !run.deck.some((c) => c.uid === removeUid))) {
      removeUid = run.deck[0]?.uid ?? null;
    }
  });

  function commit(): void {
    if (mode === 'heal') {
      applyRestChoice({ kind: 'heal' });
    } else if (removeUid) {
      applyRestChoice({ kind: 'remove', cardUid: removeUid });
    }
  }
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader {run} subtitle="محطة استراحة" />

  <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-4">
    <div class="mx-auto max-w-[640px] space-y-4">
      <div class="border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 text-start">
        <span class="block text-[11.5px] font-bold text-[var(--c-accent)]">التقاط الأنفاس</span>
        <h2 class="font-heading text-[18px] font-bold text-[var(--c-text)]">
          اختر استعادة الثقة أو تنقية الإضبارة
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onclick={() => {
            fx('select');
            mode = 'heal';
          }}
          aria-pressed={mode === 'heal'}
          class="pressable flex min-h-[84px] items-center gap-3 border p-3.5 text-start {mode === 'heal'
            ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)]'
            : 'border-[var(--c-line)] bg-[var(--c-panel)]'}"
        >
          <div class="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-bg)] text-[var(--c-pos)]">
            <Glyph name="life" cls="h-6 w-6" />
          </div>
          <div>
            <b class="block text-[14.5px] text-[var(--c-text)]">استعد نقطة ثقة</b>
            <small class="block text-[12px] text-[var(--c-muted)]">
              {#if canHeal}
                ترتفع الثقة من <bdi dir="ltr" class="num">{run.lives}</bdi> إلى <bdi dir="ltr" class="num">{run.lives + 1}</bdi>.
              {:else}
                الثقة في حدها الأقصى حاليًا (تغادر المحطة دون تغيير).
              {/if}
            </small>
          </div>
        </button>

        <button
          type="button"
          disabled={!canRemove}
          onclick={() => {
            fx('select');
            mode = 'remove';
          }}
          aria-pressed={mode === 'remove'}
          class="pressable flex min-h-[84px] items-center gap-3 border p-3.5 text-start {mode ===
          'remove'
            ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)]'
            : 'border-[var(--c-line)] bg-[var(--c-panel)]'} {!canRemove ? 'opacity-50' : ''}"
        >
          <div class="flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-bg)] text-[var(--c-accent)]">
            <Glyph name="discard" cls="h-6 w-6" />
          </div>
          <div>
            <b class="block text-[14.5px] text-[var(--c-text)]">استبعد بطاقة من الإضبارة</b>
            <small class="block text-[12px] text-[var(--c-muted)]">
              تخلّص من بطاقة ضعيفة أو عبء إداري لتسريع دوران السحب.
            </small>
          </div>
        </button>
      </div>

      {#if mode === 'remove' && canRemove}
        <div class="space-y-2 border border-[var(--c-line)] bg-[var(--c-strip)] p-3.5">
          <span class="block text-[12px] font-bold text-[var(--c-muted)]">
            حدد البطاقة المراد استبعادها نهائيًا
          </span>
          <div class="grid grid-cols-3 justify-items-center gap-2.5 sm:grid-cols-4 md:grid-cols-5">
            {#each run.deck as card (card.uid)}
              <button
                type="button"
                onclick={() => {
                  fx('select');
                  removeUid = card.uid;
                }}
                aria-label={`استبعد ${getCardDef(card.defId).name}`}
                aria-pressed={removeUid === card.uid}
                class="pressable p-0"
              >
                <Card deckCard={card} size="md" selected={removeUid === card.uid} />
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
    <div class="mx-auto flex max-w-[640px] justify-end">
      <button
        type="button"
        data-action="confirm-rest"
        disabled={mode === 'remove' && !removeUid}
        onclick={commit}
        class="btn-primary-chamfer min-h-[44px] w-full px-7 text-[14px] font-bold sm:w-auto sm:min-w-[220px]"
      >
        {mode === 'heal' ? 'استعد الثقة وتابع' : 'استبعد البطاقة وتابع'}
      </button>
    </div>
  </footer>
</div>
