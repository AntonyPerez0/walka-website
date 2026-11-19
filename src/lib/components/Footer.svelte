<script lang="ts">
	// The foot of every page. The line that says whose Walka is not stands
	// here, on every page - scripts/verify.mjs checks that it does.
	import { resolve } from '$app/paths';
	import Logo from './Logo.svelte';
	import Ornament from './Ornament.svelte';
	import { LEGAL, NAV } from '#lib/nav.ts';
	import { LINKS } from '#lib/site.ts';
</script>

<footer class="foot">
	<div class="container container--wide">
		<Ornament width="22rem" />

		<div class="columns">
			<div class="about">
				<a class="brand" href={resolve('/')} aria-label="Walka - home">
					<Logo size={28} />
					<span>Walka</span>
				</a>
				<p>Walk on your walking pad while you play. Free, and made in the open.</p>
			</div>

			<nav aria-label="Walka">
				<h2 class="label">Walka</h2>
				<ul>
					{#each NAV as item (item.path)}
						<li><a href={resolve(item.path)}>{item.label}</a></li>
					{/each}
				</ul>
			</nav>

			<nav aria-label="The project">
				<h2 class="label">The project</h2>
				<ul>
					<li><a href={LINKS.repo}>Walka on GitHub</a></li>
					<li><a href={LINKS.latestRelease}>The latest release</a></li>
					<li><a href={LINKS.issues}>Report a bug</a></li>
					<li><a href={LINKS.security}>Report a security problem</a></li>
				</ul>
			</nav>

			<nav aria-label="The small print">
				<h2 class="label">The small print</h2>
				<ul>
					<li><a href={LINKS.disclaimer}>Disclaimer</a></li>
					{#each LEGAL as item (item.path)}
						<li><a href={resolve(item.path)}>{item.label}</a></li>
					{/each}
					<li><a href={LINKS.licence}>MIT licence</a></li>
				</ul>
			</nav>
		</div>

		<div class="notice">
			<p>
				Walka is a fan-made tool. It is not affiliated with or endorsed by Blizzard Entertainment, UREVO, WELLFIT or any
				other maker of treadmills. World of Warcraft is a trademark of Blizzard Entertainment, Inc.; the other names
				belong to their owners.
			</p>
			<p>
				It is provided as is, with no warranty, and you use it at your own risk: see the
				<a href={LINKS.disclaimer}>disclaimer</a>.
			</p>
		</div>
	</div>
</footer>

<style>
	.foot {
		padding: clamp(3.5rem, 8vw, 6rem) 0 clamp(2rem, 5vw, 3.5rem);
		background: var(--bg-raised);
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
		gap: 2.5rem 2rem;
		margin-top: clamp(2.5rem, 6vw, 4rem);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 2.75rem;
		color: var(--ink);
		font: 650 1.1875rem/1 var(--font-text);
		letter-spacing: -0.015em;
		text-decoration: none;
	}

	.about p {
		max-width: 22rem;
		margin-top: 0.75rem;
		color: var(--ink-2);
		font: italic 500 1.1875rem/1.45 var(--font-display);
	}

	h2 {
		margin-bottom: 0.6rem;
		color: var(--ink-3);
	}

	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 2.5rem;
		color: var(--ink-2);
		text-decoration: none;
	}

	nav a:hover {
		color: var(--ink);
		text-decoration: underline;
	}

	.notice {
		display: grid;
		gap: 0.6rem;
		max-width: 60rem;
		margin-top: clamp(2.5rem, 6vw, 4rem);
		padding-top: 1.75rem;
		border-top: 1px solid var(--line);
		font-size: var(--text-fine);
		line-height: 1.6;
	}

	.notice a {
		color: inherit;
	}

	@media (max-width: 52rem) {
		.columns {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.about {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 26rem) {
		.columns {
			grid-template-columns: 1fr;
		}
	}
</style>
