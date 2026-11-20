<script lang="ts">
	// A day at a glance: what is left to walk off, and the three numbers it
	// is made from - eaten, walked, and what the body burns at rest.
	//
	// The numbers are told plainly. Nothing here is red or green, nothing is
	// a score, and "left to walk off" is never less than zero. The sums are
	// in src/lib/account/estimates.ts.
	import { resolve } from '$app/paths';
	import Frame from '#lib/components/Frame.svelte';
	import { floorFor, type DayBalance } from '#lib/account/estimates.ts';
	import { count, duration } from '#lib/account/format.ts';
	import type { Body } from '#lib/account/types.ts';
	import { goalName } from '#lib/food/numbers.ts';

	let {
		balance,
		today,
		minutes,
		paced,
		goal,
		sex
	}: {
		balance: DayBalance;
		/** Is this the day it is now? A day that has passed has nothing left to do. */
		today: boolean;
		/** "Left to walk off" as minutes at the person's own pace; null when there is none to show. */
		minutes: number | null;
		/** Has the person walks to go by? */
		paced: boolean;
		goal: number;
		sex: Body['sex'] | undefined;
	} = $props();

	const burned = $derived(balance.resting ? balance.resting.kcal + balance.walked : 0);
	// both bars on one scale: the longer of the two is the whole width
	const scale = $derived(Math.max(balance.eaten, burned, 1));
	const share = (kcal: number) => `${Math.max(0, Math.min(100, (kcal / scale) * 100))}%`;
	const time = $derived(minutes === null ? '' : minutes < 60 ? `${Math.max(1, minutes)} ${minutes <= 1 ? 'minute' : 'minutes'}` : duration(minutes * 60));
</script>

<Frame pad="clamp(1rem, 4.6vw, 1.6rem)">
	<div class="summary">
		{#if balance.resting && balance.left !== null}
			<div class="left">
				<p class="label">{today ? 'Left to walk off' : 'Left to walk off that day'}</p>
				{#if balance.left > 0}
					<p class="figure">{count(balance.left)} <span>kcal</span></p>
					{#if !today}
						<p class="way">That day has passed, and nothing carries on from it.</p>
					{:else if time}
						<p class="way">about {time} at your usual pace</p>
					{:else if paced}
						<p class="way">More than a walk covers. Nothing carries over: tomorrow starts at zero.</p>
					{/if}
				{:else}
					<p class="nothing">{today ? 'Nothing left to walk off today.' : 'Nothing was left to walk off that day.'}</p>
				{/if}
			</div>

			<!-- eaten against burned: two bars on one scale. The numbers beside them say the same in words. -->
			<dl class="bars">
				<div>
					<dt>Eaten</dt>
					<dd>
						<span class="value">{count(balance.eaten)} kcal</span>
						<span class="track" aria-hidden="true"><span class="fill" style:width={share(balance.eaten)}></span></span>
					</dd>
				</div>
				<div>
					<dt>Burned</dt>
					<dd>
						<span class="value">{count(burned)} kcal</span>
						<span class="track" aria-hidden="true">
							<span class="fill" style:width={share(balance.resting.kcal)}></span>
							{#if balance.walked > 0}<span class="fill walked" style:width={share(balance.walked)}></span>{/if}
						</span>
					</dd>
				</div>
			</dl>

			<dl class="parts">
				<div>
					<dt><span class="key" aria-hidden="true"></span>At rest{balance.resting.rough ? ', roughly' : ''}</dt>
					<dd>{count(balance.resting.kcal)} kcal</dd>
				</div>
				<div>
					<dt><span class="key walked" aria-hidden="true"></span>Walked</dt>
					<dd>{count(balance.walked)} kcal</dd>
				</div>
				<div>
					<dt>Your goal</dt>
					<dd>{goalName(goal)}</dd>
				</div>
			</dl>

			{#if balance.floored}
				<p class="quiet">
					{today ? 'Your goal is not applied in full today.' : 'Your goal was not applied in full that day.'} Under about {count(floorFor(sex))} kcal a day is
					too little without a doctor.
				</p>
			{/if}
			{#if balance.resting.rough}
				<p class="quiet">
					The resting estimate is rough: it is made from your weight alone. With your height, your year of birth and your sex on the
					<a href={resolve('account/')}>account page</a> it is closer.
				</p>
			{/if}
		{:else}
			<!-- no weight in the account: no resting estimate, and so nothing is worked out -->
			<dl class="two">
				<div>
					<dt>Eaten</dt>
					<dd>{count(balance.eaten)} <small>kcal</small></dd>
				</div>
				<div>
					<dt>Walked</dt>
					<dd>{count(balance.walked)} <small>kcal</small></dd>
				</div>
			</dl>
			<p class="quiet">
				What your body burns at rest is worked out from your weight, and there is none in your account.
				<a href={resolve('account/')}>Add your weight on the account page for this estimate</a>.
			</p>
		{/if}

		<p class="estimates">These are estimates, for interest only. They are not medical advice.</p>
	</div>
</Frame>

<style>
	.summary {
		/* the two tones of the bars. The neutral is the small-print ink on the
		   light side; on the dark side that ink is too near the blue to tell
		   them apart, so it is taken two thirds of the way back to the ground. */
		--neutral: light-dark(#6c5c45, #616893);
		--walked: var(--accent);
		display: grid;
		gap: 1.1rem;
	}

	.left {
		display: grid;
		gap: 0.3rem;
	}

	/* the one large number of the page */
	.figure {
		color: var(--ink);
		font: 650 clamp(3rem, 2.2rem + 4vw, 3.75rem) / 1 var(--font-text);
		letter-spacing: -0.03em;
	}

	.figure span {
		color: var(--ink-3);
		font-size: 1.125rem;
		font-weight: 500;
		letter-spacing: 0;
	}

	.way {
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.nothing {
		color: var(--ink);
		font: 600 var(--text-h3) / 1.3 var(--font-display);
		text-wrap: balance;
	}

	.bars {
		display: grid;
		gap: 0.75rem;
	}

	/* the name on the left and the number on the right of one line, the bar under both */
	.bars > div {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}

	.bars dt {
		grid-area: 1 / 1;
		justify-self: start;
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.5rem;
	}

	.bars dd {
		grid-area: 1 / 1;
		display: grid;
		gap: 0.35rem;
	}

	.value {
		justify-self: end;
		color: var(--ink);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1.5rem;
	}

	.track {
		display: flex;
		gap: 2px;
		height: 8px;
		border-radius: 0 4px 4px 0;
		background: var(--line);
	}

	.fill {
		min-width: 0;
		background: var(--neutral);
	}

	.fill.walked {
		background: var(--walked);
	}

	/* square where a bar starts, rounded where it ends */
	.fill:last-child {
		border-radius: 0 4px 4px 0;
	}

	.parts {
		display: grid;
		gap: 0.3rem;
		padding-top: 0.9rem;
		border-top: 1px solid var(--line);
		font-size: var(--text-small);
	}

	.parts > div {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.1rem 1rem;
	}

	.parts dt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--ink-2);
	}

	.parts dd {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.key {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 2px;
		background: var(--neutral);
	}

	.key.walked {
		background: var(--walked);
	}

	.two {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.two > div {
		display: grid;
		gap: 0.2rem;
	}

	.two dt {
		order: 2;
		color: var(--ink-3);
		font-size: var(--text-fine);
	}

	.two dd {
		color: var(--ink);
		font: 600 2rem/1.1 var(--font-text);
		letter-spacing: -0.02em;
	}

	.two small {
		color: var(--ink-3);
		font-size: 0.875rem;
		font-weight: 500;
		letter-spacing: 0;
	}

	.quiet {
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.55;
	}

	.estimates {
		color: var(--ink-3);
		font-size: var(--text-fine);
		line-height: 1.55;
	}
</style>
