<script lang="ts">
	// The person's own goal: calories eaten minus calories burned, for a day.
	// It is theirs to choose - the page suggests none, and starts at "about
	// as much as I burn". The database takes nothing further than 500 either
	// way, and no goal below zero for a body that is underweight by its own
	// numbers; then the page says so.
	import { GOALS, goalName } from '#lib/food/numbers.ts';
	import { diary } from '#lib/food/store.svelte.ts';

	function choose(event: Event & { currentTarget: HTMLSelectElement }) {
		const taken = diary.setGoal(Number(event.currentTarget.value));
		// (not taken: the list goes back to the goal there is)
		if (!taken) event.currentTarget.value = String(diary.goal);
	}
</script>

<div class="panel">
	<header>
		<h2>Your goal</h2>
		<p>Calories eaten minus calories burned, for a day. It is yours to choose, and to change whenever you like.</p>
	</header>
	<div class="field">
		<label for="food-goal">My goal for a day</label>
		<select id="food-goal" value={String(diary.goal)} onchange={choose}>
			{#each GOALS as goal (goal)}
				<option value={String(goal)}>{goalName(goal)}</option>
			{/each}
		</select>
	</div>
	{#if diary.said}<p class="notice" role="alert">{diary.said}</p>{/if}
</div>
