import { createInitialGameState } from '../src/lib/engine/baseline';
import { executeTurnLifecycle, getDefaultTurnDirectives } from '../src/lib/engine/turn-manager';

console.log('--- STARTING 40-TURN HEADLESS CENTURY ENGINE TEST ---');
let state = createInitialGameState(42);

for (let i = 1; i <= 40; i++) {
  const directives = getDefaultTurnDirectives();
  directives.wageBumpPercent = 8;
  directives.gridCapExUSD = 30_000_000;
  directives.southernPolicy = 'HISTORIC_ACCORD';

  state = executeTurnLifecycle(state, directives);
  if (i % 5 === 0 || state.isGameOver) {
    console.log(`Turn ${state.turnNumber} (${state.calendarYear} ${state.season}): FX = $${(state.macro.reservesUSD / 1e6).toFixed(1)}M, Rate = ${state.macro.parallelRateSYP}, National RRI = ${state.macro.nationalRRI}, GameOver = ${state.isGameOver}`);
  }

  if (state.isGameOver) {
    if (state.failState) {
      console.log(`Failed at turn ${i}: ${state.failState.titleAr}`);
    } else if (state.centuryEnding) {
      console.log(`\n[SUCCESS] REACHED YEAR 100 GENERATIONAL PROJECTION:`);
      console.log(`العنوان: ${state.centuryEnding.titleAr}`);
      console.log(`العنوان الفرعي: ${state.centuryEnding.subtitleAr}`);
      console.log(`مسار الجنوب: ${state.centuryEnding.southernTitleAr}`);
      console.log(`الدرجة السيادية: ${state.centuryEnding.finalScore}/100`);
    }
    break;
  }
}
