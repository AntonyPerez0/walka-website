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
		<p class="label">A walking pad companion for World of Warcraft</p>
		<h1>Walk while you play.</h1>
		<p class="lede">
			Walka links your walking pad to World of Warcraft. The belt follows your character: faster when it runs, slower
			when it stands still.
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
			Free. For Windows and Mac. <strong>Experimental, and at your own risk</strong> - read the
			<a href={LINKS.disclaimer}>disclaimer</a> before you download.
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
					alt="The Walka dashboard: the belt's speed, this session's time, distance, steps, calories and heart rate, and a red STOP button"
				/>
			</div>
		</Frame>
		<p class="caption fine">The Walka dashboard, with the demo character.</p>
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
