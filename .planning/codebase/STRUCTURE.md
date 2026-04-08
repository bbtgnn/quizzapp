# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```
quizzapp/
├── src/
│   ├── app.html              # HTML shell for SvelteKit
│   ├── app.d.ts              # Ambient types / app types
│   ├── routes/               # SvelteKit file-based routes (pages, layouts, errors)
│   └── lib/                  # Shared code ($lib alias)
│       ├── adapters/         # Infrastructure implementations
│       │   └── persistence/dexie/   # IndexedDB (Dexie) adapters + schema + backup
│       ├── app/              # Composition root: repos, engine persistence, re-exports
│       ├── application/      # Use-case functions (sessions, question-set persist)
│       ├── assets/           # Static assets imported by components (e.g. favicon)
│       ├── components/       # Reusable Svelte UI (CodeBlock, MarkdownContent, …)
│       ├── data/loaders/     # Async loaders parameterized by repository ports
│       ├── domain/           # SessionEngine + strategy registries
│       ├── importer/         # JSON → ParsedQuestionSet parsing
│       ├── model/            # Domain TypeScript types (entities + unions)
│       ├── ports/            # Repository and engine persistence interfaces
│       └── vitest-examples/  # Example tests/components for Vitest browser setup
├── static/                   # Files copied as-is to build output (e.g. robots.txt)
├── playwright.config.ts      # Playwright E2E: testMatch **/*.e2e.{ts,js}, preview on 4173
├── vite.config.ts            # Vite + SvelteKit + Vitest projects
├── svelte.config.js          # SvelteKit adapter-static, runes, prerender
├── tsconfig.json             # Extends .svelte-kit/tsconfig.json
├── package.json              # Scripts and dependencies
├── eslint.config.js          # ESLint flat config (project root)
└── prettier config / tailwind # Formatting and CSS tooling at repo root
```

## Directory Purposes

**`src/routes/`:**
- Purpose: URLs, layouts, per-route `load`, and page components.
- Contains: `+page.ts`, `+page.svelte`, `+layout.ts`, `+layout.svelte`, `+error.svelte`, nested folders per URL segment.
- Key files: `src/routes/+layout.ts` (global `ssr`/`prerender`), `src/routes/+layout.svelte`, `src/routes/+error.svelte`

**`src/lib/app/`:**
- Purpose: Wire default adapters to exported singletons; expose `createRepositories` and session engine persistence for tests.
- Contains: `repositories.ts`, `session-engine-persistence.ts`, `backup.ts` (re-export), `index.ts`.
- Key files: `src/lib/app/repositories.ts`, `src/lib/app/index.ts`

**`src/lib/ports/`:**
- Purpose: TypeScript interfaces for persistence and engine side effects.
- Contains: One file per port (`*-repository.ts`, `session-engine-persistence.ts`).
- Key files: All files in `src/lib/ports/`

**`src/lib/adapters/persistence/dexie/`:**
- Purpose: Dexie database class, per-aggregate adapters, table-level helpers, backup JSON import/export.
- Contains: `schema.ts`, `*-repository.adapter.ts`, `repositories/*.ts`, `backup.ts`.
- Key files: `src/lib/adapters/persistence/dexie/schema.ts`

**`src/lib/domain/`:**
- Purpose: Core session logic and registries for strategies.
- Contains: `session-engine/`, `question-selector/`, `student-orderer/` (each with `registry.ts`, `types.ts`, `strategies/`).
- Key files: `src/lib/domain/session-engine/index.ts`

**`src/lib/application/`:**
- Purpose: Small orchestration modules callable from routes or other app code.
- Contains: `sessions/sessions.service.ts`, `question-sets/persist-question-set.ts` and their `*.test.ts` files.

**`src/lib/components/`:**
- Purpose: Shared presentation components (not route-owned).
- Contains: `CodeBlock.svelte`, `MarkdownContent.svelte`, etc.

**`src/lib/data/loaders/`:**
- Purpose: Reusable data assembly for pages, accepting repository ports as arguments.
- Contains: e.g. `classrooms-index.ts`, `classrooms-index.test.ts`.

**`src/lib/importer/`:**
- Purpose: Parse and validate imported question-set JSON.
- Contains: `index.ts`, `index.test.ts`, `file-system-access.d.ts` for typings.

**`src/lib/model/`:**
- Purpose: Canonical entity and value-object types shared across layers.
- Contains: `types.ts`.

**`static/`:**
- Purpose: Assets not processed by Vite import graph.
- Contains: e.g. `robots.txt`.

## Key File Locations

**Entry Points:**
- `src/app.html`: Document template for SvelteKit.
- `src/routes/+layout.ts`: Disables SSR, enables prerender for static SPA behavior.
- `src/routes/+layout.svelte`: Root layout; imports `layout.css`; renders `{@render children()}`.

**Configuration:**
- `svelte.config.js`: `adapter-static`, SPA fallback, Svelte 5 runes for app sources.
- `vite.config.ts`: Plugins (Tailwind, SvelteKit), Vitest browser + node projects.
- `tsconfig.json`: Strict TypeScript; path alias `$lib` via SvelteKit convention.
- `playwright.config.ts`: E2E test runner configuration.

**Core Logic:**
- `src/lib/domain/session-engine/index.ts`: Live session state machine and persistence callbacks.
- `src/lib/app/repositories.ts`: Singleton repository instances and `createRepositories`.
- `src/lib/adapters/persistence/dexie/schema.ts`: IndexedDB schema and `db` export.

**Testing:**
- Unit/integration: `src/**/*.test.ts`, `src/**/*.spec.ts` (Vitest; see `vite.config.ts` for client vs server project split).
- Browser component tests: `src/**/*.svelte.spec.ts` / `.svelte.test.ts` per Vitest config.
- E2E: Playwright files matching `**/*.e2e.{ts,js}` (e.g. `src/routes/demo/playwright/page.svelte.e2e.ts`).

## Naming Conventions

**Files:**
- Routes: `+page.svelte`, `+page.ts`, `+layout.svelte`, `+layout.ts`, `+error.svelte` (SvelteKit conventions).
- Ports: `kebab-case` or descriptive with suffix, e.g. `session-repository.ts` in `src/lib/ports/`.
- Adapters: `*-repository.adapter.ts` under `src/lib/adapters/persistence/dexie/`.
- Domain: `index.ts` for main export in feature folders (`session-engine`, `question-selector`, `student-orderer`).
- Tests: `*.test.ts` or `*.spec.ts` co-located next to the module under test (e.g. `default.test.ts` in `strategies/`).

**Directories:**
- Route segments mirror URL structure: `src/routes/sessions/[id]/run/` for `/sessions/:id/run`.
- Feature folders under `src/lib/domain/` use `kebab-case` where multi-word (`question-selector`, `student-orderer`).

## Where to Add New Code

**New Feature (user-facing screen):**
- Primary code: New folder under `src/routes/<segment>/` with `+page.ts` and `+page.svelte` as needed.
- If shared logic is reused: add under `src/lib/application/` or `src/lib/data/loaders/` depending on whether it is orchestration vs parameterized loading.

**New Component/Module:**
- Implementation: Reusable UI in `src/lib/components/`; domain rules in `src/lib/domain/<feature>/`; types in `src/lib/model/types.ts` when shared.

**New Persistence Concern:**
- Add port interface in `src/lib/ports/<name>.ts`.
- Implement adapter in `src/lib/adapters/persistence/dexie/<name>.adapter.ts` (or extend `schema.ts` and `repositories/` helpers as needed).
- Register in `src/lib/app/repositories.ts` and export from `src/lib/app/index.ts`.

**New Pluggable Strategy (questions or students):**
- Add implementation under `src/lib/domain/question-selector/strategies/` or `src/lib/domain/student-orderer/strategies/`.
- Register in the corresponding `registry.ts`; ensure `Session.strategy_id` values match.

**Utilities:**
- Shared helpers: Prefer colocation in the smallest owning folder; cross-cutting pure functions can live next to `src/lib/importer/` or a new `src/lib/utils/` only if multiple features need them (not present as a top-level folder today).

**Tests:**
- Vitest: Co-located `*.test.ts` / `*.spec.ts` next to source files under `src/lib/`.
- Playwright: Add `*.e2e.ts` (or `.e2e.js`) files anywhere in the repo per `playwright.config.ts` `testMatch`.

## Special Directories

**`.svelte-kit/`:**
- Purpose: Generated SvelteKit output (types, sync).
- Generated: Yes (by `svelte-kit sync`, dev, build).
- Committed: No (typically gitignored).

**`node_modules/`:**
- Purpose: Package dependencies.
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-04-09*
