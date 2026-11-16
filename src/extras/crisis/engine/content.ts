import type { CrisisDef, DeckCard, PlayerCardDef, PlayerTraitId } from './types';
import { PLAYER_CARDS } from './content-cards';
import { CRISES } from './content-world';

export * from './content-cards';
export * from './content-world';

export function getCardDef(defId: string): PlayerCardDef {
  const def = PLAYER_CARDS[defId];
  if (!def) throw new Error(`Unknown player card id: ${defId}`);
  return def;
}

export function getCrisisDef(defId: string): CrisisDef {
  const def = CRISES[defId];
  if (!def) throw new Error(`Unknown crisis id: ${defId}`);
  return def;
}

export function createDeckCard(defId: string, uid: string, isToken = false): DeckCard {
  getCardDef(defId);
  const card: DeckCard = {
    uid,
    defId,
    powerBonus: 0,
    healthBonus: 0,
  };
  if (isToken || defId === 'volunteers') card.isToken = true;
  return card;
}

export function getDeckCardStats(card: DeckCard): {
  def: PlayerCardDef;
  power: number;
  health: number;
  traits: PlayerTraitId[];
} {
  const def = getCardDef(card.defId);
  const baseTraits = def.traits ?? [];
  const traits = card.addedTrait && !baseTraits.includes(card.addedTrait)
    ? [...baseTraits, card.addedTrait]
    : [...baseTraits];
  return {
    def,
    power: (def.power ?? 0) + card.powerBonus,
    health: (def.health ?? 0) + card.healthBonus,
    traits,
  };
}
