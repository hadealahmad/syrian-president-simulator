import type { MacroeconomicState } from './types';

/**
 * Calculates parallel street FX rate depreciation using the linear model.
 */
export function calculateParallelRate(
  currentRate: number,
  m2Current: number,
  m2Delta: number,
  fxDrainUSD: number,
  currentReservesUSD: number,
  gdpGrowthPct: number = 2.5,
  auctionUSD: number = 0
): number {
  // Linear depreciation component from money printing (seigniorage)
  const moneyPrintingFactor = m2Current > 0 ? (m2Delta / m2Current) : 0;
  
  // Non-auction FX drain (imports, debt) weakens currency
  const nonAuctionDrain = Math.max(0, fxDrainUSD - auctionUSD);
  const fxDrainFactor = currentReservesUSD > 0 ? Math.max(0, (nonAuctionDrain / currentReservesUSD) * 0.50) : 0.8;
  
  // Direct market stabilization from auction FX hard-currency injection
  const auctionReliefPct = Math.min(0.25, (auctionUSD / 10_000_000) * 0.015);
  
  // GDP growth dampens depreciation
  const gdpDampener = (gdpGrowthPct / 100) * 0.50;
  
  const netDepreciationPct = moneyPrintingFactor + fxDrainFactor - gdpDampener - auctionReliefPct;
  const deltaRate = currentRate * Math.max(-0.25, Math.min(1.20, netDepreciationPct));
  
  return Math.round(currentRate + deltaRate);
}

/**
 * Calculates the monthly real civil wage in USD.
 */
export function calculateRealWageUSD(nominalWageSYP: number, parallelRateSYP: number): number {
  if (parallelRateSYP <= 0) return 0;
  return Number((nominalWageSYP / parallelRateSYP).toFixed(2));
}

/**
 * Dual-currency affordability test shared by every player-purchasable action
 * (turn directives, provincial projects, event options).
 *
 * A SYP-denominated cost is payable from the treasury, or from FX reserves
 * covering whatever the treasury cannot — converted at the parallel rate. The
 * accumulated overdraft is deliberately NOT part of the test: the treasury is
 * allowed to run negative (README: negative balances accrue 5%/turn interest
 * rather than forcing immediate seigniorage), so only the *new* cost needs
 * backing. Lives here, free of engine-state imports, so both `events.ts` and
 * `turn-manager.ts` can use it without a circular dependency.
 */
export function canAffordDirectiveCost(
  reservesUSD: number,
  treasurySYP: number,
  costUSD: number,
  costSYP: number,
  parallelRate: number
): boolean {
  if (costUSD > reservesUSD) return false;
  const usableSYP = Math.max(0, treasurySYP);
  if (usableSYP >= costSYP) return true;
  const sypShortfall = costSYP - usableSYP;
  const usdNeededForSYP = sypShortfall / Math.max(1, parallelRate);
  return reservesUSD >= costUSD + usdNeededForSYP;
}

/**
 * Central Bank Dollar Auction — the single source of truth for the auction.
 *
 * Three numbers used to be written out separately in `revenues.ts` and
 * `turn-manager.ts`, which is how the turn receipt came to claim the full
 * collected SYP while the money supply only ever fell by 40% of it — the
 * receipt overstated the destruction by 2.5x-3.3x. Everything now derives from
 * `computeAuctionAbsorbedSYP` below, so the figure on the receipt and the figure
 * subtracted from M2 cannot drift apart again.
 */

/** Auction clearing price as a share of the parallel street rate. The 5% discount is what drains street liquidity. */
export const AUCTION_CLEARING_DISCOUNT = 0.95;

/**
 * Share of the SYP collected at the auction that is actually withdrawn from the
 * money supply. The remainder re-enters circulation through the banking system,
 * so gross collections are NOT equal to M2 destruction.
 */
export const AUCTION_STERILIZATION_FACTOR = 0.4;

/** Defensive floor on the money supply; the central bank will not sterilize below this. */
export const M2_FLOOR_SYP = 10_000_000_000;

/**
 * SYP actually destroyed (withdrawn from M2) by an auction of `auctionUSD` at
 * `parallelRateSYP`. This is the value that belongs on the turn receipt and the
 * value that must be subtracted from the money supply.
 */
export function computeAuctionAbsorbedSYP(auctionUSD: number, parallelRateSYP: number): number {
  if (!(auctionUSD > 0) || !(parallelRateSYP > 0)) return 0;
  const collectedSYP = auctionUSD * parallelRateSYP * AUCTION_CLEARING_DISCOUNT;
  return Math.round(collectedSYP * AUCTION_STERILIZATION_FACTOR);
}

/**
 * Central Bank Dollar Auction execution.
 * Sells hard currency to absorb domestic SYP and compress parallel spread.
 * Throws an error if attempted without sufficient reserves.
 */
export function executeDollarAuction(
  macro: MacroeconomicState,
  auctionUSD: number
): { sypAbsorbed: number; newReservesUSD: number; newM2SYP: number } {
  if (auctionUSD < 0) {
    throw new Error('لا يمكن أن تكون قيمة المزاد سالبة');
  }
  
  if (auctionUSD > macro.reservesUSD) {
    throw new Error('لا يمكن بيع مبالغ من النقد الأجنبي تتجاوز الرصيد الفعلي لاحتياطيات المصرف المركزي');
  }
  
  // Domestic SYP absorbed from circulation at near-parallel market clearing rate
  const sypAbsorbed = auctionUSD * macro.parallelRateSYP * AUCTION_CLEARING_DISCOUNT;
  
  const newReservesUSD = macro.reservesUSD - auctionUSD;
  const newM2SYP = Math.max(M2_FLOOR_SYP, macro.m2MoneySupplySYP - computeAuctionAbsorbedSYP(auctionUSD, macro.parallelRateSYP));
  
  return { sypAbsorbed, newReservesUSD, newM2SYP };
}

/**
 * Adjusts the official central bank peg toward the parallel rate.
 */
export function adjustOfficialPeg(
  macro: MacroeconomicState,
  newPegSYP: number
): { officialRateSYP: number; civicTrustDelta: number } {
  const boundedPeg = Math.max(80, Math.min(macro.parallelRateSYP, newPegSYP));
  const adjustmentSpread = Math.abs(boundedPeg - macro.officialRateSYP);
  
  // Substantial devaluations cause minor short-term trust dips but improve remittance capture
  const civicTrustDelta = adjustmentSpread > 2000 ? -2 : 0;
  
  return {
    officialRateSYP: boundedPeg,
    civicTrustDelta,
  };
}
