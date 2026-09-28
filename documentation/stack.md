# Stack

Toolchain, build, and how to run everything.

## Runtime stack

| Layer | Choice | Version |
| :--- | :--- | :--- |
| UI framework | Svelte | `^5.57.0` |
| Language | TypeScript | `~6.0.2` |
| Build | Vite | `^8.3.0` |
| Styling | Tailwind CSS v4 | `^4.3.3` (via `@tailwindcss/vite`) |
| 3D | three.js | `^0.186.0` |
| PWA | vite-plugin-pwa (Workbox) | `^1.3.0` |
| Type check | svelte-check | `^4.7.6` |
| Test runner | tsx (no framework) | `^4.20.6` |

Two things worth knowing about the stack:

- **Tailwind v4 has no `tailwind.config.js` for colours.** Tokens live in
  `src/app.css` inside `@theme { … }` and utilities are generated from them. See
  [theming.md](theming.md).
- **There is no test framework.** The suites are plain `tsx` scripts that
  `console.log` and `process.exit(1)` on failure. This is deliberate: the engine
  is pure TypeScript, so no transpiler or runner is needed. It also means
  **nothing catches a regression unless a suite is wired into `npm test`**.

`tsx` used to be invoked as `npx tsx`, which reaches for the network on a cold
cache. It is now a real `devDependency`.

## Commands

```bash
npm run dev          # vite dev server, HMR
npm run build        # production build → dist/
npm run preview      # serve the production build
npm run check        # svelte-check + tsc   (the type gate)
npm run deploy       # publish dist/ to gh-pages
```

### Tests

```bash
npm test             # == npm run test:engine
npm run test:engine  # all 11 headless engine suites, chained with &&
```

Individual suites, each runnable on its own:

| Script | Covers |
| :--- | :--- |
| `test:events` | Deck integrity, ids, trigger filtering, option resolution |
| `test:event-effects` | Every authored effect applied exactly once (591 assertions) |
| `test:audit-split` | SYP accounting identity, runway, preview↔commit bound |
| `test:budget` | Turn budget arithmetic, PC/insufficiency enforcement |
| `test:debt` | Coupons, signing, interest timing, repayment ordering |
| `test:debt-repudiation` | Paris/Russia/Iran repudiation flags and their gating |
| `test:patronage` | Grants, charity fund, import surge, PC cap |
| `test:facilities` | IMF tranches, breach penalties, ring-fencing |
| `test:growth` | Capacity accrual/erosion, militia ramp, preview↔commit |
| `test:southern` | Southern theatre stances and policies |
| `test:demining` | Mine-saturation threshold, power boost, 40-turn campaign |
| `test:auction` | Receipt equals the real M2 delta; reserve guard (25 assertions) |
| `test:endings` | All 13 endings reachable |

`test:engine` chains with `&&`, so it stops at the first failing suite. That
means a failure late in the list hides everything after it — read the output
top-down rather than only looking at the tail.

### UI tests (separate — need a dev server)

```bash
npm run dev          # in one shell
npm run test:ui      # in another
```

These drive headless Chromium over CDP: browser interaction, event PC gating,
localStorage restart, layout visibility, hover legend and translation, UX
refinements, map interaction, and a console-error check. They are **not** in
`test:engine` because they need a live server on `:5173` and are slower.

```bash
npm run test:simulation   # 40-turn headless run, prints every 5 turns
```

Screenshot and capture scripts (`scripts/screenshot-*.ts`,
`scripts/capture-*.ts`) are manual tools for visual QA. They produce artefacts
rather than assertions and are not part of any suite.

## Data pipeline

Source geometry is normalised by Python scripts, then the results are committed
so the build never depends on Python:

| Script | Output |
| :--- | :--- |
| `scripts/process-syria-geojson.py` | Unifies Golan into Quneitra; splits Damascus / Rif Dimashq |
| `scripts/generate-syria-3d-data.py` | Precomputed 3D governorate boundary polygons |
| `scripts/generate-region-context.py` | Regenerates `syria-region-context.ts` from the SVG frame |
| `scripts/deploy-gh-pages.js` | Publishes `dist/` |

**The input GeoJSON is not committed**, so the geometry pipeline is not
reproducible from the repository alone. If the source polygons are lost, the
committed outputs are the only copy.

## PWA

`vite-plugin-pwa` with `generateSW`, precaching 22 entries (~2 MiB).

- **Install / fullscreen** are driven by `pwa-store.ts` (standalone detection,
  `beforeinstallprompt`, `enterFullscreen`), surfaced through `RotatePrompt`.
- **Update flow**: `version-store.ts` polls `public/version.json`, compares
  against the running build, and drives a service-worker update with a
  `VersionUpdateBanner` prompt. `clearAllCachesAndReload()` is the escape hatch.
- `public/version.json` is **build-generated and git-ignored**. `vite.config.ts`
  writes it at config time from `GITHUB_SHA` (CI) or `git rev-parse HEAD` (local),
  falling back to `dev`. It also injects `app-version` / `commit-hash` /
  `build-time` meta tags and no-cache headers into `index.html`.

Because the version file is generated at build time, a local `npm run dev` reports
`1.0.<sha>`; there is no manual version bumping anywhere.

## Type checking

`npm run check` runs two passes:

1. `svelte-check --tsconfig ./tsconfig.app.json` — Svelte + app TypeScript.
2. `tsc -p tsconfig.node.json` — build tooling (Vite config, scripts).

Project config: `strict`, `noImplicitAny`, `moduleDetection: force`. The
`baseUrl` option emits a deprecation warning under TypeScript 6 and will stop
functioning in TypeScript 7; that is the single warning `check` reports.

## CI

Two workflows, deliberately non-overlapping so nothing runs twice:

| Workflow | Trigger | Does |
| :--- | :--- | :--- |
| `.github/workflows/verify.yml` | pull requests | `npm ci` → `check` → `test:engine` |
| `.github/workflows/deploy.yml` | push to `master` / `main`, manual | `npm ci` → `check` → `test:engine` → `build` → upload → deploy |

Pushing to `master` therefore publishes to GitHub Pages, and it is gated on
both the type check and the engine suite running green first. There is **no lint
step** — no ESLint, Prettier or Biome is configured.

## Project layout

```
src/
  lib/
    engine/      pure simulation core — no DOM, no CSS, no three.js
    spatial3d/   2D SVG + 3D WebGL maps
    stores/      Svelte stores; game-store is the only writer of committed state
    ui/          components; panels/ holds the side drawers
  App.svelte     shell and composition
  main.ts        entry, theme init
scripts/         headless engine tests, CDP UI tests, capture tools, data pipeline
documentation/   this folder — maintained reference
notes/           empirical research — what is factually true, and where the game is wrong
plan/            git-ignored design history, partly superseded
```

## Engine headlessness as an invariant

`src/lib/engine/` must stay importable from bare Node. It has no DOM, CSS or
Three.js dependency, which is what lets the whole test suite `import` it
directly. If you need a browser API in engine code, it belongs in a store or a
component.

`state-clone.ts` is the boundary's most load-bearing utility: it is the only
`GameState` deep-clone, it strips functions so `structuredClone` semantics hold,
and it coerces non-finite numbers with a warning so a `NaN` cannot silently
become `null` and persist into a save.
