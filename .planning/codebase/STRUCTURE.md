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
| `db/` | Dexie schema (`schema.ts`), types, `repositories/`, `index.ts` |
| `session-engine/` | Core session orchestration (`index.ts`, `session-engine.test.ts`) |
| `question-selector/` | Pluggable question pick strategies |
| `student-orderer/` | Pluggable student ordering |
| `importer/` | Question set import from files |
| `components/` | Shared Svelte components |
| `vitest-examples/` | Example tests (greet, Welcome) |

## `question-sets/`

- JSON files per topic (e.g. `001-string-literal.json`) — content, not code

## Where to add new code

| Task | Location |
|------|----------|
| New screen | `src/routes/.../+page.svelte` |
| Shared UI | `src/lib/components/` |
| DB access | `src/lib/db/repositories/` + types in `types.ts` |
| Session rules | `src/lib/session-engine/` or selector/orderer strategies |
| New question JSON | `question-sets/` or import pipeline |

---

*Structure analysis: 2026-04-07*
