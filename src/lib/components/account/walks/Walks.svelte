<script lang="ts">
	// The walks page, for a signed-in person: the totals, the two ways to add
	// walks, and the list. (It stands inside <Gate>, so it is made anew for
	// whoever signs in, and starts with nothing of the person before.)
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import Tabs from '#lib/components/account/Tabs.svelte';
	import { account, say } from '#lib/account/account.svelte.ts';
	import { walksCsv } from '#lib/account/csv.ts';
	import { save } from '#lib/account/export.ts';
	import { count, localDay } from '#lib/account/format.ts';
	import { everyWalk, list, removeMany, totals, type ListedWalk } from '#lib/account/walks.ts';
	import ByHand from './ByHand.svelte';
	import FromFiles from './FromFiles.svelte';
	import Totals from './Totals.svelte';
	import WalkList from './WalkList.svelte';

	const profile = $derived(account.profile);
	const units = $derived(profile?.units ?? 'mi');

	/** Every walk, as few numbers each: what the totals are added up from. Null until they are here. */
	let counted = $state.raw<ListedWalk[] | null>(null);
	/** The walks the list shows: the newest 50, and more when asked for. */
	let shown = $state.raw<ListedWalk[]>([]);
	let more = $state(false);
	let fetchingMore = $state(false);
	let problem = $state('');
	/** Walks deleted on the page whose "Undo" has not run out: not in the totals, not yet gone. */
	const leaving = new SvelteSet<string>();
	/** Walks ticked in the list, to be deleted together. */
	const chosen = new SvelteSet<string>();

	let fromFilesOpen = $state(false);
	let byHandOpen = $state(false);

	const sums = $derived(counted ? totals(counted, leaving) : null);
	const none = $derived(counted !== null && counted.length === 0);

	async function load() {
		problem = '';
		try {
			const [all, first] = await Promise.all([everyWalk(), list()]);
			// an account without walks starts with the way to add them open
			if (counted === null && !all.length) fromFilesOpen = true;
			counted = all;
			shown = first.walks;
			more = first.more;
		} catch (error) {
			problem = say(error);
		}
	}

	async function showMore() {
		const last = shown[shown.length - 1];
		if (!last || fetchingMore) return;
		fetchingMore = true;
		problem = '';
		try {
			const next = await list(last.started_at);
			shown = [...shown, ...next.walks];
			more = next.more;
		} catch (error) {
			problem = say(error);
		}
		fetchingMore = false;
	}

	function gone(id: string) {
		leaving.delete(id);
		chosen.delete(id);
		shown = shown.filter((walk) => walk.id !== id);
		counted = counted?.filter((walk) => walk.id !== id) ?? null;
	}

	onMount(() => void load());

	// ---- many at once ------------------------------------------------------------
	// Deleting many walks has no "Undo": the page says how many, and asks first.
	type Many = 'chosen' | 'walka' | 'all';
	let asking = $state<Many | null>(null);
	let typed = $state('');
	let deleting = $state<{ done: number; of: number } | null>(null);
	let manyProblem = $state('');
	let manyDone = $state('');

	const fromWalka = $derived(counted?.filter((walk) => walk.origin === 'walka' && !leaving.has(walk.id)) ?? []);
	const allLeft = $derived(counted?.filter((walk) => !leaving.has(walk.id)) ?? []);
	const shownIds = $derived(shown.filter((walk) => !leaving.has(walk.id)).map((walk) => walk.id));
	const allShownChosen = $derived(shownIds.length > 0 && shownIds.every((id) => chosen.has(id)));

	function idsFor(many: Many): string[] {
		if (many === 'chosen') return [...chosen].filter((id) => !leaving.has(id));
		return (many === 'walka' ? fromWalka : allLeft).map((walk) => walk.id);
	}

	function ask(many: Many) {
		manyProblem = manyDone = typed = '';
		asking = many;
	}

	async function deleteMany() {
		if (!asking) return;
		const ids = idsFor(asking);
		manyProblem = manyDone = '';
		deleting = { done: 0, of: ids.length };
		try {
			const deleted = await removeMany(ids, (done) => (deleting = { done, of: ids.length }));
			manyDone = deleted === 1 ? 'One walk was deleted.' : `${count(deleted)} walks were deleted.`;
			chosen.clear();
			asking = null;
		} catch (error) {
			manyProblem = `${deleting.done ? `${count(deleting.done)} of the walks were deleted before it stopped. ` : ''}${say(error)}`;
		}
		deleting = null;
		typed = '';
		await load();
	}

	function chooseShown(on: boolean) {
		for (const id of shownIds) on ? chosen.add(id) : chosen.delete(id);
	}

	// ---- a spreadsheet file --------------------------------------------------------
	function download() {
		if (counted) save(`walka-walks-${localDay()}.csv`, walksCsv(allLeft), 'text/csv;charset=utf-8');
	}

	const publicLink = $derived(profile?.handle ? `${resolve('u/')}?name=${profile.handle}` : '');
	/** What a public page shows on top of the name and the totals, as the switches stand. */
	const extras = $derived(
		[profile?.show_days && 'since when you walk and the last twelve weeks day by day', profile?.show_steps && 'your steps', profile?.show_walks && 'your last 20 walks one by one'].filter(
			(extra): extra is string => Boolean(extra)
		)
	);
	const inWords = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? ''));
</script>

<section class="app">
	<div class="container">
		<header class="app-head">
			<p class="label">Your account</p>
			<h1>Your walks</h1>
			<p class="lede">
				The walks kept in your account: those Walka sent, if you switched sending on in Walka, and those you added here.
			</p>
		</header>

		<Tabs current="walks" />

		{#if problem}
			<div class="notice notice--bad" role="alert">
				<p>{problem}</p>
				<p><button class="link-button" type="button" onclick={load}>Try again</button></p>
			</div>
		{/if}

		{#if none}
			<div class="panel panel--quiet">
				<header>
					<h2>No walks here yet</h2>
					<p>
						Walks get here in two ways. Walka sends them, once you sign in to this account in Walka (<em>Settings → Walka
						account</em>) and switch sending on - it asks first. Or you add them here: from the files Walka keeps, or by
						hand. Without that switch, Walka sends nothing.
					</p>
				</header>
			</div>
		{:else}
			<div class="in-all">
				<Totals {sums} {units} />
				<p class="estimate">
					{#if !profile?.is_public}
						Only you see these numbers: your page is private. You can make it public, and choose what it shows, on
						<a href={resolve('account/')}>your account page</a>.
					{:else}
						Your page is public: anyone who knows or guesses its name sees the name you show and, in all, how many walks, how
						long and how far. {extras.length ? `It also shows ${inWords(extras)}.` : 'Nothing more is switched on.'} Calories are
						never on it.
						{#if publicLink}<a href={publicLink}>See it as others do</a>, or change{:else}Change{/if} what it shows on
						<a href={resolve('account/')}>your account page</a>.
					{/if}
				</p>
			</div>
		{/if}

		{#if !none && counted}
			<p class="to-stats">
				Charts, records and habits: <a href={resolve('account/stats/')}>your stats</a>. Your walks as a spreadsheet:
				<button class="link-button" type="button" onclick={download}>download them (CSV)</button>.
			</p>
		{/if}

		<FromFiles bind:open={fromFilesOpen} onadded={load} />
		<ByHand bind:open={byHandOpen} {units} onadded={load} />

		{#if !none}
			<div class="panel" aria-busy={counted === null}>
				<header>
					<h2>Walk by walk</h2>
					<p>{counted === null ? 'One moment.' : sums && sums.all.walks > shown.length ? `Newest first. The newest ${count(shown.length)} of ${count(sums.all.walks)}.` : 'Newest first.'}</p>
				</header>

				<div class="choose-bar" class:on={chosen.size > 0}>
					<label class="choose-all">
						<input type="checkbox" checked={allShownChosen} onchange={(event) => chooseShown(event.currentTarget.checked)} />
						<span>Choose all {count(shownIds.length)} shown</span>
					</label>
					{#if chosen.size}
						<span class="chosen-count" role="status">{chosen.size === 1 ? 'One walk' : `${count(chosen.size)} walks`} chosen</span>
						<button class="plain-button plain-button--danger" type="button" onclick={() => ask('chosen')}>Delete chosen...</button>
						<button class="link-button" type="button" onclick={() => chosen.clear()}>Clear</button>
					{/if}
				</div>
				{#if asking === 'chosen'}
					{@render confirm('chosen')}
				{/if}

				<WalkList walks={shown} {units} {leaving} {chosen} ongone={gone} />

				{#if more}
					<div class="panel-foot">
						<button class="plain-button" type="button" onclick={showMore} disabled={fetchingMore}>{fetchingMore ? 'Fetching...' : 'Show more walks'}</button>
					</div>
				{/if}
				<p class="estimate">
					Deleting a walk here does not touch Walka on your computer, and Walka does not send it again. A deleted walk stays
					deleted: it cannot be added again from the same file.
				</p>
			</div>

			<div class="panel">
				<header>
					<h2>Delete many at once</h2>
					<p>
						Deleted walks are gone from your account, your stats and your public page. Walka on your computer is not
						touched, and does not send them again - with sending on, only walks recorded after this go.
					</p>
				</header>
				{#if manyDone}<p class="notice notice--ok" role="status">{manyDone}</p>{/if}
				<div class="panel-foot">
					<button class="plain-button plain-button--danger" type="button" onclick={() => ask('walka')} disabled={!fromWalka.length || !!deleting}>
						Delete every walk Walka sent ({count(fromWalka.length)})...
					</button>
					<button class="plain-button plain-button--danger" type="button" onclick={() => ask('all')} disabled={!allLeft.length || !!deleting}>
						Delete every walk ({count(allLeft.length)})...
					</button>
				</div>
				{#if asking === 'walka' || asking === 'all'}
					{@render confirm(asking)}
				{/if}
			</div>
		{/if}

		{#snippet confirm(many: Many)}
			{@const how = idsFor(many).length}
			<form
				class="fields confirm"
				onsubmit={(event) => {
					event.preventDefault();
					void deleteMany();
				}}
			>
				<p class="notice notice--bad">
					{#if many === 'chosen'}
						Delete {how === 1 ? 'this walk' : `these ${count(how)} walks`}?
					{:else if many === 'walka'}
						Delete all {count(how)} walks that Walka sent to this account?
					{:else}
						Delete all {count(how)} walks in this account, whichever way they came?
					{/if}
					There is no undo. Walka will not send {how === 1 ? 'it' : 'them'} again, and the same files cannot add {how === 1
						? 'it'
						: 'them'} again. The walks on your computer are not touched.
				</p>
				{#if many !== 'chosen'}
					<div class="field">
						<label for="confirm-many">Type <strong>delete</strong> to go on</label>
						<input id="confirm-many" type="text" autocomplete="off" autocapitalize="none" bind:value={typed} />
					</div>
				{/if}
				{#if manyProblem}<p class="notice notice--bad" role="alert">{manyProblem}</p>{/if}
				<div class="panel-foot">
					<button
						class="plain-button plain-button--danger"
						type="submit"
						disabled={!!deleting || !how || (many !== 'chosen' && typed.trim().toLowerCase() !== 'delete')}
					>
						{deleting ? `Deleting... ${count(deleting.done)} of ${count(deleting.of)}` : how === 1 ? 'Delete it' : `Delete ${count(how)} walks`}
					</button>
					<button class="link-button" type="button" onclick={() => ((asking = null), (typed = ''))} disabled={!!deleting}>Keep them</button>
				</div>
			</form>
		{/snippet}

		{#if none}
			<p class="estimate">
				{#if profile?.is_public}
					Your page is public: it shows the name you chose, and no walks yet.
					{#if publicLink}<a href={publicLink}>See it as others do</a>, or change{:else}Change{/if} what it shows on
					<a href={resolve('account/')}>your account page</a>.
				{:else}
					Your page is private: what you add is seen by you alone, until you say otherwise on
					<a href={resolve('account/')}>your account page</a>.
				{/if}
			</p>
		{/if}
	</div>
</section>

<style>
	.in-all {
		display: grid;
		gap: 0.75rem;
	}

	.notice p + p {
		margin-top: 0.35rem;
	}

	.to-stats {
		color: var(--ink-2);
		font-size: var(--text-small);
	}

	/* the line above the list: choose all, how many are chosen, and what to do with them */
	.choose-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
		min-height: 2.75rem;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid var(--line);
		font-size: var(--text-small);
	}

	.choose-all {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-right: auto;
		color: var(--ink-2);
		cursor: pointer;
	}

	.choose-all input {
		width: 1.2rem;
		height: 1.2rem;
		margin: 0;
		accent-color: var(--accent);
	}

	.chosen-count {
		color: var(--ink);
		font-weight: 600;
	}

	.confirm {
		gap: 0.9rem;
	}
</style>
