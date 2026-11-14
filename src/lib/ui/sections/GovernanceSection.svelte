<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { budgetStore, draftStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import ResultStrip from '../kit/ResultStrip.svelte';
  import SubTabs, { type SubTabItem } from '../kit/SubTabs.svelte';
  import AssetsTab from './governance/AssetsTab.svelte';
  import DecreesTab from './governance/DecreesTab.svelte';
  import StancesTab from './governance/StancesTab.svelte';
  import {
    GOVERNANCE_SUBTAB_KEYS,
    sectionNav,
    subTabHasRelated,
    type GovernanceTab,
  } from '../shell/section-nav';

  const SAFE_PC_FLOOR = 20;

  let tab = $derived($sectionNav.governanceTab);
  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let assetsLocked = $derived(($gameStore.turnNumber ?? 1) <= 2);
  let assetsPending = $derived(
    $gameStore.confiscatedAssets.filter((a) => a.status === 'PENDING').length
  );
  let decreePending = $derived(
    ($draftStore.activePoliticalActions ?? []).filter((id) =>
      GOVERNANCE_SUBTAB_KEYS.decrees.includes(id)
    ).length
  );
  let stancesBadge = $derived(
    $draftStore.activePoliticalActions?.includes('MARTIAL_LAW') ? 1 : undefined
  );

  // Political-capital budget strip (pinned under sub-tabs on المراسيم)
  let initialPC = $derived(Math.max(0, Math.floor($budgetStore.initialPC)));
  let afterPC = $derived(Math.floor($budgetStore.remainingPC));
  let shownAfterPC = $derived(Math.max(0, afterPC));
  let pcDelta = $derived(initialPC - afterPC);
  let barScale = $derived(Math.max(initialPC, shownAfterPC, SAFE_PC_FLOOR, 1));
  let freePct = $derived(Math.min(100, (shownAfterPC / barScale) * 100));
  let safeMarkerPct = $derived(Math.min(100, (SAFE_PC_FLOOR / barScale) * 100));

  function signedPc(delta: number): string {
    return delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : '0';
  }

  let tabs = $derived<SubTabItem[]>([
    {
      id: 'decrees',
      label: 'المراسيم',
      badge: decreePending > 0 ? decreePending : undefined,
      hasRelated: subTabHasRelated(selectedStat, 'decrees', 'decrees'),
      tour: 'subtab-decrees',
    },
    {
      id: 'stances',
      label: 'المواقف',
      badge: stancesBadge,
      hasRelated: subTabHasRelated(selectedStat, 'decrees', 'stances'),
      tour: 'subtab-policies',
    },
    {
      id: 'assets',
      label: assetsLocked ? 'الأصول · دور 3' : 'الأصول',
      notYetAvailable: assetsLocked,
      badge: !assetsLocked && assetsPending > 0 ? assetsPending : undefined,
      hasRelated: subTabHasRelated(selectedStat, 'decrees', 'assets'),
      tour: 'subtab-assets',
      title: assetsLocked ? 'تُفتح الأصول في الدور الثالث' : 'الأصول المصادرة',
    },
  ]);

  function handleTabChange(id: string): void {
    sectionNav.setGovernanceTab(id as GovernanceTab);
  }
</script>

<div class="flex flex-col">
  <div class="sticky top-0 z-20 -mx-[var(--sheet-px,16px)] phone-p:-mx-3 phone-l:-mx-3 bg-[var(--c-bg)]">
    <SubTabs {tabs} value={tab} onchange={handleTabChange} ariaLabel="أقسام الحكم" />
    {#if tab === 'decrees'}
      <div
        data-tour="pc-budget"
        aria-label="موازنة الرصيد السياسي"
      >
        <ResultStrip
          label="الرصيد السياسي"
          fromValue={String(initialPC)}
          value={String(shownAfterPC)}
          valueTone={afterPC < SAFE_PC_FLOOR ? 'neg' : 'accent'}
          delta={pcDelta !== 0 ? signedPc(pcDelta) : ''}
          deltaTone={pcDelta > 0 ? 'neg' : pcDelta < 0 ? 'pos' : 'muted'}
          barPct={freePct}
          markerPct={safeMarkerPct}
        />
      </div>
    {/if}
  </div>

  {#key tab}
    <div class="oc-tab-enter flex flex-col gap-2 {tab === 'decrees' ? 'pt-0' : 'pt-2'}">
      {#if tab === 'decrees'}
        <DecreesTab />
      {:else if tab === 'stances'}
        <StancesTab />
      {:else}
        <AssetsTab />
      {/if}
    </div>
  {/key}
</div>
