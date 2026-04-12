<script lang="ts">
	import { tick } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Panel from '$lib/components/Panel.svelte';

	type Preview = 'buttons' | 'card' | 'typography' | null;
	type AnswerLayout = 'withAnswers' | 'cardOnly';

	let selectedPreview = $state<Preview>(null);
	let answerLayout = $state<AnswerLayout>('withAnswers');
	let celebrate = $state(false);
	let wrongShake = $state(false);
	let confettiKey = $state(0);

	async function simulateCorrect() {
		wrongShake = false;
		confettiKey += 1;
		celebrate = true;
	}

	async function simulateWrong() {
		celebrate = false;
		wrongShake = false;
		await tick();
		wrongShake = true;
	}
</script>

<svelte:head>
	<title>Style lab — Quiz show UI</title>
</svelte:head>

<div class="style-lab-cursor-zone stage-quiz-show min-h-screen">
	<div class="mx-auto flex max-w-5xl flex-col gap-xl p-lg">
		<h1 class="text-role-display text-stage-foreground">Quiz show style lab</h1>

		<div class="flex flex-wrap gap-sm">
			<Button variant="primary" onclick={() => (selectedPreview = 'card')}>Open design preview</Button>
		</div>

		<div class="text-role-label text-stage-foreground uppercase tracking-wide">Primitive picker</div>
		<div class="flex flex-wrap gap-sm">
			<Button variant="secondary" onclick={() => (selectedPreview = 'buttons')}>Buttons sample</Button>
			<Button variant="secondary" onclick={() => (selectedPreview = 'card')}>Card &amp; answers</Button>
			<Button variant="secondary" onclick={() => (selectedPreview = 'typography')}>Typography</Button>
		</div>

		<section
			aria-label="Design preview canvas"
			class="relative flex min-h-[20rem] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-white/10 bg-black/20 p-lg"
		>
			{#if selectedPreview === 'card' && celebrate}
				{#key confettiKey}
					<div class="confetti-layer" aria-hidden="true">
						{#each Array.from({ length: 16 }, (_, i) => i) as i}
							<span
								class="confetti-bit palette-{i % 4}"
								style="left: {8 + (i % 5) * 18}%; --delay: {i * 35}ms"
							></span>
						{/each}
					</div>
				{/key}
			{/if}
			{#if selectedPreview === null}
				<div class="m-auto max-w-md text-center">
					<h2 class="text-role-title text-stage-foreground">No sample selected</h2>
					<p class="text-role-body mt-md text-stage-foreground/90">
						Pick a primitive in the list to preview tokens and states.
					</p>
				</div>
			{:else if selectedPreview === 'card'}
				<div class="flex flex-wrap gap-sm">
					<Button variant="secondary" onclick={() => (answerLayout = 'withAnswers')}>Show answer row</Button>
					<Button variant="tertiary" onclick={() => (answerLayout = 'cardOnly')}>Card only (no choices)</Button>
					<Button variant="secondary" onclick={simulateCorrect}>Simulate correct</Button>
					<Button variant="secondary" onclick={simulateWrong}>Simulate wrong</Button>
				</div>
				<div class="mt-xl flex flex-1 flex-col gap-xl">
					{#if answerLayout === 'withAnswers'}
						<div class="flex w-full max-w-2xl flex-col gap-lg">
							<div class="question-panel-shell" class:animate-shake-wrong={wrongShake}>
								<Panel variant="question">
									<h2 class="text-role-title">Sample question card</h2>
									<p class="text-role-body mt-sm">
										This panel uses the question variant: white surface and dark type inside the card.
									</p>
								</Panel>
							</div>
							<div class="flex flex-wrap justify-center gap-sm">
								<Button
									variant="primary"
									class="min-h-[44px] rounded-[var(--radius-control)] bg-answer-a text-white hover:bg-answer-a/90"
									>A</Button
								>
								<Button
									variant="primary"
									class="min-h-[44px] rounded-[var(--radius-control)] bg-answer-b text-white hover:bg-answer-b/90"
									>B</Button
								>
								<Button
									variant="primary"
									class="min-h-[44px] rounded-[var(--radius-control)] bg-answer-c text-white hover:bg-answer-c/90"
									>C</Button
								>
								<Button
									variant="primary"
									class="min-h-[44px] rounded-[var(--radius-control)] bg-answer-d text-white hover:bg-answer-d/90"
									>D</Button
								>
							</div>
						</div>
					{:else}
						<div class="flex flex-1 flex-col items-center justify-center">
							<Panel variant="question" class="max-w-xl">
								<h2 class="text-role-title">Sample question card</h2>
								<p class="text-role-body mt-sm">
									No answer buttons — card-centered layout (D-15).
								</p>
							</Panel>
						</div>
					{/if}
				</div>
			{:else if selectedPreview === 'buttons'}
				<div class="grid w-full gap-md sm:grid-cols-2">
					<div class="flex flex-col gap-sm">
						<span class="text-role-label text-stage-foreground">Primary</span>
						<Button variant="primary">Primary</Button>
					</div>
					<div class="flex flex-col gap-sm">
						<span class="text-role-label text-stage-foreground">Secondary</span>
						<Button variant="secondary">Secondary</Button>
					</div>
					<div class="flex flex-col gap-sm">
						<span class="text-role-label text-stage-foreground">Tertiary</span>
						<Button variant="tertiary">Tertiary</Button>
					</div>
					<div class="flex flex-col gap-sm">
						<span class="text-role-label text-stage-foreground">Destructive</span>
						<Button variant="destructive">Destructive</Button>
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-lg text-stage-foreground">
					<p class="text-role-display">Display role</p>
					<p class="text-role-title">Title role</p>
					<div class="rounded-[var(--radius-panel)] bg-card p-lg text-card-foreground">
						<p class="text-role-body">Body role inside a card (system stack).</p>
					</div>
					<p class="text-role-label uppercase">Label role</p>
				</div>
			{/if}
		</section>

		<div class="text-role-body text-stage-foreground/90">
			<p class="text-role-label text-stage-foreground">Error state (copy)</p>
			<p>Something went wrong loading the preview.</p>
			<p>Refresh the page or return to the home screen.</p>
			<p class="text-role-label mt-lg text-stage-foreground">Destructive confirmation (copy)</p>
			<p>Reset preview</p>
			<p>Reset local preview state? This only affects the lab page.</p>
		</div>
	</div>
</div>

<style>
	/* D-16: custom cursor only for fine pointers; coarse keeps system cursor */
	@media (pointer: fine) {
		.style-lab-cursor-zone {
			cursor:
				url('/cursors/quiz-show-cursor.svg') 16 16,
				auto;
		}
	}

	/* D-17/D-18: CSS-only feedback; disabled under prefers-reduced-motion */
	.confetti-layer {
		pointer-events: none;
		position: absolute;
		inset: 0;
		z-index: 2;
	}

	.confetti-bit {
		position: absolute;
		top: 55%;
		width: 0.45rem;
		height: 0.65rem;
		border-radius: 1px;
		opacity: 0;
		animation: style-lab-confetti-burst 0.85s ease-out forwards;
		animation-delay: var(--delay, 0ms);
	}

	.confetti-bit.palette-0 {
		background: var(--color-primary);
	}
	.confetti-bit.palette-1 {
		background: var(--color-answer-a);
	}
	.confetti-bit.palette-2 {
		background: var(--color-answer-c);
	}
	.confetti-bit.palette-3 {
		background: var(--color-destructive);
	}

	@keyframes style-lab-confetti-burst {
		0% {
			transform: translate3d(0, 0, 0) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translate3d(0, -8rem, 0) rotate(220deg);
			opacity: 0;
		}
	}

	.question-panel-shell.animate-shake-wrong {
		animation: style-lab-shake-wrong 0.45s ease-in-out;
	}

	@keyframes style-lab-shake-wrong {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-8px);
		}
		40% {
			transform: translateX(8px);
		}
		60% {
			transform: translateX(-5px);
		}
		80% {
			transform: translateX(5px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.confetti-layer {
			display: none;
		}

		.confetti-bit {
			animation: none;
		}

		.question-panel-shell.animate-shake-wrong {
			animation: none;
			box-shadow: 0 0 0 2px var(--color-destructive);
		}
	}
</style>
