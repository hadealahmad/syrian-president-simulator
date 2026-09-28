# Decrees 59, 98, 100 and 101

**Status: UNVERIFIED in this pass.** The report's citation for Decree 59 was a
placeholder (`sfuturem.org`).

## What the game says

All three reshuffle attributions are present in code and were confirmed present
during the re-check of the fact-check report:

| Code location | Content |
| :--- | :--- |
| `constants.ts:793` | `agriculture`: `باسل حافظ السويدان (المرسوم 101)` |
| `constants.ts:803` | `media`: `خالد فواز زعرور (المرسوم 100)` |
| `constants.ts:820` | commission leader `عبد الرحمن الأعمى (المرسوم 98)` |

`BASELINE_MINISTRIES` also carries the energy (Mohammed al-Bashir), economy
(Dr. Nidal al-Shaar), emergency/disaster (Raed al-Saleh) and other portfolios.

**Note on Decree 98's modelling:** al-Aama is Secretary-General of the
Presidency, not a minister. The game models him as a *commission leader*,
which is a reasonable structural choice given the ministry-only schema.

## What the report claimed

- **Presidential Decree No. 59 of 10 March 2026** — a High Committee for
  Infrastructure Rehabilitation, chaired by the Minister of Emergency and Disaster
  Management (Raed al-Saleh) with Finance, Housing, Social Affairs, Local
  Administration, and the Governors of Aleppo, Hama and Idlib. Sourced to
  `Design Doc Line 19` + `sfuturem.org`.
- **Decree 98 of 9 May 2026** — a *three-decree package*: Decree 98 appointed
  Abdulrahman al-Aama Secretary-General of the Presidency; Decree 100 appointed
  Khaled Fawaz Zaarour Minister of Information; Decree 101 appointed Basil Hafez
  al-Suwaidan Minister of Agriculture. The game groups all three under Decree 98
  as a shorthand.

## What could be confirmed

Nothing directly. Note that **Decree 59 is dated 10 March 2026**, which is
*after* the May 2026 audit ran, and **Decrees 98/100/101 are dated 9 May 2026** —
within days of it. Both are recent enough that they are poorly covered.

The one thing confirmed: the report's characterisation of the *grouping* is
self-aware ("the game groups them under Decree 98 as a shorthand") and the code
distinguishes all three, which is more precise than the report claims.

## Verdict

**UNVERIFIED.** Dates and attributions are plausible and internally consistent,
and the code is more careful than the report credits. But there is no primary
source, and a `[VERIFIED FACTUAL]` verdict on a row whose citation was a
placeholder is not defensible.

## Game impact

Nothing to correct in the code. Two notes:

- **MISSING FROM GAME: a reconstruction/rehabilitation committee.** A High
  Committee for Infrastructure Rehabilitation chaired by the emergency minister
  is a very natural governing body for this scenario, and the game has no
  reconstruction-coordination entity. The `$216B` reconstruction figure is in the
  documentation but there is no institution attached to it.
- **NOT MODELLED: the legislature appointment question.** Syria's first
  legislature seated 12 July 2026; ministerial appointments in a presidential
  system with a People's Assembly have a different legitimacy character than the
  game implies. See [constitutional-declaration.md](constitutional-declaration.md).

## Sources to chase

Syrian Arab News Agency (SANA) presidential decree archive for 2026; the
Official Gazette. SANA successfully published the text of Decree 20 —
<https://archive.sana.sy/en/?p=355958> — so a decree-archive search is the
right approach.

See also: [decrees-19-20-transitional-justice.md](decrees-19-20-transitional-justice.md)

> **No source.** This file is marked UNVERIFIED precisely because no
> resolvable primary or secondary source was located for its central claim.
> It records what the May 2026 audit asserted, not a confirmed finding.
