import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PanelCase from './__spec__/PanelCase.svelte';

describe('Panel.svelte', () => {
	it('renders question variant with body text', async () => {
		await render(PanelCase, {
			variant: 'question',
			label: 'Card body'
		});

		await expect.element(page.getByText('Card body')).toBeInTheDocument();
	});
});
