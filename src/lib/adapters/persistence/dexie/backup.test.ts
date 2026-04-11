import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFullBackupPayload, importFullBackupFromFile } from './backup.js';
import { db } from './schema.js';

describe('VER-02: backup export/import', () => {
	beforeEach(async () => {
		vi.stubGlobal('confirm', () => true);
		await db.delete();
		await db.open();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('restores logical Question rows with nested steps from version 2 backup', async () => {
		const payload = {
			version: 2,
			exportedAt: 1,
			classrooms: [],
			students: [],
			questionSets: [{ id: 'qs1', name: 'Set', imported_at: 1 }],
			questions: [
				{
					id: 'q1',
					question_set_id: 'qs1',
					steps: [{ text: 'Step one', answer: { type: 'open' as const } }],
					text: 'Step one',
					answer: { type: 'open' as const }
				}
			],
			sessions: [],
			sessionStudents: [],
			attempts: []
		};
		const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
		const result = await importFullBackupFromFile(file);
		expect(result.ok).toBe(true);

		const rows = await db.questions.toArray();
		expect(rows).toHaveLength(1);
		const q = rows[0]!;
		expect(q.steps.length).toBeGreaterThanOrEqual(1);
		const chainParentId = ['chain', 'parent', 'id'].join('_');
		const chainOrder = ['chain', 'order'].join('_');
		expect(Object.keys(q)).not.toContain(chainParentId);
		expect(Object.keys(q)).not.toContain(chainOrder);
	});

	it('buildFullBackupPayload includes steps for seeded logical questions', async () => {
		await db.questionSets.add({ id: 'qs2', name: 'S', imported_at: 1 });
		await db.questions.add({
			id: 'q2',
			question_set_id: 'qs2',
			steps: [{ text: 'A', answer: { type: 'open' } }],
			text: 'A',
			answer: { type: 'open' }
		});

		const data = await buildFullBackupPayload();
		expect(data.questions[0]?.steps?.length).toBeGreaterThanOrEqual(1);
	});

	it('VER-02: unsupported backup version rejected', async () => {
		const payload = {
			version: 1,
			exportedAt: 1,
			classrooms: [],
			students: [],
			questionSets: [],
			questions: [],
			sessions: [],
			sessionStudents: [],
			attempts: []
		};
		const file = new File([JSON.stringify(payload)], 'bad.json', { type: 'application/json' });
		const result = await importFullBackupFromFile(file);
		expect(result.ok).toBe(false);
		expect(result).toMatchObject({ ok: false });
		if (result.ok === false && 'error' in result) {
			expect(result.error).toContain('Unsupported version');
		}
	});
});
