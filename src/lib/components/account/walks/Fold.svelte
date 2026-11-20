<script lang="ts">
	// A panel that opens and closes under its heading: the two ways to add
	// walks stay out of the way of the list until they are wanted.
	import type { Snippet } from 'svelte';

	let { title, open = $bindable(false), children }: { title: string; open?: boolean; children: Snippet } = $props();
</script>

<details class="panel fold" bind:open>
	<summary><h2>{title}</h2></summary>
	<div class="fold-body">
		{@render children()}
	</div>
</details>

<style>
	.fold {
		--pad: clamp(1.25rem, 4vw, 2rem);
		display: block;
		padding: 0;
	}

	/* the whole head of the panel opens it, not only the words */
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: var(--pad);
		border-radius: var(--radius);
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary h2 {
		font-size: var(--text-h3);
	}

	/* a small arrow that points down, and up when the panel is open */
	summary::after {
		content: '';
		flex: none;
		width: 0.55rem;
		height: 0.55rem;
		margin: 0 0.35rem 0.2rem;
		border-right: 2px solid var(--ink-3);
		border-bottom: 2px solid var(--ink-3);
		transform: rotate(45deg);
		transition: transform 0.2s var(--ease);
	}

	.fold[open] > summary::after {
		margin-bottom: -0.2rem;
		transform: rotate(-135deg);
	}

	summary:hover::after {
		border-color: var(--ink);
	}

	summary:focus-visible {
		outline-offset: -2px;
	}

	.fold-body {
		display: grid;
		gap: 1.25rem;
		padding: 0 var(--pad) var(--pad);
	}

	/* (as a paragraph that stands in a .panel itself) */
	.fold-body > :global(p) {
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	@media (prefers-reduced-motion: reduce) {
		summary::after {
			transition: none;
		}
	}
</style>
