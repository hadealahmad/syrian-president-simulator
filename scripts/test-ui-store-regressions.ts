/**
 * Store-level regressions for the stores + UI area:
 *   STORES#3/4/6/7/8/9/16, UI#3/4/5/6/17, ENGINE#6/11.
 *
 * Plain tsx script (no browser): builds real game states, exercises the real
 * store functions and exits non-zero on the first failed assertion.
 */
import { get } from 'svelte/store';
import { createInitialGameState } from '../src/lib/engine/baseline';
import { getDefaultTurnDirectives } from '../src/lib/engine/turn-manager';
import {
  calculateTurnBudget,
  draftStore,
  normalizeStoredDraft,
} from '../src/lib/stores/draft-store';
import { gameStore } from '../src/lib/stores/game-store';
import { uiStore } from '../src/lib/stores/ui-store';
import { startNewGame } from '../src/lib/stores/new-game';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  GTM_CONTAINER_ID,
  analyticsStore,
} from '../src/lib/stores/analytics-store';
import { ALL_EVENTS } from '../src/lib/engine/deck';
import {
  REMITTANCE_POOL_USD,
  previewComplianceRate,
  previewCorporateTaxSYP,
  previewGridCapExGain,
  previewTelecomExciseSYP,
  previewTransitRevenueUSD,
  previewWageUnrestRelief,
} from '../src/lib/ui/panels/shared';

let failures = 0;
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) {
    console.log(`  ok: ${name}${extra ? ' — ' + extra : ''}`);
  } else {
    failures++;
    console.log(`  FAIL: ${name}${extra ? ' — ' + extra : ''}`);
  }
}

function freshDraft() {
  return getDefaultTurnDirectives();
}

// ── UI#4 / ENGINE#11 / STORES#4: over-budget must be detectable ────────────
console.log('=== Over-budget guard is reachable (signed remainders) ===');
{
  const state = createInitialGameState(11);
  state.macro.reservesUSD = 10_000_000;
  const draft = freshDraft();
  draft.gridCapExUSD = 80_000_000;
  const budget = calculateTurnBudget(state, draft);
  check(
    'overspent USD remainder is negative',
    budget.remainingUSD === -70_000_000,
    `got ${budget.remainingUSD}`
  );
  check(
    'isOverBudget condition fires',
    budget.remainingPC < 0 || budget.remainingUSD < 0
  );

  const defaultGrid = { ...freshDraft() }; // default grid CapEx = $35M
  const b2 = calculateTurnBudget(state, defaultGrid);
  check('default CapEx also over-commits $10M reserves', b2.remainingUSD === -25_000_000);
}
{
  const state = createInitialGameState(12);
  state.macro.politicalCapital = 10;
  const draft = freshDraft();
  draft.activePoliticalActions = ['ANTI_CORRUPTION_COMMISSION']; // 15 PC
  const budget = calculateTurnBudget(state, draft);
  check('over-committed PC remainder is negative', budget.remainingPC === -5, `got ${budget.remainingPC}`);
}

// ── STORES#9: Paris repudiation closes the IMF/Gulf windows in the budget ──
console.log('=== Loan eligibility mirrors the engine (Paris repudiation) ===');
{
  const state = createInitialGameState(13);
  const draft = freshDraft();
  draft.signedLoanIds = ['loan_imf_wb'];
  const open = calculateTurnBudget(state, draft);
  check('open IMF window: PC charged', open.committedPC === 20, `got ${open.committedPC}`);
  check(
    'open IMF window: disbursement counted as same-turn inflow',
    open.initialUSD === state.macro.reservesUSD + 500_000_000,
    `got ${open.initialUSD}`
  );

  state.flags.Debt_Repudiated_Paris = 1;
  const closed = calculateTurnBudget(state, draft);
  check('repudiated: IMF PC not charged', closed.committedPC === 0, `got ${closed.committedPC}`);
  check(
    'repudiated: IMF cash not promised',
    closed.initialUSD === state.macro.reservesUSD,
    `got ${closed.initialUSD}`
  );
}

// ── STORES#6: early repayment joins the turn budget ────────────────────────
console.log('=== Early debt repayment is budgeted and clamped ===');
{
  const state = createInitialGameState(14);
  state.macro.reservesUSD = 100_000_000;
  state.foreignLoans = state.foreignLoans.map((l) =>
    l.id === 'loan_imf_wb'
      ? { ...l, isSigned: true, remainingPrincipalUSD: 500_000_000 }
      : l
  );
  const draft = freshDraft();
  draft.gridCapExUSD = 0;
  draft.extraDebtRepaymentUSD = 80_000_000;
  const budget = calculateTurnBudget(state, draft);
  check('repayment is part of committed USD', budget.committedUSD === 80_000_000);
  check('max repayment bounded by reserves', budget.maxDebtRepaymentUSD === 100_000_000);

  draft.extraDebtRepaymentUSD = 300_000_000;
  const clamped = calculateTurnBudget(state, draft);
  check('over-large repayment clamped in the budget', clamped.committedUSD === 100_000_000);
  check('clamped repayment never overdraws', clamped.remainingUSD === 0);
}

// ── STORES#7: same-turn inflows and the ring-fenced grant bucket ───────────
console.log('=== Same-turn inflows + grant bucket fund projects ===');
{
  const state = createInitialGameState(15);
  state.macro.grantBucketUSD = 20_000_000;
  const draft = freshDraft();
  draft.gridCapExUSD = 0;
  draft.provincialProjects = ['proj_latakia_port_modernization']; // $15M
  const withGrant = calculateTurnBudget(state, draft);
  check('grant covers the project USD leg', withGrant.committedUSD === 0, `got ${withGrant.committedUSD}`);
  check('grant remainder is exposed for the next project', withGrant.grantAvailableUSD === 5_000_000);

  state.macro.grantBucketUSD = 0;
  const withoutGrant = calculateTurnBudget(state, draft);
  check('without grant the project bills reserves', withoutGrant.committedUSD === 15_000_000);
}

// ── UI#14: DEPLOY_ARMOR's 9B SYP drain is budgeted ──────────────────────────
console.log('=== Golan armored deployment SYP cost ===');
{
  const state = createInitialGameState(16);
  const draft = freshDraft();
  draft.golanBorderStance = 'DEPLOY_ARMOR';
  const budget = calculateTurnBudget(state, draft);
  check('committed SYP includes 9.0B', budget.committedSYP === 9_000_000_000, `got ${budget.committedSYP}`);
}

// ── UI#17: the accord's own 4 PC is already inside remainingPC ─────────────
console.log('=== Southern accord upkeep threshold ===');
{
  const state = createInitialGameState(17);
  state.macro.politicalCapital = 4;
  const draft = freshDraft();
  draft.southernPolicy = 'HISTORIC_ACCORD';
  const exact = calculateTurnBudget(state, draft);
  check('exactly 4 PC keeps the accord affordable', exact.remainingPC === 0, `got ${exact.remainingPC}`);
  check('exactly 4 PC is not a fallback (<0 test)', !(exact.remainingPC < 0));

  state.macro.politicalCapital = 2;
  const short = calculateTurnBudget(state, draft);
  check('under 4 PC shows a negative remainder', short.remainingPC === -2, `got ${short.remainingPC}`);
  check('under 4 PC triggers the fallback', short.remainingPC < 0);
}

// ── UI#3 / STORES#8 / STORES#16: one-shot vs continuous/periodic intents ───
console.log('=== One-shot directives cleared, periodic decisions kept ===');
{
  draftStore.reset();
  draftStore.setField('dollarAuctionUSD', 300_000_000);
  draftStore.setField('deminingPriorityId', 'homs');
  draftStore.setField('powerBoostGovId', 'damascus');
  draftStore.setField('extraDebtRepaymentUSD', 50_000_000);
  draftStore.setField('moneyPrintingSYP', 12_000_000_000);
  draftStore.setField('populistGrant', true);
  draftStore.setField('importSurge', true);
  draftStore.setField('wageBumpPercent', 50); // continuous policy
  draftStore.setField('activePoliticalActions', [
    'MARTIAL_LAW',
    'SMUGGLING_BORDER_SWEEP',
    'CABINET_HEARING',
    'UNITY_SPEECH',
  ]);
  draftStore.advanceToNextTurn();
  const after = get(draftStore);
  check('auction cleared after commit', after.dollarAuctionUSD === 0);
  check('demining priority cleared after commit', after.deminingPriorityId === null);
  check('power boost cleared after commit', after.powerBoostGovId === null);
  check('early repayment cleared after commit', after.extraDebtRepaymentUSD === 0);
  check('money printing cleared after commit', after.moneyPrintingSYP === 0);
  check('one-shot grant cleared after commit', after.populistGrant === false);
  check('one-shot import surge cleared after commit', after.importSurge === false);
  check('continuous wage policy preserved', after.wageBumpPercent === 50);
  check(
    'continuous + periodic decrees preserved, one-time dropped',
    after.activePoliticalActions.includes('MARTIAL_LAW') &&
      after.activePoliticalActions.includes('SMUGGLING_BORDER_SWEEP') &&
      after.activePoliticalActions.includes('CABINET_HEARING') &&
      !after.activePoliticalActions.includes('UNITY_SPEECH'),
    after.activePoliticalActions.join(',')
  );

  const reloaded = normalizeStoredDraft({
    activePoliticalActions: ['MARTIAL_LAW', 'CABINET_HEARING', 'ANTI_CORRUPTION_COMMISSION'],
    dollarAuctionUSD: 300_000_000,
    deminingPriorityId: 'homs',
    powerBoostGovId: 'aleppo',
    extraDebtRepaymentUSD: 50_000_000,
    moneyPrintingSYP: 12_000_000_000,
    populistGrant: true,
    importSurge: true,
    terminatedLoanIds: ['loan_imf_wb'],
  });
  check(
    'reload keeps continuous/periodic decrees',
    reloaded.activePoliticalActions.includes('MARTIAL_LAW') &&
      reloaded.activePoliticalActions.includes('CABINET_HEARING') &&
      !reloaded.activePoliticalActions.includes('ANTI_CORRUPTION_COMMISSION'),
    reloaded.activePoliticalActions.join(',')
  );
  check(
    'reload drops one-shot financial intents',
    reloaded.dollarAuctionUSD === 0 &&
      reloaded.deminingPriorityId === null &&
      reloaded.powerBoostGovId === null &&
      reloaded.extraDebtRepaymentUSD === 0 &&
      reloaded.moneyPrintingSYP === 0 &&
      reloaded.populistGrant === false &&
      reloaded.importSurge === false &&
      reloaded.terminatedLoanIds.length === 0
  );
}

// ── PRINTING: seigniorage is financing, never spending or revenue ──────────
console.log('=== Money printing is financing, not spending ===');
{
  const state = createInitialGameState(18);
  state.macro.treasurySYP = 10_000_000_000;
  const draft = freshDraft();
  draft.gridCapExUSD = 0;
  const noPrint = calculateTurnBudget(state, draft);
  draft.moneyPrintingSYP = 30_000_000_000;
  const withPrint = calculateTurnBudget(state, draft);

  check(
    'printing never enters committed spending',
    withPrint.committedSYP === noPrint.committedSYP,
    `${withPrint.committedSYP}`
  );
  check(
    'printing counts as financing in the SYP envelope',
    withPrint.financingSYP === 30_000_000_000 &&
      withPrint.remainingSYP - noPrint.remainingSYP === 30_000_000_000,
    `${withPrint.remainingSYP - noPrint.remainingSYP}`
  );
  check(
    'printing cannot relax the PC/USD over-budget guard',
    withPrint.remainingPC === noPrint.remainingPC && withPrint.remainingUSD === noPrint.remainingUSD
  );
  check(
    'printing does not fake affordability of new commitments',
    withPrint.usdNeededToCoverSYP(50_000_000_000) ===
      noPrint.usdNeededToCoverSYP(50_000_000_000)
  );
}

// ── STORES#3 / UI#5 / ENGINE#6: one shared restart path ────────────────────
console.log('=== Shared new-game path resets game + draft + UI ===');
{
  // Dirty every layer first.
  gameStore.commitTurn(getDefaultTurnDirectives()); // turn 2
  draftStore.setField('dollarAuctionUSD', 300_000_000);
  draftStore.setField('deminingPriorityId', 'homs');
  draftStore.setField('populistGrant', true);
  draftStore.setField('activePoliticalActions', ['ANTI_CORRUPTION_COMMISSION']);
  uiStore.selectGovernorate('damascus');
  uiStore.openCommandPanel('tax', true);
  uiStore.setTurnFlowStage('review');
  uiStore.checkItem('decrees');
  uiStore.openStatRelatedOptions('treasurySYP');
  uiStore.toggleStatsSidebar(true);
  uiStore.setRestartModal(true);

  startNewGame(4242);
  const game = get(gameStore);
  const draft = get(draftStore);
  const ui = get(uiStore);

  check('game restarted at turn 1', game.turnNumber === 1);
  check('no fail state carried over', game.isGameOver === false && game.failState === null);
  check('explicit seed honoured', game.seed === 4242, `got ${game.seed}`);
  check('draft auction reset', draft.dollarAuctionUSD === 0);
  check('draft demining reset', draft.deminingPriorityId === null);
  check('draft one-shot decrees reset', draft.activePoliticalActions.length === 0);
  check('draft one-shot patronage reset', draft.populistGrant === false);
  check('UI governorate selection reset', ui.selectedGovernorateId === null);
  check('UI command panel closed', ui.activeCommandPanel === null && ui.commandPanelPinned === false);
  check('UI stats sidebar closed', ui.isStatsSidebarOpen === false);
  check('UI turn-flow stage closed', ui.turnFlowStage === 'closed');
  check('UI stat filter cleared', ui.selectedStatForOptions === null);
  check(
    'UI checklist reset',
    !ui.checklist.decrees && !ui.checklist.province && !ui.checklist.endTurn
  );
  check('UI restart modal closed', ui.isRestartModalOpen === false);
}

// ── UI#6: no-argument restarts draw a fresh seed ───────────────────────────
console.log('=== Restart without a seed generates a fresh one ===');
{
  const seeds = new Set<number>();
  for (let i = 0; i < 4; i++) {
    gameStore.restart();
    seeds.add(get(gameStore).seed);
  }
  check('several no-arg restarts produce distinct seeds', seeds.size >= 3, `got ${seeds.size}`);
  check('the old fixed seed is not used', !seeds.has(20241208));
}

// ── UI#12 / UI#13 / UI#22 / ENGINE#20 / ENGINE#21: previews match the engine ─
console.log('=== Panel previews mirror the engine formulas ===');
{
  const state = createInitialGameState(18);
  const compliance = previewComplianceRate(state);
  check(
    'corporate tax = 24B × (rate/22) × compliance',
    previewCorporateTaxSYP(22, compliance) === Math.round(24_000_000_000 * compliance),
    `${(previewCorporateTaxSYP(22, compliance) / 1e9).toFixed(2)}B`
  );
  check(
    'telecom excise = 16.5B at the 15% baseline',
    previewTelecomExciseSYP(15) === 16_500_000_000
  );
  check(
    'transit preview is in the audit range (~3.2M, not 22M)',
    previewTransitRevenueUSD(450, 32, compliance) > 2_000_000 &&
      previewTransitRevenueUSD(450, 32, compliance) < 5_000_000,
    `${(previewTransitRevenueUSD(450, 32, compliance) / 1e6).toFixed(2)}M`
  );
  check(
    'remittance standard branch uses the $500M pool',
    Math.round((REMITTANCE_POOL_USD * 0.1) / 1_000_000) === 50
  );
  const grid = previewGridCapExGain(35_000_000, 45, 58);
  check('grid CapEx gain follows PHASE 4 (272 MW / 1.1h)', grid.mw === 272 && grid.hours === 1.1, `${grid.mw}MW / ${grid.hours}h`);
  check('zero CapEx decays the grid', previewGridCapExGain(0, 45, 58).mw === -120);
  check('wage unrest relief is uncapped (3/pt per 25%)', previewWageUnrestRelief(100) === 12);
  check('wage unrest relief at 400% is -48, not -45', previewWageUnrestRelief(400) === 48);
}

// ── Analytics: consent gating, GTM-MP8775QZ bootstrap & lifecycle events ───
console.log('=== GTM analytics consent gating & lifecycle tracking ===');
{
  const storage = new Map<string, string>();
  const appendedScripts: Array<{ async: boolean; src: string; dataset: Record<string, string> }> = [];
  const mockWindow: Record<string, unknown> = {
    localStorage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storage.set(k, String(v));
      },
      removeItem: (k: string) => {
        storage.delete(k);
      },
    },
  };
  const mockDocument = {
    head: {
      appendChild: (el: { async: boolean; src: string; dataset: Record<string, string> }) => {
        appendedScripts.push(el);
        return el;
      },
    },
    createElement: (_tag: string) => ({
      async: false,
      src: '',
      dataset: {} as Record<string, string>,
    }),
    querySelector: (sel: string) => {
      if (sel === `script[data-gtm-id="${GTM_CONTAINER_ID}"]`) {
        return appendedScripts.find((s) => s.dataset.gtmId === GTM_CONTAINER_ID) ?? null;
      }
      return null;
    },
  };

  (globalThis as Record<string, unknown>).window = mockWindow;
  (globalThis as Record<string, unknown>).document = mockDocument;

  try {
    analyticsStore.resetForTests();
    check('consent defaults to unset before user choice', get(analyticsStore).consent === 'unset');
    check('tracking disabled before opt-in', get(analyticsStore).enabled === false);

    // Actions while unset must not load GTM or create dataLayer events
    startNewGame(101, 'title_menu');
    gameStore.commitTurn(freshDraft());
    check('GTM script not injected before consent', appendedScripts.length === 0);
    check('dataLayer untouched before consent', mockWindow.dataLayer === undefined);

    // Grant consent (simulates clicking Accept on banner or toggling ON in Settings)
    analyticsStore.setConsent(true);
    check('consent stored in localStorage', storage.get(ANALYTICS_CONSENT_STORAGE_KEY) === 'granted');
    check('analyticsStore enabled after opt-in', get(analyticsStore).enabled === true);
    check(
      'GTM-MP8775QZ script injected once',
      appendedScripts.length === 1 &&
        appendedScripts[0].src === `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}` &&
        appendedScripts[0].async === true
    );

    const getCalls = () =>
      ((mockWindow.dataLayer as ArrayLike<unknown>[]) ?? []).map((entry) => Array.from(entry));

    const initialCalls = getCalls();
    check(
      'gtag("js", Date) queued on dataLayer',
      initialCalls.some((c) => c[0] === 'js' && c[1] instanceof Date)
    );
    check(
      'gtag("consent", "default", ...) queued with analytics_storage granted',
      initialCalls.some(
        (c) =>
          c[0] === 'consent' &&
          c[1] === 'default' &&
          (c[2] as Record<string, unknown>)?.analytics_storage === 'granted'
      )
    );

    // 1. First-time game_start (hasStartedGame = false)
    uiStore.setSettingsOpen(true);
    // Reset hasStartedGame to false by checking fresh start vs restart:
    // Notice startNewGame reads uiStore.hasStartedGame; right now in Node hasStartedGame is false!
    startNewGame(777, 'title_menu');
    const afterStartCalls = getCalls();
    const startEvt = afterStartCalls.find((c) => c[0] === 'event' && c[1] === 'game_start');
    check(
      'game_start emitted with seed & title_menu source',
      Boolean(startEvt) &&
        (startEvt?.[2] as Record<string, unknown>)?.seed === 777 &&
        (startEvt?.[2] as Record<string, unknown>)?.source === 'title_menu'
    );

    // Mark game started, advance a turn, then restart -> game_restart
    uiStore.markGameStarted();
    gameStore.commitTurn(freshDraft());
    const turnEvt = getCalls().find((c) => c[0] === 'event' && c[1] === 'game_turn');
    check(
      'game_turn emitted on commitTurn',
      Boolean(turnEvt) &&
        (turnEvt?.[2] as Record<string, unknown>)?.turn_number === 1 &&
        (turnEvt?.[2] as Record<string, unknown>)?.next_turn === 2
    );

    // Resolve an active event (or inject a canonical event card to test both option & default penalty)
    const sampleCard = ALL_EVENTS[0];
    gameStore.restart(888);
    // Commit 1 turn to get activeEvents or test chooseEventOption directly
    gameStore.commitTurn(freshDraft());
    const stateWithEvents = get(gameStore);
    const activeCard = stateWithEvents.activeEvents[0] ?? sampleCard;
    if (stateWithEvents.activeEvents.length > 0 && activeCard.options.length > 0) {
      gameStore.chooseEventOption(activeCard.id, activeCard.options[0].id);
      const evTracked = getCalls().find(
        (c) =>
          c[0] === 'event' &&
          c[1] === 'game_event' &&
          (c[2] as Record<string, unknown>)?.event_id === activeCard.id
      );
      check(
        'game_event emitted on chooseEventOption',
        Boolean(evTracked) &&
          (evTracked?.[2] as Record<string, unknown>)?.option_id === activeCard.options[0].id &&
          (evTracked?.[2] as Record<string, unknown>)?.resolution_type === 'option_selected'
      );
    } else {
      gameStore.triggerUnresolvedCrisisPenalty(sampleCard.id);
      const evTracked = getCalls().find((c) => c[0] === 'event' && c[1] === 'game_event');
      check('game_event emitted on unresolved crisis', Boolean(evTracked));
    }

    // Restart after playing -> game_restart
    startNewGame(999, 'settings_menu');
    const restartEvt = getCalls().find((c) => c[0] === 'event' && c[1] === 'game_restart');
    check(
      'game_restart emitted when restarting an active session',
      Boolean(restartEvt) &&
        (restartEvt?.[2] as Record<string, unknown>)?.source === 'settings_menu' &&
        (restartEvt?.[2] as Record<string, unknown>)?.seed === 999
    );

    // Trigger a loss ending (SOVEREIGN_INSOLVENCY via depleted reserves & negative runway, or URBAN_INSURRECTION)
    // Play until fail or turn 40 win to verify game_ending / game_win
    let sawOutcome = false;
    for (let t = 0; t < 40; t++) {
      if (get(gameStore).isGameOver) break;
      const d = freshDraft();
      d.moneyPrintingSYP = 500_000_000_000;
      d.gridCapExUSD = 150_000_000;
      gameStore.commitTurn(d);
      if (get(gameStore).isGameOver) {
        sawOutcome = true;
        break;
      }
    }
    const lossEndingEvt = getCalls().find(
      (c) =>
        c[0] === 'event' &&
        c[1] === 'game_ending' &&
        (c[2] as Record<string, unknown>)?.outcome === 'loss'
    );
    check(
      'loss ending emits game_ending with fail_state outcome & ending_id',
      sawOutcome &&
        Boolean(lossEndingEvt) &&
        typeof (lossEndingEvt?.[2] as Record<string, unknown>)?.ending_id === 'string' &&
        (lossEndingEvt?.[2] as Record<string, unknown>)?.ending_category === 'fail_state'
    );

    // Also test 40-turn survival win (game_win + century game_ending) via trackGameOutcome
    const { trackGameOutcome } = await import('../src/lib/stores/analytics-store');
    const { projectCenturyOutcome } = await import('../src/lib/engine/century-engine');
    const winState = createInitialGameState(2026);
    winState.turnNumber = 41;
    winState.calendarYear = 2045;
    winState.isGameOver = true;
    winState.centuryEnding = projectCenturyOutcome(winState);
    trackGameOutcome(winState, 'turn_commit');

    const winEvt = getCalls().find((c) => c[0] === 'event' && c[1] === 'game_win');
    const centuryEndingEvt = getCalls().find(
      (c) =>
        c[0] === 'event' &&
        c[1] === 'game_ending' &&
        (c[2] as Record<string, unknown>)?.outcome === 'win'
    );
    check(
      '40-turn survival emits game_win with ending_id, southern_ending_id & final_score',
      Boolean(winEvt) &&
        (winEvt?.[2] as Record<string, unknown>)?.ending_id === winState.centuryEnding.id &&
        typeof (winEvt?.[2] as Record<string, unknown>)?.southern_ending_id === 'string' &&
        typeof (winEvt?.[2] as Record<string, unknown>)?.final_score === 'number'
    );
    check(
      '40-turn survival emits game_ending with outcome="win" & ending_category="century"',
      Boolean(centuryEndingEvt) &&
        (centuryEndingEvt?.[2] as Record<string, unknown>)?.ending_id === winState.centuryEnding.id
    );

    // Disable tracking via Settings toggle -> stops future events & updates consent mode
    analyticsStore.setConsent(false);
    check('consent persisted as denied after toggle off', storage.get(ANALYTICS_CONSENT_STORAGE_KEY) === 'denied');
    check('analyticsStore disabled after toggle off', get(analyticsStore).enabled === false);
    const countAfterDisable = getCalls().length;
    startNewGame(1234, 'restart_modal');
    gameStore.commitTurn(freshDraft());
    check('zero gameplay events emitted after disabling tracking', getCalls().length === countAfterDisable);
    check(
      'GTM script never injected more than once across toggle cycles',
      appendedScripts.length === 1
    );
  } finally {
    delete (globalThis as Record<string, unknown>).window;
    delete (globalThis as Record<string, unknown>).document;
  }
}

console.log('');
if (failures === 0) {
  console.log('ALL UI/STORE REGRESSION TESTS PASSED!');
  process.exit(0);
} else {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
