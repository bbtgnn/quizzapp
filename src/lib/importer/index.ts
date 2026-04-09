import { formatQuestionSetParseError } from './errors.js';
import { QuestionSetFileSchema, type QuestionSetFile } from './question-set.schema.js';

export type ParseResult = { ok: true; data: QuestionSetFile } | { ok: false; error: string };
export type { QuestionSetFile };

export { QuestionSetFileSchema } from './question-set.schema.js';
export { formatQuestionSetParseError } from './errors.js';

export function parseQuestionSetFile(jsonString: string): ParseResult {
	let parsedJson: unknown;
	try {
		parsedJson = JSON.parse(jsonString);
	} catch {
		return { ok: false, error: 'Invalid JSON: could not parse file.' };
	}

	const result = QuestionSetFileSchema.safeParse(parsedJson);
	if (!result.success) {
		return { ok: false, error: formatQuestionSetParseError(result.error) };
	}

	return { ok: true, data: result.data };
}
