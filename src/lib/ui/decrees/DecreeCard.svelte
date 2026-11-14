<script lang="ts">
  import type { Snippet } from 'svelte';
  import GameIcon from '../GameIcon.svelte';
  import EffectChip from '../controls/EffectChip.svelte';
  import type { DecreeCardState, EffectChipData, SealTone } from './decree-meta';
  import { fx } from './fx';
  import './decrees-theme.css';

  interface Props {
    id?: string;
    title: string;
    description?: string;
    /** Small category line (e.g. «السيادة والديون»). */
    category?: string;
    categoryClass?: string;
    /** 3.5px colour spine on the inline-start edge. */
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
    /** Whether a queued card shows a remove action on tap. */
    removable?: boolean;
    /** Extra explanation line (e.g. facility breach cost). */
    note?: string;
    actionLabel?: string;
    actionVariant?: 'primary' | 'danger' | 'ghost';
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
    state: cardState = 'available',
    infoTone = 'good',
    stateNote = '',
    queuedLabel = 'في الحصيلة',
    removable = true,
    note = '',
    actionLabel = '',
    actionVariant = 'primary',
    dimmed = false,
    highlighted = false,
    onclick,
    ariaLabel = '',
    children,
  }: Props = $props();

  const SEAL_CLASS: Record<SealTone, string> = {
    cost: 'border-umber-border/80 bg-umber-deep/55 text-umber-crimson',
    gain: 'border-forest-accent/55 bg-forest-mid/50 text-forest-accent',
    money: 'border-wheat-gold/55 bg-wheat-gold/10 text-wheat-gold',
    neutral: 'border-wheat-mid/35 bg-forest-surface/50 text-wheat-mid',
  };

  let expanded = $state(false);
  let shakeAnim = $state(false);
  let stampAnim = $state(false);
  let chipRowEl = $state<HTMLDivElement | null>(null);
  let fadeStart = $state(false);
  let fadeEnd = $state(false);
  let prevState: DecreeCardState | undefined = undefined;
  let shakeTimer: ReturnType<typeof setTimeout> | undefined;
  let stampTimer: ReturnType<typeof setTimeout> | undefined;

  function syncChipFade(): void {
    const el = chipRowEl;
    if (!el || el.scrollWidth <= el.clientWidth + 2) {
      fadeStart = false;
      fadeEnd = false;
      return;
    }
    const scrolled = Math.abs(el.scrollLeft);
    fadeStart = scrolled > 4;
    fadeEnd = scrolled + el.clientWidth < el.scrollWidth - 4;
  }

  $effect(() => {
    void chips;
    const el = chipRowEl;
    if (!el) {
      fadeStart = false;
      fadeEnd = false;
      return;
    }
    syncChipFade();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(syncChipFade);
    ro.observe(el);
    return () => ro.disconnect();
  });

  $effect(() => {
    const current = cardState;
    if (prevState !== undefined && prevState !== 'queued' && current === 'queued') {
      stampAnim = false;
      requestAnimationFrame(() => {
        stampAnim = true;
        clearTimeout(stampTimer);
        stampTimer = setTimeout(() => (stampAnim = false), 230);
      });
    }
    prevState = current;
  });

  function triggerShake(): void {
    fx('error');
    shakeAnim = false;
    requestAnimationFrame(() => {
      shakeAnim = true;
      clearTimeout(shakeTimer);
      shakeTimer = setTimeout(() => (shakeAnim = false), 250);
    });
  }

  function toggleExpand(): void {
    if (!hasDetails) return;
    fx('tap');
    expanded = !expanded;
  }

  let hasDetails = $derived(Boolean(description || warnNote || note));
  let hasActionRow = $derived(
    cardState === 'queued' ||
      cardState === 'enacted' ||
      cardState === 'locked' ||
      (cardState === 'available' && Boolean(onclick))
  );
  let label = $derived(ariaLabel || title);
  let titleAttr = $derived(cardState === 'locked' && stateNote ? stateNote : title);
  let btnVariantClass = $derived(
    actionVariant === 'danger'
      ? 'game-btn-danger'
      : actionVariant === 'ghost'
        ? 'game-btn-ghost'
        : 'game-btn-primary'
  );
  let chipFadeClass = $derived(
    fadeStart && fadeEnd
      ? 'decree-scroll-fade-both'
      : fadeEnd
        ? 'decree-scroll-fade-end'
        : fadeStart
          ? 'decree-scroll-fade-start'
          : ''
  );
</script>

<div
  class="decree-card game-plate relative flex min-h-[96px] flex-col overflow-hidden px-3 py-1.5 text-start
    {cardState === 'queued' ? 'is-queued' : ''}
    {cardState === 'enacted' ? 'opacity-85' : ''}
    {cardState === 'locked' ? '!border-dashed !border-[var(--c-line-strong)] opacity-75' : ''}
    {dimmed ? 'is-filtered-out' : ''}
    {stampAnim ? 'decree-stamp-anim' : ''}
    {shakeAnim ? 'decree-shake-anim' : ''}"
  title={titleAttr}
  data-decree-id={id || undefined}
  data-state={cardState}
>
  <!-- Band 1: Type stamp + category + title (full width minus medallion) | Cost medallion -->
  <div class="flex items-center justify-between gap-2">
    <div class="min-w-0 flex-1">
      {#if hasDetails}
        <button
          type="button"
          class="group flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-0.5 py-0.5 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wheat-gold"
          aria-expanded={expanded}
          onclick={toggleExpand}
        >
          <div class="flex w-full min-w-0 items-center gap-1.5 text-[11px] leading-[1.4]">
            {#if typeLabel}
              <span
                class="inline-flex shrink-0 items-center gap-1 border border-wheat-mid/20 bg-charcoal-deep/70 px-1.5 py-0.5 text-[11px] font-medium leading-[1.35] text-wheat-mid"
              >
                {#if typeIcon}
                  <GameIcon name={typeIcon} cls="h-2.5 w-2.5 shrink-0 text-wheat-gold/85" />
                {/if}
                {typeLabel}
              </span>
            {/if}
            {#if category}
              <span class="min-w-0 truncate font-medium leading-[1.4] {categoryClass}">{category}</span>
            {/if}
            {#if warnNote && !expanded}
              <span
                class="shrink-0 border border-status-warn/40 bg-umber-deep/50 px-1 py-px text-[11px] font-bold leading-[1.35] text-status-warn"
              >
                شرط
              </span>
            {/if}
            <span
              class="shrink-0 text-[11px] text-wheat-dark/80 transition-colors group-hover:text-wheat-gold"
              aria-hidden="true"
            >
              {expanded ? '▴' : '▾'}
            </span>
          </div>

          <h3
            class="line-clamp-2 w-full font-heading text-[13px] font-semibold leading-[1.42] text-wheat-light {cardState ===
            'locked'
              ? 'opacity-80'
              : ''}"
          >
            {title}
          </h3>
        </button>
      {:else}
        <div class="flex min-h-[40px] min-w-0 flex-col items-start justify-center gap-0.5 py-0.5">
          <div class="flex w-full min-w-0 items-center gap-1.5 text-[11px] leading-[1.4]">
            {#if typeLabel}
              <span
                class="inline-flex shrink-0 items-center gap-1 border border-wheat-mid/20 bg-charcoal-deep/70 px-1.5 py-0.5 text-[11px] font-medium leading-[1.35] text-wheat-mid"
              >
                {#if typeIcon}
                  <GameIcon name={typeIcon} cls="h-2.5 w-2.5 shrink-0 text-wheat-gold/85" />
                {/if}
                {typeLabel}
              </span>
            {/if}
            {#if category}
              <span class="min-w-0 truncate font-medium leading-[1.4] {categoryClass}">{category}</span>
            {/if}
          </div>

          <h3 class="line-clamp-2 w-full font-heading text-[13px] font-semibold leading-[1.42] text-wheat-light">
            {title}
          </h3>
        </div>
      {/if}
    </div>

    {#if sealValue}
      <div
        class="flex min-h-10 min-w-[48px] shrink-0 select-none flex-col items-center justify-center border border-dashed px-1.5 py-1 {SEAL_CLASS[
          sealTone
        ]} {cardState === 'locked' ? 'saturate-50' : ''}"
        aria-hidden="true"
      >
        <b class="num text-[14px] font-bold leading-none" dir="ltr">{sealValue}</b>
        {#if sealUnit}
          <small class="mt-0.5 text-[11px] leading-[1.35] opacity-85">{sealUnit}</small>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Band 2: Unobstructed full-width 1-line scrollable effect chips -->
  {#if chips.length > 0}
    <div
      bind:this={chipRowEl}
      onscroll={syncChipFade}
      class="decree-scroll-row mt-1 flex w-full min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap {fadeEnd ? 'pe-3' : ''} {chipFadeClass} {cardState ===
      'locked'
        ? 'opacity-75'
        : ''}"
    >
      {#each chips as chip, i (chip.text + i)}
        <EffectChip
          icon=""
          text={chip.text}
          tone={chip.tone}
          class="shrink-0"
        />
      {/each}
    </div>
  {/if}

  <!-- Band 3: Separate action row (lock note on start + primary button on end, never overlapping chips) -->
  {#if hasActionRow}
    <div class="mt-1.5 flex items-center justify-between gap-2">
      {#if cardState === 'locked' && stateNote}
        <p class="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-medium leading-[1.38] text-umber-glow">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Zm3 8.73V17a1 1 0 1 1-2 0v-1.27a1.5 1.5 0 1 1 2 0Z"
            />
          </svg>
          <span>{stateNote}</span>
        </p>
      {:else}
        <span></span>
      {/if}

      <div class="shrink-0">
        {#if cardState === 'queued'}
          {#if onclick && removable}
            <button
              type="button"
              class="game-btn game-btn-positive pressable min-h-11 !px-3 text-[11.5px] whitespace-nowrap"
              aria-label={label}
              onclick={onclick}
            >
              <GameIcon name="check-mark" cls="h-3.5 w-3.5 shrink-0" />
              <span>{queuedLabel}</span>
              <GameIcon name="cross-mark" cls="h-3 w-3 shrink-0 opacity-80" />
            </button>
          {:else}
            <span
              class="game-btn game-btn-positive min-h-11 cursor-default !px-3 text-[11.5px] whitespace-nowrap"
            >
              <GameIcon name="check-mark" cls="h-3.5 w-3.5 shrink-0" />
              <span>{queuedLabel}</span>
            </span>
          {/if}
        {:else if cardState === 'enacted'}
          <span
            class="inline-flex min-h-11 items-center gap-1 border border-forest-accent/35 bg-forest-mid/55 px-3 text-[11px] font-bold text-forest-accent whitespace-nowrap"
          >
            <GameIcon name="check-mark" cls="h-3.5 w-3.5 shrink-0" />
            منفّذ
          </span>
        {:else if cardState === 'locked'}
          <button
            type="button"
            class="game-btn game-btn-ghost pressable min-h-11 border-umber-border/70 !px-3 text-[11px] text-umber-glow whitespace-nowrap"
            aria-label={label}
            onclick={triggerShake}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            >
              <path
                d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Zm3 8.73V17a1 1 0 1 1-2 0v-1.27a1.5 1.5 0 1 1 2 0Z"
              />
            </svg>
            <span>موقوف</span>
          </button>
        {:else if cardState === 'available' && onclick}
          <button
            type="button"
            class="game-btn pressable min-h-11 !px-3 text-[11.5px] whitespace-nowrap {btnVariantClass}"
            aria-label={label}
            onclick={onclick}
          >
            {actionLabel || 'أضف إلى الحصيلة'}
          </button>
        {/if}
      </div>
    </div>
  {:else if cardState === 'locked' && stateNote}
    <p
      class="mt-1.5 flex items-center gap-1.5 border-t border-umber-border/40 pt-1 text-[11px] font-medium leading-[1.38] text-umber-glow"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        class="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Zm3 8.73V17a1 1 0 1 1-2 0v-1.27a1.5 1.5 0 1 1 2 0Z"
        />
      </svg>
      <span>{stateNote}</span>
    </p>
  {/if}

  <!-- Collapsible description / condition drawer (hidden by default) -->
  {#if expanded && hasDetails}
    <div class="mt-2 space-y-1.5 border-t border-wheat-mid/15 pt-2">
      {#if description}
        <p class="text-xs leading-relaxed text-wheat-mid">{description}</p>
      {/if}
      {#if warnNote}
        <p
          class="border-s-2 border-status-warn/60 bg-umber-deep/35 px-2 py-1 text-[11px] leading-snug text-status-warn"
        >
          {warnNote}
        </p>
      {/if}
      {#if note}
        <p class="text-[11px] leading-snug text-umber-crimson">{note}</p>
      {/if}
    </div>
  {/if}

  {#if children}
    <div class="relative z-[2] mt-2">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .decree-card.is-queued {
    background: var(--c-panel);
  }
</style>
