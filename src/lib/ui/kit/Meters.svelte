<script module lang="ts">
  export interface MeterItem {
    label: string;
    value: string;
    unit?: string;
    tone?: 'default' | 'pos' | 'neg' | 'accent';
    barPct?: number;
    barTone?: 'accent' | 'pos' | 'neg';
  }
</script>

<script lang="ts">
  import './kit.css';

  interface Props {
    items: MeterItem[];
    columns?: 3 | 4;
    flush?: boolean;
    class?: string;
  }

  let {
    items,
    columns,
    flush = false,
    class: className = '',
  }: Props = $props();

  let cols = $derived(columns ?? (items.length === 3 ? 3 : 4));
</script>

<div class="meters {cols === 3 ? 'three' : ''} {flush ? 'is-flush' : ''} {className}">
  {#each items as item (item.label)}
    <div>
      <span>{item.label}</span>
      <b
        class="oc-kit-num {item.tone === 'neg'
          ? 'dn'
          : item.tone === 'pos'
            ? 'up'
            : item.tone === 'accent'
              ? 'am'
              : ''}"
        dir="rtl"
      >
        <bdi dir="ltr">{item.value}</bdi>{#if item.unit}<small class="ms-0.5">{item.unit}</small>{/if}
      </b>
      {#if item.barPct !== undefined}
        <u
          class="{item.barTone === 'neg' ? 'dn' : item.barTone === 'pos' ? 'up' : ''}"
          style="width: {Math.max(0, Math.min(100, item.barPct))}%;"
          aria-hidden="true"
        ></u>
      {/if}
    </div>
  {/each}
</div>
