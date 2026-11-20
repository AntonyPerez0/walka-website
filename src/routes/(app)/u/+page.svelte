<script lang="ts">
	// A walker's public page: /u/?name=thrall.
	//
	// It is one static page for every name: the name is read from the
	// address here, in the browser, and the page shows what the database's
	// public_profile() gives for it - and only that. A name nobody has, a
	// page that is private and a page that was taken down all look the same.
	// Everything that comes from the database is set as text.
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Gate from '#lib/components/account/Gate.svelte';
	import Amount from '#lib/components/account/walks/Amount.svelte';
	import DaysChart from '#lib/components/account/walks/DaysChart.svelte';
	import Report from '#lib/components/account/walks/Report.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { account, say } from '#lib/account/account.svelte.ts';
	import { count, dayDate, dayName, distance, duration } from '#lib/account/format.ts';
	import type { PublicProfile, Units } from '#lib/account/types.ts';
	import { HANDLE, publicProfile } from '#lib/account/walks.ts';

	/** null: the address has not been read yet. '': it names nobody. */
	let name = $state<string | null>(null);
	let stage = $state<'waiting' | 'asking' | 'here' | 'none' | 'failed'>('waiting');
	let walker = $state.raw<PublicProfile | null>(null);
	let problem = $state('');

	// (also when the address changes without the page being loaded anew: Back, or a link from one walker's page to another's)
	afterNavigate(() => {
		const given = (new URLSearchParams(location.search).get('name') ?? '').trim().toLowerCase();
		if (given === name) return;
		name = given;
		walker = null;
		stage = 'waiting';
	});

	async function ask() {
		const asked = name;
		if (!asked) return;
		stage = 'asking';
		problem = '';
		try {
			// (a name that cannot be anybody's is not sent at all)
			const found = HANDLE.test(asked) ? await publicProfile(asked) : null;
			if (asked !== name) return;
			walker = found;
			stage = found ? 'here' : 'none';
		} catch (error) {
			if (asked !== name) return;
			problem = say(error);
			stage = 'failed';
		}
	}

	// The question waits until the database is known to be there (the pages
	// of an account all ask "are you there?" first, and say so if it is not).
	$effect(() => {
		if (name && stage === 'waiting' && (account.where === 'in' || account.where === 'out')) void ask();
	});

	// ---- miles or kilometres: the reader's, not the walker's -------------------
	// A signed-in reader has said which. Anybody else chooses here, and this
	// browser remembers it.
	let chosen = $state<Units | null>(null);
	let usual = $state<Units>('km');

	onMount(() => {
		usual = navigator.language === 'en-US' ? 'mi' : 'km';
		try {
			const kept = localStorage.getItem('walka-units');
			if (kept === 'mi' || kept === 'km') chosen = kept;
		} catch {
			// a browser that keeps nothing: the choice lasts as long as the page
		}
	});

	function choose(units: Units) {
		chosen = units;
		try {
			localStorage.setItem('walka-units', units);
		} catch {
			// as above
		}
	}

	const units = $derived(account.profile?.units ?? chosen ?? usual);
	const mine = $derived(Boolean(walker && account.profile?.handle === walker.handle));
	const since = $derived(walker?.totals.first_day ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(dayDate(walker.totals.first_day)) : '');
	const hasSteps = $derived(typeof walker?.totals.steps === 'number');
</script>

<Seo title="A walker's page" description="A public page of someone who walks with Walka: their walking totals, as they chose to show them." />

<Gate open>
	{#if name === ''}
		<section class="app">
			<div class="container">
				<header class="app-head">
					<p class="label">A walker's page</p>
					<h1>Whose page?</h1>
					<p class="lede">This address shows one walker's public page, and it needs that walker's name at its end. A link to a page has it.</p>
				</header>
				<p><a class="plain-button" href={resolve('/')}>To the front page</a></p>
			</div>
		</section>
	{:else if stage === 'none'}
		<section class="app">
			<div class="container">
				<header class="app-head">
					<p class="label">A walker's page</p>
					<h1>Nothing here</h1>
					<p class="lede">There is no public page with this name.</p>
				</header>
				<p><a class="plain-button" href={resolve('/')}>To the front page</a></p>
			</div>
		</section>
	{:else if stage === 'failed'}
		<section class="app">
			<div class="container">
				<header class="app-head">
					<p class="label">A walker's page</p>
					<h1>That did not load</h1>
				</header>
				<p class="notice notice--bad" role="alert">{problem}</p>
				<p class="panel-foot">
					<button class="plain-button" type="button" onclick={ask}>Try again</button>
					<a href={resolve('/')}>To the front page</a>
				</p>
			</div>
		</section>
	{:else if stage === 'here' && walker}
		<section class="app">
			<div class="container">
				<header class="app-head">
					<p class="label">A walker's page</p>
					<div class="who">
						<h1><bdi>{walker.display_name}</bdi></h1>
						<p class="handle">page name <span>{walker.handle}</span></p>
					</div>
					<p class="lede">Walks with Walka{since ? `, since ${since}` : ''}.</p>
				</header>

				{#if mine}
					<p class="notice">
						This is your page, as others see it. What it shows is yours to change on <a href={resolve('account/')}>your account page</a>.
					</p>
				{/if}

				<div class="in-all">
					{#if !account.profile}
						<div class="units">
							<span class="units-name" id="units-name">Distances in</span>
							<div class="tabs" role="group" aria-labelledby="units-name">
								<button type="button" aria-pressed={units === 'mi'} onclick={() => choose('mi')}>Miles</button>
								<button type="button" aria-pressed={units === 'km'} onclick={() => choose('km')}>Kilometres</button>
							</div>
						</div>
					{/if}
					<dl class="stats" class:four={hasSteps}>
						<div class="stat">
							<dt>{walker.totals.walks === 1 ? 'Walk' : 'Walks'}</dt>
							<dd>{count(walker.totals.walks)}</dd>
						</div>
						<div class="stat">
							<dt>Time walked</dt>
							<dd><Amount text={duration(walker.totals.seconds)} /></dd>
						</div>
						<div class="stat">
							<dt>Distance</dt>
							<dd><Amount text={distance(walker.totals.distance_m, units)} /></dd>
						</div>
						{#if typeof walker.totals.steps === 'number'}
							<div class="stat">
								<dt>Steps</dt>
								<dd>{count(walker.totals.steps)}</dd>
							</div>
						{/if}
					</dl>
					<p class="estimate">As recorded by the walker.</p>
				</div>

				{#if walker.days}
					<DaysChart days={walker.days} {units} />
				{/if}

				{#if walker.walks}
					<section class="panel" aria-labelledby="latest-name">
						<header>
							<h2 id="latest-name">The latest walks</h2>
							{#if !walker.walks.length}<p>None yet.</p>{/if}
						</header>
						{#if walker.walks.length}
							<ul class="rows">
								{#each walker.walks as walk, i (i)}
									<li>
										<span class="row-main">{dayName(walk.day)}</span>
										<span class="row-sub">
											<span>{duration(walk.seconds)}</span>
											<span>{distance(walk.distance_m, units)}</span>
											{#if typeof walk.steps === 'number'}<span>{count(walk.steps)} {walk.steps === 1 ? 'step' : 'steps'}</span>{/if}
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</section>
				{/if}

				<div class="about">
					<p class="estimate">
						A public page that its owner chose to show. It shows walking totals and nothing else.
						<a href={resolve('privacy/')}>Privacy, in plain words</a>
					</p>
					{#if !mine}<Report handle={walker.handle} />{/if}
				</div>
			</div>
		</section>
	{:else}
		<section class="app" aria-busy="true">
			<div class="container">
				<header class="app-head">
					<p class="label">A walker's page</p>
					<h1>One moment</h1>
					<p class="lede">Asking for the page.</p>
				</header>
			</div>
		</section>
	{/if}
</Gate>

<style>
	/* the name shown, and beside it - small and plain - the name in the address, which no other page can have */
	.who {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 1rem;
	}

	.who h1 {
		overflow-wrap: anywhere;
	}

	.handle {
		color: var(--ink-3);
		font-size: var(--text-fine);
	}

	.handle span {
		color: var(--ink-2);
		font: 500 var(--text-small) / 1.4 var(--font-mono);
	}

	.in-all {
		display: grid;
		gap: 0.75rem;
	}

	.units {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem 0.9rem;
	}

	.units-name {
		color: var(--ink-3);
		font-size: var(--text-fine);
	}

	.units .tabs {
		padding: 0.2rem;
	}

	.units .tabs > button {
		flex: none;
		min-height: 2.25rem;
		padding: 0.3rem 0.8rem;
		font-size: var(--text-fine);
	}

	/* three tiles, or four with steps: in a row on a wide screen, two by two on a phone (a third one fills its row) */
	.stats {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.stats.four {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	@media (max-width: 40rem) {
		.stats,
		.stats.four {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.stats:not(.four) .stat:last-child {
			grid-column: 1 / -1;
		}
	}

	/* on the narrowest phones a long figure ("49 h 07 min") still has to fit its tile */
	@media (max-width: 22.5rem) {
		.stat {
			padding-inline: 1rem;
		}

		.stat dd {
			font-size: 1.25rem;
			word-spacing: -0.06em;
		}
	}

	/* a walk's numbers, with a small dot between them (a dot that would begin a line is cut off) */
	.row-sub {
		display: flex;
		flex-wrap: wrap;
		margin-left: -1.2em;
		clip-path: inset(0 0 0 1.2em);
		font-variant-numeric: tabular-nums;
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

	.about {
		display: grid;
		gap: 0.75rem;
	}
</style>
