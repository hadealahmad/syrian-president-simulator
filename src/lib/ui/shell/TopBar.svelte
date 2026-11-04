<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import { STAT_NAMES_AR } from '../panels/shared';
  import { buildPrimaryStats, buildSecondaryStats, type TopStat } from './topbar-stats';

  let p = $derived($projectedTurnStore);
  let primary = $derived(buildPrimaryStats(p));
  let secondary = $derived(buildSecondaryStats(p));
  let selectedStat = $derived($uiStore.selectedStatForOptions);

  let openStatId = $state<string | null>(null);
  let moreOpen = $state(false);

  let openStat = $derived<TopStat | null>(
    [...primary, ...secondary].find((s) => s.id === openStatId) ?? null
  );

  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));
  let secondaryChanged = $derived(secondary.some((s) => s.hasDelta));

  function toggleStat(id: string): void {
    moreOpen = false;
    openStatId = openStatId === id ? null : id;
  }

  function toggleMore(): void {
    openStatId = null;
    moreOpen = !moreOpen;
  }

  function closePanels(): void {
    openStatId = null;
    moreOpen = false;
  }

  function useStatFilter(id: string): void {
    uiStore.openStatRelatedOptions(id);
    closePanels();
  }

  function clearFilter(): void {
    uiStore.closeStatRelatedOptions();
  }

  function surplusClass(stat: TopStat): string {
    if (!stat.hasDelta) return 'text-wheat-dark';
    return stat.beneficial ? 'text-forest-accent' : 'text-umber-crimson';
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape' && (openStatId || moreOpen)) closePanels();
  }}
/>

<header
  data-tour="treasury"
  class="pointer-events-auto fixed inset-x-0 top-0 z-30 flex h-[var(--shell-top-h)] select-none items-stretch gap-1 border-b border-wheat-mid/15 bg-forest-deep/95 px-3 font-arabic text-wheat-light shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md phone-p:gap-0 phone-p:px-1.5 phone-l:gap-1 phone-l:px-2"
  aria-label="الشريط السيادي للمؤشرات"
>
  <!-- Brand -->
  <div class="hidden shrink-0 items-center gap-2.5 md:flex phone-l:hidden">
    <svg class="h-9 w-9 shrink-0 text-wheat-gold drop-shadow-[0_0_10px_rgba(242,207,119,0.18)]" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18.2" stroke="currentColor" stroke-width="1.2" opacity=".85" />
      <circle cx="20" cy="20" r="14.2" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 3" opacity=".55" />
      <path d="M20 8.6l2.5 6.1 6.6.4-5.1 4.2 1.7 6.4L20 22.2l-5.7 3.5 1.7-6.4-5.1-4.2 6.6-.4L20 8.6Z" fill="currentColor" opacity=".92" />
      <path d="M20 27.2v4.2M16.8 31.4h6.4" stroke="currentColor" stroke-width="1" opacity=".7" />
    </svg>
    <div class="leading-tight">
      <div class="whitespace-nowrap font-heading text-[15px] font-semibold tracking-tight">محاكي الرئيس السوري</div>
      <div class="mt-0.5 text-[8px] tracking-[2.4px] text-forest-accent/80" dir="ltr">DIWAN · SITUATION DESK</div>
    </div>
  </div>

  <!-- Turn chip -->
  <div
    class="flex shrink-0 items-center gap-2 border border-wheat-mid/15 bg-charcoal-deep/40 px-3 phone-p:hidden phone-l:px-2"
    aria-label="الدور الحالي"
  >
    <span class="text-[9px] text-wheat-dark phone-l:hidden">الدور</span>
    <span class="font-heading text-[17px] leading-none text-wheat-gold phone-l:text-[14px]">
      {turnText}<small class="font-sans text-[9px] text-wheat-dark">/40</small>
    </span>
    <span class="h-[18px] w-px bg-wheat-mid/15"></span>
    <span class="whitespace-nowrap text-[10px] text-wheat-mid phone-l:text-[9px]">
      {seasonText} · {$gameStore.calendarYear}
    </span>
  </div>

  <!-- Primary stats -->
  <div class="stats-bar flex min-w-0 flex-1 items-stretch justify-between phone-p:justify-around phone-l:justify-between">
    {#each primary as stat, i (stat.id)}
      <button
        type="button"
        data-tour={stat.tour}
        onclick={() => toggleStat(stat.id)}
        aria-haspopup="dialog"
        aria-expanded={openStatId === stat.id}
        aria-pressed={selectedStat === stat.id}
        title={stat.explainer}
        class="group relative flex min-w-0 items-center gap-2 border border-transparent px-2.5 text-start transition-colors hover:border-forest-accent/20 hover:bg-forest-accent/5 focus-visible:border-wheat-gold phone-p:flex-1 phone-p:flex-col phone-p:justify-center phone-p:gap-0 phone-p:px-0.5 phone-p:py-0.5 phone-l:min-w-0 phone-l:px-1.5 phone-l:gap-1 {i >= 4
          ? 'phone-p:hidden'
          : ''} {selectedStat === stat.id ? 'border-wheat-gold/70 bg-forest-surface/70' : ''}"
      >
        <span class="flex shrink-0 items-center justify-center text-wheat-dark transition-colors group-hover:text-wheat-mid phone-p:mb-0.5">
          <GameIcon name={stat.icon} cls="h-4 w-4 shrink-0 phone-p:h-3.5 phone-p:w-3.5 phone-l:h-3 phone-l:w-3" />
        </span>
        <span class="flex min-w-0 flex-col gap-px">
          <span class="whitespace-nowrap text-[8.5px] leading-none text-wheat-dark phone-p:text-[7px] phone-l:text-[7px] phone-l:hidden">
            {stat.labelAr}
          </span>
          <span class="flex items-baseline gap-1 whitespace-nowrap font-mono leading-none">
            <span dir="ltr" class="text-[15px] font-semibold {stat.toneClass} phone-p:text-[12.5px] phone-l:text-[13px]">{stat.value}</span>
            <span class="text-[8px] text-wheat-dark phone-p:text-[7px] phone-l:text-[7px]">{stat.suffix}</span>
          </span>
          {#if stat.hasDelta}
            <span class="flex items-baseline gap-0.5 whitespace-nowrap text-[8px] leading-none text-wheat-dark phone-p:hidden phone-l:hidden">
              <span aria-hidden="true">←</span>
              <span dir="ltr" class={surplusClass(stat)}>{stat.projected}</span>
              <span>{stat.suffix}</span>
            </span>
          {/if}
        </span>
        {#if stat.hasDelta}
          <span
            dir="ltr"
            class="shrink-0 px-1 py-0.5 text-[7.5px] font-bold leading-none shell-round-chip {stat.beneficial
              ? 'bg-status-ok/15 text-status-ok'
              : 'bg-umber-deep/80 text-umber-crimson'} phone-p:hidden phone-l:hidden"
          >
            {stat.deltaText}
          </span>
        {/if}
        {#if selectedStat === stat.id}
          <span class="absolute -bottom-px inset-x-1 h-0.5 bg-wheat-gold" aria-hidden="true"></span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Alerts bell (landscape phones only) -->
  <button
    type="button"
    class="hidden h-full w-11 shrink-0 items-center justify-center border border-transparent text-wheat-dark transition-colors hover:border-forest-accent/20 hover:text-wheat-light phone-l:flex"
    aria-label="الإنذارات المفتوحة"
    aria-expanded={$uiStore.isAlertsOpen}
    title="الإنذارات المفتوحة"
    onclick={() => uiStore.setAlertsOpen(!$uiStore.isAlertsOpen)}
  >
    <svg viewBox="0 0 24 24" class="h-4.5 w-4.5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" stroke-linejoin="round" />
      <path d="M10 18a2.2 2.2 0 0 0 4 0" stroke-linecap="round" />
    </svg>
  </button>

  <!-- More tray -->
  <button
    type="button"
    onclick={toggleMore}
    aria-haspopup="dialog"
    aria-expanded={moreOpen}
    aria-label="مؤشرات أخرى"
    title="مؤشرات أخرى"
    class="relative flex h-full w-11 shrink-0 items-center justify-center gap-1 border border-transparent px-1 text-wheat-dark transition-colors hover:border-forest-accent/20 hover:bg-forest-accent/5 hover:text-wheat-light phone-l:w-10"
  >
    <svg viewBox="0 0 24 24" class="h-4.5 w-4.5 shrink-0" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </svg>
    <span class="hidden whitespace-nowrap text-[9px] font-bold xl:inline phone-l:hidden">المزيد</span>
    {#if secondaryChanged}
      <span class="absolute top-2 inset-inline-end-3 h-1.5 w-1.5 bg-wheat-gold shell-round-chip" aria-hidden="true"></span>
    {/if}
  </button>
</header>

{#if openStat || moreOpen}
  <!-- Tap-outside catcher below the bar; the bar itself stays tappable so a
       second stat can be inspected without closing first. -->
  <div
    class="pointer-events-auto fixed inset-x-0 bottom-0 z-[58] bg-charcoal-deep/35 shell-fade-in"
    style="top: var(--shell-top-h);"
    role="presentation"
    onclick={closePanels}
    aria-hidden="true"
  ></div>
{/if}

{#if moreOpen}
  <div
    role="dialog"
    aria-label="مؤشرات أخرى"
    class="pointer-events-auto fixed z-[59] overflow-hidden border border-wheat-mid/20 bg-forest-deep/98 shadow-2xl backdrop-blur-md shell-round-pop shell-fade-in"
    style="top: calc(var(--shell-top-h) + 6px); inset-inline-end: 10px; width: min(430px, calc(var(--vp-w) - 20px));"
  >
    <div class="flex items-center justify-between gap-2 border-b border-wheat-mid/10 px-3 py-2">
      <span class="font-heading text-[11px] font-bold text-wheat-gold">مؤشرات أخرى</span>
      <span class="text-[8px] tracking-wide text-wheat-dark">التوقّع بعد إنهاء الدور</span>
    </div>
    <div class="scroll-area max-h-[60vh] overflow-y-auto p-1.5">
      {#each secondary as stat (stat.id)}
        <button
          type="button"
          onclick={() => toggleStat(stat.id)}
          class="flex min-h-11 w-full items-center gap-2 border border-transparent px-2 py-1.5 text-start transition-colors hover:border-forest-accent/20 hover:bg-forest-accent/5 focus-visible:border-wheat-gold {selectedStat === stat.id ? 'border-wheat-gold/60 bg-forest-surface/60' : ''}"
        >
          <span class="flex h-7 w-7 shrink-0 items-center justify-center bg-forest-mid/60 text-wheat-mid">
            <GameIcon name={stat.icon} cls="h-3.5 w-3.5 shrink-0" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[10px] text-wheat-dark">{stat.labelAr}</span>
            <span class="flex items-baseline gap-1 font-mono text-[12.5px] text-wheat-light">
              <span dir="ltr">{stat.value}</span><span class="text-[8px] text-wheat-dark">{stat.suffix}</span>
              {#if stat.hasDelta}
                <span aria-hidden="true" class="text-[9px] text-wheat-dark">←</span>
                <span dir="ltr" class={surplusClass(stat)}>{stat.projected}</span>
              {/if}
            </span>
          </span>
          {#if stat.hasDelta}
            <span dir="ltr" class="shrink-0 px-1 py-0.5 text-[7.5px] font-bold shell-round-chip {stat.beneficial ? 'bg-status-ok/15 text-status-ok' : 'bg-umber-deep/80 text-umber-crimson'}">
              {stat.deltaText}
            </span>
          {/if}
        </button>
      {/each}
      {#if selectedStat}
        <button
          type="button"
          onclick={clearFilter}
          class="mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 border border-wheat-gold/40 bg-wheat-gold/10 px-2 py-2 text-[10px] font-bold text-wheat-gold"
        >
          <GameIcon name="cross-mark" cls="h-3 w-3 shrink-0" />
          إلغاء تصفية الخيارات
        </button>
      {/if}
    </div>
  </div>
{/if}

{#if openStat}
  <div
    role="dialog"
    aria-label={openStat.labelAr}
    class="pointer-events-auto fixed z-[59] overflow-hidden border border-wheat-mid/25 bg-forest-deep/98 shadow-2xl backdrop-blur-md shell-round-pop shell-fade-in"
    style="top: calc(var(--shell-top-h) + 6px); inset-inline-end: 10px; width: min(360px, calc(var(--vp-w) - 20px));"
  >
    <div class="flex items-start justify-between gap-2 border-b border-wheat-mid/10 px-3 py-2">
      <div class="min-w-0">
        <div class="flex items-center gap-1.5 text-[8.5px] tracking-[1.4px] text-forest-accent/90">
          <span class="h-px w-3 bg-forest-accent/60"></span>
          توقّع الدور القادم
        </div>
        <div class="mt-0.5 truncate font-heading text-[15px] font-bold text-wheat-light">{openStat.labelAr}</div>
      </div>
      <button
        type="button"
        onclick={closePanels}
        aria-label="إغلاق الشرح"
        class="flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark hover:text-wheat-light"
      >
        <GameIcon name="cross-mark" cls="h-3.5 w-3.5 shrink-0" />
      </button>
    </div>

    <div class="px-3 py-2.5">
      <div class="flex items-end justify-between gap-2">
        <div dir="ltr" class="font-mono text-[22px] leading-none text-wheat-light">
          {openStat.value}<span class="ms-1 text-[10px] text-wheat-dark">{openStat.suffix}</span>
        </div>
        {#if openStat.hasDelta}
          <div class="flex items-center gap-1.5 text-end">
            <span class="text-[8.5px] text-wheat-dark">بعد التنفيذ</span>
            <span dir="ltr" class="font-mono text-[17px] leading-none {surplusClass(openStat)}">
              {openStat.projected}<span class="ms-0.5 text-[9px]">{openStat.suffix}</span>
            </span>
            <span dir="ltr" class="px-1.5 py-0.5 text-[8.5px] font-bold shell-round-chip {openStat.beneficial ? 'bg-status-ok/15 text-status-ok' : 'bg-umber-deep/80 text-umber-crimson'}">
              {openStat.deltaText}
            </span>
          </div>
        {:else}
          <span class="text-[9px] text-wheat-dark">لا تغيير في المسودة الحالية</span>
        {/if}
      </div>

      <p class="mt-2 border-t border-wheat-mid/10 pt-2 text-[10px] leading-relaxed text-wheat-mid/95">
        {openStat.explainer}
      </p>

      <div class="mt-2.5 flex flex-col gap-1.5">
        <button
          type="button"
          onclick={() => useStatFilter(openStat.id)}
          aria-pressed={selectedStat === openStat.id}
          class="flex min-h-11 items-center justify-center gap-1.5 border px-2 text-[10.5px] font-bold transition-colors {selectedStat === openStat.id
            ? 'border-wheat-gold bg-wheat-gold text-forest-deep'
            : 'border-wheat-gold/50 bg-wheat-gold/10 text-wheat-gold hover:bg-wheat-gold/20'}"
        >
          <GameIcon name="check-mark" cls="h-3 w-3 shrink-0" />
          {selectedStat === openStat.id ? 'إلغاء تصفية هذا المؤشر' : 'عرض الخيارات المرتبطة بهذا المؤشر'}
        </button>
        {#if selectedStat === openStat.id}
          <button
            type="button"
            onclick={clearFilter}
            class="flex min-h-11 items-center justify-center gap-1.5 border border-wheat-mid/25 px-2 text-[10px] font-semibold text-wheat-mid hover:border-wheat-mid/50 hover:text-wheat-light"
          >
            إلغاء التصفية
          </button>
        {/if}
      </div>
      <div class="mt-2 text-[8px] text-wheat-dark">
        المؤشر الحالي: {STAT_NAMES_AR[openStat.id] ?? openStat.labelAr} · يمكنك إغلاق الشرح والتصفية في أي وقت.
      </div>
    </div>
  </div>
{/if}
