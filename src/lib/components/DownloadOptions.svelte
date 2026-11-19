<script lang="ts">
	// The three downloads, side by side: Windows, Mac, the game addon. The
	// links are the ones Walka's README uses - they always give the files of
	// the latest release. The visitor's own system is put forward once the
	// page knows it (a guess from the browser; nothing is sent anywhere).
	import Icon from './Icon.svelte';
	import { detectPlatform, type Platform } from '#lib/platform.ts';
	import { megabytes, type Release } from '#lib/release.ts';
	import { DOWNLOADS } from '#lib/site.ts';

	let { release = null }: { /** The latest release, if the page has asked GitHub for it. */ release?: Release | null } = $props();

	let platform = $state<Platform>('other');
	$effect(() => {
		platform = detectPlatform();
	});

	const size = (file: string) => megabytes(release?.sizes[file]);
</script>

<ul class="options">
	<li class:yours={platform === 'windows'}>
		<span class="icon"><Icon name="window" size={28} stroke={1.5} /></span>
		<h3 id="windows">Windows</h3>
		<p class="what"><code>Walka.exe</code>, one file. Nothing to install: you just open it.</p>
		<a class="button button--block" class:button--ghost={platform === 'mac'} href={DOWNLOADS.windows}>
			<Icon name="download" /> Download for Windows
		</a>
		<p class="fine">
			For Windows 11; Windows 10 generally works.{#if size('Walka.exe')}{' '}<span class="size">{size('Walka.exe')}.</span>{/if}
		</p>
	</li>

	<li class:yours={platform === 'mac'}>
		<span class="icon"><Icon name="laptop" size={28} stroke={1.5} /></span>
		<h3 id="mac">Mac</h3>
		<p class="what">For a Mac with an Apple chip (M1 or later). New, and not yet tried with the game on a real Mac.</p>
		<a class="button button--block" class:button--ghost={platform === 'windows'} href={DOWNLOADS.macAppleSilicon}>
			<Icon name="download" /> Download for Mac
		</a>
		<p class="fine">
			An older Mac with an Intel processor? <a href={DOWNLOADS.macIntel}>Download this one</a>. <em>Apple menu → About This Mac</em>
			says which you have.
		</p>
	</li>

	<li>
		<span class="icon"><Icon name="addon" size={28} stroke={1.5} /></span>
		<h3 id="addon">The game addon</h3>
		<p class="what">The Walka addon for World of Warcraft. Walka can also put it in the game for you.</p>
		<a class="button button--ghost button--block" href={DOWNLOADS.addon}>
			<Icon name="download" /> Download the addon
		</a>
		<p class="fine">
			<code>Walka-addon.zip</code>{#if size('Walka-addon.zip')}{' '}<span class="size">{size('Walka-addon.zip')}.</span>{/if}
		</p>
	</li>
</ul>

<style>
	.options {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-template-rows: repeat(5, auto);
		gap: 1px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--line); /* shows through the 1px gaps as the lines between */
		overflow: hidden;
		text-align: left;
	}

	/* The three share their rows, so that the buttons stand in one line. */
	li {
		display: grid;
		grid-row: span 5;
		grid-template-rows: subgrid;
		align-content: start;
		gap: 0.5rem;
		padding: clamp(1.25rem, 3vw, 2rem);
		background: var(--surface);
	}

	li.yours {
		background: var(--surface-2);
	}

	.icon {
		color: var(--gold);
	}

	h3 {
		margin-top: 0.4rem;
	}

	.what {
		font-size: var(--text-small);
	}

	.button {
		margin-top: 0.9rem;
		white-space: normal;
		text-align: center;
	}

	/* the ghost button's face is the panel it stands on */
	li .button--ghost::after {
		background: var(--surface);
	}

	li.yours .button--ghost::after {
		background: var(--surface-2);
	}

	.fine {
		margin-top: 0.35rem;
	}

	h3 {
		scroll-margin-top: calc(var(--header-h) + 5rem);
	}

	.size {
		white-space: nowrap;
	}

	@media (max-width: 56rem) {
		.options {
			grid-template-columns: 1fr;
			grid-template-rows: none;
		}

		li {
			grid-row: auto;
			grid-template-rows: none;
		}
	}
</style>
