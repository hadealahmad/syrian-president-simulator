import type { EventCard } from '../types';

export const SERVICES_EVENTS: EventCard[] = [
  {
    id: 'event_40_medical_staff_brain_drain',
    titleAr: 'موجة استقالات وهجرة الكوادر الطبية والتمريضية إلى الخليج',
    category: 'HEALTH',
    sourceAr: 'نقابة أطباء سورية / مشفى المواساة الجامعي',
    descriptionAr: 'قدم أكثر من 900 طبيب اختصاصي وممرض استقالاتهم بحثاً عن فرص عمل في الخليج وأوروبا، هرباً من تآكل الأجور والتضخم، مما يهدد بإغلاق أقسام العناية المشددة والعمليات الجراحية بالمشافي الحكومية.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => state.macro.civilServiceWageSYP < 2_500_000 || state.macro.annualInflationPct > 20,
    options: [
      {
        id: 'opt_doctor_special_wage_hike',
        labelAr: 'إقرار مرسوم تفرغ طبي استثنائي يرفع أجور المشافي 4 أضعاف',
        descriptionAr: 'منح بدلات تفرغ مجزية للأطباء والكوادر التمريضية لوقف نزيف العقول وحماية المستشفيات الوطنية.',
        costUSD: 0,
        costSYP: 450_000_000_000,
        costPC: 8,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -4,
        effectCompetence: 14,
        customEffectAr: 'بقاء 80% من الكوادر الطبية واستقرار العمليات الجراحية بالمشافي الجامعية (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'damascus', activeHospitalsPct: 15, prri: -12, customSummaryAr: 'استقرار مشافي المواساة والأسد بدمشق (+15 صحة)' },
          { governorateId: 'aleppo', activeHospitalsPct: 12, prri: -10, customSummaryAr: 'حماية كوادر مشفى حلب الجامعي (+12 صحة)' }
        ]
      },
      {
        id: 'opt_doctor_exit_visa_ban',
        labelAr: 'فرض خدمة إلزامية 5 سنوات وحظر منح إذن السفر للأطباء',
        descriptionAr: 'منع هجرة الأطباء الجدد بقوة القانون وإلزامهم بالخدمة في المشافي العامة قبل منح الترخيص.',
        costUSD: 0,
        costSYP: 0,
        costPC: 16,
        effectTrust: -18,
        effectRRI: 20,
        effectCorruption: 12,
        effectCompetence: -6,
        customEffectAr: 'بقاء قسري للكوادر مع احتقان عارم وتظاهرات طلاب كليات الطب وتسرب غير شرعي (+20 احتقان)',
        governorateEffects: [
          { governorateId: 'damascus', prri: 16, customSummaryAr: 'احتجاجات طلاب الطب بجامعة دمشق (+16 احتقان)' },
          { governorateId: 'aleppo', prri: 14, customSummaryAr: 'استياء واسع في مشافي حلب' }
        ]
      },
      {
        id: 'opt_diaspora_surgeons_contracts',
        labelAr: 'التعاقد مع أطباء سوريين مغتربين لإجراء عمليات دورية بالعملة الصعبة',
        descriptionAr: 'استقدام جراحين كبار أسبوعياً بالتعاقد المباشر لتدريب الكوادر وإجراء العمليات المعقدة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $14M',
        costUSD: 14_000_000,
        costSYP: 80_000_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -6,
        effectCorruption: -2,
        effectCompetence: 16,
        customEffectAr: 'رفع جودة الطبابة الوطنية والاستفادة من خبرات أبناء الوطن المغتربين عالمياً',
        governorateEffects: [
          { governorateId: 'damascus', activeHospitalsPct: 10, customSummaryAr: 'جراحات تخصصية متطورة بالعاصمة (+10 صحة)' },
          { governorateId: 'latakia', activeHospitalsPct: 8, customSummaryAr: 'تطوير مشفى تشرين الجامعي باللاذقية' }
        ]
      }
    ]
  },
  {
    id: 'event_41_aleppo_teachers_walkout',
    titleAr: 'إضراب معلمي ريف حلب عن التدريس بسبب تآكل الرواتب',
    category: 'EDUCATION',
    sourceAr: 'مديرية تربية حلب / نقابة المعلمين',
    descriptionAr: 'أغلقت عشرات المدارس الابتدائية والإعدادية أبوابها في السفيرة ودير حافر ومنبج بعد إضراب المعلمين عن الحضور، مؤكدين أن رواتبهم الشهرية لا تغطي حتى أجور المواصلات إلى بلدات التدريس.',
    targetGovernorateId: 'aleppo',
    triggerCondition: (state) => state.macro.civilServiceWageSYP < 2_800_000,
    options: [
      {
        id: 'opt_teachers_transport_stipend',
        labelAr: 'تأمين بولمانات نقل مجانية حكومية وصرف بدل انتقال ميداني',
        descriptionAr: 'حل معضلة النقل فوراً وإعادة فتح كافة المدارس وإنهاء الإضراب بكرامة المعلم.',
        costUSD: 0,
        costSYP: 220_000_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'عودة 60 ألف طالب لمقاعد الدراسة وانتظام التعليم بريف حلب (-10 احتقان)',
        governorateEffects: [
          { governorateId: 'aleppo', prri: -16, reconstructionScore: 6, customSummaryAr: 'فتح مدارس ريف حلب وعودة المعلمين (-16 احتقان)' },
          { governorateId: 'idlib', prri: -6, customSummaryAr: 'تأمين نقل معلمي ريف إدلب المحرر' }
        ]
      },
      {
        id: 'opt_substitute_graduates_scheme',
        labelAr: 'الاستعانة بخريجين جامعيين جدد ومتطوعين بنظام الوكالة والمكافأة',
        descriptionAr: 'كسر الإضراب بالكوادر الشابة البديلة بأقل تكلفة ممكنة على الموازنة العامة.',
        costUSD: 0,
        costSYP: 60_000_000_000,
        costPC: 8,
        effectTrust: -8,
        effectRRI: 8,
        effectCorruption: 4,
        effectCompetence: -6,
        customEffectAr: 'تشغيل المدارس جزئياً مع تراجع جودة التعليم وغضب الكوادر التعليمية الأصيلة',
        governorateEffects: [
          { governorateId: 'aleppo', prri: 10, customSummaryAr: 'تراجع كفاءة التدريس بريف حلب' }
        ]
      },
      {
        id: 'opt_double_shift_merge_schools',
        labelAr: 'دمج المدارس واعتماد نظام الفوجين (دوامين) في البلدات الكبرى',
        descriptionAr: 'تقليص عدد المدارس المفتوحة لتركيز الموارد والمعلمين المتوفرين دون نفقات إضافية.',
        costUSD: 0,
        costSYP: 0,
        costPC: 4,
        effectTrust: -12,
        effectRRI: 12,
        effectCorruption: 0,
        effectCompetence: -8,
        customEffectAr: 'توفير التكاليف مع اكتظاظ الشعب الصفية بـ 60 تلميذاً وتذمر أولياء الأمور (+12 احتقان)',
        governorateEffects: [
          { governorateId: 'aleppo', prri: 14, customSummaryAr: 'اكتظاظ فصول مدارس حلب (+14 احتقان)' }
        ]
      }
    ]
  },
  {
    id: 'event_42_cholera_outbreak',
    titleAr: 'تفشي وباء الكوليرا في حوض الفرات وتلوث مياه الشرب',
    category: 'HEALTH',
    sourceAr: 'منظمة الصحة العالمية (WHO) / مديرية صحة دير الزور',
    descriptionAr: 'سجلت المشافي مئات الإصابات الحادة بإسهالات الكوليرا في دير الزور والرقة نتيجة انخفاض منسوب مياه الفرات واختلاط منصرفات الصرف الصحي بقنوات الري الزراعية.',
    targetGovernorateId: 'deir_ez_zor',
    triggerCondition: (state) => (state.governorates['deir_ez_zor']?.activeHospitalsPct ?? 50) < 65 || state.turnNumber >= 3,
    options: [
      {
        id: 'opt_cholera_emergency_chlorination',
        labelAr: 'إعلان الطوارئ الصحية وتوزيع الكلور والأمصال الوريدية مجاناً',
        descriptionAr: 'محاصرة الوباء فوراً بتطهير شبكات المياه وتأمين الأدوية النوعية للمشافي والمراكز الميدانية.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $16M',
        costUSD: 16_000_000,
        costSYP: 120_000_000_000,
        costPC: 4,
        effectTrust: 16,
        effectRRI: -12,
        effectCorruption: -2,
        effectCompetence: 16,
        customEffectAr: 'محاصرة الوباء وإنقاذ حياة آلاف الأطفال وتطهير مياه حوض الفرات (+16 ثقة)',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', activeHospitalsPct: 15, prri: -15, customSummaryAr: 'محاصرة الكوليرا بدير الزور (+15 صحة، -15 احتقان)' },
          { governorateId: 'raqqa', activeHospitalsPct: 12, prri: -10, customSummaryAr: 'تأمين محطات مياه الرقة بالكلور' }
        ]
      },
      {
        id: 'opt_destroy_contaminated_leafy_crops',
        labelAr: 'إتلاف حقول الخضروات المروية بمياه الصرف الصحي بقوة الشرطة',
        descriptionAr: 'قطع سلاسل نقل البكتيريا ومنع بيع الخس والنعناع الملوث بأسواق المدن مع تعويض جزئي.',
        costUSD: 0,
        costSYP: 220_000_000_000,
        costPC: 10,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -4,
        effectCompetence: 10,
        customEffectAr: 'وقف تفشي العدوى إلى دمشق وحلب مع تذمر مزارعي الخضار بالمنطقة الشرقية',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', prri: -6, reconstructionScore: -4, customSummaryAr: 'إتلاف المحاصيل الملوثة وتعويض الفلاحين' },
          { governorateId: 'damascus', prri: -6, activeHospitalsPct: 4, customSummaryAr: 'حماية أسواق العاصمة من الخضار الملوثة' }
        ]
      },
      {
        id: 'opt_awareness_only_hands_off',
        labelAr: 'اقتصار التدخل على حملات توعية إعلامية دون نفقات مالية',
        descriptionAr: 'مطالبة المواطنين بغلي المياه والامتناع عن شراء الخضار دون تقديم أدوية أو تطهير للشبكة.',
        costUSD: 0,
        costSYP: 20_000_000_000,
        costPC: 6,
        effectTrust: -18,
        effectRRI: 22,
        effectCorruption: 0,
        effectCompetence: -14,
        customEffectAr: 'انفجار الوباء ووصوله إلى حمص ودمشق وتكدس المشافي بالضحايا (+22 احتقان كارثي)',
        governorateEffects: [
          { governorateId: 'deir_ez_zor', activeHospitalsPct: -15, prri: 25, customSummaryAr: 'انهيار طاقة مشافي دير الزور الاستيعابية' },
          { governorateId: 'raqqa', activeHospitalsPct: -12, prri: 20, customSummaryAr: 'تفشي واسع للوباء بالرقة' }
        ]
      }
    ]
  },
  {
    id: 'event_43_exam_paper_leak',
    titleAr: 'فضيحة تسريب أسئلة الشهادة الثانوية العامة (البكالوريا)',
    category: 'EDUCATION',
    sourceAr: 'وزارة التربية / فرع الأمن الجنائي بدمشق',
    descriptionAr: 'تسربت أسئلة مادتي الرياضيات والفيزياء للشهادة الثانوية العامة عبر قنوات سرية قبل موعد الامتحان بساعات، وسط اتهامات لشبكة من المتنفذين ببيعها، مما أثار غضب 250 ألف عائلة سورية.',
    targetGovernorateId: 'damascus',
    triggerCondition: (state) => state.macro.systemicCorruption > 30,
    options: [
      {
        id: 'opt_exam_cancel_retest',
        labelAr: 'إلغاء الدورة وإعادة الامتحان بأسئلة احتياطية وإحالة المتورطين للقضاء',
        descriptionAr: 'حماية سمعة ومصداقية الشهادة العلمية السورية وتحمل تكاليف الطباعة والتأمين الأمني الجديد.',
        costUSD: 0,
        costSYP: 180_000_000_000,
        costPC: 14,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -14,
        effectCompetence: 12,
        customEffectAr: 'إنقاذ النزاهة العلمية للتعليم السوري ومعاقبة الفاسدين بحزم (+14 ثقة، -14 فساد)',
        governorateEffects: [
          { governorateId: 'damascus', prri: -10, securityEfficacy: 8, customSummaryAr: 'محاكمة شبكة تسريب الامتحانات بالعاصمة' },
          { governorateId: 'aleppo', prri: -6, customSummaryAr: 'ارتياح أولياء أمور طلبة حلب' }
        ]
      },
      {
        id: 'opt_exam_hush_pass_it',
        labelAr: 'التغاضي عن التسريب ومعاقبة الطلاب المضبوطين فقط داخل القاعات',
        descriptionAr: 'تفادي كلفة الإعادة المالية وضغط الوقت، على حساب نزاهة الامتحانات وثقة المجتمع.',
        costUSD: 0,
        costSYP: 0,
        costPC: -8,
        effectTrust: -18,
        effectRRI: 18,
        effectCorruption: 14,
        effectCompetence: -12,
        customEffectAr: 'فضيحة مدوية وضرب الاعتراف الدولي بالشهادة السورية وغضب عارم للأسر الشريفة (+18 احتقان)',
        governorateEffects: [
          { governorateId: 'damascus', prri: 18, customSummaryAr: 'تظاهرات واحتجاج أهالي الطلاب بدمشق' }
        ]
      },
      {
        id: 'opt_exam_digital_encryption',
        labelAr: 'التحول الشامل لطباعة الأسئلة المشفرة وسحبها قبل دقائق عبر الإنترنت الفضائي',
        descriptionAr: 'تحديث تقني جذري يقضي على إمكانية التسريب الورقي في المراكز لجميع الدورات القادمة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $12M',
        costUSD: 12_000_000,
        costSYP: 80_000_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -6,
        effectCorruption: -10,
        effectCompetence: 16,
        customEffectAr: 'رقمنة المنظومة الامتحانية وتأمين أسئلة الشهادات بتقنيات التشفير الحديثة',
        governorateEffects: [
          { governorateId: 'damascus', reconstructionScore: 6, customSummaryAr: 'أتمتة دائرة الامتحانات بدمشق' },
          { governorateId: 'homs', reconstructionScore: 4, customSummaryAr: 'تأمين الاتصال الفضائي لمراكز حمص' }
        ]
      }
    ]
  },
  {
    id: 'event_44_hospital_scanners_breakdown',
    titleAr: 'تعطل أجهزة الرنين المغناطيسي والطبقي المحوري بالمشافي العامة',
    category: 'HEALTH',
    sourceAr: 'الهيئة العامة لمشفى تشرين الجامعي / وزارة الصحة',
    descriptionAr: 'توقفت 16 منظومة تصوير طبقي محوري ورنين مغناطيسي في المشافي الوطنية بدمشق، حلب، واللاذقية بسبب نقص قطع الغيار الأوروبية، واضطرار آلاف المرضى للجوء للمراكز الخاصة بأسعار فلكية.',
    targetGovernorateId: 'latakia',
    triggerCondition: (state) => state.macro.reservesUSD < 450_000_000 || (state.governorates['latakia']?.activeHospitalsPct ?? 50) < 70,
    options: [
      {
        id: 'opt_scanners_original_parts_import',
        labelAr: 'استيراد أنابيب أشعة وقطع غيار أصلية عبر شركات وسيطة فوراً',
        descriptionAr: 'إنقاذ حياة مرضى الأورام والحوادث وإعادة تشغيل الأجهزة بالمجان في المشافي الحكومية.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $22M',
        costUSD: 22_000_000,
        costSYP: 60_000_000_000,
        costPC: 4,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 14,
        customEffectAr: 'إعادة الخدمة التشخيصية المجانية لـ 200 ألف مريض فقير سنوياً (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'latakia', activeHospitalsPct: 15, prri: -12, customSummaryAr: 'تشغيل مرنان مشفى تشرين باللاذقية (+15 صحة)' },
          { governorateId: 'damascus', activeHospitalsPct: 12, prri: -8, customSummaryAr: 'صيانة طبقي مشفى المجتهد بدمشق' },
          { governorateId: 'aleppo', activeHospitalsPct: 10, prri: -8, customSummaryAr: 'إصلاح أجهزة مشفى الرازي بحلب' }
        ]
      },
      {
        id: 'opt_scanners_private_clinic_vouchers',
        labelAr: 'التعاقد مع المراكز الخاصة لتصوير المرضى بنفقات مدعومة جزئياً',
        descriptionAr: 'حل إسعافي يتقاسم تكلفة التصوير بين الدولة والمريض دون شراء قطع غيار جديدة.',
        costUSD: 0,
        costSYP: 320_000_000_000,
        costPC: 6,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: 4,
        effectCompetence: 6,
        customEffectAr: 'تأمين التصوير لحالات الطوارئ مع استنزاف مالي مستمر وتذمر الفقراء من التكاليف المتبقية',
        governorateEffects: [
          { governorateId: 'damascus', activeHospitalsPct: 6, prri: -4, customSummaryAr: 'تغطية جزئية لمرضى العاصمة' }
        ]
      },
      {
        id: 'opt_scanners_chinese_aid_package',
        labelAr: 'قبول حزمة تجهيزات طبية بديلة من خط الائتمان الصيني',
        descriptionAr: 'إدخال أجهزة تشخيص حديثة مع عقود صيانة وتدريب أطباء الأشعة على البرمجيات الصينية.',
        costUSD: 8_000_000,
        costSYP: 110_000_000_000,
        costPC: 6,
        effectTrust: 10,
        effectRRI: -6,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'تحديث الحظيرة الطبية الوطنية ببدائل صديقة ومستدامة وبأقل تكلفة من السوق الغربي',
        governorateEffects: [
          { governorateId: 'latakia', activeHospitalsPct: 10, customSummaryAr: 'تركيب أجهزة الرنين الصينية بالساحل (+10 صحة)' },
          { governorateId: 'homs', activeHospitalsPct: 8, customSummaryAr: 'تحديث أجهزة مشفى الباسل بحمص' }
        ]
      }
    ]
  },
  {
    id: 'event_45_historic_school_collapse',
    titleAr: 'انهيار سقف مدرسة أثرية في حلب القديمة وسقوط ضحايا من التلاميذ',
    category: 'INFRASTRUCTURE',
    sourceAr: 'مديرية الدفاع المدني بحلب / مديرية الآثار والمتاحف',
    descriptionAr: 'تسبب هطول مطري غزير مع تصدعات الحرب غير المرممة بانهيار أروقة وسقف مدرسة ابتدائية مأهولة في باب النيرب بحلب القديمة، مما أسفر عن ضحايا بين الأطفال وتفجر غضب شعبي ضد إهمال الترميم.',
    targetGovernorateId: 'aleppo',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_schools_structural_retrofitting',
        labelAr: 'إطلاق صندوق طوارئ وطني لتدعيم وترميم 250 مدرسة متصدعة بحلب',
        descriptionAr: 'تأمين سلامة المدارس وفحص المباني التعليمية بأيدي نقابة المهندسين لمنع تكرار الكارثة.',
        costUSD: 0,
        costSYP: 420_000_000_000,
        costPC: 8,
        effectTrust: 14,
        effectRRI: -12,
        effectCorruption: -4,
        effectCompetence: 12,
        customEffectAr: 'حماية أرواح آلاف الأطفال وتشغيل شركات المقاولات والترميم المحلية (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 10, prri: -16, customSummaryAr: 'تدعيم وترميم مدارس حلب القديمة (+10 إعمار، -16 احتقان)' }
        ]
      },
      {
        id: 'opt_schools_prefab_evacuation',
        labelAr: 'إخلاء المدارس المتصدعة ونقل التلاميذ لغرف صفية مسبقة الصنع',
        descriptionAr: 'إجراء وقائي سريع يمنع سقوط ضحايا جدد مع توفير بيئة صفية متواضعة للطلاب.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $10M',
        costUSD: 10_000_000,
        costSYP: 90_000_000_000,
        costPC: 4,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: -2,
        effectCompetence: 10,
        customEffectAr: 'حماية أرواح الطلاب بسرعة وحل مشكلة الإيواء التعليمي المؤقت',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 6, prri: -8, customSummaryAr: 'نصب كرفانات مدرسية حديثة بحلب' }
        ]
      },
      {
        id: 'opt_schools_dismiss_mayor',
        labelAr: 'إقالة رئيس مجلس المدينة وتحميله المسؤولية دون تخصيص تمويل إضافي',
        descriptionAr: 'امتصاص الغضب اللحظي بإجراء إداري زجري دون رصد موازنة كافية لمعالجة التصدعات.',
        costUSD: 0,
        costSYP: 0,
        costPC: 6,
        effectTrust: -10,
        effectRRI: 14,
        effectCorruption: 2,
        effectCompetence: -8,
        customEffectAr: 'تهدئة شكلية قصيرة مع بقاء عشرات المدارس آيلة للسقوط وخطر انهيارات جديدة (+14 احتقان)',
        governorateEffects: [
          { governorateId: 'aleppo', prri: 14, reconstructionScore: -4, customSummaryAr: 'خوف أولياء الأمور واستمرار خطر المدارس المتصدعة' }
        ]
      }
    ]
  }
];
