/**
 * Accessible modal focus management (one place, reused by every dialog we own).
 *
 * A blocking overlay used to leave the game shell keyboard-reachable: a
 * keyboard-only player could Tab to the (visually hidden) end-turn control
 * beneath the fail screen and keep playing. This action moves focus into the
 * dialog on mount, traps Tab/Shift+Tab inside it, and restores the previously
 * focused element on close. Pair it with role="dialog", aria-modal="true" and
 * an aria-label on the dialog element.
 */
const FOCUSABLE =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  'textarea:not([disabled]), button:not([disabled]), iframe, object, embed, ' +
  '[contenteditable="true"], [tabindex]:not([tabindex="-1"])';

export interface FocusTrapOptions {
  /** Trapping can be switched off while the dialog is inert (e.g. behind a
      higher alert modal). */
  enabled?: boolean;
}

export function focusTrap(
  node: HTMLElement,
  options: FocusTrapOptions = {}
): { update: (next: FocusTrapOptions) => void; destroy: () => void } {
  let enabled = options.enabled ?? true;
  const previouslyFocused =
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
  let frame = 0;

  function getFocusable(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) =>
        el.getAttribute('aria-hidden') !== 'true' &&
        (el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el.getClientRects().length > 0 ||
          el === document.activeElement)
    );
  }

  function focusFirst(): void {
    const target = node.querySelector<HTMLElement>('[data-autofocus]') ?? getFocusable()[0];
    if (target) {
      target.focus();
      return;
    }
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
    node.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!enabled || event.key !== 'Tab') return;
    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
      node.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeEl = document.activeElement as HTMLElement | null;
    const inside = activeEl ? node.contains(activeEl) : false;
    if (event.shiftKey) {
      if (!inside || activeEl === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (!inside || activeEl === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function activate(): void {
    document.addEventListener('keydown', onKeydown, true);
    // Wait one frame so the dialog's reactive content exists before focusing.
    frame = requestAnimationFrame(focusFirst);
  }

  function deactivate(): void {
    document.removeEventListener('keydown', onKeydown, true);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  activate();

  return {
    update(next: FocusTrapOptions) {
      const nextEnabled = next.enabled ?? true;
      if (nextEnabled === enabled) return;
      enabled = nextEnabled;
      if (enabled) activate();
      else deactivate();
    },
    destroy() {
      deactivate();
      if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
    },
  };
}
