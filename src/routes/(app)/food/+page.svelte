<script lang="ts">
	// The food diary: what a signed-in person eats, next to what they walk.
	// A page of the account - and, put on a phone's home screen, an app of
	// its own that opens without a connection.
	//
	// What is shown, in this order:
	//   1. If this device already holds the diary of the person who is signed
	//      in here, the diary - at once, from the device's copy, whether the
	//      database has answered yet or not. (<Gate> cannot do that: it shows
	//      nothing until the database has answered.)
	//   2. Otherwise what every account page shows first (<Gate>): not open
	//      yet, no answer, the way to sign in, the first step.
	//   3. For a signed-in person who has not agreed to food data being
	//      kept: that question, and nothing else. Nothing of the diary is
	//      kept on the device or sent before the yes.
	//   4. The diary.
	import { untrack } from 'svelte';
	import { dev } from '$app/env';
	import Gate from '#lib/components/account/Gate.svelte';
	import Tabs from '#lib/components/account/Tabs.svelte';
	import Consent from '#lib/components/food/Consent.svelte';
	import Diary from '#lib/components/food/Diary.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { account } from '#lib/account/account.svelte.ts';
	import { ACCOUNTS } from '#lib/account/config.ts';
	import { atHome, diary } from '#lib/food/store.svelte.ts';

	/** wait: looking whether the device holds a diary. device: it does, and it is shown. gate: the account decides. */
	let mode = $state<'wait' | 'device' | 'gate'>('wait');

	const agreed = $derived(Boolean(account.profile?.body_food_consent_at));

	$effect(() => {
		if (mode !== 'wait') return;
		if (!ACCOUNTS.on) {
			mode = 'gate';
			return;
		}
		void atHome()
			.then(async (person) => {
				if (person) await diary.open(person);
				if (mode === 'wait') mode = person && diary.ready ? 'device' : 'gate';
			})
			.catch(() => (mode = 'gate'));
	});

	// What the account says, once it has said it.
	$effect(() => {
		if (mode === 'wait') return;
		const where = account.where;
		const person = account.userId;
		const may = Boolean(person && account.profile?.adult_confirmed_at && agreed);
		if (where !== 'out' && (where !== 'in' || !account.asked)) return;
		// (what follows reads and writes the diary's own state: none of it is a reason to run this again)
		untrack(() => {
			if (where === 'out' || !person || !may) {
				// Signed out, or no agreement (or it was taken back, here or on
				// another device): nothing of the diary stays on this device.
				mode = 'gate';
				void diary.forget();
				return;
			}
			// (a copy that is somebody else's is emptied before this person's is read)
			void diary
				.open(person)
				.then(() => diary.connect())
				.catch(() => {});
		});
	});

	// The database said that the agreement is gone (taken back on another device): ask the account again.
	$effect(() => {
		if (diary.consentGone) void account.loadProfile().catch(() => {});
	});

	// When the connection comes back, the account is asked again - it gave up while there was none.
	// And when the page is looked at again, it is asked whether the agreement still stands.
	$effect(() => {
		const again = () => {
			if (account.where === 'unavailable') void account.retry();
		};
		const shown = () => {
			if (document.visibilityState !== 'visible') return;
			again();
			// Looked at again after a while in the background: the agreement may
			// have been taken back meanwhile, in another tab or on another device.
			if (account.where === 'in' && account.asked) void account.loadProfile().catch(() => {});
		};
		window.addEventListener('online', again);
		document.addEventListener('visibilitychange', shown);
		return () => {
			window.removeEventListener('online', again);
			document.removeEventListener('visibilitychange', shown);
		};
	});

	// The diary opens without a connection: a service worker keeps the files
	// it needs (src/service-worker.ts). It is started here and nowhere else,
	// once there is a diary to open, and only for this page's own folder -
	// the public pages are never answered from a cache of ours.
	let started = false;
	$effect(() => {
		if (!diary.ready || started || dev || !ACCOUNTS.on || !('serviceWorker' in navigator)) return;
		started = true;
		const folder = new URL('./', location.href);
		void navigator.serviceWorker.register(new URL('../service-worker.js', folder), { scope: folder.href }).catch(() => {
			// no worker: the diary works, with a connection
		});
	});
</script>

<Seo title="Food diary" description="Your food diary, next to your walks. Estimates, not advice." />

{#if mode === 'device' && diary.ready}
	<Diary />
{:else}
	<Gate>
		{#if !agreed}
			<section class="app food-first">
				<div class="container">
					<header class="app-head">
						<p class="label">Your account</p>
						<h1>Food diary</h1>
						<p class="lede">What you eat, next to what you walk. Estimates, for interest only.</p>
					</header>
					<Tabs current="food" />
					<Consent />
				</div>
			</section>
		{:else if diary.ready}
			<Diary />
		{:else}
			<section class="app" aria-busy="true">
				<div class="container">
					<header class="app-head">
						<p class="label">Your account</p>
						<h1>Food diary</h1>
						<p class="lede">One moment.</p>
					</header>
				</div>
			</section>
		{/if}
	</Gate>
{/if}

<style>
	.food-first > .container {
		max-width: calc(34rem + 2 * var(--gutter));
	}
</style>
