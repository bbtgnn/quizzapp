import { error } from '@sveltejs/kit';
import {
	classroomRepository,
	attemptRepository,
	questionSetRepository,
	sessionRepository
} from '$lib/app/index.js';
import type { Question } from '$lib/model/types.js';

export const load = async ({ params }) => {
	const sessionId = params.id;
	if (!sessionId) throw error(404, { message: 'Session not found' });

	try {
		const session = await sessionRepository.getSession(sessionId);
		if (!session) throw error(404, { message: 'Session not found' });

		const [sessionStudents, students, attempts] = await Promise.all([
			sessionRepository.listSessionStudents(sessionId),
			classroomRepository.listStudentsByClassroom(session.classroom_id),
			attemptRepository.listAttemptsBySession(sessionId)
		]);

		const planningAttempts = (
			await Promise.all(students.map((s) => attemptRepository.listAttemptsByStudent(s.id)))
		).flat();

		const allQuestions: Question[] = [];
		for (const qsId of session.question_set_ids) {
			const qs = await questionSetRepository.listQuestionsByQuestionSet(qsId);
			allQuestions.push(...qs);
		}

		// Keep loader payload shape stable for SessionEngine resume (active_unit_progress stays on session).
		return { session, sessionStudents, students, allQuestions, attempts, planningAttempts };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
			throw e;
		}
		console.error('Failed to load session run data:', e);
		throw error(500, { message: 'Could not load session.' });
	}
};
