import {
  getCardDef,
  type DeckCard,
  type LaneIndex,
  type PlayerAction,
} from '../engine';

export type BoardZone = 'player' | 'crisis' | 'queue';

export interface HoveredSlot {
  zone: BoardZone;
  lane: LaneIndex;
}

export function buildActionForSlot(
  handCard: DeckCard | null,
  legalActions: PlayerAction[],
  redeployFromLane: LaneIndex | null,
  zone: BoardZone,
  lane: LaneIndex,
): PlayerAction | null {
  if (!handCard) return null;
  const def = getCardDef(handCard.defId);
  if (def.kind === 'unit' && zone === 'player') {
    return legalActions.some(
      (a) => a.type === 'playUnit' && a.handUid === handCard.uid && a.lane === lane,
    )
      ? { type: 'playUnit', handUid: handCard.uid, lane }
      : null;
  }
  if (def.kind !== 'unit') {
    const t = def.target ?? 'none';
    if (t === 'none') {
      return legalActions.some((a) => a.type === 'playAction' && a.handUid === handCard.uid)
        ? { type: 'playAction', handUid: handCard.uid }
        : null;
    }
    if ((t === 'ally' || t === 'damaged-ally') && zone === 'player') {
      return legalActions.some(
        (a) => a.type === 'playAction' && a.handUid === handCard.uid && a.lane === lane,
      )
        ? { type: 'playAction', handUid: handCard.uid, lane }
        : null;
    }
    if (t === 'queue' && zone === 'queue') {
      return legalActions.some(
        (a) => a.type === 'playAction' && a.handUid === handCard.uid && a.lane === lane,
      )
        ? { type: 'playAction', handUid: handCard.uid, lane }
        : null;
    }
    if (t === 'delay-crisis' && zone === 'crisis') {
      return legalActions.some(
        (a) => a.type === 'playAction' && a.handUid === handCard.uid && a.lane === lane,
      )
        ? { type: 'playAction', handUid: handCard.uid, lane }
        : null;
    }
    if (t === 'redeploy' && zone === 'player') {
      if (redeployFromLane !== null && redeployFromLane !== lane) {
        return legalActions.some(
          (a) =>
            a.type === 'playAction' &&
            a.handUid === handCard.uid &&
            a.lane === redeployFromLane &&
            a.toLane === lane,
        )
          ? { type: 'playAction', handUid: handCard.uid, lane: redeployFromLane, toLane: lane }
          : null;
      }
    }
  }
  return null;
}

export function computeValidZones(
  activeHandCard: DeckCard | null,
  legalActions: PlayerAction[],
  redeployFromLane: LaneIndex | null,
  isAnimating: boolean,
): Record<BoardZone, boolean[]> {
  const res: Record<BoardZone, boolean[]> = {
    player: [false, false, false, false],
    crisis: [false, false, false, false],
    queue: [false, false, false, false],
  };
  if (!activeHandCard || isAnimating) return res;
  const def = getCardDef(activeHandCard.defId);
  if (def.target === 'redeploy' && redeployFromLane === null) {
    for (const l of [0, 1, 2, 3] as LaneIndex[]) {
      res.player[l] = legalActions.some(
        (a) => a.type === 'playAction' && a.handUid === activeHandCard.uid && a.lane === l,
      );
    }
    return res;
  }
  for (const l of [0, 1, 2, 3] as LaneIndex[]) {
    res.player[l] = buildActionForSlot(activeHandCard, legalActions, redeployFromLane, 'player', l) !== null;
    res.crisis[l] = buildActionForSlot(activeHandCard, legalActions, redeployFromLane, 'crisis', l) !== null;
    res.queue[l] = buildActionForSlot(activeHandCard, legalActions, redeployFromLane, 'queue', l) !== null;
  }
  return res;
}

export function hitTestSlot(x: number, y: number): HoveredSlot | null {
  if (typeof document === 'undefined') return null;
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    const slotEl = (el as HTMLElement).closest?.('[data-slot-zone][data-lane]') as HTMLElement | null;
    if (slotEl) {
      const zone = slotEl.dataset.slotZone as BoardZone;
      const lane = Number(slotEl.dataset.lane) as LaneIndex;
      if ((zone === 'player' || zone === 'crisis' || zone === 'queue') && lane >= 0 && lane <= 3) {
        return { zone, lane };
      }
    }
  }
  return null;
}
