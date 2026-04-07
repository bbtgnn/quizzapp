import type { Student, SessionStudent } from '$lib/model/types.js';

export type { Student, SessionStudent };

export interface StudentOrderStrategy {
	order(students: Student[], sessionStudents: SessionStudent[]): Student[];
}
