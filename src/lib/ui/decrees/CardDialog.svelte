<script lang="ts">
  import type { Snippet } from 'svelte';
  import { focusTrap } from '../actions/focus-trap';
  import GameIcon from '../GameIcon.svelte';

  interface Props {
    open: boolean;
    title: string;
    /** Accessible dialog name; falls back to the visible title. */
    ariaLabel?: string;
    kicker?: string;
    confirmLabel: string;
    confirmDisabled?: boolean;
    onconfirm: () => void;
    onclose: () => void;
    tone?: 'gold' | 'danger';
    children: Snippet;
  }

  let {
    open,
    title,
    ariaLabel = '',
    kicker = 'قرار رئاسي',
    confirmLabel,
    confirmDisabled = false,
    onconfirm,
    onclose,
    tone = 'gold',
    children,
  }: Props = $props();

  let dialogEl: HTMLDialogElement | undefined = $state();

  // A native <dialog> lives in the browser top layer, so the fixed-position
  // sheet (whose entrance animation establishes a containing block) can never
  // clip it or re-anchor it to the drawer.
  $effect(() => {
    if (!dialogEl) return;
    if (open && !dialogEl.open) dialogEl.showModal();
    else if (!open && dialogEl.open) dialogEl.close();
  });
</script>

{#if open}
  <dialog
    bind:this={dialogEl}
    class="card-dialog"
    aria-modal="true"
    aria-label={ariaLabel || title}
    use:focusTrap
    oncancel={(event) => {
      event.preventDefault();
      onclose();
    }}
  >
    <div class="absolute inset-0 flex items-center justify-center p-3">
      <button
        type="button"
        class="dialog-scrim absolute inset-0 cursor-default bg-charcoal-deep/70"
        onclick={onclose}
        tabindex="-1"
        aria-label="إلغاء"
      ></button>

      <div
        class="dialog-card relative flex max-h-[calc(100dvh-24px)] w-full max-w-[430px] flex-col overflow-hidden border bg-forest-deep font-arabic text-wheat-light shell-round-pop {tone ===
        'danger'
          ? 'border-umber-border/70'
          : 'border-wheat-mid/40'}"
        style="box-shadow: 0 30px 80px rgb(0 0 0 / 0.6);"
      >
        <header class="shrink-0 border-b border-wheat-mid/15 px-4 py-3">
          <div class="flex items-center gap-1.5 text-[8px] tracking-[1.6px] text-forest-accent">
            <span class="h-px w-3 bg-forest-accent/60"></span>
            {kicker}
          </div>
          <h3 class="mt-1 font-heading text-[16px] leading-snug text-wheat-gold">{title}</h3>
        </header>

        <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {@render children()}
        </div>

        <footer
          class="flex shrink-0 justify-end gap-2 border-t border-wheat-mid/15 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onclick={onclose}
            class="min-h-11 border border-charcoal-mid bg-charcoal-surface px-4 text-xs font-bold text-wheat-mid transition-colors hover:border-charcoal-light hover:text-wheat-light focus-visible:border-wheat-gold focus-visible:outline-none font-heading"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onclick={onconfirm}
            class="inline-flex min-h-11 items-center gap-1.5 border px-4 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wheat-gold font-heading {confirmDisabled
              ? 'cursor-not-allowed border-charcoal-mid bg-charcoal-surface text-wheat-dark opacity-60'
              : 'cursor-pointer border-wheat-gold bg-wheat-gold text-forest-deep hover:bg-wheat-light'}"
          >
            {#if !confirmDisabled}
              <GameIcon name="scroll-quill" cls="h-3.5 w-3.5 shrink-0" />
            {/if}
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  </dialog>
{/if}

<style>
  /* Full-viewport, transparent top-layer host: the inner overlay paints the
     scrim and centres the 430px card. */
  dialog.card-dialog {
    position: fixed;
    inset: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    overflow: visible;
  }
  dialog.card-dialog::backdrop {
    background: transparent;
  }

  @media (prefers-reduced-motion: no-preference) {
    .dialog-scrim {
      animation: dialog-scrim-in 0.2s ease-out both;
    }
    .dialog-card {
      animation: dialog-card-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
  }
  @keyframes dialog-scrim-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes dialog-card-in {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
</style>
