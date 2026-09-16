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

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  disabled={disabled}
  onclick={() => {
    if (!disabled) onchange?.(!checked);
  }}
  class="relative h-6 w-11 shrink-0 rounded-full border transition-colors {checked
    ? 'bg-forest-mid border-forest-accent'
    : 'bg-charcoal-surface border-charcoal-mid'} {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
>
  <span
    class="absolute top-[2px] h-[18px] w-[18px] rounded-full transition-all {checked
      ? 'left-[2px] bg-forest-accent shadow'
      : 'left-[22px] bg-wheat-dark'}"
  ></span>
</button>
