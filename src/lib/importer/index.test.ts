import { describe, it, expect } from 'vitest';
import { parseQuestionSetFile } from './index.js';

function q(json: unknown): string {
	return JSON.stringify(json);
}

describe('parseQuestionSetFile (schemaVersion 1 logical format)', () => {
	it('parses a valid file with shared markdown and one step', () => {
		const raw = q({
			name: 'Set A',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'markdown', body: 'Intro text' } },
					steps: [{ text: 'q1', answer: { type: 'open' } }]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.name).toBe('Set A');
		expect(result.data.questions).toHaveLength(1);
		expect(result.data.questions[0].text).toBe('q1');
		expect(result.data.questions[0].content).toEqual({ type: 'markdown', body: 'Intro text' });
		expect(result.data.questions[0].answer).toEqual({ type: 'open' });
	});

	it('rejects unknown root key (strict object / D-07)', () => {
		const raw = q({
			name: 'X',
			schemaVersion: 1,
			foo: 1,
			questions: [
				{
					shared: { content: { type: 'markdown', body: 'b' } },
					steps: [{ text: 't', answer: { type: 'open' } }]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/foo|\(root\)/);
	});

	it('maps code-snippet shared + two steps with ranges to root highlight and chain', () => {
		const raw = q({
			name: 'Code chain',
			schemaVersion: 1,
			questions: [
				{
					shared: {
						content: { type: 'code-snippet', language: 'js', code: 'const a = 1;\nconst b = 2;' }
					},
					steps: [
						{
							text: 'First',
							answer: { type: 'open' },
							range: { startLine: 1, endLine: 1 }
						},
						{
							text: 'Second',
							answer: { type: 'open' },
							range: { startLine: 2, endLine: 2 }
						}
					]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const q0 = result.data.questions[0];
		expect(q0.content).toEqual({
			type: 'code-snippet',
			language: 'js',
			code: 'const a = 1;\nconst b = 2;',
			highlight: { startLine: 1, endLine: 1 }
		});
		expect(q0.chain).toHaveLength(1);
		expect(q0.chain![0].text).toBe('Second');
		expect(q0.chain![0].answer).toEqual({ type: 'open' });
	});

	it('allows markdown shared without step range; rejects range on markdown shared', () => {
		const okRaw = q({
			name: 'Md ok',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'markdown', body: 'x' } },
					steps: [{ text: 't', answer: { type: 'open' } }]
				}
			]
		});
		expect(parseQuestionSetFile(okRaw).ok).toBe(true);

		const badRaw = q({
			name: 'Md bad',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'markdown', body: 'x' } },
					steps: [
						{
							text: 't',
							answer: { type: 'open' },
							range: { startLine: 1, endLine: 1 }
						}
					]
				}
			]
		});
		const bad = parseQuestionSetFile(badRaw);
		expect(bad.ok).toBe(false);
		if (bad.ok) return;
		expect(bad.error).toMatch(/questions\[\d+\]/);
	});

	it('requires range on every step when shared is code-snippet', () => {
		const raw = q({
			name: 'Missing range',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'code-snippet', language: 'js', code: 'x' } },
					steps: [{ text: 't', answer: { type: 'open' } }]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/questions\[0\]\.steps\[0\]\.range/);
	});

	it('round-trips open answer referenceAnswer on root and chain', () => {
		const raw = q({
			name: 'Refs',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'markdown', body: 'm' } },
					steps: [
						{
							text: 'Root',
							answer: { type: 'open', referenceAnswer: 'alpha' }
						},
						{
							text: 'Follow',
							answer: { type: 'open', referenceAnswer: 'beta' }
						}
					]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].answer).toEqual({ type: 'open', referenceAnswer: 'alpha' });
		expect(result.data.questions[0].chain![0].answer).toEqual({
			type: 'open',
			referenceAnswer: 'beta'
		});
	});

	it('rejects legacy per-question text/content/answer shape', () => {
		const legacy = q({
			name: 'Legacy',
			questions: [
				{
					text: 'Q?',
					content: { type: 'code-snippet', language: 'js', code: 'x' },
					answer: { type: 'open' }
				}
			]
		});
		const result = parseQuestionSetFile(legacy);
		expect(result.ok).toBe(false);
	});

	it('returns error for malformed JSON', () => {
		const result = parseQuestionSetFile('{not valid json');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/Invalid JSON/);
	});

	it('parses multiple-choice and true-false answers', () => {
		const raw = q({
			name: 'Types',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'markdown', body: 'Pick one' } },
					steps: [
						{
							text: 'MC',
							answer: { type: 'multiple-choice', options: ['a', 'b'], correctIndex: 0 }
						}
					]
				},
				{
					shared: { content: { type: 'markdown', body: 'TF' } },
					steps: [
						{
							text: 'Bool',
							answer: { type: 'true-false', correctAnswer: false }
						}
					]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].answer).toEqual({
			type: 'multiple-choice',
			options: ['a', 'b'],
			correctIndex: 0
		});
		expect(result.data.questions[1].answer).toEqual({
			type: 'true-false',
			correctAnswer: false
		});
	});

	it('returns path-bearing error for invalid multiple-choice index', () => {
		const raw = q({
			name: 'Bad MC',
			schemaVersion: 1,
			questions: [
				{
					shared: { content: { type: 'markdown', body: 'x' } },
					steps: [
						{
							text: 't',
							answer: { type: 'multiple-choice', options: ['a', 'b'], correctIndex: 5 }
						}
					]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toMatch(/questions\[\d+\]/);
	});

	it('passes through difficulty when present', () => {
		const raw = q({
			name: 'D',
			schemaVersion: 1,
			questions: [
				{
					difficulty: 'hard',
					shared: { content: { type: 'markdown', body: 'x' } },
					steps: [{ text: 't', answer: { type: 'open' } }]
				}
			]
		});
		const result = parseQuestionSetFile(raw);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.data.questions[0].difficulty).toBe('hard');
	});
});
