import { error } from '@sveltejs/kit';
import {
	listQuestionSets,
	listSnippetsByQuestionSet,
	listQuestionsByQuestionSet
} from '$lib/db/index.js';
import type { QuestionSet } from '$lib/db/types.js';

export type QuestionSetWithCounts = QuestionSet & { snippetCount: number; questionCount: number };

export const load = async () => {
	try {
		const dbQuestionSets = await listQuestionSets();
		const withCounts: QuestionSetWithCounts[] = await Promise.all(
			dbQuestionSets.map(async (qs) => {
				const [snippets, questions] = await Promise.all([
					listSnippetsByQuestionSet(qs.id),
					listQuestionsByQuestionSet(qs.id)
				]);
				return { ...qs, snippetCount: snippets.length, questionCount: questions.length };
			})
		);
		withCounts.sort((a, b) => b.imported_at - a.imported_at);
		return { questionSets: withCounts };
	} catch (e) {
		console.error('Failed to load question sets:', e);
		throw error(500, { message: 'Could not load question sets.' });
	}
};
