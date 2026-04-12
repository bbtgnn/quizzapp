import type { Attempt, Question, Session, SessionStudent, Student } from '$lib/model/types.js';
import type { SessionEnginePersistence } from '$lib/ports/session-engine-persistence.js';
import { computeSessionPlan } from '$lib/domain/session-plan/compute-session-plan.js';

function isSessionPlanComplete(
	session: Session,
	sessionStudents: SessionStudent[],
	questions: Question[]
): boolean {
	const { student_order_ids, question_schedule, n_questions_per_student } = session;
	if (!student_order_ids || !question_schedule) return false;
	const qIds = new Set(questions.map((q) => q.id));
	const enrolled = new Set(sessionStudents.map((ss) => ss.student_id));
	for (const sid of enrolled) {
		const row = question_schedule[sid];
		if (!row || row.length !== n_questions_per_student) return false;
		for (const qid of row) {
			if (!qIds.has(qid)) return false;
		}
	}
	for (const sid of enrolled) {
		if (!student_order_ids.includes(sid)) return false;
	}
	return true;
}

export class SessionEngine {
	private readonly _session: Session;
	private readonly _questions: Question[];
	private _attempts: Attempt[];
	private _sessionStudentsMap: Map<string, SessionStudent>;
	private _orderedStudents: Student[];
	private _studentOrderIds: string[];
	private _questionSchedule: Record<string, string[]>;
	private _currentIndex: number;
	private _activeRootQuestion: Question | null;
	private _currentStepIndex: number;
	private _stepOutcomes: Array<'correct' | 'wrong'>;
	private readonly _createAttempt: SessionEnginePersistence['createAttempt'];
	private readonly _updateSession: SessionEnginePersistence['updateSession'];
	private readonly _updateSessionStudent: SessionEnginePersistence['updateSessionStudent'];
	private readonly _persistActiveUnitState: SessionEnginePersistence['persistActiveUnitState'];
	private readonly _clearActiveUnitState: SessionEnginePersistence['clearActiveUnitState'];

	constructor(
		session: Session,
		sessionStudents: SessionStudent[],
		students: Student[],
		questions: Question[],
		sessionAttempts: Attempt[],
		/** All attempts for enrolled students (any session), used only to build the fixed schedule once. */
		planningAttempts: Attempt[],
		persistence: SessionEnginePersistence
	) {
		this._session = session;
		this._questions = questions;
		this._attempts = [...sessionAttempts];
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
			this._studentOrderIds = [];
			this._questionSchedule = {};
			this._currentIndex = 0;
			return;
		}

		let studentOrderIds = session.student_order_ids;
		let questionSchedule = session.question_schedule;

		if (!isSessionPlanComplete(session, sessionStudents, questions)) {
			const enrolledStudentIds = sessionStudents.map((ss) => ss.student_id);
			const plan = computeSessionPlan({
				sessionId: session.id,
				startedAt: session.started_at,
				nQuestionsPerStudent: session.n_questions_per_student,
				enrolledStudentIds,
				students,
				questionPool: questions,
				attemptsForTiering: planningAttempts
			});
			studentOrderIds = plan.studentOrderIds;
			questionSchedule = plan.questionSchedule;
			void this._updateSession(session.id, {
				student_order_ids: studentOrderIds,
				question_schedule: questionSchedule
			});
		}

		this._studentOrderIds = studentOrderIds!;
		this._questionSchedule = questionSchedule!;

		const repair = session.active_unit_progress;
		if (repair?.student_id) {
			const ss = sessionStudents.find((x) => x.student_id === repair.student_id);
			if (ss && !ss.completed) {
				const slot = session.n_questions_per_student - ss.question_slots_remaining;
				const row = this._questionSchedule[repair.student_id];
				if (row && slot >= 0 && slot < row.length && row[slot] !== repair.root_question_id) {
					row[slot] = repair.root_question_id;
					void this._updateSession(session.id, {
						student_order_ids: this._studentOrderIds,
						question_schedule: { ...this._questionSchedule, [repair.student_id]: [...row] }
					});
				}
			}
		}

		const enrolledSet = new Set(sessionStudents.map((ss) => ss.student_id));
		const completedIds = new Set(
			sessionStudents.filter((ss) => ss.completed).map((ss) => ss.student_id)
		);
		const studentById = new Map(students.map((s) => [s.id, s]));

		const orderedIds = this._studentOrderIds.filter((id) => enrolledSet.has(id));
		for (const sid of enrolledSet) {
			if (!orderedIds.includes(sid)) orderedIds.push(sid);
		}

		this._orderedStudents = orderedIds
			.filter((id) => !completedIds.has(id))
			.map((id) => studentById.get(id))
			.filter((s): s is Student => s !== undefined);

		this._currentIndex = 0;
		const turnStudentId =
			session.active_unit_progress?.student_id ?? session.active_student_id ?? undefined;
		if (turnStudentId) {
			const idx = this._orderedStudents.findIndex((s) => s.id === turnStudentId);
			if (idx >= 0) this._currentIndex = idx;
		}

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
			}
		}

		if (!this._activeRootQuestion) {
			this._activeRootQuestion = this._questionAtCurrentSlot();
		}

		void this._syncActiveStudentId();
	}

	private _slotIndexForStudent(studentId: string): number {
		const ss = this._sessionStudentsMap.get(studentId);
		if (!ss) return 0;
		return this._session.n_questions_per_student - ss.question_slots_remaining;
	}

	private _questionAtCurrentSlot(): Question | null {
		const student = this.currentStudent;
		if (!student || this._questions.length === 0) return null;
		const row = this._questionSchedule[student.id];
		const idx = this._slotIndexForStudent(student.id);
		if (!row || idx < 0 || idx >= row.length) return null;
		const qid = row[idx];
		return this._questions.find((q) => q.id === qid) ?? null;
	}

	private async _syncActiveStudentId(): Promise<void> {
		await this._updateSession(this._session.id, {
			active_student_id: this.currentStudent?.id ?? null
		});
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
		return this._orderedStudents.length === 0 || this._orderedStudents.every((student) => {
			const ss = this._sessionStudentsMap.get(student.id);
			return !ss || ss.completed || ss.question_slots_remaining <= 0;
		});
	}

	get currentStep(): Question['steps'][number] | null {
		const root = this._activeRootQuestion;
		if (!root) return null;
		const explicitStep = root.steps[this._currentStepIndex];
		if (explicitStep) return explicitStep;
		if (root.text && root.answer) {
			return { text: root.text, answer: root.answer };
		}
		return null;
	}

	get currentStepIndex(): number {
		return this._activeRootQuestion ? this._currentStepIndex : 0;
	}

	get totalSteps(): number {
		const root = this._activeRootQuestion;
		if (!root) return 0;
		if (root.steps.length > 0) return root.steps.length;
		return root.text && root.answer ? 1 : 0;
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
				step_outcomes: [...this._stepOutcomes],
				student_id: this.currentStudent.id
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
		const finishedStudent = this.currentStudent;
		await this._consumeSlot(finishedStudent!);
	}

	async skipCurrentUnit(): Promise<void> {
		if (this.isComplete || !this.currentStudent || !this._activeRootQuestion) return;
		await this._clearActiveUnitState(this._session.id);
		this._activeRootQuestion = null;
		this._currentStepIndex = 0;
		this._stepOutcomes = [];
		const skippedFor = this.currentStudent;
		await this._consumeSlot(skippedFor);
	}

	async pause(): Promise<void> {
		if (this._activeRootQuestion) {
			await this._persistActiveUnitState(this._session.id, {
				root_question_id: this._activeRootQuestion.id,
				step_index: this._currentStepIndex,
				step_outcomes: [...this._stepOutcomes],
				student_id: this.currentStudent!.id
			});
		}
		await this._updateSession(this._session.id, {
			status: 'paused',
			active_student_id: this.currentStudent?.id ?? null
		});
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
					completed_at: Date.now(),
					active_student_id: null,
					active_unit_progress: null
				});
			} else {
				this._activeRootQuestion = this._questionAtCurrentSlot();
				this._currentStepIndex = 0;
				this._stepOutcomes = [];
			}
		} else {
			await this._updateSessionStudent(ss.id, {
				question_slots_remaining: ss.question_slots_remaining
			});
			this._activeRootQuestion = this._questionAtCurrentSlot();
			this._currentStepIndex = 0;
			this._stepOutcomes = [];
		}

		await this._syncActiveStudentId();
	}

	private _computeAggregateOutcome(
		outcomes: Array<'correct' | 'wrong'>
	): 'correct' | 'partial' | 'wrong' {
		if (outcomes.every((o) => o === 'correct')) return 'correct';
		if (outcomes.every((o) => o === 'wrong')) return 'wrong';
		return 'partial';
	}
}
