import { writable } from 'svelte/store';
import { THEME_IDS, applyTheme, initTheme, type ThemeId } from '../themes';

function createThemeStore() {
  const { subscribe, set, update } = writable<ThemeId>(initTheme());

  return {
    subscribe,
    /** Switch to a specific theme (applies + persists). */
    setTheme: (id: ThemeId) => {
      applyTheme(id);
      set(id);
    },
    /** Cycle through all registered themes (used by the deck toggle button). */
    cycle: () => {
      update((current) => {
        const next = THEME_IDS[(THEME_IDS.indexOf(current) + 1) % THEME_IDS.length] ?? 'default';
        applyTheme(next);
        return next;
      });
    },
  };
}

export const theme = createThemeStore();
