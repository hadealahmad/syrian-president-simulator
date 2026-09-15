<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { draftStore } from '../stores/draft-store';
  import GameIcon from '../ui/GameIcon.svelte';
  import { SYRIA_2D_GOVERNORATES, SYRIA_2D_VIEWBOX } from './syria-2d-paths';
  import type { GovernorateNode } from '../engine/types';

  let hoveredGovId = $state<string | null>(null);

  // Syrian Visual Identity (SyID) color palette constants from syrian.zone/syid
  const SYID_COLORS = {
    forest: '#428177',       // Forest primary (Calm / Sovereign baseline)
    forestLight: '#52998e',  // Forest hover
    forestDark: '#054239',   // Forest active / deep
    wheat: '#988561',        // Golden Wheat deep (Tense status)
    wheatLight: '#b9a779',   // Golden Wheat mid
    wheatCream: '#edebe0',   // Golden Wheat highlight
    umber: '#6b1f2a',        // Deep Umber (Riot / Unrest)
    umberDark: '#4a151e',    // Deep Umber dark (Armed Revolt)
    charcoal: '#161616',     // Charcoal background
    charcoalBorder: '#0D1117', // Sovereign borders
    hoverStroke: '#E6EDF3',  // SyID hover boundary highlight
    selectedStroke: '#b9a779', // SyID selected boundary highlight
  };

  const TIER_NAMES_AR: Record<string, string> = {
    CALM: 'مستقرة',
    TENSE: 'متوترة',
    RIOT: 'اضطرابات',
    REVOLT: 'تمرد مسلح',
  };

  // Composite attention index: mean of four normalized strains (mines, blackout,
  // unrebuilt share, unrest). 0 = needs nothing, 1 = needs everything. Drives the
  // fill heat so the eye goes where decisions are needed.
  function attentionIndex(gov: GovernorateNode | undefined): number {
    if (!gov) return 0.3;
    return (
      gov.mineSaturationPct / 100 +
      gov.dailyBlackoutHours / 24 +
      (1 - gov.reconstructionScore) +
      gov.prri / 100
    ) / 4;
  }

  // Dark red (worst) -> gold (mid) -> green (best) health ramp. Deep, muted tones
  // so the bright status glyphs always read on top of the fill.
  const RAMP_WORST: [number, number, number] = [74, 21, 30]; // umber dark red
  const RAMP_MID: [number, number, number] = [152, 133, 97]; // golden wheat
  const RAMP_BEST: [number, number, number] = [46, 107, 95]; // deep forest green

  function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  }

  function healthFill(h: number): string {
    const t = Math.min(1, Math.max(0, h));
    const c = t < 0.5 ? lerp3(RAMP_WORST, RAMP_MID, t * 2) : lerp3(RAMP_MID, RAMP_BEST, (t - 0.5) * 2);
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function getGovFillColor(gov: GovernorateNode | undefined, isHovered: boolean, isSelected: boolean): string {
    // Health is the inverse of the attention index, spread-calibrated to turn-1 values.
    const health = 1 - Math.min(1, Math.max(0, (attentionIndex(gov) - 0.25) / 0.5));
    if (isSelected) return healthFill(Math.min(1, health + 0.3));
    if (isHovered) return healthFill(Math.min(1, health + 0.12));
    return healthFill(health);
  }

  function handleGovClick(govId: string): void {
    uiStore.selectGovernorate(govId);
  }

  function handleGovMouseEnter(govId: string): void {
    hoveredGovId = govId;
  }

  function handleGovMouseLeave(): void {
    hoveredGovId = null;
  }
</script>

<div
  class="relative w-full h-full overflow-hidden select-none bg-[#0e1715] flex items-center justify-center"
  role="region"
  aria-label="الخارطة الاستراتيجية للجمهورية العربية السورية"
>
  <!-- Faint Tactical Coordinate Grid Background -->
  <div class="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#edebe0_1px,transparent_1px)] [background-size:24px_24px]"></div>

  <!-- 2D Sovereign Vector Map (SVG) -->
  <svg
    viewBox={SYRIA_2D_VIEWBOX}
    preserveAspectRatio="xMidYMid meet"
    class="w-full h-full max-h-full max-w-full p-4 drop-shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
  >
    <defs>
      <!-- SyID Glow Filters for Hover & Selection -->
      <filter id="syid-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#edebe0" flood-opacity="0.6" />
      </filter>
      <filter id="syid-selected-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#b9a779" flood-opacity="0.8" />
      </filter>
    </defs>

    <!-- Base Shadow Silhouette -->
    <g class="opacity-30 pointer-events-none transform translate-y-1.5 translate-x-0.5">
      {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
        <path d={gov.path} fill="#050a09" />
      {/each}
    </g>

    <!-- Governorates Polygons (Clean 2D, strictly without labels) -->
    <g class="cursor-pointer">
      {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
        {@const govState = $gameStore.governorates[gov.id]}
        {@const tier = govState?.tier ?? 'CALM'}
        {@const isHovered = hoveredGovId === gov.id}
        {@const isSelected = $uiStore.selectedGovernorateId === gov.id}
        {@const fill = getGovFillColor(govState, isHovered, isSelected)}
        {@const stroke = isSelected ? SYID_COLORS.selectedStroke : isHovered ? SYID_COLORS.hoverStroke : SYID_COLORS.charcoalBorder}
        {@const strokeWidth = isSelected ? 3.5 : isHovered ? 2.8 : 1.6}

        <path
          d={gov.path}
          {fill}
          fill-opacity={isSelected ? 0.98 : isHovered ? 0.92 : 0.78}
          {stroke}
          stroke-width={strokeWidth}
          stroke-linejoin="round"
          stroke-linecap="round"
          filter={isSelected ? 'url(#syid-selected-glow)' : isHovered ? 'url(#syid-glow)' : undefined}
          class="transition-all duration-150 ease-out focus:outline-none [-webkit-tap-highlight-color:transparent]"
          onclick={() => handleGovClick(gov.id)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleGovClick(gov.id)}
          onmouseenter={() => handleGovMouseEnter(gov.id)}
          onpointerenter={() => handleGovMouseEnter(gov.id)}
          onmouseleave={handleGovMouseLeave}
          onpointerleave={handleGovMouseLeave}
          role="button"
          tabindex="0"
          aria-label={govState?.nameAr ?? gov.nameAr}
        />
      {/each}
    </g>

    <!-- On-Map Status Cluster: fixed 2x2 slots (mines / power / rebuilding / acceptance) -->
    <g class="pointer-events-none">
      {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
        {@const govState = $gameStore.governorates[gov.id]}
        {#if govState}
          {@const [cx, cy] = gov.center}
          {@const mined = govState.mineSaturationPct > 12}
          {@const powerColor = govState.dailyBlackoutHours <= 12 ? '#3fb950' : govState.dailyBlackoutHours <= 16 ? '#f5d547' : '#ce1126'}
          {@const rebuildName = govState.reconstructionScore >= 0.85 ? 'stone-wall' : govState.reconstructionScore >= 0.55 ? 'brick-wall' : 'broken-wall'}
          {@const rebuildColor = govState.reconstructionScore >= 0.85 ? '#3fb950' : govState.reconstructionScore >= 0.55 ? '#b9a779' : '#ce1126'}
          {@const faceName = govState.tier === 'CALM' ? 'emotion-happy-fill' : govState.tier === 'TENSE' ? 'emotion-normal-fill' : 'emotion-sad-fill'}
          {@const faceColor = govState.tier === 'CALM' ? '#3fb950' : govState.tier === 'TENSE' ? '#f5d547' : '#ce1126'}
          {#if mined}
            <GameIcon name="minefield" color="#ce1126" outline="#0D1117" x={cx - 26} y={cy - 26} size={24} />
          {/if}
          <GameIcon name="power-generator" color={powerColor} outline="#0D1117" x={cx + 2} y={cy - 26} size={24} />
          <GameIcon name={rebuildName} color={rebuildColor} outline="#0D1117" x={cx - 26} y={cy + 2} size={24} />
          <GameIcon name={faceName} color={faceColor} outline="#0D1117" x={cx + 2} y={cy + 2} size={24} />
        {/if}
      {/each}
    </g>
  </svg>

  <!-- Floating HUD Panel for Hovered Governorate (bottom right in place of the old guide) -->
  {#if hoveredGovId && $gameStore.governorates[hoveredGovId]}
    {@const gov = $gameStore.governorates[hoveredGovId]}
    {@const isProjectActive = Boolean(gov.strategicProject && $draftStore.provincialProjects.includes(gov.strategicProject.id))}
    {@const isDeminingActive = $draftStore.deminingPriorityId === hoveredGovId}
    {@const isPowerBoostActive = $draftStore.powerBoostGovId === hoveredGovId}
    {@const activeDirectives = (isProjectActive ? 1 : 0) + (isDeminingActive ? 1 : 0) + (isPowerBoostActive ? 1 : 0)}
    {@const powerHours = Math.max(0, 24 - gov.dailyBlackoutHours)}
    <div
      class="absolute bottom-[82px] right-6 pointer-events-none z-10 bg-[#0e1715]/95 border-2 border-wheat-mid/80 p-4 shadow-2xl rounded-none w-72 text-wheat-light font-arabic backdrop-blur-sm transition-all duration-150"
    >
      <div class="flex items-center justify-between border-b border-charcoal-mid pb-2 mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 {gov.tier === 'CALM' ? 'bg-[#428177]' : gov.tier === 'TENSE' ? 'bg-[#b9a779]' : 'bg-[#6b1f2a]'} rounded-none"></span>
          <h3 class="font-heading font-bold text-sm text-wheat-light">{gov.nameAr}</h3>
        </div>
        <span class="text-[10px] px-2 py-0.5 font-bold font-mono border rounded-none {gov.tier === 'CALM' ? 'bg-forest-mid border-forest-accent text-forest-light' : gov.tier === 'TENSE' ? 'bg-wheat-mid/20 border-wheat-mid text-wheat-gold' : 'bg-umber-deep border-umber-border text-umber-crimson'}">
          {TIER_NAMES_AR[gov.tier] ?? gov.tier}
        </span>
      </div>

      <div class="space-y-2 text-xs font-mono">
        <div class="flex justify-between items-center text-wheat-mid">
          <span class="font-arabic text-wheat-dark">نسبة الإعمار:</span>
          <span class="text-wheat-gold font-bold">{(gov.reconstructionScore * 100).toFixed(0)}%</span>
        </div>
        <div class="w-full bg-charcoal-deep h-1.5 border border-charcoal-mid overflow-hidden rounded-none">
          <div class="bg-[#428177] h-full transition-all" style="width: {gov.reconstructionScore * 100}%"></div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 border-t border-charcoal-mid/60 text-[11px]">
          <div>
            <span class="text-wheat-dark font-arabic block text-[10px]">التغذية الكهربائية:</span>
            <span class="text-wheat-light font-bold">{powerHours} س/يوم</span>
          </div>
          <div>
            <span class="text-wheat-dark font-arabic block text-[10px]">مساحة الألغام:</span>
            <span class="{gov.mineSaturationPct > 10 ? 'text-[#ce1126]' : 'text-wheat-light'} font-bold">
              {gov.mineSaturationPct}% من المساحة
            </span>
          </div>
        </div>

        {#if activeDirectives > 0}
          <div class="pt-2 border-t border-charcoal-mid flex items-center justify-between text-[11px] text-wheat-gold font-bold">
            <span class="font-arabic">التوجيهات المجدولة بالدور:</span>
            <span>{activeDirectives}</span>
          </div>
        {/if}
      </div>

      <div class="mt-2.5 pt-2 border-t border-charcoal-mid/80 text-[10px] text-wheat-dark text-center font-arabic">
        انقر لفتح ملف المحافظة وتكليف المشاريع
      </div>
    </div>
  {/if}
</div>
