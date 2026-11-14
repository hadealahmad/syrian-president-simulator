<script lang="ts">
  import { uiStore } from '../../stores/ui-store';
  import { STAT_EXPLAINERS_AR, STAT_NAMES_AR } from '../panels/shared';
  import { fx } from '../fx/feedback';
  import ProvincialPanel from '../panels/ProvincialPanel.svelte';
  import TreasurySection from '../sections/TreasurySection.svelte';
  import DebtSection from '../sections/DebtSection.svelte';
  import GovernanceSection from '../sections/GovernanceSection.svelte';
  import ReportsSection from '../sections/ReportsSection.svelte';
  import Sheet from './Sheet.svelte';
  import { sectionNav } from './section-nav';
  import { shellLayout } from './viewport';

  interface PanelMeta {
    title: string;
  }

  const META: Record<string, PanelMeta> = {
    provincial: { title: 'ملف المحافظة' },
    tax: { title: 'الخزينة' },
    emergency: { title: 'الدَّين والتمويل' },
    decrees: { title: 'الحكم' },
    stats: { title: 'التقارير' },
  };

  let rawId = $derived(
    $uiStore.activeCommandPanel ?? ($uiStore.isStatsSidebarOpen ? 'stats' : null)
  );
  let activeId = $derived.by(() => {
    if (!rawId) return null;
    if (rawId === 'policies' || rawId === 'assets') return 'decrees';
    return rawId;
  });
  let open = $derived(activeId !== null);
  let meta = $derived((activeId && META[activeId]) || META.provincial);
  const widthToken = 'var(--shell-dock-w)';
  let subTabKey = $derived(
    activeId === 'tax'
      ? $sectionNav.treasuryTab
      : activeId === 'decrees'
        ? $sectionNav.governanceTab
        : activeId === 'stats'
          ? $sectionNav.reportsTab
          : ''
  );

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  // Desktop only: tell the map and alerts stack how much of the inline-END edge
  // the docked Sheet or docked turn review tray occupies.
  let layout = $derived($shellLayout);
  let reviewDocked = $derived($uiStore.turnFlowStage === 'review');
  $effect(() => {
    const root = document.documentElement;
    const desktopEnd =
      layout === 'desktop' && (reviewDocked || open) ? 'var(--shell-dock-w)' : '0px';
    root.style.setProperty('--shell-map-end', desktopEnd);
    return () => root.style.setProperty('--shell-map-end', '0px');
  });

  function close(): void {
    uiStore.closeActivePanel();
  }

  function clearFilter(): void {
    fx('cancel');
    uiStore.closeStatRelatedOptions();
  }
</script>

<Sheet
  {open}
  title={meta.title}
  {widthToken}
  sectionKey={activeId ?? ''}
  {subTabKey}
  defaultSnap={activeId === 'provincial' ? 1 : 2}
  mapInteractive={activeId === 'provincial'}
  onclose={close}
  tourId={activeId === 'stats' ? 'stats-panel' : ''}
>
  {#if selectedStat && STAT_EXPLAINERS_AR[selectedStat]}
    <div class="-mx-[var(--sheet-px,16px)] phone-p:-mx-3 phone-l:-mx-3 flex items-center justify-between gap-2 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-[var(--sheet-px,16px)] phone-p:px-3 phone-l:px-3 py-2 text-[11.5px] leading-[1.4] text-[var(--c-text)]">
      <div class="reading-text min-w-0 flex-1 line-clamp-2">
        <span class="font-bold text-[var(--c-text)] font-heading">{STAT_NAMES_AR[selectedStat] ?? selectedStat}:</span>
        <span class="text-[var(--c-text-2)]"> {STAT_EXPLAINERS_AR[selectedStat]}</span>
      </div>
      <button
        type="button"
        onclick={clearFilter}
        class="kit-btn sec shrink-0"
      >
        إلغاء التصفية
      </button>
    </div>
  {/if}

  {#if activeId === 'provincial'}
    <ProvincialPanel />
  {:else if activeId === 'tax'}
    <TreasurySection />
  {:else if activeId === 'emergency'}
    <DebtSection />
  {:else if activeId === 'decrees'}
    <GovernanceSection />
  {:else if activeId === 'stats'}
    <ReportsSection />
  {/if}
</Sheet>
