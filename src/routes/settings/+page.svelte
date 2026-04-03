<script lang="ts">
	import { db } from '$lib/db/schema.js';

	let importError = $state<string | null>(null);
	let importSuccess = $state(false);
	let exporting = $state(false);
	let importing = $state(false);

	async function exportData() {
		exporting = true;
		try {
			const [
				classrooms,
				students,
				questionSets,
				snippets,
				questions,
				sessions,
				sessionStudents,
				attempts
			] = await Promise.all([
				db.classrooms.toArray(),
				db.students.toArray(),
				db.questionSets.toArray(),
				db.snippets.toArray(),
				db.questions.toArray(),
				db.sessions.toArray(),
				db.sessionStudents.toArray(),
				db.attempts.toArray()
			]);

			const data = {
				version: 1,
				exportedAt: Date.now(),
				classrooms,
				students,
				questionSets,
				snippets,
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
		} finally {
			exporting = false;
		}
	}

	async function importData(file: File) {
		importError = null;
		importSuccess = false;
		importing = true;

		try {
			const text = await file.text();
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch {
				importError = 'Invalid JSON file. Please select a valid backup file.';
				return;
			}

			if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
				importError = 'Unrecognised file format. Missing version field.';
				return;
			}

			const data = parsed as Record<string, unknown>;
			if (data.version !== 1) {
				importError = `Unsupported version: ${data.version}. This app supports version 1 only.`;
				return;
			}

			if (!confirm('This will replace ALL existing data. Are you sure?')) return;

			await db.transaction(
				'rw',
				[
					db.classrooms,
					db.students,
					db.questionSets,
					db.snippets,
					db.questions,
					db.sessions,
					db.sessionStudents,
					db.attempts
				],
				async () => {
					await db.classrooms.clear();
					await db.students.clear();
					await db.questionSets.clear();
					await db.snippets.clear();
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
					if (Array.isArray(data.snippets))
						await db.snippets.bulkAdd(data.snippets as Parameters<typeof db.snippets.bulkAdd>[0]);
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

			importSuccess = true;
		} finally {
			importing = false;
		}
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			importData(file);
			// Reset input so same file can be re-selected
			input.value = '';
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
		<a href="/" class="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Home</a>
	</div>

	<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="text-xl font-semibold text-gray-900">Export Data</h2>
		<p class="mt-2 text-sm text-gray-600">
			Download a JSON backup of all your classrooms, students, question sets, sessions, and
			attempts. You can use this file to restore your data later.
		</p>
		<div class="mt-4">
			<button
				onclick={exportData}
				disabled={exporting}
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				{exporting ? 'Exporting…' : 'Export Data'}
			</button>
		</div>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="text-xl font-semibold text-gray-900">Import Data</h2>
		<p class="mt-2 text-sm text-gray-600">
			Restore data from a previously exported JSON backup file.
			<strong class="text-red-600">Warning:</strong> This will permanently replace all existing data.
		</p>

		{#if importError}
			<div class="mt-4 rounded-md bg-red-50 p-4">
				<p class="text-sm font-medium text-red-800">{importError}</p>
			</div>
		{/if}

		{#if importSuccess}
			<div class="mt-4 rounded-md bg-green-50 p-4">
				<p class="text-sm font-medium text-green-800">Data imported successfully!</p>
			</div>
		{/if}

		<div class="mt-4">
			<label
				class="inline-block cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:bg-gray-50"
			>
				{importing ? 'Importing…' : 'Choose Backup File'}
				<input
					type="file"
					accept=".json"
					onchange={handleFileChange}
					disabled={importing}
					class="sr-only"
				/>
			</label>
		</div>
	</div>
</div>
