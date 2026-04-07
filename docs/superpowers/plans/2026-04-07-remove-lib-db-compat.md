# Remove `src/lib/db` compatibility layer — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the unused **`src/lib/db/**`** re-export shim and align **`.planning/codebase/`** plus two **superpowers** documents so nothing instructs readers to use a removed path.

**Architecture:** Persistence stays in **`src/lib/adapters/persistence/dexie/`**; composition stays in **`src/lib/app/`**; types stay in **`src/lib/model/types.ts`**. This change is **documentation + dead code removal** only; runtime behavior is unchanged.

**Tech stack:** SvelteKit 2, Svelte 5, TypeScript, Vitest, Playwright, bun (per `package.json` scripts).

**Design spec:** [`docs/superpowers/specs/2026-04-07-remove-lib-db-compat-design.md`](../specs/2026-04-07-remove-lib-db-compat-design.md)

---

## File structure (this change)

| Path | Action |
|------|--------|
| `src/lib/db/**` | **Delete** entire tree (8 files). |
| `.planning/codebase/ARCHITECTURE.md` | Remove legacy `src/lib/db` bullet under Data layer. |
| `.planning/codebase/STRUCTURE.md` | Remove `db/` row from `src/lib/` table. |
| `.planning/codebase/CONVENTIONS.md` | Replace persistence bullet; drop `$lib/db` wording. |
| `docs/superpowers/plans/2026-04-07-hexagonal-ports-adapters.md` | Status note, **Architecture** line fix, file-map rows for removed `db/**`, one route-map cell clarification. |
| `docs/superpowers/specs/2026-04-07-sveltekit-load-dexie-design.md` | Top “current paths” callout; rewrite **Goal** and **Route scope** openers. |

**Testing note:** No new unit test is required (no new behavior). Verification is **`rg`** + **`bun run test:unit -- --run`** + **`bun run check`**.

---

### Task 1: Baseline grep (before delete)

**Files:** none (read-only)

- [ ] **Step 1: Confirm no code imports `$lib/db`**

Run:

```bash
# From the repository root (where package.json lives)
rg '\$lib/db' src --glob '*.{ts,svelte}'
```

Expected: **no output** (zero matches).

- [ ] **Step 2: List files to be removed**

Run:

```bash
find src/lib/db -type f
```

Expected (order may vary):

```
src/lib/db/backup.ts
src/lib/db/index.ts
src/lib/db/schema.ts
src/lib/db/types.ts
src/lib/db/repositories/attempts.ts
src/lib/db/repositories/classrooms.ts
src/lib/db/repositories/question-sets.ts
src/lib/db/repositories/sessions.ts
```

---

### Task 2: Delete `src/lib/db`

**Files:**

- Delete: `src/lib/db/index.ts`
- Delete: `src/lib/db/types.ts`
- Delete: `src/lib/db/schema.ts`
- Delete: `src/lib/db/backup.ts`
- Delete: `src/lib/db/repositories/classrooms.ts`
- Delete: `src/lib/db/repositories/sessions.ts`
- Delete: `src/lib/db/repositories/question-sets.ts`
- Delete: `src/lib/db/repositories/attempts.ts`

- [ ] **Step 1: Remove tree with git**

Run:

```bash
git rm -r src/lib/db
```

Expected: `git status` shows **deleted** files under `src/lib/db/`.

- [ ] **Step 2: Commit**

`git rm` already stages the deletions. Run:

```bash
git commit -m "refactor: remove src/lib/db compatibility re-exports"
```

---

### Task 3: `.planning/codebase/ARCHITECTURE.md`

**Files:**

- Modify: `.planning/codebase/ARCHITECTURE.md`

- [ ] **Step 1: Remove the legacy barrel bullet**

In the **### Data layer (hexagonal)** section, **delete** this bullet entirely (line 22 as of 2026-04-07):

```markdown
- **Legacy barrel:** `src/lib/db/*` — thin re-exports for backward compatibility; **prefer `$lib/app` and `$lib/model` for new code**
```

Leave the four bullets above it (**Canonical types** through **Composition**) unchanged.

- [ ] **Step 2: Commit**

```bash
git add .planning/codebase/ARCHITECTURE.md
git commit -m "docs(planning): drop removed src/lib/db from architecture"
```

---

### Task 4: `.planning/codebase/STRUCTURE.md`

**Files:**

- Modify: `.planning/codebase/STRUCTURE.md`

- [ ] **Step 1: Remove `db/` row from `src/lib/` table**

Delete this row from the markdown table:

```markdown
| `db/` | Legacy re-exports (prefer `app/` + `model/`) |
```

The row above should remain `domain/`; the row below should remain `importer/`.

- [ ] **Step 2: Commit**

```bash
git add .planning/codebase/STRUCTURE.md
git commit -m "docs(planning): remove db/ row from structure table"
```

---

### Task 5: `.planning/codebase/CONVENTIONS.md`

**Files:**

- Modify: `.planning/codebase/CONVENTIONS.md`

- [ ] **Step 1: Replace the persistence bullet under ## Naming**

Find:

```markdown
- **Persistence:** Port interfaces in `src/lib/ports/`; Dexie implementations in `src/lib/adapters/persistence/dexie/repositories/`; routes and pages import **`$lib/app`** for wired repositories (not `$lib/db` for new code)
```

Replace with:

```markdown
- **Persistence:** Port interfaces in `src/lib/ports/`; Dexie implementations in `src/lib/adapters/persistence/dexie/repositories/`; routes, pages, and loaders import **`$lib/app`** for wired repositories and **`$lib/model`** for shared entity types. Do not import Dexie or `src/lib/adapters/**` from route files except through **`$lib/app`** or shared loader/helpers that follow the same boundaries.
```

- [ ] **Step 2: Commit**

```bash
git add .planning/codebase/CONVENTIONS.md
git commit -m "docs(planning): conventions persistence without lib/db"
```

---

### Task 6: `docs/superpowers/plans/2026-04-07-hexagonal-ports-adapters.md`

**Files:**

- Modify: `docs/superpowers/plans/2026-04-07-hexagonal-ports-adapters.md`

- [ ] **Step 1: Insert status block immediately after the H1 title**

The file begins with:

```markdown
# Hexagonal ports & adapters — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL:
```

Change it to:

```markdown
# Hexagonal ports & adapters — implementation plan

> **Status (2026-04-07):** The temporary folder **`src/lib/db/`** has been **removed** after migration. Use **`$lib/app`** and **`$lib/model`** for application imports; Dexie lives only under **`src/lib/adapters/persistence/dexie/`**. The file map and task checklist below are **historical** migration context.

> **For agentic workers:** REQUIRED SUB-SKILL:
```

- [ ] **Step 2: Replace the **Architecture:** sentence that mentions `src/lib/db/`**

Find (single line under **Goal** / agentic block):

```markdown
**Architecture:** Canonical entity types live in **`src/lib/model/types.ts`**. **`src/lib/ports/`** holds repository interfaces. **`src/lib/adapters/persistence/dexie/`** owns `QuizAppDB`, repository functions, and backup I/O. **`src/lib/db/`** becomes a **compatibility re-export layer** until all imports migrate to `$lib/app` or `$lib/model`. **`src/lib/application/`** adds use cases tested with stub ports. **`src/lib/domain/`** holds **SessionEngine**, **question-selector**, and **student-orderer** (moved from flat `lib` paths) with imports only from **`$lib/model`** and **`$lib/ports`** (types), not from adapters. Routes and loaders import **`$lib/app`** for wired services and persistence helpers.
```

Replace with:

```markdown
**Architecture:** Canonical entity types live in **`src/lib/model/types.ts`**. **`src/lib/ports/`** holds repository interfaces. **`src/lib/adapters/persistence/dexie/`** owns `QuizAppDB`, repository functions, and backup I/O. A short-lived **`src/lib/db/`** compatibility re-export layer existed during migration and **has been deleted**; use **`$lib/app`** and **`$lib/model`**. **`src/lib/application/`** adds use cases tested with stub ports. **`src/lib/domain/`** holds **SessionEngine**, **question-selector**, and **student-orderer** (moved from flat `lib` paths) with imports only from **`$lib/model`** and **`$lib/ports`** (types), not from adapters. Routes and loaders import **`$lib/app`** for wired services and persistence helpers.
```

- [ ] **Step 3: Update the file map table — remove shim rows, add one “removed” row**

In **## File map (create / modify / move)**:

1. **Delete** this row:

```markdown
| `src/lib/db/types.ts` | Re-export `export * from '$lib/model/types.js'` (compat). |
```

2. **Delete** these four consecutive rows:

```markdown
| `src/lib/db/schema.ts` | Re-export `db` from dexie adapter (compat). |
| `src/lib/db/repositories/*.ts` | Re-export each function from adapter repositories (compat). |
| `src/lib/db/backup.ts` | Re-export backup functions from adapter (compat). |
| `src/lib/db/index.ts` | Narrow over time: re-export types, `db`, repos, backup via compat shims until callers migrate. |
```

3. **Insert** this row **immediately after** the row for `src/lib/adapters/persistence/dexie/attempt-repository.adapter.ts` (so it sits before `src/lib/app/repositories.ts`):

```markdown
| `src/lib/db/**` *(removed)* | Temporary re-exports during migration; **do not recreate**. Use `$lib/model`, `$lib/app`, and `adapters/persistence/dexie/`. |
```

- [ ] **Step 4: Clarify the routes row that still says `$lib/db`**

Find:

```markdown
| `src/routes/**/*.svelte`, `src/routes/**/*.ts`, `src/lib/data/loaders/*.ts`, `src/lib/components/CodeBlock.svelte` | Switch imports from `$lib/db` / old domain paths to `$lib/app` / `$lib/model` / `$lib/domain`. |
```

Replace with:

```markdown
| `src/routes/**/*.svelte`, `src/routes/**/*.ts`, `src/lib/data/loaders/*.ts`, `src/lib/components/CodeBlock.svelte` | Migration target: **`$lib/app`** / **`$lib/model`** / **`$lib/domain`** only; **`$lib/db`** removed — do not reintroduce. |
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-04-07-hexagonal-ports-adapters.md
git commit -m "docs: annotate hexagonal plan after lib/db removal"
```

---

### Task 7: `docs/superpowers/specs/2026-04-07-sveltekit-load-dexie-design.md`

**Files:**

- Modify: `docs/superpowers/specs/2026-04-07-sveltekit-load-dexie-design.md`

- [ ] **Step 1: Insert current-paths callout after the H1**

After:

```markdown
# SvelteKit `load` for Dexie-backed routes — design
```

Insert a blank line, then:

```markdown
> **Current paths (2026-04-07):** This document was first written when some routes still imported **`$lib/db`**. The codebase now uses **`$lib/app`** (wired repositories and application helpers), **`$lib/model/types`** for entities, and **`src/lib/data/loaders/`** where reads are shared. IndexedDB is accessed only through the Dexie layer at **`src/lib/adapters/persistence/dexie/`** (not directly from routes).

```

- [ ] **Step 2: Replace the **Goal** section body**

Replace:

```markdown
## Goal

Move **read** access to IndexedDB (Dexie) out of ad hoc `onMount` / component logic into **SvelteKit universal `load` functions** (`+page.ts`) for every route that reads from `$lib/db`, while keeping **writes** in the client and refreshing data via **invalidation**. Use a **hybrid** extraction strategy: logic lives in co-located `+page.ts` until duplication or complexity justifies a shared module under `$lib`.
```

With:

```markdown
## Goal

Move **read** access to IndexedDB (Dexie) out of ad hoc `onMount` / component logic into **SvelteKit universal `load` functions** (`+page.ts`) for every route that needs persisted data via **`$lib/app`** (repositories or application helpers) or thin **`src/lib/data/loaders/`** helpers, while keeping **writes** in the client and refreshing data via **invalidation**. Use a **hybrid** extraction strategy: logic lives in co-located `+page.ts` until duplication or complexity justifies a shared module under `$lib`.
```

- [ ] **Step 3: Replace the opening paragraph of **Route scope****

Replace:

```markdown
Each of the following routes today imports from `$lib/db` or opens Dexie; add or align **`+page.ts`** so **initial list/detail data** is provided via **`data`** (not duplicate `onMount` fetches for the same payload).
```

With:

```markdown
Each route in the table that needs persisted reads should use **`+page.ts`** with **`$lib/app`** and/or **`src/lib/data/loaders/`** so **initial list/detail data** is provided via **`data`** (not duplicate `onMount` fetches for the same payload). Routes must not open Dexie directly.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-07-sveltekit-load-dexie-design.md
git commit -m "docs: align load+dexie spec with app/model import paths"
```

---

### Task 8: Verification

**Files:** none

- [ ] **Step 1: `src/` must not reference `$lib/db`**

```bash
rg '\$lib/db' src --glob '*.{ts,svelte}'
```

Expected: **no output**.

- [ ] **Step 2: Repo-wide sanity (optional but recommended)**

```bash
rg '\$lib/db' --glob '!**/node_modules/**'
```

Expected: matches only in **historical** docs where you intentionally kept the string inside “removed” / “do not reintroduce” wording, or **zero** matches if you prefer to grep with a stricter pattern. If old code blocks in other plans still show `import … from '$lib/db/...'`, either leave them as historical examples or add a one-line “historical import” comment in that doc in a follow-up — not required by the design spec.

- [ ] **Step 3: Typecheck**

```bash
bun run check
```

Expected: exits **0**, no `svelte-check` errors.

- [ ] **Step 4: Unit tests**

```bash
bun run test:unit -- --run
```

Expected: all tests **pass**.

- [ ] **Step 5: (Optional) Full `bun test`**

If CI runs E2E locally:

```bash
bun test
```

Expected: unit + e2e **pass** (requires Playwright browsers installed as for normal project setup).

---

## Plan self-review (author checklist)

| Spec requirement | Task covering it |
|------------------|------------------|
| Delete `src/lib/db/**` | Task 2 |
| Update `ARCHITECTURE.md` | Task 3 |
| Update `STRUCTURE.md` | Task 4 |
| Update `CONVENTIONS.md` | Task 5 |
| Hexagonal plan: status + fix confusing `db` instructions | Task 6 |
| SvelteKit load spec: archival note + Goal + Route scope | Task 7 |
| Verification: rg + check + tests | Tasks 1, 8 |

**Placeholder scan:** No TBD/TODO in this plan. **Consistency:** All paths use `src/lib/...` or `$lib/...` matching the repo. **Gap:** ESLint ban on `$lib/db` is explicitly out of scope per design spec.

---

*Plan written: 2026-04-07*
