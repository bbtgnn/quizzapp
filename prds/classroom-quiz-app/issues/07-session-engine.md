## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the session engine: the module that orchestrates a running session end-to-end. It wires together the question selector and student orderer, manages the session state machine (active → paused → active → completed), records attempts to the DB, and exposes a clean interface for the UI to consume.

Refer to the "Session State Machine" section of the parent PRD for state transitions. Refer to the data model for Session, SessionStudent, and Attempt entities.

This module has no UI — it is consumed by the session setup and execution UI in later issues.

## Acceptance criteria

- [ ] `SessionEngine` can be initialised from an existing Session record (supports both new and resumed sessions)
- [ ] On resume, remaining students are re-randomized via the student orderer
- [ ] Engine exposes: current student, current question, `recordOutcome(outcome)`, `pause()`, `isComplete()`
- [ ] `recordOutcome` persists an Attempt to IndexedDB and advances to the next question or next student as appropriate
- [ ] After a student completes N question slots, they are marked done in SessionStudent
- [ ] Session is marked `completed` in IndexedDB when all students are done
- [ ] Session is marked `paused` in IndexedDB when `pause()` is called
- [ ] Session configuration (n, question sets, classroom) cannot be changed after creation
- [ ] Unit tests cover: full session flow (3 students × 2 questions), pause and resume, session completion, question cycling when all answered correctly

## Blocked by

- Blocked by `issues/05-question-selector.md`
- Blocked by `issues/06-student-orderer.md`

## User stories addressed

- User story 16
- User story 20
- User story 21
- User story 22
- User story 23
- User story 30
- User story 31
