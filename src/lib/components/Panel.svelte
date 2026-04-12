<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Variant = 'elevated' | 'question';

	let {
		variant = 'elevated',
		class: className = '',
		children,
		...rest
	}: HTMLAttributes<HTMLDivElement> & {
		variant?: Variant;
		class?: string;
		children: Snippet;
	} = $props();

	const base = 'shadow-panel rounded-[var(--radius-panel)] p-lg';

	const variants: Record<Variant, string> = {
		elevated: 'bg-surface-elevated text-card-foreground',
		question: 'bg-card text-card-foreground'
	};
</script>

<div class="{base} {variants[variant]} {className}" {...rest}>{@render children()}</div>
