<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '../../stores/game-store';
  import { previewRangesStore, projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import { versionStore } from '../../stores/version-store';
  import GameIcon from '../GameIcon.svelte';
  import { STAT_NAMES_AR } from '../panels/shared';
  import { openSettingsMenu } from '../flow/settings-menu';
  import { fx } from '../fx/feedback';
  import { buildShellAlerts, formatAlertBadge } from './alerts';
  import { selectStatAndJump } from './section-nav';
  import { buildPrimaryStats, buildSecondaryStats, type TopStat } from './topbar-stats';
  import { shellLayout } from './viewport';
  import StatCapsule from './StatCapsule.svelte';

  let layout = $derived($shellLayout);
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');

  let p = $derived($projectedTurnStore);
  let primary = $derived(buildPrimaryStats(p));
  let secondary = $derived(buildSecondaryStats(p));
  let selectedStat = $derived($uiStore.selectedStatForOptions);

  let visibleAlerts = $derived(
    buildShellAlerts(
      $gameStore,
      $previewRangesStore,
      $uiStore.dismissedAlertIds,
      (id) => uiStore.selectGovernorate(id),
    )
  );
  let alertCount = $derived(visibleAlerts.length);
  let hasCriticalAlert = $derived(visibleAlerts.some((a) => a.severity === 'high'));

  let openStatId = $state<string | null>(null);
  let moreOpen = $state(false);
  let headerEl: HTMLElement | null = $state(null);

  let openStat = $derived<TopStat | null>(
    [...primary, ...secondary].find((s) => s.id === openStatId) ?? null
  );

  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));
  let secondaryChanged = $derived(secondary.some((s) => s.hasDelta));

  onMount(() => {
    const syncTopHeight = (): void => {
      if (!headerEl) return;
      const h = Math.ceil(headerEl.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--shell-top-h', `${h}px`);
      }
    };
    syncTopHeight();
    if (typeof ResizeObserver === 'undefined' || !headerEl) return;
    const ro = new ResizeObserver(syncTopHeight);
    ro.observe(headerEl);
    return () => ro.disconnect();
  });

  function toggleStat(id: string): void {
    fx('tap');
    moreOpen = false;
    openStatId = openStatId === id ? null : id;
  }

  function toggleMore(): void {
    fx('tap');
    openStatId = null;
    moreOpen = !moreOpen;
  }

  function closePanels(): void {
    if (openStatId || moreOpen) fx('cancel');
    openStatId = null;
    moreOpen = false;
  }

  function closePanelsQuiet(): void {
    openStatId = null;
    moreOpen = false;
  }

  function handleOpenSettings(): void {
    fx('tap');
    closePanelsQuiet();
    openSettingsMenu();
  }

  function handleAlertsClick(): void {
    fx('tap');
    closePanelsQuiet();
    if (layout !== 'desktop') {
      uiStore.setAlertsOpen(!$uiStore.isAlertsOpen);
    } else if (visibleAlerts[0]) {
      visibleAlerts[0].run();
    }
  }

  function useStatFilter(id: string): void {
    fx('select');
    selectStatAndJump(id);
    closePanelsQuiet();
  }

  function clearFilter(): void {
    fx('cancel');
    uiStore.closeStatRelatedOptions();
  }

  function surplusClass(stat: TopStat): string {
    if (!stat.hasDelta) return 'text-[var(--c-muted)]';
    return stat.beneficial ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]';
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape' && (openStatId || moreOpen)) {
      event.stopPropagation();
      event.preventDefault();
      closePanels();
    }
  }}
/>

<header
  bind:this={headerEl}
  data-tour="treasury"
  class="hud-chrome pointer-events-auto fixed inset-x-0 top-0 z-30 flex select-none flex-col border-b border-[var(--c-line)] bg-[var(--c-strip)] pt-[env(safe-area-inset-top)] font-arabic text-[var(--c-text)]"
  aria-label="الشريط السيادي للمؤشرات"
>
  {#if isPortrait}
    <!-- Portrait phone: compact top bar (Gear + Turn/Season/Year + Alerts chip + More), then 4 ruled resource cells -->
    <div class="flex min-h-[38px] items-stretch border-b border-[var(--c-line)] bg-[var(--c-panel)]">
      <button
        type="button"
        data-tour="settings-gear"
        onclick={handleOpenSettings}
        aria-haspopup="dialog"
        aria-expanded={$uiStore.isSettingsOpen}
        aria-label="الإعدادات والقائمة"
        title="الإعدادات — لعبة جديدة، المظهر، الدليل، المزيد"
        class="pressable relative flex min-h-11 w-11 shrink-0 items-center justify-center border-e border-[var(--c-line)] text-[var(--c-muted)] hover:text-[var(--c-accent)]"
      >
        {#if $versionStore.hasUpdate}
          <span class="absolute top-2 end-2 h-2 w-2 bg-[var(--c-accent)]" aria-hidden="true"></span>
        {/if}
        <GameIcon name="gear" cls="h-4.5 w-4.5 shrink-0" />
      </button>

      <div
        class="flex min-w-0 flex-1 items-center gap-2 px-2.5"
        aria-label="الدور الحالي"
      >
        <span class="text-[12px] text-[var(--c-muted)]">الدور</span>
        <span class="num text-[15px] font-bold leading-none text-[var(--c-accent)]" dir="ltr">
          {turnText}<small class="text-[11px] font-normal text-[var(--c-muted)]">/40</small>
        </span>
        <span class="truncate text-[12px] text-[var(--c-muted)]">
          {seasonText} · <bdi>{$gameStore.calendarYear}</bdi>
        </span>
      </div>

      {#if alertCount > 0}
        <button
          type="button"
          onclick={handleAlertsClick}
          aria-expanded={$uiStore.isAlertsOpen}
          aria-label="الإنذارات المفتوحة"
          class="pressable flex min-h-11 shrink-0 items-center border-s border-[var(--c-line)] px-2 text-[11px] font-bold {hasCriticalAlert
            ? 'text-[var(--c-neg)]'
            : 'text-[var(--c-accent)]'}"
        >
          <span class="border px-1.5 py-0.5 {hasCriticalAlert ? 'border-[var(--c-neg)]' : 'border-[var(--c-accent)]'}">
            {formatAlertBadge(alertCount)}
          </span>
        </button>
      {/if}

      <button
        type="button"
        onclick={toggleMore}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-label="مؤشرات أخرى"
        title="مؤشرات أخرى"
        class="pressable relative flex min-h-11 w-11 shrink-0 items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:text-[var(--c-accent)] {moreOpen
          ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
          : ''}"
      >
        <GameIcon name="more" cls="h-4.5 w-4.5 shrink-0" />
        {#if secondaryChanged}
          <span
            class="absolute bottom-1 inset-x-3 h-[2px] bg-[var(--c-text-2)]"
            aria-hidden="true"
          ></span>
        {/if}
      </button>
    </div>

    <div class="stats-bar grid grid-cols-4 bg-[var(--c-strip)]">
      {#each primary.slice(0, 4) as stat (stat.id)}
        <StatCapsule
          {stat}
          {layout}
          expanded={openStatId === stat.id}
          selected={selectedStat === stat.id}
          onclick={() => toggleStat(stat.id)}
        />
      {/each}
    </div>
  {:else if isLandscape}
    <!-- Landscape phone: single 54px ruled row -->
    <div class="flex min-h-[54px] items-stretch bg-[var(--c-strip)]">
      <button
        type="button"
        data-tour="settings-gear"
        onclick={handleOpenSettings}
        aria-haspopup="dialog"
        aria-expanded={$uiStore.isSettingsOpen}
        aria-label="الإعدادات والقائمة"
        title="الإعدادات — لعبة جديدة، المظهر، الدليل، المزيد"
        class="pressable relative flex min-h-11 w-11 shrink-0 items-center justify-center border-e border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-muted)] hover:text-[var(--c-accent)]"
      >
        {#if $versionStore.hasUpdate}
          <span class="absolute top-2 end-2 h-2 w-2 bg-[var(--c-accent)]" aria-hidden="true"></span>
        {/if}
        <GameIcon name="gear" cls="h-4.5 w-4.5 shrink-0" />
      </button>

      <div
        class="flex shrink-0 flex-col justify-center border-e border-[var(--c-line)] bg-[var(--c-panel)] px-2.5"
        aria-label="الدور الحالي"
      >
        <span class="num text-[13.5px] font-bold leading-none text-[var(--c-accent)]" dir="ltr">
          {turnText}<small class="text-[10.5px] font-normal text-[var(--c-muted)]">/40</small>
        </span>
        <span class="mt-0.5 whitespace-nowrap text-[10.5px] text-[var(--c-muted)]">
          {seasonText} · <bdi>{$gameStore.calendarYear}</bdi>
        </span>
      </div>

      <div class="stats-bar grid min-w-0 flex-1 grid-cols-6">
        {#each primary as stat (stat.id)}
          <StatCapsule
            {stat}
            {layout}
            expanded={openStatId === stat.id}
            selected={selectedStat === stat.id}
            onclick={() => toggleStat(stat.id)}
          />
        {/each}
      </div>

      <button
        type="button"
        onclick={handleAlertsClick}
        aria-label="الإنذارات المفتوحة"
        aria-expanded={$uiStore.isAlertsOpen}
        title="الإنذارات المفتوحة"
        class="pressable relative flex min-h-11 w-11 shrink-0 items-center justify-center border-s border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-muted)] hover:text-[var(--c-text)] {$uiStore.isAlertsOpen
          ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
          : ''}"
      >
        <GameIcon name="bell" cls="h-4.5 w-4.5 shrink-0" />
        {#if alertCount > 0}
          <span class="absolute top-2 end-2 h-2 w-2 {hasCriticalAlert ? 'bg-[var(--c-neg)]' : 'bg-[var(--c-accent)]'}" aria-hidden="true"></span>
        {/if}
      </button>

      <button
        type="button"
        onclick={toggleMore}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-label="مؤشرات أخرى"
        title="مؤشرات أخرى"
        class="pressable relative flex min-h-11 w-11 shrink-0 items-center justify-center border-s border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-muted)] hover:text-[var(--c-accent)] {moreOpen
          ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
          : ''}"
      >
        <GameIcon name="more" cls="h-4.5 w-4.5 shrink-0" />
        {#if secondaryChanged}
          <span class="absolute bottom-1 inset-x-3 h-[2px] bg-[var(--c-text-2)]" aria-hidden="true"></span>
        {/if}
      </button>
    </div>
  {:else}
    <!-- Desktop: viewport-stepped ruled strip (60 -> 64 -> 72px) — Turn cell, content-led 6 resource cells, system buttons at end -->
    <div
      class="flex items-stretch bg-[var(--c-strip)]"
      style="height: var(--shell-top-base-h, 60px);"
    >
      <!-- Turn cell -->
      <div
        class="flex w-[140px] min-[1600px]:w-[154px] min-[2200px]:w-[172px] shrink-0 flex-col justify-center border-e border-[var(--c-line)] bg-[var(--c-panel)] px-3 min-[1600px]:px-3.5"
        aria-label="الدور الحالي"
      >
        <div class="flex items-baseline gap-1.5 text-[13.5px] min-[1600px]:text-[14.5px] min-[2200px]:text-[15.5px]">
          <span class="text-[var(--c-muted)]">الدور</span>
          <span class="num text-[18px] min-[1600px]:text-[20px] min-[2200px]:text-[22px] font-bold leading-none text-[var(--c-accent)]" dir="ltr">
            {turnText}<small class="text-[12px] min-[1600px]:text-[13px] min-[2200px]:text-[14px] font-normal text-[var(--c-muted)]">/40</small>
          </span>
        </div>
        <div class="mt-0.5 truncate text-[11.5px] min-[1600px]:text-[12.5px] min-[2200px]:text-[13.5px] text-[var(--c-muted)]">
          {seasonText} · <bdi>{$gameStore.calendarYear}</bdi>
        </div>
      </div>

      <!-- 6 content-led ruled stat cells aligned from inline-start -->
      <div class="stats-bar flex min-w-0 flex-1 items-stretch justify-start">
        {#each primary as stat (stat.id)}
          <StatCapsule
            {stat}
            {layout}
            expanded={openStatId === stat.id}
            selected={selectedStat === stat.id}
            onclick={() => toggleStat(stat.id)}
          />
        {/each}
      </div>

      <!-- Alerts chip + more + gear anchored at inline-end -->
      <div class="flex shrink-0 items-center gap-2 border-s border-[var(--c-line)] bg-[var(--c-panel)] px-3 min-[1600px]:px-3.5">
        {#if alertCount > 0}
          <button
            type="button"
            onclick={handleAlertsClick}
            aria-label="الإنذارات المفتوحة"
            title="الإنذارات المفتوحة — انتقال لأول إنذار"
            class="pressable border px-2.5 py-1 text-[12px] min-[1600px]:text-[13px] min-[2200px]:text-[13.5px] font-bold {hasCriticalAlert
              ? 'border-[var(--c-neg)] text-[var(--c-neg)] hover:bg-[var(--c-ev-bg)]'
              : 'border-[var(--c-accent)] text-[var(--c-accent)] hover:bg-[var(--c-chip-bg)]'}"
          >
            {formatAlertBadge(alertCount)}
          </button>
        {/if}

        <button
          type="button"
          onclick={toggleMore}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-label="مؤشرات أخرى"
          title="مؤشرات أخرى"
          class="pressable relative flex h-10 min-w-10 min-[1600px]:h-11 min-[1600px]:min-w-11 items-center justify-center gap-1 border border-[var(--c-line)] bg-[var(--c-bg)] px-2 text-[var(--c-muted)] hover:border-[var(--c-line-strong)] hover:text-[var(--c-accent)] {moreOpen
            ? 'border-[var(--c-text)] bg-[var(--c-text)] text-[var(--c-ink)]'
            : ''}"
        >
          <GameIcon name="more" cls="h-4.5 w-4.5 min-[2200px]:h-5 min-[2200px]:w-5 shrink-0" />
          <span class="hidden whitespace-nowrap text-[11.5px] min-[1600px]:text-[12.5px] font-bold 2xl:inline">المزيد</span>
          {#if secondaryChanged}
            <span class="absolute bottom-1 inset-x-2.5 h-[2px] bg-[var(--c-text-2)]" aria-hidden="true"></span>
          {/if}
        </button>

        <button
          type="button"
          data-tour="settings-gear"
          onclick={handleOpenSettings}
          aria-haspopup="dialog"
          aria-expanded={$uiStore.isSettingsOpen}
          aria-label="الإعدادات والقائمة"
          title="الإعدادات — لعبة جديدة، المظهر، الدليل، المزيد"
          class="pressable relative flex h-10 w-10 min-[1600px]:h-11 min-[1600px]:w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-muted)] hover:border-[var(--c-line-strong)] hover:text-[var(--c-accent)]"
        >
          {#if $versionStore.hasUpdate}
            <span class="absolute top-1.5 end-1.5 h-2 w-2 bg-[var(--c-accent)]" aria-hidden="true"></span>
          {/if}
          <GameIcon name="gear" cls="h-4.5 w-4.5 min-[2200px]:h-5 min-[2200px]:w-5 shrink-0" />
        </button>
      </div>
    </div>
  {/if}
</header>

{#if openStat || moreOpen}
  <div
    class="pointer-events-auto fixed inset-x-0 bottom-0 z-[58] bg-[var(--c-bg)]/60 shell-fade-in"
    style="top: var(--shell-top-h);"
    role="presentation"
    onclick={closePanels}
    aria-hidden="true"
  ></div>
{/if}

{#if moreOpen}
  <div
    role="dialog"
    data-topbar-popover
    aria-label="مؤشرات أخرى"
    class="pointer-events-auto fixed z-[59] overflow-hidden border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] shell-fade-in"
    style="top: calc(var(--shell-top-h) + 8px); inset-inline-end: 10px; width: min(430px, calc(var(--vp-w) - 20px));"
  >
    <div class="flex items-center justify-between gap-2 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-3.5 py-2.5">
      <span class="font-heading text-[14px] font-bold text-[var(--c-text)]">مؤشرات أخرى</span>
      <span class="text-[11px] font-medium text-[var(--c-muted)]">التوقّع بعد إنهاء الدور</span>
    </div>
    <div class="scroll-area max-h-[62vh] space-y-1.5 overflow-y-auto p-2">
      {#if isPortrait}
        {#each primary.slice(4) as stat (stat.id)}
          {@const hasArabic = /[\u0600-\u06FF]/.test(stat.suffix)}
          <button
            type="button"
            onclick={() => toggleStat(stat.id)}
            class="pressable flex min-h-11 w-full items-center gap-2.5 border px-2.5 py-2 text-start {selectedStat === stat.id
              ? 'border-[var(--c-line-strong)] bg-[var(--c-chip-bg)]'
              : 'border-[var(--c-line)] bg-[var(--c-bg)] hover:border-[var(--c-line-strong)]'}"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)]">
              <GameIcon name={stat.icon} cls="h-4 w-4 shrink-0" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[12px] font-medium leading-[1.4] text-[var(--c-muted)]">{stat.labelAr}</span>
              <span class="flex items-baseline gap-1.5 text-[14px] text-[var(--c-text)]">
                {#if hasArabic}
                  <span class="inline-flex items-baseline gap-1">
                    <bdi dir="ltr" class="num font-bold {stat.toneClass}">{stat.prefix ?? ''}{stat.value}</bdi>
                    <bdi dir="rtl" class="text-[11px] text-[var(--c-muted)]">{stat.suffix}</bdi>
                  </span>
                {:else}
                  <bdi dir="ltr" class="num font-bold {stat.toneClass}">{stat.prefix ?? ''}{stat.value}{#if stat.suffix}<small class="text-[11px] font-normal text-[var(--c-muted)]">{stat.suffix}</small>{/if}</bdi>
                {/if}
                {#if stat.hasDelta}
                  <span aria-hidden="true" class="text-[11px] text-[var(--c-muted)]">←</span>
                  <bdi dir="ltr" class="num font-bold {surplusClass(stat)}">{stat.prefix ?? ''}{stat.projected}{#if stat.suffix && !hasArabic}<small class="text-[11px] font-normal">{stat.suffix}</small>{/if}</bdi>
                {/if}
              </span>
            </span>
            {#if stat.hasDelta}
              <span
                dir="ltr"
                class="num shrink-0 bg-[var(--c-chip-bg)] px-1.5 py-0.5 text-[11px] font-bold {stat.beneficial
                  ? 'text-[var(--c-pos)]'
                  : 'text-[var(--c-neg)]'}"
              >
                {stat.deltaArrow} {stat.deltaText}
              </span>
            {/if}
          </button>
        {/each}
      {/if}

      {#each secondary as stat (stat.id)}
        {@const hasArabic = /[\u0600-\u06FF]/.test(stat.suffix)}
        <button
          type="button"
          onclick={() => toggleStat(stat.id)}
          class="pressable flex min-h-11 w-full items-center gap-2.5 border px-2.5 py-2 text-start {selectedStat === stat.id
            ? 'border-[var(--c-line-strong)] bg-[var(--c-chip-bg)]'
            : 'border-[var(--c-line)] bg-[var(--c-bg)] hover:border-[var(--c-line-strong)]'}"
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)]">
            <GameIcon name={stat.icon} cls="h-4 w-4 shrink-0" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[12px] font-medium leading-[1.4] text-[var(--c-muted)]">{stat.labelAr}</span>
            <span class="flex items-baseline gap-1.5 text-[14px] text-[var(--c-text)]">
              {#if hasArabic}
                <span class="inline-flex items-baseline gap-1">
                  <bdi dir="ltr" class="num font-bold {stat.toneClass}">{stat.prefix ?? ''}{stat.value}</bdi>
                  <bdi dir="rtl" class="text-[11px] text-[var(--c-muted)]">{stat.suffix}</bdi>
                </span>
              {:else}
                <bdi dir="ltr" class="num font-bold {stat.toneClass}">{stat.prefix ?? ''}{stat.value}{#if stat.suffix}<small class="text-[11px] font-normal text-[var(--c-muted)]">{stat.suffix}</small>{/if}</bdi>
              {/if}
              {#if stat.hasDelta}
                <span aria-hidden="true" class="text-[11px] text-[var(--c-muted)]">←</span>
                <bdi dir="ltr" class="num font-bold {surplusClass(stat)}">{stat.prefix ?? ''}{stat.projected}{#if stat.suffix && !hasArabic}<small class="text-[11px] font-normal">{stat.suffix}</small>{/if}</bdi>
              {/if}
            </span>
          </span>
          {#if stat.hasDelta}
            <span
              dir="ltr"
              class="num shrink-0 bg-[var(--c-chip-bg)] px-1.5 py-0.5 text-[11px] font-bold {stat.beneficial
                ? 'text-[var(--c-pos)]'
                : 'text-[var(--c-neg)]'}"
            >
              {stat.deltaArrow} {stat.deltaText}
            </span>
          {/if}
        </button>
      {/each}

      {#if selectedStat}
        <button
          type="button"
          onclick={clearFilter}
          class="game-btn mt-1 w-full text-[12px]"
        >
          <GameIcon name="cross-mark" cls="h-3.5 w-3.5 shrink-0" />
          إلغاء تصفية الخيارات
        </button>
      {/if}
    </div>
  </div>
{/if}

{#if openStat}
  {@const openArabicSuffix = /[\u0600-\u06FF]/.test(openStat.suffix)}
  <div
    role="dialog"
    data-topbar-popover
    aria-label={openStat.labelAr}
    class="pointer-events-auto fixed z-[59] overflow-hidden border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] shell-fade-in"
    style="top: calc(var(--shell-top-h) + 8px); inset-inline-end: 10px; width: min(370px, calc(var(--vp-w) - 20px));"
  >
    <div class="flex items-center justify-between gap-2 border-b border-[var(--c-line)] bg-[var(--c-strip)] px-3.5 py-2.5">
      <div class="min-w-0">
        <div class="text-[11px] font-medium text-[var(--c-muted)]">
          توقّع الدور القادم
        </div>
        <div class="mt-0.5 truncate font-heading text-[16px] font-bold leading-[1.4] text-[var(--c-text)]">
          {openStat.labelAr}
        </div>
      </div>
      <button
        type="button"
        onclick={closePanels}
        aria-label="إغلاق الشرح"
        class="game-btn game-btn-ghost h-11 w-11 shrink-0 p-0 text-[var(--c-muted)] hover:text-[var(--c-text)]"
      >
        <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
      </button>
    </div>

    <div class="px-3.5 py-3">
      <div class="flex flex-wrap items-center justify-between gap-2 border border-[var(--c-line)] bg-[var(--c-bg)] px-3 py-2.5">
        <div class="inline-flex items-baseline gap-1 text-[22px] font-bold leading-none {openStat.toneClass}">
          {#if openArabicSuffix}
            <bdi dir="ltr" class="num">{openStat.prefix ?? ''}{openStat.value}</bdi>
            <bdi dir="rtl" class="font-arabic text-[11px] font-normal text-[var(--c-muted)]">{openStat.suffix}</bdi>
          {:else}
            <bdi dir="ltr" class="num">{openStat.prefix ?? ''}{openStat.value}{#if openStat.suffix}<small class="font-arabic text-[11px] font-normal text-[var(--c-muted)]">{openStat.suffix}</small>{/if}</bdi>
          {/if}
        </div>
        {#if openStat.hasDelta}
          <div class="flex flex-wrap items-center gap-1.5 text-end">
            <span class="text-[11px] text-[var(--c-muted)]">بعد التنفيذ</span>
            <span class="inline-flex items-baseline gap-0.5 text-[17px] font-bold leading-none {surplusClass(openStat)}">
              {#if openArabicSuffix}
                <bdi dir="ltr" class="num">{openStat.prefix ?? ''}{openStat.projected}</bdi>
                <bdi dir="rtl" class="font-arabic text-[11px] font-normal">{openStat.suffix}</bdi>
              {:else}
                <bdi dir="ltr" class="num">{openStat.prefix ?? ''}{openStat.projected}{#if openStat.suffix}<small class="font-arabic text-[11px] font-normal">{openStat.suffix}</small>{/if}</bdi>
              {/if}
            </span>
            <span
              dir="ltr"
              class="num bg-[var(--c-chip-bg)] px-1.5 py-0.5 text-[11px] font-bold {openStat.beneficial
                ? 'text-[var(--c-pos)]'
                : 'text-[var(--c-neg)]'}"
            >
              {openStat.deltaArrow} {openStat.deltaText} ({openStat.pctText})
            </span>
          </div>
        {:else}
          <span class="text-[11px] text-[var(--c-muted)]">لا تغيير في المسودة الحالية</span>
        {/if}
      </div>

      <p class="reading-text mt-2.5 text-[12.5px] leading-relaxed text-[var(--c-text-2)]">
        {openStat.explainer}
      </p>

      <div class="mt-3 flex flex-col gap-2">
        <button
          type="button"
          onclick={() => useStatFilter(openStat.id)}
          aria-pressed={selectedStat === openStat.id}
          class="game-btn w-full text-[12.5px] {selectedStat === openStat.id
            ? '!border-[var(--c-text)] !bg-[var(--c-text)] !text-[var(--c-ink)]'
            : ''}"
        >
          <GameIcon name="check-mark" cls="h-3.5 w-3.5 shrink-0" />
          {selectedStat === openStat.id ? 'إلغاء تصفية هذا المؤشر' : 'عرض الخيارات المرتبطة بهذا المؤشر'}
        </button>
        {#if selectedStat === openStat.id}
          <button
            type="button"
            onclick={clearFilter}
            class="game-btn game-btn-ghost w-full text-[12px]"
          >
            إلغاء التصفية
          </button>
        {/if}
      </div>
      <div class="mt-2.5 text-[11px] text-[var(--c-muted)]">
        المؤشر الحالي: {STAT_NAMES_AR[openStat.id] ?? openStat.labelAr} · يمكنك إغلاق الشرح والتصفية في أي وقت.
      </div>
    </div>
  </div>
{/if}
