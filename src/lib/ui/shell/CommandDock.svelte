<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '../../stores/game-store';
  import { budgetStore, draftStore, previewRangesStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import { governorateShape } from '../../spatial3d/syria-2d-paths';
  import { fx } from '../fx/feedback';
  import EndTurnSeal from './EndTurnSeal.svelte';
  import { openSection, sectionHasRelated, type SectionId } from './section-nav';
  import { shellLayout } from './viewport';

  interface Section {
    id: SectionId;
    icon: string;
    labelAr: string;
  }

  // Exact 5 sections in order: الخريطة, الخزينة, الدَّين, الحكم, التقارير
  const SECTIONS: Section[] = [
    { id: 'provincial', icon: 'castle', labelAr: 'الخريطة' },
    { id: 'tax', icon: 'abacus', labelAr: 'الخزينة' },
    { id: 'emergency', icon: 'scales', labelAr: 'الدَّين' },
    { id: 'decrees', icon: 'scroll-quill', labelAr: 'الحكم' },
    { id: 'stats', icon: 'chart', labelAr: 'التقارير' },
  ];

  let layout = $derived($shellLayout);
  let active = $derived($uiStore.activeCommandPanel);
  let statsOpen = $derived($uiStore.isStatsSidebarOpen && !$uiStore.activeCommandPanel);
  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let provShape = $derived(governorateShape($uiStore.selectedGovernorateId));

  let assetsLocked = $derived(($gameStore.turnNumber ?? 1) <= 2);
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

  let portraitNavEl: HTMLElement | null = $state(null);

  let activeId = $derived<SectionId | null>(
    active ? (active as SectionId) : statsOpen ? 'stats' : null
  );

  $effect(() => {
    const root = document.documentElement;
    if (layout !== 'phone-p') {
      root.style.setProperty('--shell-bottom-h', '0px');
      return;
    }
    const syncBottom = (): void => {
      if (!portraitNavEl) return;
      const h = Math.ceil(portraitNavEl.getBoundingClientRect().height);
      if (h > 0) root.style.setProperty('--shell-bottom-h', `${h}px`);
    };
    syncBottom();
    if (typeof ResizeObserver === 'undefined' || !portraitNavEl) return;
    const ro = new ResizeObserver(syncBottom);
    ro.observe(portraitNavEl);
    return () => ro.disconnect();
  });

  onMount(() => {
    return () => {
      document.documentElement.style.setProperty('--shell-bottom-h', '0px');
    };
  });

  function clickSection(id: SectionId): void {
    if (activeId === id) {
      fx('cancel');
      uiStore.closeActivePanel();
      return;
    }
    if (activeId !== null) {
      fx('tap');
    }
    openSection(id);
  }

  function badgeCount(id: SectionId): number {
    if (id !== 'decrees') return 0;
    return decreePending + (assetsLocked ? 0 : assetsPending);
  }

  function showsAlertDot(id: SectionId): boolean {
    if (id === 'emergency') return emergencyAlert;
    if (id === 'tax') return overBudget;
    return false;
  }

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  }

  function hasBlockingOverlay(): boolean {
    if (
      $uiStore.turnFlowStage !== 'closed' ||
      $uiStore.isSettingsOpen ||
      $uiStore.isRestartModalOpen ||
      $uiStore.isAboutOpen ||
      $uiStore.isRecordsOpen ||
      $gameStore.isGameOver
    ) {
      return true;
    }
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.querySelector(
        '[aria-modal="true"]:not([data-sheet-root]), dialog[open], [data-topbar-popover], [data-tour-overlay]'
      )
    );
  }

  function triggerEndTurnShortcut(): void {
    if ($gameStore.isGameOver || $uiStore.turnFlowStage !== 'closed') return;
    fx(overBudget ? 'error' : 'endTurn');
    uiStore.closeActivePanel();
    uiStore.setAlertsOpen(false);
    uiStore.setTurnFlowStage('review');
  }

  function onWindowKeydown(event: KeyboardEvent): void {
    if (layout !== 'desktop') return;
    if (event.defaultPrevented || event.isComposing) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;
    if (hasBlockingOverlay()) return;

    const sectionDigitMap: Record<string, number> = {
      Digit1: 0,
      Digit2: 1,
      Digit3: 2,
      Digit4: 3,
      Digit5: 4,
      Numpad1: 0,
      Numpad2: 1,
      Numpad3: 2,
      Numpad4: 3,
      Numpad5: 4,
    };
    const secIdx = sectionDigitMap[event.code];
    if (secIdx !== undefined && SECTIONS[secIdx]) {
      event.preventDefault();
      clickSection(SECTIONS[secIdx].id);
      return;
    }

    if (event.code === 'KeyM') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('oc:cycle-map-mode'));
      return;
    }

    if (event.code === 'KeyE') {
      event.preventDefault();
      triggerEndTurnShortcut();
      return;
    }

    if (event.key === 'Enter') {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('button, a, summary, [role="button"], [role="tab"], [data-gov-id], .map-root')
      ) {
        return;
      }
      event.preventDefault();
      triggerEndTurnShortcut();
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if layout === 'phone-p'}
  <!-- Portrait phone: 5 flat cells + chamfered End Turn slab in one bottom row -->
  <nav
    bind:this={portraitNavEl}
    data-tour="hub"
    class="hud-chrome pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex h-[calc(var(--shell-tab-h)+env(safe-area-inset-bottom))] items-stretch border-t border-[var(--c-line)] bg-[var(--c-panel)] pb-[env(safe-area-inset-bottom)]"
    aria-label="لوحة القيادة الرئاسية"
  >
    {#each SECTIONS as section, index (section.id)}
      {@const isActive = activeId === section.id}
      {@const badge = badgeCount(section.id)}
      {@const dot = showsAlertDot(section.id)}
      {@const related = Boolean(selectedStat && sectionHasRelated(selectedStat, section.id))}
      <button
        type="button"
        data-panel-btn={section.id}
        onclick={() => clickSection(section.id)}
        aria-pressed={isActive}
        aria-label={section.labelAr}
        title={section.labelAr}
        class="pressable relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 border-t-[3px] px-0.5
          {index > 0 ? 'border-s border-[var(--c-line)]' : ''}
          {isActive
            ? 'border-t-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-accent)]'
            : 'border-t-transparent bg-transparent text-[var(--c-muted)] hover:text-[var(--c-text)]'}"
      >
        {#if section.id === 'decrees'}
          <span class="pointer-events-none absolute inset-0" data-panel-btn="policies" aria-hidden="true"></span>
          <span class="pointer-events-none absolute inset-0" data-panel-btn="assets" aria-hidden="true"></span>
        {/if}

        <GameIcon name={section.icon} cls="h-5 w-5 shrink-0" />
        <span class="max-w-full truncate font-arabic text-[11px] font-bold leading-[1.3]">
          {section.labelAr}
        </span>

        {#if badge > 0}
          <span
            class="num absolute top-1 end-1 flex h-4 min-w-4 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-strip)] px-1 text-[10px] font-bold leading-none {isActive
              ? 'text-[var(--c-accent)]'
              : 'text-[var(--c-text-2)]'}"
          >
            {badge > 9 ? '9+' : badge}
          </span>
        {/if}
        {#if dot}
          <span class="absolute top-1.5 end-1.5 h-1.5 w-1.5 bg-[var(--c-neg)]" aria-hidden="true"></span>
        {/if}
        {#if related}
          <span class="absolute top-0 inset-x-3 h-[2px] bg-[var(--c-text-2)]" aria-hidden="true"></span>
        {/if}
      </button>
    {/each}

    <EndTurnSeal integrated={true} />
  </nav>
{:else}
  <!-- Desktop & phone-l: vertical rail on the inline-start edge with End Turn at its bottom -->
  <nav
    data-tour="hub"
    class="hud-chrome pointer-events-auto fixed bottom-0 z-40 flex flex-col border-e border-[var(--c-line)] bg-[var(--c-panel)]"
    style="inset-inline-start: 0; top: var(--shell-top-h); width: var(--shell-rail-w);"
    aria-label="لوحة القيادة الرئاسية"
  >
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {#each SECTIONS as section, index (section.id)}
        {@const isActive = activeId === section.id}
        {@const badge = badgeCount(section.id)}
        {@const dot = showsAlertDot(section.id)}
        {@const related = Boolean(selectedStat && sectionHasRelated(selectedStat, section.id))}
        <button
          type="button"
          data-panel-btn={section.id}
          onclick={() => clickSection(section.id)}
          aria-pressed={isActive}
          aria-label={section.labelAr}
          title={layout === 'desktop' ? `${section.labelAr} (${index + 1})` : section.labelAr}
          class="pressable relative flex shrink-0 flex-col items-center justify-center gap-1 border-b border-[var(--c-line)] border-s-[3px] px-1
            {layout === 'phone-l'
              ? 'min-h-[44px] flex-1 max-h-[58px]'
              : 'h-[62px] min-[1600px]:h-[72px] min-[2200px]:h-[84px]'}
            {isActive
              ? 'border-s-[var(--c-accent)] bg-[var(--c-bg)] text-[var(--c-accent)]'
              : 'border-s-transparent bg-transparent text-[var(--c-muted)] hover:bg-[var(--c-strip)] hover:text-[var(--c-text)]'}"
        >
          {#if section.id === 'decrees'}
            <span class="pointer-events-none absolute inset-0" data-panel-btn="policies" aria-hidden="true"></span>
            <span class="pointer-events-none absolute inset-0" data-panel-btn="assets" aria-hidden="true"></span>
          {/if}

          {#if layout === 'desktop'}
            <span
              class="num pointer-events-none absolute top-1 start-1 inline-flex h-[15px] min-w-[15px] min-[1600px]:h-[17px] min-[1600px]:min-w-[17px] items-center justify-center border border-[var(--c-line)] bg-[var(--c-strip)] px-0.5 text-[10px] min-[1600px]:text-[11px] font-bold leading-none {isActive
                ? 'border-[var(--c-accent)] text-[var(--c-accent)]'
                : 'text-[var(--c-muted)]'}"
              aria-hidden="true"
            >
              {index + 1}
            </span>
          {/if}

          <GameIcon
            name={section.icon}
            cls="{layout === 'phone-l'
              ? 'h-5 w-5'
              : 'h-6 w-6 min-[1600px]:h-7 min-[1600px]:w-7 min-[2200px]:h-8 min-[2200px]:w-8'} shrink-0"
          />
          <span
            class="max-w-full truncate font-arabic font-bold leading-[1.3] {layout === 'phone-l'
              ? 'text-[11.5px]'
              : 'text-[12px] min-[1600px]:text-[13px] min-[2200px]:text-[14.5px]'}"
          >
            {section.labelAr}
          </span>

          {#if badge > 0}
            <span
              class="num absolute top-1.5 end-1.5 flex h-4 min-w-4 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-strip)] px-1 text-[10.5px] font-bold leading-none {isActive
                ? 'text-[var(--c-accent)]'
                : 'text-[var(--c-text-2)]'}"
            >
              {badge > 9 ? '9+' : badge}
            </span>
          {/if}
          {#if dot}
            <span class="absolute top-2 end-2 h-1.5 w-1.5 bg-[var(--c-neg)]" aria-hidden="true"></span>
          {/if}
          {#if related}
            <span class="absolute inset-y-3 start-0 w-[2px] bg-[var(--c-text-2)]" aria-hidden="true"></span>
          {/if}
        </button>
      {/each}
    </div>

    <EndTurnSeal integrated={true} />
  </nav>
{/if}
