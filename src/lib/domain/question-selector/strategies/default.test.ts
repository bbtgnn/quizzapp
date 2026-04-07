import { describe, it, expect } from 'vitest';
import { defaultStrategy } from './default.js';
import type { Attempt, Question, Student } from '$lib/model/types.js';

const makeStudent = (id = 's1'): Student => ({
	id,
	classroom_id: 'c1',
	name: 'Test Student'
});

const makeQuestion = (id: string): Question => ({
	id,
	snippet_id: 'snip1',
	text: `Question ${id}`,
	correct_answer: 'answer',
	chain_parent_id: null,
	chain_order: 0
});

const makeAttempt = (
	questionId: string,
	outcome: Attempt['outcome'],
	answeredAt: number,
	studentId = 's1'
): Attempt => ({
	id: `attempt-${questionId}-${answeredAt}`,
	session_id: 'sess1',
	student_id: studentId,
	question_id: questionId,
	outcome,
	answered_at: answeredAt
});

describe('defaultStrategy.pick', () => {
	it('never answered: returns a question from the pool', () => {
		const student = makeStudent();
		const questions = [makeQuestion('q1'), makeQuestion('q2')];
		const result = defaultStrategy.pick(student, [], questions);
		expect(questions.some((q) => q.id === result.id)).toBe(true);
	});

	it('previously wrong: Q1 is returned (prioritised)', () => {
		const student = makeStudent();
		const questions = [makeQuestion('q1'), makeQuestion('q2')];
		const attempts = [makeAttempt('q1', 'wrong', 1000)];
		const result = defaultStrategy.pick(student, attempts, questions);
		expect(result.id).toBe('q1');
	});

	it('previously partial: Q1 is returned (prioritised)', () => {
		const student = makeStudent();
		const questions = [makeQuestion('q1'), makeQuestion('q2')];
		const attempts = [makeAttempt('q1', 'partial', 1000)];
		const result = defaultStrategy.pick(student, attempts, questions);
		expect(result.id).toBe('q1');
	});

	it('previously correct: Q1 is NOT returned (skipped)', () => {
		const student = makeStudent();
		const questions = [makeQuestion('q1'), makeQuestion('q2')];
		const attempts = [makeAttempt('q1', 'correct', 1000)];
		const result = defaultStrategy.pick(student, attempts, questions);
		expect(result.id).not.toBe('q1');
	});

	it('all correct (cycle): returns the one with the EARLIEST answered_at', () => {
		const student = makeStudent();
		const questions = [makeQuestion('q1'), makeQuestion('q2'), makeQuestion('q3')];
		const attempts = [
			makeAttempt('q1', 'correct', 3000),
			makeAttempt('q2', 'correct', 1000),
			makeAttempt('q3', 'correct', 2000)
		];
		const result = defaultStrategy.pick(student, attempts, questions);
		expect(result.id).toBe('q2');
	});

	it('mixed pool: returns one of the wrong/unanswered ones', () => {
		const student = makeStudent();
		const questions = [makeQuestion('q1'), makeQuestion('q2'), makeQuestion('q3')];
		const attempts = [makeAttempt('q1', 'correct', 1000), makeAttempt('q2', 'wrong', 2000)];
		const result = defaultStrategy.pick(student, attempts, questions);
		expect(['q2', 'q3']).toContain(result.id);
	});

	it('multiple attempts: wrong then correct → treated as correct', () => {
		const student = makeStudent();
		const questions = [makeQuestion('q1'), makeQuestion('q2')];
		const attempts = [makeAttempt('q1', 'wrong', 1000), makeAttempt('q1', 'correct', 2000)];
		const result = defaultStrategy.pick(student, attempts, questions);
		expect(result.id).not.toBe('q1');
	});

	it('ignores attempts from other students', () => {
		const student = makeStudent('s1');
		const questions = [makeQuestion('q1')];
		const attempts = [makeAttempt('q1', 'correct', 1000, 's2')];
		const result = defaultStrategy.pick(student, attempts, questions);
		expect(result.id).toBe('q1');
	});
});
