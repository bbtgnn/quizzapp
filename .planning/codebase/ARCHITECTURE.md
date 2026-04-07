# Architecture

**Analysis Date:** 2026-04-07 (updated for hexagonal layout)

## High-level pattern

**Static SvelteKit SPA** with **client-only rendering** (`ssr = false` in `src/routes/+layout.ts`). Routes live under `src/routes/`; shared logic under `src/lib/`. **All durable state** is stored in **IndexedDB** via **Dexie**, implemented under **`src/lib/adapters/persistence/dexie/`**. UI and loaders use **`$lib/app`** for wired repositories and services.

## Major components

### Routing and pages

- **SvelteKit file-based routes** — e.g. `src/routes/+page.svelte` (home), `src/routes/classrooms/`, `src/routes/sessions/`, `src/routes/question-sets/`, `src/routes/history/`, `src/routes/settings/`
- **Layout:** `src/routes/+layout.svelte` + `src/routes/+layout.ts` (SSR/prerender flags)

### Data layer (hexagonal)

- **Canonical types:** `src/lib/model/types.ts` — entity interfaces shared by ports, domain, and adapters
- **Ports:** `src/lib/ports/*.ts` — repository interfaces and `SessionEnginePersistence`
- **Dexie adapter:** `src/lib/adapters/persistence/dexie/` — `QuizAppDB` (`schema.ts`), repository functions (`repositories/`), adapter objects (`*-repository.adapter.ts`), backup (`backup.ts`)
- **Composition:** `src/lib/app/` — production singleton repositories, `sessionEnginePersistence`, backup re-exports
- **Legacy barrel:** `src/lib/db/*` — thin re-exports for backward compatibility; **prefer `$lib/app` and `$lib/model` for new code**

### Session runtime (domain logic)

- **`SessionEngine`** (`src/lib/domain/session-engine/index.ts`) — Orchestrates turn order, current question, attempts, completion; requires a **`SessionEnginePersistence`** port (wired from `$lib/app` in the UI)
- **Question selection:** `src/lib/domain/question-selector/` — strategies registered in `registry.ts`, default in `strategies/default.ts`
- **Student ordering:** `src/lib/domain/student-orderer/` — same pattern (`registry.ts`, `strategies/default.ts`)

### Application (use cases)

- **`src/lib/application/`** — Orchestration that depends on ports only (e.g. `sessions/sessions.service.ts`, `question-sets/persist-snippet-file.ts`), unit-tested with stub repositories

### Content import

- **`src/lib/importer/`** — Pure JSON parsing; persistence goes through **`$lib/app`** / application helpers

### UI building blocks

- **`src/lib/components/`** — e.g. `CodeBlock.svelte` (Shiki)
- **Demo routes** — `src/routes/demo/` for examples and Playwright demo page

## Data flow (typical session run)

1. User opens a session route under `src/routes/sessions/`; **`+page.ts`** loads via **`$lib/app`** repositories.
2. **`SessionEngine`** receives **`sessionEnginePersistence`** and records **attempts** through that port.
3. Dexie adapter persists to IndexedDB; UI reflects state in Svelte components.

## Entry points

- **Browser:** SvelteKit client router after static load
- **Tests:** Vitest entry via per-file imports; Playwright hits built preview

## Extension points

- **New question selection behavior:** Add strategy under `src/lib/domain/question-selector/strategies/`, register in `registry.ts`
- **New ordering:** Same under `domain/student-orderer/`
- **New entities:** Extend Dexie schema in the adapter (bump version), add types in `model/`, extend port + adapter + `$lib/app` wiring

---

*Architecture analysis: 2026-04-07*
