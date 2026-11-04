<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { budgetStore, draftStore, previewRangesStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import { panelHasRelated } from '../panels/shared';
  import { governorateShape } from '../../spatial3d/syria-2d-paths';
  import { shellLayout } from './viewport';

  type SectionId =
    | 'provincial'
    | 'policies'
    | 'assets'
    | 'tax'
    | 'decrees'
    | 'emergency'
    | 'stats';

  interface Section {
    id: SectionId;
    icon: string;
    labelAr: string;
  }

  // Same order/labels/icons as the retired CommandHub. In RTL the first item
  // renders at the right edge.
  const SECTIONS: Section[] = [
    { id: 'provincial', icon: 'castle', labelAr: 'المحافظة' },
    { id: 'policies', icon: 'vote', labelAr: 'السياسات' },
    { id: 'assets', icon: 'open-treasure-chest', labelAr: 'الأصول' },
    { id: 'tax', icon: 'abacus', labelAr: 'الماليّة' },
    { id: 'decrees', icon: 'scroll-quill', labelAr: 'المراسيم' },
    { id: 'emergency', icon: 'siren', labelAr: 'الطوارئ' },
    { id: 'stats', icon: 'chart', labelAr: 'الإحصائيات' },
  ];

  const PORTRAIT_IDS: SectionId[] = ['provincial', 'decrees', 'tax', 'emergency', 'stats'];
  const MORE_IDS: SectionId[] = ['policies', 'assets'];

  let layout = $derived($shellLayout);
  let active = $derived($uiStore.activeCommandPanel);
  let statsOpen = $derived($uiStore.isStatsSidebarOpen && !$uiStore.activeCommandPanel);
  let sheetOpen = $derived($uiStore.activeCommandPanel !== null || $uiStore.isStatsSidebarOpen);
  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let provShape = $derived(governorateShape($uiStore.selectedGovernorateId));

  let assetsLocked = $derived(($gameStore.turnNumber ?? 1) <= 2);
  let assetsDone = $derived(
    $gameStore.confiscatedAssets.length > 0 &&
      $gameStore.confiscatedAssets.every((a) => a.status !== 'PENDING')
  );
  let assetsPending = $derived(
    $gameStore.confiscatedAssets.filter((a) => a.status === 'PENDING').length
  );
  let decreePending = $derived($draftStore.activePoliticalActions?.length ?? 0);

  let overBudget = $derived(
    $budgetStore.remainingPC < 0 || $budgetStore.remainingUSD < 0
  );
  let emergencyAlert = $derived(
    $gameStore.macro.treasurySYP < 0 ||
      $previewRangesStore.runwayMonthsEstimated < 4 ||
      $gameStore.activeEvents.length > 0
  );

  let orderedSections = $derived(
    assetsDone
      ? [...SECTIONS.filter((s) => s.id === 'assets'), ...SECTIONS.filter((s) => s.id !== 'assets')]
      : SECTIONS
  );
  let portraitSections = $derived(orderedSections.filter((s) => PORTRAIT_IDS.includes(s.id)));
  let moreSections = $derived(orderedSections.filter((s) => MORE_IDS.includes(s.id)));

  let moreOpen = $state(false);

  let activeId = $derived<SectionId | 'stats' | null>(
    active ? (active as SectionId) : statsOpen ? 'stats' : null
  );

  function isLocked(id: SectionId): boolean {
    return id === 'assets' && assetsLocked;
  }

  function clickSection(id: SectionId): void {
    if (isLocked(id)) return;
    moreOpen = false;
    if (id === 'stats') {
      if (statsOpen) uiStore.closeActivePanel();
      else {
        uiStore.closeCommandPanel();
        uiStore.toggleStatsSidebar(true);
      }
      return;
    }
    if (active === id) {
      uiStore.closeCommandPanel();
      return;
    }
    if (id === 'provincial' && !$uiStore.selectedGovernorateId) {
      uiStore.selectGovernorate('damascus');
    }
    if (id === 'decrees') uiStore.checkItem('decrees');
    if (id === 'provincial') uiStore.checkItem('province');
    uiStore.openCommandPanel(id, true);
  }

  function badgeCount(id: SectionId): number {
    if (id === 'decrees') return decreePending;
    if (id === 'assets') return assetsPending;
    return 0;
  }

  function showsAlertDot(id: SectionId): boolean {
    if (id === 'emergency') return emergencyAlert;
    if (id === 'tax') return overBudget;
    return false;
  }

  function titleFor(section: Section): string {
    if (section.id === 'assets' && assetsLocked) return 'تُفتح الأصول في الدور الثالث';
    if (section.id === 'assets' && assetsDone) return `${section.labelAr} — مراجعة القرارات`;
    return section.labelAr;
  }
</script>

{#if layout === 'desktop'}
  <!-- Desktop: bottom-centre command dock. -->
  <nav
    data-tour="hub"
    class="pointer-events-auto fixed inset-x-0 z-40 mx-auto flex w-max max-w-[calc(var(--vp-w)-16px)] items-center gap-px border border-wheat-mid/15 bg-forest-deep/92 p-1.5 shadow-2xl backdrop-blur-xl shell-round-dock {sheetOpen ? 'shell-dock-shifted' : ''}"
    style="bottom: calc(15px + env(safe-area-inset-bottom));"
    aria-label="لوحة القيادة الرئاسية"
  >
    {#each orderedSections as section (section.id)}
      {@const isActive = activeId === section.id}
      {@const locked = isLocked(section.id)}
      {@const badge = badgeCount(section.id)}
      {@const dot = showsAlertDot(section.id)}
      {@const isDone = section.id === 'assets' && assetsDone}
      <button
        type="button"
        data-panel-btn={section.id}
        onclick={() => clickSection(section.id)}
        disabled={locked}
        aria-pressed={isActive}
        aria-disabled={locked}
        aria-label={section.labelAr}
        title={titleFor(section)}
        class="relative flex shrink-0 items-center justify-center gap-1.5 transition-all active:scale-95 shell-round-item
          {isDone ? 'h-[54px] w-[62px]' : 'h-[64px] w-[88px]'}
          flex-col
          {locked
            ? 'cursor-not-allowed border border-charcoal-mid text-wheat-dark opacity-40 grayscale'
            : isDone
              ? 'cursor-pointer border border-charcoal-mid text-wheat-dark opacity-75 saturate-50 hover:text-wheat-gold hover:opacity-100'
              : `cursor-pointer border ${isActive
                  ? 'border-wheat-gold/35 bg-gradient-to-b from-wheat-gold/15 to-wheat-gold/5 text-wheat-gold'
                  : 'border-transparent text-wheat-dark hover:-translate-y-px hover:border-forest-accent/15 hover:bg-forest-accent/5 hover:text-wheat-light'}`}"
      >
        {#if section.id === 'provincial'}
          <svg viewBox={provShape.vb} class="{isDone ? 'h-4 w-4' : 'h-5 w-5'} shrink-0" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path d={provShape.d} fill="currentColor" />
          </svg>
        {:else}
          <GameIcon name={section.icon} cls="{isDone ? 'h-4 w-4' : 'h-5 w-5'} shrink-0" />
        {/if}
        <span class="whitespace-nowrap text-[9.5px] font-bold leading-none font-heading">{section.labelAr}</span>
        {#if badge > 0}
          <span class="absolute top-1 end-3 flex h-[15px] min-w-[15px] items-center justify-center bg-status-danger px-1 font-mono text-[8.5px] font-bold leading-none text-charcoal-white shadow shell-round-chip">
            {badge > 9 ? '9+' : badge}
          </span>
        {/if}
        {#if dot}
          <span class="absolute top-2 end-3.5 h-1.5 w-1.5 bg-status-danger shell-round-chip" aria-hidden="true"></span>
        {/if}
        {#if selectedStat && panelHasRelated(selectedStat, section.id)}
          <span class="absolute top-2 start-3.5 h-1.5 w-1.5 animate-pulse bg-wheat-gold shell-round-chip" aria-hidden="true"></span>
        {/if}
        {#if isActive}
          <span class="absolute bottom-1 h-0.5 w-4 bg-wheat-gold shell-round-chip" aria-hidden="true"></span>
        {/if}
      </button>
    {/each}
  </nav>
{/if}

{#if layout === 'phone-p'}
  <!-- Portrait: five tabs + "المزيد". -->
  {#if moreOpen}
    <div
      class="pointer-events-auto fixed inset-x-0 top-0 z-[39] h-[var(--vp-h)]"
      role="presentation"
      onclick={() => (moreOpen = false)}
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-auto fixed z-[41] flex flex-col gap-1 border border-wheat-mid/20 bg-forest-deep/98 p-2 shadow-2xl backdrop-blur-xl shell-round-pop shell-fade-in"
      style="bottom: calc(var(--shell-tab-h) + env(safe-area-inset-bottom) + 80px); inset-inline: 8px;"
      role="dialog"
      aria-label="المزيد من الأقسام"
    >
      <div class="px-1 pb-1 text-[8.5px] tracking-[1.2px] text-wheat-dark">أقسام إضافية</div>
      <div class="grid grid-cols-2 gap-1.5">
        {#each moreSections as section (section.id)}
          {@const isActive = activeId === section.id}
          {@const locked = isLocked(section.id)}
          <button
            type="button"
            data-panel-btn={section.id}
            onclick={() => clickSection(section.id)}
            disabled={locked}
            aria-pressed={isActive}
            aria-disabled={locked}
            class="flex min-h-14 items-center justify-center gap-2 border px-2 shell-round-item {locked
              ? 'cursor-not-allowed border-charcoal-mid text-wheat-dark opacity-40 grayscale'
              : isActive
                ? 'border-wheat-gold/50 bg-wheat-gold/10 text-wheat-gold'
                : 'border-wheat-mid/15 bg-forest-mid/40 text-wheat-mid'}"
            title={titleFor(section)}
          >
            {#if section.id === 'provincial'}
              <svg viewBox={provShape.vb} class="h-5 w-5 shrink-0" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <path d={provShape.d} fill="currentColor" />
              </svg>
            {:else}
              <GameIcon name={section.icon} cls="h-5 w-5 shrink-0" />
            {/if}
            <span class="text-[10px] font-bold font-heading">{section.labelAr}</span>
            {#if section.id === 'assets' && assetsPending > 0}
              <span class="flex h-[15px] min-w-[15px] items-center justify-center bg-status-danger px-1 font-mono text-[8px] font-bold text-charcoal-white shell-round-chip">{assetsPending}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <nav
    data-tour="hub"
    class="pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex h-[calc(var(--shell-tab-h)+env(safe-area-inset-bottom))] items-stretch border-t border-wheat-mid/20 bg-forest-deep/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    aria-label="لوحة القيادة الرئاسية"
  >
    {#each portraitSections as section (section.id)}
      {@const isActive = activeId === section.id}
      {@const locked = isLocked(section.id)}
      {@const badge = badgeCount(section.id)}
      {@const dot = showsAlertDot(section.id)}
      <button
        type="button"
        data-panel-btn={section.id}
        onclick={() => clickSection(section.id)}
        disabled={locked}
        aria-pressed={isActive}
        aria-disabled={locked}
        aria-label={section.labelAr}
        title={titleFor(section)}
        class="relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 active:scale-95 {locked
          ? 'text-wheat-dark opacity-40 grayscale'
          : isActive
            ? 'text-wheat-gold'
            : 'text-wheat-dark'}"
      >
        {#if section.id === 'provincial'}
          <svg viewBox={provShape.vb} class="h-5 w-5 shrink-0" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path d={provShape.d} fill="currentColor" />
          </svg>
        {:else}
          <GameIcon name={section.icon} cls="h-5 w-5 shrink-0" />
        {/if}
        <span class="text-[8px] font-bold leading-none font-heading">{section.labelAr}</span>
        {#if badge > 0}
          <span class="absolute top-1 end-[calc(50%-20px)] flex h-[15px] min-w-[15px] items-center justify-center bg-status-danger px-1 font-mono text-[8px] font-bold text-charcoal-white shell-round-chip">
            {badge > 9 ? '9+' : badge}
          </span>
        {/if}
        {#if dot}
          <span class="absolute top-1.5 end-[calc(50%-15px)] h-1.5 w-1.5 bg-status-danger shell-round-chip" aria-hidden="true"></span>
        {/if}
        <span class="absolute inset-x-4 top-0 h-0.5 {isActive ? 'bg-wheat-gold' : 'bg-transparent'}" aria-hidden="true"></span>
      </button>
    {/each}
    <button
      type="button"
      onclick={() => (moreOpen = !moreOpen)}
      aria-expanded={moreOpen}
      aria-label="المزيد"
      class="relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-wheat-dark {moreOpen ? 'text-wheat-gold' : ''}"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="12" r="1.9" />
        <circle cx="12" cy="12" r="1.9" />
        <circle cx="19" cy="12" r="1.9" />
      </svg>
      <span class="text-[8px] font-bold leading-none font-heading">المزيد</span>
      {#if activeId === 'policies' || activeId === 'assets'}
        <span class="absolute inset-x-4 top-0 h-0.5 bg-wheat-gold" aria-hidden="true"></span>
      {/if}
    </button>
  </nav>
{/if}

{#if layout === 'phone-l'}
  <!-- Landscape: vertical rail on the inline-start edge. -->
  <nav
    data-tour="hub"
    class="pointer-events-auto fixed z-40 flex w-[58px] flex-col items-stretch justify-center gap-px overflow-y-auto border border-wheat-mid/15 bg-forest-deep/92 p-1 shadow-2xl backdrop-blur-xl shell-round-dock"
    style="inset-inline-start: 6px; top: calc(var(--shell-top-h) + 4px); bottom: 6px;"
    aria-label="لوحة القيادة الرئاسية"
  >
    {#each orderedSections as section (section.id)}
      {@const isActive = activeId === section.id}
      {@const locked = isLocked(section.id)}
      {@const badge = badgeCount(section.id)}
      {@const dot = showsAlertDot(section.id)}
      <button
        type="button"
        data-panel-btn={section.id}
        onclick={() => clickSection(section.id)}
        disabled={locked}
        aria-pressed={isActive}
        aria-disabled={locked}
        aria-label={section.labelAr}
        title={titleFor(section)}
        class="relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 active:scale-95 shell-round-item {locked
          ? 'text-wheat-dark opacity-40 grayscale'
          : isActive
            ? 'bg-wheat-gold/15 text-wheat-gold'
            : 'text-wheat-dark hover:bg-forest-accent/8 hover:text-wheat-light'}"
      >
        {#if section.id === 'provincial'}
          <svg viewBox={provShape.vb} class="h-4 w-4 shrink-0" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path d={provShape.d} fill="currentColor" />
          </svg>
        {:else}
          <GameIcon name={section.icon} cls="h-4 w-4 shrink-0" />
        {/if}
        <span class="text-[7px] font-bold leading-none font-heading">{section.labelAr}</span>
        {#if badge > 0}
          <span class="absolute top-0.5 end-1 flex h-[12px] min-w-[12px] items-center justify-center bg-status-danger px-0.5 font-mono text-[7px] font-bold text-charcoal-white shell-round-chip">
            {badge > 9 ? '9+' : badge}
          </span>
        {/if}
        {#if dot}
          <span class="absolute top-1 end-1 h-1 w-1 bg-status-danger shell-round-chip" aria-hidden="true"></span>
        {/if}
        {#if selectedStat && panelHasRelated(selectedStat, section.id)}
          <span class="absolute top-1 start-1 h-1 w-1 animate-pulse bg-wheat-gold shell-round-chip" aria-hidden="true"></span>
        {/if}
      </button>
    {/each}
  </nav>
{/if}
