<script lang="ts">
	// What Walka looks at, as a drawing: the strip much enlarged (as the home
	// page draws it), and under it an empty window with the strip in its
	// top-left corner, inside the small picture Walka takes of that corner.
	// Nothing here is a screenshot, and it is not to scale.
	//
	// 86 squares, as the addon draws them (docs/PROTOCOL.md in Walka's
	// repository): four that open the strip, eighty that carry the numbers,
	// two that close it. The eighty here are a made-up pattern.
	const SQUARES = '10100001111001001100011000000001110011001110110100010110000001111001101101000000110010'
		.split('')
		.map((bit) => bit === '1');
</script>

<figure class="strip-figure">
	<div
		class="drawing"
		role="img"
		aria-label="A drawing. Above, the strip enlarged: one row of 86 black and white squares. Below, an empty window: the strip lies in its top-left corner, and a dashed outline around it marks the small picture Walka takes of that corner. The rest of the window is empty."
	>
		<div class="large">
			{#each SQUARES as on, i (i)}<span class:on></span>{/each}
		</div>

		<!-- from the strip enlarged down to the strip in the corner -->
		<svg class="beam" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
			<polygon points="0,0 100,0 30,100 0,100" />
			<path d="M100 0 30 100M0 0v100" />
		</svg>

		<div class="frame">
			<div class="window">
				<div class="look"></div>
				<svg class="small" viewBox="0 0 86 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">
					<rect width="86" height="1" fill="#000" />
					{#each SQUARES as on, i (i)}
						{#if on}<rect x={i} width="1" height="1" fill="#f5f5f5" />{/if}
					{/each}
				</svg>
			</div>
			<span class="where">The game window</span>
		</div>
	</div>

	<ul class="key">
		<li>
			<span class="mark strip-mark" aria-hidden="true"></span>
			<span>The strip, and the same strip enlarged: 86 squares in a row.</span>
		</li>
		<li>
			<span class="mark look-mark" aria-hidden="true"></span>
			<span>The top-left corner of the game window: a picture about 700 pixels wide and 12 high.</span>
		</li>
	</ul>
	<figcaption>A drawing, not to scale. The pattern on the strip is made up.</figcaption>
</figure>

<style>
	/* The strip, much enlarged - drawn as on the home page. */
	.large {
		display: flex;
		gap: 1px;
		padding: 4px;
		border: 1px solid var(--line-strong);
		border-radius: 4px;
		background: #000;
	}

	.large span {
		flex: 1 1 0;
		aspect-ratio: 1;
		background: #0b0b0b;
	}

	.large span.on {
		background: #f5f5f5;
	}

	.beam {
		width: 100%;
		max-width: none;
		height: 2.75rem;
		overflow: visible;
	}

	.beam polygon {
		fill: var(--line);
	}

	.beam path {
		fill: none;
		stroke: var(--line-strong);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	.frame {
		position: relative;
	}

	/* what the outline is: said inside it, where nothing else is */
	.where {
		position: absolute;
		top: 2.1rem;
		left: 50%;
		translate: -50% 0;
		color: var(--ink-3);
		font: 600 var(--text-label) / 1.4 var(--font-text);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	/* An empty window. It fades away downwards: nothing there is looked at. */
	.window {
		position: relative;
		height: 6rem;
		border: 1px solid var(--line-strong);
		border-bottom: 0;
		background: var(--surface);
		-webkit-mask-image: linear-gradient(#000 30%, transparent);
		mask-image: linear-gradient(#000 30%, transparent);
	}

	/* the picture Walka takes of the corner */
	.look {
		position: absolute;
		top: 0;
		left: 0;
		width: 61%;
		height: 12px;
		border: 1px dashed var(--accent);
		border-top: 0;
		border-left: 0;
		background: var(--line); /* (where colours cannot be mixed) */
		background: color-mix(in srgb, var(--accent) 18%, transparent);
	}

	/* the strip in it */
	.small {
		position: absolute;
		top: 0;
		left: 0;
		width: 30%;
		max-width: none;
		height: 4px;
	}

	.strip-figure .key {
		display: grid;
		gap: 0.45rem;
		margin-top: 0.4rem;
		padding: 0;
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.strip-figure .key li {
		display: grid;
		grid-template-columns: 1.75rem minmax(0, 1fr);
		gap: 0.75rem;
		align-items: start;
		margin: 0;
	}

	.strip-figure .key li::before {
		content: none;
	}

	.mark {
		height: 0.75rem;
		margin-top: 0.35rem;
	}

	.look-mark {
		border: 1px dashed var(--accent);
		background: var(--line); /* (where colours cannot be mixed) */
		background: color-mix(in srgb, var(--accent) 18%, transparent);
	}

	.strip-mark {
		height: 0.5rem;
		margin-top: 0.47rem;
		background: repeating-linear-gradient(90deg, #f5f5f5 0 4px, #000 4px 8px);
		outline: 1px solid var(--line-strong);
	}

	figcaption {
		margin-top: 0.75rem;
		color: var(--ink-3);
		font-size: var(--text-fine);
	}
</style>
