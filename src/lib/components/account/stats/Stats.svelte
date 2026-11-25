<script lang="ts">
	// The stats page, for a signed-in person: everything the account holds
	// about their walking, added up. Worked out in this browser from the
	// person's own walks (src/lib/account/stats.ts); nothing here is kept
	// anywhere, and nothing here is on a public page.
	//
	// Every chart has the same numbers in a table under it, and every number
	// says what it is in words: nothing is told by colour alone.
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Tabs from '#lib/components/account/Tabs.svelte';
	import Amount from '#lib/components/account/walks/Amount.svelte';
	import { account, say } from '#lib/account/account.svelte.ts';
	import {
		count,
		dayName,
		dayShort,
		distance,
		duration,
		hourName,
		kcal,
		localDay,
		monthName,
		monthShort,
		pace,
		shiftDay,
		speed,
		weekdayShort
	} from '#lib/account/format.ts';
	import { buckets, habits, periods, records, sources, type Bucket, type Scale, type Sums } from '#lib/account/stats.ts';
	import { everyWalk, type ListedWalk } from '#lib/account/walks.ts';
	import BarChart from './BarChart.svelte';

	const units = $derived(account.profile?.units ?? 'mi');

	let walks = $state.raw<ListedWalk[] | null>(null);
	let problem = $state('');
	const today = localDay();

	async function load() {
		problem = '';
		try {
			walks = await everyWalk();
		} catch (error) {
			problem = say(error);
		}
	}
	onMount(() => void load());

	// ---- in all ---------------------------------------------------------------
	const SCOPES = [
		{ key: 'today', name: 'Today', before: 'yesterday', beforeName: 'Yesterday' },
		{ key: 'week', name: 'This week', before: 'lastWeek', beforeName: 'Last week' },
		{ key: 'month', name: 'This month', before: 'lastMonth', beforeName: 'Last month' },
		{ key: 'all', name: 'All time', before: null, beforeName: '' }
	] as const;
	let scope = $state<(typeof SCOPES)[number]['key']>('all');
	const inAll = $derived(walks ? periods(walks, today) : null);
	const chosen = $derived(SCOPES.find((one) => one.key === scope)!);
	const shown = $derived(inAll?.[scope] ?? null);
	const before = $derived(inAll && chosen.before ? inAll[chosen.before] : null);

	// ---- over time ----------------------------------------------------------------
	const MEASURES = [
		{ key: 'seconds', name: 'Time' },
		{ key: 'distance_m', name: 'Distance' },
		{ key: 'steps', name: 'Steps' },
		{ key: 'kcal', name: 'Calories' }
	] as const;
	type Measure = (typeof MEASURES)[number]['key'];
	const SCALES: { key: Scale; name: string; each: string }[] = [
		{ key: 'day', name: 'Days', each: 'day' },
		{ key: 'week', name: 'Weeks', each: 'week' },
		{ key: 'month', name: 'Months', each: 'month' }
	];
	let measure = $state<Measure>('seconds');
	let scale = $state<Scale>('day');

	/** A value of one measure in words: "1 h 05 min", "4.20 km", "3,360 steps", "about 240 kcal". */
	function inWords(value: number, of: Measure): string {
		if (of === 'seconds') return duration(value);
		if (of === 'distance_m') return distance(value, units);
		if (of === 'steps') return `${count(value)} steps`;
		return `about ${kcal(value)}`;
	}
	/** The top of a chart's scale. */
	function scaleTop(value: number, of: Measure): string {
		if (of === 'seconds') return value >= 3600 ? `${+(value / 3600).toFixed(1)} h` : `${Math.round(value / 60)} min`;
		if (of === 'distance_m') return distance(value, units).replace(/\.00 /, ' ');
		if (of === 'steps') return `${count(value)} steps`;
		return `${count(value)} kcal`;
	}

	/** "Thursday 19 November", "the week of 17 November", "November 2026" */
	function bucketName(key: string, of: Scale): string {
		if (of === 'day') return dayName(key);
		if (of === 'week') return `the week of ${dayShort(key)}${key.slice(0, 4) === today.slice(0, 4) ? '' : ` ${key.slice(0, 4)}`}`;
		return monthName(key);
	}
	function bucketShort(key: string, of: Scale): string {
		if (of === 'month') return monthShort(key);
		return dayShort(key);
	}

	const series = $derived(walks ? buckets(walks, scale, today) : []);
	const scaleName = $derived(SCALES.find((one) => one.key === scale)!);
	const measureName = $derived(MEASURES.find((one) => one.key === measure)!.name);
	const withWalks = $derived(series.filter((bucket) => bucket.sums.walks > 0));
	const peak = $derived(withWalks.reduce<Bucket | null>((best, bucket) => (!best || bucket.sums[measure] > best.sums[measure] ? bucket : best), null));
	const overTime = $derived(
		withWalks.length
			? `${measureName}, ${scaleName.each} by ${scaleName.each}, the last ${count(series.length)} ${scaleName.each}s: ${inWords(
					withWalks.reduce((total, bucket) => total + bucket.sums[measure], 0),
					measure
				)} in all, with walks in ${count(withWalks.length)} of them. The most was ${inWords(peak!.sums[measure], measure)}, ${scale === 'day' ? 'on' : 'in'} ${bucketName(peak!.key, scale)}.`
			: `No walks in the last ${count(series.length)} ${scaleName.each}s.`
	);
	const timeBars = $derived(
		series.map((bucket) => ({
			key: bucket.key,
			short: bucketShort(bucket.key, scale),
			long: `${bucketName(bucket.key, scale)[0].toUpperCase()}${bucketName(bucket.key, scale).slice(1)}, ${bucket.sums.walks === 1 ? 'one walk' : `${count(bucket.sums.walks)} walks`}`,
			value: bucket.sums[measure],
			readout: bucket.sums.walks ? inWords(bucket.sums[measure], measure) : 'No walk'
		}))
	);
	/** newest first, for the table */
	const timeRows = $derived([...series].reverse());

	// ---- records and habits ---------------------------------------------------------
	const best = $derived(walks ? records(walks, today) : null);
	const usual = $derived(walks ? habits(walks) : null);
	const how = $derived(walks ? sources(walks) : null);

	const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	// (a Monday to give the short names from)
	const MONDAY = '2026-11-23';

	const hourBars = $derived(
		(usual?.hours ?? []).map((sums, hour) => ({
			key: String(hour),
			short: String(hour).padStart(2, '0'),
			long: `Begun between ${hourName(hour)} and ${hourName(hour + 1)}`,
			value: sums.walks,
			readout: sums.walks === 1 ? 'One walk' : `${count(sums.walks)} walks`
		}))
	);
	const dayBars = $derived(
		(usual?.weekdays ?? []).map((sums, day) => ({
			key: String(day),
			short: weekdayShort(shiftDay(MONDAY, day)),
			long: `${WEEKDAYS[day]}s, ${sums.walks === 1 ? 'one walk' : `${count(sums.walks)} walks`}`,
			value: sums.seconds,
			readout: sums.walks ? duration(sums.seconds) : 'No walk'
		}))
	);
	const clocked = $derived(usual ? usual.hours.reduce((total, at) => total + at.walks, 0) : 0);
	const hourSummary = $derived(
		usual && usual.usualHours !== null
			? `When your walks began, hour by hour, by the clock where you walked: most often between ${hourName(usual.usualHours)} and ${hourName(usual.usualHours + 3)}, in the ${usual.usualPart}.`
			: 'None of your walks says the time of day it began.'
	);
	const daySummary = $derived(
		usual && usual.usualDays.length
			? `Time walked by day of the week. Most on ${usual.usualDays.map((day) => `${WEEKDAYS[day]}s`).join(', then ')}.`
			: 'No walks yet.'
	);

	/** "in a game session" against "without one": as a share, in words and as a bar of two parts */
	const gameShare = $derived.by(() => {
		if (!usual) return null;
		const known = usual.game.walks + usual.noGame.walks;
		return known ? { game: usual.game.walks / known, known } : null;
	});
	const perWalk = (sums: Sums) => (sums.walks ? duration(sums.seconds / sums.walks) : '-');
	const percent = (share: number) => `${Math.round(share * 100)}%`;

	function streak(days: number): string {
		return days === 1 ? 'one day' : `${count(days)} days in a row`;
	}
	const span = (from: string, to: string) => (from === to ? dayName(from) : `${dayShort(from)} to ${dayShort(to)}${to.slice(0, 4) === today.slice(0, 4) ? '' : ` ${to.slice(0, 4)}`}`);
</script>

<section class="app app--wide">
	<div class="container">
		<header class="app-head">
			<p class="label">Your account</p>
			<h1>Your stats</h1>
			<p class="lede">
				Everything your account holds about your walking, added up. Worked out in this browser from your own walks:
				only you see this page, whatever your public page shows.
			</p>
		</header>

		<Tabs current="stats" />

		{#if problem}
			<div class="notice notice--bad" role="alert">
				<p>{problem}</p>
				<p><button class="link-button" type="button" onclick={load}>Try again</button></p>
			</div>
		{/if}

		{#if walks === null && !problem}
			<div class="panel" aria-busy="true"><p>One moment: fetching your walks.</p></div>
		{:else if walks && !walks.length}
			<div class="panel panel--quiet">
				<header>
					<h2>No walks here yet</h2>
					<p>
						Your stats begin with your first walk. Walks get into your account when Walka sends them - once you sign in
						to this account in Walka and switch sending on - or when you add them on
						<a href={resolve('account/walks/')}>the Walks page</a>.
					</p>
				</header>
			</div>
		{:else if walks && inAll && best && usual && how}
			<!-- ---- in all ---- -->
			<section class="block" aria-labelledby="in-all">
				<div class="block-head">
					<h2 id="in-all">In all</h2>
					<div class="tabs choose" role="group" aria-label="Show">
						{#each SCOPES as one (one.key)}
							<button type="button" aria-pressed={scope === one.key} onclick={() => (scope = one.key)}>{one.name}</button>
						{/each}
					</div>
				</div>
				{#if shown}
					<dl class="stats tiles">
						<div class="stat">
							<dt>{shown.walks === 1 ? 'Walk' : 'Walks'}{#if before}<small>{chosen.beforeName}: {count(before.walks)}</small>{/if}</dt>
							<dd>{count(shown.walks)}</dd>
						</div>
						<div class="stat">
							<dt>Time walked{#if before}<small>{chosen.beforeName}: {duration(before.seconds)}</small>{/if}</dt>
							<dd><Amount text={duration(shown.seconds)} /></dd>
						</div>
						<div class="stat">
							<dt>Distance{#if before}<small>{chosen.beforeName}: {distance(before.distance_m, units)}</small>{/if}</dt>
							<dd><Amount text={distance(shown.distance_m, units)} /></dd>
						</div>
						<div class="stat">
							<dt>Steps{#if before}<small>{chosen.beforeName}: {count(before.steps)}</small>{/if}</dt>
							<dd>{count(shown.steps)}</dd>
						</div>
						<div class="stat">
							<dt>Calories, an estimate{#if before}<small>{chosen.beforeName}: {kcal(before.kcal)}</small>{/if}</dt>
							<dd><Amount text={kcal(shown.kcal)} /></dd>
						</div>
					</dl>
				{/if}
				<p class="estimate">
					A week begins on a Monday. Days are the days where you walked. Calories are estimates, for interest only, and
					not medical advice.
				</p>
			</section>

			<!-- ---- over time ---- -->
			<section class="panel" aria-labelledby="over-time">
				<div class="block-head">
					<h2 id="over-time">Over time</h2>
				</div>
				<div class="controls">
					<div class="tabs choose" role="group" aria-label="Which number">
						{#each MEASURES as one (one.key)}
							<button type="button" aria-pressed={measure === one.key} onclick={() => (measure = one.key)}>{one.name}</button>
						{/each}
					</div>
					<div class="tabs choose" role="group" aria-label="By">
						{#each SCALES as one (one.key)}
							<button type="button" aria-pressed={scale === one.key} onclick={() => (scale = one.key)}>{one.name}</button>
						{/each}
					</div>
				</div>
				<p class="said" aria-hidden="true">{overTime}</p>
				<BarChart bars={timeBars} summary={overTime} top={(value) => scaleTop(value, measure)} labels={scale === 'month' ? 6 : 4} />
				{#if measure === 'kcal'}<p class="estimate">Calories are estimates.</p>{/if}
				<details>
					<summary>The {scaleName.each}s as a table</summary>
					<div class="table">
						<table>
							<thead>
								<tr>
									<th scope="col">{scaleName.each[0].toUpperCase()}{scaleName.each.slice(1)}</th>
									<th scope="col">Walks</th>
									<th scope="col">Time</th>
									<th scope="col">Distance</th>
									<th scope="col">Steps</th>
									<th scope="col">Calories <span class="fine">(estimate)</span></th>
								</tr>
							</thead>
							<tbody>
								{#each timeRows as bucket (bucket.key)}
									<tr class:empty={!bucket.sums.walks}>
										<th scope="row">{scale === 'week' ? `Week of ${dayShort(bucket.key)}` : bucketName(bucket.key, scale)}</th>
										<td>{count(bucket.sums.walks)}</td>
										<td>{bucket.sums.walks ? duration(bucket.sums.seconds) : '-'}</td>
										<td>{bucket.sums.walks ? distance(bucket.sums.distance_m, units) : '-'}</td>
										<td>{bucket.sums.walks ? count(bucket.sums.steps) : '-'}</td>
										<td>{bucket.sums.walks ? kcal(bucket.sums.kcal) : '-'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</details>
			</section>

			<!-- ---- records ---- -->
			<section class="block" aria-labelledby="records">
				<div class="block-head"><h2 id="records">Records</h2></div>
				<dl class="stats tiles records">
					{#if best.longest}
						<div class="stat">
							<dt>Longest walk<small>{dayName(best.longest.local_day)}</small></dt>
							<dd><Amount text={duration(best.longest.seconds)} /></dd>
						</div>
					{/if}
					{#if best.farthest}
						<div class="stat">
							<dt>Farthest walk<small>{dayName(best.farthest.local_day)}</small></dt>
							<dd><Amount text={distance(best.farthest.distance_m, units)} /></dd>
						</div>
					{/if}
					{#if best.mostSteps}
						<div class="stat">
							<dt>Most steps in one walk<small>{dayName(best.mostSteps.local_day)}</small></dt>
							<dd>{count(best.mostSteps.steps)}</dd>
						</div>
					{/if}
					{#if best.bestDay}
						<div class="stat">
							<dt>Best day<small>{dayName(best.bestDay.key)}, {distance(best.bestDay.sums.distance_m, units)}</small></dt>
							<dd><Amount text={duration(best.bestDay.sums.seconds)} /></dd>
						</div>
					{/if}
					{#if best.bestWeek}
						<div class="stat">
							<dt>Best week<small>Week of {dayShort(best.bestWeek.key)}, {distance(best.bestWeek.sums.distance_m, units)}</small></dt>
							<dd><Amount text={duration(best.bestWeek.sums.seconds)} /></dd>
						</div>
					{/if}
					{#if best.longestStreak}
						<div class="stat">
							<dt>Longest streak<small>{span(best.longestStreak.from, best.longestStreak.to)}</small></dt>
							<dd><Amount text={best.longestStreak.days === 1 ? '1 day' : `${count(best.longestStreak.days)} days`} /></dd>
						</div>
					{/if}
					<div class="stat">
						<dt>
							Streak now<small
								>{best.currentStreak
									? best.currentStreak.to >= today
										? `Up to today: ${streak(best.currentStreak.days)}`
										: `Up to yesterday: a walk today keeps it`
									: 'No walk today or yesterday'}</small
							>
						</dt>
						<dd><Amount text={best.currentStreak ? (best.currentStreak.days === 1 ? '1 day' : `${count(best.currentStreak.days)} days`) : '0 days'} /></dd>
					</div>
					<div class="stat">
						<dt>Days with a walk<small>Since {best.firstDay ? dayName(best.firstDay) : '-'}</small></dt>
						<dd>{count(best.daysWalked)}</dd>
					</div>
				</dl>
				<p class="estimate">A streak is days in a row with at least one walk. Best day and best week are the most time walked.</p>
			</section>

			<!-- ---- habits ---- -->
			<section class="block" aria-labelledby="habits">
				<div class="block-head"><h2 id="habits">Habits</h2></div>
				<dl class="stats tiles">
					<div class="stat">
						<dt>Average walk<small>Time on the belt</small></dt>
						<dd><Amount text={usual.averageWalk === null ? '-' : duration(usual.averageWalk)} /></dd>
					</div>
					<div class="stat">
						<dt>Average speed<small>{usual.speed ? pace(usual.speed, units) : 'No distance yet'}</small></dt>
						<dd><Amount text={usual.speed ? speed(usual.speed, units) : '-'} /></dd>
					</div>
					<div class="stat">
						<dt>
							Steps a minute<small
								>{usual.cadenceCounted !== null
									? `${count(usual.cadenceCounted)} where the treadmill counted them`
									: 'Estimated steps: the treadmill counted none'}</small
							>
						</dt>
						<dd>{usual.cadence === null ? '-' : count(usual.cadence)}</dd>
					</div>
				</dl>

				<div class="panel">
					<header>
						<h3>Time of day</h3>
						<p>{hourSummary}</p>
					</header>
					{#if clocked}
						<BarChart bars={hourBars} summary={hourSummary} top={(value) => (value === 1 ? '1 walk' : `${count(value)} walks`)} labelWhere={(hour) => hour % 6 === 0} height="7rem" />
					{/if}
					{#if usual.noClock}
						<p class="estimate">
							{usual.noClock === 1 ? 'One walk does' : `${count(usual.noClock)} walks do`} not say the clock {usual.noClock === 1 ? 'it was' : 'they were'} walked under
							- typed in here, or from an older file - and {usual.noClock === 1 ? 'is' : 'are'} not counted here.
						</p>
					{/if}
				</div>

				<div class="panel">
					<header>
						<h3>Day of the week</h3>
						<p>{daySummary}</p>
					</header>
					<BarChart bars={dayBars} summary={daySummary} top={(value) => scaleTop(value, 'seconds')} labels="all" height="7rem" />
				</div>

				<div class="panel">
					<header>
						<h3>With a game, or without</h3>
						<p>Whether a walking session was running in the game while you walked, as Walka says of each walk.</p>
					</header>
					{#if gameShare}
						<div class="split" role="img" aria-label="{percent(gameShare.game)} of your walks were in a game session, {percent(1 - gameShare.game)} without one.">
							<span class="part game" style:flex-grow={usual.game.walks}></span>
							<span class="part none" style:flex-grow={usual.noGame.walks}></span>
						</div>
					{/if}
					<div class="table">
						<table>
							<thead>
								<tr>
									<th scope="col"></th>
									<th scope="col">Walks</th>
									<th scope="col">Time</th>
									<th scope="col" class="wide">Distance</th>
									<th scope="col" class="wide">Average walk</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<th scope="row"><span class="key game" aria-hidden="true"></span>In a game session{#if gameShare}<span class="fine">{percent(gameShare.game)} of walks</span>{/if}</th>
									<td>{count(usual.game.walks)}</td>
									<td>{duration(usual.game.seconds)}</td>
									<td class="wide">{distance(usual.game.distance_m, units)}</td>
									<td class="wide">{perWalk(usual.game)}</td>
								</tr>
								<tr>
									<th scope="row"><span class="key none" aria-hidden="true"></span>Without one{#if gameShare}<span class="fine">{percent(1 - gameShare.game)} of walks</span>{/if}</th>
									<td>{count(usual.noGame.walks)}</td>
									<td>{duration(usual.noGame.seconds)}</td>
									<td class="wide">{distance(usual.noGame.distance_m, units)}</td>
									<td class="wide">{perWalk(usual.noGame)}</td>
								</tr>
								{#if usual.gameUnknown.walks}
									<tr>
										<th scope="row">Not known<span class="fine">added by hand</span></th>
										<td>{count(usual.gameUnknown.walks)}</td>
										<td>{duration(usual.gameUnknown.seconds)}</td>
										<td class="wide">{distance(usual.gameUnknown.distance_m, units)}</td>
										<td class="wide">{perWalk(usual.gameUnknown)}</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<!-- ---- measured, or estimated ---- -->
			<section class="panel" aria-labelledby="how-measured">
				<header>
					<h2 id="how-measured">Measured, or estimated</h2>
					<p>How each number of your walks was come by. Each walk says which on <a href={resolve('account/walks/')}>the Walks page</a>.</p>
				</header>
				<div class="table tight">
					<table>
						<thead>
							<tr>
								<th scope="col">Number</th>
								<th scope="col">Measured</th>
								<th scope="col">Estimated</th>
								<th scope="col">Not<br />known</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">Time on the belt<span class="fine note">Walka's clock, while the belt moved</span></th>
								<td>{count(walks.filter((walk) => walk.origin !== 'web').length)}</td>
								<td>-</td>
								<td>{count(walks.filter((walk) => walk.origin === 'web').length)} <span class="fine">(typed in)</span></td>
							</tr>
							<tr>
								<th scope="row">Distance<span class="fine note">by the treadmill, or from the belt's speed</span></th>
								<td>{count(how.distance.treadmill)}</td>
								<td>{count(how.distance.speed)}</td>
								<td>{count(how.distance.unknown)}</td>
							</tr>
							<tr>
								<th scope="row">Steps<span class="fine note">counted by the treadmill, or estimated</span></th>
								<td>{count(how.steps.treadmill)}</td>
								<td>{count(how.steps.estimate)}</td>
								<td>{count(how.steps.unknown)}</td>
							</tr>
							<tr>
								<th scope="row">Calories<span class="fine">always an estimate</span></th>
								<td>-</td>
								<td>{count(how.calories.speed + how.calories.heart_rate)} <span class="fine">({count(how.calories.speed)} from speed, {count(how.calories.heart_rate)} from heart rate)</span></td>
								<td>{count(how.calories.unknown)}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="estimate">
					Walka estimates steps from your speed and height where the treadmill does not count them. Calories are an estimate
					whichever way they were made, for interest only and not medical advice.
				</p>
			</section>

			<p class="estimate foot">
				{count(walks.length)} walks in all. Nothing on this page is on your public page: what that shows is chosen on
				<a href={resolve('account/')}>your account page</a>. To take your walks with you, download them on
				<a href={resolve('account/walks/')}>the Walks page</a>.
			</p>
		{/if}
	</div>
</section>

<style>
	.block {
		display: grid;
		gap: 0.75rem;
	}

	.block-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	.block-head h2,
	.panel > header > h2 {
		font-size: var(--text-h3);
	}

	.panel > header > h3 {
		font-size: 1.125rem;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		justify-content: space-between;
	}

	/* a choice between views of the same numbers: smaller than the tabs of the account */
	.choose {
		flex-wrap: wrap;
		padding: 0.2rem;
	}

	.choose > button {
		flex: none;
		min-height: 2.25rem;
		padding: 0.3rem 0.8rem;
		font-size: var(--text-fine);
	}

	.said {
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.55;
	}

	/* tiles with a second line under the name: what it is compared with, or when */
	.tiles .stat dt {
		display: grid;
		gap: 0.1rem;
	}

	.tiles .stat dt small {
		color: var(--ink-3);
		font-size: var(--text-label);
		line-height: 1.4;
	}

	.tiles {
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
	}

	/* eight records: four by two, and two by four on a phone - no empty place */
	.records {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	@media (max-width: 48rem) {
		.records {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* a bar of two parts: in a game, and without. Told apart by a pattern as well as a shade. */
	.split {
		display: flex;
		gap: 2px;
		height: 0.9rem;
		overflow: hidden;
		border-radius: 4px;
	}

	.part {
		flex-basis: 0;
		min-width: 2px;
	}

	.game,
	.key.game {
		background: var(--accent);
	}

	.none,
	.key.none {
		background: var(--surface-2);
		background-image: repeating-linear-gradient(135deg, var(--ink-3) 0 1.5px, transparent 1.5px 6px);
		box-shadow: inset 0 0 0 1px var(--line-strong);
	}

	.key {
		display: inline-block;
		width: 0.8rem;
		height: 0.8rem;
		margin-right: 0.5rem;
		vertical-align: -0.05rem;
		border-radius: 2px;
	}

	.fine {
		display: block;
		color: var(--ink-3);
		font-size: var(--text-label);
		font-weight: 400;
		line-height: 1.4;
	}

	td .fine {
		display: inline;
	}

	details {
		display: grid;
	}

	summary {
		display: flex;
		align-items: center;
		gap: 0.6em;
		width: fit-content;
		min-height: 2.75rem;
		margin-block: -0.5rem;
		color: var(--accent);
		font-size: var(--text-small);
		font-weight: 600;
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary::after {
		content: '';
		width: 0.42em;
		height: 0.42em;
		margin-bottom: 0.2em;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(45deg);
	}

	details[open] > summary::after {
		margin-bottom: -0.2em;
		transform: rotate(-135deg);
	}

	details .table {
		margin-top: 1rem;
	}

	.table {
		overflow-x: auto;
	}

	table {
		min-width: 100%;
	}

	td {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	tr.empty {
		color: var(--ink-3);
	}

	.foot {
		text-align: center;
	}

	/* two tiles side by side on a phone; an odd last one takes the whole row */
	@media (max-width: 36rem) {
		.tiles:not(.records) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.tiles:not(.records) .stat:last-child:nth-child(odd) {
			grid-column: 1 / -1;
		}

		.tiles .stat {
			padding-inline: 1rem;
		}

		.tiles .stat dd {
			font-size: 1.375rem;
		}

		/* a table of four narrow columns: closer together, and its headings less spaced out */
		.tight :is(th, td) {
			padding-inline: 0.35rem;
		}

		.tight :is(th, td):first-child {
			padding-left: 0.6rem;
		}

		.tight thead th {
			font-size: 0.75rem;
			letter-spacing: 0;
			text-transform: none;
		}

		/* on a narrow screen a table keeps to the columns that matter, without the notes */
		.wide,
		th .note,
		td .fine {
			display: none;
		}
	}

	@media (max-width: 30rem) {
		.choose {
			width: 100%;
		}

		.choose > button {
			flex: 1;
			padding-inline: 0.4rem;
		}

		:global(.app) th,
		:global(.app) td {
			padding: 0.55rem 0.6rem;
		}
	}
</style>
