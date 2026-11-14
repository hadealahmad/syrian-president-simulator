<script lang="ts">
  import type { Snippet } from 'svelte';
  import './kit.css';
  import HourglassIcon from './HourglassIcon.svelte';
  import LockIcon from '../controls/LockIcon.svelte';
  import { splitBidiTokens } from '../controls/bidi';
  import { fx } from '../fx/feedback';

  interface Props {
    title: string;
    description?: string;
    cost?: string;
    costTone?: 'neg' | 'pos' | 'accent' | 'muted';
    buttonLabel: string;
    buttonVariant?: 'default' | 'secondary' | 'danger' | 'active';
    active?: boolean;
    disabled?: boolean;
    locked?: boolean;
    lockReason?: string;
    notYetAvailable?: boolean;
    availableNote?: string;
    highlighted?: boolean;
    dimmed?: boolean;
    onclick?: () => void;
    chips?: Snippet;
    meta?: Snippet;
    class?: string;
  }

  let {
    title,
    description = '',
    cost = '',
    costTone = 'neg',
    buttonLabel,
    buttonVariant = 'default',
    active = false,
    disabled = false,
    locked = false,
    lockReason = '',
    notYetAvailable = false,
    availableNote = '',
    highlighted: _highlighted = false,
    dimmed = false,
    onclick,
    chips,
    meta,
    class: className = '',
  }: Props = $props();

  let costCls = $derived(
    costTone === 'pos' ? 'up' : costTone === 'accent' ? 'am' : costTone === 'muted' ? 'muted' : ''
  );
  let btnVariantCls = $derived(
    notYetAvailable
      ? 'soon'
      : locked
        ? 'lock'
        : buttonVariant === 'danger'
          ? 'danger'
          : buttonVariant === 'secondary'
            ? 'sec'
            : active || buttonVariant === 'active'
              ? 'on'
              : ''
  );
  let descSegments = $derived(splitBidiTokens(description));
  let costSegments = $derived(splitBidiTokens(cost));
  let isBlocked = $derived(disabled || locked || notYetAvailable);

  function handleClick(): void {
    if (isBlocked) {
      fx('error');
      return;
    }
    fx(active ? 'cancel' : 'select');
    onclick?.();
  }
</script>

<div
  class="act {locked && !notYetAvailable ? 'is-locked locked' : ''} {notYetAvailable ? 'is-not-yet-available' : ''} {dimmed ? 'is-filtered-out' : ''} {className}"
>
  <div class="act-body">
    <b>{title}</b>
    {#if notYetAvailable && availableNote}
      <small class="flex items-center gap-1">
        <HourglassIcon cls="h-3 w-3 shrink-0" />
        <span class="line-clamp-2">{availableNote}</span>
      </small>
    {:else if locked && lockReason}
      <small class="flex items-center gap-1">
        <LockIcon cls="h-3 w-3 shrink-0" />
        <span class="line-clamp-2">{lockReason}</span>
      </small>
    {:else if description}
      <small dir="rtl">{#each descSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}</small>
    {/if}
    {#if chips}
      <div class="fx mt-1">
        {@render chips()}
      </div>
    {/if}
    {#if meta}
      {@render meta()}
    {/if}
  </div>

  {#if cost}
    <span class="pr oc-kit-num {costCls}" dir="rtl">{#each costSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}</span>
  {/if}

  <span
    class="kit-btn-wrap inline-flex shrink-0"
    role="presentation"
    onpointerdown={() => {
      if (isBlocked) fx('error');
    }}
  >
    <button
      type="button"
      disabled={isBlocked}
      onclick={handleClick}
      class="kit-btn {btnVariantCls}"
    >
      {#if notYetAvailable}
        <HourglassIcon cls="h-3.5 w-3.5 shrink-0" />
      {:else if locked}
        <LockIcon cls="h-3.5 w-3.5 shrink-0" />
      {/if}
      <span>{buttonLabel}</span>
    </button>
  </span>
</div>
