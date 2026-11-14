import { get, writable } from 'svelte/store';
import { uiStore } from '../../stores/ui-store';
import { stopGuideTour } from '../guide-tour';

/**
 * Tracks whether the settings curtain was opened from the in-game top-bar
 * gear (as opposed to the initial opening title screen). When true, returning
 * from Settings closes back to the active game instead of showing the title.
 */
export const settingsOpenedInGame = writable<boolean>(false);

/**
 * Single entry point for opening the full-screen settings curtain.
 *
 * The old floating trio over the map is gone: the gear in the top bar and the
 * curtain's own controls now share this helper so the menu always opens in a
 * clean state and never stacks on top of a running guide tour.
 */
export function openSettingsMenu(): void {
  stopGuideTour();
  settingsOpenedInGame.set(get(uiStore).hasStartedGame);
  uiStore.setRestartModal(false);
  uiStore.setSettingsOpen(true);
}

export function clearSettingsEntrySource(): void {
  settingsOpenedInGame.set(false);
}
