<script lang="ts">
  import { fx } from '../../../lib/ui/fx/feedback';
  import { buildInitialBattleLogLines } from '../animate';
  import { BOSSES, MODIFIERS, type BattleState, type RunState } from '../engine';
  import { deckSheetMode, roundLogStore } from '../stores';
  import BdiText from './BdiText.svelte';
  import Glyph from './Glyph.svelte';

  let {
    run,
    battle,
  }: {
    run: RunState;
    battle: BattleState;
  } = $props();

  const rawLogs = $derived($roundLogStore);
  const visibleLogs = $derived(
    (rawLogs.length > 0 ? rawLogs : buildInitialBattleLogLines(battle)).slice(0, 12),
  );
  const bossDef = $derived(battle.bossId ? BOSSES[battle.bossId] : null);
  const modDef = $derived(battle.modifier ? MODIFIERS[battle.modifier] : null);
  const reversedRows = $derived([...run.map.rows].reverse());

  function logToneClass(line: string): string {
    if (line.startsWith('الميزان +') || line.includes('انفراج') || line.startsWith('إسعاف')) {
      return 'text-[var(--c-pos)] font-semibold';
    }
    if (line.startsWith('الميزان −') || line.includes('انهيار')) {
      return 'text-[var(--c-neg)] font-semibold';
    }
    if (line.includes('تصيب') || line.includes('يصيب')) {
      return 'text-[var(--c-text)]';
    }
    return 'text-[var(--c-text-2)]';
  }
</script>

<aside
  aria-label="لوحة المعلومات الجانبية"
  class="hidden w-[280px] shrink-0 flex-col border-e border-[var(--c-line)] bg-[var(--c-panel)] lg:flex xl:w-[310px]"
>
  <!-- Deck / Draw / Discard counters -->
  <div class="grid grid-cols-3 divide-x divide-x-reverse divide-[var(--c-line)] border-b border-[var(--c-line)]">
    <button
      type="button"
      onclick={() => { fx('tap'); deckSheetMode.set('deck'); }}
      class="pressable flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 hover:bg-[var(--c-chip-bg)]"
    >
      <span class="text-[11px] text-[var(--c-muted)]">الإضبارة</span>
      <b class="num text-[16px] text-[var(--c-text)]"><bdi dir="ltr">{run.deck.length}</bdi></b>
    </button>
    <button
      type="button"
      onclick={() => { fx('tap'); deckSheetMode.set('draw'); }}
      class="pressable flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 hover:bg-[var(--c-chip-bg)]"
    >
      <span class="text-[11px] text-[var(--c-muted)]">السحب</span>
      <b class="num text-[16px] text-[var(--c-text)]"><bdi dir="ltr">{battle.drawPile.length}</bdi></b>
    </button>
    <button
      type="button"
      onclick={() => { fx('tap'); deckSheetMode.set('discard'); }}
      class="pressable flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 hover:bg-[var(--c-chip-bg)]"
    >
      <span class="text-[11px] text-[var(--c-muted)]">المستبعد</span>
      <b class="num text-[16px] text-[var(--c-text)]"><bdi dir="ltr">{battle.discardPile.length}</bdi></b>
    </button>
  </div>

  <!-- Boss / Modifier rule box -->
  {#if bossDef || modDef}
    <div class="space-y-2 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-2.5 text-[12px]">
      {#if bossDef}
        <div class="space-y-1">
          <div class="flex items-center justify-between font-bold text-[var(--c-neg)]">
            <span class="flex items-center gap-1.5">
              <Glyph name={bossDef.glyph} cls="h-4 w-4" />
              <span>{bossDef.name}</span>
            </span>
            <span>المرحلة <bdi dir="ltr">{battle.bossPhase ?? 1}</bdi></span>
          </div>
          <p class="leading-[1.5] text-[var(--c-text-2)]">
            <BdiText text={(battle.bossPhase ?? 1) === 2 ? bossDef.phase2.rule : bossDef.phase1.rule} />
          </p>
        </div>
      {/if}
      {#if modDef}
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5 font-bold text-[var(--c-accent)]">
            <Glyph name={modDef.glyph} cls="h-3.5 w-3.5" />
            <span>{modDef.name}</span>
          </div>
          <p class="leading-[1.45] text-[var(--c-muted)]"><BdiText text={modDef.description} /></p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Mini Act Map -->
  <div class="border-b border-[var(--c-line)] px-3 py-2.5">
    <div class="mb-2 flex items-center justify-between text-[11px] font-bold text-[var(--c-muted)]">
      <span>خريطة الفصل: {run.map.name}</span>
      <span>الجولة <bdi dir="ltr">{battle.round}</bdi></span>
    </div>
    <div class="flex flex-col gap-1.5 bg-[var(--c-bg)] p-2 border border-[var(--c-line)]">
      {#each reversedRows as row, rIdx (rIdx)}
        <div class="flex items-center justify-around">
          {#each row as node (node.id)}
            {@const isActive = run.activeNodeId === node.id}
            <div
              class="flex h-5 w-5 items-center justify-center border {isActive
                ? 'border-[var(--c-accent)] bg-[var(--c-accent)] text-[var(--c-ink)]'
                : node.visited
                  ? 'border-[var(--c-line-strong)] bg-[var(--c-chip-bg)] text-[var(--c-text-2)]'
                  : 'border-[var(--c-line)] text-[var(--c-muted)] opacity-55'}"
              title={node.name}
            >
              <Glyph name={node.glyph} cls="h-3 w-3" />
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- Live Round Log -->
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex items-center justify-between border-b border-[var(--c-line)] px-3 py-1.5 text-[11px] font-bold text-[var(--c-muted)]">
      <span>سجل العمليات</span>
      <span class="font-normal">الأحدث أولًا</span>
    </div>
    <div data-zone="round-log" class="scroll-area flex-1 space-y-1 overflow-y-auto px-3 py-2 text-[12px]">
      {#each visibleLogs as line, idx (idx)}
        <div class="border-b border-[var(--c-line)]/50 pb-1 leading-[1.4] {logToneClass(line)}">
          <BdiText text={line} />
        </div>
      {/each}
    </div>
  </div>
</aside>
