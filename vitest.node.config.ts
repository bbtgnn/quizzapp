import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Node-only unit tests without SvelteKit/Playwright (fast CI / local runs). */
export default defineConfig({
	test: {
		environment: 'node',
		/** Keep narrow: a broad glob makes Vitest crawl the tree before applying CLI filters. */
		include: ['src/lib/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/lib/server/**']
	},
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	}
});
