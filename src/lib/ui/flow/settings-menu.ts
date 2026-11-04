import { uiStore } from '../../stores/ui-store';
import { stopGuideTour } from '../guide-tour';

/**
 * Single entry point for opening the full-screen settings curtain.
 *
 * The old floating trio over the map is gone: the gear in the top bar and the
 * curtain's own controls now share this helper so the menu always opens in a
 * clean state and never stacks on top of a running guide tour.
 */
export function openSettingsMenu(): void {
  stopGuideTour();
  uiStore.setRestartModal(false);
  uiStore.setSettingsOpen(true);
}
