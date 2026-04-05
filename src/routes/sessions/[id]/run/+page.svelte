<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { SessionEngine } from '$lib/session-engine/index.js';
	import {
		getSession,
		listSessionStudents,
		listStudentsByClassroom,
		listSnippetsByQuestionSet,
		listQuestionsBySnippet,
		listAttemptsBySession
	} from '$lib/db/index.js';
	import type { Question, Snippet } from '$lib/db/types.js';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	let engine = $state.raw<SessionEngine | null>(null);
	let tick = $state(0);
	let recording = $state(false);
	let snippetMap = new Map<string, Snippet>();

	onMount(async () => {
		const sessionId = page.params.id;
		if (!sessionId) {
			goto('/sessions');
			return;
		}

		const session = await getSession(sessionId);
		if (!session) {
			goto('/sessions');
			return;
		}

		const sessionStudents = await listSessionStudents(sessionId);
		const students = await listStudentsByClassroom(session.classroom_id);

		const allQuestions: Question[] = [];
		for (const qsId of session.question_set_ids) {
			const snippets = await listSnippetsByQuestionSet(qsId);
			for (const snippet of snippets) {
				const qs = await listQuestionsBySnippet(snippet.id);
				for (const q of qs) {
					snippetMap.set(q.id, snippet);
				}
				allQuestions.push(...qs);
			}
		}

		const attempts = await listAttemptsBySession(sessionId);

		const rootQs = allQuestions.filter((q) => q.chain_parent_id === null);
		console.log('[ENGINE INIT]', {
			totalQuestions: allQuestions.length,
			rootQuestions: rootQs.length,
			students: students.length,
			sessionStudents: sessionStudents.length,
			questionSetIds: session.question_set_ids,
			sampleQuestion: allQuestions[0],
			sampleChainParentIds: allQuestions.slice(0, 5).map((q) => ({
				text: q.text.slice(0, 40),
				chain_parent_id: q.chain_parent_id,
				typeofChainParent: typeof q.chain_parent_id
			}))
		});

		engine = new SessionEngine(session, sessionStudents, students, allQuestions, attempts);
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
			goto('/sessions');
		}
	}

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
				href="/sessions"
				class="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Back to Sessions
			</a>
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
