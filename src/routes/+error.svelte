<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<div
	class="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center p-6 text-center"
>
	<h1 class="text-2xl font-semibold text-gray-900">
		{page.status === 404 ? 'Not found' : 'Something went wrong'}
	</h1>
	<p class="mt-2 text-gray-600">{page.error?.message ?? 'An error occurred.'}</p>
	<a href={resolve('/')} class="mt-6 text-blue-600 hover:underline">Back to home</a>
</div>
