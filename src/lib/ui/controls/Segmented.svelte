<script module lang="ts">
  export interface SegmentedChip {
    text: string;
    tone?: 'good' | 'bad' | 'neutral';
    icon?: string;
  }

  export interface SegmentedOption {
    value: string;
    label: string;
    chips?: SegmentedChip[];
    disabled?: boolean;
    title?: string;
  }
</script>

<script lang="ts">
  import './econ-plates.css';
  import EffectChip from './EffectChip.svelte';
  import LockIcon from './LockIcon.svelte';
  import { triggerFx } from './feedback-bridge';

  interface Props {
    value: string | null;
    options: SegmentedOption[];
    label: string;
    onchange: (value: string) => void;
    columns?: number;
    disabled?: boolean;
    /** Show a padlock glyph on disabled options (default true). */
    showLockIcon?: boolean;
  }

  let {
    value,
    options,
    label,
    onchange,
    columns = options.length,
    disabled = false,
    showLockIcon = true,
  }: Props = $props();

  function selectOption(nextValue: string): void {
    if (nextValue !== value) {
      triggerFx('select');
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

<div
  class="grid border border-[var(--c-line-strong)] bg-[var(--c-panel)]"
  style="grid-template-columns: repeat({columns}, minmax(0, 1fr));"
  role="radiogroup"
  aria-label={label}
>
  {#each options as option, index (option.value)}
    {@const isActive = value === option.value}
    {@const isDisabled = disabled || option.disabled}
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-label={option.title ? `${option.label} — ${option.title}` : option.label}
      title={option.title ?? ''}
      disabled={isDisabled}
      onclick={() => {
        if (!isDisabled) selectOption(option.value);
      }}
      onkeydown={(event) => onKeydown(event, index)}
      class="pressable relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 border-0 px-1.5 py-1.5 text-center sm:px-2
        {index > 0 ? 'border-s border-[var(--c-line-strong)]' : ''}
        {isActive
          ? 'bg-[var(--c-text)] text-[var(--c-ink)] font-bold'
          : 'bg-transparent text-wheat-mid hover:text-wheat-light'}
        {isDisabled ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'}"
    >
      <span class="flex max-w-full items-center justify-center gap-1 font-heading text-[11.5px] font-bold leading-[1.2] sm:text-[12px]">
        {#if isDisabled && showLockIcon}
          <LockIcon cls="h-3 w-3 shrink-0" />
        {/if}
        <span>{option.label}</span>
      </span>
      {#if option.chips?.length}
        <span class="flex flex-wrap items-center justify-center gap-1">
          {#each option.chips as chip}
            <EffectChip text={chip.text} tone={chip.tone ?? 'neutral'} icon={chip.icon} />
          {/each}
        </span>
      {/if}
    </button>
  {/each}
</div>
