<script lang="ts">
  import { uiStore } from '../stores/ui-store';

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
      <!-- Inward Arrows: Collapse Both -->
      <svg class="w-3.5 h-3.5 text-wheat-gold transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="4 14 10 14 10 20" />
        <polyline points="20 10 14 10 14 4" />
        <line x1="14" y1="10" x2="21" y2="3" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
      <span class="text-[10px] font-arabic font-bold text-wheat-light hidden sm:inline">
        طَيّ القوائم
      </span>
      <span class="text-[9px] text-wheat-dark font-mono">⇥⇤</span>
    {:else}
      <!-- Outward Arrows: Expand Both -->
      <svg class="w-3.5 h-3.5 text-wheat-gold transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
      <span class="text-[10px] font-arabic font-bold text-wheat-gold hidden sm:inline">
        فتح القوائم
      </span>
      <span class="text-[9px] text-wheat-mid font-mono">⇤⇥</span>
    {/if}
  </button>

  <!-- Right Sidebar Individual Arrow Lip Button -->
  <button
    onclick={() => uiStore.toggleMinistryDrawer()}
    class="h-7 w-6 flex items-center justify-center bg-forest-mid/90 hover:bg-forest-surface text-wheat-dark hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer transition-all active:scale-95 rounded-none"
    title={isRightOpen ? 'إخفاء قائمة الوزارات والسياسات' : 'إظهار قائمة الوزارات والسياسات'}
    aria-label={isRightOpen ? 'إخفاء القائمة اليمنى' : 'إظهار القائمة اليمنى'}
  >
    <svg class="w-3.5 h-3.5 transition-transform duration-300 {isRightOpen ? 'rotate-0' : 'rotate-180'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
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
    <svg class="w-3.5 h-3.5 transition-transform duration-300 {isLeftOpen ? 'rotate-0' : 'rotate-180'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  </button>
</div>
