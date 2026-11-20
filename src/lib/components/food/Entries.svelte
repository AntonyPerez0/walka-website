<script lang="ts">
	// What is written down for a day, meal by meal. A row opens the entry to
	// change it; the button beside it deletes it (with "Undo", in the page).
	// A day with nothing written down is just an empty day.
	import { count } from '#lib/account/format.ts';
	import type { FoodEntry, Meal } from '#lib/account/types.ts';
	import { MEAL_NAMES, MEALS, round1 } from '#lib/food/numbers.ts';
	import { diary } from '#lib/food/store.svelte.ts';

	let { entries, onedit }: { entries: FoodEntry[]; onedit: (entry: FoodEntry) => void } = $props();

	const groups = $derived(
		([...MEALS, null] as (Meal | null)[])
			.map((meal) => {
				const rows = entries.filter((entry) => entry.meal === meal);
				return { meal, rows, kcal: rows.reduce((sum, entry) => sum + entry.kcal, 0) };
			})
			.filter((group) => group.rows.length)
	);
</script>

{#if !entries.length}
	<p class="empty">Nothing written down for this day.</p>
{:else}
	<div class="meals">
		{#each groups as group (group.meal)}
			<section>
				<header>
					<h3>{group.meal ? MEAL_NAMES[group.meal] : 'No meal named'}</h3>
					<p>{count(group.kcal)} kcal</p>
				</header>
				<ul class="rows">
					{#each group.rows as entry (entry.id)}
						{@const refused = diary.refusedBecause(entry.id)}
						{@const about = [entry.brand, entry.grams ? `${round1(entry.grams)} g` : ''].filter(Boolean).join(' · ')}
						<li>
							<button class="entry" type="button" onclick={() => onedit(entry)}>
								<span class="visually-hidden">Change:</span>
								<span class="row-main">{entry.name}</span>
								<span class="kcal">{count(entry.kcal)} <small>kcal</small></span>
								<span class="row-sub">
									{about}
									{#if diary.notSent(entry.id) && !refused}<span class="waits">not sent yet</span>{/if}
								</span>
							</button>
							<button class="icon-button" type="button" aria-label="Delete {entry.name}" onclick={() => diary.remove('entry', entry.id)}>
								<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M5 7.5h14M10 7.5v-2h4v2M7 7.5l.8 11h8.4l.8-11M10.3 11v4.5M13.7 11v4.5" />
								</svg>
							</button>
							{#if refused}
								<p class="notice refused" role="alert">
									This entry is on this device only: the database did not take it. {refused}
									<button class="link-button" type="button" onclick={() => onedit(entry)}>Change it</button>
								</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	.empty {
		padding-block: 0.5rem;
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	.meals {
		display: grid;
		gap: 1.5rem;
	}

	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px solid var(--line-strong);
	}

	h3 {
		font: 600 var(--text-label) / 1.4 var(--font-text);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	header p {
		color: var(--ink-3);
		font-size: var(--text-fine);
		font-variant-numeric: tabular-nums;
	}

	/* (the kit's .rows gives each row two columns: here the entry and its delete button) */
	.rows > li {
		gap: 0 0.25rem;
		padding: 0.2rem 0;
	}

	.entry {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.1rem 1rem;
		align-items: baseline;
		min-height: 3.25rem;
		padding: 0.6rem 0.5rem;
		margin-left: -0.5rem;
		border: 0;
		border-radius: var(--radius-s);
		background: none;
		text-align: left;
		cursor: pointer;
	}

	.entry:hover {
		background: var(--surface-2);
	}

	.kcal {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.kcal small {
		color: var(--ink-3);
		font-size: var(--text-fine);
	}

	.row-sub {
		grid-column: 1 / -1;
		min-height: 1em;
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	/* an entry that is on this device and not yet in the account: said quietly */
	.waits {
		padding: 0.05rem 0.4rem;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		font-size: 0.6875rem;
		white-space: nowrap;
	}

	.refused {
		grid-column: 1 / -1;
		margin-bottom: 0.5rem;
	}
</style>
