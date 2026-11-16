<script lang="ts">
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import {
    BOSSES,
    CATEGORIES,
    CRISIS_TRAITS,
    PLAYER_TRAITS,
    getCardDef,
    getCrisisDef,
    getDeckCardStats,
    getLegalActions,
    type LaneIndex,
  } from '../engine';
  import { cardDetailTarget, performBattleAction, runStore } from '../stores';
  import BdiText from './BdiText.svelte';
  import Card from './Card.svelte';
  import Glyph from './Glyph.svelte';

  let target = $derived($cardDetailTarget);
  let run = $derived($runStore);

  function close(): void {
    fx('cancel');
    cardDetailTarget.set(null);
  }

  const legalMoves = $derived.by(() => {
    if (!target || target.kind !== 'playerBoard' || !run?.battle || run.battle.phase !== 'play') {
      return [] as LaneIndex[];
    }
    const legal = getLegalActions(run.battle);
    return legal
      .filter((a): a is { type: 'moveUnit'; fromLane: LaneIndex; toLane: LaneIndex } =>
        a.type === 'moveUnit' && a.fromLane === target.lane,
      )
      .map((a) => a.toLane);
  });

  const canWithdraw = $derived.by(() => {
    if (!target || target.kind !== 'playerBoard' || !run?.battle || run.battle.phase !== 'play') {
      return false;
    }
    return getLegalActions(run.battle).some(
      (a) => a.type === 'withdrawUnit' && a.lane === target.lane,
    );
  });

  const info = $derived.by(() => {
    if (!target) return null;
    if (target.kind === 'playerBoard') {
      const u = target.unit;
      const def = getCardDef(u.defId);
      return {
        name: u.name,
        category: u.category,
        kindLabel: 'فريق ميداني منتشر',
        description: u.traits.length === 0 ? def.description : '',
        traits: u.traits.map((t) => PLAYER_TRAITS[t]),
        bossRules: null as { p1: string; p2: string; activePhase: 1 | 2 } | null,
      };
    }
    if (target.kind === 'crisisBoard') {
      const c = target.crisis;
      if (c.isBoss) {
        const b = BOSSES[c.defId as keyof typeof BOSSES];
        return {
          name: c.name,
          category: c.category,
          kindLabel: 'زعيم الفصل',
          description: '',
          traits: [],
          bossRules: {
            p1: b.phase1.rule,
            p2: b.phase2.rule,
            activePhase: c.bossPhase ?? 1,
          },
        };
      }
      const def = getCrisisDef(c.defId);
      return {
        name: c.name,
        category: c.category,
        kindLabel: target.zone === 'queue' ? 'أزمة قادمة في الجولة المقبلة' : 'أزمة نشطة في الجبهة',
        description: c.traits.length === 0 ? def.description : '',
        traits: c.traits.map((t) => CRISIS_TRAITS[t]),
        bossRules: null,
      };
    }
    if (target.kind === 'deckCard') {
      const stats = getDeckCardStats(target.card);
      return {
        name: stats.def.name,
        category: stats.def.category,
        kindLabel:
          stats.def.kind === 'unit'
            ? 'فريق ميداني'
            : stats.def.kind === 'curse'
              ? 'عبء إداري'
              : 'قرار تكتيكي',
        description: stats.traits.length === 0 || stats.def.kind !== 'unit' ? stats.def.description : '',
        traits: stats.traits.map((t) => PLAYER_TRAITS[t]),
        bossRules: null,
      };
    }
    return null;
  });
</script>

{#if target && info}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
    class="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`تفاصيل ${info.name}`}
      class="shell-enter-bottom w-full max-w-[460px] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] text-[var(--c-text)] sm:border sm:border-[var(--c-line-strong)] sm:border-t-2 sm:border-t-[var(--c-accent)]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-strip)] ps-4">
        <div class="flex items-center gap-2 py-2" data-cat={info.category}>
          <span style="color: var(--cat-color);">
            <Glyph name={CATEGORIES[info.category].glyph} cls="h-4 w-4" />
          </span>
          <span class="text-[12px] font-bold text-[var(--c-muted)]">
            {CATEGORIES[info.category].name} · {info.kindLabel}
          </span>
        </div>
        <button
          type="button"
          onclick={close}
          aria-label="إغلاق التفاصيل"
          class="pressable flex min-h-[44px] min-w-[44px] items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
        >
          <GameIcon name="cross-mark" cls="h-4 w-4" />
        </button>
      </div>

      <!-- Body: Big card + trait / description lines -->
      <div class="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-start">
        <div class="shrink-0">
          {#if target.kind === 'playerBoard'}
            <Card
              unit={target.unit}
              size="lg"
              effectivePower={target.effectivePower}
              expertiseActive={target.expertiseActive}
            />
          {:else if target.kind === 'crisisBoard'}
            <Card
              crisis={target.crisis}
              size="lg"
              effectivePower={target.effectivePower}
            />
          {:else if target.kind === 'deckCard'}
            <Card deckCard={target.card} size="lg" />
          {/if}
        </div>

        <div class="min-w-0 flex-1 space-y-2.5 text-start w-full">
          <h3 class="font-heading text-[18px] font-bold text-[var(--c-text)]">{info.name}</h3>

          {#if target.kind === 'playerBoard' && target.expertiseActive}
            <div class="border border-[var(--c-pos)] bg-[var(--c-bg)] px-2.5 py-1.5 text-[12px] font-bold text-[var(--c-pos)]">
              اختصاص الفئة مفعّل: يلحق <bdi dir="ltr">+1</bdi> ضرر إضافي بالأزمة المقابلة.
            </div>
          {/if}

          {#if info.traits.length > 0}
            <div class="space-y-2">
              {#each info.traits as tr (tr.id)}
                <div class="border border-[var(--c-line)] bg-[var(--c-bg)] px-3 py-2">
                  <div class="flex items-center gap-1.5 text-[13px] font-bold text-[var(--c-accent)]">
                    <Glyph name={tr.glyph} cls="h-3.5 w-3.5" />
                    <span>{tr.name}</span>
                  </div>
                  <p class="mt-0.5 text-[13px] leading-[1.55] text-[var(--c-text-2)]">
                    <BdiText text={tr.description} />
                  </p>
                </div>
              {/each}
            </div>
          {/if}

          {#if info.description}
            <p class="border border-[var(--c-line)] bg-[var(--c-bg)] px-3 py-2 text-[13.5px] leading-[1.6] text-[var(--c-text-2)]">
              <BdiText text={info.description} />
            </p>
          {/if}

          {#if info.bossRules}
            <div class="space-y-2 text-[12.5px]">
              <div
                class="border px-3 py-2 {info.bossRules.activePhase === 1
                  ? 'border-[var(--c-neg)] bg-[var(--c-ev-bg)]'
                  : 'border-[var(--c-line)] bg-[var(--c-bg)] opacity-70'}"
              >
                <b class="block text-[var(--c-neg)]">المرحلة <bdi dir="ltr">1</bdi></b>
                <p class="mt-0.5 leading-[1.5] text-[var(--c-text-2)]"><BdiText text={info.bossRules.p1} /></p>
              </div>
              <div
                class="border px-3 py-2 {info.bossRules.activePhase === 2
                  ? 'border-[var(--c-neg)] bg-[var(--c-ev-bg)]'
                  : 'border-[var(--c-line)] bg-[var(--c-bg)]'}"
              >
                <b class="block text-[var(--c-accent)]">المرحلة <bdi dir="ltr">2</bdi></b>
                <p class="mt-0.5 leading-[1.5] text-[var(--c-text-2)]"><BdiText text={info.bossRules.p2} /></p>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Actions footer (Move for mobile units + Withdraw for deployed units) -->
      {#if target.kind === 'playerBoard' && (legalMoves.length > 0 || canWithdraw)}
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--c-line)] bg-[var(--c-strip)] px-4 py-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))]"
        >
          <div class="flex flex-wrap items-center gap-2">
            {#each legalMoves as toLane (toLane)}
              <button
                type="button"
                onclick={() => {
                  const fromLane = target.lane;
                  cardDetailTarget.set(null);
                  performBattleAction({ type: 'moveUnit', fromLane, toLane });
                }}
                class="kit-btn pri min-h-[44px] px-3.5 text-[12.5px] font-bold"
              >
                <Glyph name="mobile" cls="h-3.5 w-3.5" />
                <span>انقل إلى المسار <bdi dir="ltr">{toLane + 1}</bdi></span>
              </button>
            {/each}
          </div>

          {#if canWithdraw}
            <button
              type="button"
              onclick={() => {
                const lane = target.lane;
                cardDetailTarget.set(null);
                performBattleAction({ type: 'withdrawUnit', lane });
              }}
              class="kit-btn danger min-h-[44px] ms-auto px-4 text-[12.5px] font-bold"
            >
              اسحب الفريق
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
