import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';
import * as impl from './repositories/question-sets.js';

export const dexieQuestionSetRepository: QuestionSetRepository = {
	createQuestionSet: impl.createQuestionSet,
	getQuestionSet: impl.getQuestionSet,
	listQuestionSets: impl.listQuestionSets,
	deleteQuestionSet: impl.deleteQuestionSet,
	createSnippet: impl.createSnippet,
	listSnippetsByQuestionSet: impl.listSnippetsByQuestionSet,
	deleteSnippetsByQuestionSet: impl.deleteSnippetsByQuestionSet,
	createQuestion: impl.createQuestion,
	listQuestionsBySnippet: impl.listQuestionsBySnippet,
	listQuestionsByQuestionSet: impl.listQuestionsByQuestionSet,
	deleteQuestionsBySnippet: impl.deleteQuestionsBySnippet
};
