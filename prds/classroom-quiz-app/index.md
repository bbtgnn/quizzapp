## done: false

# Classroom Quiz App — PRD

## Problem Statement

Teachers running live classroom sessions (in-person or via screenshare) have no lightweight tool to quiz students interactively. Existing quiz tools require students to have devices and accounts, are not optimised for code-related questions, and don't track per-student progress across sessions in a way that supports adaptive questioning (e.g. spaced repetition). The teacher needs a single-device app they control entirely, where students participate verbally and the teacher records outcomes on their behalf.

## Solution

A frontend-only SvelteKit app (no backend, no accounts) that the teacher runs on their laptop. The teacher manages classrooms, imports question sets, and runs quiz sessions. During a session the teacher reads questions aloud, students answer verbally, and the teacher records the outcome (correct / partially correct / wrong) via keyboard. The app tracks every outcome per student per question across all sessions, enabling progressively smarter question selection in the future (spaced repetition). All data is stored locally in IndexedDB with import/export for backup.

## User Stories

### Classroom Management

1. As a teacher, I want to create a classroom with a name and a list of student names, so that I can organise my students into groups.
2. As a teacher, I want to edit a classroom (rename it, add students, remove students), so that I can keep it up to date as my class changes.
3. As a teacher, I want to delete a classroom, so that I can remove groups I no longer need.
4. As a teacher, I want to see all my classrooms listed on the home screen, so that I can quickly navigate to the one I need.

### Question Set Management

5. As a teacher, I want to import a question set from a folder of files, so that I can load questions I have authored outside the app.
6. As a teacher, I want to see all imported question sets listed, so that I can browse what is available.
7. As a teacher, I want to delete a question set, so that I can remove outdated material.
8. As a teacher, I want to export all app data (classrooms, question sets, progress) to a file, so that I can back it up or move it to another device.
9. As a teacher, I want to import previously exported data, so that I can restore my data on a new device.

### Session Setup

10. As a teacher, I want to start a new session by selecting a classroom and one or more question sets, so that I can run a targeted quiz.
11. As a teacher, I want to configure N (number of questions per student) before starting a session, so that I can control the length of each student's turn.
12. As a teacher, I want to see a list of my incomplete (paused) sessions, so that I can resume one instead of starting fresh.
13. As a teacher, I want to resume a paused session, so that I can continue where I left off without losing progress.
14. As a teacher, I want to know that resuming a session re-randomizes the order of remaining students, so that the session feels fresh.

### Session Execution

15. As a teacher, I want the app to automatically pick the next student at the start of each turn, so that I don't have to manage the order manually.
16. As a teacher, I want the app to automatically pick the next question for the current student based on the active selection strategy, so that I don't have to track what each student has already answered.
17. As a teacher, I want to see the current student's name prominently displayed during their turn, so that I always know who I am quizzing.
18. As a teacher, I want to see the question text and any associated code snippet (with highlights) displayed clearly, so that I can read it aloud accurately.
19. As a teacher, I want to record the outcome of each question as correct, partially correct, or wrong using keyboard shortcuts, so that students cannot see which key I press.
20. As a teacher, I want the app to automatically advance to the next question after I record an outcome, so that the session flows without interruption.
21. As a teacher, I want the app to automatically advance to the next student after a student has answered their N questions, so that I don't have to manage transitions.
22. As a teacher, I want the session to end automatically when all students have answered their N questions, so that I know when we are done.
23. As a teacher, I want to pause a session at any point and resume it later, so that I can handle interruptions without losing progress.

### Question Chains

24. As a teacher, I want chain questions to be presented one sub-question at a time, so that the flow feels natural.
25. As a teacher, I want follow-up questions in a chain to always be asked even if the first was answered wrong, so that the student gets the full chain experience.
26. As a teacher, I want a chain to count as a single question slot in the student's N questions, so that chains don't unfairly consume more of a student's turn.
27. As a teacher, I want a chain to be marked correct only if all sub-questions are correct, so that partial chains are tracked accurately.

### Progress & History

28. As a teacher, I want to view a history of completed sessions, so that I can review what was covered.
29. As a teacher, I want to see, for each completed session, which student answered which question and with what outcome, so that I have a full audit trail.
30. As a teacher, I want per-student progress to persist across sessions, so that the question selection strategy can use historical data.
31. As a teacher, I want the app to remember the raw outcome (correct / partial / wrong) of every attempt, so that future spaced repetition algorithms have the data they need.

### Question Selection Strategy

32. As a teacher, I want the default question selection strategy to prioritise questions the student has never answered or previously answered wrong/partially, so that students focus on their weak areas.
33. As a teacher, I want the strategy to cycle back to the oldest correctly-answered questions when a student has answered everything correctly, so that no student is ever stuck with nothing to answer.
34. As a teacher, I want the question selection strategy to be swappable (pluggable), so that I can adopt spaced repetition in the future without rewriting the app.

---

## Implementation Decisions

### Architecture

- **Frontend only**: SvelteKit with `@sveltejs/adapter-static`. No server, no API calls.
- **Storage**: IndexedDB via a wrapper library (e.g. `idb` or `dexie`). All app state lives in IndexedDB. No localStorage for primary data.
- **State management**: Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactive UI state. A dedicated storage layer (repository pattern) abstracts IndexedDB access.
- **No user accounts**: Single-teacher app. No authentication.

### Data Model (conceptual, not schema)

**Classroom**: id, name, list of student ids, created_at  
**Student**: id, classroom_id, name  
**QuestionSet**: id, name, imported_at, list of snippet ids  
**Snippet**: id, question_set_id, language, code (string), list of question ids  
**Question**: id, snippet_id, text, correct_answer (string, unused in MVP), difficulty (optional), chain_parent_id (nullable), chain_order (int)  
**Session**: id, classroom_id, question_set_ids[], n_questions_per_student, started_at, completed_at (nullable), status (active | paused | completed), strategy_id  
**SessionStudent**: id, session_id, student_id, completed (bool), question_slots_remaining  
**Attempt**: id, session_id, student_id, question_id, outcome (correct | partial | wrong), answered_at

### Question File Format

A question set is a **folder**. Each file in the folder is a JSON file representing one code snippet and all its questions.

```
my-question-set/
  snippet-001.json
  snippet-002.json
  ...
```

Each JSON file has this shape:

```json
{
	"snippet": {
		"language": "typescript",
		"code": "function add(a: number, b: number): number {\n  return a + b;\n}",
		"highlight": { "startLine": 1, "endLine": 1 }
	},
	"questions": [
		{
			"text": "How many arguments does this function take?",
			"correctAnswer": "2",
			"difficulty": "easy",
			"chain": [
				{
					"text": "What is the type of the first argument?",
					"correctAnswer": "number"
				},
				{
					"text": "What is the type of the second argument?",
					"correctAnswer": "number"
				}
			]
		}
	]
}
```

- `highlight` is optional. It can reference a line range or a character range within a line.
- `chain` is optional. If present, the parent question and all chain items are presented in sequence as a single slot.
- `difficulty` is optional metadata.
- `correctAnswer` is stored but not displayed in MVP.

### Pluggable Question Selection Strategy

A strategy is an object implementing a single interface:

```
interface QuestionSelectionStrategy {
  pick(student: Student, attempts: Attempt[], availableQuestions: Question[]): Question
}
```

The active strategy is identified by a `strategy_id` string stored on the Session. The app ships with one built-in strategy (`"default"`). New strategies can be registered at startup.

**Default strategy logic**:

1. Filter to questions never attempted or previously answered wrong/partial by this student.
2. If none remain, cycle from the question answered correctly earliest (by `answered_at`).

### Pluggable Session Student Order Strategy

A strategy is an object implementing:

```
interface StudentOrderStrategy {
  order(students: Student[], sessionStudents: SessionStudent[]): Student[]
}
```

Default strategy: shuffle all remaining (not yet completed) students randomly.

### Session State Machine

States: `active` → `paused` → `active` (resume) → `completed`  
On resume: remaining students are re-randomized using the student order strategy.  
Session configuration (n, question sets, classroom) is immutable once started.

### Code Display & Highlighting

- Code snippets are rendered with syntax highlighting (e.g. using `highlight.js` or `shiki`).
- Highlights are rendered as a visual overlay (background color) on the specified line/character range.
- The highlight range is authored at question-set import time and is immutable during a session.

### Keyboard Shortcuts (Session Execution)

- `1` or `C` → Correct
- `2` or `P` → Partially correct
- `3` or `W` → Wrong

These are the only interactive controls during a session turn. No mouse interaction required for outcome recording.

### Import / Export

- **Question set import**: Teacher selects a folder via the browser File System Access API (`showDirectoryPicker`). The app reads all `.json` files in the folder and parses them.
- **Data export**: Serialise all IndexedDB data to a single JSON file and trigger a browser download.
- **Data import**: Teacher selects the exported JSON file; the app merges or replaces local data (confirm dialog before replacing).

### Modules

1. **`db`** — IndexedDB abstraction (repository pattern). Exposes typed async methods for all CRUD operations. No business logic.
2. **`question-selector`** — Pluggable strategy interface + default implementation. Pure functions, no side effects.
3. **`student-orderer`** — Pluggable strategy interface + default (shuffle) implementation. Pure functions.
4. **`session-engine`** — Orchestrates a running session: tracks current student, current question slot, records attempts, advances state. Depends on `question-selector` and `student-orderer`.
5. **`importer`** — Parses question set folder into internal data model. Validates structure. No DB calls.
6. **`exporter`** — Serialises all DB data to JSON. No UI logic.
7. **`code-highlighter`** — Wraps syntax highlighting library. Accepts code + language + highlight range, returns rendered HTML or component.
8. **UI layer** — SvelteKit routes and Svelte components. Thin: delegates all logic to the modules above.

---

## Testing Decisions

### What makes a good test

- Tests verify **external behaviour**, not implementation details.
- Tests are written against the **public interface** of a module (inputs → outputs), not internal state.
- Tests do not mock internal collaborators unless crossing a true boundary (e.g. IndexedDB in unit tests).

### Modules to test (unit)

- **`question-selector`**: Given a set of attempts and available questions, assert the correct question is returned for each scenario (never answered, previously wrong, previously partial, all correct → cycle from oldest).
- **`student-orderer`**: Given a list of students and session state, assert the returned order is a valid permutation of remaining students.
- **`session-engine`**: Given a sequence of recorded outcomes, assert the session advances correctly (next question, next student, session completion).
- **`importer`**: Given valid and invalid JSON folder structures, assert correct parsing and error handling.

### Modules to test (component / e2e)

- Session execution flow: start session → answer N questions per student → session completes. (Playwright)
- Keyboard shortcut recording: press `1`/`2`/`3` → correct outcome recorded. (Playwright)
- Import flow: select folder → question set appears in list. (Playwright, using mock files)

---

## Out of Scope

- Multi-device sync or cloud storage
- Student-facing UI (students never interact with the app)
- Multiple teacher profiles
- Real-time collaboration
- Spaced repetition algorithm (data is collected, algorithm is not implemented)
- Answer display during session (correct answer is stored but not shown in MVP)
- Question authoring inside the app (import only)
- Audio/video integration
- Accessibility audit (nice to have later)
- Mobile / tablet layout (teacher's laptop only)

---

## Further Notes

- The File System Access API (`showDirectoryPicker`) is supported in Chrome/Edge but not Firefox/Safari. This is acceptable given the teacher-on-laptop use case; document the browser requirement.
- IndexedDB wrapper library recommendation: **Dexie.js** — mature, TypeScript-first, good query API, handles schema migrations cleanly.
- Syntax highlighting recommendation: **Shiki** — accurate, supports many languages, runs in the browser, produces clean HTML. Alternatively `highlight.js` for a lighter bundle.
- The `correctAnswer` field is stored now so that future features (e.g. showing the answer after the session, automated grading) can use it without a data migration.
- Difficulty level on questions is optional metadata; it is not used by any strategy in MVP but is available for future filtering or weighting.
