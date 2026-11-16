<script lang="ts">
  import {
    CATEGORIES,
    getCardDef,
    getCrisisDef,
    getDeckCardStats,
    type CategoryId,
    type CrisisInstance,
    type DeckCard,
    type UnitInstance,
  } from '../engine';
  import Glyph from './Glyph.svelte';

  let {
    deckCard,
    unit,
    crisis,
    hidden = false,
    size = 'board',
    effectiveCost,
    effectivePower,
    expertiseActive = false,
    previewDamage = 0,
    previewDestroyed = false,
    selected = false,
    unaffordable = false,
    animClass = '',
  }: {
    deckCard?: DeckCard;
    unit?: UnitInstance;
    crisis?: CrisisInstance;
    hidden?: boolean;
    size?: 'board' | 'queue' | 'hand' | 'md' | 'lg';
    effectiveCost?: number;
    effectivePower?: number;
    expertiseActive?: boolean;
    previewDamage?: number;
    previewDestroyed?: boolean;
    selected?: boolean;
    unaffordable?: boolean;
    animClass?: string;
  } = $props();

  const resolved = $derived.by(() => {
    if (hidden) {
      return {
        isEnemy: true,
        isBoss: false,
        bossPhase: undefined as 1 | 2 | undefined,
        kind: 'hidden' as const,
        category: 'society' as CategoryId,
        name: 'مجهول',
        glyph: 'watch',
        cost: undefined as number | undefined,
        baseCost: undefined as number | undefined,
        power: 0,
        basePower: 0,
        health: 0,
        maxHealth: 0,
        healthUpgraded: false,
        traits: [] as string[],
        playable: false,
        mobileReady: false,
      };
    }

    if (crisis) {
      const baseDef = crisis.isBoss ? null : getCrisisDef(crisis.defId);
      const baseP = baseDef ? baseDef.power : crisis.power;
      const effP = effectivePower ?? crisis.power;
      return {
        isEnemy: true,
        isBoss: Boolean(crisis.isBoss),
        bossPhase: crisis.bossPhase,
        kind: 'crisis' as const,
        category: crisis.category,
        name: crisis.name,
        glyph: crisis.glyph,
        cost: undefined,
        baseCost: undefined,
        power: effP,
        basePower: baseP,
        health: crisis.health,
        maxHealth: crisis.maxHealth,
        healthUpgraded: false,
        traits: crisis.traits,
        playable: false,
        mobileReady: false,
      };
    }

    if (unit) {
      const def = getCardDef(unit.defId);
      const baseP = def.power ?? 0;
      const effP = effectivePower ?? unit.power + unit.tempPower;
      return {
        isEnemy: false,
        isBoss: false,
        bossPhase: undefined,
        kind: 'unit' as const,
        category: unit.category,
        name: unit.name,
        glyph: unit.glyph,
        cost: undefined,
        baseCost: undefined,
        power: effP,
        basePower: baseP,
        health: unit.health,
        maxHealth: unit.maxHealth,
        healthUpgraded: unit.sourceCard.healthBonus > 0,
        traits: unit.traits,
        playable: true,
        mobileReady: unit.traits.includes('mobile') && !unit.movedThisRound,
      };
    }

    if (deckCard) {
      const stats = getDeckCardStats(deckCard);
      const cost = effectiveCost ?? stats.def.cost;
      return {
        isEnemy: false,
        isBoss: false,
        bossPhase: undefined,
        kind: stats.def.kind,
        category: stats.def.category,
        name: stats.def.name,
        glyph: stats.def.glyph,
        cost,
        baseCost: stats.def.cost,
        power: stats.power,
        basePower: stats.def.power ?? 0,
        health: stats.health,
        maxHealth: stats.def.health ?? 0,
        healthUpgraded: deckCard.healthBonus > 0,
        traits: stats.traits,
        playable: stats.def.playable,
        mobileReady: false,
      };
    }

    return null;
  });

  const isSmall = $derived(size === 'queue');
  const isLarge = $derived(size === 'lg' || size === 'md');

  const nameCls = $derived(
    size === 'lg'
      ? 'text-[13.5px] sm:text-[14.5px]'
      : size === 'md'
        ? 'text-[12.5px]'
        : size === 'queue'
          ? 'text-[9.5px] lg:text-[12px]'
          : 'text-[11px] sm:text-[12.5px] lg:text-[14px]',
  );

  const statNumCls = $derived(
    size === 'lg'
      ? 'text-[20px] sm:text-[22px]'
      : size === 'md'
        ? 'text-[18px] sm:text-[19px]'
        : size === 'queue'
          ? 'text-[14px] lg:text-[17px]'
          : 'text-[18px] sm:text-[19px] lg:text-[22px]',
  );

  const statGlyphCls = $derived(
    size === 'lg'
      ? 'h-[13px] w-[13px] sm:h-[14px] sm:w-[14px]'
      : size === 'queue'
        ? 'h-[10px] w-[10px] lg:h-[12px] lg:w-[12px]'
        : 'h-[12px] w-[12px] sm:h-[13px] sm:w-[13px] lg:h-[14px] lg:w-[14px]',
  );
</script>

{#if resolved}
  <div
    data-cat={resolved.category}
    class="crisis-card crisis-card--{size} {resolved.isBoss
      ? 'crisis-card--boss'
      : resolved.isEnemy
        ? 'crisis-card--enemy'
        : ''} {selected ? 'crisis-card--selected' : ''} {unaffordable
      ? 'crisis-card--unaffordable'
      : ''} {animClass}"
  >
    <!-- 3px top category stripe -->
    <div
      class="crisis-card-dimmable h-[3px] w-full shrink-0"
      style="background-color: {hidden ? 'var(--c-line-strong)' : 'var(--cat-color)'};"
    ></div>

    {#if previewDestroyed}
      <div class="crisis-hatch-destroy pointer-events-none absolute inset-0 z-10"></div>
    {/if}

    {#if hidden}
      <div class="crisis-hatch-dark flex flex-1 flex-col items-center justify-center gap-1 p-1">
        <Glyph name="watch" cls="h-5 w-5 text-[var(--c-muted)]" />
        <span class="text-[10px] font-bold text-[var(--c-muted)]">مخفي</span>
      </div>
    {:else}
      <!-- Top bar: Cost pips / status on start, Category glyph (+ top-end preview damage badge) on end -->
      <div class="relative z-20 flex items-start justify-between gap-0.5 ps-1.5 pe-1 pt-1">
        <div class="flex min-h-[13px] items-center gap-[2px]">
          {#if resolved.cost !== undefined && resolved.playable}
            {#if resolved.cost === 0}
              <span
                class="num text-[11px] font-bold leading-none {unaffordable
                  ? 'text-[var(--c-neg)]'
                  : 'text-[var(--c-muted)]'}"
                title="بلا كلفة"
              >
                <bdi dir="ltr">0</bdi>
              </span>
            {:else}
              <div class="flex max-w-[46px] flex-wrap items-center gap-[2px]" aria-label={`الكلفة ${resolved.cost}`}>
                {#each Array.from({ length: resolved.cost }) as _, idx (idx)}
                  <span
                    class="block h-[5.5px] w-[5.5px] lg:h-[6.5px] lg:w-[6.5px] {unaffordable ||
                    (resolved.baseCost !== undefined && idx >= resolved.baseCost)
                      ? 'bg-[var(--c-neg)]'
                      : 'bg-[var(--c-accent)]'}"
                  ></span>
                {/each}
              </div>
            {/if}
          {:else if resolved.cost !== undefined && !resolved.playable}
            <span class="num text-[10px] font-bold leading-none text-[var(--c-neg)]" title="لا تُلعب">
              —
            </span>
          {:else if resolved.isBoss && resolved.bossPhase}
            <span class="bg-[var(--c-neg)] px-1 py-[1px] text-[9.5px] font-bold leading-none text-[var(--c-ink)] lg:text-[10.5px]">
              م<bdi dir="ltr">{resolved.bossPhase}</bdi>
            </span>
          {:else if expertiseActive}
            <span
              class="border border-[var(--c-pos)] bg-[var(--c-bg)] px-1 py-[1px] text-[9.5px] font-bold leading-none text-[var(--c-pos)] lg:text-[10.5px]"
              title="اختصاص الفئة +1"
            >
              <bdi dir="ltr">+1</bdi>
            </span>
          {:else if resolved.mobileReady && !isSmall}
            <span class="text-[var(--c-accent)]" title="جاهز للتنقل">
              <Glyph name="mobile" cls="h-3.5 w-3.5" />
            </span>
          {/if}
        </div>

        <div class="flex items-start gap-1">
          <span
            class="crisis-card-dimmable"
            style="color: var(--cat-color);"
            title={CATEGORIES[resolved.category].name}
          >
            <Glyph
              name={CATEGORIES[resolved.category].glyph}
              cls={isLarge ? 'w-4 h-4' : isSmall ? 'w-3 h-3 lg:w-3.5 lg:h-3.5' : 'w-3.5 h-3.5 lg:w-4 lg:h-4'}
            />
          </span>

          {#if previewDamage > 0 || previewDestroyed}
            <div
              class="-me-1 -mt-1 z-30 flex items-center gap-0.5 border-b border-s border-[var(--c-ink)] bg-[var(--c-neg)] px-1.5 py-[2px] text-[14px] font-extrabold leading-none text-[var(--c-ink)] lg:px-2 lg:py-[2.5px] lg:text-[16px]"
            >
              {#if previewDamage > 0}
                <span class="num"><bdi dir="ltr">−{previewDamage}</bdi></span>
              {/if}
              {#if previewDestroyed}
                <span aria-label="سيسقط" class="text-[13px] leading-none lg:text-[15px]">×</span>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Centre hero glyph (~44–50% of card width) + single-line name -->
      <div class="crisis-card-dimmable relative z-20 flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 px-1">
        <div
          style="color: {resolved.kind === 'curse'
            ? 'var(--c-neg)'
            : resolved.isEnemy
              ? 'var(--crisis-glyph-color)'
              : 'var(--cat-color)'};"
        >
          <Glyph name={resolved.glyph} cls="crisis-hero-glyph shrink-0" />
        </div>
        <span class="{isSmall ? 'crisis-queue-name ' : ''}w-full truncate text-center font-bold leading-[1.15] text-[var(--c-text)] {nameCls}">
          {resolved.name}
        </span>
      </div>

      <!-- Bottom row: Chunky Power block | Centred Trait glyph | Chunky Health block -->
      {#if resolved.kind === 'unit' || resolved.kind === 'crisis'}
        <div
          class="crisis-card-dimmable relative z-20 flex items-stretch justify-between border-t border-[var(--c-line)] bg-[var(--c-strip)]/85"
        >
          <!-- Power block (start edge) -->
          <span
            class="num inline-flex items-center gap-[2px] border-e border-[var(--c-line)] bg-[var(--c-chip-bg)] {isSmall
              ? 'px-1 py-[1.5px]'
              : 'px-[4px] py-[2px] lg:px-1.5 lg:py-[3px]'} font-extrabold leading-none {resolved.power >
            resolved.basePower
              ? 'text-[var(--c-pos)]'
              : resolved.power < resolved.basePower
                ? 'text-[var(--c-neg)]'
                : 'text-[var(--c-text)]'} {statNumCls}"
          >
            <bdi dir="ltr">{resolved.power}</bdi>
            <Glyph name="power" cls="{statGlyphCls} shrink-0 opacity-85" />
          </span>

          <!-- Trait glyph(s) (centred) -->
          <span class="inline-flex flex-1 items-center justify-center gap-[1.5px] text-[var(--c-text-2)]">
            {#each resolved.traits as tr (tr)}
              <Glyph
                name={tr}
                cls={isSmall
                  ? 'h-[11px] w-[11px] lg:h-[13px] lg:w-[13px]'
                  : resolved.traits.length > 1
                    ? 'h-[11.5px] w-[11.5px] lg:h-[14px] lg:w-[14px]'
                    : 'h-[14px] w-[14px] lg:h-[16px] lg:w-[16px]'}
              />
            {/each}
          </span>

          <!-- Health block (end edge) -->
          <span
            class="num inline-flex items-center gap-[2px] border-s border-[var(--c-line)] bg-[var(--c-chip-bg)] {isSmall
              ? 'px-1 py-[1.5px]'
              : 'px-[4px] py-[2px] lg:px-1.5 lg:py-[3px]'} font-extrabold leading-none {resolved.health <
            resolved.maxHealth
              ? 'text-[var(--c-neg)]'
              : resolved.healthUpgraded
                ? 'text-[var(--c-pos)]'
                : 'text-[var(--c-text)]'} {statNumCls}"
          >
            <bdi dir="ltr">{resolved.health}</bdi>
            <Glyph name="health" cls="{statGlyphCls} shrink-0 opacity-85" />
          </span>
        </div>
      {:else}
        <div
          class="crisis-card-dimmable relative z-20 flex items-center justify-center border-t border-[var(--c-line)] bg-[var(--c-chip-bg)] px-1 py-[3px] lg:py-1"
        >
          <span
            class="text-[11px] font-bold leading-none lg:text-[12.5px] {resolved.kind === 'curse'
              ? 'text-[var(--c-neg)]'
              : 'text-[var(--c-text-2)]'}"
          >
            {resolved.kind === 'curse' ? 'عبء' : 'قرار'}
          </span>
        </div>
      {/if}
    {/if}
  </div>
{/if}
