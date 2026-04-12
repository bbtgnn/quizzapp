# Quizzapp — multi-step questions milestone

## What This Is

A **browser-only** quiz application for teachers: **classrooms**, **students**, **imported question sets**, and **live sessions** with a **SessionEngine** that drives turn order and scoring. The stack is **SvelteKit** (client-only routes), **IndexedDB via Dexie**, and a **ports-and-adapters** boundary around persistence. **v1.0** delivered the **logical question** model: one pool unit with **ordered, discriminated steps**, **aggregate session outcomes**, migrated bundled JSON, and engine-authoritative run UI.

## Current Milestone: v1.1 Quiz show UI

**Goal:** Replace the plain default look with a **game / quiz show** visual experience—**bold color**, **large controls**, **expressive typography**, and **juicy** motion and feedback—on the **main teaching path only**, while keeping v1.0 session semantics intact.

**Target features (in scope):**

- **Quiz-show visual language** — saturated palette, stage-like panels, clear hierarchy, “broadcast” energy on the **funnel**: **classroom selection → question set selection → live run**.
- **Oversized, tactile controls** — those steps and **live run** are easy to hit and read at a glance.
- **Motion & feedback** — purposeful transitions and micro-interactions on the funnel + run; **respect `prefers-reduced-motion`**.

**Explicitly not in scope for v1.1:**

- **Teacher management surfaces** stay **simple / current baseline** styling: e.g. **new classroom**, **classroom detail / students**, **question set import**, **sessions list**, **history**, **settings** — no quiz-show pass required unless a quick token alignment is unavoidable.

## Current state

- **Shipped v1.0** (2026-04-12): multi-step logical questions end-to-end — import contract (Zod), Dexie v3 one-row-per-unit persistence, SessionEngine progression and scoring, run UI bound to engine state, tests and backup/export parity, pause/resume documentation.
- **In progress v1.1:** UI-only milestone, **scoped to the live quiz funnel**; management screens remain visually basic. No change to logical-question schema or SessionEngine contracts unless a style need forces a minimal presentation tweak (avoid behavioral changes).
- **Phase 6 complete** (2026-04-12): **TOK-01** tokens and typography in `layout.css`, **CMP-01** `Button` / `Panel` primitives with Vitest browser coverage, **`/style-lab`** pilot, and `docs/design-tokens.md`.

## Next milestone goals

- After v1.1: candidates from the backlog include **authoring** (AUTH-01), **analytics** (ANLY-01), **advanced assessment** (ADVN-01/02), or further polish — pick with `/gsd-new-milestone`.

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
- ✓ **TOK-01** — design tokens + typography roles + stage shell in `layout.css` — **v1.1 Phase 6**
- ✓ **CMP-01** — shared `Button` / `Panel` primitives — **v1.1 Phase 6**

### Active

- [ ] **v1.1 quiz-show restyle (funnel + run)** — see `.planning/REQUIREMENTS.md` (TOK/CMP/SHL/FUN/RUN/MOT/POL).

### Out of Scope

- **Server sync, accounts, multi-device continuity** — local-first app remains as today.
- **New assessment rules or question types** — visual milestone only; no weighted steps or branching unless explicitly added later.
- **Sound effects / audio** — optional follow-up; v1.1 is visual + CSS/Svelte motion unless you expand scope in-phase.
- **Full JSON authoring redesign** — still deferred.
- **Quiz-show styling for management / admin routes** — deferred; v1.1 focuses on **classroom pick → set pick → live run** only.

## Context

- **Brownfield:** Codebase map lives under `.planning/codebase/` (architecture, stack, testing, etc.).
- **Shipped v1.0:** Logical units with `steps[]`; run flow must stay engine-authoritative (presentation may change freely).
- **v1.1:** Tailwind v4 in `src/routes/layout.css`; prefer **design tokens + shared UI primitives** over one-off per-route CSS.
- **v1.1 visual direction (detail):** Dark **animated** stage (e.g. CSS sliding grid, reduced-motion safe); **white question cards** with **dark text**; **multicolor answer controls outside** the card (centered card when no choices); **`html { font-size: 112.5%; }`** for global scale; optional **large custom cursor** on pointer devices; **answer feedback motion** (e.g. confetti / correct, shake / wrong — examples) with **reduced-motion** fallbacks; **anime.js** only if justified vs CSS. See `.planning/phases/06-design-foundation-ui-primitives/06-CONTEXT.md`.
- **Research:** Skipped for this milestone — product direction was specified inline (quiz-show / game UI).

## Constraints

- **Tech stack:** Stay on **SvelteKit + Tailwind + TypeScript**; avoid heavy new runtime deps unless justified in phase plans.
- **SessionEngine:** Run screen must remain a **presentation layer** over engine state (no new parallel step authority).
- **Accessibility:** WCAG-minded contrast for text on saturated backgrounds; honor **reduced motion**.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One logical question with internal steps (not chain rows) | Matches teaching/author mental model; reduces needless complexity | ✓ Shipped v1.0 |
| Mixed step results → `partial` | Clear signal when some but not all steps are right | ✓ Shipped v1.0 |
| Migrate bundled sets; wipe Dexie OK | Ship clean schema; avoid heavy client migration | ✓ Shipped v1.0 |
| Maximum flexibility in authoring shape | Different question kinds need different step layouts (e.g. code + highlights) | ✓ Shipped v1.0 |
| v1.1 = quiz-show on main funnel only | Ship “wow” on path to live run; leave management UI plain | — In progress |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`): requirements and decisions move between sections as work lands.

**After each milestone** (via `/gsd-complete-milestone`): full review, validated vs active refresh, context and next goals.

---
*Last updated: 2026-04-12 — Phase 6 design foundation complete (TOK-01, CMP-01)*
