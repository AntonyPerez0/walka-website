<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '#lib/components/Icon.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import { reveal } from '#lib/reveal.ts';
</script>

<section class="stopping">
	<div class="container layout">
		<div class="words">
			<SectionHead label="Safety" title="Built around stopping.">
				<p>Four ways to stop the belt, fastest first.</p>
			</SectionHead>

			<p class="note">
				<span class="note-icon"><Icon name="warning" size={22} /></span>
				<span>
					<strong>Bluetooth is not an emergency stop:</strong> keep the remote within reach. Walka is not a safety device.
				</span>
			</p>

			<p><a class="more" href={resolve('safety/')}>Read about safety</a></p>
		</div>

		<ol class="ways">
			<li use:reveal>
				<span class="n" aria-hidden="true">1</span>
				<div>
					<h3>The treadmill's own remote, stop button or safety key.</h3>
					<p>Walka then leaves the belt stopped.</p>
				</div>
			</li>
			<li use:reveal={80}>
				<span class="n" aria-hidden="true">2</span>
				<div>
					<h3><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd> anywhere on the computer, even inside the game.</h3>
					<p><kbd>Control</kbd>+<kbd>Option</kbd>+<kbd>X</kbd> on a Mac.</p>
				</div>
			</li>
			<li use:reveal={160}>
				<span class="n" aria-hidden="true">3</span>
				<div>
					<h3>The red <span class="stop">STOP</span> on the dashboard.</h3>
					<p>It is on every view of the dashboard.</p>
				</div>
			</li>
			<li use:reveal={240}>
				<span class="n" aria-hidden="true">4</span>
				<div>
					<h3><em>Stop</em> on the in-game HUD, or <code>/walka stop</code>.</h3>
				</div>
			</li>
		</ol>
	</div>
</section>

<style>
	.stopping {
		padding-block: var(--section);
		border-block: 1px solid var(--line);
		background: var(--bg-raised);
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
		align-items: start;
		gap: clamp(2.5rem, 7vw, 6rem);
	}

	.note {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.85rem;
		max-width: 30rem;
		margin-top: clamp(1.75rem, 4vw, 2.5rem);
		padding: 1rem 1.15rem;
		border: 1px solid color-mix(in srgb, var(--warn) 45%, transparent);
		border-radius: var(--radius);
		background: var(--warn-tint);
		color: var(--ink-2);
		font-size: var(--text-small);
	}

	.note-icon {
		color: var(--warn);
	}

	.note + p {
		margin-top: 1.25rem;
	}

	.ways {
		display: grid;
	}

	.ways li {
		display: grid;
		grid-template-columns: 3.5rem 1fr;
		gap: 0 1.25rem;
		align-items: baseline;
		padding-block: 1.5rem;
		border-top: 1px solid var(--line);
	}

	.ways li:last-child {
		border-bottom: 1px solid var(--line);
	}

	.n {
		color: var(--gold);
		font: 600 2.75rem/1 var(--font-display);
		font-variant-numeric: lining-nums;
	}

	h3 {
		font: 600 1.1875rem/1.45 var(--font-text);
		letter-spacing: -0.005em;
	}

	h3 em {
		font-style: italic;
	}

	li p {
		margin-top: 0.3rem;
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	kbd {
		font-size: 0.8em;
	}

	/* the dashboard's own red button, in small */
	.stop {
		display: inline-block;
		padding: 0.08em 0.6em;
		border-radius: 6px;
		background: var(--stop);
		color: #fff;
		font-size: 0.82em;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	/* In one column the four ways come straight after the heading, and the
	   remark and the link after them. */
	@media (max-width: 56rem) {
		.layout {
			grid-template-columns: 1fr;
			gap: 0;
		}

		.words {
			display: contents;
		}

		.ways {
			order: 1;
			margin-top: 2rem;
		}

		.note {
			order: 2;
		}

		.note + p {
			order: 3;
		}
	}

	@media (max-width: 30rem) {
		.ways li {
			grid-template-columns: 2.5rem 1fr;
			gap: 0 0.75rem;
		}

		.n {
			font-size: 2.25rem;
		}
	}
</style>
