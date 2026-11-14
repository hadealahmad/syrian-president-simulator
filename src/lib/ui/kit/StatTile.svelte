<script lang="ts">
  import type { Snippet } from 'svelte';
  import './kit.css';
  import { splitBidiTokens } from '../controls/bidi';

  interface Props {
    label: string;
    value: string;
    unit?: string;
    valueTone?: 'default' | 'pos' | 'neg' | 'accent';
    delta?: string;
    deltaTone?: 'pos' | 'neg' | 'muted';
    deltaContent?: Snippet;
    headerActions?: Snippet;
    onclick?: () => void;
    class?: string;
  }

  let {
    label,
    value,
    unit = '',
    valueTone = 'default',
    delta = '',
    deltaTone = 'muted',
    deltaContent,
    headerActions,
    onclick,
    class: className = '',
  }: Props = $props();

  let valCls = $derived(
    valueTone === 'pos' ? 'pos' : valueTone === 'neg' ? 'neg' : valueTone === 'accent' ? 'accent' : ''
  );
  let deltaCls = $derived(deltaTone === 'pos' ? 'pos' : deltaTone === 'neg' ? 'neg' : '');
  let hasArabicUnit = $derived(/[\u0600-\u06FF]/.test(unit));
  let deltaSegments = $derived(splitBidiTokens(delta));
</script>

{#if onclick}
  <button type="button" {onclick} class="tile text-start cursor-pointer hover:border-[var(--c-line-strong)] {className}">
    <div class="tile-head">
      <span class="tile-label">{label}</span>
      {#if headerActions}
        <div class="tile-actions">
          {@render headerActions()}
        </div>
      {/if}
    </div>
    <b class="tile-val oc-kit-num {valCls}" dir="rtl">
      {#if hasArabicUnit}
        <bdi dir="ltr">{value}</bdi>{#if unit}<small class="ms-1 text-[11px] font-medium text-[var(--c-muted)]">{unit}</small>{/if}
      {:else}
        <bdi dir="ltr">{value}{#if unit}<small class="text-[11px] font-medium text-[var(--c-muted)]">{unit}</small>{/if}</bdi>
      {/if}
    </b>
    {#if deltaContent}
      <i class="tile-delta oc-kit-num {deltaCls}" dir="rtl">{@render deltaContent()}</i>
    {:else if delta}
      <i class="tile-delta oc-kit-num {deltaCls}" dir="auto">
        {#each deltaSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
      </i>
    {/if}
  </button>
{:else}
  <div class="tile {className}">
    <div class="tile-head">
      <span class="tile-label">{label}</span>
      {#if headerActions}
        <div class="tile-actions">
          {@render headerActions()}
        </div>
      {/if}
    </div>
    <b class="tile-val oc-kit-num {valCls}" dir="rtl">
      {#if hasArabicUnit}
        <bdi dir="ltr">{value}</bdi>{#if unit}<small class="ms-1 text-[11px] font-medium text-[var(--c-muted)]">{unit}</small>{/if}
      {:else}
        <bdi dir="ltr">{value}{#if unit}<small class="text-[11px] font-medium text-[var(--c-muted)]">{unit}</small>{/if}</bdi>
      {/if}
    </b>
    {#if deltaContent}
      <i class="tile-delta oc-kit-num {deltaCls}" dir="rtl">{@render deltaContent()}</i>
    {:else if delta}
      <i class="tile-delta oc-kit-num {deltaCls}" dir="auto">
        {#each deltaSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
      </i>
    {/if}
  </div>
{/if}
