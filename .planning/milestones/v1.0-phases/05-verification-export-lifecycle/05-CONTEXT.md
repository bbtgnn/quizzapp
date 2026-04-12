# Phase 5: Verification, export & lifecycle - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

**Automated coverage** locks **aggregate scoring** (all correct → `correct`, all wrong → `wrong`, mixed → `partial`) and **core step progression** through the **SessionEngine** (or the same verifiable layer). **Full JSON backup/export** (already in the app) must **read and write** payloads **consistent** with the **current persisted logical-question shape**—no hidden chain-era rows in export. **Pause/resume** during a multi-step unit is **documented** for the right audiences, including **explicit limitations** (e.g. what persists vs. what does not across reload). Scope is verification, backup parity, and documentation—not new session features.

</domain>

<decisions>
## Implementation Decisions

### Automated verification (VER-01)

- **D-01:** Primary automated coverage lives in **Vitest**, extending or complementing **`src/lib/domain/session-engine/session-engine.test.ts`** (existing mock repos pattern). Cover the **aggregate scoring matrix** and **core linear step progression** through the engine API and persistence side effects (e.g. single `Attempt` on unit completion, `active_unit_progress` where relevant).
- **D-02:** **Playwright / run-page E2E** is **not required** for Phase 5 by default; add only if a plan task proves a gap that unit tests cannot close against **UI-01–UI-03** (defer unless necessary).

### Backup/export parity (VER-02)

- **D-03:** **No backward compatibility** for **old backup files** (pre–supported export `version` or chain-era payloads). Import continues to **reject** unsupported `version` values with a **clear error** (same policy as today: supported version only). No migration path from legacy backups.
- **D-04:** When the **export envelope or stored table semantics** change in a way that matters for restore, **bump** the top-level backup JSON **`version`** field in **`exportFullBackup`** and enforce the same version in **`importFullBackupFromFile`** (exact integer is **Claude’s discretion** per change; user accepts breaking old files).
- **D-05:** Ensure exported **`questions`** (and related tables as needed) reflect **one row per logical question** with **nested `steps`**—no reliance on chain fields in export/import paths.

### Pause/resume documentation (VER-03)

- **D-06:** Add a concise **“Sessions & pause/resume”** (or similarly named) section to the **project README** describing: mid-unit pause via reload/navigation behavior aligned with **Phase 3** engine rules (resume same logical unit at same step when state is persisted); **limitations** (e.g. clearing site data, unsupported backup versions, browser/tab lifecycle) in plain language.
- **D-07:** Add a **short pointer** on **`src/routes/settings/+page.svelte`** (or adjacent copy) so users who use **Export/Import** can find the README section—**one sentence + link** is enough unless a planner task prefers inline summary.

### Export/import testing

- **D-08:** Add at least **one Vitest** test that exercises **backup round-trip** (export-equivalent payload or `importFullBackupFromFile` with a **fixture file** / in-memory flow) so restored **`questions`** match **logical-question** expectations—planner chooses **fake-indexeddb** vs. integration style consistent with repo patterns.

### Claude's Discretion

- Exact test file split (`session-engine.test.ts` vs. new modules), matrix case naming, and any small **pure helpers** extracted for assertions.
- Whether backup **`version`** stays at **2** or increments in this phase once shape/validation is finalized.
- Wording and placement of README/settings copy within D-06/D-07.

### Folded Todos

_None._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — **VER-01**, **VER-02**, **VER-03**
- `.planning/ROADMAP.md` — Phase 5 goal and success criteria
- `.planning/PROJECT.md` — local-first scope, Dexie wipe posture, milestone intent

### Prior phase context

- `.planning/phases/03-session-engine-aggregate-scoring/03-CONTEXT.md` — engine authority, aggregate scoring, skip/attempt/pause semantics
- `.planning/phases/02-indexeddb-persistence/02-CONTEXT.md` — one row per logical question, `Attempt.question_id` semantics
- `.planning/phases/04-live-session-run-ui/04-CONTEXT.md` — UI defers to engine only

### Code

- `src/lib/domain/session-engine/index.ts` — progression and scoring authority
- `src/lib/domain/session-engine/session-engine.test.ts` — existing engine test patterns
- `src/lib/adapters/persistence/dexie/backup.ts` — full export/import, backup `version`
- `src/lib/app/backup.ts` — app re-exports
- `src/routes/settings/+page.svelte` — backup UI entry point
- `src/lib/adapters/persistence/dexie/schema.ts` — Dexie tables consumed by export

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **`session-engine.test.ts`** — `SessionEngine` with mock persistence repos; extend for scoring matrix and progression coverage.
- **`exportFullBackup` / `importFullBackupFromFile`** — full-database JSON with `version: 2`; import already rejects other versions.

### Established patterns

- **Vitest** node project for domain/persistence unit tests (`vite.config.ts` server project).
- Backup flows live under **Dexie adapter**; settings page calls **`$lib/app`** facade.

### Integration points

- Tests hook into **engine + ports**; backup tests may need **Dexie test DB** or fixture-driven import—follow existing persistence test style if present.

</code_context>

<specifics>
## Specific Ideas

- User chose: **recommended Vitest-first verification**; **ignore old backups** (no legacy import support); **README + settings pointer** for pause/resume; **at least one round-trip** backup test.

</specifics>

<deferred>
## Deferred Ideas

- Playwright coverage for run UI in Phase 5 — only if a documented gap requires it (D-02).

### Reviewed Todos (not folded)

_None._

</deferred>

---

*Phase: 05-verification-export-lifecycle*
*Context gathered: 2026-04-10*
