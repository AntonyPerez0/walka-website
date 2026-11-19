<script lang="ts">
	// What a page tells browsers, search engines and link previews about
	// itself. Every page has one:  <Seo title="Safety" description="..." />
	import { page } from '$app/state';
	import { SITE_URL } from '$app/env/public';

	let {
		title,
		description,
		home = false
	}: {
		/** The page's name. " - Walka" is added to it. */
		title: string;
		/** One or two plain sentences, at most about 155 characters. */
		description: string;
		/** The home page shows the title as given. */
		home?: boolean;
	} = $props();

	const full = $derived(home ? title : `${title} - Walka`);
	// The address of this page inside the site: "/", "/safety/". It is the
	// same wherever the site is served from, because the route knows it.
	const path = $derived(page.route.id === '/' || !page.route.id ? '/' : `${page.route.id.replace(/\/\([^)]*\)/g, '')}/`);
	// A full address, only when the build knows the site's (see src/env.ts).
	const canonical = $derived(SITE_URL ? `${SITE_URL}${path}` : '');
</script>

<svelte:head>
	<title>{full}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Walka" />
	<meta property="og:title" content={full} />
	<meta property="og:description" content={description} />
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
		<meta property="og:image" content="{SITE_URL}/og.png" />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:alt" content="Walka: walk on your walking pad while you play. The Walka dashboard on a deep blue ground." />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>
