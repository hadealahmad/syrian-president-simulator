<script lang="ts">
  import { flip } from 'svelte/animate';
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import ActionCard from '../kit/ActionCard.svelte';
  import ActionRow from '../kit/ActionRow.svelte';
  import DoneRow from '../kit/DoneRow.svelte';
  import FxChip from '../kit/FxChip.svelte';
  import GroupDivider from '../kit/GroupDivider.svelte';
  import Lever from '../kit/Lever.svelte';
  import {
    buildFilteredDisplayRows,
    flipDuration,
    type AvailabilityTier,
  } from '../kit/reorder';
  import CollapsibleGroup from '../sections/debt/CollapsibleGroup.svelte';
  import DebtDialog from '../sections/debt/DebtDialog.svelte';
  import { fx } from '../fx/feedback';
  import {
    allEffectChips,
    cardEffectChips,
    decreeCategoryOf,
    decreePcCost,
    decreeTypeLabel,
  } from '../decrees/decree-meta';
  import {
    DECREES,
    pcShortageText,
    type PoliticalDecreeItem,
  } from './shared';
  import { isSectionOptionRelated } from '../shell/section-nav';
  import type {
    ForeignLoanPackage,
    SovereignMortgageOption,
    FacilityState,
  } from '../../engine/types';
  import { CONCESSIONAL_FACILITIES } from '../../engine/constants';
  import { canSignFacility, getFacilityState } from '../../engine/facilities';

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let modalSel: { kind: 'loan' | 'mortgage' | 'facility'; id: string } | null = $state(null);
  let repudiateModal: PoliticalDecreeItem | null = $state(null);

  let facilitiesGroupOpen = $state(false);
  let mortgagesGroupOpen = $state(false);
  let repudiationGroupOpen = $state(false);
  let expandedFacilityDetails = $state<Record<string, boolean>>({});

  function facilityStatus(id: string): FacilityState | undefined {
    return getFacilityState($gameStore, id);
  }

  function dimmedFor(key: string): boolean {
    return selectedStat ? !isSectionOptionRelated(selectedStat, key) : false;
  }

  const PARIS_BLOCKED_LOAN_IDS = ['loan_imf_wb', 'loan_gulf_swf'] as const;
  const PARIS_LOAN_LOCK_REASON = 'مغلق بسبب التنصل من الديون الباريسية';

  let parisRepudiated = $derived(
    $gameStore.flags?.Debt_Repudiated_Paris === 1 ||
      ($draftStore.activePoliticalActions ?? []).includes('REPUDIATE_PARIS')
  );

  function isLoanBlockedByParis(loanId: string): boolean {
    return (
      parisRepudiated &&
      (PARIS_BLOCKED_LOAN_IDS as readonly string[]).includes(loanId)
    );
  }

  function isLoanLocked(loan: ForeignLoanPackage): boolean {
    return isLoanBlockedByParis(loan.id) || $budgetStore.remainingPC < loan.politicalCapitalCost;
  }

  function loanLockReason(loan: ForeignLoanPackage): string {
    if (isLoanBlockedByParis(loan.id)) return PARIS_LOAN_LOCK_REASON;
    if ($budgetStore.remainingPC < loan.politicalCapitalCost) {
      return pcShortageText(loan.politicalCapitalCost, $budgetStore.remainingPC);
    }
    return '';
  }

  // If Paris repudiation becomes active (e.g. queued this turn), drop any
  // already-queued Western/Gulf credit lines via the store's toggle function.
  $effect(() => {
    if (!parisRepudiated) return;
    for (const loanId of $draftStore.signedLoanIds ?? []) {
      if ((PARIS_BLOCKED_LOAN_IDS as readonly string[]).includes(loanId)) {
        draftStore.toggleLoan(loanId);
      }
    }
  });

  // ── Foreign credit lines (available / locked unsigned loans) ──────────────
  let availableLoans = $derived(
    $gameStore.foreignLoans.filter(
      (loan) =>
        !loan.isSigned &&
        (!$draftStore.signedLoanIds.includes(loan.id) || isLoanBlockedByParis(loan.id))
    )
  );
  let sortedLoans = $derived(
    [...availableLoans].sort(
      (a, b) => Number(isLoanLocked(a)) - Number(isLoanLocked(b))
    )
  );

  // ── Concessional facilities (available / locked) ──────────────────────────
  let availableFacilities = $derived(
    CONCESSIONAL_FACILITIES.filter((fac) => {
      const st = facilityStatus(fac.id);
      return (!st || st.status === 'AVAILABLE') && !$draftStore.signedFacilityIds.includes(fac.id);
    })
  );
  let sortedFacilities = $derived(
    [...availableFacilities].sort(
      (a, b) =>
        Number(!canSignFacility($gameStore, a.id, $budgetStore.remainingPC).ok) -
        Number(!canSignFacility($gameStore, b.id, $budgetStore.remainingPC).ok)
    )
  );

  // ── Sovereign mortgages (available) ───────────────────────────────────────
  let availableMortgages = $derived(
    $gameStore.sovereignMortgages.filter(
      (mort) => !mort.isMortgaged && !$draftStore.executedMortgageIds.includes(mort.id)
    )
  );

  // ── Early principal repayment ─────────────────────────────────────────────
  let totalRemainingPrincipal = $derived(
    $gameStore.foreignLoans
      .filter((l) => l.isSigned)
      .reduce((acc, l) => acc + (l.remainingPrincipalUSD ?? l.disbursementUSD), 0)
  );
  // The engine pays early repayment from reserves left after terminations and
  // every other outlay, so the slider is bounded by the budget's same clamp.
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

  // ── Signed-loan early termination ─────────────────────────────────────────
  let terminableLoans = $derived(
    $gameStore.foreignLoans.filter((loan) => {
      if (!loan.isSigned) return false;
      const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
      if (remaining <= 0) return false;
      return !($draftStore.terminatedLoanIds ?? []).includes(loan.id);
    })
  );
  let sortedTerminableLoans = $derived(
    [...terminableLoans].sort((a, b) => {
      const remA = a.remainingPrincipalUSD ?? a.disbursementUSD;
      const remB = b.remainingPrincipalUSD ?? b.disbursementUSD;
      const canA = $budgetStore.remainingUSD >= remA && remA > 0;
      const canB = $budgetStore.remainingUSD >= remB && remB > 0;
      return Number(!canA) - Number(!canB);
    })
  );

  // ── Debt repudiation (4 REPUDIATE_* decrees) ──────────────────────────────
  let sovereignDecrees = $derived(
    DECREES.filter((d) => decreeCategoryOf(d).id === 'sovereignty')
  );

  function isDecreeEnacted(id: string): boolean {
    return $gameStore.enactedDecrees?.includes(id) ?? false;
  }

  function isDecreeActive(id: string): boolean {
    return $draftStore.activePoliticalActions.includes(id);
  }

  function canAffordDecree(id: string): boolean {
    return isDecreeActive(id) || decreePcCost(id) <= $budgetStore.remainingPC;
  }

  let availableRepudiations = $derived(
    sovereignDecrees.filter((d) => !isDecreeEnacted(d.id) && !isDecreeActive(d.id))
  );

  let repudiationDisplayRows = $derived(
    buildFilteredDisplayRows(
      availableRepudiations,
      selectedStat,
      (d) => d.id,
      (d) => isSectionOptionRelated(selectedStat, d.id),
      (d): AvailabilityTier => (canAffordDecree(d.id) ? 0 : 1)
    )
  );

  type BorrowBlockKey = 'loans' | 'facilities' | 'mortgages';
  let borrowDisplayRows = $derived.by(() => {
    const keys: BorrowBlockKey[] = ['loans', 'facilities', 'mortgages'];
    return buildFilteredDisplayRows(
      keys,
      selectedStat,
      (k) => k,
      (k) =>
        k === 'facilities'
          ? isSectionOptionRelated(selectedStat, 'facilities') ||
            isSectionOptionRelated(selectedStat, 'loans')
          : isSectionOptionRelated(selectedStat, k),
      (k): AvailabilityTier => {
        if (k === 'loans') {
          return availableLoans.length === 0 ||
            availableLoans.some((l) => !isLoanLocked(l))
            ? 0
            : 1;
        }
        if (k === 'facilities') {
          return availableFacilities.length === 0 ||
            availableFacilities.some(
              (f) => canSignFacility($gameStore, f.id, $budgetStore.remainingPC).ok
            )
            ? 0
            : 1;
        }
        return 0;
      }
    );
  });

  type SettlementBlockKey = 'extraDebtRepaymentUSD' | 'loanTermination' | 'repudiations';
  let settlementDisplayRows = $derived.by(() => {
    const keys: SettlementBlockKey[] = ['extraDebtRepaymentUSD'];
    if (terminableLoans.length > 0) keys.push('loanTermination');
    if (availableRepudiations.length > 0) keys.push('repudiations');
    return buildFilteredDisplayRows(
      keys,
      selectedStat,
      (k) => k,
      (k) => {
        if (k === 'repudiations') {
          return availableRepudiations.some((d) => isSectionOptionRelated(selectedStat, d.id));
        }
        return isSectionOptionRelated(selectedStat, k);
      },
      (k): AvailabilityTier => {
        if (k === 'extraDebtRepaymentUSD') {
          return totalRemainingPrincipal === 0 || maxRepayM === 0 ? 1 : 0;
        }
        if (k === 'loanTermination') {
          return terminableLoans.some((l) => {
            const rem = l.remainingPrincipalUSD ?? l.disbursementUSD;
            return rem > 0 && $budgetStore.remainingUSD >= rem;
          })
            ? 0
            : 1;
        }
        return availableRepudiations.some((d) => canAffordDecree(d.id)) ? 0 : 1;
      }
    );
  });

  // ── Queued this turn (DoneRow with remove) ────────────────────────────────
  interface DoneEntry {
    key: string;
    optionKey: string;
    title: string;
    cost?: string;
    statusLabel?: string;
    onremove?: () => void;
  }

  let queuedThisTurn = $derived.by<DoneEntry[]>(() => {
    const items: DoneEntry[] = [];

    for (const loanId of $draftStore.signedLoanIds ?? []) {
      if (isLoanBlockedByParis(loanId)) continue;
      const loan = $gameStore.foreignLoans.find((l) => l.id === loanId);
      if (!loan || loan.isSigned) continue;
      items.push({
        key: `q-loan-${loan.id}`,
        optionKey: 'loans',
        title: loan.titleAr,
        cost: `+$${Math.round(loan.disbursementUSD / 1_000_000)}M`,
        onremove: () => draftStore.toggleLoan(loan.id),
      });
    }

    for (const facId of $draftStore.signedFacilityIds ?? []) {
      const fac = CONCESSIONAL_FACILITIES.find((f) => f.id === facId);
      const st = facilityStatus(facId);
      if (!fac || (st && st.status !== 'AVAILABLE')) continue;
      items.push({
        key: `q-fac-${fac.id}`,
        optionKey: 'facilities',
        title: fac.titleAr,
        cost: `${fac.politicalCapitalCost} رصيد`,
        onremove: () => draftStore.toggleFacility(fac.id),
      });
    }

    for (const mortId of $draftStore.executedMortgageIds ?? []) {
      const mort = $gameStore.sovereignMortgages.find((m) => m.id === mortId);
      if (!mort || mort.isMortgaged) continue;
      items.push({
        key: `q-mort-${mort.id}`,
        optionKey: 'mortgages',
        title: mort.titleAr,
        cost: `+$${Math.round(mort.immediateCashUSD / 1_000_000)}M`,
        onremove: () => draftStore.toggleMortgage(mort.id),
      });
    }

    for (const loanId of $draftStore.terminatedLoanIds ?? []) {
      const loan = $gameStore.foreignLoans.find((l) => l.id === loanId);
      if (!loan || !loan.isSigned) continue;
      const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
      items.push({
        key: `q-term-${loan.id}`,
        optionKey: 'loanTermination',
        title: `فسخ سيادي: ${loan.titleAr}`,
        cost: `−$${(remaining / 1_000_000).toFixed(1)}M`,
        onremove: () => draftStore.toggleLoanTermination(loan.id),
      });
    }

    for (const dec of sovereignDecrees) {
      if (isDecreeActive(dec.id) && !isDecreeEnacted(dec.id)) {
        const costPC = decreePcCost(dec.id);
        items.push({
          key: `q-rep-${dec.id}`,
          optionKey: dec.id,
          title: dec.titleAr,
          cost:
            costPC < 0
              ? `+${Math.abs(costPC)} رصيد`
              : costPC > 0
                ? `−${costPC} رصيد`
                : 'مجاني',
          onremove: () => draftStore.togglePoliticalAction(dec.id),
        });
      }
    }

    return items;
  });

  // ── Already active from earlier turns (DoneRow without remove) ────────────
  let alreadyActive = $derived.by<DoneEntry[]>(() => {
    const items: DoneEntry[] = [];

    for (const loan of $gameStore.foreignLoans) {
      if (!loan.isSigned) continue;
      const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD;
      items.push({
        key: `a-loan-${loan.id}`,
        optionKey: 'loans',
        title: loan.titleAr,
        cost: remaining > 0 ? `متبقي $${(remaining / 1_000_000).toFixed(1)}M` : '$0',
        statusLabel: 'موقّع',
      });
    }

    for (const fac of CONCESSIONAL_FACILITIES) {
      const st = facilityStatus(fac.id);
      if (!st || st.status === 'AVAILABLE') continue;
      let statusLabel = 'سارٍ';
      if (st.status === 'BREACHED') statusLabel = 'مجمّد';
      else if (st.status === 'COMPLETED') statusLabel = 'مكتمل';
      else if (fac.tranches.length > 0) statusLabel = `شريحة ${st.tranchesDrawn}/${fac.tranches.length}`;
      const grantExtra =
        fac.id === 'facility_gulf_reconstruction_grant' && st.status === 'ACTIVE'
          ? `منحة $${(($gameStore.macro.grantBucketUSD ?? 0) / 1_000_000).toFixed(0)}M`
          : undefined;
      items.push({
        key: `a-fac-${fac.id}`,
        optionKey: 'facilities',
        title: fac.titleAr,
        cost: grantExtra,
        statusLabel,
      });
    }

    for (const mort of $gameStore.sovereignMortgages) {
      if (!mort.isMortgaged) continue;
      items.push({
        key: `a-mort-${mort.id}`,
        optionKey: 'mortgages',
        title: mort.titleAr,
        statusLabel: 'امتياز قائم',
      });
    }

    for (const dec of sovereignDecrees) {
      if (!isDecreeEnacted(dec.id)) continue;
      items.push({
        key: `a-rep-${dec.id}`,
        optionKey: dec.id,
        title: dec.titleAr,
        statusLabel: 'منفّذ',
      });
    }

    return items;
  });

  // ── Loan / mortgage / facility confirmation dialog ────────────────────────
  function openModal(kind: 'loan' | 'mortgage' | 'facility', id: string): void {
    if (kind === 'loan' && isLoanBlockedByParis(id)) {
      fx('error');
      return;
    }
    fx('tap');
    modalSel = { kind, id };
  }
  function closeModal(): void {
    fx('cancel');
    modalSel = null;
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
        loan &&
          !loan.isSigned &&
          !isLoanBlockedByParis(loan.id) &&
          (modalLoanIsSelected || modalLoanCanAfford)
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
      if (isLoanBlockedByParis(loan.id)) return PARIS_LOAN_LOCK_REASON;
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
      if (isLoanBlockedByParis(loan.id)) {
        fx('error');
        modalSel = null;
        return;
      }
      const wasSelected = $draftStore.signedLoanIds.includes(loan.id);
      if (wasSelected || $budgetStore.remainingPC >= loan.politicalCapitalCost) {
        fx(wasSelected ? 'cancel' : 'confirm');
        draftStore.toggleLoan(loan.id);
      }
      modalSel = null;
      return;
    }
    const mort = modalMortgage();
    if (mort && !mort.isMortgaged) {
      const wasSelected = $draftStore.executedMortgageIds.includes(mort.id);
      fx(wasSelected ? 'cancel' : 'confirm');
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
          fx(selected ? 'cancel' : 'confirm');
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

  // ── Repudiation confirmation dialog ───────────────────────────────────────
  function handleRepudiationAction(dec: PoliticalDecreeItem): void {
    if (isDecreeEnacted(dec.id)) return;
    const active = isDecreeActive(dec.id);
    if (active) {
      fx('cancel');
      draftStore.togglePoliticalAction(dec.id);
      return;
    }
    if (!canAffordDecree(dec.id)) {
      fx('error');
      return;
    }
    fx('tap');
    repudiateModal = dec;
  }

  function confirmRepudiation(): void {
    if (repudiateModal) {
      const costPC = decreePcCost(repudiateModal.id);
      const active = isDecreeActive(repudiateModal.id);
      if (active || costPC <= $budgetStore.remainingPC) {
        fx(active ? 'cancel' : 'confirm');
        draftStore.togglePoliticalAction(repudiateModal.id);
        if (!active && repudiateModal.id === 'REPUDIATE_PARIS') {
          for (const blockedId of PARIS_BLOCKED_LOAN_IDS) {
            if ($draftStore.signedLoanIds.includes(blockedId)) {
              draftStore.toggleLoan(blockedId);
            }
          }
        }
      }
    }
    repudiateModal = null;
  }

  function closeRepudiation(): void {
    fx('cancel');
    repudiateModal = null;
  }

  function toggleFacilityDetail(id: string): void {
    fx('tap');
    expandedFacilityDetails = {
      ...expandedFacilityDetails,
      [id]: !expandedFacilityDetails[id],
    };
  }
</script>

<div class="flex flex-col gap-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
  <!-- ── اقتراض ───────────────────────────────────────────────────────────── -->
  <GroupDivider label="اقتراض" tone="accent" />

  {#each borrowDisplayRows as row (row.key)}
    <div animate:flip={{ duration: flipDuration() }} class="flex flex-col">
      {#if row.kind === 'divider'}
        <GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />
      {:else if row.item === 'loans'}
        {#if sortedLoans.length > 0}
          <section
            class={sortedLoans.length > 1 ? 'oc-grid-2-wide' : 'flex flex-col gap-1.5'}
            aria-label="خطوط الائتمان والتمويل الخارجي"
          >
            {#each sortedLoans as loan (loan.id)}
              {@const locked = isLoanLocked(loan)}
              {@const reason = loanLockReason(loan)}
              <div id={loan.id} class="flex flex-col">
                <ActionRow
                  title={loan.titleAr}
                  description={`فائدة ${loan.interestRatePct}% · −${loan.politicalCapitalCost} رصيد`}
                  cost={`+$${Math.round(loan.disbursementUSD / 1_000_000)}M`}
                  costTone="pos"
                  buttonLabel="توقيع"
                  {locked}
                  lockReason={reason}
                  dimmed={!row.related}
                  onclick={() => openModal('loan', loan.id)}
                />
              </div>
            {/each}
          </section>
        {:else}
          <div class="border border-dashed border-[var(--c-line)] px-3 py-2 text-[11.5px] text-[var(--c-muted)] {!row.related ? 'is-filtered-out' : ''}">
            لا توجد خطوط ائتمان خارجية متاحة للتوقيع حالياً.
          </div>
        {/if}
      {:else if row.item === 'facilities'}
        <CollapsibleGroup
          title="تسهيلات ميسّرة بشروط"
          summary={sortedFacilities.length > 0 ? `${sortedFacilities.length} متاحة` : 'لا توجد متاحة'}
          bind:open={facilitiesGroupOpen}
          dimmed={!row.related}
        >
          {#if sortedFacilities.length === 0}
            <div class="border border-dashed border-[var(--c-line)] px-3 py-2 text-[11.5px] text-[var(--c-muted)]">
              لا توجد تسهيلات متاحة للتوقيع حالياً.
            </div>
          {:else}
            {#each sortedFacilities as fac (fac.id)}
              {@const check = canSignFacility($gameStore, fac.id, $budgetStore.remainingPC)}
              {@const totalM = fac.tranches.reduce((a, t) => a + t.amountUSD, 0) / 1_000_000}
              {@const detailOpen = Boolean(expandedFacilityDetails[fac.id])}
              <div class="flex flex-col">
                <ActionCard
                  id={fac.id}
                  tag={fac.lenderAr}
                  title={fac.titleAr}
                  description={fac.descriptionAr}
                  cost={String(fac.politicalCapitalCost)}
                  costUnit="رصيد"
                  costTone="accent"
                  buttonLabel="توقيع التسهيل"
                  locked={!check.ok}
                  lockReason={check.reasonAr}
                  onclick={() => openModal('facility', fac.id)}
                >
                  {#snippet chips()}
                    <FxChip text="شرط" tone="warn" />
                    {#if totalM > 0}
                      <FxChip text={`+$${totalM}M على ${fac.tranches.length} شرائح`} tone="good" />
                    {:else}
                      <FxChip text="خفض دائم للقسط" tone="good" />
                    {/if}
                    <FxChip text={`−${fac.politicalCapitalCost} رصيد`} tone="bad" />
                    <FxChip text={`−${fac.leverageCost} رافعة`} tone="bad" />
                  {/snippet}
                </ActionCard>

                <button
                  type="button"
                  onclick={() => toggleFacilityDetail(fac.id)}
                  aria-expanded={detailOpen}
                  class="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 border border-t-0 border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 py-1.5 text-start text-[11.5px] text-[var(--c-muted)] hover:text-[var(--c-text)]"
                >
                  <span>تفاصيل الشرط والإخلال</span>
                  <span aria-hidden="true" class="oc-kit-num font-bold">{detailOpen ? '−' : '+'}</span>
                </button>

                {#if detailOpen}
                  <div class="space-y-1 border border-t-0 border-[var(--c-line)] bg-[var(--c-bg)] px-2.5 py-2 text-[11.5px] leading-[1.45]">
                    <p class="text-[var(--c-accent)]">شرط: {fac.conditionAr}</p>
                    <p class="text-[var(--c-neg)]">إذا أخللت: {fac.breachAr}</p>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </CollapsibleGroup>
      {:else if row.item === 'mortgages'}
        <CollapsibleGroup
          title="رهون سيادية"
          summary={availableMortgages.length > 0 ? `${availableMortgages.length} أصول` : 'لا توجد متاحة'}
          bind:open={mortgagesGroupOpen}
          dimmed={!row.related}
        >
          {#if availableMortgages.length === 0}
            <div class="border border-dashed border-[var(--c-line)] px-3 py-2 text-[11.5px] text-[var(--c-muted)]">
              لا توجد أصول متاحة للرهن حالياً.
            </div>
          {:else}
            {#each availableMortgages as mort (mort.id)}
              <ActionCard
                id={mort.id}
                tag={mort.assetNameAr}
                title={mort.titleAr}
                description={mort.sovereigntyPenaltyAr}
                cost={`+$${Math.round(mort.immediateCashUSD / 1_000_000)}M`}
                costUnit="كاش"
                costTone="pos"
                buttonLabel="عرض الرهن"
                onclick={() => openModal('mortgage', mort.id)}
              >
                {#snippet chips()}
                  <FxChip text={`−$${mort.turnRevenueLossUSD / 1_000_000}M / دور`} tone="bad" />
                  <FxChip text={`امتياز ${mort.concessionDurationYears} سنة`} tone="neutral" />
                {/snippet}
              </ActionCard>
            {/each}
          {/if}
        </CollapsibleGroup>
      {/if}
    </div>
  {/each}

  <!-- ── سداد وتسوية ──────────────────────────────────────────────────────── -->
  <GroupDivider label="سداد وتسوية" tone="accent" />

  {#each settlementDisplayRows as row (row.key)}
    <div animate:flip={{ duration: flipDuration() }} class="flex flex-col">
      {#if row.kind === 'divider'}
        <GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />
      {:else if row.item === 'extraDebtRepaymentUSD'}
        <Lever
          title="سداد مبكر لأصل الدين"
          value={Math.min(repayM, maxRepayM)}
          min={0}
          max={maxRepayM}
          step={5}
          disabled={totalRemainingPrincipal === 0 || maxRepayM === 0}
          display={repayM > 0 ? `$${repayM}M` : '$0 هذا الدور'}
          minLabel="$0M"
          maxLabel={`$${maxRepayM}M`}
          hint={totalRemainingPrincipal > 0
            ? 'يُخصم من الاحتياطي ويُطفئ أعلى القروض فائدة أولاً (رافعة +2 لكل $100M)'
            : 'لا توجد قروض خارجية موقّعة للسداد المبكر حالياً'}
          ariaLabel="سداد مبكر لأصل الدين بالمليون دولار"
          dimmed={!row.related}
          onchange={(value) => draftStore.setField('extraDebtRepaymentUSD', value * 1_000_000)}
        >
          {#snippet chips()}
            {#if repayM > 0}
              <FxChip text={`−$${repayM}M احتياطي`} tone="bad" />
              <FxChip text={`+${Math.floor((repayM / 100) * 2)} رافعة`} tone="good" />
            {:else if totalRemainingPrincipal > 0}
              <FxChip text={`أصل الدين المتبقي $${(totalRemainingPrincipal / 1_000_000).toFixed(1)}M`} tone="neutral" />
            {/if}
          {/snippet}
        </Lever>
      {:else if row.item === 'loanTermination'}
        <section
          class={sortedTerminableLoans.length > 1 ? 'oc-grid-2-wide' : 'flex flex-col gap-1.5'}
          aria-label="فسخ القروض الموقعة"
        >
          {#each sortedTerminableLoans as loan (loan.id)}
            {@const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD}
            {@const service = Math.floor((remaining * loan.interestRatePct) / 100 / 2)}
            {@const canTerminate = $budgetStore.remainingUSD >= remaining && remaining > 0}
            <ActionRow
              title={`فسخ سيادي: ${loan.titleAr}`}
              description={`المتبقي $${(remaining / 1_000_000).toFixed(1)}M · خدمة $${(service / 1_000_000).toFixed(1)}M/دور`}
              cost={`−$${(remaining / 1_000_000).toFixed(1)}M`}
              costTone="neg"
              buttonLabel="فسخ سيادي"
              locked={!canTerminate}
              lockReason="احتياطي غير كافٍ للفسخ"
              dimmed={!row.related}
              onclick={() => {
                if (canTerminate) {
                  fx('confirm');
                  draftStore.toggleLoanTermination(loan.id);
                } else {
                  fx('error');
                }
              }}
            >
              {#snippet chips()}
                <FxChip text="+6 رصيد سياسي" tone="good" />
                <FxChip text="+4 رافعة سيادية" tone="good" />
              {/snippet}
            </ActionRow>
          {/each}
        </section>
      {:else if row.item === 'repudiations'}
        <CollapsibleGroup
          title="التنصل من الديون"
          summary={`${availableRepudiations.length} ملفات · يكسب رصيداً ويكلف سمعة`}
          tone="danger"
          bind:open={repudiationGroupOpen}
          dimmed={!row.related}
        >
          {#each repudiationDisplayRows as repRow (repRow.key)}
            <div animate:flip={{ duration: flipDuration() }} class="flex flex-col">
              {#if repRow.kind === 'divider'}
                <GroupDivider label="غير مرتبط بهذا المؤشر" count={repRow.count} />
              {:else}
                {@const dec = repRow.item}
                {@const costPC = decreePcCost(dec.id)}
                {@const locked = !canAffordDecree(dec.id)}
                <ActionCard
                  id={dec.id}
                  data-decree-id={dec.id}
                  tag="سيادة وديون"
                  title={dec.titleAr}
                  description={dec.descAr}
                  cost={costPC < 0 ? `+${Math.abs(costPC)}` : String(costPC)}
                  costUnit="رصيد"
                  costTone={costPC < 0 ? 'pos' : 'accent'}
                  buttonLabel="أضف إلى الحصيلة"
                  buttonVariant="danger"
                  {locked}
                  lockReason={locked ? pcShortageText(costPC, $budgetStore.remainingPC) : ''}
                  dimmed={row.related ? !repRow.related : false}
                  onclick={() => handleRepudiationAction(dec)}
                >
                  {#snippet chips()}
                    {#each cardEffectChips(dec) as fxItem, i (fxItem.text + i)}
                      <FxChip text={fxItem.text} tone={fxItem.tone} />
                    {/each}
                  {/snippet}
                </ActionCard>
              {/if}
            </div>
          {/each}
        </CollapsibleGroup>
      {/if}
    </div>
  {/each}

  <!-- ── موقّع هذا الدور (DONE) ───────────────────────────────────────────── -->
  {#if queuedThisTurn.length > 0}
    <GroupDivider label="موقّع هذا الدور" count={queuedThisTurn.length} />
    <div class="flex flex-col gap-1.5">
      {#each queuedThisTurn as item (item.key)}
        <DoneRow
          title={item.title}
          cost={item.cost}
          dimmed={dimmedFor(item.optionKey)}
          onremove={item.onremove}
        />
      {/each}
    </div>
  {/if}

  <!-- ── سارٍ من أدوار سابقة (DONE, no remove) ───────────────────────────── -->
  {#if alreadyActive.length > 0}
    <GroupDivider label="سارٍ من أدوار سابقة" count={alreadyActive.length} />
    <div class="flex flex-col gap-1.5">
      {#each alreadyActive as item (item.key)}
        <DoneRow
          title={item.title}
          cost={item.cost}
          statusLabel={item.statusLabel}
          dimmed={dimmedFor(item.optionKey)}
          removable={false}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- ── Loan / mortgage / facility detail dialog ───────────────────────────── -->
<DebtDialog
  open={modalSel !== null}
  title={modalTitle}
  ariaLabel="تفاصيل التمويل الطارئ"
  kicker="تمويل طارئ"
  confirmLabel={modalConfirmLabel}
  confirmDisabled={!modalConfirmOk}
  onconfirm={confirmModal}
  onclose={closeModal}
>
  {#if modalLoan()}
    {@const loan = modalLoan()!}
    <div class="space-y-2">
      <p class="text-[12px] leading-relaxed text-[var(--c-text-2)]">
        {loan.lenderAr} — {loan.concessionSummaryAr}
      </p>
      <div class="fx">
        <FxChip text={`+$${loan.disbursementUSD / 1_000_000}M`} tone="good" />
        <FxChip
          text={`فائدة ${loan.interestRatePct}% (خدمة $${((loan.disbursementUSD * loan.interestRatePct) / 100 / 2 / 1_000_000).toFixed(1)}M/دور)`}
          tone="neutral"
        />
        <FxChip text={`−${loan.politicalCapitalCost} رصيد سياسي`} tone="bad" />
      </div>
    </div>
  {:else if modalMortgage()}
    {@const mort = modalMortgage()!}
    <div class="space-y-2">
      <p class="text-[12px] leading-relaxed text-[var(--c-text-2)]">
        {mort.assetNameAr} — امتياز لـ {mort.concessionDurationYears} سنة
      </p>
      <p class="text-[11.5px] leading-relaxed text-[var(--c-neg)]">{mort.sovereigntyPenaltyAr}</p>
      <div class="fx">
        <FxChip text={`+$${mort.immediateCashUSD / 1_000_000}M`} tone="good" />
        <FxChip text={`−$${mort.turnRevenueLossUSD / 1_000_000}M / دور`} tone="bad" />
      </div>
    </div>
  {:else if modalFacility()}
    {@const fac = modalFacility()!}
    <div class="space-y-2">
      <p class="text-[12px] leading-relaxed text-[var(--c-text-2)]">
        {fac.lenderAr} — {fac.descriptionAr}
      </p>
      <p class="text-[12px] leading-relaxed text-[var(--c-accent)]">الشرط: {fac.conditionAr}</p>
      <p class="text-[11.5px] leading-relaxed text-[var(--c-neg)]">
        ماذا يحدث إذا أخللت: {fac.breachAr}
      </p>
      <div class="fx">
        {#if fac.tranches.length > 0}
          {#each fac.tranches as t, i (i)}
            <FxChip
              text={`الشريحة ${i + 1}: +$${t.amountUSD / 1_000_000}M${t.ringFenced ? ' (للمشاريع حصراً)' : ''}`}
              tone="good"
            />
          {/each}
        {:else}
          <FxChip text="تفعيل لمرة واحدة" tone="good" />
        {/if}
        <FxChip
          text={`−${fac.politicalCapitalCost} رصيد سياسي · −${fac.leverageCost} رافعة`}
          tone="bad"
        />
      </div>
      {#if !modalFacilitySel && !modalFacilityCheck.ok}
        <p class="text-[12px] leading-relaxed text-[var(--c-neg)]">
          {modalFacilityCheck.reasonAr}
        </p>
      {/if}
    </div>
  {/if}
</DebtDialog>

<!-- ── Repudiation danger confirmation dialog ─────────────────────────────── -->
<DebtDialog
  open={repudiateModal !== null}
  title={repudiateModal?.titleAr ?? ''}
  ariaLabel={repudiateModal?.titleAr ?? 'قرار سيادي خطير'}
  kicker="قرار سيادي خطير"
  tone="danger"
  confirmLabel={repudiateModal
    ? isDecreeActive(repudiateModal.id)
      ? 'إلغاء التفعيل'
      : !canAffordDecree(repudiateModal.id)
        ? `رصيد غير كافٍ (${decreePcCost(repudiateModal.id)})`
        : 'تأكيد التفعيل'
    : 'تأكيد التفعيل'}
  confirmDisabled={repudiateModal
    ? !isDecreeActive(repudiateModal.id) && !canAffordDecree(repudiateModal.id)
    : true}
  onconfirm={confirmRepudiation}
  onclose={closeRepudiation}
>
  {#if repudiateModal}
    {@const costPC = decreePcCost(repudiateModal.id)}
    <div class="space-y-3">
      <p class="text-[12px] leading-relaxed text-[var(--c-text-2)]">{repudiateModal.descAr}</p>
      <div class="fx">
        {#each allEffectChips(repudiateModal) as chip, i (chip.text + i)}
          <FxChip text={chip.text} tone={chip.tone} />
        {/each}
        {#if costPC > 0}
          <FxChip text={`−${costPC} رصيد سياسي`} tone="bad" />
        {:else if costPC < 0 && !allEffectChips(repudiateModal).some((c) => c.text.includes('رصيد'))}
          <FxChip text={`+${Math.abs(costPC)} رصيد سياسي`} tone="good" />
        {:else if costPC === 0}
          <FxChip text="دون كلفة سياسية" tone="neutral" />
        {/if}
      </div>
      <div class="flex items-center justify-between gap-2 border-t border-[var(--c-line)] pt-2 text-[11px] text-[var(--c-muted)]">
        <span>{decreeTypeLabel(repudiateModal.behavior)}</span>
        <span class="oc-kit-num font-bold">
          المتاح بعد الحصيلة: {Math.max(0, Math.floor($budgetStore.remainingPC))} نقطة
        </span>
      </div>
    </div>
  {/if}
</DebtDialog>
