## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the question set management screen: a list of all imported question sets with their name and question count, and the ability to delete a question set (including all its snippets and questions).

## Acceptance criteria

- [ ] A dedicated screen lists all imported question sets with name, snippet count, and question count
- [ ] Empty state is shown when no question sets have been imported
- [ ] Teacher can delete a question set (with a confirmation prompt)
- [ ] Deleting a question set removes all associated Snippets and Questions from IndexedDB
- [ ] The list updates immediately after deletion without a page refresh

## Blocked by

- Blocked by `issues/03-question-set-importer.md`

## User stories addressed

- User story 6
- User story 7
