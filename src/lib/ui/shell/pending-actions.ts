import type { TurnDirectives } from '../../engine/types';
import { getDefaultTurnDirectives } from '../../engine/turn-manager';

/**
 * Number of pending decisions in the current draft, shown as the red badge on
 * the End-Turn seal. Derived from the same default-vs-draft comparison used by
 * `hasDraftSelections` in the engine (TurnReviewModal's "has any actions"
 * logic), but counted instead of collapsed to a boolean so the seal can show a
 * meaningful number.
 */
export function countPendingDraftActions(draft: TurnDirectives): number {
  if (!draft) return 0;
  const def = getDefaultTurnDirectives();
  let count = 0;
  const add = (pending: boolean): void => {
    if (pending) count += 1;
  };

  add(draft.wageBumpPercent !== def.wageBumpPercent);
  add(draft.foodSubsidyLevel != null && draft.foodSubsidyLevel !== def.foodSubsidyLevel);
  add(draft.workforceStrategy != null && draft.workforceStrategy !== def.workforceStrategy);
  add(draft.wheatProcurement != null && draft.wheatProcurement !== def.wheatProcurement);
  add(draft.dieselSmuggling != null && draft.dieselSmuggling !== def.dieselSmuggling);
  add(draft.remittanceCaptureSpread !== def.remittanceCaptureSpread);
  add(draft.corporateTaxRate !== def.corporateTaxRate);
  add(draft.telecomExciseRate !== def.telecomExciseRate);
  add(draft.nassibTransitFeeUSD !== def.nassibTransitFeeUSD);
  add(draft.gridCapExUSD !== def.gridCapExUSD);
  add((draft.dollarAuctionUSD ?? 0) > 0);
  add(draft.deminingPriorityId !== null);
  add(draft.powerBoostGovId !== null);
  add(!!draft.expatriateBrainGainIncentive);
  add(!!draft.populistGrant);
  add(!!draft.charityFundActive);
  add(!!draft.importSurge);
  add((draft.extraDebtRepaymentUSD ?? 0) > 0);
  add(draft.propertyRestitution !== def.propertyRestitution);
  add(draft.southernPolicy !== def.southernPolicy);
  add(draft.golanBorderStance !== def.golanBorderStance);

  count += draft.activePoliticalActions?.length ?? 0;
  count += draft.provincialProjects?.length ?? 0;
  count += draft.signedLoanIds?.length ?? 0;
  count += draft.signedFacilityIds?.length ?? 0;
  count += draft.executedMortgageIds?.length ?? 0;
  count += draft.terminatedLoanIds?.length ?? 0;
  count += Object.keys(draft.oligarchDecisions ?? {}).length;

  return count;
}

export function hasPendingDraftActions(draft: TurnDirectives): boolean {
  return countPendingDraftActions(draft) > 0;
}
