import { listClassrooms, listStudentsByClassroom } from '$lib/db/index.js';
import type { Classroom } from '$lib/db/types.js';

export type ClassroomWithCount = Classroom & { studentCount: number };

export async function loadClassroomsIndex(): Promise<{ classrooms: ClassroomWithCount[] }> {
	const dbClassrooms = await listClassrooms();
	const withCounts = await Promise.all(
		dbClassrooms.map(async (c) => {
			const students = await listStudentsByClassroom(c.id);
			return { ...c, studentCount: students.length };
		})
	);
	const classrooms = withCounts.sort((a, b) => b.created_at - a.created_at);
	return { classrooms };
}
