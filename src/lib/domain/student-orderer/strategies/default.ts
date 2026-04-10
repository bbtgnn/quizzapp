import type { StudentOrderStrategy } from '../types.js';
import type { Student, SessionStudent } from '$lib/model/types.js';

const defaultStrategy: StudentOrderStrategy = {
	order(students: Student[], sessionStudents: SessionStudent[]): Student[] {
		const completedIds = new Set<string>();
		for (const ss of sessionStudents) {
			if (ss.completed) {
				completedIds.add(ss.student_id);
			}
		}

		const remaining = students.filter((s) => !completedIds.has(s.id));
		// Stable by id so session resume / refresh does not reshuffle turn order (see SessionEngine).
		return [...remaining].sort((a, b) => a.id.localeCompare(b.id));
	}
};

export { defaultStrategy };
