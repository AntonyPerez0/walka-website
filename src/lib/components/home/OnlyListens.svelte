<script lang="ts">
	// What Walka's README says under "Walka only listens", in brief. The
	// heading and the sentence under it are the line the dashboard shows.
	import { resolve } from '$app/paths';
	import Icon from '#lib/components/Icon.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import { reveal } from '#lib/reveal.ts';
	import { LINKS } from '#lib/site.ts';
</script>

<section class="listens">
	<div class="container layout">
		<div class="words">
			<SectionHead label="The belt is yours" title="Walka only listens to your treadmill.">
				<p>It cannot start, stop or change the speed of the belt: you set the speed on the treadmill itself.</p>
			</SectionHead>

			<p class="note">
				<span class="note-icon"><Icon name="warning" size={22} /></span>
				<span>
					<strong>Walka is not a safety device or a medical device.</strong> It cannot stop a belt: the treadmill's own
					stop button, remote and safety key are what does. Walking while you play is at your own risk - read the
					<a href={LINKS.disclaimer}>disclaimer</a>.
				</span>
			</p>

			<p class="before">
				Versions before 0.7 did drive the belt. That has been taken out, not switched off, and those versions have been
				withdrawn. If you have one, replace it with the <a href="#get">current download</a> and delete the old one. Your
				walks and settings are kept.
			</p>

			<p class="onward"><a class="more" href={resolve('safety/')}>Read about safety</a></p>
		</div>

		<ul class="points">
			<li use:reveal>
				<span class="mark" aria-hidden="true"></span>
				<div>
					<h3>
						You start the belt with the treadmill's remote or buttons, and you stop it the same way - or with its safety
						key.
					</h3>
					<p>Keep the remote where your hand finds it without looking.</p>
				</div>
			</li>
			<li use:reveal={80}>
				<span class="mark" aria-hidden="true"></span>
				<div>
					<h3>The speed is the one you set at the treadmill.</h3>
					<p>Walka reads it; it cannot change it.</p>
				</div>
			</li>
			<li use:reveal={160}>
				<span class="mark" aria-hidden="true"></span>
				<div>
					<h3>Closing Walka, or pressing <em>Disconnect</em>, ends the recording and lets go of the treadmill.</h3>
					<p>The belt goes on doing what it was doing.</p>
				</div>
			</li>
			<li use:reveal={240}>
				<span class="mark" aria-hidden="true"></span>
				<div>
					<h3>When you step off, stop the belt.</h3>
					<p>
						Nothing else will. <em>Pause</em> and <em>Stop</em> in the game pause and end the session - the addon's count
						- and nothing else.
					</p>
				</div>
			</li>
		</ul>
	</div>
</section>

<style>
	.listens {
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
		border: 1px solid var(--line-strong); /* (where colours cannot be mixed) */
		border: 1px solid color-mix(in srgb, var(--warn) 45%, transparent);
		border-radius: var(--radius);
		background: var(--warn-tint);
		color: var(--ink-2);
		font-size: var(--text-small);
	}

	.note-icon {
		color: var(--warn);
	}

	.before {
		max-width: 30rem;
		margin-top: 1.25rem;
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	.onward {
		margin-top: 1.25rem;
	}

	.points {
		display: grid;
	}

	.points li {
		display: grid;
		grid-template-columns: 1.5rem 1fr;
		gap: 0 1rem;
		padding-block: 1.5rem;
		border-top: 1px solid var(--line);
	}

	.points li:last-child {
		border-bottom: 1px solid var(--line);
	}

	/* a small cut stone, as in the rule above a heading */
	.mark {
		width: 0.625rem;
		height: 0.625rem;
		/* level with the first line of the heading beside it */
		margin: calc((1.1875rem * 1.45 - 0.625rem) / 2) 0 0 0.2rem;
		background: var(--gold);
		transform: rotate(45deg);
	}

	h3 {
		font: 600 1.1875rem/1.45 var(--font-text);
		letter-spacing: -0.005em;
	}

	h3 em,
	li p em {
		font-style: italic;
	}

	li p {
		margin-top: 0.3rem;
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	/* In one column the four points come straight after the heading, and
	   the remarks and the link after them. */
	@media (max-width: 56rem) {
		.layout {
			grid-template-columns: 1fr;
			gap: 0;
		}

		.words {
			display: contents;
		}

		.points {
			order: 1;
			margin-top: 2rem;
		}

		.note {
			order: 2;
		}

		.before {
			order: 3;
		}

		.onward {
			order: 4;
		}
	}
</style>
