<script lang="ts">
  import { tick } from 'svelte';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import { STAT_EXPLAINERS_AR, STAT_NAMES_AR, panelHasRelated } from './panels/shared';
  import { governorateShape } from '../spatial3d/syria-2d-paths';
  import EmergencyPanel from './panels/EmergencyPanel.svelte';
  import DecreesPanel from './panels/DecreesPanel.svelte';
  import TaxFinancePanel from './panels/TaxFinancePanel.svelte';
  import AssetsPanel from './panels/AssetsPanel.svelte';
  import PoliciesPanel from './panels/PoliciesPanel.svelte';
  import ProvincialPanel from './panels/ProvincialPanel.svelte';

  // NOTE: page is RTL, so the first entry renders rightmost.
  const BUTTONS = [
    { id: 'stats', icon: 'chart', labelAr: 'الإحصائيات' },
    { id: 'emergency', icon: 'siren', labelAr: 'الطوارئ' },
    { id: 'decrees', icon: 'scroll-quill', labelAr: 'المراسيم' },
    { id: 'tax', icon: 'abacus', labelAr: 'الماليّة' },
    { id: 'assets', icon: 'open-treasure-chest', labelAr: 'الأصول' },
    { id: 'policies', icon: 'vote', labelAr: 'السياسات' },
    { id: 'provincial', icon: 'castle', labelAr: 'المحافظة' },
  ] as const;

  let active = $derived($uiStore.activeCommandPanel);
  // Provincial button shows the selected governorate's map shape (Damascus
  // fallback), like the stats sidebar cards — not the generic castle glyph.
  let provShape = $derived(governorateShape($uiStore.selectedGovernorateId));
  let statsOpen = $derived($uiStore.isStatsSidebarOpen);
  let selectedStat = $derived($uiStore.selectedStatForOptions);

  // Assets unlock at turn 3 to avoid overwhelming new players; once every
  // confiscated asset is processed the button shrinks, desaturates and docks
  // furthest right (first in DOM = rightmost in RTL) as a review shortcut.
  let assetsLocked = $derived(($gameStore.turnNumber ?? 1) <= 2);
  let assetsDone = $derived(
    $gameStore.confiscatedAssets.length > 0 &&
      $gameStore.confiscatedAssets.every((a) => a.status !== 'PENDING')
  );
  let orderedButtons = $derived(
    assetsDone ? [...BUTTONS.filter((b) => b.id === 'assets'), ...BUTTONS.filter((b) => b.id !== 'assets')] : BUTTONS
  );
  let hubEl: HTMLDivElement | null = $state(null);
  let stripEl: HTMLDivElement | null = $state(null);
  // Physical horizontal left offset (px) inside hubEl that centers the hoisted
  // command panel over its active button while clamping it inside the viewport.
  let panelLeftPx = $state<number | null>(null);

  const EDGE = 8;

  let clampToken = 0;
  async function clampPanel(): Promise<void> {
    const t = ++clampToken;
    await tick();
    if (t !== clampToken || !hubEl || !active || active === 'stats') {
      panelLeftPx = null;
      return;
    }
    const panel = hubEl.querySelector<HTMLElement>('[data-cmd-panel]');
    const btn = hubEl.querySelector<HTMLElement>(`[data-panel-btn="${active}"]`);
    if (!panel) return;
    const z = Number(getComputedStyle(document.documentElement).getPropertyValue('--hud-zoom')) || 1;
    const hr = hubEl.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const hubW = hr.width / z;
    const panelW = pr.width / z;
    let idealLeft = (hubW - panelW) / 2;
    if (btn) {
      const br = btn.getBoundingClientRect();
      const btnCenter = (br.left - hr.left + br.width / 2) / z;
      idealLeft = btnCenter - panelW / 2;
    }
    const clampedLeft = Math.max(EDGE, Math.min(idealLeft, Math.max(EDGE, hubW - panelW - EDGE)));
    if (t !== clampToken) return;
    panelLeftPx = Math.round(clampedLeft);
  }

  function clickButton(id: string): void {
    // Stats owns the right sidebar, not a bottom panel.
    if (id === 'stats') {
      uiStore.toggleStatsSidebar();
      return;
    }
    // Assets stay shut for the first two turns.
    if (id === 'assets' && assetsLocked) return;
    if (active === id) {
      uiStore.closeCommandPanel();
    } else {
      // Provincial panel needs a governorate dossier: default to the capital
      // instead of showing an empty placeholder.
      if (id === 'provincial' && !$uiStore.selectedGovernorateId) {
        uiStore.selectGovernorate('damascus');
      }
      if (id === 'decrees') uiStore.checkItem('decrees');
      if (id === 'provincial') uiStore.checkItem('province');
      uiStore.openCommandPanel(id, true);
    }
  }

  $effect(() => {
    void active;
    void statsOpen;
    if (active && active !== 'stats') {
      clampPanel();
    } else {
      panelLeftPx = null;
    }
  });
</script>

<!-- Bottom-center command hub: click a sigil to open, click again or another sigil to close/switch.
     Outer spans the viewport (or the space left of an open stats sidebar on lg+ screens) with
     items-center so the button row stays centered in the available space,
     independent of RTL direction. Glides with the same push transition. -->
<svelte:window onresize={() => active && clampPanel()} />
<div
  bind:this={hubEl}
  data-tour="hub"
  class="pointer-events-none fixed bottom-5 max-sm:bottom-2 [@media(max-height:500px)]:bottom-1.5 left-0 z-40 flex flex-col items-center gap-2 select-none font-arabic transition-all duration-300 ease-in-out {statsOpen ? 'lg:right-[390px] right-0' : 'right-0'}"
  role="group"
  aria-label="لوحة القيادة الرئاسية"
>
  {#if active && active !== 'stats'}
    {@const activeBtn = BUTTONS.find((b) => b.id === active)}
    <!-- Hoisted outside the horizontally scrollable button strip so overflow-x-auto
         never clips the panel vertically on mobile viewports. -->
    <div
      data-cmd-panel
      class="cmd-panel pointer-events-auto absolute bottom-[calc(100%+8px)] scroll-area overflow-y-auto bg-forest-deep border-2 border-wheat-mid/70 shadow-[0_10px_50px_rgba(0,0,0,0.85)] rounded-none p-3.5 sm:p-4 text-wheat-light"
      style="width: min(400px, calc(100vw - 16px)); left: {panelLeftPx !== null ? `${panelLeftPx}px` : 'max(8px, calc(50% - min(200px, 50vw - 8px)))'};"
    >
      <!-- Compact panel bar with mobile close button & active stat filter explainer -->
      <div class="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-charcoal-mid/70">
        <span class="text-[11px] font-bold text-wheat-gold font-heading">
          {activeBtn?.labelAr ?? ''}
        </span>
        <button
          type="button"
          onclick={() => uiStore.closeCommandPanel()}
          class="px-2 py-0.5 text-[11px] font-bold font-heading text-wheat-dark hover:text-wheat-gold hover:bg-forest-mid border border-charcoal-mid/80 cursor-pointer transition-colors"
          aria-label="إغلاق اللوحة"
          title="إغلاق اللوحة"
        >
          إغلاق ✕
        </button>
      </div>

      {#if selectedStat && STAT_EXPLAINERS_AR[selectedStat]}
        <div class="mb-3 p-2 bg-forest-surface/80 border border-wheat-gold/50 text-[10px] leading-relaxed text-wheat-light flex items-start justify-between gap-2">
          <div>
            <span class="font-bold text-wheat-gold font-heading">{STAT_NAMES_AR[selectedStat] ?? selectedStat}:</span>
            <span class="text-wheat-light/90"> {STAT_EXPLAINERS_AR[selectedStat]}</span>
          </div>
          <button
            type="button"
            onclick={() => uiStore.closeStatRelatedOptions()}
            class="px-1.5 py-0.5 text-[9px] font-bold text-wheat-gold border border-wheat-gold/50 hover:bg-forest-mid shrink-0 cursor-pointer"
          >
            إلغاء التصفية
          </button>
        </div>
      {/if}

      {#if active === 'emergency'}
        <EmergencyPanel />
      {:else if active === 'decrees'}
        <DecreesPanel />
      {:else if active === 'tax'}
        <TaxFinancePanel />
      {:else if active === 'assets'}
        <AssetsPanel />
      {:else if active === 'policies'}
        <PoliciesPanel />
      {:else if active === 'provincial'}
        <ProvincialPanel />
      {/if}
    </div>
  {/if}

  <div
    bind:this={stripEl}
    onscroll={() => active && clampPanel()}
    class="pointer-events-auto flex max-w-full items-end justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto px-2 pt-1.5 scrollbar-none"
  >
    {#if selectedStat}
      <!-- Filter-clear chip docked at the row's right end, done-button scale -->
      <button
        onclick={() => uiStore.closeStatRelatedOptions()}
        class="w-[50px] h-[50px] flex flex-col items-center justify-center gap-0.5 bg-forest-surface/95 border border-wheat-gold/80 text-wheat-gold shadow-2xl backdrop-blur-sm cursor-pointer gloss-hover transition-all active:scale-95 rounded-none shrink-0"
        title="إلغاء التصفية واستعادة تفاعل كافة الخيارات: {STAT_NAMES_AR[selectedStat] || selectedStat}"
        aria-label="إلغاء التصفية"
      >
        <GameIcon name="cross-mark" cls="w-4 h-4 shrink-0" />
        <span class="text-[7.5px] font-bold font-heading leading-tight text-center px-0.5">إلغاء التصفية</span>
      </button>
    {/if}
    {#each orderedButtons as btn}
      {@const isActive = btn.id === 'stats' ? statsOpen : active === btn.id}
      {@const isAssets = btn.id === 'assets'}
      {@const isLocked = isAssets && assetsLocked}
      {@const isDone = isAssets && assetsDone}
      <div class="relative shrink-0">
        <button
          data-panel-btn={btn.id}
          onclick={() => clickButton(btn.id)}
          disabled={isLocked}
          class="{isDone
            ? 'w-[50px] h-[50px]'
            : 'w-[68px] h-[68px] max-sm:w-[58px] max-sm:h-[58px] [@media(max-height:500px)]:w-[54px] [@media(max-height:500px)]:h-[54px]'} flex flex-col items-center justify-center gap-1 bg-forest-deep/95 border shadow-2xl backdrop-blur-sm rounded-none transition-all active:scale-95 {isLocked
            ? 'border-charcoal-mid text-wheat-dark opacity-40 grayscale cursor-not-allowed'
            : isDone
              ? 'border-charcoal-mid text-wheat-dark saturate-50 opacity-70 hover:opacity-100 hover:text-wheat-gold hover:border-wheat-mid/60 cursor-pointer gloss-hover'
              : `cursor-pointer ${isActive
                ? 'border-wheat-gold text-wheat-gold -translate-y-1'
                : 'border-charcoal-mid text-wheat-mid hover:text-wheat-gold hover:border-wheat-mid/70 gloss-hover'}`}"
          title={isLocked ? 'تُفتح الأصول في الدور الثالث' : btn.labelAr}
          aria-label={btn.labelAr}
          aria-pressed={isActive}
          aria-disabled={isLocked}
        >
          {#if btn.id === 'provincial'}
            <svg viewBox={provShape.vb} class="{isDone ? 'w-5 h-5' : 'w-7 h-7 max-sm:w-6 max-sm:h-6 [@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5'} shrink-0" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={provShape.d} fill="currentColor" /></svg>
          {:else}
            <GameIcon name={btn.icon} cls="{isDone ? 'w-5 h-5' : 'w-7 h-7 max-sm:w-6 max-sm:h-6 [@media(max-height:500px)]:w-5 [@media(max-height:500px)]:h-5'} shrink-0" />
          {/if}
          <span class="{isDone ? 'text-[8px]' : 'text-[9.5px] max-sm:text-[8.5px] [@media(max-height:500px)]:text-[8.5px]'} font-bold font-heading leading-tight text-center px-0.5">{btn.labelAr}</span>
          {#if selectedStat && panelHasRelated(selectedStat, btn.id)}
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-wheat-gold animate-pulse"></span>
          {/if}
        </button>
      </div>
    {/each}
  </div>
</div>
