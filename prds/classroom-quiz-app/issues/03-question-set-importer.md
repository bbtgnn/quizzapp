## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the question set import flow end-to-end: the teacher selects a folder via the browser File System Access API (`showDirectoryPicker`), the app reads all `.json` files in that folder, parses and validates them against the question file format defined in the PRD, and stores the resulting QuestionSet, Snippets, and Questions in IndexedDB.

The importer module itself (parsing + validation, no DB calls) must be unit-tested in isolation.

Refer to the "Question File Format" section of the parent PRD for the exact JSON shape, including optional `highlight`, `chain`, and `difficulty` fields.

## Acceptance criteria

- [ ] Teacher can trigger a folder picker from the UI and select a question set folder
- [ ] All `.json` files in the folder are read and parsed
- [ ] Valid files are stored as QuestionSet + Snippets + Questions in IndexedDB
- [ ] Chain questions are stored with correct `chain_parent_id` and `chain_order` relationships
- [ ] Invalid files (malformed JSON, missing required fields) show a clear error message per file; valid files in the same folder are still imported
- [ ] The imported question set appears in the app immediately after import
- [ ] The `importer` module (parse + validate) has unit tests covering: valid snippet, valid chain, missing required field, malformed JSON, empty folder
- [ ] Import uses `showDirectoryPicker` (Chrome/Edge); a browser compatibility warning is shown if the API is unavailable

## Blocked by

- Blocked by `issues/01-db-layer.md`

## User stories addressed

- User story 5
