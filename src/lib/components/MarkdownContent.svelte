<script lang="ts">
	import { marked } from 'marked';

	let { body }: { body: string } = $props();

	let html = $derived(marked.parse(body) as string);
</script>

<div class="prose prose-invert max-w-none">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html html}
</div>
