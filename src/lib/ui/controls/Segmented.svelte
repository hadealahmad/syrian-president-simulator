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
  import EffectChip from './EffectChip.svelte';

  interface Props {
    value: string | null;
    options: SegmentedOption[];
    label: string;
    onchange: (value: string) => void;
    columns?: number;
    disabled?: boolean;
  }

  let {
    value,
    options,
    label,
    onchange,
    columns = options.length,
    disabled = false,
  }: Props = $props();

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
    onchange(options[target].value);
    const sibling = (event.currentTarget as HTMLElement).parentElement?.children[target];
    if (sibling instanceof HTMLElement) sibling.focus();
  }
</script>

<div
  class="grid gap-1.5"
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
        if (!isDisabled) onchange(option.value);
      }}
      onkeydown={(event) => onKeydown(event, index)}
      class="relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 border px-1.5 py-2 text-center transition-colors
        {isActive
          ? 'border-wheat-gold bg-forest-surface text-wheat-gold shadow-sm'
          : 'border-charcoal-mid bg-charcoal-surface text-wheat-dark hover:border-wheat-mid/60 hover:text-wheat-light'}
        {isDisabled ? 'cursor-not-allowed opacity-40 grayscale' : 'cursor-pointer'}"
    >
      <span class="font-heading text-[10.5px] font-bold leading-tight">{option.label}</span>
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
