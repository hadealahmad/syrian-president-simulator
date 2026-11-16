<script lang="ts">
  import {
    EVENTS,
    getCardDef,
    getLegalEventChoices,
    type EventOutcome,
    type RunState,
  } from '../../engine';
  import { pickEventChoice } from '../../stores';
  import BdiText from '../BdiText.svelte';
  import Glyph from '../Glyph.svelte';
  import RunHeader from '../RunHeader.svelte';

  let { run }: { run: RunState } = $props();

  const ev = $derived(EVENTS.find((e) => e.id === run.activeEvent?.eventId) ?? EVENTS[0]);
  const legalChoices = $derived(getLegalEventChoices(run));

  function formatOutcomeChip(out: EventOutcome): { text: string; tone: 'pos' | 'neg' | 'neutral' } {
    switch (out.kind) {
      case 'grants':
        return {
          text: out.delta > 0 ? `+${out.delta} منح` : `−${Math.abs(out.delta)} منح`,
          tone: out.delta > 0 ? 'pos' : 'neg',
        };
      case 'life':
        return {
          text: out.delta > 0 ? `+${out.delta} ثقة` : `−${Math.abs(out.delta)} ثقة`,
          tone: out.delta > 0 ? 'pos' : 'neg',
        };
      case 'addCards': {
        const def = getCardDef(out.defIds[0]);
        const countSuffix = out.defIds.length > 1 ? ` ×${out.defIds.length}` : '';
        return {
          text: `${def.kind === 'curse' ? 'عبء: ' : 'بطاقة: '}${def.name}${countSuffix}`,
          tone: def.kind === 'curse' ? 'neg' : 'pos',
        };
      }
      case 'addRandomRareUnit':
        return { text: 'فريق نادر +1', tone: 'pos' };
      case 'upgradeRandomUnit':
        return { text: 'ترقية فريق عشوائي', tone: 'pos' };
      case 'removeRandomCurseOrCard':
        return { text: 'استبعاد عبء أو بطاقة', tone: 'pos' };
    }
  }
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader {run} subtitle="ملف طارئ" />

  <div class="scroll-area flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-4">
    <div class="w-full max-w-[540px] border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)]">
      <!-- Event Header -->
      <div class="flex items-center gap-3 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-4 py-3.5">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-bg)] text-[var(--c-accent)]">
          <Glyph name={ev.glyph} cls="h-7 w-7" />
        </div>
        <div class="text-start">
          <span class="block text-[11px] font-bold text-[var(--c-accent)]">طارئ ميداني</span>
          <h2 class="font-heading text-[19px] font-bold text-[var(--c-text)]">{ev.name}</h2>
        </div>
      </div>

      <!-- One-line narrative -->
      <div class="border-b border-[var(--c-line)] px-4 py-4">
        <p class="text-start text-[15.5px] leading-[1.65] text-[var(--c-text-2)]">
          <BdiText text={ev.text} />
        </p>
      </div>

      <!-- Two choices -->
      <div class="space-y-2.5 p-4">
        {#each [0, 1] as const as idx (idx)}
          {@const choice = ev.choices[idx]}
          {@const allowed = legalChoices.includes(idx)}
          <button
            type="button"
            data-event-choice={idx}
            disabled={!allowed}
            onclick={() => pickEventChoice(idx)}
            class="pressable flex min-h-[58px] w-full flex-wrap items-center justify-between gap-2 border px-4 py-2.5 text-start {allowed
              ? idx === 0
                ? 'border-[var(--c-accent)] bg-[var(--c-bg)] hover:bg-[var(--c-chip-bg)]'
                : 'border-[var(--c-line-strong)] bg-[var(--c-bg)] hover:bg-[var(--c-chip-bg)]'
              : 'border-dashed border-[var(--c-line)] bg-[var(--c-strip)] opacity-55 cursor-not-allowed'}"
          >
            <span class="text-[14.5px] font-bold text-[var(--c-text)]"><BdiText text={choice.label} /></span>

            <div class="flex flex-wrap items-center gap-1.5">
              {#if !allowed && choice.requireGrants}
                <span class="fx-chip dn">يتطلب <bdi dir="ltr">{choice.requireGrants}</bdi> منح</span>
              {/if}
              {#each choice.outcomes as out, oIdx (oIdx)}
                {@const chip = formatOutcomeChip(out)}
                <span class="fx-chip {chip.tone === 'pos' ? 'up' : chip.tone === 'neg' ? 'dn' : ''}">
                  <BdiText text={chip.text} />
                </span>
              {/each}
              {#if choice.outcomes.length === 0}
                <span class="fx-chip">بلا أثر</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
