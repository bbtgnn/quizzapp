import { describe, it, expect } from 'vitest';
import { parseSnippetFile } from './index.js';

const validSnippetFile = JSON.stringify({
	snippet: {
		language: 'typescript',
		code: 'function add(a: number, b: number): number {\n  return a + b;\n}'
	},
	questions: [
		{
			text: 'How many arguments does this function take?',
			correctAnswer: '2'
		}
	]
});

describe('parseSnippetFile', () => {
	it('parses a valid snippet file', () => {
		const result = parseSnippetFile(validSnippetFile);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.snippet.language).toBe('typescript');
		expect(result.data.snippet.code).toContain('function add');
		expect(result.data.questions).toHaveLength(1);
		expect(result.data.questions[0].text).toBe('How many arguments does this function take?');
		expect(result.data.questions[0].correctAnswer).toBe('2');
	});

	it('parses a valid snippet with chain questions', () => {
		const input = JSON.stringify({
			snippet: { language: 'python', code: 'def greet(name): return f"Hello {name}"' },
			questions: [
				{
					text: 'What does this function return?',
					correctAnswer: 'a greeting string',
					chain: [
						{ text: 'What is the parameter name?', correctAnswer: 'name' },
						{ text: 'What format string prefix is used?', correctAnswer: 'f' }
					]
				}
			]
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].chain).toHaveLength(2);
		expect(result.data.questions[0].chain![0].text).toBe('What is the parameter name?');
		expect(result.data.questions[0].chain![1].correctAnswer).toBe('f');
	});

	it('parses a valid snippet with highlight range', () => {
		const input = JSON.stringify({
			snippet: {
				language: 'javascript',
				code: 'const x = 1;\nconst y = 2;',
				highlight: { startLine: 1, endLine: 1 }
			},
			questions: [{ text: 'What is x?', correctAnswer: '1' }]
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.snippet.highlight).toEqual({ startLine: 1, endLine: 1 });
	});

	it('returns error when snippet.language is missing', () => {
		const input = JSON.stringify({
			snippet: { code: 'const x = 1;' },
			questions: [{ text: 'What is x?', correctAnswer: '1' }]
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/snippet\.language/);
	});

	it('returns error when question.text is missing', () => {
		const input = JSON.stringify({
			snippet: { language: 'js', code: 'const x = 1;' },
			questions: [{ correctAnswer: '1' }]
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/questions\[0\]\.text/);
	});

	it('returns error for malformed JSON', () => {
		const result = parseSnippetFile('{not valid json');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/Invalid JSON/);
	});

	it('returns error when questions array is empty', () => {
		const input = JSON.stringify({
			snippet: { language: 'js', code: 'const x = 1;' },
			questions: []
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/at least one/);
	});

	it('returns error when highlight is missing endLine', () => {
		const input = JSON.stringify({
			snippet: {
				language: 'js',
				code: 'const x = 1;',
				highlight: { startLine: 1 }
			},
			questions: [{ text: 'What is x?', correctAnswer: '1' }]
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/endLine/);
	});

	it('returns error when chain item is missing correctAnswer', () => {
		const input = JSON.stringify({
			snippet: { language: 'js', code: 'const x = 1;' },
			questions: [
				{
					text: 'What is x?',
					correctAnswer: '1',
					chain: [{ text: 'Follow-up question' }]
				}
			]
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/chain\[0\]\.correctAnswer/);
	});

	it('parses difficulty field when present', () => {
		const input = JSON.stringify({
			snippet: { language: 'ts', code: 'const x: number = 1;' },
			questions: [{ text: 'What is x?', correctAnswer: '1', difficulty: 'easy' }]
		});
		const result = parseSnippetFile(input);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].difficulty).toBe('easy');
	});
});
