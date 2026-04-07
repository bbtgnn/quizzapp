import { error } from '@sveltejs/kit';
import { listSessions, getClassroom, listAttemptsBySession } from '$lib/db/index.js';
import type { Session } from '$lib/db/types.js';

export type SessionWithDetails = Session & {
	classroomName: string;
	studentCount: number;
	attemptCount: number;
};

export const load = async () => {
	try {
		const allSessions = await listSessions();
		const completedSessions = allSessions.filter((s) => s.status === 'completed');

		const withDetails: SessionWithDetails[] = await Promise.all(
			completedSessions.map(async (s) => {
				const classroom = await getClassroom(s.classroom_id);
				const attempts = await listAttemptsBySession(s.id);
				const uniqueStudents = new Set(attempts.map((a) => a.student_id));

				return {
					...s,
					classroomName: classroom?.name || 'Unknown Classroom',
					studentCount: uniqueStudents.size,
					attemptCount: attempts.length
				};
			})
		);

		withDetails.sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0));
		return { sessions: withDetails };
	} catch (e) {
		console.error('Failed to load sessions:', e);
		throw error(500, { message: 'Could not load history.' });
	}
};
