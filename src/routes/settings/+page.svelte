<script lang="ts">
	import { resolve } from '$app/paths';
	import { exportFullBackup, importFullBackupFromFile } from '$lib/app/index.js';

	let importError = $state<string | null>(null);
	let importSuccess = $state(false);
	let exporting = $state(false);
	let importing = $state(false);

	async function exportData() {
		exporting = true;
		try {
			await exportFullBackup();
		} finally {
			exporting = false;
		}
	}

	async function importData(file: File) {
		importError = null;
		importSuccess = false;
		importing = true;

		try {
			const result = await importFullBackupFromFile(file);
			if (!result.ok) {
				if ('cancelled' in result && result.cancelled) return;
				importError = 'error' in result ? result.error : 'Import failed.';
				return;
			}
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
			input.value = '';
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
		<a href={resolve('/')} class="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Home</a>
	</div>

	<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<h2 class="text-xl font-semibold text-gray-900">Export Data</h2>
		<p class="mt-2 text-sm text-gray-600">
			Download a JSON backup of all your classrooms, students, question sets, sessions, and
			attempts. You can use this file to restore your data later. Session pause/resume and its
			limits are documented in the README under <strong>Sessions, pause, and resume</strong>.
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
			See the README section <strong>Sessions, pause, and resume</strong> for how live sessions persist
			and when backup import may fail (unsupported versions).
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
