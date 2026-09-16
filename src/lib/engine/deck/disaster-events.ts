import type { EventCard } from '../types';

export const DISASTER_EVENTS: EventCard[] = [
  {
    id: 'event_46_coastal_mountain_wildfires',
    titleAr: 'حرائق الغابات الكارثية تلتهم جبال الساحل السوري',
    category: 'ENVIRONMENT',
    sourceAr: 'فوج إطفاء اللاذقية / مديرية الحراج بوزارة الزراعة',
    descriptionAr: 'أججت رياح الشلوق الجافة حرائق ضخمة متزامنة في أحراج صلنفة، كسب، ومشتى الحلو، محاصرة عشرات القرى السياحية وملتهمة أكثر من 30 ألف دونم من غابات الصنوبر وبساتين الزيتون المعمرة.',
    targetGovernorateId: 'latakia',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_wildfire_aerial_firefighting',
        labelAr: 'استئجار طائرات إطفاء روسية وإقليمية متخصصة لإخماد النيران جواً',
        descriptionAr: 'محاصرة ألسنة اللهب قبل وصولها لمنازل القرى وإنقاذ الرئة الخضراء لسورية.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $18M',
        costUSD: 18_000_000,
        costSYP: 1_000_000_000,
        costPC: 4,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 14,
        customEffectAr: 'إخماد الحرائق خلال 48 ساعة وإنقاذ القرى السياحية وحماية الغابات المعمرة (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'latakia', prri: -16, reconstructionScore: 8, customSummaryAr: 'إنقاذ غابات ومصايف صلنفة وكسب (-16 احتقان)' },
          { governorateId: 'tartus', prri: -12, customSummaryAr: 'إخماد نيران مشتى الحلو والدريكيش' }
        ]
      },
      {
        id: 'opt_wildfire_ground_volunteers',
        labelAr: 'الاعتماد على أفواج الإطفاء المحلية والجيش والمتطوعين براً',
        descriptionAr: 'مواجهة النيران بالوسائل اليدوية وخراطيم الصهاريج المتاحة دون استنزاف العملة الصعبة.',
        costUSD: 0,
        costSYP: 1_600_000_000,
        costPC: 8,
        effectTrust: 4,
        effectRRI: 6,
        effectCorruption: 0,
        effectCompetence: 4,
        customEffectAr: 'جهود بطولية للمتطوعين مع احتراق آلاف الدونمات وخسارة مواسم الزيتون للمزارعين',
        governorateEffects: [
          { governorateId: 'latakia', prri: 12, reconstructionScore: -6, customSummaryAr: 'خسارة مساحات واسعة من أحراج الساحل (+12 احتقان)' },
          { governorateId: 'tartus', prri: 8, customSummaryAr: 'تضرر بساتين زيتون طرطوس' }
        ]
      },
      {
        id: 'opt_wildfire_disaster_zone_replant',
        labelAr: 'إعلان الساحل منطقة منكوبة، وتجريم تجارة الفحم، وصرف تعويضات استصلاح',
        descriptionAr: 'منع تجار الأراضي ومافيا الفحم من الاستيلاء على الأحراج المحروقة وتمويل إعادة التشجير.',
        costUSD: 0,
        costSYP: 3_500_000_000,
        costPC: 10,
        effectTrust: 12,
        effectRRI: -8,
        effectCorruption: -10,
        effectCompetence: 12,
        customEffectAr: 'حماية الأراضي العامة من السماسرة وتقديم دعم مالي مباشر لأهالي القرى المتضررة',
        governorateEffects: [
          { governorateId: 'latakia', prri: -12, securityEfficacy: 8, customSummaryAr: 'حظر بيع أراضي الغابات المحروقة (+8 أمن)' },
          { governorateId: 'tartus', prri: -10, customSummaryAr: 'تعويض مزارعي الزيتون المتضررين' }
        ]
      }
    ]
  },
  {
    id: 'event_47_aleppo_post_earthquake_subsidence',
    titleAr: 'تصدعات أرضية وانهيار مبانٍ عشوائية في حلب وحماة',
    category: 'INFRASTRUCTURE',
    sourceAr: 'الشركة العامة للدراسات الهندسية / مجلس مدينة حلب',
    descriptionAr: 'تسببت الهبوطات الأرضية المتأخرة والارتشاح المائي في انهيار مبنيين سكنيين في حيي الشيخ مقصود والفردوس بحلب، وإنذار بإخلاء 30 ألف عائلة تسكن عشوائيات متصدعة آيلة للسقوط دون مأوى بديل.',
    targetGovernorateId: 'aleppo',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_earthquake_suburbs_construction',
        labelAr: 'بناء ضواحي سكنية سريعة مسبقة الصنع وإخلاء المباني الخطرة فوراً',
        descriptionAr: 'إنقاذ أرواح آلاف العائلات وتوفير مساكن حديثة لائقة بديلة عن رعب الانهيارات.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $40M',
        costUSD: 40_000_000,
        costSYP: 5_000_000_000,
        costPC: 6,
        effectTrust: 18,
        effectRRI: -14,
        effectCorruption: -4,
        effectCompetence: 16,
        customEffectAr: 'مشروع إسكاني تاريخي ينقذ الأرواح ويعيد تنظيم النسيج العمراني لمدينة حلب (+18 ثقة)',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 16, prri: -20, customSummaryAr: 'إنقاذ وإيواء عائلات عشوائيات حلب (+16 إعمار، -20 احتقان)' },
          { governorateId: 'hama', reconstructionScore: 6, customSummaryAr: 'تدعيم أبنية حماة المتصدعة' }
        ]
      },
      {
        id: 'opt_earthquake_concrete_shoring',
        labelAr: 'تنفيذ تدعيم هندسي خرساني موضعي للأعمدة والأساسات المتضررة',
        descriptionAr: 'حل ترقيعي هندسي منخفض التكلفة يمنع سقوط المباني دون نقل السكان من منازلهم.',
        costUSD: 0,
        costSYP: 2_800_000_000,
        costPC: 6,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: 0,
        effectCompetence: 8,
        customEffectAr: 'تأمين المباني مرحلياً وتفادي التشرد مع استمرار حاجة المنطقة لمعالجة جذرية',
        governorateEffects: [
          { governorateId: 'aleppo', reconstructionScore: 8, prri: -8, customSummaryAr: 'تدعيم أعمدة أحياء حلب الشرقية (+8 إعمار)' }
        ]
      },
      {
        id: 'opt_earthquake_rental_stipend',
        labelAr: 'صرف بدل إيجار نقدي مدة عام وإلزام السكان بالإخلاء الذاتي',
        descriptionAr: 'منح السكان مبالغ نقدية لاستئجار شقق في أحياء آمنة وإخلاء الأبنية فوراً لدرء الخطر.',
        costUSD: 0,
        costSYP: 3_500_000_000,
        costPC: 8,
        effectTrust: 6,
        effectRRI: -4,
        effectCorruption: 2,
        effectCompetence: 6,
        customEffectAr: 'تجنب سقوط الضحايا مع قفزة في أسعار إيجارات الشقق بمدينة حلب وتشتت العائلات',
        governorateEffects: [
          { governorateId: 'aleppo', prri: -6, customSummaryAr: 'إخلاء الأبنية الأكثر خطورة بحلب' }
        ]
      }
    ]
  },
  {
    id: 'event_48_barada_flash_floods',
    titleAr: 'طوفان مياه نهر بردى وسيول اليرموك تغمر ورشات ريف دمشق',
    category: 'ENVIRONMENT',
    sourceAr: 'محافظة ريف دمشق / الدفاع المدني',
    descriptionAr: 'هطلت أمطار طوفانية غير مسبوقة على جبال القلمون، ففاض مجرى بردى وسالت سيول جارفة في سبينة والحجر الأسود والقابون، غامرة مئات المنازل والورشات الحرفية بمياه الطمي والأوحال.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_flood_drainage_and_grants',
        labelAr: 'فتح قنوات تصريف الطوارئ وصرف تعويضات عاجلة للحرفيين والورش',
        descriptionAr: 'شفط مياه السيول وتنظيف الورش وتعويض الصناعيين الصغار لاستئناف أعمالهم سريعاً.',
        costUSD: 0,
        costSYP: 3_200_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -10,
        effectCorruption: -2,
        effectCompetence: 12,
        customEffectAr: 'تعافي المناطق الحرفية وإنقاذ مدخرات الحرفيين وأصحاب الورش المتضررة (-10 احتقان)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', prri: -14, reconstructionScore: 8, customSummaryAr: 'تعافي ورشات سبينة والقابون (-14 احتقان)' },
          { governorateId: 'damascus', prri: -8, customSummaryAr: 'تنظيف مجرى بردى بالعاصمة' }
        ]
      },
      {
        id: 'opt_flood_contain_machinery_only',
        labelAr: 'تحريك آليات الإسكان لفتح الطرق فقط دون دفع تعويضات مالية للمتضررين',
        descriptionAr: 'إزالة الطمي وفتح حركة المرور بأقل كلفة ممكنة وترك الحرفيين لترميم ورشهم بأنفسهم.',
        costUSD: 0,
        costSYP: 500_000_000,
        costPC: 6,
        effectTrust: -8,
        effectRRI: 10,
        effectCorruption: 0,
        effectCompetence: 4,
        customEffectAr: 'فتح الطرقات مع إفلاس عشرات صغار الحرفيين وتذمر شعبي من غياب التعويضات (+10 احتقان)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', prri: 12, customSummaryAr: 'خسائر حرفيي ريف دمشق (+12 احتقان)' }
        ]
      },
      {
        id: 'opt_barada_retaining_walls_engineering',
        labelAr: 'مشروع هندسي متكامل لتعميق مجرى النهر وبناء جدران استنادية وسدود حماية',
        descriptionAr: 'استثمار بنيوي استراتيجي يحمي دمشق وغوطتها من أي فيضانات كارثية للمئة عام القادمة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $14M',
        costUSD: 14_000_000,
        costSYP: 1_600_000_000,
        costPC: 6,
        effectTrust: 14,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 16,
        customEffectAr: 'تحصين عاصمة البلاد وقرى وادي بردى هندسياً ضد الكوارث المائية الطبيعية (+16 كفاءة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', reconstructionScore: 10, prri: -10, customSummaryAr: 'جدران استنادية وسدود مائية بالقلمون (+10 إعمار)' },
          { governorateId: 'damascus', reconstructionScore: 8, customSummaryAr: 'حماية دائمة لحوض دمشق من السيول' }
        ]
      }
    ]
  },
  {
    id: 'event_49_apamea_antiquities_looting',
    titleAr: 'نبش ونهب آثار موقع أفاميا وتدمر وتصديرها غير المشروع للغرب',
    category: 'SECURITY',
    sourceAr: 'المديرية العامة للآثار والمتاحف / الإنتربول الوطني',
    descriptionAr: 'رصدت كاميرات الاستطلاع حفريات ليلية سرية بجرافات ومعدات متطورة تنبش مدافن أفاميا الأثرية وتدمر، مع رصد شبكات تهريب دولية تنقل لوحات فسيفساء وتماثيل نادرة عبر الحدود لبيعها بملايين الدولارات.',
    targetGovernorateId: 'hama',
    triggerCondition: (state) => (state.governorates['hama']?.securityEfficacy ?? 50) < 70 || (state.governorates['homs']?.securityEfficacy ?? 50) < 70,
    options: [
      {
        id: 'opt_antiquities_armed_ranger_force',
        labelAr: 'تشكيل سرية هجانة وحراسة أثرية مسلحة مجهزة بطائرات مسيرة وكاميرات ليلية',
        descriptionAr: 'فرض حماية عسكرية صارمة للمواقع الحضارية والقبض على عصابات النهب بالجرم المشهود.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $12M',
        costUSD: 12_000_000,
        costSYP: 1_100_000_000,
        costPC: 8,
        effectTrust: 14,
        effectRRI: -6,
        effectCorruption: -12,
        effectCompetence: 14,
        customEffectAr: 'صيانة الإرث التاريخي السوري واستعادة مئات القطع الأثرية المنهوبة بنجاح (+14 ثقة)',
        governorateEffects: [
          { governorateId: 'hama', securityEfficacy: 14, prri: -6, customSummaryAr: 'تأمين كامل لموقع أفاميا وقلعة المضيق (+14 أمن)' },
          { governorateId: 'homs', securityEfficacy: 12, customSummaryAr: 'حراسة أعمدة ومدافن تدمر بالمسيرات' }
        ]
      },
      {
        id: 'opt_antiquities_unesco_diplomatic_push',
        labelAr: 'التنسيق مع اليونسكو والإنتربول الدولي لإيقاف المزادات وملاحقة المهربين بالخارج',
        descriptionAr: 'معركة قانونية دولية لاسترداد الآثار المهربة دون تكاليف عسكرية ميدانية إضافية.',
        costUSD: 0,
        costSYP: 400_000_000,
        costPC: 8,
        effectTrust: 8,
        effectRRI: -4,
        effectCorruption: -4,
        effectCompetence: 10,
        customEffectAr: 'استعادة بطيئة للقطع المهربة وضغط دبلوماسي على دور المزادات الغربية',
        governorateEffects: [
          { governorateId: 'damascus', securityEfficacy: 6, customSummaryAr: 'تفعيل ملفات الاسترداد الدولي عبر الخارجية' }
        ]
      },
      {
        id: 'opt_antiquities_tribal_custodianship',
        labelAr: 'إشراك شيوخ وعشائر البادية في حراسة المواقع الأثرية بمكافآت رسمية',
        descriptionAr: 'تحويل أبناء المنطقة إلى حراس للمواقع الأثرية ومشاركتهم في حماية تاريخ أرضهم.',
        costUSD: 0,
        costSYP: 900_000_000,
        costPC: 6,
        effectTrust: 12,
        effectRRI: -8,
        effectCorruption: -4,
        effectCompetence: 12,
        customEffectAr: 'بناء شراكة وطنية مع العشائر لحماية التاريخ ووقف 70% من النبش السري العشوائي',
        governorateEffects: [
          { governorateId: 'homs', tribalRageIndex: -15, securityEfficacy: 8, customSummaryAr: 'حراسة عشائرية لمواقع تدمر والبادية (-15 غضب عشائري)' },
          { governorateId: 'hama', securityEfficacy: 8, customSummaryAr: 'حماية أهالي ريف حماة لآثار أفاميا' }
        ]
      }
    ]
  },
  {
    id: 'event_50_ghouta_landfill_smog',
    titleAr: 'سحابة الدخان الكبريتي واشتعال مكبات النفايات العشوائية بالغوطة',
    category: 'ENVIRONMENT',
    sourceAr: 'مديرية صحة دمشق / محافظة ريف دمشق',
    descriptionAr: 'تراكمت آلاف أطنان النفايات الصلبة والطبية في مكبات عشوائية اشتعلت ذاتياً في دير العصافير وحرستا، ناشرة سحابة دخان كبريتي خانقة غطت سماء دمشق لأسبوعين وتسببت بآلاف حالات الاختناق والربو.',
    targetGovernorateId: 'rif_dimashq',
    triggerCondition: (state) => state.turnNumber >= 2,
    options: [
      {
        id: 'opt_waste_to_energy_plant',
        labelAr: 'إنشاء معمل تدوير نفايات وإنتاج طاقة حيوية (Waste-to-Energy) بريف دمشق',
        descriptionAr: 'حل بيئي صناعي متكامل ينهي مشكلة القمامة نهائياً ويولد 15 ميغاواط من الكهرباء النظيفة.',
        requirementsDescriptionAr: 'احتياطي نقد أجنبي >= $30M',
        costUSD: 30_000_000,
        costSYP: 2_500_000_000,
        costPC: 4,
        effectTrust: 16,
        effectRRI: -12,
        effectCorruption: -4,
        effectCompetence: 18,
        customEffectAr: 'إنهاء سحابة التلوث نهائياً وتوليد طاقة كهربائية مستدامة لضواحي العاصمة (+18 كفاءة)',
        governorateEffects: [
          { governorateId: 'rif_dimashq', reconstructionScore: 12, prri: -15, dailyBlackoutHours: -2, customSummaryAr: 'معمل تدوير حديث وتوليد كهرباء بالغوطة (+12 إعمار)' },
          { governorateId: 'damascus', activeHospitalsPct: 8, prri: -10, customSummaryAr: 'هواء نقي وإنهاء حالات الاختناق بالعاصمة' }
        ]
      },
      {
        id: 'opt_landfill_soil_smother',
        labelAr: 'طمر الحرائق بالتراب ونقل المكبات العشوائية لعمق البادية بالآليات',
        descriptionAr: 'إخماد الأدخنة الخانقة بسرعة وإبعاد مواقع تجميع القمامة عن المناطق السكنية.',
        costUSD: 0,
        costSYP: 1_800_000_000,
        costPC: 6,
        effectTrust: 8,
        effectRRI: -6,
        effectCorruption: 0,
        effectCompetence: 8,
        customEffectAr: 'زوال سحابة الدخان عن سماء دمشق وإنقاذ صحة المواطنين بحل طوارئ ميداني',
        governorateEffects: [
          { governorateId: 'rif_dimashq', prri: -8, customSummaryAr: 'إخماد مكبات حرستا ودير العصافير' },
          { governorateId: 'damascus', prri: -8, customSummaryAr: 'انقشاع سحابة الدخان عن العاصمة' }
        ]
      },
      {
        id: 'opt_cleanliness_levy_commercial',
        labelAr: 'فرض رسم نظافة بيئية إلزامية على فواتير المطاعم والمنشآت الصناعية',
        descriptionAr: 'تمويل أسطول سيارات القمامة والمكبات الصحية من خلال جباية مباشرة من الأنشطة الملوثة.',
        costUSD: 0,
        costSYP: -1_200_000_000,
        costPC: 8,
        effectTrust: 6,
        effectRRI: 4,
        effectCorruption: -4,
        effectCompetence: 10,
        customEffectAr: 'جباية 1.20B SP سنوياً لتمويل النظافة العامة مع تذمر أصحاب المطاعم والورش',
        governorateEffects: [
          { governorateId: 'damascus', prri: 4, customSummaryAr: 'احتجاج تجاري على رسم النظافة الجديد' },
          { governorateId: 'rif_dimashq', reconstructionScore: 4, customSummaryAr: 'تحديث آليات النظافة بالريف' }
        ]
      }
    ]
  }
];
