<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	type LayoutData = { showUpgradeNotice?: boolean };
	let { children, data } = $props<{ children: () => unknown; data: LayoutData }>();
	let dismissed = $state(false);
	const isUpgradeNoticeVisible = $derived(Boolean(data?.showUpgradeNotice) && !dismissed);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if isUpgradeNoticeVisible}
	<div class="border-b border-amber-300 bg-amber-50 text-amber-900">
		<div class="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-3 text-sm">
			<p>Local question sets may have been reset after a storage upgrade. Re-import your JSON files if needed.</p>
			<button
				type="button"
				class="rounded border border-amber-400 px-2 py-1 font-medium hover:bg-amber-100"
				onclick={() => (dismissed = true)}
			>
				Dismiss
			</button>
		</div>
	</div>
{/if}
{@render children()}
