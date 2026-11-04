<script lang="ts">
  import { draftStore } from '../../stores/draft-store';
  import { gameStore } from '../../stores/game-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import Segmented, { type SegmentedOption } from '../controls/Segmented.svelte';
  import { activeFacilityLocks } from '../../engine/facilities';
  import { isOptionRelated } from './shared';

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  // ABSORB_MILITIAS payroll delta: the engine sets headcount to 1.4M × 1.20,
  // so the card advertises the real +280k jobs and their SYP bill.
  let absorbHeadcount = $derived(Math.round(1_400_000 * 1.2) - ($gameStore.macro.civilServiceHeadcount ?? 1_400_000));
  let absorbPayrollB = $derived(
    ((absorbHeadcount * ($gameStore.macro.civilServiceWageSYP ?? 4_050) * 6) / 1_000_000_000).toFixed(2)
  );

  // IMF conditionality lock: while active, diesel policy is pinned to CRACKDOWN.
  function dieselGuard(value: 'CRACKDOWN' | 'STANDARD' | 'PERMISSIVE'): string | null {
    const res = draftStore.setFieldGuarded($gameStore, 'dieselSmuggling', value);
    return res.applied ? null : (res.blockedAr ?? 'مقفل بشرط التسهيل');
  }
  let dieselLock = $derived(activeFacilityLocks($gameStore).dieselLocked);
  let dieselLockNote = $derived.by(() => {
    const locks = activeFacilityLocks($gameStore);
    return locks.dieselLocked ? `مقفل بشرط التسهيل — ${locks.dieselTurnsLeft} دورات متبقية` : '';
  });

  // Collapsible per-section effect explainers (help icon before each title, hidden by default)
  let openExplainers = $state<Record<string, boolean>>({});
  function toggleExplainer(key: string): void {
    openExplainers[key] = !openExplainers[key];
  }

  const foodOptions: SegmentedOption[] = [
    {
      value: 'AUSTERE',
      label: 'تقشف',
      chips: [
        { text: '+15 احتقان', tone: 'bad' },
        { text: '+9.00B توفير', tone: 'good' },
      ],
    },
    {
      value: 'STANDARD',
      label: 'اعتيادي',
      chips: [
        { text: '0 احتقان', tone: 'neutral' },
        { text: 'مستقر', tone: 'neutral' },
      ],
    },
    {
      value: 'GENEROUS',
      label: 'موسع',
      chips: [
        { text: '-12 احتقان', tone: 'good' },
        { text: '-8.00B كلفة', tone: 'bad' },
      ],
    },
  ];

  let workforceOptions = $derived.by((): SegmentedOption[] => [
    {
      value: 'MAINTAIN',
      label: 'تثبيت الملاك',
      chips: [
        { text: 'استقرار', tone: 'neutral' },
        { text: 'اعتيادي', tone: 'neutral' },
      ],
    },
    {
      value: 'PRUNE_CIVIL_SERVICE',
      label: 'شطب الوهمي',
      chips: [
        { text: '+8.50B توفير', tone: 'good' },
        { text: '+7 احتقان', tone: 'bad' },
      ],
    },
    {
      value: 'ABSORB_MILITIAS',
      label: 'استيعاب المسلحين',
      chips: [
        { text: `+${absorbHeadcount.toLocaleString('en-US')} وظيفة`, tone: 'good' },
        { text: '-4 توتر', tone: 'good' },
        { text: '+امتثال تدريجي', tone: 'good' },
        { text: `-${absorbPayrollB}B كلفة`, tone: 'bad' },
      ],
    },
  ]);

  const wheatOptions: SegmentedOption[] = [
    {
      value: 'SUBSIDIZED_LOW',
      label: 'سعر إلزامي',
      chips: [
        { text: '+$60M استيراد', tone: 'bad' },
        { text: '+6 احتقان', tone: 'bad' },
      ],
    },
    {
      value: 'MARKET_PARITY',
      label: 'سعر عادل',
      chips: [
        { text: 'استقرار', tone: 'neutral' },
        { text: 'سوق حر', tone: 'neutral' },
      ],
    },
    {
      value: 'PREMIUM_INCENTIVE',
      label: 'علاوة تحفيز',
      chips: [
        { text: 'توريد 100%', tone: 'good' },
        { text: '-4.50B كلفة', tone: 'bad' },
      ],
    },
  ];

  let dieselOptions = $derived.by((): SegmentedOption[] => [
    {
      value: 'CRACKDOWN',
      label: 'حملة صارمة',
      chips: [
        { text: '+كهرباء وإنتاج', tone: 'good' },
        { text: '+4 توتر', tone: 'bad' },
      ],
    },
    {
      value: 'STANDARD',
      label: 'رقابة اعتيادية',
      title: dieselLock ? dieselLockNote : 'رقابة روتينية',
      chips: [
        { text: 'متوازن', tone: 'neutral' },
        { text: 'روتيني', tone: 'neutral' },
      ],
    },
    {
      value: 'PERMISSIVE',
      label: 'غض الطرف',
      title: dieselLock ? dieselLockNote : 'تفادي الصدام',
      chips: [
        { text: 'تفادي الصدام', tone: 'neutral' },
        { text: '-كهرباء', tone: 'bad' },
      ],
    },
  ]);

  function cardClass(key: string): string {
    if (!selectedStat) return 'pointer-events-auto opacity-100';
    return isOptionRelated(selectedStat, key)
      ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100'
      : 'opacity-20 pointer-events-none select-none grayscale';
  }
</script>

<div class="space-y-3">
  <!-- Food Subsidies Tier -->
  <article
    class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass(
      'foodSubsidyLevel'
    )}"
  >
    <div class="flex items-start gap-1.5">
      <button
        type="button"
        onclick={() => toggleExplainer('food')}
        aria-label="إظهار الأثر"
        aria-expanded={openExplainers.food ?? false}
        class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold"
      >
        <GameIcon name="help" cls="h-4 w-4" />
      </button>
      <div class="min-w-0 flex-1 pt-2">
        <div class="flex items-center gap-1.5 font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">
          <GameIcon name="coins" cls="h-3.5 w-3.5 shrink-0" />
          <span>التحكم في أسعار وتوفر الخبز والمواد الأساسية</span>
        </div>
      </div>
    </div>

    <Segmented
      value={$draftStore.foodSubsidyLevel}
      options={foodOptions}
      label="سياسة دعم الغذاء"
      onchange={(value) => draftStore.setField('foodSubsidyLevel', value as 'AUSTERE' | 'STANDARD' | 'GENEROUS')}
    />

    <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.food ? '' : 'hidden'}">
      {#if $draftStore.foodSubsidyLevel === 'AUSTERE'}
        <span class="font-medium text-amber-300">الأثر:</span> تقليص مخصصات الدعم بنسبة 50% وتوفير سيولة SP، لكن يرفع أسعار الخبز ويزيد الاحتقان الشعبي (+15 نقطة).
      {:else if $draftStore.foodSubsidyLevel === 'GENEROUS'}
        <span class="font-medium text-forest-accent">الأثر:</span> تثبيت شامل لأسعار الخبز والسلع وتخفيض الاحتقان (-12 نقطة)، مع استنزاف إضافي لسيولة SP والدولار لاستيراد القمح.
      {:else}
        <span class="font-medium text-wheat-mid">الأثر:</span> دعم متوازن يضمن توفير الخبز والمواد التموينية المدعومة ضمن الحدود المالية المقبولة للموازنة.
      {/if}
    </div>
  </article>

  <!-- State Workforce Policy -->
  <article
    class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass(
      'workforceStrategy'
    )}"
  >
    <div class="flex items-start gap-1.5">
      <button
        type="button"
        onclick={() => toggleExplainer('workforce')}
        aria-label="إظهار الأثر"
        aria-expanded={openExplainers.workforce ?? false}
        class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold"
      >
        <GameIcon name="help" cls="h-4 w-4" />
      </button>
      <div class="min-w-0 flex-1 pt-2">
        <div class="flex items-center gap-1.5 font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">
          <GameIcon name="meeple-group" cls="h-3.5 w-3.5 shrink-0" />
          <span>إدارة الوظائف الحكومية والبطالة المقنعة</span>
        </div>
      </div>
    </div>

    <Segmented
      value={$draftStore.workforceStrategy}
      options={workforceOptions}
      label="سياسة الوظائف الحكومية"
      onchange={(value) =>
        draftStore.setField(
          'workforceStrategy',
          value as 'MAINTAIN' | 'PRUNE_CIVIL_SERVICE' | 'ABSORB_MILITIAS'
        )}
    />

    <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.workforce ? '' : 'hidden'}">
      {#if $draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE'}
        <span class="font-medium text-amber-300">الأثر:</span> شطب البطالة المقنعة والرواتب الوهمية يوفر سيولة الخزينة ويرفع كفاءة الوزارات، مع احتقان وظيفي مؤقت.
      {:else if $draftStore.workforceStrategy === 'ABSORB_MILITIAS'}
        <span class="font-medium text-amber-300">الأثر:</span> استيعاب المقاتلين لتهدئة الجبهات واستقرار الأمن (-4 احتقان)، مقابل تضخم كتلة الرواتب الحكومية (+{absorbHeadcount.toLocaleString('en-US')} وظيفة) — مع اتساع القاعدة الضريبية تدريجياً (+1 امتثال/دور حتى +4).
      {:else}
        <span class="font-medium text-wheat-mid">الأثر:</span> الحفاظ على قوام الموظفين ورواتب الملاك الحكومي الراهن دون تعديل.
      {/if}
    </div>
  </article>

  <!-- Wheat Pricing -->
  <article
    class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass(
      'wheatProcurement'
    )}"
  >
    <div class="flex items-start gap-1.5">
      <button
        type="button"
        onclick={() => toggleExplainer('wheat')}
        aria-label="إظهار الأثر"
        aria-expanded={openExplainers.wheat ?? false}
        class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold"
      >
        <GameIcon name="help" cls="h-4 w-4" />
      </button>
      <div class="min-w-0 flex-1 pt-2">
        <div class="flex items-center gap-1.5 font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">
          <GameIcon name="trade" cls="h-3.5 w-3.5 shrink-0" />
          <span>تسعير شراء القمح المحلي من المزارعين</span>
        </div>
      </div>
    </div>

    <Segmented
      value={$draftStore.wheatProcurement}
      options={wheatOptions}
      label="سياسة شراء القمح"
      onchange={(value) =>
        draftStore.setField(
          'wheatProcurement',
          value as 'SUBSIDIZED_LOW' | 'MARKET_PARITY' | 'PREMIUM_INCENTIVE'
        )}
    />

    <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.wheat ? '' : 'hidden'}">
      {#if $draftStore.wheatProcurement === 'SUBSIDIZED_LOW'}
        <span class="font-medium text-amber-300">الأثر:</span> لا يخفّض نفقات الخزينة بـSP، بل يرفع فاتورة استيراد القمح بالدولار (+$60M) لأن المزارعين يهرّبون المحصول ويتراجع المخزون التمويني.
      {:else if $draftStore.wheatProcurement === 'PREMIUM_INCENTIVE'}
        <span class="font-medium text-forest-accent">الأثر:</span> علاوة مجزية تضمن توريد كامل القمح السوري وتقلص استيراد الحبوب بالدولار، مقابل زيادة نفقات الخزينة بـSP.
      {:else}
        <span class="font-medium text-wheat-mid">الأثر:</span> تسعير عادل يضمن توريد القمح المحلي بالسعر الرائج واستقرار مخزون الطحين.
      {/if}
    </div>
  </article>

  <!-- Diesel Smuggling Control -->
  <article
    class="space-y-2 border border-charcoal-mid/70 bg-forest-mid/25 p-3 transition-all duration-300 {cardClass(
      'dieselSmuggling'
    )}"
  >
    <div class="flex items-start gap-1.5">
      <button
        type="button"
        onclick={() => toggleExplainer('diesel')}
        aria-label="إظهار الأثر"
        aria-expanded={openExplainers.diesel ?? false}
        class="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold"
      >
        <GameIcon name="help" cls="h-4 w-4" />
      </button>
      <div class="min-w-0 flex-1 space-y-1 pt-2">
        <div class="flex flex-wrap items-center gap-1.5 font-heading text-[11.5px] font-bold leading-tight text-wheat-gold">
          <GameIcon name="power-generator" cls="h-3.5 w-3.5 shrink-0" />
          <span>مكافحة تهريب المشتقات النفطية</span>
          {#if dieselLock}
            <span class="border border-amber-500/50 bg-amber-950 px-1.5 py-0.5 font-mono text-[8.5px] font-normal text-amber-300">{dieselLockNote}</span>
          {/if}
        </div>
      </div>
    </div>

    <Segmented
      value={$draftStore.dieselSmuggling}
      options={dieselOptions}
      label="سياسة مكافحة تهريب المشتقات"
      onchange={(value) => dieselGuard(value as 'CRACKDOWN' | 'STANDARD' | 'PERMISSIVE')}
    />

    <div class="py-1 text-[10.5px] leading-relaxed text-wheat-dark {openExplainers.diesel ? '' : 'hidden'}">
      {#if $draftStore.dieselSmuggling === 'CRACKDOWN'}
        <span class="font-medium text-forest-accent">الأثر:</span> ضبط تهريب المازوت وتوجيهه لمحطات التوليد لرفع ساعات الكهرباء، مع استنفار أمني واحتكاك مع شبكات التهريب.
      {:else if $draftStore.dieselSmuggling === 'PERMISSIVE'}
        <span class="font-medium text-amber-300">الأثر:</span> تفادي الصدام العشائري، مقابل هدر المحروقات المدعومة وتراجع ساعات التغذية الكهربائية.
      {:else}
        <span class="font-medium text-wheat-mid">الأثر:</span> رقابة روتينية توازن بين حماية المحروقات وتجنب التصعيد الحدودي.
      {/if}
    </div>
  </article>
</div>
