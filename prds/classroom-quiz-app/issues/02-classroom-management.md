## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the classroom management UI end-to-end: a home screen listing all classrooms, and the ability to create, edit (rename, add/remove students), and delete classrooms. Each classroom holds a named list of students.

This is the teacher's starting point every time they open the app.

## Acceptance criteria

- [ ] Home screen lists all classrooms with their name and student count
- [ ] Teacher can create a new classroom with a name and one or more student names
- [ ] Teacher can edit a classroom: rename it, add new students, remove existing students
- [ ] Teacher can delete a classroom (with a confirmation prompt)
- [ ] All changes persist in IndexedDB and survive a page refresh
- [ ] Empty state is shown when no classrooms exist yet

## Blocked by

- Blocked by `issues/01-db-layer.md`

## User stories addressed

- User story 1
- User story 2
- User story 3
- User story 4
