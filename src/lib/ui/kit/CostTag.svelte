<script lang="ts">
  import './kit.css';

  interface Props {
    amount: string;
    unit?: string;
    tone?: 'accent' | 'pos' | 'neg' | 'muted';
    variant?: 'box' | 'inline';
    class?: string;
  }

  let {
    amount,
    unit = '',
    tone = 'accent',
    variant = 'box',
    class: className = '',
  }: Props = $props();

  let toneCls = $derived(
    tone === 'neg' ? 'tone-neg' : tone === 'pos' ? 'tone-pos' : tone === 'muted' ? 'tone-muted' : ''
  );
</script>

{#if variant === 'inline'}
  <span class="cost-inline oc-kit-num {toneCls} {className}" dir="ltr">
    {amount}{#if unit}&nbsp;{unit}{/if}
  </span>
{:else}
  <div class="cost oc-kit-num {toneCls} {className}">
    <b dir="ltr">{amount}</b>
    {#if unit}
      <small>{unit}</small>
    {/if}
  </div>
{/if}
