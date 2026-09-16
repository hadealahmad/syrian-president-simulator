<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import ToggleSwitch from '../ToggleSwitch.svelte';
  import { DECREES, DECREE_PC_COSTS, isOptionRelated, SUSPENDED_CARD_CLASS, SUSPENDED_CONTENT_CLASS, SUSPENDED_ICON, pcShortageText, type PoliticalDecreeItem } from './shared';

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let modalDecree: PoliticalDecreeItem | null = $state(null);

  function rank(done: boolean, key: string): number {
    if (done) return 2;
    if (selectedStat && !isOptionRelated(selectedStat, key)) return 1;
    return 0;
  }
  function ordered(list: PoliticalDecreeItem[]): PoliticalDecreeItem[] {
    return [...list].sort(
      (a, b) =>
        rank($gameStore.enactedDecrees?.includes(a.id) ?? false, a.id) -
        rank($gameStore.enactedDecrees?.includes(b.id) ?? false, b.id)
    );
  }
  let oneTime = $derived(ordered(DECREES.filter((d) => d.behavior === 'ONE_TIME')));
  let reusable = $derived(ordered(DECREES.filter((d) => d.behavior === 'PERIODIC')));
  let grantActive = $derived($draftStore.populistGrant);
  let canAffordGrant = $derived(
    $draftStore.populistGrant || $budgetStore.canAffordWithFxCoverage(0, 750_000_000_000)
  );

  function openModal(dec: PoliticalDecreeItem): void {
    if ($gameStore.enactedDecrees?.includes(dec.id)) return;
    modalDecree = dec;
  }
  function confirmModal(): void {
    if (modalDecree) {
      const costPC = DECREE_PC_COSTS[modalDecree.id] || 0;
      const isActive = $draftStore.activePoliticalActions.includes(modalDecree.id);
      if (isActive || costPC <= $budgetStore.remainingPC) {
        draftStore.togglePoliticalAction(modalDecree.id);
      }
    }
    modalDecree = null;
  }

  function dimClass(decId: string): string {
    return selectedStat
      ? isOptionRelated(selectedStat, decId)
        ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100'
        : 'opacity-20 pointer-events-none select-none grayscale'
      : 'pointer-events-auto opacity-100';
  }

  const CADENCE_PILL_CLASS =
    'absolute top-1 left-1 px-1.5 py-px rounded-full bg-charcoal-surface/90 border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8px] pointer-events-none';
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2 border-b border-charcoal-mid pb-2">
    <GameIcon name="scroll-quill" cls="w-5 h-5 text-wheat-gold shrink-0" />
    <h3 class="text-sm font-bold text-wheat-light font-heading">المراسيم الرئاسية والقرارات السيادية</h3>
  </div>

  <!-- One-time decrees -->
  <div class="space-y-2">
    <h4 class="text-xs font-bold text-wheat-gold font-heading">مراسيم لمرة واحدة</h4>
    <div class="grid grid-cols-1 gap-2">
      {#each oneTime as dec}
        {@const isEnacted = $gameStore.enactedDecrees?.includes(dec.id)}
        {@const isActive = $draftStore.activePoliticalActions.includes(dec.id)}
        {@const costPC = DECREE_PC_COSTS[dec.id] || 0}
        {@const canAffordDec = isActive || costPC <= $budgetStore.remainingPC}
        {#if isEnacted}
          <div class="flex items-center gap-1.5 px-2 py-2 border border-forest-accent/40 bg-forest-surface/40 opacity-90">
            <GameIcon name="check-mark" cls="w-4 h-4 text-forest-accent shrink-0" />
            <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">{dec.titleAr}</span>
          </div>
        {:else}
          <button
            onclick={() => openModal(dec)}
            title={canAffordDec ? dec.titleAr : pcShortageText(costPC, $budgetStore.remainingPC)}
            class="relative flex flex-row items-stretch text-start border bg-forest-deep/60 cursor-pointer transition-all {canAffordDec ? 'border-charcoal-mid hover:border-wheat-mid/70 hover:bg-forest-surface' : SUSPENDED_CARD_CLASS} {dimClass(dec.id)} {isActive ? 'ring-2 ring-wheat-gold/80' : ''}"
          >
            <span class="{CADENCE_PILL_CLASS}">مرة واحدة</span>
            <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 pt-5 {canAffordDec ? '' : SUSPENDED_CONTENT_CLASS}">
              <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight block">{dec.titleAr}</span>
              <span class="text-[10px] text-wheat-dark block leading-snug">{dec.descAr}</span>
              <span class="flex items-center gap-1 flex-wrap">
                {#each dec.effectsAr.filter((fx) => fx.scope === 'national') as fx}
                  <span
                    class="flex items-center gap-0.5 px-1.5 py-px rounded-full border font-mono font-bold text-[8px] {fx.tone === 'good'
                      ? 'bg-forest-mid border-forest-accent/60 text-forest-accent'
                      : 'bg-umber-deep border-umber-border text-umber-crimson'}"
                  >
                    {fx.text}
                  </span>
                {/each}
                {#if costPC > 0}
                  <span class="flex items-center gap-0.5 px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">
                    <span class="font-bold">−</span>{costPC} رصيد سياسي
                  </span>
                {/if}
                {#if isActive}
                  <span class="w-2 h-2 rounded-full bg-wheat-gold animate-pulse shrink-0"></span>
                {/if}
              </span>
            </div>
            {#if !canAffordDec}
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
              </div>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Reusable decisions -->
  <div class="space-y-2">
    <h4 class="text-xs font-bold text-wheat-gold font-heading flex items-center gap-1.5">
      <span title="قابل لإعادة الاستخدام كل دور">
        <GameIcon name="cycle" cls="w-4 h-4 text-wheat-gold shrink-0" />
      </span>قرارات قابلة لإعادة الاستخدام
    </h4>
    <div class="grid grid-cols-1 gap-2">
      {#each reusable as dec}
        {@const isActive = $draftStore.activePoliticalActions.includes(dec.id)}
        {@const costPC = DECREE_PC_COSTS[dec.id] || 0}
        {@const canAffordDec = isActive || costPC <= $budgetStore.remainingPC}
        <div
          title={canAffordDec ? dec.titleAr : pcShortageText(costPC, $budgetStore.remainingPC)}
          class="relative flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {isActive ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordDec ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS} {dimClass(dec.id)}"
        >
          <span class="{CADENCE_PILL_CLASS}">كل دور</span>
          <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 pt-5 {canAffordDec ? '' : SUSPENDED_CONTENT_CLASS}">
            <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight block">{dec.titleAr}</span>
            <span class="text-[10px] text-wheat-dark block leading-snug">{dec.descAr}</span>
            <span class="flex items-center gap-1 flex-wrap">
              {#each dec.effectsAr.filter((fx) => fx.scope === 'national') as fx}
                <span
                  class="flex items-center gap-0.5 px-1.5 py-px rounded-full border font-mono font-bold text-[8px] {fx.tone === 'good'
                    ? 'bg-forest-mid border-forest-accent/60 text-forest-accent'
                    : 'bg-umber-deep border-umber-border text-umber-crimson'}"
                >
                  {fx.text}
                </span>
              {/each}
              {#if costPC > 0}
                <span class="flex items-center gap-0.5 px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">
                  <span class="font-bold">−</span>{costPC} رصيد سياسي
                </span>
              {/if}
            </span>
          </div>
          <div class="flex items-center px-2">
            <ToggleSwitch
              checked={isActive}
              disabled={!isActive && !canAffordDec}
              label={dec.titleAr}
              onchange={() => {
                if (isActive || canAffordDec) draftStore.togglePoliticalAction(dec.id);
              }}
            />
          </div>
          {#if !canAffordDec}
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
            </div>
          {/if}
        </div>
      {/each}
      <!-- Populist grant: one-shot SYP bonus, housed with decrees -->
      <div
        title={!grantActive && !canAffordGrant ? 'موقوف مؤقتاً: ميزانية غير كافية (0.75T ل.س)' : 'منحة شعبية استثنائية'}
        class="relative flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {grantActive ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordGrant ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS} {dimClass('populistGrant')}"
      >
        <span class="{CADENCE_PILL_CLASS}">كل دور</span>
        <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 pt-5 {grantActive || canAffordGrant ? '' : SUSPENDED_CONTENT_CLASS}">
          <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight block">منحة شعبية استثنائية</span>
          <span class="flex items-center gap-1 flex-wrap">
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">−0.75T ل.س</span>
            <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+8 رصيد سياسي</span>
            <span class="px-1.5 py-px rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8px]">لمرة واحدة هذا الدور</span>
          </span>
        </div>
        <div class="flex items-center px-2">
          <ToggleSwitch
            checked={grantActive}
            disabled={!grantActive && !canAffordGrant}
            label="منحة شعبية استثنائية"
            onchange={(next) => {
              if (next ? canAffordGrant : true) draftStore.setField('populistGrant', next);
            }}
          />
        </div>
        {#if !grantActive && !canAffordGrant}
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Decree detail modal -->
{#if modalDecree}
  {@const dec = modalDecree}
  {@const isActive = $draftStore.activePoliticalActions.includes(dec.id)}
  {@const costPC = DECREE_PC_COSTS[dec.id] || 0}
  {@const canAfford = isActive || costPC <= $budgetStore.remainingPC}
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={dec.titleAr}>
    <button
      class="absolute inset-0 bg-black/60 cursor-default"
      onclick={() => (modalDecree = null)}
      tabindex="-1"
      aria-label="إلغاء"
    ></button>
    <div class="relative w-full max-w-[420px] bg-forest-deep border-2 border-wheat-mid/70 shadow-2xl p-5 space-y-3 text-wheat-light font-arabic rounded-none">
      <h3 class="text-sm font-bold text-wheat-gold font-heading leading-snug">{dec.titleAr}</h3>
      <p class="text-[11px] text-wheat-dark leading-relaxed">{dec.descAr}</p>
      <div class="flex items-center gap-1.5 flex-wrap">
        {#each dec.effectsAr as fx}
          <span
            class="px-2 py-0.5 rounded-full border font-mono font-bold text-[9.5px] {fx.tone === 'good'
              ? 'bg-forest-mid border-forest-accent/60 text-forest-accent'
              : 'bg-umber-deep border-umber-border text-umber-crimson'}"
          >
            {fx.text}
          </span>
        {/each}
        {#if costPC > 0}
            <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[9.5px]">
              −{costPC} رصيد سياسي
            </span>
        {:else}
          <span class="px-2 py-0.5 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[9.5px]">
            دون كلفة سياسية
          </span>
        {/if}
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <button
          onclick={() => (modalDecree = null)}
          class="px-4 py-2 text-xs font-bold border border-charcoal-mid bg-charcoal-surface text-wheat-mid hover:text-wheat-light hover:border-charcoal-light cursor-pointer transition-colors rounded-none font-heading"
        >
          إلغاء
        </button>
        <button
          disabled={!isActive && !canAfford}
          onclick={confirmModal}
          class="px-4 py-2 text-xs font-bold border transition-colors rounded-none font-heading {isActive || canAfford
            ? 'bg-wheat-gold text-forest-deep border-wheat-gold hover:bg-wheat-light cursor-pointer'
            : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-60'}"
        >
          {isActive ? 'إلغاء التفعيل' : !canAfford ? `رصيد غير كافٍ (${costPC})` : 'تأكيد التفعيل'}
        </button>
      </div>
    </div>
  </div>
{/if}
