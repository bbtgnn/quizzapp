## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Build the pluggable student ordering module: a TypeScript interface (`StudentOrderStrategy`) and the default shuffle implementation. Pure logic module — no UI, no DB calls.

Refer to the "Pluggable Session Student Order Strategy" section of the parent PRD for the interface definition.

Default strategy: return a random shuffle of all students who have not yet completed their turn in the session.

## Acceptance criteria

- [ ] `StudentOrderStrategy` interface is defined and exported
- [ ] Default strategy is implemented and registered under the id `"default"`
- [ ] Default strategy returns a valid random permutation of remaining (not-yet-completed) students
- [ ] A strategy registry exists that maps strategy id strings to strategy instances
- [ ] Unit tests cover: all students remaining, some students completed, all students completed (empty result), single student remaining

## Blocked by

None — can start immediately.

## User stories addressed

- User story 15
