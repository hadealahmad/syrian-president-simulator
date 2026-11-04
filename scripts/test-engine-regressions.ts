/**
 * Regression tests for the economic-engine bug fixes (AUDIT_ENGINE findings
 * 1-5, 9, 10, 12-19, 22, 24 plus the handed-over STORES#5/#10 items).
 *
 * Style follows scripts/test-audit-split.ts: plain assertions, non-zero exit
 * on the first failing suite's total.
 */
import { createInitialGameState } from '../src/lib/engine/baseline';
import {
  getDefaultTurnDirectives,
  simulateTurnTransitions,
  evaluateRehearsalDirectives,
  executeTurnLifecycle,
  hasDraftSelections,
} from '../src/lib/engine/turn-manager';
import { resolveEventOption } from '../src/lib/engine/events';
import { ALL_EVENTS } from '../src/lib/engine/deck';
import { auditSemiannualBudget } from '../src/lib/engine/revenues';
import { cloneGameState } from '../src/lib/engine/state-clone';
import type { TurnDirectives } from '../src/lib/engine/types';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) console.log(`  ok: ${name}${extra ? ' — ' + extra : ''}`);
  else {
    failures++;
    console.log(`  FAIL: ${name}${extra ? ' — ' + extra : ''}`);
  }
}

const base = (seed = 20241208) => createInitialGameState(seed);
const B = 1_000_000_000;
const M = 1_000_000;

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#1: property monetisation is credited once per turn ===');
{
  const ctrl = simulateTurnTransitions(base(1), getDefaultTurnDirectives());
  const s = base(1);
  const d: TurnDirectives = { ...getDefaultTurnDirectives(), propertyRestitution: 'MONETIZE_AS_STATE_LAND' };
  const mon = simulateTurnTransitions(s, d);

  // Single explicit yield: 8B SYP + $120M, booked by the audit. The old extra
  // 12B SYP in Phase 1 made the treasury jump ~20B/turn.
  const sypDelta = (mon.macro.treasurySYP - ctrl.macro.treasurySYP) / B;
  check('treasury yield ~8B not 20B', sypDelta > 7 && sypDelta < 9, `${sypDelta.toFixed(2)}B`);
  const usdDelta = (mon.macro.reservesUSD - ctrl.macro.reservesUSD) / M;
  check('FX yield ~$120M', Math.abs(usdDelta - 120) < 5, `$${usdDelta.toFixed(1)}M`);
  check(
    'receipt matches the treasury move',
    mon.lastTurnAudit!.netSYPDelta - ctrl.lastTurnAudit!.netSYPDelta ===
      mon.macro.treasurySYP - ctrl.macro.treasurySYP
  );

  // Second turn at the same policy pays the same single yield (a per-turn
  // policy, not a stacked one-shot). Compare against the SAME post-turn-1 state
  // switched back to restitution, so only the policy's own yield differs.
  const mon2 = simulateTurnTransitions(mon, d);
  const alt = simulateTurnTransitions(mon, {
    ...getDefaultTurnDirectives(),
    propertyRestitution: 'RESTITUTE_TO_REFUGEES',
  });
  const sypDelta2 = (mon2.macro.treasurySYP - alt.macro.treasurySYP) / B;
  check('second turn also ~8B', sypDelta2 > 6 && sypDelta2 < 10, `${sypDelta2.toFixed(2)}B`);
  const doubleCredit = (mon.macro.treasurySYP - ctrl.macro.treasurySYP) / B >= 19;
  check('no 12B + 8B double credit', !doubleCredit);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#2: rejected actions are neither applied nor charged ===');
{
  // 5 PC cannot afford the 15-PC Suwayda project.
  const poor = base(2);
  poor.macro.politicalCapital = 5;
  const ctrl = simulateTurnTransitions(base(2), getDefaultTurnDirectives());
  const rejected = simulateTurnTransitions(poor, {
    ...getDefaultTurnDirectives(),
    provincialProjects: ['proj_suwayda_power_lajat'],
  });
  check('project is not executed', !rejected.governorates['as_suwayda'].strategicProject.isExecuted);
  check(
    'no project charge in USD',
    rejected.lastTurnAudit!.expendedUSD - ctrl.lastTurnAudit!.expendedUSD <= 1,
    `+$${(rejected.lastTurnAudit!.expendedUSD - ctrl.lastTurnAudit!.expendedUSD) / M}M`
  );
  check(
    'no project charge in SYP',
    rejected.lastTurnAudit!.expendedSYP === ctrl.lastTurnAudit!.expendedSYP
  );
  // Preview must reject the same action, not bill it.
  const preRejected = evaluateRehearsalDirectives(poor, {
    ...getDefaultTurnDirectives(),
    provincialProjects: ['proj_suwayda_power_lajat'],
  });
  const prePoorCtrl = evaluateRehearsalDirectives(poor, getDefaultTurnDirectives());
  check(
    'preview does not bill the rejected project',
    preRejected.deficitSYP === prePoorCtrl.deficitSYP,
    `pre ${(preRejected.deficitSYP / B).toFixed(2)}B vs control ${(prePoorCtrl.deficitSYP / B).toFixed(2)}B`
  );

  // $5M reserves cannot afford the $20M + 8B demining.
  const broke = base(3);
  broke.macro.reservesUSD = 5 * M;
  const ctrlBroke = simulateTurnTransitions(base(3), getDefaultTurnDirectives());
  const noDemine = simulateTurnTransitions(broke, {
    ...getDefaultTurnDirectives(),
    deminingPriorityId: 'homs',
  });
  check('unaffordable demining not applied', noDemine.governorates['homs'].mineSaturationPct === 40);
  check(
    'unaffordable demining not charged',
    noDemine.lastTurnAudit!.expendedUSD === ctrlBroke.lastTurnAudit!.expendedUSD
  );

  // Same rule for the patronage levers: a grant / charity fund / import surge /
  // brain-gain contract the state cannot fund must not be billed either.
  const noFunds = base(3);
  noFunds.macro.reservesUSD = 10 * M;
  noFunds.macro.treasurySYP = 0;
  const ctrlPoor = simulateTurnTransitions(base(3), getDefaultTurnDirectives());
  const refused = simulateTurnTransitions(noFunds, {
    ...getDefaultTurnDirectives(),
    populistGrant: true,
    charityFundActive: true,
    importSurge: true,
    expatriateBrainGainIncentive: true,
  });
  check('unaffordable grant grants no PC', refused.macro.politicalCapital <= noFunds.macro.politicalCapital);
  check(
    'unaffordable patronage not charged in SYP',
    refused.lastTurnAudit!.expendedSYP === ctrlPoor.lastTurnAudit!.expendedSYP,
    `diff ${((refused.lastTurnAudit!.expendedSYP - ctrlPoor.lastTurnAudit!.expendedSYP) / B).toFixed(2)}B`
  );
  check(
    'unaffordable import surge not charged in USD',
    refused.lastTurnAudit!.expendedUSD === ctrlPoor.lastTurnAudit!.expendedUSD,
    `diff $${((refused.lastTurnAudit!.expendedUSD - ctrlPoor.lastTurnAudit!.expendedUSD) / M).toFixed(1)}M`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#3/#4: nationalisation pays recurring revenue; settlements pay authored terms ===');
{
  const ctrl = simulateTurnTransitions(base(4), getDefaultTurnDirectives());
  const nat1State = simulateTurnTransitions(base(4), {
    ...getDefaultTurnDirectives(),
    oligarchDecisions: { syriatel_mtn: 'NATIONALIZE_SOE' },
  });
  const soe = 6 * B; // constants.ts syriatel_mtn.soeVenueSYPPerTurn
  check(
    'nationalisation books the SOE yield this turn',
    nat1State.lastTurnAudit!.grossCapturedSYP - ctrl.lastTurnAudit!.grossCapturedSYP > 4 * B,
    `+${((nat1State.lastTurnAudit!.grossCapturedSYP - ctrl.lastTurnAudit!.grossCapturedSYP) / B).toFixed(2)}B`
  );
  const nat2State = simulateTurnTransitions(nat1State, getDefaultTurnDirectives());
  const ctrl2 = simulateTurnTransitions(ctrl, getDefaultTurnDirectives());
  check(
    'nationalisation keeps paying next turn',
    nat2State.lastTurnAudit!.grossCapturedSYP - ctrl2.lastTurnAudit!.grossCapturedSYP > 4 * B,
    `+${((nat2State.lastTurnAudit!.grossCapturedSYP - ctrl2.lastTurnAudit!.grossCapturedSYP) / B).toFixed(2)}B`
  );
  const preNat = evaluateRehearsalDirectives(base(4), {
    ...getDefaultTurnDirectives(),
    oligarchDecisions: { syriatel_mtn: 'NATIONALIZE_SOE' },
  });
  const natCommitDeficit =
    nat1State.lastTurnAudit!.expendedSYP - nat1State.lastTurnAudit!.grossCapturedSYP;
  check(
    'preview deficit matches commit (nationalisation)',
    Math.abs(preNat.deficitSYP - natCommitDeficit) / B < 1,
    `preview ${(preNat.deficitSYP / B).toFixed(2)}B vs commit ${(natCommitDeficit / B).toFixed(2)}B`
  );

  const set = simulateTurnTransitions(base(4), {
    ...getDefaultTurnDirectives(),
    oligarchDecisions: { syriatel_mtn: 'SETTLEMENT_80_20' },
  });
  // Authored terms: $350M + 40B SYP (not the old 0.8 x valuation = $520M).
  const usd = (set.macro.reservesUSD - ctrl.macro.reservesUSD) / M;
  const syp = (set.macro.treasurySYP - ctrl.macro.treasurySYP) / B;
  check('settlement pays authored $350M', Math.abs(usd - 350) < 5, `$${usd.toFixed(1)}M`);
  check('settlement pays authored 40B SYP', Math.abs(syp - 40) < 2, `${syp.toFixed(2)}B`);
  // Preview must not promise a different figure than the commit: the preview
  // audits an un-mutated clone, where the same authored terms are booked.
  const pre = evaluateRehearsalDirectives(base(4), {
    ...getDefaultTurnDirectives(),
    oligarchDecisions: { syriatel_mtn: 'SETTLEMENT_80_20' },
  });
  check(
    'preview deficit matches commit (settlement)',
    Math.abs(pre.deficitSYP - (set.lastTurnAudit!.expendedSYP - set.lastTurnAudit!.grossCapturedSYP)) / B < 1,
    `preview ${(pre.deficitSYP / B).toFixed(2)}B vs commit ${((set.lastTurnAudit!.expendedSYP - set.lastTurnAudit!.grossCapturedSYP) / B).toFixed(2)}B`
  );

  const liq = simulateTurnTransitions(base(4), {
    ...getDefaultTurnDirectives(),
    oligarchDecisions: { syriatel_mtn: 'FOREIGN_LIQUIDATION' },
  });
  const liqUSD = (liq.macro.reservesUSD - ctrl.macro.reservesUSD) / M;
  check('liquidation pays authored $520M', Math.abs(liqUSD - 520) < 5, `$${liqUSD.toFixed(1)}M`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#5: grid capacity is added once (Phase 4 only) ===');
{
  const s = base(5);
  const n = simulateTurnTransitions(s, getDefaultTurnDirectives());
  const gained = n.macro.gridCapacityMW - s.macro.gridCapacityMW;
  // Phase 4 at $35M CapEx: effectiveCapEx * 15 / 1M = 272 MW. The audit's extra
  // 12 MW/$M made it 671.
  check('default CapEx adds 272 MW', gained === 272, `+${gained} MW`);
  const huge = simulateTurnTransitions(base(6), {
    ...getDefaultTurnDirectives(),
    gridCapExUSD: 5_000_000_000,
  });
  check('capacity never exceeds 6000 MW', huge.macro.gridCapacityMW <= 6000, `${huge.macro.gridCapacityMW}`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#9: demining is charged when the action crosses the 8% threshold ===');
{
  const s = base(7);
  s.governorates['homs'].mineSaturationPct = 12;
  const ctrl = simulateTurnTransitions(base(7), getDefaultTurnDirectives());
  const n = simulateTurnTransitions(s, { ...getDefaultTurnDirectives(), deminingPriorityId: 'homs' });
  check('12% -> 4%', n.governorates['homs'].mineSaturationPct === 4);
  check(
    'charged $20M',
    n.lastTurnAudit!.expendedUSD - ctrl.lastTurnAudit!.expendedUSD === 20 * M,
    `+$${(n.lastTurnAudit!.expendedUSD - ctrl.lastTurnAudit!.expendedUSD) / M}M`
  );
  check(
    'charged 8B SYP',
    n.lastTurnAudit!.expendedSYP - ctrl.lastTurnAudit!.expendedSYP === 8 * B
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#10: receipt USD delta equals the real reserve change ===');
{
  const s = base(8);
  const d: TurnDirectives = { ...getDefaultTurnDirectives(), signedLoanIds: ['loan_gulf_swf'] };
  const n = executeTurnLifecycle(s, d);
  check(
    'Gulf loan: ledger == end - start',
    n.lastTurnAudit!.netUSDDelta === n.macro.reservesUSD - s.macro.reservesUSD,
    `ledger $${(n.lastTurnAudit!.netUSDDelta / M).toFixed(2)}M vs real $${((n.macro.reservesUSD - s.macro.reservesUSD) / M).toFixed(2)}M`
  );
  check('ledger includes the $400M disbursement', n.lastTurnAudit!.netUSDDelta > 380 * M);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#12: legacy coupon stops when the legacy debt is repudiated ===');
{
  const s = base(9);
  s.macro.sovereignDebtUSD = 0;
  const n = simulateTurnTransitions(s, getDefaultTurnDirectives());
  check('zero coupon at zero recognised stock', n.lastTurnAudit!.debtServiceUSD === 0, `$${n.lastTurnAudit!.debtServiceUSD}`);
  const half = base(9);
  half.macro.sovereignDebtUSD = 3_050_000_000;
  const h = simulateTurnTransitions(half, getDefaultTurnDirectives());
  check('half stock -> half coupon', h.lastTurnAudit!.debtServiceUSD === 22_500_000, `$${h.lastTurnAudit!.debtServiceUSD}`);
  const plain = simulateTurnTransitions(base(9), getDefaultTurnDirectives());
  check('baseline coupon unchanged', plain.lastTurnAudit!.debtServiceUSD === 45_000_000, `$${plain.lastTurnAudit!.debtServiceUSD}`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#13: mortgage revenue is forfeited once, not twice ===');
{
  const s = base(10);
  const d: TurnDirectives = { ...getDefaultTurnDirectives(), executedMortgageIds: ['mortgage_tartus_port'] };
  const n = executeTurnLifecycle(s, d);
  check('authored $55M drain booked once', n.lastTurnAudit!.mortgageDrainUSD === 55 * M, `$${n.lastTurnAudit!.mortgageDrainUSD / M}M`);
  const plain = executeTurnLifecycle(base(10), getDefaultTurnDirectives());
  // +$150M cash, minus the $55M concession drain. The old code also cut the
  // port revenue line ($24M -> $6M), so the player paid $73M for the same deal.
  check(
    'net +$95M (one charge)',
    n.macro.reservesUSD - plain.macro.reservesUSD === 95 * M,
    `$${((n.macro.reservesUSD - plain.macro.reservesUSD) / M).toFixed(1)}M`
  );
  // Port revenue must not also be reduced: gross capture stays at the baseline
  // for that line (no -$18M override on top of the drain).
  check(
    'gross capture not also reduced',
    n.lastTurnAudit!.grossCapturedUSD === plain.lastTurnAudit!.grossCapturedUSD,
    `$${n.lastTurnAudit!.grossCapturedUSD / M}M vs $${plain.lastTurnAudit!.grossCapturedUSD / M}M`
  );
  // The preview must book the same single charge, not skip it because the
  // mortgage is still PENDING on the rehearsal clone.
  const preMortgage = auditSemiannualBudget(cloneGameState(s), d);
  check(
    'preview books the same $55M drain',
    preMortgage.mortgageDrainUSD === 55 * M,
    `$${preMortgage.mortgageDrainUSD / M}M`
  );
  check(
    'preview net delta matches committed net delta',
    Math.abs(preMortgage.netUSDDelta - n.lastTurnAudit!.netUSDDelta) < 1 * M,
    `$${(preMortgage.netUSDDelta / M).toFixed(2)}M vs $${(n.lastTurnAudit!.netUSDDelta / M).toFixed(2)}M`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#14: authored strategic-project effects are applied ===');
{
  const s = base(11);
  const before = s.governorates['daraa'];
  const beforeSkilled = before.skilledLaborCount;
  const beforeCapture = before.nassibRevenueCapturePct ?? 0;
  const n = executeTurnLifecycle(s, {
    ...getDefaultTurnDirectives(),
    provincialProjects: ['proj_daraa_nassib_border'],
  });
  const after = n.governorates['daraa'];
  check('project executed', after.strategicProject.isExecuted);
  check('skilled labour bonus applied', after.skilledLaborCount === beforeSkilled + 4000, `${beforeSkilled} -> ${after.skilledLaborCount}`);
  check('nassib capture boost applied', after.nassibRevenueCapturePct === Math.min(100, beforeCapture + 48), `${beforeCapture} -> ${after.nassibRevenueCapturePct}`);
  // The preview bills the project and books its first yield at the boosted
  // capture rate, so it no longer understates the turn relative to the commit.
  const d: TurnDirectives = {
    ...getDefaultTurnDirectives(),
    provincialProjects: ['proj_daraa_nassib_border'],
  };
  const preProject = auditSemiannualBudget(cloneGameState(s), d);
  check(
    'preview books the project recurring yield',
    preProject.projectRevenueSYP === n.lastTurnAudit!.projectRevenueSYP,
    `${(preProject.projectRevenueSYP / B).toFixed(2)}B vs ${(n.lastTurnAudit!.projectRevenueSYP / B).toFixed(2)}B`
  );
  check(
    'preview net delta matches committed net delta (project)',
    Math.abs(preProject.netUSDDelta - n.lastTurnAudit!.netUSDDelta) < 1 * M,
    `$${(preProject.netUSDDelta / M).toFixed(2)}M vs $${(n.lastTurnAudit!.netUSDDelta / M).toFixed(2)}M`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#15: event effectRRI survives the per-turn recompute ===');
{
  const event = ALL_EVENTS.find((e) => e.options.some((o) => Math.abs(o.effectRRI) >= 10))!;
  const option = event.options.find((o) => Math.abs(o.effectRRI) >= 10)!;
  const s = base(12);
  const opening = s.macro.nationalRRI;
  resolveEventOption(s, event.id, option.id);
  const afterEvent = s.macro.nationalRRI;
  check('event moved the index', afterEvent !== opening, `${opening} -> ${afterEvent}`);
  const n = executeTurnLifecycle(s, getDefaultTurnDirectives());
  // Most of the authored shock must still be visible after the mean recompute
  // (small drift comes from the turn's own PRRI relief).
  check(
    'shock survives the commit',
    n.macro.nationalRRI > opening + option.effectRRI * 0.5,
    `opening ${opening}, expected ~${opening + option.effectRRI}, got ${n.macro.nationalRRI}`
  );
  // And it must not re-apply itself every turn.
  const n2 = executeTurnLifecycle(n, getDefaultTurnDirectives());
  check('shock does not compound', Math.abs(n2.macro.nationalRRI - n.macro.nationalRRI) < 12, `${n.macro.nationalRRI} -> ${n2.macro.nationalRRI}`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#16: operating + investment == expendedSYP (no USD CapEx in the split) ===');
{
  const n = simulateTurnTransitions(base(13), getDefaultTurnDirectives());
  const a = n.lastTurnAudit!;
  check('split is exact', a.operatingExpendedSYP + a.investmentExpendedSYP === a.expendedSYP);
  check('default turn has no phantom SYP investment', a.investmentExpendedSYP === 0, `${(a.investmentExpendedSYP / B).toFixed(2)}B`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#17: facilities cannot be signed without political capital ===');
{
  const broke = base(14);
  broke.macro.politicalCapital = 0;
  const n = executeTurnLifecycle(broke, {
    ...getDefaultTurnDirectives(),
    signedFacilityIds: ['facility_iran_reschedule'],
  });
  const fs = n.facilities.find((f) => f.id === 'facility_iran_reschedule');
  check('facility stays AVAILABLE', fs?.status === 'AVAILABLE', `${fs?.status}`);
  check('PC never goes negative', n.macro.politicalCapital === 0, `${n.macro.politicalCapital}`);
  check('reschedule coupon not granted for free', n.lastTurnAudit!.iranOilCouponUSD === 25 * M, `$${n.lastTurnAudit!.iranOilCouponUSD}`);

  const rich = base(14);
  const ok = executeTurnLifecycle(rich, {
    ...getDefaultTurnDirectives(),
    signedFacilityIds: ['facility_iran_reschedule'],
  });
  check('affordable facility still signs', ok.facilities.find((f) => f.id === 'facility_iran_reschedule')?.status === 'COMPLETED');
  check('coupon rescheduled once signed', ok.lastTurnAudit!.iranOilCouponUSD === 10 * M, `$${ok.lastTurnAudit!.iranOilCouponUSD}`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#18: southern-policy tiers hold after the PRRI recompute ===');
{
  const hot = base(15);
  hot.governorates['as_suwayda'].prri = 90;
  hot.governorates['daraa'].prri = 90;
  const accord = simulateTurnTransitions(hot, {
    ...getDefaultTurnDirectives(),
    southernPolicy: 'HISTORIC_ACCORD',
  });
  check(
    'accord keeps CALM',
    accord.governorates['as_suwayda'].tier === 'CALM' && accord.governorates['daraa'].tier === 'CALM',
    `${accord.governorates['as_suwayda'].tier}/${accord.governorates['daraa'].tier} at PRRI ${accord.governorates['as_suwayda'].prri.toFixed(0)}/${accord.governorates['daraa'].prri.toFixed(0)}`
  );
  const blockade = simulateTurnTransitions(base(15), {
    ...getDefaultTurnDirectives(),
    southernPolicy: 'BLOCKADE',
  });
  check(
    'blockade keeps REVOLT',
    blockade.governorates['as_suwayda'].tier === 'REVOLT' && blockade.governorates['daraa'].tier === 'REVOLT',
    `${blockade.governorates['as_suwayda'].tier}/${blockade.governorates['daraa'].tier}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#22: ABSORB / PRUNE act on the current headcount ===');
{
  const s = base(16);
  const one = executeTurnLifecycle(s, { ...getDefaultTurnDirectives(), workforceStrategy: 'PRUNE_CIVIL_SERVICE' });
  const two = executeTurnLifecycle(one, { ...getDefaultTurnDirectives(), workforceStrategy: 'PRUNE_CIVIL_SERVICE' });
  check('first prune 1.4M -> 1.05M', one.macro.civilServiceHeadcount === 1_050_000, `${one.macro.civilServiceHeadcount}`);
  check('second prune is cumulative', two.macro.civilServiceHeadcount === 787_500, `${two.macro.civilServiceHeadcount}`);

  const nation = executeTurnLifecycle(base(16), {
    ...getDefaultTurnDirectives(),
    oligarchDecisions: { syriatel_mtn: 'NATIONALIZE_SOE' },
    workforceStrategy: 'ABSORB_MILITIAS',
  });
  check(
    'absorb builds on the +8 000 nationalisation headcount',
    nation.macro.civilServiceHeadcount === Math.round((1_400_000 + 8000) * 1.2),
    `${nation.macro.civilServiceHeadcount}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#24: hasDraftSelections sees the three missing levers ===');
{
  const d = getDefaultTurnDirectives();
  check('default draft reports no selections', !hasDraftSelections(d));
  check('moneyPrintingSYP detected', hasDraftSelections({ ...d, moneyPrintingSYP: 5 * B }));
  check('officialRateAdjustment detected', hasDraftSelections({ ...d, officialRateAdjustment: 2 }));
  check('antiSpeculationRaids detected', hasDraftSelections({ ...d, antiSpeculationRaids: true }));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== STORES#5: grant-bucket refund lands before the reserve clamp ===');
{
  const s = base(17);
  s.macro.reservesUSD = 10 * M;
  s.macro.grantBucketUSD = 20 * M; // ring-fenced dollars cover the $20M project
  const n = simulateTurnTransitions(s, {
    ...getDefaultTurnDirectives(),
    gridCapExUSD: 75 * M, // makes the audit's non-project delta negative
    provincialProjects: ['proj_daraa_nassib_border'],
  });
  check('project executed from the bucket', n.governorates['daraa'].strategicProject.isExecuted);
  check('bucket emptied', (n.macro.grantBucketUSD ?? 0) === 0);
  // Opening $10M + the audit delta (which charges the $20M project) + the $20M
  // refund ≈ $5M. Refunding after the clamp instead leaves ≥$20M, because the
  // clamp would have already zeroed the deficit and the full refund added back.
  check(
    'refund is netted against the clamp',
    n.macro.reservesUSD > 0 && n.macro.reservesUSD < 10 * M,
    `$${(n.macro.reservesUSD / M).toFixed(3)}M`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#19: preview uses the same clamped auction as the commit ===');
{
  const s = base(18);
  const d: TurnDirectives = { ...getDefaultTurnDirectives(), dollarAuctionUSD: 1_000_000_000 };
  const pre = evaluateRehearsalDirectives(s, d);
  const n = executeTurnLifecycle(s, d);
  check(
    'preview runway == commit runway',
    Math.abs(pre.runwayMonthsEstimated - n.lastTurnAudit!.runwayMonths) < 0.05,
    `preview ${pre.runwayMonthsEstimated} vs commit ${n.lastTurnAudit!.runwayMonths}`
  );
  check(
    'preview FX band contains the committed rate',
    n.macro.parallelRateSYP >= pre.fxRateMin && n.macro.parallelRateSYP <= pre.fxRateMax,
    `${pre.fxRateMin}-${pre.fxRateMax} vs ${n.macro.parallelRateSYP}`
  );
  // The audit itself must see the clamped directive, not the raw $1B.
  const ctrl = executeTurnLifecycle(base(18), getDefaultTurnDirectives());
  const auctionCost = n.lastTurnAudit!.expendedUSD - ctrl.lastTurnAudit!.expendedUSD;
  check(
    'audit charged the clamped $320M, not $1B',
    Math.abs(auctionCost - 320 * M) < 1 * M,
    `$${(auctionCost / M).toFixed(1)}M`
  );

  // STORES#10's exact trigger: $20M on hand, the $500M IMF loan lands first,
  // then a $300M auction. Both paths must price the same post-loan clamp.
  const low = base(18);
  low.macro.reservesUSD = 20 * M;
  const lowD: TurnDirectives = {
    ...getDefaultTurnDirectives(),
    signedLoanIds: ['loan_imf_wb'],
    dollarAuctionUSD: 300 * M,
  };
  const lowPre = evaluateRehearsalDirectives(low, lowD);
  const lowTurn = executeTurnLifecycle(low, lowD);
  const lowCtrl = executeTurnLifecycle(low, getDefaultTurnDirectives());
  check(
    'loan-funded auction: preview runway == commit runway',
    Math.abs(lowPre.runwayMonthsEstimated - lowTurn.lastTurnAudit!.runwayMonths) < 0.05,
    `preview ${lowPre.runwayMonthsEstimated} vs commit ${lowTurn.lastTurnAudit!.runwayMonths}`
  );
  check(
    'loan-funded auction: full $300M is sellable',
    Math.abs(
      lowTurn.lastTurnAudit!.expendedUSD - lowCtrl.lastTurnAudit!.expendedUSD - 300 * M
    ) < 1 * M,
    `+$${((lowTurn.lastTurnAudit!.expendedUSD - lowCtrl.lastTurnAudit!.expendedUSD) / M).toFixed(1)}M`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#23: default seigniorage path (UI lever now exists) ===');
{
  // The engine's seigniorage lever used to be unreachable from the UI. This
  // note keeps the macro trajectory visible; the lever itself is exercised by
  // ENGINE#23b below and lives in TaxFinancePanel.
  let s = base(19);
  for (let i = 0; i < 10; i++) s = executeTurnLifecycle(s, getDefaultTurnDirectives());
  console.log(`  note: 10 default turns end at treasury ${(s.macro.treasurySYP / B).toFixed(1)}B SYP`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#23b: money printing is financing, not revenue ===');
{
  const printSYP = 30 * B;
  const d: TurnDirectives = { ...getDefaultTurnDirectives(), moneyPrintingSYP: printSYP };
  const ctrl = executeTurnLifecycle(base(23), getDefaultTurnDirectives());
  const funded = executeTurnLifecycle(base(23), d);

  check(
    'printed SYP reaches the treasury in full',
    Math.abs(funded.macro.treasurySYP - ctrl.macro.treasurySYP - printSYP) <= M,
    `${((funded.macro.treasurySYP - ctrl.macro.treasurySYP - printSYP) / M).toFixed(1)}M drift`
  );
  check(
    'seigniorage is booked separately from captured revenue',
    funded.lastTurnAudit!.seignioragePrintedSYP === printSYP &&
      funded.lastTurnAudit!.grossCapturedSYP === ctrl.lastTurnAudit!.grossCapturedSYP
  );
  check(
    'printing expands M2 by the printed amount',
    funded.macro.m2MoneySupplySYP - ctrl.macro.m2MoneySupplySYP >= printSYP - 1,
    `${((funded.macro.m2MoneySupplySYP - ctrl.macro.m2MoneySupplySYP) / B).toFixed(1)}B`
  );
  check(
    'printing weakens the parallel rate versus no print',
    funded.macro.parallelRateSYP > ctrl.macro.parallelRateSYP,
    `${ctrl.macro.parallelRateSYP} → ${funded.macro.parallelRateSYP}`
  );

  const ctrlPre = evaluateRehearsalDirectives(base(23), getDefaultTurnDirectives());
  const pre = evaluateRehearsalDirectives(base(23), d);
  check('rehearsal exposes the planned print', pre.requiresPrintingSYP === printSYP);
  check(
    'rehearsal deficit stays pre-financing (printing does not shrink it)',
    Math.abs(pre.deficitSYP - ctrlPre.deficitSYP) < 1,
    `${pre.deficitSYP} vs ${ctrlPre.deficitSYP}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('=== ENGINE#23c: an overdraft pays 5%/turn interest ===');
{
  const overdrawn = base(24);
  overdrawn.macro.treasurySYP = -100 * B;
  const turn = executeTurnLifecycle(overdrawn, getDefaultTurnDirectives());
  check(
    'interest is 5% of the negative opening balance',
    turn.lastTurnAudit!.overdraftInterestSYP === 5 * B,
    `${(turn.lastTurnAudit!.overdraftInterestSYP / B).toFixed(2)}B`
  );
  const noOverdraft = base(24);
  noOverdraft.macro.treasurySYP = 0;
  const solvent = executeTurnLifecycle(noOverdraft, getDefaultTurnDirectives());
  check(
    'the interest is charged to the treasury',
    Math.abs(
      turn.lastTurnAudit!.expendedSYP - solvent.lastTurnAudit!.expendedSYP - 5 * B
    ) <= M,
    `${((turn.lastTurnAudit!.expendedSYP - solvent.lastTurnAudit!.expendedSYP - 5 * B) / M).toFixed(1)}M drift`
  );
}

console.log(
  failures === 0
    ? '\nALL ENGINE REGRESSION TESTS PASSED!'
    : `\n${failures} FAILURES`
);
process.exit(failures === 0 ? 0 : 1);
