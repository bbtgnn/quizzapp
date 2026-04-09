import type { Attempt, Session, SessionStudent } from '$lib/model/types.js';

/** Outbound persistence used only by SessionEngine (subset of session + attempt repos). */
export interface SessionEnginePersistence {
	createAttempt(data: Omit<Attempt, 'id' | 'answered_at'>): Promise<Attempt>;
	updateSession(id: string, changes: Partial<Omit<Session, 'id'>>): Promise<void>;
	updateSessionStudent(
		id: string,
		changes: Partial<Omit<SessionStudent, 'id'>>
	): Promise<void>;
	persistActiveUnitState(
		sessionId: string,
		state: NonNullable<Session['active_unit_progress']>
	): Promise<void>;
	clearActiveUnitState(sessionId: string): Promise<void>;
}
