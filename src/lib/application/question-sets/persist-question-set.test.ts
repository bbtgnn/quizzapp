import { describe, it, expect, vi } from 'vitest';
import { parseQuestionSetFile } from '$lib/importer/index.js';
import type { QuestionSetFile } from '$lib/importer/index.js';
import { persistQuestionSet } from './persist-question-set.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

describe('persistQuestionSet', () => {
	it('deletes existing questions before inserting logical rows', async () => {
		const createQuestion = vi.fn().mockResolvedValue({
			id: 'q1',
			question_set_id: 'qs1',
			steps: [{ text: 'Q1', answer: { type: 'open' } }]
		});
		const deleteQuestionsByQuestionSet = vi.fn().mockResolvedValue(undefined);

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsByQuestionSet
		};

		const questionSetFile: QuestionSetFile = {
			name: 'Test Set',
			schemaVersion: 1,
			questions: [
				{
					steps: [{ text: 'Q1', answer: { type: 'open' } }]
				}
			]
		};

		await persistQuestionSet(questionSets, 'qs1', questionSetFile);

		expect(deleteQuestionsByQuestionSet).toHaveBeenCalledTimes(1);
		expect(deleteQuestionsByQuestionSet).toHaveBeenCalledWith('qs1');
		expect(createQuestion).toHaveBeenCalledTimes(1);
	});

	it('writes exactly one row for a multi-step logical question', async () => {
		const createQuestion = vi.fn().mockResolvedValue({
			id: 'qroot',
			question_set_id: 'qs1',
			shared: { content: { type: 'code-snippet', language: 'ts', code: 'x' } },
			steps: [
				{ text: 'Step 1', answer: { type: 'open' }, range: { startLine: 1, endLine: 1 } },
				{ text: 'Step 2', answer: { type: 'open' }, range: { startLine: 2, endLine: 2 } }
			]
		});
		const deleteQuestionsByQuestionSet = vi.fn().mockResolvedValue(undefined);

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsByQuestionSet
		};

		const questionSetFile: QuestionSetFile = {
			name: 'Logical set',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'code-snippet', language: 'ts', code: 'x' } },
					steps: [
						{ text: 'Step 1', answer: { type: 'open' }, range: { startLine: 1, endLine: 1 } },
						{ text: 'Step 2', answer: { type: 'open' }, range: { startLine: 2, endLine: 2 } }
					]
				}
			]
		};

		await persistQuestionSet(questionSets, 'qs1', questionSetFile);

		expect(deleteQuestionsByQuestionSet).toHaveBeenCalledTimes(1);
		expect(createQuestion).toHaveBeenCalledTimes(1);
		expect(createQuestion).toHaveBeenCalledWith('qs1', {
			shared: { content: { type: 'code-snippet', language: 'ts', code: 'x' } },
			steps: [
				{ text: 'Step 1', answer: { type: 'open' }, range: { startLine: 1, endLine: 1 } },
				{ text: 'Step 2', answer: { type: 'open' }, range: { startLine: 2, endLine: 2 } }
			]
		});
	});

	it('persists parseQuestionSetFile result with logical contract', async () => {
		const json = JSON.stringify({
			name: 'Logical / multi',
			schemaVersion: 1,
			questions: [
				{
					shared: {
						content: { type: 'code-snippet', language: 'ts', code: 'line1\nline2' }
					},
					steps: [
						{
							text: 'Root prompt',
							answer: { type: 'open' },
							range: { startLine: 1, endLine: 1 }
						},
						{
							text: 'Chain prompt',
							answer: { type: 'open', referenceAnswer: 'ref' },
							range: { startLine: 2, endLine: 2 }
						}
					]
				}
			]
		});

		const parsedResult = parseQuestionSetFile(json);
		expect(parsedResult.ok).toBe(true);
		if (!parsedResult.ok) return;

		const createQuestion = vi.fn().mockResolvedValue({
			id: 'qroot',
			question_set_id: 'qs1',
			shared: parsedResult.data.questions[0]?.shared,
			steps: parsedResult.data.questions[0]?.steps ?? []
		});
		const deleteQuestionsByQuestionSet = vi.fn().mockResolvedValue(undefined);

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsByQuestionSet
		};

		await persistQuestionSet(questionSets, 'qs1', parsedResult.data);

		expect(createQuestion).toHaveBeenCalledTimes(1);
		expect(createQuestion).toHaveBeenCalledWith('qs1', parsedResult.data.questions[0]);
	});
});
