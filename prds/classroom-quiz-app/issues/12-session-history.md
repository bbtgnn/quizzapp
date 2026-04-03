## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the session history screen: a list of all completed sessions, and a drill-down view showing the full audit trail for a selected session (which student answered which question, with what outcome, and when).

This data is also the foundation for future spaced repetition — the raw Attempt records are already being stored by the session engine.

## Acceptance criteria

- [ ] A "History" screen lists all completed sessions, showing: classroom name, date, number of students, number of questions answered
- [ ] Selecting a session shows a drill-down: for each student, a list of questions answered with outcome (correct / partial / wrong) and timestamp
- [ ] Paused (incomplete) sessions are not shown in history (they appear in the resume list instead)
- [ ] Empty state is shown when no sessions have been completed yet
- [ ] Data is read directly from IndexedDB (Attempt records) — no separate history store needed

## Blocked by

- Blocked by `issues/07-session-engine.md`

## User stories addressed

- User story 28
- User story 29
