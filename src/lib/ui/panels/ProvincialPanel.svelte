<script lang="ts">
  import { flip } from 'svelte/animate';
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import { BASELINE_GOVERNORATES } from '../../engine/constants';
  import type { TurnDirectives } from '../../engine/types';
  import { SYRIA_2D_GOVERNORATES } from '../../spatial3d/syria-2d-paths';
  import { isProvincialActionRelated as isProvincialActionRelatedShared } from './shared';
  import { governorateDamagePct, tierDisplay } from '../map/map-modes';
  import { fx } from '../stats/fx-bridge';
  import { openSection, isSectionOptionRelated } from '../shell/section-nav';
  import Meters from '../kit/Meters.svelte';
  import ActionRow from '../kit/ActionRow.svelte';
  import DoneRow from '../kit/DoneRow.svelte';
  import GroupDivider from '../kit/GroupDivider.svelte';
  import Stance, { type StanceOption } from '../kit/Stance.svelte';
  import SectionLink from '../kit/SectionLink.svelte';
  import FxChip from '../kit/FxChip.svelte';
  import GameIcon from '../GameIcon.svelte';
  import {
    buildFilteredDisplayRows,
    flipDuration,
    type AvailabilityTier,
  } from '../kit/reorder';

  const GOV_IDS: string[] = SYRIA_2D_GOVERNORATES.map((g) => g.id);

  function stepGovernorate(delta: number): void {
    const idx = Math.max(0, GOV_IDS.indexOf(selectedId));
    const nextIdx = (idx + delta + GOV_IDS.length) % GOV_IDS.length;
    fx('tap');
    uiStore.selectGovernorate(GOV_IDS[nextIdx]);
  }

  // Default to the capital when nothing is selected so the panel always
  // shows a governorate dossier instead of an empty placeholder.
  let selectedId = $derived($uiStore.selectedGovernorateId ?? 'damascus');
  let node = $derived(selectedId ? $gameStore.governorates[selectedId] : null);
  // Governorates that never needed demining (baseline contamination at or
  // below the deployable threshold) get no demining action at all.
  let neededDeminingFromStart = $derived(
    Number((selectedId && BASELINE_GOVERNORATES[selectedId]?.mineSaturationPct) ?? 0) > 8
  );

  let projectDetailsOpen = $state(false);
  let detailsOpen = $state(false);

  // Close project effect table when switching provinces.
  $effect(() => {
    void selectedId;
    projectDetailsOpen = false;
  });

  // Before/after stat rows for the strategic-project table (mirrors engine clamps).
  let projectEffectRows = $derived.by(() => {
    const p = node?.strategicProject;
    if (!node || !p) return [];
    const rows: { label: string; before: string; after: string; delta: string; good: boolean }[] = [];
    const f1 = (v: number) => String(Math.round(v * 10) / 10);
    const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);
    rows.push({
      label: 'الاحتقان',
      before: `${Math.round(node.prri)}`,
      after: `${Math.max(0, Math.round(node.prri + p.prriDelta))}`,
      delta: signed(p.prriDelta),
      good: p.prriDelta <= 0,
    });
    rows.push({
      label: 'التقنين سا/يوم',
      before: f1(node.dailyBlackoutHours),
      after: f1(Math.max(2, node.dailyBlackoutHours + p.blackoutHoursDelta)),
      delta: signed(p.blackoutHoursDelta),
      good: p.blackoutHoursDelta <= 0,
    });
    if (p.mineClearancePct > 0) {
      rows.push({
        label: 'الألغام %',
        before: f1(node.mineSaturationPct),
        after: f1(Math.max(0, node.mineSaturationPct - p.mineClearancePct)),
        delta: `-${p.mineClearancePct}`,
        good: true,
      });
    }
    if (p.damageRepairedUSD > 0) {
      rows.push({
        label: 'الضرر $B',
        before: (node.unrepairedDamageUSD / 1e9).toFixed(2),
        after: (Math.max(0, node.unrepairedDamageUSD - p.damageRepairedUSD) / 1e9).toFixed(2),
        delta: `-${(p.damageRepairedUSD / 1e9).toFixed(2)}`,
        good: true,
      });
    }
    if ((p.recurringRevenueSYPPerTurn ?? 0) > 0) {
      rows.push({
        label: 'إيراد متكرر/دور',
        before: '—',
        after: `+${((p.recurringRevenueSYPPerTurn ?? 0) / 1e9).toFixed(2)}B`,
        delta: '',
        good: true,
      });
    }
    if ((p.wheatImportSavingsUSD ?? 0) > 0) {
      rows.push({
        label: 'فاتورة القمح',
        before: '—',
        after: `-$${(p.wheatImportSavingsUSD ?? 0) / 1e6}M دائمة`,
        delta: '',
        good: true,
      });
    }
    if (p.sectarianAnxietyDelta) {
      rows.push({
        label: 'القلق الطائفي',
        before: `${Math.round(node.sectarianAnxiety)}`,
        after: `${Math.max(0, Math.round(node.sectarianAnxiety + (p.sectarianAnxietyDelta ?? 0)))}`,
        delta: signed(p.sectarianAnxietyDelta ?? 0),
        good: (p.sectarianAnxietyDelta ?? 0) <= 0,
      });
    }
    if (p.tribalRageDelta && node.tribalRageIndex !== undefined) {
      rows.push({
        label: 'الغضب العشائري',
        before: `${Math.round(node.tribalRageIndex)}`,
        after: `${Math.max(0, Math.round(node.tribalRageIndex + (p.tribalRageDelta ?? 0)))}`,
        delta: signed(p.tribalRageDelta ?? 0),
        good: (p.tribalRageDelta ?? 0) <= 0,
      });
    }
    if (p.golanTensionDelta && node.golanTensionIndex !== undefined) {
      rows.push({
        label: 'توتر الجولان',
        before: `${Math.round(node.golanTensionIndex)}`,
        after: `${Math.max(0, Math.min(100, node.golanTensionIndex + (p.golanTensionDelta ?? 0)))}`,
        delta: signed(p.golanTensionDelta ?? 0),
        good: (p.golanTensionDelta ?? 0) <= 0,
      });
    }
    if (p.suwaydaIntegrationBonus && node.suwaydaIntegrationIndex !== undefined) {
      rows.push({
        label: 'اندماج السويداء',
        before: `${Math.round(node.suwaydaIntegrationIndex)}`,
        after: `${Math.min(100, Math.round(node.suwaydaIntegrationIndex + (p.suwaydaIntegrationBonus ?? 0)))}`,
        delta: `+${p.suwaydaIntegrationBonus ?? 0}`,
        good: true,
      });
    }
    if (p.skilledLaborBonus) {
      rows.push({
        label: 'الكفاءات',
        before: node.skilledLaborCount.toLocaleString('en-US'),
        after: (node.skilledLaborCount + (p.skilledLaborBonus ?? 0)).toLocaleString('en-US'),
        delta: `+${(p.skilledLaborBonus ?? 0).toLocaleString('en-US')}`,
        good: true,
      });
    }
    return rows;
  });

  // Swipe left/right on the unit-card header (RTL-aware, pan-y safe).
  let swipeStartX: number | null = null;
  let swipeStartY: number | null = null;

  function onUnitPointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, select')) return;
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
  }

  function onUnitPointerUp(e: PointerEvent): void {
    if (swipeStartX === null || swipeStartY === null) return;
    const dx = e.clientX - swipeStartX;
    const dy = e.clientY - swipeStartY;
    swipeStartX = null;
    swipeStartY = null;
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const isRtl =
      typeof window !== 'undefined' &&
      getComputedStyle(e.currentTarget as HTMLElement).direction === 'rtl';
    // In RTL, swiping left (dx < 0) advances to next (+1); swiping right goes prev (-1).
    const step = isRtl ? (dx < 0 ? 1 : -1) : dx < 0 ? -1 : 1;
    stepGovernorate(step);
  }

  function onUnitPointerCancel(): void {
    swipeStartX = null;
    swipeStartY = null;
  }

  // ── Action states, affordability & locks (identical to original logic) ─────
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

  let demBlocked = $derived(canDeployDemining && !isSelectedForDemining && !canAffordDemining);
  let powerBlocked = $derived(canDeployPowerBoost && !isSelectedForPowerBoost && !canAffordPowerBoost);

  let projMine = $derived(
    node ? (isSelectedForDemining ? Math.max(0, node.mineSaturationPct - 8) : node.mineSaturationPct) : 0
  );
  let projBlackout = $derived(
    node ? (isSelectedForPowerBoost ? Math.max(2, node.dailyBlackoutHours - 4) : node.dailyBlackoutHours) : 0
  );
  let powerHrs = $derived(Number((24 - projBlackout).toFixed(1)));

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
  let populationMillions = $derived(node ? (node.population / 1_000_000).toFixed(2) : '0.00');

  let isProjectCommitted = $derived(
    Boolean(node?.strategicProject && $draftStore.provincialProjects.includes(node.strategicProject.id))
  );
  let isProjectAffordablePC = $derived(
    Boolean(node?.strategicProject && node.strategicProject.costPoliticalCapital <= $budgetStore.remainingPC)
  );
  let projectGrantUSD = $derived($budgetStore.grantAvailableUSD);
  let projectNetUSD = $derived(
    node?.strategicProject ? Math.max(0, node.strategicProject.costUSD - projectGrantUSD) : 0
  );
  let projectGrantOffsetUSD = $derived(
    node?.strategicProject ? Math.max(0, node.strategicProject.costUSD - projectNetUSD) : 0
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

  let canAffordProject = $derived(isProjectAffordablePC && isProjectAffordable);
  let projBlocked = $derived(
    Boolean(node && !node.strategicProject.isExecuted && !isProjectCommitted && !canAffordProject)
  );

  let projectLockReason = $derived.by(() => {
    if (!node?.strategicProject) return '';
    if (!isProjectAffordablePC) {
      return `رصيد سياسي غير كافٍ (${node.strategicProject.costPoliticalCapital})`;
    }
    if (!isProjectAffordableUSD) return 'ميزانية دولارية غير كافية';
    return 'سيولة الخزينة غير كافية وتتجاوز تغطية النقد الأجنبي';
  });

  function deltaChip(proj: number, cur: number): string {
    const d = Math.round(proj - cur);
    if (d === 0) return '';
    return `(${d > 0 ? '+' : ''}${d})`;
  }

  let southProj = $derived.by(() => {
    const sii = node?.suwaydaIntegrationIndex ?? 8;
    const ssp = node?.suwaydaSecessionProb ?? 24;
    let policy = $draftStore.southernPolicy;
    if (policy === 'HISTORIC_ACCORD' && $budgetStore.remainingPC < 0) policy = 'LOCAL_VOUCHERS';
    switch (policy) {
      case 'HISTORIC_ACCORD':
        return { sii: Math.min(100, sii + 18), ssp: Math.max(0, ssp - 15) };
      case 'UNCONDITIONAL_AID':
        return { sii: Math.min(55, sii + 3), ssp: Math.max(0, ssp - 10) };
      case 'BLOCKADE':
        return { sii: Math.max(8, Math.floor(sii / 2)), ssp: Math.min(100, ssp + 30) };
      default:
        return { sii: Math.min(65, sii + 4), ssp: Math.max(0, ssp - 5) };
    }
  });

  const SOUTHERN_OPTIONS: StanceOption[] = [
    {
      value: 'HISTORIC_ACCORD',
      label: 'الوفاق التاريخي',
      title:
        'وفاق السهل والجبل: +18 اندماج، −15 انفصال، −25 غضب عشائري، −5 توتر الجولان، تهدئة السويداء ودرعا، +6 ثقة — بكلفة 4 رصيد سياسي/دور (عند النفاد يتراجع تلقائياً للقسائم)',
      chips: [
        { text: '+18 اندماج', tone: 'good' },
        { text: '−15 انفصال', tone: 'good' },
        { text: '−25 غضب', tone: 'good' },
        { text: '+6 ثقة', tone: 'good' },
        { text: '−4 سياسي/دور', tone: 'bad' },
      ],
    },
    {
      value: 'LOCAL_VOUCHERS',
      label: 'قسائم الإغاثة',
      title:
        'دعم مقنن وهدنة هادئة: +4 اندماج (بسقف 65 — لا يوصل للوفاق الكامل)، −5 انفصال (الوضع الافتراضي، دون كلفة)',
      chips: [
        { text: '+4 اندماج', tone: 'warn' },
        { text: '−5 انفصال', tone: 'good' },
        { text: 'دون كلفة', tone: 'neutral' },
      ],
    },
    {
      value: 'UNCONDITIONAL_AID',
      label: 'مساعدات مفتوحة',
      title:
        'مساعدات مفتوحة: −10 انفصال لكن +20 غضب عشائري في اللجاة (مكاسب محدودة بسقف +55 اندماج)',
      chips: [
        { text: '−10 انفصال', tone: 'good' },
        { text: '+20 غضب البدو', tone: 'bad' },
      ],
    },
    {
      value: 'BLOCKADE',
      label: 'الحصار الأمني',
      title:
        'الحصار الأمني: +30 انفصال، تصفير نصف مكاسب الاندماج المتراكمة، +10 توتر الجولان، تمرد مسلح في السويداء ودرعا، −10 ثقة شعبية',
      chips: [
        { text: '+30 انفصال', tone: 'bad' },
        { text: '÷2 اندماج', tone: 'bad' },
        { text: 'تمرد −10 ثقة', tone: 'bad' },
      ],
    },
  ];

  type ProvincialPendingKey = 'project' | 'demining' | 'power' | 'southernPolicy';

  interface ProvincialPendingEntry {
    key: ProvincialPendingKey;
    tier: AvailabilityTier;
  }

  let pendingEntries = $derived.by<ProvincialPendingEntry[]>(() => {
    const items: ProvincialPendingEntry[] = [];
    if (node && !node.strategicProject.isExecuted && !isProjectCommitted) {
      items.push({ key: 'project', tier: projBlocked ? 1 : 0 });
    }
    if (neededDeminingFromStart && canDeployDemining && !isSelectedForDemining) {
      items.push({ key: 'demining', tier: demBlocked ? 1 : 0 });
    }
    if (canDeployPowerBoost && !isSelectedForPowerBoost) {
      items.push({ key: 'power', tier: powerBlocked ? 1 : 0 });
    }
    if (node?.id === 'as_suwayda') {
      items.push({ key: 'southernPolicy', tier: 0 });
    }
    return items;
  });

  let pendingDisplayRows = $derived(
    buildFilteredDisplayRows(
      pendingEntries,
      selectedStat,
      (entry) => entry.key,
      (entry) => isSectionOptionRelated(selectedStat, entry.key),
      (entry) => entry.tier
    )
  );

  // Count of actions activated THIS turn (removable under "مفعّل هذا الدور · N").
  let doneThisTurnCount = $derived(
    (isProjectCommitted ? 1 : 0) +
      (neededDeminingFromStart && canDeployDemining && isSelectedForDemining ? 1 : 0) +
      (canDeployPowerBoost && isSelectedForPowerBoost ? 1 : 0)
  );

  // Already-enacted / completed states from prior turns or baseline stability.
  let hasCompletedRows = $derived(
    Boolean(
      node &&
        (node.strategicProject.isExecuted ||
          (neededDeminingFromStart && !canDeployDemining) ||
          !canDeployPowerBoost)
    )
  );

  let meterItems = $derived.by(() => {
    if (!node) return [];
    const unrest = Math.round(node.prri);
    return [
      {
        label: 'الاحتقان',
        value: String(unrest),
        tone: (unrest >= 65 ? 'neg' : 'default') as 'neg' | 'default',
        barPct: Math.min(100, Math.max(0, unrest)),
        barTone: (unrest >= 65 ? 'neg' : 'accent') as 'neg' | 'accent',
      },
      {
        label: 'الكهرباء',
        value: String(powerHrs),
        unit: 'س',
        tone: (isSelectedForPowerBoost ? 'pos' : 'default') as 'pos' | 'default',
        barPct: Math.min(100, (powerHrs / 24) * 100),
        barTone: (isSelectedForPowerBoost ? 'pos' : 'accent') as 'pos' | 'accent',
      },
      {
        label: 'الأضرار',
        value: `${damagePct}%`,
        tone: (damagePct > 40 ? 'neg' : 'default') as 'neg' | 'default',
        barPct: damagePct,
        barTone: (damagePct > 40 ? 'neg' : 'accent') as 'neg' | 'accent',
      },
      {
        label: 'الألغام',
        value: `${Math.round(projMine)}%`,
        tone: (projMine > 35 ? 'neg' : 'default') as 'neg' | 'default',
        barPct: Math.min(100, projMine),
        barTone: (projMine > 35 ? 'neg' : 'accent') as 'neg' | 'accent',
      },
    ];
  });
</script>

<div class="pd-root flex flex-col pb-2">
  {#if node}
    <!-- 1. PINNED HEADER ROW: prev / province name + status · rank · population / next -->
    <div
      role="group"
      aria-label="التنقل بين المحافظات"
      class="sticky top-0 z-20 -mx-[var(--sheet-px,16px)] phone-p:-mx-3 phone-l:-mx-3 flex items-center gap-2 border-b border-[var(--c-line)] bg-[var(--c-bg)] px-[var(--sheet-px,16px)] phone-p:px-3 phone-l:px-3 py-2 touch-pan-y phone-l:py-1.5"
      onpointerdown={onUnitPointerDown}
      onpointerup={onUnitPointerUp}
      onpointercancel={onUnitPointerCancel}
    >
      <button
        type="button"
        onclick={() => stepGovernorate(-1)}
        aria-label="المحافظة السابقة"
        title="المحافظة السابقة"
        class="pressable flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-line-strong)] hover:text-[var(--c-text)]"
      >
        <GameIcon name="chevron-right" cls="h-4 w-4 shrink-0" />
      </button>

      <div class="relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] px-2 py-1 text-center">
        <div class="flex max-w-full items-center gap-1">
          <h3 class="truncate text-[16px] font-bold leading-[1.35] text-[var(--c-text)]">
            {node.nameAr}
          </h3>
          <GameIcon name="chevron-down" cls="h-3.5 w-3.5 shrink-0 text-[var(--c-muted)]" />
        </div>
        <div class="truncate text-[11px] leading-[1.35] text-[var(--c-muted)]">
          <span class="font-bold" style="color:{tier.tone};">{tier.labelAr}</span>
          <span> · الترتيب </span>
          <span dir="ltr" class="num font-bold text-[var(--c-text-2)]">{govRank}/14</span>
          <span> · </span>
          <span dir="ltr" class="num font-bold text-[var(--c-text-2)]">{populationMillions}M</span>
          <span> نسمة</span>
        </div>

        <select
          aria-label="اختيار المحافظة"
          value={selectedId}
          onchange={(e) => {
            fx('tap');
            uiStore.selectGovernorate(e.currentTarget.value);
          }}
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {#each GOV_IDS as gid}
            {@const gNode = $gameStore.governorates[gid]}
            {#if gNode}
              <option value={gid} class="bg-[var(--c-panel)] text-[var(--c-text)]">{gNode.nameAr}</option>
            {/if}
          {/each}
        </select>
      </div>

      <button
        type="button"
        onclick={() => stepGovernorate(1)}
        aria-label="المحافظة التالية"
        title="المحافظة التالية"
        class="pressable flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-line-strong)] hover:text-[var(--c-text)]"
      >
        <GameIcon name="chevron-left" cls="h-4 w-4 shrink-0" />
      </button>
    </div>

    <!-- 2. RULED 4-FIGURE METERS STRIP (unrest, electricity, damage %, mines %) -->
    <Meters items={meterItems} columns={4} flush />

    <div class="flex flex-col gap-2 pt-2">
    <!-- 3. RELATED / AVAILABLE ACTIONS FIRST, THEN UNRELATED / LOCKED ACTIONS -->
    <div class="flex flex-col gap-2">
      {#if pendingEntries.length === 0 && node.id !== 'daraa' && node.id !== 'quneitra'}
        <div class="border border-dashed border-[var(--c-line)] px-3 py-2.5 text-center text-[12px] text-[var(--c-muted)]">
          لا توجد إجراءات معلقة في هذه المحافظة هذا الدور.
        </div>
      {/if}

      {#each pendingDisplayRows as row (row.key)}
        <div animate:flip={{ duration: flipDuration() }} class="flex flex-col">
          {#if row.kind === 'divider'}
            <GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />
          {:else if row.item.key === 'project'}
            <div class="pd-project-row flex flex-col">
              <ActionRow
                title={node.strategicProject.titleAr}
                description={node.strategicProject.effectDescriptionAr}
                cost={projectGrantOffsetUSD > 0
                  ? `-$${projectNetUSD / 1_000_000}M`
                  : `-$${node.strategicProject.costUSD / 1_000_000}M`}
                costTone="neg"
                buttonLabel={isProjectCoveredByFX ? 'تفعيل (نقد أجنبي)' : 'تفعيل'}
                locked={projBlocked}
                lockReason={projectLockReason}
                dimmed={!row.related}
                onclick={() => {
                  if (!node?.strategicProject) return;
                  if (!canAffordProject) {
                    fx('error');
                    return;
                  }
                  fx('confirm');
                  draftStore.toggleProvincialProject(node.strategicProject.id);
                }}
              >
                {#snippet chips()}
                  <FxChip
                    text={`-${(node.strategicProject.costSYP / 1_000_000_000).toFixed(2)}B ل.س`}
                    tone="bad"
                  />
                  {#if projectGrantOffsetUSD > 0}
                    <FxChip
                      text={`منحة خليجية -$${projectGrantOffsetUSD / 1_000_000}M`}
                      tone="good"
                    />
                  {/if}
                  {#if node.strategicProject.costPoliticalCapital > 0}
                    <FxChip
                      text={`-${node.strategicProject.costPoliticalCapital} رصيد`}
                      tone="warn"
                    />
                  {/if}
                  {#if isProjectCoveredByFX}
                    <FxChip text="مغطى بالنقد الأجنبي" tone="good" />
                  {/if}
                {/snippet}
                {#snippet meta()}
                  <button
                    type="button"
                    onclick={() => {
                      fx('tap');
                      projectDetailsOpen = !projectDetailsOpen;
                    }}
                    aria-expanded={projectDetailsOpen}
                    class="mt-1 inline-flex min-h-[28px] phone-p:min-h-11 phone-l:min-h-11 items-center gap-1 self-start bg-transparent border-0 px-0 py-0.5 text-[11.5px] font-bold text-[var(--c-muted)] hover:text-[var(--c-accent)] cursor-pointer"
                  >
                    <span>تفاصيل وجدول الأثر</span>
                    <GameIcon name={projectDetailsOpen ? 'chevron-up' : 'chevron-down'} cls="h-3.5 w-3.5 shrink-0" />
                  </button>
                {/snippet}
              </ActionRow>

              {#if projectDetailsOpen}
                <div class="border border-t-0 border-[var(--c-line)] bg-[var(--c-strip)] p-2.5 space-y-2">
                  <p class="text-[12px] leading-[1.45] text-[var(--c-muted)]">
                    {node.strategicProject.issueDescriptionAr}
                  </p>
                  <p class="text-[12px] leading-[1.45] text-[var(--c-text-2)]">
                    {node.strategicProject.solutionDescriptionAr}
                  </p>
                  <div class="border border-[var(--c-line)] bg-[var(--c-panel)]">
                    <div class="grid grid-cols-[1fr_auto_auto] gap-2 bg-[var(--c-strip)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--c-muted)]">
                      <span>البند</span>
                      <span class="num">قبل</span>
                      <span class="num">بعد</span>
                    </div>
                    {#each projectEffectRows as eRow}
                      <div class="grid grid-cols-[1fr_auto_auto] items-baseline gap-2 border-t border-[var(--c-line)] px-2.5 py-1 text-[12px]">
                        <span class="text-[var(--c-text)]">{eRow.label}</span>
                        <span dir="ltr" class="num text-[var(--c-muted)]">{eRow.before}</span>
                        <span dir="ltr" class="num font-bold {eRow.good ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]'}">
                          {eRow.after}{#if eRow.delta} <span class="text-[11px]">({eRow.delta})</span>{/if}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else if row.item.key === 'demining'}
            <ActionRow
              title="أولوية إزالة الألغام"
              description="تطهير الحقول الزراعية ومحاور الطرق من المخلفات المتفجرة"
              cost="-$20M"
              costTone="neg"
              buttonLabel="تفعيل"
              locked={demBlocked}
              lockReason="ميزانية غير كافية ($20M / 8.0B SP)"
              dimmed={!row.related}
              onclick={() => {
                if (selectedId && canAffordDemining) {
                  fx('confirm');
                  draftStore.setField('deminingPriorityId', selectedId);
                } else {
                  fx('error');
                }
              }}
            >
              {#snippet chips()}
                <FxChip text="-8.0B ل.س" tone="bad" />
                <FxChip text="-8% تلوث" tone="good" />
                {#if isDeminingCoveredByFX}
                  <FxChip text="مغطى بالنقد الأجنبي" tone="good" />
                {/if}
              {/snippet}
            </ActionRow>
          {:else if row.item.key === 'power'}
            <ActionRow
              title="تعزيز الكهرباء"
              description="محولات طوارئ وصيانة خطوط التوتر وتهدئة (-6)"
              cost="-$10M"
              costTone="neg"
              buttonLabel="تفعيل"
              locked={powerBlocked}
              lockReason="ميزانية غير كافية ($10M / 3.0B SP)"
              dimmed={!row.related}
              onclick={() => {
                if (selectedId && canDeployPowerBoost && canAffordPowerBoost) {
                  fx('confirm');
                  draftStore.setField('powerBoostGovId', selectedId);
                } else {
                  fx('error');
                }
              }}
            >
              {#snippet chips()}
                <FxChip text="-3.0B ل.س" tone="bad" />
                <FxChip text="+4س تغذية" tone="good" />
                {#if isPowerBoostCoveredByFX}
                  <FxChip text="مغطى بالنقد الأجنبي" tone="good" />
                {/if}
              {/snippet}
            </ActionRow>
          {:else if row.item.key === 'southernPolicy'}
            <div class="south-stance">
              <Stance
                title="توجيه سياسة الجبهة الجنوبية"
                value={$draftStore.southernPolicy}
                options={SOUTHERN_OPTIONS}
                columns={2}
                lockNote={$draftStore.southernPolicy === 'HISTORIC_ACCORD' && $budgetStore.remainingPC < 0
                  ? 'رصيد سياسي سالب: سيتراجع الوفاق تلقائياً إلى قسائم الإغاثة عند تنفيذ الدور'
                  : ''}
                dimmed={!row.related}
                onchange={(v) => {
                  draftStore.setField('southernPolicy', v as TurnDirectives['southernPolicy']);
                }}
              >
                {#snippet footer()}
                  <div class="space-y-1.5 border-t border-[var(--c-line)] pt-2">
                    <div class="flex items-center gap-2 text-[11px]">
                      <span class="w-12 shrink-0 text-[var(--c-muted)]">اندماج</span>
                      <div class="relative h-2 flex-1 bg-[var(--c-track)]" title="عتبة الوفاق: 80">
                        <div
                          class="absolute inset-y-0 bg-[var(--c-pos)]"
                          style="inset-inline-start:0;width:{Math.min(100, southProj.sii)}%;"
                        ></div>
                        <div class="absolute -inset-y-0.5 w-px bg-[var(--c-accent)]" style="inset-inline-start:80%;" title="عتبة الوفاق: 80"></div>
                      </div>
                      <span dir="ltr" class="num min-w-12 text-end font-bold text-[var(--c-pos)]">
                        {southProj.sii}{#if deltaChip(southProj.sii, node.suwaydaIntegrationIndex ?? 0)} <span class="text-[var(--c-accent)]">{deltaChip(southProj.sii, node.suwaydaIntegrationIndex ?? 0)}</span>{/if}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-[11px]">
                      <span class="w-12 shrink-0 text-[var(--c-muted)]">انفصال</span>
                      <div class="relative h-2 flex-1 bg-[var(--c-track)]" title="الكانتونات: 60 — البلقنة: 85">
                        <div
                          class="absolute inset-y-0 bg-[var(--c-neg)]"
                          style="inset-inline-start:0;width:{Math.min(100, southProj.ssp)}%;"
                        ></div>
                        <div class="absolute -inset-y-0.5 w-px bg-[var(--c-accent)]" style="inset-inline-start:60%;" title="الكانتونات: 60"></div>
                        <div class="absolute -inset-y-0.5 w-px bg-[var(--c-neg)]" style="inset-inline-start:85%;" title="البلقنة: 85"></div>
                      </div>
                      <span dir="ltr" class="num min-w-12 text-end font-bold text-[var(--c-neg)]">
                        {southProj.ssp}{#if deltaChip(southProj.ssp, node.suwaydaSecessionProb ?? 0)} <span class="text-[var(--c-accent)]">{deltaChip(southProj.ssp, node.suwaydaSecessionProb ?? 0)}</span>{/if}
                      </span>
                    </div>
                  </div>
                {/snippet}
              </Stance>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Golan border stance moved to الحكم › المواقف; show one-line SectionLink in Daraa & Quneitra -->
      {#if node.id === 'daraa' || node.id === 'quneitra'}
        <SectionLink
          label="الموقف على جبهة الجولان"
          destination="الحكم › المواقف"
          onclick={() => openSection('decrees', 'stances')}
        />
      {/if}
    </div>

    <!-- 4. DONE RULE: actions activated THIS turn sink to bottom under "مفعّل هذا الدور · N" -->
    {#if doneThisTurnCount > 0}
      <GroupDivider label="مفعّل هذا الدور" count={doneThisTurnCount} />
      <div class="flex flex-col gap-1.5">
        {#if isProjectCommitted}
          <DoneRow
            title={node.strategicProject.titleAr}
            cost={projectGrantOffsetUSD > 0
              ? `-$${projectNetUSD / 1_000_000}M`
              : `-$${node.strategicProject.costUSD / 1_000_000}M`}
            dimmed={Boolean(selectedStat && !isProvincialActionRelated('project'))}
            onremove={() => draftStore.toggleProvincialProject(node.strategicProject.id)}
          />
        {/if}

        {#if neededDeminingFromStart && canDeployDemining && isSelectedForDemining}
          <DoneRow
            title="أولوية إزالة الألغام"
            cost="-$20M · -8.0B"
            dimmed={Boolean(selectedStat && !isProvincialActionRelated('demining'))}
            onremove={() => draftStore.setField('deminingPriorityId', null)}
          />
        {/if}

        {#if canDeployPowerBoost && isSelectedForPowerBoost}
          <DoneRow
            title="تعزيز الكهرباء"
            cost="-$10M · -3.0B"
            dimmed={Boolean(selectedStat && !isProvincialActionRelated('power'))}
            onremove={() => draftStore.setField('powerBoostGovId', null)}
          />
        {/if}
      </div>
    {/if}

    <!-- Already enacted / resolved in prior turns -->
    {#if hasCompletedRows}
      <GroupDivider label="منفّذ ومستقر" />
      <div class="flex flex-col gap-1.5">
        {#if node.strategicProject.isExecuted}
          <DoneRow
            title={node.strategicProject.titleAr}
            statusLabel="منفّذ"
            removable={false}
            dimmed={Boolean(selectedStat && !isProvincialActionRelated('project'))}
          />
        {/if}

        {#if neededDeminingFromStart && !canDeployDemining}
          <DoneRow
            title="تم نزع النسبة الأكبر من الألغام واعتبار المشكلة محلولة"
            statusLabel="محلولة"
            removable={false}
            dimmed={Boolean(selectedStat && !isProvincialActionRelated('demining'))}
          />
        {/if}

        {#if !canDeployPowerBoost}
          <DoneRow
            title="التغذية الكهربائية مستقرة"
            statusLabel="مستقرة"
            removable={false}
            dimmed={Boolean(selectedStat && !isProvincialActionRelated('power'))}
          />
        {/if}
      </div>
    {/if}

    <!-- 5. COLLAPSIBLE SECONDARY DETAILS SECTION ("التفاصيل والسجل") -->
    <section class="border border-[var(--c-line)] bg-[var(--c-strip)]">
      <button
        type="button"
        onclick={() => {
          detailsOpen = !detailsOpen;
          fx('tap');
        }}
        aria-expanded={detailsOpen}
        class="pressable flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-start hover:bg-[var(--c-panel)]"
      >
        <span class="text-[12px] font-bold text-[var(--c-text-2)]">التفاصيل والسجل</span>
        <span class="flex items-center gap-2 text-[11px] text-[var(--c-muted)]">
          <span class="num" dir="ltr">#{govRank}/14 · {populationMillions}M</span>
          <GameIcon name={detailsOpen ? 'chevron-up' : 'chevron-down'} cls="h-3.5 w-3.5 shrink-0 text-[var(--c-text-2)]" />
        </span>
      </button>

      {#if detailsOpen}
        <dl class="border-t border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-1 text-[12px]">
          <div class="flex items-baseline justify-between gap-2 py-1.5">
            <dt class="text-[var(--c-muted)]">الترتيب الوطني</dt>
            <dd class="num font-bold text-[var(--c-text)]">#{govRank} من 14</dd>
          </div>
          <div class="flex items-baseline justify-between gap-2 border-t border-[var(--c-line)] py-1.5">
            <dt class="text-[var(--c-muted)]">فجوة عن المتوسط الوطني</dt>
            <dd dir="ltr" class="num font-bold {gapFromAverage > 0 ? 'text-[var(--c-neg)]' : 'text-[var(--c-pos)]'}">
              {gapFromAverage > 0 ? '+' : ''}{gapFromAverage} نقطة
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-2 border-t border-[var(--c-line)] py-1.5">
            <dt class="text-[var(--c-muted)]">السكان</dt>
            <dd dir="ltr" class="num font-bold text-[var(--c-text)]">{populationMillions}M نسمة</dd>
          </div>
          <div class="flex items-baseline justify-between gap-2 border-t border-[var(--c-line)] py-1.5">
            <dt class="text-[var(--c-muted)]">المشافي العاملة</dt>
            <dd dir="ltr" class="num font-bold text-[var(--c-text)]">{Math.round(node.activeHospitalsPct)}%</dd>
          </div>
          <div class="flex items-baseline justify-between gap-2 border-t border-[var(--c-line)] py-1.5">
            <dt class="text-[var(--c-muted)]">الضرر غير المُصلح</dt>
            <dd dir="ltr" class="num font-bold text-[var(--c-neg)]">
              ${(node.unrepairedDamageUSD / 1_000_000_000).toFixed(2)}B
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-2 border-t border-[var(--c-line)] py-1.5">
            <dt class="text-[var(--c-muted)]">أصول قبل الحرب</dt>
            <dd dir="ltr" class="num font-bold text-[var(--c-text)]">
              ${(node.totalCapitalUSD / 1_000_000_000).toFixed(1)}B
            </dd>
          </div>
          <div class="flex items-baseline justify-between gap-2 border-t border-[var(--c-line)] py-1.5">
            <dt class="text-[var(--c-muted)]">القلق الطائفي</dt>
            <dd dir="ltr" class="num font-bold text-[var(--c-text-2)]">{Math.round(node.sectarianAnxiety)}/100</dd>
          </div>
          <div class="flex items-baseline justify-between gap-2 border-t border-[var(--c-line)] py-1.5">
            <dt class="text-[var(--c-muted)]">الكفاءات المتاحة</dt>
            <dd dir="ltr" class="num font-bold text-[var(--c-text)]">{node.skilledLaborCount.toLocaleString('en-US')}</dd>
          </div>
        </dl>
        <div class="border-t border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-2">
          <div class="text-[11px] font-bold text-[var(--c-accent)]">المشروع الاستراتيجي</div>
          <div class="mt-0.5 text-[12px] font-bold text-[var(--c-text)]">
            {node.strategicProject.titleAr}
          </div>
          <p class="mt-0.5 text-[12px] leading-[1.45] text-[var(--c-muted)]">
            {node.strategicProject.issueDescriptionAr}
          </p>
        </div>
      {/if}
    </section>
    </div>
  {:else}
    <div class="mt-3 border border-[var(--c-line)] bg-[var(--c-panel)] p-4 text-center text-[12px] text-[var(--c-muted)]">
      اختر محافظة من الخريطة أو من القائمة أعلاه.
    </div>
  {/if}
</div>

<style>
  .south-stance :global(.seg > button:nth-child(n + 3)) {
    border-top: 1px solid var(--c-line-strong);
  }
  .south-stance :global(.seg > button:nth-child(3)) {
    border-inline-start: 0;
  }
  .pd-project-row :global(.act-body small) {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
