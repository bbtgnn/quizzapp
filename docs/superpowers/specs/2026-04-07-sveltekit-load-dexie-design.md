# SvelteKit `load` for Dexie-backed routes — design

> **Current paths (2026-04-07):** This document was first written when some routes still imported **`$lib/db`**. The codebase now uses **`$lib/app`** (wired repositories and application helpers), **`$lib/model/types`** for entities, and **`src/lib/data/loaders/`** where reads are shared. IndexedDB is accessed only through the Dexie layer at **`src/lib/adapters/persistence/dexie/`** (not directly from routes).

## Goal

Move **read** access to IndexedDB (Dexie) out of ad hoc `onMount` / component logic into **SvelteKit universal `load` functions** (`+page.ts`) for every route that needs persisted data via **`$lib/app`** (repositories or application helpers) or thin **`src/lib/data/loaders/`** helpers, while keeping **writes** in the client and refreshing data via **invalidation**. Use a **hybrid** extraction strategy: logic lives in co-located `+page.ts` until duplication or complexity justifies a shared module under `$lib`.

## Constraints

- **Dexie runs only in the browser.** All DB reads in `load` must use **`+page.ts` (universal load)**, not `+page.server.ts`.
- Root **`src/routes/+layout.ts`** keeps **`ssr = false`** (and existing **`prerender`** as configured). This design does not require enabling SSR.
- **`load` is for reads.** Mutations stay in `+page.svelte` (or small client helpers). After a successful mutation, call **`invalidateAll()`** by default, or **`depends` + `invalidate`** when targeted refresh is needed.

## Route scope

Each route in the table that needs persisted reads should use **`+page.ts`** with **`$lib/app`** and/or **`src/lib/data/loaders/`** so **initial list/detail data** is provided via **`data`** (not duplicate `onMount` fetches for the same payload). Routes must not open Dexie directly.

| Route | `+page.svelte` path | Intent |
|--------|----------------------|--------|
| `/` | `src/routes/+page.svelte` | Classrooms list with student counts |
| `/sessions` | `src/routes/sessions/+page.svelte` | Sessions list |
| `/sessions/new` | `src/routes/sessions/new/+page.svelte` | Data for new-session form (e.g. classrooms, question sets) |
| `/sessions/[id]/run` | `src/routes/sessions/[id]/run/+page.svelte` | Run session |
| `/history` | `src/routes/history/+page.svelte` | History list |
| `/history/[id]` | `src/routes/history/[id]/+page.svelte` | Session history detail |
| `/question-sets` | `src/routes/question-sets/+page.svelte` | Question sets list |
| `/question-sets/import` | `src/routes/question-sets/import/+page.svelte` | Writes-heavy; `load` only if something must be read on entry |
| `/classrooms/new` | `src/routes/classrooms/new/+page.svelte` | Writes-heavy; `load` only if something must be read on entry |
| `/classrooms/[id]` | `src/routes/classrooms/[id]/+page.svelte` | Classroom + students |
| `/settings` | `src/routes/settings/+page.svelte` | Stop importing `db` from schema in the page; read via `load` and repos/helpers |

**Excluded:** `src/routes/demo/**` unless those pages later use the db.

## Architecture

1. **`+page.ts` per route** that needs read data: `export const load: PageLoad = async ({ params, url, depends }) => { … }`, returning a plain object (or throwing/redirecting as needed).
2. **`+page.svelte`** consumes **`data`** from props (SvelteKit convention) and removes redundant client-only initial fetch for the same fields.
3. **Hybrid extraction:** if two routes share the same query or a single `load` becomes hard to follow, extract a function under e.g. **`src/lib/data/loaders/`** (exact folder name can match existing conventions) with an explicit return type; keep **`+page.ts`** as a thin wrapper.
4. **Settings:** refactor any direct **`db`** usage in the page into repository functions or a small helper, then call that from **`load`** so the Svelte file does not touch the Dexie instance directly.

## Error handling

- **Missing or invalid entity** (bad `params.id`, deleted row): **`error(404, …)`** from `@sveltejs/kit`.
- **Unexpected Dexie failures:** default to **`error(500, …)`** with a safe user message; log the underlying error to the console.
- **Soft failure (optional, per route):** a list page may instead **`return`** `{ …data, error: string }` for an inline retry UX. **Do not mix** full `error()` and soft `{ error }` on the same route without a documented reason.

## Loading and UX

- **Initial** content for a route comes from **`load`** → **`data`**, not **`onMount`** for the same payload.
- **Action-level** loading (e.g. delete in progress) remains local to the control that triggered the mutation.
- Optional global navigation loading UI is **out of scope** unless added explicitly later.

## Invalidation (mutations)

- **Default:** **`invalidateAll()`** after successful mutations that should refresh lists or details.
- **Refine when needed:** in `load`, register **`depends('app:<resource>')`** and after mutations call **`invalidate('app:<resource>')`** for that key when redundant reloads become noticeable or when multiple routes must stay in sync.

## Typing

- Use generated types from **`./$types`**: **`PageLoad`**, **`PageData`** (and **`PageProps`** in Svelte 5 / Kit’s generated component types as applicable) so **`data`** is typed.
- Exported loader helpers in `$lib` define explicit return types for their payload shapes.

## Testing

- **Unit tests:** prefer testing **extracted** loader functions in `$lib` with Vitest (mock Dexie or repositories as the project already does elsewhere).
- **E2E:** existing Playwright flows should remain valid; verify navigation and mutations still show updated data after invalidation.

## Non-goals

- Moving persistence to the server or adding **`+page.server.ts`** for Dexie.
- Enabling SSR for db-backed pages in this iteration.
- Large unrelated refactors outside what’s needed to introduce `load` and invalidation.

## Approval

- **Approach:** Hybrid (3) — co-located `+page.ts`, extract loaders when justified.
- **Sections:** Scope/architecture (1), error handling and typing (2), invalidation (3) — all approved in design discussion.
