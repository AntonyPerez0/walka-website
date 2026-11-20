<script lang="ts">
	// Before the diary: the question whether it may be kept at all. What a
	// person eats and weighs is information about their health, and the
	// database keeps it only after a yes. Until then nothing of it is kept on
	// this device either, and nothing is sent.
	import { resolve } from '$app/paths';
	import { account, say } from '#lib/account/account.svelte.ts';

	let agreed = $state(false);
	let busy = $state(false);
	let problem = $state('');

	async function agree(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		problem = '';
		try {
			await account.agree();
		} catch (error) {
			problem = say(error);
		}
		busy = false;
	}
</script>

<form class="panel" onsubmit={agree}>
	<header>
		<h2>Before the diary starts</h2>
		<p>
			The diary keeps what you write down about your food, and makes its estimates from your weight and height. Before any of
			that is kept, the choice is yours.
		</p>
	</header>
	<label class="tick">
		<input type="checkbox" bind:checked={agreed} required />
		<span>
			Keep my body numbers and my food diary in my account. This is information about my health. No visitor and no other walker can see it. The site's owner, who runs the database, can: the privacy page says when. I can take
			this back on the account page at any time, and then all of it is deleted at once.
		</span>
	</label>
	{#if problem}<p class="notice notice--bad" role="alert">{problem}</p>{/if}
	<div class="panel-foot">
		<button class="button" type="submit" disabled={busy || !agreed}>I agree</button>
	</div>
	<p class="estimate">
		Nothing is kept on this device or sent before that. The <a href={resolve('privacy/')}>privacy page</a> says what is kept after
		it, and your body numbers are entered on the <a href={resolve('account/')}>account page</a>.
	</p>
</form>
