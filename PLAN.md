# Build plan — "Concept D" UI for the real game (read fully before any task)

## Goal
Rebuild the PRESENTATION layer of the Svelte 5 game in this repo to match the approved mockup
`concepts/concept-d-hybrid.html` (open it and study its CSS/markup — it is the visual source of truth),
while keeping EVERY existing game mechanic working. The game engine (`src/lib/engine/**`) and the store
logic (`src/lib/stores/**`) are NOT to be redesigned: the new UI calls the same store functions the old UI
calls. This is a re-skin + re-layout, not a rewrite of the game.

The result must be fully playable at: desktop 1440×900 (and up to 2560 wide), phone landscape 844×390,
phone portrait 390×844. Portrait is now SUPPORTED (the "rotate your phone" blocker must not block play).

## Concept D in one paragraph
Slim resource top bar (icon + big number + delta chip, rich tooltip; on phones the 4 most critical + "more"
tray), an alerts stack on the side (clickable, severity-coloured, dismissible), a flat 2D SVG map with
map-mode switcher (unrest / electricity / damage / mines) and one numeric badge per province, a province
side panel, a bottom command dock with 7 big labelled icons and badges (desktop) that becomes a bottom tab
bar on portrait phones and a vertical rail on landscape phones, every panel opening in a responsive Sheet
(side drawer on desktop, bottom sheet with drag handle and snap points on portrait phones, side sheet on
landscape phones), decrees as cards with a pending tray, a gold circular "إنهاء الدور" seal with a pending
actions badge, crisis events as a dramatic event card, and turn results as a staged headline-card sequence
followed by a ledger summary.

## Architecture rules (all agents)
- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) — match the style already used in the repo.
- Styling: Tailwind 4 utility classes + the CSS custom properties already defined in `src/app.css`
  (`--color-forest-*`, `--color-wheat-*`, `--color-umber-*`, `--color-status-*`, fonts `font-arabic`,
  `font-heading`). Do not hard-code colours that exist as tokens. New tokens go in `src/app.css` (owned by
  the foundation task only).
- RTL: the page is `dir="rtl"`. Use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`,
  `inset-inline-*`). "Next" arrows point LEFT.
- Touch: every interactive control ≥ 44×44 px on phones. No hover-only functionality: anything shown on
  hover must also be reachable by tap.
- Accessibility: buttons are `<button>`, dialogs use the existing `focusTrap` action in
  `src/lib/ui/actions/focus-trap.ts` with role="dialog" aria-modal="true" aria-label.
- Motion: CSS transitions/animations; wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)`.
- All user-facing text Arabic (reuse existing strings wherever possible — they are fact-checked).
- Keep `data-tour="..."` attributes on the new equivalents of old elements (the guide tour depends on them).
- Do NOT modify `src/lib/engine/**`. Do NOT change store function signatures. You MAY add small derived
  helpers in a NEW file if needed (say so in your report).
- Do NOT delete old components until the final cleanup task; leave them unused instead.

## Breakpoints (defined once in app.css by the foundation task as Tailwind custom variants)
- `phone-p:` portrait phone — `(max-width: 767px) and (orientation: portrait)`
- `phone-l:` landscape phone — `(max-height: 500px) and (orientation: landscape)`
- default (no variant) = desktop/tablet.

## Mechanics that MUST survive (inventory, non-exhaustive — find the rest by reading the components)
Live rehearsal preview (projected next-turn value + delta + % for each top stat, from draft-store);
per-stat explainer + "options related to this stat" filter (`selectedStatForOptions`);
province selection, provincial panel (projects, demining, power boost, southern policy, prev/next province);
policies panel; tax & finance panel (rates, sliders, dollar auction, money printing, remittances, grid capex);
assets panel (confiscated assets, unlocked after turn 2, review shortcut when all processed);
decrees panel (one-time / continuous / periodic decrees, PC costs, cash-for-legitimacy actions);
emergency panel (loans, mortgages, facilities, early repayment, debt repudiation, Golan stance);
stats panel/sidebar; budget/over-budget guard; end-turn flow review → results → events (turnFlowStage);
event modal (affordability + unresolved-crisis penalty path); fail-state modal; century report; restart
(`startNewGame` in `src/lib/stores/new-game.ts`); settings/curtain menu (new game, continue, theme, CRT,
migration arrows toggle, about, guide tour); version update banner; PWA; guide tour; HUD zoom on ≥2000px.

## Phases
1. FOUNDATION (one agent): shell layout + Sheet + Dock/Rail/TabBar + TopBar + EndTurnSeal + AlertsStack;
   existing panels mounted unchanged inside the new Sheet so the game is fully playable at the end of phase 1.
2. PARALLEL (several agents, strict file ownership): map + province panel; decrees + emergency;
   policies + tax/finance + assets; turn flow + event + fail/century + settings menu + tour; stats.
3. CLEANUP + verification (reviewer).

## Verification every agent must do before finishing
- `npx svelte-check --tsconfig ./tsconfig.app.json` → 0 errors in the files you own (others may be mid-edit).
- `npm run test:engine` passes.
- `npm run build` succeeds.
- Screenshot check (you CAN do this): a dev server for this worktree runs at http://localhost:5190/ .
  Use `chromium --headless=new --hide-scrollbars --window-size=W,H --virtual-time-budget=4000 --screenshot=/tmp/opencode/shots/NAME.png URL`
  at 1440,900 and 844,390 and 390,844 and LOOK at the images.
  CPU RULE: never leave a browser running. Use only the one-shot `--screenshot` command above (it exits by
  itself), or if you write a CDP script, it MUST kill its chromium in a `finally` block. The page has a WebGL
  map that burns ~5 CPU cores in a headless browser. Before you finish, run
  `pkill -f "chromium.*--headless"` to clean up anything you started. The game shows a title menu on first visit;
  the foundation task documents how to reach the in-game view (e.g. a `?play=1` dev URL param it adds).
- Final answer: (1) files changed/created, (2) a checklist of every mechanic in your owned components marked
  ✅ reachable in new UI / ❌ with reason, (3) verification results, (4) known issues.
