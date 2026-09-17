<script lang="ts">
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import StatsPanel from './panels/StatsPanel.svelte';

  let open = $derived($uiStore.isStatsSidebarOpen);
</script>

<!-- Right stats drawer (retired-drawer pattern): full-height, always mounted,
     slides in/out with translate-x. Toggled ONLY by the hub stats button or
     its own close control — bottom panels, map canvas and governorate clicks
     never dismiss it. The map viewport and top ribbon offset left of it. -->
<aside
  data-tour="stats-panel"
  class="drawer-full fixed top-0 right-0 bottom-0 w-[min(390px,100vw)] h-screen z-30 bg-forest-deep border-l border-charcoal-mid shadow-2xl flex flex-col select-none font-arabic text-wheat-light transition-transform duration-300 ease-in-out {open ? 'translate-x-0' : 'translate-x-full'}"
  aria-label="لوحة الإحصائيات الجانبية"
  aria-hidden={!open}
  inert={!open}
>
  <div class="scroll-area flex-1 min-h-0 overflow-y-auto p-4">
    <StatsPanel />
  </div>
</aside>
