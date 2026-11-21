<script lang="ts">
	// A boxed remark, as the README has them.
	//
	//   <Callout>Good to know.</Callout>
	//   <Callout kind="warning" title="Early version">Not yet tried on a real walking pad.</Callout>
	//   <Callout kind="caution" title="You use Walka at your own risk">...</Callout>
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		kind = 'note',
		title,
		children
	}: {
		/** note: good to know. warning: take care. caution: this can hurt. */
		kind?: 'note' | 'warning' | 'caution';
		title?: string;
		children: Snippet;
	} = $props();
</script>

<aside class="callout {kind}" role="note">
	<span class="icon"><Icon name={kind === 'note' ? 'info' : 'warning'} size={22} /></span>
	<div class="body">
		{#if title}<p class="title">{title}</p>{/if}
		{@render children()}
	</div>
</aside>

<style>
	.callout {
		--tone: var(--accent);
		--tint: var(--note-tint);
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.9rem;
		padding: 1.1rem 1.25rem;
		/* (the first line is for a browser that cannot mix colours - Chrome
		   before 111, Safari before 16.2: it reads that one and skips the next) */
		border: 1px solid var(--line-strong);
		border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
		border-left: 3px solid var(--tone);
		border-radius: var(--radius);
		background: var(--tint);
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	.callout.warning {
		--tone: var(--warn);
		--tint: var(--warn-tint);
	}

	.callout.caution {
		--tone: var(--bad);
		--tint: var(--bad-tint);
	}

	.icon {
		margin-top: 0.05rem;
		color: var(--tone);
	}

	.title {
		color: var(--ink);
		font-weight: 650;
	}

	.body {
		display: grid;
		gap: 0.5em;
	}

	.body :global(ul) {
		padding-left: 1.2em;
		list-style: disc;
	}

	.body :global(li + li) {
		margin-top: 0.3em;
	}
</style>
