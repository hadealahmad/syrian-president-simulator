<script module lang="ts">
  export type FxTone = 'good' | 'bad' | 'neutral' | 'warn';
</script>

<script lang="ts">
  import './kit.css';
  import { splitBidiTokens } from '../controls/bidi';
  import GameIcon from '../GameIcon.svelte';

  interface Props {
    text?: string;
    label?: string;
    value?: number;
    tone?: FxTone;
    icon?: string;
    class?: string;
  }

  let {
    text,
    label = '',
    value,
    tone = 'neutral',
    icon = '',
    class: className = '',
  }: Props = $props();

  let body = $derived.by(() => {
    if (text !== undefined) return text;
    if (value === undefined) return label;
    const sign = value > 0 ? '+' : value < 0 ? '−' : '';
    const amount = Math.abs(value).toLocaleString('en-US');
    return `${label} ${sign}${amount}`.trim();
  });

  let segments = $derived(splitBidiTokens(body));

  let toneCls = $derived(
    tone === 'good' ? 'up' : tone === 'bad' ? 'dn' : tone === 'warn' ? 'warn' : ''
  );
</script>

<span class="fx-chip oc-kit-num {toneCls} {className}" title={body}>
  {#if icon}
    <GameIcon name={icon} cls="h-3 w-3 shrink-0" />
  {/if}
  <span class="min-w-0">
    {#each segments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
  </span>
</span>
