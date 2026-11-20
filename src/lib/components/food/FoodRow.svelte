<script lang="ts">
	// One food in a list, as a button that picks it: its name, its maker,
	// its calories, and where it comes from.
	//
	//   <FoodRow {food} onpick={() => pick(food)} />
	import { count } from '#lib/account/format.ts';
	import type { FoundFood } from '#lib/account/types.ts';
	import { servingName, SOURCE_NAMES } from '#lib/food/numbers.ts';

	let { food, onpick }: { food: FoundFood; onpick: () => void } = $props();

	const serving = $derived(servingName(food));
</script>

<button type="button" class="food-row" onclick={onpick}>
	<span class="name">{food.name}</span>
	<span class="from">{SOURCE_NAMES[food.source]}</span>
	<span class="sub">
		{#if food.brand}{food.brand} · {/if}{count(food.kcal_100g)} kcal in 100 g{#if serving}
			· {serving}{/if}
	</span>
</button>

<style>
	.food-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.15rem 0.75rem;
		align-items: baseline;
		width: 100%;
		min-height: 3.25rem;
		padding: 0.75rem 0.5rem;
		border: 0;
		border-radius: var(--radius-s);
		background: none;
		text-align: left;
		cursor: pointer;
	}

	.food-row:hover {
		background: var(--surface-2);
	}

	.name {
		color: var(--ink);
		font-weight: 600;
		line-height: 1.35;
		overflow-wrap: anywhere;
	}

	.sub {
		grid-column: 1 / -1;
		color: var(--ink-3);
		font-size: var(--text-fine);
		line-height: 1.45;
		overflow-wrap: anywhere;
	}

	/* where the food comes from: small, and not a colour of its own */
	.from {
		padding: 0.1rem 0.45rem;
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		color: var(--ink-3);
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1.5;
		white-space: nowrap;
	}
</style>
