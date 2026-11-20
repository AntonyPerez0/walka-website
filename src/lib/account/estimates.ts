// The estimates on the food page. They are estimates, and the page says so.
// docs/data-model.md says how each is made.

import type { Body, Walk } from './types.ts';

/** What sitting at a desk costs: 1.3 MET, as in Walka itself (kcal per kg per hour). */
const SITTING = 1.3;
/** Walka's own stand-in when it knows no weight. */
const A_WEIGHT = 75;

export type Resting = { kcal: number; rough: boolean };

/**
 * What a body burns in a day without the walks: the Mifflin-St Jeor resting
 * rate, times 1.2 for a day mostly spent sitting. Without an age or a sex it
 * is 24 kcal for each kilogram, and marked as rough. Without a weight there
 * is nothing to go on.
 */
export function resting(body: Pick<Body, 'weight_kg' | 'height_cm' | 'birth_year' | 'sex'> | null, year = new Date().getFullYear()): Resting | null {
	if (!body?.weight_kg) return null;
	if (body.height_cm && body.birth_year && body.sex) {
		const age = year - body.birth_year;
		const rate = 10 * body.weight_kg + 6.25 * body.height_cm - 5 * age + (body.sex === 'male' ? 5 : -161);
		return { kcal: Math.round(rate * 1.2), rough: false };
	}
	return { kcal: Math.round(24 * body.weight_kg), rough: true };
}

/**
 * What a walk burned on top of sitting for the same time. Walka says so
 * itself for newer walks (kcal_extra); for the others it is the walk's
 * calories less what sitting would have cost.
 */
export function walkedExtra(walk: Pick<Walk, 'kcal' | 'kcal_extra' | 'seconds'>, weightKg: number | null | undefined): number {
	if (walk.kcal_extra && walk.kcal_extra > 0) return walk.kcal_extra;
	const sitting = SITTING * (weightKg || A_WEIGHT) * (walk.seconds / 3600);
	return Math.max(0, walk.kcal - sitting);
}

/**
 * Under this much a day the page does not count: a goal is never applied
 * so far that it would ask for less food than this. (About 1,200 kcal, and
 * 1,500 where the resting estimate was made for a man: the figures public
 * health bodies give as the least without a doctor.)
 */
export function floorFor(sex: Body['sex'] | undefined): number {
	return sex === 'male' ? 1500 : 1200;
}

export type DayBalance = {
	eaten: number;
	walked: number;
	resting: Resting | null;
	/** eaten minus burned; null when there is no resting estimate */
	balance: number | null;
	/** how much is left to walk off toward the goal: never less than zero; null when there is no resting estimate */
	left: number | null;
	/** true when the goal was not applied in full, because it would have asked for less food than the floor */
	floored: boolean;
};

/**
 * A day's arithmetic. What may be eaten before anything is "left to walk
 * off" is what the body burns, plus the goal - but never less than the
 * floor. So eating little never shows up as something to walk off.
 */
export function dayBalance(eaten: number, walked: number, rest: Resting | null, goal: number, sex?: Body['sex']): DayBalance {
	if (!rest) return { eaten, walked, resting: null, balance: null, left: null, floored: false };
	const burned = rest.kcal + walked;
	const aim = burned + goal;
	const floor = floorFor(sex);
	const floored = aim < floor;
	return { eaten, walked, resting: rest, balance: eaten - burned, left: Math.max(0, Math.round(eaten - Math.max(aim, floor))), floored };
}

/**
 * "Left to walk off", as time at the person's own pace - or null when it is
 * more than a walk covers (two hours): the page then says so, and that
 * nothing carries over to tomorrow.
 */
export function walkingTime(left: number, kcalPerMinute: number | null): number | null {
	if (!kcalPerMinute || kcalPerMinute <= 0 || left <= 0) return null;
	const minutes = Math.round(left / kcalPerMinute);
	return minutes > 120 ? null : minutes;
}

/**
 * A person's own pace, in calories on top of sitting for each minute walked:
 * the middle one of their last ten walks of five minutes or more.
 */
export function usualPace(walks: Pick<Walk, 'kcal' | 'kcal_extra' | 'seconds'>[], weightKg: number | null | undefined): number | null {
	const rates = walks
		.filter((walk) => walk.seconds >= 300)
		.slice(0, 10)
		.map((walk) => walkedExtra(walk, weightKg) / (walk.seconds / 60))
		.filter((rate) => rate > 0)
		.sort((a, b) => a - b);
	if (!rates.length) return null;
	const middle = Math.floor(rates.length / 2);
	return rates.length % 2 ? rates[middle] : (rates[middle - 1] + rates[middle]) / 2;
}
