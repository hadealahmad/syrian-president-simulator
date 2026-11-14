<script lang="ts">
  import type { Snippet } from 'svelte';
  import { focusTrap } from '../actions/focus-trap';
  import GameIcon from '../GameIcon.svelte';
  import './decrees-theme.css';

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
    <div
      class="absolute inset-0 flex items-center justify-center p-3 phone-p:items-end phone-p:justify-stretch phone-p:p-0 phone-l:items-end phone-l:p-2"
    >
      <button
        type="button"
        class="dialog-scrim absolute inset-0 cursor-default bg-[var(--c-bg)]/80"
        onclick={onclose}
        tabindex="-1"
        aria-label="إلغاء"
      ></button>

      <div
        class="dialog-card relative flex max-h-[calc(100dvh-24px)] w-full max-w-[430px] flex-col overflow-hidden border border-[var(--c-line-strong)] border-t-2 bg-[var(--c-bg)] font-arabic text-[var(--c-text)] phone-p:max-h-[82dvh] phone-p:max-w-none phone-p:border-x-0 phone-p:border-b-0 phone-l:max-h-[calc(100dvh-16px)] phone-l:max-w-[520px] {tone ===
        'danger'
          ? 'border-t-[var(--c-neg)]'
          : 'border-t-[var(--c-accent)]'}"
      >
        <header
          class="shrink-0 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-3 phone-l:py-2"
        >
          <div
            class="flex items-center gap-1.5 text-[11.5px] font-bold {tone === 'danger'
              ? 'text-[var(--c-neg)]'
              : 'text-[var(--c-accent)]'}"
          >
            <span
              class="h-px w-3 {tone === 'danger'
                ? 'bg-[var(--c-neg)]'
                : 'bg-[var(--c-accent)]'}"
            ></span>
            {kicker}
          </div>
          <h3 class="mt-0.5 text-[17px] font-bold leading-snug text-[var(--c-text)] phone-l:text-[15px]">
            {title}
          </h3>
        </header>

        <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[12.5px] phone-l:py-2">
          {@render children()}
        </div>

        <footer
          class="flex shrink-0 items-center justify-end gap-2.5 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))] phone-p:gap-3 phone-p:pt-3"
        >
          <button
            type="button"
            onclick={onclose}
            class="min-h-11 cursor-pointer border border-[var(--c-line-strong)] bg-transparent px-4 text-[12.5px] font-bold text-[var(--c-text)] hover:border-[var(--c-text)] phone-p:min-h-12 phone-p:px-5 phone-p:text-[13px]"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onclick={onconfirm}
            class="inline-flex min-h-11 items-center justify-center gap-2 px-4 text-[12.5px] font-bold phone-p:min-h-12 phone-p:flex-1 phone-p:text-[13px] {confirmDisabled
              ? 'cursor-not-allowed border border-dashed border-[var(--c-line-strong)] bg-transparent text-[var(--c-muted)]'
              : tone === 'danger'
                ? 'dialog-chamfer cursor-pointer border-0 bg-[var(--c-neg)] text-[var(--c-ink)]'
                : 'dialog-chamfer cursor-pointer border-0 bg-[var(--c-accent)] text-[var(--c-ink)]'}"
          >
            {#if !confirmDisabled}
              <GameIcon
                name={tone === 'danger' ? 'gavel' : 'scroll-quill'}
                cls="h-4 w-4 shrink-0"
              />
            {/if}
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  </dialog>
{/if}

<style>
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
    border-radius: 0;
    background: transparent;
    color: inherit;
    overflow: visible;
  }
  dialog.card-dialog::backdrop {
    background: transparent;
  }

  .dialog-chamfer {
    clip-path: polygon(0 12px, 12px 0, 100% 0, 100% 100%, 0 100%);
  }

  @media (prefers-reduced-motion: no-preference) {
    .dialog-scrim {
      animation: dialog-scrim-in 0.16s ease-out both;
    }
    .dialog-card {
      animation: dialog-card-in 0.18s ease-out both;
    }
    @media (max-width: 767px) and (orientation: portrait) {
      .dialog-card {
        animation: dialog-sheet-in 0.18s ease-out both;
      }
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
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes dialog-sheet-in {
    from {
      opacity: 0.7;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
</style>
