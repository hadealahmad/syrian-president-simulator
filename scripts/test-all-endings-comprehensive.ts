/**
 * Player-Legal Endings Regression Suite (`npm run test:endings`)
 *
 * "Player-legal" means every turn of every route is driven solely through
 * TurnDirectives produced from draft defaults, checked by the single validator
 * `validatePlayerLegalDirectives()` (which throws on any violation of the
 * live UI's sliders, stances, turn locks, FX-coverage gates, loan/facility
 * rules, or TurnReview budget guard), committed via `executeTurnLifecycle`, and
 * answered via `canAffordEventOption` or `applyUnresolvedCrisisPenalty` on a
 * cloned state — with zero direct GameState mutation anywhere.
 *
 * When UI controls or limits change, update `UI_LIMITS_TABLE` in
 * `scripts/endings-legal-play.ts` to match the cited Svelte/store files.
 */

import { calculateTurnBudget } from '../src/lib/stores/draft-store';
import { createInitialGameState } from '../src/lib/engine/baseline';
import {
  getDefaultTurnDirectives,
  calculateProjectedTurnSummary,
} from '../src/lib/engine/turn-manager';
import { IMPORT_SURGE_COST_USD } from '../src/lib/engine/revenues';
import {
  runLegalGame,
  validatePlayerLegalDirectives,
  fitGridCapEx,
  cheapestEventOption,
  survivalEventPicker,
  phoenixPolicy,
} from './endings-legal-play';
import type { LegalRunResult } from './endings-legal-play';

interface EndingReportRow {
  id: string;
  passed: boolean;
  turn: number;
  violations: number;
  triggerFigures: string;
  violationMessages: string[];
}

const WINNABILITY_SEEDS = [
  20241208,
  ...Array.from({ length: 49 }, (_, i) => (i + 1) * 97 + 13),
];
const MIN_PHOENIX_WINS = 35;

const capturedWarnings: string[] = [];
const capturedErrors: string[] = [];
const origWarn = console.warn;
const origError = console.error;

console.warn = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  capturedWarnings.push(msg);
};
console.error = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  capturedErrors.push(msg);
};

function assertValidatorSelfChecks(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const baseState = createInitialGameState(20241208);

  // 1. Both propertyRestitution options must be valid in the validator
  //    (while no ending route depends on MONETIZE_AS_STATE_LAND).
  try {
    const monetizeDraft = {
      ...getDefaultTurnDirectives(),
      propertyRestitution: 'MONETIZE_AS_STATE_LAND' as const,
    };
    validatePlayerLegalDirectives(baseState, monetizeDraft);
  } catch (err) {
    failures.push(`MONETIZE_AS_STATE_LAND unexpectedly rejected: ${String(err)}`);
  }

  // 2. Representative UI-illegal inputs must throw.
  const expectThrow = (label: string, fn: () => void) => {
    try {
      fn();
      failures.push(`Expected validator to throw on ${label}, but it passed`);
    } catch {
      // Expected
    }
  };

  expectThrow('negative wageBumpPercent', () => {
    validatePlayerLegalDirectives(baseState, {
      ...getDefaultTurnDirectives(),
      wageBumpPercent: -10,
    });
  });

  expectThrow('off-step wageBumpPercent (3)', () => {
    validatePlayerLegalDirectives(baseState, {
      ...getDefaultTurnDirectives(),
      wageBumpPercent: 3,
    });
  });

  expectThrow('gridCapExUSD > $80M', () => {
    validatePlayerLegalDirectives(baseState, {
      ...getDefaultTurnDirectives(),
      gridCapExUSD: 500_000_000,
    });
  });

  expectThrow('oligarchDecisions on Turn 1', () => {
    validatePlayerLegalDirectives(baseState, {
      ...getDefaultTurnDirectives(),
      oligarchDecisions: { syriatel_mtn: 'SETTLEMENT_80_20' },
    });
  });

  expectThrow('IMF loan after Paris Club repudiation', () => {
    validatePlayerLegalDirectives(baseState, {
      ...getDefaultTurnDirectives(),
      activePoliticalActions: ['REPUDIATE_PARIS'],
      signedLoanIds: ['loan_imf_wb'],
    });
  });

  expectThrow('IMF facility without CRACKDOWN diesel stance', () => {
    validatePlayerLegalDirectives(baseState, {
      ...getDefaultTurnDirectives(),
      signedFacilityIds: ['facility_imf_stabilization'],
      dieselSmuggling: 'STANDARD',
    });
  });

  expectThrow('dollarAuctionUSD above reserves', () => {
    validatePlayerLegalDirectives(baseState, {
      ...getDefaultTurnDirectives(),
      dollarAuctionUSD: baseState.macro.reservesUSD + 50_000_000,
    });
  });

  return { ok: failures.length === 0, failures };
}

function recordRow(
  id: string,
  passed: boolean,
  run: LegalRunResult,
  triggerFigures: string
): EndingReportRow {
  return {
    id,
    passed: passed && run.violations === 0,
    turn: run.state.turnNumber,
    violations: run.violations,
    triggerFigures,
    violationMessages: run.violationMessages,
  };
}

const startedAt = Date.now();
let exitCode = 0;

try {
  const selfCheck = assertValidatorSelfChecks();
  const rows: EndingReportRow[] = [];

  // 1. SOVEREIGN_INSOLVENCY (Fail State)
  {
    const r = runLegalGame(
      101,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.gridCapExUSD = 80_000_000;
        d.importSurge = (state.macro.reservesUSD ?? 0) >= IMPORT_SURGE_COST_USD;
        d.remittanceCaptureSpread = 5;
        d.nassibTransitFeeUSD = 200;
        d.wheatProcurement = 'SUBSIDIZED_LOW';
        d.golanBorderStance = 'UN_LIAISON';
        const budgetBefore = calculateTurnBudget(state, d);
        const maxAuctionSliderM =
          Math.floor(Math.max(0, Math.floor((state.macro.reservesUSD ?? 0) / 1_000_000)) / 5) * 5;
        const maxAllowedM = Math.floor(Math.max(0, budgetBefore.remainingUSD) / 5_000_000) * 5;
        d.dollarAuctionUSD = Math.min(maxAuctionSliderM, maxAllowedM) * 1_000_000;
        return d;
      },
      (_s, _ev, opts) => [...opts].sort((a, b) => b.costUSD - a.costUSD)[0]
    );
    rows.push(
      recordRow(
        'SOVEREIGN_INSOLVENCY',
        r.state.failState?.type === 'SOVEREIGN_INSOLVENCY',
        r,
        `reservesUSD=$${(r.state.macro.reservesUSD / 1_000_000).toFixed(1)}M`
      )
    );
  }

  // 2. URBAN_INSURRECTION (Fail State)
  {
    const r = runLegalGame(
      202,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.wageBumpPercent = 0;
        d.foodSubsidyLevel = 'AUSTERE';
        d.wheatProcurement = 'SUBSIDIZED_LOW';
        d.telecomExciseRate = 30;
        d.corporateTaxRate = 35;
        d.remittanceCaptureSpread = 25;
        d.gridCapExUSD = 0;
        d.workforceStrategy = 'PRUNE_CIVIL_SERVICE';
        d.dieselSmuggling = 'CRACKDOWN';
        const proj = calculateProjectedTurnSummary(state, d);
        d.moneyPrintingSYP = Math.max(
          50_000_000_000,
          Math.ceil((proj.deficitSYP * 1.5) / 5_000_000_000) * 5_000_000_000
        );
        return d;
      },
      (_s, _ev, opts) => [...opts].sort((a, b) => b.effectRRI - a.effectRRI)[0]
    );
    const revolts = Object.values(r.state.governorates).filter((g) => g.tier === 'REVOLT').length;
    rows.push(
      recordRow(
        'URBAN_INSURRECTION',
        r.state.failState?.type === 'URBAN_INSURRECTION',
        r,
        `nationalRRI=${r.state.macro.nationalRRI}, revolts=${revolts}`
      )
    );
  }

  // 3. SECURITY_MUTINY (Fail State)
  {
    const r = runLegalGame(
      303,
      (state, prev) => {
        const d = { ...prev };
        d.wageBumpPercent = 0;
        d.foodSubsidyLevel = 'GENEROUS';
        d.gridCapExUSD = 20_000_000;
        d.remittanceCaptureSpread = 25;
        d.nassibTransitFeeUSD = 600;
        d.southernPolicy = 'LOCAL_VOUCHERS';
        d.activePoliticalActions = state.macro.civicTrust >= 20 ? ['MARTIAL_LAW'] : [];
        if (state.turnNumber > 2) {
          const decisions: Record<string, 'NATIONALIZE_SOE'> = {};
          for (const a of state.confiscatedAssets) {
            if (a.status === 'PENDING') decisions[a.id] = 'NATIONALIZE_SOE';
          }
          d.oligarchDecisions = decisions;
        }
        const proj = calculateProjectedTurnSummary(state, d);
        const printingMax = Math.max(
          50_000_000_000,
          Math.ceil((proj.deficitSYP * 1.5) / 5_000_000_000) * 5_000_000_000
        );
        const realWage = state.macro.civilServiceWageSYP / Math.max(1, state.macro.parallelRateSYP);
        d.moneyPrintingSYP = realWage >= 7.5 ? printingMax : 0;
        return d;
      },
      (_s, _ev, opts) =>
        [...opts].sort(
          (a, b) => b.effectCorruption - a.effectCorruption || a.effectRRI - b.effectRRI
        )[0]
    );
    const rw = r.state.macro.civilServiceWageSYP / Math.max(1, r.state.macro.parallelRateSYP);
    rows.push(
      recordRow(
        'SECURITY_MUTINY',
        r.state.failState?.type === 'SECURITY_MUTINY',
        r,
        `realWage=$${rw.toFixed(2)}, corruption=${r.state.macro.systemicCorruption}`
      )
    );
  }

  // 4. BALKANIZATION_CASCADE (Fail State)
  {
    const r = runLegalGame(
      404,
      () => {
        const d = getDefaultTurnDirectives();
        d.southernPolicy = 'BLOCKADE';
        d.foodSubsidyLevel = 'STANDARD';
        d.wageBumpPercent = 5;
        d.gridCapExUSD = 30_000_000;
        return d;
      },
      (_s, _ev, opts) => cheapestEventOption(opts)
    );
    rows.push(
      recordRow(
        'BALKANIZATION_CASCADE',
        r.state.failState?.type === 'BALKANIZATION_CASCADE',
        r,
        `suwaydaSec=${r.state.governorates['as_suwayda']?.suwaydaSecessionProb}`
      )
    );
  }

  // 5. CRISIS_DEFAULT_COLLAPSE (Fail State)
  {
    const r = runLegalGame(
      505,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.wageBumpPercent = 0;
        d.foodSubsidyLevel = state.macro.nationalRRI >= 70 ? 'GENEROUS' : 'AUSTERE';
        d.gridCapExUSD = 0;
        d.remittanceCaptureSpread = 25;
        d.nassibTransitFeeUSD = 800;
        d.activePoliticalActions = ['MARTIAL_LAW'];
        if (!state.enactedDecrees?.includes('REPUDIATE_PARIS')) {
          d.activePoliticalActions.push('REPUDIATE_PARIS');
        }
        const proj = calculateProjectedTurnSummary(state, d);
        d.moneyPrintingSYP = Math.max(
          50_000_000_000,
          Math.ceil((proj.deficitSYP * 1.5) / 5_000_000_000) * 5_000_000_000
        );
        return d;
      },
      (_s, _ev, opts) =>
        [...opts].sort((a, b) => a.effectTrust - b.effectTrust || a.costUSD - b.costUSD)[0]
    );
    rows.push(
      recordRow(
        'CRISIS_DEFAULT_COLLAPSE',
        r.state.failState?.type === 'CRISIS_DEFAULT_COLLAPSE',
        r,
        `RRI=${r.state.macro.nationalRRI}, trust=${r.state.macro.civicTrust}, PC=${r.state.macro.politicalCapital}`
      )
    );
  }

  // 6. sovereign_phoenix (Century Ending)
  {
    const r = runLegalGame(606, phoenixPolicy, (s, _e, opts) =>
      survivalEventPicker(opts, s, 'phoenix')
    );
    const avgRec =
      Object.values(r.state.governorates).reduce((a, g) => a + g.reconstructionScore, 0) / 14;
    rows.push(
      recordRow(
        'sovereign_phoenix',
        r.state.centuryEnding?.id === 'sovereign_phoenix',
        r,
        `score=${r.state.centuryEnding?.finalScore}, corr=${r.state.macro.systemicCorruption}, rec=${(avgRec * 100).toFixed(1)}%, lev=${r.state.macro.sovereignLeverage}, debt=$${(r.state.macro.sovereignDebtUSD / 1e9).toFixed(1)}B, pow=${r.state.macro.dailyPowerHours}`
      )
    );
  }

  // 7. mortgaged_enclave (Century Ending)
  {
    const r = runLegalGame(
      707,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.wageBumpPercent = 5;
        d.foodSubsidyLevel = state.macro.nationalRRI > 50 ? 'GENEROUS' : 'STANDARD';
        d.southernPolicy = 'LOCAL_VOUCHERS';
        d.activePoliticalActions = ['CABINET_HEARING'];
        if (!state.enactedDecrees?.includes('OPPOSITION_SEATS')) {
          d.activePoliticalActions.push('OPPOSITION_SEATS');
        }
        d.nassibTransitFeeUSD = 800;
        d.remittanceCaptureSpread = 20;
        d.corporateTaxRate = 25;
        d.telecomExciseRate = 20;
        if (state.turnNumber === 1) {
          d.signedLoanIds = ['loan_imf_wb', 'loan_gulf_swf', 'loan_eastern_credit'];
          d.executedMortgageIds = ['mortgage_khneifis_phosphate'];
        }
        fitGridCapEx(state, d, 35, 30_000_000);
        return d;
      },
      (s, _e, opts) => survivalEventPicker(opts, s, 'mortgaged')
    );
    rows.push(
      recordRow(
        'mortgaged_enclave',
        r.state.centuryEnding?.id === 'mortgaged_enclave',
        r,
        `lev=${r.state.macro.sovereignLeverage}, debt=$${(r.state.macro.sovereignDebtUSD / 1e9).toFixed(2)}B`
      )
    );
  }

  // 8. ecological_dust_bowl (Century Ending)
  {
    const r = runLegalGame(
      808,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.wageBumpPercent = 5;
        d.gridCapExUSD = 0;
        d.foodSubsidyLevel = 'GENEROUS';
        d.southernPolicy = 'LOCAL_VOUCHERS';
        d.activePoliticalActions = ['CABINET_HEARING'];
        if (!state.enactedDecrees?.includes('OPPOSITION_SEATS')) {
          d.activePoliticalActions.push('OPPOSITION_SEATS');
        }
        d.nassibTransitFeeUSD = 700;
        d.remittanceCaptureSpread = 15;
        return d;
      },
      (s, _e, opts) => survivalEventPicker(opts, s, 'dust')
    );
    rows.push(
      recordRow(
        'ecological_dust_bowl',
        r.state.centuryEnding?.id === 'ecological_dust_bowl',
        r,
        `dailyPowerHours=${r.state.macro.dailyPowerHours}`
      )
    );
  }

  // 9. garrison_bastion (Century Ending)
  {
    const r = runLegalGame(
      909,
      (state) => {
        const d = getDefaultTurnDirectives();
        if (state.turnNumber === 3) {
          d.oligarchDecisions = {
            syriatel_mtn: 'NATIONALIZE_SOE',
            hamsho_steel: 'NATIONALIZE_SOE',
            marota_city: 'NATIONALIZE_SOE',
            four_seasons_damascus: 'NATIONALIZE_SOE',
          };
        }
        d.wageBumpPercent = 5;
        d.foodSubsidyLevel = 'GENEROUS';
        d.southernPolicy = 'LOCAL_VOUCHERS';
        d.activePoliticalActions = ['CABINET_HEARING'];
        d.nassibTransitFeeUSD = 700;
        d.remittanceCaptureSpread = 15;
        fitGridCapEx(state, d, 25, 25_000_000);
        return d;
      },
      (s, _e, opts) => survivalEventPicker(opts, s, 'garrison')
    );
    rows.push(
      recordRow(
        'garrison_bastion',
        r.state.centuryEnding?.id === 'garrison_bastion',
        r,
        `corruption=${r.state.macro.systemicCorruption}, RRI=${r.state.macro.nationalRRI}`
      )
    );
  }

  // 10. hollowed_republic (Century Ending)
  {
    const r = runLegalGame(
      1010,
      (state) => {
        const d = getDefaultTurnDirectives();
        if (state.turnNumber === 3) {
          d.oligarchDecisions = {
            syriatel_mtn: 'NATIONALIZE_SOE',
            hamsho_steel: 'NATIONALIZE_SOE',
          };
        }
        d.wageBumpPercent = 5;
        d.foodSubsidyLevel = 'GENEROUS';
        d.southernPolicy = 'LOCAL_VOUCHERS';
        d.activePoliticalActions = ['CABINET_HEARING'];
        if (!state.enactedDecrees?.includes('OPPOSITION_SEATS')) {
          d.activePoliticalActions.push('OPPOSITION_SEATS');
        }
        d.nassibTransitFeeUSD = 700;
        d.remittanceCaptureSpread = 15;
        fitGridCapEx(
          state,
          d,
          state.macro.dailyPowerHours < 9.5 ? 20 : state.macro.dailyPowerHours < 10.5 ? 10 : 0,
          25_000_000
        );
        return d;
      },
      (s, _e, opts) => survivalEventPicker(opts, s, 'hollowed')
    );
    const avgRec =
      Object.values(r.state.governorates).reduce((a, g) => a + g.reconstructionScore, 0) / 14;
    rows.push(
      recordRow(
        'hollowed_republic',
        r.state.centuryEnding?.id === 'hollowed_republic',
        r,
        `score=${r.state.centuryEnding?.finalScore}, pow=${r.state.macro.dailyPowerHours}, corr=${r.state.macro.systemicCorruption}, rec=${(avgRec * 100).toFixed(1)}%`
      )
    );
  }

  // 11. southern_historic_accord (Southern Outcome)
  {
    const r = runLegalGame(
      1111,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.wageBumpPercent = 5;
        d.foodSubsidyLevel = 'GENEROUS';
        d.southernPolicy = 'HISTORIC_ACCORD';
        d.activePoliticalActions = ['CABINET_HEARING'];
        d.nassibTransitFeeUSD = 700;
        d.remittanceCaptureSpread = 15;
        fitGridCapEx(state, d, 25, 25_000_000);
        return d;
      },
      (s, _e, opts) => survivalEventPicker(opts, s, 'hollowed')
    );
    rows.push(
      recordRow(
        'southern_historic_accord',
        r.state.centuryEnding?.southernTitleAr === 'الجنوب المتصالح والمستقر (وفاق السهل والجبل)',
        r,
        `SII=${r.state.governorates['as_suwayda']?.suwaydaIntegrationIndex}, Sec=${r.state.governorates['as_suwayda']?.suwaydaSecessionProb}`
      )
    );
  }

  // 12. southern_cantons_smuggling (Southern Outcome)
  {
    const r = runLegalGame(
      1212,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.wageBumpPercent = 5;
        d.foodSubsidyLevel = 'GENEROUS';
        d.activePoliticalActions = ['CABINET_HEARING'];
        if (!state.enactedDecrees?.includes('OPPOSITION_SEATS')) {
          d.activePoliticalActions.push('OPPOSITION_SEATS');
        }
        d.nassibTransitFeeUSD = 700;
        d.remittanceCaptureSpread = 15;
        d.southernPolicy = state.turnNumber >= 38 ? 'BLOCKADE' : 'LOCAL_VOUCHERS';
        fitGridCapEx(state, d, 25, 25_000_000);
        return d;
      },
      (s, _e, opts) => survivalEventPicker(opts, s, 'cantons')
    );
    rows.push(
      recordRow(
        'southern_cantons_smuggling',
        r.state.centuryEnding?.southernTitleAr === 'مستنقع الكانتونات وشبكات التهريب',
        r,
        `Sec=${r.state.governorates['as_suwayda']?.suwaydaSecessionProb}, SII=${r.state.governorates['as_suwayda']?.suwaydaIntegrationIndex}`
      )
    );
  }

  // 13. southern_frozen_conflict (Southern Outcome)
  {
    const r = runLegalGame(
      1313,
      (state) => {
        const d = getDefaultTurnDirectives();
        d.wageBumpPercent = 5;
        d.foodSubsidyLevel = state.macro.nationalRRI > 45 ? 'GENEROUS' : 'STANDARD';
        d.southernPolicy = 'LOCAL_VOUCHERS';
        d.activePoliticalActions = ['CABINET_HEARING'];
        if (!state.enactedDecrees?.includes('OPPOSITION_SEATS')) {
          d.activePoliticalActions.push('OPPOSITION_SEATS');
        }
        d.nassibTransitFeeUSD = 700;
        d.remittanceCaptureSpread = 15;
        fitGridCapEx(state, d, 25, 25_000_000);
        return d;
      },
      (s, _e, opts) => survivalEventPicker(opts, s, 'frozen')
    );
    const suw = r.state.governorates['as_suwayda'];
    rows.push(
      recordRow(
        'southern_frozen_conflict',
        r.state.centuryEnding?.southernTitleAr === 'الجبهة العازلة والنزاع المجمد',
        r,
        `SII=${suw?.suwaydaIntegrationIndex}, Sec=${suw?.suwaydaSecessionProb}`
      )
    );
  }

  // Multi-seed sovereign_phoenix winnability check
  let phoenixWins = 0;
  let winnabilityViolations = 0;
  const winnabilityBreakdown: Record<string, number> = {};
  for (const seed of WINNABILITY_SEEDS) {
    const r = runLegalGame(seed, phoenixPolicy, (s, _e, opts) =>
      survivalEventPicker(opts, s, 'phoenix')
    );
    winnabilityViolations += r.violations;
    const key = r.state.centuryEnding?.id ?? r.state.failState?.type ?? 'UNFINISHED';
    winnabilityBreakdown[key] = (winnabilityBreakdown[key] || 0) + 1;
    if (key === 'sovereign_phoenix' && r.violations === 0) {
      phoenixWins++;
    }
  }

  const blockedEventWarnings = capturedWarnings.filter((w) =>
    w.includes('Blocked attempt to select event option')
  );
  const clampWarnings = capturedWarnings.filter((w) =>
    w.includes('Dollar auction clamped')
  );

  // Report output
  console.log('=== PLAYER-LEGAL ENDINGS REGRESSION (13/13) ===');
  for (const row of rows) {
    const status = row.passed ? 'PASS' : 'FAIL';
    console.log(
      `${status} | ${row.id.padEnd(26)} | T${String(row.turn).padStart(2)} | viol:${row.violations} | ${row.triggerFigures}`
    );
    if (row.violationMessages.length > 0) {
      for (const msg of row.violationMessages) {
        console.log(`       VIOLATION: ${msg}`);
      }
    }
  }

  const passedCount = rows.filter((r) => r.passed).length;
  const totalViolations =
    rows.reduce((sum, r) => sum + r.violations, 0) + winnabilityViolations;
  const winnabilityOk = phoenixWins >= MIN_PHOENIX_WINS && winnabilityViolations === 0;
  const warningsOk =
    blockedEventWarnings.length === 0 &&
    clampWarnings.length === 0 &&
    capturedErrors.length === 0;
  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(2);

  console.log('\n=== EXTRA ASSERTIONS ===');
  console.log(
    `${selfCheck.ok ? 'PASS' : 'FAIL'} | validator self-checks (${selfCheck.failures.length} failures)`
  );
  for (const f of selfCheck.failures) console.log(`       ${f}`);

  console.log(
    `${warningsOk ? 'PASS' : 'FAIL'} | engine warnings/errors: blockedEvent=${blockedEventWarnings.length}, auctionClamp=${clampWarnings.length}, consoleError=${capturedErrors.length}`
  );
  if (!warningsOk) {
    for (const w of [...blockedEventWarnings, ...clampWarnings, ...capturedErrors].slice(0, 10)) {
      console.log(`       ${w}`);
    }
  }

  console.log(
    `${winnabilityOk ? 'PASS' : 'FAIL'} | sovereign_phoenix winnability: ${phoenixWins}/${WINNABILITY_SEEDS.length} (min required ${MIN_PHOENIX_WINS}/${WINNABILITY_SEEDS.length}) ${JSON.stringify(winnabilityBreakdown)}`
  );

  console.log(
    `\nSUMMARY: ${passedCount}/13 endings passed | totalViolations=${totalViolations} | elapsed=${elapsedSec}s`
  );

  if (
    passedCount !== 13 ||
    totalViolations > 0 ||
    !selfCheck.ok ||
    !warningsOk ||
    !winnabilityOk
  ) {
    exitCode = 1;
  }
} finally {
  console.warn = origWarn;
  console.error = origError;
}

if (exitCode !== 0) {
  process.exit(exitCode);
}
