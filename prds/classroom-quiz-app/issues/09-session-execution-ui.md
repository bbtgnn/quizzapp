## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the session execution screen: the main UI the teacher uses during a live quiz. It displays the current student's name, the current question text, and the associated code snippet (rendered with syntax highlighting from issue 10). The teacher records outcomes via keyboard shortcuts. The UI auto-advances after each outcome and shows a completion screen when the session ends.

Chains are handled in issue 11 — this issue covers single (non-chain) questions only.

## Acceptance criteria

- [ ] Session execution screen shows: current student name (prominent), current question text, code snippet with highlight (if present), and a progress indicator (e.g. "Student 2 of 5 · Question 1 of 3")
- [ ] Keyboard shortcuts `1` or `C` → correct, `2` or `P` → partially correct, `3` or `W` → wrong are captured globally on this screen
- [ ] Recording an outcome via keyboard calls `sessionEngine.recordOutcome()` and the UI advances to the next question automatically
- [ ] When a student completes their N questions, the UI transitions to the next student automatically
- [ ] When all students are done, a session completion screen is shown
- [ ] A "Pause session" button (or keyboard shortcut) calls `sessionEngine.pause()` and navigates away from the execution screen
- [ ] The code snippet area uses the `code-highlighter` component from issue 10
- [ ] Playwright e2e test: start session with 2 students × 2 questions, record all outcomes via keyboard, verify session completion screen appears

## Blocked by

- Blocked by `issues/08-session-setup-ui.md`
- Blocked by `issues/10-code-highlighter.md`

## User stories addressed

- User story 17
- User story 18
- User story 19
- User story 20
- User story 21
- User story 22
- User story 23
