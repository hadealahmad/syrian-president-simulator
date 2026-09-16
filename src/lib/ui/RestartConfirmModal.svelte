<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { draftStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';

  function handleCancel(): void {
    uiStore.setRestartModal(false);
  }

  function handleConfirmRestart(): void {
    gameStore.restart();
    draftStore.reset();
    uiStore.selectGovernorate(null);
    uiStore.setTurnReviewModal(false);
    uiStore.setTurnSummaryModal(false);
    uiStore.setRestartModal(false);
  }
</script>

{#if $uiStore.isRestartModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 select-none font-arabic"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-[min(72vw,230px)] min-w-[200px] min-h-[280px] aspect-[3/4] overflow-y-auto bg-forest-deep/95 modal-frame-stripes modal-frame-red shadow-2xl p-6 space-y-5 text-wheat-light rounded-none flex flex-col"
    >
      <!-- Header -->
      <div class="border-b border-charcoal-mid pb-3">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-umber-crimson shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 class="text-base font-bold text-wheat-light font-heading">
            تأكيد إعادة تشغيل المحاكاة
          </h2>
        </div>
      </div>

      <!-- Warning -->
      <p class="text-sm text-wheat-light leading-relaxed">
        سيؤدي هذا الإجراء إلى مسح كافة البيانات المحفوظة في المتصفح محلياً.
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col items-stretch gap-2.5 pt-0">
        <button
          type="button"
          onclick={handleCancel}
          class="w-full py-2.5 px-4 bg-forest-mid hover:bg-forest-surface text-wheat-light font-bold text-xs border border-charcoal-mid hover:border-wheat-mid/60 gloss-hover transition-colors cursor-pointer rounded-none font-heading text-center"
        >
          إلغاء ومتابعة اللعبة
        </button>
        <button
          type="button"
          onclick={handleConfirmRestart}
          class="w-full py-2.5 px-4 bg-danger-button hover:bg-red-700 text-wheat-light font-bold text-xs border border-danger-button hover:border-wheat-mid/60 gloss-hover shadow-lg transition-colors cursor-pointer rounded-none font-heading text-center"
        >
          تأكيد إعادة البدء
        </button>
      </div>
    </div>
  </div>
{/if}
