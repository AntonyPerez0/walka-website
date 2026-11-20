<script lang="ts">
	// Signing in. No password: a six-digit code by e-mail, or one of the
	// other sites the project has switched on (Discord, Google, GitHub).
	import { resolve } from '$app/paths';
	import { account, say } from '#lib/account/account.svelte.ts';
	import { ACCOUNTS, WAY_NAMES, type Way } from '#lib/account/config.ts';

	const others = ACCOUNTS.ways.filter((way): way is Exclude<Way, 'email'> => way !== 'email');
	const byEmail = ACCOUNTS.ways.includes('email');

	let email = $state('');
	let code = $state('');
	let sent = $state(false);
	let busy = $state(false);
	let problem = $state('');

	async function send(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		problem = '';
		try {
			await account.sendCode(email.trim());
			sent = true;
		} catch (error) {
			problem = say(error);
		}
		busy = false;
	}

	async function enter(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		problem = '';
		try {
			await account.useCode(email.trim(), code);
		} catch (error) {
			problem = say(error);
		}
		busy = false;
	}

	async function leaveFor(way: Exclude<Way, 'email'>) {
		problem = '';
		try {
			await account.signInWith(way);
		} catch (error) {
			problem = say(error);
		}
	}
</script>

<section class="app">
	<div class="container">
		<header class="app-head">
			<p class="label">Your account</p>
			<h1>Sign in</h1>
			<p class="lede">
				An account is for sharing your walking progress and for the food diary. Walka itself needs none. New here? Signing
				in makes your account.
			</p>
		</header>

		{#if byEmail}
			<div class="panel">
				{#if !sent}
					<form class="fields" onsubmit={send}>
						<div class="field">
							<label for="sign-in-email">Your e-mail address</label>
							<input id="sign-in-email" type="email" autocomplete="email" inputmode="email" required bind:value={email} />
							<p class="hint">No password. We send a six-digit code to this address, and you type it in here.</p>
						</div>
						<div class="panel-foot">
							<button class="button" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send me a code'}</button>
						</div>
					</form>
				{:else}
					<form class="fields" onsubmit={enter}>
						<div class="field">
							<label for="sign-in-code">The code from the e-mail</label>
							<input
								id="sign-in-code"
								class="code-input"
								type="text"
								inputmode="numeric"
								autocomplete="one-time-code"
								pattern="[0-9 ]*"
								maxlength="8"
								required
								bind:value={code}
							/>
							<p class="hint">Sent to {email}. It can take a minute, and it works for 15 minutes.</p>
						</div>
						<div class="panel-foot">
							<button class="button" type="submit" disabled={busy}>{busy ? 'Checking...' : 'Sign in'}</button>
							<button class="link-button" type="button" onclick={() => ((sent = false), (code = ''), (problem = ''))}>Another address, or a new code</button>
						</div>
					</form>
				{/if}
			</div>
		{/if}

		{#if others.length}
			<div class="panel">
				<header>
					<h2>{byEmail ? 'Or sign in with' : 'Sign in with'}</h2>
					<p>You go to that site, say yes there, and come back signed in. Walka's website gets your e-mail address from it, and nothing else is kept.</p>
				</header>
				<div class="panel-foot">
					{#each others as way (way)}
						<button class="plain-button" type="button" onclick={() => leaveFor(way)}>{WAY_NAMES[way]}</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if problem}<p class="notice notice--bad" role="alert">{problem}</p>{/if}

		<p class="estimate">
			What an account keeps, who can see it, and how to take it out or delete it is on the
			<a href={resolve('privacy/')}>privacy page</a>. The rules are in the <a href={resolve('terms/')}>terms</a>.
		</p>
	</div>
</section>
