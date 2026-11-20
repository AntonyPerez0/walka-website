<script lang="ts">
	import { resolve } from '$app/paths';
	import DownloadOptions from '#lib/components/DownloadOptions.svelte';
	import Frame from '#lib/components/Frame.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { LINKS } from '#lib/site.ts';
</script>

<section class="get" id="get">
	<div class="container">
		<Frame cut="clamp(14px, 2.4vw, 26px)" pad="min(clamp(1.25rem, 5vw, 4rem), 6.25vw)" glow>
			<header>
				<p class="label label--gold">Free, and stays free</p>
				<h2>Get Walka</h2>
				<p class="lede">Nothing to install: on Windows it is one file, <code>Walka.exe</code>, and you just open it.</p>
			</header>

			<div class="options"><DownloadOptions /></div>

			<p class="risk">
				<strong>Walka only listens to your treadmill.</strong> It cannot start, stop or change the speed of the belt:
				you do that at the treadmill itself.
			</p>
			<p class="risk">
				<strong>Experimental:</strong> not yet tried on a real walking pad. Walking while you play is at your own risk -
				read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.
			</p>

			<ul class="more-info">
				<li>
					<span class="i"><Icon name="shield" size={22} /></span>
					<p>
						Scanned for viruses by Microsoft Defender, before every release.
						<a href="{resolve('downloads/')}#is-the-download-safe">Is the download safe?</a>
					</p>
				</li>
				<li>
					<span class="i"><Icon name="bluetooth" size={22} /></span>
					<p>
						You need a Windows 10 or 11 PC or a Mac, with Bluetooth; a walking pad or treadmill that shows its numbers
						to apps over Bluetooth; and World of Warcraft: Forever.
						<a href="{resolve('downloads/')}#which-treadmills-work">Which treadmills work</a>
					</p>
				</li>
			</ul>
		</Frame>
	</div>
</section>

<style>
	.get {
		padding-block: var(--section);
		scroll-margin-top: 0;
	}

	header {
		display: grid;
		justify-items: center;
		gap: 0.9rem;
		text-align: center;
	}

	h2 {
		font-size: clamp(2.25rem, 1.5rem + 3.4vw, 3.75rem);
	}

	.lede {
		max-width: 34rem;
	}

	.options {
		margin-top: clamp(2rem, 5vw, 3.25rem);
	}

	.risk {
		max-width: 40rem;
		margin: 1.5rem auto 0;
		color: var(--ink-2);
		font-size: var(--text-small);
		text-align: center;
	}

	.risk + .risk {
		margin-top: 0.6rem;
	}

	.more-info {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.25rem clamp(1.5rem, 4vw, 3rem);
		margin-top: clamp(1.75rem, 4vw, 2.5rem);
		padding-top: clamp(1.5rem, 3vw, 2rem);
		border-top: 1px solid var(--line);
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	.more-info li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
	}

	.i {
		margin-top: 0.1rem;
		color: var(--gold);
	}

	@media (max-width: 52rem) {
		.more-info {
			grid-template-columns: 1fr;
		}
	}
</style>
