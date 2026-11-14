<script lang="ts">
  import { flip } from 'svelte/animate';
  import { gameStore } from '../../../stores/game-store';
  import { draftStore, budgetStore } from '../../../stores/draft-store';
  import { uiStore } from '../../../stores/ui-store';
  import ActionCard from '../../kit/ActionCard.svelte';
  import DoneRow from '../../kit/DoneRow.svelte';
  import FilterStrip, { type FilterStripItem } from '../../kit/FilterStrip.svelte';
  import FxChip from '../../kit/FxChip.svelte';
  import GroupDivider from '../../kit/GroupDivider.svelte';
  import {
    buildFilteredDisplayRows,
    flipDuration,
    type AvailabilityTier,
  } from '../../kit/reorder';
  import DecreeConfirmDialog from '../../decrees/DecreeConfirmDialog.svelte';
  import { fx } from '../../fx/feedback';
  import {
    DECREE_CATEGORIES,
    cardEffectChips,
    decreeCategoryOf,
    decreePcCost,
    decreeTypeLabel,
    type DecreeCardState,
    type DecreeCategoryId,
  } from '../../decrees/decree-meta';
  import {
    DECREES,
    pcShortageText,
    type PoliticalDecreeItem,
  } from '../../panels/shared';
  import { isSectionOptionRelated } from '../../shell/section-nav';

  /** Below this threshold, later-turn decrees can be blocked. */
  const SAFE_PC_FLOOR = 20;

  /**
   * Decrees & political actions belonging to الحكم › المراسيم:
   * - Excludes REPUDIATE_* (moved to الدَّين)
   * - Excludes MARTIAL_LAW (moved to الحكم › المواقف)
   */
  const GOVERNANCE_DECREES: PoliticalDecreeItem[] = DECREES.filter(
    (d) => !d.id.startsWith('REPUDIATE_') && d.id !== 'MARTIAL_LAW'
  );

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let activeCategory = $state<'all' | DecreeCategoryId>('all');
  let modalDecree: PoliticalDecreeItem | null = $state(null);
  let expandedIds = $state<Record<string, boolean>>({});

  let afterPC = $derived(Math.floor($budgetStore.remainingPC));

  // ── Category filter strip items (only categories that have decrees here) ───
  let categoryCounts = $derived.by<Record<'all' | DecreeCategoryId, number>>(() => {
    const counts: Record<'all' | DecreeCategoryId, number> = {
      all: GOVERNANCE_DECREES.length,
      reform: 0,
      reconcile: 0,
      security: 0,
      economy: 0,
      sovereignty: 0,
    };
    for (const dec of GOVERNANCE_DECREES) {
      counts[decreeCategoryOf(dec).id] += 1;
    }
    return counts;
  });

  let visibleCategories = $derived(
    DECREE_CATEGORIES.filter((cat) => categoryCounts[cat.id] > 0)
  );

  let categoryFilterItems = $derived<FilterStripItem[]>([
    { id: 'all', label: 'الكل', count: categoryCounts.all },
    ...visibleCategories.map((cat) => ({
      id: cat.id,
      label: cat.labelAr,
      count: categoryCounts[cat.id],
    })),
  ]);

  // ── State helpers ─────────────────────────────────────────────────────────
  function isEnacted(id: string): boolean {
    return $gameStore.enactedDecrees?.includes(id) ?? false;
  }

  function isActive(id: string): boolean {
    return $draftStore.activePoliticalActions.includes(id);
  }

  function canAfford(id: string): boolean {
    return isActive(id) || decreePcCost(id) <= $budgetStore.remainingPC;
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

  let filteredDecrees = $derived(GOVERNANCE_DECREES.filter(matchesCategory));

  let actionableDecrees = $derived(
    filteredDecrees.filter((d) => !isEnacted(d.id) && !isActive(d.id))
  );

  let actionableDisplayRows = $derived(
    buildFilteredDisplayRows(
      actionableDecrees,
      selectedStat,
      (dec) => dec.id,
      (dec) => isSectionOptionRelated(selectedStat, dec.id),
      (dec): AvailabilityTier => (!canAfford(dec.id) ? 1 : 0)
    )
  );

  let queuedDecrees = $derived(
    filteredDecrees.filter((d) => !isEnacted(d.id) && isActive(d.id))
  );

  let enactedDecrees = $derived(
    filteredDecrees.filter((d) => isEnacted(d.id))
  );

  // ── Interactions ──────────────────────────────────────────────────────────
  function toggleExpand(id: string): void {
    expandedIds = { ...expandedIds, [id]: !expandedIds[id] };
  }

  function handleDecree(dec: PoliticalDecreeItem): void {
    if (isEnacted(dec.id)) return;
    const active = isActive(dec.id);
    if (dec.behavior === 'ONE_TIME') {
      if (active) {
        fx('cancel');
        draftStore.togglePoliticalAction(dec.id);
        return;
      }
      fx('tap');
      modalDecree = dec;
      return;
    }
    if (active || canAfford(dec.id)) {
      fx(active ? 'cancel' : 'confirm');
      draftStore.togglePoliticalAction(dec.id);
    } else {
      fx('error');
    }
  }

  function confirmModal(): void {
    if (modalDecree) {
      const costPC = decreePcCost(modalDecree.id);
      const active = isActive(modalDecree.id);
      if (active || costPC <= $budgetStore.remainingPC) {
        fx(active ? 'cancel' : 'confirm');
        draftStore.togglePoliticalAction(modalDecree.id);
      } else {
        fx('error');
      }
    }
    modalDecree = null;
  }

  function closeModal(): void {
    fx('cancel');
    modalDecree = null;
  }

  function costDisplay(costPC: number): { amount: string; tone: 'accent' | 'pos' | 'muted' } {
    if (costPC > 0) return { amount: String(costPC), tone: 'accent' };
    if (costPC < 0) return { amount: `+${Math.abs(costPC)}`, tone: 'pos' };
    return { amount: '0', tone: 'muted' };
  }

  function doneCostText(costPC: number): string {
    if (costPC > 0) return `−${costPC} رصيد`;
    if (costPC < 0) return `+${Math.abs(costPC)} رصيد`;
    return 'مجاني';
  }
</script>

<div class="flex flex-col">
  <!-- Full-bleed edge-to-edge category filter strip directly under budget strip -->
  <FilterStrip
    flush
    items={categoryFilterItems}
    value={activeCategory}
    onchange={(id) => (activeCategory = id as 'all' | DecreeCategoryId)}
    ariaLabel="تصفية المراسيم"
  />

  <div class="flex flex-col gap-2 pt-2">
    {#if afterPC < SAFE_PC_FLOOR}
      <p class="border border-[var(--c-neg)] bg-[var(--c-ev-bg)] px-2.5 py-1.5 text-[11px] font-bold leading-snug text-[var(--c-neg)]">
        تحذير: الرصيد السياسي بعد الحصيلة أقل من السقف الآمن (20) — قد تتعطل المراسيم اللاحقة.
      </p>
    {/if}

    <!-- Available & locked decrees (related at top, unrelated below divider) -->
    {#if actionableDecrees.length > 0}
      <div class="flex flex-col gap-2">
        {#each actionableDisplayRows as row (row.key)}
          <div animate:flip={{ duration: flipDuration() }}>
            {#if row.kind === 'divider'}
              <GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />
            {:else}
              {@const dec = row.item}
              {@const cat = decreeCategoryOf(dec)}
              {@const state = cardState(dec)}
              {@const locked = state === 'locked'}
              {@const pcCost = decreePcCost(dec.id)}
              {@const costMeta = costDisplay(pcCost)}
              {@const expanded = Boolean(expandedIds[dec.id])}
              {@const lockReason = locked ? pcShortageText(pcCost, $budgetStore.remainingPC) : ''}
              <ActionCard
                data-decree-id={dec.id}
                data-state={state}
                tag={`${decreeTypeLabel(dec.behavior)} · ${cat.labelAr}`}
                title={dec.titleAr}
                description={expanded ? dec.descAr : ''}
                cost={costMeta.amount}
                costUnit="رصيد"
                costTone={costMeta.tone}
                buttonLabel="أضف إلى الحصيلة"
                buttonVariant="neutral"
                {locked}
                {lockReason}
                dimmed={Boolean(selectedStat) && !row.related}
                onCardClick={() => toggleExpand(dec.id)}
                onclick={() => handleDecree(dec)}
                class="gov-decree-card"
              >
                {#snippet chips()}
                  {#each cardEffectChips(dec) as chip, i (chip.text + i)}
                    <FxChip text={chip.text} tone={chip.tone} class="shrink-0" />
                  {/each}
                {/snippet}
              </ActionCard>
            {/if}
          </div>
        {/each}
      </div>
    {:else if filteredDecrees.length > 0}
      <div class="border border-dashed border-[var(--c-line)] px-3 py-2.5 text-center text-[12px] text-[var(--c-muted)]">
        كل قرارات هذا التصنيف مُدرجة في الحصيلة أو نافذة.
      </div>
    {/if}

    <!-- Queued this turn: collapsed grey DoneRow at the bottom -->
    {#if queuedDecrees.length > 0}
      <GroupDivider label="في الحصيلة هذا الدور" count={queuedDecrees.length} />
      <div class="flex flex-col gap-1.5">
        {#each queuedDecrees as dec (dec.id)}
          {@const related = selectedStat ? isSectionOptionRelated(selectedStat, dec.id) : true}
          <div data-decree-id={dec.id} data-state="queued">
            <DoneRow
              title={dec.titleAr}
              cost={doneCostText(decreePcCost(dec.id))}
              removable={true}
              removeLabel="إزالة"
              dimmed={Boolean(selectedStat) && !related}
              onremove={() => {
                draftStore.togglePoliticalAction(dec.id);
              }}
            />
          </div>
        {/each}
      </div>
    {/if}

    <!-- Already enacted: collapsed grey DoneRow without remove -->
    {#if enactedDecrees.length > 0}
      <GroupDivider label="نافذ" count={enactedDecrees.length} />
      <div class="flex flex-col gap-1.5">
        {#each enactedDecrees as dec (dec.id)}
          {@const related = selectedStat ? isSectionOptionRelated(selectedStat, dec.id) : true}
          <div data-decree-id={dec.id} data-state="enacted">
            <DoneRow
              title={dec.titleAr}
              cost={doneCostText(decreePcCost(dec.id))}
              removable={false}
              statusLabel="نافذ"
              dimmed={Boolean(selectedStat) && !related}
            />
          </div>
        {/each}
      </div>
    {/if}

    {#if filteredDecrees.length === 0}
      <div class="border border-[var(--c-line)] bg-[var(--c-panel)] p-5 text-center text-[12px] text-[var(--c-muted)]">
        لا توجد قرارات ضمن هذا التصنيف.
      </div>
    {/if}
  </div>
</div>

<DecreeConfirmDialog
  decree={modalDecree}
  isActive={modalDecree ? isActive(modalDecree.id) : false}
  remainingPC={$budgetStore.remainingPC}
  tone="gold"
  onconfirm={confirmModal}
  onclose={closeModal}
/>

<style>
  :global(.gov-decree-card .ct b) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
