# President Game: Syria Post-War Economic Simulation
## Master Game Jam Planning & System Architecture

> **Project Vision:** A high-stakes, grand-strategy political and economic simulation where the player serves as the President of post-liberation Syria. Over a 20-year playable tenure (40 semiannual turns), the player must balance a collapsing dual-currency treasury, rebuild ruined infrastructure across 14 distinct governorates represented as a 3D hexagonal spatial map, appease or dismantle predatory oligarchs and armed factions, manage volatile external commodity and maritime chokepoint shocks, and avoid four instant fail-state breaking points. Upon surviving 20 years, an automated Century Simulation Engine projects the player's cumulative governance decisions from Year 21 to Year 100 to reveal the nation's generational destiny.
>
> **Interface & Visual Identity:** Built with **Svelte 5 + Vite + Three.js** featuring a **minimalist Nordic-styled Real-Time Strategy (RTS) command HUD**. The user interface is **100% Arabic (واجهة عربية بالكامل)** utilizing the **Thmanyah Sans (خط ثمانية)** typeface, monochromatic SVG icons sourced from [icones.js.org](https://icones.js.org), strict **zero-radius angular geometry (no rounded borders)**, and a refined functional palette: **Forest, Golden Wheat, Deep Umber, and Charcoal**.

---

## Complete Plan Documentation Suite

This directory breaks down the master design specification into modular, in-depth theoretical game design, engineering, and coding guideline documents:

### Part I: Core Game Systems & Mechanics
1. **[01_macroeconomic_and_fiscal_engine.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/01_macroeconomic_and_fiscal_engine.md)**  
   *Dual-currency architecture (SYP vs. USD), linear seigniorage, parallel FX rate depreciation, Central Bank dollar auctions with strict reserve validation, oligarch asset settlements, tax compliance, and sovereign debt forfeiture.*
2. **[02_spatial_provincial_systems.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/02_spatial_provincial_systems.md)**  
   *The 14 Governorates baseline ledger, 3D hexagonal spatial topology, localized PRRI unrest contagion, internal migration, demining mechanics, and the decoupled Southern Front (As-Suwayda vs. Daraa).*
3. **[03_governance_institutions_and_decrees.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/03_governance_institutions_and_decrees.md)**  
   *The Direct Presidential System under Ahmed al-Sharaa, Consolidated Executive Ministries (Energy, Economy, Emergency, Agriculture, Information under Decree 98 of May 2026), Sovereign Presidential Commissions (General Secretariat, Inspection, Customs & Ports, Service Extension), Political Capital (PC) economy, and decree authority.*
4. **[04_game_loop_and_turn_lifecycle.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/04_game_loop_and_turn_lifecycle.md)**  
   *The complete 40-Turn Semiannual Structure (H1 Harvest vs. H2 Winter Stress), 5-phase turn execution loop, 4 instant fail states, and the 100-Year Generational Outcome Engine (6 national endings + southern regional trajectories).*
5. **[05_event_engine_and_deck_ledger.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/05_event_engine_and_deck_ledger.md)**  
   *3-Pool Draw Logic (Exogenous, Endogenous, Cascades), the 12 active core event cards, southern shock events (Al-Lajat Highway Siege, Golan Buffer Incursion), and persistent state flags.*

### Part II: User Interface & Visual Design
6. **[06_ui_ux_and_player_comprehension.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/06_ui_ux_and_player_comprehension.md)**  
   *Nordic-RTS Situation Room layout, persistent Fiscal Runway Alert (`مؤشر الاستدامة المالية`), range-based predictive previews, draft rehearsal desk with undo capabilities, zero rounded borders, and high-level Arabic summary cards.*
7. **[07_threejs_and_technical_architecture.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/07_threejs_and_technical_architecture.md)**  
   *Svelte 5 + Vite + Three.js technical architecture, 3D hexagonal grid meshes with dynamic column extrusion height and custom GLSL status shaders, camera rigs, and full production game jam sprints.*
8. **[08_unanswered_questions_and_design_dilemmas.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/08_unanswered_questions_and_design_dilemmas.md)**  
   *Definitive record of all resolved design decisions covering monetary curves, As-Suwayda peace accords, Golan frozen border friction, and emergency martial law.*
9. **[09_arabic_ui_taxonomy_and_design_system.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/09_arabic_ui_taxonomy_and_design_system.md)**  
   *Complete Arabic terminology lexicon, typography tokens (`Thmanyah Sans (خط ثمانية)`), monochromatic icon mappings from [icones.js.org](https://icones.js.org), and angular screen wireframes.*

### Part III: Implementation, Engineering & Code Standards
10. **[10_implementation_roadmap_and_task_backlog.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/10_implementation_roadmap_and_task_backlog.md)**  
    *7-Phase development roadmap and granular, checklist-style task backlog covering scaffolding, engine, deck, turn lifecycle, Three.js spatial view, HUD components, and headless playtesting.*
11. **[11_code_style_and_architectural_guidelines.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/11_code_style_and_architectural_guidelines.md)**  
    *Strict decoupling principles (pure TypeScript headless engine vs. Svelte/Three.js view), directory structures, file and function naming conventions, Svelte 5 modern runes standards, and Three.js memory disposal protocols.*
12. **[12_nordic_rts_styling_and_design_system_specs.md](file:///run/media/hadi/SSD2/Coding/President-game/plan/12_nordic_rts_styling_and_design_system_specs.md)**  
    *Complete Tailwind CSS configuration, Forest, Golden Wheat, Deep Umber, and Charcoal palettes, strict zero-radius angular geometry, distinct visual language separating mechanical switches from passive data readouts, and component CSS blueprints.*
