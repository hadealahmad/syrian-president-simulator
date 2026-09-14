/**
 * Dynamic calculation and scaling for Confiscated Oligarch Assets & War Wealth
 * Scales both the earned and lost political credit with the amount of income provided.
 */

export function getOligarchSettlementIncome(valuationUSD: number): number {
  return Math.round(valuationUSD * 0.8);
}

export function getOligarchLiquidationIncome(valuationUSD: number): number {
  return Math.round(valuationUSD * 0.6);
}

/**
 * Political capital lost (cost) for negotiating an 80/20 settlement with an oligarch.
 * Scales dynamically with the dollar income provided.
 */
export function getOligarchSettlementPCCost(valuationUSD: number): number {
  const incomeUSD = getOligarchSettlementIncome(valuationUSD);
  return Math.max(3, Math.round(incomeUSD / 40_000_000));
}

/**
 * Political capital lost (cost) for foreign fire-sale liquidation of national assets.
 * Scales dynamically with the dollar income provided.
 */
export function getOligarchLiquidationPCCost(valuationUSD: number): number {
  const incomeUSD = getOligarchLiquidationIncome(valuationUSD);
  return Math.max(4, Math.round(incomeUSD / 26_000_000));
}

/**
 * Political capital earned (gain) for sovereign nationalization of the asset.
 * Scales dynamically with the size and revenue generation of the asset.
 */
export function getOligarchNationalizePCEarned(valuationUSD: number): number {
  return Math.max(2, Math.round(valuationUSD / 65_000_000));
}
