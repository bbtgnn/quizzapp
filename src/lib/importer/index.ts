export interface ParsedHighlight {
	startLine: number;
	endLine: number;
}

export interface ParsedSnippet {
	language: string;
	code: string;
	highlight?: ParsedHighlight;
}

export interface ParsedChainItem {
	text: string;
	correctAnswer: string;
}

export interface ParsedQuestion {
	text: string;
	correctAnswer: string;
	difficulty?: string;
	chain?: ParsedChainItem[];
}

export interface ParsedSnippetFile {
	snippet: ParsedSnippet;
	questions: ParsedQuestion[];
}

export type ParseResult = { ok: true; data: ParsedSnippetFile } | { ok: false; error: string };

export function parseSnippetFile(jsonString: string): ParseResult {
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

	if (typeof obj.snippet !== 'object' || obj.snippet === null || Array.isArray(obj.snippet)) {
		return { ok: false, error: 'Missing or invalid field: "snippet" must be an object.' };
	}

	const snippetObj = obj.snippet as Record<string, unknown>;

	if (typeof snippetObj.language !== 'string' || snippetObj.language.trim() === '') {
		return {
			ok: false,
			error: 'Missing or invalid field: "snippet.language" must be a non-empty string.'
		};
	}

	if (typeof snippetObj.code !== 'string') {
		return { ok: false, error: 'Missing or invalid field: "snippet.code" must be a string.' };
	}

	let highlight: ParsedHighlight | undefined;
	if (snippetObj.highlight !== undefined) {
		if (
			typeof snippetObj.highlight !== 'object' ||
			snippetObj.highlight === null ||
			Array.isArray(snippetObj.highlight)
		) {
			return { ok: false, error: 'Invalid field: "snippet.highlight" must be an object.' };
		}
		const h = snippetObj.highlight as Record<string, unknown>;
		if (typeof h.startLine !== 'number') {
			return { ok: false, error: 'Invalid field: "snippet.highlight.startLine" must be a number.' };
		}
		if (typeof h.endLine !== 'number') {
			return { ok: false, error: 'Invalid field: "snippet.highlight.endLine" must be a number.' };
		}
		highlight = { startLine: h.startLine, endLine: h.endLine };
	}

	const parsedSnippet: ParsedSnippet = {
		language: snippetObj.language,
		code: snippetObj.code,
		...(highlight !== undefined ? { highlight } : {})
	};

	if (!Array.isArray(obj.questions)) {
		return { ok: false, error: 'Missing or invalid field: "questions" must be an array.' };
	}

	if (obj.questions.length === 0) {
		return { ok: false, error: 'Invalid field: "questions" must contain at least one item.' };
	}

	const parsedQuestions: ParsedQuestion[] = [];

	for (let i = 0; i < obj.questions.length; i++) {
		const q = obj.questions[i];

		if (typeof q !== 'object' || q === null || Array.isArray(q)) {
			return { ok: false, error: `Invalid format: questions[${i}] must be an object.` };
		}

		const qObj = q as Record<string, unknown>;

		if (typeof qObj.text !== 'string' || qObj.text.trim() === '') {
			return {
				ok: false,
				error: `Missing or invalid field: questions[${i}].text must be a non-empty string.`
			};
		}

		if (typeof qObj.correctAnswer !== 'string') {
			return {
				ok: false,
				error: `Missing or invalid field: questions[${i}].correctAnswer must be a string.`
			};
		}

		let difficulty: string | undefined;
		if (qObj.difficulty !== undefined) {
			if (typeof qObj.difficulty !== 'string') {
				return { ok: false, error: `Invalid field: questions[${i}].difficulty must be a string.` };
			}
			difficulty = qObj.difficulty;
		}

		let chain: ParsedChainItem[] | undefined;
		if (qObj.chain !== undefined) {
			if (!Array.isArray(qObj.chain)) {
				return { ok: false, error: `Invalid field: questions[${i}].chain must be an array.` };
			}
			chain = [];
			for (let j = 0; j < qObj.chain.length; j++) {
				const item = qObj.chain[j];
				if (typeof item !== 'object' || item === null || Array.isArray(item)) {
					return {
						ok: false,
						error: `Invalid format: questions[${i}].chain[${j}] must be an object.`
					};
				}
				const itemObj = item as Record<string, unknown>;
				if (typeof itemObj.text !== 'string' || itemObj.text.trim() === '') {
					return {
						ok: false,
						error: `Missing or invalid field: questions[${i}].chain[${j}].text must be a non-empty string.`
					};
				}
				if (typeof itemObj.correctAnswer !== 'string') {
					return {
						ok: false,
						error: `Missing or invalid field: questions[${i}].chain[${j}].correctAnswer must be a string.`
					};
				}
				chain.push({ text: itemObj.text, correctAnswer: itemObj.correctAnswer });
			}
		}

		const parsedQuestion: ParsedQuestion = {
			text: qObj.text,
			correctAnswer: qObj.correctAnswer,
			...(difficulty !== undefined ? { difficulty } : {}),
			...(chain !== undefined ? { chain } : {})
		};

		parsedQuestions.push(parsedQuestion);
	}

	return {
		ok: true,
		data: {
			snippet: parsedSnippet,
			questions: parsedQuestions
		}
	};
}
