<script lang="ts">
	// The walks page, for a signed-in person: the totals, the two ways to add
	// walks, and the list. (It stands inside <Gate>, so it is made anew for
	// whoever signs in, and starts with nothing of the person before.)
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import Tabs from '#lib/components/account/Tabs.svelte';
	import { account, say } from '#lib/account/account.svelte.ts';
	import { count } from '#lib/account/format.ts';
	import { everyWalk, list, totals, type Counted, type ListedWalk } from '#lib/account/walks.ts';
	import ByHand from './ByHand.svelte';
	import FromFiles from './FromFiles.svelte';
	import Totals from './Totals.svelte';
	import WalkList from './WalkList.svelte';

	const profile = $derived(account.profile);
	const units = $derived(profile?.units ?? 'mi');

	/** Every walk, as few numbers each: what the totals are added up from. Null until they are here. */
	let counted = $state.raw<Counted[] | null>(null);
	/** The walks the list shows: the newest 50, and more when asked for. */
	let shown = $state.raw<ListedWalk[]>([]);
	let more = $state(false);
	let fetchingMore = $state(false);
	let problem = $state('');
	/** Walks deleted on the page whose "Undo" has not run out: not in the totals, not yet gone. */
	const leaving = new SvelteSet<string>();

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
		shown = shown.filter((walk) => walk.id !== id);
		counted = counted?.filter((walk) => walk.id !== id) ?? null;
	}

	onMount(() => void load());

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
			<p class="lede">The walks kept in your account. Walka on your computer uploads nothing: they are here because you added them.</p>
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
						Walka on your computer uploads nothing. Walks get here only when you add them: from the files Walka keeps, or by
						hand. One day the desktop program will be able to send them itself, if you switch that on.
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

		<FromFiles bind:open={fromFilesOpen} onadded={load} />
		<ByHand bind:open={byHandOpen} {units} onadded={load} />

		{#if !none}
			<div class="panel" aria-busy={counted === null}>
				<header>
					<h2>Walk by walk</h2>
					<p>{counted === null ? 'One moment.' : sums && sums.all.walks > shown.length ? `Newest first. The newest ${count(shown.length)} of ${count(sums.all.walks)}.` : 'Newest first.'}</p>
				</header>

				<WalkList walks={shown} {units} {leaving} ongone={gone} />

				{#if more}
					<div class="panel-foot">
						<button class="plain-button" type="button" onclick={showMore} disabled={fetchingMore}>{fetchingMore ? 'Fetching...' : 'Show more walks'}</button>
					</div>
				{/if}
				<p class="estimate">
					Deleting a walk here does not touch Walka on your computer. A deleted walk stays deleted: it cannot be added again
					from the same file.
				</p>
			</div>
		{/if}

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
</style>
