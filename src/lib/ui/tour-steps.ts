export type TourSide = 'top' | 'bottom' | 'center';

export interface TourStep {
  id: string;
  /** CSS selector of the element to spotlight. Omit for a centered card. */
  selector?: string;
  icon: string;
  badge: string;
  title: string;
  /** HTML body. <b> renders wheat-gold. Wrap every number/mixed token in <bdi>. */
  body: string;
  side: TourSide;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'mandate',
    icon: 'stone-throne',
    badge: 'الفصل 01 · المهمة',
    title: 'الغاية الاستراتيجية ومهمة الرئاسة',
    body:
      '<p class="lead">أنت رئيس الجمهورية في منعطف تاريخي حرج. قُد الدولة عبر <b><bdi>40</bdi> دوراً نصف سنوي</b> (الحصاد والشتاء، <bdi>2024 - 2044</bdi>) للحفاظ على وحدة التراب وبناء نهضة مستدامة.</p>' +
      '<ul><li>لا سياسة بلا ثمن: الأجور تمتص الاحتقان وتستنزف الخزينة، وتقليص الدعم يحمي الاحتياطي وقد يشعل الاحتجاجات.</li>' +
      '<li>النصر الأسمى (العنقاء السيادية): اصمد <bdi>40</bdi> دوراً، رصيد وطني <bdi>80+</bdi>، فساد دون <bdi>40%</bdi>، إعمار <bdi>65%+</bdi>، رافعة <bdi>50%+</bdi>، ديون بحد أقصى <bdi>$10B</bdi>، كهرباء <bdi>12+</bdi> ساعة، مع وفاق الجنوب.</li></ul>',
    side: 'center',
  },
  {
    id: 'treasury',
    selector: '[data-tour="treasury"]',
    icon: 'money-stack',
    badge: 'الفصل 02 · الشريط السيادي',
    title: 'الخزينة العامة واحتياطي النقد',
    body:
      '<p class="lead">عملتان لحربين مختلفتين:</p>' +
      '<ul><li>السيولة بـ<bdi>SP</bdi> للأجور والدعم والإنفاق المحلي.</li>' +
      '<li>الاحتياطي بالدولار للقمح والفيول ومستلزمات الإنتاج.</li>' +
      '<li>«مؤشر الأمان» يوضح الأشهر المتبقية قبل نفاد العملة الصعبة والوقوع في الإفلاس السيادي.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'capital',
    selector: '[data-tour="capital"]',
    icon: 'crown-coin',
    badge: 'الفصل 02 · الرصيد السياسي',
    title: 'اقتصاد الرصيد السياسي',
    body:
      '<p class="lead">يُستخدم لتمرير المراسيم والمشاريع (بالنقاط، بحد أقصى <bdi>200</bdi>).</p>' +
      '<ul><li>شحن مجاني: <b>جلسة مساءلة علنية كل دور (<bdi>+8</bdi>)</b>، خطاب الوحدة (<bdi>+4</bdi>).</li>' +
      '<li>شحن مدفوع: المنحة الشعبية (<bdi>+8</bdi> مقابل <bdi>7.50B SP</bdi>)، صندوق الكرامة (<bdi>+3</bdi>/دور)، دفعة الاستيراد (<bdi>+6</bdi> مقابل <bdi>$40M</bdi>).</li></ul>',
    side: 'bottom',
  },
  {
    id: 'reserves',
    selector: '[data-tour="reserves"]',
    icon: 'coins',
    badge: 'الفصل 02 · السيادة المالية',
    title: 'الاحتياطي والدين والرافعة السيادية',
    body:
      '<p class="lead">راقب الاحتياطي ($) والدين الخارجي (B):</p>' +
      '<ul><li>الاقتراض المفرط أو رهن الموانئ والفوسفات يخفض <b>الرافعة السيادية</b>.</li>' +
      '<li>السقوط يعني «إمارة مرهونة للشركات الأجنبية» — نهاية مئوية بحد ذاتها.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'fx-rate',
    selector: '[data-tour="fx-rate"]',
    icon: 'trade',
    badge: 'الفصل 02 · الاستقرار النقدي',
    title: 'السوق الموازي ومزاد التدخل',
    body:
      '<p class="lead">سعر الصرف والتضخم يعكسان القدرة الشرائية والأجر الحقيقي.</p>' +
      '<ul><li>فعّل <b>مزاد التدخل الدولاري</b> لضخ العملة الصعبة وكبح تدهور الصرف وامتصاص فائض السيولة.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'unrest',
    selector: '[data-tour="unrest"]',
    icon: 'flame',
    badge: 'الفصل 02 · النبض الشعبي',
    title: 'الثقة والفساد والاحتقان',
    body:
      '<p class="lead">الثقة والفساد والاحتقان الوطني (RRI) إنذارك المبكر:</p>' +
      '<ul class="legend"><li data-tone="good">الأخضر: استقرار وشرعية.</li>' +
      '<li data-tone="warn">الكهرماني: توتر يتطلب تدخلاً.</li>' +
      '<li data-tone="bad">الأحمر القاني: تمرد مسلح يهدد بعصيان شامل.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'map',
    selector: '[data-tour="map"]',
    icon: 'castle',
    badge: 'الفصل 03 · طاولة الرمل',
    title: 'خريطة المحافظات الـ 14',
    body:
      '<ul><li>ارتفاع الكتلة = منسوب الإعمار.</li>' +
      '<li>الأبراج الذهبية = استقرار الكهرباء (<bdi>12+</bdi> ساعة).</li>' +
      '<li>الأوتاد التحذيرية = حقول ألغام تُطوَّق بكاسحات الألغام.</li>' +
      '<li><b>انقر أي محافظة</b> لفتح ملفها الميداني.</li></ul>',
    side: 'center',
  },
  {
    id: 'decrees',
    selector: '[data-panel-btn="decrees"]',
    icon: 'scroll-quill',
    badge: 'الفصل 04 · مجلس الوزراء',
    title: 'المراسيم والوزارات',
    body:
      '<ul><li>سلالم الأجور والدعم السلعي ومزاد العملة.</li>' +
      '<li>ديوان المراسيم: هيئة مكافحة الفساد، استرداد الأملاك، وجلسات المساءلة الدورية المجانية.</li></ul>',
    side: 'top',
  },
  {
    id: 'tax',
    selector: '[data-panel-btn="tax"]',
    icon: 'abacus',
    badge: 'الفصل 04 · المالية والطاقة',
    title: 'المالية والكهرباء',
    body:
      '<ul><li>السياسة الضريبية والامتثال الجبائي.</li>' +
      '<li><b>استثمار شبكة الكهرباء (<bdi>$30M-$35M</bdi>/دور)</b> يرفع التغذية إلى <bdi>20-24</bdi> ساعة ويدعم المعامل والري — متفادياً كارثة الجفاف.</li></ul>',
    side: 'top',
  },
  {
    id: 'assets',
    selector: '[data-panel-btn="assets"]',
    icon: 'open-treasure-chest',
    badge: 'الفصل 04 · الأصول والسياسات',
    title: 'الأصول المصادرة والسياسات',
    body:
      '<ul><li>الأصول تُفتح في الدور الثالث: بتّ في الأملاك المصادرة.</li>' +
      '<li>لوحة السياسات للتوجهات الكبرى — بما فيها <b>ملف الجبهة الجنوبية</b>: الوفاق الشامل (<bdi>+18</bdi> اندماج) أو الحصار المشدد الذي يفجر الانفصال.</li></ul>',
    side: 'top',
  },
  {
    id: 'provincial',
    selector: '[data-panel-btn="provincial"]',
    icon: 'damaged-house',
    badge: 'الفصل 04 · التنمية الإقليمية',
    title: 'ملف المحافظة الميداني',
    body:
      '<ul><li>انقر محافظة على الخريطة أو هنا لفتح ملفها.</li>' +
      '<li>أطلق مشروعها الاستراتيجي (كالشيخ نجار بحلب أو سدود الفرات بالرقة)، وخصّص دفعة الطاقة، وأرسل كاسحات الألغام.</li></ul>',
    side: 'top',
  },
  {
    id: 'emergency',
    selector: '[data-panel-btn="emergency"]',
    icon: 'siren',
    badge: 'الفصل 04 · الطوارئ',
    title: 'غرفة إدارة الأزمات',
    body:
      '<ul><li>في مطلع كل دور قد تواجه أزمات قطاعية طارئة تتطلب تدخلاً رئاسياً حاسماً.</li>' +
      '<li>وازن بين التكلفة المالية والرصيد السياسي والثقة الشعبية.</li></ul>',
    side: 'top',
  },
  {
    id: 'stats',
    selector: '[data-tour="stats-panel"]',
    icon: 'chart',
    badge: 'الفصل 05 · غرفة التقارير',
    title: 'لوحة الإحصائيات الجانبية',
    body:
      '<ul><li>المؤشرات الكاملة للدولة: الموازنة، الطاقة، المحافظات، والمقارنات الدورية.</li>' +
      '<li>زر الإحصائيات في المنصة يفتحها ويغلقها في أي وقت.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'end-turn',
    selector: '[data-tour="end-turn"]',
    icon: 'hourglass',
    badge: 'الفصل 05 · المصادقة',
    title: 'المسودة وإنهاء الدور',
    body:
      '<ul><li>كل قرار يُحفظ في <b>مسودة مؤقتة</b> تراقب قيود الموازنة والرصيد لحظياً.</li>' +
      '<li>راجع الالتزامات ثم «إنهاء الدور والمصادقة» ليتقدم الزمن نصف عام.</li>' +
      '<li>مصيرك على بوصلة ثنائية: <bdi>5</bdi> نهايات مئوية كبرى، <bdi>3</bdi> مسارات للجنوب، و<bdi>5</bdi> خطوط انهيار فوري.</li></ul>',
    side: 'bottom',
  },
];
