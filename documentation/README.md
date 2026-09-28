# Documentation

Reference documentation for the Syrian President Simulator. This folder is
git-tracked and is the maintained source of truth for **how the software works**.

> **This is not the game's design history.** The original design spec lives in
> `plan/`, which is git-ignored and partly superseded. Where this folder and
> `plan/` disagree, this folder and the code win.

## Reading order

| Document | What it answers |
| :--- | :--- |
| [architecture.md](architecture.md) | How the modules fit together, where state lives, what a turn actually does |
| [simulation-model.md](simulation-model.md) | Every equation the engine computes, with the reasoning behind each |
| [theming.md](theming.md) | How colours are defined once and consumed by CSS, Tailwind, SVG and WebGL |
| [threejs-map.md](threejs-map.md) | The 3D map, the CRT post-processing chain, and the render-loop strategy |
| [stack.md](stack.md) | Toolchain, versions, build, PWA, CI and how to run the tests |

For the *empirical* side — what is factually true about Syria, what the game
gets right, and what it gets wrong — see [`../notes/`](../notes/README.md).

## Conventions used in these documents

- **Source of truth.** Where a number appears here it is quoted from code with a
  `file:line` reference. If the code and a document disagree, the code is right
  and the document is a bug.
- **Equations** are written in plain-text notation next to the code that
  implements them. A formula is never documented without saying where it lives.
- **"Design intent"** marks a deliberate choice. **"Accident"** marks behaviour
  that is load-bearing but was never chosen — worth knowing before you rely on it.
- Diagrams use Mermaid so they render on GitHub.
- `n/a` in a table means the code path does not exist, not that the value is zero.

## Things a new contributor should know first

1. **The engine is pure TypeScript with no DOM, CSS or Three.js dependency.**
   It runs headlessly in Node, which is what makes the test suite possible. Do not
   import anything browser-only into `src/lib/engine/`.
2. **A turn is committed, never edited.** The draft/rehearsal buffer is
   deliberately separate from committed state. See
   [architecture.md](architecture.md#state-and-the-draft-buffer).
3. **The receipt must match reality.** `lastTurnAudit` is the player's only view
   of what the engine did. Any figure on it that is not the figure actually
   applied to state is a bug — there is a regression test for the auction case
   specifically.
4. **Determinism is a promise.** The same seed plus the same decisions must
   resolve identically. `cloneGameState` and the seeded `PRNG` are load-bearing.

## Known documentation gaps

Honest list of what is *not* documented here yet, so nobody assumes it is:

- No per-module API reference. Read the source.
- The event deck (68 cards) has no design rationale per card; only the engine
  mechanics that apply to all of them are documented.
- No performance budget or profiling notes for the 3D map.
- `century-engine.ts` is documented as behaviour only, not as intent — the design
  documents describe a 4-epoch simulation that was never built (see the file's own
  header comment).
