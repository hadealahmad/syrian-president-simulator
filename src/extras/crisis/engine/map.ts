import { nextFloat, nextInt, pick, shuffle, type RngState } from '../../shared/rng';
import { ACTS, MODIFIERS, NODE_META } from './content';
import type { ActMap, ActNumber, MapNode, ModifierId, NodeType } from './types';

const MODIFIER_IDS = Object.keys(MODIFIERS) as ModifierId[];

function pickModifier(rng: RngState): ModifierId {
  return pick(rng, MODIFIER_IDS);
}

function buildMonotoneEdges(rng: RngState, lower: MapNode[], upper: MapNode[]): void {
  const m = lower.length;
  const n = upper.length;
  let i = 0;
  let j = 0;
  lower[0].nextIds.push(upper[0].id);

  while (i < m - 1 || j < n - 1) {
    if (i === m - 1) {
      j += 1;
    } else if (j === n - 1) {
      i += 1;
    } else {
      const nextI = (i + 1) / m;
      const nextJ = (j + 1) / n;
      const diff = nextI - nextJ;
      if (Math.abs(diff) < 0.2 && nextFloat(rng) < 0.35) {
        // Occasionally branch before diagonal advance without crossing
        if (nextFloat(rng) < 0.5) {
          j += 1;
          lower[i].nextIds.push(upper[j].id);
          i += 1;
        } else {
          i += 1;
          lower[i].nextIds.push(upper[j].id);
          j += 1;
        }
      } else if (diff <= 0) {
        i += 1;
      } else {
        j += 1;
      }
    }
    if (!lower[i].nextIds.includes(upper[j].id)) {
      lower[i].nextIds.push(upper[j].id);
    }
  }
}

function assignRowTypes(
  rng: RngState,
  act: ActNumber,
  row: number,
  count: number,
  isTutorialAct1: boolean,
): Array<{ type: NodeType; modifier?: ModifierId }> {
  if (row === 0) {
    return Array.from({ length: count }, (_, idx) => ({
      type: 'battle' as NodeType,
      modifier: !isTutorialAct1 && idx > 0 && nextFloat(rng) < 0.2 ? pickModifier(rng) : undefined,
    }));
  }

  if (row === 1) {
    const base: NodeType[] = shuffle(rng, ['recruit', 'train', 'event', 'market']);
    return Array.from({ length: count }, (_, idx) => ({ type: base[idx % base.length] }));
  }

  if (row === 2 || row === 4) {
    // All fight row; guarantee at least 1 normal battle and up to 1-2 elites
    const types: NodeType[] = Array.from({ length: count }, () => 'battle');
    const eliteIdx = nextInt(rng, count);
    if (row === 4 || nextFloat(rng) < 0.75) {
      types[eliteIdx] = 'elite';
    }
    return types.map((type) => ({
      type,
      modifier:
        type === 'elite'
          ? pickModifier(rng)
          : nextFloat(rng) < (act === 1 ? 0.2 : 0.35)
            ? pickModifier(rng)
            : undefined,
    }));
  }

  if (row === 3) {
    // Mixed row: 1 fight/elite + utility nodes so paths have 3 or 4 fights total
    const nonFights: NodeType[] = shuffle(rng, ['market', 'event', 'recruit', 'train', 'rest']);
    const result: Array<{ type: NodeType; modifier?: ModifierId }> = [];
    const fightType: NodeType = nextFloat(rng) < 0.45 ? 'elite' : 'battle';
    result.push({
      type: fightType,
      modifier: fightType === 'elite' ? pickModifier(rng) : nextFloat(rng) < 0.25 ? pickModifier(rng) : undefined,
    });
    for (let i = 1; i < count; i++) {
      result.push({ type: nonFights[(i - 1) % nonFights.length] });
    }
    return shuffle(rng, result);
  }

  // Row 5 (before boss): MUST contain at least one 'rest', zero fights
  const row5Pool: NodeType[] = shuffle(rng, ['train', 'market', 'recruit', 'event']);
  const row5Types: NodeType[] = ['rest'];
  for (let i = 1; i < count; i++) {
    row5Types.push(i === 2 && nextFloat(rng) < 0.4 ? 'rest' : row5Pool[(i - 1) % row5Pool.length]);
  }
  return shuffle(rng, row5Types).map((type) => ({ type }));
}

export function generateActMap(rng: RngState, act: ActNumber, isTutorialAct1 = false): ActMap {
  const actMeta = ACTS[act];
  const nodes: Record<string, MapNode> = {};
  const rows: MapNode[][] = [];

  for (let r = 0; r < 6; r++) {
    const count = r === 0 ? 3 : 2 + nextInt(rng, 3); // 2..4 nodes per row
    const specs = assignRowTypes(rng, act, r, count, isTutorialAct1 && act === 1);
    const rowNodes: MapNode[] = specs.map((spec, c) => {
      const id = `a${act}-r${r}-c${c}`;
      const meta = NODE_META[spec.type];
      const node: MapNode = {
        id,
        row: r,
        col: c,
        type: spec.type,
        name: meta.name,
        glyph: meta.glyph,
        nextIds: [],
        visited: false,
      };
      if (spec.modifier) node.modifier = spec.modifier;
      nodes[id] = node;
      return node;
    });
    rows.push(rowNodes);
  }

  for (let r = 0; r < 5; r++) {
    buildMonotoneEdges(rng, rows[r], rows[r + 1]);
  }

  const bossId = `a${act}-boss`;
  const bossMeta = NODE_META.boss;
  const bossNode: MapNode = {
    id: bossId,
    row: 6,
    col: 0,
    type: 'boss',
    name: bossMeta.name,
    glyph: bossMeta.glyph,
    nextIds: [],
    visited: false,
  };
  for (const n of rows[5]) {
    n.nextIds.push(bossId);
  }
  rows.push([bossNode]);

  for (const row of rows) {
    for (const n of row) {
      nodes[n.id] = structuredClone(n);
    }
  }

  return {
    act,
    name: actMeta.name,
    bossId: actMeta.bossId,
    rows,
    nodes,
    bossNodeId: bossId,
  };
}
