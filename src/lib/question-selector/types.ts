import type { Attempt, Question, Student } from '$lib/db/types.js';

export type { Attempt, Question, Student };

export interface QuestionSelectionStrategy {
	pick(student: Student, attempts: Attempt[], availableQuestions: Question[]): Question;
}
