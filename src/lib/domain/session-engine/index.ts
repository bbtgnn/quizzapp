import type { Attempt, Question, Session, SessionStudent, Student } from '$lib/model/types.js';
import type { SessionEnginePersistence } from '$lib/ports/session-engine-persistence.js';
import { getStrategy as getQuestionStrategy } from '$lib/domain/question-selector/registry.js';
import { getStrategy as getStudentStrategy } from '$lib/domain/student-orderer/registry.js';

export class SessionEngine {
	private readonly _session: Session;
	private readonly _questions: Question[];
	private _attempts: Attempt[];
	private _sessionStudentsMap: Map<string, SessionStudent>;
	private _orderedStudents: Student[];
	private _currentIndex: number;
	private _currentQuestion: Question | null;
	private readonly _createAttempt: SessionEnginePersistence['createAttempt'];
	private readonly _updateSession: SessionEnginePersistence['updateSession'];
	private readonly _updateSessionStudent: SessionEnginePersistence['updateSessionStudent'];
	private _chainQuestions: Question[] = [];
	private _chainIndex: number = 0;
	private _chainOutcomes: Array<'correct' | 'partial' | 'wrong'> = [];
	private _askedThisSession: Set<string> = new Set();

	constructor(
		session: Session,
		sessionStudents: SessionStudent[],
		students: Student[],
		questions: Question[],
		attempts: Attempt[],
		persistence: SessionEnginePersistence
	) {
		this._session = session;
		this._questions = questions;
		this._attempts = [...attempts];
		this._createAttempt = persistence.createAttempt;
		this._updateSession = persistence.updateSession;
		this._updateSessionStudent = persistence.updateSessionStudent;

		this._sessionStudentsMap = new Map(sessionStudents.map((ss) => [ss.student_id, { ...ss }]));

		if (session.status === 'completed') {
			this._orderedStudents = [];
			this._currentIndex = 0;
			this._currentQuestion = null;
			return;
		}

		if (session.status === 'paused') {
			const orderer = getStudentStrategy('default');
			this._orderedStudents = orderer.order(students, sessionStudents);
		} else {
			this._orderedStudents = students.filter((s) => {
				const ss = this._sessionStudentsMap.get(s.id);
				return !ss || !ss.completed;
			});
		}

		this._currentIndex = 0;
		this._currentQuestion = this._pickQuestion();
	}

	get currentStudent(): Student | null {
		if (this._currentIndex >= this._orderedStudents.length) return null;
		return this._orderedStudents[this._currentIndex];
	}

	get currentQuestion(): Question | null {
		return this._currentQuestion;
	}

	get isComplete(): boolean {
		return this._currentIndex >= this._orderedStudents.length;
	}

	get chainProgress(): { current: number; total: number } | null {
		if (this._chainQuestions.length === 0) return null;
		return { current: this._chainIndex + 1, total: this._chainQuestions.length };
	}

	get progress(): {
		studentsCompleted: number;
		studentsTotal: number;
		slotsCompletedForCurrentStudent: number;
		slotsTotalForCurrentStudent: number;
	} {
		const studentsTotal = this._sessionStudentsMap.size;
		let studentsCompleted = 0;
		for (const ss of this._sessionStudentsMap.values()) {
			if (ss.completed) studentsCompleted++;
		}
		const student = this.currentStudent;
		const ss = student ? this._sessionStudentsMap.get(student.id) : null;
		const slotsTotalForCurrentStudent = ss ? this._session.n_questions_per_student : 0;
		const slotsCompletedForCurrentStudent = ss
			? this._session.n_questions_per_student - ss.question_slots_remaining
			: 0;
		return {
			studentsCompleted,
			studentsTotal,
			slotsCompletedForCurrentStudent,
			slotsTotalForCurrentStudent
		};
	}

	async recordOutcome(outcome: 'correct' | 'partial' | 'wrong'): Promise<void> {
		if (this.isComplete || !this.currentStudent || !this._currentQuestion) return;

		const student = this.currentStudent;

		if (this._chainQuestions.length > 0) {
			this._chainOutcomes.push(outcome);

			if (this._chainIndex < this._chainQuestions.length - 1) {
				this._chainIndex++;
				this._currentQuestion = this._chainQuestions[this._chainIndex];
				return;
			}

			const aggregateOutcome = this._computeChainOutcome(this._chainOutcomes);
			const rootQuestion = this._chainQuestions[0];

			const attempt = await this._createAttempt({
				session_id: this._session.id,
				student_id: student.id,
				question_id: rootQuestion.id,
				outcome: aggregateOutcome
			});
			this._attempts.push(attempt);

			this._chainQuestions = [];
			this._chainIndex = 0;
			this._chainOutcomes = [];

			await this._consumeSlot(student);
			return;
		}

		const question = this._currentQuestion;

		const attempt = await this._createAttempt({
			session_id: this._session.id,
			student_id: student.id,
			question_id: question.id,
			outcome
		});
		this._attempts.push(attempt);

		await this._consumeSlot(student);
	}

	async pause(): Promise<void> {
		await this._updateSession(this._session.id, { status: 'paused' });
	}

	private async _consumeSlot(student: Student): Promise<void> {
		const ss = this._sessionStudentsMap.get(student.id)!;
		ss.question_slots_remaining -= 1;

		if (ss.question_slots_remaining <= 0) {
			ss.completed = true;
			await this._updateSessionStudent(ss.id, { question_slots_remaining: 0, completed: true });

			this._currentIndex++;

			if (this._currentIndex >= this._orderedStudents.length) {
				await this._updateSession(this._session.id, {
					status: 'completed',
					completed_at: Date.now()
				});
				this._currentQuestion = null;
			} else {
				this._currentQuestion = this._pickQuestion();
			}
		} else {
			await this._updateSessionStudent(ss.id, {
				question_slots_remaining: ss.question_slots_remaining
			});
			this._currentQuestion = this._pickQuestion();
		}
	}

	private _computeChainOutcome(
		outcomes: Array<'correct' | 'partial' | 'wrong'>
	): 'correct' | 'partial' | 'wrong' {
		if (outcomes.every((o) => o === 'correct')) return 'correct';
		if (outcomes.some((o) => o === 'wrong')) return 'wrong';
		return 'partial';
	}

	private _pickQuestion(): Question | null {
		const student = this.currentStudent;
		if (!student || this._questions.length === 0) return null;

		const allRootQuestions = this._questions.filter((q) => q.chain_parent_id === null);
		if (allRootQuestions.length === 0) return null;

		const rootQuestions = allRootQuestions.filter((q) => !this._askedThisSession.has(q.id));
		if (rootQuestions.length === 0) {
			this._askedThisSession.clear();
			return this._pickQuestion();
		}

		const selector = getQuestionStrategy(this._session.strategy_id);
		const rootQ = selector.pick(student, this._attempts, rootQuestions);
		this._askedThisSession.add(rootQ.id);

		const children = this._questions
			.filter((q) => q.chain_parent_id === rootQ.id)
			.sort((a, b) => a.chain_order - b.chain_order);

		if (children.length > 0) {
			this._chainQuestions = [rootQ, ...children];
			this._chainIndex = 0;
			this._chainOutcomes = [];
			return this._chainQuestions[0];
		} else {
			this._chainQuestions = [];
			this._chainIndex = 0;
			this._chainOutcomes = [];
			return rootQ;
		}
	}
}
