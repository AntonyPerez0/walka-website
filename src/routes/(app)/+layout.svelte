<script lang="ts">
	// The account pages: everything a person does signed in, and the public
	// profile. They share their styles and one question to the database -
	// "are you there, and who is this?" - which the public pages never ask.
	import '#lib/styles/app.css';
	import { account } from '#lib/account/account.svelte.ts';

	let { children } = $props();

	$effect(() => {
		void account.start();
	});
</script>

<svelte:head>
	<!-- not for search engines: these pages are a person's own -->
	<meta name="robots" content="noindex" />
</svelte:head>

{@render children()}
