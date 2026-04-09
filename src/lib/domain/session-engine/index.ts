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
	private _activeRootQuestion: Question | null;
	private _currentStepIndex: number;
	private _stepOutcomes: Array<'correct' | 'wrong'>;
	private readonly _createAttempt: SessionEnginePersistence['createAttempt'];
	private readonly _updateSession: SessionEnginePersistence['updateSession'];
	private readonly _updateSessionStudent: SessionEnginePersistence['updateSessionStudent'];
	private readonly _persistActiveUnitState: SessionEnginePersistence['persistActiveUnitState'];
	private readonly _clearActiveUnitState: SessionEnginePersistence['clearActiveUnitState'];
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
		this._persistActiveUnitState = persistence.persistActiveUnitState;
		this._clearActiveUnitState = persistence.clearActiveUnitState;

		this._sessionStudentsMap = new Map(sessionStudents.map((ss) => [ss.student_id, { ...ss }]));
		this._activeRootQuestion = null;
		this._currentStepIndex = 0;
		this._stepOutcomes = [];

		if (session.status === 'completed') {
			this._orderedStudents = [];
			this._currentIndex = 0;
			return;
		}

		const activeSessionStudents = sessionStudents.filter((ss) => !ss.completed);
		const orderer = getStudentStrategy('default');
		this._orderedStudents = orderer.order(students, activeSessionStudents);

		this._currentIndex = 0;
		if (session.active_unit_progress) {
			const root = this._questions.find(
				(q) => q.id === session.active_unit_progress?.root_question_id
			);
			if (root) {
				this._activeRootQuestion = root;
				this._currentStepIndex = Math.min(
					Math.max(session.active_unit_progress.step_index, 0),
					Math.max(root.steps.length - 1, 0)
				);
				this._stepOutcomes = session.active_unit_progress.step_outcomes.filter(
					(outcome): outcome is 'correct' | 'wrong' => outcome === 'correct' || outcome === 'wrong'
				);
				this._askedThisSession.add(root.id);
			}
		}

		if (!this._activeRootQuestion) {
			this._activeRootQuestion = this._pickQuestion();
		}
	}

	get currentStudent(): Student | null {
		if (this._currentIndex >= this._orderedStudents.length) return null;
		return this._orderedStudents[this._currentIndex];
	}

	get currentQuestion(): Question | null {
		const root = this._activeRootQuestion;
		const step = this.currentStep;
		if (!root || !step) return null;
		return {
			...root,
			text: step.text,
			answer: step.answer,
			steps: [step]
		};
	}

	get isComplete(): boolean {
		// Session completion is driven by assigned-question coverage, not pool exhaustion.
		return this._orderedStudents.length === 0 || this._orderedStudents.every((student) => {
			const ss = this._sessionStudentsMap.get(student.id);
			return !ss || ss.completed || ss.question_slots_remaining <= 0;
		});
	}

	get currentStep(): Question['steps'][number] | null {
		if (!this._activeRootQuestion) return null;
		return this._activeRootQuestion.steps[this._currentStepIndex] ?? null;
	}

	get currentStepIndex(): number {
		return this._activeRootQuestion ? this._currentStepIndex : 0;
	}

	get totalSteps(): number {
		return this._activeRootQuestion?.steps.length ?? 0;
	}

	get chainProgress(): { current: number; total: number } | null {
		if (!this._activeRootQuestion || this.totalSteps <= 1) return null;
		return { current: this.currentStepIndex + 1, total: this.totalSteps };
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
		if (this.isComplete || !this.currentStudent || !this._activeRootQuestion) return;

		const normalized: 'correct' | 'wrong' = outcome === 'correct' ? 'correct' : 'wrong';
		this._stepOutcomes.push(normalized);

		const totalSteps = this.totalSteps;
		const isLastStep = this._currentStepIndex >= totalSteps - 1;
		if (!isLastStep) {
			this._currentStepIndex += 1;
			await this._persistActiveUnitState(this._session.id, {
				root_question_id: this._activeRootQuestion.id,
				step_index: this._currentStepIndex,
				step_outcomes: [...this._stepOutcomes]
			});
			return;
		}

		const aggregate = this._computeAggregateOutcome(this._stepOutcomes);
		const rootQuestion = this._activeRootQuestion;
		const attempt = await this._createAttempt({
			session_id: this._session.id,
			student_id: this.currentStudent.id,
			question_id: rootQuestion.id,
			outcome: aggregate
		});
		this._attempts.push(attempt);

		await this._clearActiveUnitState(this._session.id);
		this._activeRootQuestion = null;
		this._currentStepIndex = 0;
		this._stepOutcomes = [];
		await this._consumeSlot(this.currentStudent);
	}

	async skipCurrentUnit(): Promise<void> {
		if (this.isComplete || !this.currentStudent || !this._activeRootQuestion) return;
		await this._clearActiveUnitState(this._session.id);
		this._activeRootQuestion = null;
		this._currentStepIndex = 0;
		this._stepOutcomes = [];
		await this._consumeSlot(this.currentStudent);
	}

	async pause(): Promise<void> {
		if (this._activeRootQuestion) {
			await this._persistActiveUnitState(this._session.id, {
				root_question_id: this._activeRootQuestion.id,
				step_index: this._currentStepIndex,
				step_outcomes: [...this._stepOutcomes]
			});
		}
		await this._updateSession(this._session.id, { status: 'paused' });
	}

	private async _consumeSlot(student: Student): Promise<void> {
		const ss = this._sessionStudentsMap.get(student.id)!;
		ss.question_slots_remaining -= 1;

		if (ss.question_slots_remaining <= 0) {
			ss.completed = true;
			await this._updateSessionStudent(ss.id, { question_slots_remaining: 0, completed: true });

			this._currentIndex++;

			if (this.isComplete || this._currentIndex >= this._orderedStudents.length) {
				await this._updateSession(this._session.id, {
					status: 'completed',
					completed_at: Date.now()
				});
			} else {
				this._activeRootQuestion = this._pickQuestion();
				this._currentStepIndex = 0;
				this._stepOutcomes = [];
			}
		} else {
			await this._updateSessionStudent(ss.id, {
				question_slots_remaining: ss.question_slots_remaining
			});
			this._activeRootQuestion = this._pickQuestion();
			this._currentStepIndex = 0;
			this._stepOutcomes = [];
		}
	}

	private _computeAggregateOutcome(
		outcomes: Array<'correct' | 'wrong'>
	): 'correct' | 'partial' | 'wrong' {
		if (outcomes.every((o) => o === 'correct')) return 'correct';
		if (outcomes.every((o) => o === 'wrong')) return 'wrong';
		return 'partial';
	}

	private _pickQuestion(): Question | null {
		const student = this.currentStudent;
		if (!student || this._questions.length === 0) return null;

		const allRootQuestions = this._questions;
		if (allRootQuestions.length === 0) return null;

		const rootQuestions = allRootQuestions.filter((q) => !this._askedThisSession.has(q.id));
		if (rootQuestions.length === 0) {
			this._askedThisSession.clear();
			return this._pickQuestion();
		}

		const selector = getQuestionStrategy(this._session.strategy_id);
		const rootQ = selector.pick(student, this._attempts, rootQuestions);
		this._askedThisSession.add(rootQ.id);
		return rootQ;
	}
}
