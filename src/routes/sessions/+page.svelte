<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatDate(timestamp: number) {
		return new Date(timestamp).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mx-auto max-w-4xl p-6">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<a href={resolve('/')} class="text-gray-500 hover:text-gray-700" aria-label="Back to home">
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
			</a>
			<h1 class="text-3xl font-bold text-gray-900">Sessions</h1>
		</div>
		<a
			href={resolve('/sessions/new')}
			class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		>
			Start New Session
		</a>
	</div>

	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-800">Paused Sessions</h2>

		{#if data.pausedSessions.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
				<h3 class="mt-2 text-sm font-semibold text-gray-900">No paused sessions</h3>
				<p class="mt-1 text-sm text-gray-500">
					Start a new session to begin quizzing your students.
				</p>
				<div class="mt-6">
					<a
						href={resolve('/sessions/new')}
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
						Start New Session
					</a>
				</div>
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.pausedSessions as session (session.id)}
					<div
						class="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">{session.classroomName}</h3>
							<p class="mt-1 text-sm text-gray-500">
								Started: {formatDate(session.started_at)}
							</p>
							<div class="mt-4">
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-gray-700">Progress</span>
									<span class="text-gray-500"
										>{session.completedStudents} / {session.totalStudents} students</span
									>
								</div>
								<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
									<div
										class="h-full bg-blue-600"
										style="width: {session.totalStudents > 0
											? (session.completedStudents / session.totalStudents) * 100
											: 0}%"
									></div>
								</div>
							</div>
						</div>
						<div class="mt-6 flex items-center justify-end">
							<a
								href={resolve(`/sessions/${session.id}/run`)}
								class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-blue-300 ring-inset hover:bg-blue-50"
							>
								Resume Session
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if data.completedSessionsCount > 0}
		<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
			<p class="text-sm text-gray-600">
				<span class="font-medium text-gray-900">{data.completedSessionsCount}</span> completed {data.completedSessionsCount ===
				1
					? 'session'
					: 'sessions'} in history.
			</p>
		</div>
	{/if}
</div>
