import type { ParsedQuestionSet } from '$lib/importer/index.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

export async function persistQuestionSet(
	questionSets: QuestionSetRepository,
	questionSetId: string,
	parsed: ParsedQuestionSet
): Promise<void> {
	for (const q of parsed.questions) {
		const steps = [{ text: q.text, answer: q.answer }, ...(q.chain ?? [])];
		await questionSets.createQuestion(questionSetId, {
			shared: { content: q.content },
			steps,
			...(q.difficulty !== undefined ? { difficulty: q.difficulty } : {})
		});
	}
}
