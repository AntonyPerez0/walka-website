<script lang="ts">
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import { reveal } from '#lib/reveal.ts';

	// Two icons that only this section needs, drawn in the manner of
	// Icon.svelte: lines on a 24-unit grid. An ear, and a figure in a hat.
	const OWN = {
		ear: '<path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 2.600-1.700 3.700-3 5-.9.9-1.300 1.700-1.500 3a3 3 0 0 1-5.600 1"/><path d="M9.500 10a2.500 2.500 0 0 1 5-.5c0 1.400-1 1.900-1.800 2.600"/>',
		character:
			'<path d="M6 9.500h12"/><path d="M8.500 9.500 12.800 3l2.700 6.500"/><path d="M9 12.300a3 3 0 0 0 6 0"/><path d="M5.500 20.500c.5-2.600 2.600-4 6.500-4s6 1.400 6.500 4"/>'
	} as const;

	type Feature = { title: string; text: string } & ({ icon: IconName } | { own: keyof typeof OWN });

	// The six of Walka's README, in its words.
	const FEATURES: Feature[] = [
		{
			own: 'ear',
			title: 'Only listens.',
			text: 'Walka reads what your treadmill reports. It sends it no commands: the belt does what you tell it at the treadmill, and nothing else.'
		},
		{
			icon: 'count',
			title: 'Counts every walk.',
			// (one sentence more than the README has: wherever the site names calories, it says what they are)
			text: 'Time, distance, steps and calories - live on the dashboard, and in the game while you play. Calories are an estimate, not medical advice. A walk is recorded whenever the belt moves, with a game or without.'
		},
		{
			own: 'character',
			title: 'Your walks, per character.',
			text: 'Start a session in the game and the walk counts for the character you are playing.'
		},
		{
			icon: 'road',
			title: 'Your road on the map.',
			text: "The path your character has travelled, drawn on the game's world map - brightest where you really walked."
		},
		{
			icon: 'picture',
			title: 'A picture to share.',
			text: 'Your journey so far as a picture, made on your own computer. You choose what is on it and where it goes.'
		},
		{
			icon: 'home',
			title: 'Stays on your computer.',
			text: "Nothing is uploaded. Walka never presses keys, moves the mouse or reads the game's memory - it looks at the top-left corner of the game window."
		}
	];
</script>

<section class="features">
	<div class="container">
		<SectionHead label="What you get" title="Your character runs. You walk." />

		<ul class="grid">
			{#each FEATURES as feature, i (feature.title)}
				<li use:reveal={(i % 3) * 90}>
					<span class="icon">
						{#if 'own' in feature}
							<svg
								width="26"
								height="26"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
								focusable="false"
							>
								{@html OWN[feature.own]}
							</svg>
						{:else}
							<Icon name={feature.icon} size={26} stroke={1.6} />
						{/if}
					</span>
					<h3>{feature.title}</h3>
					<p>{feature.text}</p>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.features {
		padding-block: var(--section);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(2.5rem, 5vw, 4rem) clamp(2rem, 4vw, 3.5rem);
		margin-top: clamp(2.5rem, 6vw, 4.5rem);
	}

	li {
		display: grid;
		align-content: start;
		gap: 0.6rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--line);
	}

	.icon {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		margin-bottom: 0.4rem;
		color: var(--gold);
		/* a small cut tile, as the frames are cut */
		background: var(--gold-faint);
		clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px);
	}

	p {
		max-width: 26rem;
	}

	@media (max-width: 60rem) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 36rem) {
		.grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}

	/* On paper each of the six is a plain block. Chromium moves a grid whose
	   items are grids to the next sheet whole, and the heading above it was
	   left alone on a sheet of its own. */
	@media print {
		li {
			display: block;
		}

		li > * + * {
			margin-top: 0.6rem;
		}
	}
</style>
