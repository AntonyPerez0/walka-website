<script lang="ts">
	// Which meal an entry belongs to: one of four, or none.
	//
	//   <MealChoice bind:value={meal} />
	import type { Meal } from '#lib/account/types.ts';
	import { MEAL_NAMES, MEALS } from '#lib/food/numbers.ts';

	let { value = $bindable(), name = 'meal' }: { value: Meal | null; /** the radio group's name: one for each form on the page */ name?: string } = $props();
</script>

<fieldset>
	<legend>Which meal</legend>
	<div class="choices">
		{#each MEALS as meal (meal)}
			<label>
				<input type="radio" {name} value={meal} checked={value === meal} onchange={() => (value = meal)} />
				<span>{MEAL_NAMES[meal]}</span>
			</label>
		{/each}
		<label>
			<input type="radio" {name} value="" checked={value === null} onchange={() => (value = null)} />
			<span>None</span>
		</label>
	</div>
</fieldset>

<style>
	fieldset {
		display: grid;
		gap: 0.4rem;
		min-width: 0;
		border: 0;
	}

	legend {
		padding: 0;
		color: var(--ink);
		font-size: var(--text-small);
		font-weight: 600;
	}

	.choices {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(5.75rem, 1fr));
		gap: 0.4rem;
		margin-top: 0.4rem;
	}

	label {
		position: relative;
		display: grid;
		cursor: pointer;
	}

	/* the radio button itself is not drawn: the whole name is the button */
	input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}

	span {
		display: grid;
		place-items: center;
		min-height: 2.75rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-s);
		color: var(--ink-2);
		font: 600 0.9375rem/1.2 var(--font-text);
		text-align: center;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	label:hover span {
		border-color: var(--ink-3);
	}

	input:checked + span {
		border-color: var(--accent);
		background: var(--surface-2);
		color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	input:focus-visible + span {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
</style>
