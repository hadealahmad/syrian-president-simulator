# Bab el-Mandeb and Hormuz: in-game event conditions

**Status: NOT A FACTUAL CLAIM. Game-design artefact — nothing here needs
verifying.**

This file previously sat in the `unverified-` set on the assumption that the
200–300% shipping-premium figure attributed to these two cards was a factual
claim requiring sourcing. That assumption was wrong on two counts:

1. **The figure appears nowhere in the game.** The cards
   `event_05_bab_el_mandeb` and `event_06_hormuz_interdiction` use in-game
   balance costs — `costUSD: 95_000_000` for a freight-and-insurance subsidy,
   and similar figures on the other options. No percentage premium is stated
   anywhere in the deck.
2. **These are designed random-event conditions, not empirical claims.** A
   maritime chokepoint closing is a scenario the simulation needs to be able to
   generate. It is not a statement about a measured shipping rate.

The 200–300% figure was a paraphrase in the May 2026 fact-check report, and the
report's verdict on it was never independently checked. There is no reason to
check it now: nothing in the codebase depends on it.

## What the game actually models

Two exogenous cards, plus the chokepoint as a recurring cost driver on several
agriculture and industry cards.

**`event_05_bab_el_mandeb` — title `أزمة الملاحة البحرية في باب المندب`**
Scripted to **turn 5**, so every playthrough sees it. Attributed to the Maritime
Chamber and the Ministry of Economy. Its options are the standard
freight-laissez-faire shape: subsidise freight and insurance directly
(`opt_freight_subsidize`, $95M, +trust, −unrest, +competence), pass the full cost
to consumers (`opt_freight_laissez`), or a middle option.

**`event_06_hormuz_interdiction` —TITLE `اعتراض إمدادات الطاقة في مضيق هرمز`**
The energy-supply analogue, for fuel and feedstock rather than cargo.

The design is sound and the mechanic is well-formed: a chokepoint closure is a
supply shock that the player can absorb with money, or pass to consumers at a
political cost. That is a genuine dilemma, and it is exactly the kind of
tension the deck is for.

## What is nonetheless true, and worth keeping

The **setting** is real even though the numbers are designed. Both straits are
live chokepoints on Syrian import routes, and the structural logic is sound:

- Syria is a net importer of grain, fuel and fertiliser.
- The Bab el-Mandeb sits on the Red Sea route serving **Tartous and Latakia**.
- Freight and war-risk insurance are **distinct** costs, and conflating them
  hides a real trade-off — rerouting, cover, alternative ports.

That is enough for the fiction. The engine treats the outcome as a cost curve
and a trust/unrest swing, which is the correct level of abstraction.

## Two genuine gaps in the *design*, not the facts

**1. Escalation only.** The cards can only make things worse. Red Sea and
Gulf shipping conditions have moved in both directions in recent years, and a
game set in 2027 that can only model escalation at a chokepoint misses half the
real risk distribution. Not researched here.

**2. Freight and insurance are not separable.** In the model they are one cost.
They are two different levers in reality: rerouting, war-risk cover, and
alternative ports can each be bought independently. Splitting them would give the
player a genuine mitigation choice rather than a single dial.

## Sources for the setting (not for any figure in the game)

- UN Common Country Analysis (Syria) — the economy relies on imports for ~85% of
  consumption, widening the trade deficit —
  <https://syria.un.org/sites/default/files/remote-resources/0ebedb4696282d412da50442b4a40915.pdf>
- World Bank *Syria Macro-Fiscal Assessment*, June 2025 — import dependence and
  the trade deficit — <https://documents1.worldbank.org/curated/en/099844407042516353/pdf/IDU-6adac64c-c9b1-472e-8183-ae600f64fa78.pdf>
- World Bank Syria Macro-Fiscal Outlook — port traffic up more than sixfold;
  ~300,000 t/month imports through Tartous and Latakia —
  <https://thedocs.worldbank.org/en/doc/65cf93926fdb3ea23b72f277fc249a72-0500042021/related/mpo-syr.pdf>

See also: [unmodelled-sectors.md](unmodelled-sectors.md),
[fact-check-report-errors.md](fact-check-report-errors.md)
