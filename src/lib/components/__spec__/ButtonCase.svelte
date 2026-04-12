<script lang="ts">
	import '../../../routes/layout.css';
	import Button from '../Button.svelte';

	let {
		variant = 'primary',
		label
	}: {
		variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
		label: string;
	} = $props();
</script>

<Button {variant}>{label}</Button>
