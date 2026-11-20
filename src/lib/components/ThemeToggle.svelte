<script lang="ts">
	// The switch between light and dark. Both icons are in the page and the
	// styles show the right one, so it is right before any script has run.
	import Icon from './Icon.svelte';
	import { theme } from '#lib/theme.svelte.ts';

	// What the button will do, said out loud - once the page knows which
	// light it is in. (The server does not: it writes the neutral words.)
	let ready = $state(false);
	$effect(() => {
		ready = true;
	});
	const label = $derived(ready ? `Switch to the ${theme.current === 'dark' ? 'light' : 'dark'} theme` : 'Switch between light and dark');
</script>

<button class="toggle" type="button" onclick={() => theme.toggle()} aria-label={label} title={label}>
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

	/* Without scripts the button could do nothing, so it is not shown: the
	   page follows the system's light or dark then. */
	:global(html:not(.js)) .toggle {
		display: none;
	}
</style>
