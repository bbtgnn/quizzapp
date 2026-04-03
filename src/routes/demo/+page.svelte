<script lang="ts">
	import { resolve } from '$app/paths';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const tsCode = `function add(a: number, b: number): number {
  return a + b;
}`;

	const pythonCode = `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    sequence = [0, 1]
    while len(sequence) < n:
        next_val = sequence[-1] + sequence[-2]
        sequence.append(next_val)
        
    return sequence`;

	const htmlCode = `<div class="container">
  <h1>Hello World</h1>
  <p>This is a test.</p>
</div>`;
</script>

<div class="mx-auto max-w-4xl space-y-12 p-8">
	<div>
		<h1 class="mb-2 text-3xl font-bold">CodeBlock Component Demo</h1>
		<p class="text-gray-600">Testing the Shiki syntax highlighter integration.</p>
		<a href={resolve('/demo/playwright')} class="mt-4 inline-block text-blue-500 hover:underline"
			>Go to Playwright Demo</a
		>
	</div>

	<section class="space-y-4">
		<h2 class="text-xl font-semibold">1. TypeScript with single line highlight (Line 2)</h2>
		<CodeBlock code={tsCode} language="typescript" highlight={{ startLine: 2, endLine: 2 }} />
	</section>

	<section class="space-y-4">
		<h2 class="text-xl font-semibold">2. Python with no highlight</h2>
		<CodeBlock code={pythonCode} language="python" />
	</section>

	<section class="space-y-4">
		<h2 class="text-xl font-semibold">3. HTML with multi-line highlight (Lines 2-3)</h2>
		<CodeBlock code={htmlCode} language="html" highlight={{ startLine: 2, endLine: 3 }} />
	</section>
</div>
