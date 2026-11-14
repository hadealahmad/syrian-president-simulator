<script lang="ts">
  import { flip } from 'svelte/animate';
  import { gameStore } from '../../../stores/game-store';
  import { draftStore, projectedTurnStore } from '../../../stores/draft-store';
  import { uiStore } from '../../../stores/ui-store';
  import GameIcon from '../../GameIcon.svelte';
  import { fx } from '../../fx/feedback';
  import FxChip from '../../kit/FxChip.svelte';
  import GroupDivider from '../../kit/GroupDivider.svelte';
  import Lever from '../../kit/Lever.svelte';
  import {
    buildFilteredDisplayRows,
    flipDuration,
    type AvailabilityTier,
  } from '../../kit/reorder';
  import { formatBillion } from '../../panels/shared';
  import { isSectionOptionRelated } from '../../shell/section-nav';

  type CurrencyKey = 'moneyPrintingSYP' | 'dollarAuctionUSD';
  const CURRENCY_KEYS: readonly CurrencyKey[] = ['moneyPrintingSYP', 'dollarAuctionUSD'];

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let projected = $derived($projectedTurnStore);
  let openExplainers = $state<Record<string, boolean>>({});

  function toggleExplainer(key: string): void {
    openExplainers[key] = !openExplainers[key];
  }

  // ── Money printing (deficit financing) ────────────────────────────────────
  let printingSYP = $derived($draftStore.moneyPrintingSYP);
  let projectedDeficitSYP = $derived(projected.deficitSYP);
  let coverDeficitSYP = $derived(
    projectedDeficitSYP > 0
      ? Math.ceil(projectedDeficitSYP / 1_000_000_000) * 1_000_000_000
      : 0
  );
  let printingMaxSYP = $derived(
    Math.max(
      50_000_000_000,
      Math.ceil((projectedDeficitSYP * 1.5) / 5_000_000_000) * 5_000_000_000
    )
  );
  let printingM2GrowthPct = $derived(
    $gameStore.macro.m2MoneySupplySYP > 0
      ? Number(((printingSYP / $gameStore.macro.m2MoneySupplySYP) * 100).toFixed(1))
      : 0
  );
  let printingRateDelta = $derived(
    projected.parallelRateSYP.projected - projected.parallelRateSYP.current
  );
  let printingCoversTreasury = $derived(projected.treasurySYP.projected >= 0);

  $effect(() => {
    if ($draftStore.moneyPrintingSYP > printingMaxSYP) {
      draftStore.setField('moneyPrintingSYP', printingMaxSYP);
    }
  });

  function formatPrintingBillion(value: number): string {
    return `${(value / 1_000_000_000).toFixed(1)}B ل.س`;
  }

  function formatRate(value: number): string {
    return Math.round(value).toLocaleString('en-US');
  }

  // ── Central Bank Dollar Auction ───────────────────────────────────────────
  let maxAuction = $derived(
    Math.max(0, Math.floor(($gameStore.macro.reservesUSD ?? 320_000_000) / 1_000_000))
  );

  $effect(() => {
    if ($draftStore.dollarAuctionUSD > maxAuction * 1_000_000) {
      draftStore.setField('dollarAuctionUSD', maxAuction * 1_000_000);
    }
  });

  let auctionM = $derived($draftStore.dollarAuctionUSD / 1_000_000);
  let auctionSypB = $derived(
    Number(
      ((auctionM * 1_000_000 * ($gameStore.macro.parallelRateSYP * 0.95)) / 1_000_000_000).toFixed(2)
    )
  );
  let auctionReliefPct = $derived(Math.min(25, Math.round((auctionM / 10) * 1.5)));

  let displayRows = $derived(
    buildFilteredDisplayRows(
      CURRENCY_KEYS,
      selectedStat,
      (k) => k,
      (k) => isSectionOptionRelated(selectedStat, k),
      (k): AvailabilityTier => (k === 'dollarAuctionUSD' && maxAuction === 0 ? 1 : 0)
    )
  );
</script>

<div class="flex flex-col gap-2" role="tabpanel" aria-label="العملة">
  {#each displayRows as row (row.key)}
    <div animate:flip={{ duration: flipDuration() }}>
      {#if row.kind === 'divider'}
        <GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />
      {:else if row.item === 'moneyPrintingSYP'}
        <!-- Money Printing / Deficit Financing -->
        <Lever
          title="طباعة النقود (التمويل بالعجز)"
          display={formatPrintingBillion(printingSYP)}
          value={printingSYP}
          min={0}
          max={printingMaxSYP}
          step={1_000_000_000}
          default={0}
          ariaLabel="طباعة النقود"
          minLabel="0"
          maxLabel={`${Math.round(printingMaxSYP / 1_000_000_000)}B`}
          onchange={(value) => draftStore.setField('moneyPrintingSYP', value)}
          explainerOpen={openExplainers.printing ?? false}
          onToggleExplainer={() => toggleExplainer('printing')}
          dimmed={Boolean(selectedStat) && !row.related}
        >
          {#snippet chips()}
            {#if printingSYP > 0}
              <FxChip
                text={printingCoversTreasury
                  ? 'الخزينة مغطاة بعد الطباعة'
                  : `لا يغطي العجز كاملاً (${formatBillion(projected.treasurySYP.projected)}B)`}
                tone={printingCoversTreasury ? 'good' : 'bad'}
              />
              <FxChip text={`ضغط تضخمي: M2 +${printingM2GrowthPct.toFixed(1)}%`} tone="bad" />
              <FxChip
                text={`صرف موازٍ ${printingRateDelta >= 0 ? '+' : '−'}${formatRate(Math.abs(printingRateDelta))} ل.س/$`}
                tone="bad"
              />
            {:else}
              <FxChip text="دون طباعة — العجز يبقى مفتوحاً على الخزينة" tone="neutral" />
              <FxChip text="لا تضخم إضافي من السكّ" tone="good" />
            {/if}
          {/snippet}

          {#snippet footer()}
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={coverDeficitSYP === 0}
                onclick={() => {
                  fx('select');
                  draftStore.setField('moneyPrintingSYP', coverDeficitSYP);
                }}
                class="kit-btn sec flex-1"
                aria-label="طباعة مبلغ يغطي العجز المتوقع"
              >
                <GameIcon name="money-stack" cls="h-4 w-4 shrink-0" />
                <span>تغطية العجز المتوقع</span>
              </button>

              <span class="flex min-h-11 items-center gap-1 border border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 text-[11px] text-[var(--c-muted)]">
                <span>العجز قبل الطباعة:</span>
                <b class="oc-kit-num text-[12px] font-bold text-[var(--c-neg)]">
                  <bdi dir="ltr">{formatBillion(projectedDeficitSYP)}B</bdi> ل.س
                </b>
              </span>
            </div>

            <div class="mt-1.5 grid grid-cols-2 gap-1.5 text-[11px]">
              <div class="flex items-center justify-between gap-1 border border-[var(--c-line)] bg-[var(--c-strip)] px-2 py-1.5">
                <span class="text-[var(--c-muted)]">نمو M2</span>
                <b
                  dir="ltr"
                  class="oc-kit-num font-bold {printingM2GrowthPct > 0
                    ? 'text-[var(--c-neg)]'
                    : 'text-[var(--c-text-2)]'}"
                >
                  {printingM2GrowthPct > 0 ? '+' : ''}{printingM2GrowthPct.toFixed(1)}%
                </b>
              </div>
              <div class="flex items-center justify-between gap-1 border border-[var(--c-line)] bg-[var(--c-strip)] px-2 py-1.5">
                <span class="text-[var(--c-muted)]">الصرف الموازي</span>
                <b
                  dir="rtl"
                  class="oc-kit-num inline-flex items-baseline gap-1 font-bold {printingRateDelta > 0
                    ? 'text-[var(--c-neg)]'
                    : 'text-[var(--c-text-2)]'}"
                >
                  <bdi dir="ltr">{formatRate(projected.parallelRateSYP.projected)}</bdi>
                  {#if printingRateDelta !== 0}
                    <bdi dir="ltr">({printingRateDelta > 0 ? '+' : '−'}{formatRate(Math.abs(printingRateDelta))})</bdi>
                  {/if}
                </b>
              </div>
            </div>
          {/snippet}

          {#snippet explainer()}
            الطباعة تغطي العجز نقداً الآن، لكنها توسّع الكتلة النقدية فتضعف الليرة في السوق الموازية وترفع الأسعار وتآكل الأجر الحقيقي. كل ليرة مطبوعة اليوم ضريبة تضخمية على الأجور غداً.
          {/snippet}
        </Lever>
      {:else if row.item === 'dollarAuctionUSD'}
        <!-- Central Bank Dollar Auction -->
        <Lever
          title="ضخ سيولة نقدية لكبح انهيار سعر SP"
          display={`$${auctionM}M`}
          value={auctionM}
          min={0}
          max={Math.max(0, maxAuction)}
          step={5}
          default={0}
          ariaLabel="ضخ السيولة الدولارية"
          minLabel="$0M"
          maxLabel={`$${maxAuction}M`}
          disabled={maxAuction === 0}
          hint={maxAuction === 0 ? 'موقوف: احتياطي النقد الأجنبي $0M — لا تتوفر دولارات للمزاد' : ''}
          onchange={(value) => draftStore.setField('dollarAuctionUSD', value * 1_000_000)}
          explainerOpen={openExplainers.auction ?? false}
          onToggleExplainer={() => toggleExplainer('auction')}
          dimmed={Boolean(selectedStat) && !row.related}
        >
          {#snippet chips()}
            <FxChip
              text={auctionM === 0 ? '$0M (حماية الاحتياطي)' : `-$${auctionM}M من الاحتياطي`}
              tone={auctionM === 0 ? 'neutral' : 'bad'}
            />
            <FxChip
              text={auctionM === 0
                ? 'سعر صرف حر دون استنزاف للاحتياطي'
                : `كبح تدهور الصرف بنسبة ~${auctionReliefPct}% (+${auctionSypB}B SP ممتصة)`}
              tone={auctionM === 0 ? 'neutral' : 'good'}
            />
          {/snippet}
          {#snippet explainer()}
            {auctionM === 0
              ? 'الحالة المحايدة ($0M): صون احتياطي النقد الأجنبي بالكامل من الاستنزاف. يترك سعر الصرف الموازي يتحدد وفق قوى العرض والطلب لتجنب هدر الدولارات في معارك تثبيت غير مجدية.'
              : `ضخ $${auctionM}M في السوق الموازي لامتصاص نحو ${auctionSypB}B SP وتثبيت سعر الصرف وكبح جماح التضخم، على حساب رصيد احتياطي النقد الأجنبي.`}
          {/snippet}
        </Lever>
      {/if}
    </div>
  {/each}
</div>
