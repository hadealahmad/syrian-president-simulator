<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { startNewGame } from '../stores/new-game';
  import { focusTrap } from './actions/focus-trap';
  import { MAX_TURNS } from '../engine/constants';

  let failState = $derived($gameStore.failState);
  // executeTurnLifecycle increments turnNumber before the fail check, so a
  // collapse caused by turn 40 would otherwise be reported as "turn 41".
  let playedTurn = $derived(Math.min($gameStore.turnNumber, MAX_TURNS));

  function handleRestart(): void {
    startNewGame();
  }
</script>

{#if $gameStore.isGameOver && failState}
  <div
    class="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4 select-none scroll-area scroll-umber overflow-y-auto font-arabic"
  >
    <div
      use:focusTrap
      role="dialog"
      aria-modal="true"
      aria-label="نهاية المحاكاة — انهيار سيادي"
      class="m-auto w-full max-w-[620px] bg-forest-deep/95 border-2 border-umber-crimson shadow-2xl p-8 space-y-6 text-center rounded-none text-wheat-light"
    >
      <div class="w-14 h-14 bg-umber-deep border-2 border-umber-crimson flex items-center justify-center mx-auto text-wheat-light text-2xl font-bold rounded-none font-heading">
        !
      </div>

      <div class="space-y-2">
        <span class="text-xs text-wheat-dark font-bold tracking-widest uppercase font-heading">
          نهاية المحاكاة — انهيار سيادي
        </span>
        <h2 class="text-xl font-bold text-wheat-light font-heading">
          {failState.titleAr}
        </h2>
        <span class="text-xs text-wheat-mid font-mono font-heading">
          سقطت الدولة في الدور {playedTurn} ({$gameStore.calendarYear})
        </span>
      </div>

      <p class="text-xs text-wheat-light leading-relaxed bg-charcoal-deep p-4 border border-charcoal-mid text-right font-arabic rounded-none">
        {failState.narrativeAr}
      </p>

      <div class="pt-4">
        <button
          data-autofocus
          onclick={handleRestart}
          class="px-8 py-3 bg-umber-crimson hover:bg-umber-mid text-wheat-light font-bold text-xs border border-umber-crimson transition-colors active:translate-y-0.5 cursor-pointer rounded-none font-heading"
        >
          إعادة المحاولة من البداية
        </button>
      </div>
    </div>
  </div>
{/if}
