<script lang="ts">
  import type { Snippet } from 'svelte';
  import './kit.css';
  import { splitBidiTokens } from '../controls/bidi';

  interface Props {
    label: string;
    value: string;
    valueTone?: 'default' | 'pos' | 'neg' | 'accent';
    delta?: string;
    deltaTone?: 'pos' | 'neg' | 'muted' | 'accent';
    fromValue?: string;
    barPct?: number;
    markerPct?: number;
    trailing?: Snippet;
    class?: string;
  }

  let {
    label,
    value,
    valueTone = 'default',
    delta = '',
    deltaTone = 'muted',
    fromValue = '',
    barPct,
    markerPct,
    trailing,
    class: className = '',
  }: Props = $props();

  let valToneCls = $derived(
    valueTone === 'pos'
      ? 'pos'
      : valueTone === 'neg'
        ? 'neg'
        : valueTone === 'accent'
          ? 'accent'
          : ''
  );
  let deltaToneCls = $derived(
    deltaTone === 'pos'
      ? 'pos'
      : deltaTone === 'neg'
        ? 'neg'
        : deltaTone === 'accent'
          ? 'accent'
          : ''
  );
  let valueSegments = $derived(splitBidiTokens(value));
</script>

{#if barPct !== undefined}
  <div class="budget-strip {className}">
    <span class="text-[12px] text-[var(--c-muted)]">{label}</span>
    <span class="oc-kit-num flex items-baseline gap-2" dir="rtl">
      {#if fromValue}
        <bdi dir="ltr" class="text-[13px] text-[var(--c-muted)]">{fromValue}</bdi>
        <span class="text-[var(--c-muted)]" aria-hidden="true">←</span>
      {/if}
      <bdi
        dir="ltr"
        class="text-[17px] font-bold {valueTone === 'neg' ? 'text-[var(--c-neg)]' : valueTone === 'pos' ? 'text-[var(--c-pos)]' : 'text-[var(--c-accent)]'}"
      >
        {value}
      </bdi>
      {#if delta}
        <bdi dir="ltr" class="strip-delta {deltaToneCls}">{delta}</bdi>
      {/if}
    </span>
    <div class="bar" aria-hidden="true">
      <u style="width: {Math.max(0, Math.min(100, barPct))}%;"></u>
      {#if markerPct !== undefined}
        <em style="inset-inline-start: {Math.max(0, Math.min(100, markerPct))}%;"></em>
      {/if}
    </div>
  </div>
{:else}
  <div class="strip {className}">
    <span class="strip-label">{label}</span>
    {#if delta}
      <i class="strip-delta oc-kit-num {deltaToneCls}" dir="ltr">{delta}</i>
    {/if}
    <span class="oc-kit-num flex items-baseline gap-1.5" dir="rtl">
      {#if fromValue}
        <bdi dir="ltr" class="text-[12px] text-[var(--c-muted)]">{fromValue}</bdi>
        <span class="text-[12px] text-[var(--c-muted)]" aria-hidden="true">←</span>
      {/if}
      <b class="strip-val {valToneCls}">
        {#each valueSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
      </b>
    </span>
    {#if trailing}
      {@render trailing()}
    {/if}
  </div>
{/if}
