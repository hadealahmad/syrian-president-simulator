<script lang="ts">
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

<!-- 44×44 hit area; the visible track stays compact inside it. -->
<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  disabled={disabled}
  onclick={() => {
    if (!disabled) onchange?.(!checked);
  }}
  class="group relative inline-flex h-11 w-14 shrink-0 items-center justify-center focus-visible:outline-none {disabled
    ? 'cursor-not-allowed opacity-50'
    : 'cursor-pointer'}"
>
  <span
    class="relative block h-7 w-12 overflow-hidden rounded-full border transition-colors {checked
      ? 'border-forest-accent bg-forest-mid'
      : 'border-charcoal-mid bg-charcoal-surface'} group-focus-visible:ring-2 group-focus-visible:ring-wheat-gold/70"
  >
    <span
      class="absolute top-1/2 block h-5 w-5 -translate-y-1/2 rounded-full shadow transition-all {checked
        ? 'bg-forest-accent'
        : 'bg-wheat-dark'}"
      style="{checked ? 'inset-inline-end: 2px;' : 'inset-inline-start: 2px;'}"
    ></span>
  </span>
</button>
