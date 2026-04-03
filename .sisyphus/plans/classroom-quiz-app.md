# Classroom Quiz App — Execution Plan

**PRD**: `prds/classroom-quiz-app/index.md`
**Issues**: `prds/classroom-quiz-app/issues/`
**Created**: 2026-04-03

---

## Phase 1 — Foundation (no blockers, all parallel)

- [x] **01 · DB layer & data model** `issues/01-db-layer.md`
      Install Dexie.js. Define versioned schema for all 8 entities (Classroom, Student, QuestionSet, Snippet, Question, Session, SessionStudent, Attempt). Create typed interfaces. Build repository layer with async CRUD methods per entity. No business logic.

- [x] **05 · Pluggable question selector** `issues/05-question-selector.md`
      Define `QuestionSelectionStrategy` interface. Implement default strategy (prioritise unanswered/wrong/partial, cycle from oldest when all correct). Create strategy registry. Unit tests for all scenarios.

- [x] **06 · Pluggable student orderer** `issues/06-student-orderer.md`
      Define `StudentOrderStrategy` interface. Implement default shuffle strategy. Create strategy registry. Unit tests for all edge cases.

- [x] **10 · Code highlighter component** `issues/10-code-highlighter.md`
      Install Shiki. Build `CodeBlock` Svelte component (code + language + optional highlight range). Syntax highlighting + line highlight overlay. Visual smoke test.

## Phase 2 — Core features (depends on Phase 1)

- [x] **02 · Classroom management** `issues/02-classroom-management.md` — blocked by 01
      Home screen listing all classrooms. Create/edit/delete classrooms and students. Persist to IndexedDB. Empty state.

- [x] **03 · Question set importer** `issues/03-question-set-importer.md` — blocked by 01
      `showDirectoryPicker` flow. Parse JSON files per PRD format. Validate structure. Store QuestionSet + Snippets + Questions. Importer module unit tests. Browser compat warning.

- [x] **07 · Session engine** `issues/07-session-engine.md` — blocked by 05, 06
      Session state machine (active/paused/completed). Wire question selector + student orderer. Record attempts to DB. Expose clean API for UI. Unit tests for full session flows.

- [x] **13 · Data export/import** `issues/13-data-export-import.md` — blocked by 01
      Serialise all IndexedDB tables to JSON download. Restore from file with confirm dialog. Version field for migration. Error handling for malformed files.

## Phase 3 — UI integration (depends on Phase 2)

- [x] **04 · Question set list & delete** `issues/04-question-set-list-delete.md` — blocked by 03
      Question set management screen. List imported sets with counts. Delete with cascade (snippets + questions). Empty state.

- [x] **08 · Session setup UI** `issues/08-session-setup-ui.md` — blocked by 02, 04, 07
      Start new session form (classroom + question sets + N). Validation. Create Session + SessionStudent records. Resume session list (paused sessions). Navigate to execution screen.

- [x] **12 · Session history** `issues/12-session-history.md` — blocked by 07
      History screen listing completed sessions. Drill-down per session showing student × question × outcome. Empty state.

## Phase 4 — Session execution (depends on Phase 3)

- [x] **09 · Session execution UI** `issues/09-session-execution-ui.md` — blocked by 08, 10
      Main quiz screen: student name, question text, code snippet with highlights, progress indicator. Keyboard shortcuts (1/C, 2/P, 3/W). Auto-advance. Pause. Completion screen. Playwright e2e test.

## Phase 5 — Chain support (depends on Phase 4)

- [x] **11 · Question chains in session** `issues/11-question-chains.md` — blocked by 09
      Chain sub-questions presented in sequence. Single slot accounting. All-correct logic. Follow-ups always asked. Chain progress indicator. Unit tests for chain outcome combinations.
