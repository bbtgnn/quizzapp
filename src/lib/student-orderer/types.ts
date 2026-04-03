import type { Student, SessionStudent } from '$lib/db/types.js';

export type { Student, SessionStudent };

export interface StudentOrderStrategy {
	order(students: Student[], sessionStudents: SessionStudent[]): Student[];
}
