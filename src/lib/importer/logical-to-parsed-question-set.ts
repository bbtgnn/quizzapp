/**
 * Phase 1 persistence bridge: maps validated logical question-set files (`shared` + `steps[]`)
 * to `ParsedQuestionSet` (root `text` / `answer` / `content` + optional `chain[]`) for
 * `persistQuestionSet`. Migrated bundled JSON always includes `shared`; when it is missing,
 * we use empty markdown body so single-step sets remain representable.
 *
 * Mapping: `steps[0]` → root row; `steps.slice(1)` → `chain[]` items (text + answer only).
 * For shared `code-snippet`, root `content` uses `steps[0].range` as `highlight` (D-05). Chain
 * rows inherit that same `ParsedQuestion.content` in persistence today; per-step highlights
 * for follow-ups are a Phase 2 (DATA-02) persistence concern if the product needs them.
 */
import type { ContentConfig } from '$lib/model/types.js';
import type { QuestionSetFile } from './question-set.schema.js';
import type { ParsedChainItem, ParsedQuestion, ParsedQuestionSet } from './parsed-types.js';

function contentForLogicalQuestion(
	shared: QuestionSetFile['questions'][number]['shared'],
	stepIndex: number,
	steps: QuestionSetFile['questions'][number]['steps']
): ContentConfig {
	if (shared?.content.type === 'code-snippet') {
		const step = steps[stepIndex];
		const range = step.range!;
		return {
			type: 'code-snippet',
			language: shared.content.language,
			code: shared.content.code,
			highlight: { startLine: range.startLine, endLine: range.endLine }
		};
	}
	if (shared?.content.type === 'markdown') {
		return { type: 'markdown', body: shared.content.body };
	}
	return { type: 'markdown', body: '' };
}

export function logicalQuestionSetFileToParsed(data: QuestionSetFile): ParsedQuestionSet {
	const questions: ParsedQuestion[] = data.questions.map((lq) => {
		const steps = lq.steps;
		const rootStep = steps[0];
		const rootContent = contentForLogicalQuestion(lq.shared, 0, steps);

		const chain: ParsedChainItem[] = [];
		for (let i = 1; i < steps.length; i++) {
			chain.push({ text: steps[i].text, answer: steps[i].answer });
		}

		const parsed: ParsedQuestion = {
			text: rootStep.text,
			content: rootContent,
			answer: rootStep.answer,
			...(lq.difficulty !== undefined ? { difficulty: lq.difficulty } : {}),
			...(chain.length > 0 ? { chain } : {})
		};
		return parsed;
	});

	return { name: data.name, questions };
}
