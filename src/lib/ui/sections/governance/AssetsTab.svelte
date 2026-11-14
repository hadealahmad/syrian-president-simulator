<script lang="ts">
  import { gameStore } from '../../../stores/game-store';
  import { draftStore, budgetStore } from '../../../stores/draft-store';
  import { uiStore } from '../../../stores/ui-store';
  import GameIcon from '../../GameIcon.svelte';
  import LockIcon from '../../controls/LockIcon.svelte';
  import ActionCard from '../../kit/ActionCard.svelte';
  import DoneRow from '../../kit/DoneRow.svelte';
  import FxChip from '../../kit/FxChip.svelte';
  import GroupDivider from '../../kit/GroupDivider.svelte';
  import HourglassIcon from '../../kit/HourglassIcon.svelte';
  import { fx } from '../../fx/feedback';
  import {
    ASSET_STATUS_AR,
    formatBillion,
    formatM,
    pcShortageText,
  } from '../../panels/shared';
  import { isSectionOptionRelated } from '../../shell/section-nav';
  import {
    getOligarchLiquidationPCCost,
    getOligarchNationalizePCEarned,
    getOligarchSettlementPCCost,
    getOligarchTerms,
  } from '../../../engine/oligarch-helpers';
  import type { OligarchPolicyAction } from '../../../engine/types';

  const DECISION_LABEL_AR: Record<OligarchPolicyAction, string> = {
    SETTLEMENT_80_20: 'تسوية 80/20',
    NATIONALIZE_SOE: 'تأميم حكومي',
    FOREIGN_LIQUIDATION: 'تصفية خارجية',
  };

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let unlockedTurn = $derived(($gameStore.turnNumber ?? 1) > 2);
  let expandedDoneIds = $state<Record<string, boolean>>({});

  let allAssets = $derived(Object.values($gameStore.confiscatedAssets));
  let pendingCount = $derived(allAssets.filter((a) => a.status === 'PENDING').length);
  let doneCount = $derived(allAssets.length - pendingCount);
  let draftDecisionsCount = $derived(Object.keys($draftStore.oligarchDecisions || {}).length);
  let allProcessed = $derived(allAssets.length > 0 && pendingCount === 0);

  let undecidedPendingAssets = $derived(
    allAssets.filter((a) => a.status === 'PENDING' && !$draftStore.oligarchDecisions[a.id])
  );
  let decidedThisTurnAssets = $derived(
    allAssets.filter((a) => a.status === 'PENDING' && Boolean($draftStore.oligarchDecisions[a.id]))
  );
  let processedAssets = $derived(allAssets.filter((a) => a.status !== 'PENDING'));

  let isRelated = $derived(selectedStat ? isSectionOptionRelated(selectedStat, 'oligarchs') : true);

  function openReviewShortcut(): void {
    fx('tap');
    uiStore.closeActivePanel();
    uiStore.setAlertsOpen(false);
    uiStore.setTurnFlowStage('review');
  }

  function toggleDoneDetails(id: string): void {
    expandedDoneIds = { ...expandedDoneIds, [id]: !expandedDoneIds[id] };
  }

  function decisionSummaryCost(assetId: string, decision: OligarchPolicyAction): string {
    const asset = allAssets.find((a) => a.id === assetId);
    if (!asset) return '';
    const terms = getOligarchTerms(asset);
    if (decision === 'SETTLEMENT_80_20') {
      return `+$${formatM(terms.settlementUSD)}M`;
    }
    if (decision === 'NATIONALIZE_SOE') {
      return `+${formatBillion(terms.nationalizedSYPPerTurn)}B`;
    }
    return `+$${formatM(terms.liquidationUSD)}M`;
  }
</script>

<div class="flex flex-col gap-2">
  <!-- Summary header strip -->
  <div class="flex flex-wrap items-center justify-between gap-2 border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-2">
    <span class="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--c-text)]">
      <GameIcon name="open-treasure-chest" cls="h-4 w-4 shrink-0 text-[var(--c-text-2)]" />
      <span>ثروات الحرب والمساءلة</span>
    </span>
    <span class="oc-kit-num flex items-center gap-1.5 text-[11px]">
      <span class="border border-[var(--c-line)] bg-[var(--c-strip)] px-2 py-0.5 font-bold text-[var(--c-text-2)]">
        {pendingCount} معلّق
      </span>
      <span class="border border-[var(--c-line)] bg-[var(--c-strip)] px-2 py-0.5 font-bold text-[var(--c-muted)]">
        {doneCount} مُعالج
      </span>
    </span>
  </div>

  <!-- Turn <= 2 future-availability notice (NOT YET AVAILABLE: dotted border + HourglassIcon) -->
  {#if !unlockedTurn}
    <div class="flex items-center justify-between gap-2 border border-dotted border-[var(--c-line-strong)] bg-[var(--c-strip)] px-3 py-2 text-[11.5px] text-[var(--c-muted)]">
      <span class="flex items-center gap-1.5 text-[var(--c-muted)]">
        <HourglassIcon cls="h-3.5 w-3.5 shrink-0" />
        <span>تُفتح الأصول في الدور الثالث · يُفتح في الدور 3</span>
      </span>
      <span class="oc-kit-num text-[11px] text-[var(--c-muted)]">
        الدور {$gameStore.turnNumber ?? 1}/3
      </span>
    </div>
  {/if}

  <!-- Review shortcut once all assets are processed (or draft decisions queued) -->
  {#if allProcessed || draftDecisionsCount > 0}
    <button
      type="button"
      onclick={openReviewShortcut}
      class="kit-btn sec w-full justify-between"
    >
      <span class="flex items-center gap-1.5">
        <GameIcon name="checked-shield" cls="h-4 w-4 shrink-0" />
        <span>{allProcessed ? 'الأصول — مراجعة القرارات' : `مراجعة القرارات (${draftDecisionsCount})`}</span>
      </span>
      <GameIcon name="arrow-right" cls="h-4 w-4 shrink-0 rotate-180" />
    </button>
  {/if}

  <!-- Pending undecided assets -->
  {#if undecidedPendingAssets.length > 0}
    {#if selectedStat && !isRelated}
      <GroupDivider label="غير مرتبط بهذا المؤشر" count={undecidedPendingAssets.length} />
    {/if}
    <div class={undecidedPendingAssets.length > 1 ? 'oc-grid-2-wide' : 'flex flex-col gap-2'}>
      {#each undecidedPendingAssets as asset (asset.id)}
        {@const terms = getOligarchTerms(asset)}
        {@const settlementIncomeUSD = terms.settlementUSD}
        {@const liquidationIncomeUSD = terms.liquidationUSD}
        {@const settlementPCCost = getOligarchSettlementPCCost(asset.valuationUSD)}
        {@const liquidationPCCost = getOligarchLiquidationPCCost(asset.valuationUSD)}
        {@const nationalizePCEarned = getOligarchNationalizePCEarned(asset.valuationUSD)}
        {@const canAffordSettlement = $budgetStore.remainingPC >= settlementPCCost}
        {@const canAffordLiquidation = $budgetStore.remainingPC >= liquidationPCCost}
        {@const canSettle = unlockedTurn && canAffordSettlement}
        {@const canNationalize = unlockedTurn}
        {@const canLiquidate = unlockedTurn && canAffordLiquidation}
        {@const settlementShortPC = Math.max(0, Math.ceil(settlementPCCost - $budgetStore.remainingPC))}
        {@const liquidationShortPC = Math.max(0, Math.ceil(liquidationPCCost - $budgetStore.remainingPC))}

        <ActionCard
          tag={ASSET_STATUS_AR.PENDING}
          title={asset.titleAr}
          notYetAvailable={!unlockedTurn}
          dimmed={Boolean(selectedStat) && !isRelated}
        >
          {#snippet badge()}
            <div class="shrink-0 text-end">
              <div class="oc-kit-num text-[17px] font-bold leading-none text-[var(--c-text)]" dir="ltr">
                ${formatM(asset.valuationUSD)}M
              </div>
              <div class="mt-0.5 text-[11px] text-[var(--c-muted)]">القيمة التقديرية</div>
            </div>
          {/snippet}

          {#snippet actions()}
            <div class="grid grid-cols-3 gap-1.5">
              <!-- Option 1: 80/20 Settlement -->
              <div
                class="min-w-0"
                role="presentation"
                onpointerdown={() => {
                  if (!canSettle) fx('error');
                }}
              >
                <button
                  type="button"
                  disabled={!canSettle}
                  onclick={() => {
                    if (canSettle) {
                      fx('select');
                      draftStore.setOligarchDecision(asset.id, 'SETTLEMENT_80_20');
                    } else {
                      fx('error');
                    }
                  }}
                  aria-label="تسوية 80/20"
                  title={!unlockedTurn
                    ? 'تُفتح الأصول في الدور الثالث'
                    : canAffordSettlement
                      ? `تسوية 80/20: تحصيل 80% كاش (+$${formatM(settlementIncomeUSD)}M)، كلفة ${settlementPCCost} رصيد سياسي، +2 ثقة`
                      : pcShortageText(settlementPCCost, $budgetStore.remainingPC)}
                  class="kit-btn !h-auto !min-h-11 !px-1 !py-1.5 w-full flex-col !gap-0.5 !leading-tight !whitespace-normal {canSettle
                    ? 'sec'
                    : !unlockedTurn
                      ? 'soon'
                      : 'lock'}"
                >
                  <span class="flex items-center justify-center gap-0.5 text-[11px] font-bold leading-[1.3]">
                    {#if !unlockedTurn}
                      <HourglassIcon cls="h-3 w-3 shrink-0" />
                    {:else if !canAffordSettlement}
                      <LockIcon cls="h-3 w-3 shrink-0" />
                    {/if}
                    <span>تسوية 80/20</span>
                  </span>
                  <span class="oc-kit-num text-[11px] font-bold leading-[1.35] text-[var(--c-pos)]" dir="ltr">
                    +${formatM(settlementIncomeUSD)}M
                  </span>
                  {#if !unlockedTurn}
                    <span class="oc-kit-num text-[11px] leading-[1.35] text-[var(--c-muted)]">
                      يُفتح في الدور 3
                    </span>
                  {:else if !canAffordSettlement}
                    <span class="oc-kit-num text-[11px] font-bold leading-[1.35] text-[var(--c-neg)]">
                      نقص {settlementShortPC} رصيد
                    </span>
                  {:else}
                    <span class="oc-kit-num text-[11px] leading-[1.35] text-[var(--c-neg)]">
                      <bdi dir="ltr">−{settlementPCCost}</bdi> رصيد
                    </span>
                  {/if}
                </button>
              </div>

              <!-- Option 2: Nationalize SOE -->
              <div
                class="min-w-0"
                role="presentation"
                onpointerdown={() => {
                  if (!canNationalize) fx('error');
                }}
              >
                <button
                  type="button"
                  disabled={!canNationalize}
                  onclick={() => {
                    if (canNationalize) {
                      fx('select');
                      draftStore.setOligarchDecision(asset.id, 'NATIONALIZE_SOE');
                    } else {
                      fx('error');
                    }
                  }}
                  aria-label="تأميم حكومي"
                  title={!unlockedTurn
                    ? 'تُفتح الأصول في الدور الثالث'
                    : `تأميم حكومي: ضم الأصل لشركات الدولة، كسب +${nationalizePCEarned} رصيد سياسي، +${formatBillion(terms.nationalizedSYPPerTurn)}B SP/دور، +8000 موظف، +5 فساد`}
                  class="kit-btn !h-auto !min-h-11 !px-1 !py-1.5 w-full flex-col !gap-0.5 !leading-tight !whitespace-normal {canNationalize
                    ? 'sec'
                    : 'soon'}"
                >
                  <span class="flex items-center justify-center gap-0.5 text-[11px] font-bold leading-[1.3]">
                    {#if !canNationalize}
                      <HourglassIcon cls="h-3 w-3 shrink-0" />
                    {/if}
                    <span>تأميم حكومي</span>
                  </span>
                  <span class="oc-kit-num text-[11px] font-bold leading-[1.35] text-[var(--c-pos)]">
                    <bdi dir="ltr">+{nationalizePCEarned}</bdi> رصيد
                  </span>
                  {#if !unlockedTurn}
                    <span class="oc-kit-num text-[11px] leading-[1.35] text-[var(--c-muted)]">
                      يُفتح في الدور 3
                    </span>
                  {:else}
                    <span class="oc-kit-num text-[11px] leading-[1.35] text-[var(--c-muted)]">
                      <bdi dir="ltr">+{formatBillion(terms.nationalizedSYPPerTurn)}B</bdi>/دور
                    </span>
                  {/if}
                </button>
              </div>

              <!-- Option 3: Foreign Liquidation -->
              <div
                class="min-w-0"
                role="presentation"
                onpointerdown={() => {
                  if (!canLiquidate) fx('error');
                }}
              >
                <button
                  type="button"
                  disabled={!canLiquidate}
                  onclick={() => {
                    if (canLiquidate) {
                      fx('select');
                      draftStore.setOligarchDecision(asset.id, 'FOREIGN_LIQUIDATION');
                    } else {
                      fx('error');
                    }
                  }}
                  aria-label="تصفية خارجية"
                  title={!unlockedTurn
                    ? 'تُفتح الأصول في الدور الثالث'
                    : canAffordLiquidation
                      ? `تصفية خارجية: بيع سريع بالدولار بخصم 40% (+$${formatM(liquidationIncomeUSD)}M)، كلفة ${liquidationPCCost} رصيد سياسي، -4 ثقة`
                      : pcShortageText(liquidationPCCost, $budgetStore.remainingPC)}
                  class="kit-btn !h-auto !min-h-11 !px-1.5 !py-1.5 w-full flex-col !gap-0.5 !leading-tight {canLiquidate
                    ? 'sec'
                    : !unlockedTurn
                      ? 'soon'
                      : 'lock'}"
                >
                  <span class="flex items-center gap-1 text-[11.5px] font-bold leading-[1.35]">
                    {#if !unlockedTurn}
                      <HourglassIcon cls="h-3 w-3 shrink-0" />
                    {:else if !canAffordLiquidation}
                      <LockIcon cls="h-3 w-3 shrink-0" />
                    {/if}
                    <span>تصفية خارجية</span>
                  </span>
                  <span class="oc-kit-num text-[11px] font-bold leading-[1.35] text-[var(--c-pos)]" dir="ltr">
                    +${formatM(liquidationIncomeUSD)}M
                  </span>
                  {#if !unlockedTurn}
                    <span class="oc-kit-num text-[11px] leading-[1.35] text-[var(--c-muted)]">
                      يُفتح في الدور 3
                    </span>
                  {:else if !canAffordLiquidation}
                    <span class="oc-kit-num text-[11px] font-bold leading-[1.35] text-[var(--c-neg)]">
                      نقص {liquidationShortPC} رصيد
                    </span>
                  {:else}
                    <span class="oc-kit-num text-[11px] leading-[1.35] text-[var(--c-neg)]">
                      <bdi dir="ltr">−{liquidationPCCost}</bdi> رصيد
                    </span>
                  {/if}
                </button>
              </div>
            </div>
          {/snippet}
        </ActionCard>
      {/each}
    </div>
  {:else if allAssets.length > 0}
    <div class="border border-dashed border-[var(--c-line)] px-3 py-2.5 text-center text-[12px] text-[var(--c-muted)]">
      لا توجد أصول معلقة تتطلب قراراً هذا الدور.
    </div>
  {/if}

  <!-- Decided this turn: grey DoneRow at the bottom with remove/undo -->
  {#if decidedThisTurnAssets.length > 0}
    <GroupDivider label="في الحصيلة هذا الدور" count={decidedThisTurnAssets.length} />
    <div class="flex flex-col gap-1.5">
      {#each decidedThisTurnAssets as asset (asset.id)}
        {@const decision = $draftStore.oligarchDecisions[asset.id]}
        {@const terms = getOligarchTerms(asset)}
        {@const settlementPCCost = getOligarchSettlementPCCost(asset.valuationUSD)}
        {@const liquidationPCCost = getOligarchLiquidationPCCost(asset.valuationUSD)}
        {@const nationalizePCEarned = getOligarchNationalizePCEarned(asset.valuationUSD)}
        <div class="flex flex-col gap-1">
          <DoneRow
            title={`${asset.titleAr} — ${DECISION_LABEL_AR[decision] ?? decision}`}
            cost={decisionSummaryCost(asset.id, decision)}
            removable={true}
            removeLabel="إزالة"
            dimmed={Boolean(selectedStat) && !isRelated}
            onclick={() => toggleDoneDetails(asset.id)}
            onremove={() => draftStore.removeOligarchDecision(asset.id)}
          />
          {#if expandedDoneIds[asset.id]}
            <div class="fx border border-dashed border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 py-1.5 {selectedStat && !isRelated ? 'is-filtered-out' : ''}">
              {#if decision === 'SETTLEMENT_80_20'}
                <FxChip text={`+$${formatM(terms.settlementUSD)}M`} tone="good" />
                {#if terms.settlementSYP > 0}
                  <FxChip text={`+${formatBillion(terms.settlementSYP)}B SP`} tone="good" />
                {/if}
                <FxChip text={`-${settlementPCCost} رصيد سياسي`} tone="bad" />
                <FxChip text="+2 ثقة" tone="good" />
              {:else if decision === 'NATIONALIZE_SOE'}
                <FxChip text={`+${nationalizePCEarned} رصيد سياسي`} tone="good" />
                <FxChip text={`+${formatBillion(terms.nationalizedSYPPerTurn)}B/دور`} tone="good" />
              {:else if decision === 'FOREIGN_LIQUIDATION'}
                <FxChip text={`+$${formatM(terms.liquidationUSD)}M`} tone="good" />
                <FxChip text={`-${liquidationPCCost} رصيد سياسي`} tone="bad" />
                <FxChip text="-4 ثقة" tone="bad" />
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Processed in earlier turns: grey DoneRow without undo -->
  {#if processedAssets.length > 0}
    <GroupDivider label="تمت معالجته" count={processedAssets.length} />
    <div class="flex flex-col gap-1.5">
      {#each processedAssets as asset (asset.id)}
        <DoneRow
          title={`${asset.titleAr} — ${ASSET_STATUS_AR[asset.status] ?? asset.status}`}
          cost={`$${formatM(asset.valuationUSD)}M`}
          removable={false}
          statusLabel="نافذ"
          dimmed={Boolean(selectedStat) && !isRelated}
        />
      {/each}
    </div>
  {/if}
</div>
