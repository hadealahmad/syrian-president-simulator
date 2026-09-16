<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import ToggleSwitch from '../ToggleSwitch.svelte';
  import { DECREES, isOptionRelated, SUSPENDED_CARD_CLASS, SUSPENDED_CONTENT_CLASS, SUSPENDED_ICON, pcShortageText } from './shared';
  import type { ForeignLoanPackage, SovereignMortgageOption } from '../../engine/types';

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let modalSel: { kind: 'loan' | 'mortgage'; id: string } | null = $state(null);

  // Done items sink to the bottom; under a topbar filter, related items rise
  // to the top (stable sort preserves source order within ranks).
  function rank(done: boolean, key: string): number {    if (done) return 2;
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
  let maxRepayM = $derived(
    Math.max(0, Math.floor(Math.min(200, ($gameStore.macro.reservesUSD ?? 0) / 1_000_000, totalRemainingPrincipal / 1_000_000) / 5) * 5)
  );
  let repayM = $derived(($draftStore.extraDebtRepaymentUSD ?? 0) / 1_000_000);

  // Emergency import surge: $40M of reserves for +6 PC and blackout relief
  let canAffordSurge = $derived(
    $draftStore.importSurge || ($gameStore.macro.reservesUSD ?? 0) >= 40_000_000
  );

  function dimClass(key: string): string {
    return selectedStat
      ? isOptionRelated(selectedStat, key)
        ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100'
        : 'opacity-20 pointer-events-none select-none grayscale'
      : 'pointer-events-auto opacity-100';
  }

  function openModal(kind: 'loan' | 'mortgage', id: string): void {
    modalSel = { kind, id };
  }
  function modalLoan(): ForeignLoanPackage | undefined {
    return modalSel?.kind === 'loan' ? $gameStore.foreignLoans.find((l) => l.id === modalSel!.id) : undefined;
  }
  function modalMortgage(): SovereignMortgageOption | undefined {
    return modalSel?.kind === 'mortgage' ? $gameStore.sovereignMortgages.find((m) => m.id === modalSel!.id) : undefined;
  }
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
    }
  }
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2 border-b border-charcoal-mid pb-2">
    <GameIcon name="siren" cls="w-5 h-5 text-wheat-gold shrink-0" />
    <h3 class="text-sm font-bold text-wheat-light font-heading">التمويل الطارئ وقانون الطوارئ</h3>
  </div>

  <!-- Foreign loans grid -->
  <div class="space-y-2">
    <h4 class="text-xs font-bold text-wheat-gold font-heading">خطوط الائتمان والتمويل الخارجي</h4>
    <div class="grid grid-cols-1 gap-2">
      {#each orderedLoans as loan}
        {@const isSelected = $draftStore.signedLoanIds.includes(loan.id) || loan.isSigned}
        {@const canAffordLoan = isSelected || $budgetStore.remainingPC >= loan.politicalCapitalCost}
        {#if loan.isSigned}
          {@const remaining = loan.remainingPrincipalUSD ?? loan.disbursementUSD}
          {@const service = Math.floor(((remaining * loan.interestRatePct) / 100 / 2))}
          {@const isTerminating = ($draftStore.terminatedLoanIds ?? []).includes(loan.id)}
          {@const canTerminate = isTerminating || ($budgetStore.remainingUSD >= remaining && remaining > 0)}
          <div class="px-2 py-2 border border-forest-accent/40 bg-forest-surface/40 opacity-90 space-y-1 {isTerminating ? 'ring-2 ring-wheat-gold/80' : ''}">
            <div class="flex items-center gap-1.5">
              <GameIcon name="check-mark" cls="w-4 h-4 text-forest-accent shrink-0" />
              <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">{loan.titleAr}</span>
            </div>
            <span class="flex items-center gap-1 flex-wrap">
              <span class="px-1.5 py-px rounded-full bg-forest-surface border border-charcoal-mid text-wheat-light font-mono font-bold text-[8px]">
                المتبقي ${(remaining / 1_000_000).toFixed(1)}M$
              </span>
              <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">
                <span class="font-bold">−</span>خدمة ${(service / 1_000_000).toFixed(1)}M$ / دور
              </span>
            </span>
            {#if remaining > 0}
              <button
                disabled={!canTerminate}
                onclick={() => { if (canTerminate) draftStore.toggleLoanTermination(loan.id); }}
                title={`فسخ سيادي: سداد كامل المتبقي (${(remaining / 1_000_000).toFixed(1)}M$) من الاحتياطي مقابل +6 رصيد سياسي و+4 رافعة سيادية`}
                class="w-full mt-1 px-1.5 py-1 border text-[9px] font-bold rounded-none transition-colors {isTerminating ? 'bg-forest-surface border-forest-accent text-forest-accent cursor-pointer' : canTerminate ? 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light hover:border-wheat-mid/60 cursor-pointer' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark opacity-50 cursor-not-allowed'}"
              >
                {isTerminating ? 'فسخ سيادي مُعتمد (+6 سياسي / +4 سيادة)' : !canTerminate ? 'احتياطي غير كافٍ للفسخ' : `فسخ سيادي (−$${(remaining / 1_000_000).toFixed(1)}M → +6 سياسي / +4 سيادة)`}
              </button>
            {/if}
          </div>
        {:else}
          <button
            onclick={() => openModal('loan', loan.id)}
            title={canAffordLoan ? loan.titleAr : pcShortageText(loan.politicalCapitalCost, $budgetStore.remainingPC)}
            class="px-2 py-2 text-start border bg-forest-deep/60 cursor-pointer transition-all {canAffordLoan ? 'border-charcoal-mid hover:border-wheat-mid/70 hover:bg-forest-surface' : SUSPENDED_CARD_CLASS} {dimClass('loans')} {isSelected ? 'ring-2 ring-wheat-gold/80' : ''}"
          >
            <div class="space-y-1.5 {canAffordLoan ? '' : SUSPENDED_CONTENT_CLASS}">
              <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight block">{loan.titleAr}</span>
              <span class="flex items-center gap-1 flex-wrap">
                <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">
                  +${loan.disbursementUSD / 1_000_000}M
                </span>
                <span class="px-1.5 py-px rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8px]">
                  فائدة {loan.interestRatePct}%
                </span>
                <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">
                  <span class="font-bold">−</span>{loan.politicalCapitalCost} رصيد سياسي
                </span>
                {#if isSelected}
                  <span class="w-2 h-2 rounded-full bg-wheat-gold animate-pulse shrink-0"></span>
                {/if}
              </span>
            </div>
            {#if !canAffordLoan}
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
              </div>
            {/if}
          </button>
        {/if}
      {/each}
    </div>

    <!-- Early principal repayment (highest-rate loans first) -->
    {#if totalRemainingPrincipal > 0}
      <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2">
        <div class="flex justify-between items-start text-xs">
          <div>
            <span class="text-xs font-bold text-wheat-gold font-heading block">سداد مبكر لأصل الدين (${repayM}M)</span>
            <span class="text-[10px] text-wheat-dark">يُخصم من الاحتياطي ويُطفئ أعلى القروض فائدة أولاً (+2 leverage لكل $100M)</span>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold font-mono font-bold text-[10px]">
            ${repayM}M
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={maxRepayM}
          step="5"
          value={Math.min(repayM, maxRepayM)}
          oninput={(e) => draftStore.setField('extraDebtRepaymentUSD', Number(e.currentTarget.value) * 1_000_000)}
          class="w-full accent-wheat-gold cursor-pointer rounded-none bg-charcoal-surface h-1.5 border border-charcoal-mid"
        />
        <div class="flex justify-between text-[10px] text-wheat-dark font-mono">
          <span>$0M</span>
          <span>${maxRepayM}M</span>
        </div>
      </div>
    {/if}

    <!-- Emergency food/fuel import surge: burn $40M of reserves for +6 PC -->
    <div class="py-2.5 border-b border-charcoal-mid/50 flex items-center justify-between gap-2">
      <div class="space-y-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-bold text-wheat-gold block font-heading">دفعة استيراد إغاثية طارئة (غذاء ووقود)</span>
          <span class="px-1.5 py-0.2 rounded-none bg-forest-surface border border-forest-accent/40 text-forest-accent text-[8.5px] font-mono">لمرة واحدة هذا الدور</span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9.5px]">-$40M</span>
          <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9.5px]">+6 رصيد سياسي</span>
          <span class="px-2 py-0.5 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[9.5px]">-1 سا تقنين / -2 احتقان</span>
        </div>
      </div>
      <ToggleSwitch
        checked={$draftStore.importSurge}
        disabled={!$draftStore.importSurge && !canAffordSurge}
        label="دفعة استيراد إغاثية طارئة"
        onchange={(next) => {
          if (next ? canAffordSurge : true) draftStore.setField('importSurge', next);
        }}
      />
    </div>

    <!-- Sovereign mortgages grid -->
    <div class="space-y-2 pt-1">
      <h4 class="text-xs font-bold text-wheat-gold font-heading">الرهون والامتيازات السيادية الطارئة</h4>
      <div class="grid grid-cols-1 gap-2">
        {#each orderedMortgages as mort}
          {@const isMortgaged = $draftStore.executedMortgageIds.includes(mort.id) || mort.isMortgaged}
          {#if mort.isMortgaged}
            <div class="flex items-center gap-1.5 px-2 py-2 border border-forest-accent/40 bg-forest-surface/40 opacity-90">
              <GameIcon name="check-mark" cls="w-4 h-4 text-forest-accent shrink-0" />
              <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">{mort.titleAr}</span>
            </div>
          {:else}
            <button
              onclick={() => openModal('mortgage', mort.id)}
              class="px-2 py-2 space-y-1.5 text-start border border-charcoal-mid bg-forest-deep/60 hover:border-wheat-mid/70 hover:bg-forest-surface cursor-pointer transition-all {dimClass('mortgages')} {isMortgaged ? 'ring-2 ring-wheat-gold/80' : ''}"
            >
              <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight block">{mort.titleAr}</span>
              <span class="flex items-center gap-1 flex-wrap">
                <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">
                  +${mort.immediateCashUSD / 1_000_000}M
                </span>
                <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">
                  <span class="font-bold">−</span>${mort.turnRevenueLossUSD / 1_000_000}M / دور
                </span>
                {#if isMortgaged}
                  <span class="w-2 h-2 rounded-full bg-wheat-gold animate-pulse shrink-0"></span>
                {/if}
              </span>
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <!-- Emergency law (martial law direct switch) -->
  <div class="space-y-2">
    <h4 class="text-xs font-bold text-wheat-gold font-heading">قانون الطوارئ</h4>
    {#each DECREES.filter((d) => d.id === 'MARTIAL_LAW') as dec}
      {@const isActive = $draftStore.activePoliticalActions.includes(dec.id)}
      <div
        class="w-full px-2 py-2 space-y-1.5 border border-charcoal-mid bg-forest-deep/60 {isActive ? 'ring-2 ring-wheat-gold/80' : ''}"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">{dec.titleAr}</span>
          <ToggleSwitch
            checked={isActive}
            label="إعلان حالة الطوارئ"
            onchange={() => draftStore.togglePoliticalAction(dec.id)}
          />
        </div>
        <span class="flex items-center gap-1 flex-wrap">
          {#each dec.effectsAr.filter((fx) => fx.scope === 'national') as fx}
            <span
              class="px-1.5 py-px rounded-full border font-mono font-bold text-[8px] {fx.tone === 'good'
                ? 'bg-forest-mid border-forest-accent/60 text-forest-accent'
                : 'bg-umber-deep border-umber-border text-umber-crimson'}"
            >
              {fx.text}
            </span>
          {/each}
        </span>
        {#if isActive}
          <div class="py-1 text-[10px] space-y-0.5 text-amber-200">
            <span class="font-bold text-amber-300 block">ديبَف مستمر سارٍ:</span>
            <span>تخفيض الاحتقان مستمر، مع هبوط متواصل في الثقة الشعبية (-4 كل دور) حتى تنهي حالة الطوارئ يدوياً.</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<!-- Emergency detail modal -->
{#if modalSel}
  {@const loan = modalLoan()}
  {@const mort = modalMortgage()}
  {@const isLoanSelected = loan ? $draftStore.signedLoanIds.includes(loan.id) || loan.isSigned : false}
  {@const canAffordLoan = loan ? isLoanSelected || $budgetStore.remainingPC >= loan.politicalCapitalCost : false}
  {@const isMortgagedSel = mort ? $draftStore.executedMortgageIds.includes(mort.id) || mort.isMortgaged : false}
  {@const confirmOk = loan ? !loan.isSigned && (isLoanSelected || canAffordLoan) : mort ? !mort.isMortgaged : false}
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="تفاصيل التمويل الطارئ">
    <button
      class="absolute inset-0 bg-black/60 cursor-default"
      onclick={() => (modalSel = null)}
      tabindex="-1"
      aria-label="إلغاء"
    ></button>
    <div class="relative w-full max-w-[420px] bg-forest-deep border-2 border-wheat-mid/70 shadow-2xl p-5 space-y-3 text-wheat-light font-arabic rounded-none">
      {#if loan}
        <h3 class="text-sm font-bold text-wheat-gold font-heading leading-snug">{loan.titleAr}</h3>
        <p class="text-[11px] text-wheat-dark leading-relaxed">{loan.lenderAr} — {loan.concessionSummaryAr}</p>
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9.5px]">
            +${loan.disbursementUSD / 1_000_000}M
          </span>
          <span class="px-2 py-0.5 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[9.5px]">
            فائدة {loan.interestRatePct}% (خدمة ${((loan.disbursementUSD * loan.interestRatePct) / 100 / 2 / 1_000_000).toFixed(1)}M/دور)
          </span>
          <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9.5px]">
            <span class="font-bold">−</span>{loan.politicalCapitalCost} رصيد سياسي
          </span>
        </div>
      {:else if mort}
        <h3 class="text-sm font-bold text-wheat-gold font-heading leading-snug">{mort.titleAr}</h3>
        <p class="text-[11px] text-wheat-dark leading-relaxed">{mort.assetNameAr} — امتياز لـ {mort.concessionDurationYears} سنة</p>
        <p class="text-[10px] text-umber-crimson leading-relaxed">{mort.sovereigntyPenaltyAr}</p>
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[9.5px]">
            +${mort.immediateCashUSD / 1_000_000}M
          </span>
          <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9.5px]">
            <span class="font-bold">−</span>${mort.turnRevenueLossUSD / 1_000_000}M / دور
          </span>
        </div>
      {/if}
      <div class="flex justify-end gap-2 pt-1">
        <button
          onclick={() => (modalSel = null)}
          class="px-4 py-2 text-xs font-bold border border-charcoal-mid bg-charcoal-surface text-wheat-mid hover:text-wheat-light hover:border-charcoal-light cursor-pointer transition-colors rounded-none font-heading"
        >
          إلغاء
        </button>
        <button
          disabled={!confirmOk}
          onclick={confirmModal}
          class="px-4 py-2 text-xs font-bold border transition-colors rounded-none font-heading {confirmOk
            ? 'bg-wheat-gold text-forest-deep border-wheat-gold hover:bg-wheat-light cursor-pointer'
            : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-60'}"
        >
          {loan ? (isLoanSelected ? 'إلغاء الاعتماد' : !canAffordLoan ? `رصيد غير كافٍ (${loan.politicalCapitalCost})` : 'تأكيد التوقيع') : isMortgagedSel ? 'إلغاء الاعتماد' : 'تأكيد الرهن'}
        </button>
      </div>
    </div>
  </div>
{/if}
