<script lang="ts">
  import { onMount } from 'svelte';
  import SyriaMap from './lib/spatial3d/SyriaMap.svelte';
  import TopRibbon from './lib/ui/TopRibbon.svelte';
  import FloatingCommandDeck from './lib/ui/FloatingCommandDeck.svelte';
  import CommandHub from './lib/ui/CommandHub.svelte';
  import StatsSidebar from './lib/ui/StatsSidebar.svelte';
  import TurnReviewModal from './lib/ui/TurnReviewModal.svelte';
  import EventModal from './lib/ui/EventModal.svelte';
  import TurnSummaryModal from './lib/ui/TurnSummaryModal.svelte';
  import FailStateModal from './lib/ui/FailStateModal.svelte';
  import CenturyReport from './lib/ui/CenturyReport.svelte';
  import RestartConfirmModal from './lib/ui/RestartConfirmModal.svelte';
  import GuideTour from './lib/ui/GuideTour.svelte';
  import VersionUpdateBanner from './lib/ui/VersionUpdateBanner.svelte';
  import { uiStore } from './lib/stores/ui-store';
  import { hasSeenTour, startGuideTour } from './lib/ui/guide-tour';

  let statsOpen = $derived($uiStore.isStatsSidebarOpen);

  onMount(() => {
    // First-run wizard: spotlight tour over the live UI, panels stay closed.
    if (!hasSeenTour()) startGuideTour();
  });
</script>

<main class="relative w-screen h-screen overflow-hidden bg-charcoal-deep text-wheat-light font-arabic">
  <!-- 2D Sovereign Vector Map Viewport (pushed left of the stats drawer) -->
  <div data-tour="map" class="fixed top-[84px] bottom-0 left-0 overflow-hidden z-10 transition-all duration-300 ease-in-out {statsOpen ? 'right-[390px]' : 'right-0'}">
    <SyriaMap />
  </div>

  <!-- Sovereign Top Ribbon -->
  <TopRibbon />

  <!-- Bottom-Center Command Hub (hover sigils, click to pin) -->
  <CommandHub />

  <!-- Right Stats Sidebar (toggled by the hub stats button) -->
  <StatsSidebar />

  <!-- Floating System Controls (top-left under the top bar) -->
  <FloatingCommandDeck />

  <!-- New Version Alert Banner -->
  <VersionUpdateBanner />

  <!-- Intelligence & Crisis Modals -->
  <TurnReviewModal />
  <EventModal />
  <TurnSummaryModal />
  <FailStateModal />
  <CenturyReport />
  <RestartConfirmModal />
  <GuideTour />
</main>
