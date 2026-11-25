<script lang="ts">
	// Every number the account holds of one walk, and how each was come by:
	// measured, estimated, or not known. Said in words, with a mark beside
	// each that differs in its outline too, never by colour alone. Calories
	// are always called an estimate.
	import { count, dayName, distance, duration, kcal, speed } from '#lib/account/format.ts';
	import type { Units } from '#lib/account/types.ts';
	import type { ListedWalk } from '#lib/account/walks.ts';

	let { walk, units }: { walk: ListedWalk; units: Units } = $props();

	type How = 'measured' | 'estimate' | 'unknown';
	const MARK: Record<How, string> = { measured: 'Measured', estimate: 'Estimate', unknown: 'Not known' };

	/** "21:30" by the clock where it was walked, with how far that clock was from UTC; or by this computer's. */
	function clock(iso: string): string {
		const at = Date.parse(iso);
		if (walk.utc_offset_min == null)
			return `${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(at)} by this computer's clock`;
		const offset = walk.utc_offset_min;
		const zone = offset === 0 ? 'UTC' : `UTC${offset > 0 ? '+' : '-'}${Math.floor(Math.abs(offset) / 60)}${Math.abs(offset) % 60 ? `:${String(Math.abs(offset) % 60).padStart(2, '0')}` : ''}`;
		return `${new Date(at + offset * 60_000).toISOString().slice(11, 19)} (${zone})`;
	}

	const SESSION: Record<string, string> = {
		wow: 'In a game session (World of Warcraft)',
		free: 'No game session',
		manual: 'A manual session, from an older Walka'
	};
	const ORIGIN: Record<string, string> = { walka: 'Sent by Walka', file: "From one of Walka's files", web: 'Typed in here', android: 'From Android' };

	const rows = $derived.by(() => {
		const distanceHow: How = walk.distance_source === 'treadmill' ? 'measured' : walk.distance_source === 'speed' ? 'estimate' : 'unknown';
		const stepsHow: How = walk.steps_source === 'treadmill' ? 'measured' : walk.steps_source === 'estimate' ? 'estimate' : 'unknown';
		const typed = walk.origin === 'web';
		return [
			{ name: 'Started', value: `${dayName(walk.local_day)}, ${clock(walk.started_at)}` },
			{ name: 'Ended', value: clock(walk.ended_at) },
			{
				name: 'Time on the belt',
				value: duration(walk.seconds),
				how: (typed ? 'unknown' : 'measured') as How,
				note: typed ? 'typed in' : "Walka's clock, while the belt moved"
			},
			{
				name: 'Distance',
				value: distance(walk.distance_m, units),
				how: distanceHow,
				note: distanceHow === 'measured' ? 'by the treadmill' : distanceHow === 'estimate' ? "from the belt's speed" : typed ? 'typed in' : 'not said'
			},
			{
				name: 'Steps',
				value: count(walk.steps),
				how: stepsHow,
				note: stepsHow === 'measured' ? 'counted by the treadmill' : stepsHow === 'estimate' ? 'from your speed and height' : typed ? 'typed in' : 'not said'
			},
			{
				name: 'Average speed',
				value: walk.seconds > 0 && walk.distance_m > 0 ? speed(walk.distance_m / walk.seconds, units) : '-',
				how: undefined,
				note: 'distance over time, worked out here'
			},
			{
				name: 'Calories',
				value: kcal(walk.kcal),
				how: 'estimate' as How,
				note: walk.calories_source === 'heart_rate' ? 'from your heart rate' : walk.calories_source === 'speed' ? 'from your speed' : 'way not said'
			},
			{
				name: 'Of which on top of sitting',
				value: walk.kcal_extra == null ? '-' : kcal(walk.kcal_extra),
				how: (walk.kcal_extra == null ? 'unknown' : 'estimate') as How,
				note: walk.kcal_extra == null ? '' : 'what sitting at the desk would not have burned'
			},
			{ name: 'Game', value: walk.session ? (SESSION[walk.session] ?? 'Not known') : 'Not known' },
			{ name: 'How it got here', value: ORIGIN[walk.origin] ?? 'From elsewhere' },
			...(walk.origin === 'web' ? [] : [{ name: 'Its name on your computer', value: walk.client_id }])
		];
	});
</script>

<dl class="details">
	{#each rows as row (row.name)}
		<div>
			<dt>{row.name}</dt>
			<dd>
				<span class="value">{row.value}</span>
				{#if 'how' in row && row.how}<span class="mark {row.how}">{MARK[row.how]}</span>{/if}
				{#if 'note' in row && row.note}<span class="note">{row.note}</span>{/if}
			</dd>
		</div>
	{/each}
</dl>

<style>
	.details {
		display: grid;
		gap: 0;
		margin: 0.5rem 0 0.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-s);
		background: var(--bg);
		font-size: var(--text-fine);
		line-height: 1.45;
	}

	.details > div {
		display: grid;
		grid-template-columns: 11rem minmax(0, 1fr);
		gap: 0.25rem 1rem;
		padding: 0.5rem 0.8rem;
	}

	.details > div + div {
		border-top: 1px solid var(--line);
	}

	dt {
		color: var(--ink-3);
	}

	dd {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.5rem;
		margin: 0;
		color: var(--ink);
	}

	.value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}

	/* measured, estimate, not known: told apart by the word, and by the outline (solid, dashed, dotted) */
	.mark {
		padding: 0 0.45rem;
		border: 1px solid var(--ink-3);
		border-radius: 999px;
		color: var(--ink-2);
		font-size: var(--text-label);
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.mark.measured {
		border-style: solid;
	}

	.mark.estimate {
		border-style: dashed;
	}

	.mark.unknown {
		border-style: dotted;
		color: var(--ink-3);
	}

	.note {
		color: var(--ink-3);
	}

	@media (max-width: 30rem) {
		.details > div {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
