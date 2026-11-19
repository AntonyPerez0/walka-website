<script lang="ts">
	// "The short version" of a page of small print (the terms, the privacy
	// page): a raised band between the top of the page and the article, set
	// on the article's own two columns - the statements where the text will
	// be, and a few links (the documents the page points to) where the list
	// of sections will be. On a narrow screen: the statements, then the links.
	//
	//   <ShortVersion
	//     linksLabel="Disclaimer and licences"
	//     links={[{ label: 'The disclaimer', href: LINKS.disclaimer }]}
	//   >
	//     <li>This site is free to read, and you need no account.</li>
	//     <li>It is provided as is, with no warranty.</li>
	//   </ShortVersion>
	//
	// It is the page's section "short-version" and has its heading: put it
	// between <PageHero> and <Article>, and leave it out of the article's
	// list. Without `links` the statements stand alone, in the same place.
	import type { Snippet } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';

	let {
		id = 'short-version',
		title = 'The short version',
		linksLabel,
		links = [],
		children
	}: {
		id?: string;
		title?: string;
		/** The small label above the links. */
		linksLabel?: string;
		/** A link to another site gets the mark that says so. */
		links?: { label: string; href: string }[];
		/** The statements: one <li> each. */
		children: Snippet;
	} = $props();

	const outside = (href: string) => /^https?:/i.test(href);
</script>

<section class="short" {id} aria-labelledby="{id}-title">
	<div class="container columns">
		<div class="text">
			<h2 id="{id}-title">{title}</h2>
			<ul class="points">
				{@render children()}
			</ul>
		</div>

		{#if links.length > 0}
			<div class="links">
				{#if linksLabel}<p class="label" id="{id}-links">{linksLabel}</p>{/if}
				<ul aria-labelledby={linksLabel ? `${id}-links` : undefined}>
					{#each links as link (link.label)}
						<li>
							<a href={link.href}>
								<span>{link.label}</span>
								{#if outside(link.href)}<Icon name="external" size={16} />{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>

<style>
	.short {
		padding-block: clamp(2.5rem, 6vw, 4.5rem);
		border-bottom: 1px solid var(--line);
		background: var(--bg-raised);
	}

	/* The article's two columns (see Article.svelte): its list of sections
	   starts right under the links, its text right under the statements. */
	.columns {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: clamp(2rem, 6vw, 5.5rem);
		align-items: start;
	}

	.text {
		grid-column: 2;
		grid-row: 1;
		max-width: var(--measure);
	}

	h2 {
		font-size: clamp(1.625rem, 1.4rem + 1vw, 2.125rem); /* as a heading of the article */
	}

	/* ---- the statements: a line each, a little larger than the text ---- */

	.points {
		margin-top: 1.4rem;
	}

	.points > :global(li) {
		position: relative;
		padding: 0.95rem 0 0.95rem 1.75rem;
		border-top: 1px solid var(--line);
		color: var(--ink);
		font-size: var(--text-lede);
		line-height: 1.5;
		text-wrap: pretty;
	}

	/* the small diamond of the site's lists */
	.points > :global(li::before) {
		content: '';
		position: absolute;
		left: 0.2rem;
		top: calc(0.95rem + 0.75em - 0.18em);
		width: 0.36em;
		height: 0.36em;
		background: var(--gold);
		transform: rotate(45deg);
	}

	/* ---- the links: in the manner of the article's list of sections ---- */

	.links {
		grid-column: 1;
		grid-row: 1;
		font-size: var(--text-small);
	}

	.label {
		padding-bottom: 0.9rem;
		color: var(--ink-3);
	}

	.links ul {
		display: grid;
		border-left: 1px solid var(--line);
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.45rem 0 0.45rem 1rem;
		font-weight: 550;
		line-height: 1.4;
		text-decoration: none;
	}

	a:hover span {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	a :global(svg) {
		flex: none;
		opacity: 0.75;
	}

	@media (max-width: 60rem) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
			gap: 2rem;
		}

		.text,
		.links {
			grid-column: 1;
			grid-row: auto;
		}

		.links {
			max-width: var(--measure);
		}

		.label {
			padding-bottom: 0.75rem;
		}

		/* rows to put a thumb on */
		.links ul {
			border-left: 0;
			border-bottom: 1px solid var(--line);
		}

		a {
			justify-content: space-between;
			min-height: 2.75rem;
			padding: 0.6rem 0;
			border-top: 1px solid var(--line);
		}
	}
</style>
