<script lang="ts">
	import { resolve } from '$app/paths';
	let { data } = $props();

	function getOutcomeBadgeClass(outcome: string) {
		switch (outcome) {
			case 'correct':
				return 'bg-green-100 text-green-800';
			case 'partial':
				return 'bg-yellow-100 text-yellow-800';
			case 'wrong':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getOutcomeLabel(outcome: string) {
		switch (outcome) {
			case 'correct':
				return 'Correct';
			case 'partial':
				return 'Partial';
			case 'wrong':
				return 'Wrong';
			default:
				return outcome;
		}
	}
</script>

<div class="mx-auto max-w-4xl p-6">
	<div class="mb-8 flex items-center gap-4">
		<a
			href={resolve('/history')}
			class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		>
			&larr; Back to History
		</a>
		<h1 class="text-3xl font-bold text-gray-900">Session Details</h1>
	</div>

	<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<div>
				<p class="text-sm font-medium text-gray-500">Status</p>
				<p class="mt-1 text-sm font-semibold text-gray-900 capitalize">{data.session.status}</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Started</p>
				<p class="mt-1 text-sm text-gray-900">
					{new Date(data.session.started_at).toLocaleString()}
				</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Completed</p>
				<p class="mt-1 text-sm text-gray-900">
					{data.session.completed_at ? new Date(data.session.completed_at).toLocaleString() : '-'}
				</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Questions per student</p>
				<p class="mt-1 text-sm text-gray-900">{data.session.n_questions_per_student}</p>
			</div>
		</div>
	</div>

	<div class="space-y-8">
		{#if data.studentsWithAttempts.length === 0}
			<div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
				No attempts recorded for this session.
			</div>
		{:else}
			{#each data.studentsWithAttempts as student (student.id)}
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
					<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
						<h3 class="text-lg font-medium text-gray-900">{student.name}</h3>
					</div>
					<ul class="divide-y divide-gray-200">
						{#each student.attempts as attempt (attempt.id)}
							<li class="px-6 py-4 hover:bg-gray-50">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">{attempt.questionText}</p>
										<p class="mt-1 text-xs text-gray-500">
											{new Date(attempt.answered_at).toLocaleString()}
										</p>
									</div>
									<span
										class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getOutcomeBadgeClass(
											attempt.outcome
										)}"
									>
										{getOutcomeLabel(attempt.outcome)}
									</span>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		{/if}
	</div>
</div>
