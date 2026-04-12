# Project Retrospective

*Living document updated after each milestone.*

## Milestone: v1.0 — Multi-step questions

**Shipped:** 2026-04-12  
**Phases:** 5 | **Plans:** 12

### What was built

- Logical-question domain model with Zod at the import boundary and migrated bundled JSON under `question-sets/`.
- Dexie v3 persistence: one stored row per logical question, no write-path fan-out, documented upgrade wipe.
- SessionEngine as the single authority for step order, resume, and aggregate outcomes with one Attempt per completed unit.
- Run UI and tests aligned to engine getters; backup/export tests for logical shape; pause/resume called out in README and settings.

### What worked

- Phased split (domain → persistence → engine → UI → verification) kept dependencies clear and reviewable.
- Strong emphasis on tests at the engine and backup layers reduced regressions while the schema changed.

### What was inefficient

- Requirement checkboxes and traceability lagged the actual ship state until milestone close; keeping REQUIREMENTS.md in sync during execution would reduce end-of-milestone churn.
- No formal `v1.0-MILESTONE-AUDIT.md` — skipping audit saved time but trades away a single cross-phase sign-off artifact.

### Patterns established

- **SessionEngine getters** as the only source of run progression for UI.
- **Node Vitest** (`vitest.node.config.ts`, fake-indexeddb) for persistence/backup tests without browser project startup.

### Key lessons

1. When the domain model moves, update the **requirements doc** in the same phase that proves the behavior, not only at the end.
2. A one-page **milestone audit** is cheap insurance before tagging if stakeholders care about traceability.

### Cost observations

- Model mix / session counts: not instrumented in-repo for this milestone.
- Notable: execution was plan-heavy but produced a coherent vertical slice from import through live run.

---

## Cross-Milestone trends

### Process evolution

| Milestone | Phases | Key change |
|-----------|--------|------------|
| v1.0 | 5 | Introduced GSD phase execution with archived roadmap/requirements at ship |

### Cumulative quality

| Milestone | Notes |
|-----------|--------|
| v1.0 | SessionEngine + backup Vitest coverage; CI validates bundled JSON |

### Top lessons (verified across milestones)

1. *(TBD after more milestones.)*
