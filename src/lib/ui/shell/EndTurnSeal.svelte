<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { budgetStore, draftStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import { fx } from '../fx/feedback';
  import { countPendingDraftActions } from './pending-actions';
  import { shellLayout } from './viewport';

  interface Props {
    /** True when mounted inside the portrait CommandDock or vertical rail. */
    integrated?: boolean;
  }

  let { integrated = false }: Props = $props();

  let layout = $derived($shellLayout);
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');

  let pending = $derived(countPendingDraftActions($draftStore, $gameStore));
  let overBudget = $derived(
    $budgetStore.remainingPC < 0 || $budgetStore.remainingUSD < 0
  );
  let gameOver = $derived($gameStore.isGameOver);

  let pendingLabel = $derived.by(() => {
    if (overBudget) return 'تجاوز الموازنة';
    if (pending === 0) return '0 قرارات';
    if (pending === 1) return 'قرار 1 معلق';
    if (pending === 2) return 'قراران معلقان';
    if (pending <= 10) return `${pending} قرارات معلقة`;
    return `${pending} قرار معلق`;
  });

  function endTurn(): void {
    if (gameOver) {
      fx('error');
      return;
    }
    if ($uiStore.turnFlowStage !== 'closed') return;
    fx(overBudget ? 'error' : 'endTurn');
    uiStore.closeActivePanel();
    uiStore.setAlertsOpen(false);
    uiStore.setTurnFlowStage('review');
  }
</script>

<button
  type="button"
  data-tour="end-turn"
  data-flow-open="review"
  onclick={endTurn}
  disabled={gameOver}
  aria-label={overBudget
    ? 'إنهاء الدور (تجاوز في الموازنة — راجع المسودة)'
    : 'إنهاء الدور والمصادقة على القرارات'}
  title={gameOver
    ? 'انتهت اللعبة'
    : overBudget
      ? 'تجاوز في الموازنة — انقر لمراجعة المسودة وتعديلها'
      : layout === 'desktop'
        ? 'مراجعة القرارات المعتمدة لهذا الدور والمصادقة عليها (E / Enter)'
        : 'مراجعة القرارات المعتمدة لهذا الدور والمصادقة عليها'}
  class="shell-seal pressable pointer-events-auto relative flex flex-col items-center justify-center leading-[1.25]
    {isPortrait
      ? 'h-full w-[96px] shrink-0 px-2'
      : isLandscape
        ? 'h-[56px] w-full shrink-0 px-1'
        : 'h-[72px] min-[1600px]:h-[82px] min-[2200px]:h-[94px] w-full shrink-0 px-1.5'}
    {overBudget ? 'border-2 border-[var(--c-neg)]' : ''}"
  style={isPortrait
    ? 'clip-path: polygon(0 12px, 12px 0, 100% 0, 100% 100%, 0 100%);'
    : ''}
>
  {#if layout === 'desktop'}
    <span
      class="num pointer-events-none absolute top-1 start-1 inline-flex h-[15px] min-w-[15px] min-[1600px]:h-[17px] min-[1600px]:min-w-[17px] items-center justify-center border border-[var(--c-ink)]/35 bg-[var(--c-ink)]/10 px-0.5 text-[10px] font-bold leading-none text-[var(--c-ink)]"
      aria-hidden="true"
    >
      ⏎
    </span>
  {/if}
  <span
    class="font-heading font-bold {isPortrait
      ? 'text-[13.5px]'
      : isLandscape
        ? 'text-[12px]'
        : 'text-[15px] min-[1600px]:text-[16.5px] min-[2200px]:text-[18px]'}"
  >
    إنهاء الدور
  </span>
  {#key pending}
    <span
      class="oc-bump num mt-0.5 whitespace-nowrap font-semibold opacity-90 {isLandscape
        ? 'text-[10px]'
        : 'text-[11px] min-[1600px]:text-[12px] min-[2200px]:text-[13px]'} {overBudget
        ? 'text-[var(--c-ev-bg)] font-bold'
        : ''}"
    >
      {pendingLabel}
    </span>
  {/key}
</button>
