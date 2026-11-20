<script lang="ts">
	// What every page is wrapped in: the fonts and the styles, the bar along
	// the top and the foot.
	import '@fontsource-variable/inter/wght.css';
	// (Only the Latin cut of Spectral: nothing on the site is written in
	// letters beyond it, and a second cut would be fetched on every visit.)
	import '@fontsource/spectral/latin-600.css';
	import '@fontsource/spectral/latin-500-italic.css';
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

	// A jump inside a page glides (base.css) - but only once the page has
	// started: a page that is opened far down, or reloaded there, is put in
	// its place in one step.
	$effect(() => {
		const frame = requestAnimationFrame(() => document.documentElement.classList.add('ready'));
		return () => cancelAnimationFrame(frame);
	});

	// Going from one page to another, the old page fades into the new one -
	// where the browser can do that, and unless the visitor asked for less
	// motion (the styles in base.css switch it off then).
	//
	// The new page is put at its top (or, going back, where it was left) in
	// one step. The gliding is switched off for the length of a page change,
	// or the new page would arrive far down and roll to its place for a
	// second and more. Page changes can overlap (Back, pressed twice): it is
	// switched on again when the last of them has settled.
	let changing = 0;

	onNavigate((navigation) => {
		// A move inside one page needs none of this. But Back, pressed in the
		// moment before a fade starts, looks like one (the address has not
		// changed yet): while a page change is under way it is treated as a
		// page change too, so that it lands last and the page that is shown
		// is the page the address names.
		if (changing === 0 && navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		const root = document.documentElement;
		// (a page change that is cut short by the next one is not an error)
		const settled = navigation.complete.catch(() => {});
		changing += 1;
		root.style.scrollBehavior = 'auto';
		settled.finally(() => {
			changing -= 1;
			if (changing === 0) root.style.scrollBehavior = '';
		});
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await settled;
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
