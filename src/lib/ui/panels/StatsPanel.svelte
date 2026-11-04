<script lang="ts">
  import CommissionsTab from '../stats/CommissionsTab.svelte';
  import GeneralTab from '../stats/GeneralTab.svelte';
  import MinistriesTab from '../stats/MinistriesTab.svelte';
  import ProvincesTab from '../stats/ProvincesTab.svelte';

  type Tab = 'general' | 'ministries' | 'commissions' | 'governorates';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'general', label: 'عامة' },
    { id: 'ministries', label: 'الحقائب' },
    { id: 'commissions', label: 'اللجان' },
    { id: 'governorates', label: 'المحافظات' },
  ];

  let tab = $state<Tab>('general');
</script>

<div class="space-y-3">
  <!-- Segmented tab control (Sheet already owns the title/close header). -->
  <div class="sticky -top-3 z-10 -mx-1 -mt-3 bg-forest-deep pt-3 phone-l:-top-2 phone-l:-mt-2 phone-l:pt-2">
    <div
      class="flex gap-0.5 border border-wheat-mid/15 p-1 shell-round-item"
      role="group"
      aria-label="أقسام الإحصائيات"
    >
      {#each TABS as item (item.id)}
        <button
          type="button"
          onclick={() => (tab = item.id)}
          aria-pressed={tab === item.id}
          class="flex min-h-9 flex-1 items-center justify-center gap-1.5 border px-1 text-[10px] font-bold leading-none transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-wheat-gold phone-p:min-h-11 phone-l:min-h-10 {tab ===
          item.id
            ? 'border-wheat-gold/40 bg-wheat-gold/15 text-wheat-gold'
            : 'border-transparent text-wheat-dark hover:bg-wheat-light/5 hover:text-wheat-light'}"
        >
          <span class="h-1 w-1 shrink-0 bg-current opacity-70 shell-round-chip" aria-hidden="true"></span>
          <span class="truncate">{item.label}</span>
        </button>
      {/each}
    </div>
  </div>

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
