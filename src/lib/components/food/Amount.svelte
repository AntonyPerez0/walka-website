<script lang="ts">
	// How much of a food, and for which meal - for a new entry, and for an
	// entry that is being changed. The calories are shown as the amount
	// changes; they are an estimate, like every calorie figure here.
	import { count } from '#lib/account/format.ts';
	import type { FoodSource, Meal } from '#lib/account/types.ts';
	import { entryProblem, kcalFor, round1, servingName, SOURCE_NAMES, typed } from '#lib/food/numbers.ts';
	import MealChoice from './MealChoice.svelte';
	import Sources from './Sources.svelte';

	let {
		name,
		brand = null,
		source,
		per100,
		serving = null,
		servingLabel = null,
		grams: startGrams,
		meal: startMeal,
		action,
		ondone,
		ondelete
	}: {
		name: string;
		brand?: string | null;
		/** where the food comes from, when that is known */
		source?: FoodSource;
		/** calories in 100 g */
		per100: number;
		/** one serving in grams, if the food names one */
		serving?: number | null;
		servingLabel?: string | null;
		/** the amount to start from: an entry that is being changed */
		grams?: number | null;
		meal: Meal | null;
		/** what the main button says */
		action: string;
		ondone: (entry: { grams: number; kcal: number; meal: Meal | null }) => void;
		ondelete?: () => void;
	} = $props();

	const uid = $props.id();

	// (what the form starts from is read once: it is the person's from then on)
	// svelte-ignore state_referenced_locally
	let unit = $state<'servings' | 'grams'>(serving && !startGrams ? 'servings' : 'grams');
	// svelte-ignore state_referenced_locally
	let text = $state(startGrams ? String(round1(startGrams)) : serving ? '1' : '100');
	// svelte-ignore state_referenced_locally
	let meal = $state<Meal | null>(startMeal);
	let problem = $state('');

	const amount = $derived(typed(text));
	const grams = $derived(amount === null ? null : unit === 'servings' && serving ? amount * serving : amount);
	const kcal = $derived(grams === null ? null : kcalFor(per100, grams));
	const oneServing = $derived(servingName({ serving_g: serving, serving_label: servingLabel }));

	function measureIn(next: 'servings' | 'grams') {
		if (next === unit || !serving) return;
		// the same amount, said the other way
		if (grams !== null) text = String(next === 'servings' ? Math.round((grams / serving) * 100) / 100 : round1(grams));
		unit = next;
		problem = '';
	}

	function nudge(direction: 1 | -1) {
		const step = unit === 'servings' ? 0.5 : 10;
		const next = Math.round(((amount ?? 0) + direction * step) * 100) / 100;
		text = String(Math.max(step, next));
		problem = '';
	}

	function done(event: SubmitEvent) {
		event.preventDefault();
		if (amount === null || grams === null || kcal === null) {
			problem = 'Type the amount as a number.';
			return;
		}
		problem = entryProblem({ name, grams, kcal });
		if (!problem) ondone({ grams: round1(grams), kcal, meal });
	}
</script>

<form class="amount" onsubmit={done} novalidate>
	<div class="what">
		<p class="name">{name}</p>
		<p class="about">
			{#if brand}{brand} · {/if}{count(per100)} kcal in 100 g{#if source}
				· {SOURCE_NAMES[source]}{/if}
		</p>
	</div>

	{#if serving}
		<div class="field">
			<span class="field-name" id="{uid}-unit">Measured in</span>
			<div class="tabs" role="group" aria-labelledby="{uid}-unit">
				<button type="button" aria-pressed={unit === 'servings'} onclick={() => measureIn('servings')}>Servings</button>
				<button type="button" aria-pressed={unit === 'grams'} onclick={() => measureIn('grams')}>Grams</button>
			</div>
			<p class="hint">One serving is {oneServing}.</p>
		</div>
	{/if}

	<div class="field">
		<label for="{uid}-amount">{unit === 'servings' ? 'How many servings' : 'How many grams'}</label>
		<div class="stepper">
			<button class="plain-button" type="button" aria-label="Less" onclick={() => nudge(-1)}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12" /></svg>
			</button>
			<input
				id="{uid}-amount"
				type="text"
				inputmode="decimal"
				autocomplete="off"
				enterkeyhint="done"
				aria-describedby="{uid}-kcal"
				aria-invalid={problem ? 'true' : undefined}
				bind:value={text}
				oninput={() => (problem = '')}
			/>
			<button class="plain-button" type="button" aria-label="More" onclick={() => nudge(1)}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
			</button>
		</div>
	</div>

	<p class="comes-to" id="{uid}-kcal">
		<output for="{uid}-amount">
			{#if kcal !== null}
				about <strong>{count(kcal)} kcal</strong>{#if unit === 'servings' && grams !== null}
					<span>, {round1(grams)} g</span>{/if}
			{:else}
				Type the amount as a number.
			{/if}
		</output>
	</p>

	<MealChoice bind:value={meal} name="{uid}-meal" />

	{#if problem}<p class="notice" role="alert">{problem}</p>{/if}

	<div class="panel-foot">
		<button class="button" type="submit">{action}</button>
		{#if ondelete}<button class="plain-button" type="button" onclick={ondelete}>Delete this entry</button>{/if}
	</div>

	<Sources off={source === 'off'} usda={source === 'usda'} />
</form>

<style>
	.amount {
		display: grid;
		gap: 1.25rem;
	}

	.what {
		display: grid;
		gap: 0.2rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.name {
		color: var(--ink);
		font-weight: 600;
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

	.about {
		color: var(--ink-3);
		font-size: var(--text-fine);
		line-height: 1.5;
		overflow-wrap: anywhere;
	}

	/* less, the number, more */
	.stepper {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 0.5rem;
	}

	.stepper .plain-button {
		width: 3rem;
		min-height: 3rem;
		padding: 0;
	}

	.stepper input {
		font-size: 1.125rem !important;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.comes-to {
		color: var(--ink-2);
	}

	.comes-to strong {
		font-size: 1.25rem;
	}

	.comes-to span {
		color: var(--ink-3);
		font-size: var(--text-small);
	}
</style>
