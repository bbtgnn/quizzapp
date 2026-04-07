import type { AttemptRepository } from '$lib/ports/attempt-repository.js';
import * as impl from './repositories/attempts.js';

export const dexieAttemptRepository: AttemptRepository = {
	createAttempt: impl.createAttempt,
	listAttemptsBySession: impl.listAttemptsBySession,
	listAttemptsByStudentInSession: impl.listAttemptsByStudentInSession,
	listAttemptsByStudent: impl.listAttemptsByStudent
};
