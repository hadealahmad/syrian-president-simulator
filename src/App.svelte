<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import GameMap from './lib/ui/map/GameMap.svelte';
  import FloatingCommandDeck from './lib/ui/FloatingCommandDeck.svelte';
  import TurnReviewModal from './lib/ui/TurnReviewModal.svelte';
  import EventModal from './lib/ui/EventModal.svelte';
  import FailStateModal from './lib/ui/FailStateModal.svelte';
  import CenturyReport from './lib/ui/CenturyReport.svelte';
  import RestartConfirmModal from './lib/ui/RestartConfirmModal.svelte';
  import About from './lib/ui/About.svelte';
  import GuideTour from './lib/ui/GuideTour.svelte';
  import VersionUpdateBanner from './lib/ui/VersionUpdateBanner.svelte';
  import TopBar from './lib/ui/shell/TopBar.svelte';
  import AlertsStack from './lib/ui/shell/AlertsStack.svelte';
  import CommandDock from './lib/ui/shell/CommandDock.svelte';
  import EndTurnSeal from './lib/ui/shell/EndTurnSeal.svelte';
  import PanelHost from './lib/ui/shell/PanelHost.svelte';
  import { shellLayout } from './lib/ui/shell/viewport';
  import { uiStore } from './lib/stores/ui-store';
  import { hasSeenTour, startGuideTour } from './lib/ui/guide-tour';

  // Default 130% zoom for the HUD on 2K-class screens (≥ 2000 CSS px wide:
  // 1440p/DCI-2K and 4K at 100%). The HUD is scaled by a transform layer
  // over the untouched WebGL map; --hud-zoom (set on <html>) also drives
  // --vp-w/--vp-h so drawers and modals still fit (see app.css), and the
  // map viewport's own top offset multiplies with it so the enlarged top
  // bar never overlaps the map.
  const HUD_ZOOM = 1.3;
  const HUD_ZOOM_QUERY = '(min-width: 2000px)';
  let hudZoomed = $state(false);
  let sheetOpen = $derived(
    $uiStore.activeCommandPanel !== null || $uiStore.isStatsSidebarOpen,
  );
  let layout = $derived($shellLayout);
  let overlayOpen = $derived(
    sheetOpen || (layout !== 'desktop' && $uiStore.isAlertsOpen),
  );

  $effect(() => {
    if (layout === 'desktop' && $uiStore.isAlertsOpen) {
      uiStore.setAlertsOpen(false);
    }
  });

  onMount(() => {
    // Dev/screenshot shortcut: `?play=1` enters the game directly using the
    // exact flags the Continue path sets (started + settings closed), and
    // skips the first-run tour so headless captures show the HUD.
    const devPlay =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('play') === '1';
    if (devPlay) {
      uiStore.markGameStarted();
      uiStore.setSettingsOpen(false);
      // Optional capture helper: `&panel=decrees|tax|stats|...` opens that
      // section so verification screenshots can show a Sheet without input.
      const panel = new URLSearchParams(window.location.search).get('panel');
      const known = [
        'provincial',
        'policies',
        'assets',
        'tax',
        'decrees',
        'emergency',
        'stats',
      ];
      if (panel && known.includes(panel)) {
        if (panel === 'stats') {
          uiStore.closeCommandPanel();
          uiStore.toggleStatsSidebar(true);
        } else {
          if (panel === 'provincial' && !get(uiStore).selectedGovernorateId) {
            uiStore.selectGovernorate('damascus');
          }
          uiStore.openCommandPanel(panel, true);
        }
      }
      return;
    }
    // First-run wizard: if the user already started a game session without
    // completing the tour, launch the spotlight tour. Brand-new visitors
    // start on the fullscreen curtain menu and trigger the tour upon clicking
    // "New Game" (بدء لعبة جديدة).
    if ($uiStore.hasStartedGame && !hasSeenTour()) startGuideTour();
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
  <!-- Map viewport: fills everything below the new top bar. The Sheet
       overlays it instead of crushing it (Concept D). -->
  <div
    data-tour="map"
    class="fixed inset-x-0 bottom-0 z-10 overflow-hidden"
    style="top: calc(var(--shell-top-h) * var(--hud-zoom));"
  >
    <GameMap />
  </div>

  <!-- HUD layer: transformed to scale on 2K-class screens; a zero-box
       pass-through div otherwise (fixed children escape it untouched). -->
  <div class="hud-layer {hudZoomed ? 'hud-layer-zoomed' : ''}">
    <!-- Sovereign top bar (stats, live rehearsal preview, turn chip) -->
    <TopBar />

    <!-- Read-only severity alerts (desktop stack, phone pill/bell) -->
    <AlertsStack />

    <!-- Bottom command dock / portrait tab bar / landscape rail -->
    <CommandDock />

    <!-- Gold End-Turn seal with pending-actions badge -->
    <EndTurnSeal />

    <!-- The single responsive Sheet that hosts every command panel -->
    <PanelHost />

    <!-- Floating system controls: guide, settings curtain, migration toggle -->
    <div class="shell-deck-host {overlayOpen ? 'shell-deck-collapsed' : ''}">
      <FloatingCommandDeck />
    </div>

    <!-- New Version Alert Banner -->
    <VersionUpdateBanner />

    <!-- Intelligence & Crisis Modals -->
    <TurnReviewModal />
    <EventModal />
    <FailStateModal />
    <CenturyReport />
    <RestartConfirmModal />
    <GuideTour />
  </div>

  <!-- About page: outside .hud-layer on purpose. Inside it the HUD zoom
       transform would scale a long reading page by 130% on 2K screens. -->
  <About />
</main>
