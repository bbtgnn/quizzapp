import { describe, it, expect } from 'vitest';
import { parseQuestionSetFile } from './index.js';

const validQuestionSet = JSON.stringify({
	name: 'TypeScript Basics',
	questions: [
		{
			text: 'How many arguments does this function take?',
			content: {
				type: 'code-snippet',
				language: 'typescript',
				code: 'function add(a: number, b: number): number {\n  return a + b;\n}'
			},
			answer: { type: 'open' }
		}
	]
});

describe('parseQuestionSetFile', () => {
	it('parses a valid question set file', () => {
		const result = parseQuestionSetFile(validQuestionSet);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.name).toBe('TypeScript Basics');
		expect(result.data.questions).toHaveLength(1);
		expect(result.data.questions[0].text).toBe('How many arguments does this function take?');
		expect(result.data.questions[0].content).toEqual({
			type: 'code-snippet',
			language: 'typescript',
			code: 'function add(a: number, b: number): number {\n  return a + b;\n}'
		});
		expect(result.data.questions[0].answer).toEqual({ type: 'open' });
	});

	it('parses a valid question set with chain questions', () => {
		const input = JSON.stringify({
			name: 'Python Basics',
			questions: [
				{
					text: 'What does this function return?',
					content: {
						type: 'code-snippet',
						language: 'python',
						code: 'def greet(name): return f"Hello {name}"'
					},
					answer: { type: 'open' },
					chain: [
						{ text: 'What is the parameter name?', answer: { type: 'open' } },
						{ text: 'What format string prefix is used?', answer: { type: 'open' } }
					]
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].chain).toHaveLength(2);
		expect(result.data.questions[0].chain![0].text).toBe('What is the parameter name?');
		expect(result.data.questions[0].chain![0].answer).toEqual({ type: 'open' });
		expect(result.data.questions[0].chain![1].text).toBe('What format string prefix is used?');
	});

	it('parses a valid question set with highlight range', () => {
		const input = JSON.stringify({
			name: 'JS Highlights',
			questions: [
				{
					text: 'What is x?',
					content: {
						type: 'code-snippet',
						language: 'javascript',
						code: 'const x = 1;\nconst y = 2;',
						highlight: { startLine: 1, endLine: 1 }
					},
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].content).toEqual({
			type: 'code-snippet',
			language: 'javascript',
			code: 'const x = 1;\nconst y = 2;',
			highlight: { startLine: 1, endLine: 1 }
		});
	});

	it('returns error when name is missing', () => {
		const input = JSON.stringify({
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/name/);
	});

	it('returns error when content.language is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', code: 'x' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/language/);
	});

	it('returns error when content is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [{ text: 'Q?', answer: { type: 'open' } }]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/content/);
	});

	it('returns error when answer is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/answer/);
	});

	it('returns error when question.text is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/questions\[0\]\.text/);
	});

	it('returns error for malformed JSON', () => {
		const result = parseQuestionSetFile('{not valid json');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/Invalid JSON/);
	});

	it('returns error when questions array is empty', () => {
		const input = JSON.stringify({ name: 'Empty', questions: [] });
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/at least one/);
	});

	it('returns error when highlight is missing endLine', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: {
						type: 'code-snippet',
						language: 'js',
						code: 'const x = 1;',
						highlight: { startLine: 1 }
					},
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/endLine/);
	});

	it('returns error when chain item is missing answer', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'open' },
					chain: [{ text: 'Follow-up question' }]
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/chain\[0\]\.answer/);
	});

	it('returns error for unsupported content type', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'image', url: 'https://example.com/img.png' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/not supported/);
	});

	it('returns error for unsupported answer type', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'essay' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/not supported/);
	});

	// --- New content types ---

	it('parses a markdown content question', () => {
		const input = JSON.stringify({
			name: 'Markdown Test',
			questions: [
				{
					text: 'What does idempotent mean?',
					content: { type: 'markdown', body: '**Idempotent** means applying an operation multiple times yields the same result.' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].content).toEqual({
			type: 'markdown',
			body: '**Idempotent** means applying an operation multiple times yields the same result.'
		});
	});

	it('returns error when markdown content body is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'markdown' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/body/);
	});

	it('returns error when markdown content body is empty', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'markdown', body: '   ' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/body/);
	});

	// --- New answer types: multiple-choice ---

	it('parses a multiple-choice answer', () => {
		const input = JSON.stringify({
			name: 'MC Test',
			questions: [
				{
					text: 'Which is a primitive type in JS?',
					content: { type: 'code-snippet', language: 'js', code: 'typeof x' },
					answer: { type: 'multiple-choice', options: ['string', 'array', 'object', 'function'], correctIndex: 0 }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].answer).toEqual({
			type: 'multiple-choice',
			options: ['string', 'array', 'object', 'function'],
			correctIndex: 0
		});
	});

	it('returns error when MC options is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'multiple-choice', correctIndex: 0 }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/options/);
	});

	it('returns error when MC options has fewer than 2 items', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'multiple-choice', options: ['only one'], correctIndex: 0 }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/at least 2/);
	});

	it('returns error when MC options contains a non-string item', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'multiple-choice', options: ['a', 42], correctIndex: 0 }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/options\[1\]/);
	});

	it('returns error when MC correctIndex is out of bounds', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'multiple-choice', options: ['a', 'b'], correctIndex: 5 }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/correctIndex/);
	});

	it('returns error when MC correctIndex is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'multiple-choice', options: ['a', 'b'] }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/correctIndex/);
	});

	// --- New answer types: true-false ---

	it('parses a true-false answer with correctAnswer: true', () => {
		const input = JSON.stringify({
			name: 'TF Test',
			questions: [
				{
					text: 'Is JS single-threaded?',
					content: { type: 'markdown', body: 'JavaScript runs on a single thread.' },
					answer: { type: 'true-false', correctAnswer: true }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].answer).toEqual({ type: 'true-false', correctAnswer: true });
	});

	it('parses a true-false answer with correctAnswer: false', () => {
		const input = JSON.stringify({
			name: 'TF Test',
			questions: [
				{
					text: 'Is Python compiled?',
					content: { type: 'markdown', body: 'Python is interpreted.' },
					answer: { type: 'true-false', correctAnswer: false }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].answer).toEqual({ type: 'true-false', correctAnswer: false });
	});

	it('returns error when TF correctAnswer is missing', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'true-false' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/correctAnswer/);
	});

	it('returns error when TF correctAnswer is not a boolean', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'true-false', correctAnswer: 'yes' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/correctAnswer/);
	});

	// --- Chain items with new answer types ---

	it('parses a chain item with multiple-choice answer', () => {
		const input = JSON.stringify({
			name: 'Chain MC',
			questions: [
				{
					text: 'What does this do?',
					content: { type: 'code-snippet', language: 'js', code: 'Array.isArray([])' },
					answer: { type: 'open' },
					chain: [
						{
							text: 'What does it return?',
							answer: { type: 'multiple-choice', options: ['true', 'false', 'undefined'], correctIndex: 0 }
						}
					]
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].chain![0].answer).toEqual({
			type: 'multiple-choice',
			options: ['true', 'false', 'undefined'],
			correctIndex: 0
		});
	});

	it('parses a chain item with true-false answer', () => {
		const input = JSON.stringify({
			name: 'Chain TF',
			questions: [
				{
					text: 'What does this do?',
					content: { type: 'code-snippet', language: 'js', code: 'typeof null === "object"' },
					answer: { type: 'open' },
					chain: [
						{
							text: 'Is this a known JS quirk?',
							answer: { type: 'true-false', correctAnswer: true }
						}
					]
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].chain![0].answer).toEqual({
			type: 'true-false',
			correctAnswer: true
		});
	});

	it('parses a mixed question set with all content and answer types', () => {
		const input = JSON.stringify({
			name: 'Mixed Set',
			questions: [
				{
					text: 'MC with markdown',
					content: { type: 'markdown', body: 'Which value is falsy?' },
					answer: { type: 'multiple-choice', options: ['0', '1', '2'], correctIndex: 0 }
				},
				{
					text: 'TF with code-snippet',
					content: { type: 'code-snippet', language: 'js', code: 'Boolean(0)' },
					answer: { type: 'true-false', correctAnswer: false }
				},
				{
					text: 'Open with markdown',
					content: { type: 'markdown', body: 'Explain closures.' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions).toHaveLength(3);
		expect(result.data.questions[0].content.type).toBe('markdown');
		expect(result.data.questions[0].answer.type).toBe('multiple-choice');
		expect(result.data.questions[1].answer.type).toBe('true-false');
		expect(result.data.questions[2].answer.type).toBe('open');
	});

	it('parses difficulty field when present', () => {
		const input = JSON.stringify({
			name: 'Test',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'ts', code: 'const x: number = 1;' },
					answer: { type: 'open' },
					difficulty: 'easy'
				}
			]
		});
		const result = parseQuestionSetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].difficulty).toBe('easy');
	});
});
