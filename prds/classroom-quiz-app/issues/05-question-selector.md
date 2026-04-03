## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the pluggable question selection module: a TypeScript interface (`QuestionSelectionStrategy`) and the default implementation. This is a pure logic module with no UI and no DB calls — it takes data in and returns a question.

Refer to the "Pluggable Question Selection Strategy" section of the parent PRD for the interface definition and default strategy logic.

## Acceptance criteria

- [ ] `QuestionSelectionStrategy` interface is defined and exported
- [ ] Default strategy is implemented and registered under the id `"default"`
- [ ] Default strategy: prioritises questions never attempted or previously answered wrong/partial by the student
- [ ] Default strategy: when all questions have been answered correctly, cycles from the one answered correctly earliest (by `answered_at`)
- [ ] A strategy registry exists that maps strategy id strings to strategy instances
- [ ] Unit tests cover all scenarios: never answered, previously wrong, previously partial, all correct (cycle), mixed pool

## Blocked by

None — can start immediately.

## User stories addressed

- User story 32
- User story 33
- User story 34
