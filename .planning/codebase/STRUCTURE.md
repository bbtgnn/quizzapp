# Repository Structure

**Analysis Date:** 2026-04-07

## Top level

| Path | Purpose |
|------|---------|
| `src/` | Application source (SvelteKit) |
| `question-sets/` | Bundled or sample question set JSON (e.g. `js-fundamentals/`) |
| `static/` | Static assets (if present) |
| `vite.config.ts` | Vite + plugins |
| `svelte.config.js` | SvelteKit adapter, runes, prerender |
| `playwright.config.ts` | E2E: build + preview on port 4173 |
| `tsconfig.json` | TypeScript |
| `eslint.config.js` | ESLint flat config |

## `src/routes/` (SvelteKit)

- **`+layout.svelte` / `+layout.ts`** — Global layout; `+layout.ts` disables SSR, enables prerender
- **`+page.svelte`** — Landing/home
- **`classrooms/`** — List, new, `[id]` classroom views
- **`sessions/`** — List, new, `[id]/run` session run UI
- **`question-sets/`** — Browse/import question sets
- **`history/`** — Attempt history
- **`settings/`** — App settings
- **`demo/`** — Internal demos (including Playwright demo route)

**Convention:** Route-only UI; heavy logic stays in `$lib`.

## `src/lib/`

| Path | Purpose |
|------|---------|
| `model/` | Canonical entity types (`types.ts`) |
| `ports/` | Repository and persistence interfaces |
| `adapters/persistence/dexie/` | Dexie schema, repository functions, adapter objects, backup |
| `app/` | Composition root: wired repositories, `sessionEnginePersistence`, backup exports |
| `application/` | Use cases (orchestrate ports; tested with stubs) |
| `domain/` | `session-engine/`, `question-selector/`, `student-orderer/` |
| `db/` | Legacy re-exports (prefer `app/` + `model/`) |
| `importer/` | Question set JSON parsing |
| `components/` | Shared Svelte components |
| `vitest-examples/` | Example tests (greet, Welcome) |

## `question-sets/`

- JSON files per topic (e.g. `001-string-literal.json`) — content, not code

## Where to add new code

| Task | Location |
|------|----------|
| New screen | `src/routes/.../+page.svelte` |
| Shared UI | `src/lib/components/` |
| DB access | Ports in `src/lib/ports/`; Dexie in `src/lib/adapters/persistence/dexie/`; wire via `src/lib/app/` |
| Session rules | `src/lib/domain/session-engine/` or domain selector/orderer strategies |
| New question JSON | `question-sets/` or import pipeline |

---

*Structure analysis: 2026-04-07*
