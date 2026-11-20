<script lang="ts">
	// A picture that has a dark and a light version (the dashboard, say): the
	// one that matches the page is shown. Both are in the page; the styles
	// hide one, and a hidden picture is not fetched.
	//
	//   <ThemedPicture name="dashboard" alt="..." />          dashboard-dark, dashboard-light
	//   <ThemedPicture name="dashboard" narrow="dashboard-phone" alt="..." />
	//
	// `first` is for the one picture on a page's first screen: the browser is
	// told about it in the page's head, so it is fetched before anything else.
	import { asset } from '$app/paths';
	import manifest from '#lib/generated/images.json';
	import Picture from './Picture.svelte';

	let {
		name,
		narrow,
		narrowBelow = '40rem',
		narrowSizes = '100vw',
		alt,
		sizes = '100vw',
		first = false,
		class: className = ''
	}: {
		/** The pictures are src/images/<name>-dark and <name>-light. */
		name: string;
		/** The same for narrow screens: <narrow>-dark and <narrow>-light. */
		narrow?: string;
		narrowBelow?: string;
		/** How wide the narrow picture is drawn (see Picture.svelte). */
		narrowSizes?: string;
		alt: string;
		sizes?: string;
		first?: boolean;
		class?: string;
	} = $props();

	type Entry = { sources: { type: string; set: { file: string; width: number }[] }[] };
	const pictures = manifest as unknown as Record<string, Entry>;

	// "40rem" -> "40.01rem": where the wide picture takes over from the narrow one.
	const justAbove = $derived(narrowBelow.replace(/^[\d.]+/, (n) => String(Number(n) + 0.01)));

	// What to fetch early: the AVIF of the picture that this screen and this
	// colour scheme will show. (A browser that cannot read AVIF skips these.)
	const early = $derived.by(() => {
		if (!first) return [];
		const links: { media: string; srcset: string; sizes: string }[] = [];
		for (const scheme of ['dark', 'light'] as const) {
			const wide = pictures[`${name}-${scheme}`]?.sources.find((s) => s.type === 'image/avif');
			const small = narrow ? pictures[`${narrow}-${scheme}`]?.sources.find((s) => s.type === 'image/avif') : undefined;
			const set = (source: Entry['sources'][number]) =>
				source.set.map((s) => `${asset(s.file as Parameters<typeof asset>[0])} ${s.width}w`).join(', ');
			const colour = `(prefers-color-scheme: ${scheme})`;
			if (small) links.push({ media: `${colour} and (max-width: ${narrowBelow})`, srcset: set(small), sizes: narrowSizes });
			if (wide) links.push({ media: small ? `${colour} and (min-width: ${justAbove})` : colour, srcset: set(wide), sizes });
		}
		return links;
	});
</script>

<svelte:head>
	{#each early as link (link.media)}
		<link rel="preload" as="image" type="image/avif" media={link.media} imagesrcset={link.srcset} imagesizes={link.sizes} fetchpriority="high" />
	{/each}
</svelte:head>

<div class="only-dark">
	<Picture name="{name}-dark" narrow={narrow ? `${narrow}-dark` : undefined} {narrowBelow} {narrowSizes} {alt} {sizes} class={className} />
</div>
<div class="only-light">
	<Picture name="{name}-light" narrow={narrow ? `${narrow}-light` : undefined} {narrowBelow} {narrowSizes} {alt} {sizes} class={className} />
</div>
