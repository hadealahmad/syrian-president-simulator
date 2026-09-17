<script lang="ts">
  import { onMount } from 'svelte';
  import SyriaMap from './lib/spatial3d/SyriaMap3D.svelte';
  import TopRibbon from './lib/ui/TopRibbon.svelte';
  import FloatingCommandDeck from './lib/ui/FloatingCommandDeck.svelte';
  import CommandHub from './lib/ui/CommandHub.svelte';
  import StatsSidebar from './lib/ui/StatsSidebar.svelte';
  import TurnReviewModal from './lib/ui/TurnReviewModal.svelte';
  import EventModal from './lib/ui/EventModal.svelte';
  import FailStateModal from './lib/ui/FailStateModal.svelte';
  import CenturyReport from './lib/ui/CenturyReport.svelte';
  import RestartConfirmModal from './lib/ui/RestartConfirmModal.svelte';
  import GuideTour from './lib/ui/GuideTour.svelte';
  import RotatePrompt from './lib/ui/RotatePrompt.svelte';
  import VersionUpdateBanner from './lib/ui/VersionUpdateBanner.svelte';
  import { uiStore } from './lib/stores/ui-store';
  import { hasSeenTour, startGuideTour } from './lib/ui/guide-tour';

  let statsOpen = $derived($uiStore.isStatsSidebarOpen);

  // Default 130% zoom for the HUD on 2K-class screens (≥ 2000 CSS px wide:
  // 1440p/DCI-2K and 4K at 100%). The HUD is scaled by a transform layer
  // over the untouched WebGL map; --hud-zoom (set on <html>) also drives
  // --vp-w/--vp-h so drawers and modals still fit (see app.css), and the
  // map viewport's own offsets multiply with it so the enlarged ribbon and
  // sidebar never overlap the map.
  const HUD_ZOOM = 1.3;
  const HUD_ZOOM_QUERY = '(min-width: 2000px)';
  let hudZoomed = $state(false);

  onMount(() => {
    // First-run wizard: spotlight tour over the live UI, panels stay closed.
    if (!hasSeenTour()) startGuideTour();
  });

  onMount(() => {
    const mq = window.matchMedia(HUD_ZOOM_QUERY);
    const update = (): void => {
      hudZoomed = mq.matches;
      document.documentElement.style.setProperty(
        '--hud-zoom',
        hudZoomed ? String(HUD_ZOOM) : '1',
      );
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  });
</script>

<main class="app-shell relative w-screen h-screen overflow-hidden bg-charcoal-deep text-wheat-light font-arabic">
  <!-- Vector Map Viewport (pushed left of the stats drawer; offsets track
       the HUD zoom so the scaled ribbon/sidebar never cover the map) -->
  <div
    data-tour="map"
    class="fixed bottom-0 left-0 overflow-hidden z-10 transition-all duration-300 ease-in-out"
    style="top: calc(84px * var(--hud-zoom)); {statsOpen ? 'right: calc(390px * var(--hud-zoom))' : 'right: 0'};"
  >
    <SyriaMap />
  </div>

  <!-- HUD layer: transformed to scale on 2K-class screens; a zero-box pass-
       through div otherwise (fixed children escape it untouched). -->
  <div class="hud-layer {hudZoomed ? 'hud-layer-zoomed' : ''}">
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
    <FailStateModal />
    <CenturyReport />
    <RestartConfirmModal />
    <GuideTour />
    <RotatePrompt />
  </div>
</main>
