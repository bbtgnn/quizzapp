import { error } from '@sveltejs/kit';
import {
	getSession,
	listAttemptsBySession,
	listStudentsByClassroom,
	listQuestionsByQuestionSet
} from '$lib/db/index.js';
import type { Attempt, Question, Student } from '$lib/db/types.js';

export type AttemptWithDetails = Attempt & { questionText: string };
export type StudentWithAttempts = Student & { attempts: AttemptWithDetails[] };

export const load = async ({ params }) => {
	const sessionId = params.id;
	if (!sessionId) throw error(404, { message: 'Session not found' });

	try {
		const loadedSession = await getSession(sessionId);
		if (!loadedSession) throw error(404, { message: 'Session not found' });

		const [attempts, students] = await Promise.all([
			listAttemptsBySession(sessionId),
			listStudentsByClassroom(loadedSession.classroom_id)
		]);

		const questionsMap = new Map<string, Question>();
		for (const qsId of loadedSession.question_set_ids) {
			const qsQuestions = await listQuestionsByQuestionSet(qsId);
			for (const q of qsQuestions) questionsMap.set(q.id, q);
		}

		const grouped: StudentWithAttempts[] = students
			.map((student) => {
				const studentAttempts = attempts
					.filter((a) => a.student_id === student.id)
					.map((a) => ({
						...a,
						questionText: questionsMap.get(a.question_id)?.text || 'Unknown Question'
					}))
					.sort((a, b) => a.answered_at - b.answered_at);

				return { ...student, attempts: studentAttempts };
			})
			.filter((s) => s.attempts.length > 0);

		return { session: loadedSession, studentsWithAttempts: grouped };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
			throw e;
		}
		console.error('Failed to load session details:', e);
		throw error(500, { message: 'Could not load session details.' });
	}
};
