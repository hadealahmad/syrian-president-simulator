<script module lang="ts">
  export type EffectTone = 'good' | 'bad' | 'neutral';
</script>

<script lang="ts">
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

  let glyph = $derived(
    icon === undefined ? (tone === 'good' ? 'check-mark' : tone === 'bad' ? 'cross-mark' : '') : icon
  );

  let toneClass = $derived(
    tone === 'good'
      ? 'border-forest-accent/40 bg-forest-mid text-forest-accent'
      : tone === 'bad'
        ? 'border-umber-border/60 bg-umber-deep text-umber-crimson'
        : 'border-charcoal-mid bg-charcoal-surface text-wheat-mid'
  );
</script>

<span
  class="inline-flex max-w-full items-center gap-1 border px-1.5 py-0.5 font-mono text-[8.5px] font-bold leading-tight {toneClass} {className}"
  title={body}
>
  {#if glyph}
    <GameIcon name={glyph} cls="h-2.5 w-2.5 shrink-0" />
  {/if}
  <span class="min-w-0">{body}</span>
</span>
