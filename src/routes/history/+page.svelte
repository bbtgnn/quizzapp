<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="mx-auto max-w-4xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a
				href={resolve('/')}
				class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				&larr; Back
			</a>
			<h1 class="text-3xl font-bold text-gray-900">History</h1>
		</div>
	</div>

	{#if data.sessions.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-sm font-semibold text-gray-900">No completed sessions yet</h3>
			<p class="mt-1 text-sm text-gray-500">Completed sessions will appear here.</p>
		</div>
	{:else}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.sessions as session (session.id)}
				<a
					href={resolve(`/history/${session.id}`)}
					class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:border-blue-300 hover:shadow-md"
				>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">{session.classroomName}</h3>
						<p class="mt-1 text-sm text-gray-500">
							{session.completed_at
								? new Date(session.completed_at).toLocaleString()
								: 'Unknown date'}
						</p>
					</div>
					<div class="mt-4 flex items-center justify-between text-sm text-gray-600">
						<div>
							<span class="font-medium">{session.studentCount}</span> students
						</div>
						<div>
							<span class="font-medium">{session.attemptCount}</span> attempts
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
