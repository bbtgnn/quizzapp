import type { ZodError } from 'zod';

function formatIssuePath(path: (string | number)[]): string {
	if (path.length === 0) return '(root)';
	let out = '';
	for (const seg of path) {
		if (typeof seg === 'number') {
			out += `[${seg}]`;
		} else {
			out += out === '' ? seg : `.${seg}`;
		}
	}
	return out;
}

/** Single-line Zod error for import UI: JSON path + short reason (D-08). */
export function formatQuestionSetParseError(error: ZodError): string {
	const issue = error.issues[0];
	if (!issue) return 'Invalid question set file.';
	const loc = formatIssuePath(issue.path as (string | number)[]);
	const msg = issue.message || 'Invalid value';
	return `${loc}: ${msg}`;
}
