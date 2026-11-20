<script lang="ts">
	// A figure with its unit set small beside it, for a .stat:
	//   <Amount text="18 h 05 min" />   <Amount text="61.20 mi" />
	// The text is one of format.ts's: numbers and units, with spaces between.
	let { text }: { text: string } = $props();

	const parts = $derived(text.split(' ').map((part) => ({ part, unit: !/^[\d.,]+$/.test(part) })));
</script>

<span class="amount">{#each parts as { part, unit }, i (i)}{i ? ' ' : ''}{#if unit}<small>{part}</small>{:else}{part}{/if}{/each}</span>

<style>
	/* a figure and its unit stay on one line */
	.amount {
		white-space: nowrap;
	}
</style>
