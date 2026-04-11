# Roadmap: Quizzapp — multi-step questions milestone

## Overview

This milestone replaces chain-linked question rows with **one logical question per pool unit**, embedding **linear steps** and **aggregate scoring** (`correct` / `partial` / `wrong`). Work flows from **domain + import contract** (types, Zod, bundled JSON migration) through **IndexedDB shape and persistence**, **SessionEngine step runner and scoring**, **live run UI** bound to engine state, then **verification, export alignment, and pause/resume documentation**.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Domain model & import contract** — Logical question + step unions, Zod at import boundary, bundled `question-sets/` migrated
- [ ] **Phase 2: IndexedDB & persistence** — One stored row per logical question, no fan-out, schema bump + wipe documented
- [ ] **Phase 3: Session engine & aggregate scoring** — Logical pool slots, engine-owned step progression, aggregate outcomes, one Attempt per unit
- [ ] **Phase 4: Live session run UI** — Stem + current step + k-of-n from engine; per-step interactions; no authoritative duplicate step index
- [x] **Phase 5: Verification, export & lifecycle** — Scoring/progression tests, backup/export parity, pause/resume documented

## Phase Details

### Phase 1: Domain model & import contract

**Goal**: Authors and the app share one **importable contract**: a logical question is a single unit with **ordered, discriminated steps**; bundled JSON is validated before persistence.

**Depends on**: Nothing (first phase)

**Requirements**: MODL-01, MODL-02, IMPT-01, IMPT-02

**Success Criteria** (what must be TRUE):

1. A logical question is modeled as **one unit** with an **ordered list of steps** (no new-content reliance on `chain_parent_id` / `chain_order`).
2. Steps use **discriminated shapes** so each step can carry its own content and answer config (including shared stem with per-step highlights where designed).
3. **Imported JSON** is **rejected or accepted at the import boundary** via runtime validation aligned with TypeScript (e.g. Zod)—invalid files do not silently persist.
4. **All bundled** files under `question-sets/` are **in the new format** and **import successfully** through the importer.

**Plans:** 4 plans

Plans:

- [x] 01-01-PLAN.md — Zod 4, strict schemas, error formatter, OpenAnswerConfig.referenceAnswer (MODL-01/02, D-01–D-09, D-12)
- [x] 01-02-PLAN.md — parseQuestionSetFile + logical→ParsedQuestionSet persistence bridge + importer/persist tests (IMPT-01)
- [x] 01-03-PLAN.md — migrate `question-sets/**/*.json` via maintainer script (IMPT-02, D-10/D-11)
- [x] 01-04-PLAN.md — validate every bundled JSON in Vitest + GitHub Actions CI (D-13, IMPT-02 guard)

### Phase 2: IndexedDB & persistence

**Goal**: **IndexedDB** stores **one row per logical question** with nested steps; saves do not fan out into linked rows; upgrade behavior and wipe are clear.

**Depends on**: Phase 1

**Requirements**: DATA-01, DATA-02, DATA-03

**Success Criteria** (what must be TRUE):

1. After a Dexie **version bump**, each logical question is **one stored record** with nested steps; indexes **do not** depend on chain parent fields.
2. **`persistQuestionSet`** writes each logical question **without** expanding it into multiple linked rows per unit.
3. **IndexedDB wipe** on upgrade is an **accepted** behavior and is **documented** so developers (and users, if applicable) know local data may reset—no migration of old chain rows required.

**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Cut over question persistence contract + Dexie v3 chain-free schema/indexes (DATA-01)
- [x] 02-02-PLAN.md — Refactor `persistQuestionSet` to one-write-per-logical-question with regression tests (DATA-02)
- [x] 02-03-PLAN.md — Add upgrade wipe communication in UI + README + CHANGELOG (DATA-03)

### Phase 3: Session engine & aggregate scoring

**Goal**: **Live session logic** treats each logical question as **one draw and one completion**; the **SessionEngine** is the **only authority** for step order and progress; **one Attempt** per finished unit reflects aggregate scoring rules.

**Depends on**: Phase 2

**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04

**Success Criteria** (what must be TRUE):

1. The session **selection pool** lists **logical question ids only**—a multi-step unit consumes **one** slot in the teacher-facing flow.
2. **SessionEngine** drives **linear step progression** and exposes the **authoritative** current step and progress (no competing source of truth).
3. For a completed unit: **all steps correct** → `correct`; **all wrong** → `wrong`; **any mix of correct and wrong** → `partial`.
4. Exactly **one `Attempt`** is recorded per **completed** logical unit, tied to the **logical** `question_id`, using that aggregate outcome.

**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Rebuild SessionEngine as logical-unit authority with resumable step state and aggregate one-attempt scoring
- [x] 03-02-PLAN.md — Wire run route to engine-owned progression and lock skip/resume behavior with integration assertions

### Phase 4: Live session run UI

**Goal**: During a run, participants see **shared context** and the **current step** with **clear k-of-n** progression that **matches** the engine; each step is answered with the right interaction type; the UI does not invent its own step authority.

**Depends on**: Phase 3

**Requirements**: UI-01, UI-02, UI-03

**Success Criteria** (what must be TRUE):

1. The run experience shows **shared stem/context** when present and the **current step**, with **obvious k-of-n progression** that reflects **engine state** (not a guessed parallel counter).
2. The user can submit answers for each step using **open**, **multiple-choice**, or **true/false** interactions **as defined for that step**.
3. The run UI **does not** keep a separate **authoritative** step index that can **desync** from the engine.

**Plans:** 1 plan

Plans:

- [x] 04-01-PLAN.md — Verify UI-01–UI-03: engine run contract tests + run page traceability (minimal UI change per 04-CONTEXT)

**UI hint**: yes

### Phase 5: Verification, export & lifecycle

**Goal**: **Automated coverage** locks scoring and progression rules; **backup/export** (if present) matches the persisted shape; **pause/resume** during a multi-step unit is **explicitly documented** (including limits).

**Depends on**: Phase 4

**Requirements**: VER-01, VER-02, VER-03

**Success Criteria** (what must be TRUE):

1. **Automated tests** cover the **aggregate scoring matrix** (all correct, all wrong, mixed → partial) and **core step progression** through the engine (or equivalent verifiable layer).
2. If **backup/export** exists, it **reads and writes** payloads **consistent** with the **new persisted question shape** (no hidden chain-era shape in export).
3. **Pause/resume** behavior during a multi-step unit is **documented**, including **explicit limitations** if step position is not persisted across pause.

**Plans:** 2 plans

Plans:

- [x] 05-01-PLAN.md — VER-01: SessionEngine test traceability + single-step aggregate + progression titles
- [x] 05-02-PLAN.md — VER-02/VER-03: `buildFullBackupPayload`, backup Vitest + fake-indexeddb, README + settings pointer

## Progress

**Execution Order:**

Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Domain model & import contract | 0/4 | Not started | - |
| 2. IndexedDB & persistence | 0/TBD | Not started | - |
| 3. Session engine & aggregate scoring | 0/TBD | Not started | - |
| 4. Live session run UI | 0/TBD | Not started | - |
| 5. Verification, export & lifecycle | 2/2 | Complete | 2026-04-11 |
