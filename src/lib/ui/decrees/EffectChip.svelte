<script lang="ts">
  import type { EffectTone } from './decree-meta';

  interface Props {
    text: string;
    tone?: EffectTone;
    cls?: string;
  }

  let { text, tone = 'neutral', cls = '' }: Props = $props();

  // A leading sign/digit would otherwise be re-ordered by the RTL paragraph
  // (the minus would jump to the far edge). LRM anchors the numeric run.
  let shown = $derived(/^[+\u2212-]/.test(text) ? `\u200E${text}` : text);

  const TONE_CLASS: Record<EffectTone, string> = {
    good: 'bg-forest-mid border-forest-accent/40 text-forest-accent',
    bad: 'bg-umber-deep border-umber-border text-umber-crimson',
    neutral: 'bg-charcoal-surface border-charcoal-mid text-wheat-mid',
    warn: 'bg-umber-deep border-status-warn/40 text-status-warn',
  };
</script>

<span
  class="inline-flex items-center whitespace-nowrap border px-1.5 py-px text-[8.5px] font-bold leading-[1.6] shell-round-chip {TONE_CLASS[
    tone
  ]} {cls}"
>
  {shown}
</span>
