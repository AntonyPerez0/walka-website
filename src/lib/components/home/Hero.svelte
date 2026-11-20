<script lang="ts">
	import { resolve } from '$app/paths';
	import Frame from '#lib/components/Frame.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Sky from '#lib/components/Sky.svelte';
	import ThemedPicture from '#lib/components/ThemedPicture.svelte';
	import { detectPlatform, type Platform } from '#lib/platform.ts';
	import { DOWNLOADS, LINKS } from '#lib/site.ts';

	// The button names the visitor's own system once the page knows it. On
	// Windows it is then the file itself; a Mac has two files to choose from,
	// so there it leads to the downloads at the foot of the page.
	let platform = $state<Platform>('other');
	$effect(() => {
		platform = detectPlatform();
	});
</script>

<section class="hero">
	<Sky />

	<div class="container copy">
		<p class="label">A walking log for World of Warcraft</p>
		<h1>Walk while you play.</h1>
		<p class="lede">
			Walk on your walking pad while you play World&nbsp;of&nbsp;Warcraft. Walka counts your steps, miles and calories,
			and draws your character's road on the map.
		</p>

		<div class="actions">
			{#if platform === 'windows'}
				<a class="button" href={DOWNLOADS.windows}><Icon name="download" /> Download for Windows</a>
			{:else if platform === 'mac'}
				<a class="button" href="#get"><Icon name="download" /> Download for Mac</a>
			{:else}
				<a class="button" href="#get"><Icon name="download" /> Download Walka</a>
			{/if}
			<a class="button button--ghost" href={resolve('how-it-works/')}>See how it works</a>
		</div>

		<p class="fine">
			<strong>Walka only listens to your treadmill.</strong> It cannot start, stop or change the speed of the belt: you
			do that at the treadmill itself.
		</p>
		<p class="fine">
			Free. For Windows and Mac. <strong>Experimental:</strong> not yet tried on a real walking pad. Walking while you
			play is at your own risk - read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.
		</p>
	</div>

	<div class="container container--wide stage">
		<Frame cut="clamp(14px, 2.4vw, 26px)" glow>
			<div class="shot">
				<ThemedPicture
					name="dashboard"
					narrow="dashboard-phone"
					first
					sizes="(min-width: 1420px) 1290px, calc(100vw - 2.5rem)"
					narrowSizes="calc(100vw - 3.75rem)"
					alt="The Walka dashboard's Live view: the belt's speed as the treadmill reports it, and what Walka is connected to. On a wide screen it also shows this walk's time, distance, steps, calories and heart rate."
				/>
			</div>
		</Frame>
		<p class="caption fine">The Walka dashboard, with a simulated treadmill.</p>
	</div>
</section>

<style>
	.hero {
		position: relative;
		isolation: isolate;
		/* the sky runs up behind the bar along the top */
		margin-top: calc(-1 * var(--header-h));
		padding-top: calc(var(--header-h) + clamp(2.75rem, 1.5rem + 5.5vw, 5.5rem));
		padding-bottom: clamp(2.5rem, 6vw, 4.5rem);
	}

	.copy {
		display: grid;
		justify-items: center;
		text-align: center;
	}

	h1 {
		margin-top: 1.1rem;
		font-size: var(--text-display);
		line-height: 0.98;
		letter-spacing: -0.025em;
	}

	.lede {
		max-width: 42rem;
		text-wrap: balance;
		margin-top: clamp(1.25rem, 3vw, 1.75rem);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.875rem;
		margin-top: clamp(1.75rem, 4vw, 2.5rem);
	}

	.copy .fine {
		max-width: 34rem;
		margin-top: 1.25rem;
	}

	.copy .fine + .fine {
		margin-top: 0.5rem;
	}

	.copy .fine strong {
		color: var(--ink-2);
	}

	.stage {
		margin-top: clamp(2.75rem, 6vw, 4.5rem);
	}

	.shot {
		/* the screenshot takes the frame's own cut corners */
		--c: var(--frame-cut-inner);
		clip-path: polygon(
			var(--c) 0,
			calc(100% - var(--c)) 0,
			100% var(--c),
			100% calc(100% - var(--c)),
			calc(100% - var(--c)) 100%,
			var(--c) 100%,
			0 calc(100% - var(--c)),
			0 var(--c)
		);
	}

	.caption {
		margin-top: 1.1rem;
		text-align: center;
	}

	/* The first screen arrives in order: the words, then the picture. Only
	   styles do this - nothing waits for a script - and not at all for
	   someone who asked for less motion. */
	@media (prefers-reduced-motion: no-preference) {
		.copy > :global(*),
		.stage {
			animation: arrive 0.8s var(--ease) both;
		}

		.copy > :global(:nth-child(2)) {
			animation-delay: 0.05s;
		}

		.copy > :global(:nth-child(3)) {
			animation-delay: 0.1s;
		}

		.copy > :global(:nth-child(4)) {
			animation-delay: 0.15s;
		}

		.copy > :global(:nth-child(5)) {
			animation-delay: 0.2s;
		}

		.copy > :global(:nth-child(6)) {
			animation-delay: 0.25s;
		}

		.stage {
			animation-duration: 1s;
			animation-delay: 0.18s;
		}
	}

	@keyframes arrive {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
	}

	/* On a narrow screen the heading stands on two lines. */
	@media (max-width: 40rem) {
		h1 {
			max-width: 11ch;
		}
	}

	@media (max-width: 30rem) {
		.actions {
			flex-direction: column;
			align-self: stretch;
		}

		.actions :global(.button) {
			width: 100%;
		}
	}
</style>
