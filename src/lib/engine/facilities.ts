import type { FacilityState, GameState, TurnDirectives } from './types';
import { CONCESSIONAL_FACILITIES } from './constants';

/**
 * Concessional facilities (IMF / Gulf grant / Iran reschedule): cheap money
 * with strings attached. All helpers here are pure w.r.t. disbursement math —
 * the audit preview and the committed turn share computeFacilityTurn so the
 * numbers can never disagree; only applyFacilityTurn mutates state.
 */

export function getFacilityDef(id: string) {
  return CONCESSIONAL_FACILITIES.find((f) => f.id === id);
}

export function getFacilityState(state: GameState, id: string): FacilityState | undefined {
  return state.facilities?.find((f) => f.id === id);
}

function ensureFacilityState(state: GameState, id: string): FacilityState {
  if (!state.facilities) state.facilities = [];
  let fs = state.facilities.find((f) => f.id === id);
  if (!fs) {
    fs = { id, status: 'AVAILABLE', tranchesDrawn: 0, conditionTurnsLeft: 0 };
    state.facilities.push(fs);
  }
  return fs;
}

/** Can this facility be signed right now (PC + entry conditions)? */
export function canSignFacility(
  state: GameState,
  id: string,
  remainingPC: number
): { ok: boolean; reasonAr: string } {
  const def = getFacilityDef(id);
  if (!def) return { ok: false, reasonAr: 'تسهيل غير معروف' };
  const fs = getFacilityState(state, id);
  if (fs && fs.status !== 'AVAILABLE')
    return { ok: false, reasonAr: 'تم التوقيع مسبقاً' };
  if (remainingPC < def.politicalCapitalCost)
    return { ok: false, reasonAr: `رصيد غير كافٍ (${def.politicalCapitalCost})` };
  if (id === 'facility_gulf_reconstruction_grant' && state.macro.systemicCorruption >= 50)
    return { ok: false, reasonAr: 'تشترط فساداً مؤسسياً دون 50' };
  return { ok: true, reasonAr: '' };
}

/** Active conditionality locks (drives draft enforcement + UI badges). */
export function activeFacilityLocks(state: GameState): {
  dieselLocked: boolean;
  dieselTurnsLeft: number;
} {
  let dieselLocked = false;
  let dieselTurnsLeft = 0;
  for (const fs of state.facilities ?? []) {
    if (fs.status !== 'ACTIVE') continue;
    const def = getFacilityDef(fs.id);
    if (def?.condition.kind === 'DIESEL_CRACKDOWN' && fs.conditionTurnsLeft > 0) {
      dieselLocked = true;
      dieselTurnsLeft = Math.max(dieselTurnsLeft, fs.conditionTurnsLeft);
    }
  }
  return { dieselLocked, dieselTurnsLeft };
}

export interface FacilityTurnResult {
  /** USD disbursed this turn (tranches). */
  inflowUSD: number;
  /** Of which ring-fenced into the project bucket. */
  ringFencedUSD: number;
  linesAr: string[];
}

/**
 * Pure: what would facilities do this turn given state + directives?
 * New signatures draw tranche 1; ACTIVE facilities draw the next tranche
 * while conditions hold, else they breach (freeze + trust penalty due).
 */
export function computeFacilityTurn(state: GameState, directives: TurnDirectives): FacilityTurnResult {
  let inflowUSD = 0;
  let ringFencedUSD = 0;
  const linesAr: string[] = [];

  // New signatures (refused outright when the condition is unmet this turn)
  for (const id of directives.signedFacilityIds ?? []) {
    const def = getFacilityDef(id);
    if (!def) continue;
    const fs = getFacilityState(state, id);
    if (fs && fs.status !== 'AVAILABLE') continue;
    if (facilityBreached(state, directives, id)) {
      linesAr.push(`${def.titleAr}: التوقيع مرفوض — الشرط غير مستوفٍ هذا الدور`);
      continue;
    }
    if (def.tranches.length > 0) {
      const t = def.tranches[0];
      inflowUSD += t.amountUSD;
      if (t.ringFenced) ringFencedUSD += t.amountUSD;
      linesAr.push(`${def.titleAr}: الشريحة 1/${def.tranches.length} (+$${Math.round(t.amountUSD / 1_000_000)}M)`);
    } else {
      linesAr.push(`${def.titleAr}: تفعيل لمرة واحدة`);
    }
  }

  // Previously signed: next tranche or breach
  for (const fs of state.facilities ?? []) {
    if (fs.status !== 'ACTIVE') continue;
    const def = getFacilityDef(fs.id);
    if (!def || fs.tranchesDrawn >= def.tranches.length) continue;
    if (facilityBreached(state, directives, fs.id)) {
      linesAr.push(`${def.titleAr}: إخلال بالشرط — الشرائح المتبقية مجمّدة`);
      continue;
    }
    const t = def.tranches[fs.tranchesDrawn];
    inflowUSD += t.amountUSD;
    if (t.ringFenced) ringFencedUSD += t.amountUSD;
    linesAr.push(
      `${def.titleAr}: الشريحة ${fs.tranchesDrawn + 1}/${def.tranches.length} (+$${Math.round(t.amountUSD / 1_000_000)}M)`
    );
  }

  return { inflowUSD, ringFencedUSD, linesAr };
}

/** Has the player violated this facility's condition this turn? */
export function facilityBreached(state: GameState, directives: TurnDirectives, id: string): boolean {
  const def = getFacilityDef(id);
  if (!def) return false;
  const cond = def.condition;
  if (cond.kind === 'DIESEL_CRACKDOWN') {
    return directives.dieselSmuggling !== 'CRACKDOWN';
  }
  if (cond.kind === 'CORRUPTION_BELOW') {
    return state.macro.systemicCorruption >= 50;
  }
  return false;
}

/** Trust penalty applied on breach (mirrors the card's breachAr text). */
export function facilityBreachTrustPenalty(id: string): number {
  if (id === 'facility_imf_stabilization') return 4;
  if (id === 'facility_gulf_reconstruction_grant') return 3;
  return 0;
}

/**
 * Mutating: sign new facilities, record tranche draws, enforce breaches,
 * tick condition timers. Runs on the turn-manager's deep copy BEFORE the
 * audit. It credits ONLY the ring-fenced bucket — general tranches reach
 * reserves through the audit's netUSDDelta (single path, preview-identical).
 */
export function applyFacilityTurn(state: GameState, directives: TurnDirectives): FacilityTurnResult {
  const result = computeFacilityTurn(state, directives);

  // Sign new facilities: pay PC + leverage, apply one-shot effects.
  // Refused (left AVAILABLE, nothing charged) when the condition is unmet.
  for (const id of directives.signedFacilityIds ?? []) {
    const def = getFacilityDef(id);
    if (!def) continue;
    const fs = ensureFacilityState(state, id);
    if (fs.status !== 'AVAILABLE') continue;
    if (facilityBreached(state, directives, id)) continue;
    fs.status = def.tranches.length > 0 ? 'ACTIVE' : 'COMPLETED';
    fs.tranchesDrawn = 0;
    fs.conditionTurnsLeft =
      def.condition.kind === 'DIESEL_CRACKDOWN' ? def.condition.turns : 0;
    state.macro.politicalCapital = Math.max(
      0,
      state.macro.politicalCapital - def.politicalCapitalCost
    );
    state.macro.sovereignLeverage = Math.max(
      0,
      (state.macro.sovereignLeverage ?? 65) - def.leverageCost
    );
    if (def.onSign?.iranCouponUSD !== undefined) {
      state.macro.iranCouponOverrideUSD = def.onSign.iranCouponUSD;
    }
  }

  // Disburse: ring-fenced tranches accumulate in the project bucket here;
  // general tranches are credited via audit netUSDDelta (never here).
  if (result.ringFencedUSD > 0) {
    state.macro.grantBucketUSD = (state.macro.grantBucketUSD ?? 0) + result.ringFencedUSD;
  }

  // Mark drawn tranches + handle breaches + tick timers. The timer keeps
  // ticking through COMPLETED (conditionality outlives the last tranche);
  // BREACHED freezes it as a record of when the deal broke.
  const newlySigned = new Set(directives.signedFacilityIds ?? []);
  for (const fs of state.facilities ?? []) {
    if (fs.status !== 'ACTIVE' && fs.status !== 'COMPLETED') continue;
    const def = getFacilityDef(fs.id);
    if (!def) continue;
    const drewThisTurn =
      newlySigned.has(fs.id) || fs.tranchesDrawn < def.tranches.length;
    // Breach only bites while tranches remain (ACTIVE): a completed deal
    // cannot be retro-broken, its timer just runs out quietly.
    if (fs.status === 'ACTIVE' && facilityBreached(state, directives, fs.id)) {
      fs.status = 'BREACHED';
      state.macro.civicTrust = Math.max(
        0,
        state.macro.civicTrust - facilityBreachTrustPenalty(fs.id)
      );
      continue;
    }
    if (drewThisTurn && fs.tranchesDrawn < def.tranches.length) {
      fs.tranchesDrawn += 1;
      if (fs.tranchesDrawn >= def.tranches.length) fs.status = 'COMPLETED';
    }
    if (fs.conditionTurnsLeft > 0) {
      fs.conditionTurnsLeft -= 1;
      if (fs.conditionTurnsLeft === 0 && fs.status === 'ACTIVE') {
        // Conditionality served; remaining tranches (if any) still disburse.
      }
    }
  }

  return result;
}
