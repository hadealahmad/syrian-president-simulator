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
      class="w-full max-w-md bg-forest-deep/95 border-2 border-umber-crimson shadow-2xl p-6 space-y-5 text-wheat-light rounded-none flex flex-col"
    >
      <!-- Header -->
      <div class="border-b border-charcoal-mid pb-3 space-y-1">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-umber-crimson rounded-none"></span>
          <h2 class="text-base font-bold text-wheat-light font-heading">
            تأكيد إعادة تشغيل المحاكاة
          </h2>
        </div>
        <p class="text-xs text-wheat-dark font-medium">
          إعادة ضبط الولاية الرئاسية وبدء إدارة الدولة من الدور 01
        </p>
      </div>

      <!-- Sovereign Warning Box -->
      <div class="p-3.5 bg-forest-surface border border-charcoal-mid text-xs space-y-2 leading-relaxed text-wheat-mid rounded-none">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-umber-crimson shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span class="text-wheat-light font-bold">
            تحذير سيادي:
          </span>
        </div>
        <p class="text-[11px] text-wheat-mid pr-6">
          سيؤدي هذا الإجراء إلى مسح كافة البيانات المحفوظة في المتصفح محلياً، وإلغاء كافة المراسيم والمشاريع الاقتصادية المعتمدة، والعودة إلى نقطة انطلاق المحاكاة في النصف الأول من عام 2026.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onclick={handleCancel}
          class="flex-1 py-2.5 px-4 bg-forest-mid hover:bg-forest-surface text-wheat-light font-bold text-xs border border-charcoal-mid hover:border-wheat-mid transition-colors cursor-pointer rounded-none font-heading text-center"
        >
          إلغاء ومتابعة اللعبة
        </button>
        <button
          type="button"
          onclick={handleConfirmRestart}
          class="flex-1 py-2.5 px-4 bg-umber-crimson hover:bg-red-700 text-wheat-light font-bold text-xs border border-umber-border shadow-lg transition-colors cursor-pointer rounded-none font-heading text-center"
        >
          تأكيد إعادة البدء
        </button>
      </div>
    </div>
  </div>
{/if}
