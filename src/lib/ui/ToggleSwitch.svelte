<script lang="ts">
  import './controls/econ-plates.css';
  import { triggerFx } from './controls/feedback-bridge';

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
</script>

<!-- 44×44+ hit area; flat square tactical switch. -->
<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  disabled={disabled}
  onclick={() => {
    if (!disabled) {
      triggerFx('select');
      onchange?.(!checked);
    }
  }}
  class="pressable group relative inline-flex h-11 w-14 shrink-0 items-center justify-center focus-visible:outline-none {disabled
    ? 'cursor-not-allowed opacity-50'
    : 'cursor-pointer'}"
>
  <span
    class="relative block h-6 w-12 overflow-hidden border {checked
      ? 'border-[var(--c-accent)] bg-[var(--c-chip-bg)]'
      : 'border-[var(--c-line-strong)] bg-[var(--c-bg)]'} group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-[var(--c-accent)]"
  >
    <span
      class="absolute top-1/2 block h-4 w-5 -translate-y-1/2 border {checked
        ? 'border-[var(--c-ink)] bg-[var(--c-accent)]'
        : 'border-[var(--c-line)] bg-[var(--c-muted)]'}"
      style="{checked ? 'inset-inline-end: 2px;' : 'inset-inline-start: 2px;'}"
    ></span>
  </span>
</button>
