import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';
import * as impl from './repositories/question-sets.js';

export const dexieQuestionSetRepository: QuestionSetRepository = {
	createQuestionSet: impl.createQuestionSet,
	getQuestionSet: impl.getQuestionSet,
	listQuestionSets: impl.listQuestionSets,
	deleteQuestionSet: impl.deleteQuestionSet,
	createQuestion: impl.createQuestion,
	listQuestionsByQuestionSet: impl.listQuestionsByQuestionSet,
	deleteQuestionsByQuestionSet: impl.deleteQuestionsByQuestionSet
};
