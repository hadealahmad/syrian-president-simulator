# Decree 20 — National Transitional Justice Authority

**Status: VERIFIED. The game is correct**, and this is the one decree claim in
the fact-check report that survives scrutiny with a real primary source.

## What the game says

`BASELINE_COMMISSIONS.transitional_justice`:

```
nameAr: 'هيئة العدالة الانتقالية وفحص المظالم (المرسوم 20)'
leaderNameAr: 'عبد الباسط عبد اللطيف'   (implied)
```

Attributed to **Decree 20**. The fact-check report claimed Decree 19 = Missing
Persons and Decree 20 = Transitional Justice, and reported that the game had the
two **inverted** in an earlier revision before being corrected.

## What the sources say

**Primary source — the decree text itself**, published by the Syrian Arab News
Agency (SANA), 17 May 2025:

> **Presidential Decree No. (20) of 2025 — Establishing the National Authority
> for Transitional Justice**
>
> […] An independent body called the "National Authority for Transitional
> Justice" will be formed.
>
> **Mr. Abdul Basit Abdul Latif is appointed as Chairman of the Authority**, and
> is charged with forming the working team and establishing the internal
> regulations within a period not exceeding (30) days.
>
> The Authority has a legal personality and financial and administrative
> independence, and exercises its duties throughout all Syrian territories.

The companion decree of the same day established the **national commission for
missing persons**. Al-Monitor (17 May 2025) reports both were announced
together, five months after Assad's ouster, and notes the March Constitutional
Declaration had provided for a transitional justice commission.

Wikipedia's article on the National Commission for Transitional Justice confirms:
established **17 May 2025 by Decree No. 20 of 2025**, Abdulbaset Abdullatif as head,
with a 30-day deadline to form a working team.

## Verdict

**VERIFIED — and the game is right on both the number and the appointee.**

- Decree 20 = Transitional Justice. ✅
- Head = Abdul Basit Abdul Latif. ✅
- Date 17 May 2025. ✅
- Financial and administrative independence — which the game's `isActive` /
  `progress` commission model can represent.

The "inverted decree numbers" finding in the fact-check report was correct as a
description of the *earlier design document*, and the correction to the code is
correctly applied. The game is the accurate artefact here, not the report's
narrative of a bug.

## Game impact

Nothing to fix. This is the strongest-verified governance fact in the project and
it is modelled accurately.

One small observation: the game names the body
`هيئة العدالة الانتقالية وفحص المظالم` (Transitional Justice and Examination of
Grievances), which merges the transitional-justice and complaints functions. The
decree names a single "National Authority for Transitional Justice". The blended
Arabic name is a reasonable in-game label, not an error.

## Sources

- **Decree 20 text**, SANA, 17 May 2025 —
  <https://archive.sana.sy/en/?p=355958>
- Al-Monitor / AFP, 17 May 2025 (both commissions announced) —
  <https://www.al-monitor.com/originals/2025/05/syria-announces-commissions-missing-persons-transitional-justice>
- European External Action Service statement, 19 May 2025 — cited in the
  commission's own references
- Wikipedia, *National Commission for Transitional Justice (Syria)* —
  <https://en.wikipedia.org/wiki/National_Commission_for_Transitional_Justice_(Syria)>

See also: [constitutional-declaration.md](constitutional-declaration.md),
[fact-check-report-errors.md](fact-check-report-errors.md)
