# QuizzApp

## What This Is

A **client-only SvelteKit quiz app** for teachers: manage **classrooms** and **question sets**, **run live sessions** (turn order, attempts, progress), browse **history**, and adjust **settings**. All durable data lives in the browser via **IndexedDB (Dexie)**. This planning track focuses on a **UI architecture refactor**: moving page/component orchestration out of fat `.svelte` scripts into **co-located `*.svelte.ts` classes** (Svelte 5 runes inside classes), with **Vitest tests** in `*.svelte.test.ts`.

## Core Value

**Teachers can run a session reliably** — session flow, persistence, and correctness stay intact while the UI layer becomes **testable and thin**.

## Requirements

### Validated

- ✓ **Static SPA shell** — SvelteKit with `ssr = false`, static adapter, client-side routing (`+layout.ts`) — *existing*
- ✓ **Local-first data** — Dexie schema, types, repositories under `src/lib/db/` — *existing*
- ✓ **Session runtime** — `SessionEngine` orchestrates students, questions, attempts, completion — *existing*
- ✓ **Pluggable strategies** — Question selection and student ordering registries — *existing*
- ✓ **Question set import** — Importer pipeline from JSON into DB — *existing*
- ✓ **Core routes** — Home, classrooms (list/new/detail), sessions (list/new/run), question-sets (browse/import), history, settings, demo — *existing*
- ✓ **Shared UI** — e.g. `CodeBlock` (Shiki), Tailwind styling — *existing*
- ✓ **Quality gates** — Vitest, Playwright, ESLint, Prettier, svelte-check — *existing*

### Active

- [ ] **Hot-spot migration** — Refactor the heaviest pages first (orchestration and state out of `.svelte` into sibling/co-located `*.svelte.ts` classes); primary candidate: `sessions/[id]/run/+page.svelte`, other fat routes as identified during work
- [ ] **Pilot pattern** — After hot spots, establish a **reference route** that documents the convention for the rest of the app
- [ ] **Thin Svelte scripts** — `.svelte` may use small `$derived` **only** for presentational concerns (CSS classes, labels, formatting); **no business logic** in components
- [ ] **New pages** — Any **new** `+page.svelte` (and analogous entry components) **must** use a co-located class in `*.svelte.ts`
- [ ] **Tests for classes** — Logic living in `*.svelte.ts` view-model/controller classes is covered by **`*.svelte.test.ts`** (Vitest); existing suites stay green

### Out of Scope

- **Replacing Dexie / adding a backend** for this track — not required for the refactor goal
- **Large product features** unrelated to UI structure — capture separately if needed
- **Rewriting `SessionEngine` or domain algorithms** — only changes needed to support cleaner UI boundaries

## Context

- **Brownfield:** Codebase map under `.planning/codebase/` (architecture, stack, structure) reflects the current app.
- **Stack:** Svelte 5 runes already used in routes; domain logic partly lives in `$lib` (`SessionEngine`, repos). **No `*.svelte.ts` classes yet** — this pattern is introduced by the refactor.
- **Rollout strategy:** **Hot spots first**, then **pilot** route to lock the pattern before wider migration.

## Constraints

- **Tech:** TypeScript, Svelte 5, SvelteKit, Tailwind, Dexie — stay aligned with `STACK.md` unless explicitly changed
- **Behavior:** Refactor must **not** regress session behavior or data integrity; rely on existing tests plus new `*.svelte.test.ts`
- **Testing:** `*.svelte.test.ts` is the required home for tests targeting class-based UI logic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Co-locate UI orchestration in `*.svelte.ts` classes | Testability, thinner components, Svelte 5-friendly runes in classes | — Pending |
| UI-only `$derived` in `.svelte`; no business logic there | Clear boundary between presentation glue and rules | — Pending |
| Hot spots → pilot rollout | Reduce risk; prove pattern before repo-wide churn | — Pending |
| Class tests in `*.svelte.test.ts` | Explicit convention for Vitest coverage of view-models | — Pending |

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
*Last updated: 2026-04-07 after initialization*
