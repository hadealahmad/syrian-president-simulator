import type { GameState, CenturyEnding } from './types';
import { calculateRealWageUSD } from './currency';

/**
 * Executes the 100-Year Generational Projection Engine (Years 21 to 100).
 * Runs upon successful survival of all 40 turns.
 */
export function projectCenturyOutcome(state: GameState): CenturyEnding {
  const { macro, governorates } = state;
  const realWage = calculateRealWageUSD(macro.civilServiceWageSYP, macro.parallelRateSYP);
  const avgReconstruction =
    Object.values(governorates).reduce((acc, g) => acc + g.reconstructionScore, 0) /
    Object.keys(governorates).length;

  const suwayda = governorates['as_suwayda'];
  const hasHistoricAccord = (suwayda?.suwaydaIntegrationIndex ?? 0) >= 80;
  const hasHighSecession = (suwayda?.suwaydaSecessionProb ?? 0) >= 60;

  // Composite national score (0 - 100)
  const economicPillar = Math.min(30, (macro.reservesUSD / 10_000_000) * 1.5);
  const socialPillar = Math.min(25, (macro.civicTrust * 0.25));
  const infrastructurePillar = Math.min(25, avgReconstruction * 25);
  const integrityPillar = Math.max(0, 20 - (macro.systemicCorruption * 0.20));
  const finalScore = Math.round(economicPillar + socialPillar + infrastructurePillar + integrityPillar);

  // Determine National Generational Ending
  let id = 'hollowed_republic';
  let titleAr = 'الجمهورية المفرغة من كفاءاتها';
  let subtitleAr = 'دولة الحد الأدنى والعيش على تحويلات المغتربين';
  let reportAr =
    'نجحت الدولة في تفادي الانهيار العسكري الشامل، لكنها بقيت عالقة في مستنقع الاقتصاد الريعي الهش. هاجر معظم الأطباء والمهندسين وأصحاب الحرف، وتحولت الجمهورية إلى مجتمع استهلاكي يعيش على حوالات أبنائه في الخارج دون قاعدة إنتاجية صلبة.';

  if (finalScore >= 80 && macro.systemicCorruption < 40 && avgReconstruction >= 0.80) {
    id = 'sovereign_phoenix';
    titleAr = 'العنقاء السيادية: النهضة السورية الكبرى';
    subtitleAr = 'استعادة الإنتاج الصناعي، السيادة النقدية، وبناء دولة المؤسسات';
    reportAr =
      'على مدار قرن كامل من إعادة الإعمار الشفاف، تحولت سوريا إلى مركز صناعي وتجاري رائد في شرق المتوسط. تمت استعادة السيادة على الموانئ والموارد، وعادت الكفاءات المهجرة من الشتات لتؤسس نهضة تكنولوجية وزراعية غير مسبوقة.';
  } else if (macro.sovereignDebtUSD > 12_000_000_000 || macro.sovereignLeverage < 35) {
    id = 'mortgaged_enclave';
    titleAr = 'الإمارة المرهونة للشركات الأجنبية';
    subtitleAr = 'اقتصاد امتيازات محتكر وعجز سيادي طويل الأمد';
    reportAr =
      'تمكنت الدولة من تمويل الإعمار عبر قروض باهظة ورهن المرافق السيادية. تحولت موانئ الساحل ومناجم الفوسفات وأبراج الاتصالات إلى ملكيات حصرية لشركات متعددة الجنسيات، وجردت الدولة من استقلال قرارها الاقتصادي لقرن قادم.';
  } else if (macro.dailyPowerHours < 8 || avgReconstruction < 0.55) {
    id = 'ecological_dust_bowl';
    titleAr = 'صحراء العطش والتصحر المناخي';
    subtitleAr = 'جفاف أحواض الأنهار ونزوح الريف نحو أطراف المدن';
    reportAr =
      'أدى العجز عن تأهيل مشاريع الري وسدود الفرات وتطهير الأراضي الزراعية من الألغام إلى تصحر واسع في أرياف الجزيرة والوسط، ما خلق حزام بؤس عشوائي يحيط بالمدن الكبرى ويهدد استقرار الأجيال القادمة.';
  } else if (macro.nationalRRI > 65 || macro.systemicCorruption > 70) {
    id = 'garrison_bastion';
    titleAr = 'حصن الحامية العسكرية الدائمة';
    subtitleAr = 'أولوية الأمن العسكري واستنزاف الموارد في الترسانة';
    reportAr =
      'استمرت الدولة في إنفاق النسبة الأكبر من الناتج القومي على المؤسسة العسكرية والحواجز الأمنية لردع الاضطرابات، ما كبل نمو القطاع الخاص وأبقى الحريات الاقتصادية والسياسية في حالة طوارئ مستدامة.';
  }

  // Determine Southern Frontier Trajectory
  let southernTitleAr = 'الجبهة العازلة والنزاع المجمد';
  let southernReportAr =
    'استقرت الحدود الجنوبية على نمط "الهدنة المسلحة الباردة" مع استمرار الاستنزاف الدفاعي لحرس الحدود، وبقاء التنسيق الأمني في حدوده الدنيا دون انفجار شامل.';

  if (hasHistoricAccord) {
    southernTitleAr = 'الجنوب المتصالح والمستقر (وفاق السهل والجبل)';
    southernReportAr =
      'أثمر الوفاق التاريخي الشجاع بين بدو اللجاة وأهالي جبل العرب عن اندماج كامل للسويداء في مؤسسات الدولة، وازدهرت تجارة الترانزيت عبر معبر نصيب لتصبح شريان الذهب للجنوب السوري.';
  } else if (hasHighSecession) {
    southernTitleAr = 'مستنقع الكانتونات وشبكات التهريب';
    southernReportAr =
      'تكرس انفصال جبل العرب عن العاصمة وتحول ريف درعا والحدود إلى معاقل لشبكات التهريب العابرة، مع غياب شبه كامل لسيادة القانون والخدمات العامة المركزية.';
  }

  return {
    id,
    titleAr,
    subtitleAr,
    reportAr,
    southernTitleAr,
    southernReportAr,
    finalScore,
  };
}
