import type { SessionEnginePersistence } from '$lib/ports/session-engine-persistence.js';
import { attemptRepository, sessionRepository } from './repositories.js';

export const sessionEnginePersistence: SessionEnginePersistence = {
	createAttempt: attemptRepository.createAttempt.bind(attemptRepository),
	updateSession: sessionRepository.updateSession.bind(sessionRepository),
	updateSessionStudent: sessionRepository.updateSessionStudent.bind(sessionRepository)
};

export function createSessionEnginePersistence(
	overrides: Partial<SessionEnginePersistence> = {}
): SessionEnginePersistence {
	return {
		createAttempt: overrides.createAttempt ?? sessionEnginePersistence.createAttempt,
		updateSession: overrides.updateSession ?? sessionEnginePersistence.updateSession,
		updateSessionStudent:
			overrides.updateSessionStudent ?? sessionEnginePersistence.updateSessionStudent
	};
}
