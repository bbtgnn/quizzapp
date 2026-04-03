## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Set up Dexie.js as the IndexedDB wrapper and define the full database schema for all 8 entities. Expose a typed repository layer (one module per entity group) with async CRUD methods. No business logic lives here — this is pure data access.

Entities to model: Classroom, Student, QuestionSet, Snippet, Question, Session, SessionStudent, Attempt.

Refer to the "Data Model" section of the parent PRD for field definitions.

## Acceptance criteria

- [ ] Dexie.js is installed and a versioned schema is defined covering all 8 entities
- [ ] Each entity has a typed TypeScript interface
- [ ] Repository functions exist for: create, read (by id), list (by foreign key where applicable), update, delete — for every entity
- [ ] Schema migrations are handled via Dexie versioning (even if only version 1 exists now)
- [ ] The DB module is importable and usable from any SvelteKit route or lib file
- [ ] No business logic in the DB layer — pure data access only

## Blocked by

None — can start immediately.

## User stories addressed

Foundation for all user stories. No direct user story, but required by every other issue.
