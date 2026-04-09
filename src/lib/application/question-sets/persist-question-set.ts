import type { QuestionSetFile } from '$lib/importer/index.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

export async function persistQuestionSet(
	questionSets: QuestionSetRepository,
	questionSetId: string,
	questionSetFile: QuestionSetFile
): Promise<void> {
	await questionSets.deleteQuestionsByQuestionSet(questionSetId);

	for (const question of questionSetFile.questions) {
		await questionSets.createQuestion(questionSetId, {
			...(question.shared !== undefined ? { shared: question.shared } : {}),
			steps: question.steps,
			...(question.difficulty !== undefined ? { difficulty: question.difficulty } : {})
		});
	}
}
