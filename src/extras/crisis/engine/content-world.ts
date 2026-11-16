import type {
  ActMeta,
  ActNumber,
  BossDef,
  BossId,
  CrisisDef,
  EncounterSpec,
  EventDef,
  ModifierDef,
  ModifierId,
  NodeType,
  TeamDef,
  TeamId,
  TutorialStep,
  UiGlyphKey,
} from './types';
import { CRISIS_TRAITS } from './content-cards';

type CrisisSeed = [
  id: string,
  name: string,
  glyph: CrisisDef['glyph'],
  cat: CrisisDef['category'],
  acts: ActNumber[],
  power: number,
  health: number,
  traits: CrisisDef['traits'],
  threat: number,
  flags?: { token?: boolean; elite?: boolean },
];

const CRISIS_SEEDS: CrisisSeed[] = [
  ['rumor', 'شائعة', 'rumor', 'society', [1, 2, 3], 1, 2, ['sneak'], 2],
  ['crowding', 'ازدحام', 'crowding', 'society', [1, 2, 3], 1, 4, ['rally'], 3],
  ['strike', 'إضراب', 'strike', 'society', [1, 2, 3], 2, 4, ['harden'], 4],
  ['hotspot', 'بؤرة', 'hotspot', 'society', [1, 2, 3], 1, 1, [], 1, { token: true }],

  ['fault', 'عطل', 'fault', 'energy', [1], 1, 2, [], 1],
  ['outage', 'انقطاع', 'outage', 'energy', [1], 1, 3, [], 2],
  ['overload', 'حمل زائد', 'overload', 'energy', [1], 1, 3, ['grow'], 3],
  ['cable-theft', 'سرقة كابلات', 'cable-theft', 'security', [1], 1, 2, ['sneak'], 3],
  ['snowstorm', 'عاصفة ثلجية', 'snowstorm', 'energy', [1], 2, 4, [], 4],
  ['fuel-shortage', 'شحّ الوقود', 'fuel-shortage', 'energy', [1], 2, 4, ['harden'], 5],
  ['grid-collapse', 'انهيار الشبكة', 'overload', 'energy', [1], 2, 4, ['grow', 'harden'], 6, { elite: true }],

  ['bread-queue', 'طابور خبز', 'bread-queue', 'food', [2], 1, 4, ['rally'], 3],
  ['locusts', 'جراد', 'locusts', 'food', [2], 1, 2, ['spread'], 3],
  ['flour-monopoly', 'احتكار الطحين', 'flour-monopoly', 'money', [2], 2, 4, ['harden'], 4],
  ['drought', 'جفاف', 'drought', 'food', [2], 1, 5, ['grow'], 5],
  ['flour-smuggling', 'تهريب الطحين', 'flour-smuggling', 'security', [2], 2, 3, ['smuggle'], 3],
  ['black-market', 'سوق سوداء', 'black-market', 'money', [2], 2, 4, ['erode'], 5],
  ['supply-siege', 'حصار التموين', 'drought', 'food', [2], 2, 5, ['spread', 'rally'], 6, { elite: true }],

  ['speculation', 'مضاربة', 'speculation', 'money', [3], 1, 2, ['grow'], 3],
  ['market-panic', 'ذعر الأسواق', 'market-panic', 'money', [3], 1, 1, ['spread'], 3],
  ['corruption', 'فساد', 'corruption', 'money', [3], 2, 2, ['erode'], 4],
  ['capital-flight', 'هروب الأموال', 'capital-flight', 'money', [3], 2, 1, ['sneak'], 4],
  ['debt-due', 'دين مستحق', 'debt-due', 'money', [3], 3, 4, ['harden'], 5],
  ['hyperinflation', 'تضخّم جامح', 'hyperinflation', 'money', [3], 2, 3, ['grow', 'rally'], 6, { elite: true }],

  ['smuggling-ring', 'شبكة تهريب', 'smuggling-ring', 'security', [2, 3], 2, 3, ['smuggle'], 4],
  ['unrest', 'اضطراب', 'unrest', 'security', [2, 3], 2, 2, [], 3],
];

export const ALL_CRISES: CrisisDef[] = CRISIS_SEEDS.map(([id, name, glyph, category, acts, power, health, traits, threat, flags]) => ({
  id,
  name,
  glyph,
  category,
  acts,
  power,
  health,
  traits,
  threat,
  isToken: flags?.token,
  isElite: flags?.elite,
  description: traits.length > 0 ? traits.map((t) => `${CRISIS_TRAITS[t].name}: ${CRISIS_TRAITS[t].description}`).join(' ') : 'أزمة ميدانية تضغط على الجبهة.',
}));

export const CRISES: Record<string, CrisisDef> = Object.fromEntries(ALL_CRISES.map((c) => [c.id, c]));

export const BOSSES: Record<BossId, BossDef> = {
  blackout: {
    id: 'blackout',
    act: 1,
    name: 'العتمة الكبرى',
    glyph: 'blackout',
    category: 'energy',
    phase1: { power: 1, health: 14, rule: 'يُظلم مساران عشوائيان كل جولة: تُخفى خانة القادم فيهما وتنقص قوة فرقك هناك بمقدار 1.' },
    phase2: { power: 2, health: 16, rule: 'يستمر إظلام المسارين، وكل جولتين يملأ عطل كل خانة قادم فارغة.' },
  },
  profiteer: {
    id: 'profiteer',
    act: 2,
    name: 'تاجر الأزمات',
    glyph: 'profiteer',
    category: 'food',
    phase1: { power: 1, health: 12, rule: 'تزداد كلفة البطاقات التي تكلف 2 فأكثر بمقدار 1.' },
    phase2: { power: 2, health: 14, rule: 'تستمر زيادة الكلفة، ونهاية كل جولة تخسر 1 من الخزينة وتظهر سوق سوداء كل جولتين.' },
  },
  spiral: {
    id: 'spiral',
    act: 3,
    name: 'الدوّامة',
    glyph: 'spiral',
    category: 'money',
    phase1: { power: 1, health: 16, rule: 'نهاية كل جولة تزداد قوة كل أزمة أخرى في الميدان بمقدار 1 حتى 6.' },
    phase2: { power: 2, health: 18, rule: 'تزداد قوة الأزمات +1، ويهبط الميزان بمقدار 1 نهاية الجولة ما لم تنشر فريقين ماليين على الأقل.' },
  },
};

export const MODIFIERS: Record<ModifierId, ModifierDef> = {
  fog: { id: 'fog', name: 'ضباب', glyph: 'watch', description: 'تبقى خانة القادم في المسار الرابع مخفية.' },
  'tight-budget': { id: 'tight-budget', name: 'ميزانية مقيدة', glyph: 'cost', description: 'يهبط دخل الخزينة الأساسي إلى 1 في أول جولتين.' },
  'popular-support': { id: 'popular-support', name: 'دعم شعبي', glyph: 'gauge', description: 'يبدأ الميزان عند +1 لصالحك.' },
  surge: { id: 'surge', name: 'موجة', glyph: 'spread', description: 'تصل موجة أزمات إضافية في الجولة الثالثة.' },
  shortage: { id: 'shortage', name: 'شحّ', glyph: 'deck', description: 'يعرض الإمداد بطاقة واحدة من السحب بدل اثنتين.' },
};

export const ACTS: Record<ActNumber, ActMeta> = {
  1: { act: 1, name: 'الشتاء', flavour: 'energy', bossId: 'blackout' },
  2: { act: 2, name: 'الرغيف', flavour: 'food', bossId: 'profiteer' },
  3: { act: 3, name: 'الليرة', flavour: 'money', bossId: 'spiral' },
};

export const NODE_META: Record<NodeType, { name: string; glyph: UiGlyphKey }> = {
  battle: { name: 'معركة', glyph: 'node-battle' },
  elite: { name: 'معركة صعبة', glyph: 'node-elite' },
  recruit: { name: 'تجنيد', glyph: 'node-recruit' },
  train: { name: 'تدريب', glyph: 'node-train' },
  rest: { name: 'استراحة', glyph: 'node-rest' },
  market: { name: 'سوق', glyph: 'node-market' },
  event: { name: 'طارئ', glyph: 'node-event' },
  boss: { name: 'الزعيم', glyph: 'node-boss' },
};

export const TEAMS: Record<TeamId, TeamDef> = {
  rescue: {
    id: 'rescue',
    name: 'فريق الإنقاذ',
    glyph: 'medic',
    unlockRule: 'متاح منذ البداية',
    description: 'تشكيلة متوازنة تواجه الطوارئ اليومية بالصيانة والإغاثة.',
    starterCardIds: ['committee', 'committee', 'technician', 'technician', 'baker', 'baker', 'patrol', 'money-changer', 'boost', 'repair'],
  },
  development: {
    id: 'development',
    name: 'فريق التنمية',
    glyph: 'dev-fund',
    unlockRule: 'ابلغ الفصل الثاني لفتحه',
    description: 'تشكيلة اقتصادية تبني الدخل والتضامن لتمويل الجبهات.',
    starterCardIds: ['farmer', 'farmer', 'medic', 'tax-collector', 'flour-convoy', 'generator', 'cooperative', 'dev-fund', 'emergency-funds', 'delay'],
  },
  resolve: {
    id: 'resolve',
    name: 'فريق الحزم',
    glyph: 'containment',
    unlockRule: 'اكسب جولة كاملة لفتحه',
    description: 'تشكيلة أمنية تعتمد الرصد والحسم والاشتباك المباشر.',
    starterCardIds: ['watchtower', 'teacher', 'community-police', 'checkpoint', 'field-radar', 'auditor', 'border-unit', 'investigator', 'redeploy', 'ban'],
  },
};

export const EVENTS: EventDef[] = [
  {
    id: 'returning-expat',
    name: 'مبادرة مغترب',
    glyph: 'returnee',
    text: 'يعرض خبير مغترب تمويل الخزينة بالمنح أو قيادة فريق متخصص في الميدان.',
    choices: [
      { label: 'اقبل منحة التمويل', outcomes: [{ kind: 'grants', delta: 8 }] },
      { label: 'ضمّ فريقًا نادرًا', outcomes: [{ kind: 'addRandomRareUnit' }] },
    ],
  },
  {
    id: 'donor-generator',
    name: 'شحنة مولدات',
    glyph: 'generator',
    text: 'تقدّم جمعية أهلية مولدة كهربائية جاهزة للتركيب في أحد الأحياء.',
    choices: [
      { label: 'ركّب مولّدة الحي', outcomes: [{ kind: 'addCards', defIds: ['generator'] }] },
      { label: 'بع المعدات للمنح', outcomes: [{ kind: 'grants', delta: 5 }] },
    ],
  },
  {
    id: 'suspicious-contract',
    name: 'عقد مشبوه',
    glyph: 'red-tape',
    text: 'يعرض متعهد سيولة فورية ضخمة مقابل تمرير معاملات بيروقراطية معقدة.',
    choices: [
      { label: 'اقبل المنحة والروتين', outcomes: [{ kind: 'grants', delta: 12 }, { kind: 'addCards', defIds: ['red-tape'] }] },
      { label: 'ارفض العرض المشبوه', outcomes: [{ kind: 'grants', delta: 2 }] },
    ],
  },
  {
    id: 'volunteer-drive',
    name: 'حملة أهلية',
    glyph: 'committee',
    text: 'يتنادى سكان الأحياء لتشكيل لجان مساندة أو جمع تبرعات عاجلة.',
    choices: [
      { label: 'شكّل لجنتي حي', outcomes: [{ kind: 'addCards', defIds: ['committee', 'committee'] }] },
      { label: 'اجمع التبرعات النقدية', outcomes: [{ kind: 'grants', delta: 6 }] },
    ],
  },
  {
    id: 'field-course',
    name: 'دورة ميدانية',
    glyph: 'teacher',
    text: 'تتيح كلية الهندسة تدريب أحد فرقك أو إرسال فني صيانة جديد.',
    choices: [
      { label: 'درّب فريقًا عشوائيًا', outcomes: [{ kind: 'upgradeRandomUnit' }] },
      { label: 'انتدب فني صيانة', outcomes: [{ kind: 'addCards', defIds: ['technician'] }] },
    ],
  },
  {
    id: 'general-strike',
    name: 'اعتصام نقابي',
    glyph: 'strike',
    text: 'يطالب عمال النقل ببدل طوارئ فوري قبل تفاقم الاحتقان العام.',
    choices: [
      { label: 'ادفع 6 منح للعمال', requireGrants: 6, outcomes: [{ kind: 'grants', delta: -6 }] },
      { label: 'تحمّل خسارة الثقة', outcomes: [{ kind: 'life', delta: -1 }] },
    ],
  },
  {
    id: 'archive-reform',
    name: 'أرشفة الدواوين',
    glyph: 'auditor',
    text: 'يكتشف المدققون ملفات عالقة تعطل العمل الإداري في غرفة العمليات.',
    choices: [
      { label: 'نقِّ الإضبارة من عبء', outcomes: [{ kind: 'removeRandomCurseOrCard' }] },
      { label: 'عيّن مدققًا ماليًا', outcomes: [{ kind: 'addCards', defIds: ['auditor'] }] },
    ],
  },
  {
    id: 'wheat-convoy',
    name: 'قافلة قمح',
    glyph: 'flour-convoy',
    text: 'تصل شحنة حبوب إضافية إلى المعبر وتحتاج إلى توجيه فوري.',
    choices: [
      { label: 'أرسل قافلة الطحين', outcomes: [{ kind: 'addCards', defIds: ['flour-convoy'] }] },
      { label: 'خزّن العائد في المنح', outcomes: [{ kind: 'grants', delta: 6 }] },
    ],
  },
  {
    id: 'old-ledger',
    name: 'دفتر الديون',
    glyph: 'old-debt',
    text: 'يفتح المصرف اعتمادًا عاجلًا بشرط تسجيل التزامات سابقة على الموازنة.',
    choices: [
      { label: 'اسحب 10 منح بالدين', outcomes: [{ kind: 'grants', delta: 10 }, { kind: 'addCards', defIds: ['old-debt'] }] },
      { label: 'أغلق الملف دون اقتراض', outcomes: [] },
    ],
  },
  {
    id: 'medical-relief',
    name: 'قافلة طبية',
    glyph: 'medic',
    text: 'تتطوع طواقم إسعاف لدعم المراكز المنهكة واستعادة ثقة الأهالي.',
    choices: [
      { label: 'استعد نقطة ثقة', outcomes: [{ kind: 'life', delta: 1 }] },
      { label: 'ضمّ مسعفًا إلى فرقك', outcomes: [{ kind: 'addCards', defIds: ['medic'] }] },
    ],
  },
  {
    id: 'early-radar',
    name: 'شبكة إنذار',
    glyph: 'early-warning',
    text: 'يعرض مهندسو الاتصالات تركيب منظومة رصد مبكر للأزمات المقبلة.',
    choices: [
      { label: 'اعتمد الإنذار المبكر', outcomes: [{ kind: 'addCards', defIds: ['early-warning'] }] },
      { label: 'درّب فريقًا حاليًا', outcomes: [{ kind: 'upgradeRandomUnit' }] },
    ],
  },
  {
    id: 'solar-grant',
    name: 'منحة شمسية',
    glyph: 'solar',
    text: 'تموّل مبادرة دولية تركيب ألواح شمسية مقابل مساهمة تشغيلية رمزية.',
    choices: [
      { label: 'ادفع 4 منح للألواح', requireGrants: 4, outcomes: [{ kind: 'grants', delta: -4 }, { kind: 'addCards', defIds: ['solar'] }] },
      { label: 'اطلب دعمًا نقديًا بديلًا', outcomes: [{ kind: 'grants', delta: 4 }] },
    ],
  },
];

export const TUTORIAL_ENCOUNTER: EncounterSpec = {
  act: 1,
  kind: 'tutorial',
  openingFront: [{ lane: 1, defId: 'fault' }],
  openingQueue: [{ lane: 2, defId: 'outage' }],
  waves: [
    ['fault'],
    ['rumor', 'fault'],
    ['outage'],
  ],
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'supply', moment: 'supply', targetElement: 'supply-sheet', glyph: 'deck', text: 'اختر بطاقة إمداد واحدة مطلع كل جولة لتعزيز يدك.' },
  { id: 'deploy', moment: 'playCard', targetElement: 'hand-and-player-line', glyph: 'technician', text: 'اسحب فريقًا إلى صف فرقك لصدّ الأزمة أو دفع الميزان.' },
  { id: 'queue', moment: 'queueRow', targetElement: 'queue-row', glyph: 'warn', text: 'راقب صف القادم؛ ستنزل هذه الأزمات في الجولة المقبلة.' },
  { id: 'preview', moment: 'preview', targetElement: 'gauge-preview', glyph: 'gauge', text: 'تابع الأرقام المتوقعة ومؤشر الميزان؛ بلوغ +5 يحسم النصر.' },
  { id: 'end-round', moment: 'endRound', targetElement: 'end-round-btn', glyph: 'power', text: 'أنهِ الجولة لتنفيذ الهجمات وحسم الموقف.' },
];
