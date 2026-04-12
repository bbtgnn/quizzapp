# Quizzapp — multi-step questions milestone

## What This Is

A **browser-only** quiz application for teachers: **classrooms**, **students**, **imported question sets**, and **live sessions** with a **SessionEngine** that drives turn order and scoring. The stack is **SvelteKit** (client-only routes), **IndexedDB via Dexie**, and a **ports-and-adapters** boundary around persistence. **v1.0** delivered the **logical question** model: one pool unit with **ordered, discriminated steps**, **aggregate session outcomes**, migrated bundled JSON, and engine-authoritative run UI.

## Current Milestone: v1.1 Quiz show UI

**Goal:** Replace the plain default look with a **game / quiz show** visual experience—**bold color**, **large controls**, **expressive typography**, and **juicy** motion and feedback—while keeping v1.0 session semantics intact.

**Target features:**

- **Quiz-show visual language** — saturated palette, stage-like panels, clear hierarchy, “broadcast” energy.
- **Oversized, tactile controls** — primary flows easy to hit and read at a glance (classroom + live run).
- **Motion & feedback** — purposeful transitions and micro-interactions; **respect `prefers-reduced-motion`**.
- **Full-surface coverage** — all primary teacher routes and the **live run** restyled; empty/error states and shell chrome included.

## Current state

- **Shipped v1.0** (2026-04-12): multi-step logical questions end-to-end — import contract (Zod), Dexie v3 one-row-per-unit persistence, SessionEngine progression and scoring, run UI bound to engine state, tests and backup/export parity, pause/resume documentation.
- **In progress v1.1:** UI-only milestone; no change to logical-question schema or SessionEngine contracts unless a style need forces a minimal presentation tweak (avoid behavioral changes).

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

### Active

- [ ] **v1.1 quiz-show restyle** — see `.planning/REQUIREMENTS.md` (TOK/CMP/SHL/RTE/RUN/MOT/POL).

### Out of Scope

- **Server sync, accounts, multi-device continuity** — local-first app remains as today.
- **New assessment rules or question types** — visual milestone only; no weighted steps or branching unless explicitly added later.
- **Sound effects / audio** — optional follow-up; v1.1 is visual + CSS/Svelte motion unless you expand scope in-phase.
- **Full JSON authoring redesign** — still deferred; styling may improve forms and lists only.

## Context

- **Brownfield:** Codebase map lives under `.planning/codebase/` (architecture, stack, testing, etc.).
- **Shipped v1.0:** Logical units with `steps[]`; run flow must stay engine-authoritative (presentation may change freely).
- **v1.1:** Tailwind v4 in `src/routes/layout.css`; prefer **design tokens + shared UI primitives** over one-off per-route CSS.
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
| v1.1 = quiz-show visual layer | User goal: energetic UI without changing core quiz semantics | — In progress |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`): requirements and decisions move between sections as work lands.

**After each milestone** (via `/gsd-complete-milestone`): full review, validated vs active refresh, context and next goals.

---
*Last updated: 2026-04-12 — v1.1 Quiz show UI milestone started*
