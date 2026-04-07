import type { Question, QuestionSet } from '$lib/model/types.js';

export interface QuestionSetRepository {
	createQuestionSet(name: string): Promise<QuestionSet>;
	getQuestionSet(id: string): Promise<QuestionSet | undefined>;
	listQuestionSets(): Promise<QuestionSet[]>;
	deleteQuestionSet(id: string): Promise<void>;
	createQuestion(
		questionSetId: string,
		data: Omit<Question, 'id' | 'question_set_id'>
	): Promise<Question>;
	listQuestionsByQuestionSet(questionSetId: string): Promise<Question[]>;
	deleteQuestionsByQuestionSet(questionSetId: string): Promise<void>;
}
