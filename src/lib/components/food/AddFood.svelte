<script lang="ts">
	// Finding the food to write down - one box, as few taps as can be:
	//
	//   - Nothing typed yet: the foods the person eats most, each with the
	//     amount they had last time and a "+" that writes it down at once.
	//   - Typing: their own foods and USDA's common foods appear at once, on
	//     the phone, without a request. Open Food Facts and USDA's full search
	//     are asked when the person presses Search (Open Food Facts asks apps
	//     not to search while somebody types).
	//   - Scan: a barcode, with the camera, looked up in Open Food Facts and
	//     then in USDA's branded foods.
	//   - Label: a photo of a nutrition label; the calories are read off it
	//     on the phone, and the person checks them.
	//   - Dish: a photo of a plate; a small model on the phone suggests what
	//     the dish is, and its name is searched for. Experimental.
	//   - Quick: just a name and calories.
	//
	// No picture leaves the phone (src/lib/food/readers.ts).
	import { tick } from 'svelte';
	import { asset } from '$app/paths';
	import { count } from '#lib/account/format.ts';
	import type { FoundFood, Meal } from '#lib/account/types.ts';
	import { best, searchCommon } from '#lib/food/common.ts';
	import { barcode, foodProblem, kcalFor, LIMITS, round1, servingName, typed } from '#lib/food/numbers.ts';
	import { barcodeOnPhoto, DISH_MEGABYTES, dishFetched, dishThere, guessDish, prepareDish, readLabelPhoto, type DishGuess } from '#lib/food/readers.ts';
	import { inTurns, lookUpBarcode, lookUpUsdaBarcode, searchOpenFoodFacts, searchUsda, searchWords } from '#lib/food/sources.ts';
	import { diary, type KeptFood } from '#lib/food/store.svelte.ts';
	import FoodRow from './FoodRow.svelte';
	import QuickForm from './QuickForm.svelte';
	import Scanner, { canScan } from './Scanner.svelte';
	import Sources from './Sources.svelte';

	let {
		meal,
		active,
		onpick,
		onagain,
		onquick
	}: {
		/** the meal a new entry starts with */
		meal: Meal | null;
		/** false while another view lies on top of this one: then the camera is off */
		active: boolean;
		/** a food was picked: next comes "how much" */
		onpick: (food: FoundFood | KeptFood) => void;
		/** "+" beside a usual food: written down at once, with the amount of last time */
		onagain: (food: KeptFood, grams: number) => void;
		/** a name and calories were given: that is a whole entry */
		onquick: (entry: { name: string; kcal: number; meal: Meal | null }) => void;
	} = $props();

	const uid = $props.id();
	const NO_CONNECTION = 'No connection. Your foods and the common foods are here; looking a food up online needs one.';
	const COMMON = asset('food/common-foods.json');

	type Mode = 'find' | 'scan' | 'label' | 'dish' | 'quick' | 'make';
	let mode = $state<Mode>('find');
	let box = $state<HTMLInputElement>();

	// the box is ready to type in as soon as the view opens
	$effect(() => {
		if (active && mode === 'find') void tick().then(() => box?.focus({ preventScroll: true }));
	});

	function back() {
		mode = 'find';
	}

	// ---- the usual foods ----------------------------------------------------------------
	/** How much of a food was written down last time - or one serving, or 100 g. */
	function lastGrams(food: KeptFood): number {
		const last = diary.entries
			.filter((entry) => entry.food_id === food.id && entry.grams && !entry.deleted_at)
			.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
		return last?.grams ?? food.serving_g ?? 100;
	}
	const usual = $derived(diary.myFoods.filter((food) => food.used > 0).slice(0, 8));

	// ---- typing, and searching ------------------------------------------------------------
	let words = $state('');
	const q = $derived(words.trim());
	const mineFound = $derived(q.length >= 2 ? best(q, diary.myFoods, (food) => `${food.name} ${food.brand ?? ''}`, 6) : []);
	let common = $state.raw<FoundFood[]>([]);
	$effect(() => {
		const typedNow = q;
		if (typedNow.length < 2) {
			common = [];
			return;
		}
		// (on the phone, from the list it keeps: no request is made)
		const known = new Set(diary.myFoods.filter((food) => food.source === 'usda').map((food) => food.source_id));
		void searchCommon(typedNow, COMMON, 10).then((found) => {
			if (q === typedNow) common = found.filter((food) => !known.has(food.source_id));
		});
	});

	let searching = $state(false);
	let found = $state.raw<FoundFood[] | null>(null);
	let foundFor = $state('');
	let searchProblem = $state('');

	async function search(event?: SubmitEvent) {
		event?.preventDefault();
		if (searching) return;
		const asked = searchWords(words);
		searchProblem = '';
		if (!asked) {
			searchProblem = 'Type 2 to 80 letters to search for.';
			return;
		}
		if (!diary.online) {
			searchProblem = NO_CONNECTION;
			return;
		}
		box?.blur(); // (the phone's keyboard goes away, and the results can be seen)
		searching = true;
		const [theirs, usda] = await Promise.all([
			searchOpenFoodFacts(asked),
			diary
				.project()
				.then((project) => searchUsda(asked, project))
				.catch(() => [] as FoundFood[])
		]);
		searching = false;
		found = inTurns(theirs.foods, usda);
		foundFor = asked;
		if (theirs.problem === 'limit') searchProblem = 'Open Food Facts takes ten searches a minute. Try again in a moment.';
		else if (theirs.problem === 'silent') searchProblem = 'Open Food Facts does not answer right now. USDA\'s foods are below, if it found any.';
	}

	// a new word typed: the online results were for the old one
	$effect(() => {
		if (q !== foundFor) found = null;
	});

	// ---- a barcode ---------------------------------------------------------------------------
	let digits = $state('');
	let looking = $state(false);
	let scanning = $state(false);
	let product = $state.raw<FoundFood | null>(null);
	let missing = $state<'' | 'unknown' | 'energy'>('');
	let lookedFor = $state('');
	let barcodeProblem = $state('');
	const scans = canScan();

	function startScan() {
		mode = 'scan';
		barcodeProblem = missing = '';
		product = null;
		scanning = scans;
	}

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
		lookedFor = checked.code;
		const answer = await lookUpBarcode(checked.code);
		if (answer.food) {
			product = answer.food;
		} else {
			// Open Food Facts does not have it, or not its calories: USDA's branded foods may
			const usda = await diary
				.project()
				.then((project) => lookUpUsdaBarcode(checked.code, project))
				.catch(() => null);
			if (usda?.food) product = usda.food;
			else if (answer.missing) missing = usda?.found ? 'energy' : answer.missing;
			else if (answer.problem === 'limit') barcodeProblem = 'Open Food Facts takes fifteen barcodes a minute. Try again in a moment.';
			else barcodeProblem = 'Open Food Facts does not answer right now. Try again in a moment.';
		}
		looking = false;
	}

	function scanned(code: string) {
		scanning = false;
		digits = code;
		void lookUp(); // one scan, one request
	}

	// a photo of a barcode, where the live camera will not do
	async function barcodePhoto(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		(event.currentTarget as HTMLInputElement).value = '';
		if (!file) return;
		barcodeProblem = '';
		looking = true;
		const code = await barcodeOnPhoto(file).catch(() => null);
		looking = false;
		if (!code) {
			barcodeProblem = 'No barcode could be read on that photo. Try again closer, with the whole barcode in the picture - or type the digits.';
			return;
		}
		digits = code;
		void lookUp();
	}

	// the camera is not left on under another view, or in another mode
	$effect(() => {
		if (!active || mode !== 'scan') scanning = false;
	});

	// ---- a label -----------------------------------------------------------------------------
	let reading = $state(false);
	let labelProblem = $state('');
	let labelRead = $state(false);

	async function labelPhoto(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		(event.currentTarget as HTMLInputElement).value = '';
		if (!file) return;
		labelProblem = '';
		reading = true;
		try {
			const read = await readLabelPhoto(file);
			if (read.per100 === null) {
				labelProblem = 'The calories could not be read off that photo. Try again with the table flat, in good light and filling the picture - or type the numbers below.';
			}
			ownKcal = read.per100 === null ? '' : String(read.per100);
			ownServing = read.servingG === null ? '' : String(read.servingG);
			ownLabel = read.servingName ?? '';
			labelRead = read.per100 !== null;
			makeOne(ownName || q || '', true);
		} catch {
			labelProblem = 'The label reader could not be started. It needs a connection the first time.';
		}
		reading = false;
	}

	// ---- a dish ------------------------------------------------------------------------------
	let dishReady = $state<boolean | null>(null);
	let dishAvailable = $state<boolean | null>(null);
	let fetchingDish = $state(false);
	let guessing = $state(false);
	let guesses = $state.raw<DishGuess[] | null>(null);
	let dishProblem = $state('');

	async function startDish() {
		mode = 'dish';
		dishProblem = '';
		guesses = null;
		if (dishAvailable === null) [dishAvailable, dishReady] = await Promise.all([dishThere(), dishFetched()]);
	}

	async function fetchDish() {
		fetchingDish = true;
		dishProblem = '';
		try {
			await prepareDish();
			dishReady = true;
		} catch {
			dishProblem = 'The dish recogniser could not be fetched. Try again with a connection.';
		}
		fetchingDish = false;
	}

	async function dishPhoto(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		(event.currentTarget as HTMLInputElement).value = '';
		if (!file) return;
		dishProblem = '';
		guessing = true;
		try {
			guesses = await guessDish(file);
			dishReady = true;
		} catch {
			dishProblem = 'The photo could not be read. Try another one.';
		}
		guessing = false;
	}

	function takeGuess(name: string) {
		words = name;
		mode = 'find';
		void search();
	}

	// ---- a food of the person's own ----------------------------------------------------------
	let ownName = $state('');
	let ownKcal = $state('');
	let ownServing = $state('');
	let ownLabel = $state('');
	let ownProblem = $state('');
	let nameField = $state<HTMLInputElement>();

	function makeOne(name = '', keepNumbers = false) {
		mode = 'make';
		ownName = name;
		ownProblem = '';
		if (!keepNumbers) {
			ownKcal = ownServing = ownLabel = '';
			labelRead = false;
		}
		void tick().then(() => nameField?.focus());
	}

	function saveOwn(event: SubmitEvent) {
		event.preventDefault();
		const kcal = ownKcal.trim() ? typed(ownKcal) : null;
		const serving = ownServing.trim() ? typed(ownServing) : null;
		ownProblem = ownServing.trim() && serving === null ? 'Type the serving as a number of grams, or leave it empty.' : foodProblem({ name: ownName, kcal_100g: kcal, serving_g: serving });
		if (ownProblem || kcal === null) return;
		const food = diary.makeFood({ name: ownName, kcal_100g: kcal, serving_g: serving, serving_label: serving ? ownLabel : null });
		ownName = ownKcal = ownServing = ownLabel = '';
		labelRead = false;
		mode = 'find';
		onpick(food);
	}

	const shownSources = $derived({
		off: Boolean(found?.some((food) => food.source === 'off') || product?.source === 'off'),
		usda: Boolean(common.length || found?.some((food) => food.source === 'usda') || product?.source === 'usda')
	});
</script>

{#snippet icon(name: 'scan' | 'label' | 'dish' | 'quick' | 'plus' | 'back')}
	<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if name === 'scan'}
			<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M8 8v8M11 8v8M14 8v8M17 8v8" />
		{:else if name === 'label'}
			<path d="M6 3.5h12v17H6zM9 7.5h6M9 11h6M9 14.5h3" />
		{:else if name === 'dish'}
			<path d="M3.5 13.5h17a8.5 8.5 0 0 1-17 0ZM12 5v3M8.5 6.5 9.5 9M15.5 6.5 14.5 9" />
		{:else if name === 'quick'}
			<path d="M13 3.5 6 13.5h6l-1 7 7-10h-6l1-7Z" />
		{:else if name === 'plus'}
			<path d="M12 5.5v13M5.5 12h13" />
		{:else}
			<path d="m14 7-5 5 5 5" />
		{/if}
	</svg>
{/snippet}

{#snippet backTo(title: string)}
	<div class="mode-head">
		<button class="icon-button" type="button" aria-label="Back to the search" onclick={back}>{@render icon('back')}</button>
		<h2>{title}</h2>
	</div>
{/snippet}

{#if mode === 'find'}
	<form class="finder" role="search" onsubmit={search}>
		<label class="visually-hidden" for="{uid}-words">Search for a food</label>
		<div class="box">
			<svg class="glass" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
			<input
				id="{uid}-words"
				type="search"
				placeholder="Search foods"
				autocomplete="off"
				autocapitalize="none"
				enterkeyhint="search"
				maxlength="80"
				bind:this={box}
				bind:value={words}
			/>
		</div>
		<button class="button" type="submit" disabled={searching}>{searching ? 'Searching...' : 'Search'}</button>
	</form>

	<div class="ways" role="group" aria-label="Other ways to add">
		<button type="button" onclick={startScan}>{@render icon('scan')}<span>Scan</span></button>
		<button type="button" onclick={() => ((mode = 'label'), (labelProblem = ''))}>{@render icon('label')}<span>Label</span></button>
		<button type="button" onclick={startDish}>{@render icon('dish')}<span>Dish</span></button>
		<button type="button" onclick={() => (mode = 'quick')}>{@render icon('quick')}<span>Quick</span></button>
	</div>

	{#if searchProblem}<p class="notice" role="alert">{searchProblem}</p>{/if}

	{#if q.length < 2}
		{#if usual.length}
			<section class="group" aria-labelledby="{uid}-usual">
				<h3 id="{uid}-usual">Again</h3>
				<ul class="list">
					{#each usual as food (food.id)}
						{@const grams = lastGrams(food)}
						<li class="again">
							<FoodRow {food} onpick={() => onpick(food)} />
							<button class="add-again" type="button" aria-label="Add {food.name}, {round1(grams)} g, about {count(kcalFor(food.kcal_100g, grams))} kcal" onclick={() => onagain(food, grams)}>
								{@render icon('plus')}
								<span>{round1(grams)} g</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
			<p class="estimate">"+" writes it down at once, with the amount of last time.</p>
		{:else}
			<p class="estimate start">
				Type a food: your own foods and common foods appear as you type. Press Search to look in Open Food Facts and USDA as
				well. Foods you pick are kept, and come back here to be added in one tap.
			</p>
		{/if}
		<p><button class="link-button" type="button" onclick={() => makeOne()}>Make a food of your own</button></p>
	{:else}
		{#if mineFound.length}
			<section class="group" aria-labelledby="{uid}-mine">
				<h3 id="{uid}-mine">Yours</h3>
				<ul class="list">
					{#each mineFound as food (food.id)}
						<li><FoodRow {food} onpick={() => onpick(food)} /></li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if common.length}
			<section class="group" aria-labelledby="{uid}-common">
				<h3 id="{uid}-common">Common foods</h3>
				<ul class="list">
					{#each common as food (`c${food.source_id}`)}
						<li><FoodRow {food} onpick={() => onpick(food)} /></li>
					{/each}
				</ul>
			</section>
		{/if}

		<p class="estimate" role="status">
			{#if searching}
				Searching Open Food Facts and USDA...
			{:else if found}
				{found.length === 0 ? `Nothing more found online for "${foundFor}".` : `${found.length} found online for "${foundFor}".`}
			{/if}
		</p>

		{#if found?.length}
			<section class="group" aria-labelledby="{uid}-online">
				<h3 id="{uid}-online">Online</h3>
				<ul class="list">
					{#each found as food (`${food.source}:${food.source_id}`)}
						<li><FoodRow {food} onpick={() => onpick(food)} /></li>
					{/each}
				</ul>
			</section>
		{:else if !found && !searching}
			<p><button class="plain-button wide" type="button" onclick={() => search()}>Search Open Food Facts and USDA for "{q}"</button></p>
		{/if}
		<p><button class="link-button" type="button" onclick={() => makeOne(q)}>Not there? Type it in yourself</button></p>
	{/if}
	<Sources off={shownSources.off} usda={shownSources.usda} />
{:else if mode === 'scan'}
	{@render backTo('Scan a barcode')}
	{#if scanning}
		<Scanner onread={scanned} onstop={() => (scanning = false)} />
	{/if}
	<div class="panel-foot">
		{#if scans && !scanning}<button class="button" type="button" onclick={() => (scanning = true)}>{@render icon('scan')} Scan with the camera</button>{/if}
		<label class="plain-button file">
			Take a photo of the barcode
			<input type="file" accept="image/*" capture="environment" onchange={barcodePhoto} />
		</label>
	</div>
	<form class="fields" onsubmit={lookUp}>
		<div class="field">
			<label for="{uid}-digits">Or type the digits under the barcode</label>
			<div class="with-unit">
				<input id="{uid}-digits" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="search" maxlength="20" bind:value={digits} />
				<button class="button" type="submit" disabled={looking}>{looking ? 'Looking...' : 'Look up'}</button>
			</div>
			<p class="hint">Looked up in Open Food Facts, then in USDA's branded foods. The camera's picture stays on this phone: only the digits are looked up.</p>
		</div>
	</form>
	{#if barcodeProblem}<p class="notice" role="alert">{barcodeProblem}</p>{/if}
	<p class="estimate" role="status">
		{#if looking}
			Looking it up...
		{:else if product}
			Found for {lookedFor}.
		{:else if missing === 'unknown'}
			Neither Open Food Facts nor USDA has the barcode {lookedFor}.
		{:else if missing === 'energy'}
			The barcode {lookedFor} is known, but not its calories.
		{/if}
	</p>
	{#if product}
		<ul class="list">
			<li><FoodRow food={product} onpick={() => product && onpick(product)} /></li>
		</ul>
		<Sources off={product.source === 'off'} usda={product.source === 'usda'} />
	{:else if missing}
		<div class="panel-foot">
			<button class="button" type="button" onclick={() => ((mode = 'label'), (labelProblem = ''))}>{@render icon('label')} Photograph its label</button>
			<button class="plain-button" type="button" onclick={() => makeOne()}>Type it in</button>
		</div>
	{/if}
{:else if mode === 'label'}
	{@render backTo('Read a label')}
	<p class="lead-in">Take a photo of the nutrition table on the packet. The calories are read off it on this phone, and you check them before anything is kept.</p>
	<div class="panel-foot">
		<label class="button file" aria-busy={reading}>
			{@render icon('label')}
			{reading ? 'Reading the label...' : 'Take a photo of the label'}
			<input type="file" accept="image/*" capture="environment" onchange={labelPhoto} disabled={reading} />
		</label>
	</div>
	<p class="estimate">The first time, the reader (about 11 MB) is fetched from this site. The photo stays on this phone.</p>
	{#if labelProblem}<p class="notice" role="alert">{labelProblem}</p>{/if}
	<p><button class="link-button" type="button" onclick={() => makeOne(q)}>Type the numbers in instead</button></p>
{:else if mode === 'dish'}
	{@render backTo('A photo of a dish')}
	<p class="lead-in">
		Experimental. A small model on this phone suggests what the dish is - it knows about 100 dishes, like pizza, ramen or
		Caesar salad - and its name is searched for. It cannot see how much is on the plate, so the amount is yours to say.
	</p>
	{#if dishAvailable === false}
		<p class="notice">The dish recogniser is not in this copy of the site.</p>
	{:else if dishAvailable && !dishReady}
		<div class="panel-foot">
			<button class="button" type="button" onclick={fetchDish} disabled={fetchingDish}>{fetchingDish ? 'Fetching...' : `Fetch it once (about ${DISH_MEGABYTES} MB)`}</button>
		</div>
		<p class="estimate">It comes from this site, is kept by this browser, and then works without a connection. A Wi-Fi connection is best.</p>
	{:else if dishAvailable}
		<div class="panel-foot">
			<label class="button file" aria-busy={guessing}>
				{@render icon('dish')}
				{guessing ? 'Looking at the photo...' : 'Take a photo of the dish'}
				<input type="file" accept="image/*" capture="environment" onchange={dishPhoto} disabled={guessing} />
			</label>
		</div>
		<p class="estimate">The photo stays on this phone.</p>
	{/if}
	{#if dishProblem}<p class="notice" role="alert">{dishProblem}</p>{/if}
	{#if guesses}
		<section class="group" aria-labelledby="{uid}-guesses">
			<h3 id="{uid}-guesses">It may be</h3>
			<ul class="list">
				{#each guesses as guess (guess.name)}
					<li>
						<button class="guess" type="button" onclick={() => takeGuess(guess.name)}>
							<span>{guess.name}</span>
							<span class="sure">{guess.share >= 0.6 ? 'likely' : guess.share >= 0.25 ? 'maybe' : 'unlikely'} · {guess.share < 0.01 ? 'under 1%' : `${Math.round(guess.share * 100)}%`}</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
		<p class="estimate">None of these? <button class="link-button" type="button" onclick={back}>Search by name</button></p>
	{/if}
{:else if mode === 'quick'}
	{@render backTo('Quick')}
	<p class="lead-in">Just a name and calories, for when nothing else fits. It is not kept among your foods.</p>
	<QuickForm {meal} action="Add to the diary" ondone={onquick} />
{:else if mode === 'make'}
	{@render backTo('A food of your own')}
	<form class="fields" onsubmit={saveOwn} novalidate>
		<p class="lead-in">
			{labelRead ? 'Read off the label - check the numbers, and give it a name.' : 'Kept in your account, to be picked again. The numbers are on the packet.'}
		</p>
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
				<p class="hint">If it has one.</p>
			</div>
			<div class="field">
				<label for="{uid}-own-label">What a serving is called</label>
				<input id="{uid}-own-label" type="text" autocomplete="off" maxlength={LIMITS.label} placeholder="1 slice" bind:value={ownLabel} />
			</div>
		</div>
		{#if ownProblem}<p class="notice" role="alert">{ownProblem}</p>{/if}
		<div class="panel-foot">
			<button class="button" type="submit">Keep it, and go on</button>
			<button class="link-button" type="button" onclick={back}>Not now</button>
		</div>
	</form>
{/if}

<style>
	/* ---- the box ---- */
	.finder {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.5rem;
	}

	.box {
		position: relative;
	}

	.box input {
		width: 100%;
		min-height: 3.25rem;
		padding: 0.6rem 0.9rem 0.6rem 2.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		background: var(--surface);
		color: var(--ink);
		font: 500 1.0625rem/1.3 var(--font-text);
	}

	.box input:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}

	.glass {
		position: absolute;
		left: 1rem;
		top: 50%;
		translate: 0 -50%;
		color: var(--ink-3);
		pointer-events: none;
	}

	.finder .button {
		min-height: 3.25rem;
		border-radius: 999px;
		padding-inline: 1.25rem;
	}

	/* ---- the other ways, as four buttons in a row ---- */
	.ways {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.5rem;
	}

	.ways > button {
		display: grid;
		justify-items: center;
		gap: 0.3rem;
		min-height: 4.25rem;
		padding: 0.6rem 0.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: 600 var(--text-fine) / 1.2 var(--font-text);
		cursor: pointer;
	}

	.ways > button :global(svg) {
		color: var(--accent);
	}

	.ways > button:hover {
		border-color: var(--line-strong);
		background: var(--surface-2);
	}

	.ways > button:focus-visible,
	.add-again:focus-visible,
	.guess:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* ---- lists ---- */
	.group {
		display: grid;
		gap: 0.4rem;
	}

	.group h3 {
		color: var(--ink-3);
		font: 600 var(--text-label) / 1.4 var(--font-text);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.list {
		display: grid;
		border-top: 1px solid var(--line);
	}

	.list > li {
		border-bottom: 1px solid var(--line);
	}

	/* a usual food, with "+" beside it */
	.again {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5rem;
	}

	.add-again {
		display: grid;
		justify-items: center;
		gap: 0.05rem;
		min-width: 3.5rem;
		min-height: 3rem;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--accent);
		font: 600 var(--text-label) / 1.2 var(--font-text);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}

	.add-again span {
		color: var(--ink-2);
	}

	.start {
		font-size: var(--text-small);
	}

	.wide {
		width: 100%;
		white-space: normal;
		text-align: center;
	}

	/* ---- a mode of its own ---- */
	.mode-head {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-left: -0.6rem;
	}

	.mode-head h2 {
		font-size: var(--text-h3);
	}

	.lead-in {
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	/* a button that opens the camera, or a photo: a file field behind a button's face */
	.file {
		position: relative;
		overflow: hidden;
		cursor: pointer;
	}

	.file input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.file:focus-within {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.button :global(svg) {
		margin-right: 0.15rem;
	}

	.with-unit {
		grid-template-columns: minmax(0, 1fr) auto;
	}

	.with-unit .button {
		min-height: 3rem;
		padding-inline: 1.25rem;
	}

	/* a guess of the dish, with how sure the model is - in words as well as a number */
	.guess {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		min-height: 3.25rem;
		padding: 0.6rem 0.25rem;
		border: 0;
		background: none;
		color: var(--ink);
		font: 600 1rem/1.3 var(--font-text);
		text-align: left;
		cursor: pointer;
	}

	.sure {
		color: var(--ink-3);
		font-size: var(--text-fine);
		font-weight: 500;
		white-space: nowrap;
	}

	[role='status']:empty {
		display: none;
	}

	@media (max-width: 22rem) {
		.with-unit,
		.finder {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
