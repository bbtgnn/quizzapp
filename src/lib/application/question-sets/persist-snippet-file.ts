import type { ParsedSnippetFile } from '$lib/importer/index.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

export async function persistSnippetFileUnderQuestionSet(
	questionSets: QuestionSetRepository,
	questionSetId: string,
	parsed: ParsedSnippetFile
): Promise<void> {
	const { snippet, questions } = parsed;

	const dbSnippet = await questionSets.createSnippet(questionSetId, {
		language: snippet.language,
		code: snippet.code,
		...(snippet.highlight !== undefined ? { highlight: snippet.highlight } : {})
	});

	for (const q of questions) {
		const rootQ = await questionSets.createQuestion(dbSnippet.id, {
			text: q.text,
			correct_answer: q.correctAnswer,
			...(q.difficulty !== undefined ? { difficulty: q.difficulty } : {}),
			chain_parent_id: null,
			chain_order: 0
		});

		if (q.chain) {
			for (let i = 0; i < q.chain.length; i++) {
				await questionSets.createQuestion(dbSnippet.id, {
					text: q.chain[i].text,
					correct_answer: q.chain[i].correctAnswer,
					chain_parent_id: rootQ.id,
					chain_order: i + 1
				});
			}
		}
	}
}
