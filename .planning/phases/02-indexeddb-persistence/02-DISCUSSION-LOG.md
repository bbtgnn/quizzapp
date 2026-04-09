# Phase 2: IndexedDB & persistence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `02-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 2 — IndexedDB & persistence
**Areas discussed:** Stored shape & TypeScript model; Dexie version bump & indexes; `QuestionSetRepository` & `persistQuestionSet`; Wipe documentation & surfacing

---

## Selection

**User's choice:** Discuss **all** proposed gray areas — **1, 2, 3, 4** (comma-separated selection).

---

## Area 1 — Stored shape & TypeScript model

| Option | Description | Selected |
|--------|-------------|----------|
| A | One row = logical unit with `shared` + nested `steps[]`; drop chain fields from persisted model | ✓ |
| B | Separate table/entity name for “logical” vs legacy `Question` alias | |
| C | Defer model shape to implementation without constraints | |

**User's choice:** Align with **A** via roadmap + Phase 1 import contract + discuss-phase briefing (no separate competing model).

**Notes:** `Attempt.question_id` remains one id per logical unit (D-03 in CONTEXT).

---

## Area 2 — Dexie version bump & indexes

| Option | Description | Selected |
|--------|-------------|----------|
| A | New version (e.g. v3); indexes `id, question_set_id` only; no `chain_parent_id` | ✓ |
| B | Richer indexes upfront without proven query need | |
| C | Soft migration preserving old rows | |

**User's choice:** **A** — clean break / wipe acceptable per PROJECT and DATA-03.

**Notes:** Optional dev-only logging in upgrade — discretion (D-06).

---

## Area 3 — Repository & `persistQuestionSet`

| Option | Description | Selected |
|--------|-------------|----------|
| A | One persistence write per logical question; delete-by-set then insert on reimport | ✓ |
| B | Multiple rows per unit with different API | |
| C | Upsert-by-stable ids without delete | |

**User's choice:** **A**; evolve or bypass chain-shaped `ParsedQuestion` bridge for persist (implementation discretion D-08).

---

## Area 4 — Wipe documentation & surfacing

| Option | Description | Selected |
|--------|-------------|----------|
| A | User-facing short notice (banner/toast) + README/docs for developers + CHANGELOG line | ✓ |
| B | README only | |
| C | Silent upgrade | |

**User's choice:** **A** (DATA-03).

---

## Claude's Discretion

- Naming (`Question` vs `LogicalQuestion`), repository method names, exact notice copy/placement, optional upgrade logging.

## Deferred Ideas

- Export/backup parity (Phase 5); session engine pool (Phase 3); any remaining highlight semantics across steps via stored `steps[].range`.
