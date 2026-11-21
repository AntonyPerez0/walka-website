<script lang="ts">
	// Adding walks from files: Walka's own, or TCX. The files are read here,
	// in the browser (src/lib/account/import.ts); the page then says how many
	// walks it found and how many of them are new, and nothing is added
	// until the person has seen that and pressed the button.
	import { say } from '#lib/account/account.svelte.ts';
	import { count, dayName } from '#lib/account/format.ts';
	import { readFile } from '#lib/account/import.ts';
	import type { NewWalk } from '#lib/account/types.ts';
	import { addMany, alreadyHere, startSecond, type Added } from '#lib/account/walks.ts';
	import Fold from './Fold.svelte';

	let { open = $bindable(false), onadded }: { open?: boolean; /** walks were added: the page fetches its list again */ onadded: () => void } = $props();

	/** A walk's file is small: a day on the belt, second by second, is well under this. */
	const TOO_LARGE = 30_000_000;

	type LeftOut = { file: string; why: string };
	type Found = {
		/** the walks in the files, each once, oldest first */
		walks: NewWalk[];
		leftOut: LeftOut[];
		/** which of them the account does not have yet; null until the database has said */
		fresh: NewWalk[] | null;
		/** how many of the others were deleted here before (they stay deleted) */
		deleted: number;
	};

	let busy = $state<'' | 'reading' | 'asking' | 'adding'>('');
	let progress = $state('');
	let found = $state.raw<Found | null>(null);
	let result = $state.raw<Added | null>(null);
	let problem = $state('');
	let over = $state(false);
	let input = $state<HTMLInputElement>();

	const walksWord = (n: number) => `${count(n)} ${n === 1 ? 'walk' : 'walks'}`;

	async function take(files: File[]) {
		if (!files.length || busy) return;
		busy = 'reading';
		problem = '';
		found = result = null;
		const walks: NewWalk[] = [];
		const leftOut: LeftOut[] = [];
		for (const [index, file] of files.entries()) {
			progress = `Reading file ${count(index + 1)} of ${count(files.length)}.`;
			if (file.size > TOO_LARGE) {
				leftOut.push({ file: file.name, why: 'This file is too large to be a walk.' });
				continue;
			}
			try {
				const read = readFile(file.name, await file.text());
				walks.push(...read.walks);
				leftOut.push(...read.refused);
			} catch {
				leftOut.push({ file: file.name, why: 'This file could not be read.' });
			}
		}
		// the same files can be chosen again (a browser says nothing when the choice has not changed)
		if (input) input.value = '';

		// One walk is one start second. A walk that is in two of the files -
		// Walka's own, and its TCX export - is read once, from Walka's own,
		// which says more about it.
		const once = new Map<number, NewWalk>();
		for (const walk of walks.sort((a, b) => Number(b.origin === 'walka') - Number(a.origin === 'walka')))
			if (!once.has(startSecond(walk))) once.set(startSecond(walk), walk);
		found = { walks: [...once.values()].sort((a, b) => startSecond(a) - startSecond(b)), leftOut, fresh: null, deleted: 0 };
		await ask();
	}

	/** Which of the walks read are new to the account? */
	async function ask() {
		if (!found) return;
		busy = 'asking';
		problem = '';
		progress = 'Asking which of them are new.';
		try {
			const { here, deleted } = await alreadyHere(found.walks);
			found = { ...found, fresh: found.walks.filter((walk) => !here.has(startSecond(walk))), deleted: deleted.size };
		} catch (error) {
			problem = say(error);
		}
		busy = '';
	}

	async function add() {
		if (!found?.fresh?.length || busy) return;
		busy = 'adding';
		problem = '';
		progress = `Adding ${walksWord(found.fresh.length)}.`;
		try {
			result = await addMany(found.fresh);
			found = null;
			if (result.added) onadded();
		} catch (error) {
			problem = say(error);
		}
		busy = '';
	}

	function forget() {
		found = result = null;
		problem = '';
	}

	function dropped(event: DragEvent) {
		event.preventDefault();
		over = false;
		void take([...(event.dataTransfer?.files ?? [])]);
	}

	const span = $derived.by(() => {
		if (!found?.walks.length) return '';
		const first = found.walks[0].local_day;
		const last = found.walks[found.walks.length - 1].local_day;
		return first === last ? `On ${dayName(first)}.` : `From ${dayName(first)} to ${dayName(last)}.`;
	});

	/** "9 new, 3 were already here." */
	const news = $derived.by(() => {
		if (!found?.fresh) return '';
		const all = found.walks.length;
		const fresh = found.fresh.length;
		const here = all - fresh;
		if (all === 1) return fresh ? 'It is new.' : 'It was already here.';
		if (!here) return 'All of them are new.';
		if (!fresh) return 'All of them were already here.';
		return `${count(fresh)} new, ${count(here)} ${here === 1 ? 'was' : 'were'} already here.`;
	});
</script>

{#snippet list(items: LeftOut[])}
	<ul class="left-out">
		{#each items as item, i (i)}
			<li><span class="file">{item.file}</span> {item.why}</li>
		{/each}
	</ul>
{/snippet}

{#snippet leftOutList(items: LeftOut[], lead: string)}
	{#if items.length > 4}
		<details class="more-left-out">
			<summary>{lead}</summary>
			{@render list(items)}
		</details>
	{:else if items.length}
		<p class="left-out-lead">{lead}</p>
		{@render list(items)}
	{/if}
{/snippet}

<Fold title="Add walks from Walka" bind:open>
	<p>
		Walka keeps every finished walk as a file on your computer: in <code>%APPDATA%\Walka\sessions</code> on Windows, in
		<code>~/Library/Application Support/Walka/sessions</code> on a Mac.
	</p>
	<p>
		The files are read here, in your browser, and only each walk's numbers are sent to your account: when it started and
		ended, the day and the time zone your computer was in, how long the belt moved, how far, steps and calories, how
		each number was come by (for the calories: from your speed, or from your heart rate), and whether a walking session
		was running in the game. The second-by-second samples, the
		heart rate, the top speed, the treadmill's name and your character stay on your computer.
	</p>

	<div
		class="drop"
		class:over
		role="group"
		aria-label="Files of walks"
		ondragenter={(event) => (event.preventDefault(), (over = true))}
		ondragover={(event) => (event.preventDefault(), (over = true))}
		ondragleave={() => (over = false)}
		ondrop={dropped}
	>
		<input
			bind:this={input}
			id="walk-files"
			class="visually-hidden"
			type="file"
			multiple
			accept=".json,.tcx,application/json,application/vnd.garmin.tcx+xml"
			disabled={Boolean(busy)}
			aria-describedby="walk-files-hint"
			onchange={(event) => take([...(event.currentTarget.files ?? [])])}
		/>
		<label class="plain-button" class:busy={Boolean(busy)} for="walk-files">Choose files</label>
		<span class="drop-here">or drop them here</span>
	</div>
	<p class="estimate" id="walk-files-hint">
		Files ending in .json from that folder, or .tcx files: Walka's "Download TCX", or another program's export. You can
		choose many at once. To get to the folder, paste its path into the file window (on a Mac, press Cmd+Shift+G there
		first).
	</p>

	{#if busy}
		<p class="estimate" role="status">{progress}</p>
	{/if}

	{#if found && !busy}
		<div class="found">
			<div role="status">
				{#if found.walks.length}
					<p class="count">
						<strong>{walksWord(found.walks.length)} read.</strong>
						{news}
					</p>
					<p class="estimate">
						{span}
						{#if found.deleted}
							{found.deleted === 1 ? 'One of them was' : `${count(found.deleted)} of them were`} deleted here before: a deleted
							walk stays deleted, and is not added again.
						{/if}
					</p>
				{:else}
					<p class="count"><strong>No walk was read.</strong></p>
				{/if}
			</div>
			{@render leftOutList(found.leftOut, found.leftOut.length > 4 ? `Left out: ${count(found.leftOut.length)}. Show which, and why` : 'Left out, and why:')}
			{#if found.fresh?.length}
				<div class="panel-foot">
					<button class="button button--small" type="button" onclick={add}>Add {walksWord(found.fresh.length)}</button>
					<button class="link-button" type="button" onclick={forget}>Not now</button>
				</div>
			{:else if !found.fresh}
				<div class="panel-foot">
					<button class="plain-button" type="button" onclick={ask}>Ask again</button>
					<button class="link-button" type="button" onclick={forget}>Not now</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if result && !busy}
		<div class="found">
			<p class="notice notice--ok" role="status">
				{#if result.added}{walksWord(result.added)} added.{:else}No walk was added.{/if}
				{#if result.here}{count(result.here)} {result.here === 1 ? 'was' : 'were'} already here.{/if}
			</p>
			{#if result.stopped}
				<p class="notice notice--bad" role="alert">
					{result.stopped}
					{walksWord(result.unsent)}
					{result.unsent === 1 ? 'was' : 'were'} not sent. Choose the same files again: what is already here is not added twice.
				</p>
			{/if}
			{#if result.refused.length}
				<div role="alert">
					{@render leftOutList(
						result.refused.map(({ walk, why }) => ({ file: `The walk of ${dayName(walk.local_day)}.`, why })),
						`The database did not take ${walksWord(result.refused.length)}${result.refused.length > 4 ? '. Show which, and why' : ':'}`
					)}
				</div>
			{/if}
		</div>
	{/if}

	{#if problem}<p class="notice notice--bad" role="alert">{problem}</p>{/if}
</Fold>

<style>
	code {
		white-space: nowrap;
	}

	.drop {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
	}

	/* the picker is a real file input, out of sight: its label is the button, and shows where the keyboard is */
	.drop input:focus-visible + label {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	label.plain-button {
		cursor: pointer;
	}

	.drop-here {
		display: none;
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	/* On a wide screen with a mouse, files can be dropped: the picker stands in a field for them. */
	@media (min-width: 48rem) and (hover: hover) {
		.drop {
			justify-content: center;
			padding: 1.75rem 1.25rem;
			border: 1px dashed var(--line-strong);
			border-radius: var(--radius);
			transition:
				border-color 0.2s,
				background 0.2s;
		}

		.drop.over {
			border-color: var(--accent);
			background: var(--note-tint);
		}

		.drop-here {
			display: inline;
		}
	}

	.found {
		display: grid;
		gap: 0.85rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--line);
	}

	.count {
		color: var(--ink-2);
		font-size: var(--text-body);
	}

	.left-out-lead,
	.more-left-out summary {
		color: var(--ink);
		font-size: var(--text-small);
		font-weight: 600;
	}

	.more-left-out summary {
		min-height: 2.75rem;
		align-content: center;
		cursor: pointer;
	}

	.left-out {
		display: grid;
		gap: 0.4rem;
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.left-out .file {
		color: var(--ink);
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	@media (max-width: 30rem) {
		/* a long path breaks where it must, rather than widening the page */
		code {
			white-space: normal;
		}
	}
</style>
