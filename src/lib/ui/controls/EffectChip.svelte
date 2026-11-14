<script module lang="ts">
  export type EffectTone = 'good' | 'bad' | 'neutral' | 'warn';
</script>

<script lang="ts">
  import './econ-plates.css';
  import { splitBidiTokens } from './bidi';
  import GameIcon from '../GameIcon.svelte';

  interface Props {
    /** Full chip text. Takes precedence over label/value. */
    text?: string;
    /** Optional label when using the numeric shorthand. */
    label?: string;
    /** Optional numeric value; rendered with an Arabic-friendly +/− prefix. */
    value?: number;
    tone?: EffectTone;
    /** Overrides the default good/bad glyph. Pass '' to hide the icon. */
    icon?: string;
    class?: string;
  }

  let {
    text,
    label = '',
    value,
    tone = 'neutral',
    icon = undefined,
    class: className = '',
  }: Props = $props();

  let body = $derived.by(() => {
    if (text !== undefined) return text;
    if (value === undefined) return label;
    const sign = value > 0 ? '+' : value < 0 ? '−' : '';
    const amount = Math.abs(value).toLocaleString('en-US');
    return `${label} ${sign}${amount}`.trim();
  });

  let segments = $derived(splitBidiTokens(body));

  let glyph = $derived(
    icon === undefined ? (tone === 'good' ? 'check-mark' : tone === 'bad' ? 'cross-mark' : '') : icon
  );

  let toneClass = $derived(
    tone === 'good'
      ? 'border-transparent bg-[var(--c-chip-bg)] text-[var(--c-pos)]'
      : tone === 'bad'
        ? 'border-transparent bg-[var(--c-chip-bg)] text-[var(--c-neg)]'
        : tone === 'warn'
          ? 'border-transparent bg-[var(--c-chip-bg)] text-[var(--c-accent)]'
          : 'border-transparent bg-[var(--c-chip-bg)] text-[var(--c-text-2)]'
  );
</script>

<span
  class="game-chip inline-flex max-w-full items-center gap-1 border px-1.5 py-0.5 font-arabic text-[11px] font-bold leading-[1.4] num {toneClass} {className}"
  title={body}
>
  {#if glyph}
    <GameIcon name={glyph} cls="h-3 w-3 shrink-0" />
  {/if}
  <span class="min-w-0">
    {#each segments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
  </span>
</span>
