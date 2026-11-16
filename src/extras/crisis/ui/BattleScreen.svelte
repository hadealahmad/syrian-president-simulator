<script lang="ts">
  import { fx } from '../../../lib/ui/fx/feedback';
  import { animStore } from '../animate';
  import {
    applyAction,
    getCardDef,
    getEffectiveCardCost,
    getLegalActions,
    getQueueView,
    previewRound,
    type DeckCard,
    type LaneIndex,
    type PlayerAction,
    type RunState,
  } from '../engine';
  import { cardDetailTarget, performBattleAction } from '../stores';
  import Board from './Board.svelte';
  import Card from './Card.svelte';
  import Coach from './Coach.svelte';
  import DesktopSidebar from './DesktopSidebar.svelte';
  import Hand from './Hand.svelte';
  import RunHeader from './RunHeader.svelte';
  import SupplySheet from './SupplySheet.svelte';
  import {
    buildActionForSlot,
    computeValidZones,
    hitTestSlot,
    type BoardZone,
    type HoveredSlot,
  } from './battle-input';

  let { run }: { run: RunState } = $props();

  let anim = $derived($animStore);
  let liveBattle = $derived(run.battle!);
  let battle = $derived(anim.active && anim.displayBattle ? anim.displayBattle : liveBattle);

  let selectedHandUid = $state<string | null>(null);
  let redeployFromLane = $state<LaneIndex | null>(null);
  let dragCard = $state<DeckCard | null>(null);
  let dragPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });
  let hoveredTarget = $state<HoveredSlot | null>(null);

  $effect(() => {
    if (liveBattle.phase !== 'play' || anim.active) {
      selectedHandUid = null;
      redeployFromLane = null;
      dragCard = null;
      hoveredTarget = null;
    }
  });

  const activeHandUid = $derived(dragCard?.uid ?? selectedHandUid);
  const activeHandCard = $derived(
    activeHandUid ? liveBattle.hand.find((c) => c.uid === activeHandUid) ?? null : null,
  );
  const legalActions = $derived(anim.active ? [] : getLegalActions(liveBattle));

  const validZones = $derived(
    computeValidZones(activeHandCard, legalActions, redeployFromLane, anim.active),
  );

  const wholeBoardTarget = $derived.by(() => {
    if (!activeHandCard || anim.active) return false;
    const def = getCardDef(activeHandCard.defId);
    return (
      def.kind !== 'unit' &&
      (def.target ?? 'none') === 'none' &&
      legalActions.some((a) => a.type === 'playAction' && a.handUid === activeHandCard.uid)
    );
  });

  // Live preview: simulate hovered/dragged play on a copy, then previewRound!
  const simulatedStateAndPreview = $derived.by(() => {
    if (anim.active) {
      return { simBattle: battle, preview: previewRound(battle) };
    }
    if (activeHandCard && hoveredTarget) {
      const act = buildActionForSlot(
        activeHandCard,
        legalActions,
        redeployFromLane,
        hoveredTarget.zone,
        hoveredTarget.lane,
      );
      if (act) {
        try {
          const { state } = applyAction(liveBattle, act);
          return { simBattle: state, preview: previewRound(state) };
        } catch {
          // Fallback to live preview
        }
      }
    }
    return { simBattle: liveBattle, preview: previewRound(liveBattle) };
  });

  const statusHint = $derived.by(() => {
    if (!activeHandCard) return '';
    const def = getCardDef(activeHandCard.defId);
    if (def.target === 'redeploy') {
      return redeployFromLane === null
        ? 'اختر الفريق المراد نقله'
        : 'اختر الخانة الجديدة لإعادة الانتشار';
    }
    return def.description;
  });

  function handleCardTap(card: DeckCard): void {
    const def = getCardDef(card.defId);
    const cost = getEffectiveCardCost(liveBattle, card);
    if (!def.playable || cost > liveBattle.budget) {
      fx('tap');
      cardDetailTarget.set({ kind: 'deckCard', card });
      return;
    }
    fx('select');
    redeployFromLane = null;
    hoveredTarget = null;
    selectedHandUid = selectedHandUid === card.uid ? null : card.uid;
  }

  function handleDragStart(card: DeckCard, x: number, y: number): void {
    fx('select');
    selectedHandUid = card.uid;
    redeployFromLane = null;
    dragCard = card;
    dragPos = { x, y };
    hoveredTarget = hitTestSlot(x, y);
  }

  function handleDragMove(_card: DeckCard, x: number, y: number): void {
    dragPos = { x, y };
    hoveredTarget = hitTestSlot(x, y);
  }

  function handleDragEnd(card: DeckCard, x: number, y: number): void {
    const hit = hitTestSlot(x, y);
    dragCard = null;
    hoveredTarget = null;
    const def = getCardDef(card.defId);

    if ((def.target ?? 'none') === 'none' && def.kind !== 'unit' && y < window.innerHeight - 170) {
      const untargeted: PlayerAction = { type: 'playAction', handUid: card.uid };
      if (legalActions.some((a) => a.type === 'playAction' && a.handUid === card.uid)) {
        selectedHandUid = null;
        performBattleAction(untargeted);
        return;
      }
    }

    if (hit) {
      if (def.target === 'redeploy' && hit.zone === 'player') {
        if (liveBattle.playerLine[hit.lane]) {
          redeployFromLane = hit.lane;
          return;
        }
      }
      const act = buildActionForSlot(card, legalActions, redeployFromLane, hit.zone, hit.lane);
      if (act) {
        selectedHandUid = null;
        redeployFromLane = null;
        performBattleAction(act);
        return;
      }
    }
  }

  function handleSlotHover(zone: BoardZone, lane: LaneIndex, entering: boolean): void {
    if (dragCard || !activeHandCard || anim.active) return;
    if (entering) {
      hoveredTarget = { zone, lane };
    } else if (hoveredTarget?.zone === zone && hoveredTarget.lane === lane) {
      hoveredTarget = null;
    }
  }

  function handleSlotTap(zone: BoardZone, lane: LaneIndex): void {
    if (anim.active) return;

    if (activeHandCard) {
      const def = getCardDef(activeHandCard.defId);
      if (def.target === 'redeploy' && zone === 'player') {
        if (redeployFromLane === null) {
          if (liveBattle.playerLine[lane]) {
            fx('select');
            redeployFromLane = lane;
          }
          return;
        }
        if (redeployFromLane === lane) {
          fx('tap');
          redeployFromLane = null;
          return;
        }
      }
      const act = buildActionForSlot(activeHandCard, legalActions, redeployFromLane, zone, lane);
      if (act) {
        selectedHandUid = null;
        redeployFromLane = null;
        hoveredTarget = null;
        performBattleAction(act);
        return;
      }
    }

    const pv = simulatedStateAndPreview.preview;
    if (zone === 'player') {
      const u = liveBattle.playerLine[lane];
      if (u) {
        fx('tap');
        cardDetailTarget.set({
          kind: 'playerBoard',
          unit: u,
          lane,
          effectivePower: pv.playerSlots[lane].effectivePower,
          expertiseActive: pv.playerSlots[lane].expertiseActive,
        });
      }
    } else if (zone === 'crisis') {
      const c = liveBattle.crisisLine[lane];
      if (c) {
        fx('tap');
        cardDetailTarget.set({
          kind: 'crisisBoard',
          crisis: c,
          lane,
          effectivePower: pv.crisisSlots[lane].effectivePower,
          zone: 'crisis',
        });
      }
    } else if (zone === 'queue') {
      const q = getQueueView(liveBattle)[lane];
      if (q.status === 'visible') {
        fx('tap');
        cardDetailTarget.set({
          kind: 'crisisBoard',
          crisis: q.crisis,
          lane,
          effectivePower: q.crisis.power,
          zone: 'queue',
        });
      }
    }
  }

  function playUntargetedSelected(): void {
    if (!activeHandCard) return;
    selectedHandUid = null;
    hoveredTarget = null;
    performBattleAction({ type: 'playAction', handUid: activeHandCard.uid });
  }

  const battleKindLabel = $derived(
    liveBattle.kind === 'boss'
      ? 'معركة الزعيم'
      : liveBattle.kind === 'elite'
        ? 'معركة صعبة'
        : liveBattle.kind === 'tutorial'
          ? 'تدريب عملي'
          : 'معركة',
  );
</script>

<div class="crisis-battle-shell flex min-h-0 flex-1 flex-col overflow-hidden">
  <RunHeader
    {run}
    subtitle={`${battleKindLabel} · الجولة ${battle.round}`}
    modifierId={battle.modifier}
  />

  <div class="flex min-h-0 flex-1 overflow-hidden">
    <DesktopSidebar {run} {battle} />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col justify-between overflow-hidden">
      <Board
        battle={anim.active ? battle : liveBattle}
        preview={simulatedStateAndPreview.preview}
        {anim}
        {validZones}
        {hoveredTarget}
        ghostUnitCard={!dragCard && activeHandCard && getCardDef(activeHandCard.defId).kind === 'unit'
          ? activeHandCard
          : null}
        {redeployFromLane}
        {wholeBoardTarget}
        onSlotTap={handleSlotTap}
        onSlotHover={handleSlotHover}
        onBoardTap={playUntargetedSelected}
      />

      <Hand
        battle={liveBattle}
        isAnimating={anim.active}
        {selectedHandUid}
        draggingHandUid={dragCard?.uid ?? null}
        {statusHint}
        canPlayUntargeted={wholeBoardTarget}
        onCardTap={handleCardTap}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onPlayUntargeted={playUntargetedSelected}
        onCancelSelection={() => {
          fx('tap');
          selectedHandUid = null;
          redeployFromLane = null;
          hoveredTarget = null;
        }}
        onEndRound={() => performBattleAction({ type: 'endRound' })}
      />
    </div>
  </div>

  {#if !anim.active && liveBattle.phase === 'supply'}
    <SupplySheet
      battle={liveBattle}
      onPick={(index) => performBattleAction({ type: 'chooseSupply', index })}
    />
  {/if}

  {#if dragCard}
    <div class="crisis-drag-ghost" style="left: {dragPos.x}px; top: {dragPos.y}px;">
      <Card
        deckCard={dragCard}
        size="board"
        effectiveCost={getEffectiveCardCost(liveBattle, dragCard)}
        selected={true}
      />
    </div>
  {/if}

  <Coach />
</div>
