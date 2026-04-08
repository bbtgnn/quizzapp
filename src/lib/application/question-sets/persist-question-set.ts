import type { ParsedQuestionSet } from '$lib/importer/index.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

export async function persistQuestionSet(
	questionSets: QuestionSetRepository,
	questionSetId: string,
	parsed: ParsedQuestionSet
): Promise<void> {
	for (const q of parsed.questions) {
		const rootQ = await questionSets.createQuestion(questionSetId, {
			text: q.text,
			content: q.content,
			answer: q.answer,
			...(q.difficulty !== undefined ? { difficulty: q.difficulty } : {}),
			chain_parent_id: null,
			chain_order: 0
		});

		if (q.chain) {
			for (let i = 0; i < q.chain.length; i++) {
				await questionSets.createQuestion(questionSetId, {
					text: q.chain[i].text,
					content: q.content, // chain items inherit parent's content
					answer: q.chain[i].answer,
					chain_parent_id: rootQ.id,
					chain_order: i + 1
				});
			}
		}
	}
}
