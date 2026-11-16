<script lang="ts">
  import { onMount } from 'svelte';
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import {
    BOSSES,
    MODIFIERS,
    NODE_META,
    getReachableNodes,
    type MapNode,
    type NodeType,
    type RunState,
  } from '../engine';
  import { launchMapNode, mapLegendOpen } from '../stores';
  import BdiText from './BdiText.svelte';
  import Glyph from './Glyph.svelte';
  import RunHeader from './RunHeader.svelte';

  let { run }: { run: RunState } = $props();

  let scrollEl: HTMLDivElement | null = $state(null);
  let selectedNodeId = $state<string | null>(null);
  const legendOpen = $derived($mapLegendOpen);

  const reachableNodes = $derived(getReachableNodes(run));
  const reachableSet = $derived(new Set(reachableNodes.map((n) => n.id)));

  $effect(() => {
    if (selectedNodeId && !run.map.nodes[selectedNodeId]) {
      selectedNodeId = null;
    }
  });

  const ROW_STEP = 100;
  const TOP_Y = 66;
  const START_Y = TOP_Y + 7 * ROW_STEP;
  const STAGE_H = START_Y + 60;

  function rowY(row: number): number {
    // row 6 (boss) at top (TOP_Y), row 0 near bottom (TOP_Y + 6 * ROW_STEP)
    return TOP_Y + (6 - row) * ROW_STEP;
  }

  function colLeftPct(col: number, count: number): number {
    // RTL reading order: col 0 on right (larger left%), col count-1 on left
    const ltrPct =
      count === 1
        ? 50
        : count === 2
          ? [30, 70][col]
          : count === 3
            ? [19, 50, 81][col]
            : [14, 38, 62, 86][col];
    return 100 - (ltrPct ?? 50);
  }

  const nodeCoords = $derived.by(() => {
    const map = new Map<string, { leftPct: number; y: number }>();
    for (const row of run.map.rows) {
      for (const n of row) {
        map.set(n.id, { leftPct: colLeftPct(n.col, row.length), y: rowY(n.row) });
      }
    }
    return map;
  });

  const edges = $derived.by(() => {
    const list: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      state: 'visited' | 'reachable' | 'idle';
    }> = [];

    // Start -> row 0 edges
    for (const n0 of run.map.rows[0] ?? []) {
      const c0 = nodeCoords.get(n0.id);
      if (!c0) continue;
      list.push({
        key: `start-${n0.id}`,
        x1: 50,
        y1: START_Y,
        x2: c0.leftPct,
        y2: c0.y,
        state: n0.visited ? 'visited' : run.currentNodeId === null ? 'reachable' : 'idle',
      });
    }

    for (const row of run.map.rows) {
      for (const from of row) {
        const c1 = nodeCoords.get(from.id);
        if (!c1) continue;
        for (const nextId of from.nextIds) {
          const to = run.map.nodes[nextId];
          const c2 = nodeCoords.get(nextId);
          if (!to || !c2) continue;
          const state =
            from.visited && to.visited
              ? 'visited'
              : from.id === run.currentNodeId && reachableSet.has(to.id)
                ? 'reachable'
                : 'idle';
          list.push({
            key: `${from.id}-${to.id}`,
            x1: c1.leftPct,
            y1: c1.y,
            x2: c2.leftPct,
            y2: c2.y,
            state,
          });
        }
      }
    }
    return list;
  });

  onMount(() => {
    if (!scrollEl) return;
    const focusRow = reachableNodes[0]?.row ?? 0;
    const targetY = rowY(focusRow);
    const desiredScroll = Math.max(0, targetY - scrollEl.clientHeight * 0.55);
    scrollEl.scrollTop = desiredScroll;
  });

  const selectedNode = $derived<MapNode | null>(
    selectedNodeId ? run.map.nodes[selectedNodeId] ?? null : null,
  );
  const selectedIsReachable = $derived(selectedNode ? reachableSet.has(selectedNode.id) : false);
  const bossDef = $derived(BOSSES[run.map.bossId]);

  const NODE_HINTS: Record<MapNode['type'], string> = {
    battle: 'مواجهة ميدانية تمنح 3 منح واختيار بطاقة جديدة.',
    elite: 'مواجهة صعبة معززة تمنح 6 منح وبطاقة نادرة مضمونة.',
    recruit: 'اختر فريقًا واحدًا من ثلاثة فرق للانضمام إلى إضبارتك.',
    train: 'رقِّ أحد فرقك برفع قوته أو صموده أو إكسابه سمة.',
    rest: 'استعد نقطة ثقة أو استبعد بطاقة من إضبارتك.',
    market: 'أنفق المنح لشراء الفرق والقرارات أو تنقية الإضبارة.',
    event: 'موقف طارئ بخيارين فوريين.',
    boss: 'مواجهة زعيم الفصل لحسم العبور.',
  };

  const LEGEND_ORDER: NodeType[] = [
    'battle',
    'elite',
    'recruit',
    'train',
    'rest',
    'market',
    'event',
    'boss',
  ];

  function closeLegend(): void {
    fx('cancel');
    mapLegendOpen.set(false);
  }
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader {run} subtitle={`الزعيم: ${bossDef.name}`} />

  <!-- One-line map legend bar -->
  <div class="flex shrink-0 items-stretch justify-between border-b border-[var(--c-line)] bg-[var(--c-strip)] ps-3">
    <div class="flex min-w-0 items-center py-1 text-[11.5px] text-[var(--c-muted)]">
      <span class="truncate">اختر محطة متصلة بمسارك للتقدّم نحو الزعيم</span>
    </div>
    <button
      type="button"
      data-action="open-map-legend"
      onclick={() => {
        fx('tap');
        mapLegendOpen.set(true);
      }}
      class="pressable flex min-h-[44px] shrink-0 items-center gap-1.5 border-s border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 text-[12px] font-bold text-[var(--c-text-2)] hover:bg-[var(--c-chip-bg)] hover:text-[var(--c-text)]"
    >
      <Glyph name="watch" cls="h-3.5 w-3.5 text-[var(--c-accent)]" />
      <span>دليل الخريطة</span>
    </button>
  </div>

  <!-- Scrollable vertical act map -->
  <div bind:this={scrollEl} class="scroll-area relative min-h-0 flex-1 overflow-y-auto bg-[var(--c-bg)]">
    <div
      dir="ltr"
      class="relative mx-auto w-full max-w-[460px]"
      style="height: {STAGE_H}px;"
    >
      <!-- Hairline edge graph -->
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {#each edges as ed (ed.key)}
          <line
            x1="{ed.x1}%"
            y1="{ed.y1}"
            x2="{ed.x2}%"
            y2="{ed.y2}"
            stroke={ed.state === 'reachable'
              ? 'var(--c-accent)'
              : ed.state === 'visited'
                ? 'var(--c-text-2)'
                : 'var(--c-line)'}
            stroke-width={ed.state === 'visited' ? '2' : ed.state === 'reachable' ? '1.6' : '1'}
            stroke-dasharray={ed.state === 'idle' ? '3 3' : undefined}
          />
        {/each}
      </svg>

      <!-- Map nodes (56x56 regular square tiles, 72x72 boss tile) -->
      {#each run.map.rows as row (row[0]?.row)}
        {#each row as node (node.id)}
          {@const coord = nodeCoords.get(node.id)!}
          {@const isBoss = node.type === 'boss'}
          {@const isReachable = reachableSet.has(node.id)}
          {@const isCurrent = run.currentNodeId === node.id}
          {@const isSelected = selectedNodeId === node.id}
          <button
            type="button"
            dir="rtl"
            data-node-id={node.id}
            data-node-type={node.type}
            data-node-reachable={isReachable ? 'true' : 'false'}
            onclick={() => {
              fx('select');
              selectedNodeId = selectedNodeId === node.id ? null : node.id;
            }}
            aria-label={`${isBoss ? `${node.name}: ${bossDef.name}` : node.name}${isReachable ? ' — متاح للانطلاق' : isCurrent ? ' — موقعك الحالي' : ''}`}
            style="left: {coord.leftPct}%; top: {coord.y}px; margin-left: {isBoss ? -36 : -28}px; margin-top: {isBoss ? -36 : -28}px;"
            class="pressable absolute z-10 flex {isBoss ? 'h-[72px] w-[72px]' : 'h-[56px] w-[56px]'} flex-col items-center justify-center p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isReachable
              ? 'crisis-node-reachable bg-[var(--c-panel)] text-[var(--c-text)]'
              : isCurrent
                ? 'border-2 border-[var(--c-pos)] bg-[var(--c-chip-bg)] text-[var(--c-pos)]'
                : node.visited
                  ? 'border border-[var(--c-line-strong)] bg-[var(--c-strip)] text-[var(--c-muted)] opacity-70'
                  : isBoss
                    ? 'border-2 border-[var(--c-neg)]/80 bg-[var(--c-ev-bg)] text-[var(--c-text)]'
                    : 'border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-muted)] opacity-70'} {isSelected
              ? 'outline outline-2 outline-offset-2 outline-[var(--c-text)]'
              : ''}"
          >
            <Glyph
              name={isBoss ? bossDef.glyph : node.glyph}
              cls="{isBoss ? 'h-[44px] w-[44px]' : 'h-[34px] w-[34px]'} {isBoss || node.type === 'elite'
                ? 'text-[var(--c-neg)]'
                : isReachable
                  ? 'text-[var(--c-accent)]'
                  : ''}"
            />

            {#if node.modifier}
              <span
                class="absolute end-1 top-1 h-2 w-2 bg-[var(--c-accent)]"
                title={MODIFIERS[node.modifier].name}
              ></span>
            {/if}

            {#if isCurrent}
              <span class="absolute -bottom-[18px] whitespace-nowrap bg-[var(--c-bg)] px-1 text-[10px] font-bold text-[var(--c-pos)]">
                موقعك
              </span>
            {:else if isBoss}
              <span class="pointer-events-none absolute -bottom-[22px] whitespace-nowrap border border-[var(--c-line-strong)] bg-[var(--c-panel)] px-2 py-0.5 text-[11px] font-bold text-[var(--c-text)]">
                {bossDef.name}
              </span>
            {:else}
              <span class="pointer-events-none absolute -bottom-[18px] whitespace-nowrap bg-[var(--c-bg)]/90 px-1 text-[10px] font-medium {isReachable ? 'font-bold text-[var(--c-text)]' : 'text-[var(--c-muted)]'}">
                {node.name}
              </span>
            {/if}
          </button>
        {/each}
      {/each}

      <!-- Start anchor at bottom -->
      <div
        dir="rtl"
        style="left: 50%; top: {START_Y}px; margin-left: -22px; margin-top: -22px;"
        class="absolute z-10 flex h-[44px] w-[44px] items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-strip)] text-[var(--c-muted)]"
        title="نقطة الانطلاق"
      >
        <Glyph name="node-start" cls="h-6 w-6" />
        <span class="pointer-events-none absolute -bottom-4 whitespace-nowrap text-[10px] text-[var(--c-muted)]">
          البداية
        </span>
      </div>
    </div>
  </div>

  <!-- Bottom node inspection & launch bar -->
  {#if selectedNode}
    {@const mod = selectedNode.modifier ? MODIFIERS[selectedNode.modifier] : null}
    <div
      class="shell-enter-bottom shrink-0 border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div class="mx-auto flex max-w-[560px] flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0 flex-1 space-y-1 text-start">
          <div class="flex items-center gap-2">
            <Glyph
              name={selectedNode.type === 'boss' ? bossDef.glyph : selectedNode.glyph}
              cls="h-4 w-4 shrink-0 text-[var(--c-accent)]"
            />
            <h3 class="font-heading text-[15px] font-bold text-[var(--c-text)]">
              {selectedNode.type === 'boss' ? `${selectedNode.name}: ${bossDef.name}` : selectedNode.name}
            </h3>
          </div>
          <p class="text-[12.5px] leading-[1.5] text-[var(--c-text-2)]">
            <BdiText text={selectedNode.type === 'boss' ? bossDef.phase1.rule : NODE_HINTS[selectedNode.type]} />
          </p>
          {#if mod}
            <div class="flex items-center gap-1.5 pt-0.5 text-[12px] text-[var(--c-accent)]">
              <Glyph name={mod.glyph} cls="h-3.5 w-3.5 shrink-0" />
              <b>{mod.name}:</b>
              <span class="text-[var(--c-text-2)]"><BdiText text={mod.description} /></span>
            </div>
          {/if}
        </div>

        <div class="flex shrink-0 items-center gap-2">
          {#if selectedIsReachable}
            <button
              type="button"
              data-action="launch-node"
              onclick={() => launchMapNode(selectedNode.id)}
              class="btn-primary-chamfer min-h-[44px] flex-1 px-6 text-[14px] font-bold sm:flex-none"
            >
              انطلق
            </button>
          {:else}
            <span class="border border-dashed border-[var(--c-line-strong)] px-3 py-2 text-[12px] text-[var(--c-muted)]">
              {selectedNode.visited ? 'أنجزتَ هذه المحطة' : 'اختر محطة متصلة بمسارك'}
            </span>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-strip)] px-4 py-2 text-center text-[12px] text-[var(--c-muted)]">
      اختر محطة مضيئة على المسار لمعاينتها والانطلاق إليها
    </div>
  {/if}

  <!-- Map Legend Sheet («دليل الخريطة») -->
  {#if legendOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onclick={(e) => {
        if (e.target === e.currentTarget) closeLegend();
      }}
      class="fixed inset-0 z-[125] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="دليل الخريطة"
        class="shell-enter-bottom flex max-h-[calc(100dvh-24px)] w-full max-w-[460px] flex-col border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] sm:border sm:border-[var(--c-line-strong)] sm:border-t-2 sm:border-t-[var(--c-accent)]"
      >
        <header class="flex min-h-[48px] shrink-0 items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-strip)] ps-4">
          <h2 class="font-heading text-[15px] font-bold text-[var(--c-text)]">دليل الخريطة</h2>
          <button
            type="button"
            onclick={closeLegend}
            aria-label="إغلاق دليل الخريطة"
            class="pressable flex min-h-[44px] min-w-[44px] items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
          >
            <GameIcon name="cross-mark" cls="h-4 w-4" />
          </button>
        </header>

        <div class="scroll-area min-h-0 flex-1 space-y-2 overflow-y-auto p-3.5">
          {#each LEGEND_ORDER as t (t)}
            {@const meta = NODE_META[t]}
            {@const isDanger = t === 'elite' || t === 'boss'}
            <div class="flex items-center gap-3 border border-[var(--c-line)] bg-[var(--c-bg)] p-2.5">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-strip)] {isDanger ? 'text-[var(--c-neg)]' : 'text-[var(--c-accent)]'}">
                <Glyph name={meta.glyph} cls="h-6 w-6" />
              </div>
              <div class="min-w-0 flex-1 text-start">
                <b class="block text-[13px] font-bold text-[var(--c-text)]">{meta.name}</b>
                <p class="mt-0.5 text-[12px] leading-[1.45] text-[var(--c-text-2)]">
                  <BdiText text={NODE_HINTS[t]} />
                </p>
              </div>
            </div>
          {/each}
        </div>

        <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-strip)] px-3.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onclick={closeLegend}
            class="btn-primary-chamfer min-h-[44px] w-full text-[14px] font-bold"
          >
            أغلق الدليل
          </button>
        </footer>
      </div>
    </div>
  {/if}
</div>
