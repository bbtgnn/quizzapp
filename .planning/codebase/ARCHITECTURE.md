# Architecture

**Analysis Date:** 2026-04-07

## High-level pattern

**Static SvelteKit SPA** with **client-only rendering** (`ssr = false` in `src/routes/+layout.ts`). Routes live under `src/routes/`; shared logic under `src/lib/`. **All durable state** is stored in **IndexedDB** via **Dexie** (`src/lib/db/`).

## Major components

### Routing and pages

- **SvelteKit file-based routes** — e.g. `src/routes/+page.svelte` (home), `src/routes/classrooms/`, `src/routes/sessions/`, `src/routes/question-sets/`, `src/routes/history/`, `src/routes/settings/`
- **Layout:** `src/routes/+layout.svelte` + `src/routes/+layout.ts` (SSR/prerender flags)

### Data layer

- **Schema:** `src/lib/db/schema.ts` — `QuizAppDB` Dexie subclass, version 1 stores
- **Types:** `src/lib/db/types.ts`
- **Repositories:** `src/lib/db/repositories/` — `classrooms`, `question-sets`, `sessions`, `attempts`, etc.
- **DB entry:** `src/lib/db/index.ts` — re-exports `db` and repository operations

### Session runtime (domain logic)

- **`SessionEngine`** (`src/lib/session-engine/index.ts`) — Orchestrates turn order, current question, attempts, completion; uses injectable DB callbacks (`SessionEngineOptions`) for tests
- **Question selection:** `src/lib/question-selector/` — strategies registered in `registry.ts`, default in `strategies/default.ts`
- **Student ordering:** `src/lib/student-orderer/` — same pattern (`registry.ts`, `strategies/default.ts`)

### Content import

- **`src/lib/importer/`** — Parses/brings question-set JSON into the DB (tests in `importer/index.test.ts`)

### UI building blocks

- **`src/lib/components/`** — e.g. `CodeBlock.svelte` (Shiki)
- **Demo routes** — `src/routes/demo/` for examples and Playwright demo page

## Data flow (typical session run)

1. User opens a session route under `src/routes/sessions/` (e.g. run page loads session + students + questions from Dexie).
2. **`SessionEngine`** computes current student/question, records **attempts** via repository/`createAttempt`.
3. State updates persist to IndexedDB; UI reflects runes/state in Svelte components.

## Entry points

- **Browser:** SvelteKit client router after static load
- **Tests:** Vitest entry via per-file imports; Playwright hits built preview

## Extension points

- **New question selection behavior:** Add strategy under `src/lib/question-selector/strategies/`, register in `registry.ts`
- **New ordering:** Same under `student-orderer/`
- **New entities:** Extend Dexie schema (bump version) + types + repository

---

*Architecture analysis: 2026-04-07*
