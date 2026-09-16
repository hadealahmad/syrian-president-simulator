<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { projectedTurnStore, previewRangesStore } from '../../stores/draft-store';
  import { SYRIA_2D_GOVERNORATES } from '../../spatial3d/syria-2d-paths';
  import GameIcon from '../GameIcon.svelte';
  import { STAT_EXPLAINERS_AR } from './shared';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function formatBillion(syp: number): string {
    const val = Number((syp / 1_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  const TIER_NAMES_AR: Record<string, string> = {
    CALM: 'مستقرة',
    TENSE: 'متوترة',
    RIOT: 'اضطرابات',
    REVOLT: 'تمرد مسلح',
  };

  const TIER_FILL: Record<string, string> = {
    CALM: '#2e6b5f',
    TENSE: '#988561',
    RIOT: '#6b1f2a',
    REVOLT: '#4a151e',
  };

  const ARCHETYPE_NAMES_AR: Record<string, string> = {
    revolution_hub: 'حاضرة ثورية / مركز مدني',
    coastal_enclave: 'جيب ساحلي',
    metropolitan_regime: 'عاصمة ومركز إداري',
    agricultural_hinterland: 'عمق زراعي وريفي',
    energy_corridor: 'ممر طاقة ونفط',
    autonomous_frontier: 'بادية وأطراف حدودية',
  };

  // Mini map shapes: crop each governorate path to its own bounding box.
  function bboxOf(path: string): [number, number, number, number] {
    const nums = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [0, 0, 0, 0];
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }

  const GOV_SHAPE: Record<string, { d: string; vb: string }> = Object.fromEntries(
    SYRIA_2D_GOVERNORATES.map((g) => {
      const [x0, y0, x1, y1] = bboxOf(g.path);
      const pad = 14;
      return [g.id, { d: g.path, vb: `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}` }];
    })
  );

  // General tab: every available stat as an icon-less table.
  // Projected stats (current -> projected + change), current-only macro
  // stats, and rehearsal preview ranges.
  type GeneralStatKey =
    | 'politicalCapital' | 'treasurySYP' | 'reservesUSD' | 'sovereignDebtUSD'
    | 'realWageUSD' | 'parallelRateSYP' | 'taxCompliancePct' | 'systemicCorruption'
    | 'civicTrust' | 'nationalRRI' | 'dailyPowerHours' | 'sovereignLeverage'
    | 'm2MoneySupplySYP' | 'civilServiceHeadcount' | 'civilPayrollSYP';

  const PROJECTED_STATS: { key: GeneralStatKey; labelAr: string; fmt: string }[] = [
    { key: 'politicalCapital', labelAr: 'الرصيد السياسي', fmt: 'points' },
    { key: 'treasurySYP', labelAr: 'الخزينة العامة', fmt: 'billion' },
    { key: 'reservesUSD', labelAr: 'احتياطي النقد الأجنبي', fmt: 'mUSD' },
    { key: 'sovereignDebtUSD', labelAr: 'الدين السيادي الخارجي', fmt: 'bUSD' },
    { key: 'realWageUSD', labelAr: 'الأجر الحقيقي للموظف', fmt: 'usd' },
    { key: 'parallelRateSYP', labelAr: 'سعر الصرف الموازي', fmt: 'int' },
    { key: 'taxCompliancePct', labelAr: 'الامتثال الضريبي', fmt: 'pct' },
    { key: 'systemicCorruption', labelAr: 'الفساد المؤسسي', fmt: 'per100' },
    { key: 'civicTrust', labelAr: 'الثقة الشعبية', fmt: 'pct' },
    { key: 'nationalRRI', labelAr: 'الاحتقان الوطني', fmt: 'per100' },
    { key: 'dailyPowerHours', labelAr: 'ساعات التغذية اليومية', fmt: 'hours' },
    { key: 'sovereignLeverage', labelAr: 'الرافعة السيادية', fmt: 'pct' },
    { key: 'm2MoneySupplySYP', labelAr: 'المعروض النقدي', fmt: 'billion' },
    { key: 'civilServiceHeadcount', labelAr: 'الملاك الوظيفي', fmt: 'headcount' },
    { key: 'civilPayrollSYP', labelAr: 'كتلة الرواتب', fmt: 'billion' },
  ];

  const FMT_SUFFIX: Record<string, string> = {
    points: 'نقطة',
    trillion: 'SP',
    per100: '/100',
    hours: 'س',
    headcount: 'نسمة',
  };

  function fmtVal(fmt: string, v: number): string {
    switch (fmt) {
      case 'pct': return `${v}%`;
      case 'points': return `${v}`;
      case 'per100': return `${v}`;
      case 'billion': return `${formatBillion(v)}B`;
      case 'mUSD': return `$${(v / 1_000_000).toFixed(1)}M`;
      case 'bUSD': return `$${(v / 1_000_000_000).toFixed(2)}B`;
      case 'usd': return `$${Number.isInteger(v) ? v : v.toFixed(1)}`;
      case 'int': return formatNumber(v);
      case 'hours': return `${v}`;
      case 'headcount': return formatNumber(v);
      default: return `${v}`;
    }
  }

  interface GeneralRow {
    section?: string;
    labelAr?: string;
    cur?: string;
    suffix?: string;
    proj?: string;
    projGood?: boolean;
    delta?: string;
  }

  function signed(n: number, digits = 1): string {
    return `${n > 0 ? '+' : ''}${n.toFixed(digits)}`;
  }

  let tab = $state<'general' | 'ministries' | 'commissions' | 'governorates'>('general');

  let p = $derived($projectedTurnStore);
  let seasonText = $derived(
    $gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء'
  );

  let generalRows = $derived.by((): GeneralRow[] => {
    const rows: GeneralRow[] = [{ section: 'المؤشرات المسقطة للدور القادم' }];
    for (const s of PROJECTED_STATS) {
      const st = p[s.key];
      rows.push({
        labelAr: s.labelAr,
        cur: fmtVal(s.fmt, st.current),
        suffix: FMT_SUFFIX[s.fmt],
        proj: st.isChanged ? fmtVal(s.fmt, st.projected) : undefined,
        projGood: st.isChanged ? st.isBeneficial : undefined,
        delta: st.isChanged ? `${signed(st.pctChange)}%` : undefined,
      });
    }
    const m = $gameStore.macro;
    const r = $previewRangesStore;
    rows.push({ section: 'مؤشرات كلية حالية' });
    rows.push({ labelAr: 'السعر الرسمي للدولار', cur: formatNumber(m.officialRateSYP), suffix: 'SP' });
    rows.push({ labelAr: 'سلة الغذاء الشهرية', cur: formatNumber(m.monthlyFoodBasketSYP), suffix: 'SP' });
    rows.push({ labelAr: 'الراتب الاسمي للموظف', cur: formatNumber(m.civilServiceWageSYP), suffix: 'SP' });
    rows.push({ labelAr: 'التضخم السنوي', cur: `${m.annualInflationPct}%` });
    rows.push({ labelAr: 'قدرة التوليد المتاحة', cur: formatNumber(m.gridCapacityMW), suffix: 'م.و' });
    rows.push({ section: 'التوقعات النطاقية للبروفة' });
    rows.push({ labelAr: 'كفاية الاحتياطي', cur: `${r.runwayMonthsEstimated}`, suffix: 'شهراً' });
    rows.push({ labelAr: 'عجز الموازنة', cur: `${formatBillion(r.deficitSYP)}B`, suffix: 'SP' });
    rows.push({ labelAr: 'النطاق المرجح للصرف', cur: `${formatNumber(r.fxRateMin)} - ${formatNumber(r.fxRateMax)}` });
    rows.push({ labelAr: 'نطاق الأجر المتوقع', cur: `$${Math.round(r.realWageMin)} - $${Math.round(r.realWageMax)}` });
    rows.push({ labelAr: 'نطاق تغير الاحتقان', cur: `${signed(r.rriChangeMin)} .. ${signed(r.rriChangeMax)}` });
    rows.push({ labelAr: 'الطباعة النقدية المطلوبة', cur: `${formatBillion(r.requiresPrintingSYP)}B`, suffix: 'SP' });
    return rows;
  });

  let quneitraNode = $derived($gameStore.governorates['quneitra']);
  let daraaNode = $derived($gameStore.governorates['daraa']);
  let suwaydaNode = $derived($gameStore.governorates['as_suwayda']);
  let golanTensionQ = $derived(quneitraNode?.golanTensionIndex ?? 45);
  let golanTensionD = $derived(daraaNode?.golanTensionIndex ?? quneitraNode?.golanTensionIndex ?? 45);
  let secessionProb = $derived(suwaydaNode?.suwaydaSecessionProb ?? 24);
  let integrationIndex = $derived(suwaydaNode?.suwaydaIntegrationIndex ?? 8);
  let tribalRage = $derived(suwaydaNode?.tribalRageIndex ?? 74);
</script>

<div class="space-y-3">
  <div class="grid grid-cols-4 gap-1 bg-charcoal-surface p-1 border border-charcoal-mid rounded-none">
    <button
      onclick={() => (tab = 'general')}
      class="py-1.5 px-1 text-[10px] font-semibold transition-colors rounded-none text-center truncate cursor-pointer {tab === 'general' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
    >
      عامة
    </button>
    <button
      onclick={() => (tab = 'ministries')}
      class="py-1.5 px-1 text-[10px] font-semibold transition-colors rounded-none text-center truncate cursor-pointer {tab === 'ministries' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
    >
      الحقائب
    </button>
    <button
      onclick={() => (tab = 'commissions')}
      class="py-1.5 px-1 text-[10px] font-semibold transition-colors rounded-none text-center truncate cursor-pointer {tab === 'commissions' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
    >
      اللجان
    </button>
    <button
      onclick={() => (tab = 'governorates')}
      class="py-1.5 px-1 text-[10px] font-semibold transition-colors rounded-none text-center truncate cursor-pointer {tab === 'governorates' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
    >
      المحافظات
    </button>
  </div>

  {#if tab === 'general'}
    <!-- Full stats table: every indicator, no icons -->
    <div class="flex items-center justify-between text-[10px] text-wheat-dark border-b border-charcoal-mid/60 pb-1.5 font-mono">
      <span>الدور {String($gameStore.turnNumber).padStart(2, '0')}/40 · {$gameStore.calendarYear} · {seasonText}</span>
      <span>كفاية الاحتياطي: <span class="font-bold {$previewRangesStore.runwayMonthsEstimated <= 6 ? 'text-umber-crimson' : 'text-forest-accent'}">{$previewRangesStore.runwayMonthsEstimated} شهراً</span></span>
    </div>
    <div class="border border-charcoal-mid">
      <div class="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-2 px-2 py-1 bg-charcoal-surface text-[9px] text-wheat-dark font-bold border-b border-charcoal-mid">
        <span>المؤشر</span>
        <span>الحالي</span>
        <span>المتوقع</span>
        <span>التغير</span>
      </div>
      {#each generalRows as row}
        {#if row.section}
          <div class="px-2 py-1 bg-forest-mid/50 text-[9px] font-bold text-wheat-gold font-heading border-b border-charcoal-mid/50">
            {row.section}
          </div>
        {:else}
          <div class="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-2 items-center px-2 py-1 border-b border-charcoal-mid/50 last:border-b-0 text-[10px]">
            <span class="text-wheat-dark font-heading truncate">{row.labelAr}</span>
            <span class="font-mono font-bold text-wheat-light whitespace-nowrap" dir="ltr">
              {row.cur}{#if row.suffix}<span class="text-[8.5px] text-wheat-dark font-normal"> {row.suffix}</span>{/if}
            </span>
            {#if row.proj}
              <span class="font-mono font-bold whitespace-nowrap {row.projGood ? 'text-forest-accent' : 'text-umber-crimson'}" dir="ltr">{row.proj}</span>
            {:else}
              <span class="text-wheat-dark/50 font-mono">—</span>
            {/if}
            {#if row.delta}
              <span class="px-1 py-px text-[8px] font-mono font-bold whitespace-nowrap {row.projGood ? 'bg-forest-mid border border-forest-accent text-forest-accent' : 'bg-umber-deep border border-umber-border text-umber-crimson'}">
                {row.delta}
              </span>
            {:else}
              <span class="text-wheat-dark/50 font-mono">—</span>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {:else if tab === 'ministries'}
    <!-- Executive Ministries List -->
    <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
      <h3 class="text-xs font-bold text-wheat-gold font-heading">الحقائب التنفيذية وتصنيف الكفاءة</h3>
      {#each Object.values($gameStore.ministries) as min}
        <div class="py-2 border-b border-charcoal-mid/50 text-[11px] space-y-1">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-wheat-gold font-heading">{min.nameAr}</span>
            <span class="font-mono text-forest-accent font-bold">كفاءة {min.competence}%</span>
          </div>
          <div class="flex justify-between items-center text-[10px] text-wheat-dark">
            <span>الوزير: {min.ministerNameAr}</span>
            {#if min.isOpposition}
              <span class="text-wheat-gold font-bold">[معارضة ائتلافية]</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if tab === 'commissions'}
    <!-- Sovereign Commissions List -->
    <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
      <h3 class="text-xs font-bold text-wheat-gold font-heading">الهيئات واللجان السيادية</h3>
      {#each Object.values($gameStore.commissions) as comm}
        <div class="py-2 border-b border-charcoal-mid/50 text-[11px] space-y-1">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-wheat-gold font-heading">{comm.nameAr}</span>
            <span class="font-mono text-wheat-gold font-bold">إنجاز {comm.progress}%</span>
          </div>
          {#if comm.leaderNameAr}
            <div class="text-[10px] text-wheat-dark">
              رئيس الهيئة: {comm.leaderNameAr}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="space-y-3">
      <!-- Special dossiers at top: quneitra / daraa / as_suwayda gauges -->
      {#if quneitraNode}
        <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2.5">
          <div class="flex justify-between items-start gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full {golanTensionQ > 60 ? 'bg-umber-crimson animate-ping' : golanTensionQ > 30 ? 'bg-amber-400' : 'bg-forest-accent'}"></span>
                <h4 class="text-xs font-bold text-wheat-gold font-heading">
                  ملف الجولان والتدخل الخارجي على خط الهدنة — {quneitraNode.nameAr}
                </h4>
              </div>
              <span class="text-[11px] text-wheat-dark block mt-0.5">
                مراقبة شريط فك الاشتباك وقوات الأندوف (UNDOF) وتفادي الاستنزاف الإقليمي
              </span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 {golanTensionQ > 60 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : golanTensionQ > 30 ? 'bg-forest-surface border border-amber-500/50 text-amber-300' : 'bg-forest-mid border border-forest-accent text-forest-accent'}">
              {golanTensionQ > 60 ? 'توغل واحتكاك حرج' : golanTensionQ > 30 ? 'توتر وتجريف أمني' : 'هدوء رقابي نسبي'}
            </span>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-mono">
              <span class="text-wheat-dark">مؤشر التوغل والتدخل الخارجي:</span>
              <span class="font-bold {golanTensionQ > 60 ? 'text-umber-crimson' : golanTensionQ > 30 ? 'text-amber-300' : 'text-forest-accent'}">
                {golanTensionQ} / 100
              </span>
            </div>
            <div class="w-full bg-forest-mid h-2 border border-charcoal-mid overflow-hidden">
              <div
                class="h-full transition-all duration-500 {golanTensionQ > 60 ? 'bg-umber-crimson' : golanTensionQ > 30 ? 'bg-amber-400' : 'bg-forest-accent'}"
                style="width: {Math.min(100, Math.max(5, golanTensionQ))}%"
              ></div>
            </div>
          </div>
        </div>
      {/if}

      {#if daraaNode}
        <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2.5">
          <div class="flex justify-between items-start gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full {golanTensionD > 60 ? 'bg-umber-crimson animate-ping' : golanTensionD > 30 ? 'bg-amber-400' : 'bg-forest-accent'}"></span>
                <h4 class="text-xs font-bold text-wheat-gold font-heading">
                  ملف الجولان والتدخل الخارجي على خط الهدنة — {daraaNode.nameAr}
                </h4>
              </div>
              <span class="text-[11px] text-wheat-dark block mt-0.5">
                مراقبة شريط فك الاشتباك وقوات الأندوف (UNDOF) وتفادي الاستنزاف الإقليمي
              </span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 {golanTensionD > 60 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : golanTensionD > 30 ? 'bg-forest-surface border border-amber-500/50 text-amber-300' : 'bg-forest-mid border border-forest-accent text-forest-accent'}">
              {golanTensionD > 60 ? 'توغل واحتكاك حرج' : golanTensionD > 30 ? 'توتر وتجريف أمني' : 'هدوء رقابي نسبي'}
            </span>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-mono">
              <span class="text-wheat-dark">مؤشر التوغل والتدخل الخارجي:</span>
              <span class="font-bold {golanTensionD > 60 ? 'text-umber-crimson' : golanTensionD > 30 ? 'text-amber-300' : 'text-forest-accent'}">
                {golanTensionD} / 100
              </span>
            </div>
            <div class="w-full bg-forest-mid h-2 border border-charcoal-mid overflow-hidden">
              <div
                class="h-full transition-all duration-500 {golanTensionD > 60 ? 'bg-umber-crimson' : golanTensionD > 30 ? 'bg-amber-400' : 'bg-forest-accent'}"
                style="width: {Math.min(100, Math.max(5, golanTensionD))}%"
              ></div>
            </div>
          </div>
        </div>
      {/if}

      {#if suwaydaNode}
        <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2.5">
          <div class="flex justify-between items-start gap-2">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full {secessionProb >= 60 ? 'bg-umber-crimson animate-ping' : secessionProb >= 25 ? 'bg-amber-400' : 'bg-forest-accent'}"></span>
                <h4 class="text-xs font-bold text-wheat-gold font-heading">
                  ملف السويداء: مخاطر الانفصال والاندماج الوطني
                </h4>
              </div>
              <span class="text-[11px] text-wheat-dark block mt-0.5">
                احتمال انفصال جبل العرب وقطع شريان الجنوب، والوفاق مع عشائر اللجاة
              </span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 {secessionProb >= 60 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : secessionProb >= 25 ? 'bg-forest-surface border border-amber-500/50 text-amber-300' : 'bg-forest-mid border border-forest-accent text-forest-accent'}">
              {secessionProb >= 85 ? 'سقوط وانفصال وشيك' : secessionProb >= 60 ? 'خطر انفصال حرج' : secessionProb >= 25 ? 'قلق وتوتر محلي' : 'اندماج وطني مستقر'}
            </span>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-mono">
              <span class="text-wheat-dark">احتمال الانفصال عن الجمهورية:</span>
              <span class="font-bold {secessionProb >= 60 ? 'text-umber-crimson' : secessionProb >= 25 ? 'text-amber-300' : 'text-forest-accent'}">
                {secessionProb}% {secessionProb >= 85 ? '(عتبة السقوط الحتمي: 85%)' : ''}
              </span>
            </div>
            <div class="w-full bg-forest-mid h-2 border border-charcoal-mid overflow-hidden">
              <div
                class="h-full transition-all duration-500 {secessionProb >= 60 ? 'bg-umber-crimson' : secessionProb >= 25 ? 'bg-amber-400' : 'bg-forest-accent'}"
                style="width: {Math.min(100, Math.max(4, secessionProb))}%"
              ></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div class="py-1 border-b border-charcoal-mid/50 space-y-0.5">
              <div class="flex justify-between text-wheat-dark">
                <span>مؤشر الاندماج:</span>
                <span class="font-bold {integrationIndex >= 80 ? 'text-forest-accent' : 'text-wheat-gold'}">{integrationIndex}%</span>
              </div>
              <div class="w-full bg-charcoal-surface h-1.5 overflow-hidden">
                <div class="h-full bg-forest-accent" style="width: {Math.min(100, integrationIndex)}%"></div>
              </div>
              <span class="text-[8.5px] text-wheat-dark block">مستهدف النهاية الكبرى: 80%+</span>
            </div>
            <div class="py-1 border-b border-charcoal-mid/50 space-y-0.5">
              <div class="flex justify-between text-wheat-dark">
                <span>احتقان اللجاة:</span>
                <span class="font-bold {tribalRage > 60 ? 'text-umber-crimson' : 'text-amber-300'}">{tribalRage}%</span>
              </div>
              <div class="w-full bg-charcoal-surface h-1.5 overflow-hidden">
                <div class="h-full {tribalRage > 60 ? 'bg-umber-crimson' : 'bg-amber-400'}" style="width: {Math.min(100, tribalRage)}%"></div>
              </div>
              <span class="text-[8.5px] text-wheat-dark block">توتر خطوط الإمداد والطرق</span>
            </div>
          </div>
        </div>
      {/if}

      <!-- All 14 governorates: compact cards — name, map shape, six key stats -->
      <div class="grid grid-cols-2 gap-1.5">
        {#each Object.values($gameStore.governorates) as node}
          {@const shape = GOV_SHAPE[node.id]}
          <div class="border border-charcoal-mid bg-charcoal-surface/60 p-1.5 space-y-1.5 min-w-0">
            <div class="flex items-center gap-1.5 min-w-0">
              {#if shape}
                <svg viewBox={shape.vb} class="w-11 h-10 shrink-0" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <path
                    d={shape.d}
                    fill={TIER_FILL[node.tier] ?? '#2e6b5f'}
                    fill-opacity="0.85"
                    stroke="#b9a779"
                    stroke-width="1.5"
                    vector-effect="non-scaling-stroke"
                    stroke-linejoin="round"
                  />
                </svg>
              {/if}
              <div class="min-w-0">
                <div class="text-[11px] font-bold text-wheat-light font-heading truncate">{node.nameAr}</div>
                <span
                  class="inline-block px-1.5 py-px text-[8.5px] font-bold border font-mono {node.tier === 'CALM' ? 'bg-forest-mid border-forest-accent text-forest-accent' : node.tier === 'TENSE' ? 'bg-charcoal-surface border-wheat-mid text-wheat-gold' : 'bg-umber-deep border-umber-crimson text-umber-crimson'}"
                >
                  {TIER_NAMES_AR[node.tier] ?? node.tier}
                </span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-1">
              <div class="flex items-center gap-1 bg-forest-deep/60 border border-charcoal-mid/60 px-1 py-0.5 min-w-0" title={STAT_EXPLAINERS_AR.unrepairedDamageUSD}>
                <GameIcon name="damaged-house" cls="w-3.5 h-3.5 text-umber-crimson shrink-0" />
                <div class="min-w-0">
                  <div class="text-[8px] text-wheat-dark truncate">الخسائر المادية</div>
                  <div class="text-[10px] font-bold text-umber-crimson font-mono truncate" dir="ltr">{(node.unrepairedDamageUSD / 1_000_000_000).toFixed(1)}B$</div>
                </div>
              </div>
              <div class="flex items-center gap-1 bg-forest-deep/60 border border-charcoal-mid/60 px-1 py-0.5 min-w-0" title="إجمالي الأصول الرأسمالية قبل الحرب">
                <GameIcon name="money-stack" cls="w-3.5 h-3.5 text-wheat-mid shrink-0" />
                <div class="min-w-0">
                  <div class="text-[8px] text-wheat-dark truncate">أصول قبل الحرب</div>
                  <div class="text-[10px] font-bold text-wheat-light font-mono truncate" dir="ltr">{(node.totalCapitalUSD / 1_000_000_000).toFixed(1)}B$</div>
                </div>
              </div>
              <div class="flex items-center gap-1 bg-forest-deep/60 border border-charcoal-mid/60 px-1 py-0.5 min-w-0" title={STAT_EXPLAINERS_AR.reconstructionScore}>
                <GameIcon name="brick-wall" cls="w-3.5 h-3.5 text-wheat-gold shrink-0" />
                <div class="min-w-0">
                  <div class="text-[8px] text-wheat-dark truncate">التعافي والإعمار</div>
                  <div class="text-[10px] font-bold text-wheat-gold font-mono truncate">{Math.round(node.reconstructionScore * 100)}%</div>
                </div>
              </div>
              <div class="flex items-center gap-1 bg-forest-deep/60 border border-charcoal-mid/60 px-1 py-0.5 min-w-0" title={STAT_EXPLAINERS_AR.dailyPowerHours}>
                <GameIcon name="power-generator" cls="w-3.5 h-3.5 text-wheat-dark shrink-0" />
                <div class="min-w-0">
                  <div class="text-[8px] text-wheat-dark truncate">الظلام اليومي</div>
                  <div class="text-[10px] font-bold font-mono truncate {node.dailyBlackoutHours > 12 ? 'text-umber-crimson' : 'text-wheat-light'}">{node.dailyBlackoutHours} س/يوم</div>
                </div>
              </div>
              <div class="flex items-center gap-1 bg-forest-deep/60 border border-charcoal-mid/60 px-1 py-0.5 min-w-0" title={STAT_EXPLAINERS_AR.mineSaturationPct}>
                <GameIcon name="minefield" cls="w-3.5 h-3.5 text-umber-crimson shrink-0" />
                <div class="min-w-0">
                  <div class="text-[8px] text-wheat-dark truncate">التلوث بالألغام</div>
                  <div class="text-[10px] font-bold font-mono truncate {node.mineSaturationPct > 8 ? 'text-wheat-gold' : 'text-forest-accent'}">{node.mineSaturationPct}%</div>
                </div>
              </div>
              <div class="flex items-center gap-1 bg-forest-deep/60 border border-charcoal-mid/60 px-1 py-0.5 min-w-0" title={STAT_EXPLAINERS_AR.prri}>
                <GameIcon name="flame" cls="w-3.5 h-3.5 text-umber-crimson shrink-0" />
                <div class="min-w-0">
                  <div class="text-[8px] text-wheat-dark truncate">الاحتقان المحلي</div>
                  <div class="text-[10px] font-bold text-wheat-light font-mono truncate">{node.prri}</div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
