import { error } from '@sveltejs/kit';
import { listSessions, getClassroom, listSessionStudents } from '$lib/db/index.js';
import type { Session } from '$lib/db/types.js';

export type PausedSessionView = Session & {
	classroomName: string;
	totalStudents: number;
	completedStudents: number;
};

export const load = async () => {
	try {
		const allSessions = await listSessions();
		const paused = allSessions.filter((s) => s.status === 'paused');
		const completedSessionsCount = allSessions.filter((s) => s.status === 'completed').length;

		const enrichedPaused: PausedSessionView[] = await Promise.all(
			paused.map(async (session) => {
				const classroom = await getClassroom(session.classroom_id);
				const students = await listSessionStudents(session.id);
				const completedStudents = students.filter((s) => s.completed).length;
				return {
					...session,
					classroomName: classroom ? classroom.name : 'Unknown Classroom',
					totalStudents: students.length,
					completedStudents
				};
			})
		);

		enrichedPaused.sort((a, b) => b.started_at - a.started_at);

		return { pausedSessions: enrichedPaused, completedSessionsCount };
	} catch (e) {
		console.error('Failed to load sessions:', e);
		throw error(500, { message: 'Could not load sessions.' });
	}
};
