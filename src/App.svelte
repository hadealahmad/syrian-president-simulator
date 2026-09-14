<script lang="ts">
  import HexagonMap from './lib/spatial3d/HexagonMap.svelte';
  import TopRibbon from './lib/ui/TopRibbon.svelte';
  import MinistryDrawer from './lib/ui/MinistryDrawer.svelte';
  import ProvincialDrawer from './lib/ui/ProvincialDrawer.svelte';
  import FloatingCommandDeck from './lib/ui/FloatingCommandDeck.svelte';
  import TurnReviewModal from './lib/ui/TurnReviewModal.svelte';
  import EventModal from './lib/ui/EventModal.svelte';
  import TurnSummaryModal from './lib/ui/TurnSummaryModal.svelte';
  import FailStateModal from './lib/ui/FailStateModal.svelte';
  import CenturyReport from './lib/ui/CenturyReport.svelte';
  import RestartConfirmModal from './lib/ui/RestartConfirmModal.svelte';
  import PresidentGuideModal from './lib/ui/PresidentGuideModal.svelte';
  import StatRelatedOptionsModal from './lib/ui/StatRelatedOptionsModal.svelte';
  import SidebarToggleLip from './lib/ui/SidebarToggleLip.svelte';
  import { uiStore } from './lib/stores/ui-store';

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
  let isRightOpen = $derived($uiStore.isMinistryDrawerOpen);
</script>

<main class="relative w-screen h-screen overflow-hidden bg-charcoal-deep text-wheat-light font-arabic">
  <!-- 3D Spatial Hexagonal Map Canvas Viewport (Edge-to-edge between sidebars and below Top Ribbon) -->
  <div class="fixed top-[84px] bottom-0 overflow-hidden z-10 transition-all duration-300 ease-in-out {isLeftOpen ? 'left-[390px]' : 'left-0'} {isRightOpen ? 'right-[390px]' : 'right-0'}">
    <HexagonMap />
  </div>

  <!-- Sovereign Top Ribbon (in between the two sidebars) -->
  <TopRibbon />

  <!-- Permanent Full-Height Left & Right Sidebars -->
  <ProvincialDrawer />
  <MinistryDrawer />

  <!-- Sidebar Toggle Lip (near top right below top bar area) -->
  <SidebarToggleLip />

  <!-- Floating Command Deck (Buttons outside the sidebars) -->
  <FloatingCommandDeck />

  <!-- Intelligence & Crisis Modals -->
  <TurnReviewModal />
  <EventModal />
  <TurnSummaryModal />
  <FailStateModal />
  <CenturyReport />
  <RestartConfirmModal />
  <PresidentGuideModal />
  <StatRelatedOptionsModal />
</main>
