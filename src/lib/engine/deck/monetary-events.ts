import type { EventCard } from '../types';

export const MONETARY_EVENTS: EventCard[] = [
  {
    id: 'event_01_banknote_liquidity',
    titleAr: 'أزمة السيولة النقدية وشلل أجهزة الصراف الآلي',
    category: 'MACRO',
    sourceAr: 'مصرف سورية المركزي / نقابة العاملين في المصارف',
    descriptionAr: 'مع اتساع الفجوة التضخمية، عجزت فروع المصرفين التجاري والعقاري عن تلبية سحوبات الموظفين والمتقاعدين، وتكدست الطوابير لمئات الأمتار في دمشق وحلب وسط شائعات عن نفاد أوراق فئة الـ 5000 ليرة.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => state.macro.treasurySYP < 4_000_000_000_000 || state.macro.annualInflationPct > 20,
    options: [
      {
        id: 'opt_emergency_print',
        labelAr: 'طباعة إصدار نقدي إسعافي فوري دون تغطية',
        descriptionAr: 'ضخ كتلة نقدية سريعة لملء الصرافات ودفع الرواتب فوراً على حساب تسارع التضخم وانهيار القوة الشرائية لليرة.',
        costUSD: 0,
        costSYP: -1_200_000_000_000,
        costPC: 5,
        effectTrust: -14,
        effectRRI: 10,
        effectCorruption: 4,
        effectCompetence: -5,
        customEffectAr: 'توفير سيولة فورية (+1.2T ل.س) مع تراجع ثقة الأسواق وتصاعد التضخم',
        governorateEffects: [
          { governorateId: 'damascus', prri: -6, customSummaryAr: 'تهدئة طوابير العاصمة مؤقتاً (-6 احتقان)' },
          { governorateId: 'aleppo', prri: -4, customSummaryAr: 'تأمين رواتب موظفي حلب (-4 احتقان)' }
        ]
      },
      {
        id: 'opt_capital_controls',
        labelAr: 'فرض سقف سحب يومي صارم والتحول للدفع الإلكتروني الإلزامي',
        descriptionAr: 'تقييد السحوبات النقدية بـ 300 ألف ليرة يومياً وإلزام التجار بالدفع الرقمي لتفادي نفاد النقد.',
        costUSD: 0,
        costSYP: 0,
        costPC: 15,
        effectTrust: -18,
        effectRRI: 16,
        effectCorruption: 8,
        effectCompetence: 6,
        customEffectAr: 'حماية خزائن المصارف مع شلل النشاط التجاري اليومي وغضب المواطنين (+16 احتقان)',
        governorateEffects: [
          { governorateId: 'damascus', prri: 14, customSummaryAr: 'طوابير وتذمر واسع في العاصمة (+14 احتقان)' },
          { governorateId: 'rif_dimashq', prri: 12, customSummaryAr: 'شلل المعاملات بريف دمشق (+12 احتقان)' }
        ]
      },
      {
        id: 'opt_fx_liquidity_injection',
        labelAr: 'فتح خط تسوية نقدية عبر احتياطي العملات الأجنبية',
        descriptionAr: 'استخدام جزء من احتياطي النقد الأجنبي لتغطية شراء نقد وشحن أوراق نقدية مؤمنة دون زيادة التضخم.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $45M',
        costUSD: 45_000_000,
        costSYP: 0,
        costPC: 0,
        effectTrust: 8,
        effectRRI: -8,
        effectCorruption: -2,
        effectCompetence: 10,
        customEffectAr: 'استقرار مصرفي كامل وتعزيز الثقة النقدية (+8 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -10, customSummaryAr: 'انتظام الصرافات بالعاصمة (-10 احتقان)' },
          { governorateId: 'aleppo', prri: -8, customSummaryAr: 'استقرار سيولة حلب (-8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_02_hawala_crackdown',
    titleAr: 'ملاحقة شبكات الصرافة غير المرخصة والحوالات السوداء',
    category: 'MACRO',
    sourceAr: 'إدارة الأمن الجنائي / هيئة مكافحة غسل الأموال',
    descriptionAr: 'تتهم الأجهزة الأمنية شبكات الصرافة غير النظامية بالمضاربة وتخريب سعر الصرف، بينما تعتمد مئات آلاف الأسر السورية على هذه الحوالات اليومية كمصدر وحيد لشراء الغذاء والدواء.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.macro.parallelRateSYP > 13_500 || state.macro.systemicCorruption > 30,
    options: [
      {
        id: 'opt_security_raid',
        labelAr: 'حملة أمنية شاملة ومصادرة مكاتب الصرافة غير المرخصة',
        descriptionAr: 'مداهمة مكاتب الحوالات ومصادرة الأموال وإغلاق مقراتها بقوة القانون لردع المضاربين.',
        costUSD: 0,
        costSYP: -800_000_000_000,
        costPC: 10,
        effectTrust: -15,
        effectRRI: 18,
        effectCorruption: 6,
        effectCompetence: -2,
        customEffectAr: 'مصادرات بـ 800 مليار ل.س مع انقطاع الحوالات عن الأسر (+18 احتقان شعبي)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', prri: 15, securityEfficacy: 6, customSummaryAr: 'استنفار أمني بريف دمشق (+15 احتقان)' },
          { governorateId: 'aleppo', prri: 12, customSummaryAr: 'تراجع حركة الشراء بأسواق حلب (+12 احتقان)' }
        ]
      },
      {
        id: 'opt_market_rate_matching',
        labelAr: 'تحرير نشرة الحوالات المصرفية لمطابقة سعر السوق السوداء',
        descriptionAr: 'إلغاء السعر التفضيلي القديم والسماح للمصارف وشركات الصرافة الرسمية بشراء الدولار بسعر السوق الموازي.',
        costUSD: 0,
        costSYP: 0,
        costPC: 18,
        effectTrust: 10,
        effectRRI: -10,
        effectCorruption: -12,
        effectCompetence: 14,
        customEffectAr: 'سحب البساط من السوق الموازية واستقطاب ملايين الدولارات رسمياً للمصارف (+10 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -8, customSummaryAr: 'انتعاش السيولة بمصارف العاصمة (-8 احتقان)' }
        ]
      },
      {
        id: 'opt_tacit_tolerance',
        labelAr: 'غض الطرف والتفاهم مع كبار الصرافين على إتاوة جمركية',
        descriptionAr: 'تفادي الصدام الاجتماعي والاكتفاء بفرض غرامات تسوية مقطوعة على شبكات التحويل دون إيقافها.',
        costUSD: 0,
        costSYP: -350_000_000_000,
        costPC: -5,
        effectTrust: -8,
        effectRRI: -4,
        effectCorruption: 14,
        effectCompetence: -6,
        customEffectAr: 'تدفقات نقدية مستمرة مع تآكل هيبة القانون واستشراء الفساد المؤسسي (+14 فساد)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: -8, customSummaryAr: 'تراجع هيبة الضابطة الجمركية (-8 أمن)' }
        ]
      }
    ]
  },
  {
    id: 'event_03_goldsmiths_strike',
    titleAr: 'اضطراب سوق الذهب وإضراب جمعية الصاغة بدمشق وحلب',
    category: 'MACRO',
    sourceAr: 'الجمعية الحرفية للصاغة / وزارة المالية',
    descriptionAr: 'رفضت أسواق الصاغة في الحريقة وسوق الصاغة بحلب فرض رسم الإنفاق الاستهلاكي الجديد، وأغلقت محالها وتوقفت عن تسعير المعدن الأصفر، وسط تسرب الذهب الخام نحو دول الجوار.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => (state.macro.taxCompliancePct ?? 60) < 65 || state.macro.treasurySYP < 5_000_000_000_000,
    options: [
      {
        id: 'opt_tax_compromise',
        labelAr: 'إلغاء الرسم المثير للجدل والاتفاق على مقطوعة سنوية ثابتة',
        descriptionAr: 'التنازل عن النسبة المئوية واعتماد ضريبة سنوية مقطوعة متفق عليها لإنهاء الإضراب فوراً.',
        costUSD: 0,
        costSYP: 250_000_000_000,
        costPC: 6,
        effectTrust: 6,
        effectRRI: -6,
        effectCorruption: 4,
        effectCompetence: 4,
        customEffectAr: 'إعادة فتح الأسواق فوراً وتطمين مجتمع الأعمال مع خسارة جزء من الإيرادات الضريبية',
        governorateEffects: [
          { governorateId: 'damascus', prri: -6, customSummaryAr: 'استقرار أسواق الحريقة (-6 احتقان)' },
          { governorateId: 'aleppo', prri: -5, customSummaryAr: 'عودة النشاط لسوق صاغة حلب (-5 احتقان)' }
        ]
      },
      {
        id: 'opt_enforce_opening',
        labelAr: 'إلزام الصاغة بالفتح الجبري تحت طائلة الشمع الأحمر والمصادرة',
        descriptionAr: 'تسيير دوريات تموينية وأمنية لفض الإضراب وإحالة الممتنعين لمحكمة الجرائم الاقتصادية.',
        costUSD: 0,
        costSYP: 0,
        costPC: 16,
        effectTrust: -14,
        effectRRI: 14,
        effectCorruption: 8,
        effectCompetence: -4,
        customEffectAr: 'فرض هيبة الدولة قسرياً مع هروب رؤوس الأموال وفتح سوق سوداء للسبائك (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'damascus', prri: 12, securityEfficacy: 4, customSummaryAr: 'توتر واحتقان تجاري بدمشق (+12 احتقان)' },
          { governorateId: 'aleppo', prri: 10, customSummaryAr: 'إغلاق ورش الصياغة بحلب (+10 احتقان)' }
        ]
      },
      {
        id: 'opt_gold_backed_bonds',
        labelAr: 'إطلاق صكوك ذهبية وطنية عبر مصرف سورية المركزي',
        descriptionAr: 'استيعاب الطلب على الملاذ الآمن بإصدار شهادات إيداع ذهبية رسمية تكسر احتكار الصاغة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $30M',
        costUSD: 30_000_000,
        costSYP: -400_000_000_000,
        costPC: 5,
        effectTrust: 10,
        effectRRI: -8,
        effectCorruption: -5,
        effectCompetence: 12,
        customEffectAr: 'امتصاص فائض السيولة بالليرة وتعزيز ثقة المدخرين بالمؤسسة الرسمية (+10 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -8, customSummaryAr: 'إقبال على صكوك المركزي بالعاصمة (-8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_04_creditor_ultimatum',
    titleAr: 'إنذار كونسورتيوم الدائنين السياديين للمطالبة بجدولة الديون',
    category: 'MACRO',
    sourceAr: 'نادي الدائنين الدولي / وزارة المالية',
    descriptionAr: 'طالبت بيوت مالية وصناديق ديون أجنبية بتسديد متأخرات ديون سيادية قديمة، مهددة بالحجز على عائدات موانئ الساحل وأصول الخطوط الجوية بالخارج في حال التخلف.',
    targetGovernorateId: 'tartus',
    triggerCondition: (state) => state.macro.sovereignDebtUSD > 1_200_000_000 || state.macro.reservesUSD < 350_000_000,
    options: [
      {
        id: 'opt_token_payment',
        labelAr: 'سداد دفعة تسوية نقدية إسعافية لإبراء الذمة وتمديد المهلة',
        descriptionAr: 'تحويل جزء من السيولة الصعبة لتفادي الحجز الدولي على الأصول وحماية الموانئ.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $90M',
        costUSD: 90_000_000,
        costSYP: 0,
        costPC: 0,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: 0,
        effectCompetence: 8,
        customEffectAr: 'حماية الموانئ والناقل الوطني من الحجز مع ضغط شديد على الاحتياطي (-$90M)',
        governorateEffects: [
          { governorateId: 'tartus', reconstructionScore: 4, customSummaryAr: 'حماية عقود مرفأ طرطوس (+4 إعمار)' },
          { governorateId: 'latakia', securityEfficacy: 4, customSummaryAr: 'استقرار الملاحة باللاذقية (+4 أمن)' }
        ]
      },
      {
        id: 'opt_asset_mortgage',
        labelAr: 'منح امتياز استثمار تشغيلي طويل الأجل بدلاً من السداد النقدي',
        descriptionAr: 'رهن جزء من عائدات مناجم خنيفيس أو رصيف الحاويات بالتقسيط مقابل إسقاط الدين.',
        costUSD: 0,
        costSYP: 0,
        costPC: 22,
        effectTrust: -14,
        effectRRI: 12,
        effectCorruption: 6,
        effectCompetence: -8,
        customEffectAr: 'توفير العملة الصعبة مع تراجع السيادة الوطنية (-22 رصيد سياسي)',
        governorateEffects: [
          { governorateId: 'tartus', prri: 10, customSummaryAr: 'تذمر عمال المرفأ من التنازل (+10 احتقان)' },
          { governorateId: 'homs', prri: 8, customSummaryAr: 'استياء محلي من رهن مناجم الفوسفات (+8 احتقان)' }
        ]
      },
      {
        id: 'opt_sovereign_defiance',
        labelAr: 'إعلان تجميد الديون التراكمية ورفض الخضوع للابتزاز الخارجي',
        descriptionAr: 'التمسك بالسيادة وحماية الاحتياطي، مع الاستعداد لمواجهة دعاوى التحكيم الدولي.',
        costUSD: 0,
        costSYP: 0,
        costPC: -10,
        effectTrust: 4,
        effectRRI: 8,
        effectCorruption: 0,
        effectCompetence: -10,
        customEffectAr: 'صيانة الاحتياطي الأجنبي بالكامل مع تجميد خطوط الائتمان وعزلة مصرفية دولية',
        governorateEffects: [
          { governorateId: 'tartus', prri: 6, securityEfficacy: -6, customSummaryAr: 'اضطراب لوجستي في المرفأ (-6 أمن)' }
        ]
      }
    ]
  },
  {
    id: 'event_05_tax_resistance',
    titleAr: 'تمرد كبار مستوردي العاصمة ضد الفوترة الإلكترونية',
    category: 'MACRO',
    sourceAr: 'غرفة تجارة دمشق / الهيئة العامة للضرائب والرسوم',
    descriptionAr: 'رفض كبار تجار الجملة والمستوردين في سوق البزورية وسنجقدار الربط الإلكتروني الإلزامي مع الدوائر المالية، مهددين بوقف توريد المواد الغذائية للمحافظات والامتناع عن دفع الضرائب.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => (state.macro.taxCompliancePct ?? 60) < 70 || state.macro.systemicCorruption > 35,
    options: [
      {
        id: 'opt_tax_enforcement',
        labelAr: 'إنفاذ الربط الإلكتروني بالقوة وإغلاق مكاتب الممتنعين',
        descriptionAr: 'توجيه الضابطة المالية لختم مستودعات كبار التجار المخالفين وتحويلهم للنيابة المالية.',
        costUSD: 0,
        costSYP: -650_000_000_000,
        costPC: 12,
        effectTrust: -10,
        effectRRI: 14,
        effectCorruption: -10,
        effectCompetence: 12,
        customEffectAr: 'تحصيل 650 مليار ل.س إيرادات ضريبية مع نقص سلع مؤقت في الأسواق (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'damascus', prri: 14, securityEfficacy: 6, customSummaryAr: 'اضطراب تجاري بأسواق العاصمة (+14 احتقان)' },
          { governorateId: 'rif_dimashq', prri: 8, customSummaryAr: 'تذبذب أسعار الجملة بالريف (+8 احتقان)' }
        ]
      },
      {
        id: 'opt_tax_amnesty',
        labelAr: 'المساومة وتقديم تسوية ضريبية استثنائية مع إعفاءات موسعة',
        descriptionAr: 'منح التجار إعفاءً من الغرامات السابقة مقابل بدء الامتثال الجزئي حفاظاً على تدفق البضائع.',
        costUSD: 0,
        costSYP: 0,
        costPC: -5,
        effectTrust: -8,
        effectRRI: -4,
        effectCorruption: 12,
        effectCompetence: -6,
        customEffectAr: 'استقرار رفوف المواد الغذائية فوراً مع خسارة 35% من العائدات السيادية المتوقعة',
        governorateEffects: [
          { governorateId: 'damascus', prri: -6, customSummaryAr: 'ارتياح تجار البزورية (-6 احتقان)' }
        ]
      },
      {
        id: 'opt_state_trading_counter',
        labelAr: 'تفعيل الاستيراد المباشر عبر السورية للتجارة لكسر احتكارهم',
        descriptionAr: 'تخصيص اعتمادات حكومية للمؤسسة العامة للتجارة لاستيراد السلع الغذائية وطرحها بأسعار الكلفة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $60M',
        costUSD: 60_000_000,
        costSYP: 400_000_000_000,
        costPC: 8,
        effectTrust: 12,
        effectRRI: -12,
        effectCorruption: -6,
        effectCompetence: 10,
        customEffectAr: 'كسر احتكار كبار المستوردين وتأمين الغذاء للشعب بأسعار عادلة (+12 ثقة مدنية)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -10, customSummaryAr: 'وفرة السلع في صالات الدولة (-10 احتقان)' },
          { governorateId: 'aleppo', prri: -8, customSummaryAr: 'انخفاض أسعار المواد الأساسية (-8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_06_customs_smuggling',
    titleAr: 'فضيحة تهريب العملة الصعبة بالجمارك ومعابر الحدود الغربية',
    category: 'SECURITY',
    sourceAr: 'شعبة الاستخبارات العسكرية / الهيئة المركزية للرقابة والتفتيش',
    descriptionAr: 'كشف تحقيق سري عن تواطؤ شبكة من كبار مسؤولي الجمارك في ريف دمشق والساحل لتسهيل تهريب قوافل أموال صعبة وشاحنات كماليات مقابل عمولات نقدية بملايين الدولارات.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.macro.systemicCorruption > 35,
    options: [
      {
        id: 'opt_military_tribunal',
        labelAr: 'محاكمة عسكرية استثنائية علنية ومصادرة كافة أصول الشبكة',
        descriptionAr: 'إحالة المتورطين إلى المحكمة العسكرية ومصادرة عقاراتهم وحساباتهم المصرفية لصالح الخزينة.',
        costUSD: 0,
        costSYP: -900_000_000_000,
        costPC: 18,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -16,
        effectCompetence: 10,
        customEffectAr: 'مصادرة 900 مليار ل.س واستعادة هيبة الدولة ومكافحة الفساد الصارم (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: 12, prri: -6, customSummaryAr: 'تطهير معابر ريف دمشق (+12 أمن)' },
          { governorateId: 'tartus', securityEfficacy: 8, customSummaryAr: 'انضباط جمارك الساحل (+8 أمن)' }
        ]
      },
      {
        id: 'opt_quiet_rotation',
        labelAr: 'تدوير ونقل الضباط والكوادر دون إثارة الرأي العام',
        descriptionAr: 'إبعاد المسؤولين المتورطين إلى مناصب غير حساسة لتفادي إحراج المؤسسة وإرباك العمل الجمركي.',
        costUSD: 0,
        costSYP: 0,
        costPC: -4,
        effectTrust: -14,
        effectRRI: 8,
        effectCorruption: 10,
        effectCompetence: -8,
        customEffectAr: 'استمرار قنوات التهريب المستترة وفقدان الثقة الشعبية بالنزاهة (-14 ثقة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: -10, customSummaryAr: 'تراجع الالتزام بنقاط التفتيش (-10 أمن)' }
        ]
      },
      {
        id: 'opt_digital_customs',
        labelAr: 'أتمتة ورقمنة المعابر الجمركية بالكامل بمعدات مسح ذكية',
        descriptionAr: 'إلغاء المعاينة اليدوية والاعتماد على بوابات الكشف الإلكتروني والربط الفضائي المباشر مع المالية.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $25M',
        costUSD: 25_000_000,
        costSYP: 200_000_000_000,
        costPC: 6,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -14,
        effectCompetence: 16,
        customEffectAr: 'إغلاق ثغرات الرشوة تقنياً ورفع إيرادات الجباية الجمركية بنسبة 40%',
        governorateEffects: [
          { governorateId: 'rif_dimashq', securityEfficacy: 14, customSummaryAr: 'تحديث معابر جديدة يابوس وجديدة (+14 أمن)' },
          { governorateId: 'homs', securityEfficacy: 10, customSummaryAr: 'رقمنة معبر الدبوسية بحمص (+10 أمن)' }
        ]
      }
    ]
  },
  {
    id: 'event_07_microfinance_insolvency',
    titleAr: 'إفلاس شركة تمويل أصغر كبرى واحتجاز مدخرات المودعين بحمص',
    category: 'MACRO',
    sourceAr: 'مجلس النقد والتسليف / غرفة تجارة حمص',
    descriptionAr: 'أعلنت كبرى شركات التمويل والدفع الاستثماري شبه الخاصة في حمص وطرطوس إفلاسها المفاجئ إثر مضاربات غير مشروعة، مما بدد أموال 45 ألف أسرة وعائلة شهيد واندلاع اعتصامات غاضبة.',
    targetGovernorateId: 'homs',
    triggerCondition: (state) => state.macro.civicTrust < 60 || state.macro.parallelRateSYP > 13_000,
    options: [
      {
        id: 'opt_state_bailout',
        labelAr: 'خطة إنقاذ مالي حكومية وتعويض صغار المودعين من الخزينة',
        descriptionAr: 'صرف تعويضات عاجلة بنسبة 80% للمودعين الصغار واحتواء الغضب الشعبي على حساب عجز الموازنة.',
        costUSD: 0,
        costSYP: 1_200_000_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -14,
        effectCorruption: 2,
        effectCompetence: 6,
        customEffectAr: 'تهدئة الشارع الحمصي وحماية الأسر الضعيفة مع تعميق العجز العام (-1.2T ل.س)',
        governorateEffects: [
          { governorateId: 'homs', prri: -18, customSummaryAr: 'إنهاء الاعتصامات بمركز حمص (-18 احتقان)' },
          { governorateId: 'tartus', prri: -12, customSummaryAr: 'تعويض صغار المودعين بطرطوس (-12 احتقان)' }
        ]
      },
      {
        id: 'opt_judicial_liquidation',
        labelAr: 'تصفية أصول الشركة قضائياً وترك المودعين لتحمل مخاطر السوق',
        descriptionAr: 'رفض استخدام المال العام لتعويض المستثمرين في قطاع خاص، وتكليف حارس قضائي ببيع الأصول.',
        costUSD: 0,
        costSYP: 0,
        costPC: 10,
        effectTrust: -18,
        effectRRI: 20,
        effectCorruption: -4,
        effectCompetence: 2,
        customEffectAr: 'حماية خزينة الدولة تماماً مع تفجر احتجاجات عارمة للمودعين المنكوبين (+20 احتقان)',
        governorateEffects: [
          { governorateId: 'homs', prri: 24, sectarianAnxiety: 10, customSummaryAr: 'غضب عارم وتظاهرات في حمص (+24 احتقان)' },
          { governorateId: 'tartus', prri: 16, customSummaryAr: 'احتجاجات أهالي الساحل المتضررين (+16 احتقان)' }
        ]
      },
      {
        id: 'opt_bank_merger',
        labelAr: 'دمج الشركة بالمصرف التجاري السوري وتحويل الودائع لسندات 5 سنوات',
        descriptionAr: 'استحواذ المصرف الحكومي على أصول الشركة وإصدار سندات خزانة بفوائد مجزية للمودعين.',
        costUSD: 0,
        costSYP: 350_000_000_000,
        costPC: 12,
        effectTrust: 8,
        effectRRI: -8,
        effectCorruption: -2,
        effectCompetence: 14,
        customEffectAr: 'حل مصرفي هيكلي ذكي يعيد الثقة بالقطاع المالي دون استنزاف فوري للسيولة',
        governorateEffects: [
          { governorateId: 'homs', prri: -10, customSummaryAr: 'تسوية ودائع حمص بأمان (-10 احتقان)' },
          { governorateId: 'tartus', prri: -8, customSummaryAr: 'قبول السندات الحكومية بطرطوس (-8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_08_central_bank_float',
    titleAr: 'مبادرة تعويم سعر الصرف الرسمي أمام السوق الموازي',
    category: 'MACRO',
    sourceAr: 'صندوق النقد العربي / رئاسة مجلس الوزراء',
    descriptionAr: 'اتسعت الهوة بين سعر الصرف الرسمي المثبت لدى المركزي وسعر السوق الموازي بنسبة قاربت 35%، ما يشل الصادرات ويحرم الخزينة من العملة الأجنبية ويشجع على المضاربات العكسية.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => Math.abs(state.macro.parallelRateSYP - state.macro.officialRateSYP) > 2_500,
    options: [
      {
        id: 'opt_managed_float',
        labelAr: 'إقرار التعويم المدار وتوحيد سعر الصرف الرسمي مع الموازي',
        descriptionAr: 'تعديل السعر الرسمي فوراً ليطابق السعر الحقيقي لامتصاص كافة تدفقات النقد الأجنبي إلى القنوات الرسمية.',
        costUSD: -40_000_000,
        costSYP: 0,
        costPC: 16,
        effectTrust: -6,
        effectRRI: 12,
        effectCorruption: -14,
        effectCompetence: 18,
        customEffectAr: 'قفزة تضخمية مؤقتة مع انتعاش الصادرات وجذب $40M للمصارف الرسمية وتجفيف السوق السوداء',
        governorateEffects: [
          { governorateId: 'damascus', prri: 8, customSummaryAr: 'تعديل أسعار السلع بالعاصمة (+8 احتقان)' },
          { governorateId: 'aleppo', reconstructionScore: 8, customSummaryAr: 'انتعاش صادرات مصانع حلب (+8 إعمار)' }
        ]
      },
      {
        id: 'opt_hold_peg',
        labelAr: 'التمسك بالتثبيت القديم لحماية أسعار السلع المدعومة والدواء',
        descriptionAr: 'رفض التعويم والاستمرار بضخ العملة الصعبة لتثبيت السعر الرسمي وتفادي الغلاء.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $70M',
        costUSD: 70_000_000,
        costSYP: 0,
        costPC: 0,
        effectTrust: 4,
        effectRRI: -4,
        effectCorruption: 14,
        effectCompetence: -12,
        customEffectAr: 'استقرار أسعار المواد الأساسية على حساب نزيف مستمر لاحتياطي العملات الصعبة (-$70M)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -6, customSummaryAr: 'استقرار أسعار خبز وأدوية دمشق (-6 احتقان)' }
        ]
      },
      {
        id: 'opt_stepped_adjustment',
        labelAr: 'تعديل تدريجي مجدول بنسبة 10% شهرياً مع دعم نقدي للفقراء',
        descriptionAr: 'تضييق الفجوة بخطوات محسوبة بالتزامن مع منحة شهرية لحاملي البطاقات العائلية.',
        costUSD: 15_000_000,
        costSYP: 600_000_000_000,
        costPC: 8,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -6,
        effectCompetence: 12,
        customEffectAr: 'مسار اقتصادي متوازن يخفف الصدمة الاجتماعية ويقترب من السعر الحقيقي (+8 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -4, customSummaryAr: 'تأقلم تدريجي للأسواق (-4 احتقان)' },
          { governorateId: 'rif_dimashq', prri: -4, customSummaryAr: 'تغطية منحة الأسر الضعيفة بالريف (-4 احتقان)' }
        ]
      }
    ]
  }
];
