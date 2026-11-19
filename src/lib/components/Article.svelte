<script lang="ts">
	// The body of a long page: a list of the page's sections down the left
	// (it stays in view on a wide screen; on a narrow one it is folded away
	// above the text until it is asked for), and the text beside it.
	//
	//   <Article sections={[{ id: 'only-listens', label: 'Walka only listens' }, ...]}>
	//     <section id="only-listens" class="prose"> <h2>Walka only listens</h2> ... </section>
	//   </Article>
	//
	// Every id in `sections` must be the id of something in the page.
	import type { Snippet } from 'svelte';

	let { sections, children }: { sections: { id: string; label: string }[]; children: Snippet } = $props();

	let current = $state('');

	// Marks the section that is being read: the last one whose top has passed
	// the upper third of the screen - none while the page is above the first.
	$effect(() => {
		const elements = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => e !== null);
		let waiting = 0;
		const update = () => {
			waiting = 0;
			const line = window.innerHeight * 0.33;
			let found = '';
			for (const element of elements) {
				if (element.getBoundingClientRect().top <= line) found = element.id;
				else break;
			}
			current = found;
		};
		const onscroll = () => {
			waiting ||= requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onscroll, { passive: true });
		window.addEventListener('resize', onscroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', onscroll);
			window.removeEventListener('resize', onscroll);
			cancelAnimationFrame(waiting);
		};
	});
</script>

<div class="container article">
	<!-- The same list twice: beside the text on a wide screen, folded away
	     above it on a narrow one. Only one of them is shown at a time. -->
	<nav class="toc wide" aria-label="On this page">
		<p class="label">On this page</p>
		<ol>
			{#each sections as section (section.id)}
				<li><a href="#{section.id}" aria-current={current === section.id ? 'true' : undefined}>{section.label}</a></li>
			{/each}
		</ol>
	</nav>

	<nav class="toc narrow" aria-label="On this page">
		<details>
			<summary><span class="label">On this page</span></summary>
			<ol>
				{#each sections as section (section.id)}
					<li><a href="#{section.id}">{section.label}</a></li>
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

	.toc.narrow {
		display: none;
	}

	.toc.wide {
		position: sticky;
		top: calc(var(--header-h) + 2rem);
		align-self: start;
		max-height: calc(100vh - var(--header-h) - 4rem);
		overflow-y: auto;
	}

	.toc .label {
		color: var(--ink-3);
	}

	.toc.wide .label {
		padding-bottom: 0.9rem;
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

	/* One column that never grows wider than the screen, whatever is in it
	   (a long line of code scrolls inside its own box). */
	.text {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: clamp(3rem, 7vw, 5rem);
		min-width: 0;
	}

	/* Each section starts with its heading; a fine line sets it apart. */
	.text > :global(section + section) {
		padding-top: clamp(3rem, 7vw, 5rem);
		border-top: 1px solid var(--line);
	}

	.text > :global(section) {
		min-width: 0;
	}

	@media (max-width: 60rem) {
		.article {
			grid-template-columns: minmax(0, 1fr);
			gap: 2rem;
		}

		.toc.wide {
			display: none;
		}

		.toc.narrow {
			display: block;
		}

		details {
			border: 1px solid var(--line);
			border-radius: var(--radius);
			background: var(--surface);
		}

		summary {
			display: flex;
			align-items: center;
			justify-content: space-between;
			min-height: 3rem;
			padding: 0 1.15rem;
			cursor: pointer;
			list-style: none;
		}

		summary::-webkit-details-marker {
			display: none;
		}

		/* a small chevron that turns when the list is open */
		summary::after {
			content: '';
			width: 0.5rem;
			height: 0.5rem;
			margin-right: 0.2rem;
			border-right: 2px solid var(--gold);
			border-bottom: 2px solid var(--gold);
			transform: translateY(-2px) rotate(45deg);
			transition: transform 0.2s var(--ease);
		}

		details[open] summary::after {
			transform: translateY(2px) rotate(-135deg);
		}

		ol {
			padding: 0 1.15rem 0.5rem;
			border-left: 0;
		}

		a {
			margin-left: 0;
			padding: 0.7rem 0;
			border-left: 0;
			border-top: 1px solid var(--line);
			color: var(--ink-2);
		}
	}
</style>
