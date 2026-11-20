<script lang="ts">
	// The totals of an account's walks: all time, the last 30 days or the
	// last 7. Calories are an estimate, and the tile says so.
	import { count, distance, duration } from '#lib/account/format.ts';
	import type { Units } from '#lib/account/types.ts';
	import type { AllTotals } from '#lib/account/walks.ts';
	import Amount from './Amount.svelte';

	let { sums, units }: { /** null while they are being fetched */ sums: AllTotals | null; units: Units } = $props();

	const PERIODS = [
		{ key: 'all', name: 'All time' },
		{ key: 'month', name: '30 days' },
		{ key: 'week', name: '7 days' }
	] as const;

	let period = $state<(typeof PERIODS)[number]['key']>('all');
	const shown = $derived(sums?.[period] ?? null);
</script>

<section class="totals" aria-labelledby="totals-name" aria-busy={!sums}>
	<div class="totals-head">
		<h2 id="totals-name">Totals</h2>
		<div class="tabs period" role="group" aria-label="Totals for">
			{#each PERIODS as { key, name } (key)}
				<button type="button" aria-pressed={period === key} onclick={() => (period = key)}>{name}</button>
			{/each}
		</div>
	</div>

	<dl class="stats">
		<div class="stat">
			<dt>{shown?.walks === 1 ? 'Walk' : 'Walks'}</dt>
			<dd>{shown ? count(shown.walks) : '-'}</dd>
		</div>
		<div class="stat">
			<dt>Time walked</dt>
			<dd>{#if shown}<Amount text={duration(shown.seconds)} />{:else}-{/if}</dd>
		</div>
		<div class="stat">
			<dt>Distance</dt>
			<dd>{#if shown}<Amount text={distance(shown.distance_m, units)} />{:else}-{/if}</dd>
		</div>
		<div class="stat">
			<dt>Steps</dt>
			<dd>{shown ? count(shown.steps) : '-'}</dd>
		</div>
		<div class="stat">
			<dt>Calories, an estimate</dt>
			<dd>{#if shown}<Amount text="{count(shown.kcal)} kcal" />{:else}-{/if}</dd>
		</div>
	</dl>
</section>

<style>
	.totals {
		display: grid;
		gap: 0.75rem;
	}

	.totals-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	.totals-head h2 {
		font-size: var(--text-h3);
	}

	/* a choice between three views of the same numbers: smaller than the tabs of the account */
	.period {
		padding: 0.2rem;
	}

	.period > button {
		flex: none;
		min-height: 2.25rem;
		padding: 0.3rem 0.8rem;
		font-size: var(--text-fine);
	}

	/* Five tiles: three and two on a wide screen, two by two and one below on a phone. */
	.stats {
		grid-template-columns: repeat(6, minmax(0, 1fr));
	}

	.stat {
		grid-column: span 2;
	}

	.stat:nth-child(n + 4) {
		grid-column: span 3;
	}

	@media (max-width: 36rem) {
		.stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.stat,
		.stat:nth-child(n + 4) {
			grid-column: span 1;
		}

		.stat:last-child {
			grid-column: 1 / -1;
		}
	}

	/* on the narrowest phones a long figure ("49 h 07 min") still has to fit its tile */
	@media (max-width: 22.5rem) {
		.stat {
			padding-inline: 1rem;
		}

		.stat dd {
			font-size: 1.25rem;
			word-spacing: -0.06em;
		}
	}
</style>
