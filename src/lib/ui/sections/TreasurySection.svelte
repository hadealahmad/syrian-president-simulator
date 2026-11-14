<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import ResultStrip from '../kit/ResultStrip.svelte';
  import SubTabs, { type SubTabItem } from '../kit/SubTabs.svelte';
  import { formatBillion } from '../panels/shared';
  import { sectionNav, subTabHasRelated, type TreasuryTab } from '../shell/section-nav';
  import CurrencyTab from './treasury/CurrencyTab.svelte';
  import RevenueTab from './treasury/RevenueTab.svelte';
  import SpendingTab from './treasury/SpendingTab.svelte';

  let tab = $derived($sectionNav.treasuryTab);
  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let projected = $derived($projectedTurnStore);

  let afterSYP = $derived(projected.treasurySYP.projected);
  let currentSYP = $derived(projected.treasurySYP.current);
  let diffSYP = $derived(afterSYP - currentSYP);
  let diffArrow = $derived(diffSYP > 0 ? '▲' : diffSYP < 0 ? '▼' : '');

  let isTicking = $state(false);
  let tickTimer: ReturnType<typeof setTimeout> | undefined;
  let lastTreasurySeen = Number.NaN;

  $effect(() => {
    const val = afterSYP;
    if (!Number.isNaN(lastTreasurySeen) && lastTreasurySeen !== val) {
      isTicking = false;
      requestAnimationFrame(() => {
        isTicking = true;
        clearTimeout(tickTimer);
        tickTimer = setTimeout(() => {
          isTicking = false;
        }, 170);
      });
    }
    lastTreasurySeen = val;
  });

  onDestroy(() => {
    clearTimeout(tickTimer);
  });

  // Auto-switch to the first treasury sub-tab containing options related to
  // a newly selected top-bar stat filter when the active sub-tab has none.
  let lastAutoStat: string | null = null;
  $effect(() => {
    const stat = selectedStat;
    if (!stat) {
      lastAutoStat = null;
      return;
    }
    if (stat === lastAutoStat) return;
    lastAutoStat = stat;
    const currentTab = untrack(() => tab);
    if (!subTabHasRelated(stat, 'tax', currentTab)) {
      const nextTab = (['revenue', 'spending', 'currency'] as TreasuryTab[]).find((t) =>
        subTabHasRelated(stat, 'tax', t)
      );
      if (nextTab) sectionNav.setTreasuryTab(nextTab);
    }
  });

  let tabs = $derived<SubTabItem[]>([
    {
      id: 'revenue',
      label: 'الإيرادات',
      hasRelated: subTabHasRelated(selectedStat, 'tax', 'revenue'),
    },
    {
      id: 'spending',
      label: 'الإنفاق',
      hasRelated: subTabHasRelated(selectedStat, 'tax', 'spending'),
    },
    {
      id: 'currency',
      label: 'العملة',
      hasRelated: subTabHasRelated(selectedStat, 'tax', 'currency'),
    },
  ]);

  function handleTabChange(id: string): void {
    sectionNav.setTreasuryTab(id as TreasuryTab);
  }
</script>

<div class="flex flex-col">
  <div class="sticky top-0 z-20 -mx-[var(--sheet-px,16px)] phone-p:-mx-3 phone-l:-mx-3 bg-[var(--c-bg)]">
    <SubTabs {tabs} value={tab} onchange={handleTabChange} ariaLabel="أقسام الخزينة" />
    <div aria-live="polite">
      <ResultStrip
        label="الخزينة بعد الدور"
        value={`${formatBillion(afterSYP)}B`}
        valueTone={afterSYP < 0 ? 'neg' : 'pos'}
        delta={Math.abs(diffSYP) >= 1_000_000
          ? `${diffArrow} ${formatBillion(Math.abs(diffSYP))}B`
          : ''}
        deltaTone={diffSYP >= 0 ? 'pos' : 'neg'}
        class={isTicking ? 'treasury-strip-tick' : ''}
      />
    </div>
  </div>

  {#key tab}
    <div class="oc-tab-enter flex flex-col gap-2 pt-2">
      {#if tab === 'revenue'}
        <RevenueTab />
      {:else if tab === 'spending'}
        <SpendingTab />
      {:else}
        <CurrencyTab />
      {/if}
    </div>
  {/key}
</div>

<style>
  @keyframes treasury-strip-tick {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.06);
    }
    100% {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(.treasury-strip-tick .strip-val),
    :global(.treasury-strip-tick .strip-delta) {
      animation: treasury-strip-tick 160ms ease-out;
    }
  }
</style>
