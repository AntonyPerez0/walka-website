<script lang="ts">
	// The food diary itself, for a signed-in person who has agreed to it
	// being kept: the day (its summary, what is written down, the goal), and
	// the views that lie on top of the day - adding a food, how much of it,
	// changing an entry. Phone first: one column, the main button within
	// reach of a thumb.
	//
	// The views are steps in the browser's history, so that "Back" - the
	// button here, the browser's, or the phone's - returns to the day.
	import { tick } from 'svelte';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import Tabs from '#lib/components/account/Tabs.svelte';
	import { account } from '#lib/account/account.svelte.ts';
	import { dayBalance, resting, usualPace, walkedExtra, walkingTime } from '#lib/account/estimates.ts';
	import { count, dayName, shiftDay } from '#lib/account/format.ts';
	import type { FoodEntry, FoundFood, Meal } from '#lib/account/types.ts';
	import { kcalFor, MEAL_NAMES, mealAt, veryLittle } from '#lib/food/numbers.ts';
	import { diary, type KeptFood } from '#lib/food/store.svelte.ts';
	import AddFood from './AddFood.svelte';
	import Amount from './Amount.svelte';
	import Entries from './Entries.svelte';
	import Goal from './Goal.svelte';
	import HowMade from './HowMade.svelte';
	import InstallHint from './InstallHint.svelte';
	import QuickForm from './QuickForm.svelte';
	import Sources from './Sources.svelte';
	import Summary from './Summary.svelte';

	// ---- which view ------------------------------------------------------------------
	type View = 'day' | 'add' | 'amount' | 'edit';

	/** The food that "how much" is about. */
	let picked = $state.raw<FoundFood | KeptFood | null>(null);
	/** The entry that is being changed. */
	let editing = $state<string | null>(null);
	const entry = $derived(editing ? (diary.entries.find((row) => row.id === editing) ?? null) : null);
	const entryFood = $derived(entry?.food_id ? (diary.foods.find((food) => food.id === entry.food_id) ?? null) : null);

	const asked = $derived((page.state as { food?: View }).food ?? 'day');
	// (a step forward in the history to a view whose food is no longer known falls back to the view under it)
	const view = $derived<View>(asked === 'amount' && !picked ? 'add' : asked === 'edit' && !entry ? 'day' : asked);

	let section = $state<HTMLElement>();
	let heading = $state<HTMLElement>();
	let dayHeading = $state<HTMLElement>();
	let dayScroll = 0;

	function go(to: Exclude<View, 'day'>) {
		if (view === 'day') dayScroll = window.scrollY;
		pushState('', { food: to } as App.PageState);
	}

	/** Back to the day, from whichever view. */
	function home() {
		const steps = view === 'amount' ? 2 : view === 'day' ? 0 : 1;
		if (steps) history.go(-steps);
	}

	// A new view starts at its top, with its heading in focus - so that a
	// screen reader says where one is, and the keyboard goes on from there.
	let shown: View = 'day';
	$effect(() => {
		const now = view;
		if (now === shown) return;
		shown = now;
		void tick().then(() => {
			if (now === 'day') {
				window.scrollTo({ top: dayScroll, behavior: 'instant' });
				dayHeading?.focus({ preventScroll: true });
			} else {
				section?.scrollIntoView({ behavior: 'instant', block: 'start' });
				heading?.focus({ preventScroll: true });
			}
		});
	});

	// ---- the day ---------------------------------------------------------------------
	const isToday = $derived(diary.day === diary.today);
	const dayTitle = $derived(isToday ? 'Today' : diary.day === shiftDay(diary.today, -1) ? 'Yesterday' : dayName(diary.day));
	const dayEntries = $derived(diary.entriesOf(diary.day));
	const dayBefore = $derived(isToday ? diary.entriesOf(shiftDay(diary.day, -1)) : []);

	const eaten = $derived(Math.round(dayEntries.reduce((sum, row) => sum + row.kcal, 0)));
	const walked = $derived(Math.round(diary.walks.filter((walk) => walk.local_day === diary.day).reduce((sum, walk) => sum + walkedExtra(walk, diary.body?.weight_kg), 0)));
	const balance = $derived(dayBalance(eaten, walked, resting(diary.body), diary.goal, diary.body?.sex));
	const pace = $derived(usualPace(diary.walks, diary.body?.weight_kg));
	const minutes = $derived(isToday && balance.left ? walkingTime(balance.left, pace) : null);

	// ---- a quiet word when the diary shows very little food for three days ------------
	// Shown once, in the ordinary text colour, and closed for good on this
	// device by the person. (Which accounts closed it is all that is kept.)
	const QUIET = 'walka-food-quiet';
	let quiet = $state(true);
	$effect(() => {
		const who = diary.owner;
		try {
			quiet = (JSON.parse(localStorage.getItem(QUIET) ?? '[]') as string[]).includes(who ?? '');
		} catch {
			quiet = false;
		}
	});
	const little = $derived(!quiet && veryLittle(diary.undoing?.kind === 'entry' ? diary.entries.filter((row) => row.id !== diary.undoing?.id) : diary.entries, diary.today));

	function closeLittle() {
		quiet = true;
		try {
			const closed = JSON.parse(localStorage.getItem(QUIET) ?? '[]') as string[];
			localStorage.setItem(QUIET, JSON.stringify([...new Set([...closed, diary.owner])].slice(-20)));
		} catch {
			// closed until the page is loaded again
		}
	}

	// ---- no connection, or no answer --------------------------------------------------
	const away = $derived(
		!diary.online
			? 'No connection. What you add is kept here and sent later.'
			: account.where === 'unavailable' || diary.answered === false
				? 'The database does not answer right now. What you add is kept here and sent later.'
				: ''
	);
	let asking = $state(false);
	async function askAgain() {
		asking = true;
		if (account.where === 'unavailable') await account.retry();
		else await diary.sync(true);
		asking = false;
	}
	const refusedFoods = $derived(diary.waiting.filter((item) => item.kind === 'food' && item.refused));
	// (an entry refused for its day - a device clock that was wrong - would
	// otherwise be seen only on that wrong day)
	const refusedElsewhere = $derived(
		diary.waiting
			.filter((item) => item.kind === 'entry' && item.refused)
			.map((item) => ({ item, row: diary.entries.find((entry) => entry.id === item.id) }))
			// (on the day shown, the entry itself says that it was refused)
			.filter(({ row }) => !row || row.local_day !== diary.day)
	);

	// ---- one line about what was just done ----------------------------------------------
	let done = $state('');
	let doneTimer: ReturnType<typeof setTimeout> | undefined;
	function say(text: string) {
		clearTimeout(doneTimer);
		done = text;
		doneTimer = setTimeout(() => (done = ''), 6000);
	}

	// ---- adding, and changing ------------------------------------------------------------
	/** The meal a new entry starts with: the one chosen last, or - today - what the clock suggests. */
	let lastMeal = $state<Meal | null | undefined>(undefined);
	const startMeal = $derived(lastMeal !== undefined ? lastMeal : isToday ? mealAt(new Date()) : null);
	const onDay = $derived(isToday ? 'today' : dayName(diary.day));

	function pick(food: FoundFood | KeptFood) {
		picked = food;
		go('amount');
	}

	function addPicked(result: { grams: number; kcal: number; meal: Meal | null }) {
		if (!picked) return;
		// picked from a search or from the person's foods: kept, so that it can be picked again
		const food = diary.keepFood(picked);
		diary.addEntry({ meal: result.meal, food_id: food.id, name: food.name, brand: food.brand, grams: result.grams, kcal: result.kcal });
		lastMeal = result.meal;
		say(`Written down: ${food.name}, about ${count(result.kcal)} kcal.`);
		home();
	}

	/** "+" beside a usual food: written down at once, with the amount of last time. */
	function addAgain(food: KeptFood, grams: number) {
		const kcal = kcalFor(food.kcal_100g, grams);
		diary.addEntry({ meal: startMeal, food_id: food.id, name: food.name, brand: food.brand, grams, kcal });
		lastMeal = startMeal;
		say(`Written down: ${food.name}, about ${count(kcal)} kcal${startMeal ? `, for ${MEAL_NAMES[startMeal].toLowerCase()}` : ''}.`);
		home();
	}

	/** "+" of a meal: adding, to that meal. */
	function addTo(meal: Meal) {
		lastMeal = meal;
		go('add');
	}

	/** A meal of another day, written down again - on today. */
	function copy(rows: FoodEntry[], meal: Meal | null) {
		for (const row of rows) diary.addEntry({ meal, food_id: row.food_id, name: row.name, brand: row.brand, grams: row.grams, kcal: row.kcal }, diary.today);
		const kcal = rows.reduce((sum, row) => sum + row.kcal, 0);
		say(`Written down for today: ${rows.length === 1 ? rows[0].name : `${rows.length} things`}, about ${count(kcal)} kcal.`);
		if (!isToday) diary.show(diary.today);
	}

	function addQuick(result: { name: string; kcal: number; meal: Meal | null }) {
		diary.addEntry({ meal: result.meal, food_id: null, name: result.name, brand: null, grams: null, kcal: result.kcal });
		lastMeal = result.meal;
		say(`Written down: ${result.name}, about ${count(result.kcal)} kcal.`);
		home();
	}

	function edit(row: FoodEntry) {
		editing = row.id;
		go('edit');
	}

	function save(change: { name?: string; grams?: number; kcal: number; meal: Meal | null }) {
		if (editing) diary.changeEntry(editing, change);
		say('Changed.');
		home();
	}

	function removeEdited() {
		const id = editing;
		home();
		if (id) diary.remove('entry', id);
	}
</script>

<section class="app food" bind:this={section}>
	<div class="container">
		{#if view === 'day'}
			<header class="app-head">
				<p class="label">Your account</p>
				<h1>Food diary</h1>
			</header>

			<Tabs current="food" />
		{:else}
			<header class="view-head">
				<button class="icon-button" type="button" aria-label={view === 'amount' ? 'Back to the foods' : 'Back to the day'} onclick={() => history.back()}>
					<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
				</button>
				<div>
					<h1 tabindex="-1" bind:this={heading}>{view === 'add' ? 'Add food' : view === 'amount' ? 'How much?' : 'Change an entry'}</h1>
					<p class="label">{startMeal && view === 'add' ? `${MEAL_NAMES[startMeal]} · ` : ''}{onDay}</p>
				</div>
			</header>
		{/if}

		{#if away}
			<p class="notice away" role="status">
				{away}
				{#if diary.online}<button class="link-button" type="button" onclick={askAgain} disabled={asking}>{asking ? 'Asking...' : 'Try again'}</button>{/if}
			</p>
		{/if}

		{#if view === 'day'}
			{#each refusedElsewhere as { item, row } (item.key)}
				<p class="notice" role="alert">
					{#if row}"{row.name}", about {Math.round(row.kcal)} kcal, written down for {dayName(row.local_day)},{:else}Something written down for
						another day{/if} is on this device only: the database did not take it. {item.refused}
				</p>
			{/each}
			{#each refusedFoods as item (item.key)}
				<p class="notice" role="alert">
					A food of yours is on this device only: the database did not take it. {item.refused}
				</p>
			{/each}

			<div class="day">
				<button class="icon-button" type="button" aria-label="The day before" onclick={() => diary.step(-1)}>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 7-5 5 5 5" /></svg>
				</button>
				<div class="day-name" aria-live="polite">
					<h2 tabindex="-1" bind:this={dayHeading}>{dayTitle}</h2>
					{#if dayTitle !== dayName(diary.day)}<p>{dayName(diary.day)}</p>{/if}
				</div>
				<button class="icon-button" type="button" aria-label="The day after" disabled={isToday} onclick={() => diary.step(1)}>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 7 5 5-5 5" /></svg>
				</button>
			</div>
			{#if !isToday}
				<p class="to-today"><button class="link-button" type="button" onclick={() => diary.show(diary.today)}>Go to today</button></p>
			{/if}

			<Summary {balance} today={isToday} {minutes} paced={pace !== null} goal={diary.goal} sex={diary.body?.sex} />

			<HowMade />

			{#if little}
				<aside class="little" aria-label="A word about the diary">
					<p>
						The diary shows very little food for three days. If it is just not complete, ignore this. If you are eating this little,
						please talk to a doctor.
					</p>
					<button class="link-button" type="button" onclick={closeLittle}>Close, and do not show this again</button>
				</aside>
			{/if}

			<Entries entries={dayEntries} before={dayBefore} today={isToday} onedit={edit} onadd={addTo} oncopy={copy} />

			<Goal />

			<InstallHint />
		{/if}

		{#if view === 'add' || view === 'amount'}
			<!-- (kept under "how much", so that Back finds the search as it was left) -->
			<div class="view" hidden={view !== 'add'}>
				<AddFood meal={startMeal} active={view === 'add'} onpick={pick} onagain={addAgain} onquick={addQuick} />
			</div>
		{/if}

		{#if view === 'amount' && picked}
			{#key picked}
				<Amount
					name={picked.name}
					brand={picked.brand}
					source={picked.source}
					per100={picked.kcal_100g}
					serving={picked.serving_g}
					servingLabel={picked.serving_label}
					meal={startMeal}
					action="Add to the diary"
					ondone={addPicked}
				/>
			{/key}
		{/if}

		{#if view === 'edit' && entry}
			{#key entry.id}
				{#if entry.grams}
					<Amount
						name={entry.name}
						brand={entry.brand}
						source={entryFood?.source}
						per100={(entry.kcal / entry.grams) * 100}
						serving={entryFood?.serving_g}
						servingLabel={entryFood?.serving_label}
						grams={entry.grams}
						meal={entry.meal}
						action="Save"
						ondone={save}
						ondelete={removeEdited}
					/>
				{:else}
					<QuickForm name={entry.name} kcal={entry.kcal} meal={entry.meal} action="Save" ondone={save} ondelete={removeEdited} />
				{/if}
			{/key}
		{/if}

		<!-- (on the day only: each list of the "Add food" view names its own source) -->
		{#if view === 'day'}
			<footer class="foot">
				<Sources off usda />
			</footer>
		{/if}

		<!-- within reach of a thumb: what was just done (with "Undo"), and the page's main button -->
		<div class="dock">
			<div class="said" role="status">
				{#if diary.undoing}
					<p>
						<span>{diary.undoing.kind === 'entry' ? 'Deleted' : 'Removed from your foods'}: {diary.undoing.name}.</span>
						<button class="link-button" type="button" onclick={() => diary.undo()}>Undo</button>
					</p>
				{:else if done}
					<p><span>{done}</span></p>
				{/if}
			</div>
			{#if view === 'day'}
				<button class="button add-food" type="button" aria-label="Add food" title="Add food" onclick={() => go('add')}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13" /></svg>
				</button>
			{/if}
		</div>
	</div>
</section>

<style>
	/* one column, a phone's width; on a wide screen the same column, centred */
	.food > .container {
		max-width: calc(34rem + 2 * var(--gutter));
		gap: 1.25rem;
	}

	.food {
		/* (the dock at the foot takes the room the kit leaves under a page) */
		padding-bottom: 0;
	}

	/* a view on top of the day: back, and what it is, on one line */
	.view-head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.25rem;
		margin-left: -0.6rem;
		padding-top: 0.75rem;
	}

	.view-head h1 {
		font-size: clamp(1.625rem, 1.4rem + 1vw, 2.125rem);
	}

	.view-head .label {
		margin-top: 0.15rem;
	}

	.view-head .icon-button {
		color: var(--ink);
	}

	.view-head h1:focus,
	.day-name h2:focus {
		outline: none;
	}

	.view-head h1:focus-visible,
	.day-name h2:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 4px;
	}

	.view {
		display: grid;
		gap: 1.25rem;
	}

	.away {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
	}

	/* the day, and the way to the days around it */
	.day {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem;
		margin-inline: -0.5rem;
	}

	.day-name {
		display: grid;
		gap: 0.1rem;
		justify-items: center;
		text-align: center;
	}

	.day-name h2 {
		font-size: var(--text-h3);
	}

	.day-name p {
		color: var(--ink-3);
		font-size: var(--text-fine);
	}

	.day .icon-button {
		color: var(--ink-2);
	}

	.day .icon-button:disabled {
		opacity: 0.35;
		cursor: default;
		pointer-events: none;
	}

	.to-today {
		margin-top: -0.75rem;
		font-size: var(--text-small);
		text-align: center;
	}

	.to-today .link-button {
		min-height: 2.75rem;
	}

	/* in the ordinary text colour, and with no sign of alarm */
	.little {
		display: grid;
		gap: 0.5rem;
		justify-items: start;
		padding: 1rem 1.1rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	.little .link-button {
		min-height: 2.75rem;
		text-align: left;
	}

	.foot {
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}

	.dock {
		position: sticky;
		bottom: var(--app-nav, 0px);
		z-index: 2;
		display: grid;
		justify-items: end;
		gap: 0.6rem;
		margin-inline: calc(-1 * var(--gutter));
		padding: 1rem var(--gutter) max(1rem, env(safe-area-inset-bottom));
		pointer-events: none;
	}

	.dock > * {
		pointer-events: auto;
	}

	.said {
		justify-self: stretch;
	}

	/* the main button: round and raised, at the right, within reach of a thumb */
	.add-food {
		width: 3.75rem;
		height: 3.75rem;
		padding: 0;
		border-radius: 50%;
		clip-path: none;
		box-shadow: 0 12px 28px -10px var(--shadow);
	}

	.add-food svg {
		width: 1.6rem;
		height: 1.6rem;
	}

	.said p {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		padding: 0.7rem 1rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-s);
		background: var(--surface-2);
		color: var(--ink);
		font-size: var(--text-small);
		line-height: 1.45;
		box-shadow: 0 10px 30px -12px var(--shadow);
	}

	.said span {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.said .link-button {
		min-height: 2.75rem;
		padding-inline: 0.5rem;
		font-weight: 600;
	}
</style>
