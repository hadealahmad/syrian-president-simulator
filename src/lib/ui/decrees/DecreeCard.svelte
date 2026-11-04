<script lang="ts">
  import type { Snippet } from 'svelte';
  import GameIcon from '../GameIcon.svelte';
  import EffectChip from '../controls/EffectChip.svelte';
  import type { DecreeCardState, EffectChipData, SealTone } from './decree-meta';

  interface Props {
    id?: string;
    title: string;
    description?: string;
    /** Small category line above the title (e.g. «السيادة والديون»). */
    category?: string;
    categoryClass?: string;
    /** 3px colour strip on the inline-start edge. */
    stripClass?: string;
    typeLabel?: string;
    typeIcon?: string;
    sealValue?: string;
    sealUnit?: string;
    sealTone?: SealTone;
    chips?: EffectChipData[];
    /** Long, wrapping amber line (e.g. a facility condition). */
    warnNote?: string;
    state?: DecreeCardState;
    /** For `state="info"`: signed/active (good) or breached/bad (danger). */
    infoTone?: 'good' | 'danger';
    /** Status or lock reason, shown under the card. */
    stateNote?: string;
    /** Label for `state="queued"` (defaults to the decree tray wording). */
    queuedLabel?: string;
    /** Extra explanation line (e.g. facility breach cost). */
    note?: string;
    actionLabel?: string;
    /** Dimmed by the top-bar stat filter — visible but not operable. */
    dimmed?: boolean;
    /** Related to the active stat filter. */
    highlighted?: boolean;
    onclick?: () => void;
    ariaLabel?: string;
    children?: Snippet;
  }

  let {
    id = '',
    title,
    description = '',
    category = '',
    categoryClass = 'text-wheat-gold',
    stripClass = 'bg-wheat-gold',
    typeLabel = '',
    typeIcon = '',
    sealValue = '',
    sealUnit = '',
    sealTone = 'neutral',
    chips = [],
    warnNote = '',
    state = 'available',
    infoTone = 'good',
    stateNote = '',
    queuedLabel = 'في الحصيلة',
    note = '',
    actionLabel = '',
    dimmed = false,
    highlighted = false,
    onclick,
    ariaLabel = '',
    children,
  }: Props = $props();

  const SEAL_CLASS: Record<SealTone, string> = {
    cost: 'border-umber-border/80 bg-umber-deep/45 text-umber-crimson',
    gain: 'border-forest-accent/50 bg-forest-mid/40 text-forest-accent',
    money: 'border-wheat-gold/50 bg-wheat-gold/5 text-wheat-gold',
    neutral: 'border-wheat-mid/30 bg-forest-surface/40 text-wheat-mid',
  };

  const STATE_CLASS: Record<DecreeCardState, string> = {
    available: 'border-wheat-mid/15',
    queued: 'border-wheat-gold/70',
    enacted: 'border-forest-accent/40 opacity-90',
    locked: 'border-dashed border-umber-border/70',
    info: 'border-forest-accent/40',
  };

  let stateClass = $derived(
    state === 'info' && infoTone === 'danger'
      ? 'border-umber-border/70'
      : STATE_CLASS[state]
  );
  let tappable = $derived(Boolean(onclick) && !dimmed);
  let titleAttr = $derived(state === 'locked' && stateNote ? stateNote : title);
  let label = $derived(ariaLabel || title);
</script>

<div
  class="decree-card relative flex min-h-[124px] flex-col overflow-hidden border p-3 pb-2.5 text-start shell-round-pop {stateClass}
    {tappable ? 'is-tappable cursor-pointer focus-within:border-wheat-gold' : ''}
    {state === 'queued' ? 'is-queued' : ''}
    {highlighted ? 'ring-2 ring-wheat-gold/80 shadow-lg' : ''}
    {dimmed ? 'pointer-events-none select-none opacity-20 grayscale' : ''}"
  title={titleAttr}
  data-decree-id={id || undefined}
  data-state={state}
>
  <span class="absolute inset-y-0 start-0 w-[3px] opacity-85 {stripClass}" aria-hidden="true"></span>

  {#if category}
    <div class="mb-1 flex items-center gap-1 text-[8px] tracking-[1.2px] {categoryClass}">
      <span class="inline-block h-1 w-1 bg-current shell-round-chip" aria-hidden="true"></span>
      <span class="truncate">{category}</span>
    </div>
  {/if}

  {#if sealValue}
    <div
      class="absolute end-2 top-2 z-[1] flex h-11 w-11 shrink-0 select-none flex-col items-center justify-center border border-dashed shell-round-seal {SEAL_CLASS[
        sealTone
      ]}"
      aria-hidden="true"
    >
      <b class="font-heading text-[13px] font-semibold leading-none" dir="ltr">{sealValue}</b>
      {#if sealUnit}
        <small class="mt-0.5 text-[6.5px] leading-none opacity-80">{sealUnit}</small>
      {/if}
    </div>
  {/if}

  <h3 class="min-h-[32px] pe-14 font-heading text-[12px] font-medium leading-snug text-wheat-light">
    {title}
  </h3>

  {#if description}
    <p class="mt-1 text-[9px] leading-relaxed text-wheat-dark">{description}</p>
  {/if}

  {#if chips.length > 0}
    <div class="mt-auto flex flex-wrap content-end gap-1 pt-2">
      {#each chips as chip, i (chip.text + i)}
        <EffectChip icon="" text={chip.text} tone={chip.tone} />
      {/each}
    </div>
  {/if}

  {#if warnNote}
    <p
      class="mt-1.5 border-s-2 border-status-warn/60 bg-umber-deep/30 px-2 py-1 text-[8.5px] leading-snug text-status-warn"
    >
      {warnNote}
    </p>
  {/if}

  {#if note}
    <p class="mt-1.5 text-[8.5px] leading-snug text-umber-crimson">{note}</p>
  {/if}

  <div class="mt-2 flex items-center justify-between gap-2">
    {#if typeLabel}
      <span class="inline-flex items-center gap-1 border border-wheat-mid/15 bg-charcoal-surface/60 px-1.5 py-px text-[8px] text-wheat-dark shell-round-chip">
        {#if typeIcon}
          <GameIcon name={typeIcon} cls="h-2.5 w-2.5 shrink-0 text-wheat-mid" />
        {/if}
        {typeLabel}
      </span>
    {:else}
      <span></span>
    {/if}

    {#if state === 'queued'}
      <span class="inline-flex items-center gap-1 text-[9px] font-bold text-wheat-gold">
        <GameIcon name="check-mark" cls="h-3 w-3 shrink-0" />
        {queuedLabel}
      </span>
    {:else if state === 'enacted'}
      <span class="inline-flex items-center gap-1 text-[9px] font-bold text-forest-accent">
        <GameIcon name="check-mark" cls="h-3 w-3 shrink-0" />
        منفّذ
      </span>
    {:else if state === 'locked'}
      <span class="inline-flex items-center gap-1 text-[9px] font-bold text-umber-glow">
        <GameIcon name="barrier" cls="h-3 w-3 shrink-0" />
        موقوف
      </span>
    {:else if actionLabel}
      <span class="inline-flex items-center gap-1 text-[9px] font-bold text-forest-accent">
        <span class="text-[11px] leading-none" aria-hidden="true">+</span>
        {actionLabel}
      </span>
    {/if}
  </div>

  {#if state === 'locked' && stateNote}
    <p class="mt-1 text-[8.5px] leading-snug text-umber-glow">{stateNote}</p>
  {/if}

  {#if children}
    <div class="relative z-[2] mt-2">
      {@render children()}
    </div>
  {/if}

  {#if onclick && !dimmed}
    <button
      type="button"
      class="absolute inset-0 z-0 cursor-pointer bg-transparent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-wheat-gold"
      aria-label={label}
      onclick={onclick}
    ></button>
  {/if}
</div>

<style>
  .decree-card {
    background: linear-gradient(
      160deg,
      rgb(from var(--color-forest-mid) r g b / 0.9),
      rgb(from var(--color-forest-deep) r g b / 0.95)
    );
  }

  .decree-card.is-queued {
    background: linear-gradient(
        160deg,
        rgb(from var(--color-forest-mid) r g b / 0.9),
        rgb(from var(--color-forest-deep) r g b / 0.95)
      ),
      repeating-linear-gradient(
        135deg,
        rgb(from var(--color-wheat-gold) r g b / 0.06) 0 7px,
        transparent 7px 14px
      );
  }

  @media (prefers-reduced-motion: no-preference) {
    .decree-card {
      transition:
        transform 0.16s ease,
        border-color 0.16s ease,
        box-shadow 0.16s ease;
    }
    .decree-card.is-tappable:hover {
      transform: translateY(-2px);
      border-color: rgb(from var(--color-wheat-gold) r g b / 0.4);
      box-shadow: 0 12px 26px rgb(0 0 0 / 0.32);
    }
    .decree-card.is-tappable:active {
      transform: scale(0.995);
    }
  }
</style>
