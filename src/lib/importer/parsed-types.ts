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

export type ParseResult =
	| { ok: true; data: ParsedQuestionSet }
	| { ok: false; error: string };
