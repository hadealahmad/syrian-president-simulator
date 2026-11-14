<script lang="ts">
  import { flip } from 'svelte/animate';
  import { gameStore } from '../../../stores/game-store';
  import { draftStore, budgetStore } from '../../../stores/draft-store';
  import { uiStore } from '../../../stores/ui-store';
  import { activeFacilityLocks } from '../../../engine/facilities';
  import type { TurnDirectives } from '../../../engine/types';
  import ActionRow from '../../kit/ActionRow.svelte';
  import FxChip from '../../kit/FxChip.svelte';
  import GroupDivider from '../../kit/GroupDivider.svelte';
  import Stance, { type StanceOption } from '../../kit/Stance.svelte';
  import {
    buildFilteredDisplayRows,
    flipDuration,
    type AvailabilityTier,
  } from '../../kit/reorder';
  import DecreeConfirmDialog from '../../decrees/DecreeConfirmDialog.svelte';
  import { decreePcCost } from '../../decrees/decree-meta';
  import { fx } from '../../fx/feedback';
  import { DECREES, pcShortageText, type PoliticalDecreeItem } from '../../panels/shared';
  import { isSectionOptionRelated } from '../../shell/section-nav';

  type StanceKey =
    | 'workforceStrategy'
    | 'propertyRestitution'
    | 'dieselSmuggling'
    | 'golanBorderStance'
    | 'MARTIAL_LAW';
  const STANCE_KEYS: readonly StanceKey[] = [
    'workforceStrategy',
    'propertyRestitution',
    'dieselSmuggling',
    'golanBorderStance',
    'MARTIAL_LAW',
  ];

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  let openExplainers = $state<Record<string, boolean>>({});
  function toggleExplainer(key: string): void {
    openExplainers = { ...openExplainers, [key]: !openExplainers[key] };
  }

  // ── 1. Workforce strategy (PRESERVES exact calculation & texts) ───────────
  let absorbHeadcount = $derived(
    Math.round(1_400_000 * 1.2) - ($gameStore.macro.civilServiceHeadcount ?? 1_400_000)
  );
  let absorbPayrollB = $derived(
    ((absorbHeadcount * ($gameStore.macro.civilServiceWageSYP ?? 4_050) * 6) / 1_000_000_000).toFixed(2)
  );

  let workforceOptions = $derived.by((): StanceOption[] => [
    {
      value: 'MAINTAIN',
      label: 'تثبيت الملاك',
      title: 'استقرار · اعتيادي',
      chips: [
        { text: 'استقرار', tone: 'neutral' },
        { text: 'اعتيادي', tone: 'neutral' },
      ],
    },
    {
      value: 'PRUNE_CIVIL_SERVICE',
      label: 'شطب الوهمي',
      title: '+8.50B توفير · +7 احتقان',
      chips: [
        { text: '+8.50B توفير', tone: 'good' },
        { text: '+7 احتقان', tone: 'bad' },
      ],
    },
    {
      value: 'ABSORB_MILITIAS',
      label: 'استيعاب المسلحين',
      title: `+${absorbHeadcount.toLocaleString('en-US')} وظيفة · -4 توتر · -${absorbPayrollB}B كلفة`,
      chips: [
        { text: `+${absorbHeadcount.toLocaleString('en-US')} وظيفة`, tone: 'good' },
        { text: '-4 توتر', tone: 'good' },
        { text: '+امتثال تدريجي', tone: 'good' },
        { text: `-${absorbPayrollB}B كلفة`, tone: 'bad' },
      ],
    },
  ]);

  // ── 1b. Property restitution policy (revenues.ts:373-376, turn-manager.ts:535-543) ──
  const restitutionOptions: StanceOption[] = [
    {
      value: 'RESTITUTE_TO_REFUGEES',
      label: 'الرد للاجئين',
      title: '0 احتقان · 0 ثقة · دون عائد مالي',
      chips: [
        { text: '0 احتقان · 0 ثقة', tone: 'neutral' },
        { text: 'دون عائد مالي', tone: 'neutral' },
      ],
    },
    {
      value: 'MONETIZE_AS_STATE_LAND',
      label: 'استثمارها كأملاك دولة',
      title: '+$120M احتياطي · +8.00B SP خزينة · −8 ثقة · +5 احتقان',
      chips: [
        { text: '+$120M احتياطي', tone: 'good' },
        { text: '+8.00B SP خزينة', tone: 'good' },
        { text: '−8 ثقة', tone: 'bad' },
        { text: '+5 احتقان', tone: 'bad' },
      ],
    },
  ];

  // ── 2. Diesel smuggling (PRESERVES IMF conditionality lock) ───────────────
  function dieselGuard(value: 'CRACKDOWN' | 'STANDARD' | 'PERMISSIVE'): void {
    const res = draftStore.setFieldGuarded($gameStore, 'dieselSmuggling', value);
    if (!res.applied) {
      fx('error');
    }
  }

  let dieselLocks = $derived(activeFacilityLocks($gameStore));
  let dieselLock = $derived(dieselLocks.dieselLocked);
  let dieselLockNote = $derived(
    dieselLocks.dieselLocked
      ? `مقفل بشرط التسهيل — ${dieselLocks.dieselTurnsLeft} دورات متبقية`
      : ''
  );

  let dieselOptions = $derived.by((): StanceOption[] => [
    {
      value: 'CRACKDOWN',
      label: 'حملة صارمة',
      title: '+كهرباء وإنتاج · +4 توتر',
      chips: [
        { text: '+كهرباء وإنتاج', tone: 'good' },
        { text: '+4 توتر', tone: 'bad' },
      ],
    },
    {
      value: 'STANDARD',
      label: 'رقابة اعتيادية',
      disabled: dieselLock,
      title: dieselLock ? dieselLockNote : 'رقابة روتينية',
      chips: [
        { text: 'متوازن', tone: 'neutral' },
        { text: 'روتيني', tone: 'neutral' },
      ],
    },
    {
      value: 'PERMISSIVE',
      label: 'غض الطرف',
      disabled: dieselLock,
      title: dieselLock ? dieselLockNote : 'تفادي الصدام',
      chips: [
        { text: 'تفادي الصدام', tone: 'neutral' },
        { text: '-كهرباء', tone: 'bad' },
      ],
    },
  ]);

  // ── 3. Golan border stance (all 4 options incl. Quneitra UN liaison) ─────
  const golanOptions: StanceOption[] = [
    {
      value: 'RESTRAINT',
      label: 'ضبط النفس',
      title: 'ضبط النفس (مجاني): −15 توتر الجولان، لكن +18 تحدٍّ درعاوي و+10 احتقان في درعا',
      chips: [
        { text: '−15 توتر', tone: 'good' },
        { text: '+18 تحدٍّ', tone: 'bad' },
        { text: 'مجاني', tone: 'neutral' },
      ],
    },
    {
      value: 'LOCAL_GENDARMERIE',
      label: 'درك محلي',
      title: 'درك محلي: −8 تحدٍّ درعاوي، +5% تحصيل نصيب، +5 توتر الجولان (توازن آمن)',
      chips: [
        { text: '−8 تحدٍّ', tone: 'good' },
        { text: '+5% نصيب', tone: 'warn' },
        { text: '+5 توتر', tone: 'bad' },
      ],
    },
    {
      value: 'DEPLOY_ARMOR',
      label: 'نشر الدروع',
      title: 'نشر الدروع: −20 تحدٍّ و−8 احتقان درعا والقنيطرة، لكن +25 توتر الجولان وكلفة 9.0B SP',
      chips: [
        { text: '−20 تحدٍّ', tone: 'good' },
        { text: '+25 توتر!', tone: 'bad' },
        { text: '−9.0B SP', tone: 'bad' },
      ],
    },
    {
      value: 'UN_LIAISON',
      label: 'ارتباط أندوف',
      title: 'مكتب ارتباط أندوف (القنيطرة فقط): −10 توتر الجولان دون تحريك التحدي، +2 ثقة، بكلفة بعثة $8M/دور',
      chips: [
        { text: '−10 توتر', tone: 'good' },
        { text: '+2 ثقة', tone: 'good' },
        { text: '−$8M/دور', tone: 'bad' },
      ],
    },
  ];

  // ── 4. Martial Law toggle (moved from DecreesPanel) ───────────────────────
  const martialDecree = DECREES.find((d) => d.id === 'MARTIAL_LAW') as PoliticalDecreeItem;
  let martialConfirmOpen = $state(false);
  let martialActive = $derived($draftStore.activePoliticalActions.includes('MARTIAL_LAW'));
  let martialCostPC = decreePcCost('MARTIAL_LAW');
  let martialCanAfford = $derived(martialActive || martialCostPC <= $budgetStore.remainingPC);
  let martialLocked = $derived(!martialCanAfford);
  let martialLockReason = $derived(
    martialLocked ? pcShortageText(martialCostPC, $budgetStore.remainingPC) : ''
  );

  function handleMartialClick(): void {
    if (martialLocked) {
      fx('error');
      return;
    }
    if (martialActive) {
      fx('cancel');
      draftStore.togglePoliticalAction('MARTIAL_LAW');
      return;
    }
    fx('tap');
    martialConfirmOpen = true;
  }

  function confirmMartialLaw(): void {
    if (!martialActive && martialCanAfford) {
      fx('confirm');
      draftStore.togglePoliticalAction('MARTIAL_LAW');
    } else if (!martialCanAfford) {
      fx('error');
    }
    martialConfirmOpen = false;
  }

  function closeMartialDialog(): void {
    fx('cancel');
    martialConfirmOpen = false;
  }

  let displayRows = $derived(
    buildFilteredDisplayRows(
      STANCE_KEYS,
      selectedStat,
      (k) => k,
      (k) => isSectionOptionRelated(selectedStat, k),
      (k): AvailabilityTier => (k === 'MARTIAL_LAW' && martialLocked ? 1 : 0)
    )
  );
</script>

<div class="flex flex-col gap-2">
  {#each displayRows as row (row.key)}
    <div animate:flip={{ duration: flipDuration() }}>
      {#if row.kind === 'divider'}
        <GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />
      {:else if row.item === 'workforceStrategy'}
        <!-- 1. Workforce strategy -->
        <Stance
          title="إدارة الوظائف الحكومية والبطالة المقنعة"
          value={$draftStore.workforceStrategy}
          options={workforceOptions}
          explainerOpen={openExplainers.workforce ?? false}
          onToggleExplainer={() => toggleExplainer('workforce')}
          dimmed={Boolean(selectedStat) && !row.related}
          onchange={(value) =>
            draftStore.setField(
              'workforceStrategy',
              value as 'MAINTAIN' | 'PRUNE_CIVIL_SERVICE' | 'ABSORB_MILITIAS'
            )}
        >
          {#snippet explainer()}
            {#if $draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE'}
              <span class="font-bold text-[var(--c-accent)]">الأثر:</span> شطب البطالة المقنعة والرواتب الوهمية يوفر سيولة الخزينة ويرفع كفاءة الوزارات، مع احتقان وظيفي مؤقت.
            {:else if $draftStore.workforceStrategy === 'ABSORB_MILITIAS'}
              <span class="font-bold text-[var(--c-accent)]">الأثر:</span> استيعاب المقاتلين لتهدئة الجبهات واستقرار الأمن (-4 احتقان)، مقابل تضخم كتلة الرواتب الحكومية (+{absorbHeadcount.toLocaleString('en-US')} وظيفة) — مع اتساع القاعدة الضريبية تدريجياً (+1 امتثال/دور حتى +4).
            {:else}
              <span class="font-bold text-[var(--c-text-2)]">الأثر:</span> الحفاظ على قوام الموظفين ورواتب الملاك الحكومي الراهن دون تعديل.
            {/if}
          {/snippet}
        </Stance>
      {:else if row.item === 'propertyRestitution'}
        <!-- 1b. Property restitution policy -->
        <div data-stance-id="propertyRestitution">
          <Stance
            title="ملف رد الملكيات العقارية"
            value={$draftStore.propertyRestitution}
            options={restitutionOptions}
            explainerOpen={openExplainers.propertyRestitution ?? false}
            onToggleExplainer={() => toggleExplainer('propertyRestitution')}
            dimmed={Boolean(selectedStat) && !row.related}
            onchange={(value) =>
              draftStore.setField(
                'propertyRestitution',
                value as TurnDirectives['propertyRestitution']
              )}
          >
            {#snippet explainer()}
              {#if $draftStore.propertyRestitution === 'MONETIZE_AS_STATE_LAND'}
                <span class="font-bold text-[var(--c-accent)]">الأثر:</span> وضع اليد على العقارات المتروكة واستثمارها كأملاك دولة يدر <bdi dir="ltr">+$120M</bdi> و<bdi dir="ltr">+8.00B SP</bdi> كل دور، مقابل <bdi dir="ltr">−8</bdi> ثقة شعبية و<bdi dir="ltr">+5</bdi> احتقان في جميع المحافظات.
              {:else}
                <span class="font-bold text-[var(--c-text-2)]">الأثر:</span> الإبقاء على أراضي وعقارات النازحين مرصودة لردّها إلى أصحابها دون عائد مالي أو أثر على الثقة والاحتقان.
              {/if}
            {/snippet}
          </Stance>
        </div>
      {:else if row.item === 'dieselSmuggling'}
        <!-- 2. Diesel smuggling (IMF lock preserved) -->
        <div
          role="presentation"
          onpointerdown={(e) => {
            if (dieselLock && (e.target as HTMLElement | null)?.closest('.lk')) {
              fx('error');
            }
          }}
        >
          <Stance
            title="مكافحة تهريب المشتقات النفطية"
            value={$draftStore.dieselSmuggling}
            options={dieselOptions}
            lockNote={dieselLockNote}
            explainerOpen={openExplainers.diesel ?? false}
            onToggleExplainer={() => toggleExplainer('diesel')}
            dimmed={Boolean(selectedStat) && !row.related}
            onchange={(value) => dieselGuard(value as 'CRACKDOWN' | 'STANDARD' | 'PERMISSIVE')}
          >
            {#snippet explainer()}
              {#if $draftStore.dieselSmuggling === 'CRACKDOWN'}
                <span class="font-bold text-[var(--c-pos)]">الأثر:</span> ضبط تهريب المازوت وتوجيهه لمحطات التوليد لرفع ساعات الكهرباء، مع استنفار أمني واحتكاك مع شبكات التهريب.
              {:else if $draftStore.dieselSmuggling === 'PERMISSIVE'}
                <span class="font-bold text-[var(--c-accent)]">الأثر:</span> تفادي الصدام العشائري، مقابل هدر المحروقات المدعومة وتراجع ساعات التغذية الكهربائية.
              {:else}
                <span class="font-bold text-[var(--c-text-2)]">الأثر:</span> رقابة روتينية توازن بين حماية المحروقات وتجنب التصعيد الحدودي.
              {/if}
            {/snippet}
          </Stance>
        </div>
      {:else if row.item === 'golanBorderStance'}
        <!-- 3. Golan border stance -->
        <div class="gov-golan-stance">
          <Stance
            title="الموقف على جبهة الجولان"
            value={$draftStore.golanBorderStance}
            options={golanOptions}
            columns={2}
            explainerOpen={openExplainers.golan ?? false}
            onToggleExplainer={() => toggleExplainer('golan')}
            dimmed={Boolean(selectedStat) && !row.related}
            onchange={(value) =>
              draftStore.setField('golanBorderStance', value as TurnDirectives['golanBorderStance'])}
          >
            {#snippet explainer()}
              {#if $draftStore.golanBorderStance === 'LOCAL_GENDARMERIE'}
                <span class="font-bold text-[var(--c-accent)]">درك محلي:</span> أمن محلي وإيراد معابر — يخفض تحدي درعا (−8) ويرفع تحصيل معبر نصيب (+5%) مع زيادة طفيفة في توتر الجولان (+5).
              {:else if $draftStore.golanBorderStance === 'DEPLOY_ARMOR'}
                <span class="font-bold text-[var(--c-neg)]">نشر الدروع:</span> قوة نارية بثمن سيادي — يخفض التحدي (−20) واحتقان درعا والقنيطرة (−8)، لكنه يرفع توتر الجولان (+25) ويكلف 9.0B SP.
              {:else if $draftStore.golanBorderStance === 'UN_LIAISON'}
                <span class="font-bold text-[var(--c-pos)]">ارتباط أندوف (ملف القنيطرة):</span> تهدئة زرقاء بلا تحدٍّ — يخفض توتر الجولان (−10) ويرفع الثقة (+2) بكلفة بعثة $8M/دور.
              {:else}
                <span class="font-bold text-[var(--c-text-2)]">ضبط النفس:</span> تهدئة الجولان مجاناً (−15 توتر) مقابل ارتفاع تحدي درعا (+18) والاحتقان المحلي (+10).
              {/if}
            {/snippet}
          </Stance>
        </div>
      {:else if row.item === 'MARTIAL_LAW'}
        <!-- 4. Martial law danger toggle -->
        <div
          data-decree-id="MARTIAL_LAW"
          data-state={martialActive ? 'queued' : martialLocked ? 'locked' : 'available'}
        >
          <ActionRow
            title={martialDecree.titleAr}
            description={martialDecree.descAr}
            cost="−4% ثقة/دور"
            costTone="neg"
            buttonLabel={martialActive ? 'إنهاء الطوارئ' : 'تفعيل'}
            buttonVariant="danger"
            active={martialActive}
            locked={martialLocked}
            lockReason={martialLockReason}
            dimmed={Boolean(selectedStat) && !row.related}
            onclick={handleMartialClick}
          >
            {#snippet chips()}
              <FxChip text="احتقان وطني -15 / محلي -12" tone="good" />
              <FxChip text="ثقة شعبية -4 كل دور" tone="bad" />
            {/snippet}
            {#snippet meta()}
              {#if martialActive}
                <p class="mt-1.5 border border-[var(--c-neg)] bg-[var(--c-ev-bg)] px-2 py-1 text-[11px] font-bold leading-snug text-[var(--c-neg)]">
                  تحذير: حالة الطوارئ فعّالة — خصم مستمر −4% ثقة شعبية لكل دور.
                </p>
              {/if}
            {/snippet}
          </ActionRow>
        </div>
      {/if}
    </div>
  {/each}
</div>

<DecreeConfirmDialog
  decree={martialConfirmOpen ? martialDecree : null}
  isActive={martialActive}
  remainingPC={$budgetStore.remainingPC}
  tone="danger"
  onconfirm={confirmMartialLaw}
  onclose={closeMartialDialog}
/>

<style>
  .gov-golan-stance :global(.seg > button:nth-child(n + 3)) {
    border-top: 1px solid var(--c-line-strong);
  }
  .gov-golan-stance :global(.seg > button:nth-child(3)) {
    border-inline-start: 0;
  }
</style>
