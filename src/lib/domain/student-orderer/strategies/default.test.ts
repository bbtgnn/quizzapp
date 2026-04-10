import { describe, it, expect } from 'vitest';
import { defaultStrategy } from './default.js';
import type { Student, SessionStudent } from '$lib/model/types.js';

const makeStudent = (id: string): Student => ({
	id,
	classroom_id: 'c1',
	name: `Student ${id}`
});

const makeSessionStudent = (studentId: string, completed: boolean): SessionStudent => ({
	id: `ss-${studentId}`,
	session_id: 'sess1',
	student_id: studentId,
	completed,
	question_slots_remaining: completed ? 0 : 3
});

describe('defaultStrategy.order', () => {
	it('all students remaining: returns all students sorted by id (stable for session resume)', () => {
		const students = [makeStudent('s3'), makeStudent('s1'), makeStudent('s2')];
		const sessionStudents = [
			makeSessionStudent('s1', false),
			makeSessionStudent('s2', false),
			makeSessionStudent('s3', false)
		];

		const result = defaultStrategy.order(students, sessionStudents);

		expect(result.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
	});

	it('some students completed: returns only the remaining student', () => {
		const students = [makeStudent('s1'), makeStudent('s2'), makeStudent('s3')];
		const sessionStudents = [
			makeSessionStudent('s1', true),
			makeSessionStudent('s2', true),
			makeSessionStudent('s3', false)
		];

		const result = defaultStrategy.order(students, sessionStudents);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('s3');
	});

	it('all students completed: returns empty array', () => {
		const students = [makeStudent('s1'), makeStudent('s2')];
		const sessionStudents = [makeSessionStudent('s1', true), makeSessionStudent('s2', true)];

		const result = defaultStrategy.order(students, sessionStudents);

		expect(result).toHaveLength(0);
	});

	it('single student remaining: returns array with just that student', () => {
		const students = [makeStudent('s1'), makeStudent('s2')];
		const sessionStudents = [makeSessionStudent('s1', true), makeSessionStudent('s2', false)];

		const result = defaultStrategy.order(students, sessionStudents);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('s2');
	});

	it('no SessionStudent records: all students treated as remaining, sorted by id', () => {
		const students = [makeStudent('s3'), makeStudent('s1'), makeStudent('s2')];
		const sessionStudents: SessionStudent[] = [];

		const result = defaultStrategy.order(students, sessionStudents);

		expect(result.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
	});
});
