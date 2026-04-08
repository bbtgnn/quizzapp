import { z } from 'zod';

const RangeSchema = z.strictObject({
	startLine: z.number().int(),
	endLine: z.number().int()
});

const OpenAnswerSchema = z.strictObject({
	type: z.literal('open'),
	referenceAnswer: z.string().optional()
});

const MCAnswerSchema = z
	.strictObject({
		type: z.literal('multiple-choice'),
		options: z.array(z.string().min(1)).min(2),
		correctIndex: z.number().int()
	})
	.superRefine((val, ctx) => {
		if (val.correctIndex < 0 || val.correctIndex >= val.options.length) {
			ctx.addIssue({
				code: 'custom',
				message: 'correctIndex must be >= 0 and less than options.length',
				path: ['correctIndex']
			});
		}
	});

const TFAnswerSchema = z.strictObject({
	type: z.literal('true-false'),
	correctAnswer: z.boolean()
});

export const AnswerConfigSchema = z.discriminatedUnion('type', [
	OpenAnswerSchema,
	MCAnswerSchema,
	TFAnswerSchema
]);

const MarkdownContentImportSchema = z.strictObject({
	type: z.literal('markdown'),
	body: z.string().min(1)
});

const CodeSnippetImportSchema = z.strictObject({
	type: z.literal('code-snippet'),
	language: z.string().min(1),
	code: z.string()
});

export const ContentConfigSchema = z.discriminatedUnion('type', [
	MarkdownContentImportSchema,
	CodeSnippetImportSchema
]);

export const StepSchema = z.strictObject({
	text: z.string().min(1),
	answer: AnswerConfigSchema,
	range: RangeSchema.optional()
});

export const LogicalQuestionSchema = z
	.strictObject({
		shared: z
			.strictObject({
				content: ContentConfigSchema
			})
			.optional(),
		steps: z.array(StepSchema).min(1),
		difficulty: z.string().optional()
	})
	.superRefine((q, ctx) => {
		const contentType = q.shared?.content.type;
		if (contentType === 'code-snippet') {
			q.steps.forEach((step, i) => {
				if (step.range === undefined) {
					ctx.addIssue({
						code: 'custom',
						message: 'each step must include range when shared content is code-snippet',
						path: ['steps', i, 'range']
					});
				}
			});
		} else if (contentType === 'markdown') {
			q.steps.forEach((step, i) => {
				if (step.range !== undefined) {
					ctx.addIssue({
						code: 'custom',
						message: 'steps must not include range when shared content is markdown',
						path: ['steps', i, 'range']
					});
				}
			});
		}
	});

export const QuestionSetFileSchema = z.strictObject({
	name: z.string().min(1),
	schemaVersion: z.literal(1),
	questions: z.array(LogicalQuestionSchema).min(1)
});

export type QuestionSetFile = z.infer<typeof QuestionSetFileSchema>;
