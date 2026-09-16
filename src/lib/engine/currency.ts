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
  const clearingRate = macro.parallelRateSYP * 0.95;
  const sypAbsorbed = auctionUSD * clearingRate;
  
  const newReservesUSD = macro.reservesUSD - auctionUSD;
  const newM2SYP = Math.max(10_000_000_000, macro.m2MoneySupplySYP - sypAbsorbed);
  
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
