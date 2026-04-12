<script lang="ts">
	import '../../../routes/layout.css';
	import Panel from '../Panel.svelte';

	let {
		variant = 'question',
		label
	}: {
		variant?: 'elevated' | 'question';
		label: string;
	} = $props();
</script>

<Panel {variant}>{label}</Panel>
