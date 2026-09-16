import type { EventCard } from '../types';

export const ENERGY_EVENTS: EventCard[] = [
  {
    id: 'event_09_aleppo_amperat',
    titleAr: 'إضراب كارتيل مولدات الأمبيرات الخاصة في أحياء حلب',
    category: 'ENERGY',
    sourceAr: 'محافظة حلب / غرفة صناعة حلب',
    descriptionAr: 'احتجاجاً على تسعيرة الكيلوواط المحددة حكومياً، أطفأ متعهدو المولدات محركاتهم في 80% من أحياء حلب الصناعية والسكنية، مهددين بشل معامل النسيج وغمر المدينة في ظلام دامس.',
    targetGovernorateId: 'aleppo',
    triggerCondition: (state) => (state.governorates['aleppo']?.dailyBlackoutHours ?? 12) > 10 || state.macro.dailyPowerHours < 12,
    options: [
      {
        id: 'opt_amperat_emergency_seizure',
        labelAr: 'مصادرة المولدات بقانون الطوارئ وتشغيلها بواسطة شركة الكهرباء',
        descriptionAr: 'وضع اليد على المولدات والوقود وتشغيلها بكوادر مديرية الكهرباء مع ملاحقة المتعهدين قضائياً.',
        costUSD: 0,
        costSYP: 4_500_000_000,
        costPC: 12,
        effectTrust: 8,
        effectRRI: -10,
        effectCorruption: -6,
        effectCompetence: 6,
        customEffectAr: 'كسر الكارتيل وإعادة التغذية فوراً (+8 ثقة) مع تحمل نفقات الصيانة والوقود',
        governorateEffects: [
          { governorateId: 'aleppo', prri: -14, dailyBlackoutHours: -4, securityEfficacy: 8, customSummaryAr: 'إعادة النور لأحياء حلب (-14 احتقان، -4 سا تقنين)' }
        ]
      },
      {
        id: 'opt_amperat_tariff_surrender',
        labelAr: 'الرضوخ ورفع التسعيرة النظامية لمطالب المتعهدين',
        descriptionAr: 'السماح برفع تعرفة الأمبيرات لتشجيعهم على تشغيل المولدات فوراً دون أعباء على الخزينة.',
        costUSD: 0,
        costSYP: 0,
        costPC: -8,
        effectTrust: -14,
        effectRRI: 14,
        effectCorruption: 10,
        effectCompetence: -6,
        customEffectAr: 'عودة الكهرباء خلال ساعات مع غضب شعبي عارم من غلاء الفواتير (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'aleppo', prri: 16, dailyBlackoutHours: -4, customSummaryAr: 'غلاء فواتير المولدات بحلب (+16 احتقان)' }
        ]
      },
      {
        id: 'opt_amperat_grid_priority',
        labelAr: 'تحويل خط تغذية استثنائي من محطة الزارة للمدينة الصناعية بحلب',
        descriptionAr: 'تغذية مصانع حلب من الشبكة العامة لكسر اعتمادها على المولدات مع اقتطاع الحصة من محافظات أخرى.',
        costUSD: 0,
        costSYP: 1_200_000_000,
        costPC: 8,
        effectTrust: -4,
        effectRRI: 6,
        effectCorruption: 0,
        effectCompetence: 8,
        customEffectAr: 'إنعاش معامل الشيخ نجار بحلب مع زيادة ساعات التقنين في حمص وريف دمشق',
        governorateEffects: [
          { governorateId: 'aleppo', dailyBlackoutHours: -6, reconstructionScore: 8, prri: -10, customSummaryAr: 'إنعاش مصانع حلب (-6 سا تقنين، +8 إعمار)' },
          { governorateId: 'homs', dailyBlackoutHours: 2, prri: 6, customSummaryAr: 'زيادة التقنين في حمص (+2 سا تقنين)' },
          { governorateId: 'rif_dimashq', dailyBlackoutHours: 2, prri: 6, customSummaryAr: 'زيادة التقنين بريف دمشق (+2 سا تقنين)' }
        ]
      }
    ]
  },
  {
    id: 'event_10_baniyas_refinery_fire',
    titleAr: 'حريق كارثي في وحدة التقطير الجوي بمصفاة بانياس النفطية',
    category: 'ENERGY',
    sourceAr: 'وزارة النفط والثروة المعدنية / فوج إطفاء طرطوس',
    descriptionAr: 'اندلع حريق هائل في مجمع التكرير بمدينة بانياس نتيجة تآكل خطوط التبريد القديمة، مما أوقف 60% من الطاقة التكريرية للبلاد فجأة وهدد بأزمة وقود خانقة لمحطات النقل والتدفئة.',
    targetGovernorateId: 'tartus',
    triggerCondition: (state) => state.turnNumber >= 3,
    options: [
      {
        id: 'opt_emergency_refined_imports',
        labelAr: 'استيراد مشتقات نفطية جاهزة فوراً عبر ناقلات بحرية إسعافية',
        descriptionAr: 'تفادي اختناق محطات الوقود وتأمين البنزين والمازوت بالدفع النقدي الفوري بالدولار.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $110M',
        costUSD: 110_000_000,
        costSYP: 0,
        costPC: 0,
        effectTrust: 8,
        effectRRI: -8,
        effectCorruption: -2,
        effectCompetence: 8,
        customEffectAr: 'منع الطوابير واستمرار حركة النقل والمخابز مع استنزاف الاحتياطي الأجنبي (-$110M)',
        governorateEffects: [
          { governorateId: 'tartus', prri: -6, customSummaryAr: 'إخماد الحريق وتطمين الأهالي (-6 احتقان)' },
          { governorateId: 'damascus', prri: -8, customSummaryAr: 'تأمين بنزين العاصمة دون انقطاع (-8 احتقان)' }
        ]
      },
      {
        id: 'opt_severe_fuel_rationing',
        labelAr: 'فرض خطة تقنين مشددة وخفض مخصصات الوقود بنسبة 50%',
        descriptionAr: 'تجميد مخصصات المركبات الخاصة وتخصيص الوقود المتبقي للمشافي والأفران وقوى الأمن فقط.',
        costUSD: 0,
        costSYP: 0,
        costPC: 16,
        effectTrust: -18,
        effectRRI: 20,
        effectCorruption: 12,
        effectCompetence: -4,
        customEffectAr: 'توفير العملة الصعبة بالكامل مع شلل قطاع النقل وتفجر السوق السوداء للمحروقات (+20 احتقان)',
        governorateEffects: [
          { governorateId: 'tartus', prri: 15, customSummaryAr: 'توقف حركة شاحنات المرفأ (+15 احتقان)' },
          { governorateId: 'damascus', prri: 18, customSummaryAr: 'شلل السير في العاصمة (+18 احتقان)' },
          { governorateId: 'homs', prri: 14, customSummaryAr: 'طوابير الكازيات في حمص (+14 احتقان)' }
        ]
      },
      {
        id: 'opt_express_rehabilitation_deal',
        labelAr: 'إبرام عقد صيانة وترميم إسعافي مع شركات هندسية إقليمية',
        descriptionAr: 'استقدام فرق هندسية متخصصة ومعدات توربينات جديدة لإعادة تشغيل المصفاة خلال 45 يوماً.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $40M',
        costUSD: 40_000_000,
        costSYP: 2_500_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'إصلاح بنيوي دائم للمصفاة واستعادة القدرة التكريرية الوطنية بأقل كلفة ممكنة',
        governorateEffects: [
          { governorateId: 'tartus', reconstructionScore: 10, prri: -10, customSummaryAr: 'ترميم وتحديث المصفاة (+10 إعمار، -10 احتقان)' },
          { governorateId: 'latakia', securityEfficacy: 6, customSummaryAr: 'حماية المنشآت الحيوية بالساحل (+6 أمن)' }
        ]
      }
    ]
  },
  {
    id: 'event_11_palmyra_gas_sabotage',
    titleAr: 'تخريب خط غاز محطات التوليد في عمق بادية تدمر',
    category: 'SECURITY',
    sourceAr: 'الفرقة 25 مهام خاصة / الشركة السورية للغاز',
    descriptionAr: 'تعرض خط نقل الغاز الحيوي المغذي لمحطتي دير علي وجندر لتفجير بعبوات ناسفة في بادية تدمر، مما أوقف تدفق 3.5 مليون متر مكعب يومياً وتسبب بسقوط أجزاء واسعة من المنظومة الكهربائية.',
    targetGovernorateId: 'homs',
    triggerCondition: (state) => (state.governorates['homs']?.securityEfficacy ?? 50) < 75 || state.turnNumber >= 4,
    options: [
      {
        id: 'opt_burn_heavy_fuel',
        labelAr: 'التحول الفوري لحرق الفيول الثقيل في العنفات الكهربائية',
        descriptionAr: 'تشغيل محطات التوليد بالوقود البديل لتفادي العتمة الشاملة مع تآكل عمر التوربينات وانبعاثات سامة.',
        costUSD: 0,
        costSYP: 2_000_000_000,
        costPC: 6,
        effectTrust: 4,
        effectRRI: -4,
        effectCorruption: 0,
        effectCompetence: 6,
        customEffectAr: 'تأمين الكهرباء بحدها الأدنى مع زيادة تآكل محطات التوليد وتلويث الهواء',
        governorateEffects: [
          { governorateId: 'homs', dailyBlackoutHours: 2, customSummaryAr: 'دخان وانبعاثات بمحيط جندر (+2 سا تقنين)' },
          { governorateId: 'rif_dimashq', dailyBlackoutHours: 1, customSummaryAr: 'تغذية دير علي بالفيول (+1 سا تقنين)' }
        ]
      },
      {
        id: 'opt_severe_rolling_blackouts',
        labelAr: 'تقنين كهربائي حاد (18 ساعة قطع) ريثما تكتمل الصيانة الميدانية',
        descriptionAr: 'حماية التوربينات من الفيول وإصلاح الخط بأيدي الورشات الوطنية تحت حراسة عسكرية.',
        costUSD: 0,
        costSYP: 900_000_000,
        costPC: 10,
        effectTrust: -14,
        effectRRI: 16,
        effectCorruption: 0,
        effectCompetence: 4,
        customEffectAr: 'صيانة آمنة للخط مع غضب واسع في العاصمة والمحافظات من انقطاع الكهرباء (+16 احتقان)',
        governorateEffects: [
          { governorateId: 'damascus', dailyBlackoutHours: 4, prri: 12, customSummaryAr: 'ظلام حاد بالعاصمة (+4 سا تقنين، +12 احتقان)' },
          { governorateId: 'homs', dailyBlackoutHours: 4, prri: 10, customSummaryAr: 'تقنين شديد في حمص (+4 سا تقنين)' }
        ]
      },
      {
        id: 'opt_badia_security_cordon',
        labelAr: 'نشر طائرات مسيرة وأفواج حراسة دائمة على طول أنابيب الغاز',
        descriptionAr: 'تأمين الحماية الفضائية والبرية للبادية لمنع تكرار الهجمات وتأمين حقول الفوسفات والغاز.',
        costUSD: 18_000_000,
        costSYP: 1_500_000_000,
        costPC: 12,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'تأمين دائم لشريان الطاقة الاستراتيجي ورفع كفاءة الأمن في البادية (+14 كفاءة)',
        governorateEffects: [
          { governorateId: 'homs', securityEfficacy: 14, prri: -8, customSummaryAr: 'إحكام السيطرة على بادية تدمر (+14 أمن)' },
          { governorateId: 'deir_ez_zor', securityEfficacy: 10, customSummaryAr: 'تأمين محور تدمر-دير الزور (+10 أمن)' }
        ]
      }
    ]
  },
  {
    id: 'event_12_solar_dust_storm',
    titleAr: 'عاصفة غبارية خماسينية وشلل مزارع الطاقة الكهروضوئية',
    category: 'INFRASTRUCTURE',
    sourceAr: 'المركز الوطني لبحوث الطاقة / الأرصاد الجوية',
    descriptionAr: 'ضربت عاصفة رملية غير مسبوقة حقول الطاقة الشمسية في عدرا وحسياء والبادية، مغطية الألواح بطبقة طينية كثيفة هوت بالإنتاج بنسبة 85% وتسببت باختلال تردد الشبكة الوطنية.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_solar_emergency_wash',
        labelAr: 'تسيير فرق تنظيف وصيانة ميكانيكية عاجلة للمزارع الشمسية',
        descriptionAr: 'توجيه صهاريج المياه والآليات لغسيل الألواح الشمسية واستعادة التوليد خلال 72 ساعة.',
        costUSD: 0,
        costSYP: 1_100_000_000,
        costPC: 4,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: -2,
        effectCompetence: 10,
        customEffectAr: 'استعادة التوليد الشمسي بسرعة وحماية استثمارات الطاقة البديلة (+10 كفاءة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', dailyBlackoutHours: -2, reconstructionScore: 4, customSummaryAr: 'استعادة إنتاج مزارع عدرا (-2 سا تقنين)' },
          { governorateId: 'homs', dailyBlackoutHours: -2, customSummaryAr: 'استعادة حقول حسياء الشمسية (-2 سا تقنين)' }
        ]
      },
      {
        id: 'opt_solar_investor_burden',
        labelAr: 'إلزام الشركات الاستثمارية الخاصة بتنظيف منشآتها على نفقتها',
        descriptionAr: 'رفض دفع نفقات عامة للمشاريع الاستثمارية الخاصة وتركهم يتحملون تكاليف العاصفة.',
        costUSD: 0,
        costSYP: 0,
        costPC: 6,
        effectTrust: -8,
        effectRRI: 8,
        effectCorruption: 0,
        effectCompetence: -4,
        customEffectAr: 'توفير المال العام مع تأخر عودة الكهرباء لأسابيع وتراجع ثقة المستثمرين بالطاقة البديلة',
        governorateEffects: [
          { governorateId: 'rif_dimashq', dailyBlackoutHours: 2, prri: 8, customSummaryAr: 'استمرار عتمة ضواحي دمشق (+2 سا تقنين)' }
        ]
      },
      {
        id: 'opt_regional_grid_swap',
        labelAr: 'تفعيل خط الربط الكهربائي الطارئ مع دول الجوار لسد العجز',
        descriptionAr: 'استجرار طاقة إسعافية جاهزة عبر خط الربط الإقليمي بالعملة الأجنبية للحفاظ على ثبات التردد.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $22M',
        costUSD: 22_000_000,
        costSYP: 0,
        costPC: 0,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -2,
        effectCompetence: 8,
        customEffectAr: 'استقرار تردد المنظومة الوطنية وتفادي انهيار الشبكة الشامل (+8 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', dailyBlackoutHours: -3, customSummaryAr: 'تغذية مستقرة للمنشآت الحيوية بالعاصمة' }
        ]
      }
    ]
  },
  {
    id: 'event_13_winter_diesel_freeze',
    titleAr: 'موجة صقيع قطبية ونفاد مخصصات مازوت التدفئة بالمحافظات',
    category: 'ENDOGENOUS',
    sourceAr: 'وزارة الإدارة المحلية والبيئة / جمعية حماية المستهلك',
    descriptionAr: 'ضربت موجة برد قارس البلاد مع تدني درجات الحرارة لما دون الصفر، بالتزامن مع عدم حصول 70% من العائلات على مخصصات التدفئة وتزايد حالات التسمم بدخان البلاستيك وقطع أشجار الغابات.',
    targetGovernorateId: 'homs',
    triggerCondition: (state) => state.season === 'H2_WINTER' || state.turnNumber % 2 === 0,
    options: [
      {
        id: 'opt_winter_fuel_diversion',
        labelAr: 'سحب مخصصات الديزل من الصناعة والنقل وتوزيعها مجاناً للعائلات',
        descriptionAr: 'إنقاذ حياة المواطنين والأطفال بالمناطق الجبلية وتوزيع مازوت الطوارئ على حساب الإنتاج الصناعي.',
        costUSD: 0,
        costSYP: 3_500_000_000,
        costPC: 10,
        effectTrust: 14,
        effectRRI: -16,
        effectCorruption: -4,
        effectCompetence: 6,
        customEffectAr: 'إنقاذ الأرواح وتخفيف واسع للمعاناة الإنسانية (+14 ثقة، -16 احتقان)',
        governorateEffects: [
          { governorateId: 'homs', prri: -18, customSummaryAr: 'تدفئة أرياف وقرى حمص الباردة (-18 احتقان)' },
          { governorateId: 'damascus', prri: -12, customSummaryAr: 'توزيع مازوت التدفئة بالأحياء الشعبية (-12 احتقان)' },
          { governorateId: 'aleppo', prri: -12, reconstructionScore: -4, customSummaryAr: 'تدفئة أهالي حلب مع تباطؤ مؤقت بالورش' }
        ]
      },
      {
        id: 'opt_winter_cash_handout',
        labelAr: 'صرف منحة تدفئة نقدية مقطوعة عبر الحسابات المصرفية',
        descriptionAr: 'تحويل 4,000 SP لكل رب أسرة ليشتري ما يحتاجه من السوق، دون المساس بوقود المصانع.',
        costUSD: 0,
        costSYP: 9_500_000_000,
        costPC: 4,
        effectTrust: 6,
        effectRRI: -8,
        effectCorruption: 4,
        effectCompetence: 4,
        customEffectAr: 'مساعدة نقدية سريعة مع قفزة في أسعار المازوت بالسوق السوداء وعجز إضافي بالخزينة',
        governorateEffects: [
          { governorateId: 'damascus', prri: -8, customSummaryAr: 'صرف المنحة النقدية بالعاصمة (-8 احتقان)' }
        ]
      },
      {
        id: 'opt_winter_firewood_import',
        labelAr: 'استيراد فحم حجري وحطب تدفئة معالج لحماية الغابات الطبيعية',
        descriptionAr: 'تأمين بدائل تدفئة صلبة مستوردة ومنع مجازر التحطيب الجائر في جبال الساحل والقلمون.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $16M',
        costUSD: 16_000_000,
        costSYP: 1_800_000_000,
        costPC: 4,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -2,
        effectCompetence: 10,
        customEffectAr: 'حماية الثروة الحرجية وتأمين وسيلة تدفئة رخيصة وآمنة للمناطق الريفية والجبلية',
        governorateEffects: [
          { governorateId: 'latakia', prri: -8, securityEfficacy: 6, customSummaryAr: 'حماية غابات كسب وصلنفة من الاحتطاب (-8 احتقان)' },
          { governorateId: 'rif_dimashq', prri: -8, customSummaryAr: 'توفير فحم التدفئة لجبال القلمون (-8 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_14_contaminated_fuel_boiler',
    titleAr: 'تلوث شحنة وقود الفيول وتخريب مراجل محطة توليد بانياس',
    category: 'INFRASTRUCTURE',
    sourceAr: 'الشركة العامة لتوليد الكهرباء / المفتشية العامة',
    descriptionAr: 'تسبب تفريغ شحنة فيول ملوثة عالية الرواسب والكبريت في انسداد حراقات المراجل وتلف أنابيب التبخير في محطة بانياس الحرارية، مما يهدد بتوقف المحطة عن العمل نهائياً.',
    targetGovernorateId: 'tartus',
    triggerCondition: (state) => state.macro.systemicCorruption > 30,
    options: [
      {
        id: 'opt_boiler_emergency_overhaul',
        labelAr: 'إيقاف المحطة واستبدال الأنابيب التالفة وقطع الغيار فوراً',
        descriptionAr: 'تحمل تكاليف الصيانة الدقيقة بالقطع الأصلية وتفريغ الخزانات من الوقود المغشوش لحماية العنفة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $28M',
        costUSD: 28_000_000,
        costSYP: 1_200_000_000,
        costPC: 4,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: -6,
        effectCompetence: 12,
        customEffectAr: 'حماية المحطة وإعادتها للعمل بكامل كفاءتها لعقد قادم (+12 كفاءة)',
        governorateEffects: [
          { governorateId: 'tartus', dailyBlackoutHours: -4, reconstructionScore: 8, customSummaryAr: 'صيانة كاملة لمحطة بانياس (-4 سا تقنين)' },
          { governorateId: 'latakia', dailyBlackoutHours: -3, customSummaryAr: 'استقرار كهرباء الساحل' }
        ]
      },
      {
        id: 'opt_boiler_continue_limp',
        labelAr: 'الاستمرار بالتشغيل بالوقود الملوث مع خفض الحمولة للنصف',
        descriptionAr: 'تفادي كلفة الاستيراد الفورية وتحمل تآكل عمر المحطة وتصاعد أعطال التوربينات المستمرة.',
        costUSD: 0,
        costSYP: 0,
        costPC: 8,
        effectTrust: -12,
        effectRRI: 14,
        effectCorruption: 8,
        effectCompetence: -10,
        customEffectAr: 'توفير التكاليف الفورية مع تدمير 35% من كفاءة المحطة وازدياد التقنين وتلوث البحر',
        governorateEffects: [
          { governorateId: 'tartus', dailyBlackoutHours: 4, prri: 12, customSummaryAr: 'أعطال مستمرة برصيف بانياس (+4 سا تقنين)' }
        ]
      },
      {
        id: 'opt_fuel_graft_purge',
        labelAr: 'عزل المدير العام ومصادرة كفالات المستورد وتطهير لجان الاستلام',
        descriptionAr: 'إحالة الفاسدين إلى المحاكمة ومصادرة أموالهم وتحصيل قيمة الضرر الحاصل لخزائن الدولة.',
        costUSD: 0,
        costSYP: -4_500_000_000,
        costPC: 16,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -18,
        effectCompetence: 10,
        customEffectAr: 'مصادرة 4.50B SP واستئصال شبكة فساد استيراد الفيول المغشوش (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'tartus', securityEfficacy: 10, prri: -8, customSummaryAr: 'تطهير إدارة ميناء ومصفاة بانياس (+10 أمن)' }
        ]
      }
    ]
  },
  {
    id: 'event_15_deir_ez_zor_pipeline_leak',
    titleAr: 'انفجار أنبوب نقل النفط الخام وتلوث أراضي دير الزور الزراعية',
    category: 'ENVIRONMENT',
    sourceAr: 'شركة الفرات للنفط / مجلس محافظة دير الزور',
    descriptionAr: 'أدى تصدع واهتراء أنبوب الضخ بين حقل التيم والمحطة T2 إلى انفجار تسربت منه آلاف أطنان النفط الخام، مهدداً بغمر القنوات المائية والأراضي الزراعية بالسموم النفطية.',
    targetGovernorateId: 'deir_ez_zor',
    triggerCondition: (state) => (state.governorates['deir_ez_zor']?.reconstructionScore ?? 50) < 65,
    options: [
      {
        id: 'opt_pipeline_comprehensive_fix',
        labelAr: 'استبدال المقطع المهترئ بالكامل وتطهير التربة الملوثة',
        descriptionAr: 'تنفيذ أعمال عزل متطورة وحماية مجرى نهر الفرات من الكارثة البيئية بتعاقد وطني.',
        costUSD: 8_000_000,
        costSYP: 3_500_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 12,
        customEffectAr: 'استئناف ضخ النفط بأمان وحماية الأراضي الزراعية والمياه من التلوث (+10 ثقة)',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', reconstructionScore: 8, prri: -12, securityEfficacy: 6, customSummaryAr: 'تطهير حقول دير الزور (-12 احتقان، +8 إعمار)' }
        ]
      },
      {
        id: 'opt_pipeline_patch_job',
        labelAr: 'إصلاح موضعي ترقيعي سريع دون تطهير الأراضي المحيطة',
        descriptionAr: 'لحام التصدع وإعادة الضخ بأقل كلفة ممكنة مع إهمال أضرار المزارعين العشائريين.',
        costUSD: 0,
        costSYP: 400_000_000,
        costPC: 6,
        effectTrust: -10,
        effectRRI: 14,
        effectCorruption: 4,
        effectCompetence: -6,
        customEffectAr: 'استئناف تدفق النفط مع غضب عشائري عارم واحتجاجات ضد تدمير محاصيلهم (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', prri: 18, tribalRageIndex: 15, customSummaryAr: 'غضب عشائر ريف دير الزور المتضررة (+18 احتقان، +15 غضب عشائري)' }
        ]
      },
      {
        id: 'opt_pipeline_farmer_restitution',
        labelAr: 'صرف تعويضات كوارث عادلة للمزارعين واستصلاح قنوات الري',
        descriptionAr: 'شراء ولاء الحاضنة الزراعية والعشائرية في الشرق وصيانة شبكات مياه الفرات.',
        costUSD: 0,
        costSYP: 2_200_000_000,
        costPC: 8,
        effectTrust: 8,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 8,
        customEffectAr: 'امتصاص غضب العشائر وكسب ولائها للدولة السورية (-10 احتقان)',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', prri: -14, tribalRageIndex: -15, customSummaryAr: 'رضا عشائري في وادي الفرات (-15 غضب عشائري)' }
        ]
      }
    ]
  },
  {
    id: 'event_16_arab_gas_pipeline',
    titleAr: 'مبادرة تفعيل خط الغاز العربي عبر الأردن ومصر',
    category: 'ENERGY',
    sourceAr: 'وزارة الخارجية / وزارة الطاقة والثروة المعدنية الأردنية',
    descriptionAr: 'عرض ائتلاف دولي-إقليمي ضخ 250 مليون قدم مكعب من الغاز الطبيعي يومياً لمحطات توليد الجنوب (دير علي وتشرين) عبر خط الغاز العربي، مقابل تسديد رسوم التوريد شهرياً بالدولار الأمريكي.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.macro.reservesUSD > 180_000_000,
    options: [
      {
        id: 'opt_gas_treaty_accept',
        labelAr: 'توقيع اتفاقية التوريد والالتزام بسداد فواتير الغاز بالدولار',
        descriptionAr: 'تأمين قفزة كبرى في توليد الكهرباء وإضافة 4 ساعات تغذية يومية للمحافظات الجنوبية والوسطى.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $45M',
        costUSD: 45_000_000,
        costSYP: 0,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -14,
        effectCorruption: -2,
        effectCompetence: 16,
        customEffectAr: 'زيادة ملموسة في ساعات الكهرباء الوطنية وإنعاش القطاعات الاقتصادية (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', dailyBlackoutHours: -4, prri: -12, customSummaryAr: 'قفزة بتغذية ريف دمشق (-4 سا تقنين)' },
          { governorateId: 'damascus', dailyBlackoutHours: -4, prri: -12, customSummaryAr: 'إنارة العاصمة دمشق (-4 سا تقنين)' },
          { governorateId: 'daraa', dailyBlackoutHours: -3, prri: -8, customSummaryAr: 'تحسن كهرباء حوران (-3 سا تقنين)' }
        ]
      },
      {
        id: 'opt_gas_barter_negotiation',
        labelAr: 'المطالبة بسداد الفاتورة بمقايضة الفوسفات والمنتجات الزراعية',
        descriptionAr: 'حماية احتياطي النقد الأجنبي الشحيح والتفاوض على سداد قيمة الغاز بصادرات عينية.',
        costUSD: 0,
        costSYP: 2_000_000_000,
        costPC: 12,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: 0,
        effectCompetence: 10,
        customEffectAr: 'حماية العملة الصعبة ومفاوضات إقليمية شاقة تستغرق وقتاً أطول قبل بدء التدفق',
        governorateEffects: [
          { governorateId: 'homs', reconstructionScore: 6, customSummaryAr: 'تشغيل مناجم الفوسفات للمقايضة (+6 إعمار)' }
        ]
      },
      {
        id: 'opt_gas_treaty_refuse',
        labelAr: 'رفض الاتفاقية والاعتماد الحصري على إنتاج حقول الغاز المحلية',
        descriptionAr: 'صيانة الاستقلال الاقتصادي وتجنب خلق التزامات دولارية خارجية باهظة على الخزينة.',
        costUSD: 0,
        costSYP: 0,
        costPC: -5,
        effectTrust: -6,
        effectRRI: 8,
        effectCorruption: 0,
        effectCompetence: -6,
        customEffectAr: 'توفير العملة الصعبة مع استمرار التقنين الكهربائي القائم وتذمر المواطنين من بطء الحلول',
        governorateEffects: [
          { governorateId: 'damascus', prri: 6, customSummaryAr: 'خيبة أمل بالعاصمة لضياع فرصة تحسين الكهرباء' }
        ]
      }
    ]
  }
];
