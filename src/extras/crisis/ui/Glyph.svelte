<script lang="ts">
  import { CRISIS_GLYPHS } from '../glyphs';

  let {
    name,
    size,
    cls = 'w-5 h-5 shrink-0',
    label,
  }: {
    name: string;
    size?: number | string;
    cls?: string;
    label?: string;
  } = $props();

  const glyph = $derived(CRISIS_GLYPHS[name] ?? CRISIS_GLYPHS['power']);
</script>

<svg
  class={cls}
  width={size}
  height={size}
  viewBox={glyph.vb}
  fill="currentColor"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {@html glyph.body}
</svg>
