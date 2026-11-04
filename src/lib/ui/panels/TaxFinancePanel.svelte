<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore, projectedTurnStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import ToggleSwitch from '../ToggleSwitch.svelte';
  import BigSlider from '../controls/BigSlider.svelte';
  import EffectChip from '../controls/EffectChip.svelte';
  import {
    isOptionRelated,
    SUSPENDED_CARD_CLASS,
    SUSPENDED_CONTENT_CLASS,
    SUSPENDED_ICON,
    formatBillion,
    REMITTANCE_POOL_USD,
    previewComplianceRate,
    previewCorporateTaxSYP,
    previewTelecomExciseSYP,
    previewTransitRevenueUSD,
    previewGridCapExGain,
    previewWageUnrestRelief,
  } from './shared';

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let projected = $derived($projectedTurnStore);

  // Collapsible groups: every section starts open so no lever is hidden.
  let openSections = $state<Record<string, boolean>>({
    taxes: true,
    wages: true,
    cash: true,
    remittances: true,
    energy: true,
  });
  function toggleSection(key: string): void {
    openSections[key] = !openSections[key];
  }

  // Collapsible per-card explainers (help icon before each title)
  let openExplainers = $state<Record<string, boolean>>({});
  function toggleExplainer(key: string): void {
    openExplainers[key] = !openExplainers[key];
  }

  // Grid CapEx has an independent policy envelope of $0M to $80M
  const maxCapEx = 80;

  // Central Bank Dollar Auction is bounded solely by central bank FX reserves
  let maxAuction = $derived(
    Math.max(0, Math.floor(($gameStore.macro.reservesUSD ?? 320_000_000) / 1_000_000))
  );

  $effect(() => {
    if ($draftStore.dollarAuctionUSD > maxAuction * 1_000_000) {
      draftStore.setField('dollarAuctionUSD', maxAuction * 1_000_000);
    }
  });

  // Reactive calculations for the 3 macro sliders matching the engine audit
  let complianceRate = $derived(previewComplianceRate($gameStore));
  let remittanceCapturedM = $derived(
    $draftStore.remittanceCaptureSpread <= 15
      ? Math.round((REMITTANCE_POOL_USD * ($draftStore.remittanceCaptureSpread / 100)) / 1_000_000)
      : Math.round(150 + ($draftStore.remittanceCaptureSpread - 15) * 8.5)
  );

  let corporateTaxB = $derived(
    previewCorporateTaxSYP($draftStore.corporateTaxRate, complianceRate) / 1_000_000_000
  );
  let telecomExciseB = $derived(
    previewTelecomExciseSYP($draftStore.telecomExciseRate) / 1_000_000_000
  );
  let transitRevenueM = $derived(
    previewTransitRevenueUSD(
      $draftStore.nassibTransitFeeUSD,
      $gameStore.governorates['daraa']?.nassibRevenueCapturePct ?? 32,
      complianceRate
    ) / 1_000_000
  );

  let gridCapExM = $derived($draftStore.gridCapExUSD / 1_000_000);
  let gridGain = $derived(
    previewGridCapExGain(
      $draftStore.gridCapExUSD,
      $gameStore.ministries['energy']?.competence ?? 45,
      $gameStore.macro.systemicCorruption ?? 58
    )
  );
  let effectiveGridMW = $derived(gridGain.mw);
  let effectivePowerHoursDelta = $derived(gridGain.hours);

  let auctionM = $derived($draftStore.dollarAuctionUSD / 1_000_000);
  let auctionSypB = $derived(
    Number(((auctionM * 1_000_000 * ($gameStore.macro.parallelRateSYP * 0.95)) / 1_000_000_000).toFixed(2))
  );
  let auctionReliefPct = $derived(
    Math.min(25, Math.round((auctionM / 10) * 1.5))
  );

  // ── Money printing (deficit financing) ────────────────────────────────
  // The lever is a per-turn directive: `moneyPrintingSYP` is credited by the
  // audit as financing (never as revenue or spending), expands M2 and feeds
  // `calculateParallelRate`. The slider ceiling is sized from the projected
  // deficit BEFORE printing, so moving the slider cannot move its own max.
  let printingSYP = $derived($draftStore.moneyPrintingSYP);
  let projectedDeficitSYP = $derived($projectedTurnStore.deficitSYP);
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

  // Growth-valve readout: CapEx bands accrue productive capacity, which
  // scales domestic revenues (~0.4% ≈ +0.35B/turn per capacity point).
  let capacityGain = $derived(
    gridCapExM * 1_000_000 >= 35_000_000 ? 1.0 : gridCapExM * 1_000_000 >= 20_000_000 ? 0.5 : gridCapExM === 0 ? -1.0 : 0
  );
  let capacityRevenueB = $derived((capacityGain * 0.35).toFixed(2));

  let canAffordBrainGain = $derived(
    $draftStore.expatriateBrainGainIncentive ||
    $budgetStore.canAffordWithFxCoverage(20_000_000, 3_500_000_000)
  );
  let isBrainGainCoveredByFX = $derived(
    !$draftStore.expatriateBrainGainIncentive &&
    $budgetStore.isCoveredByFX(20_000_000, 3_500_000_000)
  );

  // Populist patronage affordability (SYP-funded, FX backstop allowed)
  let canAffordCharity = $derived(
    $draftStore.charityFundActive ||
    $budgetStore.canAffordWithFxCoverage(0, 2_500_000_000)
  );
  let isCharityCoveredByFX = $derived(
    !$draftStore.charityFundActive &&
    $budgetStore.isCoveredByFX(0, 2_500_000_000)
  );

  // Decree-style box states for the two persistent toggles
  let brainGainOn = $derived($draftStore.expatriateBrainGainIncentive);
  let brainGainBlocked = $derived(!brainGainOn && !canAffordBrainGain);
  let charityOn = $derived($draftStore.charityFundActive);
  let charityBlocked = $derived(!charityOn && !canAffordCharity);

  function cardClass(key: string): string {
    if (!selectedStat) return 'pointer-events-auto opacity-100';
    return isOptionRelated(selectedStat, key)
      ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100'
      : 'opacity-20 pointer-events-none select-none grayscale';
  }

  function signedBillion(value: number): string {
    if (value === 0) return '0.00';
    return `${value > 0 ? '+' : '−'}${formatBillion(Math.abs(value))}`;
  }
</script>

{#snippet treasuryLine()}
  <div class="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-charcoal-mid/50 pt-1.5 text-[9px] text-wheat-dark">
    <span>الخزينة بعد الدور:</span>
    <span class="flex items-center gap-1.5 font-mono">
      <b
        dir="ltr"
        class="font-heading text-[12px] font-bold {projected.treasurySYP.projected < 0
          ? 'text-umber-crimson'
          : 'text-wheat-gold'}">{formatBillion(projected.treasurySYP.projected)}B SP</b
      >
      <span
        dir="ltr"
        class="text-[8.5px] font-bold {projected.treasurySYP.delta > 0
          ? 'text-forest-accent'
          : projected.treasurySYP.delta < 0
            ? 'text-umber-crimson'
            : 'text-wheat-mid'}">({signedBillion(projected.treasurySYP.delta)}B)</span
      >
    </span>
  </div>
{/snippet}

{#snippet sectionHeader(id: string, title: string, icon: string)}
  <div class="px-3 pt-2">
    <button
      type="button"
      onclick={() => toggleSection(id)}
      aria-expanded={openSections[id] ?? false}
      class="flex min-h-11 w-full items-center gap-2 text-start"
    >
      <span class="flex h-8 w-8 shrink-0 items-center justify-center border border-wheat-gold/25 bg-wheat-gold/10 text-wheat-gold">
        <GameIcon name={icon} cls="h-4 w-4" />
      </span>
      <span class="min-w-0 flex-1 font-heading text-[13px] font-bold text-wheat-light">{title}</span>
      <span class="flex h-7 w-7 shrink-0 items-center justify-center border border-charcoal-mid bg-charcoal-surface font-mono text-sm text-wheat-mid">
        {openSections[id] ? '−' : '+'}
      </span>
    </button>
    {@render treasuryLine()}
  </div>
{/snippet}

<div class="space-y-2.5">
  <!-- ── Taxes ─────────────────────────────────────────────────────────── -->
  <section class="border border-charcoal-mid/70 bg-forest-deep/35">
    {@render sectionHeader('taxes', 'الضرائب', 'abacus')}
    {#if openSections.taxes}
      <div class="space-y-2 border-t border-charcoal-mid/50 p-2">
        <!-- Corporate Tax Rate -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('corporateTaxRate')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('corp')} aria-label="إظهار الشرح" aria-expanded={openExplainers.corp ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">ضريبة أرباح الشركات والمنشآت</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">{$draftStore.corporateTaxRate}%</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <EffectChip text={`+${corporateTaxB.toFixed(2)}B SP/دور`} tone="good" />
            <EffectChip text={$draftStore.corporateTaxRate > 25 ? 'يقلص الاستثمار' : 'يشجع الامتثال'} tone={$draftStore.corporateTaxRate > 25 ? 'bad' : 'good'} />
          </div>

          <BigSlider
            value={$draftStore.corporateTaxRate}
            min={10}
            max={35}
            step={1}
            default={22}
            label="ضريبة أرباح الشركات"
            format={(value) => `${value}%`}
            minLabel="10%"
            maxLabel="35%"
            onchange={(value) => draftStore.setField('corporateTaxRate', value)}
          />

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.corp ? '' : 'hidden'}">
            معدل الضريبة ({$draftStore.corporateTaxRate}%). رفعه يزيد إيرادات الخزينة بSP لكن يقلص الاستثمار وقد يحفز التهرب الضريبي.
          </div>
        </article>

        <!-- Telecom Excise Tax -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('telecomExciseRate')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('telecom')} aria-label="إظهار الشرح" aria-expanded={openExplainers.telecom ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">رسم الإنفاق الاستهلاكي على الاتصالات</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">{$draftStore.telecomExciseRate}%</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <EffectChip text={`+${telecomExciseB.toFixed(2)}B SP/دور`} tone="good" />
            <EffectChip text={$draftStore.telecomExciseRate > 20 ? 'ضغط معيشي متصاعد' : 'عبء معتدل'} tone={$draftStore.telecomExciseRate > 20 ? 'bad' : 'good'} />
          </div>

          <BigSlider
            value={$draftStore.telecomExciseRate}
            min={5}
            max={30}
            step={1}
            default={15}
            label="رسم الاتصالات"
            format={(value) => `${value}%`}
            minLabel="5%"
            maxLabel="30%"
            onchange={(value) => draftStore.setField('telecomExciseRate', value)}
          />

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.telecom ? '' : 'hidden'}">
            رسم استهلاكي ({$draftStore.telecomExciseRate}%). جباية سريعة ومباشرة بـSP للخزينة، لكن رفعه يثقل كاهل المواطنين ويزيد الاحتقان المعيشي.
          </div>
        </article>

        <!-- All Crossings Transit Fee -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('nassibTransitFeeUSD')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('transit')} aria-label="إظهار الشرح" aria-expanded={openExplainers.transit ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">رسوم الترانزيت بكافة المعابر الحدودية</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">${$draftStore.nassibTransitFeeUSD}</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <EffectChip text={`+$${Math.round(transitRevenueM)}M دولار/دور`} tone="good" />
            <EffectChip text={$draftStore.nassibTransitFeeUSD > 600 ? 'قد يخفض تدفق الشاحنات' : 'حركة ترانزيت نشطة'} tone={$draftStore.nassibTransitFeeUSD > 600 ? 'bad' : 'good'} />
          </div>

          <BigSlider
            value={$draftStore.nassibTransitFeeUSD}
            min={200}
            max={800}
            step={50}
            default={450}
            label="رسوم الترانزيت"
            format={(value) => `$${value} / شاحنة`}
            minLabel="$200"
            maxLabel="$800"
            onchange={(value) => draftStore.setField('nassibTransitFeeUSD', value)}
          />

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.transit ? '' : 'hidden'}">
            تعرفة ${$draftStore.nassibTransitFeeUSD} على الشاحنات الأجنبية بكافة المنافذ والمعابر الحدودية لتعظيم عوائد النقد الأجنبي المباشرة ($) للخزينة.
          </div>
        </article>
      </div>
    {/if}
  </section>

  <!-- ── Wages & patronage ─────────────────────────────────────────────── -->
  <section class="border border-charcoal-mid/70 bg-forest-deep/35">
    {@render sectionHeader('wages', 'الأجور', 'coins')}
    {#if openSections.wages}
      <div class="space-y-2 border-t border-charcoal-mid/50 p-2">
        <!-- Civil Service Wages -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('wageBumpPercent')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('wage')} aria-label="إظهار الشرح" aria-expanded={openExplainers.wage ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">زيادة أجور العاملين في الدولة</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">+{$draftStore.wageBumpPercent}%</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <EffectChip text={`+${Math.round((($gameStore.macro.civilServiceWageSYP || 4_050) * ($draftStore.wageBumpPercent / 100)) / ($gameStore.macro.parallelRateSYP || 150))} $/شهر`} tone="good" />
            <EffectChip text={`-${previewWageUnrestRelief($draftStore.wageBumpPercent)} احتقان`} tone="good" />
            <EffectChip text={`-${(((($gameStore.macro.civilServiceHeadcount ?? 1_400_000) * ($gameStore.macro.civilServiceWageSYP || 450_000) * ($draftStore.wageBumpPercent / 100) * 6)) / 1_000_000_000).toFixed(2)}B SP`} tone="bad" />
          </div>

          <BigSlider
            value={$draftStore.wageBumpPercent}
            min={0}
            max={400}
            step={5}
            default={0}
            label="زيادة أجور العاملين في الدولة"
            format={(value) => `+${value}%`}
            minLabel="0%"
            maxLabel="+400%"
            onchange={(value) => draftStore.setField('wageBumpPercent', value)}
          />

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.wage ? '' : 'hidden'}">
            زيادة الرواتب بنسبة +{$draftStore.wageBumpPercent}% ترفع متوسط الأجر الحقيقي لموظفي الدولة وتمتص الاحتقان الشعبي، مقابل زيادة كتلة الرواتب بـSP ومخاطر عجز الموازنة.
          </div>
        </article>

        <!-- Expatriate Brain-Gain Initiative -->
        <article class="transition-all duration-300 {cardClass('brainGain')}">
          <div
            title={brainGainBlocked ? 'ميزانية غير كافية لتفعيل حوافز الاستقطاب' : 'حوافز استقطاب الكفاءات والمهاجرين'}
            class="relative flex flex-row items-stretch border bg-forest-deep/60 text-start transition-all {brainGainOn ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordBrainGain ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
          >
            <div class="min-w-0 flex-1 space-y-1.5 px-3 py-2.5 {brainGainBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
              <div class="flex flex-wrap items-center gap-1.5">
                <span title="تفعيل مستمر دورياً"><GameIcon name="cycle" cls="h-4 w-4 shrink-0 text-forest-accent" /></span>
                <span class="font-heading text-[11px] font-bold leading-tight text-wheat-light">حوافز استقطاب الكفاءات والمهاجرين</span>
              </div>
              <div class="flex flex-wrap items-center gap-1">
                <EffectChip text="-$20M" tone="bad" />
                <EffectChip text="-3.50B SP" tone="bad" />
                <EffectChip text="+8% كفاءة" tone="good" />
                <EffectChip text="+4 ثقة" tone="good" />
                {#if isBrainGainCoveredByFX && !brainGainOn}
                  <EffectChip text="مغطى بالنقد الأجنبي" tone="good" icon="checked-shield" />
                {/if}
              </div>
            </div>
            <div class="flex items-center px-2">
              <ToggleSwitch
                checked={brainGainOn}
                disabled={brainGainBlocked}
                label="حوافز استقطاب الكفاءات"
                onchange={(next) => {
                  if (next ? canAffordBrainGain : true) draftStore.setField('expatriateBrainGainIncentive', next);
                }}
              />
            </div>
            {#if brainGainBlocked}
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <GameIcon name={SUSPENDED_ICON} cls="h-10 w-10 text-umber-glow opacity-90 drop-shadow-lg" />
              </div>
            {/if}
          </div>
        </article>

        <!-- Sovereign Charity Fund: persistent SYP drain buying +3 PC/turn -->
        <article class="transition-all duration-300 {cardClass('charityFund')}">
          <div
            title={charityBlocked ? 'ميزانية غير كافية لتفعيل صندوق الكرامة' : 'صندوق الكرامة السيادي (إعانات أسر الشهداء)'}
            class="relative flex flex-row items-stretch border bg-forest-deep/60 text-start transition-all {charityOn ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordCharity ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
          >
            <div class="min-w-0 flex-1 space-y-1.5 px-3 py-2.5 {charityBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
              <div class="flex flex-wrap items-center gap-1.5">
                <span title="تفعيل مستمر دورياً"><GameIcon name="cycle" cls="h-4 w-4 shrink-0 text-forest-accent" /></span>
                <span class="font-heading text-[11px] font-bold leading-tight text-wheat-light">صندوق الكرامة السيادي (إعانات أسر الشهداء)</span>
              </div>
              <div class="flex flex-wrap items-center gap-1">
                <EffectChip text="-2.50B SP/دور" tone="bad" />
                <EffectChip text="+3 رصيد سياسي/دور" tone="good" />
                <EffectChip text="+1 ثقة" tone="good" />
                {#if isCharityCoveredByFX && !charityOn}
                  <EffectChip text="مغطى بالنقد الأجنبي" tone="good" icon="checked-shield" />
                {/if}
              </div>
            </div>
            <div class="flex items-center px-2">
              <ToggleSwitch
                checked={charityOn}
                disabled={charityBlocked}
                label="صندوق الكرامة السيادي"
                onchange={(next) => {
                  if (next ? canAffordCharity : true) draftStore.setField('charityFundActive', next);
                }}
              />
            </div>
            {#if charityBlocked}
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <GameIcon name={SUSPENDED_ICON} cls="h-10 w-10 text-umber-glow opacity-90 drop-shadow-lg" />
              </div>
            {/if}
          </div>
        </article>
      </div>
    {/if}
  </section>

  <!-- ── Cash & FX ─────────────────────────────────────────────────────── -->
  <section class="border border-charcoal-mid/70 bg-forest-deep/35">
    {@render sectionHeader('cash', 'النقد والصرف', 'banknote')}
    {#if openSections.cash}
      <div class="space-y-2 border-t border-charcoal-mid/50 p-2">
        <!-- Money printing / deficit financing -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('moneyPrintingSYP')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('printing')} aria-label="إظهار الشرح" aria-expanded={openExplainers.printing ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">طباعة النقود (التمويل بالعجز)</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">{formatPrintingBillion(printingSYP)}</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            {#if printingSYP > 0}
              <EffectChip
                text={printingCoversTreasury ? 'الخزينة مغطاة بعد الطباعة' : `لا يغطي العجز كاملاً (${formatBillion(projected.treasurySYP.projected)}B)`}
                tone={printingCoversTreasury ? 'good' : 'bad'}
              />
              <EffectChip text={`ضغط تضخمي: M2 +${printingM2GrowthPct.toFixed(1)}%`} tone="bad" />
              <EffectChip
                text={`صرف موازٍ ${printingRateDelta >= 0 ? '+' : '−'}${formatRate(Math.abs(printingRateDelta))} ل.س/$`}
                tone="bad"
              />
            {:else}
              <EffectChip text="دون طباعة — العجز يبقى مفتوحاً على الخزينة" tone="neutral" />
              <EffectChip text="لا تضخم إضافي من السكّ" tone="good" />
            {/if}
          </div>

          <BigSlider
            value={printingSYP}
            min={0}
            max={printingMaxSYP}
            step={1_000_000_000}
            default={0}
            label="طباعة النقود"
            format={formatPrintingBillion}
            minLabel="0"
            maxLabel={`${Math.round(printingMaxSYP / 1_000_000_000)}B`}
            onchange={(value) => draftStore.setField('moneyPrintingSYP', value)}
          />

          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={coverDeficitSYP === 0}
              onclick={() => draftStore.setField('moneyPrintingSYP', coverDeficitSYP)}
              class="flex min-h-11 flex-1 items-center justify-center gap-1.5 border px-2.5 py-1.5 text-[10px] font-bold transition-colors {coverDeficitSYP === 0
                ? 'cursor-not-allowed border-charcoal-mid bg-charcoal-surface text-wheat-dark opacity-60'
                : 'cursor-pointer border-wheat-gold/60 bg-wheat-gold/10 text-wheat-gold hover:bg-wheat-gold/20'}"
              aria-label="طباعة مبلغ يغطي العجز المتوقع"
            >
              <GameIcon name="money-stack" cls="h-3.5 w-3.5 shrink-0" />
              <span>تغطية العجز المتوقع</span>
            </button>
            <span class="border border-charcoal-mid bg-charcoal-surface px-2 py-1 text-[9.5px] text-wheat-dark">
              العجز قبل الطباعة:
              <b dir="ltr" class="font-mono text-[10px] text-umber-crimson">{formatBillion(projectedDeficitSYP)}B</b>
              ل.س
            </span>
          </div>

          <!-- Live rehearsal projections: same derived stores as the top bar -->
          <div class="space-y-1 border-y border-charcoal-mid/50 py-1.5 text-[10px] text-wheat-dark">
            <div class="flex items-center justify-between gap-2">
              <span>الخزينة بعد الدور</span>
              <span class="flex items-baseline gap-1 font-mono">
                <b dir="ltr" class="text-[11px] font-bold {projected.treasurySYP.projected < 0 ? 'text-umber-crimson' : 'text-wheat-gold'}">{formatBillion(projected.treasurySYP.projected)}B SP</b>
                <span dir="ltr" class="text-[8.5px] {projected.treasurySYP.delta > 0 ? 'text-forest-accent' : projected.treasurySYP.delta < 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">({signedBillion(projected.treasurySYP.delta)}B)</span>
              </span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span>نمو الكتلة النقدية M2</span>
              <b dir="ltr" class="font-mono text-[10.5px] {printingM2GrowthPct > 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">{printingM2GrowthPct > 0 ? '+' : ''}{printingM2GrowthPct.toFixed(1)}%</b>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span>الصرف الموازي المتوقع</span>
              <span class="flex items-baseline gap-1 font-mono">
                <b dir="ltr" class="text-[10.5px] font-bold {printingRateDelta > 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">{formatRate(projected.parallelRateSYP.projected)} ل.س/$</b>
                <span dir="ltr" class="text-[8.5px] {printingRateDelta > 0 ? 'text-umber-crimson' : 'text-wheat-mid'}">({printingRateDelta > 0 ? '+' : ''}{formatRate(printingRateDelta)})</span>
              </span>
            </div>
          </div>

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.printing ? '' : 'hidden'}">
            الطباعة تغطي العجز نقداً الآن، لكنها توسّع الكتلة النقدية فتضعف الليرة في السوق الموازية وترفع الأسعار وتآكل الأجر الحقيقي. كل ليرة مطبوعة اليوم ضريبة تضخمية على الأجور غداً.
          </div>
        </article>

        <!-- Central Bank Dollar Auction -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('dollarAuctionUSD')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('auction')} aria-label="إظهار الشرح" aria-expanded={openExplainers.auction ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">ضخ سيولة نقدية لكبح انهيار سعر SP</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">${auctionM}M</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <EffectChip text={auctionM === 0 ? '$0M (حماية الاحتياطي)' : `-$${auctionM}M من الاحتياطي`} tone={auctionM === 0 ? 'neutral' : 'bad'} />
            <EffectChip text={auctionM === 0 ? 'سعر صرف حر دون استنزاف للاحتياطي' : `كبح تدهور الصرف بنسبة ~${auctionReliefPct}% (+${auctionSypB}B SP ممتصة)`} tone={auctionM === 0 ? 'neutral' : 'good'} />
          </div>

          <BigSlider
            value={auctionM}
            min={0}
            max={Math.max(0, maxAuction)}
            step={5}
            default={0}
            label="ضخ السيولة الدولارية"
            format={(value) => `$${value}M`}
            minLabel="$0M"
            maxLabel={`$${maxAuction}M`}
            disabled={maxAuction === 0}
            onchange={(value) => draftStore.setField('dollarAuctionUSD', value * 1_000_000)}
          />

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.auction ? '' : 'hidden'}">
            {auctionM === 0
              ? 'الحالة المحايدة ($0M): صون احتياطي النقد الأجنبي بالكامل من الاستنزاف. يترك سعر الصرف الموازي يتحدد وفق قوى العرض والطلب لتجنب هدر الدولارات في معارك تثبيت غير مجدية.'
              : `ضخ \$${auctionM}M في السوق الموازي لامتصاص نحو ${auctionSypB}B SP وتثبيت سعر الصرف وكبح جماح التضخم، على حساب رصيد احتياطي النقد الأجنبي.`}
          </div>
        </article>
      </div>
    {/if}
  </section>

  <!-- ── Remittances ───────────────────────────────────────────────────── -->
  <section class="border border-charcoal-mid/70 bg-forest-deep/35">
    {@render sectionHeader('remittances', 'الحوالات', 'trade')}
    {#if openSections.remittances}
      <div class="space-y-2 border-t border-charcoal-mid/50 p-2">
        <!-- Remittance Spread Margin -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('remittanceCaptureSpread')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('remit')} aria-label="إظهار الشرح" aria-expanded={openExplainers.remit ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">هامش اقتطاع الحوالات للمصرف المركزي</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">{$draftStore.remittanceCaptureSpread}%</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <EffectChip text={`+$${remittanceCapturedM}M دولار/دور`} tone={$draftStore.remittanceCaptureSpread > 15 ? 'bad' : 'good'} />
            <EffectChip text={$draftStore.remittanceCaptureSpread > 15 ? 'اقتطاع طوارئ قسري (سيولة إنقاذية قصوى)' : ($draftStore.remittanceCaptureSpread <= 7 ? 'تحفيز المغتربين والقنوات الرسمية (+ثقة)' : 'اقتطاع اعتيادي مستقر (الحالة المحايدة)')} tone={$draftStore.remittanceCaptureSpread > 15 ? 'bad' : ($draftStore.remittanceCaptureSpread <= 7 ? 'good' : 'neutral')} />
          </div>

          <BigSlider
            value={$draftStore.remittanceCaptureSpread}
            min={5}
            max={25}
            step={1}
            default={10}
            label="هامش اقتطاع الحوالات"
            format={(value) => `${value}%`}
            minLabel="5%"
            maxLabel="25%"
            onchange={(value) => draftStore.setField('remittanceCaptureSpread', value)}
          />

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.remit ? '' : 'hidden'}">
            {$draftStore.remittanceCaptureSpread <= 15
              ? `نسبة اقتطاع اعتيادية (${$draftStore.remittanceCaptureSpread}%). تحقق جباية دولارية بقيمة +${remittanceCapturedM}M للخزينة عبر القنوات المصرفية الرسمية بأمان ودون إثارة مقاطعة المغتربين.`
              : `اقتطاع طوارئ استثنائي (${$draftStore.remittanceCaptureSpread}%): يوفر للمصرف المركزي سيولة دولارية إنقاذية ضخمة تصل إلى +${remittanceCapturedM}M كاش لإنقاذ الاحتياطي ومنع العجز عن سداد الديون واستيراد القمح والفيول، مقابل كلفة مقبولة على الثقة الشعبية ونشاط الصرافة غير النظامي.`}
          </div>
        </article>
      </div>
    {/if}
  </section>

  <!-- ── Energy ────────────────────────────────────────────────────────── -->
  <section class="border border-charcoal-mid/70 bg-forest-deep/35">
    {@render sectionHeader('energy', 'الطاقة', 'power-generator')}
    {#if openSections.energy}
      <div class="space-y-2 border-t border-charcoal-mid/50 p-2">
        <!-- National Power Grid CapEx Budget -->
        <article class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass('gridCapExUSD')}">
          <div class="flex items-start gap-1.5">
            <button type="button" onclick={() => toggleExplainer('grid')} aria-label="إظهار الشرح" aria-expanded={openExplainers.grid ?? false} class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold">
              <GameIcon name="help" cls="h-4 w-4" />
            </button>
            <div class="min-w-0 flex-1 pt-2">
              <div class="font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">تأهيل محطات التوليد والشبكات القومية</div>
            </div>
            <span class="mt-1 shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-2 py-0.5 font-heading text-[12px] font-bold text-wheat-gold" dir="ltr">${gridCapExM}M</span>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <EffectChip text={gridCapExM === 0 ? '$0M كاش (تقشف تام)' : `-$${gridCapExM}M كاش`} tone={gridCapExM === 0 ? 'neutral' : 'bad'} />
            <EffectChip text={effectiveGridMW > 0 ? `+${effectiveGridMW} ميغاواط` : `${effectiveGridMW} ميغاواط`} tone={gridCapExM === 0 ? 'bad' : 'good'} />
            <EffectChip text={effectivePowerHoursDelta > 0 ? `+${effectivePowerHoursDelta} س/يوم` : `${effectivePowerHoursDelta} س/يوم`} tone={gridCapExM === 0 ? 'bad' : 'good'} />
            <EffectChip text={capacityGain <= 0 ? 'تآكل القدرة الإنتاجية' : `+${capacityRevenueB}B إيراد تدريجي/دور`} tone={capacityGain <= 0 ? 'bad' : 'good'} />
          </div>

          <BigSlider
            value={gridCapExM}
            min={0}
            max={maxCapEx}
            step={5}
            default={35}
            label="استثمار الشبكة"
            format={(value) => `$${value}M`}
            minLabel="$0M"
            maxLabel="$80M"
            onchange={(value) => draftStore.setField('gridCapExUSD', value * 1_000_000)}
          />

          <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.grid ? '' : 'hidden'}">
            {gridCapExM === 0
              ? 'تجميد الاستثمار الرأسمالي يوفر السيولة الدولارية ($0M كاش)، لكنه يسبب تراجع قدرة الشبكة بنحو 120 ميغاواط وتمديد ساعات التقنين في المحافظات (-0.5 سا/يوم) وزيادة الاحتقان.'
              : gridCapExM === 35
                ? `الحالة المحايدة ($35M): صيانة دورية تؤمن +${effectiveGridMW} ميغاواط وتزيد التغذية بنحو +${effectivePowerHoursDelta} ساعة/يوم في كافة المحافظات، مما يدعم النشاط الاقتصادي واستقرار الشبكة.`
                : `استثمار \$${gridCapExM}M يضيف نحو ${effectiveGridMW} ميغاواط للشبكة القومية (${effectivePowerHoursDelta > 0 ? '+' : ''}${effectivePowerHoursDelta} سا/يوم)، مما يخفض ساعات التقنين بالمحافظات ويدعم النشاط الصناعي والامتثال الضريبي، ويراكم القدرة الإنتاجية (+${capacityRevenueB}B إيراد تدريجي/دور).`}
          </div>
        </article>
      </div>
    {/if}
  </section>
</div>
