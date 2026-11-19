<script lang="ts">
	// The switch between light and dark. Both icons are in the page and the
	// styles show the right one, so it is right before any script has run.
	import Icon from './Icon.svelte';
	import { theme } from '#lib/theme.svelte.ts';
</script>

<button class="toggle" type="button" onclick={() => theme.toggle()} aria-label="Switch between light and dark" title="Light or dark">
	<span class="only-dark"><Icon name="sun" size={20} /></span>
	<span class="only-light"><Icon name="moon" size={20} /></span>
</button>

<style>
	.toggle {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--ink-2);
		cursor: pointer;
		transition:
			color 0.15s,
			background 0.15s;
	}

	.toggle:hover {
		background: color-mix(in srgb, var(--ink) 9%, transparent);
		color: var(--ink);
	}

	.toggle span {
		display: grid;
	}
</style>
