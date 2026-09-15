<script lang="ts">
  import { draftStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';
  import { versionStore } from '../stores/version-store';
  import GameIcon from './GameIcon.svelte';

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
      <GameIcon name="check-mark" cls="w-4 h-4 shrink-0" />
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
      <GameIcon name="return-arrow" cls="w-4 h-4 shrink-0" />
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
      <GameIcon name="cycle" cls="w-3.5 h-3.5 text-wheat-dark group-hover:text-wheat-gold transition-colors {$versionStore.isChecking ? 'animate-spin' : ''} shrink-0" />
    </button>

    <!-- Presidential Guidebook Wizard Button -->
    <button
      onclick={() => uiStore.setGuideModal(true, 0)}
      class="flex items-center gap-2 px-3.5 py-3 bg-forest-deep hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold font-bold text-xs border border-charcoal-mid hover:border-wheat-mid shadow-2xl transition-all active:translate-y-0.5 cursor-pointer rounded-none font-heading"
      title="دليل البروتوكول الرئاسي وإرشادات إدارة الدولة وطريقة اللعب"
    >
      <GameIcon name="help" cls="w-4 h-4 shrink-0 text-wheat-gold" />
      <span>دليل البروتوكول الرئاسي</span>
    </button>

    <!-- Game Reset Button -->
    <button
      onclick={() => uiStore.setRestartModal(true)}
      class="flex items-center gap-2 px-3.5 py-3 bg-forest-deep hover:bg-umber-deep text-wheat-dark hover:text-wheat-light font-bold text-xs border border-charcoal-mid hover:border-umber-border shadow-2xl transition-all active:translate-y-0.5 cursor-pointer rounded-none font-heading"
      title="إعادة تشغيل المحاكاة وتصفير الدورات وبدء ولاية جديدة"
    >
      <GameIcon name="power-button" cls="w-4 h-4 shrink-0 text-amber-300" />
      <span>إعادة تشغيل المحاكاة</span>
    </button>
  </div>
</div>
