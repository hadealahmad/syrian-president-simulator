<script lang="ts">
  import { tick } from 'svelte';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import { STAT_NAMES_AR, panelHasRelated } from './panels/shared';
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
  // Physical nudge (px) keeping a button-centered panel inside the hub on
  // narrow screens. Absolute positioning + physical margin are
  // direction-agnostic, so this is RTL-safe (unlike flex `margin-left`,
  // which the RTL cross-axis start silently ignores).
  let edgeShift = $state(0);

  const EDGE = 8;

  let clampToken = 0;
  async function clampPanel(): Promise<void> {
    const t = ++clampToken;
    edgeShift = 0;
    await tick();
    if (t !== clampToken || !hubEl || !active) return;
    const panel = hubEl.querySelector<HTMLElement>('[data-cmd-panel]');
    if (!panel) return;
    const pr = panel.getBoundingClientRect();
    const hr = hubEl.getBoundingClientRect();
    let shift = 0;
    if (pr.left < hr.left + EDGE) shift = hr.left + EDGE - pr.left;
    else if (pr.right > hr.right - EDGE) shift = hr.right - EDGE - pr.right;
    if (t !== clampToken) return;
    edgeShift = Math.round(shift);
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
      uiStore.openCommandPanel(id, true);
    }
  }

  $effect(() => {
    // Re-clamp on open/switch/resize only. Sidebar pushes need NO js: the
    // panel is anchored to its button in CSS, so it rides the hub's own
    // 300ms push transition in perfect sync instead of chasing it.
    if (active) clampPanel();
  });
</script>

<!-- Bottom-center command hub: click a sigil to open, click again or another sigil to close/switch.
     Outer spans the viewport (or the space left of an open stats sidebar) with
     items-center so the button row stays centered in the available space,
     independent of RTL direction. Glides with the same push transition. -->
<svelte:window onresize={() => active && clampPanel()} />
<div
  bind:this={hubEl}
  class="pointer-events-none fixed bottom-5 left-0 z-40 flex flex-col items-center gap-2 select-none font-arabic transition-all duration-300 ease-in-out {statsOpen ? 'max-sm:right-0 right-[390px]' : 'right-0'}"
  role="group"
  aria-label="لوحة القيادة الرئاسية"
>
  <div class="pointer-events-auto flex w-full items-end justify-center gap-2">
    {#if selectedStat}
      <!-- Filter-clear chip docked at the row's right end, done-button scale -->
      <button
        onclick={() => uiStore.closeStatRelatedOptions()}
        class="w-[52px] h-[52px] flex flex-col items-center justify-center gap-0.5 bg-forest-surface/95 border border-wheat-gold/80 text-wheat-gold shadow-2xl backdrop-blur-sm cursor-pointer transition-all active:scale-95 rounded-none shrink-0"
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
      <div class="relative">
        <button
          data-panel-btn={btn.id}
          onclick={() => clickButton(btn.id)}
          disabled={isLocked}
          class="{isDone ? 'w-[52px] h-[52px]' : 'w-[68px] h-[68px]'} flex flex-col items-center justify-center gap-1 bg-forest-deep/95 border shadow-2xl backdrop-blur-sm rounded-none transition-all active:scale-95 {isLocked
            ? 'border-charcoal-mid text-wheat-dark opacity-40 grayscale cursor-not-allowed'
            : isDone
              ? 'border-charcoal-mid text-wheat-dark saturate-50 opacity-70 hover:opacity-100 hover:text-wheat-gold hover:border-wheat-mid/60 cursor-pointer'
              : `cursor-pointer ${isActive
                ? 'border-wheat-gold text-wheat-gold -translate-y-1'
                : 'border-charcoal-mid text-wheat-mid hover:text-wheat-gold hover:border-wheat-mid/70'}`}"
          title={isLocked ? 'تُفتح الأصول في الدور الثالث' : btn.labelAr}
          aria-label={btn.labelAr}
          aria-pressed={isActive}
          aria-disabled={isLocked}
        >
          <GameIcon name={btn.icon} cls="{isDone ? 'w-5 h-5' : 'w-7 h-7'} shrink-0" />
          <span class="{isDone ? 'text-[8px]' : 'text-[9.5px]'} font-bold font-heading leading-tight text-center px-0.5">{btn.labelAr}</span>
          {#if selectedStat && panelHasRelated(selectedStat, btn.id)}
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-wheat-gold animate-pulse"></span>
          {/if}
        </button>
        {#if active === btn.id}
          <!-- Anchored to its button (centered via physical left-1/2), so it
               travels with the hub's push transition at identical speed —
               no JS chasing, no stagger. -->
          <div
            data-cmd-panel
            class="pointer-events-auto absolute bottom-[calc(100%+8px)] left-1/2 overflow-y-auto bg-forest-deep border-2 border-wheat-mid/70 shadow-[0_10px_50px_rgba(0,0,0,0.85)] rounded-none p-4 text-wheat-light {btn.id === 'assets' && assetsDone ? 'mb-4' : ''}"
            style="width: min(400px, 94vw); max-height: calc(100vh - 240px); margin-left: calc(min(400px, 94vw) / -2{edgeShift ? ` + ${edgeShift}px` : ''});"
          >
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
      </div>
    {/each}
  </div>
</div>
