import type { EventCard } from '../types';

export const SOVEREIGNTY_EVENTS: EventCard[] = [
  {
    id: 'event_32_nassib_transit_closure',
    titleAr: 'أزمة تعليق عبور الشاحنات في معبر نصيب الحدودي مع الأردن',
    category: 'SOUTHERN',
    sourceAr: 'الجمارك العامة / وزارة الخارجية والمغتربين',
    descriptionAr: 'علقت السلطات الأردنية حركة الشاحنات السورية عبر معبر جابر-نصيب بحجة تدقيق أجهزة المسح ومكافحة الممنوعات، مما كدس مئات برادات الفواكه المصدرة للخليج وتلف بضائع بملايين الدولارات.',
    targetGovernorateId: 'daraa',
    triggerCondition: (state) => (state.governorates['daraa']?.nassibRevenueCapturePct ?? 50) < 80 || state.turnNumber >= 2,
    options: [
      {
        id: 'opt_nassib_security_protocol',
        labelAr: 'الموافقة على البروتوكول الأمني المشترك وتركيب ماسحات متطورة',
        descriptionAr: 'شراء أجهزة كشف بالأشعة واعتماد فحص مشترك مع الجانب الأردني لفتح المعبر فوراً.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $16M',
        costUSD: 16_000_000,
        costSYP: 60_000_000_000,
        costPC: 4,
        effectTrust: 12,
        effectRRI: -8,
        effectCorruption: -8,
        effectCompetence: 14,
        customEffectAr: 'استئناف تدفق قوافل الترانزيت إلى الخليج ورفع عوائد المعبر السيادية (+12 ثقة)',
        governorateEffects: [
          { governorateId: 'daraa', nassibRevenueCapturePct: 25, prri: -14, securityEfficacy: 10, customSummaryAr: 'إنعاش معبر نصيب بدرعا (+25% عوائد، -14 احتقان)' },
          { governorateId: 'damascus', prri: -6, customSummaryAr: 'تصدير منتجات العاصمة عبر الحدود' }
        ]
      },
      {
        id: 'opt_nassib_retaliation_closure',
        labelAr: 'المعاملة بالمثل وإغلاق الحدود أمام شاحنات الترانزيت القادمة',
        descriptionAr: 'تصعيد سياسي لرفض الشروط والضغط على عمان لإعادة فتح المنفذ دون قيود إضافية.',
        costUSD: 0,
        costSYP: 0,
        costPC: 16,
        effectTrust: -8,
        effectRRI: 14,
        effectCorruption: 4,
        effectCompetence: -8,
        customEffectAr: 'حرب رسوم وتصعيد سياسي يشل صادرات المزارعين وتكبد خسائر فادحة بالجنوب (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'daraa', prri: 18, nassibRevenueCapturePct: -30, customSummaryAr: 'شلل كامل بمعبر نصيب وخسارة عوائد (-30% عوائد)' }
        ]
      },
      {
        id: 'opt_nassib_sea_roro_alternative',
        labelAr: 'تحويل خط الصادرات للخليج عبر عبّارات الرورو البحرية من طرطوس',
        descriptionAr: 'تسيير خط ملاحة بحري مباشر من ميناء طرطوس إلى ميناء جدة لتجاوز الاختناق البري.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $12M',
        costUSD: 12_000_000,
        costSYP: 100_000_000_000,
        costPC: 6,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'تأمين بديل تصديري سيادي دائم لا يخضع للابتزاز السياسي على الحدود البرية',
        governorateEffects: [
          { governorateId: 'tartus', reconstructionScore: 8, prri: -6, customSummaryAr: 'تنشيط رصيف الرورو بمرفأ طرطوس (+8 إعمار)' },
          { governorateId: 'daraa', prri: -4, customSummaryAr: 'تفريغ فائض برادات حوران' }
        ]
      }
    ]
  },
  {
    id: 'event_33_quneitra_buffer_incursion',
    titleAr: 'توغل عسكري في المنطقة العازلة وتجريف أراضي ريف القنيطرة',
    category: 'SOUTHERN',
    sourceAr: 'قيادة المنطقة الجنوبية / لجنة الهدنة وقوات أندوف (UNDOF)',
    descriptionAr: 'توغلت دوريات وجرافات عسكرية إسرائيلية داخل الأراضي المحاذية لخط الهدنة في جيب حضر وجباتا الخشب، معلنة تجريف بساتين تفاح وشق طريق عسكري داخل السيادة السورية بحجة تأمين السياج.',
    targetGovernorateId: 'quneitra',
    triggerCondition: (state) => (state.governorates['quneitra']?.golanTensionIndex ?? 30) > 20 || state.macro.sovereignLeverage < 65,
    options: [
      {
        id: 'opt_quneitra_undof_legal_push',
        labelAr: 'تقديم شكوى عاجلة لمجلس الأمن ونشر حرس حدود نظامي بالسلاح الفردي',
        descriptionAr: 'توثيق الخرق دولياً عبر قوات حفظ السلام والتواجد الميداني لردع التمادي دون تفجير حرب.',
        costUSD: 0,
        costSYP: 50_000_000_000,
        costPC: 10,
        effectTrust: 8,
        effectRRI: -4,
        effectCorruption: -2,
        effectCompetence: 10,
        customEffectAr: 'إحراج الاحتلال دبلوماسياً وحماية ما تبقى من الأراضي بأدوات القانون الدولي (+8 ثقة)',
        governorateEffects: [
          { governorateId: 'quneitra', golanTensionIndex: -10, prri: -8, securityEfficacy: 8, customSummaryAr: 'حماية قرى القنيطرة وتثبيت النقاط (-10 توتر الجولان)' }
        ]
      },
      {
        id: 'opt_quneitra_armed_deterrence',
        labelAr: 'إطلاق نيران تحذيرية والتصدي العسكري المباشر لأعمال التجريف',
        descriptionAr: 'استنفار فوج المدفعية والمقاومة الشعبية للدفاع عن الأرض ووقف التجريف بالقوة.',
        costUSD: 0,
        costSYP: 180_000_000_000,
        costPC: 16,
        effectTrust: 16,
        effectRRI: -8,
        effectCorruption: 0,
        effectCompetence: 8,
        customEffectAr: 'رفع المعنويات الوطنية وصيانة السيادة الميدانية مع خطر غارات جوية انتقامية (+16 ثقة)',
        governorateEffects: [
          { governorateId: 'quneitra', golanTensionIndex: 20, prri: -12, securityEfficacy: 12, customSummaryAr: 'صمود بطولي وتصاعد خطر القصف (+20 توتر الجولان)' },
          { governorateId: 'damascus', prri: 6, customSummaryAr: 'استنفار الدفاع الجوي بمحيط العاصمة' }
        ]
      },
      {
        id: 'opt_quneitra_farmer_evac_aid',
        labelAr: 'صرف تعويضات مالية عاجلة للمزارعين وإخلاء الشريط المحاذي',
        descriptionAr: 'تفادي أي احتكاك عسكري وتعويض المزارعين المتضررين من خزينة الدولة دون مواجهة.',
        costUSD: 0,
        costSYP: 220_000_000_000,
        costPC: -8,
        effectTrust: -14,
        effectRRI: 14,
        effectCorruption: 4,
        effectCompetence: -8,
        customEffectAr: 'تجنب التصعيد تماماً مع صدمة واستياء شعبي من التراجع أمام الاعتداءات (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'quneitra', prri: 18, golanTensionIndex: 12, customSummaryAr: 'تراجع وإخلاء أراضي الجولان (+18 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_34_suwayda_civil_disobedience',
    titleAr: 'العصيان المدني وإغلاق الدوائر الحكومية والمالية في السويداء',
    category: 'SOUTHERN',
    sourceAr: 'مجلس محافظة السويداء / دار طائفة الموحدين المسلمين',
    descriptionAr: 'دعت هيئات الحراك المدني ووجهاء السويداء لإغلاق الدوائر العامة ومديريات المالية والجمارك ومقاطعة الضرائب، احتجاجاً على تدهور الخدمات وانقطاع الوقود والكهرباء، وسط تلويح بمطالب الحكم الذاتي.',
    targetGovernorateId: 'as_suwayda',
    triggerCondition: (state) => (state.governorates['as_suwayda']?.prri ?? 30) > 30 || (state.governorates['as_suwayda']?.suwaydaSecessionProb ?? 0) > 20 || state.macro.civicTrust < 55,
    options: [
      {
        id: 'opt_suwayda_service_injection',
        labelAr: 'إرسال وفد وزاري مع حزمة مخصصات محروقات وكهرباء وموازنة بلدية',
        descriptionAr: 'معالجة المظالم الخدمية فوراً، وضخ وقود وكهرباء إضافية للمحافظة وتهدئة الشارع بالحوار.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $20M',
        costUSD: 20_000_000,
        costSYP: 350_000_000_000,
        costPC: 6,
        effectTrust: 16,
        effectRRI: -14,
        effectCorruption: -4,
        effectCompetence: 12,
        customEffectAr: 'تهدئة الشارع الجنوبي ووأد مشروع الانفصال في مهده وإعادة فتح كافة الدوائر الرسمية',
        governorateEffects: [
          { governorateId: 'as_suwayda', prri: -24, suwaydaSecessionProb: -25, suwaydaIntegrationIndex: 20, dailyBlackoutHours: -4, customSummaryAr: 'إنهاء العصيان بالسويداء (-24 احتقان، -25% انفصال، +20 اندماج)' }
        ]
      },
      {
        id: 'opt_suwayda_fiscal_freeze',
        labelAr: 'تجميد رواتب موظفي الدوائر المضربة وقطع المخصصات للضغط عليهم',
        descriptionAr: 'استخدام سلاح الضغط الاقتصادي لإجبار الموظفين على العودة للعمل دون تقديم تنازلات.',
        costUSD: 0,
        costSYP: -180_000_000_000,
        costPC: 12,
        effectTrust: -20,
        effectRRI: 24,
        effectCorruption: 6,
        effectCompetence: -12,
        customEffectAr: 'انفجار شعبي مسلح وتصاعد خطير في مخاطر تدويل الملف الجنوبي والانفصال (+24 احتقان)',
        governorateEffects: [
          { governorateId: 'as_suwayda', prri: 30, suwaydaSecessionProb: 35, suwaydaIntegrationIndex: -25, customSummaryAr: 'اشتعال تمرد السويداء وتصاعد خطر الانفصال (+35% انفصال)' }
        ]
      },
      {
        id: 'opt_suwayda_decentralized_pact',
        labelAr: 'إبرام ميثاق إدارة خدمات محلية لا مركزية بالتنسيق مع المرجعيات الروحية',
        descriptionAr: 'منح مجلس المحافظة صلاحيات إنفاق ذاتي واسعة تحت المظلة الدستورية والسيادية السورية.',
        costUSD: 0,
        costSYP: 150_000_000_000,
        costPC: 14,
        effectTrust: 12,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 14,
        customEffectAr: 'تسوية تاريخية تحافظ على وحدة الأراضي السورية وتمنح أبناء الجبل شراكة كريمة في الحكم',
        governorateEffects: [
          { governorateId: 'as_suwayda', prri: -18, suwaydaSecessionProb: -18, suwaydaIntegrationIndex: 15, customSummaryAr: 'وفاق تاريخي يرسخ وحدة السويداء (-18 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_35_hasakah_wheat_price_war',
    titleAr: 'حرب أسعار شراء القمح مع الإدارة الذاتية في الجزيرة السورية',
    category: 'AGRICULTURE',
    sourceAr: 'المؤسسة السورية للحبوب / مكتب الأمن الوطني',
    descriptionAr: 'رفعت الإدارة الذاتية تسعيرة شراء القمح بالدولار النقدي ($420 للطن) لإغراء فلاحي الحسكة والرقة وتجفيف مراكز استلام الحبوب الحكومية، مهددة بحرمان صوامع الدولة من قمح الجزيرة بالكامل.',
    targetGovernorateId: 'hasakeh',
    triggerCondition: (state) => state.turnNumber >= 3,
    options: [
      {
        id: 'opt_hasakah_usd_cash_procurement',
        labelAr: 'تسعير القمح الحكومي بالدولار النقدي والدفع الفوري عند باب الصومعة',
        descriptionAr: 'كسر خطة الاستحواذ بالدفع النقدي بالدولار لضمان توريد 700 ألف طن قمح ممتاز لصوامع الدولة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $75M',
        costUSD: 75_000_000,
        costSYP: 0,
        costPC: 4,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'استعادة السيطرة الكاملة على محصول قمح الجزيرة وتأمين رغيف الخبز الوطني لعامين (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'hasakeh', prri: -18, reconstructionScore: 10, customSummaryAr: 'توريد كامل قمح الحسكة للدولة (-18 احتقان)' },
          { governorateId: 'raqqa', prri: -12, customSummaryAr: 'توريد مزارع الرقة للمراكز الرسمية' }
        ]
      },
      {
        id: 'opt_hasakah_fertilizer_subsidies',
        labelAr: 'تقديم سماد ومازوت ري وبطاقات تموين عائلية للموردين للمراكز الحكومية',
        descriptionAr: 'منافسة العرض المالي بحوافز عينية ومستقبلية تضمن ارتباط الفلاح بالدولة السورية.',
        costUSD: 15_000_000,
        costSYP: 300_000_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -6,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'استقطاب 45% من المحصول وتثبيت ولاء الفلاحين الصغار للمؤسسات الرسمية',
        governorateEffects: [
          { governorateId: 'hasakeh', prri: -10, reconstructionScore: 6, customSummaryAr: 'دعم مدخلات فلاحي الجزيرة (-10 احتقان)' }
        ]
      },
      {
        id: 'opt_hasakah_abandon_to_imports',
        labelAr: 'الانسحاب من المنافسة والاعتماد على استيراد القمح الروسي بالبحر',
        descriptionAr: 'توفير السيولة اللحظية وتجاهل قمح الجزيرة مع تعميق الانفصال الاقتصادي مع الشرق.',
        costUSD: 0,
        costSYP: 0,
        costPC: 10,
        effectTrust: -14,
        effectRRI: 14,
        effectCorruption: 6,
        effectCompetence: -10,
        customEffectAr: 'حرمان صوامع الدولة من قمح الداخل وتكريس الأمر الواقع وفقدان نفوذ الدولة بالجزيرة (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'hasakeh', prri: 16, reconstructionScore: -6, customSummaryAr: 'تراجع النفوذ السيادي بالحسكة (+16 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_36_albukamal_iraq_levy',
    titleAr: 'نزاع رسوم الترانزيت على معبر البوكمال مع السلطات العراقية',
    category: 'TRADE',
    sourceAr: 'مديرية الجمارك العامة / إدارة معبر البوكمال الحدودي',
    descriptionAr: 'طالبت هيئة المنافذ الحدودية العراقية بإلغاء رسوم العبور الإضافية المفروضة على قوافل الترانزيت المتجهة لموانئ الساحل السوري، مهددة بتحويل حركة التجارة كاملاً عبر الموانئ التركية.',
    targetGovernorateId: 'deir_ez_zor',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_albukamal_discount_treaty',
        labelAr: 'تخفيض الرسوم بنسبة 35% مقابل ضمان تدفق 500 شاحنة يومياً للموانئ',
        descriptionAr: 'تنشيط ممرات الشحن الدولي وإنعاش موانئ اللاذقية وطرطوس كشريان استراتيجي لبلاد الشام والعراق.',
        costUSD: 0,
        costSYP: -400_000_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'طفرة في عوائد موانئ الساحل بـ 400 مليار ل.س وتعميق الاندماج الاقتصادي مع بغداد',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', reconstructionScore: 8, prri: -8, securityEfficacy: 6, customSummaryAr: 'انتعاش الحركة التجارية بالبوكمال (+8 إعمار)' },
          { governorateId: 'tartus', reconstructionScore: 8, customSummaryAr: 'ازدهار شحن البضائع الترانزيت للعراق' }
        ]
      },
      {
        id: 'opt_albukamal_stand_ground',
        labelAr: 'التمسك بالتعرفة السيادية الكاملة وعدم تقديم أي إعفاءات',
        descriptionAr: 'حماية السيادة الجمركية وعدم التنازل أمام الضغوط الخارجية مهما كانت النتائج.',
        costUSD: 0,
        costSYP: 0,
        costPC: 8,
        effectTrust: -4,
        effectRRI: 6,
        effectCorruption: 2,
        effectCompetence: -6,
        customEffectAr: 'انخفاض حركة الشاحنات بنسبة 70% وتراجع أهمية الممرات السورية لصالح المنافس الإقليمي',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', prri: 10, customSummaryAr: 'ركود تجاري في أسواق البوكمال (+10 احتقان)' }
        ]
      },
      {
        id: 'opt_joint_freight_company',
        labelAr: 'تأسيس شركة ملاحة ونقل بري مشتركة سورية-عراقية برأسمال متبادل',
        descriptionAr: 'تحويل النزاع إلى شراكة استراتيجية تقتسم العوائد وتمنح تخفيضات لأسطول الشركة المشتركة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $18M',
        costUSD: 18_000_000,
        costSYP: 150_000_000_000,
        costPC: 8,
        effectTrust: 12,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 16,
        customEffectAr: 'تثبيت مسار الترانزيت العراقي عبر الأراضي السورية لعقود وجني عوائد عملة صعبة دائمة',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', reconstructionScore: 10, securityEfficacy: 8, prri: -10, customSummaryAr: 'تأسيس مقر النقل المشترك بدير الزور (+10 إعمار)' }
        ]
      }
    ]
  },
  {
    id: 'event_37_deir_ez_zor_tribal_revolt',
    titleAr: 'انتفاضة العشائر العربية وقطع المعابر النهرية في دير الزور',
    category: 'SECURITY',
    sourceAr: 'شعبة الاستخبارات العسكرية / وجهاء قبائل العكيدات والبقارة',
    descriptionAr: 'اندلعت اشتباكات عنيفة بين مقاتلي العشائر العربية ونقاط قوات قسد شرق الفرات، مع توجيه نداءات استغاثة للدولة السورية لتأمين الدعم الطبي واللوجستي وحماية العائلات النازحة عبر النهر.',
    targetGovernorateId: 'deir_ez_zor',
    triggerCondition: (state) => (state.governorates['deir_ez_zor']?.tribalRageIndex ?? 40) > 30 || state.turnNumber >= 4,
    options: [
      {
        id: 'opt_deir_ez_zor_humanitarian_bridge',
        labelAr: 'فتح ممرات إنسانية وطبية عبر الفرات واستقبال الجرحى بالمشافي',
        descriptionAr: 'استيعاب النازحين وتقديم العلاج والإغاثة دون الانخراط في صدام عسكري مع التحالف الدولي.',
        costUSD: 0,
        costSYP: 220_000_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'كسب احترام وثقة شيوخ العشائر وتفادي الذرائع العسكرية الدولية (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', tribalRageIndex: -20, prri: -14, activeHospitalsPct: 10, customSummaryAr: 'إغاثة عائلات العشائر بدير الزور (-20 غضب عشائري)' }
        ]
      },
      {
        id: 'opt_deir_ez_zor_covert_logistics',
        labelAr: 'تقديم دعم لوجستي وتسليحي سري لمقاتلي العشائر لتعزيز نفوذ الدولة',
        descriptionAr: 'استثمار الانتفاضة لاستعادة السيطرة على حقول النفط شرق الفرات وإرباك القوات الأجنبية.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $15M',
        costUSD: 15_000_000,
        costSYP: 180_000_000_000,
        costPC: 18,
        effectTrust: 10,
        effectRRI: 4,
        effectCorruption: 4,
        effectCompetence: 8,
        customEffectAr: 'تعزيز النفوذ العسكري شرق الفرات مع مخاطر رد جوي واستنزاف لوجستي',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', securityEfficacy: 14, tribalRageIndex: -10, prri: 8, customSummaryAr: 'تسليح ودعم عشائر دير الزور (+14 أمن)' }
        ]
      },
      {
        id: 'opt_deir_ez_zor_strict_neutrality',
        labelAr: 'التزام الحياد التام وإغلاق المعابر النهرية لمنع تمدد الاشتباكات',
        descriptionAr: 'حماية استقرار الضفة الغربية وتجنب أي تورط في الصراع الدائر شرق النهر.',
        costUSD: 0,
        costSYP: 0,
        costPC: 6,
        effectTrust: -14,
        effectRRI: 12,
        effectCorruption: 0,
        effectCompetence: -6,
        customEffectAr: 'تجنب النفقات تماماً مع صدمة واستياء عميق لدى العشائر العربية من خذلانهم (+12 احتقان)',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', tribalRageIndex: 25, prri: 18, customSummaryAr: 'استياء وغضب شيوخ العشائر من الحياد (+25 غضب عشائري)' }
        ]
      }
    ]
  },
  {
    id: 'event_38_lebanon_refugee_deportation',
    titleAr: 'موجة ترحيل مفاجئة لآلاف اللاجئين السوريين من لبنان',
    category: 'SOVEREIGNTY',
    sourceAr: 'إدارة الهجرة والجوازات / فرع الهلال الأحمر بحمص',
    descriptionAr: 'شنت أجهزة الأمن اللبنانية مداهمات واسعة ورحلت قسراً أكثر من 35 ألف مواطن سوري عبر معابر وادي خالد وتلكلخ دون تنسيق مسبق، ومعظمهم نساء وأطفال بلا مأوى أو وثائق.',
    targetGovernorateId: 'homs',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_refugee_emergency_shelter',
        labelAr: 'إقامة مراكز إيواء عاجلة وتخصيص معونات غذائية وتثبيت الوثائق',
        descriptionAr: 'احتواء الكارثة الإنسانية واستيعاب المواطنين بكرامة وإعادتهم لقراهم الأصلية المنظمة.',
        costUSD: 0,
        costSYP: 450_000_000_000,
        costPC: 8,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'استيعاب كريم للاجئين العائدين وتثبيت استقرارهم الأسري والمدني (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'homs', prri: -12, reconstructionScore: 6, customSummaryAr: 'إيواء العائلات العائدة في حمص والقصير (-12 احتقان)' },
          { governorateId: 'rif_dimashq', prri: -6, customSummaryAr: 'استيعاب دفعات العائدين بالريف' }
        ]
      },
      {
        id: 'opt_refugee_unhcr_demand',
        labelAr: 'مطالبة المفوضية السامية للأمم المتحدة (UNHCR) بتحمل التكاليف كاملة',
        descriptionAr: 'رفض إدخالهم إلى عمق المحافظات قبل استلام تمويل دولي صريح بالدولار الأمريكي.',
        costUSD: 0,
        costSYP: 60_000_000_000,
        costPC: 12,
        effectTrust: -12,
        effectRRI: 16,
        effectCorruption: 4,
        effectCompetence: -6,
        customEffectAr: 'تكدس العائلات في ظروف مأساوية على الحدود وضجة إعلامية حقوقية دولية (+16 احتقان)',
        governorateEffects: [
          { governorateId: 'homs', prri: 16, securityEfficacy: -6, customSummaryAr: 'أزمة إنسانية على معابر حمص الغربية (+16 احتقان)' }
        ]
      },
      {
        id: 'opt_refugee_village_rebuild_grant',
        labelAr: 'منح بدل استقرار وسكن عاجل في قراهم المحررة لتسريع الإعمار',
        descriptionAr: 'تحويل الأزمة لفرصة ديموغرافية تعيد إحياء القرى الزراعية المهجورة بتمويل دولاري جزئي.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $18M',
        costUSD: 18_000_000,
        costSYP: 200_000_000_000,
        costPC: 6,
        effectTrust: 16,
        effectRRI: -12,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'إعادة إعمار القرى الزراعية الحدودية وتأمين يد عاملة للإنتاج الزراعي والصناعي',
        governorateEffects: [
          { governorateId: 'homs', reconstructionScore: 10, prri: -14, customSummaryAr: 'إحياء قرى ريف حمص الغربي (+10 إعمار)' }
        ]
      }
    ]
  },
  {
    id: 'event_39_espionage_cell_bust',
    titleAr: 'تفكيك شبكة تجسس واستطلاع إقليمية في ريف دمشق الجنوبي',
    category: 'SECURITY',
    sourceAr: 'شعبة المخابرات العسكرية / إدارة الأمن السياسي',
    descriptionAr: 'ألقت الأجهزة الأمنية القبض على شبكة تجسس مجهزة بأجهزة إرسال فضائي وكاميرات حرارية كانت ترصد مرابض الدفاع الجوي وحركة القوافل الحكومية على طريق مطار دمشق الدولي.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_espionage_public_trial',
        labelAr: 'محاكمة علنية وبث اعترافات الشبكة لتعزيز الوعي الأمني الوطني',
        descriptionAr: 'فضح الاختراقات الخارجية إعلامياً واستنهاض التماسك الشعبي حول المؤسسات العسكرية والأمنية.',
        costUSD: 0,
        costSYP: 50_000_000_000,
        costPC: 16,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 12,
        customEffectAr: 'رفع الروح المعنوية وهيبة الدولة السيادية أمام الرأي العام (+14 ثقة، +16 رصيد سياسي)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: 14, prri: -8, customSummaryAr: 'تأمين محيط مطار دمشق وريفها الجنوبي (+14 أمن)' },
          { governorateId: 'damascus', securityEfficacy: 8, customSummaryAr: 'تعزيز أمن العاصمة' }
        ]
      },
      {
        id: 'opt_espionage_intelligence_trade',
        labelAr: 'مبادلة أفراد الشبكة سراً بكوادر وتقنيات استخبارية وطنية بالخارج',
        descriptionAr: 'استثمار الصيد الاستخباري عبر قنوات سرية لاستعادة كوادر محتجزة ومعدات رادار دون ضجيج.',
        costUSD: 0,
        costSYP: 0,
        costPC: 6,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: 0,
        effectCompetence: 16,
        customEffectAr: 'مكسب استخباري وتقني ثمين يعزز قدرات المنظومة الأمنية بصمت (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: 10, customSummaryAr: 'تحديث تقنيات الرصد بريف دمشق' }
        ]
      },
      {
        id: 'opt_espionage_radar_overhaul',
        labelAr: 'إعادة تموضع شاملة للمنظومات الدفاعية وتغيير الترددات اللاسلكية',
        descriptionAr: 'سد كافة الثغرات الفنية التي كشفتها الشبكة وتأمين الأجواء بمعدات تشويش إلكتروني حديثة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $16M',
        costUSD: 16_000_000,
        costSYP: 120_000_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 16,
        customEffectAr: 'تحصين رادارات الدفاع الجوي بالعاصمة ومنع الغارات الدقيقة المفاجئة (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: 16, customSummaryAr: 'تأمين أجواء دمشق الجنوبية بالتشويش الذكي (+16 أمن)' }
        ]
      }
    ]
  }
];
