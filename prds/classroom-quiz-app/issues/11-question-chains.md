## done: false

## Parent PRD

prds/classroom-quiz-app/index.md

## What to build

Extend the session execution UI and session engine to support question chains. A chain is a parent question followed by one or more child questions, all presented in sequence as a single question slot. Follow-up questions are always asked even if the parent was answered wrong. The chain is marked correct only if all sub-questions (parent + children) are correct.

Refer to the "Question Chains" section of the parent PRD and the `chain_parent_id` / `chain_order` fields in the data model.

## Acceptance criteria

- [ ] When the current question has chain children, the session engine presents the parent first, then each child in `chain_order` order
- [ ] Recording an outcome on a chain sub-question advances to the next sub-question (not the next slot)
- [ ] Follow-up sub-questions are always presented even if the parent was answered wrong or partial
- [ ] After all sub-questions in a chain are answered, the slot is complete and the engine advances to the next slot
- [ ] The chain slot is recorded as `correct` only if all sub-questions were answered correctly; otherwise `wrong` or `partial` (partial if at least one was partial and none were wrong; wrong if any were wrong)
- [ ] The session execution UI shows a chain progress indicator (e.g. "Question 1 of 3 in chain") when inside a chain
- [ ] Unit tests in the session engine cover: all-correct chain, chain with one wrong, chain with one partial, chain with mixed outcomes

## Blocked by

- Blocked by `issues/09-session-execution-ui.md`

## User stories addressed

- User story 24
- User story 25
- User story 26
- User story 27
