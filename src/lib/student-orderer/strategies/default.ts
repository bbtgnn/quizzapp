import type { StudentOrderStrategy } from '../types.js';
import type { Student, SessionStudent } from '$lib/db/types.js';

function fisherYatesShuffle<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

const defaultStrategy: StudentOrderStrategy = {
	order(students: Student[], sessionStudents: SessionStudent[]): Student[] {
		const completedIds = new Set<string>();
		for (const ss of sessionStudents) {
			if (ss.completed) {
				completedIds.add(ss.student_id);
			}
		}

		const remaining = students.filter((s) => !completedIds.has(s.id));
		return fisherYatesShuffle(remaining);
	}
};

export { defaultStrategy };
