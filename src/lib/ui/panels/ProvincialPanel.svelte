<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import ToggleSwitch from '../ToggleSwitch.svelte';
  import { BASELINE_GOVERNORATES } from '../../engine/constants';
  import { SYRIA_2D_GOVERNORATES, governorateShape } from '../../spatial3d/syria-2d-paths';
  import { isProvincialActionRelated as isProvincialActionRelatedShared, SUSPENDED_CARD_CLASS, SUSPENDED_CONTENT_CLASS, SUSPENDED_ICON } from './shared';
  import { governorateDamagePct, tierDisplay } from '../map/map-modes';

  // Before/after stat rows for the strategic-project table (mirrors engine clamps).
  let projectEffectRows = $derived.by(() => {
    const p = node?.strategicProject;
    if (!node || !p) return [];
    const rows: { label: string; before: string; after: string; delta: string; good: boolean }[] = [];
    const f1 = (v: number) => String(Math.round(v * 10) / 10);
    const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);
    rows.push({
      label: 'الاحتقان', before: `${Math.round(node.prri)}`,
      after: `${Math.max(0, Math.round(node.prri + p.prriDelta))}`,
      delta: signed(p.prriDelta), good: p.prriDelta <= 0,
    });
    rows.push({
      label: 'التقنين سا/يوم', before: f1(node.dailyBlackoutHours),
      after: f1(Math.max(2, node.dailyBlackoutHours + p.blackoutHoursDelta)),
      delta: signed(p.blackoutHoursDelta), good: p.blackoutHoursDelta <= 0,
    });
    if (p.mineClearancePct > 0) {
      rows.push({
        label: 'الألغام %', before: f1(node.mineSaturationPct),
        after: f1(Math.max(0, node.mineSaturationPct - p.mineClearancePct)),
        delta: `-${p.mineClearancePct}`, good: true,
      });
    }
    if (p.damageRepairedUSD > 0) {
      rows.push({
        label: 'الضرر $B', before: (node.unrepairedDamageUSD / 1e9).toFixed(2),
        after: (Math.max(0, node.unrepairedDamageUSD - p.damageRepairedUSD) / 1e9).toFixed(2),
        delta: `-${(p.damageRepairedUSD / 1e9).toFixed(2)}`, good: true,
      });
    }
    if ((p.recurringRevenueSYPPerTurn ?? 0) > 0) {
      rows.push({
        label: 'إيراد متكرر/دور', before: '—',
        after: `+${((p.recurringRevenueSYPPerTurn ?? 0) / 1e9).toFixed(2)}B`, delta: '', good: true,
      });
    }
    if ((p.wheatImportSavingsUSD ?? 0) > 0) {
      rows.push({
        label: 'فاتورة القمح', before: '—',
        after: `-$${(p.wheatImportSavingsUSD ?? 0) / 1e6}M دائمة`, delta: '', good: true,
      });
    }
    if (p.sectarianAnxietyDelta) {
      rows.push({
        label: 'القلق الطائفي', before: `${Math.round(node.sectarianAnxiety)}`,
        after: `${Math.max(0, Math.round(node.sectarianAnxiety + (p.sectarianAnxietyDelta ?? 0)))}`,
        delta: signed(p.sectarianAnxietyDelta ?? 0), good: (p.sectarianAnxietyDelta ?? 0) <= 0,
      });
    }
    if (p.tribalRageDelta && node.tribalRageIndex !== undefined) {
      rows.push({
        label: 'الغضب العشائري', before: `${Math.round(node.tribalRageIndex)}`,
        after: `${Math.max(0, Math.round(node.tribalRageIndex + (p.tribalRageDelta ?? 0)))}`,
        delta: signed(p.tribalRageDelta ?? 0), good: (p.tribalRageDelta ?? 0) <= 0,
      });
    }
    if (p.golanTensionDelta && node.golanTensionIndex !== undefined) {
      rows.push({
        label: 'توتر الجولان', before: `${Math.round(node.golanTensionIndex)}`,
        after: `${Math.max(0, Math.min(100, node.golanTensionIndex + (p.golanTensionDelta ?? 0)))}`,
        delta: signed(p.golanTensionDelta ?? 0), good: (p.golanTensionDelta ?? 0) <= 0,
      });
    }
    if (p.suwaydaIntegrationBonus && node.suwaydaIntegrationIndex !== undefined) {
      rows.push({
        label: 'اندماج السويداء', before: `${Math.round(node.suwaydaIntegrationIndex)}`,
        after: `${Math.min(100, Math.round(node.suwaydaIntegrationIndex + (p.suwaydaIntegrationBonus ?? 0)))}`,
        delta: `+${p.suwaydaIntegrationBonus ?? 0}`, good: true,
      });
    }
    if (p.skilledLaborBonus) {
      rows.push({
        label: 'الكفاءات', before: node.skilledLaborCount.toLocaleString('en-US'),
        after: (node.skilledLaborCount + (p.skilledLaborBonus ?? 0)).toLocaleString('en-US'),
        delta: `+${(p.skilledLaborBonus ?? 0).toLocaleString('en-US')}`, good: true,
      });
    }
    return rows;
  });

  const GOV_IDS: string[] = SYRIA_2D_GOVERNORATES.map((g) => g.id);

  function stepGovernorate(delta: number): void {
    const idx = Math.max(0, GOV_IDS.indexOf(selectedId));
    const nextIdx = (idx + delta + GOV_IDS.length) % GOV_IDS.length;
    uiStore.selectGovernorate(GOV_IDS[nextIdx]);
  }

  // Default to the capital when nothing is selected so the panel always
  // shows a governorate dossier instead of an empty placeholder.
  let selectedId = $derived($uiStore.selectedGovernorateId ?? 'damascus');
  // Heading shows the selected governorate's map shape (Damascus fallback),
  // like the stats sidebar cards — not the generic castle glyph.
  let provShape = $derived(governorateShape(selectedId));
  let node = $derived(selectedId ? $gameStore.governorates[selectedId] : null);
  // Governorates that never needed demining (baseline contamination at or
  // below the deployable threshold) get no demining card at all.
  let neededDeminingFromStart = $derived(
    Number((selectedId && BASELINE_GOVERNORATES[selectedId]?.mineSaturationPct) ?? 0) > 8
  );

  let isSelectedForDemining = $derived($draftStore.deminingPriorityId === selectedId);
  let canDeployDemining = $derived(node ? node.mineSaturationPct > 8 : false);
  let canAffordDemining = $derived(
    $budgetStore.canAffordWithFxCoverage(20_000_000, 8_000_000_000)
  );
  let isDeminingCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(20_000_000, 8_000_000_000)
  );

  let isSelectedForPowerBoost = $derived($draftStore.powerBoostGovId === selectedId);
  let canDeployPowerBoost = $derived(node ? node.dailyBlackoutHours > 2 : false);
  let canAffordPowerBoost = $derived(
    $budgetStore.canAffordWithFxCoverage(10_000_000, 3_000_000_000)
  );
  let isPowerBoostCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(10_000_000, 3_000_000_000)
  );

  // Barrier-blocker states (mirrors the decrees/emergency/assets treatment)
  let demBlocked = $derived(canDeployDemining && !isSelectedForDemining && !canAffordDemining);
  let powerBlocked = $derived(canDeployPowerBoost && !isSelectedForPowerBoost && !canAffordPowerBoost);

  // Positive-metric projections (cleared land / power hours), previewing the
  // post-turn value live while the toggle is on (mirrors engine clamps)
  let projMine = $derived(
    node ? (isSelectedForDemining ? Math.max(0, node.mineSaturationPct - 8) : node.mineSaturationPct) : 0
  );
  let clearedPct = $derived(Math.round(100 - projMine));
  let demCurrent = $derived(node ? Math.round(100 - node.mineSaturationPct) : 0);
  let projBlackout = $derived(
    node ? (isSelectedForPowerBoost ? Math.max(2, node.dailyBlackoutHours - 4) : node.dailyBlackoutHours) : 0
  );
  let powerHrs = $derived(Number((24 - projBlackout).toFixed(1)));
  let powerCurrent = $derived(node ? Number((24 - node.dailyBlackoutHours).toFixed(1)) : 0);

  // Dossier headline data (Concept D province hero).
  let tier = $derived(tierDisplay(node?.tier));
  let damagePct = $derived(node ? governorateDamagePct(node) : 0);
  let govRank = $derived.by(() => {
    const list = Object.values($gameStore.governorates).sort((a, b) => b.prri - a.prri);
    const idx = list.findIndex((g) => g.id === selectedId);
    return idx < 0 ? 14 : idx + 1;
  });
  let gapFromAverage = $derived(
    node ? Math.round(node.prri - $gameStore.macro.nationalRRI) : 0
  );
  let provinceIndex = $derived(Math.max(0, GOV_IDS.indexOf(selectedId)));
  let populationMillions = $derived(node ? (node.population / 1_000_000).toFixed(2) : '0.00');

  let isProjectCommitted = $derived(
    Boolean(node?.strategicProject && $draftStore.provincialProjects.includes(node.strategicProject.id))
  );
  let isProjectAffordablePC = $derived(
    Boolean(node?.strategicProject && node.strategicProject.costPoliticalCapital <= $budgetStore.remainingPC)
  );
  // Ring-fenced grant dollars still unspent by the rest of the draft pay the
  // project's USD leg before reserves do (engine PHASE 4 rule).
  let projectGrantUSD = $derived($budgetStore.grantAvailableUSD);
  let projectNetUSD = $derived(
    node?.strategicProject ? Math.max(0, node.strategicProject.costUSD - projectGrantUSD) : 0
  );
  let isProjectAffordableUSD = $derived(
    Boolean(node?.strategicProject && projectNetUSD <= $budgetStore.remainingUSD)
  );
  let isProjectAffordable = $derived(
    Boolean(
      node?.strategicProject &&
        $budgetStore.canAffordWithFxCoverage(projectNetUSD, node.strategicProject.costSYP)
    )
  );
  let isProjectCoveredByFX = $derived(
    Boolean(
      node?.strategicProject &&
        $budgetStore.isCoveredByFX(projectNetUSD, node.strategicProject.costSYP)
    )
  );

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  function isProvincialActionRelated(actionKey: 'project' | 'demining' | 'power'): boolean {
    return isProvincialActionRelatedShared(selectedStat, actionKey);
  }

  let canAffordProject = $derived(
    isProjectAffordablePC && isProjectAffordable
  );

  // The engine approves project funding as one commitment (executed at turn
  // end), so the funding bar is 0% until committed and 100% afterwards.
  let projectFundingPct = $derived(
    node?.strategicProject.isExecuted || isProjectCommitted ? 100 : 0
  );

  // Next-turn projections for the theater meters (mirror the engine clamps
  // exactly, including the accord-upkeep fallback, so the striped overlay
  // always matches what the draft will do).
  function deltaChip(proj: number, cur: number): string {
    const d = Math.round(proj - cur);
    if (d === 0) return '';
    return `(${d > 0 ? '+' : ''}${d})`;
  }
  let southProj = $derived.by(() => {
    const sii = node?.suwaydaIntegrationIndex ?? 8;
    const ssp = node?.suwaydaSecessionProb ?? 24;
    let policy = $draftStore.southernPolicy;
    // remainingPC already includes the accord's own 4-PC upkeep, so the
    // engine falls back only when the treasury cannot cover that cost
    // (remainingPC < 0). Comparing against 4 broke the exact-4-PC case.
    if (policy === 'HISTORIC_ACCORD' && $budgetStore.remainingPC < 0) policy = 'LOCAL_VOUCHERS';
    switch (policy) {
      case 'HISTORIC_ACCORD': return { sii: Math.min(100, sii + 18), ssp: Math.max(0, ssp - 15) };
      case 'UNCONDITIONAL_AID': return { sii: Math.min(55, sii + 3), ssp: Math.max(0, ssp - 10) };
      case 'BLOCKADE': return { sii: Math.max(8, Math.floor(sii / 2)), ssp: Math.min(100, ssp + 30) };
      default: return { sii: Math.min(65, sii + 4), ssp: Math.max(0, ssp - 5) };
    }
  });
  let golanProj = $derived.by(() => {
    let gti = node?.golanTensionIndex ?? 45;
    let ddi = node?.daraaDefianceIndex ?? 54;
    let nrc = node?.nassibRevenueCapturePct ?? 32;
    switch ($draftStore.golanBorderStance) {
      case 'RESTRAINT': gti = Math.max(15, gti - 15); ddi = Math.min(100, ddi + 18); break;
      case 'DEPLOY_ARMOR': gti = Math.min(100, gti + 25); ddi = Math.max(10, ddi - 20); break;
      case 'LOCAL_GENDARMERIE': gti = Math.min(100, gti + 5); ddi = Math.max(10, ddi - 8); nrc = Math.min(80, nrc + 5); break;
      case 'UN_LIAISON': gti = Math.max(10, gti - 10); break;
    }
    let south = $draftStore.southernPolicy;
    if (south === 'HISTORIC_ACCORD' && $budgetStore.remainingPC < 0) south = 'LOCAL_VOUCHERS';
    if (south === 'HISTORIC_ACCORD') gti = Math.max(15, gti - 5);
    else if (south === 'BLOCKADE') gti = Math.min(100, gti + 10);
    return { gti, ddi, nrc };
  });
</script>

<div class="pd-root space-y-2.5 pb-2">
  <!-- Province switcher rail (the Sheet already supplies the section title) -->
  <div class="flex items-center gap-1.5">
    <svg
      viewBox={provShape.vb}
      class="h-5 w-5 shrink-0 text-wheat-gold"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    ><path d={provShape.d} fill="currentColor" /></svg>
    <select
      aria-label="اختيار المحافظة"
      value={selectedId}
      onchange={(e) => uiStore.selectGovernorate(e.currentTarget.value)}
      class="h-11 min-w-0 flex-1 cursor-pointer border border-wheat-mid/20 bg-charcoal-deep/50 px-2 text-[11px] font-bold text-wheat-gold font-heading focus:border-wheat-gold focus:outline-none shell-round-item"
    >
      {#each GOV_IDS as gid}
        {@const gNode = $gameStore.governorates[gid]}
        {#if gNode}
          <option value={gid} class="bg-forest-deep text-wheat-light">{gNode.nameAr}</option>
        {/if}
      {/each}
    </select>
    <span class="shrink-0 px-0.5 font-mono text-[10px] text-wheat-dark">
      {provinceIndex + 1}<span class="text-wheat-dark/60">/{GOV_IDS.length}</span>
    </span>
  </div>

  {#if node}
    <!-- Dossier hero: tier, big unrest ring, national rank & gap -->
    <div class="flex items-center gap-3 border border-wheat-mid/20 bg-linear-to-br from-wheat-gold/8 to-forest-accent/5 p-2.5 shell-round-pop">
      <div
        class="pd-gauge shrink-0"
        style="--p:{Math.min(100, Math.max(0, Math.round(node.prri)))};--tone:{tier.tone};"
        aria-hidden="true"
      >
        <div class="pd-gauge-tx">
          <b class="font-heading">{Math.round(node.prri)}</b>
          <span>احتقان /100</span>
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <span
            class="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] font-bold shell-round-chip"
            style="color:{tier.tone};border-color:{tier.tone};background:color-mix(in srgb, {tier.tone} 12%, transparent);"
          >
            <i class="h-1 w-1 bg-current shell-round-chip" aria-hidden="true"></i>
            {tier.labelAr}
          </span>
          <span class="text-[9px] text-wheat-dark">
            الترتيب الوطني <b class="font-heading text-forest-accent">#{govRank}</b> من 14
          </span>
        </div>
        <h3 class="mt-1 truncate font-heading text-[16px] font-semibold leading-tight text-wheat-light">
          {node.nameAr}
        </h3>
        <p class="mt-0.5 text-[9.5px] leading-snug text-wheat-dark">
          فجوة عن المتوسط
          <b dir="ltr" class="font-mono {gapFromAverage > 0 ? 'text-umber-crimson' : 'text-forest-accent'}">
            {gapFromAverage > 0 ? '+' : ''}{gapFromAverage}
          </b>
          نقطة · {populationMillions}M نسمة
        </p>
        <p class="text-[9px] text-wheat-dark/80">
          {Math.round(node.activeHospitalsPct)}% مشافٍ عاملة
        </p>
      </div>
    </div>

    <!-- 2×2 metric tiles -->
    <div class="grid grid-cols-2 gap-1.5">
      <div class="border border-wheat-mid/10 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
        <div class="flex items-center gap-1 text-[8.5px] text-wheat-dark">
          <GameIcon name="power-generator" cls="h-3 w-3 shrink-0" />
          الكهرباء
        </div>
        <div class="mt-0.5 flex items-baseline gap-0.5 font-heading text-[16px] leading-none text-wheat-light">
          <span dir="ltr">{powerHrs}</span>
          <small class="font-sans text-[8.5px] font-normal text-wheat-dark">س / 24</small>
        </div>
        <div class="pd-bar relative mt-1.5">
          <i class="pd-fill" style="width:{Math.min(100, (powerCurrent / 24) * 100)}%;background:var(--color-wheat-gold);"></i>
          {#if isSelectedForPowerBoost && powerHrs > powerCurrent}
            <i
              class="absolute inset-y-0 text-wheat-gold"
              style="inset-inline-start:{Math.min(100, (powerCurrent / 24) * 100)}%;width:{Math.max(0, ((powerHrs - powerCurrent) / 24) * 100)}%;background:repeating-linear-gradient(-45deg, currentColor 0 2px, transparent 2px 4px);"
              title="تحسن متوقع +{Number((powerHrs - powerCurrent).toFixed(1))} س/يوم"
            ></i>
          {/if}
        </div>
      </div>

      <div class="border border-wheat-mid/10 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
        <div class="flex items-center gap-1 text-[8.5px] text-wheat-dark">
          <GameIcon name="damaged-house" cls="h-3 w-3 shrink-0" />
          الأضرار
        </div>
        <div class="mt-0.5 flex items-baseline gap-0.5 font-heading text-[16px] leading-none text-wheat-light">
          <span dir="ltr">{damagePct}</span>
          <small class="font-sans text-[8.5px] font-normal text-wheat-dark">% غير مُصلحة</small>
        </div>
        <div class="pd-bar mt-1.5">
          <i class="pd-fill" style="width:{damagePct}%;background:var(--color-umber-crimson);"></i>
        </div>
      </div>

      <div class="border border-wheat-mid/10 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
        <div class="flex items-center gap-1 text-[8.5px] text-wheat-dark">
          <GameIcon name="minefield" cls="h-3 w-3 shrink-0" />
          الألغام
        </div>
        <div class="mt-0.5 flex items-baseline gap-0.5 font-heading text-[16px] leading-none text-wheat-light">
          <span dir="ltr">{Math.round(projMine)}</span>
          <small class="font-sans text-[8.5px] font-normal text-wheat-dark">% تلوث</small>
          {#if isSelectedForDemining}
            <small class="font-sans text-[8px] font-bold text-wheat-gold">-8 متوقع</small>
          {/if}
        </div>
        <div class="pd-bar mt-1.5">
          <i class="pd-fill" style="width:{Math.min(100, projMine)}%;background:var(--color-umber-glow);"></i>
        </div>
      </div>

      <div class="border border-wheat-mid/10 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
        <div class="flex items-center gap-1 text-[8.5px] text-wheat-dark">
          <GameIcon name="brick-wall" cls="h-3 w-3 shrink-0" />
          إعادة الإعمار
        </div>
        <div class="mt-0.5 flex items-baseline gap-0.5 font-heading text-[16px] leading-none text-wheat-light">
          <span dir="ltr">{Math.round(node.reconstructionScore * 100)}</span>
          <small class="font-sans text-[8.5px] font-normal text-wheat-dark">%</small>
        </div>
        <div class="pd-bar mt-1.5">
          <i class="pd-fill" style="width:{Math.min(100, Math.round(node.reconstructionScore * 100))}%;background:var(--color-forest-accent);"></i>
        </div>
      </div>
    </div>

    <div class="pd-sect">مشروع قابل للتمويل</div>

    {#if node.strategicProject.isExecuted}
      <!-- Done: title + solution + checkmark only -->
      <div class="flex items-start gap-2 border border-forest-accent/40 bg-forest-surface/40 p-2.5 shell-round-pop">
        <GameIcon name="check-mark" cls="mt-0.5 h-4 w-4 shrink-0 text-forest-accent" />
        <div class="min-w-0">
          <h3 class="text-[11.5px] font-bold leading-tight text-wheat-light font-heading">{node.strategicProject.titleAr}</h3>
          <p class="mt-1 text-[10.5px] leading-relaxed text-wheat-dark">{node.strategicProject.solutionDescriptionAr}</p>
        </div>
      </div>
    {:else}
      {@const projBlocked = !isProjectCommitted && !canAffordProject}
      <div
        class="relative border bg-forest-deep/60 p-2.5 transition-all shell-round-pop {projBlocked ? SUSPENDED_CARD_CLASS : 'border-wheat-gold/25'} {selectedStat ? (isProvincialActionRelated('project') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}"
      >
        <div class="space-y-2 {projBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
          <div class="flex items-start gap-2">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center bg-wheat-gold/12 text-wheat-gold shell-round-item">
              <GameIcon name="coins" cls="h-4 w-4 shrink-0" />
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-[12px] font-bold leading-tight text-wheat-light font-heading">
                {node.strategicProject.titleAr}
              </h3>
              <p class="mt-1 text-[10px] leading-relaxed text-wheat-dark">
                {node.strategicProject.issueDescriptionAr}
              </p>
              <p class="mt-1 text-[10px] leading-relaxed text-wheat-light/90">
                {node.strategicProject.solutionDescriptionAr}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <span class="border border-umber-border bg-umber-deep px-1.5 py-0.5 font-mono text-[9px] font-bold text-umber-crimson shell-round-chip">
              -${node.strategicProject.costUSD / 1_000_000}M
            </span>
            <span class="border border-umber-border bg-umber-deep px-1.5 py-0.5 font-mono text-[9px] font-bold text-umber-crimson shell-round-chip">
              -{(node.strategicProject.costSYP / 1_000_000_000).toFixed(2)}B SP
            </span>
            {#if isProjectCoveredByFX && !isProjectCommitted}
              <span class="border border-forest-accent bg-forest-surface px-1.5 py-0.5 text-[8.5px] font-bold text-forest-accent shell-round-chip">
                مغطى بالنقد الأجنبي
              </span>
            {/if}
            {#if node.strategicProject.costPoliticalCapital > 0}
              <span class="border border-charcoal-mid bg-forest-surface px-1.5 py-0.5 font-mono text-[9px] font-bold text-wheat-gold shell-round-chip">
                -{node.strategicProject.costPoliticalCapital} رصيد سياسي
              </span>
            {/if}
          </div>

          <!-- Before/after stat table -->
          <div class="overflow-hidden border border-wheat-mid/10 shell-round-item">
            <div class="grid grid-cols-[1fr_auto_auto] gap-1 bg-charcoal-deep/60 px-2 py-1 text-[8.5px] font-bold text-wheat-dark font-heading">
              <span>البند</span>
              <span class="font-mono">قبل</span>
              <span class="font-mono">بعد</span>
            </div>
            {#each projectEffectRows as row}
              <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-1 border-t border-wheat-mid/8 px-2 py-1 text-[9.5px]">
                <span class="text-wheat-light">{row.label}</span>
                <span dir="ltr" class="font-mono text-wheat-dark">{row.before}</span>
                <span dir="ltr" class="font-mono font-bold {row.good ? 'text-forest-accent' : 'text-umber-crimson'}">
                  {row.after}{#if row.delta} <span class="text-[8px] opacity-80">({row.delta})</span>{/if}
                </span>
              </div>
            {/each}
          </div>

          <div class="flex items-center justify-between gap-2 text-[9.5px]">
            <span class="text-wheat-dark">التمويل الملتزم</span>
            <b dir="ltr" class="font-mono text-[11px] text-wheat-gold">{projectFundingPct}%</b>
          </div>
          <div class="pd-bar pd-bar-tall">
            <i class="pd-fill" style="width:{projectFundingPct}%;background:linear-gradient(90deg, var(--color-wheat-mid), var(--color-wheat-gold));"></i>
          </div>

          <button
            onclick={() => {
              if (node?.strategicProject) {
                draftStore.toggleProvincialProject(node.strategicProject.id);
              }
            }}
            disabled={!isProjectCommitted && !canAffordProject}
            title={!isProjectCommitted && !canAffordProject ? (!isProjectAffordablePC ? `رصيد سياسي غير كافٍ (${node.strategicProject.costPoliticalCapital})` : !isProjectAffordableUSD ? 'ميزانية دولارية غير كافية' : 'سيولة الخزينة غير كافية وتتجاوز تغطية النقد الأجنبي') : ''}
            class="mt-1 flex min-h-11 w-full items-center justify-center gap-1.5 px-3 text-center text-[11px] font-bold font-heading transition-colors shell-round-item {isProjectCommitted ? 'border border-wheat-gold bg-wheat-gold text-forest-deep hover:bg-wheat-mid' : canAffordProject ? 'bg-wheat-gold text-forest-deep hover:bg-wheat-mid gloss-hover cursor-pointer' : 'cursor-not-allowed border border-wheat-mid/15 bg-charcoal-surface text-wheat-dark opacity-60'}"
          >
            {#if isProjectCommitted}
              <GameIcon name="check-mark" cls="h-3.5 w-3.5 shrink-0" />
              <span>إلغاء اعتماد تمويل المشروع</span>
            {:else if !canAffordProject}
              <span>
                {#if !isProjectAffordablePC}
                  تعذر الاعتماد: رصيد سياسي غير كافٍ ({node.strategicProject.costPoliticalCapital})
                {:else if !isProjectAffordableUSD}
                  تعذر الاعتماد: ميزانية دولارية غير كافية
                {:else}
                  تعذر الاعتماد: سيولة الخزينة غير كافية وتتجاوز تغطية النقد الأجنبي
                {/if}
              </span>
            {:else if isProjectCoveredByFX}
              <GameIcon name="coins" cls="h-3.5 w-3.5 shrink-0" />
              <span>اعتماد المشروع (بتغطية النقد الأجنبي)</span>
            {:else}
              <GameIcon name="coins" cls="h-3.5 w-3.5 shrink-0" />
              <span>اعتماد وإطلاق المشروع الاستراتيجي</span>
            {/if}
          </button>
        </div>
        {#if projBlocked}
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            <GameIcon name={SUSPENDED_ICON} cls="h-10 w-10 text-umber-glow opacity-90 drop-shadow-lg" />
          </div>
        {/if}
      </div>
    {/if}

    <div class="pd-sect">إجراءات فورية</div>

    <!-- Mine Clearance Directive (hidden where never needed; resolved notice once cleared) -->
    {#if neededDeminingFromStart}
      <div class="space-y-2 transition-all duration-300 {selectedStat ? (isProvincialActionRelated('demining') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
        {#if canDeployDemining}
          <div
            title={demBlocked ? 'موقوف مؤقتاً: ميزانية غير كافية ($20M / 8.0B SP)' : 'توجيه فرق نزع الألغام'}
            class="relative flex items-stretch border bg-forest-deep/50 text-start transition-all shell-round-pop {isSelectedForDemining ? 'border-wheat-gold/50 ring-2 ring-wheat-gold/60' : canAffordDemining ? 'border-wheat-mid/15' : SUSPENDED_CARD_CLASS}"
          >
            <div class="min-w-0 flex-1 space-y-1.5 px-2.5 py-2 {demBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
              <div class="flex items-center gap-1.5">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center bg-forest-accent/10 text-forest-accent shell-round-item" title="قابل لإعادة التفعيل كل دور">
                  <GameIcon name="cycle" cls="h-3.5 w-3.5 shrink-0" />
                </span>
                <span class="text-[11px] font-bold leading-tight text-wheat-light font-heading">توجيه فرق نزع الألغام</span>
              </div>
              <p class="text-[9px] leading-snug text-wheat-dark">تطهير الحقول الزراعية ومحاور الطرق من المخلفات المتفجرة</p>
              <div class="flex flex-wrap items-center gap-1">
                <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">-$20M</span>
                <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">-8.0B SP</span>
                <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">-8% تلوث</span>
                {#if isDeminingCoveredByFX && !isSelectedForDemining}
                  <span class="border border-forest-accent bg-forest-surface px-1 py-px text-[7.5px] font-bold text-forest-accent shell-round-chip">مغطى بالنقد الأجنبي</span>
                {/if}
                {#if demBlocked}
                  <span class="border border-umber-border bg-umber-deep px-1 py-px text-[7.5px] font-bold text-umber-crimson shell-round-chip">ميزانية غير كافية ($20M / 8.0B SP)</span>
                {/if}
              </div>
              <div class="space-y-0.5">
                <div class="flex items-center justify-between font-mono text-[8.5px]">
                  <span class="text-wheat-dark">الأراضي المطهّرة</span>
                  <span class="font-bold text-forest-accent">
                    {clearedPct}%{#if isSelectedForDemining} <span class="text-wheat-gold">(+8 متوقع)</span>{/if}
                  </span>
                </div>
                <div class="pd-bar relative">
                  <i class="pd-fill" style="width:{Math.max(0, Math.min(100, demCurrent))}%;background:var(--color-forest-accent);"></i>
                  {#if isSelectedForDemining && clearedPct > demCurrent}
                    <i
                      class="absolute inset-y-0 text-wheat-gold"
                      style="inset-inline-start:{Math.max(0, Math.min(100, demCurrent))}%;width:{Math.max(0, Math.min(100, clearedPct - demCurrent))}%;background:repeating-linear-gradient(-45deg, currentColor 0 2px, transparent 2px 4px);"
                      title="تحسن متوقع +{clearedPct - demCurrent}%"
                    ></i>
                  {/if}
                </div>
              </div>
            </div>
            <div class="pd-toggle flex items-center px-1.5">
              <ToggleSwitch
                checked={isSelectedForDemining}
                disabled={!isSelectedForDemining && !canAffordDemining}
                label="توجيه فرق نزع الألغام"
                onchange={(next) => {
                  if (selectedId && (next ? canAffordDemining : true)) {
                    draftStore.setField('deminingPriorityId', next ? selectedId : null);
                  }
                }}
              />
            </div>
            {#if demBlocked}
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <GameIcon name={SUSPENDED_ICON} cls="h-10 w-10 text-umber-glow opacity-90 drop-shadow-lg" />
              </div>
            {/if}
          </div>
        {:else}
          <div class="border border-forest-accent/30 bg-forest-surface/30 px-2.5 py-2 text-[10.5px] font-bold leading-relaxed text-forest-accent shell-round-pop">
            تم نزع النسبة الأكبر من الألغام واعتبار مشكلة الألغام محلولة في المحافظة
          </div>
        {/if}
      </div>
    {/if}

    <!-- Power Supply Boost Priority Directive -->
    <div class="space-y-2 transition-all duration-300 {selectedStat ? (isProvincialActionRelated('power') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
      <div
        title={powerBlocked ? 'موقوف مؤقتاً: ميزانية غير كافية ($10M / 3.0B SP)' : 'أولوية تعزيز التغذية والكهرباء'}
        class="relative flex items-stretch border bg-forest-deep/50 text-start transition-all shell-round-pop {isSelectedForPowerBoost ? 'border-wheat-gold/50 ring-2 ring-wheat-gold/60' : canAffordPowerBoost ? 'border-wheat-mid/15' : SUSPENDED_CARD_CLASS}"
      >
        <div class="min-w-0 flex-1 space-y-1.5 px-2.5 py-2 {powerBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
          <div class="flex items-center gap-1.5">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center bg-forest-accent/10 text-forest-accent shell-round-item" title="قابل لإعادة التفعيل كل دور">
              <GameIcon name="cycle" cls="h-3.5 w-3.5 shrink-0" />
            </span>
            <span class="text-[11px] font-bold leading-tight text-wheat-light font-heading">أولوية تعزيز التغذية والكهرباء</span>
          </div>
          <p class="text-[9px] leading-snug text-wheat-dark">محولات طوارئ وصيانة خطوط التوتر وتهدئة (-6)</p>
          <div class="flex flex-wrap items-center gap-1">
            <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">-$10M</span>
            <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">-3.0B SP</span>
            <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">-4 س ظلام</span>
            {#if isPowerBoostCoveredByFX && !isSelectedForPowerBoost}
              <span class="border border-forest-accent bg-forest-surface px-1 py-px text-[7.5px] font-bold text-forest-accent shell-round-chip">مغطى بالنقد الأجنبي</span>
            {/if}
            {#if powerBlocked}
              <span class="border border-umber-border bg-umber-deep px-1 py-px text-[7.5px] font-bold text-umber-crimson shell-round-chip">ميزانية غير كافية ($10M / 3.0B SP)</span>
            {/if}
          </div>
          <div class="space-y-0.5">
            <div class="flex items-center justify-between font-mono text-[8.5px]">
              <span class="text-wheat-dark">ساعات التغذية</span>
              <span class="font-bold text-forest-accent">
                {powerHrs} س/يوم{#if isSelectedForPowerBoost} <span class="text-wheat-gold">(+4 متوقع)</span>{/if}
              </span>
            </div>
            <div class="pd-bar relative">
              <i class="pd-fill" style="width:{Math.max(0, Math.min(100, (powerCurrent / 24) * 100))}%;background:var(--color-forest-accent);"></i>
              {#if isSelectedForPowerBoost && powerHrs > powerCurrent}
                <i
                  class="absolute inset-y-0 text-wheat-gold"
                  style="inset-inline-start:{Math.max(0, Math.min(100, (powerCurrent / 24) * 100))}%;width:{Math.max(0, Math.min(100, ((powerHrs - powerCurrent) / 24) * 100))}%;background:repeating-linear-gradient(-45deg, currentColor 0 2px, transparent 2px 4px);"
                  title="تحسن متوقع +{Number((powerHrs - powerCurrent).toFixed(1))} س/يوم"
                ></i>
              {/if}
            </div>
          </div>
        </div>
        <div class="pd-toggle flex items-center px-1.5">
          <ToggleSwitch
            checked={isSelectedForPowerBoost}
            disabled={!isSelectedForPowerBoost && (!canDeployPowerBoost || !canAffordPowerBoost)}
            label="أولوية تعزيز التغذية والكهرباء"
            onchange={(next) => {
              if (selectedId && (next ? canDeployPowerBoost && canAffordPowerBoost : true)) {
                draftStore.setField('powerBoostGovId', next ? selectedId : null);
              }
            }}
          />
        </div>
        {#if powerBlocked}
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            <GameIcon name={SUSPENDED_ICON} cls="h-10 w-10 text-umber-glow opacity-90 drop-shadow-lg" />
          </div>
        {/if}
      </div>
    </div>

    {#if node.id === 'as_suwayda'}
      <!-- Southern Policy Command Selector -->
      <div class="space-y-1.5 border border-wheat-mid/10 bg-charcoal-deep/30 p-2.5 shell-round-pop">
        <span class="block text-[10.5px] font-bold text-wheat-gold font-heading">توجيه سياسة الجبهة الجنوبية:</span>
        <!-- Live meters with fate thresholds: integration 80 = accord ending; secession 60 = cantons, 85 = balkanization -->
        <div class="space-y-1 px-0.5">
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="w-14 shrink-0 text-wheat-dark">اندماج</span>
            <div class="relative h-1.5 flex-1 bg-charcoal-surface" title="عتبة الوفاق: 80">
              <div class="absolute inset-y-0 bg-forest-accent/80" style="inset-inline-start:0;width:{Math.min(100, node.suwaydaIntegrationIndex ?? 0)}%;"></div>
              {#if southProj.sii !== Math.round(node.suwaydaIntegrationIndex ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="inset-inline-start:{Math.min(node.suwaydaIntegrationIndex ?? 0, southProj.sii)}%;width:{Math.abs(southProj.sii - (node.suwaydaIntegrationIndex ?? 0))}%;background:repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {southProj.sii}"
                ></div>
              {/if}
              <div class="absolute -inset-y-0.5 w-px bg-wheat-gold" style="inset-inline-start:80%;" title="نهاية الوفاق: 80"></div>
            </div>
            <span dir="ltr" class="min-w-7 text-left font-mono font-bold text-forest-accent">{southProj.sii}{#if deltaChip(southProj.sii, node.suwaydaIntegrationIndex ?? 0)} <span class="text-[8px] text-wheat-gold">{deltaChip(southProj.sii, node.suwaydaIntegrationIndex ?? 0)} متوقع</span>{/if}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="w-14 shrink-0 text-wheat-dark">انفصال</span>
            <div class="relative h-1.5 flex-1 bg-charcoal-surface" title="الكانتونات: 60 — البلقنة: 85">
              <div class="absolute inset-y-0 bg-umber-crimson/80" style="inset-inline-start:0;width:{Math.min(100, node.suwaydaSecessionProb ?? 0)}%;"></div>
              {#if southProj.ssp !== Math.round(node.suwaydaSecessionProb ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="inset-inline-start:{Math.min(node.suwaydaSecessionProb ?? 0, southProj.ssp)}%;width:{Math.abs(southProj.ssp - (node.suwaydaSecessionProb ?? 0))}%;background:repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {southProj.ssp}"
                ></div>
              {/if}
              <div class="absolute -inset-y-0.5 w-px bg-status-warn" style="inset-inline-start:60%;" title="الكانتونات: 60"></div>
              <div class="absolute -inset-y-0.5 w-px bg-umber-crimson" style="inset-inline-start:85%;" title="البلقنة: 85"></div>
            </div>
            <span dir="ltr" class="min-w-7 text-left font-mono font-bold text-umber-crimson">{southProj.ssp}{#if deltaChip(southProj.ssp, node.suwaydaSecessionProb ?? 0)} <span class="text-[8px] text-wheat-gold">{deltaChip(southProj.ssp, node.suwaydaSecessionProb ?? 0)} متوقع</span>{/if}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'HISTORIC_ACCORD')}
            title="وفاق السهل والجبل: +18 اندماج، −15 انفصال، −25 غضب عشائري، −5 توتر الجولان، تهدئة السويداء ودرعا، +6 ثقة — بكلفة 4 رصيد سياسي/دور (عند النفاد يتراجع تلقائياً للقسائم)"
            class="border p-2 text-start transition-all shell-round-item {$draftStore.southernPolicy === 'HISTORIC_ACCORD' ? 'border-forest-accent bg-forest-surface text-wheat-gold shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
          >
            <div class="text-[10px] font-bold leading-tight text-forest-accent">الوفاق التاريخي</div>
            <div class="text-[8.5px] leading-snug text-wheat-dark">وفاق السهل والجبل وتهدئة المحافظتين</div>
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">+18 اندماج</span>
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">−15 انفصال</span>
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">−25 غضب</span>
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">+6 ثقة</span>
              <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">−4 سياسي/دور</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'LOCAL_VOUCHERS')}
            title="دعم مقنن وهدنة هادئة: +4 اندماج (بسقف 65 — لا يوصل للوفاق الكامل)، −5 انفصال (الوضع الافتراضي، دون كلفة)"
            class="border p-2 text-start transition-all shell-round-item {$draftStore.southernPolicy === 'LOCAL_VOUCHERS' ? 'border-wheat-gold bg-forest-surface text-wheat-gold shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
          >
            <div class="text-[10px] font-bold leading-tight text-wheat-gold">قسائم الإغاثة</div>
            <div class="text-[8.5px] leading-snug text-wheat-dark">دعم مقنن وهدنة هادئة (افتراضي)</div>
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="border border-wheat-mid/40 bg-forest-surface px-1 py-px font-mono text-[8px] font-bold text-wheat-gold shell-round-chip">+4 اندماج</span>
              <span class="border border-charcoal-mid bg-forest-surface px-1 py-px font-mono text-[8px] font-bold text-wheat-mid shell-round-chip">دون كلفة</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'UNCONDITIONAL_AID')}
            title="مساعدات مفتوحة: −10 انفصال لكن +20 غضب عشائري في اللجاة (مكاسب محدودة بسقف +55 اندماج)"
            class="border p-2 text-start transition-all shell-round-item {$draftStore.southernPolicy === 'UNCONDITIONAL_AID' ? 'border-status-warn bg-forest-surface text-wheat-gold shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
          >
            <div class="text-[10px] font-bold leading-tight text-status-warn">مساعدات مفتوحة</div>
            <div class="text-[8.5px] leading-snug text-wheat-dark">تهدئة عاجلة بثمن عشائري</div>
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">−10 انفصال</span>
              <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">+20 غضب البدو</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'BLOCKADE')}
            title="الحصار الأمني: +30 انفصال، تصفير نصف مكاسب الاندماج المتراكمة، +10 توتر الجولان، تمرد مسلح في السويداء ودرعا، −10 ثقة شعبية"
            class="border p-2 text-start transition-all shell-round-item {$draftStore.southernPolicy === 'BLOCKADE' ? 'border-umber-border bg-umber-deep text-umber-crimson shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
          >
            <div class="text-[10px] font-bold leading-tight text-umber-crimson">الحصار الأمني</div>
            <div class="text-[8.5px] leading-snug text-wheat-dark">عزل وتصعيد خطير</div>
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="border border-umber-crimson bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-glow shell-round-chip">+30 انفصال</span>
              <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">÷2 اندماج</span>
              <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">تمرد −10 ثقة</span>
            </div>
          </button>
        </div>
      </div>
    {/if}

    {#if node.id === 'daraa' || node.id === 'quneitra'}
      <div class="space-y-1.5 border border-wheat-mid/10 bg-charcoal-deep/30 p-2.5 shell-round-pop">
        <span class="block text-[10.5px] font-bold text-wheat-gold font-heading">توجيه موقف حدود الجولان:</span>
        <!-- Live meters: tension 20 = sovereignty events; defiance 25 = Hauran events; nassib 80 = full capture -->
        <div class="space-y-1 px-0.5">
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="w-14 shrink-0 text-wheat-dark">توتر الجولان</span>
            <div class="relative h-1.5 flex-1 bg-charcoal-surface" title="أحداث السيادة فوق 20">
              <div class="absolute inset-y-0 bg-status-warn/80" style="inset-inline-start:0;width:{Math.min(100, node.golanTensionIndex ?? 0)}%;"></div>
              {#if golanProj.gti !== Math.round(node.golanTensionIndex ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="inset-inline-start:{Math.min(node.golanTensionIndex ?? 0, golanProj.gti)}%;width:{Math.abs(golanProj.gti - (node.golanTensionIndex ?? 0))}%;background:repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {golanProj.gti}"
                ></div>
              {/if}
              <div class="absolute -inset-y-0.5 w-px bg-umber-crimson" style="inset-inline-start:20%;" title="أحداث السيادة: 20"></div>
            </div>
            <span dir="ltr" class="min-w-7 text-left font-mono font-bold text-status-warn">{golanProj.gti}{#if deltaChip(golanProj.gti, node.golanTensionIndex ?? 0)} <span class="text-[8px] text-wheat-gold">{deltaChip(golanProj.gti, node.golanTensionIndex ?? 0)} متوقع</span>{/if}</span>
          </div>
          {#if node.id === 'daraa'}
            <div class="flex items-center gap-1.5 text-[9px]">
              <span class="w-14 shrink-0 text-wheat-dark">تحدٍّ درعاوي</span>
              <div class="relative h-1.5 flex-1 bg-charcoal-surface" title="أحداث حوران فوق 25">
                <div class="absolute inset-y-0 bg-status-warn/80" style="inset-inline-start:0;width:{Math.min(100, node.daraaDefianceIndex ?? 0)}%;"></div>
                {#if golanProj.ddi !== Math.round(node.daraaDefianceIndex ?? 0)}
                  <div
                    class="absolute inset-y-0 h-full text-wheat-gold"
                    style="inset-inline-start:{Math.min(node.daraaDefianceIndex ?? 0, golanProj.ddi)}%;width:{Math.abs(golanProj.ddi - (node.daraaDefianceIndex ?? 0))}%;background:repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                    title="متوقع: {golanProj.ddi}"
                  ></div>
                {/if}
                <div class="absolute -inset-y-0.5 w-px bg-umber-crimson" style="inset-inline-start:25%;" title="أحداث حوران: 25"></div>
              </div>
              <span dir="ltr" class="min-w-7 text-left font-mono font-bold text-status-warn">{golanProj.ddi}{#if deltaChip(golanProj.ddi, node.daraaDefianceIndex ?? 0)} <span class="text-[8px] text-wheat-gold">{deltaChip(golanProj.ddi, node.daraaDefianceIndex ?? 0)} متوقع</span>{/if}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[9px]">
              <span class="w-14 shrink-0 text-wheat-dark">تحصيل نصيب</span>
              <div class="relative h-1.5 flex-1 bg-charcoal-surface" title="السقف الكامل: 80%">
                <div class="absolute inset-y-0 bg-wheat-gold/80" style="inset-inline-start:0;width:{Math.min(100, node.nassibRevenueCapturePct ?? 0)}%;"></div>
                {#if golanProj.nrc !== Math.round(node.nassibRevenueCapturePct ?? 0)}
                  <div
                    class="absolute inset-y-0 h-full text-wheat-gold"
                    style="inset-inline-start:{Math.min(node.nassibRevenueCapturePct ?? 0, golanProj.nrc)}%;width:{Math.abs(golanProj.nrc - (node.nassibRevenueCapturePct ?? 0))}%;background:repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                    title="متوقع: {golanProj.nrc}%"
                  ></div>
                {/if}
                <div class="absolute -inset-y-0.5 w-px bg-wheat-gold" style="inset-inline-start:80%;" title="السقف: 80%"></div>
              </div>
              <span dir="ltr" class="min-w-7 text-left font-mono font-bold text-wheat-gold">{golanProj.nrc}%{#if deltaChip(golanProj.nrc, node.nassibRevenueCapturePct ?? 0)} <span class="text-[8px]">{deltaChip(golanProj.nrc, node.nassibRevenueCapturePct ?? 0)} متوقع</span>{/if}</span>
            </div>
          {/if}
        </div>
        <div class="grid {node.id === 'quneitra' ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5">
          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'RESTRAINT')}
            title="ضبط النفس (مجاني): −15 توتر الجولان، لكن +18 تحدٍّ درعاوي و+10 احتقان في درعا"
            class="border p-2 text-start transition-all shell-round-item {$draftStore.golanBorderStance === 'RESTRAINT' ? 'border-forest-accent bg-forest-surface text-wheat-gold shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
          >
            <div class="text-[10px] font-bold leading-tight text-forest-accent">ضبط النفس</div>
            <div class="text-[8.5px] leading-snug text-wheat-dark">تهدئة الجولان مجاناً</div>
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">−15 توتر</span>
              <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">+18 تحدٍّ</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'LOCAL_GENDARMERIE')}
            title="درك محلي: −8 تحدٍّ درعاوي، +5% تحصيل نصيب، +5 توتر الجولان (توازن آمن)"
            class="border p-2 text-start transition-all shell-round-item {$draftStore.golanBorderStance === 'LOCAL_GENDARMERIE' ? 'border-wheat-gold bg-forest-surface text-wheat-gold shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
          >
            <div class="text-[10px] font-bold leading-tight text-wheat-gold">درك محلي</div>
            <div class="text-[8.5px] leading-snug text-wheat-dark">أمن محلي وإيراد معابر</div>
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">−8 تحدٍّ</span>
              <span class="border border-wheat-mid/40 bg-forest-surface px-1 py-px font-mono text-[8px] font-bold text-wheat-gold shell-round-chip">+5% نصيب</span>
              <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">+5 توتر</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'DEPLOY_ARMOR')}
            title="نشر الدروع: −20 تحدٍّ و−8 احتقان درعا والقنيطرة، لكن +25 توتر الجولان وكلفة 9.0B SP"
            class="border p-2 text-start transition-all shell-round-item {$draftStore.golanBorderStance === 'DEPLOY_ARMOR' ? 'border-umber-border bg-umber-deep text-umber-crimson shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
          >
            <div class="text-[10px] font-bold leading-tight text-umber-crimson">نشر الدروع</div>
            <div class="text-[8.5px] leading-snug text-wheat-dark">قوة نارية بثمن سيادي</div>
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">−20 تحدٍّ</span>
              <span class="border border-umber-crimson bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-glow shell-round-chip">+25 توتر!</span>
              <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">−9.0B SP</span>
            </div>
          </button>

          {#if node.id === 'quneitra'}
            <button
              type="button"
              onclick={() => draftStore.setField('golanBorderStance', 'UN_LIAISON')}
              title="مكتب ارتباط أندوف (القنيطرة فقط): −10 توتر الجولان دون تحريك التحدي، +2 ثقة، بكلفة بعثة $8M/دور"
              class="border p-2 text-start transition-all shell-round-item {$draftStore.golanBorderStance === 'UN_LIAISON' ? 'border-wheat-gold bg-forest-surface text-wheat-gold shadow' : 'border-wheat-mid/12 bg-charcoal-deep/40 text-wheat-mid hover:border-wheat-mid/30 hover:text-wheat-light'}"
            >
              <div class="text-[10px] font-bold leading-tight text-wheat-gold">ارتباط أندوف</div>
              <div class="text-[8.5px] leading-snug text-wheat-dark">تهدئة زرقاء بلا تحدٍّ (القنيطرة فقط)</div>
              <div class="flex flex-wrap items-center gap-1 pt-1">
                <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">−10 توتر</span>
                <span class="border border-forest-accent/60 bg-forest-mid px-1 py-px font-mono text-[8px] font-bold text-forest-accent shell-round-chip">+2 ثقة</span>
                <span class="border border-umber-border bg-umber-deep px-1 py-px font-mono text-[8px] font-bold text-umber-crimson shell-round-chip">−$8M/دور</span>
              </div>
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Prev/next province navigation ("next" points left in RTL) -->
    <div class="flex items-center gap-1.5 pt-1">
      <button
        type="button"
        onclick={() => stepGovernorate(-1)}
        aria-label="المحافظة السابقة"
        title="المحافظة السابقة"
        class="flex min-h-11 flex-1 items-center justify-center gap-1.5 border border-wheat-mid/15 bg-charcoal-deep/40 px-2 text-[10px] font-bold text-wheat-mid transition-colors hover:border-wheat-mid/35 hover:text-wheat-light shell-round-item"
      >
        <span aria-hidden="true" class="text-sm">›</span>
        السابقة
      </button>
      <span class="shrink-0 px-1 font-mono text-[10px] text-wheat-dark">{provinceIndex + 1} / {GOV_IDS.length}</span>
      <button
        type="button"
        onclick={() => stepGovernorate(1)}
        aria-label="المحافظة التالية"
        title="المحافظة التالية"
        class="flex min-h-11 flex-1 items-center justify-center gap-1.5 border border-wheat-mid/15 bg-charcoal-deep/40 px-2 text-[10px] font-bold text-wheat-mid transition-colors hover:border-wheat-mid/35 hover:text-wheat-light shell-round-item"
      >
        التالية
        <span aria-hidden="true" class="text-sm">‹</span>
      </button>
    </div>
  {:else}
    <div class="border border-wheat-mid/15 bg-charcoal-deep/40 p-4 text-center text-[11px] text-wheat-dark shell-round-pop">
      اختر محافظة من الخريطة أو من القائمة أعلاه.
    </div>
  {/if}
</div>

<style>
  /* Concept D province dossier — rounded surfaces are explicit exceptions to
     the global angular reset. */
  .pd-sect {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 9px 0 2px;
    font-size: 8.5px;
    letter-spacing: 1.2px;
    color: var(--color-wheat-dark);
  }
  .pd-sect::after {
    content: '';
    height: 1px;
    flex: 1;
    background: rgb(from var(--color-wheat-mid) r g b / 0.1);
  }

  .pd-gauge {
    position: relative;
    display: grid;
    place-items: center;
    width: 80px;
    height: 80px;
    border-radius: 50% !important;
    background: conic-gradient(
      var(--tone, var(--color-wheat-gold)) calc(var(--p, 0) * 1%),
      rgb(from var(--color-wheat-light) r g b / 0.07) 0
    );
  }
  .pd-gauge::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 50% !important;
    background: color-mix(in srgb, var(--color-charcoal-deep) 78%, var(--color-forest-mid));
  }
  .pd-gauge-tx {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
  }
  .pd-gauge-tx b {
    font-size: 27px;
    font-weight: 600;
    color: var(--color-wheat-light);
  }
  .pd-gauge-tx span {
    margin-top: 4px;
    font-size: 7.5px;
    letter-spacing: 0.4px;
    color: var(--color-wheat-dark);
    white-space: nowrap;
  }

  .pd-bar {
    height: 3px;
    overflow: hidden;
    border-radius: 4px !important;
    background: rgb(from var(--color-wheat-light) r g b / 0.08);
  }
  .pd-bar-tall {
    height: 5px;
  }
  .pd-fill {
    display: block;
    height: 100%;
    border-radius: 4px !important;
    transition: width 0.4s ease;
  }
  .pd-bar i.absolute {
    border-radius: 0 !important;
  }
  /* The shared ToggleSwitch is styled for the legacy angular UI; inside the
     Concept D dossier its track/knob must read as a pill (component-scoped,
     the shared component itself is untouched). */
  .pd-toggle :global(span) {
    border-radius: 999px !important;
  }

  /* app.css's `* { border-radius: 0 !important }` lives in the `base` layer.
     Layered important declarations beat unlayered ones, so component-scoped
     roundness must also be declared inside that same layer to win back the
     Concept D surfaces. */
  @layer base {
    .pd-gauge,
    .pd-gauge-inner {
      border-radius: 50% !important;
    }
    .pd-gauge::before {
      border-radius: 50% !important;
    }
    .pd-bar,
    .pd-fill {
      border-radius: 4px !important;
    }
    .pd-root :global(.shell-round-pop) {
      border-radius: 12px !important;
    }
    .pd-root :global(.shell-round-item) {
      border-radius: 10px !important;
    }
    .pd-root :global(.shell-round-chip) {
      border-radius: 999px !important;
    }
    .pd-toggle :global(span) {
      border-radius: 999px !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pd-fill {
      transition: none;
    }
  }
</style>
