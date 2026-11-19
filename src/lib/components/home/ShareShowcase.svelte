<script lang="ts">
	// The Share picture, in its five themes. The pictures are Walka's own
	// output: the Share page made them, with the demo character.
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import Picture from '#lib/components/Picture.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';

	// Colours from Walka's own themes (companion/src/walka/static/card.js).
	const THEMES = [
		{ id: 'sapphire', name: 'Sapphire', ground: '#14205a', metal: '#f1c75a', gem: '#69d2ff', glow: '70, 120, 255' },
		{ id: 'ember', name: 'Ember', ground: '#451912', metal: '#e59a5e', gem: '#ffb04f', glow: '255, 120, 40' },
		{ id: 'wildwood', name: 'Wildwood', ground: '#11413a', metal: '#cfb766', gem: '#64e8a8', glow: '60, 225, 165' },
		{ id: 'frost', name: 'Frost', ground: '#28405f', metal: '#cbd5e2', gem: '#c2ecff', glow: '150, 210, 255' },
		{ id: 'parchment', name: 'Parchment', ground: '#f3e6c6', metal: '#96702c', gem: '#c8473d', glow: '176, 128, 60' }
	] as const;

	let chosen = $state<(typeof THEMES)[number]['id']>('sapphire');
	const theme = $derived(THEMES.find((t) => t.id === chosen) ?? THEMES[0]);

	const calm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<section class="share" style:--theme-glow={theme.glow}>
	<div class="container layout">
		<figure class="picture">
			<div class="card">
				{#key chosen}
					<div class="layer" in:fade={{ duration: calm ? 0 : 420 }}>
						<Picture
							name="share-{chosen}"
							sizes="(min-width: 60rem) 30rem, min(30rem, calc(100vw - 2.5rem))"
							alt="A Share picture in the {theme.name} theme: real-world steps and miles walked, the character's level, time played, and the road it travelled on a map of the world"
						/>
					</div>
				{/key}
			</div>
			<figcaption class="fine">A Share picture, made with the demo character.</figcaption>
		</figure>

		<div class="words">
			<SectionHead label="The Share page" title="Your journey, as a picture.">
				<p>
					Walka keeps a record for every character: its level, its time played, how far it has travelled - and the real
					walking you did while playing it. The Share page turns that into a picture.
				</p>
			</SectionHead>

			<fieldset class="themes">
				<legend class="label label--gold">Five themes</legend>
				<div class="chips">
					{#each THEMES as t (t.id)}
						<label class="chip" style:--ground={t.ground} style:--metal-c={t.metal} style:--gem-c={t.gem}>
							<input type="radio" name="share-theme" value={t.id} bind:group={chosen} />
							<span class="swatch" aria-hidden="true"></span>
							<span class="name">{t.name}</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<p class="private">
				Drawn in your browser. Nothing is uploaded and nothing is posted for you. The design is Walka's own: no game
				artwork, logos or fonts are used.
			</p>
			<p><a class="more" href={resolve('how-it-works/')}>What is on the picture</a></p>
		</div>
	</div>
</section>

<style>
	.share {
		position: relative;
		padding-block: var(--section);
		overflow: clip;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 30rem) minmax(0, 1fr);
		align-items: center;
		gap: clamp(2.5rem, 7vw, 6.5rem);
	}

	.picture {
		position: relative;
	}

	/* the light of the chosen theme, behind the picture */
	.picture::before {
		content: '';
		position: absolute;
		inset: -18% -22%;
		z-index: -1;
		background: radial-gradient(closest-side, rgba(var(--theme-glow), 0.34), transparent);
		transition: background 0.6s;
	}

	.card {
		display: grid;
		aspect-ratio: 1080 / 1350;
		overflow: hidden;
		border-radius: 6px;
		background: var(--surface);
		box-shadow:
			0 30px 70px -20px var(--shadow),
			0 0 0 1px var(--line);
	}

	.layer {
		grid-area: 1 / 1;
	}

	figcaption {
		margin-top: 1rem;
		text-align: center;
	}

	.themes {
		min-width: 0;
		margin: clamp(1.75rem, 4vw, 2.5rem) 0 0;
		padding: 0;
		border: 0;
	}

	legend {
		padding: 0;
		margin-bottom: 0.9rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.chip {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		padding: 0.35rem 0.9rem 0.35rem 0.55rem;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		color: var(--ink-2);
		font-size: var(--text-small);
		font-weight: 600;
		cursor: pointer;
		transition:
			border-color 0.15s,
			color 0.15s,
			background 0.15s;
	}

	.chip:hover {
		border-color: var(--gold-soft);
		color: var(--ink);
	}

	.chip input {
		position: absolute;
		inset: 0;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	.chip:has(input:checked) {
		border-color: var(--gold);
		background: var(--surface);
		color: var(--ink);
	}

	.chip:has(input:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}

	/* a small cut stone in the theme's own colours */
	.swatch {
		position: relative;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background: var(--ground);
		box-shadow: inset 0 0 0 2px var(--metal-c);
	}

	.swatch::after {
		content: '';
		position: absolute;
		inset: 0.5rem;
		background: var(--gem-c);
		transform: rotate(45deg);
	}

	.private {
		max-width: 34rem;
		margin-top: clamp(1.5rem, 4vw, 2.25rem);
		padding-left: 1.1rem;
		border-left: 2px solid var(--gold-soft);
		color: var(--ink-2);
		font-size: var(--text-small);
	}

	.private + p {
		margin-top: 1.25rem;
	}

	@media (max-width: 60rem) {
		.layout {
			grid-template-columns: 1fr;
		}

		.picture {
			width: min(30rem, 100%);
			margin-inline: auto;
			order: 2;
		}
	}
</style>
