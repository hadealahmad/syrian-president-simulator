/**
 * Dynamic calculation and scaling for Confiscated Oligarch Assets & War Wealth
 * Scales both the earned and lost political credit with the amount of income provided.
 */

import type { ConfiscatedAsset } from './types';

/**
 * The authored per-asset deal terms. Single source of truth for every oligarch
 * cash flow: the audit preview, the committed turn and the receipt all read
 * these, so a settlement / fire-sale can never pay one number in Phase 1 and
 * report another on the ledger. (The flat valuation multipliers that used to
 * live here paid 0.8x / 0.6x of valuation, which disagreed with the data.)
 */
export interface OligarchTerms {
  /** One-off USD received from an 80/20 settlement with the owner. */
  settlementUSD: number;
  /** One-off SYP received from the same settlement. */
  settlementSYP: number;
  /** One-off USD received from a foreign fire-sale liquidation. */
  liquidationUSD: number;
  /** Recurring SYP profit per turn while the asset is run as a state enterprise. */
  nationalizedSYPPerTurn: number;
}

export function getOligarchTerms(
  asset: Pick<
    ConfiscatedAsset,
    'settlementYieldUSD' | 'settlementYieldSYP' | 'liquidationYieldUSD' | 'soeVenueSYPPerTurn'
  >
): OligarchTerms {
  return {
    settlementUSD: Math.round(asset.settlementYieldUSD ?? 0),
    settlementSYP: Math.round(asset.settlementYieldSYP ?? 0),
    liquidationUSD: Math.round(asset.liquidationYieldUSD ?? 0),
    nationalizedSYPPerTurn: Math.round(asset.soeVenueSYPPerTurn ?? 0),
  };
}

/**
 * Legacy valuation-based cash preview (0.8 × valuation).
 *
 * DEPRECATED as an engine formula: it disagrees with the authored per-asset
 * deal terms now used by Phase 1 and the audit (`getOligarchTerms`). Kept only
 * because the assets panel and review modal still import it — those call sites
 * should switch to `getOligarchTerms(asset)` (tracked as DEFERRED).
 */
export function getOligarchSettlementIncome(valuationUSD: number): number {
  return Math.round(valuationUSD * 0.8);
}

/** Legacy valuation-based fire-sale preview (0.6 × valuation). See above. */
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
