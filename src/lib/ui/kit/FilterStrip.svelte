<script module lang="ts">
  export interface FilterStripItem {
    id: string;
    label: string;
    count?: number;
    title?: string;
  }
</script>

<script lang="ts">
  import './kit.css';
  import { fx } from '../fx/feedback';

  interface Props {
    items: FilterStripItem[];
    value: string;
    onchange: (id: string) => void;
    ariaLabel?: string;
    flush?: boolean;
    topBorder?: boolean;
    class?: string;
  }

  let {
    items,
    value,
    onchange,
    ariaLabel = 'تصفية',
    flush = true,
    topBorder = false,
    class: className = '',
  }: Props = $props();

  function selectItem(item: FilterStripItem): void {
    if (item.id === value) return;
    fx('select');
    onchange(item.id);
  }
</script>

<div
  class="filter-strip {flush ? 'is-flush' : ''} {topBorder ? 'has-top-border' : ''} {className}"
  role="group"
  aria-label={ariaLabel}
>
  {#each items as item (item.id)}
    {@const active = value === item.id}
    <button
      type="button"
      aria-pressed={active}
      title={item.title ?? item.label}
      class={active ? 'on' : ''}
      onclick={() => selectItem(item)}
    >
      <span>{item.label}</span>
      {#if item.count !== undefined}
        <span class="filter-strip-count oc-kit-num">{item.count}</span>
      {/if}
    </button>
  {/each}
</div>
