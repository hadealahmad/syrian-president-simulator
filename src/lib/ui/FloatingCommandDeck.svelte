<script lang="ts">
  import { draftStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import { versionStore } from '../stores/version-store';

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
  let isRightOpen = $derived($uiStore.isMinistryDrawerOpen);

  let totalDraftActions = $derived(
    $draftStore.activePoliticalActions.length +
    $draftStore.provincialProjects.length +
    ($draftStore.deminingPriorityId ? 1 : 0) +
    ($draftStore.powerBoostGovId ? 1 : 0)
  );
</script>

<!-- Floating Unified Command Deck Overlay on Sovereign Map -->
<div class="pointer-events-none absolute inset-0 z-30 overflow-hidden font-arabic select-none">
  <!-- Left Side Command Deck: Review & End Turn + Reset Draft (Anchored at left-[406px]) -->
  <div class="pointer-events-auto absolute bottom-6 flex items-center gap-2 transition-all duration-300 ease-in-out {isLeftOpen ? 'left-[406px]' : 'left-6'}">
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

  <!-- Right Side (Opposite) Command Deck: Presidential Guide Wizard, Game Reset, & Version Badge (Anchored at right-[406px]) -->
  <div class="pointer-events-auto absolute bottom-6 flex items-center gap-2 transition-all duration-300 ease-in-out {isRightOpen ? 'right-[406px]' : 'right-6'}">
    <!-- Version & Cache Busting Button -->
    <button
      onclick={() => versionStore.forceHardReload()}
      class="flex items-center gap-1.5 px-3 py-3 bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid/80 hover:text-wheat-gold font-mono text-[11px] border border-charcoal-mid hover:border-wheat-mid/60 shadow-2xl transition-all active:translate-y-0.5 cursor-pointer rounded-none group"
      title="إصدار النظام الحالي - انقر لإفراغ الذاكرة المؤقتة وإعادة التحميل القسري للنسخة الأحدث"
    >
      <span class="w-2 h-2 rounded-full {$versionStore.hasUpdate ? 'bg-amber-400 animate-ping' : 'bg-forest-accent'}"></span>
      <span class="tracking-tight">v{$versionStore.currentVersion}</span>
      <svg class="w-3 h-3 text-wheat-dark group-hover:text-wheat-gold transition-colors {$versionStore.isChecking ? 'animate-spin' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8" />
        <polyline points="21 3 21 8 16 8" />
      </svg>
    </button>

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
