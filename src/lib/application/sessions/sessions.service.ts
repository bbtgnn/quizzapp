import type { Session } from '$lib/model/types.js';
import type { SessionRepository } from '$lib/ports/session-repository.js';

export async function listSessionsOrderedByStartedAt(
	sessions: SessionRepository
): Promise<Session[]> {
	const all = await sessions.listSessions();
	return [...all].sort((x, y) => y.started_at - x.started_at);
}
