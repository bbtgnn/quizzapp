import { describe, it, expect, vi } from 'vitest';
import type { Session } from '$lib/model/types.js';
import { listSessionsOrderedByStartedAt } from './sessions.service.js';
import type { SessionRepository } from '$lib/ports/session-repository.js';

describe('listSessionsOrderedByStartedAt', () => {
	it('delegates to repository and sorts by started_at descending', async () => {
		const a: Session = {
			id: 'a',
			classroom_id: 'c',
			question_set_ids: [],
			n_questions_per_student: 1,
			started_at: 100,
			completed_at: null,
			status: 'active',
			strategy_id: 'default',
			active_unit_progress: null
		};
		const b: Session = {
			id: 'b',
			classroom_id: 'c',
			question_set_ids: [],
			n_questions_per_student: 1,
			started_at: 200,
			completed_at: null,
			status: 'active',
			strategy_id: 'default',
			active_unit_progress: null
		};
		const listSessions = vi.fn().mockResolvedValue([a, b]);
		const sessions: SessionRepository = {
			createSession: vi.fn(),
			getSession: vi.fn(),
			listSessions,
			updateSession: vi.fn(),
			createSessionStudent: vi.fn(),
			listSessionStudents: vi.fn(),
			updateSessionStudent: vi.fn()
		};

		const result = await listSessionsOrderedByStartedAt(sessions);

		expect(listSessions).toHaveBeenCalledOnce();
		expect(result.map((s) => s.id)).toEqual(['b', 'a']);
	});
});
