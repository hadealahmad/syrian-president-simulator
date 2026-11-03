# UI concept mockups — design brief (read fully)

You are building a **clickable visual mockup** (NOT a working game) of a new UI concept for "محاكي الرئيس السوري" (Syrian President Simulator), a turn-based political/economic strategy game set in post-2024 Syria. Arabic, RTL. The point is to let the project owner SEE and FEEL the concept in a browser at desktop and phone sizes and pick a direction. Visual quality and game feel matter most. Logic is fake.

The current game UI (for reference only, do not copy its layout): a dense two-row spreadsheet-like stats ribbon (10 numbers), a big map of the 14 governorates with 4–5 tiny icons per province, a bottom dock of 7 square buttons that open a centered scrolling list of text cards, and a "rotate your phone" blocker in portrait. Problems: it reads like a dashboard, not a game; too much text; tiny touch targets; portrait phones blocked; landscape phones lose ~40% of height to chrome.

## Deliverable
Exactly ONE self-contained HTML file: the path is given in your concept section. Inline all CSS and JS in that file. Allowed external resources ONLY:
- `/concepts/shared/game-data.js` (already exists — DO NOT edit it). It sets `window.GAME` with REAL game data: `GAME.macro` (treasurySYP, reservesUSD, parallelRateSYP, politicalCapital, civicTrust, nationalRRI, systemicCorruption, sovereignDebtUSD, taxCompliancePct, civilServiceWageSYP, gridCapacityMW, annualInflationPct …), `GAME.governorates[]` (id, nameAr, path = SVG path in viewBox `GAME.viewBox` "0 0 1000 880", center [x,y], prri 0-100 unrest, tier, population, dailyPowerHours, mineSaturationPct, reconstructionScore 0-1, unrepairedDamageUSD …), `GAME.sampleEvents[]` (titleAr, descriptionAr, options[] with labelAr, costPC/costUSD/costSYP, effect fields). Open the file and read it to learn exact field names. Use these values; invent only what is missing.
- Fonts from `/fonts/thmanyah/` via @font-face: `thmanyah-sans-regular.woff2`, `thmanyah-sans-medium.woff2`, `thmanyah-sans-bold.woff2` (family "Thmanyah Sans"), and check `ls ../public/fonts/thmanyah/` for the serif display file names (family "Thmanyah Serif Display", for headings/numbers with character).
- No CDN, no frameworks, no images from the internet. Icons: hand-written inline SVG (simple, consistent stroke style). NO emoji anywhere.

The page is served by Vite from the repo root, so absolute paths `/concepts/...` and `/fonts/...` work. Test by reading your own code carefully; you cannot open a browser.

## Real content to use (Arabic labels)
- Money: treasury الخزينة (SYP, shown like `42.0B ل.س`, can go negative, red), reserves الاحتياطي ($320M), parallel rate السوق الموازي (162 ل.س/$), external debt الدين الخارجي ($6.1B).
- Power: political capital الرصيد السياسي (50 نقطة, 0–200), public trust الثقة الشعبية (42%), national unrest الاحتقان الوطني (45/100), corruption الفساد (58/100), tax compliance الامتثال الضريبي (35%), employee wage أجر الموظف ($25), electricity ساعات الكهرباء.
- Turn: الدور 01/40, season الحصاد · 2027 (turns alternate الحصاد H1 / الشتاء H2). End turn = إنهاء الدور.
- Ministries/panels: المحافظة (province), السياسات (policies), الأصول (assets), المالية (finance & taxes), المراسيم (decrees), الطوارئ (emergency), الإحصائيات (statistics).
- Example decrees (cost in political capital → effects):
  - مرسوم إطلاق هيئة النزاهة وتدقيق الأصول — 15 رصيد سياسي → فساد -8، ثقة +5، احتقان المحافظات -3
  - المنصة الرقمية لرد الملكيات العقارية للاجئين — 10 رصيد → ثقة +4
  - ميثاق التفاهم العشائري وتأمين الترانزيت الشرقي — 8 رصيد → احتقان دير الزور والرقة -10، عائدات ترانزيت +
  - خطاب المصالحة الوطنية والعهد المدني الشامل — +4 رصيد، ثقة +2، احتقان -4
  - حوافز استقطاب الكفاءات والمغتربين — 12 رصيد → كفاءات +
  - المنحة الشعبية الاستثنائية — 7.5B ل.س → +8 رصيد سياسي
- Unrest tiers per province (prri): هادئ CALM (<30), متوتر TENSE (30–55), اضطرابات RIOT (55–80), تمرد REVOLT (80+).
- Turn results headlines (invent 4–5 plausible ones from these systems, e.g. reserves fell, Aleppo power hours up, Daraa protests, lira slipped to 171).

## Palette (current game identity — keep the family, you may extend it)
deep #071210, forest-deep #0a1b18, forest-mid #133832, forest-surface #1a453e, accent teal #4ec7b4, wheat-light #f7f5ed, wheat-mid #dfcaa0, gold #f2cf77, umber-deep #240c11, crimson #f87171, danger #ce1126, ok #3fb950, warn #f5d547. Dark, institutional, Syrian-identity green/wheat/gold. Positive deltas teal/green, negative crimson.

## Screens (state switcher)
The mockup must show these states. Add a small floating "concept switcher" (top-left corner in LTR terms = visually top-right is fine, semi-transparent, clearly NOT part of the game UI, labeled in English e.g. "Concept A · state: 1 2 3 4 5"), plus keyboard keys 1–5, plus support `?state=N` in the URL (the review hub loads states via iframes). Also support `?bare=1` to hide the switcher.
1. **Main view** — map + HUD, nothing open.
2. **Province selected** — Aleppo (حلب) selected: its info shown in the concept's way (unrest, power hours, damage, mines, a project to fund, 2–3 actions).
3. **Decrees/ministry open** — the decree experience of the concept, with a pending-cost preview (e.g. "after this turn: 35 رصيد") and at least one decree already queued.
4. **Crisis event** — one of `GAME.sampleEvents` shown as a dramatic event with its options and costs; one option unaffordable (disabled with reason).
5. **Turn results** — the end-of-turn sequence/report.
Within states, real interactivity is welcome but optional (hover/press states, tabs switching, selecting a different province on the map, opening/closing a sheet). Nothing needs to persist.

## Responsiveness (mandatory, the owner will review all three)
- Desktop 1440×900, phone LANDSCAPE 844×390, phone PORTRAIT 390×844. Portrait must be a real, designed layout (not a rotate prompt).
- Phones: touch targets ≥ 44px; bottom sheets instead of centered modals; HUD must not eat more than ~25% of the height in landscape; no horizontal page scroll; respect `env(safe-area-inset-*)`.
- `<html lang="ar" dir="rtl">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Use CSS logical properties (inline-start/end) so RTL is correct.
- Use container-friendly CSS (grid/flex, clamp(), media queries on width AND height: `(max-height: 500px)` for landscape phones).

## Map
Draw the map as inline SVG from `GAME.governorates[].path` with viewBox `GAME.viewBox`. Fill each province by its unrest tier (or the concept's chosen data layer). Fewer, bigger, more meaningful markers than the current game: at most ONE status badge per province at the default zoom. Neighbour country labels (تركيا، العراق، الأردن، لبنان) are nice-to-have. The map must scale to fit its container on all three sizes (preserveAspectRatio xMidYMid meet).

## Game feel checklist (use as many as fit the concept)
Juicy hover/press (scale, glow), animated number counters, delta chips (+2.9% / -128%), a "pending changes" counter on the end-turn button, short CSS entrance animations (respect `prefers-reduced-motion`), clear visual hierarchy (3–5 primary numbers big, the rest secondary), card/stamp/seal metaphors where the concept calls for them, subtle texture/noise via CSS gradients (no images).

## Quality bar
- Polished, intentional typography (serif display for titles/numbers, sans for body), consistent spacing scale, consistent icon style.
- Arabic text correct and natural; numbers may use Latin digits (as the current game does).
- No console errors: guard every DOM lookup.
- Keep the file under ~1500 lines; prefer generating repeated markup with small JS template functions from GAME data.

## When done
Re-read your file top to bottom once to catch mistakes (unclosed tags, wrong field names vs game-data.js, RTL arrow directions). Only create/edit your own HTML file. Do not run git commands that change state. Final answer: 5–10 lines describing the concept's key UI ideas as implemented, and how each of the 3 sizes is laid out.

---

## Concept A — "غرفة العمليات" Situation Room (cards on a living map)
File: `concepts/concept-a-situation-room.html`
- The map is the hero and fills the screen edge to edge. HUD floats on top of it as compact glass panels.
- Top: a slim resource bar with only 5 primary resources (treasury, reserves, political capital, trust, unrest), each icon + big number + tiny delta chip. Tapping it pulls down an "intelligence tray" with the secondary stats as small gauges.
- Bottom: the player's **hand of decree cards**, fanned like a card game (5–6 cards, slight rotation/overlap). Each card: cost seal (political capital) in a corner, title, 2–3 effect icons with +/- values, category color strip. Hover/tap lifts the card; state 3 shows one card enlarged in the center ("inspect") with a big "أصدر المرسوم" button and the queued card stacked in a "pending" tray beside the end-turn button.
- End turn: a big circular wax-seal / stamp button (gold) at the bottom corner with a badge counting pending actions.
- Province (state 2): a floating info card anchored next to the province with a pointer line, showing mini meters and 2–3 action buttons.
- Event (state 4): full-screen dim, a large "breaking" card slides in like a dealt card, options as smaller cards to pick.
- Turn results (state 5): a sequence of newspaper-style headline cards (جريدة الدولة), numbers counting up/down, then a summary row.
- Portrait phone: map top ~55%, hand of cards becomes a horizontally swipeable row at the bottom, resource bar becomes 2 compact rows max; province info and decree inspect become bottom sheets.

## Concept B — "مكتب الرئيس" The President's Desk (dossiers and documents)
File: `concepts/concept-b-presidents-desk.html`
- Skeuomorphic, cinematic: the player sits at a dark wooden/green-leather desk (CSS gradients only). The map is a framed map pinned on the wall/desk centerpiece.
- Ministries are physical **folders/dossiers** with colored tabs lined on the side of the desk; opening one (state 3) shows a paper document with typewriter-ish headings, checkboxes and a signature line; queued decrees get a red "يُعتمد" stamp animation.
- Stats as desk objects: a clock/calendar for the turn, a ledger/notebook for money (treasury, reserves), a gauge dial for unrest, a "trust" thermometer, political capital as a stack of seals/coins with a number.
- Province (state 2): an intelligence file (ملف استخباراتي) with a cut-out silhouette of the province shape (use its path), clipped note cards for stats.
- Event (state 4): a ringing red telephone / telegram that unfolds into a classified cable (برقية عاجلة) with options as handwritten-like choices.
- Turn results (state 5): a morning newspaper front page (الصحيفة الرسمية) with headline, columns and charts drawn in SVG.
- End turn: a heavy rubber stamp / "اختم الدور" button.
- Phones: the desk collapses into a vertical stack of documents; folders become a bottom tab bar of folder tabs; documents open as full-height sheets. Landscape: map left/center, folder tabs rail on the side.

## Concept C — Strategy HUD (classic strategy-game interface, cleaned up)
File: `concepts/concept-c-strategy-hud.html`
- Inspired by grand-strategy games but much simpler. Clean, crisp, information-rich without being a spreadsheet.
- Top bar: 6–7 resources as icon + number + delta, each with a rich hover tooltip (breakdown: income lines vs expense lines, a sparkline of the last 6 turns). On phones, the bar collapses to the 4 most critical + a "more" button.
- Side rail (inline-end side in RTL = left visually is fine, choose what reads best) with vertical ministry tabs (icon + short label); opening one slides a drawer (desktop) or a bottom sheet (phone) with tabbed content: e.g. Finance drawer with sliders for tax rate and a live projected-effect preview ("الخزينة بعد الدور: 38.2B (-9%)").
- Other side: an **alerts stack** (notifications like "حلب: خطر اضطرابات", "الاحتياطي: يكفي 3 أشهر", "حدث جديد: إضراب الأفران") each clickable, color-coded by severity, dismissible.
- Map: map modes switcher (unrest / electricity / damage / mines) as segmented control; legend; one badge per province; province hover tooltip.
- Province (state 2): a right/left province panel with tabs (نظرة عامة، مشاريع، أمن).
- Event (state 4): a classic event window with illustration area (draw a stylized SVG scene), flavor text, and options showing costs & effects as chips, disabled option with reason.
- Turn results (state 5): a modal "turn report" with a ledger table (income/expenses), top changes as delta cards, and per-province changes as a small multiples grid.
- End turn: a prominent button with pending-actions count and a confirmation popover summarizing queued spending.

## Concept D — Hybrid (recommended direction: C's structure + A's cards and turn ceremony)
File: `concepts/concept-d-hybrid.html`
- C's clean structure: slim resource top bar with tooltips, alerts stack, map modes, province side panel.
- A's game feel: decrees are cards (state 3 shows a scrollable card grid/hand inside a drawer, with drag-to-queue affordance and a "pending" tray), turn end is a seal button, turn results are a staged headline-card sequence followed by a ledger summary.
- Bottom command dock with 7 big labeled icons (current game's sections), redesigned: larger, with badges (e.g. "3" new decrees available, red dot on الطوارئ).
- Phone portrait: top bar 1 row (4 stats + more), map, bottom tab bar (5 tabs + "more"), all panels are bottom sheets with a drag handle and snap points (peek / half / full; implement the visual states, snapping can be simple). Phone landscape: top bar compressed to one 44px row, dock becomes a vertical rail on the inline-start edge, sheets become side sheets.
