# Milestones

## v1.0 Multi-step questions (Shipped: 2026-04-12)

**Phases completed:** 5 phases, 12 plans, 18 tasks

**Key accomplishments:**

- Zod-backed import contract, strict schemas, bundled `question-sets/` migration, and CI validation of every JSON file.
- Logical-question Dexie v3 schema (one row per unit, nested steps), `persistQuestionSet` without chain fan-out, documented IndexedDB wipe.
- SessionEngine owns linear logical-unit progression, resumable step state, aggregate scoring (`correct` / `partial` / `wrong`), one Attempt per completed unit.
- Run route reads progression only from SessionEngine (skip semantics, no duplicate step authority); Vitest coverage for stem, step types, and k-of-n.
- VER-01–labeled engine tests for scoring matrix and progression; `buildFullBackupPayload` + Node Vitest backup round-trip; README/settings for pause/resume (VER-03).

### Known gaps

- No `.planning/v1.0-MILESTONE-AUDIT.md` was written before ship; formal milestone audit (`/gsd-audit-milestone`) was skipped. Re-run on retrospectives if you want a written cross-phase sign-off.

---
