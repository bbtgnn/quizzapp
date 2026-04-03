<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		getSession,
		listAttemptsBySession,
		listStudentsByClassroom,
		listQuestionsByQuestionSet
	} from '$lib/db/index.js';
	import type { Session, Attempt, Student, Question } from '$lib/db/types.js';

	let session = $state<Session | null>(null);
	let loading = $state(true);
	let notFound = $state(false);

	type AttemptWithDetails = Attempt & {
		questionText: string;
	};

	type StudentWithAttempts = Student & {
		attempts: AttemptWithDetails[];
	};

	let studentsWithAttempts = $state<StudentWithAttempts[]>([]);

	async function loadSessionDetails() {
		loading = true;
		try {
			const sessionId = page.params.id;
			if (!sessionId) {
				notFound = true;
				return;
			}
			const loadedSession = await getSession(sessionId);

			if (!loadedSession) {
				notFound = true;
				return;
			}

			session = loadedSession;

			const [attempts, students] = await Promise.all([
				listAttemptsBySession(sessionId),
				listStudentsByClassroom(session.classroom_id)
			]);

			// Load all questions for the session's question sets
			const questionsMap = new Map<string, Question>();
			for (const qsId of session.question_set_ids) {
				const qsQuestions = await listQuestionsByQuestionSet(qsId);
				for (const q of qsQuestions) {
					questionsMap.set(q.id, q);
				}
			}

			// Group attempts by student
			const grouped = students.map((student) => {
				const studentAttempts = attempts
					.filter((a) => a.student_id === student.id)
					.map((a) => ({
						...a,
						questionText: questionsMap.get(a.question_id)?.text || 'Unknown Question'
					}))
					.sort((a, b) => a.answered_at - b.answered_at);

				return {
					...student,
					attempts: studentAttempts
				};
			});

			// Only show students who have attempts, or show all? The requirements say:
			// "For each student: show their name, then a list of their attempts"
			// Let's filter out students with no attempts to keep it clean, or show them with "No attempts".
			// Let's show all students in the classroom, but maybe sort by those who have attempts.
			studentsWithAttempts = grouped.filter((s) => s.attempts.length > 0);
		} catch (e) {
			console.error('Failed to load session details:', e);
			notFound = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadSessionDetails();
	});

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
			href="/history"
			class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		>
			&larr; Back to History
		</a>
		<h1 class="text-3xl font-bold text-gray-900">Session Details</h1>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
		</div>
	{:else if notFound}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-lg font-semibold text-gray-900">Session not found</h3>
			<p class="mt-1 text-sm text-gray-500">
				The session you are looking for does not exist or has been deleted.
			</p>
		</div>
	{:else if session}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<p class="text-sm font-medium text-gray-500">Status</p>
					<p class="mt-1 text-sm font-semibold text-gray-900 capitalize">{session.status}</p>
				</div>
				<div>
					<p class="text-sm font-medium text-gray-500">Started</p>
					<p class="mt-1 text-sm text-gray-900">{new Date(session.started_at).toLocaleString()}</p>
				</div>
				<div>
					<p class="text-sm font-medium text-gray-500">Completed</p>
					<p class="mt-1 text-sm text-gray-900">
						{session.completed_at ? new Date(session.completed_at).toLocaleString() : '-'}
					</p>
				</div>
				<div>
					<p class="text-sm font-medium text-gray-500">Questions per student</p>
					<p class="mt-1 text-sm text-gray-900">{session.n_questions_per_student}</p>
				</div>
			</div>
		</div>

		<div class="space-y-8">
			{#if studentsWithAttempts.length === 0}
				<div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
					No attempts recorded for this session.
				</div>
			{:else}
				{#each studentsWithAttempts as student (student.id)}
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
	{/if}
</div>
