# Requirements: Quizzapp — multi-step questions milestone

**Defined:** 2026-04-09  
**Core Value:** Teachers can run fair, understandable live quizzes where each drawn item is one clear unit—possibly several steps—without a separate chain-question concept.

## v1 Requirements

### Domain model & import

- [ ] **MODL-01**: A logical question is one persisted unit with an **ordered list of steps** embedded in that unit (no `chain_parent_id` / `chain_order` model for new content).
- [ ] **MODL-02**: Steps are expressed with **discriminated shapes** so different question kinds can attach **per-step** content and answer configs (including shared stem with per-step highlights where designed).
- [ ] **IMPT-01**: Imported JSON is **validated at the import boundary** (runtime schema validation aligned with TypeScript, e.g. Zod) before persistence.
- [ ] **IMPT-02**: All **bundled** files under `question-sets/` are **migrated** to the new format and remain loadable by the importer.

### Persistence

- [ ] **DATA-01**: **Dexie schema** is updated (version bump) so each logical question is **one stored row** with nested steps; indexes no longer depend on chain parent fields.
- [ ] **DATA-02**: **`persistQuestionSet`** persists logical questions **without** fan-out into multiple linked rows per unit.
- [ ] **DATA-03**: **IndexedDB wipe** on upgrade is **acceptable** and **documented** for users/developers (no migration of old client DB required).

### Session engine & scoring

- [ ] **SESS-01**: The session **selection pool** contains **logical question ids only**; a multi-step unit consumes **one** slot in the teacher’s model.
- [ ] **SESS-02**: **SessionEngine** owns **linear step progression** and exposes the **authoritative** current step and progress (no competing source of truth in UI).
- [ ] **SESS-03**: **Aggregate outcome** for the unit: all steps correct → `correct`; all wrong → `wrong`; **any mix of correct and wrong** → `partial`.
- [ ] **SESS-04**: Exactly **one `Attempt`** is recorded per completed logical unit, referencing the **logical** `question_id`, with the aggregate outcome above.

### Live session UI

- [ ] **UI-01**: Run experience shows **shared stem/context** (when present) and the **current step**, including **clear k-of-n** progression tied to engine state.
- [ ] **UI-02**: User can answer each step using the existing **open / multiple-choice / true-false** interactions as defined for that step.
- [ ] **UI-03**: Run UI does **not** maintain a separate authoritative step index that can **desync** from the engine.

### Verification & lifecycle

- [ ] **VER-01**: **Automated tests** cover the **aggregate scoring matrix** (all correct, all wrong, mixed → partial) and core step progression.
- [ ] **VER-02**: **Backup/export** (if present) reads/writes payloads **consistent** with the new persisted question shape.
- [ ] **VER-03**: **Pause/resume** behavior during a multi-step unit is **documented** (including explicit limitations if step position is not persisted).

## v2 Requirements

Deferred after v1 validation.

### Authoring & analytics

- **AUTH-01**: Rich in-app authoring for multi-step templates beyond JSON-first workflows.  
- **ANLY-01**: First-class per-step reporting or analytics surfaces.

### Advanced assessment

- **ADVN-01**: Weighted or rubric-based partial credit per step.  
- **ADVN-02**: Branching or conditional steps inside one logical question.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server sync, accounts, multi-device continuity | Local-first product direction unchanged |
| Backward-compatible migration of old IndexedDB chain rows | Dexie wipe acceptable per project decision |
| Full authoring UI redesign | Out of scope unless minimally required for import/testing |
| Branching steps, per-step weights in v1 | Caps complexity; linear steps and uniform aggregate partial only |

## Traceability

Which phases cover which requirements — updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODL-01 | — | Pending |
| MODL-02 | — | Pending |
| IMPT-01 | — | Pending |
| IMPT-02 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| SESS-01 | — | Pending |
| SESS-02 | — | Pending |
| SESS-03 | — | Pending |
| SESS-04 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| VER-01 | — | Pending |
| VER-02 | — | Pending |
| VER-03 | — | Pending |

**Coverage:**

- v1 requirements: 16 total  
- Mapped to phases: 0  
- Unmapped: 16 (roadmap pending)

---
*Requirements defined: 2026-04-09*  
*Last updated: 2026-04-09 after initial definition*
