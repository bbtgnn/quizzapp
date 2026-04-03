# Aim

build a quiz app for classrooms.

its primarily meant for teachers to use while screen sharing.
students see the question and simply answer during the video call.
the teacher clicks on behalf of the student on the answer.

mainly questions will be about code, but i would like to have a general engine so the app can be used for other subjects.

# tech stack

- frontend only app (sveltekit), no backend
- indexeddb for storage, maybe with some wrapper library (do some research)

# features

- teacher creates classrooms (groups of students)
- teacher loads question sets
- teacher starts a session with given classroom and question sets (more than one)

- when session starts
- students are picked randomly, never the same student twice
- each student, across different sessions, must answer all questions. progress is stored.
- when choosing a question for the student, i want a pluggable business logic.
  - for now, it's simple: pick only questions not yet answered or that the answer was wrong previously.
  - later, i want spaced repetition algorithm
- each student will be given N questions in a row (configurable when session starts)
- session ends when all students have answered N questions each.
- sessions can be resumed later

- about questions:
  - there can be multiple type of questions with different UIs, so we need a general interface
  - there can be question "chains", where you have to check N questions in a row to get a valid result ()
    - e.g.: "how many arguments does the function take? > what is the type of argument 1? > what is the type of argument 2?"

# things

- we need a UI so we can show code, with the highlighted line / token / part.
