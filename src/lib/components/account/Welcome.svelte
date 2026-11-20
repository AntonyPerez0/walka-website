<script lang="ts">
	// The first step of a new account. Until it is taken, nothing is kept
	// for the person but the sign-in itself.
	import { resolve } from '$app/paths';
	import { account, say } from '#lib/account/account.svelte.ts';

	let adult = $state(false);
	let busy = $state(false);
	let problem = $state('');

	async function begin(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		problem = '';
		try {
			await account.begin();
		} catch (error) {
			problem = say(error);
		}
		busy = false;
	}

	async function leave() {
		busy = true;
		try {
			await account.remove();
		} catch (error) {
			problem = say(error);
		}
		busy = false;
	}
</script>

<section class="app">
	<div class="container">
		<header class="app-head">
			<p class="label">Your account</p>
			<h1>Before you start</h1>
			<p class="lede">You are signed in{account.email ? ` as ${account.email}` : ''}. One thing first.</p>
		</header>

		<form class="panel" onsubmit={begin}>
			<ul class="plain">
				<li><strong>Private until you say otherwise.</strong> Nothing in your account is shown to anyone until you switch your page to public.</li>
				<li><strong>Yours to take and to delete.</strong> You can save everything as a file, and delete the account with everything in it, at any time.</li>
				<li><strong>Estimates, not advice.</strong> Calorie figures here are estimates, for interest only. They are not medical advice.</li>
			</ul>
			<label class="tick">
				<input type="checkbox" bind:checked={adult} required />
				<span>I am 18 or older, and I have read the <a href={resolve('terms/')}>terms</a> and the <a href={resolve('privacy/')}>privacy page</a>.</span>
			</label>
			{#if problem}<p class="notice notice--bad" role="alert">{problem}</p>{/if}
			<div class="panel-foot">
				<button class="button" type="submit" disabled={busy || !adult}>Open my account</button>
				<button class="link-button" type="button" onclick={leave} disabled={busy}>No thanks: delete this sign-in</button>
			</div>
		</form>
	</div>
</section>

<style>
	.plain {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
		list-style: none;
	}

	.plain strong {
		color: var(--ink);
	}
</style>
