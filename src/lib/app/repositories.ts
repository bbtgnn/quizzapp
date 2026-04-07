import { dexieSessionRepository } from '$lib/adapters/persistence/dexie/session-repository.adapter.js';
import { dexieClassroomRepository } from '$lib/adapters/persistence/dexie/classroom-repository.adapter.js';
import { dexieQuestionSetRepository } from '$lib/adapters/persistence/dexie/question-set-repository.adapter.js';
import { dexieAttemptRepository } from '$lib/adapters/persistence/dexie/attempt-repository.adapter.js';
import type { SessionRepository } from '$lib/ports/session-repository.js';
import type { ClassroomRepository } from '$lib/ports/classroom-repository.js';
import type { QuestionSetRepository } from '$lib/ports/question-set-repository.js';
import type { AttemptRepository } from '$lib/ports/attempt-repository.js';

export const sessionRepository: SessionRepository = dexieSessionRepository;
export const classroomRepository: ClassroomRepository = dexieClassroomRepository;
export const questionSetRepository: QuestionSetRepository = dexieQuestionSetRepository;
export const attemptRepository: AttemptRepository = dexieAttemptRepository;

export interface AppRepositories {
	sessions: SessionRepository;
	classrooms: ClassroomRepository;
	questionSets: QuestionSetRepository;
	attempts: AttemptRepository;
}

export const repositories: AppRepositories = {
	sessions: sessionRepository,
	classrooms: classroomRepository,
	questionSets: questionSetRepository,
	attempts: attemptRepository
};

export function createRepositories(overrides: Partial<AppRepositories> = {}): AppRepositories {
	return {
		sessions: overrides.sessions ?? dexieSessionRepository,
		classrooms: overrides.classrooms ?? dexieClassroomRepository,
		questionSets: overrides.questionSets ?? dexieQuestionSetRepository,
		attempts: overrides.attempts ?? dexieAttemptRepository
	};
}
