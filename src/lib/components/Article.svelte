<script lang="ts">
	// The body of a long page: a list of the page's sections down the left
	// (it stays in view on a wide screen and folds away on a narrow one), and
	// the text beside it.
	//
	//   <Article sections={[{ id: 'stopping', label: 'Stopping the belt' }, ...]}>
	//     <section id="stopping" class="prose"> <h2>Stopping the belt</h2> ... </section>
	//   </Article>
	//
	// Every id in `sections` must be the id of something in the page.
	import type { Snippet } from 'svelte';

	let { sections, children }: { sections: { id: string; label: string }[]; children: Snippet } = $props();

	let current = $state('');

	// Marks the section that is being read.
	$effect(() => {
		if (typeof IntersectionObserver === 'undefined') return;
		const visible = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) visible.add(entry.target.id);
					else visible.delete(entry.target.id);
				}
				const first = sections.find((s) => visible.has(s.id));
				if (first) current = first.id;
			},
			{ rootMargin: '-15% 0px -55% 0px' }
		);
		for (const section of sections) {
			const element = document.getElementById(section.id);
			if (element) observer.observe(element);
		}
		return () => observer.disconnect();
	});
</script>

<div class="container article">
	<nav class="toc" aria-label="On this page">
		<details open>
			<summary class="label">On this page</summary>
			<ol>
				{#each sections as section (section.id)}
					<li><a href="#{section.id}" aria-current={current === section.id ? 'true' : undefined}>{section.label}</a></li>
				{/each}
			</ol>
		</details>
	</nav>

	<div class="text">
		{@render children()}
	</div>
</div>

<style>
	.article {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: clamp(2rem, 6vw, 5.5rem);
		padding-block: clamp(2.5rem, 6vw, 5rem) var(--section);
	}

	.toc {
		font-size: var(--text-small);
	}

	.toc details {
		position: sticky;
		top: calc(var(--header-h) + 2rem);
		max-height: calc(100vh - var(--header-h) - 4rem);
		overflow-y: auto;
	}

	summary {
		padding-bottom: 0.9rem;
		color: var(--ink-3);
		list-style: none;
		pointer-events: none; /* always open on a wide screen */
	}

	summary::-webkit-details-marker {
		display: none;
	}

	ol {
		display: grid;
		border-left: 1px solid var(--line);
	}

	a {
		display: block;
		margin-left: -1px;
		padding: 0.45rem 0 0.45rem 1rem;
		border-left: 1px solid transparent;
		color: var(--ink-3);
		line-height: 1.4;
		text-decoration: none;
		transition:
			color 0.15s,
			border-color 0.15s;
	}

	a:hover {
		color: var(--ink);
	}

	a[aria-current='true'] {
		border-left-color: var(--gold);
		color: var(--ink);
	}

	.text {
		display: grid;
		gap: clamp(3rem, 7vw, 5rem);
		min-width: 0;
	}

	/* Each section starts with its heading; a fine line sets it apart. */
	.text > :global(section + section) {
		padding-top: clamp(3rem, 7vw, 5rem);
		border-top: 1px solid var(--line);
	}

	.text > :global(section) {
		scroll-margin-top: calc(var(--header-h) + 1.5rem);
	}

	@media (max-width: 60rem) {
		.article {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.toc details {
			position: static;
			max-height: none;
			padding: 1rem 1.15rem;
			border: 1px solid var(--line);
			border-radius: var(--radius);
			background: var(--surface);
		}

		summary {
			padding-bottom: 0;
			pointer-events: auto;
			cursor: pointer;
		}

		.toc details[open] summary {
			padding-bottom: 0.75rem;
		}

		ol {
			border-left: 0;
		}

		a {
			margin-left: 0;
			padding: 0.6rem 0;
			border-left: 0;
			border-top: 1px solid var(--line);
			color: var(--ink-2);
		}
	}
</style>
