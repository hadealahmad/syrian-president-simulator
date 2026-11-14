<script lang="ts">
  import { fx } from '../fx/feedback';

  let {
    checked = false,
    disabled = false,
    label = 'تبديل',
    onchange,
  }: {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    onchange?: (next: boolean) => void;
  } = $props();

  function toggle(): void {
    if (disabled) return;
    fx('select');
    onchange?.(!checked);
  }
</script>

<!-- 44px hit area; flat square toggle with explicit state text & amber end block when ON -->
<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  {disabled}
  onclick={toggle}
  class="pressable group inline-flex min-h-11 min-w-[96px] shrink-0 items-center justify-center focus-visible:outline-none {disabled
    ? 'cursor-not-allowed opacity-45'
    : 'cursor-pointer'}"
>
  <span
    class="flex h-8 w-[96px] items-center justify-between gap-2 border px-2 transition-colors {checked
      ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)]'
      : 'border-[var(--c-line-strong)] bg-[var(--c-bg)] group-hover:border-[var(--c-text)]'} group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-[var(--c-accent)]"
  >
    {#if checked}
      <span class="text-[11.5px] font-bold leading-none text-[var(--c-accent)]">مفعّل</span>
      <span class="h-4 w-5 shrink-0 bg-[var(--c-accent)]" aria-hidden="true"></span>
    {:else}
      <span class="h-4 w-5 shrink-0 border border-[var(--c-line-strong)] bg-[var(--c-disabled)]" aria-hidden="true"></span>
      <span class="text-[11.5px] font-bold leading-none text-[var(--c-muted)]">متوقف</span>
    {/if}
  </span>
</button>
