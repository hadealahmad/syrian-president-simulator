<script lang="ts">
  import type { Snippet } from 'svelte';
  import './kit.css';
  import CostTag from './CostTag.svelte';
  import HourglassIcon from './HourglassIcon.svelte';
  import LockIcon from '../controls/LockIcon.svelte';
  import { fx } from '../fx/feedback';

  interface Props {
    title: string;
    tag?: string;
    description?: string;
    cost?: string;
    costUnit?: string;
    costTone?: 'accent' | 'pos' | 'neg' | 'muted';
    buttonLabel?: string;
    buttonVariant?: 'neutral' | 'primary' | 'active' | 'danger';
    disabled?: boolean;
    locked?: boolean;
    lockReason?: string;
    notYetAvailable?: boolean;
    availableNote?: string;
    selected?: boolean;
    highlighted?: boolean;
    dimmed?: boolean;
    onclick?: () => void;
    onCardClick?: () => void;
    chips?: Snippet;
    actions?: Snippet;
    badge?: Snippet;
    class?: string;
    [key: string]: unknown;
  }

  let {
    title,
    tag = '',
    description = '',
    cost = '',
    costUnit = '',
    costTone = 'accent',
    buttonLabel = '',
    buttonVariant = 'neutral',
    disabled = false,
    locked = false,
    lockReason = '',
    notYetAvailable = false,
    availableNote = '',
    selected: _selected = false,
    highlighted: _highlighted = false,
    dimmed = false,
    onclick,
    onCardClick,
    chips,
    actions,
    badge,
    class: className = '',
    ...rest
  }: Props = $props();

  let btnCls = $derived(
    notYetAvailable
      ? 'soon'
      : locked
        ? 'lock'
        : buttonVariant === 'primary'
          ? 'pri'
          : buttonVariant === 'active'
            ? 'on'
            : buttonVariant === 'danger'
              ? 'danger'
              : ''
  );

  function handleAction(e: MouseEvent): void {
    e.stopPropagation();
    if (disabled || locked || notYetAvailable) {
      fx('error');
      return;
    }
    fx(buttonVariant === 'active' ? 'cancel' : 'select');
    onclick?.();
  }
</script>

<article
  {...rest}
  class="card {locked && !notYetAvailable ? 'is-locked locked' : ''} {notYetAvailable ? 'is-not-yet-available' : ''} {dimmed ? 'is-filtered-out' : ''} {className}"
>
  {#if onCardClick}
    <button
      type="button"
      onclick={() => {
        fx('tap');
        onCardClick();
      }}
      class="ct text-start cursor-pointer"
    >
      {#if tag}
        <span class="tag">{tag}</span>
      {/if}
      <b>{title}</b>
      {#if description}
        <small>{description}</small>
      {/if}
    </button>
  {:else}
    <div class="ct">
      {#if tag}
        <span class="tag">{tag}</span>
      {/if}
      <b>{title}</b>
      {#if description}
        <small>{description}</small>
      {/if}
    </div>
  {/if}

  {#if badge}
    <div class="self-start">
      {@render badge()}
    </div>
  {:else if cost}
    <CostTag amount={cost} unit={costUnit} tone={costTone} />
  {/if}

  {#if actions}
    {#if chips || (notYetAvailable && availableNote) || (locked && lockReason)}
      <div class="fx col-span-full">
        {#if chips}
          {@render chips()}
        {/if}
        {#if notYetAvailable && availableNote}
          <span class="note w-full">
            <HourglassIcon cls="h-3 w-3 shrink-0" />
            <span>{availableNote}</span>
          </span>
        {:else if locked && lockReason}
          <span class="note w-full text-[var(--c-neg)]">
            <LockIcon cls="h-3 w-3 shrink-0" />
            <span class="line-clamp-2">{lockReason}</span>
          </span>
        {/if}
      </div>
    {/if}
    <div class="col-span-full">
      {@render actions()}
    </div>
  {:else if chips || (notYetAvailable && availableNote) || (locked && lockReason) || notYetAvailable || locked || buttonLabel}
    <div class="card-foot">
      {#if chips || (notYetAvailable && availableNote) || (locked && lockReason)}
        <div class="fx">
          {#if chips}
            {@render chips()}
          {/if}
          {#if notYetAvailable && availableNote}
            <span class="note w-full">
              <HourglassIcon cls="h-3 w-3 shrink-0" />
              <span>{availableNote}</span>
            </span>
          {:else if locked && lockReason}
            <span class="note w-full text-[var(--c-neg)]">
              <LockIcon cls="h-3 w-3 shrink-0" />
              <span class="line-clamp-2">{lockReason}</span>
            </span>
          {/if}
        </div>
      {/if}

      {#if notYetAvailable}
        <span
          class="kit-btn-wrap inline-flex shrink-0"
          role="presentation"
          onpointerdown={() => fx('error')}
        >
          <button
            type="button"
            disabled
            aria-label={availableNote || buttonLabel || 'يُفتح لاحقاً'}
            class="kit-btn soon"
          >
            <HourglassIcon cls="h-3.5 w-3.5 shrink-0" />
            <span>{availableNote || 'قريباً'}</span>
          </button>
        </span>
      {:else if locked}
        <span
          class="kit-btn-wrap inline-flex shrink-0"
          role="presentation"
          onpointerdown={() => fx('error')}
        >
          <button
            type="button"
            disabled
            aria-label={lockReason ? `${buttonLabel || 'مقفل'} — ${lockReason}` : buttonLabel || 'مقفل'}
            class="kit-btn lock"
          >
            <LockIcon cls="h-3.5 w-3.5 shrink-0" />
            <span>مقفل</span>
          </button>
        </span>
      {:else if buttonLabel}
        <button
          type="button"
          {disabled}
          onclick={handleAction}
          class="kit-btn {btnCls}"
        >
          <span>{buttonLabel}</span>
        </button>
      {/if}
    </div>
  {/if}
</article>
