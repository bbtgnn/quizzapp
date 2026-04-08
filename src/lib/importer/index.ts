import { formatQuestionSetParseError } from './errors.js';
import { logicalQuestionSetFileToParsed } from './logical-to-parsed-question-set.js';
import type { ParseResult, ParsedChainItem, ParsedQuestion, ParsedQuestionSet } from './parsed-types.js';
import { QuestionSetFileSchema } from './question-set.schema.js';

export type { ParsedChainItem, ParsedQuestion, ParsedQuestionSet, ParseResult };

export { QuestionSetFileSchema } from './question-set.schema.js';
export { formatQuestionSetParseError } from './errors.js';
export { logicalQuestionSetFileToParsed } from './logical-to-parsed-question-set.js';

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

	return { ok: true, data: logicalQuestionSetFileToParsed(result.data) };
}
