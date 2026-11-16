import { writable } from 'svelte/store';
import { fx } from '../../lib/ui/fx/feedback';
import {
  BOSSES,
  CRISIS_TRAITS,
  PLAYER_TRAITS,
  getCardDef,
  getCrisisDef,
  type BattleEvent,
  type BattleState,
  type CrisisInstance,
  type LaneIndex,
  type UnitInstance,
} from './engine';

export interface AnimPopup {
  id: number;
  zone: 'player' | 'crisis' | 'queue';
  lane: LaneIndex;
  text: string;
  tone: 'neg' | 'pos' | 'accent' | 'neutral';
}

export interface GaugeFlyChip {
  id: number;
  lane: LaneIndex;
  side: 'player' | 'crisis';
  text: string;
  tone: 'pos' | 'neg';
}

export interface AnimState {
  active: boolean;
  displayBattle: BattleState | null;
  banner: { text: string; tone: 'player' | 'crisis' | 'boss' | 'win' | 'loss' } | null;
  bossFlash: boolean;
  lunging: { side: 'player' | 'crisis'; lane: LaneIndex } | null;
  shaking: { side: 'player' | 'crisis'; lane: LaneIndex } | null;
  destroying: { zone: 'player' | 'crisis' | 'queue'; lane: LaneIndex } | null;
  droppingLanes: LaneIndex[];
  fadingQueueLanes: LaneIndex[];
  popups: AnimPopup[];
  gaugeChips: GaugeFlyChip[];
  speedScale: number;
}

const INITIAL_ANIM: AnimState = {
  active: false,
  displayBattle: null,
  banner: null,
  bossFlash: false,
  lunging: null,
  shaking: null,
  destroying: null,
  droppingLanes: [],
  fadingQueueLanes: [],
  popups: [],
  gaugeChips: [],
  speedScale: 1,
};

export const animStore = writable<AnimState>({ ...INITIAL_ANIM });

let animSeq = 0;
let popupSeq = 0;
let pendingDone: (() => void) | null = null;

function isReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, Math.max(16, ms)));

function pushPopup(
  zone: AnimPopup['zone'],
  lane: LaneIndex,
  text: string,
  tone: AnimPopup['tone'],
  durationMs: number,
): void {
  const id = ++popupSeq;
  animStore.update((s) => ({ ...s, popups: [...s.popups, { id, zone, lane, text, tone }] }));
  setTimeout(() => {
    animStore.update((s) => ({ ...s, popups: s.popups.filter((p) => p.id !== id) }));
  }, durationMs);
}

export function triggerQuickSlotPopup(
  zone: AnimPopup['zone'],
  lane: LaneIndex,
  text: string,
  tone: AnimPopup['tone'] = 'accent',
): void {
  pushPopup(zone, lane, text, tone, 520);
}

export function skipBattleAnimation(): void {
  animSeq += 1;
  const done = pendingDone;
  pendingDone = null;
  animStore.set({ ...INITIAL_ANIM });
  if (done) done();
}

function makeDisplayCrisis(defId: string, uid: string): CrisisInstance {
  const def = getCrisisDef(defId);
  return {
    uid,
    defId: def.id,
    name: def.name,
    glyph: def.glyph,
    category: def.category,
    power: def.power,
    health: def.health,
    maxHealth: def.health,
    traits: [...def.traits],
    hardenUsedThisRound: false,
  };
}

export async function replayBattleResolution(
  beforeBattle: BattleState,
  events: BattleEvent[],
  speed: 'normal' | 'fast',
  onComplete: () => void,
): Promise<void> {
  const mySeq = ++animSeq;
  pendingDone = onComplete;
  const reduced = isReducedMotion();
  const scale = (speed === 'fast' ? 0.5 : 1) * (reduced ? 0.45 : 1);
  const sim = structuredClone(beforeBattle);

  const sync = (patch: Partial<AnimState> = {}) => {
    if (mySeq !== animSeq) return false;
    animStore.update((s) => ({
      ...s,
      ...patch,
      displayBattle: structuredClone(sim),
      speedScale: scale,
    }));
    return true;
  };

  animStore.set({
    ...INITIAL_ANIM,
    active: true,
    displayBattle: structuredClone(sim),
    speedScale: scale,
  });

  const hasAttack = (side: 'player' | 'crisis') =>
    events.some((e) => e.t === 'attack' && e.side === side);

  for (let i = 0; i < events.length; i++) {
    if (mySeq !== animSeq) return;
    const ev = events[i];

    if (ev.t === 'phase') {
      if (ev.phase === 'newRound') break;
      if (ev.phase === 'playerAttacks' && hasAttack('player')) {
        sync({ banner: { text: 'تهاجم فرقك', tone: 'player' } });
        await wait(560 * scale);
        if (!sync({ banner: null })) return;
      } else if (ev.phase === 'crisisAttacks' && hasAttack('crisis')) {
        sync({ banner: { text: 'تهاجم الأزمات', tone: 'crisis' } });
        await wait(560 * scale);
        if (!sync({ banner: null })) return;
      }
      continue;
    }

    if (ev.t === 'attack') {
      const chip: GaugeFlyChip[] =
        ev.target === 'gauge'
          ? [
              {
                id: ++popupSeq,
                lane: ev.targetLane,
                side: ev.side,
                text: ev.side === 'player' ? `+${ev.dmg}` : `−${ev.dmg}`,
                tone: ev.side === 'player' ? 'pos' : 'neg',
              },
            ]
          : [];
      if (ev.target === 'gauge') fx(ev.side === 'player' ? 'good' : 'bad');
      if (!sync({ lunging: reduced ? null : { side: ev.side, lane: ev.lane }, gaugeChips: chip })) return;
      await wait(280 * scale);
      if (!sync({ lunging: null, gaugeChips: [] })) return;
      continue;
    }

    if (ev.t === 'damage') {
      const target = ev.side === 'player' ? sim.playerLine[ev.lane] : sim.crisisLine[ev.lane];
      if (target) target.health = ev.hp;
      fx(ev.side === 'crisis' ? 'good' : 'bad');
      pushPopup(ev.side, ev.lane, `−${ev.dmg}`, 'neg', 600 * scale);
      if (!sync({ shaking: { side: ev.side, lane: ev.lane } })) return;
      await wait(260 * scale);
      if (!sync({ shaking: null })) return;
      continue;
    }

    if (ev.t === 'heal') {
      const target = ev.side === 'player' ? sim.playerLine[ev.lane] : sim.crisisLine[ev.lane];
      if (target) target.health = ev.hp;
      fx('good');
      pushPopup(ev.side, ev.lane, `+${ev.amount}`, 'pos', 560 * scale);
      if (!sync()) return;
      await wait(190 * scale);
      continue;
    }

    if (ev.t === 'trait') {
      const meta =
        ev.side === 'player'
          ? PLAYER_TRAITS[ev.trait as keyof typeof PLAYER_TRAITS]
          : CRISIS_TRAITS[ev.trait as keyof typeof CRISIS_TRAITS];
      if (meta) pushPopup(ev.side, ev.lane, meta.name, 'accent', 520 * scale);
      if (ev.trait === 'promote' && sim.playerLine[ev.lane]) {
        const u = sim.playerLine[ev.lane]!;
        u.power += 1;
        u.health += 1;
        u.maxHealth += 1;
      } else if (ev.trait === 'grow' && sim.crisisLine[ev.lane]) {
        sim.crisisLine[ev.lane]!.power = Math.min(6, sim.crisisLine[ev.lane]!.power + 1);
      } else if (ev.trait === 'erode' && sim.playerLine[ev.lane]) {
        sim.playerLine[ev.lane]!.power = Math.max(0, sim.playerLine[ev.lane]!.power - 1);
      } else if (ev.trait === 'smuggle' && sim.crisisLine[ev.lane]) {
        const c = sim.crisisLine[ev.lane];
        for (const adj of [ev.lane - 1, ev.lane + 1]) {
          if (adj >= 0 && adj <= 3 && sim.crisisLine[adj] === null) {
            sim.crisisLine[adj] = c;
            sim.crisisLine[ev.lane] = null;
            break;
          }
        }
      }
      if (!sync()) return;
      await wait(150 * scale);
      continue;
    }

    if (ev.t === 'destroyed') {
      fx(ev.side === 'crisis' ? 'good' : 'bad');
      if (ev.lane === 'queue') {
        const qIdx = sim.queue.findIndex((q) => q?.uid === ev.uid);
        const lane = (qIdx >= 0 ? qIdx : 0) as LaneIndex;
        if (!sync({ destroying: { zone: 'queue', lane } })) return;
        await wait(240 * scale);
        if (qIdx >= 0) sim.queue[qIdx] = null;
      } else {
        if (!sync({ destroying: { zone: ev.side, lane: ev.lane } })) return;
        await wait(260 * scale);
        if (ev.side === 'player') sim.playerLine[ev.lane] = null;
        else sim.crisisLine[ev.lane] = null;
      }
      if (!sync({ destroying: null })) return;
      continue;
    }

    if (ev.t === 'gauge') {
      sim.balance = ev.to;
      if (!sync()) return;
      await wait(180 * scale);
      continue;
    }

    if (ev.t === 'bossPhase') {
      const def = BOSSES[ev.bossId];
      sim.bossPhase = 2;
      for (const c of sim.crisisLine) {
        if (c?.isBoss) {
          c.bossPhase = 2;
          c.power = def.phase2.power;
          c.health = def.phase2.health;
          c.maxHealth = def.phase2.health;
        }
      }
      fx('event');
      if (!sync({ bossFlash: !reduced, banner: { text: `${def.name} · المرحلة الثانية`, tone: 'boss' } })) return;
      await wait(820 * scale);
      if (!sync({ bossFlash: false, banner: null })) return;
      continue;
    }

    if (ev.t === 'advance') {
      const lanes: LaneIndex[] = [ev.lane];
      while (events[i + 1]?.t === 'advance') {
        i += 1;
        lanes.push((events[i] as Extract<BattleEvent, { t: 'advance' }>).lane);
      }
      for (const l of lanes) {
        if (sim.queue[l] && sim.crisisLine[l] === null) {
          sim.crisisLine[l] = sim.queue[l];
          sim.queue[l] = null;
        }
      }
      fx('tap');
      if (!sync({ droppingLanes: lanes })) return;
      await wait(230 * scale);
      if (!sync({ droppingLanes: [] })) return;
      continue;
    }

    if (ev.t === 'queue') {
      const lanes: LaneIndex[] = [];
      let cur: BattleEvent | undefined = ev;
      while (cur && cur.t === 'queue') {
        sim.queue[cur.lane] = makeDisplayCrisis(cur.cardId, cur.uid);
        lanes.push(cur.lane);
        if (events[i + 1]?.t === 'queue') {
          i += 1;
          cur = events[i];
        } else {
          break;
        }
      }
      if (!sync({ fadingQueueLanes: lanes })) return;
      await wait(210 * scale);
      if (!sync({ fadingQueueLanes: [] })) return;
      continue;
    }

    if (ev.t === 'battleEnd') {
      fx(ev.result === 'win' ? 'good' : 'bad');
      if (
        !sync({
          banner: {
            text: ev.result === 'win' ? 'انفراج' : 'انهيار',
            tone: ev.result === 'win' ? 'win' : 'loss',
          },
        })
      )
        return;
      await wait(780 * scale);
      if (!sync({ banner: null })) return;
    }
  }

  if (mySeq !== animSeq) return;
  const done = pendingDone;
  pendingDone = null;
  animStore.set({ ...INITIAL_ANIM });
  if (done) done();
}

function hitVerbForName(name: string): string {
  if (name === 'متطوعون') return 'يصيبون';
  const firstWord = name.split(' ')[0] ?? '';
  if (
    firstWord.endsWith('ة') ||
    firstWord === 'ألواح' ||
    firstWord === 'سوق'
  ) {
    return 'تصيب';
  }
  return 'يصيب';
}

export function buildInitialBattleLogLines(battle: BattleState): string[] {
  const lines: string[] = [`بدأت الجولة ${battle.round}`];
  for (let lane = 0; lane < 4; lane++) {
    const c = battle.crisisLine[lane];
    if (c) lines.push(`ظهور ${c.name} (مسار ${lane + 1})`);
  }
  for (let lane = 0; lane < 4; lane++) {
    const u = battle.playerLine[lane];
    if (u) lines.push(`انتشار ${u.name} (مسار ${lane + 1})`);
  }
  return lines.reverse();
}

export function formatBattleLogLines(beforeBattle: BattleState, events: BattleEvent[]): string[] {
  const lines: string[] = [];
  const sim = structuredClone(beforeBattle);

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    if (ev.t === 'supplyPicked') {
      const def = getCardDef(ev.card.defId);
      lines.push(`إمداد: ${def.name}`);
      continue;
    }

    if (ev.t === 'cardPlayed') {
      const def = getCardDef(ev.card.defId);
      if (def.kind === 'unit' && ev.lane !== undefined) {
        sim.playerLine[ev.lane] = {
          uid: ev.card.uid,
          defId: def.id,
          name: def.name,
          glyph: def.glyph as UnitInstance['glyph'],
          category: def.category,
          power: def.power ?? 0,
          tempPower: 0,
          health: def.health ?? 1,
          maxHealth: def.health ?? 1,
          traits: [...(def.traits ?? [])],
          shieldUsedThisRound: false,
          movedThisRound: false,
          promoted: false,
          sourceCard: ev.card,
        };
        lines.push(`انتشار ${def.name} (مسار ${ev.lane + 1})`);
      } else {
        lines.push(`قرار: ${def.name}`);
      }
      continue;
    }

    if (ev.t === 'unitMoved') {
      const a = sim.playerLine[ev.fromLane];
      const b = sim.playerLine[ev.toLane];
      sim.playerLine[ev.toLane] = a;
      sim.playerLine[ev.fromLane] = ev.swapped ? b : null;
      lines.push(`تنقّل ${a?.name ?? 'فريق'} إلى المسار ${ev.toLane + 1}`);
      continue;
    }

    if (ev.t === 'unitWithdrawn') {
      const uName = sim.playerLine[ev.lane]?.name ?? 'فريق';
      sim.playerLine[ev.lane] = null;
      lines.push(`انسحاب ${uName}`);
      continue;
    }

    if (ev.t === 'attack') {
      const attackerName =
        ev.side === 'player'
          ? sim.playerLine[ev.lane]?.name ?? 'فريقك'
          : sim.crisisLine[ev.lane]?.name ?? 'أزمة';
      const verb = hitVerbForName(attackerName);

      if (ev.target === 'unit') {
        const targetName =
          ev.side === 'player'
            ? sim.crisisLine[ev.targetLane]?.name ?? 'أزمة'
            : sim.playerLine[ev.targetLane]?.name ?? 'فريقك';

        // Check next events for shield/harden block or dealt damage
        const next1 = events[i + 1];
        const next2 = events[i + 2];
        if (next1?.t === 'trait' && (next1.trait === 'shield' || next1.trait === 'harden')) {
          const tName =
            next1.trait === 'shield' ? PLAYER_TRAITS.shield.name : CRISIS_TRAITS.harden.name;
          lines.push(`${targetName} يصدّ الضربة (${tName})`);
          i += 1;
          continue;
        }
        if (next1?.t === 'damage') {
          lines.push(`${attackerName} ${verb} ${targetName} −${next1.dmg}`);
          i += 1;
          continue;
        }
        if (next1?.t === 'trait' && next1.trait === 'decisive' && next2?.t === 'damage') {
          lines.push(`${attackerName} ${verb} ${targetName} −${next2.dmg}`);
          i += 2;
          continue;
        }
      }
      continue;
    }

    if (ev.t === 'damage') {
      const targetName =
        ev.side === 'player'
          ? sim.playerLine[ev.lane]?.name ?? 'فريقك'
          : sim.crisisLine[ev.lane]?.name ?? 'أزمة';
      lines.push(`اشتباك يصيب ${targetName} −${ev.dmg}`);
      continue;
    }

    if (ev.t === 'gauge') {
      if (ev.delta !== 0) {
        const sign = ev.delta > 0 ? `+${ev.delta}` : `−${Math.abs(ev.delta)}`;
        lines.push(`الميزان ${sign}`);
      }
      continue;
    }

    if (ev.t === 'heal') {
      const targetName =
        ev.side === 'player'
          ? sim.playerLine[ev.lane]?.name ?? 'فريق'
          : sim.crisisLine[ev.lane]?.name ?? 'أزمة';
      lines.push(`إسعاف ${targetName} +${ev.amount}`);
      continue;
    }

    if (ev.t === 'destroyed') {
      if (ev.lane !== 'queue') {
        if (ev.side === 'player') sim.playerLine[ev.lane] = null;
        else sim.crisisLine[ev.lane] = null;
      } else {
        const qIdx = sim.queue.findIndex((q) => q?.uid === ev.uid);
        if (qIdx >= 0) sim.queue[qIdx] = null;
      }
      const name =
        ev.side === 'player'
          ? getCardDef(ev.cardId).name
          : BOSSES[ev.cardId as keyof typeof BOSSES]?.name ?? getCrisisDef(ev.cardId).name;
      lines.push(`سقوط ${name}`);
      continue;
    }

    if (ev.t === 'advance') {
      if (sim.queue[ev.lane] && sim.crisisLine[ev.lane] === null) {
        sim.crisisLine[ev.lane] = sim.queue[ev.lane];
        sim.queue[ev.lane] = null;
      }
      const cName = getCrisisDef(ev.cardId).name;
      lines.push(`تقدّم ${cName} إلى الجبهة`);
      continue;
    }

    if (ev.t === 'queue') {
      sim.queue[ev.lane] = makeDisplayCrisis(ev.cardId, ev.uid);
      continue;
    }

    if (ev.t === 'bossPhase') {
      lines.push(`${BOSSES[ev.bossId].name}: المرحلة 2`);
      continue;
    }

    if (ev.t === 'battleEnd') {
      lines.push(ev.result === 'win' ? 'حسم الجبهة: انفراج' : 'نهاية الجبهة: انهيار');
    }
  }

  return lines;
}
