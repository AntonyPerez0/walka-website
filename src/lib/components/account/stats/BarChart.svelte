<script lang="ts">
	// Bars of one number over days, weeks, months, hours or weekdays: one
	// colour, a scale with a round top, and a closer look at one bar under a
	// mouse or a finger. What the bars show is also said in a sentence
	// (`summary`), and the page puts the same numbers in a table: nobody needs
	// the picture, and nobody needs a mouse.
	type Bar = {
		key: string;
		/** under the bar, where there is room: "19 Nov", "Mon", "08" */
		short: string;
		/** in the closer look: "Thursday 19 November" */
		long: string;
		value: number;
		/** the value in words, in the closer look: "1 h 05 min, 4.2 km" */
		readout: string;
	};

	let {
		bars,
		summary,
		top: format,
		labels = 4,
		labelWhere,
		height = '9.5rem'
	}: {
		bars: Bar[];
		/** the whole chart in one sentence: it is what a screen reader says for it */
		summary: string;
		/** writes the top of the scale: (value) => "2 h" */
		top: (value: number) => string;
		/** how many bars carry a label under them (spread evenly; the last always does), or 'all' */
		labels?: number | 'all';
		/** or exactly which bars carry a label */
		labelWhere?: (index: number) => boolean;
		height?: string;
	} = $props();

	/** A round number at or above the largest bar: 1, 2, 2.5, 5 or 10 times a power of ten. */
	function roundUp(value: number): number {
		if (!(value > 0)) return 1;
		const power = 10 ** Math.floor(Math.log10(value));
		for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (step * power >= value) return step * power;
		return 10 * power;
	}

	const largest = $derived(bars.reduce((most, bar) => Math.max(most, bar.value), 0));
	const scale = $derived(roundUp(largest));

	const labelled = $derived.by(() => {
		const out = new Set<number>();
		if (labelWhere) bars.forEach((_, index) => labelWhere(index) && out.add(index));
		else if (labels === 'all') bars.forEach((_, index) => out.add(index));
		else {
			const every = Math.max(1, Math.round(bars.length / labels));
			for (let index = bars.length - 1; index >= 0; index -= every) out.add(index);
		}
		return out;
	});

	// ---- a closer look -------------------------------------------------------
	let pointed = $state<number | null>(null);
	let plot = $state<HTMLElement>();

	function point(event: PointerEvent) {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const index = Math.floor(((event.clientX - box.left) / box.width) * bars.length);
		pointed = Math.min(bars.length - 1, Math.max(0, index));
	}

	// a finger has to lift to read the closer look: it stays until a touch elsewhere
	function elsewhere(event: PointerEvent) {
		if (pointed !== null && plot && !plot.contains(event.target as Node)) pointed = null;
	}

	const at = $derived(pointed === null ? null : bars[pointed]);
</script>

<svelte:window onpointerdown={elsewhere} />

<div class="chart" style:--bars={bars.length}>
	<p class="top" aria-hidden="true">{format(scale)}</p>
	<!-- the plot is one picture with one sentence for a screen reader; the table under it has every number -->
	<div class="plot" style:height role="img" aria-label={summary} bind:this={plot}>
		<span class="line" style:bottom="100%"></span>
		<span class="line" style:bottom="50%"></span>
		<div
			class="bars"
			role="presentation"
			onpointermove={point}
			onpointerdown={point}
			onpointerleave={(event) => event.pointerType === 'mouse' && (pointed = null)}
		>
			{#each bars as bar, index (bar.key)}
				<span class="slot" class:pointed={pointed === index}>
					{#if bar.value > 0}
						<span class="bar" style:height="{Math.max(1.5, (bar.value / scale) * 100)}%"></span>
					{/if}
				</span>
			{/each}
		</div>
		{#if at && pointed !== null}
			<p
				class="readout"
				aria-hidden="true"
				class:at-start={pointed < bars.length / 3}
				class:at-end={pointed >= (2 * bars.length) / 3}
				style:--at="{((pointed + 0.5) / bars.length) * 100}%"
			>
				<strong>{at.readout}</strong>
				<span>{at.long}</span>
			</p>
		{/if}
	</div>
	<div class="axis" aria-hidden="true">
		{#each bars as bar, index (bar.key)}
			<span>{labelled.has(index) ? bar.short : ''}</span>
		{/each}
	</div>
</div>

<style>
	.chart {
		display: grid;
		gap: 0.35rem;
		min-width: 0;
	}

	.top {
		color: var(--ink-3);
		font-size: var(--text-label);
		font-variant-numeric: tabular-nums;
		line-height: 1.3;
	}

	.plot {
		position: relative;
		border-bottom: 1px solid var(--line-strong);
		border-radius: 2px;
	}

	.line {
		position: absolute;
		inset-inline: 0;
		height: 1px;
		background: var(--line);
	}

	.bars {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(var(--bars), minmax(0, 1fr));
		align-items: end;
		touch-action: pan-y;
	}

	/* a bar's place: the bar stands in the middle of it, with air on each side */
	.slot {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: 100%;
	}

	.slot.pointed {
		background: var(--line); /* (where colours cannot be mixed) */
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.bar {
		width: min(62%, 1.75rem);
		min-width: 2px;
		border-radius: 4px 4px 0 0;
		background: var(--accent);
	}

	.slot.pointed .bar {
		background: var(--accent-hover);
	}

	/* what the pointed bar holds: above the bars, over its bar */
	.readout {
		position: absolute;
		bottom: calc(100% + 0.4rem);
		left: var(--at);
		z-index: 1;
		display: grid;
		gap: 0.1rem;
		width: max-content;
		max-width: min(100%, 18rem);
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-s);
		background: var(--surface-2);
		box-shadow: 0 10px 24px -12px var(--shadow);
		color: var(--ink-2);
		font-size: var(--text-fine);
		line-height: 1.4;
		pointer-events: none;
		translate: -50% 0;
	}

	.readout.at-start {
		left: 0;
		translate: none;
	}

	.readout.at-end {
		right: 0;
		left: auto;
		translate: none;
	}

	.readout strong {
		color: var(--ink);
		font-size: var(--text-small);
		font-variant-numeric: tabular-nums;
	}

	/* the labels under the bars: each under its own bar, and allowed to run over its neighbours' empty places */
	.axis {
		display: grid;
		grid-template-columns: repeat(var(--bars), minmax(0, 1fr));
		color: var(--ink-3);
		font-size: var(--text-label);
		font-variant-numeric: tabular-nums;
		line-height: 1.3;
	}

	.axis span {
		display: flex;
		justify-content: center;
		overflow: visible;
		white-space: nowrap;
	}

	/* the first and last label keep inside the chart */
	.axis span:first-child {
		justify-content: flex-start;
	}

	.axis span:last-child {
		justify-content: flex-end;
	}
</style>
