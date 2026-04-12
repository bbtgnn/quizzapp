# Quizzapp — multi-step questions milestone

## What This Is

A **browser-only** quiz application for teachers: **classrooms**, **students**, **imported question sets**, and **live sessions** with a **SessionEngine** that drives turn order and scoring. The stack is **SvelteKit** (client-only routes), **IndexedDB via Dexie**, and a **ports-and-adapters** boundary around persistence. **v1.0** delivered the **logical question** model: one pool unit with **ordered, discriminated steps**, **aggregate session outcomes**, migrated bundled JSON, and engine-authoritative run UI.

## Current state

- **Shipped v1.0** (2026-04-12): multi-step logical questions end-to-end — import contract (Zod), Dexie v3 one-row-per-unit persistence, SessionEngine progression and scoring, run UI bound to engine state, tests and backup/export parity, pause/resume documentation.

## Next milestone goals

- Define with **`/gsd-new-milestone`**: fresh requirements and phased roadmap. Likely candidates from deferred lists: richer **authoring** (AUTH-01), **analytics** (ANLY-01), **weighted / branching steps** (ADVN-01/02), or product polish — prioritize after the next planning pass.

## Core Value

**Teachers can run fair, understandable live quizzes** where each **drawn item** is one clear unit in their head—possibly several steps on screen—without a separate “chain question” concept complicating the model, import format, or session logic.

## Requirements

### Validated

- ✓ **Client-only SvelteKit app** with static adapter and SPA fallback — existing
- ✓ **Classrooms and students** — existing
- ✓ **Question sets** imported from JSON, stored in IndexedDB — existing
- ✓ **Live sessions** with SessionEngine, strategies for question selection and student ordering — existing
- ✓ **Attempts** persisted with outcomes `correct` | `partial` | `wrong` — existing
- ✓ **Open, multiple-choice, and true/false** answer types — existing
- ✓ **Markdown and code-snippet** question content with highlighting — existing
- ✓ **Single logical question** replaces chain-linked rows for new content — **v1.0** (MODL-01, pool + persistence + engine)
- ✓ **Flexible step shapes** (discriminated steps, shared stem + per-step content) — **v1.0** (MODL-02)
- ✓ **Import boundary validation** (Zod) — **v1.0** (IMPT-01)
- ✓ **Bundled `question-sets/`** migrated to new format — **v1.0** (IMPT-02)
- ✓ **Dexie schema** one row per logical question, nested steps — **v1.0** (DATA-01)
- ✓ **`persistQuestionSet`** without fan-out — **v1.0** (DATA-02)
- ✓ **IndexedDB wipe** on upgrade documented — **v1.0** (DATA-03)
- ✓ **Session pool** uses logical question ids; **SessionEngine** owns progression; **aggregate outcomes**; **one Attempt** per unit — **v1.0** (SESS-01–04)
- ✓ **Live run UI** tied to engine (stem, step, k-of-n) — **v1.0** (UI-01–UI-03)
- ✓ **VER-01–VER-03** — labeled engine tests, backup parity, pause/resume docs — **v1.0**

### Active

- [ ] **Next milestone scope** — capture via `/gsd-new-milestone` (see v2 ideas in archived requirements under “Deferred”).

### Out of Scope

- **Server sync, accounts, multi-device continuity** — local-first app remains as today.
- **Full authoring UI redesign** beyond minimal needs for import/testing — unchanged unless a future milestone selects it.
- **Partial credit per step** (weighted steps) in v1 — v1 only used three aggregate outcomes; ADVN items stay deferred until a milestone adopts them.

## Context

- **Brownfield:** Codebase map lives under `.planning/codebase/` (architecture, stack, testing, etc.).
- **Shipped v1.0:** Chain-era `chain_parent_id` / `chain_order` is superseded by logical units with `steps[]` for bundled content and new imports.
- **Next:** Planning starts clean — new `REQUIREMENTS.md` and roadmap when you run `/gsd-new-milestone`.

## Constraints

- **Tech stack:** Stay on current **SvelteKit + Dexie + TypeScript** patterns; keep **SessionEngine** and ports testable.
- **Data:** Further schema changes should stay deliberate; v1 accepted a wipe on upgrade.
- **Compatibility:** New work should preserve the logical-question import contract unless a milestone explicitly revises it.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One logical question with internal steps (not chain rows) | Matches teaching/author mental model; reduces needless complexity | ✓ Shipped v1.0 |
| Mixed step results → `partial` | Clear signal when some but not all steps are right | ✓ Shipped v1.0 |
| Migrate bundled sets; wipe Dexie OK | Ship clean schema; avoid heavy client migration | ✓ Shipped v1.0 |
| Maximum flexibility in authoring shape | Different question kinds need different step layouts (e.g. code + highlights) | ✓ Shipped v1.0 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`): requirements and decisions move between sections as work lands.

**After each milestone** (via `/gsd-complete-milestone`): full review, validated vs active refresh, context and next goals.

---
*Last updated: 2026-04-12 after v1.0 milestone archive*
