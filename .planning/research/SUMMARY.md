# Project Research Summary

**Project:** Quizzapp — multi-step questions milestone  
**Domain:** Brownfield client-only classroom quiz app — refactor from chain-linked rows to one logical `Question` with embedded linear steps (IndexedDB, teacher-led sessions)  
**Researched:** 2026-04-09  
**Confidence:** MEDIUM–HIGH (strong alignment with `PROJECT.md` and codebase; some UX and per-`kind` schema details remain to pin in planning)

## Executive Summary

Quizzapp is a **local-first, browser-only** quiz tool for live classroom use. The milestone replaces **multiple Dexie rows per “chain”** (`chain_parent_id` / `chain_order`) with **one persisted logical question** whose **steps** are structured data inside that row. Experts build this by **modeling steps as discriminated unions**, validating **imported JSON at the boundary** (recommended: **Zod 4**), keeping **SessionEngine** as the single authority for turn order and **aggregate scoring**, and storing **one `Attempt` per logical unit** with outcomes **correct / partial / wrong** per `PROJECT.md`.

The recommended approach is: **define `LogicalQuestion` + step unions in `model` first**, evolve the **importer and bundled `question-sets/`** together, **bump Dexie `version`** and treat **wipe as acceptable** for dev and per `PROJECT.md`, then implement a **step runner** in SessionEngine that mirrors today’s in-memory chain state but reads **`question.steps`**. **Aggregation must change semantically:** mixed correct and wrong step outcomes → **`partial`**, not “any wrong → wrong” like the current `_computeChainOutcome`. Run UI must derive **current step and “k of n”** from the engine only, not parallel local state.

Key risks are **(1)** shipping the old aggregate rule or inconsistent rules between UI and engine — mitigate with a **single truth table**, **matrix unit tests**, and UAT on combinations; **(2)** accidentally modeling steps as **separate pool rows** — one draw, one slot, one attempt; **(3)** **UI/engine desync** on step index — mitigate with engine-exposed getters; **(4)** **pause/resume** losing mid-unit step position (pre-existing chain-class issue) — document or scope persistence explicitly; **(5)** **Dexie schema drift** and **bad bundled migrations** — bump version, document dev reset, round-trip tests on fixtures.

## Key Findings

### Recommended Stack

Keep **SvelteKit ^2.50**, **Svelte ^5.54**, **TypeScript ^5.9**, **Dexie ^4.4**, **bun**. Extend the existing discriminated-union style (`ContentConfig` / `AnswerConfig`) to **per-step kinds**. **Add `zod@^4.3.6`** as a **runtime** dependency for **import-time** validation: `z.discriminatedUnion('type', [...])`, `.safeParse()` at the file→domain boundary; prefer **`z.infer`** for imported payload types. **Do not** add parallel JSON Schema + ajv at runtime; optional **dev-only** `zod-to-json-schema` only if external tooling needs it. **Bump Dexie `version`** when stores/indexes change; use Dexie 4’s diffing as a safety net, not a substitute for explicit versioning. **Avoid** normalizing every step into separate IndexedDB tables for v1 — one row per logical question with embedded `steps` is the right trade-off while wipe is OK.

**Core technologies:**
- **SvelteKit + Svelte 5 + TS:** SPA routing, UI, typed discriminated unions for steps — already in repo; no stack change for the milestone.
- **Dexie 4:** IndexedDB with `version(n).stores().upgrade()` — keep; evolve schema for flat logical questions and drop chain indexes.
- **Zod 4:** Runtime validation at import boundary — add; single source of truth for JSON shape with TS types derived from schemas.

### Expected Features

**Must have (table stakes):**
- **One unit in the session deck** — one pool slot and one teacher-facing “question” per logical item, not N linked rows.
- **Clear step progression** — students see step *k* of *n* and what to answer now; aligns with engine step state.
- **Shared stem / context** — stable code/image/stem with per-step prompts and highlight overlays where designed.
- **Per-step answer modality** — open, MC, TF per step via discriminated configs.
- **Aggregate outcome** — one `Attempt` with **correct / partial / wrong** from combined step results (uniform steps; no per-step weights in v1).
- **Predictable partial rule** — “some right, some wrong” → partial; matches core product value.

**Should have (competitive):**
- **Code + highlight-scoped prompts** — CS-friendly one-snippet, multi-prompt flows.
- **Mixed interaction types in one item** — pedagogically one task, one pool object.
- **Hexagonal session core** — maintain testable `SessionEngine` + strategies as steps grow.

**Defer (v2+):**
- Per-step weights, branching steps, full authoring UI redesign, backward-compatible migration from old chain rows (use wipe + re-import per `PROJECT.md`), server sync, step-level analytics as first-class reporting.

### Architecture Approach

Keep **hexagonal persistence** and a **pure SessionEngine**. The **selection pool** is **logical questions only**; **step index and per-step outcomes** live in the engine until the unit completes, then **one `createAttempt`** with logical `question_id`. **Importer** is the **single JSON→domain gate**; **persistQuestionSet** writes **one create per logical question**. **SessionEnginePersistence** port surface can stay unchanged. Replace chain expansion with a **step runner** over `currentLogicalQuestion.steps`. **Anti-patterns:** child rows per step, UI querying Dexie for current step during run, splitting aggregation between UI and engine.

**Major components:**
1. **Model (`types.ts`)** — `LogicalQuestion`, step discriminated unions; remove `chain_*` from new shape.
2. **Importer** — parse/validate; output matches persisted shape; tests lock the contract.
3. **QuestionSetRepository + Dexie** — one stored row per logical question with nested `steps`; indexes for `question_set_id` / `id`.
4. **SessionEngine** — pick logical id, advance `_stepIndex`, collect `_stepOutcomes`, aggregate, then consume slot.
5. **Run UI** — bind to engine’s logical question + step index + progress; small presenters per answer type.

### Critical Pitfalls

1. **Wrong aggregate rule** — Current chain logic is “any wrong → wrong”; milestone requires **mixed → partial**. Avoid: one shared aggregation function, rewrite chain-era tests, outcome matrix tests.
2. **Multiple persisted questions per logical unit** — Breaks slots, attempts, and selection. Avoid: one IndexedDB row per logical item; one attempt per unit; centralize expansion in engine.
3. **UI/engine desync on step index** — Avoid: drive UI only from engine-exposed state; no duplicate `currentStepIndex` for authority.
4. **Mid-unit pause/resume** — Step position not persisted (same class as today). Avoid: document behavior; optional future persistence on `Session`/`SessionStudent`.
5. **Dexie/schema and bundled migration mistakes** — Avoid: bump `version`, document dev wipe, align importer version with backup format; invariant tests on migrated JSON.

## Implications for Roadmap

Suggested phase structure follows dependency order: **model → importer + data → persistence → engine → UI → verification / export alignment**.

### Phase 1: Domain model & import contract
**Rationale:** Everything else consumes one `LogicalQuestion` + step union shape; prevents reintroducing chain-style rows under new names.  
**Delivers:** `LogicalQuestion` / `Step` types, optional Zod schemas (`z.infer`), importer producing validated `ParsedQuestionSet`, migrated bundled `question-sets/*.json`, fixture tests.  
**Addresses:** Table stakes — single logical unit, linear steps, mixed modalities, JSON migration.  
**Avoids:** Pitfall #6 (bad migration flattening), duplicate validation stories (STACK: one Zod boundary).

### Phase 2: IndexedDB & repositories
**Rationale:** Persistence must store nested steps without fan-out rows before engine can load a flat logical pool.  
**Delivers:** Dexie `version` bump, `questions` store/index updates (drop `chain_parent_id` dependency), repository create/load for nested shape, `persistQuestionSet` one-op-per-logical-question, dev wipe documentation.  
**Addresses:** P1 bundled import path, index by set id.  
**Avoids:** Pitfall #5 (schema drift), Pitfall #2 (multiple rows per unit).

### Phase 3: Session engine & scoring
**Rationale:** Core session rules and aggregate semantics must be correct before UI investment; testable without full UI.  
**Delivers:** Step runner (`_activeLogicalQuestion`, `_stepIndex`, `_stepOutcomes`), selection pool of logical ids only, **explicit product aggregation** (all correct / all wrong / mixed → partial), single `createAttempt` per unit, updated unit tests including outcome matrix.  
**Addresses:** Aggregate outcomes, slot semantics, engine as sole authority for progression.  
**Avoids:** Pitfalls #1–2, anti-pattern “aggregation in UI.”

### Phase 4: Live session UI
**Rationale:** Run page must reflect engine state for stem + current step + “k of n.”  
**Delivers:** Run route/components bound to engine API (replace `chainProgress` with step-oriented API), per-step rendering, grading hooks for current step only.  
**Addresses:** Step progression UX, shared stem + overlays.  
**Avoids:** Pitfall #3 (UI/engine desync).

### Phase 5: Lifecycle, backup/export, and verification
**Rationale:** Close gaps that span layers: pause/resume expectations, export format parity with importer, E2E confidence.  
**Delivers:** Documented pause/resume behavior for mid-unit (or explicit non-guarantee), backup/export aligned with new shape if present, E2E or component tests for multi-step flows, UAT checklist from pitfalls “looks done but isn’t.”  
**Addresses:** Pitfalls #4–5, import security/size limits (PITFALLS).

### Phase Ordering Rationale

- **Model and importer first** — downstream layers share one contract; Zod + tests reduce silent JSON breakage.  
- **Persistence before engine** — engine tests need loadable shape from repositories or fixtures.  
- **Engine before run UI** — aggregation and slot rules are easier to verify in unit tests.  
- **Verification last** — validates cross-cutting pitfalls (pause, export, labels for partial vs wrong).

### Research Flags

Phases likely needing deeper research or explicit product decisions during planning:
- **Phase 5 (lifecycle):** Whether to persist in-flight step index for pause/resume or accept restart-at-step-1 — not fully specified in research; affects schema/session objects.
- **Phase 1 (model):** Exact **question `kind`** payloads if multiple topologies — ARCHITECTURE notes MEDIUM confidence on final per-kind shapes.

Phases with standard patterns (minimal extra research):
- **Phase 2:** Dexie `version` + `upgrade()` — well-documented; follow existing `schema.ts` pattern.
- **Phase 1:** Zod 4 discriminated unions — documented; add tests for complex spreads per STACK caveat.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Aligns with repo pins and Dexie/Zod docs; Zod union edge cases warrant tests. |
| Features | HIGH for PROJECT-aligned scope; MEDIUM for generic classroom UX | Behaviors tied to `PROJECT.md` are explicit; competitor matrix is directional. |
| Architecture | HIGH | Boundaries and data flow grounded in codebase `ARCHITECTURE` and engine/repository paths. |
| Pitfalls | HIGH for engine/scoring mismatch; MEDIUM for generic IndexedDB ecosystem | Code-specific pitfalls are evidence-based. |

**Overall confidence:** MEDIUM–HIGH

### Gaps to Address

- **Exact step/question `kind` schemas:** Finalize discriminant set and nested fields per kind during planning — use ARCHITECTURE conceptual model as starting point.
- **Pause/resume guarantee:** Decide whether milestone persists mid-unit step or documents limitation — affects Phase 5 scope.
- **Step-level `partial` vs unit-level mixed:** If step outcomes can include `partial`, confirm precedence rule with product (PITFALLS #1).

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — milestone scope, wipe, aggregate outcomes, out-of-scope items  
- `.planning/codebase/ARCHITECTURE.md` / `.planning/codebase/STACK.md` — existing app boundaries and versions  
- `src/lib/domain/session-engine/index.ts`, `persist-question-set.ts`, `schema.ts` — chain behavior and persistence (cited in research)

### Secondary (MEDIUM confidence)
- [Dexie.js documentation](https://dexie.org/docs) — versioning, upgrades, limitations  
- [Zod v4](https://zod.dev) — discriminated unions, `z.infer`  
- Classroom quiz UX expectations — synthesized from public product patterns, not user interviews

### Aggregated from research artifacts
- `.planning/research/STACK.md` — stack and validation strategy  
- `.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, MVP  
- `.planning/research/ARCHITECTURE.md` — components, patterns, build order  
- `.planning/research/PITFALLS.md` — failure modes and mitigations  

---
*Research completed: 2026-04-09*  
*Ready for roadmap: yes*
