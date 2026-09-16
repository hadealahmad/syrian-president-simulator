<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import GameIcon from './GameIcon.svelte';

  /** Results phase of the end-turn modal: closing audit for the committed
      turn. Rendered inside TurnReviewModal so review -> results swaps in
      place without closing or moving the modal. */
  let { onContinue }: { onContinue: () => void } = $props();

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function formatBillionSYP(syp: number): string {
    const val = Number((syp / 1_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  let audit = $derived($gameStore.lastTurnAudit);
  let realWage = $derived(
    ($gameStore.macro.civilServiceWageSYP / $gameStore.macro.parallelRateSYP).toFixed(1)
  );
  let provincesInRevoltCount = $derived(
    Object.values($gameStore.governorates).filter((g) => g.tier === 'REVOLT').length
  );
</script>

<div class="flex flex-col flex-1 min-h-0">
  {#if audit}
    <!-- Header -->
    <div class="border-b border-charcoal-mid pb-3 shrink-0">
      <div class="flex items-center gap-2">
        <GameIcon name="chart" cls="w-5 h-5 shrink-0 text-status-ok" />
        <h2 class="text-base font-bold text-wheat-light font-heading">
          تقرير الإغلاق المالي للنصف سنوي — الدور {String($gameStore.turnNumber - 1).padStart(2, '0')}
        </h2>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto space-y-5 py-4 pr-1">
      <!-- Financial Ledger -->
      <div class="space-y-2">
        <h3 class="text-xs text-wheat-gold font-semibold block font-heading">الميزان المالي للدولة:</h3>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-1 rounded-none">
            <span class="text-[11px] text-wheat-dark block font-heading">صافي النقد الأجنبي (الدولار)</span>
            <span class="text-sm font-bold text-wheat-light font-mono">
              ${formatMillionUSD($gameStore.macro.reservesUSD)}M
            </span>
            <span class="text-[10px] block font-mono {audit.netUSDDelta >= 0 ? 'text-forest-accent' : 'text-umber-crimson'}">
              {audit.netUSDDelta >= 0 ? '+' : ''}${formatMillionUSD(audit.netUSDDelta)}M هذا الدور
            </span>
            {#if (audit.debtServiceUSD ?? 0) > 0}
              <span class="text-[10px] block font-mono text-wheat-dark">
                خدمة الدين: ${formatMillionUSD(audit.debtServiceUSD)}M
              </span>
            {/if}
            {#if (audit.iranOilCouponUSD ?? 0) > 0}
              <span class="text-[10px] block font-mono text-wheat-dark">
                القسط النفطي الإيراني: ${formatMillionUSD(audit.iranOilCouponUSD)}M
              </span>
            {:else if ($gameStore.flags?.Debt_Repudiated_Iran_Formal ?? 0) === 1}
              <span class="text-[10px] block font-mono text-forest-accent">
                القسط الإيراني: مُسقط ✓
              </span>
            {/if}
            {#if (audit.mortgageDrainUSD ?? 0) > 0}
              <span class="text-[10px] block font-mono text-umber-crimson">
                نزيف الرهون: ${formatMillionUSD(audit.mortgageDrainUSD)}M
              </span>
            {/if}
            {#if (audit.debtRepaymentPaidUSD ?? 0) > 0}
              <span class="text-[10px] block font-mono text-forest-accent">
                سداد أصل: ${formatMillionUSD(audit.debtRepaymentPaidUSD)}M
              </span>
            {/if}
          </div>

          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-1 rounded-none">
            <span class="text-[11px] text-wheat-dark block font-heading">رصيد الخزينة (SP)</span>
            <span dir="ltr" class="text-sm font-bold {$gameStore.macro.treasurySYP < 0 ? 'text-umber-crimson' : 'text-wheat-light'} font-mono">
              {formatBillionSYP($gameStore.macro.treasurySYP)}B SP
            </span>
            <span class="text-[10px] block font-mono text-wheat-dark">
              محصّل <span dir="ltr">{formatBillionSYP(audit.grossCapturedSYP)}B</span> − مصروف <span dir="ltr">{formatBillionSYP(audit.expendedSYP)}B</span> = الصافي <span dir="ltr" class={audit.netSYPDelta >= 0 ? 'text-forest-accent' : 'text-umber-crimson'}>{audit.netSYPDelta >= 0 ? '+' : ''}{formatBillionSYP(audit.netSYPDelta)}B</span> هذا الدور
            </span>
            {#if $gameStore.macro.treasurySYP < 0}
              <span class="text-[10px] text-umber-crimson block font-heading">
                عجز مالي متراكم على الخزينة العامة
              </span>
            {:else if audit.seignioragePrintedSYP > 0}
              <span class="text-[10px] text-wheat-gold block font-mono">
                إصدار نقدي: +{formatBillionSYP(audit.seignioragePrintedSYP)}B
              </span>
            {/if}
            {#if (audit.overdraftInterestSYP ?? 0) > 0}
              <span class="text-[10px] text-umber-crimson block font-mono">
                فوائد العجز: {formatBillionSYP(audit.overdraftInterestSYP)}B
              </span>
            {/if}
            {#if (audit.auctionAbsorbedSYP ?? 0) > 0}
              <span class="text-[10px] block font-mono text-wheat-dark">
                امتصاص المزاد (أُتلف): {formatBillionSYP(audit.auctionAbsorbedSYP)}B
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Living Standards & Grid -->
      <div class="space-y-2">
        <h3 class="text-xs text-wheat-gold font-semibold block font-heading">الخدمات ومعيشة المواطنين:</h3>
        <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2 text-xs rounded-none">
          <div class="flex justify-between">
            <span class="text-wheat-light">سعر الصرف بالسوق الموازي:</span>
            <span class="font-bold text-wheat-gold font-mono">{formatNumber($gameStore.macro.parallelRateSYP)} SP</span>
          </div>
          <div class="flex justify-between">
            <span class="text-wheat-light">متوسط الأجر الحقيقي للموظف:</span>
            <span class="font-bold text-forest-accent font-mono">${realWage} / شهرياً</span>
          </div>
          <div class="flex justify-between">
            <span class="text-wheat-light">التوليد الكهربائي المتاح:</span>
            <span class="font-bold text-wheat-light font-mono">{$gameStore.macro.gridCapacityMW} ميغاواط ({$gameStore.macro.dailyPowerHours} ساعة تغذية)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-wheat-light">مؤشر الاحتقان الوطني العام:</span>
            <span class="font-bold font-mono {$gameStore.macro.nationalRRI < 40 ? 'text-forest-accent' : $gameStore.macro.nationalRRI < 65 ? 'text-wheat-gold' : 'text-umber-crimson'}">
              {$gameStore.macro.nationalRRI} / 100
            </span>
          </div>
        </div>
      </div>

      <!-- Distance from Catastrophic Fail States -->
      <div class="space-y-2">
        <h3 class="text-xs text-wheat-gold font-semibold block font-heading">المسافة من الانهيارات الكبرى:</h3>
        <div class="p-3 bg-charcoal-surface border border-charcoal-mid text-[11px] space-y-1.5 rounded-none">
          <div class="flex justify-between">
            <span class="text-wheat-dark">الاستدامة المالية للنقد الأجنبي:</span>
            <span class="font-bold font-mono {audit.runwayMonths <= 3.0 ? 'text-umber-crimson animate-pulse' : audit.runwayMonths <= 6.0 ? 'text-wheat-gold' : 'text-forest-accent'}">
              {audit.runwayMonths} شهراً متبقياً {audit.runwayMonths <= 3.0 ? '[منطقة خطر]' : '[مستقر]'}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-wheat-dark">العصيان المدني المسلح:</span>
            <span class="font-bold font-mono {provincesInRevoltCount >= 3 ? 'text-umber-crimson' : 'text-wheat-light'}">
              {provincesInRevoltCount} / 3 محافظات متمردة كحد أقصى
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="pt-3 border-t border-charcoal-mid flex justify-start shrink-0">
      <button
        onclick={onContinue}
        class="px-5 py-2.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep font-bold text-xs border border-wheat-gold transition-colors cursor-pointer rounded-none font-heading shadow-md gloss-hover"
      >
        متابعة المهام الرئاسية للدور الجديد
      </button>
    </div>
  {:else}
    <div class="flex-1 flex items-center justify-center text-wheat-dark text-sm">
      لا يوجد تقرير إغلاق متاح لهذا الدور.
    </div>
  {/if}
</div>
