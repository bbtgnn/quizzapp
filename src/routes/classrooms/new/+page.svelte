<script lang="ts">
	import { goto } from '$app/navigation';
	import { classroomRepository } from '$lib/app/index.js';

	let classroomName = $state('');
	let students = $state([{ id: crypto.randomUUID(), name: '' }]);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	function addStudent() {
		students = [...students, { id: crypto.randomUUID(), name: '' }];
	}

	function removeStudent(id: string) {
		if (students.length > 1) {
			students = students.filter((s) => s.id !== id);
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!classroomName.trim()) {
			error = 'Classroom name is required';
			return;
		}

		const validStudents = students.filter((s) => s.name.trim() !== '');
		if (validStudents.length === 0) {
			error = 'At least one student name is required';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const classroom = await classroomRepository.createClassroom(classroomName.trim());

			await Promise.all(
				validStudents.map((s) => classroomRepository.createStudent(classroom.id, s.name.trim()))
			);

			goto('/');
		} catch (err) {
			console.error('Failed to create classroom:', err);
			error = 'Failed to create classroom. Please try again.';
			isSubmitting = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl p-6">
	<div class="mb-8 flex items-center space-x-4">
		<a href="/" class="text-gray-500 hover:text-gray-700" aria-label="Back to classrooms">
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
		</a>
		<h1 class="text-3xl font-bold text-gray-900">New Classroom</h1>
	</div>

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
			<label for="classroomName" class="block text-sm font-medium text-gray-700"
				>Classroom Name</label
			>
			<div class="mt-1">
				<input
					type="text"
					id="classroomName"
					bind:value={classroomName}
					class="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
					placeholder="e.g. Math 101"
					required
				/>
			</div>
		</div>

		<div>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium text-gray-900">Students</h3>
				<button
					type="button"
					onclick={addStudent}
					class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
				>
					Add Student
				</button>
			</div>

			<div class="space-y-3">
				{#each students as student, index (student.id)}
					<div class="flex items-center space-x-3">
						<div class="flex-grow">
							<label for="student-{student.id}" class="sr-only">Student Name</label>
							<input
								type="text"
								id="student-{student.id}"
								bind:value={student.name}
								class="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
								placeholder="Student Name"
								required={index === 0}
							/>
						</div>
						{#if students.length > 1}
							<button
								type="button"
								onclick={() => removeStudent(student.id)}
								class="inline-flex items-center rounded-md bg-white p-2 text-gray-400 hover:text-red-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
								aria-label="Remove student"
							>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
									/>
								</svg>
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<div class="pt-4">
			<button
				type="submit"
				disabled={isSubmitting}
				class="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				{isSubmitting ? 'Creating...' : 'Create Classroom'}
			</button>
		</div>
	</form>
</div>
