## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the data export and import feature: the teacher can export all app data (classrooms, students, question sets, snippets, questions, sessions, attempts) to a single JSON file download, and restore from a previously exported file.

Refer to the "Import / Export" section of the parent PRD for the expected behaviour, including the confirm dialog before replacing existing data.

## Acceptance criteria

- [ ] An "Export data" action serialises all IndexedDB tables to a single JSON file and triggers a browser download
- [ ] The exported file is human-readable JSON with a top-level version field for future migration support
- [ ] An "Import data" action lets the teacher select a previously exported JSON file
- [ ] Before importing, a confirmation dialog warns that existing data will be replaced
- [ ] After a successful import, all data from the file is present in IndexedDB and the UI reflects it without a manual refresh
- [ ] Importing a file with an unrecognised version field shows a clear error message
- [ ] Importing a malformed JSON file shows a clear error message without corrupting existing data
- [ ] Export and import actions are accessible from a settings or data management screen

## Blocked by

- Blocked by `issues/01-db-layer.md`

## User stories addressed

- User story 8
- User story 9
