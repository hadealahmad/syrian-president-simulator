<script lang="ts">
  import type { AnimState } from '../animate';
  import {
    getForecastView,
    getQueueView,
    isForecastRevealed,
    type BattleState,
    type DeckCard,
    type LaneIndex,
    type RoundPreview,
  } from '../engine';
  import Forecast from './Forecast.svelte';
  import Gauge from './Gauge.svelte';
  import Slot from './Slot.svelte';

  let {
    battle,
    preview,
    anim,
    validZones,
    hoveredTarget,
    ghostUnitCard = null,
    redeployFromLane = null,
    wholeBoardTarget = false,
    onSlotTap,
    onSlotHover,
    onBoardTap,
  }: {
    battle: BattleState;
    preview: RoundPreview;
    anim: AnimState;
    validZones: {
      player: boolean[];
      crisis: boolean[];
      queue: boolean[];
    };
    hoveredTarget: { zone: 'player' | 'crisis' | 'queue'; lane: LaneIndex } | null;
    ghostUnitCard?: DeckCard | null;
    redeployFromLane?: LaneIndex | null;
    wholeBoardTarget?: boolean;
    onSlotTap: (zone: 'player' | 'crisis' | 'queue', lane: LaneIndex) => void;
    onSlotHover?: (zone: 'player' | 'crisis' | 'queue', lane: LaneIndex, entering: boolean) => void;
    onBoardTap?: () => void;
  } = $props();

  const LANES: LaneIndex[] = [0, 1, 2, 3];

  const queueView = $derived(getQueueView(battle));
  const forecastView = $derived(getForecastView(battle));
  const forecastRevealed = $derived(isForecastRevealed(battle));

  function slotAnimClass(zone: 'queue' | 'crisis' | 'player', lane: LaneIndex): string {
    const classes: string[] = [];
    if (zone === 'player' && anim.lunging?.side === 'player' && anim.lunging.lane === lane) {
      classes.push('is-lunging-up');
    }
    if (zone === 'crisis' && anim.lunging?.side === 'crisis' && anim.lunging.lane === lane) {
      classes.push('is-lunging-down');
    }
    if ((zone === 'player' || zone === 'crisis') && anim.shaking?.side === zone && anim.shaking.lane === lane) {
      classes.push('is-shaking', 'is-hit-flash');
    }
    if (anim.destroying?.zone === zone && anim.destroying.lane === lane) {
      classes.push('is-destroying');
    }
    if (zone === 'crisis' && anim.droppingLanes.includes(lane)) {
      classes.push('is-dropping');
    }
    if (zone === 'queue' && anim.fadingQueueLanes.includes(lane)) {
      classes.push('is-fading-in');
    }
    return classes.join(' ');
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  onclick={() => {
    if (wholeBoardTarget && onBoardTap) onBoardTap();
  }}
  style="touch-action: none; --anim-lunge-ms: {Math.round(280 * anim.speedScale)}ms; --anim-shake-ms: {Math.round(260 * anim.speedScale)}ms; --anim-destroy-ms: {Math.round(260 * anim.speedScale)}ms; --anim-drop-ms: {Math.round(230 * anim.speedScale)}ms; --anim-fade-ms: {Math.round(210 * anim.speedScale)}ms;"
  class="relative flex min-h-0 flex-1 flex-col justify-evenly gap-0.5 px-2 py-0.5 select-none sm:gap-1 sm:py-1 lg:gap-1.5 lg:py-1.5 {wholeBoardTarget
    ? 'cursor-pointer outline outline-2 -outline-offset-2 outline-[var(--c-accent)]'
    : ''}"
>
  {#if anim.bossFlash}
    <div class="crisis-boss-flash pointer-events-none absolute inset-0 z-40 bg-[var(--c-neg)]"></div>
  {/if}

  {#if anim.banner}
    {#if anim.banner.tone === 'win' || anim.banner.tone === 'loss'}
      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center justify-center border-y-2 py-3 text-center lg:py-4 {anim
          .banner.tone === 'win'
          ? 'border-y-[var(--c-pos)] bg-[var(--c-panel)] text-[var(--c-pos)]'
          : 'border-y-[var(--c-neg)] bg-[var(--c-ev-bg)] text-[var(--c-neg)]'}"
      >
        <span class="font-heading text-[24px] font-black tracking-wide sm:text-[28px] lg:text-[34px]">
          {anim.banner.text}
        </span>
      </div>
    {:else}
      <div
        class="pointer-events-none absolute inset-x-3 top-1/2 z-50 flex -translate-y-1/2 justify-center"
      >
        <div
          class="border-2 px-4 py-1.5 text-[14px] font-bold tracking-tight lg:text-[16px] {anim.banner
            .tone === 'crisis'
            ? 'border-[var(--c-neg)] bg-[var(--c-ev-bg)] text-[var(--c-text)]'
            : anim.banner.tone === 'boss'
              ? 'border-[var(--c-accent)] bg-[var(--c-ev-bg)] text-[var(--c-accent)]'
              : 'border-[var(--c-pos)] bg-[var(--c-panel)] text-[var(--c-text)]'}"
        >
          {anim.banner.text}
        </div>
      </div>
    {/if}
  {/if}

  <!-- 1. Forecast strip -->
  <Forecast slots={forecastView} revealed={forecastRevealed} />

  <!-- 2. Queue row («القادم», 78% scale) -->
  <div data-coach="queue-row" class="crisis-board-group">
    <div class="mb-[2px] text-start text-[10px] font-bold leading-none text-[var(--c-muted)] lg:text-[11px]">
      القادم
    </div>
    <div class="crisis-board-row">
      {#each LANES as lane (lane)}
        {@const q = queueView[lane]}
        <Slot
          zone="queue"
          {lane}
          crisis={q.status === 'visible' ? q.crisis : null}
          hidden={q.status === 'hidden'}
          laneDark={q.laneDark}
          validTarget={validZones.queue[lane]}
          hovered={hoveredTarget?.zone === 'queue' && hoveredTarget.lane === lane}
          animClass={slotAnimClass('queue', lane)}
          popups={anim.popups.filter((p) => p.zone === 'queue' && p.lane === lane)}
          ariaLabel={q.status === 'visible'
            ? `القادم مسار ${lane + 1}: ${q.crisis.name}`
            : q.status === 'hidden'
              ? `القادم مسار ${lane + 1}: مخفي`
              : `القادم مسار ${lane + 1}: فارغ`}
          onTap={() => onSlotTap('queue', lane)}
          onHover={(e) => onSlotHover?.('queue', lane, e)}
        />
      {/each}
    </div>
  </div>

  <!-- 3. Crisis line («الأزمات») -->
  <div class="crisis-board-group">
    <div class="mb-[2px] text-start text-[10px] font-bold leading-none text-[var(--c-muted)] lg:text-[11px]">
      الأزمات
    </div>
    <div class="crisis-board-row">
      {#each LANES as lane (lane)}
        {@const c = battle.crisisLine[lane]}
        {@const sp = preview.crisisSlots[lane]}
        <Slot
          zone="crisis"
          {lane}
          crisis={c}
          laneDark={battle.darkLanes.includes(lane)}
          effectivePower={sp.effectivePower}
          previewDamage={!anim.active ? sp.damageTaken : 0}
          previewDestroyed={!anim.active && sp.destroyed}
          validTarget={validZones.crisis[lane]}
          hovered={hoveredTarget?.zone === 'crisis' && hoveredTarget.lane === lane}
          animClass={slotAnimClass('crisis', lane)}
          popups={anim.popups.filter((p) => p.zone === 'crisis' && p.lane === lane)}
          ariaLabel={c ? `أزمة مسار ${lane + 1}: ${c.name}` : `خانة أزمة فارغة مسار ${lane + 1}`}
          onTap={() => onSlotTap('crisis', lane)}
          onHover={(e) => onSlotHover?.('crisis', lane, e)}
        />
      {/each}
    </div>
  </div>

  <!-- 4. Stability Gauge («الميزان») -->
  <Gauge
    balance={battle.balance}
    projectedBalance={anim.active ? battle.balance : preview.projectedBalance}
    lanePlayerHits={anim.active ? [0, 0, 0, 0] : preview.lanePlayerGaugeHits}
    laneCrisisHits={anim.active ? [0, 0, 0, 0] : preview.laneCrisisGaugeHits}
    flyChips={anim.gaugeChips}
    wouldTriggerBossPhase2={!anim.active && preview.wouldTriggerBossPhase2}
  />

  <!-- 5. Player line («فرقك») -->
  <div data-coach="player-line" class="crisis-board-group">
    <div class="mb-[2px] text-start text-[10px] font-bold leading-none text-[var(--c-muted)] lg:text-[11px]">
      فرقك
    </div>
    <div class="crisis-board-row">
      {#each LANES as lane (lane)}
        {@const u = battle.playerLine[lane]}
        {@const sp = preview.playerSlots[lane]}
        {@const isHoveredEmpty =
          !u && hoveredTarget?.zone === 'player' && hoveredTarget.lane === lane && ghostUnitCard}
        <Slot
          zone="player"
          {lane}
          unit={u}
          laneDark={battle.darkLanes.includes(lane)}
          ghostDeckCard={isHoveredEmpty ? ghostUnitCard : null}
          effectivePower={sp.effectivePower}
          expertiseActive={sp.expertiseActive}
          previewDamage={!anim.active ? sp.damageTaken : 0}
          previewDestroyed={!anim.active && sp.destroyed}
          validTarget={validZones.player[lane]}
          hovered={hoveredTarget?.zone === 'player' && hoveredTarget.lane === lane}
          selectedSource={redeployFromLane === lane}
          animClass={slotAnimClass('player', lane)}
          popups={anim.popups.filter((p) => p.zone === 'player' && p.lane === lane)}
          ariaLabel={u ? `فريق مسار ${lane + 1}: ${u.name}` : `خانة فريقك مسار ${lane + 1}`}
          onTap={() => onSlotTap('player', lane)}
          onHover={(e) => onSlotHover?.('player', lane, e)}
        />
      {/each}
    </div>
  </div>
</div>
