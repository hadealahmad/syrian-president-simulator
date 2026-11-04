<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import { countPendingDraftActions } from './pending-actions';
  import { shellLayout } from './viewport';

  let layout = $derived($shellLayout);
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');
  let pending = $derived(countPendingDraftActions($draftStore));
  let gameOver = $derived($gameStore.isGameOver);
  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));

  let size = $derived(isPortrait ? 60 : isLandscape ? 56 : 104);
  let positionStyle = $derived(
    isPortrait
      ? 'bottom: calc(var(--shell-tab-h) + env(safe-area-inset-bottom) + 10px); inset-inline-start: 12px;'
      : isLandscape
        ? 'bottom: 8px; inset-inline-end: 8px;'
        : 'bottom: calc(20px + env(safe-area-inset-bottom)); inset-inline-start: 22px;'
  );

  function endTurn(): void {
    if (gameOver) return;
    if ($uiStore.turnFlowStage !== 'closed') return;
    uiStore.closeActivePanel();
    uiStore.setAlertsOpen(false);
    uiStore.setTurnFlowStage('review');
  }
</script>

<button
  type="button"
  data-tour="end-turn"
  onclick={endTurn}
  disabled={gameOver}
  aria-label="إنهاء الدور والمصادقة على القرارات"
  title={gameOver
    ? 'انتهت اللعبة'
    : 'مراجعة القرارات المعتمدة لهذا الدور والمصادقة عليها'}
  class="pointer-events-auto fixed z-[46] flex flex-col items-center justify-center shell-round-seal shell-seal"
  style="{positionStyle} width: {size}px; height: {size}px;"
>
  <span class="relative z-10 flex flex-col items-center justify-center gap-0.5 leading-none">
    {#if !isPortrait && !isLandscape}
      <GameIcon name="hourglass" cls="mb-0.5 h-5 w-5 shrink-0 opacity-80" />
      <span class="text-center font-heading text-[13.5px] font-bold leading-[1.1]">إنهاء الدور</span>
      <span class="text-[7.5px] tracking-[0.6px] opacity-70">{seasonText} · {$gameStore.calendarYear}</span>
      <span class="mt-0.5 text-[7px] font-mono opacity-65">الدور {turnText}/40</span>
    {:else}
      <GameIcon name="hourglass" cls="h-4 w-4 shrink-0 opacity-80" />
      <span class="text-center font-heading text-[8.5px] font-bold leading-[1.15]">إنهاء<br />الدور</span>
    {/if}
  </span>

  {#if pending > 0}
    <span
      class="absolute -top-1 -end-1 z-20 flex h-[23px] min-w-[23px] items-center justify-center border-2 border-charcoal-deep bg-status-danger px-1 font-mono text-[10px] font-bold leading-none text-charcoal-white shadow-md shell-round-chip"
      aria-label="{pending} قرارات معلّقة"
      title="{pending} قرار معلّق في المسودة"
    >
      {pending > 99 ? '99+' : pending}
    </span>
  {/if}
</button>
