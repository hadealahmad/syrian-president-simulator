// Shared data + helpers for command panels (ported from MinistryDrawer, tabs removed).
// Filter dimming follows the TopRibbon drill-down via selectedStatForOptions.

export type DecreeBehaviorType = 'ONE_TIME' | 'CONTINUOUS_TOGGLE' | 'PERIODIC';

export interface PoliticalDecreeItem {
  id: string;
  titleAr: string;
  descAr: string;
  costAr: string;
  gainAr: string;
  category: 'DECREE' | 'POLITICAL';
  behavior: DecreeBehaviorType;
  icon: string;
  effectsAr: Array<{ text: string; tone: 'good' | 'bad'; scope: 'national' | 'local' }>;
}

export const DECREE_PC_COSTS: Record<string, number> = {
  ANTI_CORRUPTION_COMMISSION: 15,
  PROPERTY_RESTITUTION_PORTAL: 10,
  SMUGGLING_BORDER_SWEEP: 12,
  TRIBAL_CUSTOMS_COUNCIL: 8,
  CABINET_HEARING: 0,
  UNITY_SPEECH: 0,
  OPPOSITION_SEATS: 0,
  MARTIAL_LAW: 0,
  REPUDIATE_IRAN_INFORMAL: -6,
  REPUDIATE_IRAN_FORMAL: -12,
  REPUDIATE_RUSSIA: -10,
  REPUDIATE_PARIS: -8,
};

export const DECREES: PoliticalDecreeItem[] = [
  {
    id: 'ANTI_CORRUPTION_COMMISSION',
    titleAr: 'مرسوم إطلاق هيئة النزاهة وتدقيق الأصول',
    descAr: 'تفتيش مركزي على مناقصات الإعمار وكبار أمراء الحرب والمصادرة الوقائية للأموال المشبوهة.',
    costAr: '−15 رصيد سياسي',
    gainAr: 'يقلص الفساد الوطني (-8) ويحد من هدر الموازنة ويرفع الثقة (+5)',
    category: 'DECREE',
    behavior: 'ONE_TIME',

    icon: 'gavel',    effectsAr: [{ text: 'فساد وطني -8', tone: 'good', scope: 'national' }, { text: 'ثقة شعبية +5', tone: 'good', scope: 'national' }, { text: 'احتقان المحافظات -3', tone: 'good', scope: 'national' }]
  },
  {
    id: 'PROPERTY_RESTITUTION_PORTAL',
    titleAr: 'المنصة الرقمية لرد الملكيات العقارية للاجئين',
    descAr: 'إنفاذ المرسوم 16 لرد الملكيات وتثبيت القيود رقمياً عبر سندات الطابو وحجج الوقف الموثقة.',
    costAr: '−10 رصيد سياسي',
    gainAr: 'يشجع عودة اللاجئين ويخفض مؤشر الاحتقان في حمص وريف دمشق ويرفع الثقة (+4)',
    category: 'DECREE',
    behavior: 'ONE_TIME',

    icon: 'key',    effectsAr: [{ text: 'ثقة شعبية +4', tone: 'good', scope: 'national' }, { text: 'احتقان حمص -8', tone: 'good', scope: 'local' }, { text: 'احتقان ريف دمشق -6', tone: 'good', scope: 'local' }]
  },
  {
    id: 'SMUGGLING_BORDER_SWEEP',
    titleAr: 'الحملة الوطنية المشتركة لضبط الحدود ومكافحة التهريب',
    descAr: 'نشر سرايا الهجانة ومفارز الجمارك على المعابر غير الشرعية وضبط تهريب المازوت والسلع المدعومة.',
    costAr: '−12 رصيد سياسي',
    gainAr: 'يحد من نزيف العملة الأجنبية ويجلب سيولة جمركية (+15M$) ويقلص الفساد (-4)',
    category: 'DECREE',
    behavior: 'PERIODIC',

    icon: 'barrier',    effectsAr: [{ text: 'فساد -4', tone: 'good', scope: 'national' }, { text: 'سيولة جمركية +$15M', tone: 'good', scope: 'national' }]
  },
  {
    id: 'TRIBAL_CUSTOMS_COUNCIL',
    titleAr: 'ميثاق التفاهم العشائري وتأمين الترانزيت الشرقي',
    descAr: 'إشراك وجهاء العشائر في حماية قوافل الترانزيت على طريق M4 مقابل عوائد تنموية محلية.',
    costAr: '−8 رصيد سياسي',
    gainAr: 'يؤمن حركة الترانزيت ويخفض اضطرابات دير الزور والرقة (-10 بمؤشر الاحتقان)',
    category: 'DECREE',
    behavior: 'ONE_TIME',

    icon: 'camping-tent',    effectsAr: [{ text: 'غضب عشائري بدير الزور -25', tone: 'good', scope: 'local' }, { text: 'احتقان دير الزور -10', tone: 'good', scope: 'local' }]
  },
  {
    id: 'CABINET_HEARING',
    titleAr: 'جلسة مساءلة حكومية علنية ونشر الذمة المالية',
    descAr: 'استدعاء وزراء المالية والتجارة والكهرباء لمساءلة مفتوحة أمام وسائل الإعلام وبثها للرأي العام.',
    costAr: 'صفر رصيد سياسي (مجاني)',
    gainAr: 'يرفع الرصيد السياسي (+8) والثقة الشعبية (+3) وكفاءة الوزارات (+2)',
    category: 'POLITICAL',
    behavior: 'PERIODIC',

    icon: 'podium',    effectsAr: [{ text: 'رصيد سياسي +8', tone: 'good', scope: 'national' }, { text: 'ثقة شعبية +3', tone: 'good', scope: 'national' }, { text: 'كفاءة الوزارات +2', tone: 'good', scope: 'national' }, { text: 'احتقان المحافظات -2', tone: 'good', scope: 'national' }]
  },
  {
    id: 'UNITY_SPEECH',
    titleAr: 'خطاب المصالحة الوطنية والعهد المدني الشامل',
    descAr: 'إعلان رئاسي رسمي بإنهاء كافة الملاحقات الإدارية والترحيب بعودة الكفاءات ورؤوس الأموال المهاجرة.',
    costAr: 'صفر رصيد سياسي (مجاني)',
    gainAr: 'يرفع الرصيد السياسي (+4) والثقة (+2) ويخفض مؤشر الاحتقان (-3)',
    category: 'POLITICAL',
    behavior: 'ONE_TIME',

    icon: 'megaphone',    effectsAr: [{ text: 'رصيد سياسي +4', tone: 'good', scope: 'national' }, { text: 'ثقة شعبية +2', tone: 'good', scope: 'national' }, { text: 'احتقان المحافظات -4', tone: 'good', scope: 'national' }]
  },
  {
    id: 'OPPOSITION_SEATS',
    titleAr: 'توسيع التشكيل الحكومي واستيعاب معارضة التكنوقراط',
    descAr: 'تعيين وزيرين مستقلين في حقيبتي الشؤون الاجتماعية والصناعة لضمان إجماع أوسع.',
    costAr: 'يستهلك تفاهمات سياسية محدودة',
    gainAr: 'يمنح +18 رصيد سياسي و +4 ثقة شعبية بإشراك الكفاءات الوطنية',
    category: 'POLITICAL',
    behavior: 'ONE_TIME',

    icon: 'vote',    effectsAr: [{ text: 'رصيد سياسي +18', tone: 'good', scope: 'national' }, { text: 'ثقة شعبية +4', tone: 'good', scope: 'national' }]
  },
  {
    id: 'MARTIAL_LAW',
    titleAr: 'إعلان حالة الطوارئ والأحكام العرفية',
    descAr: 'تجميد فوري لمؤشر الشغب والاحتجاجات وفرض منع التجوال في المناطق المشتعلة.',
    costAr: 'ديبَف مستمر (-4% ثقة شعبية لكل دور)',
    gainAr: 'تجميد الاحتجاجات وتخفيض حاسم للاحتقان (-15 وطني / -12 محلي)',
    category: 'POLITICAL',
    behavior: 'CONTINUOUS_TOGGLE',

    icon: 'cycle',    effectsAr: [{ text: 'احتقان وطني -15 / محلي -12', tone: 'good', scope: 'national' }, { text: 'ثقة شعبية -4 كل دور', tone: 'bad', scope: 'national' }]
  },
  {
    id: 'REPUDIATE_IRAN_INFORMAL',
    titleAr: 'إعلان بطلان المطالب الإيرانية غير الموثقة ($30B)',
    descAr: 'رفض رسمي لما تسميه طهران ديوناً عسكرية وإنسانية غير مثبتة بدفاتر الدولة — دين كريه بلا سند.',
    costAr: 'صفر رصيد سياسي (تذكرة مجانية)',
    gainAr: 'يرفع الرصيد السياسي (+6) والثقة (+2) بخطاب السيادة',
    category: 'POLITICAL',
    behavior: 'ONE_TIME',

    icon: 'scroll-quill',    effectsAr: [{ text: 'رصيد سياسي +6', tone: 'good', scope: 'national' }, { text: 'ثقة شعبية +2', tone: 'good', scope: 'national' }]
  },
  {
    id: 'REPUDIATE_IRAN_FORMAL',
    titleAr: 'التنصل من خطوط الائتمان النفطية الإيرانية ($7B)',
    descAr: 'وقف سداد القسط النفطي ($25M كل دور) وشطب دفتر الدين المعترف به — مع غضب شبكات التهريب والميليشيات.',
    costAr: 'صفر رصيد سياسي (الربح هو المكسب)',
    gainAr: 'يرفع الرصيد السياسي (+12) ويوقف النزيف الدولاري، مقابل توتر الشرق والجنوب',
    category: 'POLITICAL',
    behavior: 'ONE_TIME',

    icon: 'cross-mark',    effectsAr: [{ text: 'رصيد سياسي +12', tone: 'good', scope: 'national' }, { text: 'إسقاط القسط $25M', tone: 'good', scope: 'national' }, { text: 'احتقان السويداء والحسكة ودير الزور +', tone: 'bad', scope: 'local' }]
  },
  {
    id: 'REPUDIATE_RUSSIA',
    titleAr: 'التنصل من الديون الروسية الرسمية ($1.5B)',
    descAr: 'شطب الدين المعترف به لموسكو ورفض إرث صفقات الأسد العسكرية — مع رد فعل شبكات الساحل وقواعدها.',
    costAr: 'صفر رصيد سياسي (الربح هو المكسب)',
    gainAr: 'يرفع الرصيد السياسي (+10) ويخفض الدين المعترف به، مقابل توتر الساحل',
    category: 'POLITICAL',
    behavior: 'ONE_TIME',

    icon: 'cross-mark',    effectsAr: [{ text: 'رصيد سياسي +10', tone: 'good', scope: 'national' }, { text: 'الدين المعترف به -$1.5B', tone: 'good', scope: 'national' }, { text: 'احتقان الساحل +', tone: 'bad', scope: 'local' }]
  },
  {
    id: 'REPUDIATE_PARIS',
    titleAr: 'التنصل من الديون الثنائية الباريسية ($4.6B)',
    descAr: 'رفض سداد بقايا الدين الأوروبي القديم — مكسب سيادي فوري بثمن إغلاق أبواب التمويل الغربي والخليجي.',
    costAr: 'صفر رصيد سياسي (الربح هو المكسب)',
    gainAr: 'يرفع الرصيد السياسي (+8) ويخفض الدين المعترف به، مقابل عزلة استثمارية',
    category: 'POLITICAL',
    behavior: 'ONE_TIME',

    icon: 'gavel',    effectsAr: [{ text: 'رصيد سياسي +8', tone: 'good', scope: 'national' }, { text: 'الدين المعترف به -$4.6B', tone: 'good', scope: 'national' }, { text: 'ثقة شعبية -4', tone: 'bad', scope: 'national' }, { text: 'قروض الغرب والخليج مغلقة', tone: 'bad', scope: 'national' }]
  },
];

export function formatM(val: number): string {
  return (val / 1_000_000).toFixed(1);
}

export function formatBillion(syp: number): string {
  const val = Number((syp / 1_000_000_000).toFixed(2));
  if (Object.is(val, -0) || val === 0) return '0.00';
  return val.toFixed(2);
}

export const SUBSIDY_NAMES_AR: Record<string, string> = {
  AUSTERE: 'تقشف',
  STANDARD: 'اعتيادي',
  GENEROUS: 'موسع',
};

export const WORKFORCE_NAMES_AR: Record<string, string> = {
  MAINTAIN: 'تثبيت الملاك',
  PRUNE_CIVIL_SERVICE: 'شطب الوهمي',
  ABSORB_MILITIAS: 'استيعاب المسلحين',
};

export const WHEAT_NAMES_AR: Record<string, string> = {
  SUBSIDIZED_LOW: 'سعر إلزامي',
  MARKET_PARITY: 'سعر عادل',
  PREMIUM_INCENTIVE: 'علاوة تحفيز',
};

export const SMUGGLING_NAMES_AR: Record<string, string> = {
  CRACKDOWN: 'حملة صارمة',
  STANDARD: 'رقابة اعتيادية',
  PERMISSIVE: 'غض الطرف',
};

export const ASSET_STATUS_AR: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  SETTLED: 'تسوية مالية مصادقة',
  NATIONALIZED: 'تأميم حكومي قطاع عام',
  LIQUIDATED: 'تصفية خارجية',
};

export const STAT_NAMES_AR: Record<string, string> = {  treasurySYP: 'الخزينة العامة',
  reservesUSD: 'احتياطي النقد الأجنبي',
  sovereignDebtUSD: 'الدين السيادي الخارجي',
  m2MoneySupplySYP: 'الكتلة النقدية M2',
  parallelRate: 'سعر الصرف الموازي',
  politicalCapital: 'الرصيد السياسي',
  civilServiceHeadcount: 'ملاك موظفي الدولة',
  civilPayrollSYP: 'كتلة أجور الدولة',
  civilServiceWageUSD: 'متوسط الأجر الحقيقي',
  taxCompliancePct: 'الامتثال الضريبي',
  systemicCorruption: 'الفساد المؤسسي',
  civicTrust: 'الثقة الشعبية',
  sovereignLeverage: 'الارتهان السيادي',
  unrestIndex: 'مؤشر الاحتقان الشعبي',
};

// Top-bar value-state tiers: single source of truth for "how alarmed should a
// ribbon value look". Icons stay neutral wheat; only the VALUE carries state
// color (ok = wheat-light, warn = wheat-mid, crit = umber-crimson). Cutoffs
// preserve the previously inline thresholds (corruption red above 65, trust
// red below 35, unrest 50/70, wage $8 mutiny tripwire per STAT_EXPLAINERS_AR).
// warnAt may equal critAt for two-level stats (the warn tier is then unused).
export type StatState = 'ok' | 'warn' | 'crit';
export interface StatStateTier {
  warnAt: number;
  critAt: number;
  higherIsWorse: boolean;
}
export const STAT_STATE_TIERS: Record<string, StatStateTier> = {
  systemicCorruption: { warnAt: 65, critAt: 65, higherIsWorse: true },
  civicTrust: { warnAt: 35, critAt: 35, higherIsWorse: false },
  unrestIndex: { warnAt: 50, critAt: 70, higherIsWorse: true },
  civilServiceWageUSD: { warnAt: 8, critAt: 8, higherIsWorse: false },
};
export const STAT_STATE_TEXT: Record<StatState, string> = {
  ok: 'text-wheat-light',
  warn: 'text-wheat-mid',
  crit: 'text-umber-crimson',
};
export function statState(key: string, value: number): StatState {
  const t = STAT_STATE_TIERS[key];
  if (!t) return 'ok';
  if (t.higherIsWorse) {
    if (value >= t.critAt) return 'crit';
    if (value >= t.warnAt) return 'warn';
    return 'ok';
  }
  if (value <= t.critAt) return 'crit';
  if (value <= t.warnAt) return 'warn';
  return 'ok';
}

export function isProvincialActionRelated(selectedStat: string | null, actionKey: 'project' | 'demining' | 'power'): boolean {
  if (!selectedStat) return true;
  switch (actionKey) {
    case 'project':
      return ['reservesUSD', 'treasurySYP', 'politicalCapital', 'unrestIndex', 'civicTrust'].includes(selectedStat);
    case 'demining':
      return ['reservesUSD', 'treasurySYP', 'unrestIndex', 'civicTrust'].includes(selectedStat);
    case 'power':
      return ['reservesUSD', 'treasurySYP', 'dailyPowerHours', 'unrestIndex', 'civicTrust'].includes(selectedStat);
    default:
      return false;
  }
}

// Hub-button dot mapping: which option keys live in each command panel.
// Mirrors the dimming logic so a dot means "this panel has visible cards".
export const PANEL_OPTION_KEYS: Record<string, string[]> = {
  emergency: ['loans', 'mortgages', 'loanTermination', 'importSurge'],
  decrees: ['populistGrant'],
  tax: ['wageBumpPercent', 'remittanceCaptureSpread', 'gridCapExUSD', 'dollarAuctionUSD', 'corporateTaxRate', 'telecomExciseRate', 'nassibTransitFeeUSD', 'taxOverview', 'brainGain', 'charityFund'],
  assets: ['oligarchs'],
  policies: ['foodSubsidyLevel', 'workforceStrategy', 'wheatProcurement', 'dieselSmuggling'],
  stats: [],
  provincial: [],
};

export const PROVINCIAL_OPTION_KEYS: Array<'project' | 'demining' | 'power'> = ['project', 'demining', 'power'];

export function panelHasRelated(selectedStat: string | null, panelId: string): boolean {
  if (!selectedStat) return false;
  if (panelId === 'provincial') {
    return PROVINCIAL_OPTION_KEYS.some((k) => isProvincialActionRelated(selectedStat, k));
  }
  return (PANEL_OPTION_KEYS[panelId] ?? []).some((k) => isOptionRelated(selectedStat, k));
}

export function isOptionRelated(selectedStat: string | null, optionKey: string): boolean {
  if (!selectedStat) return true;
  switch (optionKey) {
    case 'wageBumpPercent':
      return ['unrestIndex', 'civilServiceWageUSD', 'civilPayrollSYP', 'treasurySYP', 'm2MoneySupplySYP', 'civicTrust'].includes(selectedStat);
    case 'foodSubsidyLevel':
      return ['unrestIndex', 'treasurySYP', 'reservesUSD', 'civicTrust'].includes(selectedStat);
    case 'workforceStrategy':
      return ['civilServiceHeadcount', 'civilPayrollSYP', 'systemicCorruption', 'unrestIndex', 'treasurySYP'].includes(selectedStat);
    case 'wheatProcurement':
      return ['unrestIndex', 'treasurySYP', 'reservesUSD', 'civicTrust'].includes(selectedStat);
    case 'dieselSmuggling':
      return ['unrestIndex', 'systemicCorruption', 'taxCompliancePct', 'dailyPowerHours'].includes(selectedStat);
    case 'remittanceCaptureSpread':
      return ['reservesUSD', 'parallelRate', 'civicTrust', 'm2MoneySupplySYP'].includes(selectedStat);
    case 'gridCapExUSD':
      return ['dailyPowerHours', 'reservesUSD', 'taxCompliancePct', 'unrestIndex', 'civicTrust'].includes(selectedStat);
    case 'dollarAuctionUSD':
      return ['reservesUSD', 'parallelRate', 'treasurySYP', 'm2MoneySupplySYP'].includes(selectedStat);
    case 'corporateTaxRate':
      return ['taxCompliancePct', 'treasurySYP', 'm2MoneySupplySYP'].includes(selectedStat);
    case 'telecomExciseRate':
      return ['treasurySYP', 'unrestIndex', 'taxCompliancePct'].includes(selectedStat);
    case 'nassibTransitFeeUSD':
      return ['reservesUSD', 'treasurySYP'].includes(selectedStat);
    case 'taxOverview':
      return ['taxCompliancePct', 'systemicCorruption', 'civicTrust'].includes(selectedStat);
    case 'oligarchs':
      return ['reservesUSD', 'treasurySYP', 'politicalCapital', 'civicTrust', 'systemicCorruption', 'civilServiceHeadcount'].includes(selectedStat);
    case 'loans':
      return ['reservesUSD', 'sovereignDebtUSD', 'sovereignLeverage', 'politicalCapital'].includes(selectedStat);
    case 'mortgages':
      return ['reservesUSD', 'sovereignLeverage', 'politicalCapital', 'sovereignDebtUSD'].includes(selectedStat);
    case 'brainGain':
      return ['civicTrust', 'reservesUSD', 'treasurySYP', 'taxCompliancePct', 'politicalCapital'].includes(selectedStat);
    case 'populistGrant':
    case 'charityFund':
      return ['politicalCapital', 'treasurySYP', 'unrestIndex', 'civicTrust'].includes(selectedStat);
    case 'importSurge':
      return ['politicalCapital', 'reservesUSD', 'unrestIndex', 'dailyPowerHours', 'civicTrust'].includes(selectedStat);
    case 'loanTermination':
      return ['politicalCapital', 'reservesUSD', 'sovereignDebtUSD', 'sovereignLeverage'].includes(selectedStat);
    default:
      return false;
  }
}

// Temporarily-suspended option treatment (insufficient PC/funds): dashed umber
// border, dimmed content, and a centered barrier-glyph overlay spanning the
// whole box. Applied consistently across the decrees, emergency and assets
// panels so an unaffordable option is instantly recognizable, while the card
// stays clickable where a details modal exists (overlay is pointer-transparent).
export const SUSPENDED_CARD_CLASS =
  'relative border-dashed border-umber-border/70';
export const SUSPENDED_CONTENT_CLASS = 'opacity-35 saturate-50';
export const SUSPENDED_ICON = 'barrier';
export function pcShortageText(costPC: number, remainingPC: number): string {
  return `موقوف مؤقتاً: يتطلب ${costPC} رصيد (المتاح ${remainingPC})`;
}

// How-it-works explanations for stats (shown in topbar + stats-table tooltips).
// Values stay in the UI; these describe the mechanic only.
export const STAT_EXPLAINERS_AR: Record<string, string> = {
  politicalCapital:
    'رصيد النفوذ التنفيذي (بالنقاط، بحد أقصى 200): يُنفق على المراسيم والقروض والمعاملات، ويُسترد عبر جلسات المساءلة والخطابات والتأميم — أو بشراء الولاء نقداً: المنحة الشعبية (+8)، صندوق الكرامة (+3/دور)، دفعة الاستيراد الإغاثية (+6)، والفسخ السيادي للقروض (+6). نفاده يشلّ القرارات ويهدد بانهيار الحكومة.',
  treasurySYP:
    'خزينة الدولة بـSP: الإيرادات (ضرائب، جمارك، رسوم) ناقص الرواتب والدعم والنفقات. السالب المفتوح مسموح (عجز ودين حكومي) دون طباعة قسرية.',
  reservesUSD:
    'احتياطي النقد الأجنبي: الدولارات الصعبة من الفوسفات والترانزيت والحوالات والقروض، تُنفق على القمح والفيول وخدمة الدين والمزادات. نفادها = إفلاس سيادي فوري.',
  sovereignDebtUSD:
    'إجمالي الدين الخارجي المعترف به: يبدأ $6.1B (باريس $4.6B (تشمل متأخرات قصيرة الأجل) + روسيا $1.5B) ويزيد بتوقيع القروض وينقص بالسداد المبكر أو التنصل. خدمته نصف سنوية: قسيمة ثابتة $45M + فائدة كل قرض موقع حسب نسبته. القسط النفطي الإيراني ($25M) يُخصم كبند مستقل خارج هذا الرقم.',
  civilServiceWageUSD:
    'الأجر الحقيقي = الراتب الاسمي بـSP مقسوماً على سعر الصرف الموازي. هبوطه تحت $8 يُشعل تمرد المؤسسة الأمنية.',
  parallelRate:
    'سعر السوق الموازية: يتحدد بالإصدار النقدي واستنزاف الدولار والثقة وتدخلات المزاد. لا تتحكم به مباشرة بل بمحركاته.',
  taxCompliancePct:
    'يُحسب آلياً: 47% أساس + الكهرباء والكفاءة الوزارية، مطروحاً منه الفساد والاحتقان الإقليمي (بين 12% و88%). حسّن مدخلاته بدل مطاردة الرقم.',
  systemicCorruption:
    'تسرّب مؤسسي يهدر الموازنة: يخفض الامتثال الضريبي ويبدد فعالية الإنفاق الرأسمالي. تخفضه هيئة النزاهة وحملات الحدود.',
  civicTrust:
    'الثقة الشعبية بالحكومة: ترفعها المساءلة والخطابات والكهرباء، وتهدمها الطباعة والطوارئ المستمرة. انهيارها مع نفاد الرصيد يشلّ الدولة.',
  sovereignLeverage:
    'هامش الاستقلال الوطني (يبدأ 65): كل قرض -8 وكل رهن -14، ويُسترد +2 لكل $100M سداد مبكر. حاسم في التقييم المئوي النهائي.',
  unrestIndex:
    'الاحتقان الوطني: متوسط مؤشرات المحافظات. فوق 80 مع 4 تمردات مسلحة = عصيان مدني وخسارة فورية.',
  m2MoneySupplySYP:
    'الكتلة النقدية: تكبر بالطباعة (السكّ) فتضغط على الصرف الموازي والتضخم. الطباعة سيولة مجانية اليوم وأزمة صرف غداً.',
  civilPayrollSYP:
    'كتلة أجور الدولة الشهرية: حاصل عدد الموظفين × متوسط الراتب. زيادتها ترفع الأجر الحقيقي وتمتص الاحتقان مقابل عجز الخزينة.',
  civilServiceHeadcount:
    'ملاك موظفي الدولة: شطب الوهمي يوفر الرواتب، واستيعاب المسلحين يكلف لكنه يمتص الاحتقان الأمني.',
  dailyPowerHours:
    'ساعات التغذية اليومية: الاستثمار الرأسمالي يضيف (كل $1M ≈ +15 ميغاواط ≈ +0.06 ساعة)، وانعدامه يآكل الشبكة -0.5 ساعة كل دور.',
  reconstructionScore:
    'نسبة الإعمار: ترفعها المشاريع الاستراتيجية (حسب الضرر المُصلح) وتعزيز الكهرباء (+0.03) والتطهير. فوق 55% مع الهدوء تعود العائلات.',
  mineSaturationPct:
    'نسبة الأراضي الملوثة بالألغام: أولوية التطهير تزيل 8% كل دور (فوق 8% فقط) وتحسّن الإعمار هامشياً.',
  prri:
    'مؤشر الاحتقان المحلي: الأجر مقابل سلة الغذاء + الظلام + الدمار + القلق الطائفي − فعالية الأمن. العتبات: 40 هادئة، 65 متوترة، 85 اضطرابات، فوقها تمرد مسلح يعدي الجيران.',
  population:
    'السكان: يفرون من مناطق الاضطراب والتمرد نحو المحافظات الهادئة، ويعود المغتربون للهادئة المعمرة (إعمار 55%+ وكهرباء كافية).',
  unrepairedDamageUSD:
    'الضرر المادي غير المُصلح بالدولار (بيانات البنك الدولي): المشاريع الاستراتيجية هي الطريق الرئيسي لتخفيضه ورفع الإعمار.',
};
