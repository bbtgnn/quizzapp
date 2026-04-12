import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ButtonCase from './__spec__/ButtonCase.svelte';

describe('Button.svelte', () => {
	it('renders primary with accessible name and min 44px box', async () => {
		await render(ButtonCase, {
			variant: 'primary',
			label: 'Start'
		});

		const btn = page.getByRole('button', { name: 'Start' });
		await expect.element(btn).toBeInTheDocument();
		const el = btn.element();
		const { height, width } = el.getBoundingClientRect();
		expect(height).toBeGreaterThanOrEqual(44);
		expect(width).toBeGreaterThanOrEqual(44);
	});

	it('renders destructive variant with Delete label', async () => {
		await render(ButtonCase, {
			variant: 'destructive',
			label: 'Delete'
		});

		await expect.element(page.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
	});
});
