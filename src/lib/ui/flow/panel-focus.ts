/**
 * Focus entry & restoration helper for non-modal docked panels and focus banners
 * that should receive keyboard focus on mount and return focus to the
 * triggering element on unmount (unless navigation moved elsewhere).
 */
const FOCUSABLE =
  'a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  'textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface PanelFocusOptions {
  enabled?: boolean;
  shouldRestore?: () => boolean;
}

export function panelFocus(
  node: HTMLElement,
  options: PanelFocusOptions = {},
): { update: (next: PanelFocusOptions) => void; destroy: () => void } {
  let enabled = options.enabled ?? true;
  let shouldRestore = options.shouldRestore ?? (() => true);
  let previouslyFocused: HTMLElement | null = null;
  let frame = 0;

  function focusEntry(): void {
    if (!enabled) return;
    previouslyFocused =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    frame = requestAnimationFrame(() => {
      if (!node.isConnected) return;
      const target =
        node.querySelector<HTMLElement>('[data-autofocus]') ??
        node.querySelector<HTMLElement>(FOCUSABLE);
      if (target) {
        target.focus({ preventScroll: true });
      } else {
        if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
        node.focus({ preventScroll: true });
      }
    });
  }

  function restore(): void {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    if (
      previouslyFocused &&
      previouslyFocused.isConnected &&
      shouldRestore() &&
      (!document.activeElement ||
        document.activeElement === document.body ||
        node.contains(document.activeElement))
    ) {
      previouslyFocused.focus({ preventScroll: true });
    }
    previouslyFocused = null;
  }

  if (enabled) focusEntry();

  return {
    update(next: PanelFocusOptions) {
      shouldRestore = next.shouldRestore ?? (() => true);
      const nextEnabled = next.enabled ?? true;
      if (nextEnabled === enabled) return;
      enabled = nextEnabled;
      if (enabled) focusEntry();
      else restore();
    },
    destroy() {
      restore();
    },
  };
}
