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
	activeUnitProgress: Session['active_unit_progress'] = null
): Session => ({
	id: 'sess1',
	classroom_id: 'c1',
	question_set_ids: ['qs1'],
	n_questions_per_student: nQuestions,
	started_at: 1000,
	completed_at: null,
	status,
	strategy_id: 'default',
	active_unit_progress: activeUnitProgress
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
	it('multi-step unit consumes one slot and emits one Attempt only after final step', async () => {
		const students = [makeStudent('s1')];
		const questions = [makeQuestion('q-multi', 3)];
		const sessionStudents = [makeSessionStudent('s1', 1)];
		const repos = makeMockRepos();
		const engine = new SessionEngine(makeSession('active', 1), sessionStudents, students, questions, [], repos);

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

	it('all-correct outcomes aggregate to correct', async () => {
		const repos = makeMockRepos();
		const engine = new SessionEngine(
			makeSession('active', 1),
			[makeSessionStudent('s1', 1)],
			[makeStudent('s1')],
			[makeQuestion('q1', 2)],
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
			repos
		);

		await engine.recordOutcome('wrong');
		await engine.recordOutcome('wrong');

		expect(repos.createAttemptCalls).toHaveLength(1);
		expect(repos.createAttemptCalls[0].outcome).toBe('wrong');
	});

	it('mixed correct and wrong outcomes aggregate to partial', async () => {
		const repos = makeMockRepos();
		const engine = new SessionEngine(
			makeSession('active', 1),
			[makeSessionStudent('s1', 1)],
			[makeStudent('s1')],
			[makeQuestion('q1', 3)],
			[],
			repos
		);

		await engine.recordOutcome('correct');
		await engine.recordOutcome('wrong');
		await engine.recordOutcome('correct');

		expect(repos.createAttemptCalls).toHaveLength(1);
		expect(repos.createAttemptCalls[0].outcome).toBe('partial');
	});

	it('resume restores root_question_id and step_index without draft Attempt', async () => {
		const repos = makeMockRepos();
		const resumedSession = makeSession('paused', 1, {
			root_question_id: 'q-resume',
			step_index: 1,
			step_outcomes: ['correct']
		});
		const engine = new SessionEngine(
			resumedSession,
			[makeSessionStudent('s1', 1)],
			[makeStudent('s1')],
			[makeQuestion('q-resume', 3)],
			[],
			repos
		);

		expect(engine.currentQuestion?.id).toBe('q-resume');
		expect(engine.currentStepIndex).toBe(1);
		expect(engine.currentStep?.text).toContain('step 2');
		expect(repos.createAttemptCalls).toHaveLength(0);
	});

	it('skip mid-unit creates no Attempt and skipped unit is not reinserted in same session', async () => {
		const repos = makeMockRepos();
		const engine = new SessionEngine(
			makeSession('active', 2),
			[makeSessionStudent('s1', 2)],
			[makeStudent('s1')],
			[makeQuestion('q-skip', 2), makeQuestion('q-next', 1)],
			[],
			repos
		);

		expect(engine.currentQuestion?.id).toBe('q-skip');
		await engine.skipCurrentUnit();
		expect(repos.createAttemptCalls).toHaveLength(0);
		expect(engine.currentQuestion?.id).toBe('q-next');
	});

	it('session remains in progress when pool is exhausted but assigned questions are unanswered', async () => {
		const repos = makeMockRepos();
		const students = [makeStudent('s1')];
		const questions = [makeQuestion('q-only', 1)];
		const sessionStudents = [makeSessionStudent('s1', 2)];
		const engine = new SessionEngine(makeSession('active', 2), sessionStudents, students, questions, [], repos);

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
		const engine = new SessionEngine(makeSession('active', 1), sessionStudents, students, questions, [], repos);

		await engine.recordOutcome('correct');
		expect(engine.isComplete).toBe(false);
		expect(engine.currentStudent?.id).toBe('s2');

		await engine.recordOutcome('correct');
		expect(engine.isComplete).toBe(true);
		expect(repos.updateSessionCalls.some((call) => call.changes.status === 'completed')).toBe(true);
	});
});
