import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Classroom } from '$lib/db/types.js';
import { loadClassroomsIndex } from './classrooms-index.js';

vi.mock('$lib/db/index.js', () => ({
	listClassrooms: vi.fn(),
	listStudentsByClassroom: vi.fn()
}));

import { listClassrooms, listStudentsByClassroom } from '$lib/db/index.js';

describe('loadClassroomsIndex', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns classrooms sorted by created_at descending with studentCount', async () => {
		const a: Classroom = { id: 'a', name: 'Old', created_at: 100 };
		const b: Classroom = { id: 'b', name: 'New', created_at: 200 };
		vi.mocked(listClassrooms).mockResolvedValue([a, b]);
		vi.mocked(listStudentsByClassroom).mockImplementation(async (classroomId: string) =>
			classroomId === 'a' ? [{ id: 's1', classroom_id: 'a', name: 'x' }] : []
		);

		const { classrooms } = await loadClassroomsIndex();

		expect(classrooms).toHaveLength(2);
		expect(classrooms[0].id).toBe('b');
		expect(classrooms[1].id).toBe('a');
		expect(classrooms[1].studentCount).toBe(1);
		expect(classrooms[0].studentCount).toBe(0);
	});
});
