import { describe, expect, it } from 'vitest';
import { SessionEngine } from './index.js';
import type { Attempt, Question, Session, SessionStudent, Student } from '$lib/model/types.js';

const makeStudent = (id: string): Student => ({ id, classroom_id: 'c1', name: `Student ${id}` });

const makeQuestion = (id: string, stepCount = 1): Question => ({
	id,
	question_set_id: 'qs1',
	shared: { content: { type: 'code-snippet', language: 'ts', code: 'const x = 1;' } },
	steps: Array.from({ length: stepCount }, (_, index) => ({
		text: `${id} step ${index + 1}`,
		answer: { type: 'open' }
	})),
	text: `${id} step 1`,
	content: { type: 'code-snippet', language: 'ts', code: 'const x = 1;' },
	answer: { type: 'open' }
});

const makeSessionStudent = (
	studentId: string,
	slotsRemaining: number,
	completed = false
): SessionStudent => ({
	id: `ss-${studentId}`,
	session_id: 'sess1',
	student_id: studentId,
	completed,
	question_slots_remaining: slotsRemaining
});

const makeSession = (
	status: Session['status'] = 'active',
	nQuestions = 1,
	activeUnitProgress: Session['active_unit_progress'] = null,
	activeStudentId: Session['active_student_id'] = undefined,
	plan?: Partial<Pick<Session, 'student_order_ids' | 'question_schedule'>>
): Session => ({
	id: 'sess1',
	classroom_id: 'c1',
	question_set_ids: ['qs1'],
	n_questions_per_student: nQuestions,
	started_at: 1000,
	completed_at: null,
	status,
	strategy_id: 'default',
	active_student_id: activeStudentId,
	active_unit_progress: activeUnitProgress,
	student_order_ids: plan?.student_order_ids ?? null,
	question_schedule: plan?.question_schedule ?? null
});

function makeMockRepos() {
	const createAttemptCalls: Array<Omit<Attempt, 'id' | 'answered_at'>> = [];
	const updateSessionCalls: Array<{ id: string; changes: Partial<Omit<Session, 'id'>> }> = [];
	const updateSessionStudentCalls: Array<{
		id: string;
		changes: Partial<Omit<SessionStudent, 'id'>>;
	}> = [];
	const persistedStateCalls: Array<{
		sessionId: string;
		state: NonNullable<Session['active_unit_progress']>;
	}> = [];
	const clearStateCalls: string[] = [];
	let attemptCounter = 100000;

	return {
		createAttemptCalls,
		updateSessionCalls,
		updateSessionStudentCalls,
		persistedStateCalls,
		clearStateCalls,
		createAttempt: async (data: Omit<Attempt, 'id' | 'answered_at'>): Promise<Attempt> => {
			createAttemptCalls.push(data);
			return { ...data, id: `a${++attemptCounter}`, answered_at: attemptCounter };
		},
		updateSession: async (id: string, changes: Partial<Omit<Session, 'id'>>): Promise<void> => {
			updateSessionCalls.push({ id, changes });
		},
		updateSessionStudent: async (
			id: string,
			changes: Partial<Omit<SessionStudent, 'id'>>
		): Promise<void> => {
			updateSessionStudentCalls.push({ id, changes });
		},
		persistActiveUnitState: async (
			sessionId: string,
			state: NonNullable<Session['active_unit_progress']>
		): Promise<void> => {
			persistedStateCalls.push({ sessionId, state });
		},
		clearActiveUnitState: async (sessionId: string): Promise<void> => {
			clearStateCalls.push(sessionId);
		}
	};
}

describe('SessionEngine logical-unit progression and scoring', () => {
	it('falls back to root-level text/answer when a legacy question has no steps', async () => {
		const repos = makeMockRepos();
		const legacyQuestion: Question = {
			id: 'q-legacy',
			question_set_id: 'qs1',
			shared: { content: { type: 'code-snippet', language: 'ts', code: 'const x = 1;' } },
			steps: [],
			text: 'Legacy question text',
			answer: { type: 'open' }
		};
		const engine = new SessionEngine(
			makeSession('active', 1),
			[makeSessionStudent('s1', 1)],
			[makeStudent('s1')],
			[legacyQuestion],
			[],
			[],
			repos
		);

		expect(engine.currentQuestion?.id).toBe('q-legacy');
		expect(engine.currentStep?.text).toBe('Legacy question text');
		expect(engine.totalSteps).toBe(1);

		await engine.recordOutcome('correct');
		expect(repos.createAttemptCalls).toHaveLength(1);
		expect(repos.createAttemptCalls[0].question_id).toBe('q-legacy');
	});

	it('multi-step unit consumes one slot and emits one Attempt only after final step', async () => {
		const students = [makeStudent('s1')];
		const questions = [makeQuestion('q-multi', 3)];
		const sessionStudents = [makeSessionStudent('s1', 1)];
		const repos = makeMockRepos();
		const engine = new SessionEngine(makeSession('active', 1), sessionStudents, students, questions, [], [], repos);

		expect(engine.currentQuestion?.id).toBe('q-multi');
		expect(engine.currentStepIndex).toBe(0);
		expect(engine.totalSteps).toBe(3);

		await engine.recordOutcome('correct');
		expect(engine.currentQuestion?.id).toBe('q-multi');
		expect(engine.currentStepIndex).toBe(1);
		expect(repos.createAttemptCalls).toHaveLength(0);

		await engine.recordOutcome('wrong');
		expect(engine.currentStepIndex).toBe(2);
		expect(repos.createAttemptCalls).toHaveLength(0);

		await engine.recordOutcome('correct');
		expect(repos.createAttemptCalls).toHaveLength(1);
		expect(repos.createAttemptCalls[0].question_id).toBe('q-multi');
		expect(repos.updateSessionStudentCalls).toHaveLength(1);
	});

	describe('VER-01: aggregate scoring matrix', () => {
		it('all-correct outcomes aggregate to correct', async () => {
			const repos = makeMockRepos();
			const engine = new SessionEngine(
				makeSession('active', 1),
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q1', 2)],
				[],
				[],
				repos
			);

			await engine.recordOutcome('correct');
			await engine.recordOutcome('correct');

			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].outcome).toBe('correct');
		});

		it('all-wrong outcomes aggregate to wrong', async () => {
			const repos = makeMockRepos();
			const engine = new SessionEngine(
				makeSession('active', 1),
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q1', 2)],
				[],
				[],
				repos
			);

			await engine.recordOutcome('wrong');
			await engine.recordOutcome('wrong');

			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].outcome).toBe('wrong');
		});

		it('VER-01: mixed steps → partial (SESS-03)', async () => {
			const repos = makeMockRepos();
			const engine = new SessionEngine(
				makeSession('active', 1),
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q1', 3)],
				[],
				[],
				repos
			);

			await engine.recordOutcome('correct');
			await engine.recordOutcome('wrong');
			await engine.recordOutcome('correct');

			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].outcome).toBe('partial');
		});

		it('VER-01: single-step unit uses step outcome as aggregate (D-10)', async () => {
			const reposCorrect = makeMockRepos();
			const engineCorrect = new SessionEngine(
				makeSession('active', 1),
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q-single-agg', 1)],
				[],
				[],
				reposCorrect
			);
			await engineCorrect.recordOutcome('correct');
			expect(reposCorrect.createAttemptCalls).toHaveLength(1);
			expect(reposCorrect.createAttemptCalls[0].outcome).toBe('correct');

			const reposWrong = makeMockRepos();
			const engineWrong = new SessionEngine(
				makeSession('active', 1),
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q-single-agg', 1)],
				[],
				[],
				reposWrong
			);
			await engineWrong.recordOutcome('wrong');
			expect(reposWrong.createAttemptCalls).toHaveLength(1);
			expect(reposWrong.createAttemptCalls[0].outcome).toBe('wrong');
		});
	});

	describe('VER-01: core step progression', () => {
		it('VER-01: multi-step progression 0→1→2 before single Attempt', async () => {
			const repos = makeMockRepos();
			const engine = new SessionEngine(
				makeSession('active', 1),
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q-progression', 3)],
				[],
				[],
				repos
			);

			expect(engine.currentStepIndex).toBe(0);
			await engine.recordOutcome('correct');
			expect(engine.currentStepIndex).toBe(1);
			expect(repos.createAttemptCalls).toHaveLength(0);

			await engine.recordOutcome('correct');
			expect(engine.currentStepIndex).toBe(2);
			expect(repos.createAttemptCalls).toHaveLength(0);

			await engine.recordOutcome('correct');
			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].question_id).toBe('q-progression');
		});

		it('VER-01: resume restores currentStepIndex without draft Attempt', async () => {
			const repos = makeMockRepos();
			const resumedSession = makeSession('paused', 1, {
				root_question_id: 'q-resume',
				step_index: 1,
				step_outcomes: ['correct'],
				student_id: 's1'
			});
			const engine = new SessionEngine(
				resumedSession,
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q-resume', 3)],
				[],
				[],
				repos
			);

			expect(engine.currentQuestion?.id).toBe('q-resume');
			expect(engine.currentStepIndex).toBe(1);
			expect(engine.currentStep?.text).toContain('step 2');
			expect(repos.createAttemptCalls).toHaveLength(0);
		});
	});

	it('restores current student from active_student_id (stable order, refresh-safe)', () => {
		const repos = makeMockRepos();
		const students = [makeStudent('s2'), makeStudent('s1')];
		const sessionStudents = [makeSessionStudent('s1', 1), makeSessionStudent('s2', 1)];
		const session = makeSession('active', 1, null, 's2');
		const engine = new SessionEngine(
			session,
			sessionStudents,
			students,
			[makeQuestion('q1', 1), makeQuestion('q2', 1)],
			[],
			[],
			repos
		);

		expect(engine.currentStudent?.id).toBe('s2');
	});

	it('skip mid-unit creates no Attempt and skipped unit is not reinserted in same session', async () => {
		const repos = makeMockRepos();
		const engine = new SessionEngine(
			makeSession('active', 2, null, undefined, {
				student_order_ids: ['s1'],
				question_schedule: { s1: ['q-skip', 'q-next'] }
			}),
			[makeSessionStudent('s1', 2)],
			[makeStudent('s1')],
			[makeQuestion('q-skip', 2), makeQuestion('q-next', 1)],
			[],
			[],
			repos
		);

		const skippedRootId = engine.currentQuestion?.id;
		expect(skippedRootId).toBe('q-skip');
		await engine.skipCurrentUnit();
		expect(repos.createAttemptCalls).toHaveLength(0);
		expect(repos.createAttemptCalls.map((attempt) => attempt.question_id)).not.toContain(skippedRootId);
		expect(engine.currentQuestion?.id).toBe('q-next');
		expect([engine.currentQuestion?.id]).not.toContain(skippedRootId);
	});

	it('session remains in progress when pool is exhausted but assigned questions are unanswered', async () => {
		const repos = makeMockRepos();
		const students = [makeStudent('s1')];
		const questions = [makeQuestion('q-only', 1)];
		const sessionStudents = [makeSessionStudent('s1', 2)];
		const engine = new SessionEngine(makeSession('active', 2), sessionStudents, students, questions, [], [], repos);

		await engine.recordOutcome('correct');
		expect(engine.isComplete).toBe(false);
		expect(engine.currentStudent?.id).toBe('s1');
		expect(engine.currentQuestion).not.toBeNull();
	});

	it('session marks complete only after all students answer assigned logical questions', async () => {
		const repos = makeMockRepos();
		const students = [makeStudent('s1'), makeStudent('s2')];
		const questions = [makeQuestion('q1', 1), makeQuestion('q2', 1)];
		const sessionStudents = [makeSessionStudent('s1', 1), makeSessionStudent('s2', 1)];
		const engine = new SessionEngine(makeSession('active', 1), sessionStudents, students, questions, [], [], repos);

		await engine.recordOutcome('correct');
		expect(engine.isComplete).toBe(false);
		expect(engine.currentStudent).not.toBeNull();
		expect(engine.currentStudent?.id).not.toBeUndefined();

		await engine.recordOutcome('correct');
		expect(engine.isComplete).toBe(true);
		expect(repos.updateSessionCalls.some((call) => call.changes.status === 'completed')).toBe(true);
	});
});

/**
 * UI-01 / UI-02: run view data must come from SessionEngine getters — shared stem on the
 * logical unit, per-step prompts and answer types, k-of-n from currentStepIndex / totalSteps.
 */
describe('run UI data contract', () => {
	it('UI-01 / UI-02: shared stem stays on currentQuestion while step index and answer.type track the active step', async () => {
		const sharedMarkdown = { type: 'markdown' as const, body: 'Shared stem for multi-step unit' };
		const mixedQuestion: Question = {
			id: 'q-ui-mixed',
			question_set_id: 'qs1',
			shared: { content: sharedMarkdown },
			steps: [
				{ text: 'First — open', answer: { type: 'open' } },
				{
					text: 'Second — multiple choice',
					answer: { type: 'multiple-choice', options: ['A', 'B'], correctIndex: 0 }
				}
			],
			text: 'First — open',
			answer: { type: 'open' }
		};
		const repos = makeMockRepos();
		const engine = new SessionEngine(
			makeSession('active', 1),
			[makeSessionStudent('s1', 1)],
			[makeStudent('s1')],
			[mixedQuestion],
			[],
			[],
			repos
		);

		expect(engine.currentQuestion?.shared?.content).toEqual(sharedMarkdown);
		expect(engine.currentStepIndex).toBe(0);
		expect(engine.totalSteps).toBe(2);
		expect(engine.currentStep?.answer.type).toBe('open');

		await engine.recordOutcome('correct');
		expect(engine.currentQuestion?.shared?.content).toEqual(sharedMarkdown);
		expect(engine.currentStepIndex).toBe(1);
		expect(engine.currentStep?.answer.type).toBe('multiple-choice');
	});

	it('UI-01: single-step unit exposes Step 1 of 1 via totalSteps === 1 and currentStepIndex === 0', () => {
		const repos = makeMockRepos();
		const engine = new SessionEngine(
			makeSession('active', 1),
			[makeSessionStudent('s1', 1)],
			[makeStudent('s1')],
			[makeQuestion('q-single', 1)],
			[],
			[],
			repos
		);

		expect(engine.totalSteps).toBe(1);
		expect(engine.currentStepIndex).toBe(0);
	});
});
