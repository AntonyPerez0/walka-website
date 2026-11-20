<script lang="ts">
	// Where the foods on the screen come from, in the words the two food
	// lists ask for. Open Food Facts' data is under the Open Database
	// License, which wants this said wherever its data is shown; USDA asks
	// to be cited like this.
	//
	//   <Sources off usda />
	let { off = false, usda = false }: { off?: boolean; usda?: boolean } = $props();
</script>

{#if off || usda}
	<div class="sources">
		{#if off}
			<p>
				Food data from <a href="https://openfoodfacts.org">Open Food Facts</a>, under the
				<a href="https://opendatacommons.org/licenses/odbl/1-0/">Open Database License</a>.
			</p>
		{/if}
		{#if usda}
			<p>
				U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019.
				<a href="https://fdc.nal.usda.gov">fdc.nal.usda.gov</a>.
			</p>
		{/if}
	</div>
{/if}

<style>
	.sources {
		display: grid;
		gap: 0.35rem;
		color: var(--ink-3);
		font-size: var(--text-fine);
		line-height: 1.55;
	}
</style>
