<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import { isOptionRelated, formatM, formatTrillion, ASSET_STATUS_AR } from './shared';
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
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2 border-b border-charcoal-mid pb-2">
    <GameIcon name="open-treasure-chest" cls="w-5 h-5 text-wheat-gold shrink-0" />
    <h3 class="text-sm font-bold text-wheat-light font-heading">الأصول والمصادرة وثروات الحرب</h3>
  </div>

  <!-- Section: Confiscated Assets & War Wealth -->
  <div class="space-y-2 pt-2 border-t border-charcoal-mid">
    <span class="text-xs font-bold text-wheat-gold font-heading block">الأصول المصادرة وثروات الحرب</span>
    <div class="space-y-2">
      {#each orderedAssets as asset}
        {@const decision = $draftStore.oligarchDecisions[asset.id] || asset.status}
        {@const settlementIncomeUSD = getOligarchSettlementIncome(asset.valuationUSD)}
        {@const liquidationIncomeUSD = getOligarchLiquidationIncome(asset.valuationUSD)}
        {@const settlementPCCost = getOligarchSettlementPCCost(asset.valuationUSD)}
        {@const liquidationPCCost = getOligarchLiquidationPCCost(asset.valuationUSD)}
        {@const nationalizePCEarned = getOligarchNationalizePCEarned(asset.valuationUSD)}
        {@const canAffordSettlement = decision === 'SETTLEMENT_80_20' || $budgetStore.remainingPC >= settlementPCCost}
        {@const canAffordLiquidation = decision === 'FOREIGN_LIQUIDATION' || $budgetStore.remainingPC >= liquidationPCCost}
        <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 text-[11px] transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'oligarchs') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs font-bold text-wheat-gold font-heading block">{asset.titleAr}</span>
              <span class="text-wheat-dark text-[10px]">المالك: {asset.ownerNameAr}</span>
            </div>
            <span class="font-mono text-wheat-gold text-xs font-bold">${formatM(asset.valuationUSD)}M</span>
          </div>
          {#if asset.status === 'PENDING'}
            <div class="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
              <!-- Option 1: 80/20 Settlement -->
              <button
                disabled={decision !== 'SETTLEMENT_80_20' && !canAffordSettlement}
                onclick={() => {
                  if (decision === 'SETTLEMENT_80_20') {
                    draftStore.removeOligarchDecision(asset.id);
                  } else if (canAffordSettlement) {
                    draftStore.setOligarchDecision(asset.id, 'SETTLEMENT_80_20');
                  }
                }}
                class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 {decision === 'SETTLEMENT_80_20' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : canAffordSettlement ? 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
                title="تسوية 80/20: تحصيل 80% كاش (+${formatM(settlementIncomeUSD)}M$)، كلفة {settlementPCCost} رصيد سياسي، +2 ثقة"
              >
                <span class="font-bold text-[10px]">تسوية 80/20</span>
                <div class="flex items-center gap-1 flex-wrap justify-center">
                  <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">
                    +${formatM(settlementIncomeUSD)}M
                  </span>
                  <span class="px-1.5 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">
                    -{settlementPCCost} رصيد سياسي
                  </span>
                </div>
              </button>

              <!-- Option 2: Nationalize SOE -->
              <button
                onclick={() => {
                  if (decision === 'NATIONALIZE_SOE') {
                    draftStore.removeOligarchDecision(asset.id);
                  } else {
                    draftStore.setOligarchDecision(asset.id, 'NATIONALIZE_SOE');
                  }
                }}
                class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 {decision === 'NATIONALIZE_SOE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer'}"
                title="تأميم حكومي: ضم الأصل لشركات الدولة، كسب +{nationalizePCEarned} رصيد سياسي، +{formatTrillion(asset.soeVenueSYPPerTurn)}T ل.س/دور، +8000 موظف، +5 فساد"
              >
                <span class="font-bold text-[10px]">تأميم حكومي</span>
                <div class="flex items-center gap-1 flex-wrap justify-center">
                  <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">
                    +{nationalizePCEarned} رصيد سياسي
                  </span>
                  <span class="px-1.5 py-0.2 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8.5px]">
                    +{formatTrillion(asset.soeVenueSYPPerTurn)}T/دور
                  </span>
                </div>
              </button>

              <!-- Option 3: Foreign Liquidation -->
              <button
                disabled={decision !== 'FOREIGN_LIQUIDATION' && !canAffordLiquidation}
                onclick={() => {
                  if (decision === 'FOREIGN_LIQUIDATION') {
                    draftStore.removeOligarchDecision(asset.id);
                  } else if (canAffordLiquidation) {
                    draftStore.setOligarchDecision(asset.id, 'FOREIGN_LIQUIDATION');
                  }
                }}
                class="p-1.5 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 {decision === 'FOREIGN_LIQUIDATION' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : canAffordLiquidation ? 'bg-forest-mid border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-charcoal-light cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
                title="تصفية خارجية: بيع سريع بالدولار بخصم 40% (+${formatM(liquidationIncomeUSD)}M$)، كلفة {liquidationPCCost} رصيد سياسي، -4 ثقة"
              >
                <span class="font-bold text-[10px]">تصفية خارجية</span>
                <div class="flex items-center gap-1 flex-wrap justify-center">
                  <span class="px-1.5 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">
                    +${formatM(liquidationIncomeUSD)}M
                  </span>
                  <span class="px-1.5 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">
                    -{liquidationPCCost} رصيد سياسي
                  </span>
                </div>
              </button>
            </div>
          {:else}
            <div class="text-[10px] text-wheat-mid font-mono pt-1 border-t border-charcoal-mid">
              تمت المعالجة: {ASSET_STATUS_AR[asset.status] ?? asset.status}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
