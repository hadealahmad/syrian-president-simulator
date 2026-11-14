<script lang="ts">
  import { shellLayout } from '../shell/viewport';

  interface Props {
    keys: string;
    tone?: 'dark' | 'accent' | 'neg';
    class?: string;
  }

  let { keys, tone = 'dark', class: className = '' }: Props = $props();
  let isDesktop = $derived($shellLayout === 'desktop');
</script>

{#if isDesktop}
  <kbd
    data-flow-kbd
    aria-hidden="true"
    dir="ltr"
    class="flow-kbd num inline-flex shrink-0 items-center justify-center border px-1.5 py-[1px] font-arabic text-[10.5px] font-bold leading-[1.35] {tone === 'accent'
      ? 'border-[var(--c-ink)]/40 bg-[var(--c-ink)]/12 text-[var(--c-ink)]'
      : tone === 'neg'
        ? 'border-[var(--c-ink)]/40 bg-[var(--c-ink)]/12 text-[var(--c-ink)]'
        : 'border-[var(--c-line-strong)] bg-[var(--c-strip)] text-[var(--c-text-2)]'} {className}"
  >
    {keys}
  </kbd>
{/if}

<style>
  .flow-kbd {
    border-radius: 0;
  }
  @media (max-width: 767px) and (orientation: portrait), (max-height: 500px) and (orientation: landscape) {
    .flow-kbd {
      display: none !important;
    }
  }
</style>
