<script lang="ts">
  import CommissionsTab from '../stats/CommissionsTab.svelte';
  import GeneralTab from '../stats/GeneralTab.svelte';
  import MinistriesTab from '../stats/MinistriesTab.svelte';
  import ProvincesTab from '../stats/ProvincesTab.svelte';
  import { sectionNav } from '../shell/section-nav';

  let tab = $derived($sectionNav.reportsTab);
</script>

{#key tab}
  <div class="oc-tab-enter space-y-2">
    {#if tab === 'general'}
      <GeneralTab />
    {:else if tab === 'ministries'}
      <MinistriesTab />
    {:else if tab === 'commissions'}
      <CommissionsTab />
    {:else}
      <ProvincesTab />
    {/if}
  </div>
{/key}
