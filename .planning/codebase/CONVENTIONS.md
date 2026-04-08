# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**

- **Svelte components:** PascalCase — e.g. `CodeBlock.svelte`, `MarkdownContent.svelte` in `src/lib/components/`.
- **Routes:** SvelteKit file-based routing — `+page.svelte`, `+page.ts`, `+layout.svelte` under `src/routes/`.
- **Domain / application / data:** kebab-case TypeScript modules — e.g. `classrooms-index.ts`, `persist-question-set.ts`, `sessions.service.ts`.
- **Adapters:** `*-repository.adapter.ts` under `src/lib/adapters/persistence/dexie/`.
- **Dexie table modules:** short names in `src/lib/adapters/persistence/dexie/repositories/` — e.g. `classrooms.ts`, `sessions.ts`.
- **Ports:** `*-repository.ts` or descriptive port names — e.g. `src/lib/ports/session-repository.ts`, `src/lib/ports/session-engine-persistence.ts`.
- **Co-located tests:** same directory as source, suffix `.test.ts` or `.spec.ts` — e.g. `session-engine.test.ts` next to `index.ts`.

**Functions:**

- **camelCase** for functions and methods — e.g. `parseQuestionSetFile`, `loadClassroomsIndex`, `listSessionsOrderedByStartedAt`.

**Variables:**

- **camelCase** for locals and parameters.
- **snake_case** for persisted / API-shaped fields matching the data model — e.g. `classroom_id`, `started_at`, `question_set_ids` in `src/lib/model/types.ts`.

**Types:**

- **PascalCase** for interfaces and type aliases — e.g. `ParseResult`, `ParsedQuestionSet`, `SessionRepository`.
- **Discriminated unions** for outcomes — e.g. `ParseResult` in `src/lib/importer/index.ts`: `{ ok: true; data: ... } | { ok: false; error: string }`.

## Code Style

**Formatting:**

- **Prettier** — config: `.prettierrc`
- **Key settings:** tabs (`useTabs: true`), single quotes, **no trailing commas** (`trailingComma: "none"`), `printWidth: 100`.
- **Plugins:** `prettier-plugin-svelte`, `prettier-plugin-tailwindcss` (Tailwind class sorting); Svelte parser override for `*.svelte`.
- **Tailwind stylesheet:** referenced for Prettier — `./src/routes/layout.css`.

**Linting:**

- **ESLint** flat config — `eslint.config.js`
- **Stacks:** `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-svelte` recommended, `eslint-config-prettier` (disables conflicting formatting rules).
- **Svelte:** `parserOptions` with `projectService: true` and `svelteConfig` from `svelte.config.js` for `*.svelte`, `*.svelte.ts`, `*.svelte.js`.
- **Globals:** browser + Node (`globals.browser`, `globals.node`).
- **Explicit rule:** `no-undef` off (TypeScript owns undefined checks per project policy in `eslint.config.js`).

**Commands:** `npm run lint` / `npm run format` (or `bun run lint` / `bun run format`).

## Import Organization

**Order (observed pattern):**

1. External packages (`vitest`, `@playwright/test`, `dexie`, etc.).
2. SvelteKit / Vite aliases and `$lib` — always use **`.js` extension** in import paths for TypeScript sources (e.g. `from './index.js'`, `from '$lib/model/types.js'`) per SvelteKit ESM resolution.

**Path aliases:**

- **`$lib`** → `src/lib` (SvelteKit default).
- No custom top-level aliases beyond Kit’s generated config; see comment in `tsconfig.json`.

## Error Handling

**Patterns:**

- **Parse / validation (pure logic):** return a **result object** with `ok` discriminant — see `ParseResult` in `src/lib/importer/index.ts` and backup import flow in `src/lib/adapters/persistence/dexie/backup.ts` (`ok` / `error` / `cancelled`).
- **Tests for failures:** assert `result.ok === false` and match `error` strings with `toMatch(/.../)` — see `src/lib/importer/index.test.ts`.
- **Invariant violations (domain):** `throw new Error(...)` for unknown strategy id or empty pools — e.g. `src/lib/domain/question-selector/registry.ts`, `src/lib/domain/student-orderer/registry.ts`, `src/lib/domain/question-selector/strategies/default.ts`.
- **Loaders and UI (`+page.ts`, `+page.svelte`):** failures often logged with **`console.error`** and user-facing state (e.g. error messages in page data); examples in `src/routes/+page.ts`, `src/routes/classrooms/[id]/+page.svelte`, `src/lib/components/CodeBlock.svelte`.

**Prescriptive guidance:** Prefer `ParseResult`-style returns for user input and import paths; reserve `throw` for programmer errors or impossible states after validation.

## Logging

**Framework:** `console` (no dedicated logging library in `package.json` dependencies).

**Patterns:**

- **`console.error`** with a short context prefix — e.g. `'Failed to load classrooms:'`, `'Failed to initialize Shiki:'` — see `src/routes/*/+page.ts` and `src/lib/components/CodeBlock.svelte`.

## Comments

**When to Comment:**

- Sparse inline comments for non-obvious behavior — e.g. section headers in large test files (`// --- New content types ---` in `src/lib/importer/index.test.ts`), or “inherited from parent” in `persist-question-set.test.ts`.

**JSDoc/TSDoc:**

- Not used project-wide; types carry documentation via TypeScript interfaces and explicit union tags.

## Function Design

**Size:** Domain tests use local **factory helpers** (`makeStudent`, `makeQuestion`, `makeMockRepos`) to keep examples readable — see `src/lib/domain/session-engine/session-engine.test.ts`.

**Parameters:** Prefer explicit typed objects and repository interfaces (`SessionRepository`, `QuestionSetRepository`) over loose options bags.

**Return Values:** Async functions return `Promise<T>`; sorting and mapping done in application layer — e.g. `src/lib/application/sessions/sessions.service.ts`.

## Module Design

**Exports:** Named exports predominate; domain barrels re-export strategies — e.g. `src/lib/domain/question-selector/index.ts`.

**Barrel Files:** `src/lib/index.ts` and domain `index.ts` files aggregate public surface; adapters and Dexie internals are imported from concrete paths.

---

*Convention analysis: 2026-04-09*
