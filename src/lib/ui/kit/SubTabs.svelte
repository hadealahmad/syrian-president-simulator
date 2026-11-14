<script module lang="ts">
  export interface SubTabItem {
    id: string;
    label: string;
    badge?: string | number;
    locked?: boolean;
    notYetAvailable?: boolean;
    hasRelated?: boolean;
    tour?: string;
    title?: string;
  }
</script>

<script lang="ts">
  import './kit.css';
  import HourglassIcon from './HourglassIcon.svelte';
  import LockIcon from '../controls/LockIcon.svelte';
  import { fx } from '../fx/feedback';

  interface Props {
    tabs: SubTabItem[];
    value: string;
    onchange: (id: string) => void;
    ariaLabel?: string;
    class?: string;
  }

  let {
    tabs,
    value,
    onchange,
    ariaLabel = 'أقسام فرعية',
    class: className = '',
  }: Props = $props();

  function selectTab(tab: SubTabItem): void {
    if (tab.id === value) return;
    fx(tab.locked || tab.notYetAvailable ? 'tap' : 'select');
    onchange(tab.id);
  }
</script>

<div class="subtabs {className}" role="tablist" aria-label={ariaLabel}>
  {#each tabs as tab (tab.id)}
    {@const active = value === tab.id}
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-tour={tab.tour || undefined}
      title={tab.title ?? tab.label}
      class="relative {active ? 'on' : ''} {tab.notYetAvailable ? 'soon' : tab.locked ? 'lk' : ''}"
      onclick={() => selectTab(tab)}
    >
      {#if tab.notYetAvailable}
        <HourglassIcon cls="h-3 w-3 shrink-0" />
      {:else if tab.locked}
        <LockIcon cls="h-3 w-3 shrink-0" />
      {/if}
      <span class="truncate">{tab.label}</span>
      {#if tab.badge !== undefined && tab.badge !== '' && tab.badge !== 0}
        <span class="oc-kit-num text-[11px] font-bold {active ? 'opacity-80' : 'text-[var(--c-text-2)]'}">
          {tab.badge}
        </span>
      {/if}
      {#if tab.hasRelated && !active}
        <span class="absolute bottom-0 inset-x-3 h-[2px] bg-[var(--c-text-2)]" aria-hidden="true"></span>
      {/if}
    </button>
  {/each}
</div>
