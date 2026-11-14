<script lang="ts">
  import { onMount } from 'svelte';
  import { uiStore } from '../stores/ui-store';
  import { startNewGame } from '../stores/new-game';
  import { focusTrap } from './actions/focus-trap';
  import GameIcon from './GameIcon.svelte';
  import { fx } from './fx/feedback';
  import { shellLayout } from './shell/viewport';
  import KbdHint from './flow/KbdHint.svelte';
  import './flow/flow-desktop.css';

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  function handleConfirm(): void {
    fx('confirm');
    startNewGame();
    uiStore.setRestartModal(false);
    uiStore.markGameStarted();
  }

  function handleCancel(): void {
    fx('cancel');
    uiStore.setRestartModal(false);
  }

  function onCaptureKey(e: KeyboardEvent): void {
    if (!$uiStore.isRestartModalOpen) return;
    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleCancel();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  });
</script>

{#if $uiStore.isRestartModalOpen}
  <div
    class="pointer-events-auto fixed inset-0 z-[160] flex select-none items-center justify-center bg-[rgb(from_var(--c-bg)_r_g_b/0.88)] p-4 font-arabic {isDesktop ? 'flow-desktop' : ''}"
    dir="rtl"
  >
    <div
      use:focusTrap
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label="تأكيد إعادة تشغيل المحاكاة"
      class="modal-confirm-enter w-full overflow-hidden border border-[var(--c-neg)] border-t-2 border-t-[var(--c-neg)] bg-[var(--c-bg)] text-[var(--c-text)] {isDesktop ? 'max-w-[460px]' : 'max-w-[420px]'}"
    >
      <div class="flex items-center gap-2.5 border-b border-[var(--c-line)] bg-[var(--c-ev-bg)] {isDesktop ? 'px-[var(--flow-pad-x)] py-3' : 'px-4 py-3'}">
        <GameIcon name="cycle" cls="h-4 w-4 shrink-0 text-[var(--c-neg)]" />
        <div>
          <span class="block font-bold text-[var(--c-neg)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[11px]'}">إجراء لا رجعة فيه</span>
          <h2 class="font-heading font-bold text-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-md)]' : 'text-[16px]'}">
            تأكيد إعادة تشغيل المحاكاة
          </h2>
        </div>
      </div>

      <div class="{isDesktop ? 'p-[var(--flow-pad-x)]' : 'p-4'}">
        <p class="border border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-3 leading-[1.65] text-[var(--c-text-2)] {isDesktop ? 'text-[var(--flow-fs-sm)]' : 'text-[13px]'}">
          ستفقد كلّ التقدم الذي أجريته في اللعبة، وستعود الدولة إلى الدور الأول.
        </p>
      </div>

      <footer class="flex flex-col gap-2 border-t border-[var(--c-line)] bg-[var(--c-panel)] sm:flex-row sm:items-center sm:justify-end {isDesktop ? 'px-[var(--flow-pad-x)] py-3' : 'px-4 py-3'}">
        <button
          data-autofocus
          type="button"
          onclick={handleCancel}
          style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
          class="kit-btn sec gap-2 min-h-11 px-4 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
        >
          <span>إلغاء ومتابعة اللعبة</span>
          <KbdHint keys="Esc" />
        </button>
        <button
          type="button"
          onclick={handleConfirm}
          style={isDesktop ? 'min-height: var(--flow-btn-h);' : ''}
          class="btn-primary-chamfer pressable min-h-11 bg-[var(--c-neg)] px-5 text-[13.5px] font-bold text-[var(--c-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
        >
          تأكيد إعادة البدء
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  @media (prefers-reduced-motion: no-preference) {
    @keyframes restart-pop-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-confirm-enter {
      animation: restart-pop-in 0.16s ease-out both;
    }
  }
</style>

