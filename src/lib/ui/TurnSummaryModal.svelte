<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function formatTrillionSYP(syp: number): string {
    const val = Number((syp / 1_000_000_000_000).toFixed(2));
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

  function handleDismiss(): void {
    uiStore.setTurnSummaryModal(false);
  }
</script>

{#if $uiStore.isTurnSummaryModalOpen && audit}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 select-none font-arabic"
  >
    <div
      class="w-full max-w-[620px] bg-forest-deep/95 border-2 border-wheat-mid/80 shadow-2xl p-6 space-y-5 text-wheat-light rounded-none flex flex-col max-h-[85vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="border-b border-charcoal-mid pb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-wheat-gold rounded-none"></span>
          <h2 class="text-base font-bold text-wheat-light font-heading">
            تقرير الإغلاق المالي للنصف سنوي — الدور {String($gameStore.turnNumber - 1).padStart(2, '0')}
          </h2>
        </div>
        <p class="text-[11px] text-wheat-dark mt-1">
          بيان الحسابات الختامية الصادر عن مصرف سورية المركزي ووزارة المالية
        </p>
      </div>

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
            <span class="text-[11px] text-wheat-dark block font-heading">رصيد الخزينة (الليرة)</span>
            <span dir="ltr" class="text-sm font-bold {$gameStore.macro.treasurySYP < 0 ? 'text-umber-crimson' : 'text-wheat-light'} font-mono">
              {formatTrillionSYP($gameStore.macro.treasurySYP)} تريليون
            </span>
            {#if $gameStore.macro.treasurySYP < 0}
              <span class="text-[10px] text-umber-crimson block font-heading">
                عجز مالي متراكم على الخزينة العامة
              </span>
            {:else if audit.seignioragePrintedSYP > 0}
              <span class="text-[10px] text-wheat-gold block font-mono">
                إصدار نقدي: +{formatTrillionSYP(audit.seignioragePrintedSYP)}T
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
            <span class="font-bold text-wheat-gold font-mono">{formatNumber($gameStore.macro.parallelRateSYP)} ل.س</span>
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

      <!-- Footer Action -->
      <div class="pt-2 flex justify-end">
        <button
          onclick={handleDismiss}
          class="px-5 py-2.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep font-bold text-xs border border-wheat-gold transition-colors cursor-pointer rounded-none font-heading shadow-md"
        >
          متابعة المهام الرئاسية للدور الجديد
        </button>
      </div>
    </div>
  </div>
{/if}
