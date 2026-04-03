import { db } from '../schema.js';
import type { Attempt } from '../types.js';

export async function createAttempt(data: Omit<Attempt, 'id' | 'answered_at'>): Promise<Attempt> {
	const attempt: Attempt = {
		id: crypto.randomUUID(),
		answered_at: Date.now(),
		...data
	};
	await db.attempts.add(attempt);
	return attempt;
}

export async function listAttemptsBySession(sessionId: string): Promise<Attempt[]> {
	return db.attempts.where('session_id').equals(sessionId).toArray();
}

export async function listAttemptsByStudentInSession(
	sessionId: string,
	studentId: string
): Promise<Attempt[]> {
	return db.attempts
		.where('session_id')
		.equals(sessionId)
		.and((a) => a.student_id === studentId)
		.toArray();
}

export async function listAttemptsByStudent(studentId: string): Promise<Attempt[]> {
	return db.attempts.where('student_id').equals(studentId).toArray();
}
