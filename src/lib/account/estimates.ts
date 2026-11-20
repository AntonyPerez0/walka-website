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

export type DayBalance = {
	eaten: number;
	walked: number;
	resting: Resting | null;
	/** eaten minus burned; null when there is no resting estimate */
	balance: number | null;
	/** how much is left to walk off toward the goal: never less than zero */
	left: number | null;
};

export function dayBalance(eaten: number, walked: number, rest: Resting | null, goal: number): DayBalance {
	if (!rest) return { eaten, walked, resting: null, balance: null, left: null };
	const balance = eaten - rest.kcal - walked;
	return { eaten, walked, resting: rest, balance, left: Math.max(0, Math.round(balance - goal)) };
}
