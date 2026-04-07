import type { Attempt } from '$lib/model/types.js';

export interface AttemptRepository {
	createAttempt(data: Omit<Attempt, 'id' | 'answered_at'>): Promise<Attempt>;
	listAttemptsBySession(sessionId: string): Promise<Attempt[]>;
	listAttemptsByStudentInSession(sessionId: string, studentId: string): Promise<Attempt[]>;
	listAttemptsByStudent(studentId: string): Promise<Attempt[]>;
}
