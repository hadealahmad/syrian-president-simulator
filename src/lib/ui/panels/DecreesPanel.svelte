<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import DecreeCard from '../decrees/DecreeCard.svelte';
  import DecreeConfirmDialog from '../decrees/DecreeConfirmDialog.svelte';
  import {
    BENEFACTOR_ACTIONS,
    DECREE_CATEGORIES,
    cardEffectChips,
    decreeCategoryOf,
    decreePcCost,
    decreeTypeIcon,
    decreeTypeLabel,
    pcSeal,
    shortDecreeTitle,
    type BenefactorId,
    type DecreeCardState,
    type DecreeCategoryId,
  } from '../decrees/decree-meta';
  import {
    DECREES,
    formatBillion,
    isOptionRelated,
    pcShortageText,
    STAT_NAMES_AR,
    type PoliticalDecreeItem,
  } from './shared';
  import {
    CHARITY_FUND_COST_SYP,
    IMPORT_SURGE_COST_USD,
    POPULIST_GRANT_COST_SYP,
  } from '../../engine/revenues';

  /** Below this the late-turn decrees start failing — mirrors the mockup. */
  const SAFE_PC_FLOOR = 20;

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let activeCategory = $state<'all' | DecreeCategoryId>('all');
  let modalDecree: PoliticalDecreeItem | null = $state(null);

  // ── Political-capital budget (rehearsal-accurate, from the shared budget) ──
  let initialPC = $derived(Math.max(0, Math.floor($budgetStore.initialPC)));
  let afterPC = $derived(Math.floor($budgetStore.remainingPC));
  let shownAfterPC = $derived(Math.max(0, afterPC));
  /** Signed net PC change of the whole queued plan (negative = net gain). */
  let pcDelta = $derived(initialPC - afterPC);
  let pcSpent = $derived(Math.max(0, pcDelta));
  let spentPct = $derived(
    initialPC > 0 ? Math.min(100, (pcSpent / initialPC) * 100) : 0
  );
  let freePct = $derived(
    initialPC > 0 ? Math.min(100 - spentPct, (shownAfterPC / initialPC) * 100) : 0
  );

  // ── State helpers (same predicates the old panel used) ────────────────────
  function isEnacted(id: string): boolean {
    return $gameStore.enactedDecrees?.includes(id) ?? false;
  }
  function isActive(id: string): boolean {
    return $draftStore.activePoliticalActions.includes(id);
  }
  function canAfford(id: string): boolean {
    return isActive(id) || decreePcCost(id) <= $budgetStore.remainingPC;
  }
  function rank(dec: PoliticalDecreeItem): number {
    if (isEnacted(dec.id)) return 2;
    if (selectedStat && !isOptionRelated(selectedStat, dec.id)) return 1;
    return 0;
  }
  function ordered(list: PoliticalDecreeItem[]): PoliticalDecreeItem[] {
    return [...list].sort((a, b) => rank(a) - rank(b));
  }
  function cardState(dec: PoliticalDecreeItem): DecreeCardState {
    if (isEnacted(dec.id)) return 'enacted';
    if (isActive(dec.id)) return 'queued';
    if (!canAfford(dec.id)) return 'locked';
    return 'available';
  }
  function matchesCategory(dec: PoliticalDecreeItem): boolean {
    if (activeCategory === 'all') return true;
    return decreeCategoryOf(dec).id === activeCategory;
  }

  let mainDecrees = $derived(
    ordered(DECREES.filter((d) => decreeCategoryOf(d).id !== 'sovereignty')).filter(
      matchesCategory
    )
  );
  let sovereignDecrees = $derived(
    ordered(DECREES.filter((d) => decreeCategoryOf(d).id === 'sovereignty')).filter(
      matchesCategory
    )
  );
  let showBenefitsGroup = $derived(
    activeCategory === 'all' || activeCategory === 'economy' || activeCategory === 'sovereignty'
  );
  let showCashCards = $derived(activeCategory === 'all' || activeCategory === 'economy');

  // ── Cash-for-legitimacy actions (existing store calls, unchanged) ─────────
  let grantActive = $derived($draftStore.populistGrant);
  let canAffordGrant = $derived(
    grantActive || $budgetStore.canAffordWithFxCoverage(0, POPULIST_GRANT_COST_SYP)
  );
  let charityActive = $derived($draftStore.charityFundActive);
  let canAffordCharity = $derived(
    charityActive || $budgetStore.canAffordWithFxCoverage(0, CHARITY_FUND_COST_SYP)
  );
  let surgeActive = $derived($draftStore.importSurge);
  let canAffordSurge = $derived(
    surgeActive || ($gameStore.macro.reservesUSD ?? 0) >= IMPORT_SURGE_COST_USD
  );

  function benefactorStatus(id: BenefactorId): {
    active: boolean;
    canAfford: boolean;
    note: string;
  } {
    if (id === 'populistGrant') {
      return {
        active: grantActive,
        canAfford: canAffordGrant,
        note: 'موقوف مؤقتاً: ميزانية غير كافية (7.50B SP)',
      };
    }
    if (id === 'charityFund') {
      return {
        active: charityActive,
        canAfford: canAffordCharity,
        note: 'موقوف مؤقتاً: ميزانية غير كافية لصندوق الكرامة',
      };
    }
    return {
      active: surgeActive,
      canAfford: canAffordSurge,
      note: 'موقوف مؤقتاً: احتياطي النقد الأجنبي غير كافٍ ($40M)',
    };
  }

  function toggleBenefactor(id: BenefactorId): void {
    if (id === 'populistGrant') {
      const next = !$draftStore.populistGrant;
      if (next ? canAffordGrant : true) draftStore.setField('populistGrant', next);
      return;
    }
    if (id === 'charityFund') {
      const next = !$draftStore.charityFundActive;
      if (next ? canAffordCharity : true) draftStore.setField('charityFundActive', next);
      return;
    }
    const next = !$draftStore.importSurge;
    if (next ? canAffordSurge : true) draftStore.setField('importSurge', next);
  }

  // ── Decree interaction (identical rules to the old toggle/modal) ──────────
  function handleDecree(dec: PoliticalDecreeItem): void {
    if (isEnacted(dec.id)) return;
    if (dec.behavior === 'ONE_TIME') {
      modalDecree = dec;
      return;
    }
    if (isActive(dec.id) || canAfford(dec.id)) {
      draftStore.togglePoliticalAction(dec.id);
    }
  }

  function confirmModal(): void {
    if (modalDecree) {
      const costPC = decreePcCost(modalDecree.id);
      const active = isActive(modalDecree.id);
      if (active || costPC <= $budgetStore.remainingPC) {
        draftStore.togglePoliticalAction(modalDecree.id);
      }
    }
    modalDecree = null;
  }

  // ── Pending tray ──────────────────────────────────────────────────────────
  type TrayTone = 'cost' | 'gain' | 'money';
  interface TrayItem {
    id: string;
    label: string;
    token: string;
    tone: TrayTone;
    remove: () => void;
  }

  let trayItems = $derived.by<TrayItem[]>(() => {
    const items: TrayItem[] = [];
    for (const id of $draftStore.activePoliticalActions ?? []) {
      const dec = DECREES.find((d) => d.id === id);
      if (!dec) continue;
      const cost = decreePcCost(id);
      items.push({
        id,
        label: shortDecreeTitle(id, dec.titleAr),
        token: cost > 0 ? `−${cost}` : cost < 0 ? `+${Math.abs(cost)}` : 'مجاني',
        tone: cost > 0 ? 'cost' : cost < 0 ? 'gain' : 'money',
        remove: () => draftStore.togglePoliticalAction(id),
      });
    }
    if ($draftStore.populistGrant) {
      items.push({
        id: 'populistGrant',
        label: shortDecreeTitle('populistGrant'),
        token: `${formatBillion(POPULIST_GRANT_COST_SYP)}B SP`,
        tone: 'money',
        remove: () => draftStore.setField('populistGrant', false),
      });
    }
    if ($draftStore.charityFundActive) {
      items.push({
        id: 'charityFund',
        label: shortDecreeTitle('charityFund'),
        token: `${formatBillion(CHARITY_FUND_COST_SYP)}B SP`,
        tone: 'money',
        remove: () => draftStore.setField('charityFundActive', false),
      });
    }
    if ($draftStore.importSurge) {
      items.push({
        id: 'importSurge',
        label: shortDecreeTitle('importSurge'),
        token: `${(IMPORT_SURGE_COST_USD / 1_000_000).toFixed(0)}M$`,
        tone: 'money',
        remove: () => draftStore.setField('importSurge', false),
      });
    }
    return items;
  });

  let totalPcSpend = $derived(
    ($draftStore.activePoliticalActions ?? []).reduce((sum, id) => {
      const cost = decreePcCost(id);
      return sum + (cost > 0 && DECREES.some((d) => d.id === id) ? cost : 0);
    }, 0)
  );
  let netPc = $derived(pcDelta);
  function signedPc(delta: number): string {
    return delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : '0';
  }
  let totalSyp = $derived(
    ($draftStore.populistGrant ? POPULIST_GRANT_COST_SYP : 0) +
      ($draftStore.charityFundActive ? CHARITY_FUND_COST_SYP : 0)
  );
  let totalUsd = $derived($draftStore.importSurge ? IMPORT_SURGE_COST_USD : 0);
  let hasQueued = $derived(trayItems.length > 0);
</script>

<div class="space-y-3">
  <!-- ── Political capital budget header ─────────────────────────────────── -->
  <section
    class="border border-wheat-mid/15 bg-charcoal-deep/45 p-3 shell-round-pop phone-p:p-2 phone-l:p-1.5"
    data-tour="pc-budget"
    aria-label="موازنة الرصيد السياسي"
  >
    <div class="flex items-end justify-between gap-3 phone-l:items-center">
      <div class="phone-l:flex phone-l:items-center phone-l:gap-1.5">
        <div class="text-[8.5px] tracking-[1.4px] text-wheat-dark phone-p:text-[8px] phone-l:whitespace-nowrap phone-l:text-[8px]">
          الرصيد السياسي المتاح
        </div>
        <div
          class="mt-0.5 font-heading text-[26px] leading-none text-wheat-light phone-p:text-[21px] phone-l:mt-0 phone-l:text-[18px]"
        >
          {initialPC}
          <small
            class="font-arabic text-[9px] font-normal text-wheat-dark phone-p:hidden phone-l:hidden"
            >من 200</small
          >
        </div>
      </div>
      <div class="text-end phone-l:flex phone-l:items-center phone-l:gap-1.5">
        <div class="text-[8.5px] text-wheat-dark phone-p:text-[8px] phone-l:whitespace-nowrap phone-l:text-[8px]">
          الرصيد بعد الحصيلة
        </div>
        <div
          class="mt-0.5 flex items-center justify-end gap-1.5 font-heading text-[22px] leading-none phone-p:text-[18px] phone-l:mt-0 phone-l:text-[16px] {afterPC <
          SAFE_PC_FLOOR
            ? 'text-umber-crimson'
            : 'text-wheat-gold'}"
        >
          {shownAfterPC}
          <span
            class="border px-1 py-px font-mono text-[9px] font-bold shell-round-chip {pcDelta > 0
              ? 'border-umber-border/60 bg-umber-deep/50 text-umber-crimson'
              : 'border-forest-accent/40 bg-forest-mid/40 text-forest-accent'}"
            dir="ltr"
          >
            {pcDelta > 0 ? `−${pcDelta}` : pcDelta < 0 ? `+${Math.abs(pcDelta)}` : '0'}
          </span>
        </div>
      </div>
    </div>

    <div
      class="mt-1.5 flex h-[7px] gap-0.5 overflow-hidden bg-wheat-light/10 shell-round-chip phone-l:hidden"
      role="img"
      aria-label="المنفق {pcSpent} من {initialPC} نقطة، والمتبقي {shownAfterPC}"
    >
      <span class="block h-full bg-wheat-gold shell-round-chip" style="width: {spentPct}%"></span>
      <span class="block h-full bg-forest-accent/55 shell-round-chip" style="width: {freePct}%"></span>
    </div>

    <div class="mt-1 flex justify-between gap-2 text-[8px] text-wheat-dark phone-l:hidden">
      <span>
        منفق: {pcSpent} نقطة{pcDelta < 0 ? ` · مكتسب: +${Math.abs(pcDelta)}` : ''}
      </span>
      <span class={afterPC < SAFE_PC_FLOOR ? 'font-bold text-umber-crimson' : ''}>
        {afterPC < SAFE_PC_FLOOR ? 'أقل من السقف الآمن (20)' : 'السقف الآمن 20 نقطة'}
      </span>
    </div>
  </section>

  <!-- ── Filters ──────────────────────────────────────────────────────────── -->
  <div
    class="flex items-center gap-1.5 overflow-x-auto pb-1 phone-l:pb-0"
    role="group"
    aria-label="تصفية المراسيم"
  >
    {#if selectedStat}
      <button
        type="button"
        class="inline-flex min-h-9 shrink-0 items-center gap-1 border border-wheat-gold/50 bg-wheat-gold/10 px-2.5 text-[10px] font-bold text-wheat-gold shell-round-chip phone-p:min-h-11 phone-l:min-h-11"
        title="إلغاء تصفية المؤشر"
        onclick={() => uiStore.closeStatRelatedOptions()}
      >
        {STAT_NAMES_AR[selectedStat] ?? selectedStat}
        <GameIcon name="cross-mark" cls="h-3 w-3 shrink-0" />
      </button>
    {/if}
    <button
      type="button"
      class="min-h-9 shrink-0 border px-3 text-[10px] transition-colors shell-round-chip phone-p:min-h-11 phone-l:min-h-11 {activeCategory ===
      'all'
        ? 'border-forest-accent/40 bg-forest-accent/15 font-bold text-forest-accent'
        : 'border-wheat-mid/15 text-wheat-dark hover:border-wheat-mid/30 hover:text-wheat-light'}"
      aria-pressed={activeCategory === 'all'}
      onclick={() => (activeCategory = 'all')}
    >
      الكل
    </button>
    {#each DECREE_CATEGORIES as cat (cat.id)}
      <button
        type="button"
        class="min-h-9 shrink-0 border px-3 text-[10px] transition-colors shell-round-chip phone-p:min-h-11 phone-l:min-h-11 {activeCategory ===
        cat.id
          ? 'border-forest-accent/40 bg-forest-accent/15 font-bold text-forest-accent'
          : 'border-wheat-mid/15 text-wheat-dark hover:border-wheat-mid/30 hover:text-wheat-light'}"
        aria-pressed={activeCategory === cat.id}
        onclick={() => (activeCategory = cat.id)}
      >
        {cat.labelAr}
      </button>
    {/each}
  </div>

  <!-- ── Decrees + decisions ─────────────────────────────────────────────── -->
  {#snippet decreeCard(dec: PoliticalDecreeItem)}
    {@const cat = decreeCategoryOf(dec)}
    {@const state = cardState(dec)}
    {@const seal = pcSeal(decreePcCost(dec.id))}
    {@const related = selectedStat ? isOptionRelated(selectedStat, dec.id) : false}
    <DecreeCard
      id={dec.id}
      title={dec.titleAr}
      description={dec.descAr}
      category={cat.labelAr}
      categoryClass={cat.textClass}
      stripClass={cat.stripClass}
      typeLabel={decreeTypeLabel(dec.behavior)}
      typeIcon={decreeTypeIcon(dec.behavior)}
      sealValue={seal.value}
      sealUnit={seal.unit}
      sealTone={seal.tone}
      chips={cardEffectChips(dec)}
      {state}
      stateNote={state === 'locked'
        ? pcShortageText(decreePcCost(dec.id), $budgetStore.remainingPC)
        : ''}
      actionLabel={state === 'available' ? 'أضف إلى الحصيلة' : ''}
      dimmed={selectedStat ? !related : false}
      highlighted={related}
      onclick={state === 'enacted' || (state === 'locked' && dec.behavior !== 'ONE_TIME')
        ? undefined
        : () => handleDecree(dec)}
      ariaLabel={(state === 'enacted'
        ? 'منفّذ: '
        : state === 'queued'
          ? 'إزالة من الحصيلة: '
          : 'أضف إلى الحصيلة: ') + dec.titleAr}
    />
  {/snippet}

  {#if mainDecrees.length > 0}
    <section class="space-y-2" aria-label="المراسيم والقرارات">
      <div class="flex items-center justify-between gap-2">
        <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
          <GameIcon name="scroll-quill" cls="h-3.5 w-3.5 shrink-0" />
          المراسيم والقرارات
        </h4>
        <span class="text-[8.5px] text-wheat-dark">{mainDecrees.length} قراراً</span>
      </div>
      <div class="grid grid-cols-2 gap-2 phone-p:grid-cols-1 phone-l:grid-cols-1">
        {#each mainDecrees as dec (dec.id)}
          {@render decreeCard(dec)}
        {/each}
      </div>
    </section>
  {/if}

  <!-- ── Cash-for-legitimacy + sovereign debt acts ───────────────────────── -->
  {#if showBenefitsGroup && (sovereignDecrees.length > 0 || showCashCards)}
    <section class="space-y-2" aria-label="شراء الشرعية">
      <div class="flex items-center justify-between gap-2">
        <h4 class="flex items-center gap-1.5 font-heading text-[11px] font-bold text-wheat-gold">
          <GameIcon name="crown-coin" cls="h-3.5 w-3.5 shrink-0" />
          شراء الشرعية
        </h4>
        <span class="text-[8.5px] text-wheat-dark">نقد وسيادة مقابل رصيد</span>
      </div>
      <p class="text-[9px] leading-snug text-wheat-dark">
        إجراءات تُشترى بها النقاط السياسية: منح نقدية، إعانات دورية، دفعات إغاثية، وتنصّل من ديون
        غير موثقة.
      </p>
      <div class="grid grid-cols-2 gap-2 phone-p:grid-cols-1 phone-l:grid-cols-1">
        {#if showCashCards}
          {#each BENEFACTOR_ACTIONS as action (action.id)}
            {@const status = benefactorStatus(action.id)}
            {@const related = selectedStat
              ? isOptionRelated(selectedStat, action.id)
              : false}
            <DecreeCard
              id={action.id}
              title={action.titleAr}
              description={action.descriptionAr}
              category={action.categoryLabel}
              categoryClass="text-wheat-mid"
              stripClass="bg-wheat-mid"
              typeLabel={action.typeLabel}
              typeIcon={action.typeIcon}
              sealValue={action.costValue}
              sealUnit={action.costUnit}
              sealTone={action.sealTone}
              chips={action.chips}
              state={status.active ? 'queued' : status.canAfford ? 'available' : 'locked'}
              stateNote={!status.canAfford ? status.note : ''}
              actionLabel={status.active ? '' : 'أضف إلى الحصيلة'}
              dimmed={selectedStat ? !related : false}
              highlighted={related}
              onclick={status.active || status.canAfford
                ? () => toggleBenefactor(action.id)
                : undefined}
              ariaLabel={(status.active
                ? 'إزالة من الحصيلة: '
                : 'أضف إلى الحصيلة: ') + action.titleAr}
            />
          {/each}
        {/if}
        {#each sovereignDecrees as dec (dec.id)}
          {@render decreeCard(dec)}
        {/each}
      </div>
    </section>
  {/if}

  {#if mainDecrees.length === 0 && sovereignDecrees.length === 0 && !showCashCards}
    <div class="border border-dashed border-wheat-mid/20 p-6 text-center text-[10px] text-wheat-dark">
      لا توجد قرارات ضمن هذا التصنيف.
    </div>
  {/if}

  <!-- ── Pending tray (sticky inside the sheet scroller) ─────────────────── -->
  <section
    class="tray-sticky z-10 -mx-4 -mb-3 mt-4 border-t border-wheat-mid/15 bg-forest-deep px-4 pb-2 pt-2"
    aria-label="الحصيلة المعلّقة"
  >
    {#if hasQueued}
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-1.5 text-[9px] tracking-[0.8px] text-wheat-dark">
          <GameIcon name="scroll-quill" cls="h-3.5 w-3.5 shrink-0 text-wheat-gold" />
          <span class="truncate">
            الحصيلة المعلّقة
            <b class="font-heading text-[11px] text-wheat-mid">{trayItems.length}</b>
          </span>
        </div>
        <span class="shrink-0 font-mono text-[9px] font-bold {netPc > 0
          ? 'text-umber-crimson'
          : netPc < 0
            ? 'text-forest-accent'
            : 'text-wheat-dark'}" dir="ltr">
          {netPc > 0 ? `−${netPc}` : netPc < 0 ? `+${Math.abs(netPc)}` : '0'} نقطة
        </span>
      </div>

      <div
        class="mt-1.5 flex min-h-11 items-center gap-1.5 overflow-x-auto border border-dashed border-wheat-mid/20 p-1.5 shell-round-chip"
      >
        {#each trayItems as item (item.id)}
          <span
            class="inline-flex shrink-0 items-center gap-1 border border-wheat-gold/25 bg-wheat-gold/[0.07] py-0.5 pe-0.5 ps-2 text-[9px] text-wheat-light shell-round-chip"
          >
            <span class="truncate">{item.label}</span>
            <b
              class="font-mono text-[9.5px] {item.tone === 'gain'
                ? 'text-forest-accent'
                : item.tone === 'cost'
                  ? 'text-umber-crimson'
                  : 'text-wheat-gold'}"
              dir="ltr"
            >
              {item.token}
            </b>
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center border border-transparent text-wheat-dark transition-colors hover:border-umber-border/50 hover:bg-umber-deep/50 hover:text-umber-crimson focus-visible:border-wheat-gold focus-visible:outline-none phone-p:h-11 phone-p:w-11 phone-l:h-11 phone-l:w-11"
              aria-label="إزالة {item.label} من الحصيلة"
              onclick={item.remove}
            >
              <GameIcon name="cross-mark" cls="h-2.5 w-2.5 shrink-0" />
            </button>
          </span>
        {/each}
      </div>

      <div
        class="mt-1 flex flex-wrap items-center justify-between gap-1 text-[8.5px] text-wheat-dark"
      >
        <span class="flex flex-wrap items-center gap-1">
          {#if totalSyp > 0}
            <span
              class="border border-wheat-gold/25 bg-wheat-gold/5 px-1.5 py-px text-wheat-gold shell-round-chip"
              dir="ltr"
            >
              −{formatBillion(totalSyp)}B SP
            </span>
          {/if}
          {#if totalUsd > 0}
            <span
              class="border border-wheat-gold/25 bg-wheat-gold/5 px-1.5 py-px text-wheat-gold shell-round-chip"
              dir="ltr"
            >
              −${(totalUsd / 1_000_000).toFixed(0)}M
            </span>
          {/if}
          {#if totalSyp === 0 && totalUsd === 0}
            <span>لا كلفة نقدية معلّقة</span>
          {/if}
        </span>
        <span>كلفة السياسي: {totalPcSpend} · الصافي: {signedPc(pcDelta)}</span>
      </div>
    {:else}
      <div class="flex items-center justify-between gap-2 py-0.5">
        <div class="flex min-w-0 items-center gap-1.5 text-[9px] tracking-[0.8px] text-wheat-dark">
          <GameIcon name="scroll-quill" cls="h-3.5 w-3.5 shrink-0 text-wheat-gold" />
          <span class="truncate">
            الحصيلة المعلّقة
            <b class="font-heading text-[11px] text-wheat-mid">0</b>
          </span>
        </div>
        <span class="text-[9px] text-wheat-dark">لا قرارات معلّقة بعد</span>
      </div>
    {/if}

    {#if afterPC < SAFE_PC_FLOOR}
      <p class="mt-1 text-[8.5px] font-bold leading-snug text-umber-crimson">
        تحذير: الرصيد السياسي بعد الحصيلة أقل من السقف الآمن — قد تتعطل المراسيم اللاحقة.
      </p>
    {/if}
  </section>
</div>

<DecreeConfirmDialog
  decree={modalDecree}
  isActive={modalDecree ? isActive(modalDecree.id) : false}
  remainingPC={$budgetStore.remainingPC}
  onconfirm={confirmModal}
  onclose={() => (modalDecree = null)}
/>

<style>
  /* The Sheet scroller owns bottom padding (12px, or 16px + safe area in
     portrait). Pull the sticky tray over that padding so card content can
     never peek out underneath it. */
  .tray-sticky {
    position: sticky;
    bottom: -12px;
  }
  @media (max-width: 767px) and (orientation: portrait) {
    .tray-sticky {
      bottom: calc(-1rem - env(safe-area-inset-bottom));
      padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
    }
  }
</style>
