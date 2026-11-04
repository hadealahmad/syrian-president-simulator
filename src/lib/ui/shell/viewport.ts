import { readable } from 'svelte/store';

/**
 * Shell layout class, matching the two `app.css` custom variants.
 *
 * - `phone-p`: portrait phone — `(max-width: 767px) and (orientation: portrait)`
 * - `phone-l`: landscape phone — `(max-height: 500px) and (orientation: landscape)`
 * - `desktop`: everything else (desktop/tablet or unknown/SSR)
 */
export type ShellLayout = 'desktop' | 'phone-p' | 'phone-l';

const PORTRAIT_QUERY = '(max-width: 767px) and (orientation: portrait)';
const LANDSCAPE_QUERY = '(max-height: 500px) and (orientation: landscape)';

function currentLayout(): ShellLayout {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  if (window.matchMedia(PORTRAIT_QUERY).matches) return 'phone-p';
  if (window.matchMedia(LANDSCAPE_QUERY).matches) return 'phone-l';
  return 'desktop';
}

/** Reactive shell layout. Components use `$shellLayout`. */
export const shellLayout = readable<ShellLayout>(currentLayout(), (set) => {
  if (typeof window === 'undefined' || !window.matchMedia) return;

  const portrait = window.matchMedia(PORTRAIT_QUERY);
  const landscape = window.matchMedia(LANDSCAPE_QUERY);
  const update = (): void => set(currentLayout());

  portrait.addEventListener('change', update);
  landscape.addEventListener('change', update);
  // Orientation changes do not always fire both media queries in every
  // browser; resize is a cheap safety net.
  window.addEventListener('resize', update);

  return () => {
    portrait.removeEventListener('change', update);
    landscape.removeEventListener('change', update);
    window.removeEventListener('resize', update);
  };
});
