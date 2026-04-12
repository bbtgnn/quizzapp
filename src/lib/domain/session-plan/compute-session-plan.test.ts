import { describe, expect, it } from 'vitest';
import { computeSessionPlan } from './compute-session-plan.js';
import type { Attempt, Question, Student } from '$lib/model/types.js';

const q = (id: string): Question => ({
	id,
	question_set_id: 'qs',
	steps: [{ text: id, answer: { type: 'open' } }],
	text: id,
	answer: { type: 'open' }
});

const st = (id: string): Student => ({ id, classroom_id: 'c', name: id });

describe('computeSessionPlan', () => {
	it('assigns distinct questions to adjacent students at the same slot when the pool allows', () => {
		const plan = computeSessionPlan({
			sessionId: 'adj-test',
			startedAt: 99,
			nQuestionsPerStudent: 1,
			enrolledStudentIds: ['a', 'b'],
			students: [st('a'), st('b')],
			questionPool: [q('q1'), q('q2')],
			attemptsForTiering: []
		});
		expect(plan.studentOrderIds).toHaveLength(2);
		const [firstId, secondId] = plan.studentOrderIds;
		const firstQ = plan.questionSchedule[firstId!]![0];
		const secondQ = plan.questionSchedule[secondId!]![0];
		expect(firstQ).not.toBe(secondQ);
	});

	it('prefers unanswered/wrong over partial over success for the same student', () => {
		const attempts: Attempt[] = [
			{
				id: '1',
				session_id: 'old',
				student_id: 'a',
				question_id: 'q-partial',
				outcome: 'partial',
				answered_at: 100
			},
			{
				id: '2',
				session_id: 'old',
				student_id: 'a',
				question_id: 'q-wrong',
				outcome: 'wrong',
				answered_at: 200
			},
			{
				id: '3',
				session_id: 'old',
				student_id: 'a',
				question_id: 'q-ok',
				outcome: 'correct',
				answered_at: 300
			}
		];
		const plan = computeSessionPlan({
			sessionId: 'tier-test',
			startedAt: 1,
			nQuestionsPerStudent: 3,
			enrolledStudentIds: ['a'],
			students: [st('a')],
			questionPool: [q('q-partial'), q('q-wrong'), q('q-ok'), q('q-new')],
			attemptsForTiering: attempts
		});
		const row = plan.questionSchedule['a']!;
		const tier1 = new Set(['q-partial', 'q-wrong', 'q-new']);
		expect(tier1.has(row[0]!)).toBe(true);
	});

	it('is deterministic for the same session id and startedAt', () => {
		const input = {
			sessionId: 'det',
			startedAt: 12345,
			nQuestionsPerStudent: 2,
			enrolledStudentIds: ['x', 'y'],
			students: [st('x'), st('y')],
			questionPool: [q('A'), q('B'), q('C')],
			attemptsForTiering: [] as Attempt[]
		};
		const a = computeSessionPlan(input);
		const b = computeSessionPlan(input);
		expect(a.studentOrderIds).toEqual(b.studentOrderIds);
		expect(a.questionSchedule).toEqual(b.questionSchedule);
	});
});
