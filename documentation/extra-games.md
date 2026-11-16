# Side games (extras)

Two side games set in the world of «رئيس الجمهورية», reachable from the title
menu entry «ألعاب جانبية» → `extras/index.html`.

| Page | Game | Kind |
| :--- | :--- | :--- |
| `extras/crisis/` | «غرفة الأزمات» | Roguelite lane card battler |
| `extras/dossier/` | «قرارات عاجلة» | Two-answer decision cards |

They are **fun first**. They share the main game's look and language, but
they make no claims about real-world accuracy: no sources, no "real fact"
lines, no data disclaimers. Only the main simulator must be accurate.

---

## 1. Shared rules

### 1.1 Technology

- Each game is a Vite page of the main build: `extras/<game>/index.html` →
  `src/extras/<game>/main.ts` → `bootExtras(App)` (`src/extras/shared/boot.ts`),
  which loads `src/app.css` (fonts, theme tokens, Tailwind, the UI kit classes)
  and applies the persisted theme. Inputs are listed in `vite.config.ts`.
- Svelte 5 (runes) + TypeScript + Tailwind v4, exactly like the main game.
  No new dependencies unless a design need cannot be met without one.
- Game rules live in **pure TypeScript modules with no DOM or Svelte imports**
  (`src/extras/<game>/engine/`), so they run under `tsx` for simulation tests.
  All randomness goes through `src/extras/shared/rng.ts` with the RNG state
  stored in the game state: a saved game replays identically.
- Saves: `src/extras/shared/storage.ts`, keys `extras-<game>-v1` (run state) and
  `extras-<game>-meta-v1` (unlocks/settings).
- Reuse from the main game where it fits: `GameIcon.svelte` glyphs,
  `fx()` sound/haptics from `src/lib/ui/fx/feedback.ts`, kit classes
  (`kit-btn pri|sec`, `btn-primary-chamfer`, `pressable`, `num`).
  Shared side-game pieces: `src/extras/shared/ExtrasBar.svelte` (top bar).
- Simulation tests: `scripts/extras/test-<game>.ts`, run with `npx tsx`,
  wired into `npm run test:extras`.

### 1.2 Visual language (match the main game)

The main game is an "Operations Console": flat, square, hairline-ruled.

- **No rounded corners**, no drop shadows except a subtle lift on a dragged
  card, no gradients except the gauge track. 1px borders in `--c-line`,
  stronger `--c-line-strong` for emphasis.
- Surfaces: page `--c-bg`, panels `--c-panel`, strips/bars `--c-strip`,
  chips `--c-chip-bg`. Text `--c-text`, secondary `--c-text-2`, labels
  `--c-muted`. Accent `--c-accent` (amber) for the one primary action and the
  current focus. Good/bad changes `--c-pos` / `--c-neg`.
- Numbers use the `num` class (tabular). Big stat numbers 18–24px bold.
  Labels 11–13px muted. Body 15–16px, line-height 1.6.
- Display title font: `font-display` (Thmanyah Serif Display) only for game
  titles and ending titles. Everything else `font-heading`/`font-arabic`.
- Primary action: `btn-primary-chamfer` (amber with a cut corner), one per
  screen. Secondary: `kit-btn sec`. Touch targets ≥ 44px.
- Icons: game-icons.net glyphs (CC BY 3.0), solid, tinted with
  `currentColor`. Never emoji.
- Motion is short and purposeful (120–350ms), respects
  `prefers-reduced-motion`.
- Layouts are designed for 360×640 and 390×844 portrait first, then 1440×900.
  The page never scrolls horizontally. Long lists scroll inside their panel.
- Both themes (`default`, `mono`) must stay legible; never encode meaning by
  colour alone (pair colour with a glyph, a pattern or a number).

### 1.3 Arabic writing rules (both games)

Distilled from the UX-Writing *Content Style Guide in Arabic* and
*arabic-guide*. Every visible string follows them.

1. Modern Standard Arabic, plain and short. Serious but warm tone. No slang,
   no emoji, no exclamation marks except in a rare celebration.
2. **Buttons and answers start with an imperative verb + object**:
   «ادعم الخبز», «أوقف التهريب», «ابدأ الولاية». Never a bare «نعم/لا».
   Confirmation buttons name the outcome: «أنهِ الجولة», not «تأكيد».
3. **Headings and titles carry no final punctuation.**
4. **Active voice**; never «تمّ + مصدر» or «قام بـ»: write «أوقفت الحكومة
   الشحنة», not «تم إيقاف الشحنة».
5. One verb instead of a verb+noun pair: «رفعت الأجور», not «قامت برفع الأجور».
6. No hedging («قد»، «ربما») in instructions; be direct.
7. Use «واو» between every item of a list: «الخبز والوقود والدواء».
8. Do not split an annexation: «استيراد القمح وتخزينه», not «استيراد وتخزين القمح».
9. Common errors to avoid: «تواجد» → «وجود»; «أجاب على» → «أجاب عن»;
   «أثّر على» → «أثّر في»; «حيث أن» → «إذ إن»; «لعب دورًا»; «بالنسبة لـ»;
   «ناهيك عن» → «فضلًا عن»; «كونه» (causal) → «لأنه»؛ «القادم» (time) → «المقبل».
10. Numbers in Western digits; the percent sign `٪` or `%` attached; ranges
    with an en dash and no spaces (`2027–2046`); a space between number and
    unit («3 أدوار»).
11. Tanween on the letter before the alif: «جديدًا», «عامًا».
12. No direction words that force the eye to hunt («في الأعلى يسارًا»), except
    where the UI literally maps a swipe direction.
13. Never name real living politicians; no sectarian framing; violence and
    suffering are mentioned plainly, never graphically, never as a joke.
14. Every number or Latin token inside Arabic text is wrapped so it keeps its
    order: `<bdi dir="ltr">−3</bdi>`. Signs and currency marks stay inside
    the isolated span.

---

## 2. «غرفة الأزمات» — lane card battler (`src/extras/crisis/`)

### 2.1 Pitch

You run the national crisis room through one hard year. Crises arrive on a
board of four fronts; you can always see the next wave coming. Deploy teams
into the fronts, read the incoming row, and tip the stability gauge your way
before it tips the other way. Between battles you choose your route on a fully
visible map, recruit teams, train them and shape your deck.

Genre reference only: a lane-based card battler with a tug-of-war health
gauge and a visible enemy queue, wrapped in a branching-map roguelite. The
names, art, rules details, UI and writing are our own.

### 2.2 The battle

**Board.** Four lanes (columns), three rows:

| Row | Owner | Notes |
| :--- | :--- | :--- |
| «القادم» (queue) | crises | Cards that will drop into the crisis line next round. Always visible (except where a rule hides a slot). |
| «الأزمات» (crisis line) | crises | Active crisis cards. |
| «فرقك» (your line) | player | Your deployed teams. |

Lane 0 is the first column in reading order (rightmost in RTL). "Adjacent"
means lane ±1. The stability gauge «الميزان» sits between the crisis line and
your line.

**The gauge.** An integer `balance` in −5…+5, starting at 0. Your unblocked
hits push it up; crisis unblocked hits push it down. Reaching **+5 wins** the
battle, **−5 loses** it. It is checked after every single hit, so a battle
can end mid-resolution. Overflow above +5 from the final hit becomes bonus
«منح» (currency), 1 per point.

**Stats.** Every unit has قوة (power, attack), صمود (endurance, health) and
optionally one trait. Player units also have a cost. Damage persists; health
does not regenerate unless an effect says so.

**Categories.** Five: طاقة، غذاء، أمن، مال، مجتمع. Crises belong to one of the
first four or to مجتمع. **Expertise bonus:** when your unit hits a crisis of
the *same* category (not مجتمع) it deals +1. Shown on the card as a small
category glyph and highlighted on the lane when it applies.

**Budget «الخزينة».** Starts at 0. At the start of every round you gain +2
(plus income traits). Unspent budget carries over, capped at 9. Card costs
are paid from it.

**Round structure.**

1. *Income*: +2 budget, + income traits; start-of-round triggers.
2. *Supply «الإمداد»*: you are shown **two random cards from your draw pile**
   and the **«متطوعون»** token card; take one of the three into your hand.
   (If the draw pile is empty, shuffle the discard pile into it first. If it
   has only one card, offer that one.)
3. *Your phase*, in any order, as often as you can pay:
   - play a unit from hand into an empty slot of your line;
   - play an action card;
   - move a unit with «تنقّل» to an adjacent empty slot (once per round each);
   - **withdraw** a unit from your line (free; it goes to the discard pile).
4. *End round* («أنهِ الجولة») → resolution, animated step by step:
   1. **Your attacks**, lane 0→3. A unit with power > 0 hits the crisis in the
      same lane's crisis line; if that slot is empty the hit goes to the gauge.
      Traits may change targets.
   2. **Crisis attacks**, lane 0→3, symmetric: hit your unit in that lane, or
      the gauge if your slot is empty.
   3. **Advance**: each queue card moves into the crisis line if the slot
      below it is empty; otherwise it waits.
   4. **Plan**: the encounter places its next cards into empty queue slots.
   5. *End-of-round triggers* (growth, spread, aid, boss rules).
5. Opening hand: 3 cards from the shuffled deck + 1 «متطوعون». Round 1 starts
   with the encounter's opening cards already in the crisis line and queue.

Destroyed player units go to the discard pile (they return later via
supply). The «متطوعون» token never enters the deck; it is created on demand.

**Stalemate guard.** From round 16, every crisis gets +1 power at the start
of each round («الوقت ينفد»).

**Seeing the future.** This is the heart of the game and must be visible at
all times without reading:

- The **queue row** shows exactly what drops next round.
- **Outcome preview**: the engine exposes a pure `previewRound(state)` that
  simulates the coming resolution. The UI always shows its result on the
  board: on each card the damage it is about to take (`−2`) and a
  "will be destroyed" marker, on each lane an arrow chip for a hit that will
  reach the gauge (`+2` / `−3`), and a ghost needle on the gauge at the
  projected balance. It updates instantly whenever you play, move or
  withdraw a card, and while a card is being dragged over a slot.
- **Forecast**: a slim strip above the queue shows the round-after-next as
  category silhouettes (glyph only). «إنذار» units and the «إنذار مبكر»
  action reveal it fully.

### 2.3 Traits

Player traits (glyph + 2–4 word name; the detail sheet shows one line):

| Trait | Rule |
| :--- | :--- |
| رصد | Can block crises with «تسلّل». |
| توزيع | Hits both adjacent lanes instead of its own (each hit uses its power). |
| درع | Ignores the first damage it takes each round. |
| إلهام | Adjacent allies get +1 power. |
| دخل | +1 budget at the start of each round. |
| ترقية | The first time it survives a crisis attack phase, gets +1/+1. |
| حاسم | Any crisis it damages is destroyed. |
| تنقّل | Once per round, may move to an adjacent empty slot. |
| عودة | When destroyed, returns to your hand instead of the discard pile. |
| تضامن | +1 power for each other ally of its category. |
| إنذار | While on the board, the forecast strip is fully revealed. |
| اشتباك | Deals 1 damage to any crisis that hits it. |
| إسعاف | End of round: restore 1 health to each adjacent ally. |

Crisis traits:

| Trait | Rule |
| :--- | :--- |
| تسلّل | Its hit goes to the gauge unless your unit in the lane has «رصد». |
| تضخّم | End of round: +1 power (max 6). |
| انتشار | End of round: if an adjacent queue slot is empty, place a «بؤرة» (1/1) there. Max once per 2 rounds per card. |
| تصلّب | Ignores the first damage it takes each round. |
| تهريب | End of round: moves to an adjacent empty slot of the crisis line, if any. |
| تآكل | A unit it damages loses 1 power permanently (min 0). |
| حشد | Adjacent crises get +1 power. |

### 2.4 Action cards «قرارات»

Single-use, go to the discard pile.

| Card | Cost | Effect |
| :--- | :--- | :--- |
| تعزيز عاجل | 1 | A unit gets +2 power this round. |
| إخلاء | 0 | Return one of your units to your hand, fully restored. |
| إصلاح | 1 | Restore a unit to full health. |
| إعادة انتشار | 1 | Swap the positions of two of your units (or move one to any empty slot). |
| إنذار مبكر | 1 | Reveal the forecast fully this battle and draw 1 card. |
| تمويل طارئ | 0 | +2 budget. |
| حظر | 2 | Destroy a card in the queue row. |
| تأجيل | 1 | Push a crisis from the crisis line back to the queue slot above it (if empty). |
| تعبئة | 2 | Add 2 «متطوعون» to your hand. |

Curse cards (from some events) clog the hand: «روتين» (cost 1, does nothing
when played), «ديون قديمة» (cannot be played; while in hand, −1 income).

### 2.5 Starting content (tune by simulation)

Names are short (≤ 12 characters where possible) so they fit a phone card.
Format: cost · power/health · trait.

**Units**

| Category | Unit | Stats |
| :--- | :--- | :--- |
| مجتمع | متطوعون (token) | 0 · 0/2 |
| مجتمع | لجنة الحي | 1 · 1/2 |
| مجتمع | مسعف | 2 · 1/2 · إسعاف |
| مجتمع | معلّمة | 2 · 1/3 · ترقية |
| مجتمع | إذاعة محلية | 2 · 0/2 · إلهام |
| مجتمع | مغترب عائد | 3 · 2/3 · عودة |
| مجتمع | نقابة | 4 · 2/5 · تضامن |
| طاقة | فني صيانة | 1 · 2/1 |
| طاقة | مولّدة الحي | 2 · 0/3 · دخل |
| طاقة | مهندس شبكة | 3 · 2/3 · توزيع |
| طاقة | ألواح شمسية | 3 · 0/5 · دخل |
| طاقة | محطة تحويل | 4 · 3/4 · درع |
| طاقة | ورشة الطوارئ | 5 · 4/4 · توزيع |
| غذاء | فرّان | 1 · 1/2 |
| غذاء | مزارع | 1 · 1/1 · ترقية |
| غذاء | قافلة طحين | 2 · 2/2 · تنقّل |
| غذاء | صومعة | 3 · 0/7 |
| غذاء | تعاونية | 3 · 1/4 · تضامن |
| غذاء | مطحنة | 4 · 3/3 · إلهام |
| أمن | نقطة مراقبة | 1 · 0/3 · رصد |
| أمن | دورية | 2 · 2/2 |
| أمن | شرطة الحي | 2 · 1/3 · رصد |
| أمن | وحدة الحدود | 3 · 3/2 · تنقّل |
| أمن | محقق | 3 · 1/2 · حاسم |
| أمن | قوة احتواء | 5 · 4/5 · اشتباك |
| مال | صرّاف نظامي | 1 · 1/1 · دخل |
| مال | مدقق | 2 · 1/2 · حاسم |
| مال | جابي ضرائب | 2 · 0/3 · دخل |
| مال | صندوق تنمية | 3 · 1/4 · إلهام |
| مال | مصرف تسليف | 4 · 2/4 · دخل |
| مال | المصرف المركزي | 6 · 3/7 · دخل (rare) |

Rarity: cost ≤ 2 common, 3–4 uncommon, ≥ 5 rare. Each category also gets
one rare "hero" unit designed during balancing (e.g. a grid engineer that
hits for +1 in every energy lane).

**Crises**

| Act | Crisis | Stats |
| :--- | :--- | :--- |
| any | شائعة (مجتمع) | 1/1 · تسلّل |
| any | ازدحام (مجتمع) | 1/3 · حشد |
| any | إضراب (مجتمع) | 2/3 · تصلّب |
| any | بؤرة (token) | 1/1 |
| 1 | عطل (طاقة) | 1/1 |
| 1 | انقطاع (طاقة) | 2/2 |
| 1 | حمل زائد (طاقة) | 1/3 · تضخّم |
| 1 | سرقة كابلات (أمن) | 1/2 · تسلّل |
| 1 | عاصفة ثلجية (طاقة) | 3/3 |
| 1 | شحّ الوقود (طاقة) | 2/4 · تصلّب |
| 2 | طابور خبز (غذاء) | 1/3 · حشد |
| 2 | جراد (غذاء) | 1/1 · انتشار |
| 2 | احتكار الطحين (مال) | 2/3 · تصلّب |
| 2 | جفاف (غذاء) | 2/4 · تضخّم |
| 2 | تهريب الطحين (أمن) | 2/2 · تهريب |
| 2 | سوق سوداء (مال) | 3/3 · تآكل |
| 3 | مضاربة (مال) | 1/2 · تضخّم |
| 3 | ذعر الأسواق (مال) | 1/1 · انتشار |
| 3 | فساد (مال) | 2/2 · تآكل |
| 3 | هروب الأموال (مال) | 2/1 · تسلّل |
| 3 | دين مستحق (مال) | 3/4 · تصلّب |
| 3 | تضخّم جامح (مال, elite) | 2/3 · تضخّم + حشد |
| 2–3 | شبكة تهريب (أمن) | 2/3 · تهريب |
| 2–3 | اضطراب (أمن) | 2/2 |

**Bosses.** Each boss is a large unit that occupies one crisis-line slot
(lane 1) for the whole fight and has an aura while alive. **Destroying the boss
unit wins the fight outright**; pushing the gauge to +5 the first time moves
the boss to phase 2 instead of winning (gauge resets to 0, the board's other
crises are cleared, the boss restores health and its rule hardens). A second
+5 wins.

| Act | Boss | Unit | Phase 1 | Phase 2 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | العتمة الكبرى | 1/14 | Each round two random lanes go dark: their queue slots are hidden and your units there have −1 power. | 2/16. Additionally, every second round a «عطل» fills each empty queue slot. |
| 2 | تاجر الأزمات | 2/14 | Your cards cost +1. | 2/16. End of round: −1 budget, and a «سوق سوداء» joins an empty queue slot. |
| 3 | الدوّامة | 1/16 | End of round: every crisis gets +1 power (max 6). | 2/18. End of round the gauge moves −1 unless you have 2+ مال units on the board. |

### 2.6 Encounters

An encounter = an act, a list of opening placements, a wave plan and an
optional modifier. Waves are generated from a threat budget per round using
the act's crisis pool (seeded), so every run differs:

- Normal: 5–7 rounds of waves, 1–2 cards per round, opening 1 front + 1 queue.
- Elite «معركة صعبة»: +40% threat, one elite crisis, a modifier.
- After the waves run out, no new crises arrive.
- Placement AI: fill empty queue slots, preferring lanes where your line is
  empty (pressure) half the time, lanes facing your weakest unit otherwise.

Modifiers (shown on the map node before you choose it):

| Modifier | Rule |
| :--- | :--- |
| ضباب | Queue slot in lane 3 is hidden. |
| ميزانية مقيدة | Income is 1 for the first two rounds. |
| دعم شعبي | Gauge starts at +1. |
| موجة | An extra wave in round 3. |
| شحّ | Supply offers one deck card instead of two. |

### 2.7 The run

Three acts, one map each, shown entirely from the start (the second way the
game lets you see ahead):

| Act | Name | Crisis flavour | Boss |
| :--- | :--- | :--- | :--- |
| 1 | الشتاء | energy | العتمة الكبرى |
| 2 | الرغيف | food | تاجر الأزمات |
| 3 | الليرة | money | الدوّامة |

**Map.** 6 rows of 2–4 nodes, edges only between near columns (no crossing),
then the boss. Every path offers 3–4 fights before the boss. Node types:

| Node | Glyph meaning | Result |
| :--- | :--- | :--- |
| معركة | crisis | Battle → reward |
| معركة صعبة | elite | Harder battle → reward incl. a rare |
| تجنيد | recruit | Choose 1 of 3 units |
| تدريب | train | Pick a card, then one of two upgrades (+1 power / +2 health / add a trait) |
| استراحة | rest | Restore 1 life, or remove a card from the deck |
| سوق | market | Spend «منح»: 3 units (4/6/9), 1 action (3), remove a card (5), +1 life (8, once) |
| طارئ | event | One line, two choices (see below) |
| الزعيم | boss | Boss fight |

No elite in the first row; the row before the boss contains a rest.

**Rewards.** Battle: choose 1 of 3 cards (or skip) + 3 «منح» + overflow.
Elite: one of the three is rare + 6 «منح». Boss: +10 «منح», a rare pick, and
the next act.

**Lives «الثقة».** 3 pips. Losing a battle costs 1 and skips its reward;
losing to a boss costs 1 and you retry the boss. At 0 the run ends.

**Events** (≥ 10, each one line + two short choices), e.g.: a returning
expatriate offers money or a rare unit; a donor offers a generator; a
suspicious offer gives 12 «منح» and adds «روتين»; a volunteer drive adds two
copies of «لجنة الحي»; a training course upgrades a random card; a strike
costs a life or 6 «منح».

**Starting teams** (meta unlocks, saved in `extras-crisis-meta-v1`):

| Team | Unlock | Deck (10 cards) |
| :--- | :--- | :--- |
| فريق الإنقاذ | start | لجنة الحي ×2، فني صيانة ×2، فرّان ×2، دورية، صرّاف نظامي، تعزيز عاجل، إصلاح |
| فريق التنمية | reach act 2 | economy-leaning (دخل، تضامن) |
| فريق الحزم | win once | security-leaning (رصد، حاسم، اشتباك) |

**Run end screens** use the main game's ending style: kicker, display-font
title, one short paragraph, a few numbers (acts cleared, battles won, deck
size, «منح» earned). Lose title «سقطت الحكومة», win title «عبرت البلاد عام
الأزمات».

### 2.8 Tutorial

The very first battle of the first run is a fixed, gentle encounter with
5 short coach marks, each one line, shown at the moment it matters:
1. the supply choice; 2. drag a card into a slot; 3. the queue row is next
round; 4. the preview numbers and the ghost needle; 5. end the round.
A «كيف تلعب» sheet (reachable from the title and the in-battle menu) shows
the same five rules with glyphs. No other long text anywhere.

### 2.9 UI

Screens: title, team select, map, battle, reward, recruit/train/rest/market/
event, run end, how-to sheet, settings sheet (speed normal/fast, sound,
haptics). Mobile portrait first.

**Battle, phone portrait (390×844):**

```
┌ ExtrasBar: غرفة الأزمات · ♥♥♥ · منح 12 ················ القائمة ┐
│ strip: الشتاء · معركة 2/4 · الجولة 3              [?] [⚙]        │
│ forecast  ░ ░ ░ ░   (round after next, glyph silhouettes)        │
│ القادم   [q0][q1][q2][q3]   (queue, 78% scale, dashed slots)      │
│ الأزمات  [c0][c1][c2][c3]   (crisis line, full cards)             │
│ ◀━━━━━━━━━━━━|━━━━━━━━━━━━▶  gauge −5…+5, needle + ghost needle   │
│ فرقك     [p0][p1][p2][p3]   (your line, full cards)               │
├──────────────────────────────────────────────────────────────────┤
│ الخزينة ⛁ 3        سحب 6 · مستبعد 2                              │
│ [hand: horizontally scrolling cards, selected one lifts]          │
│ [            أنهِ الجولة   (btn-primary-chamfer)            ]    │
└──────────────────────────────────────────────────────────────────┘
```

- Card width `clamp(72px, 21vw, 128px)`, aspect ~3:4. Four lanes plus gaps
  must fit 360px.
- **Card face**: flat panel, 1px border, 3px top stripe in the category
  colour, category glyph in a corner, large unit glyph in the centre, name
  (one line, 12–14px bold), bottom row: power (left), trait glyph (centre),
  health (right), all as big numbers with tiny glyphs. Cost as amber pips
  top-start. Crisis cards use `--c-ev-bg` as their background so the two
  sides read apart at a glance. Damaged health shows in `--c-neg`.
- Category colours (CSS vars in the crisis stylesheet, muted to fit the
  console palette, each paired with its glyph): طاقة amber, غذاء olive green,
  أمن steel blue, مال teal, مجتمع warm grey.
- **Playing a card**: tap a hand card to select (lifts, valid slots outline
  in accent) then tap a slot, **or** drag it onto a slot (Pointer Events,
  `touch-action: none` on the board). Tap a board card to open its detail
  sheet (big card + trait lines). Long text never appears on the board.
- **Supply**: at round start a bottom sheet slides up with the three options
  as big cards; tap one. No other text than «اختر إمدادك».
- **Resolution**: animate each step from the engine's event log: a unit
  lunges toward its target (150ms), the damage number pops, the target
  shakes, destroyed cards collapse, gauge hits slide the needle (spring),
  queue cards drop down, new queue cards fade in. Speed setting scales all
  delays (normal 1×, fast 0.5×). A short banner «دور الأزمات» marks the
  crisis attack phase.
- **Gauge**: a horizontal bar of 11 notches (−5…+5), your side toward the
  player line, needle in `--c-text`, ghost needle dashed, the zones near
  ±5 tinted `--c-pos`/`--c-neg`. Numbers at the ends.
- **Desktop (≥ 1024px)**: the board is centred at a larger card size; a side
  panel on the start side shows deck/discard counts, the act map in
  miniature and the round log (short lines). Hand along the bottom.
- **Map**: vertical, boss at the top, start at the bottom, scrolls inside its
  frame; nodes are square glyph tiles joined by hairlines; reachable nodes
  outlined in accent; visited nodes dimmed. Tapping a node shows its name,
  modifier (if any) and «انطلق».

### 2.10 Engine API (pure TS)

```
src/extras/crisis/engine/
  types.ts      card defs, unit instances, battle/run state, events
  content.ts    units, actions, crises, bosses, modifiers, events, starter decks
  battle.ts     createBattle, applyAction(state, action) → {state, events},
                endRound(state) → {state, events}, previewRound(state)
  ai.ts         wave generation and placement
  run.ts        createRun, map generation, node resolution, rewards, shop
  bot.ts        greedy player used by simulations (uses previewRound)
```

The UI only calls these functions and replays `events`; no rules in
components. State is plain JSON (saved as is).

### 2.11 Balance targets (simulation, `scripts/extras/test-crisis.ts`)

- No exceptions, no NaN, every battle ends (by gauge or boss) within 30 rounds.
- Battle length: median 5–8 rounds.
- Greedy bot battle win rate: act 1 ≥ 85%, act 2 ≈ 75%, act 3 ≈ 65%,
  bosses 45–65%. Full-run win rate 25–45%. A random-move bot wins < 5% of runs.
- Every card is picked by the bot in some runs; no single card appears in
  > 70% of winning decks.

---

## 3. «قرارات عاجلة» — decision cards (`src/extras/dossier/`)

### 3.1 Pitch

You are the transitional president. Files land on your desk two per half-year
for 40 turns (2027–2046), like the main game's turns. Each file has two
answers. Keep four balances alive: الخزينة، الثقة، الأمن، السيادة. The
endings are the main game's endings.

### 3.2 Rules (unchanged mechanics, new presentation)

- Four meters 0–100, start at 50. A meter at 0 ends the term (collapse).
- Each turn = two files. Season and year advance like the main game
  («الدور 07/40 · 2030 · الشتاء»).
- Answers change 1–3 meters by 3–15 (never more than 20).
- **Follow-ups**: an answer can queue a consequence file N files later.
- **Standing decrees**: an answer can start a decree that drifts meters every
  turn (shown as small tags under the meters).
- **Overreach**: a meter ≥ 90 unlocks tempting risky files.
- **Postpone**: 3 tokens per term; «أجّل الملف» discards the current file.
- After each answer a one-line **result headline** appears (what happened,
  past tense), replacing the old "fact" lines. No sources, no real-world
  facts, no citations anywhere.

### 3.3 Endings (the main game's)

Collapse, checked after each answer and after decree drift:

| Condition | Title |
| :--- | :--- |
| two or more meters at 0 at once | سقوط الدولة: الشلل الحكومي وفقدان السيطرة المركزية |
| الخزينة 0 | سقوط الدولة: الإفلاس السيادي الشامل |
| الثقة 0 | سقوط الدولة: العصيان المدني العام |
| الأمن 0 | سقوط الدولة: الانقلاب العسكري وتمرد الحاميات |
| السيادة 0 | سقوط الدولة: التفكك المناطقي الشامل |

Surviving all 40 turns, first match wins:

| Condition | Title |
| :--- | :--- |
| lowest meter ≥ 55 and average ≥ 68 | العنقاء السيادية: النهضة السورية الكبرى |
| السيادة < 35 | الإمارة المرهونة للشركات الأجنبية |
| الأمن ≥ 65 and الثقة < 45 | حصن الحامية العسكرية الدائمة |
| الخزينة < 35 | صحراء العطش والتصحر المناخي |
| otherwise | الجمهورية المفرغة من كفاءاتها |

Each ending has a subtitle and a 2–3 sentence narrative rewritten from the
main game's (`src/lib/engine/fail-states.ts`, `century-engine.ts`) to fit the
four meters.

### 3.4 Content format

```ts
type MeterId = 'treasury' | 'trust' | 'security' | 'sovereignty';
interface Answer {
  label: string;      // imperative verb + object, ≤ 34 characters
  result: string;     // past-tense headline, ≤ 80 characters
  effects: Partial<Record<MeterId, number>>;
  decree?: string;    // starts a standing decree
  endDecree?: string;
  setFlags?: string[];
  followUp?: { id: string; delay: number };
}
interface DossierCard {
  id: string;
  kind: 'deck' | 'followup' | 'overreach';
  from: string;       // in-world sender, ≤ 26 characters («وزارة الطاقة»)
  title: string;      // ≤ 46 characters, no final punctuation
  text: string;       // 1–2 sentences, ≤ 150 characters
  tags: string[];
  weight: number;
  when?: Condition;   // data, not a function: flags / meter thresholds / turn range
  right: Answer;      // drag right
  left: Answer;       // drag left
}
```

### 3.5 UI (phone portrait first)

```
┌ ExtrasBar: قرارات عاجلة ······························· الألعاب ┐
│ الخزينة 55 ▼3 │ الثقة 61 ▲4 │ الأمن 48 │ السيادة 52   (4 capsules)│
│ [decree tags, one line, scrolls sideways if many]                │
│ الدور 07/40 · 2030 · الشتاء                     ملف 1/2           │
│ ┌ result strip: «النتيجة» + last answer's headline ┐             │
│ ┌──────────────────── file card ───────────────────┐             │
│ │ من: وزارة الطاقة                                │              │
│ │ Title (20px bold)                               │              │
│ │ Text (16px, 1.7)                                │              │
│ └──────────────────────────────────────────────────┘             │
│ [→ answer right  ]  [answer left ←]   2 columns, ≥ 64px tall     │
│ [ أجّل الملف · 3 ]                                                 │
└──────────────────────────────────────────────────────────────────┘
```

- Meter capsules copy the main game's top-bar stat look: label 11–12px muted,
  value 18–22px bold `num`, a thin track bar in the meter colour, a
  `▲3`/`▼3` delta after each answer in `--c-pos`/`--c-neg`. While dragging,
  the meters an answer would move show a dot sized by magnitude (no sign).
- The card is a flat square panel with an amber 3px top stripe; dragging
  translates and tilts it; past a threshold the chosen answer's label appears
  on the card edge; release commits. Buttons and arrow keys do the same.
- Title screen and ending screen follow the main game's title curtain and
  ending modal: amber kicker, display-font title, muted subtitle, primary
  chamfer button.
- Ending screen: title, subtitle, narrative, the four final meters, a line
  chart of the four meters over the term (SVG, theme colours), the decrees
  in force, «ابدأ ولاية جديدة» and «الألعاب».

### 3.6 Balance targets (`scripts/extras/test-dossier.ts`)

- ≥ 500 random games and ≥ 500 careful-bot games without errors.
- Random play collapses mostly between turns 8 and 25.
- The careful bot (protects its lowest meter) completes the term ~50% of the
  time; all 5 collapse endings and all 5 term endings are reached.
