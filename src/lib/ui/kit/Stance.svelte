<script module lang="ts">
  import type { FxTone } from './FxChip.svelte';

  export interface StanceChip {
    text: string;
    tone?: FxTone;
    icon?: string;
  }

  export interface StanceOption {
    value: string;
    label: string;
    chips?: StanceChip[];
    disabled?: boolean;
    title?: string;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import './kit.css';
  import FxChip from './FxChip.svelte';
  import LockIcon from '../controls/LockIcon.svelte';
  import GameIcon from '../GameIcon.svelte';
  import { fx } from '../fx/feedback';

  interface Props {
    title: string;
    value: string | null;
    options: StanceOption[];
    onchange: (value: string) => void;
    columns?: number;
    disabled?: boolean;
    lockNote?: string;
    hint?: string;
    explainerOpen?: boolean;
    onToggleExplainer?: () => void;
    highlighted?: boolean;
    dimmed?: boolean;
    chips?: Snippet;
    footer?: Snippet;
    explainer?: Snippet;
    class?: string;
  }

  let {
    title,
    value,
    options,
    onchange,
    columns,
    disabled = false,
    lockNote = '',
    hint = '',
    explainerOpen = false,
    onToggleExplainer,
    highlighted: _highlighted = false,
    dimmed = false,
    chips,
    footer,
    explainer,
    class: className = '',
  }: Props = $props();

  let activeOption = $derived(options.find((o) => o.value === value) ?? null);
  let cols = $derived(columns ?? options.length);

  function selectOption(nextValue: string): void {
    if (nextValue !== value) {
      fx('select');
    }
    onchange(nextValue);
  }

  function nextEnabledIndex(index: number, delta: number): number {
    const count = options.length;
    for (let step = 1; step <= count; step++) {
      const candidate = ((index + delta * step) % count + count) % count;
      if (!disabled && !options[candidate].disabled) return candidate;
    }
    return index;
  }

  function onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
    const forward = event.key === 'ArrowLeft' ? rtl : !rtl;
    const target = nextEnabledIndex(index, forward ? 1 : -1);
    if (target === index) return;
    selectOption(options[target].value);
    const sibling = (event.currentTarget as HTMLElement).parentElement?.children[target];
    if (sibling instanceof HTMLElement) sibling.focus();
  }
</script>

<article class="stance {disabled ? 'is-locked' : ''} {dimmed ? 'is-filtered-out' : ''} {className}">
  <div class="stance-head flex items-center justify-between gap-2">
    <div class="flex min-w-0 flex-1 items-center gap-1">
      {#if onToggleExplainer}
        <button
          type="button"
          onclick={() => {
            fx('tap');
            onToggleExplainer();
          }}
          aria-label="إظهار الشرح"
          aria-expanded={explainerOpen}
          class="-my-2 -ms-1.5 phone-p:-my-3 phone-l:-my-3 flex h-7 w-7 phone-p:h-11 phone-p:w-11 phone-l:h-11 phone-l:w-11 shrink-0 items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-accent)]"
        >
          <GameIcon name="help" cls="h-3.5 w-3.5 {explainerOpen ? 'text-[var(--c-accent)]' : ''}" />
        </button>
      {/if}
      <b class="min-w-0 flex-1">{title}</b>
    </div>
  </div>

  {#if hint}
    <p class="text-[11px] leading-[1.45] text-[var(--c-muted)]">{hint}</p>
  {/if}

  <div
    class="seg"
    style="display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr));"
    role="radiogroup"
    aria-label={title}
  >
    {#each options as option, index (option.value)}
      {@const isActive = value === option.value}
      {@const isDisabled = disabled || option.disabled}
      <button
        type="button"
        role="radio"
        aria-checked={isActive}
        aria-label={option.title ? `${option.label} — ${option.title}` : option.label}
        title={option.title ?? option.label}
        disabled={isDisabled}
        onclick={() => {
          if (!isDisabled) selectOption(option.value);
        }}
        onkeydown={(event) => onKeydown(event, index)}
        class="{isActive ? 'on' : ''} {isDisabled ? 'lk' : ''}"
      >
        {#if isDisabled}
          <LockIcon cls="h-3 w-3 shrink-0" />
        {/if}
        <span class="truncate">{option.label}</span>
      </button>
    {/each}
  </div>

  {#if chips}
    <div class="fx">
      {@render chips()}
    </div>
  {:else if activeOption?.chips?.length}
    <div class="fx">
      {#each activeOption.chips as chip}
        <FxChip text={chip.text} tone={chip.tone ?? 'neutral'} icon={chip.icon} />
      {/each}
    </div>
  {/if}

  {#if lockNote}
    <div class="note">
      <LockIcon cls="h-3 w-3 shrink-0" />
      <span>{lockNote}</span>
    </div>
  {/if}

  {#if footer}
    <div>
      {@render footer()}
    </div>
  {/if}

  {#if explainer && explainerOpen}
    <div class="border-t border-[var(--c-line)] pt-1.5 text-[12px] leading-[1.5] text-[var(--c-muted)]">
      {@render explainer()}
    </div>
  {/if}
</article>
