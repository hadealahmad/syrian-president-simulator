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
  <path d="M6 3h12" />
  <path d="M6 21h12" />
  <path d="M7 3v4l5 5 5-5V3" />
  <path d="M7 21v-4l5-5 5 5v4" />
</svg>
