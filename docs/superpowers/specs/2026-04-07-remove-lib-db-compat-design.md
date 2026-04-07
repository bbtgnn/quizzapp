# Remove `src/lib/db` compatibility layer — design

## Goal

Delete the **obsolete** `src/lib/db/**` tree that existed only as a **re-export shim** after the hexagonal migration. Persistence code lives in **`src/lib/adapters/persistence/dexie/`**; routes and loaders use **`$lib/app`** and types from **`$lib/model/types.ts`**. There are **no** remaining imports of `$lib/db` under `src/` (verified before this spec was written).

## Chosen approach

**Approach 2 (recommended in brainstorm):** remove the code, update **live** planning docs under **`.planning/codebase/`**, and do a **light accuracy pass** on historical superpowers docs so readers are not pointed at a path that no longer exists. **No** ESLint `no-restricted-imports` in this work (optional follow-up).

## Scope (in)

1. **Delete** the entire directory **`src/lib/db/`** (including `index.ts`, `types.ts`, `schema.ts`, `backup.ts`, and `repositories/*.ts`).

2. **Update** `.planning/codebase/ARCHITECTURE.md`  
   - Remove the bullet that describes **`src/lib/db/*`** as a legacy barrel.  
   - Keep the hexagonal description: `model/`, `ports/`, `adapters/persistence/dexie/`, `app/`.

3. **Update** `.planning/codebase/STRUCTURE.md`  
   - Remove the **`db/`** row from the `src/lib/` table (persistence is already covered by `adapters/persistence/dexie/` and `app/`).

4. **Update** `.planning/codebase/CONVENTIONS.md`  
   - Replace phrasing like “not `$lib/db` for new code” with a single clear rule: routes/pages and loaders use **`$lib/app`** (and **`$lib/model`** for shared entity types) for normal data access; Dexie stays inside the adapter package.

5. **Documentation accuracy (superpowers, minimal touch)**  
   - **`docs/superpowers/plans/2026-04-07-hexagonal-ports-adapters.md`:** Add a short **status** note at the top (after the title block) stating that **`src/lib/db` was removed** after migration and that **`$lib/app` / `$lib/model`** are the supported import paths. Do **not** rewrite the full historical task list unless a line would confuse a reader into adding `src/lib/db` again; fix or annotate those spots only.  
   - **`docs/superpowers/specs/2026-04-07-sveltekit-load-dexie-design.md`:** Add an **archival / current paths** note at the top: the design originally referred to **`$lib/db`**; the app now uses **`$lib/app`** (and loaders/helpers as implemented). Adjust the **Goal** and **Route scope** opening sentences so they describe **IndexedDB reads via app-wired repositories or loaders**, not `$lib/db`.

## Scope (out)

- Product behavior, UI, and Dexie schema semantics unchanged.  
- No new ESLint rules (unless added in a separate change).  
- No exhaustive rewrite of every code sample inside old plans; only fixes needed so active instructions do not reference a removed module path.

## Verification

- `rg '\$lib/db|src/lib/db' src` — **zero** matches (or fix any stragglers before considering the work done).  
- Optional full-repo grep for the same pattern to catch tests or scripts outside `src/`.  
- `bun test` and `bun run check` (or the project’s documented equivalents) pass.

## Non-goals

- Reintroducing any compatibility barrel under another name.  
- Moving or renaming `adapters/persistence/dexie/` in this change.

---

*Spec date: 2026-04-07. Approved approach: delete `src/lib/db` + planning updates + superpowers doc accuracy pass (Approach 2).*
