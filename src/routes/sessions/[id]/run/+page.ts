import { error } from '@sveltejs/kit';
import {
	classroomRepository,
	attemptRepository,
	questionSetRepository,
	sessionRepository
} from '$lib/app/index.js';
import type { Question, Snippet } from '$lib/model/types.js';

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

		const snippetByQuestionId: Record<string, Snippet> = {};
		const allQuestions: Question[] = [];

		for (const qsId of session.question_set_ids) {
			const snippets = await questionSetRepository.listSnippetsByQuestionSet(qsId);
			for (const snippet of snippets) {
				const qs = await questionSetRepository.listQuestionsBySnippet(snippet.id);
				for (const q of qs) {
					snippetByQuestionId[q.id] = snippet;
				}
				allQuestions.push(...qs);
			}
		}

		return { session, sessionStudents, students, allQuestions, attempts, snippetByQuestionId };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
			throw e;
		}
		console.error('Failed to load session run data:', e);
		throw error(500, { message: 'Could not load session.' });
	}
};
