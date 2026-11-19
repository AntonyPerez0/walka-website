<script lang="ts">
	// One question and its answer, folded until it is asked.
	//
	//   <Question id="is-it-free" q="Is it free?">
	//     <p>Yes. Walka is free, and stays free.</p>
	//   </Question>
	//
	// A link to the page with #is-it-free opens that question.
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let { id, q, children }: { id: string; q: string; children: Snippet } = $props();

	let details = $state<HTMLDetailsElement>();

	$effect(() => {
		const open = () => {
			if (details && decodeURIComponent(location.hash.slice(1)) === id) details.open = true;
		};
		open();
		window.addEventListener('hashchange', open);
		return () => window.removeEventListener('hashchange', open);
	});
</script>

<details {id} bind:this={details}>
	<summary>
		<h3>{q}</h3>
		<span class="mark"><Icon name="chevron" size={22} /></span>
	</summary>
	<div class="answer prose">
		{@render children()}
	</div>
</details>

<style>
	details {
		border-bottom: 1px solid var(--line);
		scroll-margin-top: calc(var(--header-h) + 1rem);
	}

	summary {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem;
		min-height: 3.75rem;
		padding-block: 1rem;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	h3 {
		font: 600 1.125rem/1.4 var(--font-text);
		letter-spacing: -0.005em;
		transition: color 0.15s;
	}

	summary:hover h3 {
		color: var(--accent);
	}

	.mark {
		color: var(--gold);
		transition: transform 0.25s var(--ease);
	}

	details[open] .mark {
		transform: rotate(180deg);
	}

	.answer {
		padding: 0 2.5rem 1.5rem 0;
	}

	@media (max-width: 36rem) {
		.answer {
			padding-right: 0;
		}
	}
</style>
