<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * Thin top bar shared by side games, matching the main game's TopBar:
   * hairline bottom rule, title on the start side, a back control on the end side.
   * `children` renders game stats between the two.
   */
  let {
    title,
    backHref = '../index.html',
    backLabel = 'الألعاب',
    onBack,
    children,
  }: {
    title: string;
    backHref?: string;
    backLabel?: string;
    /** When set, the back control is a button calling this instead of a link. */
    onBack?: () => void;
    children?: Snippet;
  } = $props();
</script>

<header class="flex min-h-[52px] shrink-0 items-stretch border-b border-[var(--c-line)] bg-[var(--c-strip)]">
  <div class="flex shrink-0 items-center px-3 sm:px-4">
    <h1 class="font-heading text-[16px] font-bold leading-tight text-[var(--c-text)] sm:text-[18px]">{title}</h1>
  </div>
  <div class="flex min-w-0 flex-1 items-stretch">
    {@render children?.()}
  </div>
  {#if onBack}
    <button
      type="button"
      onclick={onBack}
      class="pressable flex min-w-[52px] shrink-0 items-center justify-center gap-1 border-s border-[var(--c-line)] px-3 text-[13px] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
    >
      <span>{backLabel}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
    </button>
  {:else}
    <a
      href={backHref}
      class="pressable flex min-w-[52px] shrink-0 items-center justify-center gap-1 border-s border-[var(--c-line)] px-3 text-[13px] font-medium text-[var(--c-muted)] no-underline hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
    >
      <span>{backLabel}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
    </a>
  {/if}
</header>
