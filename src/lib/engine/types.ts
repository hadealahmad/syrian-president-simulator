export type Season = 'H1_HARVEST' | 'H2_WINTER';

export type UnrestTier = 'CALM' | 'TENSE' | 'RIOT' | 'REVOLT';

export type GovernorateArchetype =
  | 'revolution_hub'
  | 'coastal_enclave'
  | 'metropolitan_regime'
  | 'agricultural_hinterland'
  | 'energy_corridor'
  | 'autonomous_frontier';

export type SouthernPolicy =
  | 'HISTORIC_ACCORD'
  | 'LOCAL_VOUCHERS'
  | 'UNCONDITIONAL_AID'
  | 'BLOCKADE';

export type GolanBorderStance =
  | 'RESTRAINT'
  | 'LOCAL_GENDARMERIE'
  | 'DEPLOY_ARMOR'
  | 'UN_LIAISON';

export type WorkforceStrategy =
  | 'MAINTAIN'
  | 'ABSORB_MILITIAS'
  | 'PRUNE_CIVIL_SERVICE';

export type WheatProcurementStrategy =
  | 'SUBSIDIZED_LOW'
  | 'MARKET_PARITY'
  | 'PREMIUM_INCENTIVE';

export type DieselSmugglingStrategy =
  | 'PERMISSIVE'
  | 'STANDARD'
  | 'CRACKDOWN';

export type OligarchPolicyAction =
  | 'SETTLEMENT_80_20'
  | 'NATIONALIZE_SOE'
  | 'FOREIGN_LIQUIDATION';

export type PropertyRestitutionPolicy =
  | 'RESTITUTE_TO_REFUGEES'
  | 'MONETIZE_AS_STATE_LAND';

export type FinancingBloc =
  | 'WESTERN_IFI'
  | 'GULF_SWF'
  | 'EASTERN_POWERS';

export interface ConfiscatedAsset {
  id: string;
  titleAr: string;
  category: 'TELECOM' | 'INDUSTRY' | 'REAL_ESTATE' | 'HOSPITALITY';
  ownerNameAr: string;
  valuationUSD: number;
  valuationSYP: number;
  settlementYieldUSD: number;
  settlementYieldSYP: number;
  liquidationYieldUSD: number;
  soeVenueSYPPerTurn: number;
  status: 'PENDING' | 'SETTLED' | 'NATIONALIZED' | 'LIQUIDATED';
}

export interface ForeignLoanPackage {
  id: string;
  bloc: FinancingBloc;
  titleAr: string;
  lenderAr: string;
  disbursementUSD: number;
  interestRatePct: number;
  politicalCapitalCost: number;
  concessionSummaryAr: string;
  isSigned: boolean;
  /** Turn number the loan was signed on (service starts the following turn). */
  signedTurn?: number;
  /** Remaining principal; defaults to full disbursement for pre-feature saves. */
  remainingPrincipalUSD?: number;
}

export interface SovereignMortgageOption {
  id: string;
  titleAr: string;
  assetNameAr: string;
  concessionDurationYears: number;
  immediateCashUSD: number;
  turnRevenueLossUSD: number;
  sovereigntyPenaltyAr: string;
  isMortgaged: boolean;
}

export interface MacroeconomicState {
  treasurySYP: number;
  reservesUSD: number;
  m2MoneySupplySYP: number;
  officialRateSYP: number;
  parallelRateSYP: number;
  monthlyFoodBasketSYP: number;
  civilServiceWageSYP: number;
  annualInflationPct: number;
  systemicCorruption: number;
  politicalCapital: number;
  civicTrust: number;
  nationalRRI: number;
  sovereignDebtUSD: number;
  sovereignLeverage: number;
  /**
   * Recognized Iranian oil-credit stock (side ledger, serviced by a flat
   * $25M/turn coupon). Kept OUTSIDE sovereignDebtUSD so the $10B/$12B
   * century thresholds only see Paris + Russia + signed-loan debt.
   * Voided permanently by the REPUDIATE_IRAN_FORMAL decree.
   */
  iranOilDebtUSD: number;
  gridCapacityMW: number;
  dailyPowerHours: number;
  // Dynamic Tax Compliance Index (0 - 100%)
  taxCompliancePct?: number;
  // Total Workforce Headcount (in personnel)
  civilServiceHeadcount?: number;
  /** Productive capacity index (0-100): well-targeted CapEx and executed income
      projects expand the revenue base; revolts and graft erode it. */
  productiveCapacityPct?: number;
  /** Ring-fenced Gulf-grant dollars: spendable ONLY on provincial project USD costs. */
  grantBucketUSD?: number;
  /** Compliance bonus from absorbed ex-fighters in formal jobs (0 → 0.04). */
  militiaAbsorptionBonus?: number;
  /** Override for the flat Iranian oil coupon once rescheduled (undefined = default). */
  iranCouponOverrideUSD?: number;
}

export interface GovernorateStrategicProject {
  id: string;
  governorateId: string;
  titleAr: string;
  issueDescriptionAr: string;
  solutionDescriptionAr: string;
  costUSD: number;
  costSYP: number;
  costPoliticalCapital: number;
  isExecuted: boolean;
  effectDescriptionAr: string;
  prriDelta: number;
  damageRepairedUSD: number;
  blackoutHoursDelta: number;
  mineClearancePct: number;
  sectarianAnxietyDelta?: number;
  skilledLaborBonus?: number;
  revenueCaptureBoost?: number;
  tribalRageDelta?: number;
  golanTensionDelta?: number;
  suwaydaIntegrationBonus?: number;
  /** Recurring SYP revenue once executed (ports, rents, industry). */
  recurringRevenueSYPPerTurn?: number;
  /** Permanent USD wheat-import-bill reduction once executed (farmland projects). */
  wheatImportSavingsUSD?: number;
}

export interface GovernorateNode {
  id: string;
  nameAr: string;
  nameEn?: string;
  archetype: GovernorateArchetype;
  hexQ: number;
  hexR: number;
  population: number;
  hostPopulation?: number;
  idpPopulation?: number;
  returneePopulation?: number;
  totalCapitalUSD: number;
  unrepairedDamageUSD: number;
  reconstructionScore: number;
  dailyBlackoutHours: number;
  prri: number;
  tier: UnrestTier;
  sectarianAnxiety: number;
  securityEfficacy: number;
  activeHospitalsPct: number;
  totalArableHectares: number;
  mineSaturationPct: number;
  skilledLaborCount: number;
  connectedGovernorateIds: string[];
  strategicProject: GovernorateStrategicProject;
  suwaydaIntegrationIndex?: number;
  suwaydaSecessionProb?: number;
  tribalRageIndex?: number;
  golanTensionIndex?: number;
  daraaDefianceIndex?: number;
  nassibRevenueCapturePct?: number;
}

export interface MinistryProfile {
  id: string;
  nameAr: string;
  ministerNameAr: string;
  isOpposition: boolean;
  competence: number;
  corruption: number;
  allocatedBudgetSYP: number;
  allocatedCapExUSD: number;
}

export interface CommissionState {
  id: string;
  nameAr: string;
  leaderNameAr?: string;
  mandateAr?: string;
  isActive: boolean;
  progress: number;
}

export interface TurnDirectives {
  wageBumpPercent: number;
  foodSubsidyLevel: 'AUSTERE' | 'STANDARD' | 'GENEROUS' | null;
  officialRateAdjustment: number;
  dollarAuctionUSD: number;
  antiSpeculationRaids: boolean;
  moneyPrintingSYP: number;
  deminingPriorityId: string | null;
  powerBoostGovId: string | null;
  gridCapExUSD: number;
  southernPolicy: SouthernPolicy;
  golanBorderStance: GolanBorderStance;
  activePoliticalActions: string[];
  provincialProjects: string[];
  // Deep Systems Levers
  workforceStrategy: WorkforceStrategy | null;
  wheatProcurement: WheatProcurementStrategy | null;
  dieselSmuggling: DieselSmugglingStrategy | null;
  remittanceCaptureSpread: number; // 0% to 25%
  corporateTaxRate: number; // 15% to 30%
  telecomExciseRate: number; // 10% to 25%
  nassibTransitFeeUSD: number; // 200 to 800 $/truck
  oligarchDecisions: Record<string, OligarchPolicyAction>;
  propertyRestitution: PropertyRestitutionPolicy;
  signedLoanIds: string[];
  executedMortgageIds: string[];
  /** Concessional facilities to sign this turn (disbursed in tranches). Reset each turn. */
  signedFacilityIds: string[];
  expatriateBrainGainIncentive: boolean;
  /** Voluntary early principal repayment for this turn (USD). Highest-rate loans first. */
  extraDebtRepaymentUSD: number;
  /** One-shot populist cash grant this turn (750B SYP -> +8 PC). Reset each turn. */
  populistGrant: boolean;
  /** Persistent sovereign charity fund toggle (250B SYP/turn -> +3 PC/turn). */
  charityFundActive: boolean;
  /** One-shot emergency food/fuel import surge this turn ($40M -> +6 PC). Reset each turn. */
  importSurge: boolean;
  /** Full early termination (sovereign buyback) of signed loans this turn. Reset each turn. */
  terminatedLoanIds: string[];
}

export interface RevenueAudit {
  grossCapturedUSD: number;
  discretionaryCapturedUSD: number;
  expendedUSD: number;
  netUSDDelta: number;
  runwayMonths: number;
  runwayAlertTier: 'STABLE' | 'WARNING' | 'CRITICAL';
  grossCapturedSYP: number;
  expendedSYP: number;
  netSYPDelta: number;
  seignioragePrintedSYP: number;
  /** Semiannual debt service paid this turn (legacy coupon + signed-loan interest). */
  debtServiceUSD: number;
  /** Flat $25M/turn Iranian oil-credit coupon (zero once formally repudiated). */
  iranOilCouponUSD: number;
  /** FX revenue forfeited to active sovereign mortgages this turn. */
  mortgageDrainUSD: number;
  /** Voluntary principal repaid this turn. */
  debtRepaymentPaidUSD: number;
  /** SYP destroyed by the dollar auction (true absorption — never enters treasury). */
  auctionAbsorbedSYP: number;
  /** 5% interest charged on an overdrawn (negative) opening treasury. */
  overdraftInterestSYP: number;
  /** SYP spending consumed this turn (payrolls, subsidies, ministries, patronage). */
  operatingExpendedSYP: number;
  /** SYP spending that builds future revenue (projects, demining, power, CapEx, wheat procurement). */
  investmentExpendedSYP: number;
  /** Turns until FX reserves run dry at the current USD burn rate (capped at 99). */
  runwayTurnsEstimate: number;
  /** Extra SYP revenue from productive capacity this turn (growth valve). */
  capacityRevenueBonusSYP: number;
  /** SYP revenue from executed strategic projects this turn. */
  projectRevenueSYP: number;
  /** USD disbursed by concessional facilities this turn (tranches). */
  facilityInflowUSD: number;
  /** Human-readable facility tranche lines (shared by preview and results). */
  facilityLinesAr: string[];
  /** Overdraft interest as a share of gross SYP revenue (burden readability). */
  interestBurdenPct: number;
}

export type FacilityStatus = 'AVAILABLE' | 'ACTIVE' | 'BREACHED' | 'COMPLETED';

export interface FacilityTranche {
  amountUSD: number;
  /** Disbursed into the ring-fenced project bucket instead of general reserves. */
  ringFenced?: boolean;
}

export interface ConcessionalFacility {
  id: string;
  titleAr: string;
  lenderAr: string;
  descriptionAr: string;
  conditionAr: string;
  breachAr: string;
  politicalCapitalCost: number;
  leverageCost: number;
  tranches: FacilityTranche[];
  /** Kind of conditionality attached while ACTIVE. */
  condition:
    | { kind: 'DIESEL_CRACKDOWN'; turns: number }
    | { kind: 'CORRUPTION_BELOW'; threshold: number }
    | { kind: 'NONE' };
  /** One-shot balance-sheet effect applied on signing (Iran reschedule). */
  onSign?: { iranCouponUSD?: number };
}

export interface FacilityState {
  id: string;
  status: FacilityStatus;
  tranchesDrawn: number;
  /** Turns of conditionality remaining (counts down while ACTIVE). */
  conditionTurnsLeft: number;
}

export interface PredictivePreviewRanges {
  deficitSYP: number;
  runwayMonthsEstimated: number;
  fxRateMin: number;
  fxRateMax: number;
  realWageMin: number;
  realWageMax: number;
  rriChangeMin: number;
  rriChangeMax: number;
  requiresPrintingSYP: number;
  /** Projected legacy+signed-loan debt service (for the review-modal deductions row). */
  debtServiceUSD: number;
  /** Projected Iranian oil coupon (zero once formally repudiated). */
  iranOilCouponUSD: number;
  /** Projected concessional-facility inflow this turn (tranches). */
  facilityInflowUSD: number;
  /** Human-readable facility tranche/condition lines for the review modal. */
  facilityStatusAr: string[];
  /** Projected operating (consumptive) SYP deficit component. */
  operatingDeficitSYP: number;
  /** Projected investment (productive) SYP spending. */
  investmentSYP: number;
}

export interface ProjectedStat {
  current: number;
  projected: number;
  delta: number;
  pctChange: number;
  isBeneficial: boolean;
  isHarmful: boolean;
  isChanged: boolean;
}

export interface ProjectedTurnSummary {
  treasurySYP: ProjectedStat;
  reservesUSD: ProjectedStat;
  parallelRateSYP: ProjectedStat;
  realWageUSD: ProjectedStat;
  politicalCapital: ProjectedStat;
  nationalRRI: ProjectedStat;
  dailyPowerHours: ProjectedStat;
  civicTrust: ProjectedStat;
  sovereignDebtUSD: ProjectedStat;
  m2MoneySupplySYP: ProjectedStat;
  taxCompliancePct: ProjectedStat;
  systemicCorruption: ProjectedStat;
  sovereignLeverage: ProjectedStat;
  civilServiceHeadcount: ProjectedStat;
  civilPayrollSYP: ProjectedStat;
  runwayMonths: number;
  deficitSYP: number;
  hasSelections: boolean;
  /** Predicted gov-to-gov displacement legs for next turn under current draft directives. */
  migrationFlows: MigrationFlow[];
}

export interface EventGovernorateDelta {
  governorateId: string;
  governorateNameAr?: string;
  prri?: number;
  dailyBlackoutHours?: number;
  sectarianAnxiety?: number;
  securityEfficacy?: number;
  activeHospitalsPct?: number;
  reconstructionScore?: number;
  suwaydaIntegrationIndex?: number;
  suwaydaSecessionProb?: number;
  tribalRageIndex?: number;
  golanTensionIndex?: number;
  daraaDefianceIndex?: number;
  nassibRevenueCapturePct?: number;
  skilledLaborCount?: number;
  customSummaryAr?: string;
}

export interface EventOption {
  id: string;
  labelAr: string;
  descriptionAr: string;
  costUSD: number;
  costSYP: number;
  costPC: number;
  effectTrust: number;
  effectRRI: number;
  effectCorruption: number;
  effectCompetence: number;
  customEffectAr: string;
  canChoose?: boolean;
  requirementsDescriptionAr?: string;
  governorateEffects?: EventGovernorateDelta[];
}

export interface EventCard {
  id: string;
  titleAr: string;
  sourceAr: string;
  category:
    | 'EXOGENOUS'
    | 'ENDOGENOUS'
    | 'MACRO'
    | 'SOUTHERN'
    | 'SECURITY'
    | 'INFRASTRUCTURE'
    | 'AGRICULTURE'
    | 'ENERGY'
    | 'INDUSTRY'
    | 'HEALTH'
    | 'ENVIRONMENT'
    | 'TRADE'
    | 'FOOD'
    | 'LOGISTICS'
    | 'SOVEREIGNTY'
    | 'EDUCATION';
  descriptionAr: string;
  turnTrigger?: number;
  targetGovernorateId?: string;
  triggerCondition?: (state: GameState) => boolean;
  options: EventOption[];
}

export interface FailStateResult {
  isFailed: boolean;
  type?: 'SOVEREIGN_INSOLVENCY' | 'URBAN_INSURRECTION' | 'SECURITY_MUTINY' | 'BALKANIZATION_CASCADE' | 'CRISIS_DEFAULT_COLLAPSE';
  titleAr?: string;
  narrativeAr?: string;
}

export interface CenturyEnding {
  id: string;
  titleAr: string;
  subtitleAr: string;
  finalScore: number;
  reportAr: string;
  southernTitleAr: string;
  southernReportAr: string;
}

export interface MigrationFlow {
  fromId: string;
  toId: string;
  count: number;
  kind: 'flight';
}

export interface MigrationSummary {
  totalDisplacedMigrants: number;
  totalReturnees: number;
  summaryAr: string[];
  /** Gov-to-gov internal displacement legs for this turn (returnees excluded: no origin gov). */
  flows: MigrationFlow[];
}

export interface GameState {
  turnNumber: number;
  calendarYear: number;
  season: Season;
  seed: number;
  macro: MacroeconomicState;
  governorates: Record<string, GovernorateNode>;
  ministries: Record<string, MinistryProfile>;
  commissions: Record<string, CommissionState>;
  activeEvents: EventCard[];
  flags: Record<string, number>;
  lastTurnAudit: RevenueAudit | null;
  isGameOver: boolean;
  failState: FailStateResult | null;
  centuryEnding: CenturyEnding | null;
  // Deep Systems State
  confiscatedAssets: ConfiscatedAsset[];
  foreignLoans: ForeignLoanPackage[];
  sovereignMortgages: SovereignMortgageOption[];
  /** Concessional facilities (IMF/grant/reschedule) lifecycle state. */
  facilities: FacilityState[];
  lastMigrationReport?: MigrationSummary;
  /** Cumulative gov-to-gov displacement across committed turns: key `${fromId}>${toId}` → people. */
  migrationLedger?: Record<string, number>;
  enactedDecrees?: string[];
}
