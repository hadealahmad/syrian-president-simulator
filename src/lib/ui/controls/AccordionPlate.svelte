<script lang="ts">
  import type { Snippet } from 'svelte';
  import './econ-plates.css';
  import { splitBidiTokens } from './bidi';
  import GameIcon from '../GameIcon.svelte';
  import { triggerFx } from './feedback-bridge';

  interface Props {
    title: string;
    icon: string;
    summary: string;
    open: boolean;
    ontoggle: () => void;
    highlighted?: boolean;
    dimmed?: boolean;
    children: Snippet;
  }

  let {
    title,
    icon,
    summary,
    open,
    ontoggle,
    highlighted = false,
    dimmed = false,
    children,
  }: Props = $props();

  let summarySegments = $derived(splitBidiTokens(summary));
</script>

<section
  class="game-plate overflow-hidden {highlighted
    ? 'border-[var(--c-accent)]'
    : ''} {dimmed ? 'opacity-40' : ''}"
>
  <button
    type="button"
    onclick={() => {
      triggerFx('tap');
      ontoggle();
    }}
    aria-expanded={open}
    class="pressable flex min-h-12 w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-start hover:bg-[var(--c-chip-bg)]"
  >
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-bg)] text-wheat-gold"
    >
      <GameIcon name={icon} cls="h-4 w-4" />
    </span>

    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-1.5">
        <span class="font-heading text-[13px] font-bold leading-[1.4] text-wheat-light">
          {title}
        </span>
        {#if highlighted}
          <span
            class="h-1.5 w-1.5 shrink-0 bg-wheat-gold"
            aria-hidden="true"
          ></span>
        {/if}
      </span>
      <span class="num mt-0.5 block truncate text-[11px] font-medium leading-[1.4] text-wheat-mid">
        {#each summarySegments as seg}{#if seg.ltr}<bdi dir="ltr">{seg.text}</bdi>{:else}{seg.text}{/if}{/each}
      </span>
    </span>

    <span
      class="flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-bg)] font-heading text-[13px] font-bold text-wheat-gold"
      aria-hidden="true"
    >
      {open ? '−' : '+'}
    </span>
  </button>

  {#if open}
    <div class="space-y-2 border-t border-[var(--c-line)] bg-[var(--c-bg)] p-2">
      {@render children()}
    </div>
  {/if}
</section>
