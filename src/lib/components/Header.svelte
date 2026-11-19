<script lang="ts">
	// The bar along the top of every page: the mark, the pages, the switch
	// between light and dark, and the way to the downloads. On a narrow
	// screen the pages fold into a menu - a <details>, so it opens without
	// scripts too.
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { NAV } from '#lib/nav.ts';

	let scrolled = $state(false);
	let menu = $state<HTMLDetailsElement>();

	const current = (path: string) => page.route.id === `/${path.replace(/\/$/, '')}`;

	$effect(() => {
		const update = () => (scrolled = window.scrollY > 8);
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => window.removeEventListener('scroll', update);
	});

	afterNavigate(() => {
		if (menu) menu.open = false;
	});

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && menu?.open) {
			menu.open = false;
			menu.querySelector('summary')?.focus();
		}
	}
</script>

<svelte:window {onkeydown} />

<header class="bar" class:scrolled>
	<div class="container container--wide row">
		<a class="brand" href={resolve('/')} aria-label="Walka - home">
			<Logo size={32} />
			<span>Walka</span>
		</a>

		<nav class="pages" aria-label="Pages">
			<ul>
				{#each NAV as item (item.path)}
					<li><a href={resolve(item.path)} aria-current={current(item.path) ? 'page' : undefined}>{item.label}</a></li>
				{/each}
			</ul>
		</nav>

		<div class="tools">
			<ThemeToggle />
			<a class="button button--small get" href={resolve('downloads/')}>Download</a>

			<details class="menu" bind:this={menu}>
				<summary aria-label="Menu">
					<span class="when-closed"><Icon name="menu" /></span>
					<span class="when-open"><Icon name="close" /></span>
				</summary>
				<nav class="sheet" aria-label="Pages">
					<ul>
						{#each NAV as item (item.path)}
							<li><a href={resolve(item.path)} aria-current={current(item.path) ? 'page' : undefined}>{item.label}</a></li>
						{/each}
					</ul>
				</nav>
			</details>
		</div>
	</div>
</header>

<style>
	.bar {
		position: sticky;
		top: 0;
		z-index: 50;
		view-transition-name: site-bar; /* it does not fade when the page changes */
		height: var(--header-h);
		border-bottom: 1px solid transparent;
		transition:
			background 0.25s,
			border-color 0.25s,
			backdrop-filter 0.25s;
	}

	.bar.scrolled,
	.bar:has(.menu[open]) {
		border-bottom-color: var(--line);
		background: var(--scrim);
		-webkit-backdrop-filter: blur(14px) saturate(1.3);
		backdrop-filter: blur(14px) saturate(1.3);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		height: 100%;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.7rem;
		min-height: 2.75rem;
		margin-right: auto;
		color: var(--ink);
		font: 650 1.3125rem/1 var(--font-text);
		letter-spacing: -0.015em;
		text-decoration: none;
	}

	.pages ul {
		display: flex;
		gap: 0.25rem;
	}

	.pages a,
	.sheet a {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 0.9rem;
		color: var(--ink-2);
		font-size: var(--text-small);
		font-weight: 500;
		text-decoration: none;
		transition: color 0.15s;
	}

	.pages a:hover,
	.pages a[aria-current='page'] {
		color: var(--ink);
	}

	/* the page you are on: a small gold diamond under its name */
	.pages a[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 0.15rem;
		width: 5px;
		height: 5px;
		background: var(--gold);
		transform: translateX(-50%) rotate(45deg);
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.menu {
		display: none;
	}

	.menu summary {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		color: var(--ink);
		cursor: pointer;
		list-style: none;
	}

	.menu summary::-webkit-details-marker {
		display: none;
	}

	.menu .when-open,
	.menu[open] .when-closed {
		display: none;
	}

	.menu[open] .when-open {
		display: grid;
	}

	.sheet {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		padding: 0.5rem var(--gutter) 1.25rem;
		border-bottom: 1px solid var(--line);
		background: var(--bg);
		box-shadow: 0 24px 40px -20px var(--shadow);
	}

	.sheet ul {
		display: grid;
	}

	.sheet li + li {
		border-top: 1px solid var(--line);
	}

	.sheet a {
		display: flex;
		min-height: 3.5rem;
		padding: 0;
		color: var(--ink);
		font: 600 1.375rem/1.2 var(--font-display);
	}

	.sheet a[aria-current='page'] {
		color: var(--gold);
	}

	@media (max-width: 52rem) {
		.pages {
			display: none;
		}

		.menu {
			display: block;
		}

		.row {
			gap: 0.5rem;
		}
	}

	@media (max-width: 26rem) {
		.get {
			display: none;
		}
	}
</style>
