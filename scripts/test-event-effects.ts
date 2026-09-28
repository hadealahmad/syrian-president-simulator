/**
 * Regression test for authored event effects.
 *
 * Every numeric field on an option's `governorateEffects` and on its
 * `effectCompetence` must be applied EXACTLY ONCE. Two real defects lived in
 * this code:
 *
 *  - effects targeting a governorate that lacks the optional field were skipped
 *    outright, silently discarding authored content;
 *  - the same effect being applied twice (a duplicated applier block).
 *
 * Both are invisible to the deck-shape checks. This walks every option in the
 * master deck, pins each affected governorate field to a mid-range value so
 * clamping cannot mask a miscount, resolves the option, and compares against the
 * expected clamped result.
 */
import { ALL_EVENTS } from '../src/lib/engine/deck';
import { resolveEventOption } from '../src/lib/engine/events';
import { createInitialGameState } from '../src/lib/engine/baseline';
import type { GameState, GovernorateNode } from '../src/lib/engine/types';

let failures = 0;
let assertions = 0;

function check(name: string, cond: boolean, detail = ''): void {
  assertions++;
  if (cond) return;
  failures++;
  console.error(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

/** Mid-range probe value and clamp bounds for each appliable field. */
const FIELD_RULES: Record<string, { base: number; min: number; max: number }> = {
  prri: { base: 50, min: 0, max: 100 },
  dailyBlackoutHours: { base: 12, min: 0, max: 24 },
  sectarianAnxiety: { base: 50, min: 0, max: 100 },
  securityEfficacy: { base: 50, min: 0, max: 100 },
  activeHospitalsPct: { base: 50, min: 0, max: 100 },
  reconstructionScore: { base: 0.5, min: 0, max: 1 },
  suwaydaIntegrationIndex: { base: 50, min: 0, max: 100 },
  suwaydaSecessionProb: { base: 50, min: 0, max: 100 },
  tribalRageIndex: { base: 50, min: 0, max: 100 },
  golanTensionIndex: { base: 50, min: 0, max: 100 },
  daraaDefianceIndex: { base: 50, min: 0, max: 100 },
  nassibRevenueCapturePct: { base: 50, min: 0, max: 100 },
  skilledLaborCount: { base: 5_000, min: 0, max: Number.MAX_SAFE_INTEGER },
};

/** These options have bespoke handlers that overwrite Suwayda state wholesale. */
const SPECIAL_CASE_OPTIONS = new Set(['opt_historic_accord', 'opt_disarm_suwayda']);

/** Mirrors the normaliser the applier uses for reconstructionScore. */
function normalisedReconstructionDelta(raw: number): number {
  return Math.abs(raw) > 1 ? raw / 100 : raw;
}

function freshRichState(): GameState {
  const state = createInitialGameState();
  // Unblock every option so affordability is never what fails a check here.
  state.macro.reservesUSD = 1e12;
  state.macro.treasurySYP = 1e12;
  state.macro.politicalCapital = 200;
  return state;
}

function setProbe(gov: GovernorateNode, field: string): void {
  const rule = FIELD_RULES[field];
  (gov as unknown as Record<string, number>)[field] = rule.base;
}

console.log('=== TEST 1: every governorate effect is applied exactly once ===');
for (const card of ALL_EVENTS) {
  for (const option of card.options) {
    if (!option.governorateEffects?.length) continue;

    // Accumulate expected end values per (governorate, field) so an option that
    // stacks two effects on one field is still checked as a sum applied once each.
    const expected = new Map<string, Map<string, number>>();
    for (const eff of option.governorateEffects) {
      if (!expected.has(eff.governorateId)) expected.set(eff.governorateId, new Map());
      const perGov = expected.get(eff.governorateId)!;
      for (const field of Object.keys(FIELD_RULES)) {
        const raw = (eff as unknown as Record<string, number | undefined>)[field];
        if (raw === undefined) continue;
        const rule = FIELD_RULES[field];
        const delta = field === 'reconstructionScore' ? normalisedReconstructionDelta(raw) : raw;
        const start = perGov.has(field) ? perGov.get(field)! : rule.base;
        perGov.set(field, Math.max(rule.min, Math.min(rule.max, start + delta)));
      }
    }

    const state = freshRichState();
    for (const govId of expected.keys()) {
      const gov = state.governorates[govId];
      if (!gov) continue;
      for (const field of expected.get(govId)!.keys()) setProbe(gov, field);
    }

    resolveEventOption(state, card.id, option.id);

    for (const [govId, perGov] of expected) {
      const gov = state.governorates[govId];
      if (!gov) continue;
      const skip = SPECIAL_CASE_OPTIONS.has(option.id) && govId === 'as_suwayda';
      for (const [field, want] of perGov) {
        if (skip) continue;
        const got = (gov as unknown as Record<string, number>)[field];
        check(
          `${card.id}/${option.id} -> ${govId}.${field}`,
          got === want,
          `expected ${want}, got ${got}`
        );
      }
    }
  }
}
console.log(`  ${assertions} effect assertions across ${ALL_EVENTS.length} cards`);

console.log('\n=== TEST 2: every effectCompetence is applied exactly once ===');
{
  let competenceChecked = 0;
  for (const card of ALL_EVENTS) {
    for (const option of card.options) {
      if (!option.effectCompetence) continue;
      const state = freshRichState();
      const ministries = Object.values(state.ministries);
      const before = ministries.reduce((a, m) => a + m.competence, 0) / ministries.length;
      resolveEventOption(state, card.id, option.id);
      const after = ministries.reduce((a, m) => a + m.competence, 0) / ministries.length;
      // Compare per-ministry: the delta is spread evenly, and any clamping at
      // an individual ministry would show up as a different average.
      const expectedAvg = Math.max(
        0,
        Math.min(100, before + option.effectCompetence)
      );
      check(
        `${card.id}/${option.id} competence`,
        Math.abs(after - expectedAvg) < 1e-9,
        `expected ${expectedAvg}, got ${after}`
      );
      competenceChecked++;
    }
  }
  console.log(`  ${competenceChecked} competence effects checked`);
}

console.log(failures === 0 ? '\nALL EVENT-EFFECT TESTS PASSED!' : `\n${failures} FAILURES of ${assertions}`);
process.exit(failures === 0 ? 0 : 1);
