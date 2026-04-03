import type { QuestionSelectionStrategy } from '../types.js';
import type { Attempt, Question, Student } from '$lib/db/types.js';

const defaultStrategy: QuestionSelectionStrategy = {
	pick(student: Student, attempts: Attempt[], availableQuestions: Question[]): Question {
		if (availableQuestions.length === 0) {
			throw new Error('availableQuestions must not be empty');
		}

		const mostRecentByQuestion = new Map<string, Attempt>();
		for (const attempt of attempts) {
			if (attempt.student_id !== student.id) continue;
			const existing = mostRecentByQuestion.get(attempt.question_id);
			if (existing === undefined || attempt.answered_at > existing.answered_at) {
				mostRecentByQuestion.set(attempt.question_id, attempt);
			}
		}

		const needsWork = availableQuestions.filter((q) => {
			const recent = mostRecentByQuestion.get(q.id);
			return recent === undefined || recent.outcome === 'wrong' || recent.outcome === 'partial';
		});

		if (needsWork.length > 0) {
			return needsWork[0];
		}

		let oldestCorrect = availableQuestions[0];
		let oldestAt = mostRecentByQuestion.get(oldestCorrect.id)!.answered_at;

		for (let i = 1; i < availableQuestions.length; i++) {
			const q = availableQuestions[i];
			const at = mostRecentByQuestion.get(q.id)!.answered_at;
			if (at < oldestAt) {
				oldestCorrect = q;
				oldestAt = at;
			}
		}

		return oldestCorrect;
	}
};

export { defaultStrategy };
