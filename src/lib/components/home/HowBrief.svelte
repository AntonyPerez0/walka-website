<script lang="ts">
	import { resolve } from '$app/paths';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import { reveal } from '#lib/reveal.ts';

	const STEPS = [
		{
			title: 'The addon watches your character.',
			text: 'It draws what it sees as a thin strip of squares in the corner of the game window.'
		},
		{
			title: 'Walka reads the strip.',
			text: 'A small program on your computer looks at that corner - and nowhere else in the game.'
		},
		{
			title: 'The belt follows.',
			text: "Walka sets the belt's speed over Bluetooth, gently, and never above the cap you set."
		}
	];

	// The strip, as a drawing: black and white squares. (A made-up pattern.)
	const STRIP = '1101001011100101101000111010011011010010'.split('').map((bit) => bit === '1');
</script>

<section class="how">
	<div class="container">
		<SectionHead label="How it works" title="The game draws. Walka reads. The belt follows.">
			<p>
				An addon cannot use Bluetooth, files or the network. So it draws - and Walka never sends anything back into the
				game: no key presses, no mouse, no reading of memory.
			</p>
		</SectionHead>

		<div class="strip" aria-hidden="true">
			{#each STRIP as on, i (i)}<span class:on></span>{/each}
		</div>

		<ol class="steps">
			{#each STEPS as step, i (step.title)}
				<li use:reveal={i * 110}>
					<span class="stud" aria-hidden="true"><span>{i + 1}</span></span>
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</li>
			{/each}
		</ol>

		<p class="onward"><a class="more" href={resolve('how-it-works/')}>How it works, in full</a></p>
	</div>
</section>

<style>
	.how {
		padding-block: var(--section);
		border-block: 1px solid var(--line);
		background: var(--bg-raised);
	}

	/* The strip the addon draws, much enlarged. */
	.strip {
		display: flex;
		gap: 3px;
		width: fit-content;
		max-width: 100%;
		margin-top: clamp(2rem, 5vw, 3.25rem);
		padding: 5px;
		overflow: hidden;
		border: 1px solid var(--line-strong);
		border-radius: 4px;
		background: #000;
	}

	.strip span {
		flex: none;
		width: clamp(8px, 1.6vw, 14px);
		aspect-ratio: 1;
		background: #0b0b0b;
	}

	.strip span.on {
		background: #f5f5f5;
	}

	.steps {
		position: relative;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		--g: clamp(1.5rem, 4vw, 3.5rem);
		gap: 2rem var(--g);
		margin-top: clamp(2.5rem, 5vw, 3.5rem);
	}

	/* The road between the studs, drawn as the Share picture draws a road:
	   a full line for the stretch on the computer, dashes for the hop
	   through the air to the belt. It ends at the third stud. */
	.steps::before {
		content: '';
		position: absolute;
		top: calc(1.25rem - 1px);
		left: 1.25rem;
		width: calc((200% + 2 * var(--g)) / 3);
		height: 2px;
		background:
			linear-gradient(90deg, var(--gold) 0 50%, transparent 50%),
			repeating-linear-gradient(90deg, var(--gold) 0 5px, transparent 5px 11px);
		opacity: 0.6;
	}

	li {
		position: relative;
		display: grid;
		align-content: start;
		gap: 0.55rem;
	}

	/* a numbered stud, as the Share picture marks every tenth level */
	.stud {
		position: relative;
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		margin-bottom: 0.9rem;
		background: var(--metal);
		transform: rotate(45deg);
	}

	.stud::before {
		content: '';
		position: absolute;
		inset: 2px;
		background: var(--bg-raised);
	}

	.stud span {
		position: relative;
		color: var(--gold);
		font: 700 0.9375rem/1 var(--font-text);
		transform: rotate(-45deg);
	}

	li p {
		max-width: 24rem;
	}

	.onward {
		margin-top: clamp(2rem, 4vw, 3rem);
	}

	@media (max-width: 52rem) {
		.steps {
			grid-template-columns: 1fr;
			gap: 2.25rem;
		}

		.steps::before {
			top: 1.25rem;
			bottom: 5.5rem;
			left: calc(1.25rem - 1px);
			width: 2px;
			height: auto;
			background:
				linear-gradient(180deg, var(--gold) 0 50%, transparent 50%),
				repeating-linear-gradient(180deg, var(--gold) 0 5px, transparent 5px 11px);
		}

		li {
			grid-template-columns: 2.5rem 1fr;
			column-gap: 1.25rem;
		}

		.stud {
			grid-row: 1 / span 2;
			margin-bottom: 0;
		}

		h3,
		li p {
			grid-column: 2;
		}
	}
</style>
