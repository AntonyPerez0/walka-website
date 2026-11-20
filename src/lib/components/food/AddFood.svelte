<script lang="ts">
	// Finding the food to write down, in four ways: a search by words, a
	// barcode, the person's own foods, or just a name and calories.
	//
	// The two searches ask Open Food Facts and USDA (src/lib/food/sources.ts
	// says how, and by which rules). Nothing is asked while somebody types:
	// one request when they press the button.
	import { tick } from 'svelte';
	import type { FoundFood, Meal } from '#lib/account/types.ts';
	import { barcode, foodProblem, LIMITS, typed } from '#lib/food/numbers.ts';
	import { inTurns, lookUpBarcode, searchOpenFoodFacts, searchUsda, searchWords } from '#lib/food/sources.ts';
	import { diary, type KeptFood } from '#lib/food/store.svelte.ts';
	import FoodRow from './FoodRow.svelte';
	import QuickForm from './QuickForm.svelte';
	import Scanner, { canScan } from './Scanner.svelte';
	import Sources from './Sources.svelte';

	let {
		meal,
		active,
		onpick,
		onquick
	}: {
		/** the meal a new entry starts with */
		meal: Meal | null;
		/** false while another view lies on top of this one: then the camera is off */
		active: boolean;
		/** a food was picked: next comes "how much" */
		onpick: (food: FoundFood | KeptFood) => void;
		/** a name and calories were given: that is a whole entry */
		onquick: (entry: { name: string; kcal: number; meal: Meal | null }) => void;
	} = $props();

	const uid = $props.id();

	const WAYS = [
		{ id: 'search', name: 'Search' },
		{ id: 'barcode', name: 'Barcode' },
		{ id: 'mine', name: 'Mine' },
		{ id: 'quick', name: 'Quick' }
	] as const;
	type Way = (typeof WAYS)[number]['id'];
	let way = $state<Way>('search');
	let tabs = $state<HTMLElement>();

	// the arrow keys go from one way to the next, as in any row of tabs
	function arrows(event: KeyboardEvent) {
		const at = WAYS.findIndex((item) => item.id === way);
		const to = event.key === 'ArrowRight' ? at + 1 : event.key === 'ArrowLeft' ? at - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? WAYS.length - 1 : -1;
		if (to === -1 && event.key !== 'ArrowLeft') return;
		event.preventDefault();
		way = WAYS[(to + WAYS.length) % WAYS.length].id;
		void tick().then(() => tabs?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
	}

	const NO_CONNECTION = 'No connection. Looking a food up needs one. "Mine" and "Quick" work without.';

	// ---- search by words -----------------------------------------------------------
	let words = $state('');
	let searching = $state(false);
	let found = $state.raw<FoundFood[] | null>(null);
	let foundFor = $state('');
	let searchProblem = $state('');

	async function search(event: SubmitEvent) {
		event.preventDefault();
		if (searching) return;
		const q = searchWords(words);
		searchProblem = '';
		if (!q) {
			searchProblem = 'Type 2 to 80 letters to search for.';
			return;
		}
		if (!diary.online) {
			searchProblem = NO_CONNECTION;
			return;
		}
		searching = true;
		const [theirs, usda] = await Promise.all([
			searchOpenFoodFacts(q),
			diary
				.project()
				.then((project) => searchUsda(q, project))
				.catch(() => [] as FoundFood[])
		]);
		searching = false;
		found = inTurns(theirs.foods, usda);
		foundFor = q;
		if (theirs.problem === 'limit') searchProblem = 'Open Food Facts takes ten searches a minute. Try again in a moment.';
		else if (theirs.problem === 'silent') searchProblem = 'Open Food Facts does not answer right now. Try again in a moment. The other ways still work.';
	}

	// ---- barcode ---------------------------------------------------------------------
	let digits = $state('');
	let looking = $state(false);
	let scanning = $state(false);
	let product = $state.raw<FoundFood | null>(null);
	let missing = $state<'' | 'unknown' | 'energy'>('');
	let lookedFor = $state('');
	let barcodeProblem = $state('');
	const scans = canScan();

	async function lookUp(event?: SubmitEvent) {
		event?.preventDefault();
		if (looking) return;
		barcodeProblem = missing = '';
		product = null;
		const checked = barcode(digits);
		if ('problem' in checked) {
			barcodeProblem = checked.problem;
			return;
		}
		if (!diary.online) {
			barcodeProblem = NO_CONNECTION;
			return;
		}
		looking = true;
		const answer = await lookUpBarcode(checked.code);
		looking = false;
		lookedFor = checked.code;
		if (answer.food) product = answer.food;
		else if (answer.missing) missing = answer.missing;
		else if (answer.problem === 'limit') barcodeProblem = 'Open Food Facts takes fifteen barcodes a minute. Try again in a moment.';
		else barcodeProblem = 'Open Food Facts does not answer right now. Try again in a moment. The other ways still work.';
	}

	function scanned(code: string) {
		scanning = false;
		digits = code;
		void lookUp(); // one scan, one request
	}

	// (the camera is not left on under another view)
	$effect(() => {
		if (!active || way !== 'barcode') scanning = false;
	});

	// ---- the person's own foods ---------------------------------------------------------
	let making = $state(false);
	let ownName = $state('');
	let ownKcal = $state('');
	let ownServing = $state('');
	let ownLabel = $state('');
	let ownProblem = $state('');
	let filter = $state('');
	let nameField = $state<HTMLInputElement>();

	const mine = $derived(diary.myFoods);
	const wanted = $derived(filter.trim().toLowerCase());
	const fits = (food: KeptFood) => !wanted || `${food.name} ${food.brand ?? ''}`.toLowerCase().includes(wanted);
	const recent = $derived(mine.filter(fits).slice(0, wanted ? 30 : 8));
	const own = $derived(
		mine
			.filter((food) => food.source === 'own' && fits(food))
			.sort((a, b) => a.name.localeCompare(b.name))
			.slice(0, 60)
	);

	function makeOne(name = '') {
		way = 'mine';
		making = true;
		ownName = name;
		ownProblem = '';
		void tick().then(() => nameField?.focus());
	}

	function saveOwn(event: SubmitEvent) {
		event.preventDefault();
		const kcal = ownKcal.trim() ? typed(ownKcal) : null;
		const serving = ownServing.trim() ? typed(ownServing) : null;
		ownProblem = ownServing.trim() && serving === null ? 'Type the serving as a number of grams, or leave it empty.' : foodProblem({ name: ownName, kcal_100g: kcal, serving_g: serving });
		if (ownProblem || kcal === null) return;
		const food = diary.makeFood({ name: ownName, kcal_100g: kcal, serving_g: serving, serving_label: serving ? ownLabel : null });
		making = false;
		ownName = ownKcal = ownServing = ownLabel = '';
		onpick(food);
	}
</script>

<div class="tabs" role="tablist" aria-label="Ways to add a food" bind:this={tabs}>
	{#each WAYS as item (item.id)}
		<button
			type="button"
			role="tab"
			id="{uid}-tab-{item.id}"
			aria-selected={way === item.id}
			aria-controls="{uid}-{item.id}"
			tabindex={way === item.id ? 0 : -1}
			onclick={() => (way = item.id)}
			onkeydown={arrows}
		>
			{item.name}
		</button>
	{/each}
</div>

<div class="way" role="tabpanel" id="{uid}-search" aria-labelledby="{uid}-tab-search" hidden={way !== 'search'}>
	<form class="fields" role="search" onsubmit={search}>
		<div class="field">
			<label for="{uid}-words">Search for a food</label>
			<div class="with-unit">
				<input id="{uid}-words" type="search" autocomplete="off" autocapitalize="none" enterkeyhint="search" maxlength="80" aria-describedby="{uid}-words-hint" bind:value={words} />
				<button class="button" type="submit" disabled={searching}>{searching ? 'Searching...' : 'Search'}</button>
			</div>
			<p class="hint" id="{uid}-words-hint">In Open Food Facts and in USDA FoodData Central. Nothing is sent until you press Search.</p>
		</div>
	</form>

	{#if searchProblem}<p class="notice" role="alert">{searchProblem}</p>{/if}
	<p class="estimate" role="status">
		{#if searching}
			Searching...
		{:else if found}
			{found.length === 0 ? (searchProblem ? '' : `Nothing found for "${foundFor}".`) : found.length === 1 ? `1 food for "${foundFor}".` : `${found.length} foods for "${foundFor}".`}
		{/if}
	</p>

	{#if found?.length}
		<ul class="list">
			{#each found as food (`${food.source}:${food.source_id}`)}
				<li><FoodRow {food} onpick={() => onpick(food)} /></li>
			{/each}
		</ul>
		<Sources off={found.some((food) => food.source === 'off')} usda={found.some((food) => food.source === 'usda')} />
	{:else if found && !searching}
		<p class="panel-foot">
			<button class="plain-button" type="button" onclick={() => makeOne(foundFor)}>Type it in yourself</button>
		</p>
	{/if}
</div>

<div class="way" role="tabpanel" id="{uid}-barcode" aria-labelledby="{uid}-tab-barcode" hidden={way !== 'barcode'}>
	<form class="fields" onsubmit={lookUp}>
		<div class="field">
			<label for="{uid}-digits">The digits under the barcode</label>
			<div class="with-unit">
				<input id="{uid}-digits" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="search" maxlength="20" aria-describedby="{uid}-digits-hint" bind:value={digits} />
				<button class="button" type="submit" disabled={looking}>{looking ? 'Looking...' : 'Look up'}</button>
			</div>
			<p class="hint" id="{uid}-digits-hint">8, 12, 13 or 14 digits. Looked up in Open Food Facts.</p>
		</div>
	</form>

	{#if scans}
		{#if scanning}
			<Scanner onread={scanned} onstop={() => (scanning = false)} />
		{:else}
			<p><button class="plain-button" type="button" onclick={() => (scanning = true)}>Scan with the camera</button></p>
		{/if}
	{/if}

	{#if barcodeProblem}<p class="notice" role="alert">{barcodeProblem}</p>{/if}
	<p class="estimate" role="status">
		{#if looking}
			Looking it up...
		{:else if product}
			Found for {lookedFor}.
		{:else if missing === 'unknown'}
			Open Food Facts has no food with the barcode {lookedFor}.
		{:else if missing === 'energy'}
			Open Food Facts has the barcode {lookedFor}, but not its calories.
		{/if}
	</p>

	{#if product}
		<ul class="list">
			<li><FoodRow food={product} onpick={() => product && onpick(product)} /></li>
		</ul>
		<Sources off />
	{:else if missing}
		<p class="panel-foot">
			<button class="plain-button" type="button" onclick={() => makeOne()}>Type it in yourself</button>
		</p>
	{/if}
</div>

<div class="way" role="tabpanel" id="{uid}-mine" aria-labelledby="{uid}-tab-mine" hidden={way !== 'mine'}>
	{#if making}
		<form class="fields panel" onsubmit={saveOwn} novalidate>
			<header>
				<h2>A food of your own</h2>
				<p>Kept in your account, to be picked again. The numbers are on the packet.</p>
			</header>
			<div class="field">
				<label for="{uid}-own-name">Its name</label>
				<input id="{uid}-own-name" type="text" autocomplete="off" maxlength={LIMITS.name} bind:this={nameField} bind:value={ownName} oninput={() => (ownProblem = '')} />
			</div>
			<div class="field">
				<label for="{uid}-own-kcal">Calories in 100 g</label>
				<input id="{uid}-own-kcal" type="text" inputmode="decimal" autocomplete="off" bind:value={ownKcal} oninput={() => (ownProblem = '')} />
				<p class="hint">For a drink: in 100 ml.</p>
			</div>
			<div class="fields fields--two">
				<div class="field">
					<label for="{uid}-own-serving">One serving, in grams</label>
					<input id="{uid}-own-serving" type="text" inputmode="decimal" autocomplete="off" bind:value={ownServing} oninput={() => (ownProblem = '')} />
					<p class="hint">If it has one. You can leave this empty.</p>
				</div>
				<div class="field">
					<label for="{uid}-own-label">What a serving is called</label>
					<input id="{uid}-own-label" type="text" autocomplete="off" maxlength={LIMITS.label} placeholder="1 slice" bind:value={ownLabel} />
				</div>
			</div>
			{#if ownProblem}<p class="notice" role="alert">{ownProblem}</p>{/if}
			<div class="panel-foot">
				<button class="button" type="submit">Keep it, and go on</button>
				<button class="link-button" type="button" onclick={() => (making = false)}>Not now</button>
			</div>
		</form>
	{:else}
		<p><button class="plain-button" type="button" onclick={() => makeOne()}>Make a food of your own</button></p>
	{/if}

	{#if !mine.length}
		{#if !making}<p class="estimate">Foods you pick from a search, and foods you make yourself, are kept here to be picked again.</p>{/if}
	{:else}
		{#if mine.length > 8}
			<div class="field">
				<label for="{uid}-filter">Find among your foods</label>
				<input id="{uid}-filter" type="search" autocomplete="off" autocapitalize="none" bind:value={filter} />
			</div>
		{/if}

		{#snippet rows(foods: KeptFood[])}
			<ul class="list">
				{#each foods as food (food.id)}
					<li class="with-remove">
						<FoodRow {food} onpick={() => onpick(food)} />
						<button class="icon-button" type="button" aria-label="Remove {food.name} from your foods" onclick={() => diary.remove('food', food.id)}>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
						</button>
					</li>
				{/each}
			</ul>
		{/snippet}

		<section class="group">
			<h2>{wanted ? 'Found among your foods' : 'Recent'}</h2>
			{#if recent.length}
				{@render rows(recent)}
			{:else}
				<p class="estimate">None of your foods has "{filter.trim()}" in its name.</p>
			{/if}
		</section>
		{#if own.length && !wanted}
			<section class="group">
				<h2>My foods</h2>
				{@render rows(own)}
			</section>
		{/if}
		<Sources off={recent.some((food) => food.source === 'off')} usda={recent.some((food) => food.source === 'usda')} />
	{/if}
</div>

<div class="way" role="tabpanel" id="{uid}-quick" aria-labelledby="{uid}-tab-quick" hidden={way !== 'quick'}>
	<p class="estimate">Just a name and calories, for when nothing else fits. It is not kept among your foods.</p>
	<QuickForm {meal} action="Add to the diary" ondone={onquick} />
</div>

<style>
	.way {
		display: grid;
		gap: 1rem;
	}

	/* a field and its button on one line; on a narrow screen the button goes under the field */
	.with-unit {
		grid-template-columns: minmax(0, 1fr) auto;
	}

	.with-unit .button {
		min-height: 3rem;
		padding-inline: 1.25rem;
	}

	@media (max-width: 22rem) {
		.with-unit {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.list {
		display: grid;
		border-top: 1px solid var(--line);
	}

	.list > li {
		border-bottom: 1px solid var(--line);
	}

	.with-remove {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
	}

	.group {
		display: grid;
		gap: 0.4rem;
	}

	.group h2 {
		color: var(--ink-3);
		font: 600 var(--text-label) / 1.4 var(--font-text);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	[role='status']:empty {
		display: none;
	}
</style>
