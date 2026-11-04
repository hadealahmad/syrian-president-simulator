<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import DecreeCard from '../decrees/DecreeCard.svelte';
  import CardDialog from '../decrees/CardDialog.svelte';
  import DecreeConfirmDialog from '../decrees/DecreeConfirmDialog.svelte';
  import EffectChip from '../decrees/EffectChip.svelte';
  import RangeStepper from '../decrees/RangeStepper.svelte';
  import {
    decreeCategoryOf,
    decreePcCost,
    pcSeal,
    usdSeal,
    type DecreeCardState,
    type EffectChipData,
  } from '../decrees/decree-meta';
  import {
    DECREES,
    isOptionRelated,
    pcShortageText,
    type PoliticalDecreeItem,
  } from './shared';
  import type { ForeignLoanPackage, SovereignMortgageOption, FacilityState } from '../../engine/types';
  import { CONCESSIONAL_FACILITIES } from '../../engine/constants';
  import { canSignFacility, getFacilityState } from '../../engine/facilities';
  import { IMPORT_SURGE_COST_USD } from '../../engine/revenues';

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let modalSel: { kind: 'loan' | 'mortgage' | 'facility'; id: string } | null = $state(null);
  let repudiateModal: PoliticalDecreeItem | null = $state(null);

  // ── Shared summary strip ──────────────────────────────────────────────────
  let availablePC = $derived(Math.max(0, Math.floor($budgetStore.remainingPC)));
  let reservesM = $derived(Math.round(($gameStore.macro.reservesUSD ?? 0) / 1_000_000));
  let debtB = $derived((($gameStore.macro.sovereignDebtUSD ?? 0) / 1_000_000_000).toFixed(2));

  // Done items sink to the bottom; under a topbar filter, related items rise
  // to the top (stable sort preserves source order within ranks).
  function rank(done: boolean, key: string): number {
    if (done) return 2;
    if (selectedStat && !isOptionRelated(selectedStat, key)) return 1;
    return 0;
  }
  let orderedLoans = $derived(
    [...$gameStore.foreignLoans].sort((a, b) => rank(a.isSigned, 'loans') - rank(b.isSigned, 'loans'))
  );
  let orderedMortgages = $derived(
    [...$gameStore.sovereignMortgages].sort(
      (a, b) => rank(a.isMortgaged, 'mortgages') - rank(b.isMortgaged, 'mortgages')
    )
  );

  let totalRemainingPrincipal = $derived(
    $gameStore.foreignLoans
      .filter((l) => l.isSigned)
      .reduce((acc, l) => acc + (l.remainingPrincipalUSD ?? l.disbursementUSD), 0)
  );
  // The engine pays early repayment from reserves left after terminations and
  // every other outlay, so the slider is bounded by the budget's same clamp —
  // not by gross reserves (which offered payments the engine would skip).
  let maxRepayM = $derived(
    Math.max(0, Math.floor(($budgetStore.maxDebtRepaymentUSD ?? 0) / 1_000_000 / 5) * 5)
  );
  let repayM = $derived(($draftStore.extraDebtRepaymentUSD ?? 0) / 1_000_000);

  // Re-clamp a stored payment when reserves/commitments shrink it between edits.
  $effect(() => {
    const maxUSD = $budgetStore.maxDebtRepaymentUSD;
    if (($draftStore.extraDebtRepaymentUSD ?? 0) > maxUSD) {
      draftStore.setField('extraDebtRepaymentUSD', maxUSD);
    }
  });

  // Emergency import surge: $40M of reserves for +6 PC and blackout relief
  let surgeActive = $derived($draftStore.importSurge);
  let canAffordSurge = $derived(
    surgeActive || ($gameStore.macro.reservesUSD ?? 0) >= IMPORT_SURGE_COST_USD
  );

  function dimmedFor(key: string): boolean {
    return selectedStat ? !isOptionRelated(selectedStat, key) : false;
  }
  function highlightedFor(key: string): boolean {
    return selectedStat ? isOptionRelated(selectedStat, key) : false;
  }

  // Golan stance is a southern-theatre lever; these are the stats it moves.
  const GOLAN_STATS = [
    'unrestIndex',
    'reservesUSD',
    'treasurySYP',
    'sovereignLeverage',
    'politicalCapital',
    'civicTrust',
  ];
  function golanRelated(): boolean {
    return selectedStat ? GOLAN_STATS.includes(selectedStat) : false;
  }

  // ── Loan / mortgage / facility selection ─────────────────────────────────
  function openModal(kind: 'loan' | 'mortgage' | 'facility', id: string): void {
    modalSel = { kind, id };
  }
  function modalLoan(): ForeignLoanPackage | undefined {
    return modalSel?.kind === 'loan'
      ? $gameStore.foreignLoans.find((l) => l.id === modalSel!.id)
      : undefined;
  }
  function modalMortgage(): SovereignMortgageOption | undefined {
    return modalSel?.kind === 'mortgage'
      ? $gameStore.sovereignMortgages.find((m) => m.id === modalSel!.id)
      : undefined;
  }
  function modalFacility() {
    return modalSel?.kind === 'facility'
      ? CONCESSIONAL_FACILITIES.find((f) => f.id === modalSel!.id)
      : undefined;
  }
  function facilityStatus(id: string): FacilityState | undefined {
    return getFacilityState($gameStore, id);
  }

  function isLoanSelected(loan: ForeignLoanPackage): boolean {
    return $draftStore.signedLoanIds.includes(loan.id) || loan.isSigned;
  }
  let modalLoanIsSelected = $derived.by(() => {
    const loan = modalLoan();
    return loan ? isLoanSelected(loan) : false;
  });
  let modalLoanCanAfford = $derived.by(() => {
    const loan = modalLoan();
    return loan ? modalLoanIsSelected || $budgetStore.remainingPC >= loan.politicalCapitalCost : false;
  });
  let modalMortgagedSel = $derived.by(() => {
    const mort = modalMortgage();
    return mort
      ? $draftStore.executedMortgageIds.includes(mort.id) || mort.isMortgaged
      : false;
  });
  let modalFacilitySel = $derived.by(() => {
    const fac = modalFacility();
    return fac ? $draftStore.signedFacilityIds.includes(fac.id) : false;
  });
  let modalFacilityCheck = $derived.by(() => {
    const fac = modalFacility();
    return fac
      ? canSignFacility($gameStore, fac.id, $budgetStore.remainingPC)
      : { ok: false, reasonAr: '' };
  });
  let modalConfirmOk = $derived.by(() => {
    if (modalSel?.kind === 'loan') {
      const loan = modalLoan();
      return Boolean(
        loan && !loan.isSigned && (modalLoanIsSelected || modalLoanCanAfford)
      );
    }
    if (modalSel?.kind === 'mortgage') {
      const mort = modalMortgage();
      return Boolean(mort && !mort.isMortgaged);
    }
    if (modalSel?.kind === 'facility') {
      return Boolean(modalFacility() && (modalFacilitySel || modalFacilityCheck.ok));
    }
    return false;
  });
  let modalConfirmLabel = $derived.by(() => {
    if (modalSel?.kind === 'loan') {
      const loan = modalLoan();
      if (!loan) return 'تأكيد التوقيع';
      if (modalLoanIsSelected) return 'إلغاء الاعتماد';
      if (!modalLoanCanAfford) return `رصيد غير كافٍ (${loan.politicalCapitalCost})`;
      return 'تأكيد التوقيع';
    }
    if (modalSel?.kind === 'mortgage') {
      return modalMortgagedSel ? 'إلغاء الاعتماد' : 'تأكيد الرهن';
    }
    if (modalSel?.kind === 'facility') {
      if (modalFacilitySel) return 'إلغاء الاعتماد';
      if (!modalFacilityCheck.ok) return modalFacilityCheck.reasonAr;
      return 'تأكيد التوقيع';
    }
    return 'تأكيد';
  });
  let modalTitle = $derived(
    modalLoan()?.titleAr ?? modalMortgage()?.titleAr ?? modalFacility()?.titleAr ?? 'تفاصيل التمويل'
  );

  function confirmModal(): void {
    const loan = modalLoan();
    if (loan && !loan.isSigned) {
      if ($draftStore.signedLoanIds.includes(loan.id) || $budgetStore.remainingPC >= loan.politicalCapitalCost) {
        draftStore.toggleLoan(loan.id);
      }
      modalSel = null;
      return;
    }
    const mort = modalMortgage();
    if (mort && !mort.isMortgaged) {
      draftStore.toggleMortgage(mort.id);
      modalSel = null;
      return;
    }
    const fac = modalFacility();
    if (fac) {
      const st = facilityStatus(fac.id);
      const selected = $draftStore.signedFacilityIds.includes(fac.id);
      if (!st || st.status === 'AVAILABLE') {
        const check = canSignFacility($gameStore, fac.id, $budgetStore.remainingPC);
        if (selected || check.ok) {
          draftStore.toggleFacility(fac.id);
          // IMF conditionality starts this turn: lock diesel policy up front
          // so the signature can never be refused-and-breached on day one.
          if (fac.id === 'facility_imf_stabilization' && !selected) {
            draftStore.setField('dieselSmuggling', 'CRACKDOWN');
          }
        }
      }
      modalSel = null;
    }
  }

  // ── Repudiation (Paris / Iran / Russia) ──────────────────────────────────
  let sovereignDecrees = $derived(
    DECREES.filter((d) => decreeCategoryOf(d).id === 'sovereignty')
  );

  function decreeState(dec: PoliticalDecreeItem): DecreeCardState {
    if ($gameStore.enactedDecrees?.includes(dec.id)) return 'enacted';
    if ($draftStore.activePoliticalActions.includes(dec.id)) return 'queued';
    if (decreePcCost(dec.id) > $budgetStore.remainingPC) return 'locked';
    return 'available';
  }
  function confirmRepudiation(): void {
    if (repudiateModal) {
      const costPC = decreePcCost(repudiateModal.id);
      const active = $draftStore.activePoliticalActions.includes(repudiateModal.id);
      if (active || costPC <= $budgetStore.remainingPC) {
        draftStore.togglePoliticalAction(repudiateModal.id);
      }
    }
    repudiateModal = null;
  }

  // ── Golan border stance (same draft field the provincial dossier writes) ──
  interface GolanOption {
    id: 'RESTRAINT' | 'LOCAL_GENDARMERIE' | 'DEPLOY_ARMOR' | 'UN_LIAISON';
    titleAr: string;
    descAr: string;
    chips: EffectChipData[];
  }
  const GOLAN_OPTIONS: GolanOption[] = [
    {
      id: 'RESTRAINT',
      titleAr: 'ضبط النفس',
      descAr: 'تهدئة الجولان مجاناً دون تحريك قوة.',
      chips: [
        { text: '−15 توتر', tone: 'good' },
        { text: '+18 تحدٍّ درعاوي', tone: 'bad' },
      ],
    },
    {
      id: 'LOCAL_GENDARMERIE',
      titleAr: 'درك محلي',
      descAr: 'أمن محلي وإيراد معابر متوازن.',
      chips: [
        { text: '−8 تحدٍّ', tone: 'good' },
        { text: '+5% نصيب', tone: 'neutral' },
        { text: '+5 توتر', tone: 'bad' },
      ],
    },
    {
      id: 'DEPLOY_ARMOR',
      titleAr: 'نشر الدروع',
      descAr: 'قوة نارية بثمن سيادي (9.0B SP).',
      chips: [
        { text: '−20 تحدٍّ', tone: 'good' },
        { text: '+25 توتر!', tone: 'bad' },
        { text: '−9.0B SP', tone: 'bad' },
      ],
    },
    {
      id: 'UN_LIAISON',
      titleAr: 'ارتباط أندوف',
      descAr: 'تهدئة زرقاء بلا تحدٍّ (القنيطرة فقط).',
      chips: [
        { text: '−10 توتر', tone: 'good' },
        { text: '+2 ثقة', tone: 'good' },
        { text: '−$8M/دور', tone: 'bad' },
      ],
    },
  ];

  // ── Martial law (direct continuous switch, as in the old panel) ───────────
  let martialLaw = $derived(DECREES.find((d) => d.id === 'MARTIAL_LAW'));
</script>

<div class="space-y-3">
  <!-- ── Finance snapshot ─────────────────────────────────────────────────── -->
  <section
    class="grid grid-cols-3 gap-1.5 border border-wheat-mid/15 bg-charcoal-deep/45 p-2 shell-round-pop"
    aria-label="موجز التمويل"
  >
    <div class="text-center">
      <div class="text-[8px] text-wheat-dark">رصيد متاح</div>
      <div class="font-heading text-[17px] leading-tight text-wheat-gold">{availablePC}</div>
    </div>
    <div class="border-x border-wheat-mid/10 text-center">
      <div class="text-[8px] text-wheat-dark">الاحتياطي</div>
      <div class="font-heading text-[17px] leading-tight text-wheat-light">${reservesM}M</div>
    </div>
    <div class="text-center">
      <div class="text-[8px] text-wheat-dark">الدين الخارجي</div>
      <div class="font-heading text-[17px] leading-tight text-umber-crimson">${debtB}B</div>
    </div>
  </section>

  <!-- ── Foreign credit lines ─────────────────────────────────────────────── -->
  <section class="space-y-2" aria-label="خطوط الائتمان والتمويل الخارجي">
    <div class="flex items-center justify-between gap-2">
      <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
        <GameIcon name="banknote" cls="h-3.5 w-3.5 shrink-0" />
        خطوط الائتمان والتمويل الخارجي
      </h4>
      <span class="text-[8.5px] text-wheat-dark">{orderedLoans.length} خط</span>
    </div>

    <div class="grid grid-cols-2 gap-2 phone-p:grid-cols-1 phone-l:grid-cols-1">
      {#each orderedLoans as loan (loan.id)}
        {@const isSelected = $draftStore.signedLoanIds.includes(loan.id) || loan.isSigned}
        {@const canAffordLoan = isSelected || $budgetStore.remainingPC >= loan.politicalCapitalCost}
        {#if loan.isSigned}
          {@const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD}
          {@const service = Math.floor((remaining * loan.interestRatePct) / 100 / 2)}
          {@const isTerminating = ($draftStore.terminatedLoanIds ?? []).includes(loan.id)}
          {@const canTerminate = isTerminating || ($budgetStore.remainingUSD >= remaining && remaining > 0)}
          <DecreeCard
            id={loan.id}
            title={loan.titleAr}
            description={loan.lenderAr}
            category="تمويل خارجي"
            categoryClass="text-status-info"
            stripClass="bg-status-info"
            typeLabel="موقع"
            typeIcon="banknote"
            sealValue={usdSeal(loan.disbursementUSD).value}
            sealUnit={usdSeal(loan.disbursementUSD).unit}
            sealTone="neutral"
            chips={[
              { text: `المتبقي $${(remaining / 1_000_000).toFixed(1)}M`, tone: 'neutral' },
              { text: `−خدمة $${(service / 1_000_000).toFixed(1)}M / دور`, tone: 'bad' },
            ]}
            state={isTerminating ? 'queued' : 'info'}
            dimmed={dimmedFor('loans')}
            highlighted={highlightedFor('loans')}
            ariaLabel={loan.titleAr}
          >
            {#if remaining > 0}
              <button
                type="button"
                disabled={!canTerminate}
                onclick={() => {
                  if (canTerminate) draftStore.toggleLoanTermination(loan.id);
                }}
                title={`فسخ سيادي: سداد كامل المتبقي (${(remaining / 1_000_000).toFixed(1)}M$) من الاحتياطي مقابل +6 رصيد سياسي و+4 رافعة سيادية`}
                class="min-h-9 w-full border px-1.5 py-1.5 text-[9px] font-bold transition-colors focus-visible:border-wheat-gold focus-visible:outline-none phone-p:min-h-11 phone-l:min-h-11 {isTerminating
                  ? 'cursor-pointer border-forest-accent bg-forest-surface text-forest-accent'
                  : canTerminate
                    ? 'cursor-pointer border-charcoal-mid bg-charcoal-surface text-wheat-dark hover:border-wheat-mid/60 hover:text-wheat-light'
                    : 'cursor-not-allowed border-charcoal-mid bg-charcoal-surface text-wheat-dark opacity-50'}"
              >
                {isTerminating
                  ? 'فسخ سيادي مُعتمد (+6 سياسي / +4 سيادة)'
                  : !canTerminate
                    ? 'احتياطي غير كافٍ للفسخ'
                    : `فسخ سيادي (−$${(remaining / 1_000_000).toFixed(1)}M → +6 سياسي / +4 سيادة)`}
              </button>
            {/if}
          </DecreeCard>
        {:else}
          <DecreeCard
            id={loan.id}
            title={loan.titleAr}
            description={loan.lenderAr}
            category="تمويل خارجي"
            categoryClass="text-status-info"
            stripClass="bg-status-info"
            typeLabel="قرض خارجي"
            typeIcon="banknote"
            sealValue={pcSeal(loan.politicalCapitalCost).value}
            sealUnit={pcSeal(loan.politicalCapitalCost).unit}
            sealTone={pcSeal(loan.politicalCapitalCost).tone}
            chips={[
              { text: `+$${loan.disbursementUSD / 1_000_000}M`, tone: 'good' },
              { text: `فائدة ${loan.interestRatePct}%`, tone: 'neutral' },
              { text: `−${loan.politicalCapitalCost} رصيد سياسي`, tone: 'bad' },
            ]}
            state={isSelected ? 'queued' : canAffordLoan ? 'available' : 'locked'}
            stateNote={canAffordLoan
              ? ''
              : pcShortageText(loan.politicalCapitalCost, $budgetStore.remainingPC)}
            actionLabel={isSelected ? '' : 'توقيع القرض'}
            dimmed={dimmedFor('loans')}
            highlighted={highlightedFor('loans')}
            onclick={() => openModal('loan', loan.id)}
            ariaLabel={(isSelected ? 'إلغاء اعتماد: ' : 'توقيع: ') + loan.titleAr}
          />
        {/if}
      {/each}
    </div>

    <!-- Early principal repayment (highest-rate loans first) -->
    {#if totalRemainingPrincipal > 0}
      <RangeStepper
        label="سداد مبكر لأصل الدين"
        hint="يُخصم من الاحتياطي ويُطفئ أعلى القروض فائدة أولاً (رافعة +2 لكل $100M)"
        value={Math.min(repayM, maxRepayM)}
        min={0}
        max={maxRepayM}
        step={5}
        display={`$${repayM}M`}
        minLabel="$0M"
        maxLabel={`$${maxRepayM}M`}
        ariaLabel="سداد مبكر لأصل الدين بالمليون دولار"
        onchange={(value) =>
          draftStore.setField('extraDebtRepaymentUSD', value * 1_000_000)}
      />
    {/if}

    <!-- Emergency food/fuel import surge: burn $40M of reserves for +6 PC -->
    <DecreeCard
      id="importSurge"
      title="دفعة استيراد إغاثية طارئة (غذاء ووقود)"
      description="شراء دولاري سريع يسد نقص الغذاء والوقود ويطفئ الغضب الشعبي."
      category="شراء الشرعية"
      categoryClass="text-wheat-mid"
      stripClass="bg-wheat-mid"
      typeLabel="دوري"
      typeIcon="cycle"
      sealValue={`−${(IMPORT_SURGE_COST_USD / 1_000_000).toFixed(0)}`}
      sealUnit="مليون $"
      sealTone="money"
      chips={[
        { text: '+6 رصيد سياسي', tone: 'good' },
        { text: '−1 سا تقنين / −2 احتقان', tone: 'good' },
        { text: 'لمرة واحدة هذا الدور', tone: 'neutral' },
      ]}
      state={surgeActive ? 'queued' : canAffordSurge ? 'available' : 'locked'}
      stateNote={canAffordSurge
        ? ''
        : 'موقوف مؤقتاً: احتياطي النقد الأجنبي غير كافٍ ($40M)'}
      actionLabel={surgeActive ? '' : 'أضف إلى الحصيلة'}
      dimmed={dimmedFor('importSurge')}
      highlighted={highlightedFor('importSurge')}
      onclick={() => {
        const next = !$draftStore.importSurge;
        if (next ? canAffordSurge : true) draftStore.setField('importSurge', next);
      }}
      ariaLabel={surgeActive ? 'إزالة دفعة الاستيراد' : 'إضافة دفعة الاستيراد'}
    />
  </section>

  <!-- ── Concessional facilities ──────────────────────────────────────────── -->
  <section class="space-y-2" aria-label="تسهيلات وتمويل مشروط">
    <div class="flex items-center justify-between gap-2">
      <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
        <GameIcon name="scale" cls="h-3.5 w-3.5 shrink-0" />
        تسهيلات وتمويل مشروط
      </h4>
      <span class="text-[8.5px] text-wheat-dark">{CONCESSIONAL_FACILITIES.length} تسهيل</span>
    </div>

    <div class="grid grid-cols-2 gap-2 phone-p:grid-cols-1 phone-l:grid-cols-1">
      {#each CONCESSIONAL_FACILITIES as fac (fac.id)}
        {@const st = facilityStatus(fac.id)}
        {@const isSelected = $draftStore.signedFacilityIds.includes(fac.id)}
        {@const totalM = fac.tranches.reduce((a, t) => a + t.amountUSD, 0) / 1_000_000}
        {#if !st || st.status === 'AVAILABLE'}
          {@const check = canSignFacility($gameStore, fac.id, $budgetStore.remainingPC)}
          {@const canSign = isSelected || check.ok}
          <DecreeCard
            id={fac.id}
            title={fac.titleAr}
            description={fac.lenderAr}
            category="تسهيل مشروط"
            categoryClass="text-status-warn"
            stripClass="bg-status-warn"
            typeLabel="شرائح"
            typeIcon="coins"
            sealValue={pcSeal(fac.politicalCapitalCost).value}
            sealUnit={pcSeal(fac.politicalCapitalCost).unit}
            sealTone={pcSeal(fac.politicalCapitalCost).tone}
            chips={[
              totalM > 0
                ? { text: `+$${totalM}M على ${fac.tranches.length} شرائح`, tone: 'good' as const }
                : { text: 'خفض دائم للقسط', tone: 'good' as const },
              { text: `−${fac.politicalCapitalCost} رصيد سياسي`, tone: 'bad' },
              { text: `−${fac.leverageCost} رافعة`, tone: 'bad' },
            ]}
            warnNote={`شرط: ${fac.conditionAr}`}
            note={`إذا أخللت: ${fac.breachAr}`}
            state={isSelected ? 'queued' : canSign ? 'available' : 'locked'}
            stateNote={canSign ? '' : check.reasonAr}
            actionLabel={isSelected ? '' : 'توقيع التسهيل'}
            dimmed={dimmedFor('loans')}
            highlighted={highlightedFor('loans')}
            onclick={() => openModal('facility', fac.id)}
            ariaLabel={(isSelected ? 'إلغاء اعتماد: ' : 'توقيع: ') + fac.titleAr}
          />
        {:else}
          <DecreeCard
            id={fac.id}
            title={fac.titleAr}
            description={fac.lenderAr}
            category="تسهيل مشروط"
            categoryClass="text-status-warn"
            stripClass="bg-status-warn"
            typeLabel={st.status === 'BREACHED' ? 'مجمّد' : st.status === 'COMPLETED' ? 'مكتمل' : 'سارٍ'}
            typeIcon={st.status === 'BREACHED' ? 'siren' : 'check-mark'}
            chips={[
              ...(st.status === 'ACTIVE'
                ? [
                    {
                      text: `الشرائح ${st.tranchesDrawn}/${fac.tranches.length}`,
                      tone: 'neutral' as const,
                    },
                    ...(st.conditionTurnsLeft > 0
                      ? [
                          {
                            text: `الشرط سارٍ: ${st.conditionTurnsLeft} دورات`,
                            tone: 'warn' as const,
                          },
                        ]
                      : []),
                    ...(fac.id === 'facility_gulf_reconstruction_grant'
                      ? [
                          {
                            text: `رصيد المنحة للمشاريع: $${(($gameStore.macro.grantBucketUSD ?? 0) / 1_000_000).toFixed(0)}M`,
                            tone: 'good' as const,
                          },
                        ]
                      : []),
                  ]
                : []),
              ...(st.status === 'BREACHED'
                ? [{ text: 'مجمّدة — إخلال بالشرط', tone: 'bad' as const }]
                : []),
              ...(st.status === 'COMPLETED'
                ? [{ text: 'مكتملة ✓', tone: 'good' as const }]
                : []),
            ]}
            state="info"
            infoTone={st.status === 'BREACHED' ? 'danger' : 'good'}
            dimmed={dimmedFor('loans')}
            highlighted={highlightedFor('loans')}
            ariaLabel={fac.titleAr}
          />
        {/if}
      {/each}
    </div>
  </section>

  <!-- ── Sovereign mortgages ──────────────────────────────────────────────── -->
  <section class="space-y-2" aria-label="الرهون والامتيازات السيادية">
    <div class="flex items-center justify-between gap-2">
      <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
        <GameIcon name="key" cls="h-3.5 w-3.5 shrink-0" />
        الرهون والامتيازات السيادية الطارئة
      </h4>
      <span class="text-[8.5px] text-wheat-dark">{orderedMortgages.length} امتياز</span>
    </div>

    <div class="grid grid-cols-2 gap-2 phone-p:grid-cols-1 phone-l:grid-cols-1">
      {#each orderedMortgages as mort (mort.id)}
        {@const isMortgaged = $draftStore.executedMortgageIds.includes(mort.id) || mort.isMortgaged}
        {#if mort.isMortgaged}
          <DecreeCard
            id={mort.id}
            title={mort.titleAr}
            description={mort.assetNameAr}
            category="رهن سيادي"
            categoryClass="text-status-info"
            stripClass="bg-status-info"
            typeLabel="منفّذ"
            typeIcon="check-mark"
            chips={[{ text: 'امتياز قائم', tone: 'neutral' }]}
            state="enacted"
            dimmed={dimmedFor('mortgages')}
            highlighted={highlightedFor('mortgages')}
            ariaLabel={mort.titleAr}
          />
        {:else}
          <DecreeCard
            id={mort.id}
            title={mort.titleAr}
            description={mort.assetNameAr}
            category="رهن سيادي"
            categoryClass="text-status-info"
            stripClass="bg-status-info"
            typeLabel="مرة واحدة"
            typeIcon="key"
            sealValue={usdSeal(mort.immediateCashUSD).value}
            sealUnit={usdSeal(mort.immediateCashUSD).unit}
            sealTone="gain"
            chips={[
              { text: `−$${mort.turnRevenueLossUSD / 1_000_000}M / دور`, tone: 'bad' },
              { text: `امتياز ${mort.concessionDurationYears} سنة`, tone: 'neutral' },
            ]}
            state={isMortgaged ? 'queued' : 'available'}
            actionLabel={isMortgaged ? '' : 'عرض الرهن'}
            dimmed={dimmedFor('mortgages')}
            highlighted={highlightedFor('mortgages')}
            onclick={() => openModal('mortgage', mort.id)}
            ariaLabel={(isMortgaged ? 'إلغاء اعتماد: ' : 'رهن: ') + mort.titleAr}
          />
        {/if}
      {/each}
    </div>
  </section>

  <!-- ── Debt repudiation ─────────────────────────────────────────────────── -->
  <section class="space-y-2" aria-label="التنصل من الديون">
    <div class="flex items-center justify-between gap-2">
      <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
        <GameIcon name="gavel" cls="h-3.5 w-3.5 shrink-0" />
        التنصل من الديون غير الموثقة
      </h4>
      <span class="text-[8.5px] text-wheat-dark">باريس · إيران · روسيا</span>
    </div>
    <p class="text-[9px] leading-snug text-wheat-dark">
      شطب الديون مقابل رصيد سياسي، بثمن توتر إقليمي وإغلاق نوافذ تمويل.
    </p>
    <div class="grid grid-cols-2 gap-2 phone-p:grid-cols-1 phone-l:grid-cols-1">
      {#each sovereignDecrees as dec (dec.id)}
        {@const cat = decreeCategoryOf(dec)}
        {@const state = decreeState(dec)}
        {@const seal = pcSeal(decreePcCost(dec.id))}
        <DecreeCard
          id={dec.id}
          title={dec.titleAr}
          description={dec.descAr}
          category={cat.labelAr}
          categoryClass={cat.textClass}
          stripClass={cat.stripClass}
          typeLabel="مرة واحدة"
          typeIcon="gavel"
          sealValue={seal.value}
          sealUnit={seal.unit}
          sealTone={seal.tone}
          chips={[
            ...dec.effectsAr
              .filter((fx) => fx.scope === 'national')
              .map((fx) => ({
                text: fx.text,
                tone: (fx.tone === 'good' ? 'good' : 'bad') as 'good' | 'bad',
              })),
          ]}
          state={state}
          actionLabel={state === 'available' ? 'أضف إلى الحصيلة' : ''}
          dimmed={selectedStat ? !isOptionRelated(selectedStat, dec.id) : false}
          highlighted={selectedStat ? isOptionRelated(selectedStat, dec.id) : false}
          onclick={state === 'enacted' ? undefined : () => (repudiateModal = dec)}
          ariaLabel={`${state === 'enacted' ? 'منفّذ: ' : 'فتح: '}${dec.titleAr}`}
        />
      {/each}
    </div>
  </section>

  <!-- ── Golan border stance ──────────────────────────────────────────────── -->
  <section class="space-y-2" aria-label="موقف حدود الجولان">
    <div class="flex items-center justify-between gap-2">
      <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
        <GameIcon name="castle" cls="h-3.5 w-3.5 shrink-0" />
        موقف حدود الجولان
      </h4>
      <span class="text-[8.5px] text-wheat-dark">مسرح الجنوب</span>
    </div>
    <div class="grid grid-cols-2 gap-2 phone-p:grid-cols-1 phone-l:grid-cols-1">
      {#each GOLAN_OPTIONS as option (option.id)}
        {@const selected = $draftStore.golanBorderStance === option.id}
        <DecreeCard
          id={`golan_${option.id}`}
          title={option.titleAr}
          description={option.descAr}
          category="موقف حدودي"
          categoryClass="text-forest-accent"
          stripClass="bg-forest-accent"
          typeLabel={option.id === 'DEPLOY_ARMOR' ? 'تصعيد' : 'اختيار'}
          typeIcon={option.id === 'DEPLOY_ARMOR' ? 'siren' : 'checked-shield'}
          chips={option.chips}
          state={selected ? 'queued' : 'available'}
          queuedLabel="معتمد"
          actionLabel={selected ? '' : 'اعتماد الموقف'}
          dimmed={golanRelated() ? false : Boolean(selectedStat)}
          highlighted={golanRelated()}
          onclick={() => draftStore.setField('golanBorderStance', option.id)}
          ariaLabel={`اعتماد موقف: ${option.titleAr}`}
        />
      {/each}
    </div>
  </section>

  <!-- ── Emergency law (martial law direct switch) ────────────────────────── -->
  <section class="space-y-2" aria-label="قانون الطوارئ">
    <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
      <GameIcon name="siren" cls="h-3.5 w-3.5 shrink-0" />
      قانون الطوارئ
    </h4>
    {#if martialLaw}
      {@const active = $draftStore.activePoliticalActions.includes(martialLaw.id)}
      <DecreeCard
        id={martialLaw.id}
        title={martialLaw.titleAr}
        description={martialLaw.descAr}
        category="الأمن والحدود"
        categoryClass="text-status-warn"
        stripClass="bg-status-warn"
        typeLabel="مستمر"
        typeIcon="power-button"
        chips={martialLaw.effectsAr
          .filter((fx) => fx.scope === 'national')
          .map((fx) => ({
            text: fx.text,
            tone: (fx.tone === 'good' ? 'good' : 'bad') as 'good' | 'bad',
          }))}
        state={active ? 'queued' : 'available'}
        actionLabel={active ? '' : 'إعلان حالة الطوارئ'}
        dimmed={selectedStat ? !isOptionRelated(selectedStat, martialLaw.id) : false}
        highlighted={selectedStat ? isOptionRelated(selectedStat, martialLaw.id) : false}
        onclick={() => draftStore.togglePoliticalAction(martialLaw.id)}
        ariaLabel={active ? 'إنهاء حالة الطوارئ' : 'إعلان حالة الطوارئ'}
      >
        {#if active}
          <div class="space-y-0.5 border-t border-status-warn/25 pt-1.5 text-[9px] text-status-warn">
            <span class="block font-bold">ديبَف مستمر سارٍ:</span>
            <span class="block leading-snug">
              تخفيض الاحتقان مستمر، مع هبوط متواصل في الثقة الشعبية (−4 كل دور) حتى تنهي حالة
              الطوارئ يدوياً.
            </span>
          </div>
        {/if}
      </DecreeCard>
    {/if}
  </section>
</div>

<!-- ── Loan / mortgage / facility detail dialog ───────────────────────────── -->
<CardDialog
  open={modalSel !== null}
  title={modalTitle}
  ariaLabel="تفاصيل التمويل الطارئ"
  kicker="تمويل طارئ"
  confirmLabel={modalConfirmLabel}
  confirmDisabled={!modalConfirmOk}
  onconfirm={confirmModal}
  onclose={() => (modalSel = null)}
>
  {#if modalLoan()}
    {@const loan = modalLoan()!}
    <div class="space-y-2.5">
      <p class="text-[11px] leading-relaxed text-wheat-dark">
        {loan.lenderAr} — {loan.concessionSummaryAr}
      </p>
      <div class="flex flex-wrap items-center gap-1.5">
        <EffectChip
          text={`+$${loan.disbursementUSD / 1_000_000}M`}
          tone="good"
          cls="text-[9px] px-2 py-0.5"
        />
        <EffectChip
          text={`فائدة ${loan.interestRatePct}% (خدمة $${((loan.disbursementUSD * loan.interestRatePct) / 100 / 2 / 1_000_000).toFixed(1)}M/دور)`}
          tone="neutral"
          cls="text-[9px] px-2 py-0.5"
        />
        <EffectChip
          text={`−${loan.politicalCapitalCost} رصيد سياسي`}
          tone="bad"
          cls="text-[9px] px-2 py-0.5"
        />
      </div>
    </div>
  {:else if modalMortgage()}
    {@const mort = modalMortgage()!}
    <div class="space-y-2.5">
      <p class="text-[11px] leading-relaxed text-wheat-dark">
        {mort.assetNameAr} — امتياز لـ {mort.concessionDurationYears} سنة
      </p>
      <p class="text-[10px] leading-relaxed text-umber-crimson">{mort.sovereigntyPenaltyAr}</p>
      <div class="flex flex-wrap items-center gap-1.5">
        <EffectChip
          text={`+$${mort.immediateCashUSD / 1_000_000}M`}
          tone="good"
          cls="text-[9px] px-2 py-0.5"
        />
        <EffectChip
          text={`−$${mort.turnRevenueLossUSD / 1_000_000}M / دور`}
          tone="bad"
          cls="text-[9px] px-2 py-0.5"
        />
      </div>
    </div>
  {:else if modalFacility()}
    {@const fac = modalFacility()!}
    <div class="space-y-2.5">
      <p class="text-[11px] leading-relaxed text-wheat-dark">
        {fac.lenderAr} — {fac.descriptionAr}
      </p>
      <p class="text-[11px] leading-relaxed text-status-warn">الشرط: {fac.conditionAr}</p>
      <p class="text-[10px] leading-relaxed text-umber-crimson">
        ماذا يحدث إذا أخللت: {fac.breachAr}
      </p>
      <div class="flex flex-wrap items-center gap-1.5">
        {#if fac.tranches.length > 0}
          {#each fac.tranches as t, i (i)}
            <EffectChip
              text={`الشريحة ${i + 1}: +$${t.amountUSD / 1_000_000}M${t.ringFenced ? ' (للمشاريع حصراً)' : ''}`}
              tone="good"
              cls="text-[9px] px-2 py-0.5"
            />
          {/each}
        {:else}
          <EffectChip text="تفعيل لمرة واحدة" tone="good" cls="text-[9px] px-2 py-0.5" />
        {/if}
        <EffectChip
          text={`−${fac.politicalCapitalCost} رصيد سياسي · −${fac.leverageCost} رافعة`}
          tone="bad"
          cls="text-[9px] px-2 py-0.5"
        />
      </div>
      {#if !modalFacilitySel && !modalFacilityCheck.ok}
        <p class="text-[11px] leading-relaxed text-umber-crimson">
          {modalFacilityCheck.reasonAr}
        </p>
      {/if}
    </div>
  {/if}
</CardDialog>

<!-- ── Repudiation confirmation (same rules as the decrees panel) ─────────── -->
<DecreeConfirmDialog
  decree={repudiateModal}
  isActive={repudiateModal
    ? $draftStore.activePoliticalActions.includes(repudiateModal.id)
    : false}
  remainingPC={$budgetStore.remainingPC}
  onconfirm={confirmRepudiation}
  onclose={() => (repudiateModal = null)}
/>
