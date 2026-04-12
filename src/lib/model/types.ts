export interface Classroom {
	id: string;
	name: string;
	created_at: number; // Unix timestamp (ms)
}

export interface Student {
	id: string;
	classroom_id: string;
	name: string;
}

export interface QuestionSet {
	id: string;
	name: string;
	imported_at: number; // Unix timestamp (ms)
}

// --- Content types (what the question shows) ---

export interface CodeSnippetContent {
	type: 'code-snippet';
	language: string;
	code: string;
	highlight?: { startLine: number; endLine: number };
}

export interface MarkdownContent {
	type: 'markdown';
	body: string;
}

export type ContentConfig = CodeSnippetContent | MarkdownContent;

// --- Answer types (how the answer works) ---

export interface OpenAnswerConfig {
	type: 'open';
	/** Teacher reference / expected wording for open questions (import D-12); scoring unchanged. */
	referenceAnswer?: string;
}

export interface MCAnswerConfig {
	type: 'multiple-choice';
	options: string[];
	correctIndex: number;
}

export interface TFAnswerConfig {
	type: 'true-false';
	correctAnswer: boolean;
}

export type AnswerConfig = OpenAnswerConfig | MCAnswerConfig | TFAnswerConfig;

// --- Question ---

export interface Question {
	id: string;
	question_set_id: string;
	shared?: { content: ContentConfig };
	steps: Array<{
		text: string;
		answer: AnswerConfig;
		range?: { startLine: number; endLine: number };
	}>;
	// Transitional read fields while session/runtime code migrates to step-based access.
	text?: string;
	content?: ContentConfig;
	answer?: AnswerConfig;
	difficulty?: string;
}

export interface Session {
	id: string;
	classroom_id: string;
	question_set_ids: string[];
	n_questions_per_student: number;
	started_at: number; // Unix timestamp (ms)
	completed_at: number | null; // Unix timestamp (ms) or null
	status: 'active' | 'paused' | 'completed';
	strategy_id: string;
	/**
	 * Turn order for students enrolled in this session, fixed when the run plan is first computed.
	 * Omitted/null until the first SessionEngine init on the run page.
	 */
	student_order_ids?: string[] | null;
	/**
	 * Pre-assigned root question id per slot per student (session-local), fixed at plan time.
	 * Omitted/null until the first SessionEngine init on the run page.
	 */
	question_schedule?: Record<string, string[]> | null;
	/** Whose turn it is; persisted so refresh does not reshuffle the play order. */
	active_student_id?: string | null;
	active_unit_progress: {
		root_question_id: string;
		step_index: number;
		step_outcomes: Array<'correct' | 'wrong'>;
		/** Present for in-progress units; used with active_student_id for resume. */
		student_id?: string;
	} | null;
}

export interface SessionStudent {
	id: string;
	session_id: string;
	student_id: string;
	completed: boolean;
	question_slots_remaining: number;
}

export interface Attempt {
	id: string;
	session_id: string;
	student_id: string;
	question_id: string;
	outcome: 'correct' | 'partial' | 'wrong';
	answered_at: number; // Unix timestamp (ms)
}
