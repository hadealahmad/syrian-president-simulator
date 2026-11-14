<script lang="ts">
  import type { Snippet } from 'svelte';
  import './econ-plates.css';
  import { splitBidiTokens } from './bidi';
  import GameIcon from '../GameIcon.svelte';
  import BigSlider from './BigSlider.svelte';
  import { triggerFx } from './feedback-bridge';

  interface Props {
    title: string;
    displayValue: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    default?: number;
    sliderLabel: string;
    format?: (value: number) => string;
    minLabel?: string;
    maxLabel?: string;
    disabled?: boolean;
    onchange: (value: number) => void;
    explainerOpen?: boolean;
    onToggleExplainer?: () => void;
    chips?: Snippet;
    explainer?: Snippet;
    footer?: Snippet;
    class?: string;
  }

  let {
    title,
    displayValue,
    value,
    min,
    max,
    step = 1,
    default: defaultValue,
    sliderLabel,
    format,
    minLabel = '',
    maxLabel = '',
    disabled = false,
    onchange,
    explainerOpen = false,
    onToggleExplainer,
    chips,
    explainer,
    footer,
    class: className = '',
  }: Props = $props();

  let valueSegments = $derived(splitBidiTokens(displayValue));
</script>

<article class="game-plate px-2.5 py-2 {className}">
  <!-- Row 1: [?] + Title on start, big tabular amber value on end -->
  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 flex-1 items-center gap-1">
      {#if onToggleExplainer}
        <button
          type="button"
          onclick={() => {
            triggerFx('tap');
            onToggleExplainer();
          }}
          aria-label="إظهار الشرح"
          aria-expanded={explainerOpen}
          class="pressable -my-2 -ms-2 flex h-11 w-11 shrink-0 items-center justify-center text-wheat-dark hover:text-wheat-gold"
        >
          <GameIcon name="help" cls="h-4 w-4 {explainerOpen ? 'text-wheat-gold' : ''}" />
        </button>
      {/if}
      <h4 class="min-w-0 flex-1 font-heading text-[13px] font-bold leading-snug text-wheat-light">
        {title}
      </h4>
    </div>
    <span class="num shrink-0 text-[17px] font-bold leading-tight text-wheat-gold">
      {#each valueSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
    </span>
  </div>

  <!-- Row 2: [−] slider track [+] -->
  <div class="mt-1">
    <BigSlider
      {value}
      {min}
      {max}
      {step}
      default={defaultValue}
      label={sliderLabel}
      {format}
      {minLabel}
      {maxLabel}
      {disabled}
      {onchange}
    />
  </div>

  <!-- One-line horizontally scrollable effect chips -->
  {#if chips}
    <div class="econ-chip-strip mt-1 pb-0.5">
      {@render chips()}
    </div>
  {/if}

  {#if footer}
    <div class="mt-1.5">
      {@render footer()}
    </div>
  {/if}

  {#if explainer && explainerOpen}
    <div class="mt-1.5 border-t border-[var(--c-line)] pt-1.5 text-[12px] leading-relaxed text-wheat-dark">
      {@render explainer()}
    </div>
  {/if}
</article>
