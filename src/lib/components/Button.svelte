<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

	let {
		variant = 'primary',
		class: className = '',
		children,
		type = 'button',
		...rest
	}: Omit<HTMLButtonAttributes, 'type' | 'class' | 'children'> & {
		variant?: Variant;
		class?: string;
		children: Snippet;
		type?: HTMLButtonAttributes['type'];
	} = $props();

	const base =
		'inline-flex items-center justify-center gap-sm font-semibold transition-colors ' +
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
		'focus-visible:ring-offset-2 focus-visible:ring-offset-card ' +
		'disabled:pointer-events-none disabled:opacity-50';

	const variants: Record<Variant, string> = {
		primary:
			'min-h-[44px] min-w-[44px] rounded-full bg-primary px-6 text-white hover:bg-primary/90',
		secondary:
			'min-h-[40px] rounded-[var(--radius-control)] border-2 border-primary/50 bg-transparent ' +
			'text-primary hover:bg-primary/10',
		tertiary:
			'min-h-[40px] rounded-[var(--radius-control)] bg-transparent text-primary underline-offset-4 ' +
			'hover:underline',
		destructive:
			'min-h-[40px] rounded-[var(--radius-control)] bg-destructive px-4 text-white hover:bg-destructive/90'
	};
</script>

<button class="{base} {variants[variant]} {className}" {type} {...rest}>{@render children()}</button>
