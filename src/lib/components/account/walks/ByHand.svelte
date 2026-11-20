<script lang="ts">
	// Adding one walk by hand: a walk Walka did not record. What the person
	// types is what is kept - no steps or calories are worked out for them
	// here. Nothing typed is lost when the walk is refused.
	import { tick } from 'svelte';
	import { dayName, distance, duration, localDay } from '#lib/account/format.ts';
	import { outside } from '#lib/account/import.ts';
	import type { Units } from '#lib/account/types.ts';
	import { addOne, byHand } from '#lib/account/walks.ts';
	import Fold from './Fold.svelte';

	let { open = $bindable(false), units, onadded }: { open?: boolean; units: Units; /** a walk was added: the page fetches its list again */ onadded: () => void } = $props();

	const METRES = { mi: 1609.344, km: 1000 } as const;
	const UNIT_NAMES = { mi: 'miles', km: 'kilometres' } as const;

	type Field = 'day' | 'time' | 'minutes' | 'far' | 'steps' | 'calories';

	let day = $state(localDay());
	/** the time the person set themselves; null while the page proposes one */
	let typedTime = $state<string | null>(null);
	let minutes = $state<number | null>(null);
	let far = $state<number | null>(null);
	let steps = $state<number | null>(null);
	let calories = $state<number | null>(null);

	let busy = $state(false);
	let problem = $state('');
	let wrong = $state<Field | ''>('');
	let done = $state('');
	let form = $state<HTMLFormElement>();

	// The proposed start follows the clock while the form is open.
	let now = $state(Date.now());
	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(timer);
	});

	const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
	const clock = (when: Date) => `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
	const isToday = $derived(day === localDay(new Date(now)));

	// Today: a walk that has just ended began now, less the minutes walked.
	// Another day: noon, until the person says when.
	const proposed = $derived.by(() => {
		if (!isToday) return '12:00';
		const walked = isNumber(minutes) && minutes > 0 && minutes <= 1440 ? minutes : 0;
		const start = new Date(now - walked * 60_000);
		// (a walk that began before midnight began yesterday; the day says today, so the time stays in today)
		return localDay(start) === day ? clock(start) : '00:00';
	});
	const time = $derived(typedTime ?? proposed);

	async function refuse(field: Field | '', why: string) {
		wrong = field;
		problem = why;
		await tick();
		if (field) form?.querySelector<HTMLElement>(`[data-field="${field}"]`)?.focus();
	}

	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		problem = done = '';
		wrong = '';

		// Each number is looked at here first, so that the page can say which one it is.
		if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return refuse('day', 'Choose the day of the walk.');
		if (day > localDay()) return refuse('day', 'That is a day to come.');
		if (!/^\d{2}:\d{2}/.test(time)) return refuse('time', 'Say when the walk started, for example 18:30.');
		if (!isNumber(minutes) || minutes <= 0) return refuse('minutes', 'Say how many minutes you walked.');
		if (minutes > 1440) return refuse('minutes', 'The time walked is more than a day: 1,440 minutes is the most.');
		if (!isNumber(far) || far <= 0) return refuse('far', `Say how far you walked, in ${UNIT_NAMES[units]}.`);
		if (far * METRES[units] > 200_000) return refuse('far', 'The distance is more than 200 km (124 miles).');
		if (steps != null && (!isNumber(steps) || steps < 0 || !Number.isInteger(steps))) return refuse('steps', 'Steps are a whole number, or left empty.');
		if (isNumber(steps) && steps > 400_000) return refuse('steps', 'There are more than 400,000 steps.');
		if (calories != null && (!isNumber(calories) || calories < 0)) return refuse('calories', 'Calories are a number from zero up, or left empty.');
		if (isNumber(calories) && calories > 20_000) return refuse('calories', 'There are more than 20,000 kcal.');

		const start = new Date(`${day}T${time.slice(0, 5)}:00`);
		if (Number.isNaN(start.getTime())) return refuse('time', 'Say when the walk started, for example 18:30.');
		if (start.getTime() > Date.now() + 60_000) return refuse('time', 'That time is still to come. Check the day and the time it started.');

		const walk = byHand({
			start,
			day,
			seconds: Math.round(minutes * 60),
			distance_m: Math.round(far * METRES[units] * 10) / 10,
			steps: steps ?? 0,
			kcal: Math.round((calories ?? 0) * 10) / 10
		});
		// (the database's own limits, once more, in the same words)
		const why = outside(walk);
		if (why) return refuse('', why);

		busy = true;
		const answer = await addOne(walk);
		busy = false;
		if ('refused' in answer) return refuse(/starts at that moment|started at that moment/.test(answer.refused) ? 'time' : '', answer.refused);

		done = `Added the walk of ${dayName(day)}: ${duration(walk.seconds)}, ${distance(walk.distance_m, units)}.`;
		// the day stays: the next walk typed in is often of the same day
		minutes = far = steps = calories = null;
		typedTime = null;
		onadded();
	}
</script>

<Fold title="Add a walk by hand" bind:open>
	<p>For a walk Walka did not record. What you type is what is kept: nothing is worked out for you here.</p>

	<form class="fields" novalidate onsubmit={add} bind:this={form}>
		<div class="fields fields--two">
			<div class="field">
				<label for="hand-day">Day</label>
				<input id="hand-day" data-field="day" type="date" min="2000-01-01" max={localDay(new Date(now))} required aria-invalid={wrong === 'day'} bind:value={day} />
			</div>
			<div class="field">
				<label for="hand-time">Started at</label>
				<input
					id="hand-time"
					data-field="time"
					type="time"
					required
					aria-invalid={wrong === 'time'}
					aria-describedby="hand-time-hint"
					value={time}
					oninput={(event) => (typedTime = event.currentTarget.value || null)}
				/>
				<p class="hint" id="hand-time-hint">
					{#if typedTime !== null}As you set it.{:else if isToday}Now, less the minutes walked. Change it if the walk ended earlier.{:else}Noon, until you
						say when it was.{/if}
				</p>
			</div>
			<div class="field">
				<label for="hand-minutes">Minutes walked</label>
				<input id="hand-minutes" data-field="minutes" type="number" inputmode="decimal" min="1" max="1440" step="any" required aria-invalid={wrong === 'minutes'} bind:value={minutes} />
			</div>
			<div class="field">
				<label for="hand-far">Distance, in {UNIT_NAMES[units]}</label>
				<input id="hand-far" data-field="far" type="number" inputmode="decimal" min="0" step="any" required aria-invalid={wrong === 'far'} bind:value={far} />
			</div>
			<div class="field">
				<label for="hand-steps">Steps</label>
				<input id="hand-steps" data-field="steps" type="number" inputmode="numeric" min="0" max="400000" step="1" aria-invalid={wrong === 'steps'} aria-describedby="hand-steps-hint" bind:value={steps} />
				<p class="hint" id="hand-steps-hint">Optional. Without them, this walk counts 0 steps.</p>
			</div>
			<div class="field">
				<label for="hand-calories">Calories (kcal)</label>
				<input
					id="hand-calories"
					data-field="calories"
					type="number"
					inputmode="decimal"
					min="0"
					max="20000"
					step="any"
					aria-invalid={wrong === 'calories'}
					aria-describedby="hand-calories-hint"
					bind:value={calories}
				/>
				<p class="hint" id="hand-calories-hint">Optional. Without them, this walk has no calories. A figure you type is your own estimate.</p>
			</div>
		</div>

		{#if problem}<p class="notice notice--bad" role="alert">{problem}</p>{/if}
		<div class="panel-foot">
			<button class="plain-button" type="submit" disabled={busy}>{busy ? 'Adding...' : 'Add this walk'}</button>
			{#if done}<span class="estimate" role="status">{done}</span>{/if}
		</div>
	</form>
</Fold>
