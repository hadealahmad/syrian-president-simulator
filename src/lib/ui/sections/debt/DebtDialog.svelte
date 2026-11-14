<script lang="ts">
  import type { Snippet } from 'svelte';
  import { focusTrap } from '../../actions/focus-trap';
  import GameIcon from '../../GameIcon.svelte';

  interface Props {
    open: boolean;
    title: string;
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
    kicker = 'تمويل طارئ',
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
    class="debt-dialog"
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
        class="absolute inset-0 cursor-default bg-[var(--c-bg)]/80"
        onclick={onclose}
        tabindex="-1"
        aria-label="إلغاء"
      ></button>

      <div
        class="relative flex max-h-[calc(100dvh-24px)] w-full max-w-[430px] flex-col overflow-hidden border bg-[var(--c-bg)] font-arabic text-[var(--c-text)] phone-p:max-h-[82dvh] phone-p:max-w-none phone-p:border-x-0 phone-p:border-b-0 phone-l:max-h-[calc(100dvh-16px)] phone-l:max-w-[520px] {tone ===
        'danger'
          ? 'border-[var(--c-neg)] border-t-2'
          : 'border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)]'}"
      >
        <header
          class="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-2.5"
        >
          <div class="min-w-0 flex-1">
            <div
              class="text-[11px] font-bold leading-[1.4] {tone === 'danger'
                ? 'text-[var(--c-neg)]'
                : 'text-[var(--c-accent)]'}"
            >
              {kicker}
            </div>
            <h3
              class="mt-0.5 font-heading text-[16px] font-bold leading-[1.4] text-[var(--c-text)]"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onclick={onclose}
            aria-label="إغلاق"
            class="pressable flex h-11 w-11 shrink-0 items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)]"
          >
            <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
          </button>
        </header>

        <div
          class="scroll-area min-h-0 flex-1 overflow-y-auto px-3.5 py-3 text-[12px] leading-[1.5]"
          data-autofocus
          tabindex="-1"
        >
          {@render children()}
        </div>

        <footer
          class="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onclick={onclose}
            class="kit-btn sec"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onclick={onconfirm}
            class={tone === 'danger'
              ? 'kit-btn danger phone-p:flex-1'
              : 'btn-primary-chamfer min-h-11 px-5 text-[12px] phone-p:flex-1'}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  </dialog>
{/if}

<style>
  dialog.debt-dialog {
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
  dialog.debt-dialog::backdrop {
    background: transparent;
  }
</style>
