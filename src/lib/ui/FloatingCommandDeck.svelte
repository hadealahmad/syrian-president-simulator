<script lang="ts">
  import { draftStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';

  let totalDraftActions = $derived(
    $draftStore.activePoliticalActions.length +
    $draftStore.provincialProjects.length +
    ($draftStore.deminingPriorityId ? 1 : 0) +
    ($draftStore.powerBoostGovId ? 1 : 0)
  );
</script>

<!-- Floating Unified Command Deck Overlay on 3D Map -->
<div class="pointer-events-none absolute inset-0 z-30 overflow-hidden font-arabic select-none">
  <!-- Left Side Command Deck: Review & End Turn + Reset Draft (Anchored at left-[406px]) -->
  <div class="pointer-events-auto absolute bottom-6 left-[406px] flex items-center gap-2">
    <!-- End Turn & Review Button -->
    <button
      onclick={() => uiStore.setTurnReviewModal(true)}
      class="flex items-center gap-2.5 px-5 py-3 bg-wheat-gold hover:bg-wheat-light text-forest-deep font-bold text-xs border border-wheat-mid shadow-2xl transition-all active:translate-y-0.5 cursor-pointer rounded-none font-heading"
      title="مراجعة القرارات المعتمدة لهذا الدور والمصادقة عليها"
    >
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>مراجعة وإنهاء الدور</span>
      {#if totalDraftActions > 0}
        <span class="px-1.5 py-0.2 bg-forest-deep text-wheat-gold text-[10px] font-mono border border-forest-surface font-bold">
          {totalDraftActions}
        </span>
      {/if}
    </button>

    <!-- Reset Draft Button (Directly paired with End Turn) -->
    <button
      onclick={() => draftStore.reset()}
      class="flex items-center gap-2 px-3.5 py-3 bg-forest-deep hover:bg-forest-mid text-wheat-mid hover:text-wheat-light font-bold text-xs border border-charcoal-mid hover:border-wheat-mid shadow-2xl transition-all active:translate-y-0.5 cursor-pointer rounded-none font-heading"
      title="تراجع عن جميع القرارات والسياسات غير المصادقة لهذا الدور"
    >
      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      <span>تراجع عن المسودة</span>
    </button>
  </div>

  <!-- Right Side (Opposite) Command Deck: Presidential Guide Wizard & Game Reset (Anchored at right-[406px]) -->
  <div class="pointer-events-auto absolute bottom-6 right-[406px] flex items-center gap-2">
    <!-- Presidential Guidebook Wizard Button -->
    <button
      onclick={() => uiStore.setGuideModal(true, 0)}
      class="flex items-center gap-2 px-3.5 py-3 bg-forest-deep hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold font-bold text-xs border border-charcoal-mid hover:border-wheat-mid shadow-2xl transition-all active:translate-y-0.5 cursor-pointer rounded-none font-heading"
      title="دليل البروتوكول الرئاسي وإرشادات إدارة الدولة وطريقة اللعب"
    >
      <svg class="w-4 h-4 shrink-0 text-wheat-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>دليل البروتوكول الرئاسي</span>
    </button>

    <!-- Game Reset Button -->
    <button
      onclick={() => uiStore.setRestartModal(true)}
      class="flex items-center gap-2 px-3.5 py-3 bg-forest-deep hover:bg-umber-deep text-wheat-dark hover:text-wheat-light font-bold text-xs border border-charcoal-mid hover:border-umber-border shadow-2xl transition-all active:translate-y-0.5 cursor-pointer rounded-none font-heading"
      title="إعادة تشغيل المحاكاة وتصفير الدورات وبدء ولاية جديدة"
    >
      <svg class="w-3.5 h-3.5 shrink-0 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M21 21v-5h-5" />
      </svg>
      <span>إعادة تشغيل المحاكاة</span>
    </button>
  </div>
</div>
