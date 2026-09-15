<script lang="ts">
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
  let isRightOpen = $derived($uiStore.isMinistryDrawerOpen);
  let areBothOpen = $derived(isLeftOpen || isRightOpen);
</script>

<!-- ========================================================================= -->
<!-- TOP RIGHT ARROW LIP: Master toggle (Both Sidebars) + Right Sidebar Lip     -->
<!-- ========================================================================= -->
<div
  class="fixed top-[88px] z-30 flex items-center gap-1 transition-all duration-300 ease-in-out select-none {isRightOpen ? 'right-[396px]' : 'right-3'}"
>
  <!-- Master Both Sidebars Arrow Lip Button -->
  <button
    onclick={() => uiStore.toggleBothSidebars()}
    class="h-7 px-2.5 flex items-center gap-1.5 bg-forest-deep/95 hover:bg-forest-surface text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/70 shadow-2xl backdrop-blur-sm cursor-pointer transition-all active:scale-95 group font-mono text-xs rounded-none"
    title={areBothOpen ? 'طَيّ القائمتين الجانبيتين (عرض واسع للخريطة)' : 'إظهار القائمتين الجانبيتين (استعادة النوافذ)'}
    aria-label={areBothOpen ? 'إخفاء القوائم الجانبية' : 'إظهار القوائم الجانبية'}
  >
    {#if areBothOpen}
      <!-- Collapse Both -->
      <GameIcon name="contract" cls="w-4 h-4 text-wheat-gold transition-transform group-hover:scale-110 shrink-0" />
      <span class="text-[10px] font-arabic font-bold text-wheat-light hidden sm:inline">
        طَيّ القوائم
      </span>
    {:else}
      <!-- Expand Both -->
      <GameIcon name="expand" cls="w-4 h-4 text-wheat-gold transition-transform group-hover:scale-110 shrink-0" />
      <span class="text-[10px] font-arabic font-bold text-wheat-gold hidden sm:inline">
        فتح القوائم
      </span>
    {/if}
  </button>

  <!-- Right Sidebar Individual Arrow Lip Button -->
  <button
    onclick={() => uiStore.toggleMinistryDrawer()}
    class="h-7 w-6 flex items-center justify-center bg-forest-mid/90 hover:bg-forest-surface text-wheat-dark hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer transition-all active:scale-95 rounded-none"
    title={isRightOpen ? 'إخفاء قائمة الوزارات والسياسات' : 'إظهار قائمة الوزارات والسياسات'}
    aria-label={isRightOpen ? 'إخفاء القائمة اليمنى' : 'إظهار القائمة اليمنى'}
  >
    <GameIcon name="plain-arrow" cls="w-4 h-4 transition-transform duration-300 {isRightOpen ? '-rotate-90' : 'rotate-90'} shrink-0" />
  </button>
</div>

<!-- ========================================================================= -->
<!-- TOP LEFT ARROW LIP: Left Sidebar Lip (Provincial Drawer)                   -->
<!-- ========================================================================= -->
<div
  class="fixed top-[88px] z-30 flex items-center transition-all duration-300 ease-in-out select-none {isLeftOpen ? 'left-[396px]' : 'left-3'}"
>
  <button
    onclick={() => uiStore.toggleProvincialDrawer()}
    class="h-7 w-6 flex items-center justify-center bg-forest-mid/90 hover:bg-forest-surface text-wheat-dark hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer transition-all active:scale-95 rounded-none"
    title={isLeftOpen ? 'إخفاء القائمة الإقليمية للمحافظات' : 'إظهار القائمة الإقليمية للمحافظات'}
    aria-label={isLeftOpen ? 'إخفاء القائمة اليسرى' : 'إظهار القائمة اليسرى'}
  >
    <GameIcon name="plain-arrow" cls="w-4 h-4 transition-transform duration-300 {isLeftOpen ? 'rotate-90' : '-rotate-90'} shrink-0" />
  </button>
</div>
