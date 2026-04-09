import { describe, it, expect, vi } from 'vitest';
import { parseQuestionSetFile } from '$lib/importer/index.js';
import type { ParsedQuestionSet } from '$lib/importer/index.js';
import { persistQuestionSet } from './persist-question-set.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';
import type { ContentConfig } from '$lib/model/types.js';

describe('persistQuestionSet', () => {
	it('creates questions with content and answer configs, including chain', async () => {
		const content: ContentConfig = { type: 'code-snippet', language: 'ts', code: 'x' };

		const createQuestion = vi.fn().mockResolvedValue({
			id: 'qroot',
			question_set_id: 'qs1',
			shared: { content },
			steps: [
				{ text: 'Q1', answer: { type: 'open' } },
				{ text: 'C1', answer: { type: 'open' } }
			]
		});

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsByQuestionSet: vi.fn()
		};

		const parsed: ParsedQuestionSet = {
			name: 'Test Set',
			questions: [
				{
					text: 'Q1',
					content,
					answer: { type: 'open' },
					chain: [{ text: 'C1', answer: { type: 'open' } }]
				}
			]
		};

		await persistQuestionSet(questionSets, 'qs1', parsed);

		expect(createQuestion).toHaveBeenCalledTimes(1);
		expect(createQuestion).toHaveBeenNthCalledWith(1, 'qs1', {
			shared: { content },
			steps: [
				{ text: 'Q1', answer: { type: 'open' } },
				{ text: 'C1', answer: { type: 'open' } }
			]
		});
	});

	it('creates standalone questions without chain', async () => {
		const content: ContentConfig = { type: 'code-snippet', language: 'py', code: 'print(1)' };

		const createQuestion = vi.fn().mockResolvedValue({
			id: 'q1',
			question_set_id: 'qs1',
			shared: { content },
			steps: [{ text: 'Q1', answer: { type: 'open' } }]
		});

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsByQuestionSet: vi.fn()
		};

		const parsed: ParsedQuestionSet = {
			name: 'Test',
			questions: [
				{ text: 'Q1', content, answer: { type: 'open' } },
				{ text: 'Q2', content, answer: { type: 'open' }, difficulty: 'hard' }
			]
		};

		await persistQuestionSet(questionSets, 'qs1', parsed);

		expect(createQuestion).toHaveBeenCalledTimes(2);
		expect(createQuestion).toHaveBeenNthCalledWith(2, 'qs1', {
			shared: { content },
			steps: [{ text: 'Q2', answer: { type: 'open' } }],
			difficulty: 'hard'
		});
	});

	it('persists multi-step logical import after parseQuestionSetFile bridge', async () => {
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
		const parsed = parsedResult.data;

		const rootContent: ContentConfig = {
			type: 'code-snippet',
			language: 'ts',
			code: 'line1\nline2',
			highlight: { startLine: 1, endLine: 1 }
		};

		const createQuestion = vi.fn().mockResolvedValue({
			id: 'qroot',
			question_set_id: 'qs1',
			shared: { content: rootContent },
			steps: [
				{ text: 'Root prompt', answer: { type: 'open' } },
				{ text: 'Chain prompt', answer: { type: 'open', referenceAnswer: 'ref' } }
			]
		});

		const questionSets: QuestionSetRepository = {
			createQuestionSet: vi.fn(),
			getQuestionSet: vi.fn(),
			listQuestionSets: vi.fn(),
			deleteQuestionSet: vi.fn(),
			createQuestion,
			listQuestionsByQuestionSet: vi.fn(),
			deleteQuestionsByQuestionSet: vi.fn()
		};

		await persistQuestionSet(questionSets, 'qs1', parsed);

		expect(createQuestion).toHaveBeenCalledTimes(1);
		expect(createQuestion).toHaveBeenNthCalledWith(1, 'qs1', {
			shared: { content: rootContent },
			steps: [
				{ text: 'Root prompt', answer: { type: 'open' } },
				{ text: 'Chain prompt', answer: { type: 'open', referenceAnswer: 'ref' } }
			]
		});
	});
});
