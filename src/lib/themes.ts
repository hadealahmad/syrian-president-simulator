// ─── Theming engine: single source of truth ────────────────────────────────
// The actual color VALUES live once in `src/app.css` as CSS custom properties
// (`:root` / `:root[data-theme="<id>"]`). This module is the registry that
// names the available themes and offers tiny helpers to apply them and to
// read the live values back from CSS (so canvas/SVG code computed in JS can
// never drift out of sync with the stylesheet).
//
// HOW TO ADD A NEW THEME (only 3 steps):
//   1. Add the id to `ThemeId` and a `{ labelAr, labelEn, hint, swatches }`
//      entry below (swatches = key hexes shown in the theme picker).
//   2. Add a `:root[data-theme="<id>"] { ... }` block in `src/app.css`
//      overriding every `--color-*` / `--map-*` variable (copy the `mono`
//      block as a template). No Svelte file needs to change.

export type ThemeId = 'default' | 'mono';

export interface ThemeMeta {
  id: ThemeId;
  /** Arabic label shown in the UI switcher. */
  labelAr: string;
  /** English label (docs / devtools). */
  labelEn: string;
  /** Short description of the palette intent. */
  hint: string;
  /**
   * Key colors shown as preview squares in the theme picker.
   * These depict (possibly inactive) themes, so they are stored here rather
   * than read from live CSS — keep them in sync with the theme's
   * `:root[data-theme="<id>"]` block in `src/app.css` when editing a palette.
   */
  swatches: string[];
}

export const THEMES: Record<ThemeId, ThemeMeta> = {
  default: {
    id: 'default',
    labelAr: 'الافتراضي',
    labelEn: 'Default',
    hint: 'Forest & wheat institutional palette (current game look).',
    swatches: ['#0a1b18', '#1a453e', '#4ec7b4', '#f2cf77', '#f87171'],
  },
  mono: {
    id: 'mono',
    labelAr: 'أسود وأبيض',
    labelEn: 'Black & White',
    hint: 'Test theme: grayscale UI chrome + pure red/blue/green/yellow status colors.',
    swatches: ['#000000', '#ffffff', '#ffe600', '#ff0000', '#2b7fff'],
  },
};

export const THEME_IDS: ThemeId[] = (Object.keys(THEMES) as ThemeId[]);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES;
}

export const THEME_STORAGE_KEY = 'president-theme-v1';

/** Apply a theme by stamping `data-theme` on `<html>` + persisting the choice. */
export function applyTheme(id: ThemeId): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = id;
  }
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* private-mode storage — theme still applies for this session */
  }
}

/** Read the persisted theme (falls back to `default`). No DOM side effects. */
export function storedTheme(): ThemeId {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeId(raw)) return raw;
    }
  } catch {
    /* ignore */
  }
  return 'default';
}

/**
 * Call once before first paint (see the inline script in `index.html` and
 * `src/main.ts`). Returns the active theme id.
 */
export function initTheme(): ThemeId {
  const id = storedTheme();
  applyTheme(id);
  return id;
}

// ─── Live CSS-variable readers (JS-computed colors) ─────────────────────────
// Everything rendered through Tailwind classes or `var(--…)` in CSS updates
// automatically on theme switch. Only colors computed in JS (map health ramp,
// SVG fills passed as props) need these: they resolve the CURRENT value of
// the variable, so there is exactly one definition per color (in app.css).

/** Read a CSS custom property from `<html>`, e.g. `cssVar('--map-ok', '#3fb950')`. */
export function cssVar(name: string, fallback: string): string {
  try {
    if (typeof window !== 'undefined') {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (v) return v;
    }
  } catch {
    /* fall through to fallback */
  }
  return fallback;
}

/** Parse a `"r g b"` triplet variable (see `--map-ramp-*` in app.css). */
export type RgbTriplet = [number, number, number];

export function cssRgbTriplet(name: string, fallback: RgbTriplet): RgbTriplet {
  const raw = cssVar(name, '');
  if (!raw) return fallback;
  const parts = raw
    .split(/[\s,]+/)
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n));
  if (parts.length < 3) return fallback;
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  return [clamp(parts[0]), clamp(parts[1]), clamp(parts[2])];
}

/** Status colors for the active theme (map glyphs, JS-driven badges, …). */
export function themeStatusColors(): { ok: string; warn: string; danger: string; info: string } {
  return {
    ok: cssVar('--map-ok', '#3fb950'),
    warn: cssVar('--map-warn', '#f5d547'),
    danger: cssVar('--map-danger', '#ce1126'),
    info: cssVar('--status-info', '#58a6ff'),
  };
}
