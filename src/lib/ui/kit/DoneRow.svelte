<script lang="ts">
  import './kit.css';
  import { splitBidiTokens } from '../controls/bidi';
  import { fx } from '../fx/feedback';

  interface Props {
    title: string;
    cost?: string;
    statusLabel?: string;
    removable?: boolean;
    removeLabel?: string;
    dimmed?: boolean;
    onremove?: () => void;
    onclick?: () => void;
    class?: string;
  }

  let {
    title,
    cost = '',
    statusLabel = '',
    removable = true,
    removeLabel = 'إزالة',
    dimmed = false,
    onremove,
    onclick,
    class: className = '',
  }: Props = $props();

  let costSegments = $derived(splitBidiTokens(cost));

  function handleRemove(e: MouseEvent): void {
    e.stopPropagation();
    fx('cancel');
    onremove?.();
  }
</script>

<div class="done {dimmed ? 'is-filtered-out' : ''} {className}">
  <span class="ck" aria-hidden="true">✓</span>
  {#if onclick}
    <button
      type="button"
      onclick={() => {
        fx('tap');
        onclick();
      }}
      class="dt cursor-pointer hover:text-[var(--c-text-2)]"
      title={title}
    >
      {title}
    </button>
  {:else}
    <span class="dt" title={title}>{title}</span>
  {/if}
  {#if cost}
    <span class="dm oc-kit-num" dir="rtl">{#each costSegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}</span>
  {/if}
  {#if removable && onremove}
    <button type="button" class="rm" onclick={handleRemove}>
      {removeLabel}
    </button>
  {:else if statusLabel}
    <span class="shrink-0 text-[11px]">{statusLabel}</span>
  {/if}
</div>
