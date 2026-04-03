<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		getClassroom,
		listStudentsByClassroom,
		updateClassroom,
		createStudent,
		deleteStudent,
		deleteClassroom
	} from '$lib/db/index.js';
	import type { Classroom, Student } from '$lib/db/types.js';

	let classroom = $state<Classroom | null>(null);
	let students = $state<Student[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let newStudentName = $state('');
	let isAddingStudent = $state(false);
	let isUpdatingName = $state(false);

	const classroomId = $derived(page.params.id as string);

	async function loadData() {
		loading = true;
		error = null;
		try {
			const c = await getClassroom(classroomId);
			if (!c) {
				error = 'Classroom not found';
				return;
			}
			classroom = c;
			students = await listStudentsByClassroom(classroomId);
		} catch (err) {
			console.error('Failed to load classroom:', err);
			error = 'Failed to load classroom data';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	async function handleUpdateName(e: Event) {
		e.preventDefault();
		if (!classroom || !classroom.name.trim()) return;

		isUpdatingName = true;
		try {
			await updateClassroom(classroom.id, { name: classroom.name.trim() });
		} catch (err) {
			console.error('Failed to update classroom name:', err);
			alert('Failed to update classroom name');
		} finally {
			isUpdatingName = false;
		}
	}

	async function handleAddStudent(e: Event) {
		e.preventDefault();
		if (!classroom || !newStudentName.trim()) return;

		isAddingStudent = true;
		try {
			const newStudent = await createStudent(classroom.id, newStudentName.trim());
			students = [...students, newStudent];
			newStudentName = '';
		} catch (err) {
			console.error('Failed to add student:', err);
			alert('Failed to add student');
		} finally {
			isAddingStudent = false;
		}
	}

	async function handleRemoveStudent(id: string) {
		if (!confirm('Are you sure you want to remove this student?')) return;

		try {
			await deleteStudent(id);
			students = students.filter((s) => s.id !== id);
		} catch (err) {
			console.error('Failed to remove student:', err);
			alert('Failed to remove student');
		}
	}

	async function handleDeleteClassroom() {
		if (!classroom) return;
		if (
			confirm(
				'Are you sure you want to delete this classroom? All students and their data will be lost.'
			)
		) {
			try {
				await deleteClassroom(classroom.id);
				goto('/');
			} catch (err) {
				console.error('Failed to delete classroom:', err);
				alert('Failed to delete classroom');
			}
		}
	}
</script>

<div class="mx-auto max-w-3xl p-6">
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
		<h1 class="text-3xl font-bold text-gray-900">Edit Classroom</h1>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
		</div>
	{:else if error || !classroom}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-sm font-semibold text-gray-900">{error || 'Classroom not found'}</h3>
			<div class="mt-6">
				<a
					href="/"
					class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
				>
					Back to Classrooms
				</a>
			</div>
		</div>
	{:else}
		<div class="space-y-8">
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-medium text-gray-900">Classroom Details</h2>
				<form onsubmit={handleUpdateName} class="flex items-end space-x-4">
					<div class="flex-grow">
						<label for="classroomName" class="block text-sm font-medium text-gray-700">Name</label>
						<input
							type="text"
							id="classroomName"
							bind:value={classroom.name}
							class="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={isUpdatingName}
						class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:opacity-50"
					>
						{isUpdatingName ? 'Saving...' : 'Save Name'}
					</button>
				</form>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-medium text-gray-900">Students ({students.length})</h2>
				</div>

				<form onsubmit={handleAddStudent} class="mb-6 flex items-end space-x-4">
					<div class="flex-grow">
						<label for="newStudentName" class="sr-only">New Student Name</label>
						<input
							type="text"
							id="newStudentName"
							bind:value={newStudentName}
							placeholder="Add new student..."
							class="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={isAddingStudent || !newStudentName.trim()}
						class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
					>
						Add
					</button>
				</form>

				<ul class="divide-y divide-gray-200 rounded-md border border-gray-200">
					{#each students as student (student.id)}
						<li class="flex items-center justify-between p-4 hover:bg-gray-50">
							<span class="text-sm font-medium text-gray-900">{student.name}</span>
							<button
								onclick={() => handleRemoveStudent(student.id)}
								class="text-sm font-medium text-red-600 hover:text-red-800"
								aria-label="Remove {student.name}"
							>
								Remove
							</button>
						</li>
					{:else}
						<li class="p-4 text-center text-sm text-gray-500">No students in this classroom.</li>
					{/each}
				</ul>
			</div>

			<div class="rounded-lg border border-red-200 bg-red-50 p-6">
				<h2 class="text-lg font-medium text-red-800">Danger Zone</h2>
				<p class="mt-1 text-sm text-red-600">
					Once you delete a classroom, there is no going back. Please be certain.
				</p>
				<div class="mt-4">
					<button
						onclick={handleDeleteClassroom}
						class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
					>
						Delete Classroom
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
