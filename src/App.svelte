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
  import AnalyticsConsentBanner from './lib/ui/AnalyticsConsentBanner.svelte';
  import TopBar from './lib/ui/shell/TopBar.svelte';
  import AlertsStack from './lib/ui/shell/AlertsStack.svelte';
  import CommandDock from './lib/ui/shell/CommandDock.svelte';
  import PanelHost from './lib/ui/shell/PanelHost.svelte';
  import { openSection } from './lib/ui/shell/section-nav';
  import { shellLayout } from './lib/ui/shell/viewport';
  import { uiStore } from './lib/stores/ui-store';
  import { hasSeenTour, startGuideTour } from './lib/ui/guide-tour';
  import RecordsScreen from './lib/records/ui/RecordsScreen.svelte';
  import AchievementToast from './lib/records/ui/AchievementToast.svelte';
  import { MAIN_ACHIEVEMENTS, mainRecords } from './lib/stores/main-records';

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

  // Dev/screenshot shortcut: `?play=1` enters the game directly before child
  // components mount so the settings curtain never renders a partial exit
  // transition in headless captures.
  const devPlay =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('play') === '1';

  if (devPlay) {
    uiStore.markGameStarted();
    uiStore.setSettingsOpen(false);
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
      if (panel === 'provincial' && !get(uiStore).selectedGovernorateId) {
        uiStore.selectGovernorate('damascus');
      }
      openSection(panel);
    }
  }

  onMount(() => {
    if (devPlay) return;
    // First-run wizard: if the user already started a game session without
    // completing the tour, launch the spotlight tour. Brand-new visitors
    // start on the fullscreen curtain menu and trigger the tour upon clicking
    // "New Game" (بدء لعبة جديدة).
    if ($uiStore.hasStartedGame && !hasSeenTour()) startGuideTour();
  });
</script>

<main class="app-shell relative w-screen h-screen overflow-hidden bg-[var(--c-bg)] text-[var(--c-text)] font-arabic">
  <!-- Map viewport: fills the area between TopBar, CommandDock rail/tab-bar,
       and the docked Sheet on desktop. -->
  <div
    data-tour="map"
    class="map-viewport fixed z-10 overflow-hidden"
    style="top: var(--shell-top-h); bottom: var(--shell-bottom-h, 0px); inset-inline-start: var(--shell-rail-w, 0px); inset-inline-end: min(var(--shell-map-end, 0px), calc(100vw - 32px));"
  >
    <GameMap />
  </div>

  <!-- HUD controls: plain pass-through wrapper (fixed children use viewport coords). -->
  <div>
    <!-- Sovereign top bar (stats, live rehearsal preview, turn chip) -->
    <TopBar />

    <!-- Read-only severity alerts (desktop stack, phone pill/bell) -->
    <AlertsStack />

    <!-- 5-section command rail / bottom tab bar + integrated End Turn slab -->
    <CommandDock />

    <!-- The single responsive Sheet that hosts every command panel -->
    <PanelHost />

    <!-- Floating system controls: guide, settings curtain, migration toggle -->
    <div class="shell-deck-host {overlayOpen ? 'shell-deck-collapsed' : ''}">
      <FloatingCommandDeck />
    </div>

    <!-- New Version Alert Banner & Privacy Consent Banner -->
    <VersionUpdateBanner />
    <AnalyticsConsentBanner />

    <!-- Intelligence & Crisis Modals -->
    <TurnReviewModal />
    <EventModal />
    <FailStateModal />
    <CenturyReport />
    <RestartConfirmModal />
    <GuideTour />
  </div>

  <!-- Fullscreen informational & records views -->
  <About />
  {#if $uiStore.isRecordsOpen}
    <RecordsScreen
      defs={MAIN_ACHIEVEMENTS}
      store={mainRecords}
      title="رئيس الجمهورية"
      initialTab={$uiStore.recordsInitialTab}
      onClose={() => uiStore.closeRecords()}
    />
  {/if}
  <AchievementToast defs={MAIN_ACHIEVEMENTS} store={mainRecords} />
</main>
