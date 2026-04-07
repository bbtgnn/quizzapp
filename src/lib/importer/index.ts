import type { AnswerConfig, ContentConfig } from '$lib/model/types.js';

export interface ParsedChainItem {
	text: string;
	answer: AnswerConfig;
}

export interface ParsedQuestion {
	text: string;
	content: ContentConfig;
	answer: AnswerConfig;
	difficulty?: string;
	chain?: ParsedChainItem[];
}

export interface ParsedQuestionSet {
	name: string;
	questions: ParsedQuestion[];
}

export type ParseResult = { ok: true; data: ParsedQuestionSet } | { ok: false; error: string };

function parseContentConfig(obj: Record<string, unknown>, path: string): ContentConfig | string {
	if (typeof obj.type !== 'string') {
		return `${path}.type must be a string.`;
	}

	if (obj.type === 'markdown') {
		if (typeof obj.body !== 'string' || obj.body.trim() === '') {
			return `${path}.body must be a non-empty string.`;
		}
		return { type: 'markdown', body: obj.body } satisfies ContentConfig;
	}

	if (obj.type === 'code-snippet') {
		if (typeof obj.language !== 'string' || obj.language.trim() === '') {
			return `${path}.language must be a non-empty string.`;
		}
		if (typeof obj.code !== 'string') {
			return `${path}.code must be a string.`;
		}
		let highlight: { startLine: number; endLine: number } | undefined;
		if (obj.highlight !== undefined) {
			if (typeof obj.highlight !== 'object' || obj.highlight === null || Array.isArray(obj.highlight)) {
				return `${path}.highlight must be an object.`;
			}
			const h = obj.highlight as Record<string, unknown>;
			if (typeof h.startLine !== 'number') {
				return `${path}.highlight.startLine must be a number.`;
			}
			if (typeof h.endLine !== 'number') {
				return `${path}.highlight.endLine must be a number.`;
			}
			highlight = { startLine: h.startLine, endLine: h.endLine };
		}
		return {
			type: 'code-snippet',
			language: obj.language,
			code: obj.code,
			...(highlight !== undefined ? { highlight } : {})
		} satisfies ContentConfig;
	}

	return `${path}.type "${obj.type}" is not supported. Supported: code-snippet, markdown.`;
}

function parseAnswerConfig(obj: Record<string, unknown>, path: string): AnswerConfig | string {
	if (typeof obj.type !== 'string') {
		return `${path}.type must be a string.`;
	}

	if (obj.type === 'open') {
		return { type: 'open' } satisfies AnswerConfig;
	}

	if (obj.type === 'multiple-choice') {
		if (!Array.isArray(obj.options)) {
			return `${path}.options must be an array.`;
		}
		if (obj.options.length < 2) {
			return `${path}.options must contain at least 2 items.`;
		}
		for (let i = 0; i < obj.options.length; i++) {
			if (typeof obj.options[i] !== 'string' || (obj.options[i] as string).trim() === '') {
				return `${path}.options[${i}] must be a non-empty string.`;
			}
		}
		if (typeof obj.correctIndex !== 'number') {
			return `${path}.correctIndex must be a number.`;
		}
		if (obj.correctIndex < 0 || obj.correctIndex >= obj.options.length) {
			return `${path}.correctIndex must be >= 0 and < options.length.`;
		}
		return {
			type: 'multiple-choice',
			options: obj.options as string[],
			correctIndex: obj.correctIndex
		} satisfies AnswerConfig;
	}

	if (obj.type === 'true-false') {
		if (typeof obj.correctAnswer !== 'boolean') {
			return `${path}.correctAnswer must be a boolean.`;
		}
		return { type: 'true-false', correctAnswer: obj.correctAnswer } satisfies AnswerConfig;
	}

	return `${path}.type "${obj.type}" is not supported. Supported: open, multiple-choice, true-false.`;
}

export function parseQuestionSetFile(jsonString: string): ParseResult {
	let raw: unknown;

	try {
		raw = JSON.parse(jsonString);
	} catch {
		return { ok: false, error: 'Invalid JSON: could not parse file.' };
	}

	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		return { ok: false, error: 'Invalid format: root must be an object.' };
	}

	const obj = raw as Record<string, unknown>;

	if (typeof obj.name !== 'string' || obj.name.trim() === '') {
		return { ok: false, error: 'Missing or invalid field: "name" must be a non-empty string.' };
	}

	if (!Array.isArray(obj.questions)) {
		return { ok: false, error: 'Missing or invalid field: "questions" must be an array.' };
	}

	if (obj.questions.length === 0) {
		return { ok: false, error: 'Invalid field: "questions" must contain at least one item.' };
	}

	const parsedQuestions: ParsedQuestion[] = [];

	for (let i = 0; i < obj.questions.length; i++) {
		const q = obj.questions[i];
		const qPath = `questions[${i}]`;

		if (typeof q !== 'object' || q === null || Array.isArray(q)) {
			return { ok: false, error: `Invalid format: ${qPath} must be an object.` };
		}

		const qObj = q as Record<string, unknown>;

		if (typeof qObj.text !== 'string' || qObj.text.trim() === '') {
			return {
				ok: false,
				error: `Missing or invalid field: ${qPath}.text must be a non-empty string.`
			};
		}

		// Parse content
		if (typeof qObj.content !== 'object' || qObj.content === null || Array.isArray(qObj.content)) {
			return {
				ok: false,
				error: `Missing or invalid field: ${qPath}.content must be an object.`
			};
		}
		const contentResult = parseContentConfig(qObj.content as Record<string, unknown>, `${qPath}.content`);
		if (typeof contentResult === 'string') {
			return { ok: false, error: `Invalid field: ${contentResult}` };
		}

		// Parse answer
		if (typeof qObj.answer !== 'object' || qObj.answer === null || Array.isArray(qObj.answer)) {
			return {
				ok: false,
				error: `Missing or invalid field: ${qPath}.answer must be an object.`
			};
		}
		const answerResult = parseAnswerConfig(qObj.answer as Record<string, unknown>, `${qPath}.answer`);
		if (typeof answerResult === 'string') {
			return { ok: false, error: `Invalid field: ${answerResult}` };
		}

		let difficulty: string | undefined;
		if (qObj.difficulty !== undefined) {
			if (typeof qObj.difficulty !== 'string') {
				return { ok: false, error: `Invalid field: ${qPath}.difficulty must be a string.` };
			}
			difficulty = qObj.difficulty;
		}

		let chain: ParsedChainItem[] | undefined;
		if (qObj.chain !== undefined) {
			if (!Array.isArray(qObj.chain)) {
				return { ok: false, error: `Invalid field: ${qPath}.chain must be an array.` };
			}
			chain = [];
			for (let j = 0; j < qObj.chain.length; j++) {
				const item = qObj.chain[j];
				const itemPath = `${qPath}.chain[${j}]`;

				if (typeof item !== 'object' || item === null || Array.isArray(item)) {
					return { ok: false, error: `Invalid format: ${itemPath} must be an object.` };
				}
				const itemObj = item as Record<string, unknown>;

				if (typeof itemObj.text !== 'string' || itemObj.text.trim() === '') {
					return {
						ok: false,
						error: `Missing or invalid field: ${itemPath}.text must be a non-empty string.`
					};
				}

				// Chain items must have an answer config
				if (typeof itemObj.answer !== 'object' || itemObj.answer === null || Array.isArray(itemObj.answer)) {
					return {
						ok: false,
						error: `Missing or invalid field: ${itemPath}.answer must be an object.`
					};
				}
				const chainAnswerResult = parseAnswerConfig(itemObj.answer as Record<string, unknown>, `${itemPath}.answer`);
				if (typeof chainAnswerResult === 'string') {
					return { ok: false, error: `Invalid field: ${chainAnswerResult}` };
				}

				chain.push({ text: itemObj.text, answer: chainAnswerResult });
			}
		}

		const parsedQuestion: ParsedQuestion = {
			text: qObj.text,
			content: contentResult,
			answer: answerResult,
			...(difficulty !== undefined ? { difficulty } : {}),
			...(chain !== undefined ? { chain } : {})
		};

		parsedQuestions.push(parsedQuestion);
	}

	return {
		ok: true,
		data: {
			name: obj.name,
			questions: parsedQuestions
		}
	};
}
