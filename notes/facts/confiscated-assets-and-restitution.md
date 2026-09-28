# Confiscated assets and international restitution

**Status: the one CONFIRMED claim is the Rifaat al-Assad restitution. The four
oligarch-asset valuations remain unsourced balance parameters.**

> A significant and previously unrecorded finding: the selective-restitution
> process is entangled with a **$7 billion, 5,000 MW private energy project**.

## What the game says

`BASELINE_CONFISCATED_ASSETS` — four assets, each a decision object with
`SETTLED` / `NATIONALIZE_SOE` / `FOREIGN_LIQUIDATION` outcomes:

| Asset | Game valuation | Game yields |
| :--- | :--- | --- |
| Syriatel / MTN Syria | $650M (`valuationSYP: 45_000_000_000`) | settlement 0.8×, liquidation 0.6× |
| Adra Smelting Mills (Hamsho) | $280M | — |
| Marota City / Cham Holding | $400M | — |
| Four Seasons Damascus 51% (Foz) | $140M | — |

Nationalisation adds 8,000 civil-service jobs and **+5 systemic corruption** per
asset. The Rifaat al-Assad restitution is highlighted in the fact-check report
but is **not present in the game at all**.

## What the sources say — Rifaat al-Assad / France: CONFIRMED

The fact-check report's row 6.5 is **accurate**, despite citing a placeholder.

- **€51 million ($58 million)**, to be returned to Syria.
- Signed as a **letter of intent on 7 July 2026** at the Presidential Palace in
  Damascus, during **President Macron's visit**, by French Foreign Minister
  **Jean-Noël Barrot** and Syrian Foreign Minister **Asaad al-Shaibani**.
- **First application of France's 2021 law** creating a framework for restitution
  of funds from the sale of ill-gotten gains seized by the state.
- **Rifaat al-Assad** — Bashar's uncle — was convicted in France (2021/2022,
  sources differ) of corruption and money laundering of Syrian state funds
  through a European property empire, and sentenced to **four years**. His total
  French assets are estimated at **€90 million**.
- The funds are to "finance concrete development projects within the country".
- Discussions began in earnest in **February 2026** with a Syrian delegation in
  Paris.
- Same visit: France and Syria established a **comprehensive co-operation
  framework** across economic, cultural, heritage, educational, healthcare,
  security and justice sectors. Macron also returned **23 artefacts** from the
  Arab World Centre, lent in 2010 and never returned after the war began.

## What the sources say — the four domestic assets

**Not verified.** No source was located for the existence details or the
valuations. Syriatel's ownership under the Assad era, Adra, Marota City and the
Four Seasons stake are all well-known threads, but the **specific valuations are
not disclosed transaction values** — they are almost certainly chosen numbers.
The fact-check report presented them in an "In-Game Valuation" column under a
`[VERIFIED FACTUAL]` verdict, which conflates asset existence with price.

**Scale context:** the entire $650M Syriatel valuation is **0.6%** of the $108B
damage total. A player could reasonably conclude that nationalising everything is
transformative. It is not, and the game signals nothing about that.

## The new finding: restitution as an investment channel

**Finance Ministry Decision 963 of 2 July 2025** lifted the freeze imposed by
Decision 5588 on **24 September 2012** on the assets of **14 named individuals**,
among them four sons of Mohammad Raslan Al-Khayyat — including **Moataz Al-Khayyat**,
a Syrian-born Qatari businessman and chairman of **Power International Holding
(PIH)** and **UCC Holding**.

**On 29 May 2025**, Moataz Al-Khayyat, in his capacity as UCC Chairman, signed a
**memorandum of understanding with the Syrian government for a USD 7 billion
energy project**: four gas power plants and one solar plant with a combined
capacity of up to **5,000 megawatts**.

A second name on that list was **Khaled Al-Mahamid**, a Syrian-Emirati businessman
from Daraa and former deputy chair of the Syrian Opposition Negotiations
Commission.

## Verdict

- **Rifaat al-Assad / €51M / 7 July 2026 / France's 2021 law: VERIFIED.** The
  report got this right.
- **The four domestic asset valuations: UNVERIFIED**, and mislabelled by the
  report.
- **Decree 13: UNVERIFIED** (see
  [decrees-13-16-illicit-wealth.md](decrees-13-16-illicit-wealth.md)).
- **NEW AND SIGNIFICANT:** selective de-freezing of confiscated assets is being
  used as a channel for foreign direct investment, at a scale — $7B and 5,000 MW
  — that exceeds anything the game models. Note the 5,000 MW figure sits at the
  top of independent estimates of total national grid demand (5,000–7,000 MW).

## Game impact

- **MISSING FROM GAME: international restitution.** €51M is small, but the
  *mechanism* — first-ever use of a Western restitution law, sovereign-to-sovereign,
  earmarked for development projects — is a distinct and highly gameable
  instrument. The game has no external-restitution track at all.
- **MISSING: selective de-freezing as an FDI lever.** This is the strongest
  available governance/economy mechanic found in this entire research pass: you
  cannot restitute 320,000 people's property, but you *can* unfreeze a named
  businessman's assets in exchange for a $7B energy project. That is a real
  decision with a real moral cost, and the game has no version of it.
- **MISSING: the mega-project.** A 5,000 MW, $7B private energy programme is
  larger than the entire modelled national grid and larger than any single
  strategic project in `BASELINE_GOVERNORATES`. The `mortgage_*` mechanic
  generates a few hundred million; this is two orders of magnitude bigger.
- **BALANCE PARAMETERS, NOT FACTS:** the four valuations should be labelled as
  design choices in `constants.ts`, the way `revenues.ts` labels patronage costs.
  Sitting unmarked next to genuinely sourced constants like `unrepairedDamageUSD`,
  they read as researched.
- **MISSING: the scale signal.** Nothing in the engine tells a player that
  confiscating every oligarch asset yields a rounding error against the damage
  bill. That is a real and forgone strategic insight.

## Sources

- The National, 7 Jul 2026 — €51M/$58M letter of intent, Macron visit, Barrot /
  al-Shaibani, 2021 law, Rifaat al-Assad conviction, €90M total —
  <https://www.thenationalnews.com/news/2026/07/07/france-and-syria-begin-return-of-assad-era-confiscated-assets/>
- Anadolu, 7 Jul 2026 — declaration signing, conviction date —
  <https://www.aa.com.tr/en/middle-east/syria-france-sign-deal-to-return-assets-looted-by-rifaat-al-assad/3988874>
- Syria Report / HLP, 15 Jul 2025 — **Decision 963, the 14 named individuals,
  Moataz Al-Khayyat and the $7B / 5,000 MW energy MoU of 29 May 2025**, Khaled
  Al-Mahamid — <https://hlp.syria-report.com/hlp/justice-and-finance-ministry-decisions-reveal-selective-approach-to-property-restitution/>
- PAX for Peace, Sep 2025 — 40,602 orders, 320,000 citizens —
  <https://paxforpeace.nl/wp-content/uploads/sites/2/2025-09/PAX_Syria-Report_Reclaiming-What-Was-Taken_v1.4.pdf>

See also: [decrees-13-16-illicit-wealth.md](decrees-13-16-illicit-wealth.md),
[outdated-electricity-grid.md](outdated-electricity-grid.md),
[unmodelled-sectors.md](unmodelled-sectors.md)
