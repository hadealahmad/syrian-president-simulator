import type { GameState, FailStateResult } from './types';
import { calculateRealWageUSD } from './currency';

/**
 * Validates the Sovereign Breaking Points (Fail States).
 */
export function checkFailStates(state: GameState): FailStateResult {
  const { macro, governorates } = state;

  // 1. SOVEREIGN INSOLVENCY (الإفلاس السيادي والعجز المالي الخارجي)
  if (macro.reservesUSD <= 0) {
    return {
      isFailed: true,
      type: 'SOVEREIGN_INSOLVENCY',
      titleAr: 'سقوط الدولة: الإفلاس السيادي الشامل',
      narrativeAr: 'نفد النقد الأجنبي تماماً من خزائن المصرف المركزي، وعجزت الدولة عن سداد شحنات القمح والفيول، ما أدى إلى توقف الموانئ وحجز الدائنين الأجانب على أصول الفوسفات ومحطات الحاويات، وسقوط العملة في دوامة تضخم جامح أطاحت بالحكومة.',
    };
  }

  // 2. GENERAL INSURRECTION (العصيان المدني العام واقتحام المقار الحكومية)
  const revoltingCount = Object.values(governorates).filter((g) => g.tier === 'REVOLT').length;
  if (macro.nationalRRI >= 80 && revoltingCount >= 4) {
    return {
      isFailed: true,
      type: 'URBAN_INSURRECTION',
      titleAr: 'سقوط الدولة: العصيان المدني العام واقتحام المقرات السيادية',
      narrativeAr: 'تجاوز مؤشر الاحتقان الشعبي حاجز 80 نقطة، واشتعلت انتفاضات مسلحة متزامنة في 4 محافظات أو أكثر. عجزت قوى الأمن الداخلي عن احتواء الشارع، واقتحمت الحشود الغاضبة القصر الجمهوري ومبنى رئاسة مجلس الوزراء.',
    };
  }

  // 3. SECURITY MUTINY (تمرد المؤسسة الأمنية والعسكرية)
  const soldierRealWageUSD = calculateRealWageUSD(macro.civilServiceWageSYP, macro.parallelRateSYP);
  if (soldierRealWageUSD < 8.0 && macro.systemicCorruption > 75) {
    return {
      isFailed: true,
      type: 'SECURITY_MUTINY',
      titleAr: 'سقوط الدولة: الانقلاب العسكري وتمرد حاميات الجيش',
      narrativeAr: 'تآكلت رواتب الجنود والضباط إلى ما دون 8 دولارات شهرياً، مع اتساع فساد قادة الألوية والمكاتب الجمركية. أعلنت قيادة الأركان وحاميات دمشق والساحل عزل الرئيس وتشكيل مجلس إنقاذ عسكري انتقالي.',
    };
  }

  // 4. BALKANIZATION CASCADE (التفكك المناطقي وإعلان الدويلات)
  const suwayda = governorates['as_suwayda'];
  const suwaydaSeceding = (suwayda?.suwaydaSecessionProb ?? 0) >= 85;
  const autonomousRevolts = Object.values(governorates).filter(
    (g) => g.archetype === 'autonomous_frontier' && g.tier === 'REVOLT'
  ).length;

  if (suwaydaSeceding && autonomousRevolts >= 2) {
    return {
      isFailed: true,
      type: 'BALKANIZATION_CASCADE',
      titleAr: 'سقوط الدولة: التفكك المناطقي الشامل والبلقنة',
      narrativeAr: 'أعلنت السويداء ومحافظات الجزيرة والشرق استقلالها الذاتي وقطع خطوط إمداد النفط والقمح عن دمشق، وانهارت الخريطة السياسية للجمهورية إلى كانتونات متناحرة تحت حماية قوى إقليمية ودولية.',
    };
  }

  // 5. REGIME PARALYSIS & ANARCHIC COLLAPSE (الشلل الحكومي والانهيار السيادي الشامل)
  if (
    (macro.politicalCapital <= 0 && macro.civicTrust <= 0) ||
    macro.nationalRRI >= 90 ||
    (macro.nationalRRI >= 75 && (macro.civicTrust <= 0 || macro.politicalCapital <= 0))
  ) {
    return {
      isFailed: true,
      type: 'CRISIS_DEFAULT_COLLAPSE',
      titleAr: 'سقوط الدولة: الشلل الحكومي وفقدان السيطرة المركزية',
      narrativeAr: 'أدى التخلف القسري عن معالجة الأزمات الوطنية الكبرى إلى انهيار الثقة الشعبية وتآكل الرصيد السياسي لرئاسة الجمهورية. فقدت الوزارات المركزية سيطرتها على المحافظات وأعلنت البلديات العصيان الإداري والمالي الشامل، ما أسقط النظام في فراغ سلطة تام.',
    };
  }

  return { isFailed: false };
}
