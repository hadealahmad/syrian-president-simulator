<script lang="ts">
  import { uiStore } from '../stores/ui-store';
  import { versionStore } from '../stores/version-store';
  import { startGuideTour } from './guide-tour';
  import GameIcon from './GameIcon.svelte';

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
</script>

<!-- System Controls: version, guide, new game - top left under the top bar -->
<div
  class="fixed top-[88px] z-30 flex items-center gap-2 transition-all duration-300 ease-in-out select-none font-arabic {isLeftOpen ? 'left-[396px]' : 'left-3'}"
>
  <!-- Version & Cache Busting Button (icon only) -->
  <button
    onclick={() => versionStore.forceHardReload()}
    class="relative h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid/80 hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer transition-all active:scale-95 rounded-none group"
    title="إصدار النظام الحالي {$versionStore.currentVersion} - انقر لإفراغ الذاكرة المؤقتة وإعادة التحميل القسري للنسخة الأحدث"
    aria-label="تحديث النسخة"
  >
    <span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full {$versionStore.hasUpdate ? 'bg-amber-400 animate-ping' : 'bg-forest-accent'}"></span>
    <GameIcon name="cycle" cls="w-4 h-4 text-wheat-dark group-hover:text-wheat-gold transition-colors {$versionStore.isChecking ? 'animate-spin' : ''} shrink-0" />
  </button>

  <!-- Presidential Guide Tour (icon only) -->
  <button
    data-tour="guide-btn"
    onclick={() => startGuideTour()}
    class="h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer transition-all active:scale-95 rounded-none"
    title="دليل البروتوكول الرئاسي وإرشادات إدارة الدولة وطريقة اللعب"
    aria-label="دليل البروتوكول الرئاسي"
  >
    <GameIcon name="help" cls="w-4 h-4 shrink-0 text-wheat-gold" />
  </button>

  <!-- New Game Button -->
  <button
    onclick={() => uiStore.setRestartModal(true)}
    class="h-7 px-2.5 flex items-center gap-1.5 bg-forest-deep/90 hover:bg-umber-deep text-wheat-dark hover:text-wheat-light font-bold text-[11px] border border-charcoal-mid hover:border-umber-border shadow-lg cursor-pointer transition-all active:scale-95 rounded-none font-heading"
    title="بدء ولاية رئاسية جديدة وتصفير الدورات"
  >
    <GameIcon name="power-button" cls="w-4 h-4 shrink-0 text-amber-300" />
    <span>بدء لعبة جديدة</span>
  </button>
</div>
