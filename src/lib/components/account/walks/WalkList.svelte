<script lang="ts">
	// The walks, newest first, each with a button to delete it.
	//
	// Deleting cannot be taken back once the database has heard of it: it
	// marks the row, and a marked row stays deleted. So "Undo" is built on
	// this side. The walk leaves the list at once and a line with "Undo"
	// stands in its place for eight seconds; the deletion is sent only when
	// that line goes away - or at once when the page is hidden or left, so
	// that closing the tab does not quietly keep the walk.
	import { onDestroy, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { say } from '#lib/account/account.svelte.ts';
	import { count, dayName, distance, duration, kcal } from '#lib/account/format.ts';
	import type { Units, WalkOrigin } from '#lib/account/types.ts';
	import { leavingKey, remove, removeWhileLeaving, type ListedWalk } from '#lib/account/walks.ts';

	let {
		walks,
		units,
		leaving,
		ongone
	}: {
		walks: ListedWalk[];
		units: Units;
		/** The walks that are on their way out: this list fills it, the totals leave them out. */
		leaving: SvelteSet<string>;
		/** The database has deleted this walk. */
		ongone: (id: string) => void;
	} = $props();

	const UNDO_FOR = 8000;

	/** Where a walk came from, in two words at most. */
	const FROM: Record<WalkOrigin, string> = { walka: 'from Walka', file: 'from a file', web: 'typed in', android: 'from Android' };

	/** The deletions that wait for their "Undo" to run out. */
	const waiting = new Map<string, ReturnType<typeof setTimeout>>();
	/** The deletions that are with the database now: neither a row nor an "Undo" is shown for them. */
	const sent = new SvelteSet<string>();
	/** Kept from the moment a walk is deleted here, for a deletion that is sent while the page is left. */
	let key: string | null = null;
	let over = false;

	let problem = $state('');
	let list = $state<HTMLUListElement>();

	/** "21:30": when the walk started, by the clock it was walked under - or by this one, if the walk does not say. */
	function clock(walk: ListedWalk): string {
		const start = new Date(walk.started_at);
		if (walk.utc_offset_min == null) return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(start);
		return new Date(start.getTime() + walk.utc_offset_min * 60_000).toISOString().slice(11, 16);
	}

	// Two walks of one day are told apart by the time they started.
	const perDay = $derived.by(() => {
		const days = new Map<string, number>();
		for (const walk of walks) days.set(walk.local_day, (days.get(walk.local_day) ?? 0) + 1);
		return days;
	});
	const name = (walk: ListedWalk) => `${dayName(walk.local_day)}${(perDay.get(walk.local_day) ?? 0) > 1 ? `, ${clock(walk)}` : ''}`;

	const button = (id: string) => list?.querySelector<HTMLElement>(`[data-walk="${CSS.escape(id)}"] button`);

	async function drop(walk: ListedWalk) {
		problem = '';
		leaving.add(walk.id);
		waiting.set(
			walk.id,
			setTimeout(() => void send([walk.id]), UNDO_FOR)
		);
		void leavingKey().then(
			(fresh) => (key = fresh ?? key),
			() => {}
		);
		// the button that was pressed is gone: "Undo" stands where it was, and the keyboard stays there
		await tick();
		button(walk.id)?.focus();
	}

	async function undo(id: string) {
		clearTimeout(waiting.get(id));
		waiting.delete(id);
		leaving.delete(id);
		await tick();
		button(id)?.focus();
	}

	/** The line with "Undo" goes away, and the deletion is sent. `now`: the page is being left, and cannot wait. */
	async function send(ids: string[], now = false) {
		for (const id of ids) {
			clearTimeout(waiting.get(id));
			waiting.delete(id);
		}
		// If the keyboard is on an "Undo" that is about to go, it moves to the walk after it (or before it).
		const active = document.activeElement;
		const held = ids.find((id) => button(id) === active);
		let next: HTMLElement | null = null;
		if (held) {
			const row = button(held)?.closest('li');
			const rows = [...(list?.children ?? [])].filter((li) => !ids.includes((li as HTMLElement).dataset.walk ?? ''));
			const after = rows.find((li) => row && row.compareDocumentPosition(li) & Node.DOCUMENT_POSITION_FOLLOWING);
			next = (after ?? rows[rows.length - 1])?.querySelector('button') ?? null;
		}
		for (const id of ids) sent.add(id);
		if (held) void tick().then(() => (next ?? list)?.focus());

		const failed: string[] = [];
		let why = '';
		let left = ids;
		if (now && key) {
			try {
				await removeWhileLeaving(ids, key);
				left = [];
			} catch {
				// The page is still here to hear of it: the ordinary way is tried, which can also renew a key that ran out.
			}
		}
		for (const id of left) {
			try {
				await remove(id);
			} catch (error) {
				failed.push(id);
				why = say(error);
			}
		}
		if (over) return;
		for (const id of ids) {
			sent.delete(id);
			if (failed.includes(id)) leaving.delete(id);
			else ongone(id);
		}
		// a walk that could not be deleted is back in the list, and the page says so
		if (failed.length) problem = `${failed.length === 1 ? 'A walk was' : `${count(failed.length)} walks were`} not deleted, and ${failed.length === 1 ? 'is' : 'are'} back in the list. ${why}`;
	}

	/** The page is hidden or left: what waits is sent now. */
	function sendWaiting() {
		if (waiting.size) void send([...waiting.keys()], true);
	}

	onDestroy(() => {
		sendWaiting();
		over = true;
	});
</script>

<svelte:document onvisibilitychange={() => document.visibilityState === 'hidden' && sendWaiting()} />
<svelte:window onpagehide={sendWaiting} />

{#if problem}<p class="notice notice--bad" role="alert">{problem}</p>{/if}

<ul class="rows" bind:this={list} tabindex="-1" aria-label="Your walks, newest first">
	{#each walks as walk (walk.id)}
		{#if sent.has(walk.id)}
			<!-- on its way to the database: nothing is shown -->
		{:else if leaving.has(walk.id)}
			<li class="gone" data-walk={walk.id}>
				<p role="status">
					<span id="gone-{walk.id}">The walk of {name(walk)} is deleted.</span>
					<button class="link-button" type="button" aria-describedby="gone-{walk.id}" onclick={() => undo(walk.id)}>Undo</button>
				</p>
			</li>
		{:else}
			<li data-walk={walk.id}>
				<span class="row-main">{dayName(walk.local_day)}</span>
				<span class="row-sub">
					<span>{clock(walk)}</span>
					<span>{duration(walk.seconds)}</span>
					<span>{distance(walk.distance_m, units)}</span>
					<span>{count(walk.steps)} {walk.steps === 1 ? 'step' : 'steps'}</span>
					{#if walk.kcal > 0}<span>an estimated {kcal(walk.kcal)}</span>{/if}
					<span class="from">{FROM[walk.origin] ?? 'from elsewhere'}</span>
				</span>
				<span class="row-side">
					<button class="icon-button" type="button" aria-label="Delete the walk of {name(walk)}" onclick={() => drop(walk)}>
						<!-- a bin, drawn for this list -->
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
							<path d="M4.5 7h15M9.500 7V5.200c0-.7.500-1.200 1.200-1.200h2.600c.7 0 1.200.5 1.200 1.200V7" />
							<path d="m6.500 7 .8 11.300c.1.900.8 1.700 1.800 1.700h5.800c1 0 1.700-.8 1.800-1.700L17.500 7" />
							<path d="M10.200 11v5.500M13.800 11v5.500" />
						</svg>
					</button>
				</span>
			</li>
		{/if}
	{/each}
</ul>

<style>
	.rows:focus-visible {
		outline-offset: 6px;
	}

	.rows > li {
		/* (the button is 2.75rem tall: the row keeps its height when "Undo" stands in for it) */
		min-height: 4.5rem;
	}

	/* The numbers of a walk, with a small dot between them. They wrap as
	   wholes, and a dot that would begin a line is cut off: every number has
	   its dot in front of it, and the first strip of each line is not drawn. */
	.row-sub {
		display: flex;
		flex-wrap: wrap;
		row-gap: 0.1rem;
		margin-left: -1.2em;
		clip-path: inset(0 0 0 1.2em);
		font-variant-numeric: tabular-nums;
		line-height: 1.5;
	}

	.row-sub > span {
		position: relative;
		padding-left: 1.2em;
		white-space: nowrap;
	}

	.row-sub > span::before {
		content: '\00b7';
		position: absolute;
		left: 0;
		width: 1.2em;
		color: var(--ink-3);
		text-align: center;
	}

	/* where it came from: said quietly, last */
	.from {
		color: var(--ink-3);
		font-style: italic;
	}

	/* On a phone the numbers run under the button, the whole width of the row. */
	@media (max-width: 30rem) {
		.rows > li {
			row-gap: 0;
		}

		.rows .row-main {
			align-self: center;
		}

		.rows .row-side {
			grid-row: 1;
		}

		.rows .row-sub {
			grid-column: 1 / -1;
		}
	}

	.gone p {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		color: var(--ink-2);
		font-size: var(--text-small);
	}

	.gone .link-button {
		min-height: 2.75rem;
		padding-inline: 0.5rem;
		font-weight: 600;
	}
</style>
