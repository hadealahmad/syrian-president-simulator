# Errors in the May 2026 fact-check report

**Status: corrections.** The report's own header now withdraws its headline
scores, but several specific rows are still wrong. This file records them so the
next audit does not re-inherit them.

## Score claims

| Claim | Problem |
| :--- | :--- |
| "Empirical Authenticity Score: **94.2%**" | No denominator stated. Not reproducible: the report has 36 audit rows, 33 `[VERIFIED FACTUAL]` and 3 `[PARTIALLY FACTUAL]` — which is 91.7% unqualified or 94.4% counting caveated rows as confirmed. Neither is 94.2%. |
| "the simulation code and documentation now achieve **100% factual fidelity**" | Contradicts the 94.2% above, counts `[PARTIALLY FACTUAL]` rows as clean, and is asserted against a source that is not in the repository. Withdrawn. |

## Sourcing

- The report's **primary source is not in the repository** and is git-ignored
  (`.gitignore:31`). Every `Design Doc Line N` citation — about 20 of them — is
  therefore unverifiable by a reader.
- `plan/` is **also git-ignored**, and 6 of its 14 files declare themselves
  superseded. The report audits against them for "100% alignment".
- **CORRECTION — I was wrong here.** Row 2.7 cites `sfuturem.org`, which I
  previously called a placeholder. It is **Syrian Future Movement** (تيار
  المستقبل السوري), a real outlet, and it publishes the full text of Decree 59.
  Row 2.7 is **correct and now verified against SANA**. See
  [decrees-59-98-100-101.md](decrees-59-98-100-101.md).

## Specific rows that are wrong

| Row | Claim | Problem |
| :--- | :--- | :--- |
| 1.7 | "90% of Population Below Poverty Line ($3.00/day)" | **Conflates two measures.** The 90% figure is the WFP *hardship* share — households struggling to meet basic needs. The share below $3.00/day (2021 PPP) is ~21%; below $4.20/day ~47%. Overstates extreme poverty ~4×. See [partial-poverty-and-food-basket.md](partial-poverty-and-food-basket.md). |
| 1.3 | Budget "worth ~$2.8B at late 2024 rates" | The World Bank's own conversion is **$2.5B**. $2.8B applies a later appreciated rate to the same nominal budget. See [national-budget.md](national-budget.md). |
| 1.4 | Reserves "$320M – $450M" | The only published figure located is **~$200M** (unnamed official, via Reuters). The IMF/EIU range could not be produced. See [partial-fx-reserves.md](partial-fx-reserves.md). |
| 1.5 | Parallel rate 15,000–16,200 old SYP | The documented market rate was **14,800** at end-2024 and **~10,000–11,000** by mid-2025. The top of the report's range is above any figure located. See [exchange-rate-and-redenomination.md](exchange-rate-and-redenomination.md). |

## Section 7 remediation claims

All four `[FIXED & VERIFIED]` remediations are **genuinely true** — Law 10 is
gone, the M5 checkpoint flag is gone, Decree 20 is correctly attributed. But
**every code reference supporting them was wrong**:

| Claimed location | Actually contains |
| :--- | :--- |
| `constants.ts:307` (Law 10) | A Hama pasture-grazing project. Real location: `constants.ts:404`. |
| `MinistryDrawer.svelte:38` | **The file does not exist.** Real location: `ui/panels/shared.ts:48`. |
| `baseline.ts:33` (M5 flag) | `Flag_Port_Graft_Active`. Real location: the `flags` block, `baseline.ts:30-35`. |
| `constants.ts:742` (Decree 20) | The opening line of `BASELINE_MINISTRIES`. Real location: `constants.ts:816-857`, `transitional_justice` at `:849`. |
| `constants.ts:686-715` (Decrees 98/100/101) | The `deir_ez_zor` governorate block. Real locations: `:793` (101), `:803` (100), `:820` (98). |

Four cited event IDs no longer exist — the original 14-card deck was replaced by
ten thematic decks, and `event_03_livestock_drain`, `event_07_poultry_feed_shock`,
`event_08_gas_pipeline` and `event_09_euphrates_flow` were all retired.
Current IDs: `event_12_awassi_export`, `event_11_poultry_feed_shock`,
`event_09_gas_severance`, `event_07_euphrates_flow`.

## Row 2.5 is refuted

The report attributes "Decision/Decree No. 13 of May 4, 2025 — National Committee
for Combating Illicit Enrichment" and marks it `[VERIFIED FACTUAL]`.

**Decree No. 13 of 2026** is about **Kurdish citizenship** — abolishing the 1962
Hasakah census, granting nationality to previously unregistered Kurds, and making
Nowruz a paid national holiday. Decree numbers are year-scoped, so the two are
different instruments. No founding decree for the Anti-Illicit Enrichment
Commission was located; the Commission is real and is run by the Minister of
Agriculture, but its legal basis is Decree 16 plus the Commission itself.

## The biggest omission

**The report never audited the debt parameter set at all.** Its Section 6 is
titled "Confiscated Oligarch Assets & **Sovereign Liabilities**" and contains
zero liability figures. Not audited: the $45M legacy coupon, the $25M Iran
coupon, the $7B Iran oil ledger, the $6.1B recognised debt stock, three foreign
loan packages, two sovereign mortgages, three concessional facilities.

This matters because those numbers turned out to be the least accurate part of
the project — real total debt is ~$27B. See
[sovereign-debt.md](sovereign-debt.md).

## What the report got right

Worth recording, because most of it is sound:

- **Provincial damage**: all 14 figures, summing to $108,206,000,000 against a
  published $108,197M. The $9M excess is per-governorate rounding.
- **Reconstruction**: $216B / $108B / $82B / $75B / $59B — exact.
- **GDP $21.4B and the $67.5B peak** — correct, though the report had no source
  for them; it is the World Bank Macro-Fiscal Assessment.
- **Decree 20 → Transitional Justice, Abdul Basit Abdul Latif** — correct, and
  confirmed against the published decree text.
- **Constitutional Declaration, 13 March 2025, five-year term** — correct.
- **Assad's fall on 8 December 2024** — correct.
- **Population 23,462,346** — correct for its vintage, now ~2M low.

## Net assessment

The report is **strong on the things it measured and silent on the things that
matter most.** Its demographic, damage, infrastructure and governance content
survives re-verification. Its financial content is partly unsourced design
context, and its debt content was never examined — which is exactly where the
project's largest factual error lives.


## Sources

The corrections above are verifiable against the code in this repository and
against the sources cited in the linked fact files. The two primary documents
that most of them turn on:

- World Bank *Syria Macro-Fiscal Assessment*, June 2025 —
  <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- World Bank *Physical Damage and Reconstruction Assessment 2011–2024* —
  <https://documents1.worldbank.org/curated/en/099102025095540101/pdf/P510947-f30bd5f6-78d5-4712-9f1e-a558b5c8ba75.pdf>

For the original report's own claims and their (missing) citations, see the
`Design Doc Line N` references throughout `FACT_CHECK_REPORT.md` and the
`.gitignore:31` entry that excludes the source document.
