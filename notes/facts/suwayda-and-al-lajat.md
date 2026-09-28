# Suwayda autonomy and the July 2025 escalation

**Status: VERIFIED, with two significant corrections.** The core of the fact-check
report's account holds up. Its **displacement figures were wrong by a factor of
three and mislabelled by community**, and it missed that the violence involved
atrocities by *government* forces, not only sectarian actors.

## What the game says

The southern theatre is the most mechanically developed subsystem in the engine:

- `as_suwayda`: `suwaydaIntegrationIndex: 8`, `suwaydaSecessionProb: 24`,
  `tribalRageIndex: 74`, plus a strategic project.
- `daraa`: `daraaDefianceIndex: 54`, `nassibRevenueCapturePct: 32`.
- `updateSouthernFront()` implements integration / secession / tribal / Daraa-Golan
  postures.
- `event_s01_lajat_siege` (scripted turn 7) and `event_d02_golan_incursion`
  (scripted turn 10), plus a 50%-per-turn `event_suwayda_accord_spoiler`.
- `HISTORIC_ACCORD` → integration 100, secession 0, tribal rage 0, PRRI 15.
- `BALKANIZATION_CASCADE` fires at secession ≥85% plus ≥2 autonomous-frontier
  revolts.

## What the sources say

**The autonomy claim is confirmed.** Druze armed factions **seized control of
Suwayda governorate in late 2023**, and territorial control did not change
thereafter. They joined the offensive that toppled Assad in December 2024, then
some Druze leaders rejected the transitional government's plans to deploy troops
and to disarm and integrate local factions.

**Sheikh Hikmat al-Hijri is confirmed**, and characterised more sharply than the
report did. EUAA describes him as **one of the three highest Druze spiritual
authorities in Suwayda, known for a pro-Israel stance**, who **rejected talks
with the new central government**. The Druze Military Council later consolidated
as the **Suwayda National Guard**. **Men of Dignity** is a real faction folded
into the NGF. On **23 August 2025** about 30 Druze factions formed the
**National Guard Forces**, pledging allegiance to al-Hijri — with Enab Baladi's
headline reporting that al-Hijri **called for separation from Syria**.

**al-Lajat is confirmed.** The volcanic region lies between western Suwayda and
eastern Daraa; tribes there include Madaljeh, al-Salout, al-Biyadin and al-Shar'a.
**Sheikh Rakan al-Khudeir**, a Syrian-Jordanian businessman linked to cross-border
smuggling, leads the "Southern Tribes Gathering" from the al-Lajat area.

**The July 2025 escalation is confirmed — and far larger than the report states.**

- Trigger: a Bedouin/Druze **checkpoint confrontation on 12 July 2025**.
- Fighting 13–19 July 2025 across Suwayda, Daraa and Rif Dimashq.
- **OHCHR Commission of Inquiry (27 March 2026): more than 1,700 killed** by its
  conservative assessment, the large majority Druze, but also Bedouins and
  government forces. Local sources put it at ~2,000. **34–35 villages destroyed.**
- **Displacement: 93,000 within a week (UN OCHA), 187,000 by late July (UN OCHA)**
  — Human Rights Watch cites up to 187,000; OHCHR counted **155,000 still
  displaced** at time of writing. Syria Direct/IOM counted ~80,000 on 16 July.
- **All three parties committed grave abuses**: government forces and allied
  tribal fighters against Druze civilians; Druze armed groups against Bedouin
  civilians (including the Shahba massacre of 19 Bedouin); and Druze–Druze
  detention killings by the NGF.
- **Israel conducted airstrikes on 16 July 2025** against Syrian government forces
  and Bedouin fighters, explicitly to defend the Druze.

**Corrections to the fact-check report:**

1. **Displacement is mislabelled and under-scaled.** The report attributes the
   index to "50,000+ Sunni Bedouin tribesmen displaced". Reality: Suwayda's total
   Bedouin population is only **~35,000** (2023 governorate census), and total
   displacement was **155,000–187,000**, overwhelmingly **Druze**. The report's
   framing — Bedouin anger as the driver — inverts the actual causal structure,
   in which state forces attacked the Druze majority and Druze groups then
   retaliated against Bedouins.
2. **Suwayda's population is understated.** The game uses **446,493**; the
   governorate's own 2023 census gives **~650,000**. (Methodology may differ, so
   treat as a flag rather than a settled correction — but the game is well below.)

**Where it stands in 2026 — confirmed from OHCHR, March 2026:**

- **"Much of Suwayda governorate remains outside of government control."** Only a
  fragile calm holds.
- Druze factions, including the **National Guard, maintain de facto control of
  central Suwayda**; government forces hold several western and northern villages.
- **155,000 people remain displaced**, many in camps without basic needs or in
  schools. Most want to return but **feel unsafe**.
- **16 September 2025**: Syria, the **United States and Jordan** agreed a
  **roadmap** to resolve the Suwayda crisis and stabilise southern Syria.
  Implementation is "moving slowly."
- The governor is **Moustafa al-Bakkour**, working to restore services.
- OHCHR: "The absence of a credible security or governance framework leaves the
  governorate vulnerable to renewed escalation."
- **15 April 2026**: a rival of al-Hijri was **gunned down in Suwayda**.
- Two Druze clerics died in late 2025 after NGF detention (Dec 2025).

## Verdict

**VERIFIED on structure, corrected on scale.** The report's political read —
autonomous Druze-held Suwayda resisting Damascus, al-Hijri as the decisive figure,
al-Lajat as the tribal fault line — is accurate and well supported.

**The game's starting values are broadly defensible for 2027**, given the
roadmap is failing:
- `suwaydaIntegrationIndex: 8` — a de facto-secessioned governorate outside
  government control with an active separation call is consistent with 8/100.
- `suwaydaSecessionProb: 24` — arguably **low** given "separation from Syria" is
  being called and de facto control is already held, but a player-facing
  probability of 24 that is actually ~de facto reality is a legitimate design
  framing (it measures the *formal* risk).
- `tribalRageIndex: 74` — defensible for a Bedouin population of ~35,000 that was
  itself a target of Druze retaliation. But the axis name is misleading: the
  primary grievance axis of 2025 is **anti-Druze state violence**, not Bedouin
  anger.

## Game impact

- **BROADLY SOUND.** This is the best-sourced political model in the game, which
  is worth saying given it began as `unverified-`.
- **INCORRECT (scale):** the tribal-rage / displacement framing. The engine has
  one tribal index; reality has two opposed victim axes.
- **OUTDATED (population):** `as_suwayda.population` 446,493 vs ~650,000 census.
- **MISSING FROM GAME: the US–Jordan roadmap.** A tri-national stabilisation
  framework for the south is an idealised negotiation track — conditions,
  milestones, and the ability to lose it. Entirely absent.
- **MISSING FROM GAME: the SDF / northeast front.** In **January 2026** renewed
  clashes between government forces and the Kurdish-led Syrian Democratic Forces
  killed **23** and displaced **over 100,000**. A second unresolved front with a
  different armed actor, and HRW explicitly links it to the Suwayda abuses as
  "underscoring the need for comprehensive security sector reform." The game has
  no SDF.
- **MISSING: Israel as an active military actor.** The game models the Golan as a
  passive `golanTensionIndex`. In reality Israel conducted **airstrikes to protect
  Druze communities** in July 2025 and was implicated in a **April 2026
  assassination** in Suwayda.
- **MISSING: the atrocity/justice axis.** Both sides committed grave abuses and
  the NGF killed Druze clerics in detention. `BALKANIZATION_CASCADE` is a
  territorial mechanic with no accountability dimension, which is the actual
  trajectory OHCHR is documenting.
- **MISSING: a 155,000-person displaced population inside the governorate**, which
  the game's `as_suwayda.prri: 62` implicitly represents but which should be a
  discrete, mobile, hunger-generating group.

## Sources

- **OHCHR Commission of Inquiry, A/HRC/61/CRP.7, 27 Mar 2026** — casualty
  figures, 155,000 displaced, de facto control, the 16 Sep 2025 roadmap, 2026
  status assessment —
  <https://www.ohchr.org/sites/default/files/documents/hrbodies/hrcouncil/sessions-regular/session61/a-hrc-61-crp-7.pdf>
- Human Rights Watch, 15 Jan 2026 — abuses by all parties, 187,000 displaced,
  Jan 2026 SDF clashes, Shahba massacre, al-Hijri alignment —
  <https://www.hrw.org/news/2026/01/15/syria-accountability-lacking-for-sweida-abuses>
- **EUAA, "Druze armed groups controlling Sweida"** — late-2023 control, al-Hijri
  profile, pro-Israel stance, NGF formation, July 2025 escalation —
  <https://www.euaa.europa.eu/syria-security-situation/124-druze-armed-groups-controlling-sweida>
- Wikipedia, *Southern Syria clashes (July–September 2025)* — dated chronology,
  ceasefire sequence, Bedouin evacuation, al-Bakkour —
  <https://en.wikipedia.org/wiki/Southern_Syria_clashes_(July%E2%80%93September_2025)>
- Syria Direct, 18 Jul 2025 — al-Lajat tribes, al-Khudeir, tribal mobilisation —
  <https://syriadirect.org/tribal-forces-flock-to-suwayda-clashes-reignite-after-damascus-withdraws/>
- Daraj, 28 Jul 2025 — Suwayda population ~650,000, Bedouin ~35,000 census, Mtolleh
  checkpoint, Southern Tribes Gathering —
  <https://daraj.media/en/suwaydas-tribes-the-social-map-and-dynamics-of-the-struggle/>

See also: [golan-and-israeli-role.md](golan-and-israeli-role.md),
[outdated-population-and-displacement.md](outdated-population-and-displacement.md),
[unmodelled-sectors.md](unmodelled-sectors.md)
