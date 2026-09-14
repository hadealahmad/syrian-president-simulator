# 06. UI/UX & Player Comprehension Design (Nordic-RTS / Arabic Only)

## 1. Aesthetic Vision: Nordic-RTS Presidential Command Room

The interface of *President Game* utilizes a **tactile, minimalist Nordic-styled Real-Time Strategy (RTS) command environment** designed for clarity and functional discipline.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRESIDENTIAL RTS COMMAND DECK                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [الشريط السيادي العلوي] أرصدة النقد، السعر الموازي، الأجر، رأس المال، الاحتقان، الدور │
├──────────────┬───────────────────────────────────────────────┬──────────────┤
│ [حقائب الحكم]│ [العرض المكاني ثلاثي الأبعاد: خريطة سداسية لسوريا]            │ [إضبارة      │
│ • الطاقة     │ • 14 خلية سداسية ثلاثية الأبعاد (Hexagonal Grid)              │  المحافظة]   │
│ • الاقتصاد    │ • ارتفاع الخلية يعكس مستوى التنمية/الإعمار                     │ • اسم المحافظة│
│ • الكوارث    │ • لون الخلية يعكس مؤشر الاحتقان (أخضر إلى قرمزي مشتعل)        │ • مؤشر الاحتقان│
│ • الإدارة    │ • تظليل الظلام الكهربائي وشبكات الألغام اللوجستية               │ • ساعات الظلام│
│ • الإسكان     │ • مسارات التدفق الحركي للشاحنات والنفط (M5 والفرات)           │ • نسبة الألغام│
│ • المالية     ├───────────────────────────────────────────────┤ • المشاريع   │
│              │ [مفاتيح التبديل المكاني: الكهرباء | الألغام | الاحتقان | النقل] │ • قرارات محلية│
│ [مؤشر النفاد]│                                               │              │
│ [تنبيه عاجل] │                                               │              │
│ النقد ينفد   │                                               │              │
│ خلال 3 أدوار │                                               │              │
├──────────────┴───────────────────────────────────────────────┴──────────────┤
│ [شريط العمليات السفلي] [تراجع عن التعديل] [مسودة الموازنة] [اعتماد المراسيم وإنهاء الدور] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual & Technical Guidelines
* **Language Requirement:** **Arabic Only (واجهة باللغة العربية بالكامل)**. No English in player-facing gameplay elements.
* **Typography:** **Thmanyah Sans (خط ثمانية)** for all headers, narrative events, and numerical readouts.
* **Iconography:** Monochromatic clean line icons sourced from [icones.js.org](https://icones.js.org) (`lucide`, `ph`, and `tabler` sets).
* **Color Identity:**
  * **Forest Surfaces:** Deep Forest (`#002623`), Mid Forest (`#054239`), Accent Forest (`#428177`).
  * **Golden Wheat Accents:** Light Wheat (`#edebe0`) for text, Mid Wheat (`#b9a779`) for sovereign seal and borders, Dark Wheat (`#988561`) for secondary labels.
  * **Deep Umber Alerts:** Crimson Umber (`#6b1f2a`), Mid Umber (`#4a151e`), Deep Umber (`#260f14`) for danger and fail states.
  * **Charcoal Ground:** Deep Charcoal (`#161616`) canvas base, Mid Charcoal (`#3d3a3b`) for structural borders, Pure White (`#ffffff`) for extreme contrast highlights.
* **Zero Rounded Borders:** Strict `0px` border-radius (`rounded-none`) across all panels, buttons, cards, tags, and sliders.
* **Distinct Controls:** Toggles and interactive switches have a clear mechanical aesthetic distinct from passive numerical readouts.

---

## 2. Managing Cognitive Load: Progressive Disclosure

Balancing dual currencies, 14 governorates, 6 ministries, and dynamic feedback loops without overwhelming the player:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            هيكلية الإفصاح المتدرج                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  المستوى الأول: نظرة القائد السيادية (الشريط العلوي الثابت)                   │
│  • 6 مؤشرات حيوية لا تغيب عن الشاشة: الخزينة، النقد الأجنبي، سعر السوق،      │
│    الأجر الحقيقي، رأس المال السياسي، ومؤشر الاحتقان الوطني العام.             │
│                                      │                                      │
│                                      ▼                                      │
│  المستوى الثاني: لوحة الحقائب والمراسيم (الأدراج الجانبية التفاعلية)          │
│  • أشرطة التحكم بموازنات الوزارات، كفاءة الطواقم، ومراسيم المساءلة والإعمار.  │
│                                      │                                      │
│                                      ▼                                      │
│  المستوى الثالث: فاحص المحافظات المكاني (النقر على الخلايا السداسية)          │
│  • النقر على أي محافظة يوجه الكاميرا نحوها بسلاسة ويفتح بطاقتها التفصيلية:   │
│    ساعات التغذية، تلوث الألغام، أسباب الغضب المحلي، والمشاريع الجارية.        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The Sovereign Ledger Bar (الشريط السيادي العلوي)

Always pinned to the top of the viewport in Forest Deep (`#002623`) with a 1px Mid Charcoal border (`#3d3a3b`) and zero rounded corners:

| Component | Format & Example (Arabic) | Visual Feedback & Danger Cues |
| :--- | :--- | :--- |
| **SYP Treasury** | `4.20 تريليون ل.س (+1.2T)` | Green Accent (`#428177`) for surplus; Crimson (`#6b1f2a`) for deficit. |
| **FX Liquid Reserves** | `$320M دولار (تغطية 2.4 شهر)` | Amber/Wheat warning under 3 months; flashing Crimson (`#6b1f2a`) under 2 months. |
| **FX Street Rate** | `16,200 ل.س / $ (الفارق: +20%)` | Displays street rate and parallel premium over official Central Bank peg. |
| **Real Purchasing Power**| `$25.00 / شهريا (السلة: 21%)` | Average civil wage and percentage of survival food basket covered. |
| **Political Capital (PC)**| `الرصيد: 50 / 100` | Golden Wheat indicator bar (`#b9a779`). |
| **National Riot Risk** | `الاحتقان: 44 / 100 [متوتر]` | Forest Accent (0–39), Wheat Mid (40–64), Umber Mid (65–84), Umber Crimson (85+). |
| **Temporal Clock** | `الدور 01/40 | خريف/شتاء 2027` | Wheat badge indicating season (Harvest vs. Winter Fuel Stress). |

---

## 4. The 3D Hexagonal Spatial Map (Center Viewport)

The center of the screen features a 3D hexagonal representation of Syria in Three.js on a Deep Charcoal (`#161616`) canvas:
* **Governorate Cells:** 14 clickable hexagonal prism meshes matching the relative geographical positions of Syria's provinces.
* **Dynamic Column Height:** Extrusion height of each hexagon dynamically scales with local reconstruction progress, economic capital value, or grid capacity.
* **Dynamic Hexagon Color Shaders:**
  * Forest Accent (`#428177`): Calm ($PRRI < 40$).
  * Wheat Mid (`#b9a779`): Tense ($PRRI\ 40-64$).
  * Umber Mid (`#4a151e`): Civil Disobedience / Riot ($PRRI\ 65-84$).
  * Umber Crimson (`#6b1f2a`): Armed Revolt ($PRRI \ge 85$).
  * Charcoal Dimming (`#3d3a3b`): Heavy Electrical Blackouts ($> 18\text{ hrs/day}$).
* **Camera Framing:** Clicking a hexagonal cell smoothly centers and frames the province, opening its dossier in the right panel.

---

## 5. Predictive Decision Feedback as Probabilistic Ranges

To avoid confusing deterministic certainty with real-world economic volatility, all sliders display **probabilistic ranges**:

```
[مقبض التحكم: تعديل أجور موظفي الدولة]  ◄─── [  +20%  ] ───►  التكلفة: +600 مليار ل.س
┌─────────────────────────────────────────────────────────────────────────────┐
│ الأثر المتوقع للقرار (مجال احتمالي تقديري):                                 │
│ • التدفق النقدي بالليرة:      -600 مليار ل.س                                │
│ • فجوة التمويل بالعجز:       تتطلب إصدارا نقديا جديدا بقيمة 1.2 تريليون ل.س  │
│ • سعر الصرف الموازي المتوقع:  17,200 - 17,550 ل.س / دولار                   │
│ • متوسط الأجر الحقيقي الصافي: $26.80 - $28.10 / شهريا                       │
│ • مؤشر الاحتقان الوطني:       انخفاض متوقع بمقدار 2 إلى 4 نقاط              │
│ • معدل التضخم السنوي:         تسارع بنسبة تتراوح بين +4.0% و +5.8%          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. The Crisis Dossier (نافذة التوجيه الرئاسي الطارئ)

When an event triggers in Phase 4, the camera gently dims the 3D map, presenting a sharp, rectangular intelligence dossier in Forest Deep (`#002623`) with a 1px Golden Wheat border (`#b9a779`):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [تقرير استخباري رئاسي عاجل]                               الدور 05 / 2029   │
├─────────────────────────────────────────────────────────────────────────────┤
│ الحدث 05: أزمة الملاحة في باب المندب                                       │
│ المصدر: الهيئة البحرية الدولية / وزارة الاقتصاد والصناعة والتجارة            │
│                                                                             │
│ أدت الهجمات الصاروخية والاعتراضات البحرية في مضيق باب المندب إلى إجبار      │
│ كبرى شركات الشحن على الدوران حول إفريقيا. تأخرت الإمدادات إلى ميناء         │
│ اللاذقية بمقدار 22 يوما، وقفزت أجور الشحن الصناعي بنسبة 260%.                │
├─────────────────────────────────────────────────────────────────────────────┤
│ اختر التوجيه الرئاسي المعتمد:                                               │
│                                                                             │
│ [الخيار أ: دعم الدولة لأجور الشحن وتأمين مخاطر الحرب]                       │
│ المتطلبات: رصيد نقد أجنبي >= $95 مليون دولار (المتاح: $280M)                │
│ التكلفة: -95,000,000 دولار من الاحتياطي النقدي                              │
│ النتائج:                                                                    │
│   • استقرار سلاسل إمداد المصانع في حلب وعدرا وحماية الإنتاج الوطني           │
│   • حصر التضخم الاستهلاكي في حدود +4.5% فقط                                 │
│                                                                             │
│ [الخيار ب: تمرير التكاليف بالكامل إلى السوق (اقتصاد حر)]                     │
│ المتطلبات: لا يوجد                                                          │
│ التكلفة: $0 دولار                                                           │
│ النتائج:                                                                    │
│   • قفزة تضخمية بنسبة +18.2% في السلع الاستهلاكية وقطع الغيار               │
│   • توقف خطوط الإنتاج في المصانع وتراجع الناتج الصناعي بنسبة -24%           │
│   • ارتفاع مؤشر الاحتقان الشعبي العام بمقدار +11 نقطة                       │
│                                                                             │
│ [الخيار ج: إعادة التوجيه البري عبر موانئ الخليج والأردن]                      │
│ المتطلبات: رأس مال سياسي >= 25 | كفاءة الدولة >= 40                         │
│ التكلفة: -1.4 تريليون ل.س لتطوير ساحات المناولة بمعبر نصيب                   │
│ النتائج:                                                                    │
│   • اختصار زمن التوريد بمقدار 8 أيام وتعزيز التكامل اللوجستي الإقليمي        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. High-Level Semiannual Turn Audit Card (بطاقة المراجعة النصف سنوية)

Instead of dense multi-column accounting tables, the turn concludes with high-level, color-coded summary cards:

```
================================================================================
                     تقرير المراجعة الرئاسية: ختام الدور 01
================================================================================
[السيولة والأرصدة السيادية]
• صافي النقد الأجنبي (الدولار): $247,000,000 دولار (-$73M | تغطية 1.8 شهر - تنبيه خطر)
• صافي حركة الخزينة (الليرة): عجز بقيمة 1.20 تريليون ل.س (تمت تغطيته بالإصدار النقدي)
• السعر الموازي في السوق: ارتفع من 16,200 إلى 17,400 ل.س / دولار (+7.4%)
• متوسط الأجر الحقيقي للموظف: تحسن إلى $27.58 / شهريا

[حالة الخدمات والإنتاج]
• التوليد الكهربائي: ارتفع إلى 2,580 ميغاواط (+1.2 ساعة تغذية يومية إضافية)
• إزالة الألغام: تطهير 6% من أراضي حماة وحلب الزراعية قبل موسم القمح
• مؤشر الاحتقان العام (RRI): انخفض إلى 41 / 100 نقطة (استقرار نسبي)

[المسافة من الانهيارات الكبرى - هوامش الأمان]
• الإفلاس السيادي: 1.8 شهر يفصل عن نفاد الدولار [منطقة خطر]
• العصيان المدني: أعلى احتقان إقليمي هو 58 نقطة بحلب [مستقر]
• الانقلاب العسكري: أجر الجندي $27.58 (فوق حد الخطر البالغ $8.00) [مستقر]
• التفكك المناطقي: مؤشر انفصال السويداء 32% (تحت سقف الخطر 85%) [مستقر]
================================================================================
                 [الانتقال إلى الدور 02: النصف الثاني 2027 - ضغط وقود الشتاء]
```
