<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import ToggleSwitch from '../ToggleSwitch.svelte';
  import { BASELINE_GOVERNORATES } from '../../engine/constants';
  import { governorateShape } from '../../spatial3d/syria-2d-paths';
  import { isProvincialActionRelated as isProvincialActionRelatedShared, SUSPENDED_CARD_CLASS, SUSPENDED_CONTENT_CLASS, SUSPENDED_ICON } from './shared';

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
  let canDeployDemining = $derived(node ? node.mineSaturationPct > 8 : false);  let canAffordDemining = $derived(
    $budgetStore.canAffordWithFxCoverage(20_000_000, 8_000_000_000)
  );
  let isDeminingCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(20_000_000, 800_000_000_000)
  );

  let isSelectedForPowerBoost = $derived($draftStore.powerBoostGovId === selectedId);
  let canDeployPowerBoost = $derived(node ? node.dailyBlackoutHours > 2 : false);
  let canAffordPowerBoost = $derived(
    $budgetStore.canAffordWithFxCoverage(10_000_000, 3_000_000_000)
  );
  let isPowerBoostCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(10_000_000, 300_000_000_000)
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

  let isProjectCommitted = $derived(
    Boolean(node?.strategicProject && $draftStore.provincialProjects.includes(node.strategicProject.id))
  );
  let isProjectAffordablePC = $derived(
    Boolean(node?.strategicProject && node.strategicProject.costPoliticalCapital <= $budgetStore.remainingPC)
  );
  let isProjectAffordableUSD = $derived(
    Boolean(node?.strategicProject && node.strategicProject.costUSD <= $budgetStore.remainingUSD)
  );
  let isProjectAffordable = $derived(
    Boolean(node?.strategicProject && $budgetStore.canAffordWithFxCoverage(node.strategicProject.costUSD, node.strategicProject.costSYP))
  );
  let isProjectCoveredByFX = $derived(
    Boolean(node?.strategicProject && $budgetStore.isCoveredByFX(node.strategicProject.costUSD, node.strategicProject.costSYP))
  );

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  function isProvincialActionRelated(actionKey: 'project' | 'demining' | 'power'): boolean {
    return isProvincialActionRelatedShared(selectedStat, actionKey);
  }

  let canAffordProject = $derived(
    isProjectAffordablePC && isProjectAffordable
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
    if (policy === 'HISTORIC_ACCORD' && $budgetStore.remainingPC < 4) policy = 'LOCAL_VOUCHERS';
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
    if (south === 'HISTORIC_ACCORD' && $budgetStore.remainingPC < 4) south = 'LOCAL_VOUCHERS';
    if (south === 'HISTORIC_ACCORD') gti = Math.max(15, gti - 5);
    else if (south === 'BLOCKADE') gti = Math.min(100, gti + 10);
    return { gti, ddi, nrc };
  });
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2 border-b border-charcoal-mid pb-2">
    <svg viewBox={provShape.vb} class="w-5 h-5 shrink-0 text-wheat-gold" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={provShape.d} fill="currentColor" /></svg>
    <h3 class="text-sm font-bold text-wheat-light font-heading">{node?.nameAr ?? 'القيادة الإقليمية'}</h3>
  </div>

  {#if node}
    {#if node.strategicProject.isExecuted}
      <!-- Done: title + solution + checkmark only -->
      <div class="px-2 py-2 border border-forest-accent/40 bg-forest-surface/40 opacity-90 space-y-1">
        <div class="flex items-center gap-1.5">
          <GameIcon name="check-mark" cls="w-4 h-4 text-forest-accent shrink-0" />
          <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">{node.strategicProject.titleAr}</span>
        </div>
        <p class="text-wheat-dark leading-relaxed text-[11px]">
          {node.strategicProject.solutionDescriptionAr}
        </p>
      </div>
    {:else}
    {@const projBlocked = !isProjectCommitted && !canAffordProject}
    <!-- Single bordered card: title, brief, solution, costs, before/after table, decision -->
    <div class="relative px-2 py-2 space-y-2 border bg-forest-deep/60 transition-all {projBlocked ? SUSPENDED_CARD_CLASS : 'border-charcoal-mid'} {selectedStat ? (isProvincialActionRelated('project') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
      <div class="space-y-2 {projBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
        <div class="space-y-1">
          <h3 class="text-xs font-bold text-wheat-gold font-heading leading-tight">
            {node.strategicProject.titleAr}
          </h3>
          <p class="text-wheat-dark leading-relaxed text-[11px]">
            {node.strategicProject.issueDescriptionAr}
          </p>
          <p class="text-wheat-light leading-relaxed text-[11px]">
            {node.strategicProject.solutionDescriptionAr}
          </p>
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
            -${node.strategicProject.costUSD / 1_000_000}M
          </span>
          <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
            -{(node.strategicProject.costSYP / 1_000_000_000).toFixed(2)}B SP
          </span>
          {#if isProjectCoveredByFX && !isProjectCommitted}
            <span class="px-1.5 py-0.5 rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[9px]">
              مغطى بالنقد الأجنبي
            </span>
          {/if}
          {#if node.strategicProject.costPoliticalCapital > 0}
            <span class="px-2 py-0.5 rounded-full bg-forest-surface border border-charcoal-mid text-wheat-gold font-mono font-bold text-[10px]">
              -{node.strategicProject.costPoliticalCapital} رصيد سياسي
            </span>
          {/if}
        </div>

        <!-- Before/after stat table -->
        <div class="border border-charcoal-mid/60">
          <div class="grid grid-cols-[1fr_auto_auto] gap-1 px-2 py-1 bg-charcoal-surface text-[9px] font-bold text-wheat-dark font-heading">
            <span>البند</span>
            <span class="font-mono">قبل</span>
            <span class="font-mono">بعد</span>
          </div>
          {#each projectEffectRows as row}
            <div class="grid grid-cols-[1fr_auto_auto] gap-1 px-2 py-1 border-t border-charcoal-mid/50 text-[10px] items-baseline">
              <span class="text-wheat-light">{row.label}</span>
              <span dir="ltr" class="font-mono text-wheat-dark">{row.before}</span>
              <span dir="ltr" class="font-mono font-bold {row.good ? 'text-forest-accent' : 'text-umber-crimson'}">
                {row.after}{#if row.delta} <span class="text-[8.5px] opacity-80">({row.delta})</span>{/if}
              </span>
            </div>
          {/each}
        </div>

        <button
          onclick={() => {
            if (node?.strategicProject) {
              draftStore.toggleProvincialProject(node.strategicProject.id);
            }
          }}
          disabled={!isProjectCommitted && !canAffordProject}
          title={!isProjectCommitted && !canAffordProject ? (!isProjectAffordablePC ? `رصيد سياسي غير كافٍ (${node.strategicProject.costPoliticalCapital})` : !isProjectAffordableUSD ? 'ميزانية دولارية غير كافية' : 'سيولة الخزينة غير كافية وتتجاوز تغطية النقد الأجنبي') : ''}
          class="w-full h-12 flex items-center justify-center gap-2 px-3 text-xs font-bold font-heading text-center transition-colors rounded-none {isProjectCommitted ? 'bg-wheat-gold text-forest-deep border border-wheat-gold hover:bg-wheat-mid cursor-pointer' : canAffordProject ? 'bg-charcoal-surface text-wheat-light border border-charcoal-mid hover:bg-forest-mid hover:border-wheat-mid/60 cursor-pointer gloss-hover' : 'bg-charcoal-surface text-wheat-dark border border-charcoal-mid cursor-not-allowed opacity-60'}"
        >
          {#if isProjectCommitted}
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
            <span>اعتماد المشروع (بتغطية النقد الأجنبي)</span>
          {:else}
            <span>اعتماد وإطلاق المشروع الاستراتيجي</span>
          {/if}
        </button>
      </div>
      {#if projBlocked}
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
        </div>
      {/if}
    </div>
    {/if}

    <!-- Mine Clearance Directive (hidden where never needed; resolved notice once cleared) -->
    {#if neededDeminingFromStart}
    <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isProvincialActionRelated('demining') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
      {#if canDeployDemining}
      <div
        title={demBlocked ? 'موقوف مؤقتاً: ميزانية غير كافية ($20M / 8.0B SP)' : 'توجيه فرق نزع الألغام'}
        class="flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {isSelectedForDemining ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordDemining ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
      >
        <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 {demBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span title="قابل لإعادة التفعيل كل دور"><GameIcon name="cycle" cls="w-4 h-4 text-forest-accent shrink-0" /></span>
            <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">توجيه فرق نزع الألغام</span>
          </div>
          <span class="text-[10px] text-wheat-dark block">تطهير الحقول الزراعية ومحاور الطرق من المخلفات المتفجرة</span>
          <div class="flex items-center gap-1 flex-wrap">
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-$20M</span>
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-8.0B SP</span>
            <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">-8% تلوث</span>
            {#if isDeminingCoveredByFX && !isSelectedForDemining}
              <span class="px-1.5 py-px rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[8px]">
                مغطى بالنقد الأجنبي
              </span>
            {/if}
          </div>
          <div class="space-y-0.5">
            <div class="flex justify-between items-center text-[8.5px] font-mono">
              <span class="text-wheat-dark">الأراضي المطهّرة</span>
              <span class="text-forest-accent font-bold">
                {clearedPct}%{#if isSelectedForDemining} <span class="text-wheat-gold">(+8 متوقع)</span>{/if}
              </span>
            </div>
            <div class="relative h-1.5 bg-charcoal-surface border border-charcoal-mid">
              <div class="absolute inset-y-0 right-0 h-full bg-forest-accent transition-all" style="width: {Math.max(0, Math.min(100, demCurrent))}%"></div>
              {#if isSelectedForDemining && clearedPct > demCurrent}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold transition-all"
                  style="right: {Math.max(0, Math.min(100, demCurrent))}%; width: {Math.max(0, Math.min(100, clearedPct - demCurrent))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="تحسن متوقع +{clearedPct - demCurrent}%"
                ></div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex items-center px-2">
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
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
          </div>
        {/if}
      </div>
      {:else}
      <div class="border-t border-charcoal-mid/80 pt-2 text-[11px] font-bold text-forest-accent leading-relaxed">
        تم نزع النسبة الأكبر من الألغام واعتبار مشكلة الألغام محلولة في المحافظة
      </div>
      {/if}
    </div>
    {/if}

    <!-- Power Supply Boost Priority Directive -->
    <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isProvincialActionRelated('power') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
      <div
        title={powerBlocked ? 'موقوف مؤقتاً: ميزانية غير كافية ($10M / 3.0B SP)' : 'أولوية تعزيز التغذية والكهرباء'}
        class="flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {isSelectedForPowerBoost ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordPowerBoost ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
      >
        <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 {powerBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span title="قابل لإعادة التفعيل كل دور"><GameIcon name="cycle" cls="w-4 h-4 text-forest-accent shrink-0" /></span>
            <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">أولوية تعزيز التغذية والكهرباء</span>
          </div>
          <span class="text-[10px] text-wheat-dark block">محولات طوارئ وصيانة خطوط التوتر وتهدئة (-6)</span>
          <div class="flex items-center gap-1 flex-wrap">
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-$10M</span>
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-3.0B SP</span>
            <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">-4 س ظلام</span>
            {#if isPowerBoostCoveredByFX && !isSelectedForPowerBoost}
              <span class="px-1.5 py-px rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[8px]">
                مغطى بالنقد الأجنبي
              </span>
            {/if}
          </div>
          <div class="space-y-0.5">
            <div class="flex justify-between items-center text-[8.5px] font-mono">
              <span class="text-wheat-dark">ساعات التغذية</span>
              <span class="text-forest-accent font-bold">
                {powerHrs} س/يوم{#if isSelectedForPowerBoost} <span class="text-wheat-gold">(+4 متوقع)</span>{/if}
              </span>
            </div>
            <div class="relative h-1.5 bg-charcoal-surface border border-charcoal-mid">
              <div class="absolute inset-y-0 right-0 h-full bg-forest-accent transition-all" style="width: {Math.max(0, Math.min(100, (powerCurrent / 24) * 100))}%"></div>
              {#if isSelectedForPowerBoost && powerHrs > powerCurrent}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold transition-all"
                  style="right: {Math.max(0, Math.min(100, (powerCurrent / 24) * 100))}%; width: {Math.max(0, Math.min(100, ((powerHrs - powerCurrent) / 24) * 100))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="تحسن متوقع +{Number((powerHrs - powerCurrent).toFixed(1))} س/يوم"
                ></div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex items-center px-2">
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
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
          </div>
        {/if}
      </div>
    </div>

    {#if node.id === 'as_suwayda'}
      <!-- Southern Policy Command Selector -->
      <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
        <span class="text-xs font-bold text-wheat-gold font-heading block">توجيه سياسة الجبهة الجنوبية:</span>
        <!-- Live meters with fate thresholds: integration 80 = accord ending; secession 60 = cantons, 85 = balkanization -->
        <div class="space-y-1 px-0.5 pb-1">
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="text-wheat-dark w-14 shrink-0">اندماج</span>
            <div class="relative flex-1 h-1.5 bg-charcoal-surface" title="عتبة الوفاق: 80">
              <div class="absolute inset-y-0 right-0 bg-forest-accent/80" style="width: {Math.min(100, node.suwaydaIntegrationIndex ?? 0)}%"></div>
              {#if southProj.sii !== Math.round(node.suwaydaIntegrationIndex ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="right: {Math.min(node.suwaydaIntegrationIndex ?? 0, southProj.sii)}%; width: {Math.abs(southProj.sii - (node.suwaydaIntegrationIndex ?? 0))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {southProj.sii}"
                ></div>
              {/if}
              <div class="absolute inset-y-[-2px] w-px bg-wheat-gold" style="right: 80%" title="نهاية الوفاق: 80"></div>
            </div>
            <span dir="ltr" class="font-mono font-bold text-forest-accent min-w-7 text-left">{southProj.sii}{#if deltaChip(southProj.sii, node.suwaydaIntegrationIndex ?? 0)} <span class="text-wheat-gold text-[8px]">{deltaChip(southProj.sii, node.suwaydaIntegrationIndex ?? 0)} متوقع</span>{/if}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="text-wheat-dark w-14 shrink-0">انفصال</span>
            <div class="relative flex-1 h-1.5 bg-charcoal-surface" title="الكانتونات: 60 — البلقنة: 85">
              <div class="absolute inset-y-0 right-0 bg-umber-crimson/80" style="width: {Math.min(100, node.suwaydaSecessionProb ?? 0)}%"></div>
              {#if southProj.ssp !== Math.round(node.suwaydaSecessionProb ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="right: {Math.min(node.suwaydaSecessionProb ?? 0, southProj.ssp)}%; width: {Math.abs(southProj.ssp - (node.suwaydaSecessionProb ?? 0))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {southProj.ssp}"
                ></div>
              {/if}
              <div class="absolute inset-y-[-2px] w-px bg-amber-400" style="right: 60%" title="الكانتونات: 60"></div>
              <div class="absolute inset-y-[-2px] w-px bg-umber-crimson" style="right: 85%" title="البلقنة: 85"></div>
            </div>
            <span dir="ltr" class="font-mono font-bold text-umber-crimson min-w-7 text-left">{southProj.ssp}{#if deltaChip(southProj.ssp, node.suwaydaSecessionProb ?? 0)} <span class="text-wheat-gold text-[8px]">{deltaChip(southProj.ssp, node.suwaydaSecessionProb ?? 0)} متوقع</span>{/if}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'HISTORIC_ACCORD')}
            title="وفاق السهل والجبل: +18 اندماج، −15 انفصال، −25 غضب عشائري، −5 توتر الجولان، تهدئة السويداء ودرعا، +6 ثقة — بكلفة 4 رصيد سياسي/دور (عند النفاد يتراجع تلقائياً للقسائم)"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'HISTORIC_ACCORD' ? 'bg-forest-surface border-forest-accent text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-forest-accent">الوفاق التاريخي</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">وفاق السهل والجبل وتهدئة المحافظتين</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+18 اندماج</span>
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−15 انفصال</span>
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−25 غضب</span>
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+6 ثقة</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">−4 سياسي/دور</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'LOCAL_VOUCHERS')}
            title="دعم مقنن وهدنة هادئة: +4 اندماج (بسقف 65 — لا يوصل للوفاق الكامل)، −5 انفصال (الوضع الافتراضي، دون كلفة)"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'LOCAL_VOUCHERS' ? 'bg-forest-surface border-wheat-gold text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-wheat-gold">قسائم الإغاثة</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">دعم مقنن وهدنة هادئة (افتراضي)</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8px]">+4 اندماج</span>
              <span class="px-1 py-px rounded-full bg-forest-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8px]">دون كلفة</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'UNCONDITIONAL_AID')}
            title="مساعدات مفتوحة: −10 انفصال لكن +20 غضب عشائري في اللجاة (مكاسب محدودة بسقف +55 اندماج)"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'UNCONDITIONAL_AID' ? 'bg-forest-surface border-amber-500 text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-amber-300">مساعدات مفتوحة</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">تهدئة عاجلة بثمن عشائري</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−10 انفصال</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">+20 غضب البدو</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'BLOCKADE')}
            title="الحصار الأمني: +30 انفصال، تصفير نصف مكاسب الاندماج المتراكمة، +10 توتر الجولان، تمرد مسلح في السويداء ودرعا، −10 ثقة شعبية"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'BLOCKADE' ? 'bg-umber-deep border-umber-border text-umber-crimson shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-umber-crimson">الحصار الأمني</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">عزل وتصعيد خطير</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-crimson text-umber-glow font-mono font-bold text-[8px]">+30 انفصال</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">÷2 اندماج</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">تمرد −10 ثقة</span>
            </div>
          </button>
        </div>
      </div>
    {/if}

    {#if node.id === 'daraa' || node.id === 'quneitra'}
      <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
        <span class="text-xs font-bold text-wheat-gold font-heading block">توجيه موقف حدود الجولان:</span>
        <!-- Live meters: tension 20 = sovereignty events; defiance 25 = Hauran events; nassib 80 = full capture -->
        <div class="space-y-1 px-0.5 pb-1">
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="text-wheat-dark w-14 shrink-0">توتر الجولان</span>
            <div class="relative flex-1 h-1.5 bg-charcoal-surface" title="أحداث السيادة فوق 20">
              <div class="absolute inset-y-0 right-0 bg-amber-500/80" style="width: {Math.min(100, node.golanTensionIndex ?? 0)}%"></div>
              {#if golanProj.gti !== Math.round(node.golanTensionIndex ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="right: {Math.min(node.golanTensionIndex ?? 0, golanProj.gti)}%; width: {Math.abs(golanProj.gti - (node.golanTensionIndex ?? 0))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {golanProj.gti}"
                ></div>
              {/if}
              <div class="absolute inset-y-[-2px] w-px bg-umber-crimson" style="right: 20%" title="أحداث السيادة: 20"></div>
            </div>
            <span dir="ltr" class="font-mono font-bold text-amber-400 min-w-7 text-left">{golanProj.gti}{#if deltaChip(golanProj.gti, node.golanTensionIndex ?? 0)} <span class="text-wheat-gold text-[8px]">{deltaChip(golanProj.gti, node.golanTensionIndex ?? 0)} متوقع</span>{/if}</span>
          </div>
          {#if node.id === 'daraa'}
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="text-wheat-dark w-14 shrink-0">تحدٍّ درعاوي</span>
            <div class="relative flex-1 h-1.5 bg-charcoal-surface" title="أحداث حوران فوق 25">
              <div class="absolute inset-y-0 right-0 bg-amber-500/80" style="width: {Math.min(100, node.daraaDefianceIndex ?? 0)}%"></div>
              {#if golanProj.ddi !== Math.round(node.daraaDefianceIndex ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="right: {Math.min(node.daraaDefianceIndex ?? 0, golanProj.ddi)}%; width: {Math.abs(golanProj.ddi - (node.daraaDefianceIndex ?? 0))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {golanProj.ddi}"
                ></div>
              {/if}
              <div class="absolute inset-y-[-2px] w-px bg-umber-crimson" style="right: 25%" title="أحداث حوران: 25"></div>
            </div>
            <span dir="ltr" class="font-mono font-bold text-amber-400 min-w-7 text-left">{golanProj.ddi}{#if deltaChip(golanProj.ddi, node.daraaDefianceIndex ?? 0)} <span class="text-wheat-gold text-[8px]">{deltaChip(golanProj.ddi, node.daraaDefianceIndex ?? 0)} متوقع</span>{/if}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[9px]">
            <span class="text-wheat-dark w-14 shrink-0">تحصيل نصيب</span>
            <div class="relative flex-1 h-1.5 bg-charcoal-surface" title="السقف الكامل: 80%">
              <div class="absolute inset-y-0 right-0 bg-wheat-gold/80" style="width: {Math.min(100, node.nassibRevenueCapturePct ?? 0)}%"></div>
              {#if golanProj.nrc !== Math.round(node.nassibRevenueCapturePct ?? 0)}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold"
                  style="right: {Math.min(node.nassibRevenueCapturePct ?? 0, golanProj.nrc)}%; width: {Math.abs(golanProj.nrc - (node.nassibRevenueCapturePct ?? 0))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="متوقع: {golanProj.nrc}%"
                ></div>
              {/if}
              <div class="absolute inset-y-[-2px] w-px bg-wheat-gold" style="right: 80%" title="السقف: 80%"></div>
            </div>
            <span dir="ltr" class="font-mono font-bold text-wheat-gold min-w-7 text-left">{golanProj.nrc}%{#if deltaChip(golanProj.nrc, node.nassibRevenueCapturePct ?? 0)} <span class="text-[8px]">{deltaChip(golanProj.nrc, node.nassibRevenueCapturePct ?? 0)} متوقع</span>{/if}</span>
          </div>
          {/if}
        </div>
        <div class="grid {node.id === 'quneitra' ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5">
          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'RESTRAINT')}
            title="ضبط النفس (مجاني): −15 توتر الجولان، لكن +18 تحدٍّ درعاوي و+10 احتقان في درعا"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'RESTRAINT' ? 'bg-forest-surface border-forest-accent text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-forest-accent">ضبط النفس</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">تهدئة الجولان مجاناً</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−15 توتر</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">+18 تحدٍّ</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'LOCAL_GENDARMERIE')}
            title="درك محلي: −8 تحدٍّ درعاوي، +5% تحصيل نصيب، +5 توتر الجولان (توازن آمن)"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'LOCAL_GENDARMERIE' ? 'bg-forest-surface border-wheat-gold text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-wheat-gold">درك محلي</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">أمن محلي وإيراد معابر</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−8 تحدٍّ</span>
              <span class="px-1 py-px rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8px]">+5% نصيب</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">+5 توتر</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'DEPLOY_ARMOR')}
            title="نشر الدروع: −20 تحدٍّ و−8 احتقان درعا والقنيطرة، لكن +25 توتر الجولان وكلفة 9.0B SP"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'DEPLOY_ARMOR' ? 'bg-umber-deep border-umber-border text-umber-crimson shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-umber-crimson">نشر الدروع</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">قوة نارية بثمن سيادي</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−20 تحدٍّ</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-crimson text-umber-glow font-mono font-bold text-[8px]">+25 توتر!</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">−9.0B SP</span>
            </div>
          </button>

          {#if node.id === 'quneitra'}
            <button
              type="button"
              onclick={() => draftStore.setField('golanBorderStance', 'UN_LIAISON')}
              title="مكتب ارتباط أندوف (القنيطرة فقط): −10 توتر الجولان دون تحريك التحدي، +2 ثقة، بكلفة بعثة $8M/دور"
              class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'UN_LIAISON' ? 'bg-forest-surface border-wheat-gold text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
            >
              <div class="font-bold text-[10px] leading-tight text-wheat-gold">ارتباط أندوف</div>
              <div class="text-[8.5px] text-wheat-dark leading-snug">تهدئة زرقاء بلا تحدٍّ (القنيطرة فقط)</div>
              <div class="flex items-center gap-1 flex-wrap pt-1">
                <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−10 توتر</span>
                <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+2 ثقة</span>
                <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">−$8M/دور</span>
              </div>
            </button>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>
