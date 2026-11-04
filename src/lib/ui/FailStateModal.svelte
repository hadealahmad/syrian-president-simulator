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
    class="pointer-events-auto fixed inset-0 z-[80] flex select-none items-center justify-center bg-black/45 p-4 backdrop-blur-sm scroll-area scroll-umber overflow-y-auto font-arabic"
  >
    <div
      use:focusTrap
      role="dialog"
      aria-modal="true"
      aria-label="نهاية المحاكاة — انهيار سيادي"
      class="relative m-auto w-full max-w-[620px] overflow-hidden border border-umber-border/70 bg-forest-deep text-center text-wheat-light shadow-2xl shell-round-pop"
      style="background: radial-gradient(640px 220px at 100% 0%, rgb(from var(--color-status-danger) r g b / 0.16), transparent 72%), linear-gradient(165deg, var(--color-forest-mid), var(--color-forest-deep) 62%, var(--color-charcoal-deep));"
    >
      <span
        class="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style="background: linear-gradient(90deg, transparent, var(--color-status-danger), var(--color-wheat-gold), var(--color-status-danger), transparent);"
        aria-hidden="true"
      ></span>

      <div class="space-y-3 px-6 pb-6 pt-7">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-umber-crimson bg-umber-deep font-heading text-2xl font-bold text-wheat-light"
          aria-hidden="true"
        >
          !
        </div>

        <div class="space-y-1.5">
          <span class="block text-[8.5px] font-bold uppercase tracking-[2.4px] text-umber-crimson font-heading">
            نهاية المحاكاة — انهيار سيادي
          </span>
          <h2 class="font-heading text-[22px] font-bold leading-snug text-wheat-light">
            {failState.titleAr}
          </h2>
          <span class="block font-mono text-[10.5px] text-wheat-dark">
            سقطت الدولة في الدور {playedTurn} ({$gameStore.calendarYear})
          </span>
        </div>

        <p class="border border-wheat-mid/12 bg-charcoal-deep/70 p-4 text-start text-[11px] leading-relaxed text-wheat-light/90 shell-round-item">
          {failState.narrativeAr}
        </p>

        <div class="flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:justify-center">
          <button
            data-autofocus
            type="button"
            onclick={handleRestart}
            class="min-h-11 border border-umber-crimson bg-umber-crimson px-7 py-2.5 text-[11.5px] font-bold text-wheat-light transition-colors hover:bg-umber-mid active:translate-y-0.5 shell-round-item"
          >
            إعادة المحاولة من البداية
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
