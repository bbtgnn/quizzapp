import { db } from './schema.js';

export async function exportFullBackup(): Promise<void> {
	const [
		classrooms,
		students,
		questionSets,
		questions,
		sessions,
		sessionStudents,
		attempts
	] = await Promise.all([
		db.classrooms.toArray(),
		db.students.toArray(),
		db.questionSets.toArray(),
		db.questions.toArray(),
		db.sessions.toArray(),
		db.sessionStudents.toArray(),
		db.attempts.toArray()
	]);

	const data = {
		version: 2,
		exportedAt: Date.now(),
		classrooms,
		students,
		questionSets,
		questions,
		sessions,
		sessionStudents,
		attempts
	};

	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `quizapp-backup-${new Date().toISOString().split('T')[0]}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export type ImportBackupResult =
	| { ok: true }
	| { ok: false; cancelled: true }
	| { ok: false; error: string };

export async function importFullBackupFromFile(file: File): Promise<ImportBackupResult> {
	try {
		const text = await file.text();
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			return { ok: false, error: 'Invalid JSON file. Please select a valid backup file.' };
		}

		if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
			return { ok: false, error: 'Unrecognised file format. Missing version field.' };
		}

		const data = parsed as Record<string, unknown>;
		if (data.version !== 2) {
			return {
				ok: false,
				error: `Unsupported version: ${data.version}. This app supports version 2 only.`
			};
		}

		if (!confirm('This will replace ALL existing data. Are you sure?')) {
			return { ok: false, cancelled: true };
		}

		await db.transaction(
			'rw',
			[
				db.classrooms,
				db.students,
				db.questionSets,
				db.questions,
				db.sessions,
				db.sessionStudents,
				db.attempts
			],
			async () => {
				await db.classrooms.clear();
				await db.students.clear();
				await db.questionSets.clear();
				await db.questions.clear();
				await db.sessions.clear();
				await db.sessionStudents.clear();
				await db.attempts.clear();

				if (Array.isArray(data.classrooms))
					await db.classrooms.bulkAdd(
						data.classrooms as Parameters<typeof db.classrooms.bulkAdd>[0]
					);
				if (Array.isArray(data.students))
					await db.students.bulkAdd(data.students as Parameters<typeof db.students.bulkAdd>[0]);
				if (Array.isArray(data.questionSets))
					await db.questionSets.bulkAdd(
						data.questionSets as Parameters<typeof db.questionSets.bulkAdd>[0]
					);
				if (Array.isArray(data.questions))
					await db.questions.bulkAdd(
						data.questions as Parameters<typeof db.questions.bulkAdd>[0]
					);
				if (Array.isArray(data.sessions))
					await db.sessions.bulkAdd(data.sessions as Parameters<typeof db.sessions.bulkAdd>[0]);
				if (Array.isArray(data.sessionStudents))
					await db.sessionStudents.bulkAdd(
						data.sessionStudents as Parameters<typeof db.sessionStudents.bulkAdd>[0]
					);
				if (Array.isArray(data.attempts))
					await db.attempts.bulkAdd(data.attempts as Parameters<typeof db.attempts.bulkAdd>[0]);
			}
		);

		return { ok: true };
	} catch (e) {
		console.error('Import failed:', e);
		return { ok: false, error: 'Import failed. Check the console for details.' };
	}
}
