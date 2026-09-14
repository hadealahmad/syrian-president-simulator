import type { GovernorateNode, UnrestTier, TurnDirectives, MigrationSummary } from './types';

/**
 * Computes the Provincial Riot Risk Index (PRRI) for a governorate.
 */
export function calculateProvincialPRRI(
  node: GovernorateNode,
  realWageUSD: number,
  foodBasketUSD: number
): number {
  const wageRatio = foodBasketUSD > 0 ? (foodBasketUSD / Math.max(10, realWageUSD)) : 1.0;
  const wageFactor = Math.min(100, wageRatio * 15) * 0.35;
  const blackoutFactor = (node.dailyBlackoutHours / 24) * 20.0;
  const damageRatio = node.totalCapitalUSD > 0 ? (node.unrepairedDamageUSD / node.totalCapitalUSD) : 0.5;
  const damageFactor = damageRatio * 15.0;
  const sectarianFactor = (node.sectarianAnxiety / 100) * 15.0;
  const securityDampener = (node.securityEfficacy / 100) * 25.0;

  const rawPRRI = wageFactor + blackoutFactor + damageFactor + sectarianFactor - securityDampener;
  return Math.round(Math.max(5, Math.min(100, rawPRRI)));
}

/**
 * Determines the unrest status tier based on PRRI score.
 */
export function getUnrestTier(prri: number): UnrestTier {
  if (prri < 40) return 'CALM';
  if (prri < 65) return 'TENSE';
  if (prri < 85) return 'RIOT';
  return 'REVOLT';
}

/**
 * Evaluates spatial contagion across connected highways when any node is in REVOLT.
 */
export function applySpatialContagion(governorates: Record<string, GovernorateNode>): void {
  const revoltingIds = Object.values(governorates)
    .filter((g) => g.tier === 'REVOLT')
    .map((g) => g.id);

  if (revoltingIds.length === 0) return;

  for (const sourceId of revoltingIds) {
    const sourceNode = governorates[sourceId];
    for (const targetId of sourceNode.connectedGovernorateIds) {
      const targetNode = governorates[targetId];
      if (targetNode && targetNode.tier !== 'REVOLT') {
        const contagionDelta = Math.round((sourceNode.prri * 0.10));
        targetNode.prri = Math.min(100, targetNode.prri + contagionDelta);
        targetNode.tier = getUnrestTier(targetNode.prri);
      }
    }
  }
}

/**
 * Updates Southern Front parameters (As-Suwayda & Daraa) based on policy directives.
 */
export function updateSouthernFront(
  governorates: Record<string, GovernorateNode>,
  directives: TurnDirectives
): void {
  const suwayda = governorates['as_suwayda'];
  const daraa = governorates['daraa'];

  if (suwayda) {
    let sii = suwayda.suwaydaIntegrationIndex ?? 8;
    let ssp = suwayda.suwaydaSecessionProb ?? 24;
    let tri = suwayda.tribalRageIndex ?? 74;

    switch (directives.southernPolicy) {
      case 'HISTORIC_ACCORD':
        sii = Math.min(100, sii + 18);
        ssp = Math.max(0, ssp - 15);
        tri = Math.max(0, tri - 25);
        suwayda.prri = Math.max(10, suwayda.prri - 8);
        break;
      case 'UNCONDITIONAL_AID':
        sii = Math.min(100, sii + 4);
        ssp = Math.max(0, ssp - 10);
        tri = Math.min(100, tri + 20);
        break;
      case 'BLOCKADE':
        sii = Math.max(0, sii - 15);
        ssp = Math.min(100, ssp + 30);
        tri = Math.max(0, tri - 15);
        suwayda.prri = Math.min(100, suwayda.prri + 25);
        break;
      case 'LOCAL_VOUCHERS':
        sii = Math.min(100, sii + 6);
        ssp = Math.max(0, ssp - 5);
        tri = Math.max(0, tri - 2);
        break;
    }

    suwayda.suwaydaIntegrationIndex = sii;
    suwayda.suwaydaSecessionProb = ssp;
    suwayda.tribalRageIndex = tri;
    suwayda.tier = getUnrestTier(suwayda.prri);
  }

  if (daraa) {
    let gti = daraa.golanTensionIndex ?? 45;
    let ddi = daraa.daraaDefianceIndex ?? 54;
    let nrc = daraa.nassibRevenueCapturePct ?? 32;

    switch (directives.golanBorderStance) {
      case 'RESTRAINT':
        gti = Math.max(15, gti - 15);
        ddi = Math.min(100, ddi + 18);
        daraa.prri = Math.min(100, daraa.prri + 10);
        break;
      case 'DEPLOY_ARMOR':
        gti = Math.min(100, gti + 25);
        ddi = Math.max(10, ddi - 20);
        daraa.prri = Math.max(15, daraa.prri - 8);
        break;
      case 'LOCAL_GENDARMERIE':
        gti = Math.min(100, gti + 5);
        ddi = Math.max(10, ddi - 8);
        nrc = Math.min(80, nrc + 5);
        break;
    }

    daraa.golanTensionIndex = gti;
    daraa.daraaDefianceIndex = ddi;
    daraa.nassibRevenueCapturePct = nrc;
    daraa.tier = getUnrestTier(daraa.prri);
  }
}

/**
 * Applies demining progress to the targeted governorate.
 */
export function applyDemining(
  governorates: Record<string, GovernorateNode>,
  targetGovernorateId: string | null
): { clearedPercent: number; governorateNameAr?: string } {
  if (!targetGovernorateId || !governorates[targetGovernorateId]) {
    return { clearedPercent: 0 };
  }

  const target = governorates[targetGovernorateId];
  if (target.mineSaturationPct <= 0) {
    return { clearedPercent: 0, governorateNameAr: target.nameAr };
  }

  const cleared = Math.min(target.mineSaturationPct, 8); // Methodical clearance rate: 8% per turn
  target.mineSaturationPct -= cleared;

  // Reduced danger improves reconstruction score slightly
  target.reconstructionScore = Math.min(1.0, target.reconstructionScore + (cleared * 0.003));

  return { clearedPercent: cleared, governorateNameAr: target.nameAr };
}

/**
 * Executes dynamic inter-provincial demographic migration.
 * Displaced persons and vulnerable populations flee riot/revolt zones,
 * while calm and reconstructed hubs attract returnees and economic migrants.
 */
export function processInterProvincialMigration(
  governorates: Record<string, GovernorateNode>
): MigrationSummary {
  let totalDisplacedMigrants = 0;
  let totalReturnees = 0;
  const summaryAr: string[] = [];

  const govList = Object.values(governorates);
  const safeDestinations = govList.filter((g) => g.tier === 'CALM');
  const targetSafe = safeDestinations.length > 0 ? safeDestinations : govList.filter((g) => g.tier === 'TENSE');

  for (const node of govList) {
    // 1. Conflict Flight: If province is in RIOT or REVOLT
    if (node.tier === 'REVOLT' || node.tier === 'RIOT') {
      const flightRatio = node.tier === 'REVOLT' ? 0.03 : 0.015;
      const fledCount = Math.round(node.population * flightRatio);
      if (fledCount > 1000 && targetSafe.length > 0) {
        node.population -= fledCount;
        if (node.idpPopulation && node.idpPopulation > fledCount) {
          node.idpPopulation -= fledCount;
        }
        const perDest = Math.round(fledCount / targetSafe.length);
        for (const dest of targetSafe) {
          dest.population += perDest;
          dest.idpPopulation = (dest.idpPopulation ?? 0) + perDest;
        }
        totalDisplacedMigrants += fledCount;
        summaryAr.push(`نزوح ${fledCount.toLocaleString('en-US')} مواطن من ${node.nameAr} بسبب اشتعال الشغب نحو المحافظات الآمنة.`);
      }
    }

    // 2. Reconstruction Attraction & Returnees
    if (node.reconstructionScore >= 0.55 && node.dailyBlackoutHours <= 16 && node.tier === 'CALM') {
      const returneeRate = 0.01;
      const newReturnees = Math.round(node.population * returneeRate);
      if (newReturnees > 500) {
        node.population += newReturnees;
        node.returneePopulation = (node.returneePopulation ?? 0) + newReturnees;
        totalReturnees += newReturnees;
        summaryAr.push(`استقطاب ${newReturnees.toLocaleString('en-US')} عائد ومغترب إلى ${node.nameAr} بفضل استقرار الخدمات.`);
      }
    }
  }

  return {
    totalDisplacedMigrants,
    totalReturnees,
    summaryAr,
  };
}
