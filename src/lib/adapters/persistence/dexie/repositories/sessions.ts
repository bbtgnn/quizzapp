import { db } from '../schema.js';
import type { Session, SessionStudent } from '$lib/model/types.js';

export async function createSession(
	data: Omit<Session, 'id' | 'started_at' | 'completed_at' | 'status'>
): Promise<Session> {
	const session: Session = {
		id: crypto.randomUUID(),
		started_at: Date.now(),
		completed_at: null,
		status: 'active',
		...data
	};
	await db.sessions.add(session);
	return session;
}

export async function getSession(id: string): Promise<Session | undefined> {
	return db.sessions.get(id);
}

export async function listSessions(): Promise<Session[]> {
	return db.sessions.toArray();
}

export async function updateSession(
	id: string,
	changes: Partial<Omit<Session, 'id'>>
): Promise<void> {
	await db.sessions.update(id, changes);
}

export async function createSessionStudent(
	sessionId: string,
	studentId: string,
	questionSlotsRemaining: number
): Promise<SessionStudent> {
	const sessionStudent: SessionStudent = {
		id: crypto.randomUUID(),
		session_id: sessionId,
		student_id: studentId,
		completed: false,
		question_slots_remaining: questionSlotsRemaining
	};
	await db.sessionStudents.add(sessionStudent);
	return sessionStudent;
}

export async function listSessionStudents(sessionId: string): Promise<SessionStudent[]> {
	return db.sessionStudents.where('session_id').equals(sessionId).toArray();
}

export async function updateSessionStudent(
	id: string,
	changes: Partial<Omit<SessionStudent, 'id'>>
): Promise<void> {
	await db.sessionStudents.update(id, changes);
}
