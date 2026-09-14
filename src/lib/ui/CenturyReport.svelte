<script lang="ts">
  import { gameStore } from '../stores/game-store';

  let ending = $derived($gameStore.centuryEnding);

  function handleRestart(): void {
    gameStore.restart();
  }
</script>

{#if $gameStore.isGameOver && ending}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-deep/95 backdrop-blur-xl p-6 select-none overflow-y-auto font-arabic"
  >
    <div
      class="w-full max-w-2xl bg-forest-deep border border-wheat-mid shadow-2xl p-8 space-y-6 text-center rounded-none text-wheat-light"
    >
      <div class="space-y-2">
        <span class="text-xs text-wheat-dark font-bold tracking-widest uppercase font-heading">
          تقرير المئوية: مصير الجمهورية بعد 100 عام
        </span>
        <h1 class="text-2xl font-bold text-wheat-light font-heading">
          {ending.titleAr}
        </h1>
        <h2 class="text-xs text-wheat-mid font-medium font-heading">
          {ending.subtitleAr}
        </h2>
      </div>

      <!-- Score Badge -->
      <div class="inline-flex items-center gap-3 px-5 py-2.5 bg-forest-mid border border-wheat-mid rounded-none">
        <span class="text-xs text-wheat-dark font-heading">الدرجة السيادية التاريخية:</span>
        <span class="text-lg font-bold text-wheat-light font-mono">{ending.finalScore} / 100</span>
      </div>

      <!-- Historical Retrospective Narrative -->
      <div class="space-y-4 text-right text-xs text-wheat-light leading-relaxed font-arabic">
        <div class="bg-charcoal-deep p-4 border border-charcoal-mid space-y-2 rounded-none">
          <span class="text-wheat-mid font-bold block text-xs font-heading">المسار التنموي والمؤسسي العام:</span>
          <p class="text-wheat-light leading-relaxed">{ending.reportAr}</p>
        </div>

        <div class="bg-charcoal-deep p-4 border border-charcoal-mid space-y-2 rounded-none">
          <span class="text-forest-accent font-bold block text-xs font-heading">مسار الجبهة الجنوبية واستقرار الحدود:</span>
          <h3 class="text-wheat-light font-semibold block font-heading">{ending.southernTitleAr}</h3>
          <p class="text-wheat-light leading-relaxed">{ending.southernReportAr}</p>
        </div>
      </div>

      <div class="pt-4 flex justify-center gap-4">
        <button
          onclick={handleRestart}
          class="px-8 py-3 bg-wheat-mid hover:bg-wheat-light text-forest-deep font-bold text-xs border border-wheat-mid transition-colors active:translate-y-0.5 cursor-pointer rounded-none font-heading"
        >
          بدء عهد رئاسي جديد
        </button>
      </div>
    </div>
  </div>
{/if}
