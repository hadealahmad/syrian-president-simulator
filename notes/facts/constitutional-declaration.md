# Constitutional Declaration of 13 March 2025

**Status: VERIFIED, with a significant gap — the legislature now exists and the
game's 2027 setting predates nothing.**

## What the game says

The game models a **presidential** system with no legislature:
`BASELINE_MINISTRIES` holds 8 ministries, `BASELINE_COMMISSIONS` holds 5
commissions, and there is no parliamentary or assembly entity anywhere in
`GameState`.

The README describes the system as a "political and governance management
system" centred on the presidency.

## What the sources say

**Constitutional Declaration of the Syrian Arab Republic** (signed 13 March 2025,
in force for a five-year transitional period):

- 53 articles. Key structure per the English translation:
  - **Article 31** — Executive power. **Article 32** — President is commander in
    chief. **Article 35** — Cabinet composition and oath.
  - **Article 39** — law-making process. **Article 48** — transitional justice:
    cancel all exceptional laws inconsistent with human rights, overturn
    Anti-Terrorism Court rulings, **restore confiscated property**, abolish
    exceptional security and real-estate measures.
  - **Article 49** — a transitional justice commission shall be established, with
    war crimes and crimes against humanity excluded from non-retroactivity.
  - **Article 52** — length of the interim period. **Article 53** — publication
    in the Official Gazette.
- Drafting committee formed 2 March 2025; ratified 13 March 2025.
- al-Sharaa was formally appointed president on **29 January 2025** at the
  Revolution Victory Conference.

**The institutional timeline has moved on since the game's data was written:**

| Event | Date |
| :--- | :--- |
| First executive formed | 29 March 2025 |
| Constitutional Declaration ratified | 13 March 2025 |
| **First legislature (People's Assembly) seated** | **12 July 2026** |
| First court established | 11 July 2026 |

Government structure: unitary presidential republic, President as head of
government, unicameral People's Assembly, Supreme Judicial Council and Supreme
Constitutional Court.

## Verdict

**VERIFIED** on the declaration itself: date, 5-year term, presidential executive,
and the transitional-justice mandate are all confirmed against the published
English text.

**GAP:** the **People's Assembly was seated on 12 July 2026** — five months before
the game is set. The game is set in a Syria that, by then, had a functioning
legislature, an established constitutional court, and a transitional justice
commission operating under a decree. The simulation has none of these.

## Game impact

- **MISSING FROM GAME: the People's Assembly.** A legislature is one of the most
  natural sources of political capital in a presidential system — coalition
  bargaining, quorum, committee leverage, and blocking power are all distinct
  from the existing decree/PC economy. Its absence is conspicuous in a 2027
  setting.
- **MISSING: Article 48's confiscated-property restoration** as an enforceable
  legal obligation. The game has a `propertyRestitution` policy lever and a
  Decree 16 reference, but no notion that the Constitutional Declaration
  *mandates* restitution and cancellation of exceptional security measures. A
  player's discretion here is narrower in reality than the game implies.
- **MISSING: the five-year transition clock.** The declaration expires in 2030.
  A 2027-start, 40-turn game runs to 2046 — three transitions past the
  declaration's life. A "what happens when the transitional period ends"
  mechanic would be a natural late-game arc, and is currently absent.
- **MISSING: the constitution itself as an object.** Article 52's sunset and
  Article 50's amendment procedure are both gameable.

## Sources

- Constitutional Declaration, English translation (Art. 31, 32, 35, 48, 49, 52,
  53) — <https://constitutionnet.org/sites/default/files/2025-03/2025.03.13%20-%20Constitutional%20declaration%20%28English%29.pdf>
- Constitutional Declaration (automated translation, Refworld) —
  <https://www.refworld.org/sites/default/files/2026-06/sryia_constituional_declaration.pdf>
- Wikipedia, *Constitutional Declaration of the Syrian Arab Republic* (dates,
  12 July 2026 legislature) —
  <https://en.wikipedia.org/wiki/Constitutional_Declaration_of_the_Syrian_Arab_Republic>
- Al-Monitor, 17 May 2025 (decree implementing Art. 49) —
  <https://www.al-monitor.com/originals/2025/05/syria-announces-commissions-missing-persons-transitional-justice>

See also: [decrees-19-20-transitional-justice.md](decrees-19-20-transitional-justice.md),
[unmodelled-sectors.md](unmodelled-sectors.md)
