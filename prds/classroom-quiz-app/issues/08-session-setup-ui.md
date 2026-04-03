## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the session setup and management UI: the screen where the teacher starts a new session (picks a classroom, one or more question sets, and sets N), and the screen that lists paused sessions available to resume.

Starting a session creates a Session record in IndexedDB and hands off to the session execution UI (issue 09). Resuming a session loads an existing paused Session and hands off to the same execution UI.

## Acceptance criteria

- [ ] Teacher can navigate to "Start new session" from the home screen
- [ ] Session setup form lets the teacher select a classroom (from existing classrooms), one or more question sets (multi-select), and set N (questions per student, numeric input with a sensible default)
- [ ] Submitting the form creates a Session and SessionStudent records in IndexedDB and navigates to the session execution screen
- [ ] A "Resume session" screen lists all sessions with status `paused`, showing classroom name, date started, and progress (students completed / total)
- [ ] Selecting a paused session navigates to the session execution screen with that session loaded
- [ ] Session configuration is locked once created (no editing after start)
- [ ] Validation: at least one classroom selected, at least one question set selected, N ≥ 1

## Blocked by

- Blocked by `issues/02-classroom-management.md`
- Blocked by `issues/04-question-set-list-delete.md`
- Blocked by `issues/07-session-engine.md`

## User stories addressed

- User story 10
- User story 11
- User story 12
- User story 13
- User story 14
