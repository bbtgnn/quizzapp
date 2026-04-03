import { db } from '../schema.js';
import type { Question, QuestionSet, Snippet } from '../types.js';

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
	await db.transaction('rw', [db.questionSets, db.snippets, db.questions], async () => {
		const snippets = await db.snippets.where('question_set_id').equals(id).toArray();
		const snippetIds = snippets.map((s) => s.id);
		if (snippetIds.length > 0) {
			await db.questions.where('snippet_id').anyOf(snippetIds).delete();
		}
		await db.snippets.where('question_set_id').equals(id).delete();
		await db.questionSets.delete(id);
	});
}

export async function createSnippet(
	questionSetId: string,
	data: Omit<Snippet, 'id' | 'question_set_id'>
): Promise<Snippet> {
	const snippet: Snippet = {
		id: crypto.randomUUID(),
		question_set_id: questionSetId,
		...data
	};
	await db.snippets.add(snippet);
	return snippet;
}

export async function listSnippetsByQuestionSet(questionSetId: string): Promise<Snippet[]> {
	return db.snippets.where('question_set_id').equals(questionSetId).toArray();
}

export async function deleteSnippetsByQuestionSet(questionSetId: string): Promise<void> {
	await db.transaction('rw', [db.snippets, db.questions], async () => {
		const snippets = await db.snippets.where('question_set_id').equals(questionSetId).toArray();
		const snippetIds = snippets.map((s) => s.id);
		if (snippetIds.length > 0) {
			await db.questions.where('snippet_id').anyOf(snippetIds).delete();
		}
		await db.snippets.where('question_set_id').equals(questionSetId).delete();
	});
}

export async function createQuestion(
	snippetId: string,
	data: Omit<Question, 'id' | 'snippet_id'>
): Promise<Question> {
	const question: Question = {
		id: crypto.randomUUID(),
		snippet_id: snippetId,
		...data
	};
	await db.questions.add(question);
	return question;
}

export async function listQuestionsBySnippet(snippetId: string): Promise<Question[]> {
	return db.questions.where('snippet_id').equals(snippetId).toArray();
}

export async function listQuestionsByQuestionSet(questionSetId: string): Promise<Question[]> {
	const snippets = await db.snippets.where('question_set_id').equals(questionSetId).toArray();
	const snippetIds = snippets.map((s) => s.id);
	if (snippetIds.length === 0) return [];
	return db.questions.where('snippet_id').anyOf(snippetIds).toArray();
}

export async function deleteQuestionsBySnippet(snippetId: string): Promise<void> {
	await db.questions.where('snippet_id').equals(snippetId).delete();
}
