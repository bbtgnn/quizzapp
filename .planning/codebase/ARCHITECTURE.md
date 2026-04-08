# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** SvelteKit single-page application (client-only rendering) with a **ports-and-adapters (hexagonal)** persistence boundary, a **domain core** for live quiz sessions, and **strategy registries** for pluggable ordering and question selection.

**Key Characteristics:**
- All UI routes run in the browser: root layout sets `ssr = false` and `prerender = true` in `src/routes/+layout.ts`.
- Static hosting via `@sveltejs/adapter-static` with SPA fallback (`fallback: 'index.html'`) in `svelte.config.js`.
- Persistence is **IndexedDB** through **Dexie**; repository interfaces in `src/lib/ports/` are implemented by adapters under `src/lib/adapters/persistence/dexie/`.
- Session runtime logic lives in `SessionEngine` (`src/lib/domain/session-engine/index.ts`) and stays independent of UI; pages inject `SessionEnginePersistence` from `src/lib/app/session-engine-persistence.ts`.

## Layers

**Presentation (SvelteKit routes):**
- Purpose: File-based routes, `load` functions for data, Svelte 5 components for UI and local state.
- Location: `src/routes/`
- Contains: `+page.ts` / `+page.svelte`, `+layout.svelte`, `+error.svelte`, route-specific logic (e.g. keyboard handling on run page).
- Depends on: `$lib/app` (wired repositories and persistence), `$lib/domain`, `$lib/components`, `$app/*` navigation helpers.
- Used by: Browser navigation only (no custom `hooks.server.ts` in this repo).

**Application (use cases):**
- Purpose: Orchestrate repositories and domain inputs for specific user flows (thin services).
- Location: `src/lib/application/`
- Contains: e.g. `sessions.service.ts` (ordering sessions for lists), `persist-question-set.ts` (persist parsed imports).
- Depends on: `src/lib/ports/*`, `src/lib/importer/*`, `src/lib/model/types.ts`.
- Used by: Route loaders and pages that call exported functions.

**Domain:**
- Purpose: Pure (or persistence-port-driven) rules for quiz sessions and strategy selection.
- Location: `src/lib/domain/`
- Contains: `SessionEngine` class; `question-selector/` and `student-orderer/` with `registry.ts` and `strategies/default.ts`; unit tests alongside.
- Depends on: `src/lib/model/types.ts`, `src/lib/ports/session-engine-persistence.ts` (interface only, injected at construction).
- Used by: Run page (`src/routes/sessions/[id]/run/+page.svelte`) and tests.

**Ports (interfaces):**
- Purpose: Stable contracts for persistence and engine side effects; enables test doubles and future storage swaps.
- Location: `src/lib/ports/`
- Contains: `session-repository.ts`, `classroom-repository.ts`, `question-set-repository.ts`, `attempt-repository.ts`, `session-engine-persistence.ts`.
- Depends on: `src/lib/model/types.ts` only.
- Used by: Adapters, application layer, `SessionEngine`, and route loaders typed against repositories.

**Adapters (infrastructure):**
- Purpose: Dexie/IndexedDB implementations of ports; schema versioning; backup import/export.
- Location: `src/lib/adapters/persistence/dexie/`
- Contains: `schema.ts` (`QuizAppDB`), `*-repository.adapter.ts`, `repositories/*.ts` table helpers, `backup.ts`.
- Depends on: Dexie, model types, ports.
- Used by: `src/lib/app/repositories.ts` (composition root).

**App composition (wiring):**
- Purpose: Single place to bind default adapters to port types and export facades for routes and backup.
- Location: `src/lib/app/`
- Contains: `repositories.ts`, `session-engine-persistence.ts`, `backup.ts` (re-exports), `index.ts` barrel.
- Depends on: adapters and ports.
- Used by: Route `load` functions and pages importing from `$lib/app/index.js`.

**Model:**
- Purpose: Shared TypeScript interfaces for entities and content/answer discriminated unions.
- Location: `src/lib/model/types.ts`
- Contains: `Classroom`, `Student`, `QuestionSet`, `Question`, `Session`, `SessionStudent`, `Attempt`, content/answer config types.
- Depends on: Nothing (types only).
- Used by: Ports, domain, adapters, importer, UI.

**Import / parsing:**
- Purpose: Parse external question-set JSON into `ParsedQuestionSet` for persistence.
- Location: `src/lib/importer/index.ts`
- Contains: Pure parsing and validation-style error strings (`ParseResult`).
- Used by: Import UI and `persistQuestionSet` in `src/lib/application/question-sets/persist-question-set.ts`.

**Data loaders (route-oriented queries):**
- Purpose: Reusable async functions that take a repository port and return shaped data for pages.
- Location: `src/lib/data/loaders/` (e.g. `classrooms-index.ts`)
- Depends on: Ports and model types.
- Used by: Route `+page.ts` files (passing concrete repos from `$lib/app`).

## Data Flow

**Typical list/detail page:**

1. User navigates to a route; SvelteKit runs the route’s `load` in `+page.ts` (client-side, because `ssr` is disabled globally).
2. `load` imports repositories from `$lib/app/index.js` (or calls a loader such as `loadClassroomsIndex` in `src/lib/data/loaders/classrooms-index.ts`).
3. Repository methods resolve to Dexie adapters that read/write `QuizAppDB` in `src/lib/adapters/persistence/dexie/schema.ts`.
4. Returned data is available as `data` on `+page.svelte` via `$props()`.

**Live session run (engine loop):**

1. `src/routes/sessions/[id]/run/+page.ts` loads `session`, `sessionStudents`, `students`, merged `allQuestions`, and `attempts` via repositories.
2. `+page.svelte` constructs `new SessionEngine(..., sessionEnginePersistence)` inside `$effect` when `data` changes (`src/routes/sessions/[id]/run/+page.svelte`).
3. User actions call `engine.recordOutcome()` / `engine.pause()`; the engine uses injected `SessionEnginePersistence` (`src/lib/app/session-engine-persistence.ts`) which delegates to `attemptRepository` and `sessionRepository`.
4. IndexedDB updates persist attempts and session/session-student rows; UI uses `$state` / `$derived` to react after `tick` increments.

**Question set import:**

1. User selects a file on an import route; parsing goes through `src/lib/importer/index.ts`.
2. `persistQuestionSet` in `src/lib/application/question-sets/persist-question-set.ts` writes questions via `QuestionSetRepository` (chain rows use `chain_parent_id` / `chain_order` consistent with `SessionEngine`).

**State Management:**
- **Server/load state:** SvelteKit `load` return values (no shared server store; SSR is off).
- **Client UI state:** Svelte 5 runes (`$state`, `$derived`, `$effect`) in components; session run page keeps engine instance and interaction flags locally.

## Key Abstractions

**Repository ports:**
- Purpose: CRUD-style boundaries per aggregate (sessions, classrooms, question sets, attempts).
- Examples: `src/lib/ports/session-repository.ts`, `src/lib/ports/classroom-repository.ts`, `src/lib/ports/question-set-repository.ts`, `src/lib/ports/attempt-repository.ts`
- Pattern: Async interface methods returning model types; implementations in `src/lib/adapters/persistence/dexie/*-repository.adapter.ts`.

**SessionEnginePersistence:**
- Purpose: Narrow port for what `SessionEngine` needs to persist (attempts, session status, session-student progress) without depending on full repositories.
- Examples: `src/lib/ports/session-engine-persistence.ts`, implementation wiring in `src/lib/app/session-engine-persistence.ts`
- Pattern: Object of functions bound to concrete adapters; `createSessionEnginePersistence` for tests/overrides.

**SessionEngine:**
- Purpose: Encapsulate turn order, question chains, slot consumption, and completion transitions for a live session.
- Examples: `src/lib/domain/session-engine/index.ts`
- Pattern: Class holding in-memory state; async methods call persistence port; question picking uses `getStrategy` from `src/lib/domain/question-selector/registry.ts`, student ordering uses `src/lib/domain/student-orderer/registry.ts`.

**Strategy registries:**
- Purpose: Map string `strategy_id` (on `Session`) to swappable algorithms.
- Examples: `src/lib/domain/question-selector/registry.ts`, `src/lib/domain/student-orderer/registry.ts` with `strategies/default.ts` in each.
- Pattern: Module-level `Map` with `getStrategy` / `registerStrategy`.

## Entry Points

**SvelteKit client application:**
- Location: `src/app.html` (document shell), `src/routes/+layout.svelte` (root layout, global CSS import), `src/routes/+layout.ts` (SSR/prerender flags)
- Triggers: User opens deployed static site or `vite dev`
- Responsibilities: Mount router, apply layout, run route loads and components

**Vite / SvelteKit build:**
- Location: `vite.config.ts`, `svelte.config.js`
- Triggers: `bun run build` / `vite build`
- Responsibilities: Bundle client; tests also extend this config in `vite.config.ts` (Vitest projects)

**Repository composition:**
- Location: `src/lib/app/repositories.ts`
- Triggers: First import from `$lib/app` in any module
- Responsibilities: Export singleton Dexie-backed repositories and `createRepositories()` for tests

## Error Handling

**Strategy:** Route `load` functions use `try/catch`, log with `console.error` on unexpected failures, rethrow SvelteKit `error()` from `@sveltejs/kit` with 404/500. The root error UI is `src/routes/+error.svelte` (reads `page` from `$app/state`).

**Patterns:**
- Guard missing `params` and missing entities with `error(404, { message: '...' })` (e.g. `src/routes/classrooms/[id]/+page.ts`, `src/routes/sessions/[id]/run/+page.ts`).
- Preserve already-thrown HTTP errors by checking `status` on caught values before mapping to 500.

## Cross-Cutting Concerns

**Logging:** `console.error` in route loaders on failure; no structured logging SDK in app code.

**Validation:** Importer performs structural validation for parsed JSON (`src/lib/importer/index.ts`). Repository layer trusts types at runtime as stored in IndexedDB.

**Authentication:** Not applicable for this codebase; local-only data in the browser.

---

*Architecture analysis: 2026-04-09*
