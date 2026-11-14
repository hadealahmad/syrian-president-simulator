<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fx } from '../../fx/feedback';

  interface Props {
    title: string;
    summary?: string;
    open?: boolean;
    tone?: 'default' | 'danger';
    highlighted?: boolean;
    dimmed?: boolean;
    children: Snippet;
  }

  let {
    title,
    summary = '',
    open = $bindable(false),
    tone = 'default',
    highlighted = false,
    dimmed = false,
    children,
  }: Props = $props();

  function toggle(): void {
    fx('tap');
    open = !open;
  }
</script>

<div class="flex flex-col {dimmed ? 'is-filtered-out' : ''}">
  <button
    type="button"
    onclick={toggle}
    aria-expanded={open}
    class="flex min-h-11 w-full cursor-pointer items-center gap-2 border px-2.5 py-2 text-start transition-colors {tone ===
    'danger'
      ? 'border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-neg)] hover:border-[var(--c-line-strong)]'
      : 'border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text)] hover:border-[var(--c-line-strong)]'}"
  >
    <b class="text-[13px] font-bold leading-[1.4]">{title}</b>
    {#if summary}
      <span class="flex-1 text-end text-[11px] text-[var(--c-muted)]">{summary}</span>
    {:else}
      <span class="flex-1"></span>
    {/if}
    <span
      class="oc-kit-num text-[14px] font-bold leading-none {tone === 'danger'
        ? 'text-[var(--c-neg)]'
        : 'text-[var(--c-muted)]'}"
      aria-hidden="true"
    >
      {open ? '−' : '+'}
    </span>
  </button>

  {#if open}
    <div class="mt-1.5 flex flex-col gap-1.5">
      {@render children()}
    </div>
  {/if}
</div>
