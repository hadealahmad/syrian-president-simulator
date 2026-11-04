<script lang="ts">
  import { uiStore } from '../stores/ui-store';

  /**
   * Restart confirmation is now a view inside the full-screen settings curtain
   * (Concept D removed the floating deck). This component keeps the legacy
   * `setRestartModal(true)` entry point working: it hands the request to the
   * curtain in the same frame, so any caller that predates the shell still
   * reaches the same confirm step (with its focus trap) instead of restarting
   * the game silently.
   */
  $effect(() => {
    if ($uiStore.isRestartModalOpen) {
      uiStore.setRestartModal(false);
      uiStore.setSettingsOpen(true);
    }
  });
</script>
