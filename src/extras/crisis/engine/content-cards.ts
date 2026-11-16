import type {
  CategoryId,
  CategoryMeta,
  CrisisTraitId,
  PlayerCardDef,
  PlayerTraitId,
  TraitMeta,
} from './types';

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  energy: { id: 'energy', name: 'طاقة', glyph: 'cat-energy' },
  food: { id: 'food', name: 'غذاء', glyph: 'cat-food' },
  security: { id: 'security', name: 'أمن', glyph: 'cat-security' },
  money: { id: 'money', name: 'مال', glyph: 'cat-money' },
  society: { id: 'society', name: 'مجتمع', glyph: 'cat-society' },
};

export const PLAYER_TRAITS: Record<PlayerTraitId, TraitMeta> = {
  watch: { id: 'watch', side: 'player', name: 'رصد', glyph: 'watch', description: 'يصدّ الأزمات ذات سمة التسلّل.' },
  split: { id: 'split', side: 'player', name: 'توزيع', glyph: 'split', description: 'يهاجم المسارين المجاورين بدل مساره.' },
  shield: { id: 'shield', side: 'player', name: 'درع', glyph: 'shield', description: 'يتجاهل أول إصابة يتلقاها في كل جولة.' },
  inspire: { id: 'inspire', side: 'player', name: 'إلهام', glyph: 'inspire', description: 'يمنح الحلفاء المجاورين +1 قوة.' },
  income: { id: 'income', side: 'player', name: 'دخل', glyph: 'income', description: 'يضيف +1 إلى الخزينة مطلع كل جولة.' },
  promote: { id: 'promote', side: 'player', name: 'ترقية', glyph: 'promote', description: 'ينال +1 قوة و+1 صمود أول مرة ينجو فيها من هجوم الأزمات.' },
  decisive: { id: 'decisive', side: 'player', name: 'حاسم', glyph: 'decisive', description: 'يقضي فورًا على أي أزمة غير زعيم يصيبها.' },
  mobile: { id: 'mobile', side: 'player', name: 'تنقّل', glyph: 'mobile', description: 'ينتقل مرة في الجولة إلى خانة مجاورة فارغة.' },
  return: { id: 'return', side: 'player', name: 'عودة', glyph: 'return', description: 'يعود إلى يدك عند سقوطه بدل المستبعد.' },
  solidarity: { id: 'solidarity', side: 'player', name: 'تضامن', glyph: 'solidarity', description: 'ينال +1 قوة عن كل حليف آخر من فئته.' },
  warn: { id: 'warn', side: 'player', name: 'إنذار', glyph: 'warn', description: 'يكشف شريط التوقعات كاملًا ما دام في الميدان.' },
  thorns: { id: 'thorns', side: 'player', name: 'اشتباك', glyph: 'thorns', description: 'يلحق نقطة ضرر بكل أزمة تهاجمه.' },
  aid: { id: 'aid', side: 'player', name: 'إسعاف', glyph: 'aid', description: 'يرمم نقطة صمود لكل حليف مجاور نهاية الجولة.' },
};

export const CRISIS_TRAITS: Record<CrisisTraitId, TraitMeta> = {
  sneak: { id: 'sneak', side: 'crisis', name: 'تسلّل', glyph: 'sneak', description: 'تضرب الميزان مباشرة ما لم يواجهها فريق ذو رصد.' },
  grow: { id: 'grow', side: 'crisis', name: 'تضخّم', glyph: 'grow', description: 'تزداد قوتها +1 نهاية الجولة حتى 6.' },
  spread: { id: 'spread', side: 'crisis', name: 'انتشار', glyph: 'spread', description: 'تزرع بؤرة (1/1) في خانة قادمة مجاورة فارغة كل جولتين.' },
  harden: { id: 'harden', side: 'crisis', name: 'تصلّب', glyph: 'harden', description: 'تتجاهل أول إصابة تتلقاها في كل جولة.' },
  smuggle: { id: 'smuggle', side: 'crisis', name: 'تهريب', glyph: 'smuggle', description: 'تنتقل إلى خانة أزمات مجاورة فارغة نهاية الجولة.' },
  erode: { id: 'erode', side: 'crisis', name: 'تآكل', glyph: 'erode', description: 'تخفض قوة الفريق الذي تصيبه بمقدار 1 دائمًا.' },
  rally: { id: 'rally', side: 'crisis', name: 'حشد', glyph: 'rally', description: 'تمنح الأزمات المجاورة +1 قوة.' },
};

type UnitSeed = [
  id: string,
  cat: CategoryId,
  name: string,
  glyph: PlayerCardDef['glyph'],
  cost: number,
  power: number,
  health: number,
  traits: PlayerTraitId[],
  rarityOverride?: PlayerCardDef['rarity'],
];

const UNIT_SEEDS: UnitSeed[] = [
  ['volunteers', 'society', 'متطوعون', 'volunteers', 0, 0, 2, [], 'token'],
  ['committee', 'society', 'لجنة الحي', 'committee', 1, 1, 2, []],
  ['medic', 'society', 'مسعف', 'medic', 2, 1, 2, ['aid']],
  ['teacher', 'society', 'معلّمة', 'teacher', 2, 1, 3, ['promote']],
  ['radio', 'society', 'إذاعة محلية', 'radio', 2, 0, 2, ['inspire']],
  ['returnee', 'society', 'مغترب عائد', 'returnee', 3, 2, 3, ['return']],
  ['union', 'society', 'نقابة', 'union', 4, 2, 5, ['solidarity']],
  ['relief-council', 'society', 'مجلس الإغاثة', 'medic', 5, 3, 6, ['aid'], 'rare'],

  ['technician', 'energy', 'فني صيانة', 'technician', 1, 1, 2, []],
  ['generator', 'energy', 'مولّدة الحي', 'generator', 2, 0, 3, ['income']],
  ['grid-engineer', 'energy', 'مهندس شبكة', 'grid-engineer', 3, 2, 3, ['split']],
  ['solar', 'energy', 'ألواح شمسية', 'solar', 3, 0, 5, ['income']],
  ['substation', 'energy', 'محطة تحويل', 'substation', 4, 3, 4, ['shield']],
  ['emergency-crew', 'energy', 'ورشة الطوارئ', 'emergency-crew', 5, 4, 4, ['split'], 'rare'],
  ['national-grid', 'energy', 'شبكة الربط', 'grid-engineer', 5, 3, 5, ['solidarity'], 'rare'],

  ['baker', 'food', 'فرّان', 'baker', 1, 1, 2, []],
  ['farmer', 'food', 'مزارع', 'farmer', 1, 1, 1, ['promote']],
  ['flour-convoy', 'food', 'قافلة طحين', 'flour-convoy', 2, 2, 2, ['mobile']],
  ['silo', 'food', 'صومعة', 'silo', 3, 0, 7, []],
  ['cooperative', 'food', 'تعاونية', 'cooperative', 3, 1, 4, ['solidarity']],
  ['mill', 'food', 'مطحنة', 'mill', 4, 3, 3, ['inspire']],
  ['grain-reserve', 'food', 'مخزون الحبوب', 'silo', 5, 3, 6, ['shield'], 'rare'],

  ['watchtower', 'security', 'نقطة مراقبة', 'watchtower', 1, 0, 3, ['watch']],
  ['field-radar', 'security', 'مرصد ميداني', 'watchtower', 2, 1, 3, ['warn']],
  ['patrol', 'security', 'دورية', 'patrol', 2, 2, 2, []],
  ['community-police', 'security', 'شرطة الحي', 'community-police', 2, 1, 3, ['watch']],
  ['border-unit', 'security', 'وحدة الحدود', 'border-unit', 3, 3, 2, ['mobile']],
  ['checkpoint', 'security', 'حاجز أمني', 'containment', 2, 1, 3, ['thorns']],
  ['investigator', 'security', 'محقق', 'investigator', 3, 1, 2, ['decisive']],
  ['containment', 'security', 'قوة احتواء', 'containment', 5, 4, 5, ['thorns'], 'rare'],
  ['rapid-brigade', 'security', 'لواء التدخل', 'border-unit', 5, 4, 4, ['watch'], 'rare'],

  ['money-changer', 'money', 'صرّاف نظامي', 'money-changer', 1, 1, 1, ['income']],
  ['auditor', 'money', 'مدقق', 'auditor', 2, 1, 2, ['decisive']],
  ['tax-collector', 'money', 'جابي ضرائب', 'tax-collector', 2, 0, 3, ['income']],
  ['dev-fund', 'money', 'صندوق تنمية', 'dev-fund', 3, 1, 4, ['inspire']],
  ['credit-bank', 'money', 'مصرف تسليف', 'credit-bank', 4, 2, 4, ['income']],
  ['sovereign-fund', 'money', 'صندوق سيادي', 'dev-fund', 5, 3, 5, ['inspire'], 'rare'],
  ['central-bank', 'money', 'المصرف المركزي', 'central-bank', 6, 3, 7, ['income'], 'rare'],
];

function inferRarity(cost: number): PlayerCardDef['rarity'] {
  if (cost <= 2) return 'common';
  if (cost <= 4) return 'uncommon';
  return 'rare';
}

const UNIT_DEFS: PlayerCardDef[] = UNIT_SEEDS.map(([id, category, name, glyph, cost, power, health, traits, rarityOverride]) => ({
  id,
  kind: 'unit',
  name,
  glyph,
  category,
  rarity: rarityOverride ?? inferRarity(cost),
  cost,
  power,
  health,
  traits,
  playable: true,
  description: traits.length > 0 ? traits.map((t) => `${PLAYER_TRAITS[t].name}: ${PLAYER_TRAITS[t].description}`).join(' ') : 'فريق ميداني جاهز للانتشار.',
}));

const ACTION_DEFS: PlayerCardDef[] = [
  { id: 'boost', kind: 'action', name: 'تعزيز عاجل', glyph: 'boost', category: 'society', rarity: 'common', cost: 1, target: 'ally', playable: true, description: 'امنح فريقًا +2 قوة في هذه الجولة.' },
  { id: 'evacuate', kind: 'action', name: 'إخلاء', glyph: 'evacuate', category: 'society', rarity: 'common', cost: 0, target: 'ally', playable: true, description: 'أعد أحد فرقك إلى يدك بكامل صموده.' },
  { id: 'repair', kind: 'action', name: 'إصلاح', glyph: 'repair', category: 'energy', rarity: 'common', cost: 1, target: 'damaged-ally', playable: true, description: 'رمّم صمود فريق متضرر بالكامل.' },
  { id: 'redeploy', kind: 'action', name: 'إعادة انتشار', glyph: 'redeploy', category: 'security', rarity: 'uncommon', cost: 1, target: 'redeploy', playable: true, description: 'بدّل موقع فريق مع خانة أخرى أو انقله إليها.' },
  { id: 'early-warning', kind: 'action', name: 'إنذار مبكر', glyph: 'early-warning', category: 'security', rarity: 'common', cost: 1, target: 'none', playable: true, description: 'اكشف شريط التوقعات طوال المعركة واسحب بطاقة.' },
  { id: 'emergency-funds', kind: 'action', name: 'تمويل طارئ', glyph: 'emergency-funds', category: 'money', rarity: 'common', cost: 0, target: 'none', playable: true, description: 'أضف +2 إلى الخزينة.' },
  { id: 'ban', kind: 'action', name: 'حظر', glyph: 'ban', category: 'security', rarity: 'uncommon', cost: 2, target: 'queue', playable: true, description: 'اقضِ على أزمة في صف القادم.' },
  { id: 'delay', kind: 'action', name: 'تأجيل', glyph: 'delay', category: 'food', rarity: 'common', cost: 1, target: 'delay-crisis', playable: true, description: 'أرجع أزمة إلى خانة القادم الفارغة فوقها.' },
  { id: 'mobilize', kind: 'action', name: 'تعبئة', glyph: 'mobilize', category: 'society', rarity: 'uncommon', cost: 2, target: 'none', playable: true, description: 'أضف بطاقتي متطوعين إلى يدك.' },
];

const CURSE_DEFS: PlayerCardDef[] = [
  { id: 'red-tape', kind: 'curse', name: 'روتين', glyph: 'red-tape', category: 'society', rarity: 'curse', cost: 1, target: 'none', playable: true, description: 'عبء إداري بلا أثر عند لعبه.' },
  { id: 'old-debt', kind: 'curse', name: 'ديون قديمة', glyph: 'old-debt', category: 'money', rarity: 'curse', cost: 0, playable: false, description: 'لا تُلعب؛ تنقص دخل الجولة بمقدار 1 ما دامت في يدك.' },
];

export const ALL_PLAYER_CARDS: PlayerCardDef[] = [...UNIT_DEFS, ...ACTION_DEFS, ...CURSE_DEFS];

export const PLAYER_CARDS: Record<string, PlayerCardDef> = Object.fromEntries(
  ALL_PLAYER_CARDS.map((c) => [c.id, c]),
);

export const COLLECTABLE_CARDS: PlayerCardDef[] = ALL_PLAYER_CARDS.filter(
  (c) => c.rarity === 'common' || c.rarity === 'uncommon' || c.rarity === 'rare',
);

export const COLLECTABLE_UNITS: PlayerCardDef[] = COLLECTABLE_CARDS.filter((c) => c.kind === 'unit');
export const COLLECTABLE_ACTIONS: PlayerCardDef[] = COLLECTABLE_CARDS.filter((c) => c.kind === 'action');
