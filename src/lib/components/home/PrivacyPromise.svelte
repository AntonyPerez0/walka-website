<script lang="ts">
	import { resolve } from '$app/paths';
	import Ornament from '#lib/components/Ornament.svelte';
	import { reveal } from '#lib/reveal.ts';

	const FACTS = [
		{
			title: 'Nothing is uploaded.',
			text: 'Your walks, your weight and height and your heart rate are kept on your own computer, and nowhere else.'
		},
		{
			title: 'It looks at one corner.',
			text: 'Walka reads the top-left corner of the game window - and, until it has found the game for the first time, searches the screen for it. No picture is saved or sent anywhere.',
			more: { label: 'What it looks at, exactly', page: 'how-it-works/', hash: '#what-walka-looks-at' }
		},
		{
			title: 'The picture is yours.',
			text: 'The Share picture is drawn in your browser. Nothing is posted for you: you choose where it goes.'
		}
	] as const;
</script>

<section class="privacy">
	<div class="container">
		<header>
			<Ornament />
			<p class="label">Privacy</p>
			<h2>Stays on your computer.</h2>
			<p class="lede">Walka uploads nothing. No account, no tracking, no advertising.</p>
		</header>

		<ul class="facts">
			{#each FACTS as fact, i (fact.title)}
				<li use:reveal={i * 90}>
					<h3>{fact.title}</h3>
					<p>{fact.text}</p>
					{#if 'more' in fact}
						<p class="more-line"><a href="{resolve(fact.more.page)}{fact.more.hash}">{fact.more.label}</a></p>
					{/if}
				</li>
			{/each}
		</ul>

		<p class="later">
			Later, this site will offer accounts for people who want to share their progress - opt-in, private until you say
			otherwise, and yours to export or delete.
			<a href={resolve('privacy/')}>Privacy, in plain words</a>
		</p>
	</div>
</section>

<style>
	.privacy {
		padding-block: var(--section);
	}

	header {
		display: grid;
		justify-items: center;
		gap: 0.9rem;
		text-align: center;
	}

	header .label {
		margin-top: 1.75rem;
	}

	h2 {
		font-size: clamp(2.25rem, 1.5rem + 3.4vw, 3.75rem);
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-top: clamp(2.75rem, 6vw, 4.5rem);
		border-block: 1px solid var(--line);
	}

	.facts li {
		padding: clamp(1.5rem, 3.5vw, 2.5rem) clamp(1.25rem, 3vw, 2.5rem);
	}

	.facts li + li {
		border-left: 1px solid var(--line);
	}

	.facts li:first-child {
		padding-left: 0;
	}

	.facts li:last-child {
		padding-right: 0;
	}

	h3 {
		margin-bottom: 0.5rem;
	}

	.more-line {
		margin-top: 0.6rem;
		font-size: var(--text-small);
	}

	.later {
		max-width: 44rem;
		margin: clamp(2rem, 5vw, 3rem) auto 0;
		color: var(--ink-3);
		font-size: var(--text-small);
		text-align: center;
	}

	.later a {
		white-space: nowrap;
	}

	@media (max-width: 52rem) {
		.facts {
			grid-template-columns: 1fr;
		}

		.facts li,
		.facts li:first-child,
		.facts li:last-child {
			padding-inline: 0;
		}

		.facts li + li {
			border-left: 0;
			border-top: 1px solid var(--line);
		}
	}
</style>
