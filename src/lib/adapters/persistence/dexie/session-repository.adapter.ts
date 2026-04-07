import type { SessionRepository } from '$lib/ports/session-repository.js';
import * as impl from './repositories/sessions.js';

export const dexieSessionRepository: SessionRepository = {
	createSession: impl.createSession,
	getSession: impl.getSession,
	listSessions: impl.listSessions,
	updateSession: impl.updateSession,
	createSessionStudent: impl.createSessionStudent,
	listSessionStudents: impl.listSessionStudents,
	updateSessionStudent: impl.updateSessionStudent
};
