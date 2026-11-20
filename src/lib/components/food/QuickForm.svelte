<script lang="ts">
	// "Quick": just a name and calories, for when nothing else fits - and the
	// same form, filled in, to change such an entry.
	import type { Meal } from '#lib/account/types.ts';
	import { entryProblem, LIMITS, typed } from '#lib/food/numbers.ts';
	import MealChoice from './MealChoice.svelte';

	let {
		name: startName = '',
		kcal: startKcal = null,
		meal: startMeal,
		action,
		ondone,
		ondelete
	}: {
		name?: string;
		kcal?: number | null;
		meal: Meal | null;
		/** what the main button says */
		action: string;
		ondone: (entry: { name: string; kcal: number; meal: Meal | null }) => void;
		ondelete?: () => void;
	} = $props();

	const uid = $props.id();

	// (what the form starts from is read once: it is the person's from then on)
	// svelte-ignore state_referenced_locally
	let name = $state(startName);
	// svelte-ignore state_referenced_locally
	let calories = $state(startKcal === null ? '' : String(startKcal));
	// svelte-ignore state_referenced_locally
	let meal = $state<Meal | null>(startMeal);
	let problem = $state('');

	function done(event: SubmitEvent) {
		event.preventDefault();
		const kcal = calories.trim() ? typed(calories) : null;
		problem = !name.trim() ? 'Give it a name.' : kcal === null ? 'Type the calories as a number.' : entryProblem({ name, grams: null, kcal });
		if (!problem && kcal !== null) ondone({ name: name.trim(), kcal, meal });
	}
</script>

<form class="fields" onsubmit={done} novalidate>
	<div class="field">
		<label for="{uid}-name">What it was</label>
		<input id="{uid}-name" type="text" autocomplete="off" maxlength={LIMITS.name} enterkeyhint="next" bind:value={name} oninput={() => (problem = '')} />
	</div>
	<div class="field">
		<label for="{uid}-kcal">Calories</label>
		<div class="with-unit">
			<input id="{uid}-kcal" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" aria-describedby="{uid}-hint" bind:value={calories} oninput={() => (problem = '')} />
			<span class="unit">kcal</span>
		</div>
		<p class="hint" id="{uid}-hint">From the packet, or your best guess. It is an estimate either way.</p>
	</div>

	<MealChoice bind:value={meal} name="{uid}-meal" />

	{#if problem}<p class="notice" role="alert">{problem}</p>{/if}

	<div class="panel-foot">
		<button class="button" type="submit">{action}</button>
		{#if ondelete}<button class="plain-button" type="button" onclick={ondelete}>Delete this entry</button>{/if}
	</div>
</form>

<style>
	.unit {
		display: grid;
		place-items: center;
		min-width: 3.5rem;
		color: var(--ink-3);
		font-size: var(--text-small);
	}
</style>
