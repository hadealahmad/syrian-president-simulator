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
  gridCapacityMW: number;
  dailyPowerHours: number;
  // Dynamic Tax Compliance Index (0 - 100%)
  taxCompliancePct?: number;
  // Total Workforce Headcount (in personnel)
  civilServiceHeadcount?: number;
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
  expatriateBrainGainIncentive: boolean;
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
}

export interface EventCard {
  id: string;
  titleAr: string;
  sourceAr: string;
  category: 'EXOGENOUS' | 'ENDOGENOUS' | 'MACRO' | 'SOUTHERN' | 'SECURITY' | 'INFRASTRUCTURE';
  descriptionAr: string;
  turnTrigger?: number;
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

export interface MigrationSummary {
  totalDisplacedMigrants: number;
  totalReturnees: number;
  summaryAr: string[];
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
  lastMigrationReport?: MigrationSummary;
}
