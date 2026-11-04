<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { startNewGame } from '../stores/new-game';
  import { focusTrap } from './actions/focus-trap';

  let ending = $derived($gameStore.centuryEnding);

  function handleRestart(): void {
    startNewGame();
  }
</script>

{#if $gameStore.isGameOver && ending}
  <div
    class="pointer-events-auto fixed inset-0 z-50 flex select-none items-center justify-center bg-black/45 p-4 backdrop-blur-sm scroll-area overflow-y-auto font-arabic"
  >
    <div
      use:focusTrap
      role="dialog"
      aria-modal="true"
      aria-label="تقرير المئوية: مصير الجمهورية بعد 100 عام"
      class="relative m-auto w-full max-w-[640px] overflow-hidden border border-wheat-mid/35 bg-forest-deep text-center text-wheat-light shadow-2xl shell-round-pop"
      style="background: radial-gradient(660px 240px at 0% 0%, rgb(from var(--color-wheat-gold) r g b / 0.12), transparent 70%), linear-gradient(165deg, var(--color-forest-mid), var(--color-forest-deep) 60%, var(--color-charcoal-deep));"
    >
      <span
        class="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style="background: linear-gradient(90deg, transparent, var(--color-wheat-gold), var(--color-forest-accent), var(--color-wheat-gold), transparent);"
        aria-hidden="true"
      ></span>

      <div class="space-y-4 px-6 pb-6 pt-7">
        <div class="space-y-1.5">
          <span class="flex items-center justify-center gap-2 text-[8.5px] font-bold tracking-[2px] text-forest-accent font-heading">
            <span class="h-px w-6 bg-forest-accent/60"></span>
            تقرير المئوية · مصير الجمهورية بعد مئة عام
            <span class="h-px w-6 bg-forest-accent/60"></span>
          </span>
          <h1 class="font-heading text-[26px] font-bold leading-snug text-wheat-light">
            {ending.titleAr}
          </h1>
          <h2 class="font-heading text-[12px] font-medium text-wheat-mid">
            {ending.subtitleAr}
          </h2>
        </div>

        <!-- Score badge -->
        <div class="inline-flex items-center gap-3 border border-wheat-gold/45 bg-wheat-gold/10 px-4 py-2 shell-round-chip">
          <span class="text-[10px] text-wheat-dark font-heading">الدرجة السيادية التاريخية</span>
          <span class="font-mono text-[17px] font-bold text-wheat-gold" dir="ltr">
            {ending.finalScore} / 100
          </span>
        </div>

        <!-- Historical retrospective narrative -->
        <div class="space-y-2 text-start text-[11px] leading-relaxed text-wheat-light">
          <div class="border border-wheat-mid/12 bg-charcoal-deep/60 p-3.5 shell-round-item">
            <span class="mb-1 block font-heading text-[10.5px] font-bold text-wheat-mid">
              المسار التنموي والمؤسسي العام
            </span>
            <p class="leading-relaxed text-wheat-light/90">{ending.reportAr}</p>
          </div>

          <div class="border border-forest-accent/25 bg-forest-mid/30 p-3.5 shell-round-item">
            <span class="mb-1 block font-heading text-[10.5px] font-bold text-forest-accent">
              مسار الجبهة الجنوبية واستقرار الحدود
            </span>
            <h3 class="mb-1 block font-heading text-[11.5px] font-semibold text-wheat-light">
              {ending.southernTitleAr}
            </h3>
            <p class="leading-relaxed text-wheat-light/90">{ending.southernReportAr}</p>
          </div>
        </div>

        <div class="flex justify-center pt-1">
          <button
            data-autofocus
            type="button"
            onclick={handleRestart}
            class="min-h-11 border border-wheat-gold bg-wheat-gold px-7 py-2.5 text-[11.5px] font-bold text-forest-deep transition-colors hover:bg-wheat-light active:translate-y-0.5 shell-round-item"
          >
            بدء عهد رئاسي جديد
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
