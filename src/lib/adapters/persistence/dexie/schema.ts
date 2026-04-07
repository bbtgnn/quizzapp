import Dexie, { type EntityTable } from 'dexie';
import type {
	Attempt,
	Classroom,
	Question,
	QuestionSet,
	Session,
	SessionStudent,
	Snippet,
	Student
} from '$lib/model/types.js';

class QuizAppDB extends Dexie {
	classrooms!: EntityTable<Classroom, 'id'>;
	students!: EntityTable<Student, 'id'>;
	questionSets!: EntityTable<QuestionSet, 'id'>;
	snippets!: EntityTable<Snippet, 'id'>;
	questions!: EntityTable<Question, 'id'>;
	sessions!: EntityTable<Session, 'id'>;
	sessionStudents!: EntityTable<SessionStudent, 'id'>;
	attempts!: EntityTable<Attempt, 'id'>;

	constructor() {
		super('QuizAppDB');

		this.version(1).stores({
			classrooms: 'id, name, created_at',
			students: 'id, classroom_id, name',
			questionSets: 'id, name, imported_at',
			snippets: 'id, question_set_id',
			questions: 'id, snippet_id, chain_parent_id',
			sessions: 'id, classroom_id, status, started_at',
			sessionStudents: 'id, session_id, student_id, [session_id+student_id]',
			attempts: 'id, session_id, student_id, question_id, answered_at'
		});
	}
}

export const db = new QuizAppDB();
