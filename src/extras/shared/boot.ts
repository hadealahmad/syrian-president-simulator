import { mount, type Component } from 'svelte';
import '../../app.css';
import './extras.css';
import { initTheme } from '../../lib/themes';

/**
 * Shared entry for every side game page (extras/*): same stylesheet, fonts
 * and persisted theme as the main game, then mount the page's root component.
 */
export function bootExtras(root: Component): void {
  initTheme();
  mount(root, { target: document.getElementById('app')! });
}
