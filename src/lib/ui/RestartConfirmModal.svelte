<script lang="ts">
  import { uiStore } from '../stores/ui-store';

  $effect(() => {
    if ($uiStore.isRestartModalOpen) {
      uiStore.setRestartModal(false);
      uiStore.setSettingsOpen(true);
    }
  });
</script>
