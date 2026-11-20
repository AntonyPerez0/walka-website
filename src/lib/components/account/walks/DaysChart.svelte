<script lang="ts">
	// The last twelve weeks of a public page: time walked, day by day, as
	// small bars. The same is said in words above them (a sentence that sums
	// it up) and in a table under them, so nobody needs the picture - and
	// nobody needs a mouse: the bars only add a closer look for one.
	import { count, dayName, dayShort, distance, duration, localDay, shiftDay } from '#lib/account/format.ts';
	import type { PublicProfile, Units } from '#lib/account/types.ts';

	let { days, units }: { days: NonNullable<PublicProfile['days']>; units: Units } = $props();

	const DAYS = 84;
	/** Round tops for the scale, in minutes: the first one the longest day fits under. */
	const TOPS = [10, 20, 30, 40, 60, 90, 120, 180, 240, 360, 480, 720, 960, 1440];

	// The last bar is today, here - or the walker's newest day, if that is
	// a day ahead (they may be on the other side of the world).
	const last = $derived(days.reduce((latest, day) => (day.day > latest ? day.day : latest), localDay()));
	const first = $derived(shiftDay(last, 1 - DAYS));
	const within = $derived(days.filter((day) => day.day >= first && day.day <= last));
	const byDay = $derived(new Map(within.map((day) => [day.day, day])));
	const slots = $derived(
		Array.from({ length: DAYS }, (_, index) => {
			const day = shiftDay(first, index);
			return { day, walked: byDay.get(day) ?? null };
		})
	);

	const longest = $derived(within.reduce<(typeof within)[number] | null>((most, day) => (!most || day.seconds > most.seconds ? day : most), null));
	const top = $derived((TOPS.find((minutes) => minutes * 60 >= (longest?.seconds ?? 0)) ?? 1440) * 60);
	const inAll = $derived(within.reduce((sum, day) => sum + day.seconds, 0));
	const withSteps = $derived(within.some((day) => typeof day.steps === 'number'));
	/** newest first, for the table */
	const rows = $derived([...within].sort((a, b) => (a.day < b.day ? 1 : -1)));

	const summary = $derived(
		within.length
			? `Walked on ${count(within.length)} of the last ${DAYS} days, ${duration(inAll)} in all. The longest day was ${dayName(longest!.day)}, with ${duration(longest!.seconds)}.`
			: 'No walks in the last twelve weeks.'
	);

	// ---- a closer look, with a mouse or a finger ---------------------------
	let pointed = $state<number | null>(null);
	const at = $derived(pointed === null ? null : slots[pointed]);

	let bars = $state<HTMLElement>();

	function point(event: PointerEvent) {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const index = Math.floor(((event.clientX - box.left) / box.width) * DAYS);
		pointed = Math.min(DAYS - 1, Math.max(0, index));
	}

	// A mouse that leaves the bars takes the closer look with it. A finger
	// has to lift to read it, so there it stays until the next touch elsewhere.
	function elsewhere(event: PointerEvent) {
		if (pointed !== null && bars && !bars.contains(event.target as Node)) pointed = null;
	}
</script>

<svelte:window onpointerdown={elsewhere} />

<section class="panel">
	<header>
		<h2>The last twelve weeks</h2>
		<p id="days-summary">{summary}</p>
	</header>

	{#if within.length}
		<div class="chart">
			<!-- the scale: one line at the top with what it stands for, one half-way, and the ground -->
			<p class="top" aria-hidden="true">{duration(top)}</p>
			<div class="plot" role="img" aria-labelledby="days-summary">
				<span class="line" style:bottom="100%"></span>
				<span class="line" style:bottom="50%"></span>
				<!-- (the pointer only gets a closer look at what the sentence and the table say: no part of the page is worked by it) -->
				<div class="bars" role="presentation" bind:this={bars} onpointermove={point} onpointerdown={point} onpointerleave={(event) => event.pointerType === 'mouse' && (pointed = null)}>
					{#each slots as slot, index (slot.day)}
						<span class="slot" class:pointed={pointed === index}>
							{#if slot.walked}
								<span class="bar" style:height="{Math.max(2, (slot.walked.seconds / top) * 100)}%"></span>
							{/if}
						</span>
					{/each}
				</div>
				{#if at && pointed !== null}
					<p class="readout" class:at-start={pointed < DAYS / 3} class:at-end={pointed >= (2 * DAYS) / 3} style:--at="{((pointed + 0.5) / DAYS) * 100}%" aria-hidden="true">
						<strong>{at.walked ? `${duration(at.walked.seconds)}, ${distance(at.walked.distance_m, units)}` : 'No walk'}</strong>
						<span>{dayName(at.day)}</span>
					</p>
				{/if}
			</div>
			<p class="axis" aria-hidden="true">
				<span style:left="0%">{dayShort(slots[0].day)}</span>
				<span style:left="{(28 / DAYS) * 100}%">{dayShort(slots[28].day)}</span>
				<span style:left="{(56 / DAYS) * 100}%">{dayShort(slots[56].day)}</span>
				<span class="end">{last === localDay() ? 'Today' : dayShort(last)}</span>
			</p>
		</div>

		<details>
			<summary>The days as a table</summary>
			<div class="table">
				<table>
					<thead>
						<tr>
							<th scope="col">Day</th>
							<th scope="col">Time walked</th>
							<th scope="col">Distance</th>
							{#if withSteps}<th scope="col">Steps</th>{/if}
						</tr>
					</thead>
					<tbody>
						{#each rows as day (day.day)}
							<tr>
								<th scope="row">{dayName(day.day)}</th>
								<td>{duration(day.seconds)}</td>
								<td>{distance(day.distance_m, units)}</td>
								{#if withSteps}<td>{typeof day.steps === 'number' ? count(day.steps) : ''}</td>{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{/if}
</section>

<style>
	.chart {
		display: grid;
		gap: 0.35rem;
	}

	.top,
	.axis {
		color: var(--ink-3);
		font-size: var(--text-label);
		font-variant-numeric: tabular-nums;
		line-height: 1.3;
	}

	.plot {
		position: relative;
		height: 7.5rem;
		border-bottom: 1px solid var(--line-strong);
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
		grid-template-columns: repeat(84, minmax(0, 1fr));
		align-items: end;
		touch-action: pan-y;
	}

	/* a day's place: the bar stands in the middle of it, with air on each side */
	.slot {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		height: 100%;
	}

	.slot.pointed {
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	/* (a width in whole pixels: every bar is drawn as wide as the next, wherever its place begins) */
	.bar {
		flex: none;
		width: 2px;
		min-height: 2px;
		border-radius: 1px 1px 0 0;
		background: var(--accent);
	}

	.slot.pointed .bar {
		background: var(--accent-hover);
	}

	/* what the pointed day holds: above the bars, over its day */
	.readout {
		position: absolute;
		bottom: calc(100% + 0.4rem);
		left: var(--at);
		z-index: 1;
		display: grid;
		gap: 0.1rem;
		width: max-content;
		max-width: 100%;
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

	/* near either end it keeps to the edge of the chart, so that it stays on the page */
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
		font-size: var(--text-small);
		font-variant-numeric: tabular-nums;
	}

	.axis {
		position: relative;
		height: 1.3em;
	}

	.axis span {
		position: absolute;
		top: 0;
		white-space: nowrap;
	}

	.axis .end {
		right: 0;
	}

	/* on a wide screen there is room for wider bars, on a very narrow one for thinner ones only */
	@media (min-width: 40rem) {
		.bar {
			width: 4px;
			border-radius: 2px 2px 0 0;
		}
	}

	@media (max-width: 23rem) {
		.bar {
			width: 1.5px;
		}
	}

	details {
		display: grid;
	}

	summary {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: fit-content;
		min-height: 2.75rem;
		/* (as tall as a finger needs, without pushing the panel's edge away) */
		margin-block: -0.5rem;
		color: var(--accent);
		font-size: var(--text-small);
		font-weight: 600;
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	/* a small arrow that points down, and up when the table is open */
	summary::after {
		content: '';
		width: 0.42em;
		height: 0.42em;
		margin-bottom: 0.2em;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(45deg);
	}

	details[open] > summary::after {
		margin-bottom: -0.2em;
		transform: rotate(-135deg);
	}

	.table {
		margin-top: 1rem;
	}

	td {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	@media (max-width: 30rem) {
		th,
		td {
			padding: 0.6rem 0.7rem;
		}
	}
</style>
