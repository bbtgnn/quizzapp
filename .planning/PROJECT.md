# Quizzapp — multi-step questions milestone

## What This Is

A **browser-only** quiz application for teachers: **classrooms**, **students**, **imported question sets**, and **live sessions** with a **SessionEngine** that drives turn order and scoring. The stack is **SvelteKit** (client-only routes), **IndexedDB via Dexie**, and a **ports-and-adapters** boundary around persistence. This milestone refactors how “multi-part” prompts are modeled so authors think in **one logical question** (optionally **multi-step**) instead of **linked chain rows**.

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
- ✓ **Live run UI** shows shared stem (when present), current step, and k-of-n from `SessionEngine` only; interaction types follow each step — validated in Phase 4 (UI-01–UI-03)
- ✓ **Markdown and code-snippet** question content with highlighting — existing
- ✓ **Question chains** (parent + `chain_order` children, JSON `chain` array) — existing *(scheduled for replacement in this milestone)*

### Active

- [ ] **Single logical question** replaces chain-linked rows: one unit in the pool and in the author’s mental model; **multi-step** is allowed inside that unit.
- [ ] **Flexible step shapes**: e.g. code shown once with **per-step highlight ranges** and prompts; steps may mix answer types (open / MC / TF) as the format allows.
- [ ] **Aggregate scoring for the unit**: all steps correct → `correct`; all wrong → `wrong`; **mix of correct and wrong → `partial`**.
- [ ] **Migrate bundled `question-sets/`** to the new representation; **Dexie may be wiped** (no migration path required for existing browser data).

### Out of Scope

- **Server sync, accounts, or multi-device continuity** — local-first app remains as today.
- **Authoring UI redesign** beyond what’s needed to support the new model (unless required for import/testing).
- **Partial credit per step** (e.g. weighted steps) — v1 only distinguishes the three aggregate outcomes above.

## Context

- **Brownfield:** Codebase map lives under `.planning/codebase/` (architecture, stack, testing, etc.).
- **Pain:** Chain questions (`chain_parent_id` / `chain_order`, JSON `chain`) add complexity without matching the desired “one question, maybe several steps” mental model.
- **Direction:** Prefer a representation that can grow with **different question kinds** (e.g. code + multiple highlight-linked prompts) without reintroducing separate linked questions.

## Constraints

- **Tech stack:** Stay on current **SvelteKit + Dexie + TypeScript** patterns; keep **SessionEngine** and ports testable.
- **Data:** Accept **IndexedDB wipe** for this milestone; bundled JSON must remain valid after migration.
- **Compatibility:** Old chain-based JSON **does not** need to load as-is after cutover if bundled sets are migrated in-repo.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One logical question with internal steps (not chain rows) | Matches teaching/author mental model; reduces needless complexity | — Pending |
| Mixed step results → `partial` | Clear signal when some but not all steps are right | — Pending |
| Migrate bundled sets; wipe Dexie OK | Ship clean schema; avoid heavy client migration | — Pending |
| Maximum flexibility in authoring shape | Different question kinds need different step layouts (e.g. code + highlights) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 — Phase 4 complete (live session run UI / UI-01–UI-03)*
