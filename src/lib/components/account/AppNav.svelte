<script lang="ts">
	// The bar along the foot of the account pages on a phone - and wherever
	// the food diary is opened as an app from the home screen. It takes the
	// place of the site's own bar and foot there (src/routes/+layout.svelte),
	// so that the diary, the stats, the walks and the account feel like one
	// app. On a wide screen in a browser it is not shown.
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const ITEMS = [
		{ route: '/(app)/food', path: 'food/', name: 'Diary', icon: 'M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15l-3-2-3 2-3-2-3 2V5A1.5 1.5 0 0 1 7 3.5ZM9 8h6M9 11.5h6M9 15h3' },
		{ route: '/(app)/account/stats', path: 'account/stats/', name: 'Stats', icon: 'M4.5 19.5h15M7 16v-5M11 16V7M15 16v-7M19 16V5' },
		{ route: '/(app)/account/walks', path: 'account/walks/', name: 'Walks', icon: 'M13 4.5a1.5 1.5 0 1 0 0-.01M10 21l2-6 3 3v3M8 12l2-3.5 3.5 1.5 2.5 3M10 8.5 9 14' },
		{ route: '/(app)/account', path: 'account/', name: 'Me', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5' }
	] as const;
</script>

<nav class="app-nav" aria-label="The app">
	{#each ITEMS as item (item.path)}
		<a href={resolve(item.path)} aria-current={page.route.id === item.route ? 'page' : undefined}>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={item.icon} /></svg>
			<span>{item.name}</span>
		</a>
	{/each}
</nav>

<style>
	.app-nav {
		position: fixed;
		inset-inline: 0;
		bottom: 0;
		z-index: 50;
		display: none;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		padding: 0.3rem 0.5rem max(0.3rem, env(safe-area-inset-bottom));
		border-top: 1px solid var(--line);
		background: var(--surface);
		box-shadow: 0 -8px 24px -18px var(--shadow);
	}

	a {
		display: grid;
		justify-items: center;
		gap: 0.15rem;
		min-height: 3.4rem;
		padding: 0.35rem 0.25rem;
		border-radius: var(--radius-s);
		color: var(--ink-3);
		font: 600 0.75rem/1.2 var(--font-text);
		text-decoration: none;
	}

	a[aria-current='page'] {
		color: var(--accent);
	}

	/* the page one is on: a mark under its name as well, not only a colour */
	a[aria-current='page'] span {
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.3em;
	}

	a:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	@media (max-width: 40rem), (display-mode: standalone) {
		.app-nav {
			display: grid;
		}
	}
</style>
