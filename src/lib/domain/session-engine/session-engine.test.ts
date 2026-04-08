import { describe, it, expect } from 'vitest';
import { SessionEngine } from './index.js';
import type { Attempt, Question, Session, SessionStudent, Student } from '$lib/model/types.js';

const makeStudent = (id: string): Student => ({ id, classroom_id: 'c1', name: `Student ${id}` });
const makeQuestion = (id: string): Question => ({
	id,
	question_set_id: 'qs1',
	text: `Q ${id}`,
	content: { type: 'code-snippet', language: 'ts', code: 'x' },
	answer: { type: 'open' },
	chain_parent_id: null,
	chain_order: 0
});
const makeChainQuestion = (id: string, parentId: string | null, order: number): Question => ({
	id,
	question_set_id: 'qs1',
	text: `Q ${id}`,
	content: { type: 'code-snippet', language: 'ts', code: 'x' },
	answer: { type: 'open' },
	chain_parent_id: parentId,
	chain_order: order
});
const makeMCChainQuestion = (id: string, parentId: string | null, order: number): Question => ({
	id,
	question_set_id: 'qs1',
	text: `Q ${id}`,
	content: { type: 'code-snippet', language: 'ts', code: 'x' },
	answer: { type: 'multiple-choice', options: ['A', 'B', 'C'], correctIndex: 0 },
	chain_parent_id: parentId,
	chain_order: order
});
const makeTFChainQuestion = (id: string, parentId: string | null, order: number): Question => ({
	id,
	question_set_id: 'qs1',
	text: `Q ${id}`,
	content: { type: 'code-snippet', language: 'ts', code: 'x' },
	answer: { type: 'true-false', correctAnswer: true },
	chain_parent_id: parentId,
	chain_order: order
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
const makeSession = (status: Session['status'] = 'active', nQuestions = 2): Session => ({
	id: 'sess1',
	classroom_id: 'c1',
	question_set_ids: ['qs1'],
	n_questions_per_student: nQuestions,
	started_at: 1000,
	completed_at: null,
	status,
	strategy_id: 'default'
});

function makeMockRepos() {
	const createAttemptCalls: Array<Omit<Attempt, 'id' | 'answered_at'>> = [];
	const updateSessionCalls: Array<{ id: string; changes: Partial<Omit<Session, 'id'>> }> = [];
	const updateSessionStudentCalls: Array<{
		id: string;
		changes: Partial<Omit<SessionStudent, 'id'>>;
	}> = [];
	let attemptCounter = 100000;

	return {
		createAttemptCalls,
		updateSessionCalls,
		updateSessionStudentCalls,
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
		}
	};
}

describe('SessionEngine', () => {
	describe('full session flow', () => {
		it('2 students × 2 slots each → all outcomes recorded → session marked completed', async () => {
			const students = [makeStudent('s1'), makeStudent('s2')];
			const questions = [makeQuestion('q1'), makeQuestion('q2'), makeQuestion('q3')];
			const session = makeSession('active', 2);
			const sessionStudents = [makeSessionStudent('s1', 2), makeSessionStudent('s2', 2)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(session, sessionStudents, students, questions, [], repos);

			expect(engine.currentStudent?.id).toBe('s1');
			expect(engine.isComplete).toBe(false);

			await engine.recordOutcome('correct');
			expect(engine.currentStudent?.id).toBe('s1');

			await engine.recordOutcome('correct');
			expect(engine.currentStudent?.id).toBe('s2');

			await engine.recordOutcome('correct');
			expect(engine.currentStudent?.id).toBe('s2');
			expect(engine.isComplete).toBe(false);

			await engine.recordOutcome('correct');
			expect(engine.isComplete).toBe(true);
			expect(engine.currentStudent).toBeNull();
			expect(engine.currentQuestion).toBeNull();

			expect(repos.createAttemptCalls).toHaveLength(4);
			expect(repos.updateSessionStudentCalls).toHaveLength(4);
			expect(repos.updateSessionCalls).toHaveLength(1);
			expect(repos.updateSessionCalls[0].id).toBe('sess1');
			expect(repos.updateSessionCalls[0].changes.status).toBe('completed');
			expect(typeof repos.updateSessionCalls[0].changes.completed_at).toBe('number');
		});
	});

	describe('pause', () => {
		it('calls updateSession with { status: paused }', async () => {
			const students = [makeStudent('s1')];
			const questions = [makeQuestion('q1')];
			const session = makeSession('active', 1);
			const sessionStudents = [makeSessionStudent('s1', 1)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(session, sessionStudents, students, questions, [], repos);
			await engine.pause();

			expect(repos.updateSessionCalls).toHaveLength(1);
			expect(repos.updateSessionCalls[0].id).toBe('sess1');
			expect(repos.updateSessionCalls[0].changes).toEqual({ status: 'paused' });
		});
	});

	describe('pause and resume', () => {
		it('constructs from paused session, excludes completed students, session continues', async () => {
			const students = [makeStudent('s1'), makeStudent('s2'), makeStudent('s3')];
			const questions = [makeQuestion('q1'), makeQuestion('q2')];
			const pausedSession = makeSession('paused', 2);
			const sessionStudents = [
				makeSessionStudent('s1', 0, true),
				makeSessionStudent('s2', 2, false),
				makeSessionStudent('s3', 2, false)
			];
			const repos = makeMockRepos();

			const engine = new SessionEngine(
				pausedSession,
				sessionStudents,
				students,
				questions,
				[],
				repos
			);

			expect(engine.isComplete).toBe(false);
			expect(engine.currentStudent?.id).not.toBe('s1');
			expect(['s2', 's3']).toContain(engine.currentStudent?.id);
			expect(engine.currentQuestion).not.toBeNull();

			expect(engine.progress.studentsCompleted).toBe(1);
			expect(engine.progress.studentsTotal).toBe(3);

			await engine.recordOutcome('correct');
			expect(engine.isComplete).toBe(false);
		});
	});

	describe('session completion', () => {
		it('isComplete is true and currentStudent is null after last outcome', async () => {
			const students = [makeStudent('s1')];
			const questions = [makeQuestion('q1')];
			const session = makeSession('active', 1);
			const sessionStudents = [makeSessionStudent('s1', 1)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(session, sessionStudents, students, questions, [], repos);

			expect(engine.isComplete).toBe(false);
			await engine.recordOutcome('wrong');

			expect(engine.isComplete).toBe(true);
			expect(engine.currentStudent).toBeNull();
			expect(engine.currentQuestion).toBeNull();
			expect(repos.updateSessionCalls[0].changes.status).toBe('completed');
		});

		it('already-completed session starts as complete', () => {
			const students = [makeStudent('s1')];
			const questions = [makeQuestion('q1')];
			const session = makeSession('completed', 1);
			const sessionStudents = [makeSessionStudent('s1', 0, true)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(session, sessionStudents, students, questions, [], repos);

			expect(engine.isComplete).toBe(true);
			expect(engine.currentStudent).toBeNull();
			expect(engine.currentQuestion).toBeNull();
		});
	});

	describe('progress', () => {
		it('returns correct counts at each step', async () => {
			const students = [makeStudent('s1'), makeStudent('s2')];
			const questions = [makeQuestion('q1'), makeQuestion('q2')];
			const session = makeSession('active', 2);
			const sessionStudents = [makeSessionStudent('s1', 2), makeSessionStudent('s2', 2)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(session, sessionStudents, students, questions, [], repos);

			expect(engine.progress).toEqual({
				studentsCompleted: 0,
				studentsTotal: 2,
				slotsCompletedForCurrentStudent: 0,
				slotsTotalForCurrentStudent: 2
			});

			await engine.recordOutcome('correct');
			expect(engine.progress).toEqual({
				studentsCompleted: 0,
				studentsTotal: 2,
				slotsCompletedForCurrentStudent: 1,
				slotsTotalForCurrentStudent: 2
			});

			await engine.recordOutcome('correct');
			expect(engine.progress).toEqual({
				studentsCompleted: 1,
				studentsTotal: 2,
				slotsCompletedForCurrentStudent: 0,
				slotsTotalForCurrentStudent: 2
			});

			await engine.recordOutcome('correct');
			expect(engine.progress).toEqual({
				studentsCompleted: 1,
				studentsTotal: 2,
				slotsCompletedForCurrentStudent: 1,
				slotsTotalForCurrentStudent: 2
			});

			await engine.recordOutcome('correct');
			expect(engine.progress).toEqual({
				studentsCompleted: 2,
				studentsTotal: 2,
				slotsCompletedForCurrentStudent: 0,
				slotsTotalForCurrentStudent: 0
			});
		});
	});

	describe('question cycling', () => {
		it('cycles from oldest correctly answered when all questions answered correctly', async () => {
			const student = makeStudent('s1');
			const questions = [makeQuestion('q1'), makeQuestion('q2'), makeQuestion('q3')];
			const session = makeSession('active', 3);
			const sessionStudents = [makeSessionStudent('s1', 3)];

			const preAttempts: Attempt[] = [
				{
					id: 'pre1',
					session_id: 'sess1',
					student_id: 's1',
					question_id: 'q1',
					outcome: 'correct',
					answered_at: 3000
				},
				{
					id: 'pre2',
					session_id: 'sess1',
					student_id: 's1',
					question_id: 'q2',
					outcome: 'correct',
					answered_at: 1000
				},
				{
					id: 'pre3',
					session_id: 'sess1',
					student_id: 's1',
					question_id: 'q3',
					outcome: 'correct',
					answered_at: 2000
				}
			];

			const repos = makeMockRepos();
			const engine = new SessionEngine(
				session,
				sessionStudents,
				[student],
				questions,
				preAttempts,
				repos
			);

			expect(engine.currentQuestion?.id).toBe('q2');

			await engine.recordOutcome('correct');
			expect(engine.currentQuestion?.id).toBe('q3');

			await engine.recordOutcome('correct');
			expect(engine.currentQuestion?.id).toBe('q1');
		});
	});

	describe('chain questions', () => {
		it('all-correct chain → single Attempt on root with outcome correct, slot consumed', async () => {
			const students = [makeStudent('s1')];
			const parent = makeChainQuestion('qp', null, 0);
			const child1 = makeChainQuestion('qc1', 'qp', 1);
			const child2 = makeChainQuestion('qc2', 'qp', 2);
			const session = makeSession('active', 1);
			const sessionStudents = [makeSessionStudent('s1', 1)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(
				session,
				sessionStudents,
				students,
				[parent, child1, child2],
				[],
				repos
			);

			expect(engine.currentQuestion?.id).toBe('qp');

			await engine.recordOutcome('correct');
			expect(engine.currentQuestion?.id).toBe('qc1');
			expect(repos.createAttemptCalls).toHaveLength(0);

			await engine.recordOutcome('correct');
			expect(engine.currentQuestion?.id).toBe('qc2');
			expect(repos.createAttemptCalls).toHaveLength(0);

			await engine.recordOutcome('correct');
			expect(engine.isComplete).toBe(true);
			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].question_id).toBe('qp');
			expect(repos.createAttemptCalls[0].outcome).toBe('correct');
		});

		it('chain with one wrong → aggregate wrong, all follow-ups still presented', async () => {
			const students = [makeStudent('s1')];
			const parent = makeChainQuestion('qp', null, 0);
			const child1 = makeChainQuestion('qc1', 'qp', 1);
			const child2 = makeChainQuestion('qc2', 'qp', 2);
			const session = makeSession('active', 1);
			const sessionStudents = [makeSessionStudent('s1', 1)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(
				session,
				sessionStudents,
				students,
				[parent, child1, child2],
				[],
				repos
			);

			await engine.recordOutcome('correct');
			expect(engine.currentQuestion?.id).toBe('qc1');

			await engine.recordOutcome('wrong');
			expect(engine.currentQuestion?.id).toBe('qc2');

			await engine.recordOutcome('correct');
			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].outcome).toBe('wrong');
			expect(engine.isComplete).toBe(true);
		});

		it('chain with one partial → aggregate partial', async () => {
			const students = [makeStudent('s1')];
			const parent = makeChainQuestion('qp', null, 0);
			const child1 = makeChainQuestion('qc1', 'qp', 1);
			const child2 = makeChainQuestion('qc2', 'qp', 2);
			const session = makeSession('active', 1);
			const sessionStudents = [makeSessionStudent('s1', 1)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(
				session,
				sessionStudents,
				students,
				[parent, child1, child2],
				[],
				repos
			);

			await engine.recordOutcome('correct');
			await engine.recordOutcome('partial');
			await engine.recordOutcome('correct');

			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].outcome).toBe('partial');
		});

		it('parent wrong, child correct → aggregate wrong', async () => {
			const students = [makeStudent('s1')];
			const parent = makeChainQuestion('qp', null, 0);
			const child1 = makeChainQuestion('qc1', 'qp', 1);
			const session = makeSession('active', 1);
			const sessionStudents = [makeSessionStudent('s1', 1)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(
				session,
				sessionStudents,
				students,
				[parent, child1],
				[],
				repos
			);

			await engine.recordOutcome('wrong');
			expect(engine.currentQuestion?.id).toBe('qc1');

			await engine.recordOutcome('correct');
			expect(repos.createAttemptCalls).toHaveLength(1);
			expect(repos.createAttemptCalls[0].outcome).toBe('wrong');
			expect(engine.isComplete).toBe(true);
		});

		describe('chain questions with different answer types', () => {
			it('MC chain all-correct → aggregate correct, single Attempt on root', async () => {
				const students = [makeStudent('s1')];
				const parent = makeMCChainQuestion('qp', null, 0);
				const child = makeMCChainQuestion('qc1', 'qp', 1);
				const session = makeSession('active', 1);
				const sessionStudents = [makeSessionStudent('s1', 1)];
				const repos = makeMockRepos();

				const engine = new SessionEngine(
					session,
					sessionStudents,
					students,
					[parent, child],
					[],
					repos
				);

				expect(engine.currentQuestion?.id).toBe('qp');

				await engine.recordOutcome('correct');
				expect(engine.currentQuestion?.id).toBe('qc1');
				expect(repos.createAttemptCalls).toHaveLength(0);

				await engine.recordOutcome('correct');
				expect(engine.isComplete).toBe(true);
				expect(repos.createAttemptCalls).toHaveLength(1);
				expect(repos.createAttemptCalls[0].question_id).toBe('qp');
				expect(repos.createAttemptCalls[0].outcome).toBe('correct');
			});

			it('TF chain with one wrong → aggregate wrong', async () => {
				const students = [makeStudent('s1')];
				const parent = makeTFChainQuestion('qp', null, 0);
				const child = makeTFChainQuestion('qc1', 'qp', 1);
				const session = makeSession('active', 1);
				const sessionStudents = [makeSessionStudent('s1', 1)];
				const repos = makeMockRepos();

				const engine = new SessionEngine(
					session,
					sessionStudents,
					students,
					[parent, child],
					[],
					repos
				);

				await engine.recordOutcome('correct');
				expect(engine.currentQuestion?.id).toBe('qc1');

				await engine.recordOutcome('wrong');
				expect(engine.isComplete).toBe(true);
				expect(repos.createAttemptCalls).toHaveLength(1);
				expect(repos.createAttemptCalls[0].outcome).toBe('wrong');
			});

			it('mixed chain (open+MC+TF) correct/correct/wrong → aggregate wrong', async () => {
				const students = [makeStudent('s1')];
				const parent = makeChainQuestion('qp', null, 0); // open
				const childMC = makeMCChainQuestion('qc1', 'qp', 1);
				const childTF = makeTFChainQuestion('qc2', 'qp', 2);
				const session = makeSession('active', 1);
				const sessionStudents = [makeSessionStudent('s1', 1)];
				const repos = makeMockRepos();

				const engine = new SessionEngine(
					session,
					sessionStudents,
					students,
					[parent, childMC, childTF],
					[],
					repos
				);

				await engine.recordOutcome('correct');
				await engine.recordOutcome('correct');
				await engine.recordOutcome('wrong');

				expect(repos.createAttemptCalls).toHaveLength(1);
				expect(repos.createAttemptCalls[0].outcome).toBe('wrong');
				expect(engine.isComplete).toBe(true);
			});

			it('mixed chain (open+MC+TF) correct/partial/correct → aggregate partial', async () => {
				const students = [makeStudent('s1')];
				const parent = makeChainQuestion('qp', null, 0); // open
				const childMC = makeMCChainQuestion('qc1', 'qp', 1);
				const childTF = makeTFChainQuestion('qc2', 'qp', 2);
				const session = makeSession('active', 1);
				const sessionStudents = [makeSessionStudent('s1', 1)];
				const repos = makeMockRepos();

				const engine = new SessionEngine(
					session,
					sessionStudents,
					students,
					[parent, childMC, childTF],
					[],
					repos
				);

				await engine.recordOutcome('correct');
				await engine.recordOutcome('partial');
				await engine.recordOutcome('correct');

				expect(repos.createAttemptCalls).toHaveLength(1);
				expect(repos.createAttemptCalls[0].outcome).toBe('partial');
				expect(engine.isComplete).toBe(true);
			});
		});

		it('chainProgress: correct values during chain, null outside chain', async () => {
			const students = [makeStudent('s1')];
			const parent = makeChainQuestion('qp', null, 0);
			const child1 = makeChainQuestion('qc1', 'qp', 1);
			const child2 = makeChainQuestion('qc2', 'qp', 2);
			const session = makeSession('active', 1);
			const sessionStudents = [makeSessionStudent('s1', 1)];
			const repos = makeMockRepos();

			const engine = new SessionEngine(
				session,
				sessionStudents,
				students,
				[parent, child1, child2],
				[],
				repos
			);

			expect(engine.chainProgress).toEqual({ current: 1, total: 3 });

			await engine.recordOutcome('correct');
			expect(engine.chainProgress).toEqual({ current: 2, total: 3 });

			await engine.recordOutcome('correct');
			expect(engine.chainProgress).toEqual({ current: 3, total: 3 });

			await engine.recordOutcome('correct');
			expect(engine.chainProgress).toBeNull();

			const standaloneEngine = new SessionEngine(
				makeSession('active', 1),
				[makeSessionStudent('s1', 1)],
				[makeStudent('s1')],
				[makeQuestion('q1')],
				[],
				makeMockRepos()
			);
			expect(standaloneEngine.chainProgress).toBeNull();
		});
	});
});
