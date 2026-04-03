<script lang="ts">
	import { onMount } from 'svelte';
	import { createQuestionSet, createSnippet, createQuestion } from '$lib/db/index.js';
	import { parseSnippetFile } from '$lib/importer/index.js';

	type ImportState = 'idle' | 'importing' | 'done';

	interface FileError {
		fileName: string;
		error: string;
	}

	let hasDirectoryPicker = $state(false);
	let importState = $state<ImportState>('idle');
	let importedCount = $state(0);
	let fileErrors = $state<FileError[]>([]);

	onMount(() => {
		hasDirectoryPicker = 'showDirectoryPicker' in window;
	});

	function reset() {
		importState = 'idle';
		importedCount = 0;
		fileErrors = [];
	}

	async function handleSelectFolder() {
		if (!hasDirectoryPicker) return;

		let dirHandle: FileSystemDirectoryHandle;
		try {
			dirHandle = await window.showDirectoryPicker();
		} catch {
			return;
		}

		importState = 'importing';
		importedCount = 0;
		fileErrors = [];

		const folderName = dirHandle.name;
		const questionSet = await createQuestionSet(folderName);

		for await (const [name, handle] of dirHandle) {
			if (handle.kind !== 'file' || !name.endsWith('.json')) continue;

			const fileHandle = handle as FileSystemFileHandle;
			const file = await fileHandle.getFile();
			const text = await file.text();
			const result = parseSnippetFile(text);

			if (!result.ok) {
				fileErrors = [...fileErrors, { fileName: name, error: result.error }];
				continue;
			}

			const { snippet, questions } = result.data;

			const dbSnippet = await createSnippet(questionSet.id, {
				language: snippet.language,
				code: snippet.code,
				...(snippet.highlight !== undefined ? { highlight: snippet.highlight } : {})
			});

			for (const q of questions) {
				const rootQ = await createQuestion(dbSnippet.id, {
					text: q.text,
					correct_answer: q.correctAnswer,
					difficulty: q.difficulty,
					chain_parent_id: null,
					chain_order: 0
				});

				if (q.chain) {
					for (let i = 0; i < q.chain.length; i++) {
						await createQuestion(dbSnippet.id, {
							text: q.chain[i].text,
							correct_answer: q.chain[i].correctAnswer,
							chain_parent_id: rootQ.id,
							chain_order: i + 1
						});
					}
				}
			}

			importedCount += 1;
		}

		importState = 'done';
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

	{#if !hasDirectoryPicker}
		<div class="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4">
			<p class="text-sm font-medium text-yellow-800">
				This feature requires Chrome or Edge. Firefox and Safari are not supported.
			</p>
		</div>
	{/if}

	{#if importState === 'idle'}
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<p class="mb-6 text-gray-600">
				Select a folder containing <code class="rounded bg-gray-100 px-1 py-0.5 text-sm">.json</code
				> snippet files. All files in the folder will be imported as a single question set.
			</p>
			<button
				onclick={handleSelectFolder}
				disabled={!hasDirectoryPicker}
				class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				Select Folder
			</button>
		</div>
	{:else if importState === 'importing'}
		<div class="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
			<p class="text-gray-600">Importing files...</p>
		</div>
	{:else}
		<div class="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div>
				<h2 class="text-lg font-semibold text-gray-900">Import Complete</h2>
				<p class="mt-1 text-gray-600">
					{importedCount}
					{importedCount === 1 ? 'file' : 'files'} imported successfully.
					{#if fileErrors.length > 0}
						{fileErrors.length}
						{fileErrors.length === 1 ? 'file' : 'files'} had errors.
					{/if}
				</p>
			</div>

			{#if fileErrors.length > 0}
				<div>
					<h3 class="mb-3 text-sm font-semibold text-red-700">Errors</h3>
					<ul class="space-y-2">
						{#each fileErrors as { fileName, error }}
							<li class="rounded-md border border-red-200 bg-red-50 p-3">
								<p class="text-sm font-medium text-red-800">{fileName}</p>
								<p class="mt-0.5 text-sm text-red-600">{error}</p>
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
