<script lang="ts">
	import { onMount } from 'svelte';
	import { listSessions, getClassroom, listAttemptsBySession } from '$lib/db/index.js';
	import type { Session } from '$lib/db/types.js';

	type SessionWithDetails = Session & {
		classroomName: string;
		studentCount: number;
		attemptCount: number;
	};

	let sessions = $state<SessionWithDetails[]>([]);
	let loading = $state(true);

	async function loadCompletedSessions() {
		loading = true;
		try {
			const allSessions = await listSessions();
			const completedSessions = allSessions.filter((s) => s.status === 'completed');

			const withDetails = await Promise.all(
				completedSessions.map(async (s) => {
					const classroom = await getClassroom(s.classroom_id);
					const attempts = await listAttemptsBySession(s.id);

					// Count unique students who made attempts
					const uniqueStudents = new Set(attempts.map((a) => a.student_id));

					return {
						...s,
						classroomName: classroom?.name || 'Unknown Classroom',
						studentCount: uniqueStudents.size,
						attemptCount: attempts.length
					};
				})
			);

			// Sort by completed_at descending
			sessions = withDetails.sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0));
		} catch (e) {
			console.error('Failed to load sessions:', e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadCompletedSessions();
	});
</script>

<div class="mx-auto max-w-4xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a
				href="/"
				class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				&larr; Back
			</a>
			<h1 class="text-3xl font-bold text-gray-900">History</h1>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
		</div>
	{:else if sessions.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-sm font-semibold text-gray-900">No completed sessions yet</h3>
			<p class="mt-1 text-sm text-gray-500">Completed sessions will appear here.</p>
		</div>
	{:else}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each sessions as session (session.id)}
				<a
					href="/history/{session.id}"
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
