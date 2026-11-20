<script lang="ts">
	// What an account page shows before its own content: that the site has
	// no accounts yet, that the database does not answer, the way to sign
	// in, or the first step of a new account. Only then the page itself.
	//
	//   <Gate>...the page, for a signed-in person...</Gate>
	//   <Gate open>...a page anyone may see (a public profile)...</Gate>
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { account } from '#lib/account/account.svelte.ts';
	import SignIn from './SignIn.svelte';
	import Welcome from './Welcome.svelte';

	let { children, open = false }: { children: Snippet; /** No need to be signed in. */ open?: boolean } = $props();

	let trying = $state(false);
	async function retry() {
		trying = true;
		await account.retry();
		trying = false;
	}
</script>

{#if account.where === 'off'}
	<section class="app">
		<div class="container">
			<header class="app-head">
				<p class="label">Later</p>
				<h1>Accounts are not open yet</h1>
				<p class="lede">
					Walka's website will have accounts: to share your walking progress, and to keep a food diary next to your
					walks. They will be opt-in. Walka itself works without one, and uploads nothing.
				</p>
			</header>
			<p><a class="plain-button" href={resolve('/')}>Back to the front page</a></p>
		</div>
	</section>
{:else if account.where === 'starting'}
	<section class="app" aria-busy="true">
		<div class="container">
			<header class="app-head">
				<p class="label">Your account</p>
				<h1>One moment</h1>
				<p class="lede">Asking the database.</p>
				<noscript><p class="notice">The account pages need scripts, and they are switched off in this browser. The rest of the site works without them.</p></noscript>
			</header>
		</div>
	</section>
{:else if account.where === 'unavailable'}
	<section class="app">
		<div class="container">
			<header class="app-head">
				<p class="label">Your account</p>
				<h1>Accounts are temporarily unavailable</h1>
				<p class="lede">
					The database that keeps the accounts does not answer right now. Nothing is lost. The rest of the site works as
					usual, and so does Walka.
				</p>
			</header>
			<p class="panel-foot">
				<button class="plain-button" type="button" onclick={retry} disabled={trying}>{trying ? 'Asking...' : 'Try again'}</button>
				<a href={resolve('/')}>Back to the front page</a>
			</p>
		</div>
	</section>
{:else if open}
	{@render children()}
{:else if account.where === 'out'}
	<SignIn />
{:else if !account.asked}
	<section class="app" aria-busy="true">
		<div class="container">
			<header class="app-head">
				<p class="label">Your account</p>
				<h1>One moment</h1>
			</header>
		</div>
	</section>
{:else if !account.profile?.adult_confirmed_at}
	<Welcome />
{:else}
	{@render children()}
{/if}
