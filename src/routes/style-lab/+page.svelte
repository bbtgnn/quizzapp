<script lang="ts">
	import { animate, createTimeline } from '$lib/motion/anime';
	import { Confetti } from 'svelte-confetti';

	/**
	 * Pixel-faithful shell of `sessions/[id]/run/+page.svelte` (active question view)
	 * with mock data and a floating answer-type switcher for design preview.
	 */
	type AnswerType = 'open' | 'multiple-choice' | 'true-false';

	/** Matches quiz-show tokens in layout.css (primary, answer-a/c, destructive). */
	const confettiColors = ['#e11d48', '#2563eb', '#ca8a04', '#dc2626'] as const;

	let answerType = $state<AnswerType>('multiple-choice');

	const currentStudent = { name: 'Jordan Lee' };
	const progress = {
		studentsCompleted: 0,
		studentsTotal: 4,
		slotsCompletedForCurrentStudent: 1,
		slotsTotalForCurrentStudent: 5
	};
	const currentStepIndex = 0;
	const totalSteps = 3;

	const questionText =
		'What does the following expression evaluate to in JavaScript when both operands are used as shown?';

	const mcOptions = [
		'`"2" + 2` → `"22"` (string concatenation)',
		'`"2" + 2` → `4` (numeric addition)',
		'It throws a TypeError',
		'It returns `undefined`'
	];

	/** A–D: red, yellow, green, blue (style lab preview). */
	const mcPillClasses = [
		'bg-red-600 text-white hover:bg-red-500',
		'bg-yellow-400 text-gray-900 hover:bg-yellow-300',
		'bg-green-600 text-white hover:bg-green-500',
		'bg-blue-600 text-white hover:bg-blue-500'
	] as const;

	let celebrate = $state(false);
	let wrongAnimKey = $state(0);
	let confettiKey = $state(0);

	let cardFloatEl = $state<HTMLDivElement | null>(null);
	let answersFloatEl = $state<HTMLDivElement | null>(null);
	let questionShellEl = $state<HTMLDivElement | null>(null);

	function prefersReducedMotion(): boolean {
		return (
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	/** Gentle vertical drift on the question card (anime loop). */
	$effect(() => {
		const el = cardFloatEl;
		if (typeof window === 'undefined' || !el || prefersReducedMotion()) return;

		const anim = animate(el, {
			y: { from: 0, to: -5 },
			duration: 5000,
			loop: true,
			alternate: true,
			ease: 'inOutSine'
		});

		return () => {
			anim.revert();
		};
	});

	/** Gentle vertical drift on the answer block (slightly different cadence). */
	$effect(() => {
		const el = answersFloatEl;
		if (typeof window === 'undefined' || !el || prefersReducedMotion()) return;

		const anim = animate(el, {
			y: { from: 0, to: -6 },
			duration: 5500,
			loop: true,
			alternate: true,
			ease: 'inOutSine'
		});

		return () => {
			anim.revert();
		};
	});

	/** Horizontal shake on “Wrong” (timeline, remount-safe via revert cleanup). */
	$effect(() => {
		const k = wrongAnimKey;
		const shell = questionShellEl;
		if (typeof window === 'undefined' || k === 0 || !shell) return;

		if (prefersReducedMotion()) {
			shell.style.setProperty('box-shadow', '0 0 0 2px var(--color-destructive)');
			const id = window.setTimeout(() => shell.style.removeProperty('box-shadow'), 650);
			return () => {
				window.clearTimeout(id);
				shell.style.removeProperty('box-shadow');
			};
		}

		const tl = createTimeline();
		tl.add(shell, { x: -8, duration: 90, ease: 'inOutQuad' });
		tl.add(shell, { x: 8, duration: 90, ease: 'inOutQuad' }, '<');
		tl.add(shell, { x: -5, duration: 75, ease: 'inOutQuad' }, '<');
		tl.add(shell, { x: 5, duration: 75, ease: 'inOutQuad' }, '<');
		tl.add(shell, { x: 0, duration: 120, ease: 'outSine' }, '<');

		return () => {
			tl.revert();
		};
	});

	function setAnswerType(next: AnswerType) {
		answerType = next;
	}

	function simulateCorrect() {
		confettiKey += 1;
		celebrate = true;
	}

	function simulateWrong() {
		celebrate = false;
		wrongAnimKey += 1;
	}
</script>

<svelte:head>
	<title>Style lab — Session run preview</title>
</svelte:head>

<!-- Single full-viewport shell matching session run layout (`bg-gray-900`, `p-8` column) -->
<div
	class="style-lab-cursor-zone style-lab-quiz-stage relative flex h-screen w-screen flex-col overflow-auto bg-gray-900 text-gray-100"
>
	{#if celebrate}
		{#key confettiKey}
			<div class="style-lab-confetti-mount" aria-hidden="true">
				<Confetti
					amount={56}
					size={11}
					duration={2400}
					x={[-0.85, 0.85]}
					y={[0.35, 1]}
					xSpread={0.32}
					fallDistance="85vh"
					cone={true}
					rounded={true}
					colorArray={[...confettiColors]}
					disableForReducedMotion={true}
				/>
			</div>
		{/key}
	{/if}

	<div
		class="relative z-[1] mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8"
	>
		<header class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div
				class="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 [font-family:var(--font-display)]"
			>
				<div class="min-w-0">
					<p
						class="[font-family:var(--font-display)] text-sm font-semibold tracking-wide text-gray-500 uppercase"
					>
						Current student
					</p>
					<h1 class="text-2xl leading-tight font-semibold text-white sm:text-3xl">
						{currentStudent.name}
					</h1>
				</div>
				<div class="min-w-0 text-sm leading-snug font-semibold text-gray-400">
					<p>
						Student {progress.studentsCompleted + 1} of {progress.studentsTotal} &middot; Question {progress.slotsCompletedForCurrentStudent +
							1} of {progress.slotsTotalForCurrentStudent}
						{#if totalSteps > 0}
							&middot; Step {currentStepIndex + 1} of {totalSteps}
						{/if}
					</p>
				</div>
			</div>
			<div class="flex shrink-0 items-center gap-3">
				<button
					type="button"
					class="rounded-lg border border-amber-500 px-4 py-2 [font-family:var(--font-display)] text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/10"
				>
					Skip Unit
				</button>
				<button
					type="button"
					class="rounded-lg border border-gray-600 px-4 py-2 [font-family:var(--font-display)] text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
				>
					Pause Session
				</button>
			</div>
		</header>

		<div class="flex min-h-0 flex-1 flex-col items-center justify-center pb-20">
			<div class="flex w-full flex-col items-center gap-3">
				<div class="style-lab-float-card w-full" bind:this={cardFloatEl}>
					<div class="question-panel-shell" bind:this={questionShellEl}>
						<div
							class="rounded-xl bg-card p-6 text-center text-card-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
						>
							<h2 class="text-role-title text-balance text-card-foreground">{questionText}</h2>
						</div>
					</div>
				</div>

				<div class="style-lab-float-answers w-full shrink-0" bind:this={answersFloatEl}>
					{#if answerType === 'open'}
						<p class="text-center text-sm text-gray-500">
							Press <kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">1</kbd> /
							<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">C</kbd>
							= Correct &middot;
							<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">2</kbd> /
							<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">P</kbd>
							= Partial &middot;
							<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">3</kbd> /
							<kbd class="rounded bg-gray-800 px-2 py-1 font-mono text-gray-300">W</kbd> = Wrong
						</p>
					{:else if answerType === 'multiple-choice'}
						<div class="flex w-full flex-col gap-2">
							<p class="text-center text-sm text-gray-400">Select the correct answer:</p>
							<div class="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
								{#each mcOptions as option, i (i)}
									<button
										type="button"
										class="rounded-full px-5 py-3 text-center [font-family:var(--font-display)] text-base font-semibold shadow-md ring-1 ring-black/10 transition-colors {mcPillClasses[
											i
										]}"
									>
										{option}
									</button>
								{/each}
							</div>
						</div>
					{:else if answerType === 'true-false'}
						<div class="flex w-full flex-col gap-2">
							<p class="text-center text-sm text-gray-400">Select the correct answer:</p>
							<div class="flex w-full min-w-0 gap-3">
								<button
									type="button"
									class="flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-full bg-green-600 py-3 [font-family:var(--font-display)] text-xl font-semibold text-white shadow-md ring-1 ring-black/10 transition-colors hover:bg-green-500"
								>
									True
								</button>
								<button
									type="button"
									class="flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-full bg-red-600 py-3 [font-family:var(--font-display)] text-xl font-semibold text-white shadow-md ring-1 ring-black/10 transition-colors hover:bg-red-500"
								>
									False
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Floating preview + feedback (not part of production run UI) -->
	<div
		class="pointer-events-none fixed bottom-6 left-1/2 z-50 flex max-w-[min(100%,28rem)] -translate-x-1/2 justify-center px-4"
		aria-label="Style lab preview controls"
	>
		<div
			class="pointer-events-auto flex w-full flex-col gap-2 rounded-3xl border border-gray-600 bg-gray-950/95 px-3 py-3 shadow-xl backdrop-blur-sm"
			role="group"
		>
			<div class="flex flex-wrap items-center justify-center gap-2">
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Layout</span>
				<button
					type="button"
					class="rounded-full px-4 py-2 [font-family:var(--font-display)] text-sm font-semibold transition-colors {answerType ===
					'open'
						? 'bg-blue-600 text-white'
						: 'text-gray-300 hover:bg-gray-800'}"
					aria-pressed={answerType === 'open'}
					onclick={() => setAnswerType('open')}
				>
					Open
				</button>
				<button
					type="button"
					class="rounded-full px-4 py-2 [font-family:var(--font-display)] text-sm font-semibold transition-colors {answerType ===
					'multiple-choice'
						? 'bg-blue-600 text-white'
						: 'text-gray-300 hover:bg-gray-800'}"
					aria-pressed={answerType === 'multiple-choice'}
					onclick={() => setAnswerType('multiple-choice')}
				>
					Multiple choice
				</button>
				<button
					type="button"
					class="rounded-full px-4 py-2 [font-family:var(--font-display)] text-sm font-semibold transition-colors {answerType ===
					'true-false'
						? 'bg-blue-600 text-white'
						: 'text-gray-300 hover:bg-gray-800'}"
					aria-pressed={answerType === 'true-false'}
					onclick={() => setAnswerType('true-false')}
				>
					True / false
				</button>
			</div>
			<div class="h-px bg-gray-700/80" aria-hidden="true"></div>
			<div class="flex flex-wrap items-center justify-center gap-2">
				<span class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Feedback</span>
				<button
					type="button"
					class="rounded-full bg-emerald-700 px-4 py-2 [font-family:var(--font-display)] text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
					onclick={simulateCorrect}
				>
					Confetti
				</button>
				<button
					type="button"
					class="rounded-full bg-rose-800 px-4 py-2 [font-family:var(--font-display)] text-sm font-semibold text-white transition-colors hover:bg-rose-700"
					onclick={simulateWrong}
				>
					Wrong
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.style-lab-quiz-stage::before {
		content: '';
		position: fixed;
		inset: -22%;
		z-index: 0;
		pointer-events: none;
		opacity: 0.9;
		background-image:
			linear-gradient(rgba(244, 244, 245, 0.055) 1px, transparent 1px),
			linear-gradient(90deg, rgba(244, 244, 245, 0.055) 1px, transparent 1px);
		background-size: 34px 34px;
		transform: rotate(-2.8deg) scale(1.1);
		animation: style-lab-grid-shift 21s ease-in-out infinite;
	}

	@keyframes style-lab-grid-shift {
		0%,
		100% {
			background-position: 0 0;
			transform: rotate(-2.8deg) scale(1.1) translate(0, 0);
		}
		35% {
			background-position: 40px 22px;
			transform: rotate(-2.8deg) scale(1.1) translate(16px, -12px);
		}
		70% {
			background-position: 78px 44px;
			transform: rotate(-2.8deg) scale(1.1) translate(-12px, 10px);
		}
	}

	@media (pointer: fine) {
		.style-lab-cursor-zone {
			cursor:
				url('/cursors/quiz-show-cursor.svg') 16 16,
				auto;
		}
	}

	/* Float motion is driven by anime.js in script (revert on teardown). */

	/* svelte-confetti: fill viewport; burst originates near upper-middle */
	.style-lab-confetti-mount {
		pointer-events: none;
		position: fixed;
		inset: 0;
		z-index: 20;
	}

	.style-lab-confetti-mount :global(.confetti-holder) {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.style-lab-quiz-stage::before {
			animation: none;
			transform: rotate(-2.8deg) scale(1.1);
		}
	}
</style>
