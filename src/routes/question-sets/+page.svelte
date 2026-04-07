<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { deleteQuestionSet } from '$lib/db/index.js';
	let { data } = $props();

	let deletingId = $state<string | null>(null);

	async function handleDelete(id: string) {
		if (
			!confirm(
				'Are you sure you want to delete this question set? All snippets and questions will be lost.'
			)
		) {
			return;
		}
		deletingId = id;
		try {
			await deleteQuestionSet(id);
			await invalidateAll();
		} finally {
			deletingId = null;
		}
	}
</script>

<div class="mx-auto max-w-4xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href={resolve('/')} class="text-sm font-medium text-gray-500 hover:text-gray-900"> &larr; Back </a>
			<h1 class="text-3xl font-bold text-gray-900">Question Sets</h1>
		</div>
		<div class="flex items-center gap-3">
			<a
				href={resolve('/question-sets/import')}
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				Import Question Set
			</a>
		</div>
	</div>

	{#if data.questionSets.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-sm font-semibold text-gray-900">No question sets</h3>
			<p class="mt-1 text-sm text-gray-500">Get started by importing a new question set.</p>
			<div class="mt-6">
				<a
					href={resolve('/question-sets/import')}
					class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
				>
					<svg
						class="mr-1.5 -ml-0.5 h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
						/>
					</svg>
					Import your first question set
				</a>
			</div>
		</div>
	{:else}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.questionSets as qs (qs.id)}
				<div
					class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
				>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">{qs.name}</h3>
						<p class="mt-1 text-sm text-gray-500">
							{qs.snippetCount}
							{qs.snippetCount === 1 ? 'snippet' : 'snippets'} &middot;
							{qs.questionCount}
							{qs.questionCount === 1 ? 'question' : 'questions'}
						</p>
					</div>
					<div class="mt-6 flex items-center justify-end space-x-3">
						<button
							onclick={() => handleDelete(qs.id)}
							disabled={deletingId === qs.id}
							class="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
						>
							{deletingId === qs.id ? 'Deleting…' : 'Delete'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
