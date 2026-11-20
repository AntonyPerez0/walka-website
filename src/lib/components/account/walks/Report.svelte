<script lang="ts">
	// "Report this page": a signed-in reader tells the site's owner about a
	// public page (a name that pretends to be somebody, an offensive name).
	// A reader who is not signed in is sent to sign in first: a report
	// belongs to an account, so that nobody can send them by the thousand.
	import { tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { account, say } from '#lib/account/account.svelte.ts';
	import { REPORT_REASONS, report, type ReportReason } from '#lib/account/walks.ts';

	let { handle }: { /** the page's name, as the database gave it */ handle: string } = $props();

	const REASONS: Record<ReportReason, string> = {
		'pretends to be somebody': 'It pretends to be somebody',
		'an offensive name': 'Its name is offensive',
		'something else': 'Something else'
	};

	let open = $state(false);
	let why = $state<ReportReason>('pretends to be somebody');
	let note = $state('');
	let busy = $state(false);
	let problem = $state('');
	let sent = $state(false);
	let form = $state<HTMLFormElement>();
	let opener = $state<HTMLButtonElement>();

	async function start() {
		open = true;
		await tick();
		form?.querySelector<HTMLElement>('input')?.focus();
	}

	async function close() {
		open = false;
		problem = '';
		await tick();
		opener?.focus();
	}

	async function send(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		problem = '';
		try {
			await report(handle, why, note);
			sent = true;
			open = false;
		} catch (error) {
			problem = say(error);
		}
		busy = false;
	}
</script>

{#if sent}
	<p class="estimate" role="status">Thank you. The site's owner will look at it.</p>
{:else if account.where !== 'in'}
	<p class="estimate">Something wrong with this page? <a href={resolve('account/')}>Report this page</a>: for that you sign in first.</p>
{:else if !open}
	<p class="estimate">Something wrong with this page? <button class="link-button" type="button" bind:this={opener} onclick={start}>Report this page</button></p>
{:else}
	<form class="panel" onsubmit={send} bind:this={form}>
		<header>
			<h2>Report this page</h2>
			<p>
				The report goes to the site's owner, with your account as its sender. The owner of the page <span class="handle">{handle}</span> is not
				told who sent it.
			</p>
		</header>
		<fieldset class="fields">
			<legend>What is wrong with it?</legend>
			{#each REPORT_REASONS as reason (reason)}
				<label class="tick">
					<input type="radio" name="report-why" value={reason} bind:group={why} />
					<span>{REASONS[reason]}</span>
				</label>
			{/each}
		</fieldset>
		<div class="field">
			<label for="report-note">A note, if you like</label>
			<textarea id="report-note" rows="3" maxlength="500" aria-describedby="report-note-hint" bind:value={note}></textarea>
			<p class="hint" id="report-note-hint">At most 500 characters. {note.length > 400 ? `${500 - note.length} left.` : ''}</p>
		</div>
		{#if problem}<p class="notice notice--bad" role="alert">{problem}</p>{/if}
		<div class="panel-foot">
			<button class="plain-button" type="submit" disabled={busy}>{busy ? 'Sending...' : 'Send the report'}</button>
			<button class="link-button" type="button" onclick={close}>Not now</button>
		</div>
	</form>
{/if}

<style>
	fieldset {
		min-width: 0;
		border: 0;
		gap: 0.75rem;
	}

	legend {
		margin-bottom: 0.75rem;
		padding: 0;
		color: var(--ink);
		font-size: var(--text-small);
		font-weight: 600;
	}

	.tick {
		color: var(--ink);
		font-size: var(--text-small);
	}

	.tick input {
		margin-top: 0.05rem;
	}

	textarea {
		resize: vertical;
	}

	.handle {
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
</style>
