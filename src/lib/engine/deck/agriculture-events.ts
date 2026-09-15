import type { EventCard } from '../types';

export const AGRICULTURE_EVENTS: EventCard[] = [
  {
    id: 'event_17_hasakah_sunn_pest',
    titleAr: 'تفشي حشرة السونة وصدأ القمح في حقول الجزيرة السورية',
    category: 'AGRICULTURE',
    sourceAr: 'مديرية زراعة الحسكة / اتحاد الفلاحين',
    descriptionAr: 'اجتاحت موجة رطوبة دافئة حقول القمح المروي في الحسكة والقامشلي والرقة، وتفشت حشرة السونة والصدأ الأصفر، مهددة بدمار 40% من المحصول الاستراتيجي لمستودع قمح سوريا.',
    targetGovernorateId: 'hasakeh',
    triggerCondition: (state) => state.turnNumber >= 3,
    options: [
      {
        id: 'opt_aerial_spraying',
        labelAr: 'إطلاق حملة رش جوي إسعافية بالمبيدات النوعية المستوردة',
        descriptionAr: 'استيراد طارئ لمبيدات الفطريات والحشرات وتسيير طائرات الرش الزراعي لإنقاذ السنابل قبل فوات الأوان.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $24M',
        costUSD: 24_000_000,
        costSYP: 150_000_000_000,
        costPC: 4,
        effectTrust: 12,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 14,
        customEffectAr: 'إنقاذ 90% من محصول القمح وحماية الأمن الغذائي الوطني من شبح المجاعة (+12 ثقة)',
        governorateEffects: [
          { governorateId: 'hasakeh', prri: -15, reconstructionScore: 8, customSummaryAr: 'إنقاذ مزارع قمح الحسكة (-15 احتقان، +8 إنتاج)' },
          { governorateId: 'raqqa', prri: -10, customSummaryAr: 'حماية حقول ريف الرقة (-10 احتقان)' }
        ]
      },
      {
        id: 'opt_local_ground_spraying',
        labelAr: 'توزيع مبيدات محلية ومعدات رش أرضية عبر الوحدات الإرشادية',
        descriptionAr: 'الاعتماد على إمكانيات وزارة الزراعة المتاحة دون إنفاق العملة الصعبة، مع مكافحة بطيئة.',
        costUSD: 0,
        costSYP: 280_000_000_000,
        costPC: 6,
        effectTrust: 4,
        effectRRI: -4,
        effectCorruption: 4,
        effectCompetence: 6,
        customEffectAr: 'إنقاذ جزئي للمحصول مع خسارة 18% من الإنتاج وارتفاع طفيف في أسعار الدقيق',
        governorateEffects: [
          { governorateId: 'hasakeh', prri: -6, customSummaryAr: 'مكافحة أرضية جزئية بالحسكة (-6 احتقان)' }
        ]
      },
      {
        id: 'opt_farmer_self_reliance',
        labelAr: 'ترك المزارعين لمواجهة الآفة بإمكانياتهم الخاصة',
        descriptionAr: 'رفض التدخل المالي المباشر وتحميل تكاليف المبيدات للفلاحين وأصحاب الحيازات الكبرى.',
        costUSD: 0,
        costSYP: 0,
        costPC: 8,
        effectTrust: -16,
        effectRRI: 18,
        effectCorruption: 0,
        effectCompetence: -12,
        customEffectAr: 'تدمير المحصول واستنزاف أضعاف المبلغ بالعملة الصعبة لاستيراد القمح في الدور القادم (+18 احتقان)',
        governorateEffects: [
          { governorateId: 'hasakeh', prri: 22, customSummaryAr: 'غضب عارم لفلاحي الجزيرة المنكوبين (+22 احتقان)' },
          { governorateId: 'raqqa', prri: 16, customSummaryAr: 'تلف مساحات واسعة بمزارع الرقة (+16 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_18_citrus_glut_coast',
    titleAr: 'كساد قياسي لمحصول الحمضيات وتظاهرات مزارعي الساحل',
    category: 'AGRICULTURE',
    sourceAr: 'اتحاد غرف الزراعة / مديرية زراعة اللاذقية',
    descriptionAr: 'فاض إنتاج البرتقال والليمون في الساحل متجاوزاً 1.2 مليون طن، لكن اختناق التصدير وغلاء أجور النقل أدى لانهيار الأسعار ورمي الفلاحين لمحاصيلهم في شوارع اللاذقية وطرطوس احتجاجاً.',
    targetGovernorateId: 'latakia',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_citrus_state_purchase',
        labelAr: 'شراء المحصول عبر السورية للتجارة وتوزيعه بالمدن بأسعار رمزية',
        descriptionAr: 'شراء 350 ألف طن من الفلاحين بأسعار مجزية وشحنها لصالات دمشق وحلب وحمص لدعم المواطنين.',
        costUSD: 0,
        costSYP: 420_000_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -14,
        effectCorruption: -4,
        effectCompetence: 8,
        customEffectAr: 'إنقاذ آلاف الأسر في الساحل وتأمين فواكه رخيصة للمدن (-14 احتقان)',
        governorateEffects: [
          { governorateId: 'latakia', prri: -18, customSummaryAr: 'إنهاء اعتصامات مزارعي الساحل (-18 احتقان)' },
          { governorateId: 'tartus', prri: -14, customSummaryAr: 'شراء محصول سهل عكار (-14 احتقان)' },
          { governorateId: 'damascus', prri: -6, customSummaryAr: 'وفرة الحمضيات الرخيصة بالعاصمة' }
        ]
      },
      {
        id: 'opt_citrus_concentrate_factory',
        labelAr: 'تأسيس معمل عصائر مكثفة حكومي دائم في جبلة لامتصاص الفائض',
        descriptionAr: 'استثمار بنيوي استراتيجي يحول الفائض السنوي لمنتج صناعي تصديري يدعم الخزينة لعقود.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $20M',
        costUSD: 20_000_000,
        costSYP: 180_000_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -4,
        effectCompetence: 16,
        customEffectAr: 'حل جذري دائم لمعضلة الحمضيات وخلق مئات فرص العمل الصناعية بالساحل (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'latakia', reconstructionScore: 10, prri: -16, customSummaryAr: 'بناء معمل العصائر باللاذقية (+10 إعمار، -16 احتقان)' },
          { governorateId: 'tartus', reconstructionScore: 6, prri: -10, customSummaryAr: 'ربط مزارع طرطوس بالمعمل الصناعي' }
        ]
      },
      {
        id: 'opt_citrus_export_subsidy',
        labelAr: 'دعم أجور شاحنات التبريد العابرة للمنافذ الحدودية نحو العراق والخليج',
        descriptionAr: 'صرف دعم تصديري مباشر على كل طن حمضيات يخرج عبر المعابر لتشجيع التجار على الشراء.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $10M',
        costUSD: 10_000_000,
        costSYP: 80_000_000_000,
        costPC: 4,
        effectTrust: 6,
        effectRRI: -6,
        effectCorruption: 2,
        effectCompetence: 10,
        customEffectAr: 'تفريغ أسواق الساحل بتصدير 250 ألف طن للخارج مع إدخال عملة صعبة للتجار',
        governorateEffects: [
          { governorateId: 'latakia', prri: -10, customSummaryAr: 'انتعاش حركة برادات التصدير باللاذقية (-10 احتقان)' },
          { governorateId: 'tartus', prri: -8, customSummaryAr: 'شحن الفواكه عبر مرفأ طرطوس (-8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_19_ain_fijah_aquifer',
    titleAr: 'جفاف منسوب نبع الفيجة وأزمة مياه الشرب الخانقة في دمشق',
    category: 'INFRASTRUCTURE',
    sourceAr: 'مؤسسة مياه دمشق وريفها / وزارة الموارد المائية',
    descriptionAr: 'انحسر تدفق نبع الفيجة التاريخي المغذي لملايين السكان في العاصمة دمشق وضواحيها بسبب الجفاف والاستنزاف الجائر لآبار وادي بردى، وباتت مياه الشرب تصل المنازل ساعتين كل 4 أيام.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => state.turnNumber >= 4,
    options: [
      {
        id: 'opt_deep_aquifer_wells',
        labelAr: 'تشغيل 100 بئر عميقة في حوض دمشق وربطها بالشبكة فوراً',
        descriptionAr: 'توفير مولدات ديزل ومضخات غاطسة لضخ المياه الجوفية الاحتياطية وإرواء أحياء العاصمة.',
        costUSD: 0,
        costSYP: 380_000_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -12,
        effectCorruption: -2,
        effectCompetence: 10,
        customEffectAr: 'عودة ضخ المياه يومياً لـ 6 ساعات وإنهاء عطش العاصمة مع إجهاد المخزون الجوفي',
        governorateEffects: [
          { governorateId: 'damascus', prri: -16, customSummaryAr: 'إرواء أحياء العاصمة دمشق (-16 احتقان)' },
          { governorateId: 'rif_dimashq', prri: -10, customSummaryAr: 'ربط آبار الضواحي بالشبكة (-10 احتقان)' }
        ]
      },
      {
        id: 'opt_water_rationing_strict',
        labelAr: 'مصادرة مياه المسابح والمزارع الترفيهية في الغوطة وتحويلها للشرب',
        descriptionAr: 'استخدام الضابطة المائية لقطع المياه عن فيلات المتنفذين والمسابح الخاصة وتوجيهها للمواطنين.',
        costUSD: 0,
        costSYP: 50_000_000_000,
        costPC: 14,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -8,
        effectCompetence: 8,
        customEffectAr: 'عدالة اجتماعية حاسمة وارتياح شعبي عارم لمواجهة المتنفذين وأصحاب الامتيازات (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -12, securityEfficacy: 6, customSummaryAr: 'ارتياح شعبي واسع بدمشق (-12 احتقان)' },
          { governorateId: 'rif_dimashq', prri: -8, customSummaryAr: 'ضبط مخالفات الآبار في مزارع الغوطة' }
        ]
      },
      {
        id: 'opt_mobile_filtration_plants',
        labelAr: 'شراء محطات تنقية وتحلية مياه متنقلة بالعملة الأجنبية',
        descriptionAr: 'استيراد وحدات ترشيح حديثة لمعالجة المياه الكبريتية والسطحية وضمان مياه شرب نقية للمشافي.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $22M',
        costUSD: 22_000_000,
        costSYP: 90_000_000_000,
        costPC: 4,
        effectTrust: 12,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'تأمين بنية مياه شرب حديثة تضمن الاستدامة وتتفادى الأمراض الوبائية المنقولة بالماء',
        governorateEffects: [
          { governorateId: 'damascus', activeHospitalsPct: 8, prri: -10, customSummaryAr: 'تأمين مياه المشافي والمدارس بدمشق (+8 صحة)' }
        ]
      }
    ]
  },
  {
    id: 'event_20_hauran_grain_boycott',
    titleAr: 'إضراب فلاحي حوران ورفض تسليم محصول القمح للمراكز الحكومية',
    category: 'SOUTHERN',
    sourceAr: 'محافظة درعا / فرع المؤسسة السورية للحبوب',
    descriptionAr: 'امتنع مزارعو سهل حوران في درعا عن توريد أقماحهم لصوامع إزرع والصنمين، احتجاجاً على تدني السعر الحكومي مقارنة بأسعار تجار القطاع الخاص ومهربي الحدود، مهددين بكساد الصوامع الجنوبية.',
    targetGovernorateId: 'daraa',
    triggerCondition: (state) => (state.governorates['daraa']?.daraaDefianceIndex ?? 40) > 25 || state.macro.civicTrust < 65,
    options: [
      {
        id: 'opt_hauran_price_match',
        labelAr: 'رفع سعر الشراء الحكومي لمضاهاة السوق الحر وصرف الثمن نقداً',
        descriptionAr: 'الاستجابة لمطالب الفلاحين وتسليمهم شيكات فورية قابلة للصرف لضمان استلام كامل قمح الجنوب.',
        costUSD: 0,
        costSYP: 850_000_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -14,
        effectCorruption: -4,
        effectCompetence: 10,
        customEffectAr: 'توريد 95% من قمح حوران وتهدئة التوتر العشائري بالجنوب بالكامل (-14 احتقان)',
        governorateEffects: [
          { governorateId: 'daraa', prri: -20, daraaDefianceIndex: -20, customSummaryAr: 'رضا فلاحي حوران وتوريد القمح (-20 احتقان، -20 تمرد)' }
        ]
      },
      {
        id: 'opt_hauran_security_cordon',
        labelAr: 'إغلاق الطرق ومصادرة شاحنات الحبوب غير المسلمة بالقوة',
        descriptionAr: 'منع خروج أي حبة قمح خارج حدود محافظة درعا دون إشعار تسليم رسمي وإحالة المهربين للأمن.',
        costUSD: 0,
        costSYP: 0,
        costPC: 16,
        effectTrust: -16,
        effectRRI: 20,
        effectCorruption: 10,
        effectCompetence: -6,
        customEffectAr: 'استلام قسري لـ 60% من المحصول مع تجدد التوتر الأمني والاشتباكات بالجنوب (+20 احتقان)',
        governorateEffects: [
          { governorateId: 'daraa', prri: 25, daraaDefianceIndex: 25, securityEfficacy: -8, customSummaryAr: 'غضب وتصاعد تمرد حوران (+25 تمرد درعا)' }
        ]
      },
      {
        id: 'opt_hauran_input_barter',
        labelAr: 'تقديم سماد ومازوت ري مدعوم مجاناً مقابل كل طن قمح يسلمونه',
        descriptionAr: 'حل مقايضة ذكي يقدم مدخلات الإنتاج الشحيحة للفلاح بدلاً من التنافس على سعر النقد الورقي.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $14M',
        costUSD: 14_000_000,
        costSYP: 180_000_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'بناء شراكة اقتصادية مستدامة مع فلاحي درعا وكسب ولائهم للإنتاج الوطني',
        governorateEffects: [
          { governorateId: 'daraa', prri: -12, daraaDefianceIndex: -12, reconstructionScore: 6, customSummaryAr: 'تأمين بذار وسماد لمزارع درعا (-12 تمرد)' }
        ]
      }
    ]
  },
  {
    id: 'event_21_badia_foot_mouth',
    titleAr: 'تفشي وباء الحمى القلاعية في قطعان أغنام العواس بالبادية',
    category: 'AGRICULTURE',
    sourceAr: 'مديرية الصحة الحيوانية / نقابة الأطباء البيطريين',
    descriptionAr: 'اجتاح وباء الحمى القلاعية مراعي بادية حمص ودير الزور وتدمر، مع نفوق أكثر من 120 ألف رأس من خراف العواس السورية الأصيلة وتصاعد أسعار اللحوم ومشتقات الحليب بنسبة 65%.',
    targetGovernorateId: 'homs',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_vet_emergency_vaccine',
        labelAr: 'استيراد دفعة لقاحات بيطرية مركزية إسعافية من منظمة الفاو',
        descriptionAr: 'تأمين اللقاحات المعتمدة وتحصين قطعان الماشية في البادية ووقف هلاك الثروة الحيوانية.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $15M',
        costUSD: 15_000_000,
        costSYP: 90_000_000_000,
        costPC: 4,
        effectTrust: 10,
        effectRRI: -8,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'إنقاذ قطعان البادية واستقرار أسعار اللحوم والألبان في الأسواق الوطنية (+10 ثقة)',
        governorateEffects: [
          { governorateId: 'homs', prri: -12, reconstructionScore: 6, customSummaryAr: 'تحصين قطعان بادية حمص (-12 احتقان)' },
          { governorateId: 'deir_ez_zor', prri: -10, tribalRageIndex: -10, customSummaryAr: 'إنقاذ ماشية عشائر الفرات (-10 غضب عشائري)' }
        ]
      },
      {
        id: 'opt_quarantine_badia',
        labelAr: 'عزل مناطق البادية وتطويقها بحجر صحي بيطري دون استيراد لقاحات',
        descriptionAr: 'منع حركة قطعان الماشية واقتصار العلاج على الأعشاب والمطهرات المحلية المتوفرة.',
        costUSD: 0,
        costSYP: 120_000_000_000,
        costPC: 6,
        effectTrust: -8,
        effectRRI: 10,
        effectCorruption: 4,
        effectCompetence: -2,
        customEffectAr: 'توفير العملة الصعبة مع نفوق آلاف الرؤوس وتراجع إنتاج الصوف والحليب واللحم',
        governorateEffects: [
          { governorateId: 'homs', prri: 12, customSummaryAr: 'خسائر فادحة لمربي الماشية بحمص (+12 احتقان)' },
          { governorateId: 'deir_ez_zor', tribalRageIndex: 12, customSummaryAr: 'تذمر الرعاة بالشرقية (+12 غضب عشائري)' }
        ]
      },
      {
        id: 'opt_frozen_meat_imports',
        labelAr: 'فتح باب استيراد لحوم مثلجة معفاة من الرسوم لخفض أسعار المدن',
        descriptionAr: 'كسر غلاء اللحوم في دمشق وحلب عبر استيراد كميات ضخمة من اللحوم الرخيصة من الهند والبرازيل.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $25M',
        costUSD: 25_000_000,
        costSYP: 0,
        costPC: 4,
        effectTrust: 4,
        effectRRI: -4,
        effectCorruption: 0,
        effectCompetence: 6,
        customEffectAr: 'تخفيض أسعار اللحوم بسكان المدن على حساب ضرب مزارعي ومربي الريف والبادية السورية',
        governorateEffects: [
          { governorateId: 'damascus', prri: -8, customSummaryAr: 'وفرة اللحوم الرخيصة بالعاصمة' },
          { governorateId: 'homs', prri: 10, customSummaryAr: 'تضرر قطاع تربية المواشي بحمص' }
        ]
      }
    ]
  },
  {
    id: 'event_22_orontes_industrial_pollution',
    titleAr: 'تلوث مياه نهر العاصي وتسمم حقول سهل الغاب بحماة',
    category: 'ENVIRONMENT',
    sourceAr: 'مديرية بيئة حماة / الهيئة العامة لإدارة وتنمية الغاب',
    descriptionAr: 'قامت مصانع أسمدة ومدابغ صناعية في حمص ومحردة بتصريف نفايات ومخلفات كيميائية غير معالجة في مجرى نهر العاصي، مما تسبب بنفوق ملايين الأسماك وتسمم قنوات ري آلاف الهكتارات بسهل الغاب.',
    targetGovernorateId: 'hama',
    triggerCondition: (state) => state.macro.systemicCorruption > 25,
    options: [
      {
        id: 'opt_shutdown_polluting_factories',
        labelAr: 'إغلاق المنشآت الملوثة فوراً وتغريمها تكاليف التطهير الشامل',
        descriptionAr: 'إلزام أصحاب المصانع بتركيب فلاتر ومحطات معالجة خاصة على نفقتهم تحت طائلة المصادرة.',
        costUSD: 0,
        costSYP: 60_000_000_000,
        costPC: 12,
        effectTrust: 12,
        effectRRI: -10,
        effectCorruption: -14,
        effectCompetence: 10,
        customEffectAr: 'إنقاذ بيئة سهل الغاب وحماية محاصيل الخضار والقمح مع غضب أصحاب المصانع (+12 ثقة)',
        governorateEffects: [
          { governorateId: 'hama', prri: -16, reconstructionScore: 6, customSummaryAr: 'إنقاذ مزارع سهل الغاب بحماة (-16 احتقان)' },
          { governorateId: 'homs', reconstructionScore: -4, customSummaryAr: 'توقف مؤقت للمصانع المخالفة بحمص' }
        ]
      },
      {
        id: 'opt_central_effluent_plant',
        labelAr: 'تمويل إنشاء محطة معالجة مياه صناعية مركزية على مجرى العاصي',
        descriptionAr: 'حل تقني مستدام يعالج منصرفات المصانع قبل وصولها للنهر دون الإضرار بالنشاط الصناعي.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $25M',
        costUSD: 25_000_000,
        costSYP: 200_000_000_000,
        costPC: 4,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 16,
        customEffectAr: 'تحديث البنية البيئية والصناعية لحوض العاصي وفق أعلى المعايير الدولية (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'hama', reconstructionScore: 10, prri: -12, customSummaryAr: 'محطة معالجة كبرى على العاصي (+10 إعمار)' },
          { governorateId: 'homs', reconstructionScore: 8, customSummaryAr: 'حماية وتطوير منشآت حمص الصناعية' }
        ]
      },
      {
        id: 'opt_pollution_blind_eye',
        labelAr: 'فرض غرامات رمزية والامتناع عن إغلاق المصانع لحماية الإنتاج',
        descriptionAr: 'تفادي تسريح عمال المصانع مع استمرار تلوث مياه الري وضرب مواسم الخضار بسهل الغاب.',
        costUSD: 0,
        costSYP: -80_000_000_000,
        costPC: 8,
        effectTrust: -14,
        effectRRI: 16,
        effectCorruption: 10,
        effectCompetence: -8,
        customEffectAr: 'جباية 80 مليار ل.س غرامات مع تدمير سمعة المنتجات الزراعية وتفشي الأمراض (+16 احتقان)',
        governorateEffects: [
          { governorateId: 'hama', prri: 20, activeHospitalsPct: -6, customSummaryAr: 'تلوث مياه الغاب وتسمم المحاصيل (+20 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_23_pistachio_smuggling',
    titleAr: 'تهريب محصول الفستق الحلبي عالي القيمة إلى دول الجوار',
    category: 'AGRICULTURE',
    sourceAr: 'مكتب الفستق الحلبي / مديرية الجمارك العامة',
    descriptionAr: 'مع جني موسم الفستق الحلبي التصديري الشهير في مورك والتمانعة وحلب، نشطت شبكات تهريب منظمة لشراء المحصول نقداً بالدولار ونقله عبر الحدود، حارمة الخزينة من ملايين الدولارات.',
    targetGovernorateId: 'aleppo',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_pistachio_official_exchange',
        labelAr: 'إلزام المصدرين بتسليم 50% من حصيلة التصدير للمصرف المركزي',
        descriptionAr: 'قوننة تصدير المحصول رسمياً مع استقطاب القطع الأجنبي بسعر الصرف التفضيلي لخزائن الدولة.',
        costUSD: -30_000_000,
        costSYP: 120_000_000_000,
        costPC: 8,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: -6,
        effectCompetence: 12,
        customEffectAr: 'دخول $30M صافية لاحتياطي الدولة مع تنظيم تجارة الفستق الحلبي التصديرية',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 6, prri: -6, customSummaryAr: 'انتعاش أسواق الفستق الرسمية بحلب (+6 إعمار)' },
          { governorateId: 'hama', prri: -6, customSummaryAr: 'دعم مزارعي الفستق في ريف حماة الشمالي' }
        ]
      },
      {
        id: 'opt_pistachio_rural_bourse',
        labelAr: 'تأسيس بورصة وطنية لتسويق الفستق بمورك وإلغاء الرسوم الجمركية',
        descriptionAr: 'تشجيع الفلاحين على البيع الداخلي عبر مزادات علنية موثقة دون تعقيدات بيروقراطية.',
        costUSD: 0,
        costSYP: 80_000_000_000,
        costPC: 4,
        effectTrust: 10,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'استقطاب تجار المنطقة وكسر شبكات التهريب بالحوافز الاقتصادية الذكية (+10 ثقة)',
        governorateEffects: [
          { governorateId: 'hama', reconstructionScore: 8, prri: -8, customSummaryAr: 'تنشيط سوق مورك الزراعي بحماة (-8 احتقان)' }
        ]
      },
      {
        id: 'opt_pistachio_armed_patrols',
        labelAr: 'نشر حواجز جمركية مشددة على الطرق الريفية ومصادرة الشاحنات',
        descriptionAr: 'مطاردة شاحنات الفستق غير المرخصة ومصادرة حمولاتها وبيعها بالمزاد الحكومي.',
        costUSD: 0,
        costSYP: -120_000_000_000,
        costPC: 10,
        effectTrust: -8,
        effectRRI: 12,
        effectCorruption: 8,
        effectCompetence: -2,
        customEffectAr: 'مصادرات بـ 120 مليار ل.س مع اشتباكات مع المهربين وتذمر الفلاحين (+12 احتقان)',
        governorateEffects: [
          { governorateId: 'aleppo', prri: 10, securityEfficacy: 4, customSummaryAr: 'توتر حواجز ريف حلب (+10 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_24_tartus_greenhouse_hail',
    titleAr: 'عاصفة بَرَد مدمرة تجتاح مزارع الدفيئات البلاستيكية بطرطوس',
    category: 'AGRICULTURE',
    sourceAr: 'صندوق التخفيف من آثار الجفاف / اتحاد فلاحي طرطوس',
    descriptionAr: 'تساقطت حبات بَرَد عملاقة مصحوبة برياح إعصارية على شريط الساحل الزراعي في بانياس وسهل عكار، مدمرة أكثر من 20 ألف بيت محمي لمحاصيل الخضار والفريز وتكبيد آلاف الفلاحين خسائر قاصمة.',
    targetGovernorateId: 'tartus',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_greenhouse_emergency_aid',
        labelAr: 'صرف تعويضات كوارث فورية وتوزيع رولات بلاستيك وبذار مدعومة',
        descriptionAr: 'تمكين الفلاحين من إعادة بناء بيوتهم المحمية واستئناف الإنتاج الزراعي خلال 3 أسابيع.',
        costUSD: 0,
        costSYP: 450_000_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -14,
        effectCorruption: -2,
        effectCompetence: 8,
        customEffectAr: 'إنقاذ مزارعي طرطوس واستقرار أسعار الخضار بالمدن وتخفيف الاحتقان (-14 احتقان)',
        governorateEffects: [
          { governorateId: 'tartus', prri: -18, reconstructionScore: 6, customSummaryAr: 'تعافي بيوت سهل عكار البلاستيكية (-18 احتقان)' },
          { governorateId: 'latakia', prri: -8, customSummaryAr: 'دعم مزارع الساحل المتضررة' }
        ]
      },
      {
        id: 'opt_greenhouse_loan_freeze',
        labelAr: 'تجميد أقساط ديون المصرف الزراعي لسنتين دون تعويض مالي',
        descriptionAr: 'تخفيف الضغط المالي عن الفلاحين دون تحميل الخزينة نفقات دعم نقدي فوري.',
        costUSD: 0,
        costSYP: 0,
        costPC: 4,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: 0,
        effectCompetence: 6,
        customEffectAr: 'حل مالي مساند مع بطء عودة الإنتاج وارتفاع أسعار البندورة والخيار في دمشق',
        governorateEffects: [
          { governorateId: 'tartus', prri: -6, customSummaryAr: 'تأجيل ديون مزارعي طرطوس (-6 احتقان)' }
        ]
      },
      {
        id: 'opt_greenhouse_leave_to_market',
        labelAr: 'ترك الفلاحين للتعامل مع الخسائر ومطالبتهم باللجوء للتأمين الخاص',
        descriptionAr: 'الامتناع عن تقديم دعم عام بدعوى شح موارد الخزينة المخصصة للمحروقات والطاقة.',
        costUSD: 0,
        costSYP: 0,
        costPC: 8,
        effectTrust: -14,
        effectRRI: 16,
        effectCorruption: 0,
        effectCompetence: -8,
        customEffectAr: 'إفلاس مئات الأسر الزراعية وهجرة شباب الساحل إلى المدن والمهجر (+16 احتقان)',
        governorateEffects: [
          { governorateId: 'tartus', prri: 20, reconstructionScore: -6, customSummaryAr: 'خراب البيوت المحمية بطرطوس (+20 احتقان)' }
        ]
      }
    ]
  }
];
