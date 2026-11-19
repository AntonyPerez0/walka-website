<script lang="ts">
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import { reveal } from '#lib/reveal.ts';

	// The six of Walka's README, in its words.
	const FEATURES: { icon: IconName; title: string; text: string }[] = [
		{
			icon: 'stride',
			title: 'Follows your character.',
			text: 'Run in the game and the belt speeds up. Stand still and it eases off. You choose every speed.'
		},
		{
			icon: 'stop',
			title: 'Built around stopping.',
			text: 'A hard speed cap, a STOP key that works from inside the game, and rules written so that a lost signal slows the belt down.'
		},
		{
			icon: 'count',
			title: 'Counts every walk.',
			text: 'Time, distance, steps and calories - live on the dashboard, and in the game while you play.'
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
			text: "Nothing is uploaded. Walka never presses keys, moves the mouse or reads the game's memory."
		}
	];
</script>

<section class="features">
	<div class="container">
		<SectionHead label="What you get" title="Your character runs. You walk." />

		<ul class="grid">
			{#each FEATURES as feature, i (feature.title)}
				<li use:reveal={(i % 3) * 90}>
					<span class="icon"><Icon name={feature.icon} size={26} stroke={1.6} /></span>
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
</style>
