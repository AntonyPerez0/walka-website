<script lang="ts">
	// The top of a section: the small label, the heading, and a sentence or
	// two under it if there is one.
	//
	//   <SectionHead label="What you get" title="Your character runs. You walk." />
	import type { Snippet } from 'svelte';

	let {
		label,
		title,
		children,
		center = false,
		id
	}: {
		label?: string;
		title: string;
		/** A sentence or two under the heading. */
		children?: Snippet;
		center?: boolean;
		/** Gives the heading an id, for a link straight to the section. */
		id?: string;
	} = $props();
</script>

<header class="head" class:center>
	{#if label}<p class="label">{label}</p>{/if}
	<h2 {id}>{title}</h2>
	{#if children}<div class="lede">{@render children()}</div>{/if}
</header>

<style>
	.head {
		display: grid;
		gap: 0.9rem;
		max-width: 44rem;
	}

	.head.center {
		margin-inline: auto;
		justify-items: center;
		text-align: center;
	}

	.lede {
		margin-top: 0.35rem;
	}
</style>
