import type { EventCard } from '../types';

export const INDUSTRY_EVENTS: EventCard[] = [
  {
    id: 'event_25_cement_cartel',
    titleAr: 'احتكار كارتيل مصانع الإسمنت وتعطيل مشاريع إعادة الإعمار',
    category: 'INDUSTRY',
    sourceAr: 'نقابة مقاولي الإنشاءات / وزارة الصناعة',
    descriptionAr: 'تواطأ كبار تجار وموزعي الإسمنت الأسود في حماة وطرطوس على تعطيش السوق وتخزين آلاف الأطنان، مما رفع سعر الطن بنسبة 85% وشل حركة إعمار الأحياء المتضررة والجسور الحيوية.',
    targetGovernorateId: 'hama',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_cement_raid_confiscate',
        labelAr: 'مداهمة المستودعات المحتكرة ومصادرة الإسمنت وطرحه بالسعر الجبري',
        descriptionAr: 'تسيير دوريات الأمن الجنائي والتموين لكسر أقفال المستودعات وبيع الإسمنت لشركات المقاولات الوطنية.',
        costUSD: 0,
        costSYP: -350_000_000_000,
        costPC: 12,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -12,
        effectCompetence: 8,
        customEffectAr: 'كسر الاحتكار فوراً ومصادرة 350 مليار ل.س واستئناف مشاريع البناء (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'hama', prri: -10, reconstructionScore: 8, customSummaryAr: 'توفير الإسمنت لورشات حماة (+8 إعمار)' },
          { governorateId: 'aleppo', reconstructionScore: 8, prri: -8, customSummaryAr: 'استئناف إعمار أحياء حلب الشرقية' }
        ]
      },
      {
        id: 'opt_cement_zero_duty_import',
        labelAr: 'فتح باب استيراد الإسمنت الأجنبي بدون جمارك لكسر الأسعار',
        descriptionAr: 'السماح بتدفق الإسمنت التركي والمصري عبر الموانئ لخفض الأسعار التنافسية فوراً.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $35M',
        costUSD: 35_000_000,
        costSYP: 0,
        costPC: 4,
        effectTrust: 10,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 12,
        customEffectAr: 'هبوط أسعار الإسمنت بنسبة 40% واستمرار الإعمار على حساب الاحتياطي الأجنبي',
        governorateEffects: [
          { governorateId: 'tartus', reconstructionScore: 6, customSummaryAr: 'تفريغ بواخر الإسمنت بمرفأ طرطوس' },
          { governorateId: 'damascus', reconstructionScore: 6, prri: -6, customSummaryAr: 'انتعاش ورشات البناء بدمشق' }
        ]
      },
      {
        id: 'opt_rehab_state_cement_factory',
        labelAr: 'إعادة تأهيل معمل إسمنت المسلمية الحكومي بحلب بكامل طاقته',
        descriptionAr: 'تمويل خط إنتاج حكومي استراتيجي يؤمن نصف احتياجات البلاد دون الاعتماد على القطاع الخاص.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $50M',
        costUSD: 50_000_000,
        costSYP: 220_000_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -6,
        effectCorruption: -6,
        effectCompetence: 16,
        customEffectAr: 'تحقيق السيادة الصناعية في مواد البناء وتوفير آلاف فرص العمل للشباب (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 12, prri: -12, customSummaryAr: 'تشغيل مجمع إسمنت المسلمية بحلب (+12 إعمار)' }
        ]
      }
    ]
  },
  {
    id: 'event_26_m5_haulers_strike',
    titleAr: 'إضراب أصحاب شاحنات الترانزيت على الطريق الدولي M5',
    category: 'INFRASTRUCTURE',
    sourceAr: 'اتحاد شركات شحن البضائع / وزارة النقل',
    descriptionAr: 'احتجاجاً على مضاعفة رسوم العبور والوزن المحوري وغلاء الديزل، قطع أكثر من 3000 سائق شاحنة الطريق الدولي M5 بين حمص والنبك، مهددين بقطع تدفق الخضار والوقود عن دمشق والجنوب.',
    targetGovernorateId: 'homs',
    triggerCondition: (state) => state.macro.civicTrust < 70,
    options: [
      {
        id: 'opt_toll_freeze_fuel_voucher',
        labelAr: 'تعليق الرسوم مؤقتاً وتخصيص قسائم مازوت مدعوم لسائقي الشاحنات',
        descriptionAr: 'إنهاء الإضراب فوراً وإعادة فتح الشريان الدولي خلال ساعات مع التنازل عن عوائد الجباية.',
        costUSD: 0,
        costSYP: 320_000_000_000,
        costPC: 6,
        effectTrust: 8,
        effectRRI: -10,
        effectCorruption: 0,
        effectCompetence: 6,
        customEffectAr: 'فتح الطريق الدولي M5 وتدفق البضائع فوراً لأسواق العاصمة (-10 احتقان)',
        governorateEffects: [
          { governorateId: 'homs', prri: -12, customSummaryAr: 'إنهاء اعتصام شاحنات النبك وحمص (-12 احتقان)' },
          { governorateId: 'damascus', prri: -10, customSummaryAr: 'تدفق المواد الغذائية للعاصمة' },
          { governorateId: 'aleppo', prri: -8, customSummaryAr: 'استئناف شحن بضائع حلب للجنوب' }
        ]
      },
      {
        id: 'opt_police_clear_highway',
        labelAr: 'تحريك قوى الأمن الداخلي لفتح الطريق وسحب رخص قيادة المضربين',
        descriptionAr: 'استخدام القوة لفض إغلاق الأوتوستراد الدولي واعتقال المحرضين لفرض هيبة الدولة.',
        costUSD: 0,
        costSYP: 0,
        costPC: 16,
        effectTrust: -14,
        effectRRI: 18,
        effectCorruption: 4,
        effectCompetence: -4,
        customEffectAr: 'فتح جزئي للطريق تحت الحراسة مع تصاعد الاحتقان النقابي وشلل سلاسل التوريد (+18 احتقان)',
        governorateEffects: [
          { governorateId: 'homs', prri: 18, securityEfficacy: 4, customSummaryAr: 'استنفار أمني واحتجاجات على M5 (+18 احتقان)' },
          { governorateId: 'rif_dimashq', prri: 12, customSummaryAr: 'تأخر قوافل التموين بريف دمشق' }
        ]
      },
      {
        id: 'opt_compromise_freight_accord',
        labelAr: 'عقد تسوية نقابية بتخفيض الرسوم بنسبة 50% وتحديث استراحات الطرق',
        descriptionAr: 'حل تفاوضي يضمن إيرادات مستدامة لصيانة الطرق ويحفظ كرامة وحقوق السائقين.',
        costUSD: 0,
        costSYP: 120_000_000_000,
        costPC: 8,
        effectTrust: 10,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 12,
        customEffectAr: 'اتفاقية نقل وطنية متوازنة تعيد فتح الشريان الاقتصادي باحترام متبادل (+10 ثقة)',
        governorateEffects: [
          { governorateId: 'homs', prri: -8, securityEfficacy: 6, customSummaryAr: 'استقرار حركة شاحنات M5 (-8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_27_rebar_scrap_smuggling',
    titleAr: 'أزمة صهر حديد التسليح وتهريب الخردة المعدنية للحدود',
    category: 'INDUSTRY',
    sourceAr: 'غرفة صناعة حمص / الشركة العامة للحديد والصلب (حديد حماة)',
    descriptionAr: 'أدى تهريب خردة الحديد والأنقاض عبر المعابر غير الشرعية إلى حرمان أفران الصهر في حسياء والشيخ نجار وحماة من المواد الأولية، مهدداً بتوقف مصانع قضبان حديد التسليح عن العمل.',
    targetGovernorateId: 'homs',
    triggerCondition: (state) => state.macro.systemicCorruption > 35,
    options: [
      {
        id: 'opt_scrap_export_ban',
        labelAr: 'حظر وطني صارم لنقل الخردة وتوجيهها حصراً للمصانع الوطنية',
        descriptionAr: 'مصادرة أي شاحنة خردة تتجه للحدود وإلزام جامعي المعادن ببيعها للمسابك السورية بالسعر الرسمي.',
        costUSD: 0,
        costSYP: 150_000_000_000,
        costPC: 10,
        effectTrust: 8,
        effectRRI: -4,
        effectCorruption: -10,
        effectCompetence: 10,
        customEffectAr: 'إنعاش صناعة حديد التسليح وخفض تكاليف الإعمار مع تذمر شبكات تجارة الخردة',
        governorateEffects: [
          { governorateId: 'homs', reconstructionScore: 8, prri: -6, customSummaryAr: 'دوران أفران حسياء للصلب (+8 إعمار)' },
          { governorateId: 'hama', reconstructionScore: 8, customSummaryAr: 'تزويد مصانع حديد حماة بالمواد الخام' }
        ]
      },
      {
        id: 'opt_scrap_export_tariff',
        labelAr: 'السماح بتصدير الخردة مقابل رسم تصدير جمركي باهظ بالدولار',
        descriptionAr: 'تحصيل عوائد مالية أجنبية للخزينة على حساب بقاء أسعار حديد التسليح مرتفعة محلياً.',
        costUSD: -22_000_000,
        costSYP: 0,
        costPC: 4,
        effectTrust: 4,
        effectRRI: 4,
        effectCorruption: 4,
        effectCompetence: 8,
        customEffectAr: 'تحصيل $22M للخزينة العامة مع ارتفاع طفيف في تكاليف مقاولي البناء',
        governorateEffects: [
          { governorateId: 'tartus', reconstructionScore: 4, customSummaryAr: 'عوائد تصدير خردة الموانئ' }
        ]
      },
      {
        id: 'opt_rubble_recycling_joint_venture',
        labelAr: 'إطلاق شركة وطنية لتدوير ركام الأبنية المدمرة وفصل المعادن',
        descriptionAr: 'استثمار حديث يعالج ركام الحرب في حلب وحمص وينتج رمل وبحص وحديد معاد تدويره.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $18M',
        costUSD: 18_000_000,
        costSYP: 200_000_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -6,
        effectCompetence: 14,
        customEffectAr: 'تنظيف ركام المدن بطريقة حضارية وخلق آلاف الوظائف للشباب المسرحين (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 10, prri: -10, customSummaryAr: 'تدوير ركام أحياء حلب (+10 إعمار)' },
          { governorateId: 'homs', reconstructionScore: 10, prri: -10, customSummaryAr: 'تنظيف أحياء حمص القديمة وبابا عمرو' }
        ]
      }
    ]
  },
  {
    id: 'event_28_counterfeit_pharma',
    titleAr: 'فضيحة الغش الدوائي والمضادات الحيوية المغشوشة بريف دمشق',
    category: 'HEALTH',
    sourceAr: 'وزارة الصحة / نقابة صيادلة سورية',
    descriptionAr: 'كشفت مداهمة لورشات سرية في ريف دمشق عن تصنيع وتوزيع مئات آلاف العبوات من المضادات الحيوية وأدوية الضغط المغشوشة الخالية من المادة الفعالة، مما تسبب بوفيات بالمشافي وفزع شعبي.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.macro.systemicCorruption > 30,
    options: [
      {
        id: 'opt_pharma_harsh_crackdown',
        labelAr: 'إغلاق المعامل وسحب تراخيص المتورطين ومحاكمتهم جنائياً',
        descriptionAr: 'تطهير قطاع الدواء ومصادرة كافة المستودعات المشبوهة وحرق الدواء المغشوش علناً.',
        costUSD: 0,
        costSYP: 40_000_000_000,
        costPC: 14,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -14,
        effectCompetence: 10,
        customEffectAr: 'استعادة الثقة بالدواء السوري الوطني وإنزال أشد العقوبات بالجناة (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: 10, prri: -6, customSummaryAr: 'تطهير ورشات ريف دمشق (+10 أمن)' },
          { governorateId: 'damascus', activeHospitalsPct: 6, prri: -8, customSummaryAr: 'حماية مشافي العاصمة من الدواء المغشوش' }
        ]
      },
      {
        id: 'opt_pharma_digital_lab',
        labelAr: 'تأسيس مخبر رقابة دوائية مركزي واستيراد تقنيات تتبع الباركود الذكي',
        descriptionAr: 'منع تزوير الدواء عبر إلزام كل معمل بباركود إلكتروني مشفر مرتبط بوزارة الصحة مباشرة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $14M',
        costUSD: 14_000_000,
        costSYP: 110_000_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -6,
        effectCorruption: -10,
        effectCompetence: 16,
        customEffectAr: 'تحديث تقني شامل يضمن سلامة 100% من الأدوية المطروحة في الصيدليات الوطنية',
        governorateEffects: [
          { governorateId: 'damascus', activeHospitalsPct: 10, customSummaryAr: 'تحديث مختبرات الرقابة الدوائية (+10 صحة)' },
          { governorateId: 'aleppo', activeHospitalsPct: 8, customSummaryAr: 'ربط معامل أدوية حلب بالباركود الذكي' }
        ]
      },
      {
        id: 'opt_pharma_emergency_imports',
        labelAr: 'فتح استيراد إسعافي لأدوية موثوقة من الهند والأردن لتعويض النقص',
        descriptionAr: 'تأمين الصيدليات والمشافي بأدوية أصلية مستوردة ريثما تكتمل التحقيقات والمصادرات.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $30M',
        costUSD: 30_000_000,
        costSYP: 0,
        costPC: 4,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 8,
        customEffectAr: 'وفرة دوائية فورية بالمشافي مع استنزاف $30M وضغط منافسة على الصناعة الدوائية المحلية',
        governorateEffects: [
          { governorateId: 'damascus', activeHospitalsPct: 12, prri: -8, customSummaryAr: 'تأمين أدوية مشافي المواساة والأسد الجامعي' },
          { governorateId: 'homs', activeHospitalsPct: 8, customSummaryAr: 'سد النقص الدوائي بمشافي حمص' }
        ]
      }
    ]
  },
  {
    id: 'event_29_dumped_textiles_aleppo',
    titleAr: 'إغراق الأقمشة التركية المهربة وإغلاق ورشات نسيج حلب',
    category: 'INDUSTRY',
    sourceAr: 'غرفة صناعة حلب / اتحاد نقابات العمال',
    descriptionAr: 'تدفقت شحنات ضخمة من الأقمشة والألبسة الجاهزة التركية المهربة عبر الشمال دون دفع رسوم، مما تسبب بكساد بضائع معامل الشيخ نجار وإغلاق 400 ورشة نسيج وتسريح آلاف العمال بحلب.',
    targetGovernorateId: 'aleppo',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_confiscate_contraband_clothes',
        labelAr: 'حملة جمارك موسعة لمصادرة كافة المنسوجات المهربة بالأسواق',
        descriptionAr: 'حماية مصانع حلب وفرض غرامات قاصمة على المتاجر التي تبيع البضائع المهربة.',
        costUSD: 0,
        costSYP: -280_000_000_000,
        costPC: 12,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -8,
        effectCompetence: 10,
        customEffectAr: 'حماية آلاف الوظائف النسيجية بحلب ومصادرات بـ 280 مليار ل.س مع تذمر تجار التجزئة',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 10, prri: -12, skilledLaborCount: 400, customSummaryAr: 'حماية أنوال ومعامل نسيج حلب (+10 إعمار)' },
          { governorateId: 'damascus', prri: 6, customSummaryAr: 'غلاء الملابس الجاهزة بأسواق العاصمة' }
        ]
      },
      {
        id: 'opt_subsidize_aleppo_yarn_energy',
        labelAr: 'دعم تكاليف الطاقة وخيوط الغزول لمعامل حلب لخفض كلفة إنتاجها',
        descriptionAr: 'تمكين الصناعيين الحلبيين من منافسة البضائع المستوردة بالجودة والسعر معاً.',
        costUSD: 0,
        costSYP: 450_000_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'طفرة في تنافسية المنتجات النسيجية السورية محلياً وإقليمياً وتوسيع التصدير',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 12, prri: -14, dailyBlackoutHours: -2, customSummaryAr: 'دعم كهرباء وغزول الشيخ نجار (-14 احتقان)' }
        ]
      },
      {
        id: 'opt_tariff_regularization',
        labelAr: 'فرض رسم تسوية جمركية مقطوعة على البضائع المهربة بدلاً من حرقها',
        descriptionAr: 'قوننة الواقع التجاري وتحصيل إيرادات للخزينة دون إثارة غضب المستهلكين محدودي الدخل.',
        costUSD: 0,
        costSYP: -550_000_000_000,
        costPC: -4,
        effectTrust: -6,
        effectRRI: 4,
        effectCorruption: 8,
        effectCompetence: -4,
        customEffectAr: 'جباية 550 مليار ل.س للخزينة مع استياء صناعيي حلب من استمرار المنافسة الخارجية',
        governorateEffects: [
          { governorateId: 'aleppo', prri: 12, customSummaryAr: 'احتجاج صناعيي حلب على منافسة المهربات (+12 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_30_tourist_bakery_flour',
    titleAr: 'تمرد أصحاب الأفران السياحية والتلاعب بمخصصات الدقيق المدعوم',
    category: 'FOOD',
    sourceAr: 'المؤسسة السورية للمخابز / مديرية حماية المستهلك',
    descriptionAr: 'كشفت دوريات التموين عن تهريب مئات أطنان الدقيق التمويني المدعوم المخصص لرغيف الخبز الشعبي إلى أفران السياحي ومصانع الحلويات لصناعة المعجنات الفاخرة بدمشق وريفها.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => state.macro.systemicCorruption > 25,
    options: [
      {
        id: 'opt_seize_rogue_bakeries',
        labelAr: 'مصادرة 40 فرناً سياحياً مخالفاً وإدارتها كأفران عامة للدولة',
        descriptionAr: 'تأديب المتاجرين برغيف الفقراء وتحويل المخابز المصادرة لإنتاج الخبز المدعوم للمواطنين.',
        costUSD: 0,
        costSYP: 80_000_000_000,
        costPC: 14,
        effectTrust: 16,
        effectRRI: -14,
        effectCorruption: -12,
        effectCompetence: 8,
        customEffectAr: 'وفرة كبرى في الخبز التمويني واحتفاء شعبي حاشد بضرب مافيا الدقيق (+16 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -15, customSummaryAr: 'إنهاء طوابير الخبز بأحياء دمشق (-15 احتقان)' },
          { governorateId: 'rif_dimashq', prri: -10, customSummaryAr: 'توفير الخبز ببلدات ريف دمشق' }
        ]
      },
      {
        id: 'opt_digital_scale_tracking',
        labelAr: 'تركيب منظومات مراقبة رقمية وميازين إلكترونية مشفرة في المطاحن',
        descriptionAr: 'إلغاء التدخل البشري وتتبع حركة كل كيس طحين عبر الرقمنة ونظام تحديد المواقع GPS.',
        costUSD: 8_000_000,
        costSYP: 60_000_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -8,
        effectCorruption: -14,
        effectCompetence: 16,
        customEffectAr: 'وقف تسريب 85% من الطحين تقنياً واستقرار توزيع المخصصات بعدالة (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -10, customSummaryAr: 'رقمنة مطاحن دمشق وريفها' },
          { governorateId: 'homs', prri: -6, customSummaryAr: 'انضباط مطاحن حمص وحماة' }
        ]
      },
      {
        id: 'opt_unify_flour_cash_support',
        labelAr: 'تحرير سعر الدقيق لكافة الأفران وتحويل الدعم لمنحة نقدية للمواطن',
        descriptionAr: 'إنهاء الفارق السعري الذي يغذي الفساد مع صرف بدل نقدي مباشر لكل عائلة عبر البطاقة الذكية.',
        costUSD: 0,
        costSYP: 850_000_000_000,
        costPC: 10,
        effectTrust: 6,
        effectRRI: 10,
        effectCorruption: -18,
        effectCompetence: 14,
        customEffectAr: 'القضاء الجذري على سوق تهريب الطحين مع صدمة سعرية أولية في ربطة الخبز',
        governorateEffects: [
          { governorateId: 'damascus', prri: 8, customSummaryAr: 'ارتفاع أسعار المعجنات بالعاصمة (+8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_31_tartus_port_logjam',
    titleAr: 'اختناق حركة الملاحة وتكدس البواخر في محطة حاويات مرفأ طرطوس',
    category: 'LOGISTICS',
    sourceAr: 'الشركة العامة لمرفأ طرطوس / غرفة الملاحة البحرية',
    descriptionAr: 'تسبب تعطل رافعات الحاويات الجسرية في رصيف المرفأ في تكدس 28 باخرة بضائع بمياه الانتظار، وتراكم غرامات تأخير بملايين الدولارات هددت بهروب خطوط الشحن العالمية نحو موانئ مجاورة.',
    targetGovernorateId: 'tartus',
    triggerCondition: (state) => state.turnNumber >= 3,
    options: [
      {
        id: 'opt_port_cranes_purchase',
        labelAr: 'شراء رافعات وقطع غيار هيدروليكية أوروبية إسعافية بتمويل فوري',
        descriptionAr: 'تفريغ الحاويات المتكدسة ومضاعفة سرعة المناولة لإنقاذ عقود خطوط الشحن العالمية.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $26M',
        costUSD: 26_000_000,
        costSYP: 80_000_000_000,
        costPC: 4,
        effectTrust: 12,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 16,
        customEffectAr: 'تحديث أرصفة المرفأ بالكامل ورفع إيرادات رسوم الترانزيت بنسبة 35% (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'tartus', reconstructionScore: 12, prri: -10, customSummaryAr: 'تحديث رافعات مرفأ طرطوس (+12 إعمار)' },
          { governorateId: 'latakia', reconstructionScore: 6, customSummaryAr: 'تخفيف الضغط اللوجستي عن موانئ الساحل' }
        ]
      },
      {
        id: 'opt_divert_ships_latakia',
        labelAr: 'تحويل مسار البواخر إلى مرفأ اللاذقية وتكثيف نوبات العمل',
        descriptionAr: 'استيعاب الحاويات بمرفأ اللاذقية دون إنفاق العملة الصعبة مع تحمل بطء النقل البري.',
        costUSD: 0,
        costSYP: 160_000_000_000,
        costPC: 6,
        effectTrust: 4,
        effectRRI: -2,
        effectCorruption: 2,
        effectCompetence: 8,
        customEffectAr: 'حل إسعافي مقبول مع ازدحام رصيف اللاذقية وتأخر وصول المواد الأولية للمصانع',
        governorateEffects: [
          { governorateId: 'latakia', prri: 6, reconstructionScore: 4, customSummaryAr: 'ازدحام رصيف حاويات اللاذقية' },
          { governorateId: 'tartus', prri: -4, customSummaryAr: 'تخفيف تكدس السفن بطرطوس' }
        ]
      },
      {
        id: 'opt_terminal_concession_lease',
        labelAr: 'منح عقد تشغيل الرصيف لشركة مشغلة خاصة مقابل تطويره مجاناً',
        descriptionAr: 'خصخصة تشغيل محطة الحاويات لمدة 10 سنوات مقابل استثمار أجنبي فوري بقيمة $60M.',
        costUSD: -30_000_000,
        costSYP: 0,
        costPC: 16,
        effectTrust: -8,
        effectRRI: 6,
        effectCorruption: 6,
        effectCompetence: 12,
        customEffectAr: 'دخول $30M سيولة للخزينة وتطوير فوري للمرفأ مع جدل سياسي حول التنازل عن إدارة الأصول',
        governorateEffects: [
          { governorateId: 'tartus', reconstructionScore: 14, prri: 8, customSummaryAr: 'تحديث الرصيف مع احتجاج نقابة العمال (+14 إعمار)' }
        ]
      }
    ]
  }
];
