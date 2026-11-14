<script lang="ts">
  import { flip } from 'svelte/animate';
  import { gameStore } from '../../../stores/game-store';
  import { draftStore, budgetStore } from '../../../stores/draft-store';
  import { uiStore } from '../../../stores/ui-store';
  import {
    CHARITY_FUND_COST_SYP,
    IMPORT_SURGE_COST_USD,
    POPULIST_GRANT_COST_SYP,
  } from '../../../engine/revenues';
  import ActionRow from '../../kit/ActionRow.svelte';
  import DoneRow from '../../kit/DoneRow.svelte';
  import FxChip, { type FxTone } from '../../kit/FxChip.svelte';
  import GroupDivider from '../../kit/GroupDivider.svelte';
  import Lever from '../../kit/Lever.svelte';
  import Stance, { type StanceOption } from '../../kit/Stance.svelte';
  import {
    buildFilteredDisplayRows,
    flipDuration,
    type AvailabilityTier,
  } from '../../kit/reorder';
  import {
    formatBillion,
    previewGridCapExGain,
    previewWageUnrestRelief,
  } from '../../panels/shared';
  import { isSectionOptionRelated } from '../../shell/section-nav';

  const maxCapEx = 80;

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let openExplainers = $state<Record<string, boolean>>({});

  function toggleExplainer(key: string): void {
    openExplainers[key] = !openExplainers[key];
  }

  function isDimmed(key: string): boolean {
    return Boolean(selectedStat) && !isSectionOptionRelated(selectedStat, key);
  }

  // ── Stances: Food Subsidy & Wheat Procurement (from PoliciesPanel) ──────
  const foodOptions: StanceOption[] = [
    {
      value: 'AUSTERE',
      label: 'تقشف',
      title: '+15 احتقان · +9.00B توفير',
      chips: [
        { text: '+15 احتقان', tone: 'bad' },
        { text: '+9.00B توفير', tone: 'good' },
      ],
    },
    {
      value: 'STANDARD',
      label: 'اعتيادي',
      title: '0 احتقان · مستقر',
      chips: [
        { text: '0 احتقان', tone: 'neutral' },
        { text: 'مستقر', tone: 'neutral' },
      ],
    },
    {
      value: 'GENEROUS',
      label: 'موسع',
      title: '-12 احتقان · -8.00B كلفة',
      chips: [
        { text: '-12 احتقان', tone: 'good' },
        { text: '-8.00B كلفة', tone: 'bad' },
      ],
    },
  ];

  const wheatOptions: StanceOption[] = [
    {
      value: 'SUBSIDIZED_LOW',
      label: 'سعر إلزامي',
      title: '+$60M استيراد · +6 احتقان',
      chips: [
        { text: '+$60M استيراد', tone: 'bad' },
        { text: '+6 احتقان', tone: 'bad' },
      ],
    },
    {
      value: 'MARKET_PARITY',
      label: 'سعر عادل',
      title: 'استقرار · سوق حر',
      chips: [
        { text: 'استقرار', tone: 'neutral' },
        { text: 'سوق حر', tone: 'neutral' },
      ],
    },
    {
      value: 'PREMIUM_INCENTIVE',
      label: 'علاوة تحفيز',
      title: 'توريد 100% · -4.50B كلفة',
      chips: [
        { text: 'توريد 100%', tone: 'good' },
        { text: '-4.50B كلفة', tone: 'bad' },
      ],
    },
  ];

  // ── Grid CapEx calculations ───────────────────────────────────────────────
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
  let capacityGain = $derived(
    gridCapExM * 1_000_000 >= 35_000_000
      ? 1.0
      : gridCapExM * 1_000_000 >= 20_000_000
        ? 0.5
        : gridCapExM === 0
          ? -1.0
          : 0
  );
  let capacityRevenueB = $derived((capacityGain * 0.35).toFixed(2));

  // ── Programs & Grants ("برامج ومنح") ────────────────────────────────────
  let brainGainOn = $derived($draftStore.expatriateBrainGainIncentive);
  let canAffordBrainGain = $derived(
    brainGainOn || $budgetStore.canAffordWithFxCoverage(20_000_000, 3_500_000_000)
  );
  let isBrainGainCoveredByFX = $derived(
    !brainGainOn && $budgetStore.isCoveredByFX(20_000_000, 3_500_000_000)
  );

  let charityOn = $derived($draftStore.charityFundActive);
  let canAffordCharity = $derived(
    charityOn || $budgetStore.canAffordWithFxCoverage(0, CHARITY_FUND_COST_SYP)
  );
  let isCharityCoveredByFX = $derived(
    !charityOn && $budgetStore.isCoveredByFX(0, CHARITY_FUND_COST_SYP)
  );

  let grantOn = $derived($draftStore.populistGrant);
  let canAffordGrant = $derived(
    grantOn || $budgetStore.canAffordWithFxCoverage(0, POPULIST_GRANT_COST_SYP)
  );
  let isGrantCoveredByFX = $derived(
    !grantOn && $budgetStore.isCoveredByFX(0, POPULIST_GRANT_COST_SYP)
  );

  let surgeOn = $derived($draftStore.importSurge);
  let canAffordSurge = $derived(
    surgeOn || ($gameStore.macro.reservesUSD ?? 0) >= IMPORT_SURGE_COST_USD
  );

  interface ProgramChip {
    text: string;
    tone: FxTone;
    icon?: string;
  }

  interface ProgramItem {
    id: 'brainGain' | 'charityFund' | 'populistGrant' | 'importSurge';
    title: string;
    description: string;
    cost: string;
    doneCost: string;
    active: boolean;
    canAfford: boolean;
    lockReason: string;
    tooltip: string;
    chips: ProgramChip[];
    activate: () => void;
    remove: () => void;
  }

  let programs = $derived.by<ProgramItem[]>(() => [
    {
      id: 'brainGain',
      title: 'حوافز استقطاب الكفاءات والمهاجرين',
      description: 'تفعيل مستمر دورياً لاستقطاب الكفاءات ورفع الثقة.',
      cost: '-$20M',
      doneCost: '-$20M · -3.50B SP',
      active: brainGainOn,
      canAfford: canAffordBrainGain,
      lockReason: 'ميزانية غير كافية',
      tooltip:
        !brainGainOn && !canAffordBrainGain
          ? 'ميزانية غير كافية لتفعيل حوافز الاستقطاب'
          : 'حوافز استقطاب الكفاءات والمهاجرين',
      chips: [
        { text: '-3.50B SP', tone: 'bad' },
        { text: '+8% كفاءة', tone: 'good' },
        { text: '+4 ثقة', tone: 'good' },
        ...(isBrainGainCoveredByFX && !brainGainOn
          ? [{ text: 'مغطى بالنقد الأجنبي', tone: 'good' as const, icon: 'checked-shield' }]
          : []),
      ],
      activate: () => {
        if (canAffordBrainGain) draftStore.setField('expatriateBrainGainIncentive', true);
      },
      remove: () => draftStore.setField('expatriateBrainGainIncentive', false),
    },
    {
      id: 'charityFund',
      title: 'صندوق الكرامة السيادي (إعانات أسر الشهداء)',
      description: 'إعانات دورية مستمرة تشحن الرصيد السياسي وترفع الثقة الشعبية.',
      cost: `-${formatBillion(CHARITY_FUND_COST_SYP)}B SP`,
      doneCost: `-${formatBillion(CHARITY_FUND_COST_SYP)}B SP`,
      active: charityOn,
      canAfford: canAffordCharity,
      lockReason: 'موقوف مؤقتاً: ميزانية غير كافية لصندوق الكرامة',
      tooltip:
        !charityOn && !canAffordCharity
          ? 'ميزانية غير كافية لتفعيل صندوق الكرامة'
          : 'صندوق الكرامة السيادي (إعانات أسر الشهداء)',
      chips: [
        { text: '+3 رصيد سياسي/دور', tone: 'good' },
        { text: '+1 ثقة', tone: 'good' },
        ...(isCharityCoveredByFX && !charityOn
          ? [{ text: 'مغطى بالنقد الأجنبي', tone: 'good' as const, icon: 'checked-shield' }]
          : []),
      ],
      activate: () => {
        if (canAffordCharity) draftStore.setField('charityFundActive', true);
      },
      remove: () => draftStore.setField('charityFundActive', false),
    },
    {
      id: 'populistGrant',
      title: 'منحة شعبية استثنائية',
      description: 'تحويل نقدي مباشر يشتري ولاء الشارع ويشحن الرصيد السياسي فوراً.',
      cost: `-${formatBillion(POPULIST_GRANT_COST_SYP)}B SP`,
      doneCost: `-${formatBillion(POPULIST_GRANT_COST_SYP)}B SP`,
      active: grantOn,
      canAfford: canAffordGrant,
      lockReason: 'موقوف مؤقتاً: ميزانية غير كافية (7.50B SP)',
      tooltip:
        !grantOn && !canAffordGrant
          ? 'موقوف مؤقتاً: ميزانية غير كافية (7.50B SP)'
          : 'منحة شعبية استثنائية',
      chips: [
        { text: '+8 رصيد سياسي', tone: 'good' },
        { text: 'لمرة واحدة هذا الدور', tone: 'neutral' },
        ...(isGrantCoveredByFX && !grantOn
          ? [{ text: 'مغطى بالنقد الأجنبي', tone: 'good' as const, icon: 'checked-shield' }]
          : []),
      ],
      activate: () => {
        if (canAffordGrant) draftStore.setField('populistGrant', true);
      },
      remove: () => draftStore.setField('populistGrant', false),
    },
    {
      id: 'importSurge',
      title: 'دفعة استيراد إغاثية طارئة (غذاء ووقود)',
      description: 'شراء دولاري سريع يسد نقص الغذاء والوقود ويطفئ الغضب الشعبي.',
      cost: `-$${(IMPORT_SURGE_COST_USD / 1_000_000).toFixed(0)}M`,
      doneCost: `-$${(IMPORT_SURGE_COST_USD / 1_000_000).toFixed(0)}M`,
      active: surgeOn,
      canAfford: canAffordSurge,
      lockReason: 'موقوف مؤقتاً: احتياطي النقد الأجنبي غير كافٍ ($40M)',
      tooltip:
        !surgeOn && !canAffordSurge
          ? 'موقوف مؤقتاً: احتياطي النقد الأجنبي غير كافٍ ($40M)'
          : 'دفعة استيراد إغاثية طارئة (غذاء ووقود)',
      chips: [
        { text: '+6 رصيد سياسي', tone: 'good' },
        { text: '−1 سا تقنين / −2 احتقان', tone: 'good' },
        { text: 'لمرة واحدة هذا الدور', tone: 'neutral' },
      ],
      activate: () => {
        if (canAffordSurge) draftStore.setField('importSurge', true);
      },
      remove: () => draftStore.setField('importSurge', false),
    },
  ]);

  let pendingPrograms = $derived(programs.filter((p) => !p.active));
  let activatedPrograms = $derived(programs.filter((p) => p.active));

  type SpendingEntry =
    | { kind: 'control'; key: 'wageBumpPercent' | 'foodSubsidyLevel' | 'wheatProcurement' | 'gridCapExUSD' }
    | { kind: 'program'; key: ProgramItem['id']; program: ProgramItem };

  type DisplayEntry =
    | { kind: 'control'; key: 'wageBumpPercent' | 'foodSubsidyLevel' | 'wheatProcurement' | 'gridCapExUSD'; related: boolean }
    | { kind: 'program'; key: ProgramItem['id']; program: ProgramItem; related: boolean }
    | { kind: 'programs-heading'; key: string }
    | { kind: 'divider'; key: string; count: number };

  const TOP_CONTROL_KEYS: readonly ('wageBumpPercent' | 'foodSubsidyLevel' | 'wheatProcurement' | 'gridCapExUSD')[] = [
    'wageBumpPercent',
    'foodSubsidyLevel',
    'wheatProcurement',
    'gridCapExUSD',
  ];

  let displayEntries = $derived.by<DisplayEntry[]>(() => {
    if (!selectedStat) {
      const rows: DisplayEntry[] = TOP_CONTROL_KEYS.map((k) => ({
        kind: 'control',
        key: k,
        related: true,
      }));
      if (pendingPrograms.length > 0) {
        rows.push({ kind: 'programs-heading', key: '__programs_heading__' });
        const orderedPrograms = [...pendingPrograms].sort(
          (a, b) => Number(!a.canAfford) - Number(!b.canAfford)
        );
        for (const p of orderedPrograms) {
          rows.push({ kind: 'program', key: p.id, program: p, related: true });
        }
      }
      return rows;
    }

    const combined: SpendingEntry[] = [
      ...TOP_CONTROL_KEYS.map((k) => ({ kind: 'control' as const, key: k })),
      ...pendingPrograms.map((p) => ({ kind: 'program' as const, key: p.id, program: p })),
    ];

    const filtered = buildFilteredDisplayRows(
      combined,
      selectedStat,
      (e) => e.key,
      (e) => isSectionOptionRelated(selectedStat, e.key),
      (e): AvailabilityTier => (e.kind === 'program' && !e.program.canAfford ? 1 : 0)
    );

    return filtered.map((r): DisplayEntry => {
      if (r.kind === 'divider') {
        return { kind: 'divider', key: r.key, count: r.count };
      }
      if (r.item.kind === 'control') {
        return { kind: 'control', key: r.item.key, related: r.related };
      }
      return {
        kind: 'program',
        key: r.item.key,
        program: r.item.program,
        related: r.related,
      };
    });
  });

  let wageUsdDelta = $derived(
    Math.round(
      (($gameStore.macro.civilServiceWageSYP || 4_050) * ($draftStore.wageBumpPercent / 100)) /
        ($gameStore.macro.parallelRateSYP || 150)
    )
  );
  let wageRelief = $derived(previewWageUnrestRelief($draftStore.wageBumpPercent));
  let wageCostB = $derived(
    (
      ((($gameStore.macro.civilServiceHeadcount ?? 1_400_000) *
        ($gameStore.macro.civilServiceWageSYP || 450_000) *
        ($draftStore.wageBumpPercent / 100) *
        6) /
        1_000_000_000)
    ).toFixed(2)
  );
</script>

<div class="flex flex-col gap-2" role="tabpanel" aria-label="الإنفاق">
  <div class="oc-grid-2-wide">
    {#each displayEntries as entry (entry.key)}
      <div
        animate:flip={{ duration: flipDuration() }}
        class={entry.kind === 'program' ? 'h-full' : 'col-span-full'}
      >
        {#if entry.kind === 'programs-heading'}
          <GroupDivider label="برامج ومنح" tone="accent" />
        {:else if entry.kind === 'divider'}
          <GroupDivider label="غير مرتبط بهذا المؤشر" count={entry.count} />
        {:else if entry.kind === 'control' && entry.key === 'wageBumpPercent'}
          <!-- Civil Service Wages -->
          <Lever
            title="زيادة أجور العاملين في الدولة"
            display={`+${$draftStore.wageBumpPercent}%`}
            value={$draftStore.wageBumpPercent}
            min={0}
            max={400}
            step={5}
            default={0}
            ariaLabel="زيادة أجور العاملين في الدولة"
            minLabel="0%"
            maxLabel="+400%"
            onchange={(value) => draftStore.setField('wageBumpPercent', value)}
            explainerOpen={openExplainers.wage ?? false}
            onToggleExplainer={() => toggleExplainer('wage')}
            dimmed={Boolean(selectedStat) && !entry.related}
          >
            {#snippet chips()}
              <FxChip
                text={wageUsdDelta > 0 ? `+$${wageUsdDelta}/شهر` : '$0/شهر'}
                tone={wageUsdDelta > 0 ? 'good' : 'neutral'}
              />
              <FxChip
                text={wageRelief > 0 ? `−${wageRelief} احتقان` : '0 احتقان'}
                tone={wageRelief > 0 ? 'good' : 'neutral'}
              />
              <FxChip
                text={$draftStore.wageBumpPercent > 0 ? `−${wageCostB}B SP` : '0.00B SP'}
                tone={$draftStore.wageBumpPercent > 0 ? 'bad' : 'neutral'}
              />
            {/snippet}
            {#snippet explainer()}
              زيادة الرواتب بنسبة +{$draftStore.wageBumpPercent}% ترفع متوسط الأجر الحقيقي لموظفي الدولة وتمتص الاحتقان الشعبي، مقابل زيادة كتلة الرواتب بـSP ومخاطر عجز الموازنة.
            {/snippet}
          </Lever>
        {:else if entry.kind === 'control' && entry.key === 'foodSubsidyLevel'}
          <!-- Food Subsidies Tier -->
          <Stance
            title="التحكم في أسعار وتوفر الخبز والمواد الأساسية"
            value={$draftStore.foodSubsidyLevel}
            options={foodOptions}
            onchange={(value) =>
              draftStore.setField('foodSubsidyLevel', value as 'AUSTERE' | 'STANDARD' | 'GENEROUS')}
            explainerOpen={openExplainers.food ?? false}
            onToggleExplainer={() => toggleExplainer('food')}
            dimmed={Boolean(selectedStat) && !entry.related}
          >
            {#snippet explainer()}
              {#if $draftStore.foodSubsidyLevel === 'AUSTERE'}
                <span class="font-bold text-[var(--c-accent)]">الأثر:</span> تقليص مخصصات الدعم بنسبة 50% وتوفير سيولة SP، لكن يرفع أسعار الخبز ويزيد الاحتقان الشعبي (+15 نقطة).
              {:else if $draftStore.foodSubsidyLevel === 'GENEROUS'}
                <span class="font-bold text-[var(--c-pos)]">الأثر:</span> تثبيت شامل لأسعار الخبز والسلع وتخفيض الاحتقان (-12 نقطة)، مع استنزاف إضافي لسيولة SP والدولار لاستيراد القمح.
              {:else}
                <span class="font-bold text-[var(--c-text-2)]">الأثر:</span> دعم متوازن يضمن توفير الخبز والمواد التموينية المدعومة ضمن الحدود المالية المقبولة للموازنة.
              {/if}
            {/snippet}
          </Stance>
        {:else if entry.kind === 'control' && entry.key === 'wheatProcurement'}
          <!-- Wheat Procurement -->
          <Stance
            title="تسعير شراء القمح المحلي من المزارعين"
            value={$draftStore.wheatProcurement}
            options={wheatOptions}
            onchange={(value) =>
              draftStore.setField(
                'wheatProcurement',
                value as 'SUBSIDIZED_LOW' | 'MARKET_PARITY' | 'PREMIUM_INCENTIVE'
              )}
            explainerOpen={openExplainers.wheat ?? false}
            onToggleExplainer={() => toggleExplainer('wheat')}
            dimmed={Boolean(selectedStat) && !entry.related}
          >
            {#snippet explainer()}
              {#if $draftStore.wheatProcurement === 'SUBSIDIZED_LOW'}
                <span class="font-bold text-[var(--c-accent)]">الأثر:</span> لا يخفّض نفقات الخزينة بـSP، بل يرفع فاتورة استيراد القمح بالدولار (+$60M) لأن المزارعين يهرّبون المحصول ويتراجع المخزون التمويني.
              {:else if $draftStore.wheatProcurement === 'PREMIUM_INCENTIVE'}
                <span class="font-bold text-[var(--c-pos)]">الأثر:</span> علاوة مجزية تضمن توريد كامل القمح السوري وتقلص استيراد الحبوب بالدولار، مقابل زيادة نفقات الخزينة بـSP.
              {:else}
                <span class="font-bold text-[var(--c-text-2)]">الأثر:</span> تسعير عادل يضمن توريد القمح المحلي بالسعر الرائج واستقرار مخزون الطحين.
              {/if}
            {/snippet}
          </Stance>
        {:else if entry.kind === 'control' && entry.key === 'gridCapExUSD'}
          <!-- Grid CapEx -->
          <Lever
            title="تأهيل محطات التوليد والشبكات القومية"
            display={`$${gridCapExM}M`}
            value={gridCapExM}
            min={0}
            max={maxCapEx}
            step={5}
            default={35}
            ariaLabel="استثمار الشبكة"
            minLabel="$0M"
            maxLabel="$80M"
            onchange={(value) => draftStore.setField('gridCapExUSD', value * 1_000_000)}
            explainerOpen={openExplainers.grid ?? false}
            onToggleExplainer={() => toggleExplainer('grid')}
            dimmed={Boolean(selectedStat) && !entry.related}
          >
            {#snippet chips()}
              <FxChip
                text={gridCapExM === 0 ? '$0M كاش (تقشف تام)' : `-$${gridCapExM}M كاش`}
                tone={gridCapExM === 0 ? 'neutral' : 'bad'}
              />
              <FxChip
                text={effectiveGridMW > 0 ? `+${effectiveGridMW} ميغاواط` : `${effectiveGridMW} ميغاواط`}
                tone={gridCapExM === 0 ? 'bad' : 'good'}
              />
              <FxChip
                text={effectivePowerHoursDelta > 0
                  ? `+${effectivePowerHoursDelta} س/يوم`
                  : `${effectivePowerHoursDelta} س/يوم`}
                tone={gridCapExM === 0 ? 'bad' : 'good'}
              />
              <FxChip
                text={capacityGain <= 0 ? 'تآكل القدرة الإنتاجية' : `+${capacityRevenueB}B إيراد تدريجي/دور`}
                tone={capacityGain <= 0 ? 'bad' : 'good'}
              />
            {/snippet}
            {#snippet explainer()}
              {gridCapExM === 0
                ? 'تجميد الاستثمار الرأسمالي يوفر السيولة الدولارية ($0M كاش)، لكنه يسبب تراجع قدرة الشبكة بنحو 120 ميغاواط وتمديد ساعات التقنين في المحافظات (-0.5 سا/يوم) وزيادة الاحتقان.'
                : gridCapExM === 35
                  ? `الحالة المحايدة ($35M): صيانة دورية تؤمن +${effectiveGridMW} ميغاواط وتزيد التغذية بنحو +${effectivePowerHoursDelta} ساعة/يوم في كافة المحافظات، مما يدعم النشاط الاقتصادي واستقرار الشبكة.`
                  : `استثمار $${gridCapExM}M يضيف نحو ${effectiveGridMW} ميغاواط للشبكة القومية (${effectivePowerHoursDelta > 0 ? '+' : ''}${effectivePowerHoursDelta} سا/يوم)، مما يخفض ساعات التقنين بالمحافظات ويدعم النشاط الصناعي والامتثال الضريبي، ويراكم القدرة الإنتاجية (+${capacityRevenueB}B إيراد تدريجي/دور).`}
            {/snippet}
          </Lever>
        {:else if entry.kind === 'program'}
          {@const program = entry.program}
          {@const locked = !program.canAfford}
          <div title={program.tooltip} data-decree-id={program.id} class="h-full [&>.act]:h-full">
            <ActionRow
              title={program.title}
              description={program.description}
              cost={program.cost}
              costTone="neg"
              buttonLabel={locked ? 'مقفل' : 'تفعيل'}
              {locked}
              lockReason={locked ? program.lockReason : ''}
              dimmed={Boolean(selectedStat) && !entry.related}
              onclick={program.activate}
            >
              {#snippet chips()}
                {#each program.chips as chip, idx (chip.text + idx)}
                  <FxChip text={chip.text} tone={chip.tone} icon={chip.icon ?? ''} />
                {/each}
              {/snippet}
            </ActionRow>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Activated this turn ("مفعّل هذا الدور · N") -->
  {#if activatedPrograms.length > 0}
    <GroupDivider label="مفعّل هذا الدور" count={activatedPrograms.length} />
    <div class="flex flex-col gap-1.5">
      {#each activatedPrograms as program (program.id)}
        <div data-decree-id={program.id}>
          <DoneRow
            title={program.title}
            cost={program.doneCost}
            dimmed={isDimmed(program.id)}
            onremove={program.remove}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
