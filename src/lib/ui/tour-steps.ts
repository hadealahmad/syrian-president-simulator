import { INITIAL_YEAR, MAX_TURNS } from '../engine/constants';
import type { SectionId } from './shell/section-nav';

export type TourSide = 'top' | 'bottom' | 'center';

/** Calendar span the 40 half-year turns actually cover, derived from the engine. */
const SPAN_START = INITIAL_YEAR;
const SPAN_END = INITIAL_YEAR + Math.ceil(MAX_TURNS / 2) - 1;

export interface TourStep {
  id: string;
  /** CSS selector of the element to spotlight. Omit for a centered card. */
  selector?: string;
  /** Optional section + sub-tab to open while this step is active. */
  open?: { section: SectionId; subTab?: string };
  icon: string;
  badge: string;
  title: string;
  /** HTML body. <b> renders accent amber. Wrap every number/mixed token in <bdi>. */
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
      '<p class="lead">أنت رئيس الجمهورية في منعطف تاريخي حرج. قُد الدولة عبر <b><bdi>40</bdi> دوراً نصف سنوي</b> (الحصاد والشتاء، <bdi>' + SPAN_START + ' - ' + SPAN_END + '</bdi>) للحفاظ على وحدة التراب وبناء نهضة مستدامة.</p>' +
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
      '<li>كل خانة تعرض الرقم الحالي وتغيّر المسودة المتوقع قبل تثبيت الدور.</li></ul>',
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
      '<ul><li>شحن مجاني من <b>الحكم › المراسيم</b>: جلسة مساءلة علنية (<bdi>+8</bdi>)، خطاب الوحدة (<bdi>+4</bdi>).</li>' +
      '<li>شحن مدفوع من <b>الخزينة › الإنفاق</b>: المنحة الشعبية (<bdi>+8</bdi> مقابل <bdi>7.50B SP</bdi>)، صندوق الكرامة (<bdi>+3</bdi>/دور)، دفعة الاستيراد (<bdi>+6</bdi> مقابل <bdi>$40M</bdi>).</li></ul>',
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
      '<ul><li>الاقتراض المفرط أو رهن الموانئ والفوسفات من قسم <b>الدَّين</b> يخفض <b>الرافعة السيادية</b>.</li>' +
      '<li>السقوط يعني «إمارة مرهونة للشركات الأجنبية» — نهاية مئوية بحد ذاتها.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'fx-rate',
    selector: '[aria-label="مؤشرات أخرى"]',
    icon: 'trade',
    badge: 'الفصل 02 · الاستقرار النقدي',
    title: 'السوق الموازي ومؤشرات الدولة',
    body:
      '<p class="lead">سعر الصرف والتضخم يعكسان القدرة الشرائية والأجر الحقيقي.</p>' +
      '<ul><li>افتح <b>مؤشرات أخرى</b> من الشريط العلوي لمتابعة الدين والفساد وسعر السوق الموازي وبقية الأرقام.</li>' +
      '<li>فعّل <b>مزاد التدخل الدولاري</b> من <b>الخزينة › العملة</b> لكبح تدهور الصرف وامتصاص فائض السيولة.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'map',
    selector: '[data-tour="map"]',
    icon: 'castle',
    badge: 'الفصل 03 · طاولة العمليات',
    title: 'خريطة المحافظات الـ 14',
    body:
      '<ul><li>الأوضاع اللونية توضح مستوى الاحتقان أو الكهرباء أو الأضرار أو الألغام عبر أوضاع الخريطة.</li>' +
      '<li><b>انقر أي محافظة</b> لفتح ملفها الميداني وإطلاق مشاريعها.</li></ul>',
    side: 'center',
  },
  {
    id: 'provincial',
    selector: '[data-panel-btn="provincial"]',
    icon: 'damaged-house',
    badge: 'الفصل 04 · الخريطة',
    title: 'ملف المحافظة والتنمية الإقليمية',
    body:
      '<ul><li>قسم <b>الخريطة</b> يفتح ملف المحافظة المحددة على الخريطة.</li>' +
      '<li>أطلق مشروعها الاستراتيجي (كالشيخ نجار بحلب أو سدود الفرات بالرقة)، وخصّص دفعة الطاقة، وأرسل كاسحات الألغام، وأدر سياسة السويداء.</li></ul>',
    side: 'top',
  },
  {
    id: 'tax',
    selector: '[data-panel-btn="tax"]',
    icon: 'abacus',
    badge: 'الفصل 04 · الخزينة',
    title: 'الخزينة: الإيرادات والإنفاق والعملة',
    body:
      '<ul><li><b>الإيرادات:</b> الضرائب ورسوم الترانزيت وهامش الحوالات.</li>' +
      '<li><b>الإنفاق:</b> الأجور، دعم الخبز، القمح، استثمار الكهرباء (<bdi>$30M-$35M</bdi>/دور)، والمنح الاجتماعية.</li>' +
      '<li><b>العملة:</b> الإصدار النقدي وتغطية العجز أو مزاد الدولار.</li></ul>',
    side: 'top',
  },
  {
    id: 'emergency',
    selector: '[data-panel-btn="emergency"]',
    icon: 'scales',
    badge: 'الفصل 04 · الدَّين',
    title: 'الدَّين والتمويل الخارجي',
    body:
      '<ul><li><b>اقتراض:</b> القروض الخارجية، التسهيلات المشروطة، والرهون السيادية لتوفير سيولة دولارية طارئة.</li>' +
      '<li><b>سداد وتسوية:</b> السداد المبكر، فسخ القروض، أو قرارات التنصل من الديون.</li></ul>',
    side: 'top',
  },
  {
    id: 'decrees',
    selector: '[data-panel-btn="decrees"]',
    icon: 'scroll-quill',
    badge: 'الفصل 04 · الحكم',
    title: 'الحكم: المراسيم والمواقف والأصول',
    body:
      '<ul><li>يضم ثلاثة تبويبات في مكان واحد: <b>المراسيم</b>، <b>المواقف</b>، و<b>الأصول</b>.</li>' +
      '<li>رتّب القرارات السيادية والسياسات الإدارية والأمنية ومصير الأصول المصادرة قبل نهاية الدور.</li></ul>',
    side: 'top',
  },
  {
    id: 'governance-stances',
    selector: '[data-tour="subtab-policies"]',
    open: { section: 'decrees', subTab: 'stances' },
    icon: 'scroll-quill',
    badge: 'الفصل 04 · الحكم › المواقف',
    title: 'تبويب المواقف السيادية',
    body:
      '<ul><li>هنا تحدد مواقف الدولة من الوظيفة العامة، ومكافحة تهريب المحروقات، وحدود الجولان، وحالة الطوارئ.</li>' +
      '<li>كل موقف يظهر في صف واحد متقطع ومقارن بالكلفة والأثر المتوقع.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'governance-assets',
    selector: '[data-tour="subtab-assets"]',
    open: { section: 'decrees', subTab: 'assets' },
    icon: 'open-treasure-chest',
    badge: 'الفصل 04 · الحكم › الأصول',
    title: 'تبويب الأصول المصادرة',
    body:
      '<ul><li>تُفتح الأصول بدءاً من <b>الدور الثالث (<bdi>3</bdi>)</b> وتظهر شارة عددية عند وجود ملفات معلّقة.</li>' +
      '<li>بتّ في كل أصل بالتسوية أو التأميم أو التصفية الخارجية حسب حاجتك للنقد أو الرصيد.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'stats',
    selector: '[data-tour="stats-panel"]',
    open: { section: 'stats' },
    icon: 'chart',
    badge: 'الفصل 05 · التقارير',
    title: 'قسم التقارير والإحصائيات',
    body:
      '<ul><li>يجمع <b>المؤشرات</b>، <b>الحقائب الوزارية</b>، <b>اللجان</b>، و<b>جدول المحافظات</b> في شاشة واحدة.</li>' +
      '<li>انقر أي مؤشر في التقارير لتصفية الخيارات المرتبطة به والانتقال إليها مباشرة.</li></ul>',
    side: 'top',
  },
  {
    id: 'settings',
    selector: '[data-tour="settings-gear"]',
    icon: 'gear',
    badge: 'الفصل 05 · الإعدادات',
    title: 'الإعدادات ودليل البروتوكول',
    body:
      '<ul><li>زر الترس في الشريط العلوي يفتح قائمة الإعدادات: اللعبة الجديدة، المظهر، مؤثر CRT، أسهم النزوح، والصوت.</li>' +
      '<li>يمكنك إعادة تشغيل هذا الدليل أو قراءة صفحة «عن اللعبة» في أي وقت.</li></ul>',
    side: 'bottom',
  },
  {
    id: 'end-turn',
    selector: '[data-tour="end-turn"]',
    icon: 'hourglass',
    badge: 'الفصل 05 · قرارات هذا الدور',
    title: 'قرارات هذا الدور والمصادقة',
    body:
      '<ul><li>زر <b>إنهاء الدور</b> يفتح قائمة «قرارات هذا الدور» لمراجعة كل ما عدّلته عبر الأقسام الأربعة وإزالة أي بند بنقرة.</li>' +
      '<li>بعد التأكيد تصدر نتائج الدور ثم البرقيات العاجلة على الخريطة.</li></ul>',
    side: 'top',
  },
];
