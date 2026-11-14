<script lang="ts">
  import type { Snippet } from 'svelte';
  import './kit.css';
  import { splitBidiTokens } from '../controls/bidi';
  import LockIcon from '../controls/LockIcon.svelte';
  import GameIcon from '../GameIcon.svelte';
  import { fx } from '../fx/feedback';

  interface Props {
    title: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    default?: number;
    display?: string;
    format?: (value: number) => string;
    minLabel?: string;
    maxLabel?: string;
    disabled?: boolean;
    ariaLabel?: string;
    hint?: string;
    explainerOpen?: boolean;
    onToggleExplainer?: () => void;
    highlighted?: boolean;
    dimmed?: boolean;
    onchange: (value: number) => void;
    chips?: Snippet;
    footer?: Snippet;
    explainer?: Snippet;
    class?: string;
  }

  let {
    title,
    value,
    min,
    max,
    step = 1,
    default: defaultValue,
    display: displayOverride,
    format,
    minLabel = '',
    maxLabel = '',
    disabled = false,
    ariaLabel = '',
    hint = '',
    explainerOpen = false,
    onToggleExplainer,
    highlighted: _highlighted = false,
    dimmed = false,
    onchange,
    chips,
    footer,
    explainer,
    class: className = '',
  }: Props = $props();

  let pct = $derived(max > min ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)) : 0);
  let defaultPct = $derived(
    defaultValue !== undefined && max > min
      ? Math.max(0, Math.min(100, ((defaultValue - min) / (max - min)) * 100))
      : null
  );
  let display = $derived(
    displayOverride ?? (format ? format(value) : value.toLocaleString('en-US'))
  );
  let valueSegments = $derived(splitBidiTokens(display));

  let ticking = $state(false);
  let lastSeenValue: number | undefined;
  $effect(() => {
    const cur = value;
    if (lastSeenValue === undefined) {
      lastSeenValue = cur;
      return;
    }
    if (cur !== lastSeenValue) {
      lastSeenValue = cur;
      ticking = true;
      const timer = setTimeout(() => {
        ticking = false;
      }, 170);
      return () => clearTimeout(timer);
    }
  });

  function clamp(next: number): number {
    const stepped = min + Math.round((next - min) / step) * step;
    return Number(Math.min(max, Math.max(min, stepped)).toFixed(6));
  }

  function commit(next: number, playFx: boolean): void {
    if (disabled) return;
    const clamped = clamp(next);
    if (playFx && clamped !== value) {
      fx('select');
    }
    onchange(clamped);
  }
</script>

<article
  class="lever {dimmed ? 'is-filtered-out' : ''} {disabled ? 'is-locked is-disabled' : ''} {className}"
>
  <div class="lt">
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
    <span class="lv oc-kit-num {ticking ? 'is-ticking' : ''}">
      {#each valueSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
    </span>
  </div>

  {#if hint}
    <p class="note">
      {#if disabled}
        <LockIcon cls="h-3 w-3 shrink-0" />
      {/if}
      <span>{hint}</span>
    </p>
  {/if}

  <div class="lr">
    <button
      type="button"
      class="st"
      aria-label="إنقاص {title}"
      disabled={disabled || value <= min}
      onclick={() => commit(value - step, true)}
    >
      −
    </button>

    {#if minLabel}
      <span class="lever-bound oc-kit-num hidden md:inline phone-l:!hidden" aria-hidden="true">
        <bdi dir="ltr">{minLabel}</bdi>
      </span>
    {/if}

    <div class="track-wrap">
      <div class="track" aria-hidden="true">
        <u style="width: {pct}%;"></u>
        {#if defaultPct !== null}
          <span class="track-default" style="inset-inline-start: {defaultPct}%;"></span>
        {/if}
        <em style="inset-inline-start: calc({pct}% - (var(--kit-thumb-w, 14px) / 2));"></em>
      </div>

      <input
        type="range"
        class="kit-range-input"
        {min}
        {max}
        {step}
        {value}
        {disabled}
        dir="rtl"
        aria-label={ariaLabel || title}
        aria-valuetext={display}
        oninput={(event) => commit(Number(event.currentTarget.value), false)}
        onchange={() => {
          if (!disabled) fx('select');
        }}
      />
    </div>

    {#if maxLabel}
      <span class="lever-bound oc-kit-num hidden md:inline phone-l:!hidden" aria-hidden="true">
        <bdi dir="ltr">{maxLabel}</bdi>
      </span>
    {/if}

    <button
      type="button"
      class="st"
      aria-label="رفع {title}"
      disabled={disabled || value >= max}
      onclick={() => commit(value + step, true)}
    >
      +
    </button>
  </div>

  {#if minLabel || maxLabel}
    <div class="oc-kit-num mt-0 hidden phone-p:flex phone-l:flex justify-between text-[10.5px] leading-[1.1] text-[var(--c-muted)]" aria-hidden="true">
      <bdi dir="ltr">{minLabel}</bdi>
      <bdi dir="ltr">{maxLabel}</bdi>
    </div>
  {/if}

  {#if chips}
    <div class="fx">
      {@render chips()}
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
