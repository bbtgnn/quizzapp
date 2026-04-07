import type { Classroom } from '$lib/model/types.js';
import type { ClassroomRepository } from '$lib/ports/classroom-repository.js';

export type ClassroomWithCount = Classroom & { studentCount: number };

export async function loadClassroomsIndex(
	classrooms: ClassroomRepository
): Promise<{ classrooms: ClassroomWithCount[] }> {
	const dbClassrooms = await classrooms.listClassrooms();
	const withCounts = await Promise.all(
		dbClassrooms.map(async (c) => {
			const students = await classrooms.listStudentsByClassroom(c.id);
			return { ...c, studentCount: students.length };
		})
	);
	const sorted = withCounts.sort((a, b) => b.created_at - a.created_at);
	return { classrooms: sorted };
}
