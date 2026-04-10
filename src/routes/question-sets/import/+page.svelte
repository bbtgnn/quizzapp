<script lang="ts">
	import { questionSetRepository } from '$lib/app/index.js';
	import { persistQuestionSet } from '$lib/application/question-sets/persist-question-set.js';
	import { parseQuestionSetFile } from '$lib/importer/index.js';

	type ImportState = 'idle' | 'importing' | 'done';

	let importState = $state<ImportState>('idle');
	let importedNames = $state<string[]>([]);
	let failedImports = $state<Array<{ file: string; error: string }>>([]);
	let importError = $state('');

	function reset() {
		importState = 'idle';
		importedNames = [];
		failedImports = [];
		importError = '';
	}

	async function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		if (files.length === 0) return;

		importState = 'importing';
		importedNames = [];
		failedImports = [];
		importError = '';

		try {
			for (const file of files) {
				if (!file.name.toLowerCase().endsWith('.json')) continue;
				const text = await file.text();
				const result = parseQuestionSetFile(text);

				if (!result.ok) {
					failedImports.push({ file: file.name, error: result.error });
					continue;
				}

				const questionSet = await questionSetRepository.createQuestionSet(result.data.name);
				await persistQuestionSet(questionSetRepository, questionSet.id, result.data);
				importedNames.push(result.data.name);
			}

			if (importedNames.length === 0) {
				importError =
					failedImports.length > 0
						? 'No files were imported successfully. Fix the listed file errors and try again.'
						: 'No JSON files were selected.';
			}
			importState = 'done';
		} catch (err) {
			console.error('Import failed:', err);
			importError = 'Import failed. Check the console for details.';
			importState = 'done';
		}

		// Reset the file input so the same file can be re-selected
		input.value = '';
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<div class="mb-8 flex items-center space-x-4">
		<a
			href="/question-sets"
			class="text-gray-500 hover:text-gray-700"
			aria-label="Back to question sets"
		>
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
		</a>
		<h1 class="text-3xl font-bold text-gray-900">Import Question Set</h1>
	</div>

	{#if importState === 'idle'}
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<p class="mb-6 text-gray-600">
				Select one or more <code class="rounded bg-gray-100 px-1 py-0.5 text-sm">.json</code> question
				set files, or choose a folder containing JSON files.
			</p>
			<label
				class="flex w-full cursor-pointer justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
			>
				Select Files or Folder
				<input
					type="file"
					accept=".json"
					multiple
					webkitdirectory
					onchange={handleFileSelected}
					class="sr-only"
				/>
			</label>
		</div>
	{:else if importState === 'importing'}
		<div class="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
			<p class="text-gray-600">Importing...</p>
		</div>
	{:else}
		<div class="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			{#if importError}
				<div>
					<h2 class="text-lg font-semibold text-red-700">Import Failed</h2>
					<p class="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
						{importError}
					</p>
				</div>
			{:else}
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Import Complete</h2>
					<p class="mt-1 text-gray-600">
						Imported <strong>{importedNames.length}</strong> question set{importedNames.length === 1
							? ''
							: 's'}
						successfully.
					</p>
					{#if importedNames.length > 0}
						<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
							{#each importedNames as name}
								<li>{name}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
			{#if failedImports.length > 0}
				<div>
					<h3 class="text-md font-semibold text-amber-700">Some files failed</h3>
					<ul class="mt-2 space-y-2">
						{#each failedImports as failed}
							<li class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
								<strong>{failed.file}</strong>: {failed.error}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="flex space-x-3 pt-2">
				<button
					onclick={reset}
					class="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					Import Another
				</button>
				<a
					href="/question-sets"
					class="flex flex-1 justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					View Question Sets
				</a>
			</div>
		</div>
	{/if}
</div>
