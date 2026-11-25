<script lang="ts">
	// What is written down for a day, meal by meal - all four meals, each
	// with its own "+", so that adding to lunch is one tap. A row opens the
	// entry to change it; the button beside it deletes it (with "Undo", in
	// the page).
	//
	// A meal can be written down again from another day: on today, an empty
	// meal offers "the same as yesterday"; on another day, a meal offers
	// "copy to today".
	import { count } from '#lib/account/format.ts';
	import type { FoodEntry, Meal } from '#lib/account/types.ts';
	import { MEAL_NAMES, MEALS, round1 } from '#lib/food/numbers.ts';
	import { diary } from '#lib/food/store.svelte.ts';

	let {
		entries,
		before,
		today,
		onedit,
		onadd,
		oncopy
	}: {
		entries: FoodEntry[];
		/** the day before's entries, for "the same as yesterday" (only on today) */
		before: FoodEntry[];
		/** is the day shown today? */
		today: boolean;
		onedit: (entry: FoodEntry) => void;
		/** "+" of a meal */
		onadd: (meal: Meal) => void;
		/** write these down again: on today */
		oncopy: (rows: FoodEntry[], meal: Meal | null) => void;
	} = $props();

	const sum = (rows: FoodEntry[]) => rows.reduce((total, entry) => total + entry.kcal, 0);
	const groups = $derived(
		([...MEALS, null] as (Meal | null)[])
			.map((meal) => {
				const rows = entries.filter((entry) => entry.meal === meal);
				const yesterday = today && meal && !rows.length ? before.filter((entry) => entry.meal === meal) : [];
				return { meal, rows, kcal: sum(rows), yesterday };
			})
			// (the four meals always; entries with no meal named only when there are some)
			.filter((group) => group.meal !== null || group.rows.length)
	);
	const items = (n: number) => (n === 1 ? 'one thing' : `${n} things`);
</script>

<div class="meals">
		{#each groups as group (group.meal)}
			{@const name = group.meal ? MEAL_NAMES[group.meal] : 'No meal named'}
			<section aria-label={name}>
				<header>
					<h3>{name}</h3>
					<p>{group.rows.length ? `${count(group.kcal)} kcal` : ''}</p>
					{#if group.meal}
						{@const meal = group.meal}
						<button class="add" type="button" aria-label="Add to {name.toLowerCase()}" onclick={() => onadd(meal)}>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13" /></svg>
						</button>
					{/if}
				</header>
				{#if group.yesterday.length}
					<button class="again" type="button" onclick={() => oncopy(group.yesterday, group.meal)}>
						The same as yesterday <span>{items(group.yesterday.length)}, about {count(sum(group.yesterday))} kcal</span>
					</button>
				{/if}
				{#if group.rows.length && !today}
					<button class="again" type="button" onclick={() => oncopy(group.rows, group.meal)}>
						Copy to today <span>{items(group.rows.length)}, about {count(group.kcal)} kcal</span>
					</button>
				{/if}
				{#if group.rows.length}
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
				{/if}
			</section>
		{/each}
</div>

<style>
	.meals {
		display: grid;
		gap: 0.75rem;
	}

	/* a meal: a card of its own, as in an app */
	section {
		padding: 0.35rem 1rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}

	header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.75rem;
		min-height: 3rem;
	}

	section:has(.rows) header {
		border-bottom: 1px solid var(--line);
	}

	/* the "+" of a meal: a round button, big enough for a thumb */
	.add {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		margin-right: -0.4rem;
		border: 1px solid var(--line-strong);
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--accent);
		cursor: pointer;
	}

	.add:hover {
		border-color: var(--accent);
	}

	.add:focus-visible,
	.again:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* "the same as yesterday", "copy to today": a quiet line that does it in one tap */
	.again {
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.5rem;
		width: 100%;
		min-height: 2.75rem;
		margin-block: 0.25rem;
		padding: 0.5rem 0.75rem;
		border: 1px dashed var(--line-strong);
		border-radius: var(--radius-s);
		background: none;
		color: var(--accent);
		font: 600 var(--text-small) / 1.4 var(--font-text);
		text-align: left;
		cursor: pointer;
	}

	.again span {
		color: var(--ink-3);
		font-weight: 500;
	}

	h3 {
		font: 600 1.0625rem / 1.3 var(--font-text);
		color: var(--ink);
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
