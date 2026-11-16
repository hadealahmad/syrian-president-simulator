import type { ComponentProps } from 'svelte';
import { loadJSON, removeKey, saveJSON } from '../shared/storage';
import { SAVE_KEY } from './engine/engine';
import { METER_IDS, type DossierState, type MeterId } from './engine/types';
import type GameIcon from '../../lib/ui/GameIcon.svelte';

export type DossierIconName = ComponentProps<typeof GameIcon>['name'];

export interface MeterMeta {
  id: MeterId;
  label: string;
  icon: DossierIconName;
  strokeColor: string;
  dashArray: string;
}

export const METER_META: Record<MeterId, MeterMeta> = {
  treasury: {
    id: 'treasury',
    label: 'الخزينة',
    icon: 'banknote',
    strokeColor: 'var(--c-accent)',
    dashArray: 'none',
  },
  trust: {
    id: 'trust',
    label: 'الثقة',
    icon: 'meeple-group',
    strokeColor: 'var(--c-pos)',
    dashArray: '7 3',
  },
  security: {
    id: 'security',
    label: 'الأمن',
    icon: 'checked-shield',
    strokeColor: 'var(--dos-security, #6f97c4)',
    dashArray: '2.5 3',
  },
  sovereignty: {
    id: 'sovereignty',
    label: 'السيادة',
    icon: 'stone-throne',
    strokeColor: 'var(--dos-sovereignty, #b39ad6)',
    dashArray: '9 3 2.5 3',
  },
};

export function pad2(n: number): string {
  return String(Math.max(0, Math.trunc(n))).padStart(2, '0');
}

export function formatSigned(delta: number): string {
  const abs = Math.abs(Math.round(delta));
  if (delta > 0) return `+${abs}`;
  if (delta < 0) return `\u2212${abs}`;
  return '0';
}

export function isValidDossierSave(raw: unknown): raw is DossierState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Partial<DossierState>;
  if (s.version !== 1) return false;
  if (typeof s.turn !== 'number' || s.turn < 1 || s.turn > 40) return false;
  if (s.fileInTurn !== 1 && s.fileInTurn !== 2) return false;
  if (typeof s.year !== 'number') return false;
  if (s.season !== 'H1_HARVEST' && s.season !== 'H2_WINTER') return false;
  if (!s.meters || typeof s.meters !== 'object') return false;
  for (const k of METER_IDS) {
    if (typeof s.meters[k] !== 'number' || !Number.isFinite(s.meters[k])) return false;
  }
  if (!s.rng || typeof s.rng.seed !== 'number') return false;
  if (!Array.isArray(s.decrees) || !Array.isArray(s.history) || !Array.isArray(s.drawnIds)) {
    return false;
  }
  if (s.isGameOver) return false;
  if (typeof s.currentCardId !== 'string' || !s.currentCardId) return false;
  return true;
}

import { DOSSIER_DECK } from './content';
import { hydrateLoadedDossierRunMeta } from './records/store';

export function loadSavedDossier(): DossierState | null {
  const parsed = loadJSON<unknown>(SAVE_KEY);
  if (!isValidDossierSave(parsed)) return null;
  if (hydrateLoadedDossierRunMeta(parsed, DOSSIER_DECK)) {
    saveJSON(SAVE_KEY, parsed);
  }
  return parsed;
}

export function saveDossier(state: DossierState): void {
  if (state.isGameOver) {
    removeKey(SAVE_KEY);
    return;
  }
  saveJSON(SAVE_KEY, state);
}

export function clearSavedDossier(): void {
  removeKey(SAVE_KEY);
}

/** Large faded watermark glyph for a file, chosen from its first themed tag. */
const TAG_GLYPH: Record<string, string> = {
  energy: 'grid-engineer',
  agriculture: 'cat-food',
  food: 'bread-queue',
  monetary: 'cat-money',
  economy: 'speculation',
  trade: 'smuggling-ring',
  industry: 'emergency-crew',
  infrastructure: 'substation',
  environment: 'drought',
  services: 'medic',
  security: 'cat-security',
  sovereignty: 'central-bank',
  trust: 'committee',
};

export function fileGlyphKey(tags: readonly string[]): string {
  for (const t of tags) if (TAG_GLYPH[t]) return TAG_GLYPH[t];
  return 'node-event';
}
