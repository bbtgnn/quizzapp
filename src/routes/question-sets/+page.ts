import { error } from '@sveltejs/kit';
import { questionSetRepository } from '$lib/app/index.js';
import type { QuestionSet } from '$lib/model/types.js';

export type QuestionSetWithCounts = QuestionSet & { snippetCount: number; questionCount: number };

export const load = async () => {
	try {
		const dbQuestionSets = await questionSetRepository.listQuestionSets();
		const withCounts: QuestionSetWithCounts[] = await Promise.all(
			dbQuestionSets.map(async (qs) => {
				const [snippets, questions] = await Promise.all([
					questionSetRepository.listSnippetsByQuestionSet(qs.id),
					questionSetRepository.listQuestionsByQuestionSet(qs.id)
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
