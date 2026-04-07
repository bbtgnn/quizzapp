/**
 * Legacy barrel: re-exports persistence for older imports.
 * Prefer `$lib/app` for wired repositories and `$lib/model` for entity types.
 */
export { db } from './schema.js';

export type {
	Attempt,
	Classroom,
	Highlight,
	Question,
	QuestionSet,
	Session,
	SessionStudent,
	Snippet,
	Student
} from './types.js';

export {
	createClassroom,
	deleteClassroom,
	deleteStudent,
	getClassroom,
	getStudent,
	listClassrooms,
	listStudentsByClassroom,
	updateClassroom,
	updateStudent,
	createStudent
} from './repositories/classrooms.js';

export {
	createQuestion,
	createQuestionSet,
	createSnippet,
	deleteQuestionsBySnippet,
	deleteQuestionSet,
	deleteSnippetsByQuestionSet,
	getQuestionSet,
	listQuestionSets,
	listQuestionsByQuestionSet,
	listQuestionsBySnippet,
	listSnippetsByQuestionSet
} from './repositories/question-sets.js';

export {
	createSession,
	createSessionStudent,
	getSession,
	listSessionStudents,
	listSessions,
	updateSession,
	updateSessionStudent
} from './repositories/sessions.js';

export {
	createAttempt,
	listAttemptsBySession,
	listAttemptsByStudent,
	listAttemptsByStudentInSession
} from './repositories/attempts.js';
