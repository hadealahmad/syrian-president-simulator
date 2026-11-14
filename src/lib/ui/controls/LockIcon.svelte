<script lang="ts">
  interface Props {
    cls?: string;
  }
  let { cls = 'h-3.5 w-3.5 shrink-0' }: Props = $props();
</script>

<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="square"
  stroke-linejoin="miter"
  class={cls}
  aria-hidden="true"
>
  <rect x="5" y="11" width="14" height="10" />
  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  <path d="M12 15v2" />
</svg>
