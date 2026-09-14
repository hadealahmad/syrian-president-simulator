# 09. Arabic UI Taxonomy & Nordic-RTS Design System

## 1. Design Philosophy & Aesthetic Identity

*President Game* features an **Arabic-only, minimalist Nordic-styled Real-Time Strategy (RTS) command interface**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NORDIC-RTS UI DESIGN PILLARS                       │
├──────────────────────────────┬──────────────────────────────────────────────┤
│ 1. Minimalist Nordic Precision│ 2. Tactile RTS Command Deck                 │
│ * No visual noise or clutter │ * Spatial hexagonal 3D map at the center    │
│ * Zero rounded corners (0px) │ * Clean top resource ribbon                 │
│ * Deep Charcoal & Forest base│ * Bottom dock for actions and decrees       │
│ * Golden Wheat accents       │ * Collapsible situational drawers           │
├──────────────────────────────┼──────────────────────────────────────────────┤
│ 3. 100% Arabic Native UX     │ 4. Clear Cognitive Separation               │
│ * Full Right-to-Left (RTL)   │ * Toggles & switches visually distinct from │
│ * Thmanyah Sans (خط ثمانية) font  │   passive data gauges                       │
│ * Native Levant political &  │ * Dynamic predictive ranges on every slider │
│   economic terminology       │ * High-level color-coded cards              │
└──────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 2. Typography & Color Palette

### 2.1 Two-Tiered Typography Hierarchy (خط ثمانية الرسمي)
The game adopts the complete typography system from [Thmanyah (خط ثمانية)](https://font.thmanyah.com), establishing an authoritative separation between editorial headings and tactical data:

1. **Heading Version: Thmanyah Serif Display (`Thmanyah Serif Display`, `thmanyah serif display`)**
   * **Role:** Dedicated for all major section headings (`h1` - `h6`), drawer titles, crisis telex headers, modal banners, and 3D spatial map governorate labels.
   * **Weights Used:**
     * `Regular (400)` & `Medium (500)`: Section headers and drawer category banners.
     * `Bold (700)` & `Black (900)`: Sovereign decrees, presidential project dossiers, and centenary report titles.

2. **Body & Interface Version: Thmanyah Sans (`Thmanyah Sans`, `thmanyah sans`)**
   * **Role:** Dedicated for tactical body narrative, demographic figures, slider readouts, status pills, and micro-copy.
   * **Weights Used:**
     * `Light (300)` & `Regular (400)`: Narrative context, event descriptions, and budget breakdowns.
     * `Medium (500)` & `Bold (700)`: Interactive toggles, metric values, and currency ledgers.

### 2.2 Color Tokens & UI Role

| Group | Token Name | Hex Code | System & Emotional Role |
| :--- | :--- | :--- | :--- |
| **Forest** | `forest-accent` | `#428177` | Active indicators, stable surplus, positive growth |
| | `forest-mid` | `#054239` | Card containers, active tab backgrounds |
| | `forest-deep` | `#002623` | Primary panel backgrounds, top ribbon, bottom dock |
| **Golden Wheat** | `wheat-light` | `#edebe0` | Primary typography, high-contrast numbers |
| | `wheat-mid` | `#b9a779` | Sovereign authority, executive seal, focused borders |
| | `wheat-dark` | `#988561` | Secondary text, subtle card framing, muted labels |
| **Deep Umber** | `umber-crimson` | `#6b1f2a` | High alert, fail-state danger, armed revolt |
| | `umber-mid` | `#4a151e` | Warning containers, alert cards |
| | `umber-deep` | `#260f14` | Severe crisis container background |
| **Charcoal** | `charcoal-white` | `#ffffff` | Pure white highlight, peak contrast readouts |
| | `charcoal-mid` | `#3d3a3b` | Structural dividers, inactive borders |
| | `charcoal-deep` | `#161616` | Ground canvas behind the 3D hexagonal viewport |

---

## 3. Master Arabic Domain Taxonomy

All text in the game is strictly in Arabic. The official terminology glossary is defined below:

### 3.1 Sovereign Balances & Currencies (الموازنات والعملات)
* **Domestic Treasury:** `الخزينة العامة (ل.س)` — *Al-Khazeena Al-Aamah (SYP)*
* **Foreign Exchange Reserves:** `احتياطيات النقد الأجنبي (دولار)` — *Ihtiyatiyat An-Naqd Al-Ajnabi (USD)*
* **Money Supply ($M_2$):** `الكتلة النقدية المتداولة` — *Al-Kutlah An-Naqdiyyah Al-Mutadawalah*
* **Seigniorage (Money Printing):** `إصدار نقدي جديد (طباعة العملة)` — *Isdar Naqdi Jadeed*
* **Official Central Bank Rate:** `سعر الصرف الرسمي للمصرف المركزي`
* **Parallel Street Market Rate:** `سعر الصرف في السوق الموازي`
* **Real Purchasing Power:** `القدرة الشرائية الحقيقية`
* **Minimum Food Basket (MEB):** `تكلفة سلة البقاء المعيشية (٥ أفراد)`
* **Average Civil Service Wage:** `متوسط أجر القطاع العام`
* **Fiscal Runway Warning:** `مؤشر الاستدامة المالية: ينفد النقد خلال [X] أدوار`

### 3.2 Political & Stability Indicators (مؤشرات الاستقرار والسلطة)
* **Political Capital (PC):** `الرصيد السياسي التنفيذي`
* **Civic Trust:** `الثقة الشعبية بالحكومة`
* **Systemic Corruption:** `مستوى الفساد والتربح المؤسسي`
* **Riot Risk Index (RRI / PRRI):** `مؤشر احتمالية الشغب والاضطراب`
* **Sovereign Leverage:** `مستوى السيادة والاستقلال المالي`
* **Demographic Brain Drain:** `نزيف الكفاءات البشرية`

### 3.3 Executive Ministries (الحقائب الوزارية التنفيذية - النظام الرئاسي المباشر)
1. **Ministry of Energy:** `وزارة الطاقة` (الوزير: محمد البشير - دمج النفط، الكهرباء، الموارد المائية)
2. **Ministry of Economy & Industry:** `وزارة الاقتصاد والصناعة` (الوزير: د. نضال الشعار - دمج الصناعة، الاقتصاد، التجارة الداخلية)
3. **Ministry of Emergency & Disasters:** `وزارة الطوارئ والكوارث` (الوزير: رائد الصالح - الدفاع المدني وإعادة الإعمار)
4. **Ministry of Local Administration & Environment:** `وزارة الإدارة المحلية والبيئة` (الوزير: محمد عنجراني)
5. **Ministry of Public Works & Housing:** `وزارة الأشغال العامة والإسكان` (الوزير: مصطفى عبد الرزاق)
6. **Ministry of Finance:** `وزارة المالية` (الوزير: محمد يسر برنية)
7. **Ministry of Agriculture & Agrarian Reform:** `وزارة الزراعة والإصلاح الزراعي` (الوزير: باسل حافظ السويدان - المرسوم 98)
8. **Ministry of Information:** `وزارة الإعلام` (الوزير: خالد فواز زعرور - المرسوم 98)

### 3.4 Sovereign Presidential Bodies & Commissions (الهيئات واللجان السيادية التابعة لرئاسة الجمهورية)
1. **General Secretariat of the Presidency:** `الأمانة العامة لرئاسة الجمهورية` (الأمين العام: عبد الرحمن الأعمى - المرسوم 98)
2. **Central Commission for Inspection and Oversight:** `الهيئة المركزية للرقابة والتفتيش` (رئيس الهيئة: عامر نامس العلي)
3. **General Authority for Border Crossings, Ports & Customs:** `الهيئة العامة للمنافذ والجمارك والموانئ` (الرئيس: قتيبة أحمد بدوي / المعاون: خالد محمد البراد / مدير الموانئ: أحمد علي مصطفى)
4. **Committee for Service Extension and Senior Leadership:** `لجنة تمديد الخدمة والوظائف العامة` (رئيس اللجنة: وزير التنمية الإدارية محمد حسان سكاف)
5. **National Transitional Justice & Grievances Commission:** `هيئة العدالة الانتقالية وفحص المظالم` (رئيس الهيئة: وزير العدل مظهر الويس)

### 3.5 The 14 Governorates (المحافظات السورية الأربع عشرة)
1. `دمشق` (Damascus City)
2. `ريف دمشق` (Rif Dimashq)
3. `حلب` (Aleppo)
4. `حمص` (Homs)
5. `حماة` (Hama)
6. `إدلب` (Idlib)
7. `اللاذقية` (Latakia)
8. `طرطوس` (Tartus)
9. `درعا` (Daraa)
10. `السويداء` (As-Suwayda)
11. `القنيطرة` (Quneitra)
12. `دير الزور` (Deir ez-Zor)
13. `الرقة` (Ar-Raqqa)
14. `الحسكة` (Al-Hasakeh)

### 3.6 The Four Instant Fail States (الانهيارات السيادية الفورية)
1. **Sovereign Insolvency:** `الإفلاس المالي السيادي (نفاد النقد الأجنبي)`
2. **General Urban Insurrection:** `العصيان المدني العام (سقوط المدن في الفوضى)`
3. **Military & Security Mutiny:** `انقلاب وتمرد المؤسسة العسكرية والأمنية`
4. **Balkanization Cascade:** `تفكك الجمهورية إلى كانتونات متناحرة`

### 3.7 The Six 100-Year Endings (المصائر المئوية الكبرى - عام ٢١٢٦)
1. **Ending I:** `المارد السوري: نهضة النمر المشرقي المستقل`
2. **Ending II:** `المحمية المرهونة: دولة الامتيازات الأجنبية`
3. **Ending III:** `الجمهورية المفرغة: شتات ديموغرافي بلا كفاءات`
4. **Ending IV:** `الثغور الممزقة: كونفدرالية أمراء الحرب`
5. **Ending V:** `حزام الغبار: التصحر الزراعي واندثار الأحواض المائية`
6. **Ending VI:** `المعسكر المغلق: دولة القلعة والمراقبة الشاملة`

---

## 4. UI Iconography Mapping (icones.js.org)

To maintain a crisp, clean RTS look, icons are curated from standard open SVG line collections via **icones.js.org** (e.g. `lucide`, `ph`, `tabler`), rendered monochromatically:

| UI Entity | Recommended Icon Identifier | Visual Role |
| :--- | :--- | :--- |
| **SYP Treasury** | `lucide:coins` / `ph:coins-bold` | Domestic currency balance |
| **FX USD Reserves** | `lucide:banknote` / `ph:currency-dollar` | Hard foreign currency |
| **Political Capital** | `lucide:crown` / `ph:seal-check-bold` | Executive decree power |
| **National RRI** | `lucide:flame` / `ph:fire-bold` | Unrest and riot danger |
| **Power Grid** | `lucide:zap` / `ph:lightning-bold` | Electrical capacity and blackouts |
| **Landmines & UXO** | `lucide:alert-triangle` / `ph:warning-octagon-bold` | Minefield contamination |
| **Harvest Season (H1)**| `lucide:sun` / `ph:wheat-bold` | Spring/Summer agricultural cycle |
| **Winter Stress (H2)**| `lucide:snowflake` / `ph:snowflake-bold` | Autumn/Winter fuel stress cycle |
| **Provincial Node** | `lucide:hexagon` / `ph:hexagon-bold` | Governorate selection |
| **Decree Seal** | `lucide:stamp` / `ph:stamp-bold` | Execute turn confirmation |
| **Fiscal Runway** | `lucide:timer` / `ph:hourglass-medium-bold`| Burn rate countdown warning |

---

## 5. Screen Layout & Component Wireframes (Zero Rounded Corners)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       شريط السيادة العلوي (TOP RIBBON)                       │
│  [الدور: ٠١ / ٤٠]  [خريف/شتاء ٢٠٢٧]   [الرصيد السياسي: ٥٠]   [مؤشر الشغب: ٤٤] │
│  [الخزينة: ٤.٢٠ تريليون ل.س]  [الاحتياطي: ٣٢٠ مليون $ (٢.٤ شهر)]  [الموازي: ١٦,٢٠٠]│
├────────────────┬────────────────────────────────────────────┬──────────────┤
│                │                                            │              │
│  لوحة الحقائب  │        خريطة سوريا السداسية ثلاثية الأبعاد │  إضبارة       │
│  الوزارية      │                 (THREE.JS VIEWPORT)        │  المحافظة    │
│  (قابل للطي)   │                                            │  المحددة     │
│                │     [حلب]       [الرقة]       [الحسكة]     │              │
│  * الطاقة      │                                            │  * الاسم     │
│  * الاقتصاد     │   [إدلب]     [حماة]     [دير الزور]        │  * السكان    │
│  * الطوارئ     │                                            │  * الأضرار   │
│  * الإدارة     │      [اللاذقية]  [حمص]                     │  * الألغام   │
│  * الأشغال     │                                            │  * ساعات     │
│  * المالية     │         [طرطوس]   [ريف دمشق]               │    الكهرباء  │
│  * الزراعة     │                                            │  * مؤشر الشغب│
│  * الإعلام     │             [دمشق]                         │              │
│                │                                            │  [توجيه طارئ]│
│  [مفاتيح العرض]│         [القنيطرة]  [درعا]  [السويداء]    │              │
│                │                                            │              │
├────────────────┴────────────────────────────────────────────┴──────────────┤
│                       شريط القرارات والمصادقة التنفيذية                      │
│ [تعديل الأجور: +١٥%] [سحب العملة] [توجيه المهام] ◄── [الإنفاق: متوازن] ──► │
│  [مؤشر الاستدامة: الاحتياطي يكفي ٤ أدوار]          [مصادقة وإصدار المراسيم]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Micro-Interactions & Player Feedback

1. **Prediction Hover Cards (بطاقات التوقع الاحتمالي):**
   * Dragging any budget slider reveals a rectangular card with zero border-radius showing range projections:
     * `الأجر الحقيقي المتوقع: ٢٦.٥٠$ - ٢٧.٨٠$ / شهرياً`
     * `التضخم السنوي المتوقع: +٤.٥% - +٦.٠%`
2. **Turn Rehearsal (مسودة القرارات قبل الاعتماد):**
   * The player can freely test combinations of decrees and spending. Sliders highlight with a sharp Wheat Mid border (`#b9a779`) while in draft mode.
   * Clicking `إلغاء التعديلات` reverts to the start of the turn.
   * Clicking `مصادقة وإصدار المراسيم` permanently commits the turn.
3. **Card-Based Summaries (بطاقات النتائج الموجزة):**
   * Financial results are presented as high-level summary cards color-coded with Forest Accent (surplus) or Umber Crimson (deficit), avoiding dense spreadsheets while providing instant strategic clarity.
