import type { SessionEnginePersistence } from '$lib/ports/session-engine-persistence.js';
import { attemptRepository, sessionRepository } from './repositories.js';

export const sessionEnginePersistence: SessionEnginePersistence = {
	createAttempt: attemptRepository.createAttempt.bind(attemptRepository),
	updateSession: sessionRepository.updateSession.bind(sessionRepository),
	updateSessionStudent: sessionRepository.updateSessionStudent.bind(sessionRepository),
	persistActiveUnitState: async (sessionId, state) => {
		await sessionRepository.updateSession(sessionId, { active_unit_progress: state });
	},
	clearActiveUnitState: async (sessionId) => {
		await sessionRepository.updateSession(sessionId, { active_unit_progress: null });
	}
};

export function createSessionEnginePersistence(
	overrides: Partial<SessionEnginePersistence> = {}
): SessionEnginePersistence {
	return {
		createAttempt: overrides.createAttempt ?? sessionEnginePersistence.createAttempt,
		updateSession: overrides.updateSession ?? sessionEnginePersistence.updateSession,
		updateSessionStudent:
			overrides.updateSessionStudent ?? sessionEnginePersistence.updateSessionStudent,
		persistActiveUnitState:
			overrides.persistActiveUnitState ?? sessionEnginePersistence.persistActiveUnitState,
		clearActiveUnitState:
			overrides.clearActiveUnitState ?? sessionEnginePersistence.clearActiveUnitState
	};
}
