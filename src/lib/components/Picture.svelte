<script lang="ts">
	// A picture from src/images, in the formats and widths that
	// scripts/images.mjs made of it. `name` is the file's name without its
	// ending: src/images/dashboard-dark.png is "dashboard-dark".
	//
	//   <Picture name="share-sapphire" alt="..." sizes="(min-width: 60rem) 30rem, 100vw" />
	//
	// `narrow` names a second picture that is shown instead on a narrow
	// screen - the dashboard as it looks on a phone, say.
	import { asset } from '$app/paths';
	import manifest from '#lib/generated/images.json';

	type Entry = {
		width: number;
		height: number;
		sources: { type: string; set: { file: string; width: number }[] }[];
		fallback: { file: string; width: number; height: number; type: string };
	};

	let {
		name,
		alt,
		sizes = '100vw',
		narrow,
		narrowBelow = '40rem',
		narrowSizes = '100vw',
		lazy = true,
		class: className = ''
	}: {
		name: string;
		/** What the picture shows. An empty string for a picture that is decoration only. */
		alt: string;
		/** How wide the picture is drawn, for the browser to pick a file: "(min-width: 60rem) 30rem, 100vw". */
		sizes?: string;
		/** A picture for narrow screens, and the width below which it is used. */
		narrow?: string;
		narrowBelow?: string;
		/** How wide the narrow picture is drawn: "calc(100vw - 3.75rem)". */
		narrowSizes?: string;
		/** false for a picture on the first screen: it is then fetched at once, and first. */
		lazy?: boolean;
		class?: string;
	} = $props();

	const pictures = manifest as Record<string, Entry>;
	const picture = $derived(pictures[name]);
	const small = $derived(narrow ? pictures[narrow] : undefined);

	const url = (file: string) => asset(file as Parameters<typeof asset>[0]);
	const srcset = (set: Entry['sources'][number]['set']) => set.map((s) => `${url(s.file)} ${s.width}w`).join(', ');
</script>

{#if picture}
	<picture class={className}>
		{#if small}
			{#each small.sources as source (source.type)}
				<source
					media="(max-width: {narrowBelow})"
					type={source.type}
					srcset={srcset(source.set)}
					sizes={narrowSizes}
					width={small.width}
					height={small.height}
				/>
			{/each}
		{/if}
		{#each picture.sources as source (source.type)}
			<source type={source.type} srcset={srcset(source.set)} {sizes} width={picture.width} height={picture.height} />
		{/each}
		<img
			src={url(picture.fallback.file)}
			width={picture.width}
			height={picture.height}
			{alt}
			loading={lazy ? 'lazy' : 'eager'}
			decoding="async"
			fetchpriority={lazy ? undefined : 'high'}
		/>
	</picture>
{:else}
	<p class="missing">Picture "{name}" is not in src/images.</p>
{/if}

<style>
	picture {
		display: block;
	}

	img {
		display: block;
		width: 100%;
		height: auto;
	}

	.missing {
		color: #d03b3b;
		font-weight: 600;
	}
</style>
