import type { Session, SessionStudent } from '$lib/model/types.js';

export interface SessionRepository {
	createSession(
		data: Omit<Session, 'id' | 'started_at' | 'completed_at' | 'status' | 'active_unit_progress'>
	): Promise<Session>;
	getSession(id: string): Promise<Session | undefined>;
	listSessions(): Promise<Session[]>;
	updateSession(id: string, changes: Partial<Omit<Session, 'id'>>): Promise<void>;
	createSessionStudent(
		sessionId: string,
		studentId: string,
		questionSlotsRemaining: number
	): Promise<SessionStudent>;
	listSessionStudents(sessionId: string): Promise<SessionStudent[]>;
	updateSessionStudent(
		id: string,
		changes: Partial<Omit<SessionStudent, 'id'>>
	): Promise<void>;
}
