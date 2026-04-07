<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SessionEngine } from '$lib/domain/session-engine/index.js';
	import { sessionEnginePersistence } from '$lib/app/index.js';
	import type { Snippet, Student } from '$lib/model/types.js';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	let { data } = $props();

	let engine = $state.raw<SessionEngine | null>(null);
	let tick = $state(0);
	let recording = $state(false);
	let snippetMap = $state(new Map<string, Snippet>());
	/** Student id after their transition was dismissed (questions visible). */
	let lastSettledStudentId = $state<string | null>(null);
	let pendingTransitionStudent = $state<Student | null>(null);

	$effect(() => {
		snippetMap = new Map(Object.entries(data.snippetByQuestionId));
		engine = new SessionEngine(
			data.session,
			data.sessionStudents,
			data.students,
			data.allQuestions,
			data.attempts,
			sessionEnginePersistence
		);
		tick = 0;
		lastSettledStudentId = null;
		pendingTransitionStudent = null;
	});

	async function recordOutcome(outcome: 'correct' | 'partial' | 'wrong') {
		if (!engine || recording) return;
		recording = true;
		try {
			await engine.recordOutcome(outcome);
			tick++;
		} finally {
			recording = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (pendingTransitionStudent) {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				dismissPlayerTransition();
			}
			return;
		}
		if (!engine || engine.isComplete || recording) return;
		if (e.key === '1' || e.key === 'c' || e.key === 'C') {
			recordOutcome('correct');
		} else if (e.key === '2' || e.key === 'p' || e.key === 'P') {
			recordOutcome('partial');
		} else if (e.key === '3' || e.key === 'w' || e.key === 'W') {
			recordOutcome('wrong');
		}
	}

	async function handlePause() {
		if (engine) {
			await engine.pause();
			goto(resolve('/sessions'));
		}
	}

	function dismissPlayerTransition() {
		const p = pendingTransitionStudent;
		if (p) {
			lastSettledStudentId = p.id;
			pendingTransitionStudent = null;
		}
	}

	$effect(() => {
		if (!engine || engine.isComplete) return;
		void tick;
		const cs = engine.currentStudent;
		if (!cs) return;
		// Already showing transition for this student
		if (pendingTransitionStudent?.id === cs.id) return;
		// User dismissed transition; main UI is for this student
		if (lastSettledStudentId === cs.id) return;
		// First player or handoff to next player — same screen
		pendingTransitionStudent = cs;
	});

	let currentStudent = $derived(tick >= 0 ? engine?.currentStudent : null);
	let currentQuestion = $derived(tick >= 0 ? engine?.currentQuestion : null);
	let isComplete = $derived(tick >= 0 ? (engine?.isComplete ?? false) : false);
	let progress = $derived(tick >= 0 ? engine?.progress : null);
	let chainProgress = $derived(tick >= 0 ? engine?.chainProgress : null);
	let currentSnippet = $derived(currentQuestion ? snippetMap.get(currentQuestion.id) : null);
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex min-h-screen flex-col bg-gray-900 text-gray-100">
	{#if !engine}
		<div class="flex flex-1 items-center justify-center">
			<p class="text-xl text-gray-400">Loading session...</p>
		</div>
	{:else if isComplete}
		<div class="flex flex-1 flex-col items-center justify-center space-y-6 p-8 text-center">
			<h1 class="text-5xl font-bold text-green-400">Session Complete!</h1>
			<p class="text-xl text-gray-300">All students have finished their questions.</p>
			<a
				href={resolve('/sessions')}
				class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Back to Sessions
			</a>
		</div>
	{:else if pendingTransitionStudent}
		<div
			class="flex min-h-screen flex-1 flex-col items-center justify-center bg-gray-950 p-8 text-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby="next-player-label"
		>
			<div class="max-w-lg space-y-6">
				<p id="next-player-label" class="text-xl text-gray-400">next player:</p>
				<p class="text-5xl font-bold text-white md:text-6xl">
					<strong>{pendingTransitionStudent.name}</strong>
				</p>
				<p class="text-2xl font-semibold text-amber-300">get ready!</p>
				<button
					type="button"
					onclick={dismissPlayerTransition}
					class="mt-4 rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
				>
					Continue
				</button>
				<p class="text-sm text-gray-500">
					Press <kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">Space</kbd> or
					<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">Enter</kbd>
				</p>
			</div>
		</div>
	{:else if currentStudent && currentQuestion}
		<div class="flex flex-1 flex-col p-8">
			<header class="mb-8 flex items-center justify-between">
				<div>
					<h1 class="text-4xl font-bold text-white">{currentStudent.name}</h1>
					{#if progress}
						<p class="mt-2 text-sm text-gray-400">
							Student {progress.studentsCompleted + 1} of {progress.studentsTotal} &middot; Question {progress.slotsCompletedForCurrentStudent +
								1} of {progress.slotsTotalForCurrentStudent}
						</p>
					{/if}
					{#if chainProgress}
						<p class="text-sm text-gray-400">
							Chain question {chainProgress.current} of {chainProgress.total}
						</p>
					{/if}
				</div>
				<button
					onclick={handlePause}
					class="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
				>
					Pause Session
				</button>
			</header>

			<main class="flex-1 space-y-8">
				<div class="rounded-xl bg-gray-800 p-6 shadow-lg">
					<h2 class="text-2xl font-medium text-gray-100">{currentQuestion.text}</h2>
				</div>

				{#if currentSnippet && currentSnippet.code}
					<div class="rounded-xl bg-gray-800 p-6 shadow-lg">
						<CodeBlock
							code={currentSnippet.code}
							language={currentSnippet.language}
							highlight={currentSnippet.highlight}
						/>
					</div>
				{/if}
			</main>

			<footer class="mt-8 text-center">
				<p class="text-sm text-gray-500">
					Press <kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">1</kbd> /
					<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">C</kbd>
					= Correct &middot;
					<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">2</kbd> /
					<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">P</kbd>
					= Partial &middot;
					<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">3</kbd> /
					<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">W</kbd> = Wrong
				</p>
			</footer>
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<p class="text-xl text-gray-400">No questions available.</p>
		</div>
	{/if}
</div>
