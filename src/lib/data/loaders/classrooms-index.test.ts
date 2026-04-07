import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Classroom } from '$lib/model/types.js';
import { loadClassroomsIndex } from './classrooms-index.js';
import type { ClassroomRepository } from '$lib/ports/classroom-repository.js';

describe('loadClassroomsIndex', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns classrooms sorted by created_at descending with studentCount', async () => {
		const a: Classroom = { id: 'a', name: 'Old', created_at: 100 };
		const b: Classroom = { id: 'b', name: 'New', created_at: 200 };
		const listClassrooms = vi.fn().mockResolvedValue([a, b]);
		const listStudentsByClassroom = vi.fn().mockImplementation(async (classroomId: string) =>
			classroomId === 'a' ? [{ id: 's1', classroom_id: 'a', name: 'x' }] : []
		);
		const classrooms: ClassroomRepository = {
			createClassroom: vi.fn(),
			getClassroom: vi.fn(),
			listClassrooms,
			updateClassroom: vi.fn(),
			deleteClassroom: vi.fn(),
			createStudent: vi.fn(),
			getStudent: vi.fn(),
			listStudentsByClassroom,
			updateStudent: vi.fn(),
			deleteStudent: vi.fn()
		};

		const { classrooms: result } = await loadClassroomsIndex(classrooms);

		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('b');
		expect(result[1].id).toBe('a');
		expect(result[1].studentCount).toBe(1);
		expect(result[0].studentCount).toBe(0);
	});
});
