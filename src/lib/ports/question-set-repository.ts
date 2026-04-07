import type { Question, QuestionSet, Snippet } from '$lib/model/types.js';

export interface QuestionSetRepository {
	createQuestionSet(name: string): Promise<QuestionSet>;
	getQuestionSet(id: string): Promise<QuestionSet | undefined>;
	listQuestionSets(): Promise<QuestionSet[]>;
	deleteQuestionSet(id: string): Promise<void>;
	createSnippet(
		questionSetId: string,
		data: Omit<Snippet, 'id' | 'question_set_id'>
	): Promise<Snippet>;
	listSnippetsByQuestionSet(questionSetId: string): Promise<Snippet[]>;
	deleteSnippetsByQuestionSet(questionSetId: string): Promise<void>;
	createQuestion(
		snippetId: string,
		data: Omit<Question, 'id' | 'snippet_id'>
	): Promise<Question>;
	listQuestionsBySnippet(snippetId: string): Promise<Question[]>;
	listQuestionsByQuestionSet(questionSetId: string): Promise<Question[]>;
	deleteQuestionsBySnippet(snippetId: string): Promise<void>;
}
