<script lang="ts">
	// The top of a page other than the home page: the small label, the
	// heading (the page's one <h1>) and a sentence or two.
	//
	//   <PageHero label="Before you walk" title="Safety">
	//     <p>Walka moves a motorised belt while you stand on it.</p>
	//   </PageHero>
	import type { Snippet } from 'svelte';
	import Sky from './Sky.svelte';

	let { label, title, children }: { label?: string; title: string; children?: Snippet } = $props();
</script>

<header class="page-hero">
	<Sky quiet />
	<div class="container">
		{#if label}<p class="label">{label}</p>{/if}
		<h1>{title}</h1>
		{#if children}<div class="lede">{@render children()}</div>{/if}
	</div>
</header>

<style>
	.page-hero {
		position: relative;
		isolation: isolate;
		/* the sky runs up behind the bar along the top */
		margin-top: calc(-1 * var(--header-h));
		padding-top: calc(var(--header-h) + clamp(3rem, 1.5rem + 6vw, 6.5rem));
		padding-bottom: clamp(2.5rem, 6vw, 4.5rem);
		border-bottom: 1px solid var(--line);
	}

	h1 {
		max-width: 18ch;
		margin-top: 1rem;
	}

	.lede {
		display: grid;
		gap: 0.75em;
		max-width: 40rem;
		margin-top: clamp(1.1rem, 2.5vw, 1.6rem);
	}
</style>
