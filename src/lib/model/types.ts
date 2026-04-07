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

export interface Highlight {
	startLine: number;
	endLine: number;
}

export interface Snippet {
	id: string;
	question_set_id: string;
	language: string;
	code: string;
	highlight?: Highlight;
}

export interface Question {
	id: string;
	snippet_id: string;
	text: string;
	correct_answer: string;
	difficulty?: string;
	chain_parent_id: string | null;
	chain_order: number;
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
