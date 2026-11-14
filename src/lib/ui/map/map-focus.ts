import { writable } from 'svelte/store';

export interface MapFocusTarget {
  govId: string;
  tone: 'crisis';
}

export const mapFocus = writable<MapFocusTarget | null>(null);

export function focusGovernorate(govId: string): void {
  mapFocus.set({ govId, tone: 'crisis' });
}

export function clearMapFocus(): void {
  mapFocus.set(null);
}
