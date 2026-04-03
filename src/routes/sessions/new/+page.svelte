<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		listClassrooms,
		listQuestionSets,
		createSession,
		listStudentsByClassroom,
		createSessionStudent
	} from '$lib/db/index.js';
	import type { Classroom, QuestionSet } from '$lib/db/types.js';

	let classrooms = $state<Classroom[]>([]);
	let questionSets = $state<QuestionSet[]>([]);
	let loading = $state(true);

	let selectedClassroomId = $state('');
	let selectedQuestionSetIds = $state<string[]>([]);
	let nQuestionsPerStudent = $state(3);

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	async function loadData() {
		loading = true;
		try {
			const [dbClassrooms, dbQuestionSets] = await Promise.all([
				listClassrooms(),
				listQuestionSets()
			]);
			classrooms = dbClassrooms.sort((a, b) => b.created_at - a.created_at);
			questionSets = dbQuestionSets.sort((a, b) => b.imported_at - a.imported_at);
		} catch (e) {
			console.error('Failed to load data:', e);
			error = 'Failed to load classrooms and question sets.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	function toggleQuestionSet(id: string) {
		if (selectedQuestionSetIds.includes(id)) {
			selectedQuestionSetIds = selectedQuestionSetIds.filter((setId) => setId !== id);
		} else {
			selectedQuestionSetIds = [...selectedQuestionSetIds, id];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!selectedClassroomId) {
			error = 'Please select a classroom.';
			return;
		}

		if (selectedQuestionSetIds.length === 0) {
			error = 'Please select at least one question set.';
			return;
		}

		if (nQuestionsPerStudent < 1) {
			error = 'Number of questions per student must be at least 1.';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const session = await createSession({
				classroom_id: selectedClassroomId,
				question_set_ids: selectedQuestionSetIds,
				n_questions_per_student: nQuestionsPerStudent,
				strategy_id: 'default'
			});

			const students = await listStudentsByClassroom(selectedClassroomId);

			await Promise.all(
				students.map((student) =>
					createSessionStudent(session.id, student.id, nQuestionsPerStudent)
				)
			);

			goto(`/sessions/${session.id}/run`);
		} catch (err) {
			console.error('Failed to start session:', err);
			error = 'Failed to start session. Please try again.';
			isSubmitting = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<div class="mb-8 flex items-center space-x-4">
		<a href="/sessions" class="text-gray-500 hover:text-gray-700" aria-label="Back to sessions">
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
		</a>
		<h1 class="text-3xl font-bold text-gray-900">Start New Session</h1>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
		</div>
	{:else if classrooms.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-sm font-semibold text-gray-900">No classrooms found</h3>
			<p class="mt-1 text-sm text-gray-500">You need a classroom to start a session.</p>
			<div class="mt-6">
				<a
					href="/classrooms/new"
					class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
				>
					Create a classroom
				</a>
			</div>
		</div>
	{:else if questionSets.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-sm font-semibold text-gray-900">No question sets found</h3>
			<p class="mt-1 text-sm text-gray-500">
				You need at least one question set to start a session.
			</p>
			<div class="mt-6">
				<a
					href="/question-sets"
					class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
				>
					Import a question set
				</a>
			</div>
		</div>
	{:else}
		{#if error}
			<div class="mb-6 rounded-md bg-red-50 p-4">
				<div class="flex">
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">{error}</h3>
					</div>
				</div>
			</div>
		{/if}

		<form
			onsubmit={handleSubmit}
			class="space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
		>
			<div>
				<label for="classroom" class="block text-sm font-medium text-gray-700">Classroom</label>
				<div class="mt-1">
					<select
						id="classroom"
						bind:value={selectedClassroomId}
						class="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						required
					>
						<option value="" disabled>Select a classroom</option>
						{#each classrooms as classroom (classroom.id)}
							<option value={classroom.id}>{classroom.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div>
				<span class="mb-2 block text-sm font-medium text-gray-700">Question Sets</span>
				<div class="space-y-2 rounded-md border border-gray-300 p-4">
					{#each questionSets as questionSet (questionSet.id)}
						<div class="flex items-center">
							<input
								id="qs-{questionSet.id}"
								type="checkbox"
								checked={selectedQuestionSetIds.includes(questionSet.id)}
								onchange={() => toggleQuestionSet(questionSet.id)}
								class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<label for="qs-{questionSet.id}" class="ml-3 block text-sm font-medium text-gray-700">
								{questionSet.name}
							</label>
						</div>
					{/each}
				</div>
				{#if selectedQuestionSetIds.length === 0}
					<p class="mt-2 text-sm text-red-600">Please select at least one question set.</p>
				{/if}
			</div>

			<div>
				<label for="nQuestions" class="block text-sm font-medium text-gray-700"
					>Questions per student</label
				>
				<div class="mt-1">
					<input
						type="number"
						id="nQuestions"
						bind:value={nQuestionsPerStudent}
						min="1"
						class="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						required
					/>
				</div>
				<p class="mt-2 text-sm text-gray-500">
					How many questions each student will answer in this session.
				</p>
			</div>

			<div class="pt-4">
				<button
					type="submit"
					disabled={isSubmitting || selectedQuestionSetIds.length === 0 || !selectedClassroomId}
					class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{isSubmitting ? 'Starting...' : 'Start Session'}
				</button>
			</div>
		</form>
	{/if}
</div>
