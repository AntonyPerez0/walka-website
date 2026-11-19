<script lang="ts">
	// The Share picture in its five themes, side by side, each with its
	// name. The pictures are Walka's own output: the Share page made them,
	// with the demo character.
	//
	// On a wide column all five stand in a row. On a narrow one the row is
	// wider than the screen and moves sideways inside its own box. Each
	// picture is a link to itself at full size (which also lets the row be
	// reached and moved with a keyboard).
	import { asset } from '$app/paths';
	import Picture from '#lib/components/Picture.svelte';
	import manifest from '#lib/generated/images.json';

	const THEMES = [
		{ id: 'sapphire', name: 'Sapphire' },
		{ id: 'ember', name: 'Ember' },
		{ id: 'wildwood', name: 'Wildwood' },
		{ id: 'frost', name: 'Frost' },
		{ id: 'parchment', name: 'Parchment' }
	] as const;

	// The picture as a file of its own: the PNG that every browser can open.
	const files = manifest as unknown as Record<string, { fallback: { file: string } }>;
	const whole = (name: string) => asset(files[name].fallback.file as Parameters<typeof asset>[0]);
</script>

<figure class="themes">
	<ul>
		{#each THEMES as theme, i (theme.id)}
			<li>
				<a href={whole(`share-${theme.id}`)} rel="external">
					<Picture
						name="share-{theme.id}"
						sizes="(min-width: 60rem) 11rem, (min-width: 40rem) 19vw, 58vw"
						alt={i === 0
							? "A Share picture in the Sapphire theme: real-world steps and miles walked, the character's level, time played, character steps, calories, and the road it travelled on a small map."
							: `The same Share picture in the ${theme.name} theme.`}
					/>
					<span class="visually-hidden">Open this picture at full size.</span>
				</a>
				<p class="label label--gold">{theme.name}</p>
			</li>
		{/each}
	</ul>
	<figcaption>Share pictures in the five themes, made with the demo character: its numbers are made up.</figcaption>
</figure>

<style>
	/* (.themes in front: the page's own list styles must not reach in.) */
	.themes ul {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: clamp(0.75rem, 1.6vw, 1.25rem);
		padding: 0;
	}

	.themes li {
		display: grid;
		gap: 0.8rem;
		justify-items: center;
		margin: 0;
	}

	.themes li::before {
		content: none;
	}

	a {
		display: block;
		width: 100%;
		border-radius: 5px;
		cursor: zoom-in;
	}

	.themes li :global(picture) {
		overflow: hidden;
		border-radius: 5px;
		box-shadow:
			0 14px 30px -16px var(--shadow),
			0 0 0 1px var(--line);
		transition: box-shadow 0.2s;
	}

	a:hover :global(picture) {
		box-shadow:
			0 14px 30px -16px var(--shadow),
			0 0 0 1px var(--gold-soft);
	}

	figcaption {
		margin-top: 1.1rem;
		color: var(--ink-3);
		font-size: var(--text-fine);
		text-align: center;
	}

	/* Narrow: one and a half pictures in view, the rest a swipe away. */
	@media (max-width: 40rem) {
		.themes ul {
			grid-template-columns: none;
			grid-auto-flow: column;
			grid-auto-columns: 58%;
			gap: 0.9rem;
			padding: 0.25rem 1px 1rem;
			overflow-x: auto;
			overscroll-behavior-x: contain;
			scroll-snap-type: x proximity;
			scrollbar-width: thin;
			scrollbar-color: var(--line-strong) transparent;
		}

		.themes li {
			scroll-snap-align: start;
		}

		figcaption {
			margin-top: 0.5rem;
			text-align: left;
		}
	}
</style>
