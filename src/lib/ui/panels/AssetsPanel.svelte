<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import EffectChip from '../controls/EffectChip.svelte';
  import {
    isOptionRelated,
    formatM,
    formatBillion,
    ASSET_STATUS_AR,
    SUSPENDED_CARD_CLASS,
    SUSPENDED_CONTENT_CLASS,
    SUSPENDED_ICON,
    pcShortageText,
  } from './shared';
  import {
    getOligarchSettlementIncome,
    getOligarchLiquidationIncome,
    getOligarchSettlementPCCost,
    getOligarchLiquidationPCCost,
    getOligarchNationalizePCEarned,
  } from '../../engine/oligarch-helpers';

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  function rank(done: boolean): number {
    if (done) return 2;
    if (selectedStat && !isOptionRelated(selectedStat, 'oligarchs')) return 1;
    return 0;
  }
  let orderedAssets = $derived(
    [...Object.values($gameStore.confiscatedAssets)].sort(
      (a, b) => rank(a.status !== 'PENDING') - rank(b.status !== 'PENDING')
    )
  );

  let pendingCount = $derived(
    $gameStore.confiscatedAssets.filter((asset) => asset.status === 'PENDING').length
  );
  let doneCount = $derived($gameStore.confiscatedAssets.length - pendingCount);

  function cardClass(): string {
    if (!selectedStat) return 'pointer-events-auto opacity-100';
    return isOptionRelated(selectedStat, 'oligarchs')
      ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100'
      : 'opacity-20 pointer-events-none select-none grayscale';
  }
</script>

<div class="space-y-3">
  <div class="flex items-center justify-between gap-2 border border-charcoal-mid/70 bg-forest-mid/25 px-3 py-2">
    <span class="flex items-center gap-1.5 text-[10px] text-wheat-dark">
      <GameIcon name="open-treasure-chest" cls="h-4 w-4 text-wheat-gold" />
      <span>ثروات الحرب والمساءلة</span>
    </span>
    <span class="flex items-center gap-1 font-mono text-[9px]">
      <span class="border border-wheat-gold/40 bg-wheat-gold/10 px-1.5 py-0.5 font-bold text-wheat-gold">{pendingCount} معلّق</span>
      <span class="border border-charcoal-mid bg-charcoal-surface px-1.5 py-0.5 text-wheat-mid">{doneCount} مُعالج</span>
    </span>
  </div>

  {#each orderedAssets as asset (asset.id)}
    {@const decision = $draftStore.oligarchDecisions[asset.id] || asset.status}
    {@const settlementIncomeUSD = getOligarchSettlementIncome(asset.valuationUSD)}
    {@const liquidationIncomeUSD = getOligarchLiquidationIncome(asset.valuationUSD)}
    {@const settlementPCCost = getOligarchSettlementPCCost(asset.valuationUSD)}
    {@const liquidationPCCost = getOligarchLiquidationPCCost(asset.valuationUSD)}
    {@const nationalizePCEarned = getOligarchNationalizePCEarned(asset.valuationUSD)}
    {@const canAffordSettlement = decision === 'SETTLEMENT_80_20' || $budgetStore.remainingPC >= settlementPCCost}
    {@const canAffordLiquidation = decision === 'FOREIGN_LIQUIDATION' || $budgetStore.remainingPC >= liquidationPCCost}
    {@const settlementShortPC = Math.max(0, Math.ceil(settlementPCCost - $budgetStore.remainingPC))}
    {@const liquidationShortPC = Math.max(0, Math.ceil(liquidationPCCost - $budgetStore.remainingPC))}
    <article
      class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass()}"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1 space-y-1">
          <h3 class="font-heading text-[12px] font-bold leading-tight text-wheat-light">{asset.titleAr}</h3>
          <div class="flex flex-wrap items-center gap-1">
            {#if asset.status === 'PENDING'}
              <span class="inline-flex items-center gap-1 border border-wheat-gold/40 bg-wheat-gold/10 px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-wheat-gold">
                <span class="h-1.5 w-1.5 bg-wheat-gold"></span>
                {ASSET_STATUS_AR.PENDING}
              </span>
            {:else}
              <span class="inline-flex items-center gap-1 border border-forest-accent/40 bg-forest-mid px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-forest-accent">
                <GameIcon name="check-mark" cls="h-2.5 w-2.5" />
                {ASSET_STATUS_AR[asset.status] ?? asset.status}
              </span>
            {/if}
          </div>
        </div>
        <div class="shrink-0 text-end">
          <div class="font-heading text-[16px] font-bold leading-none text-wheat-gold" dir="ltr">${formatM(asset.valuationUSD)}M</div>
          <div class="mt-1 font-mono text-[8px] text-wheat-dark">القيمة التقديرية</div>
        </div>
      </div>

      {#if asset.status === 'PENDING'}
        <div class="grid grid-cols-3 gap-1.5">
          <!-- Option 1: 80/20 Settlement -->
          <button
            type="button"
            disabled={decision !== 'SETTLEMENT_80_20' && !canAffordSettlement}
            onclick={() => {
              if (decision === 'SETTLEMENT_80_20') {
                draftStore.removeOligarchDecision(asset.id);
              } else if (canAffordSettlement) {
                draftStore.setOligarchDecision(asset.id, 'SETTLEMENT_80_20');
              }
            }}
            aria-label="تسوية 80/20"
            aria-pressed={decision === 'SETTLEMENT_80_20'}
            class="relative flex min-h-11 flex-col items-center justify-between gap-1 border p-2 text-center transition-colors {decision === 'SETTLEMENT_80_20'
              ? 'border-wheat-gold bg-forest-surface font-bold text-wheat-gold'
              : canAffordSettlement
                ? 'cursor-pointer border-charcoal-mid bg-forest-mid text-wheat-dark hover:border-charcoal-light hover:text-wheat-light'
                : `cursor-not-allowed bg-charcoal-surface text-wheat-dark ${SUSPENDED_CARD_CLASS}`}"
            title={canAffordSettlement
              ? `تسوية 80/20: تحصيل 80% كاش (+$${formatM(settlementIncomeUSD)}M$)، كلفة ${settlementPCCost} رصيد سياسي، +2 ثقة`
              : pcShortageText(settlementPCCost, $budgetStore.remainingPC)}
          >
            <span class="flex w-full flex-col items-center justify-between gap-1 {decision === 'SETTLEMENT_80_20' || canAffordSettlement ? '' : SUSPENDED_CONTENT_CLASS}">
              <span class="font-heading text-[10px] font-bold leading-tight">تسوية 80/20</span>
              <span class="flex flex-wrap items-center justify-center gap-1">
                <EffectChip text={`+$${formatM(settlementIncomeUSD)}M`} tone="good" />
                <EffectChip text={`-${settlementPCCost} رصيد سياسي`} tone="bad" />
              </span>
              {#if decision !== 'SETTLEMENT_80_20' && !canAffordSettlement}
                <span class="font-mono text-[8px] font-bold text-umber-crimson">نقص {settlementShortPC} رصيد</span>
              {/if}
            </span>
            {#if decision !== 'SETTLEMENT_80_20' && !canAffordSettlement}
              <span class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <GameIcon name={SUSPENDED_ICON} cls="h-8 w-8 text-umber-glow opacity-90 drop-shadow-lg" />
              </span>
            {/if}
          </button>

          <!-- Option 2: Nationalize SOE -->
          <button
            type="button"
            onclick={() => {
              if (decision === 'NATIONALIZE_SOE') {
                draftStore.removeOligarchDecision(asset.id);
              } else {
                draftStore.setOligarchDecision(asset.id, 'NATIONALIZE_SOE');
              }
            }}
            aria-label="تأميم حكومي"
            aria-pressed={decision === 'NATIONALIZE_SOE'}
            class="flex min-h-11 flex-col items-center justify-between gap-1 border p-2 text-center transition-colors {decision === 'NATIONALIZE_SOE'
              ? 'border-wheat-gold bg-forest-surface font-bold text-wheat-gold'
              : 'cursor-pointer border-charcoal-mid bg-forest-mid text-wheat-dark hover:border-charcoal-light hover:text-wheat-light'}"
            title="تأميم حكومي: ضم الأصل لشركات الدولة، كسب +{nationalizePCEarned} رصيد سياسي، +{formatBillion(asset.soeVenueSYPPerTurn)}B SP/دور، +8000 موظف، +5 فساد"
          >
            <span class="font-heading text-[10px] font-bold leading-tight">تأميم حكومي</span>
            <span class="flex flex-wrap items-center justify-center gap-1">
              <EffectChip text={`+${nationalizePCEarned} رصيد سياسي`} tone="good" />
              <EffectChip text={`+${formatBillion(asset.soeVenueSYPPerTurn)}B/دور`} tone="good" />
            </span>
          </button>

          <!-- Option 3: Foreign Liquidation -->
          <button
            type="button"
            disabled={decision !== 'FOREIGN_LIQUIDATION' && !canAffordLiquidation}
            onclick={() => {
              if (decision === 'FOREIGN_LIQUIDATION') {
                draftStore.removeOligarchDecision(asset.id);
              } else if (canAffordLiquidation) {
                draftStore.setOligarchDecision(asset.id, 'FOREIGN_LIQUIDATION');
              }
            }}
            aria-label="تصفية خارجية"
            aria-pressed={decision === 'FOREIGN_LIQUIDATION'}
            class="relative flex min-h-11 flex-col items-center justify-between gap-1 border p-2 text-center transition-colors {decision === 'FOREIGN_LIQUIDATION'
              ? 'border-wheat-gold bg-forest-surface font-bold text-wheat-gold'
              : canAffordLiquidation
                ? 'cursor-pointer border-charcoal-mid bg-forest-mid text-wheat-dark hover:border-charcoal-light hover:text-wheat-light'
                : `cursor-not-allowed bg-charcoal-surface text-wheat-dark ${SUSPENDED_CARD_CLASS}`}"
            title={canAffordLiquidation
              ? `تصفية خارجية: بيع سريع بالدولار بخصم 40% (+$${formatM(liquidationIncomeUSD)}M$)، كلفة ${liquidationPCCost} رصيد سياسي، -4 ثقة`
              : pcShortageText(liquidationPCCost, $budgetStore.remainingPC)}
          >
            <span class="flex w-full flex-col items-center justify-between gap-1 {decision === 'FOREIGN_LIQUIDATION' || canAffordLiquidation ? '' : SUSPENDED_CONTENT_CLASS}">
              <span class="font-heading text-[10px] font-bold leading-tight">تصفية خارجية</span>
              <span class="flex flex-wrap items-center justify-center gap-1">
                <EffectChip text={`+$${formatM(liquidationIncomeUSD)}M`} tone="good" />
                <EffectChip text={`-${liquidationPCCost} رصيد سياسي`} tone="bad" />
              </span>
              {#if decision !== 'FOREIGN_LIQUIDATION' && !canAffordLiquidation}
                <span class="font-mono text-[8px] font-bold text-umber-crimson">نقص {liquidationShortPC} رصيد</span>
              {/if}
            </span>
            {#if decision !== 'FOREIGN_LIQUIDATION' && !canAffordLiquidation}
              <span class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <GameIcon name={SUSPENDED_ICON} cls="h-8 w-8 text-umber-glow opacity-90 drop-shadow-lg" />
              </span>
            {/if}
          </button>
        </div>
      {:else}
        <div class="flex items-center gap-1.5 border-t border-charcoal-mid pt-1.5 font-mono text-[10px] text-wheat-mid">
          <GameIcon name="checked-shield" cls="h-3.5 w-3.5 shrink-0 text-forest-accent" />
          <span>تمت المعالجة: {ASSET_STATUS_AR[asset.status] ?? asset.status}</span>
        </div>
      {/if}
    </article>
  {/each}
</div>
