<script lang="ts">
	// What every page is wrapped in: the fonts and the styles, the bar along
	// the top and the foot.
	import '@fontsource-variable/inter/wght.css';
	import '@fontsource/spectral/latin-600.css';
	import '@fontsource/spectral/latin-ext-600.css';
	import '@fontsource/spectral/latin-500-italic.css';
	import '@fontsource/spectral/latin-ext-500-italic.css';
	import '#lib/styles/tokens.css';
	import '#lib/styles/base.css';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import Footer from '#lib/components/Footer.svelte';
	import Header from '#lib/components/Header.svelte';

	let { children } = $props();

	// A line of code or a table that is wider than the screen scrolls sideways
	// inside its own box. Such a box is given a place in the Tab order, so
	// that it can be scrolled with the arrow keys as well as with a finger.
	function reachByKeyboard() {
		for (const box of document.querySelectorAll<HTMLElement>('main pre, main .table')) {
			if (box.scrollWidth > box.clientWidth + 1) box.tabIndex = 0;
			else box.removeAttribute('tabindex');
		}
	}

	afterNavigate(reachByKeyboard);

	$effect(() => {
		window.addEventListener('resize', reachByKeyboard, { passive: true });
		return () => window.removeEventListener('resize', reachByKeyboard);
	});

	// Going from one page to another, the old page fades into the new one -
	// where the browser can do that, and unless the visitor asked for less
	// motion (the styles in base.css switch it off then).
	onNavigate((navigation) => {
		if (!document.startViewTransition || navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				// (a page change that is cut short by the next one is not an error)
				await navigation.complete.catch(() => {});
			});
			transition.finished.catch(() => {});
			transition.ready.catch(() => {});
		});
	});
</script>

<a class="skip" href="#main">Skip to the page</a>
<Header />
<main id="main" tabindex="-1">
	{@render children()}
</main>
<Footer />

<style>
	.skip {
		position: absolute;
		left: 1rem;
		top: -4rem;
		z-index: 100;
		padding: 0.75rem 1.1rem;
		border-radius: var(--radius-s);
		background: var(--surface);
		color: var(--ink);
		font-weight: 600;
		box-shadow: 0 8px 24px var(--shadow);
	}

	.skip:focus {
		top: 1rem;
	}

	main:focus {
		outline: none;
	}
</style>
