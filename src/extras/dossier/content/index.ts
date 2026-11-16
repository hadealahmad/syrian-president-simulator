import type { DossierCard } from '../engine/types';
import { CARDS_AGRICULTURE } from './cards-agriculture';
import { CARDS_CORE } from './cards-core';
import { CARDS_ENERGY } from './cards-energy';
import { CARDS_FOLLOWUPS } from './cards-followups';
import { CARDS_INDUSTRY } from './cards-industry';
import { CARDS_MONETARY } from './cards-monetary';
import { CARDS_OVERREACH } from './cards-overreach';
import { CARDS_SOVEREIGNTY } from './cards-sovereignty';

export const DOSSIER_DECK: readonly DossierCard[] = [
  ...CARDS_CORE,
  ...CARDS_ENERGY,
  ...CARDS_AGRICULTURE,
  ...CARDS_MONETARY,
  ...CARDS_INDUSTRY,
  ...CARDS_SOVEREIGNTY,
  ...CARDS_FOLLOWUPS,
  ...CARDS_OVERREACH,
];
