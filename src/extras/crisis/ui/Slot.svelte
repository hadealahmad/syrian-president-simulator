<script lang="ts">
  import type { AnimPopup } from '../animate';
  import type { CrisisInstance, DeckCard, LaneIndex, UnitInstance } from '../engine';
  import Card from './Card.svelte';
  import Glyph from './Glyph.svelte';

  let {
    zone,
    lane,
    unit = null,
    crisis = null,
    hidden = false,
    laneDark = false,
    ghostDeckCard = null,
    effectivePower,
    expertiseActive = false,
    previewDamage = 0,
    previewDestroyed = false,
    validTarget = false,
    hovered = false,
    selectedSource = false,
    animClass = '',
    popups = [],
    ariaLabel,
    onTap,
    onHover,
  }: {
    zone: 'queue' | 'crisis' | 'player';
    lane: LaneIndex;
    unit?: UnitInstance | null;
    crisis?: CrisisInstance | null;
    hidden?: boolean;
    laneDark?: boolean;
    ghostDeckCard?: DeckCard | null;
    effectivePower?: number;
    expertiseActive?: boolean;
    previewDamage?: number;
    previewDestroyed?: boolean;
    validTarget?: boolean;
    hovered?: boolean;
    selectedSource?: boolean;
    animClass?: string;
    popups?: AnimPopup[];
    ariaLabel: string;
    onTap: () => void;
    onHover?: (entering: boolean) => void;
  } = $props();

  const cardSize = $derived(zone === 'queue' ? 'queue' : 'board');
  const hasCard = $derived(Boolean(unit || crisis || hidden));
  const interactive = $derived(Boolean(hasCard || validTarget));
</script>

<div
  data-slot-zone={zone}
  data-lane={lane}
  class="relative flex items-center justify-center"
>
  {#if interactive}
    <button
      type="button"
      onclick={onTap}
      onpointerenter={(e) => {
        if (e.pointerType === 'mouse') onHover?.(true);
      }}
      onpointerleave={(e) => {
        if (e.pointerType === 'mouse') onHover?.(false);
      }}
      aria-label={ariaLabel}
      class="pressable relative flex items-center justify-center p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {zone ===
      'queue'
        ? 'crisis-card--queue'
        : 'crisis-card--board'}"
    >
      {#if hasCard}
        <div
          class="pointer-events-none h-full w-full {validTarget ? 'crisis-slot-valid' : ''} {hovered
            ? 'crisis-slot-hovered'
            : ''}"
        >
          <Card
            unit={unit ?? undefined}
            crisis={crisis ?? undefined}
            {hidden}
            size={cardSize}
            {effectivePower}
            {expertiseActive}
            {previewDamage}
            {previewDestroyed}
            selected={selectedSource || validTarget}
            {animClass}
          />
        </div>
      {:else}
        <div
          class="pointer-events-none flex h-full w-full flex-col items-center justify-center border border-dashed border-[var(--c-line)] bg-[var(--c-strip)]/45 {laneDark
            ? 'crisis-hatch-dark'
            : ''} {validTarget ? 'crisis-slot-valid' : ''} {hovered ? 'crisis-slot-hovered' : ''}"
        >
          {#if ghostDeckCard}
            <div class="pointer-events-none opacity-70">
              <Card
                deckCard={ghostDeckCard}
                size={cardSize}
                {effectivePower}
                {expertiseActive}
                {previewDamage}
                {previewDestroyed}
              />
            </div>
          {:else if validTarget}
            <span class="h-2.5 w-2.5 bg-[var(--c-accent)]"></span>
          {:else if laneDark}
            <Glyph name="watch" cls="h-4 w-4 text-[var(--c-muted)] opacity-60" />
          {/if}
        </div>
      {/if}
    </button>
  {:else}
    <div
      aria-label={ariaLabel}
      class="relative flex flex-col items-center justify-center border border-dashed border-[var(--c-line)]/70 bg-[var(--c-strip)]/35 {laneDark
        ? 'crisis-hatch-dark'
        : ''} {zone === 'queue' ? 'crisis-card--queue' : 'crisis-card--board'}"
    >
      {#if laneDark}
        <Glyph name="watch" cls="h-4 w-4 text-[var(--c-muted)] opacity-55" />
      {/if}
    </div>
  {/if}

  <!-- Floating 20px bold damage / heal / trait popups during resolution -->
  {#each popups as pop (pop.id)}
    {@const isNumeric = /^[+−-]?\d+$/.test(pop.text)}
    <div
      class="crisis-float-pop pointer-events-none absolute left-1/2 top-1/3 z-40 border-2 border-[var(--c-ink)] font-extrabold leading-none {isNumeric
        ? 'px-2 py-0.5 text-[20px] lg:px-2.5 lg:py-1 lg:text-[23px]'
        : 'px-1.5 py-0.5 text-[12.5px] lg:text-[14px]'} {pop.tone === 'neg'
        ? 'bg-[var(--c-neg)] text-[var(--c-ink)]'
        : pop.tone === 'pos'
          ? 'bg-[var(--c-pos)] text-[var(--c-ink)]'
          : 'bg-[var(--c-accent)] text-[var(--c-ink)]'}"
    >
      <span class="num"><bdi dir="ltr">{pop.text}</bdi></span>
    </div>
  {/each}
</div>
