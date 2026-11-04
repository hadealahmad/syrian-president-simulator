import { SYRIA_2D_GOVERNORATES } from '../../spatial3d/syria-2d-paths';
import type { MigrationFlow } from '../../engine/types';

/**
 * Internal governorate-to-governorate migration arrows.
 *
 * Routing/heuristics ported from the legacy map renderer: try offset side ×
 * bow side, keep the path farthest from foreign province centres, and combine
 * the committed ledger with the live projected draft flows.
 */
export interface MigrationArrow {
  fromId: string;
  toId: string;
  history: number;
  predicted: number;
  total: number;
  /** SVG path in the 1000×880 map frame. */
  d: string;
  width: number;
}

export interface MigrationArrowData {
  arrows: MigrationArrow[];
  historyTotal: number;
  predictedTotal: number;
}

export const MIGRATION_MIN_PEOPLE = 1000;
const MIGRATION_LATERAL = 34;
const MIGRATION_CLEAR_RADIUS = 70;

export const GOVERNORATE_CENTERS: ReadonlyMap<string, [number, number]> = new Map(
  SYRIA_2D_GOVERNORATES.map((g) => [g.id, g.center] as const)
);

export const GOVERNORATE_NAMES_AR: ReadonlyMap<string, string> = new Map(
  SYRIA_2D_GOVERNORATES.map((g) => [g.id, g.nameAr] as const)
);

function quadSample(
  sx: number,
  sy: number,
  cx: number,
  cy: number,
  ex: number,
  ey: number,
  t: number
): [number, number] {
  const u = 1 - t;
  return [u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey];
}

function migrationArrowPath(
  fromId: string,
  toId: string,
  from: readonly [number, number],
  to: readonly [number, number]
): string {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  let nearestForeign = Infinity;
  for (const [id, c] of GOVERNORATE_CENTERS) {
    if (id === fromId || id === toId) continue;
    const d = Math.hypot(c[0] - from[0], c[1] - from[1]);
    if (d < nearestForeign) nearestForeign = d;
  }
  const off = Number.isFinite(nearestForeign)
    ? Math.min(MIGRATION_LATERAL, Math.max(14, nearestForeign * 0.4))
    : MIGRATION_LATERAL;

  const trimS = Math.min(12, dist * 0.2);
  const trimE = Math.min(24, dist * 0.3);
  const bow = Math.min(70, Math.max(18, dist * 0.25));
  const foreigners = [...GOVERNORATE_CENTERS.entries()].filter(
    ([id]) => id !== fromId && id !== toId
  );

  const build = (offSide: number, bowSide: number) => {
    const sx = from[0] + ux * trimS + nx * off * offSide;
    const sy = from[1] + uy * trimS + ny * off * offSide;
    const ex = to[0] - ux * trimE + nx * off * offSide;
    const ey = to[1] - uy * trimE + ny * off * offSide;
    const cx = (sx + ex) / 2 + nx * bow * bowSide;
    const cy = (sy + ey) / 2 + ny * bow * bowSide;
    let score = 0;
    const STEPS = 8;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const [px, py] = quadSample(sx, sy, cx, cy, ex, ey, t);
      const w = i === 0 || i === STEPS ? 2.5 : 1;
      for (const [, c] of foreigners) {
        const dd = Math.hypot(px - c[0], py - c[1]);
        if (dd < MIGRATION_CLEAR_RADIUS) score += w * (MIGRATION_CLEAR_RADIUS - dd);
      }
    }
    return {
      d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      score,
    };
  };

  const candidates = [build(1, 1), build(-1, -1), build(1, -1), build(-1, 1)];
  let best = candidates[0];
  for (const c of candidates) if (c.score < best.score) best = c;
  return best.d;
}

/**
 * Combine the committed ledger (previous turns) and the projected next-turn
 * flows (current unconfirmed draft) into at most 24 arrows, strongest first.
 */
export function buildMigrationArrows(
  ledger: Record<string, number> | undefined,
  predicted: MigrationFlow[] | undefined
): MigrationArrowData {
  const acc = new Map<
    string,
    { fromId: string; toId: string; history: number; predicted: number }
  >();

  for (const [key, count] of Object.entries(ledger ?? {})) {
    const sep = key.indexOf('>');
    if (sep <= 0) continue;
    const fromId = key.slice(0, sep);
    const toId = key.slice(sep + 1);
    if (fromId === toId) continue;
    if (!GOVERNORATE_CENTERS.has(fromId) || !GOVERNORATE_CENTERS.has(toId)) continue;
    acc.set(key, { fromId, toId, history: count, predicted: 0 });
  }

  for (const flow of predicted ?? []) {
    if (flow.fromId === flow.toId) continue;
    if (!GOVERNORATE_CENTERS.has(flow.fromId) || !GOVERNORATE_CENTERS.has(flow.toId)) continue;
    const key = `${flow.fromId}>${flow.toId}`;
    const current = acc.get(key) ?? {
      fromId: flow.fromId,
      toId: flow.toId,
      history: 0,
      predicted: 0,
    };
    current.predicted += flow.count;
    acc.set(key, current);
  }

  const arrows: MigrationArrow[] = [];
  let historyTotal = 0;
  let predictedTotal = 0;
  for (const a of acc.values()) {
    const total = a.history + a.predicted;
    if (total < MIGRATION_MIN_PEOPLE) continue;
    historyTotal += a.history;
    predictedTotal += a.predicted;
    const from = GOVERNORATE_CENTERS.get(a.fromId);
    const to = GOVERNORATE_CENTERS.get(a.toId);
    if (!from || !to) continue;
    arrows.push({
      ...a,
      total,
      d: migrationArrowPath(a.fromId, a.toId, from, to),
      width: Math.min(3.5, Math.max(1, Math.sqrt(total) / 34)),
    });
  }

  arrows.sort((a, b) => b.total - a.total);
  return { arrows: arrows.slice(0, 24), historyTotal, predictedTotal };
}

export function formatPeople(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
