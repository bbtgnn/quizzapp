import { db } from '../schema.js';
import type { Question, QuestionSet } from '$lib/model/types.js';

export async function createQuestionSet(name: string): Promise<QuestionSet> {
	const questionSet: QuestionSet = {
		id: crypto.randomUUID(),
		name,
		imported_at: Date.now()
	};
	await db.questionSets.add(questionSet);
	return questionSet;
}

export async function getQuestionSet(id: string): Promise<QuestionSet | undefined> {
	return db.questionSets.get(id);
}

export async function listQuestionSets(): Promise<QuestionSet[]> {
	return db.questionSets.toArray();
}

export async function deleteQuestionSet(id: string): Promise<void> {
	await db.transaction('rw', [db.questionSets, db.questions], async () => {
		await db.questions.where('question_set_id').equals(id).delete();
		await db.questionSets.delete(id);
	});
}

export async function createQuestion(
	questionSetId: string,
	data: Omit<Question, 'id' | 'question_set_id'>
): Promise<Question> {
	const question: Question = {
		id: crypto.randomUUID(),
		question_set_id: questionSetId,
		...data
	};
	await db.questions.add(question);
	return question;
}

export async function listQuestionsByQuestionSet(questionSetId: string): Promise<Question[]> {
	return db.questions.where('question_set_id').equals(questionSetId).toArray();
}

export async function deleteQuestionsByQuestionSet(questionSetId: string): Promise<void> {
	await db.questions.where('question_set_id').equals(questionSetId).delete();
}
