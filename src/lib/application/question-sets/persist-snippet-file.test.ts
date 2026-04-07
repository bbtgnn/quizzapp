import { describe, it, expect, vi } from 'vitest';
import type { ParsedSnippetFile } from '$lib/importer/index.js';
import { persistSnippetFileUnderQuestionSet } from './persist-snippet-file.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';

describe('persistSnippetFileUnderQuestionSet', () => {
	it('creates snippet and questions with optional chain', async () => {
		const createSnippet = vi.fn().mockResolvedValue({
			id: 'sn1',
			question_set_id: 'qs1',
			language: 'ts',
			code: 'x'
		});
		const createQuestion = vi
			.fn()
			.mockResolvedValueOnce({
				id: 'qroot',
				snippet_id: 'sn1',
				text: 'Q1',
				correct_answer: 'A',
				chain_parent_id: null,
				chain_order: 0
			})
			.mockResolvedValue({
				id: 'qchild',
				snippet_id: 'sn1',
				text: 'C1',
				correct_answer: 'B',
				chain_parent_id: 'qroot',
				chain_order: 1
			});

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createSnippet,
			listSnippetsByQuestionSet: vi.fn(),
			deleteSnippetsByQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsBySnippet: vi.fn(),
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsBySnippet: vi.fn()
		};

		const parsed: ParsedSnippetFile = {
			snippet: { language: 'ts', code: 'x' },
			questions: [
				{
					text: 'Q1',
					correctAnswer: 'A',
					chain: [{ text: 'C1', correctAnswer: 'B' }]
				}
			]
		};

		await persistSnippetFileUnderQuestionSet(questionSets, 'qs1', parsed);

		expect(createSnippet).toHaveBeenCalledWith('qs1', {
			language: 'ts',
			code: 'x'
		});
		expect(createQuestion).toHaveBeenNthCalledWith(1, 'sn1', {
			text: 'Q1',
			correct_answer: 'A',
			chain_parent_id: null,
			chain_order: 0
		});
		expect(createQuestion).toHaveBeenNthCalledWith(2, 'sn1', {
			text: 'C1',
			correct_answer: 'B',
			chain_parent_id: 'qroot',
			chain_order: 1
		});
	});
});
