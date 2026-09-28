# Decrees 13 and 16 — illicit enrichment and property restitution

**Status: VERIFIED, with an important narrowing.** The decree exists and its date
and legal basis are confirmed. The fact-check report **materially overstated how
much it actually did** — the real decree is narrow, partial and, in places,
cynical. That makes the game *more* wrong than the report implied.

## What the game says

- A `BASELINE_COMMISSIONS` entry for illicit-enrichment / anti-corruption work.
- The Rif Dimashq strategic project: `تطبيق التوثيق العقاري الرقمي وفق المرسوم 16`
  (digital land registration under Decree 16).
- Shared panel text: `إنفاذ المرسوم 16 لرد الملكيات` (implementing Decree 16 to
  return property).
- `directives.propertyRestitution` as a player policy, and
  `Flag_Bedouin_Restitution_Paid`.
- **Law 10 is genuinely purged** — `grep -rn "القانون 10" src/` returns nothing.

## What the sources say — Decree 16

**Legislative Decree No. 16 of 2025**, issued by transitional president Ahmad
al-Sharaa. Sources give the date as **10, 11 or 12 May 2025**. Issued under
**Article 48 of the Constitutional Declaration**. Confirmed publicly by Finance
Minister **Mohammed Yosr Bernieh** at a press conference.

**What it does:** cancels *precautionary seizure orders* issued by the Ministry
of Finance between **2012 and 2024**, on instructions from security agencies,
under **Law No. 63 of 2012 on the Powers of Judicial Police Authorities**.

**What it explicitly does NOT do — the crucial part:**

- It does **not** touch property already converted into **executive confiscation**
  by the **Anti-Terrorism Court**.
- It does **not** annul judicial decisions, including those of exceptional
  courts.
- It did **not repeal Law No. 63 of 2012** itself. Syria Report: "its continued
  existence in the legal system, albeit inactive, leaves the door open for its
  legal revival."
- It contains **no compensation mechanism** and no mechanism for valuing losses.
- People convicted **in absentia** remain outside its scope.

**Scale:** the Syrian Network for Human Rights documented **at least 40,602
seizure and confiscation orders** affecting approximately **320,000 Syrian
citizens** between 2012 and 2024.

**Implementation is piecemeal and name-based:**

- **Justice Ministry Decision 682** applied only to individuals "listed by name".
- **Finance Ministry Decision 963 (2 July 2025)** lifted a freeze imposed on
  24 September 2012 covering **14 named individuals**.
- **Presidential Decree 121 (23 June 2025)** reconstituted a judicial committee
  to review appeals.
- **Justice Ministry Decision 975 (30 June 2025)** opened that committee to **all**
  affected individuals, not just those named — a real widening.
- Law No. 26 of 2023 governs management and transfer of confiscated assets.

**Assessment (Syria Report, July 2025):** the result is "a selective path that
fosters reliance on clientelism and undermines the principle of equality", leaving
thousands outside the scope of redress.

## What the sources say — Decree 13

**Not located in this pass.** The fact-check report claimed a National Committee
for Combating Illicit Enrichment, Decision No. 13 of 4 May 2025, with voluntary
disclosures and asset recovery. No primary source was found. The report's own
citation for it was the absent design document. The committee's *existence* is
plausible and the Arabic name
(اللجنة الوطنية لمكافحة الكسب غير المشروع) is well attested; the number and
date are unconfirmed.

## Verdict

**Decree 16: VERIFIED, and the report overstated it.** The report wrote that it
"nullif[ied] arbitrary administrative seizures under Decree 63 of 2012 and
unfroze assets of **tens of thousands** of displaced persons and dissidents."

The reality is narrower and less flattering: Decree 16 lifted one *category* of
freeze (precautionary, administrative), left court-ordered confiscations and
Law 63 itself intact, covered an estimated 320,000 people of whom only a
name-listed few were actually helped, and shipped no compensation. Reviewing
scholars and human rights organisations describe it as partial and
inequitable.

**This is a more interesting fact than the report's version.** A decree that
formally restores property rights, does not repeal the enabling law, and is
administered by name-list, is a precise model of selective redress — and it is
exactly the kind of thing a player in a transitional state would have to exploit
or resist.

**A founding decree number: still UNLOCATED.** The Commission is real and is run
by the Minister of Agriculture, al-Suwaidan. Note that "Decree 13" is the wrong
attribution — the real Decree 13 of 2026 concerns Kurdish citizenship. See
[decrees-59-98-100-101.md](decrees-59-98-100-101.md).

## Game impact

- **MISSING: the scale.** ~320,000 people and 40,602 orders affected. The game has
  no representation of the confiscation backlog at all.
- **MISSING: the selectivity.** This is the strongest available gameplay hook in
  the whole governance layer. A `propertyRestitution` policy that trades
  *legitimacy* against *enforcement capacity* — where a narrow, name-list
  approach buys you speed and buys you cynicism — models the actual decree far
  better than a binary lever.
- **MISSING: the un-repealed Law 63.** A dormant enabling law that can be revived
  is a standing threat to property rights and foreign investment. Nothing in the
  engine models dormant legal risk.
- **MISSING: no compensation mechanism.** The absence of one is precisely why
  restitution is politically explosive.
- **INCORRECT IMPLICATION:** the game treats restitution as discretionary policy
  with a reputational cost only. Article 48 of the Constitutional Declaration
  makes restoration of confiscated property a **constitutional obligation** — the
  state's discretion is narrower than the fiction implies, and the
  *implementation* of that obligation is where the politics lives.
- **NOT MODELLED: the foreign-investor vector.** See
  [confiscated-assets-and-restitution.md](confiscated-assets-and-restitution.md) — one of
  the 14 people whose freeze was lifted in July 2025 immediately signed a $7B,
  5,000 MW energy project with the government.

## Sources

- **Decree No. 16 full analysis**, Syria Report / Human Rights Legal Project,
  10 Jun 2025 — scope, exclusions, Law 63 not repealed, no compensation —
  <https://hlp.syria-report.com/hlp/decree-no-16-lifts-security-seizures-without-dismantling-the-exceptional-framework/>
- Syria Report / HLP, 15 Jul 2025 — Decisions 682, 963, 975; Decree 121; Law 26 of
  2023; selectivity critique; the Al-Khayyat $7B energy MoU —
  <https://hlp.syria-report.com/hlp/justice-and-finance-ministry-decisions-reveal-selective-approach-to-property-restitution/>
- PAX for Peace, *Reclaiming What Was Taken*, Sep 2025 — 40,602 orders / 320,000
  citizens; date; Law 63 analysis; compensation recommendations —
  <https://paxforpeace.nl/wp-content/uploads/sites/2/2025-09/PAX_Syria-Report_Reclaiming-What-Was-Taken_v1.4.pdf>
- Constitutional Declaration, Art. 48 —
  <https://constitutionnet.org/sites/default/files/2025-03/2025.03.13%20-%20Constitutional%20declaration%20%28English%29.pdf>
- Fadel Abdulghany, 12 Aug 2025 — decree mechanics, retroactivity principle,
  Article 2 implementation —
  <https://fadelabdulghany.net/blog/2025/08/12/details-of-the-ousted-regimes-plot-to-steal-the-wealth-of-syrian-citizens/>

See also: [constitutional-declaration.md](constitutional-declaration.md),
[confiscated-assets-and-restitution.md](confiscated-assets-and-restitution.md)
