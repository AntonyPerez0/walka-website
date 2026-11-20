// The food diary's own small sums and words. Nothing here talks to anything:
// it is tried line by line in tests/food.test.ts.

import type { Body, Food, FoodEntry, FoundFood, Meal } from '#lib/account/types.ts';

/** What the database takes (supabase/migrations). The page says which number is out of range before it sends one. */
export const LIMITS = {
	name: 120,
	brand: 60,
	label: 60,
	/** grams in one entry, and in one serving */
	grams: 5000,
	/** calories in one entry */
	kcal: 10_000,
	/** calories in 100 g of a food */
	kcal100: 1000,
	firstDay: '2020-01-01'
} as const;

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Plain text for a name: no control characters, one space between words, not longer than the database takes. */
export function clean(text: unknown, max: number): string {
	const plain = String(text ?? '')
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
		// marks that turn the direction of the text, and letters nobody can see:
		// a food list anybody can edit must not be able to make a line read wrong
		.replace(/[\u00ad\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	// (cut by characters, as the database counts them - never through the middle of one)
	const letters = Array.from(plain);
	return letters.length > max ? letters.slice(0, max).join('').trim() : plain;
}

const shouts = (text: string) => text === text.toUpperCase() && text !== text.toLowerCase();

/** "PORRIDGE OATS" -> "Porridge oats". A name that is not all capitals is left as it is. */
export function ordinary(text: string): string {
	if (!shouts(text)) return text;
	const low = text.toLowerCase();
	return low.replace(/\p{L}/u, (first) => first.toUpperCase());
}

/** "THE GROWER'S HARVEST" -> "The Grower's Harvest": a maker's name, with a capital for each word. */
export function ordinaryBrand(text: string): string {
	if (!shouts(text)) return text;
	return text
		.split(' ')
		// ("S.A." stays as it is; "INC." becomes "Inc.")
		.map((word) => (/\.\p{L}/u.test(word) ? word : word.toLowerCase().replace(/\p{L}/u, (first) => first.toUpperCase())))
		.join(' ');
}

/** The calories in so many grams of a food. */
export const kcalFor = (kcal100: number, grams: number) => round1((kcal100 * grams) / 100);

/** A number as a person types it: "72,5" and " 72.5 " are 72.5. Anything else is not a number. */
export function typed(text: string | number | null | undefined): number | null {
	if (typeof text === 'number') return Number.isFinite(text) ? text : null;
	const plain = String(text ?? '')
		.trim()
		.replace(',', '.');
	if (!/^\d+(\.\d*)?$|^\.\d+$/.test(plain)) return null;
	const n = Number(plain);
	return Number.isFinite(n) ? n : null;
}

// ---- the meals ---------------------------------------------------------------

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_NAMES: Record<Meal, string> = {
	breakfast: 'Breakfast',
	lunch: 'Lunch',
	dinner: 'Dinner',
	snack: 'Snack'
};

/** The meal the clock suggests. It only saves a tap: the person can pick another, or none. */
export function mealAt(when: Date): Meal {
	const hour = when.getHours();
	if (hour >= 4 && hour < 11) return 'breakfast';
	if (hour >= 11 && hour < 15) return 'lunch';
	if (hour >= 17 && hour < 22) return 'dinner';
	return 'snack';
}

// ---- the goal ------------------------------------------------------------------

/** Calories eaten minus calories burned, for a day: the choices there are. The database takes no other. */
export const GOALS = [-500, -400, -300, -200, -100, 0, 100, 200, 300, 400, 500] as const;

export function goalName(goal: number): string {
	if (goal === 0) return 'About as much as I burn';
	return goal < 0 ? `${-goal} less than I burn` : `${goal} more than I burn`;
}

/**
 * The database's own rule: no goal below zero for a body that is underweight
 * by its own numbers (a body mass index under 18.5). Asked here too, so that
 * the page can say so without a connection.
 */
export function underweight(body: Pick<Body, 'weight_kg' | 'height_cm'> | null): boolean {
	if (!body?.weight_kg || !body.height_cm) return false;
	return body.weight_kg / (body.height_cm / 100) ** 2 < 18.5;
}

// ---- what a form may hold --------------------------------------------------------

/** Which number is out of range, in a sentence - or nothing, when the database will take the entry. */
export function entryProblem(entry: { name: string; grams: number | null; kcal: number | null }): string {
	if (!clean(entry.name, LIMITS.name)) return 'Give it a name.';
	if (entry.grams !== null && !(entry.grams > 0 && entry.grams <= LIMITS.grams)) return 'The amount must be more than 0 and at most 5,000 grams.';
	if (entry.kcal === null || !(entry.kcal >= 0)) return 'The calories must be a number, 0 or more.';
	if (entry.kcal > LIMITS.kcal) return 'One entry takes at most 10,000 kcal. This comes to more.';
	return '';
}

export function foodProblem(food: { name: string; kcal_100g: number | null; serving_g: number | null }): string {
	if (!clean(food.name, LIMITS.name)) return 'Give it a name.';
	if (food.kcal_100g === null || !(food.kcal_100g >= 0 && food.kcal_100g <= LIMITS.kcal100)) return 'Calories in 100 g must be between 0 and 1,000.';
	if (food.serving_g !== null && !(food.serving_g > 0 && food.serving_g <= LIMITS.grams)) return 'A serving must be more than 0 and at most 5,000 grams.';
	return '';
}

/**
 * What the database said when it refused a row, as a sentence that names
 * the number. (The names are those of its rules: supabase/migrations.) An
 * empty answer means: not one of these - ask say() in account.svelte.ts.
 */
export function refusal(error: unknown): string {
	const text = String((error as { message?: string })?.message ?? error ?? '');
	if (/grams_check|serving_g_check/.test(text)) return 'The amount is outside what Walka takes: more than 0 and at most 5,000 grams.';
	if (/food_entries_kcal_check/.test(text)) return 'The calories are outside what Walka takes: 0 to 10,000 kcal in one entry.';
	if (/kcal_100g_check/.test(text)) return 'The calories are outside what Walka takes: 0 to 1,000 kcal in 100 g.';
	if (/goal_balance_kcal_check/.test(text)) return 'A goal can be at most 500 either way.';
	if (/numeric field overflow/.test(text)) return 'One of these numbers is far larger than Walka takes.';
	if (/name_check/.test(text)) return 'The name must be 1 to 120 plain characters.';
	if (/brand_check|serving_label_check/.test(text)) return 'The maker or the serving has more than 60 characters, or characters that are not plain text.';
	if (/local_day_check/.test(text)) return 'The diary starts in 2020.';
	return '';
}

// ---- barcodes --------------------------------------------------------------------

/**
 * The digits of a barcode as typed or scanned - EAN-8, UPC-A (12), EAN-13 or
 * ITF-14 - or a sentence that says what is wrong with them.
 */
export function barcode(text: string): { code: string } | { problem: string } {
	const code = text.replace(/[\s-]/g, '');
	if (!/^\d+$/.test(code)) return { problem: 'A barcode is digits only.' };
	if (![8, 12, 13, 14].includes(code.length)) return { problem: 'A barcode has 8, 12, 13 or 14 digits. This one has ' + code.length + '.' };
	// The last digit is worked out from the others, so a slip of the finger
	// shows. (Not for 8 digits: two kinds of code have eight, and they work
	// their last digit out differently.)
	if (code.length !== 8) {
		const digits = Array.from(code.padStart(14, '0'), Number);
		const sum = digits.slice(0, 13).reduce((total, digit, at) => total + digit * (at % 2 ? 1 : 3), 0);
		if ((10 - (sum % 10)) % 10 !== digits[13]) return { problem: 'These digits do not make a barcode: one of them is not right. Check them against the packet.' };
	}
	return { code };
}

// ---- the diary's days ----------------------------------------------------------------

export type DayTotal = { day: string; kcal: number; entries: number };

/** Every day that has something written down, the latest first. */
export function dayTotals(entries: Pick<FoodEntry, 'local_day' | 'kcal' | 'deleted_at'>[]): DayTotal[] {
	const days = new Map<string, DayTotal>();
	for (const entry of entries) {
		if (entry.deleted_at) continue;
		const day = days.get(entry.local_day) ?? { day: entry.local_day, kcal: 0, entries: 0 };
		day.kcal += Number(entry.kcal) || 0;
		day.entries += 1;
		days.set(entry.local_day, day);
	}
	return [...days.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

/** Under this much in a day, three days running, the page says a quiet word. */
export const VERY_LITTLE = 800;

/**
 * True when the diary has entries on at least three days and shows under
 * 800 kcal in all on each of the last three of them. A day with nothing
 * written down is not a day of little food: it is just an empty day, and it
 * is not counted.
 */
export function veryLittle(entries: Pick<FoodEntry, 'local_day' | 'kcal' | 'deleted_at'>[], today: string): boolean {
	const last = dayTotals(entries)
		.filter((day) => day.day <= today)
		.slice(0, 3);
	return last.length === 3 && last.every((day) => day.kcal < VERY_LITTLE);
}

// ---- a food, as a row shows it ---------------------------------------------------------

export const SOURCE_NAMES: Record<Food['source'], string> = { off: 'Open Food Facts', usda: 'USDA', own: 'Mine' };

/** "40 g", "1 serving (40 g)" */
export function servingName(food: Pick<FoundFood, 'serving_g' | 'serving_label'>): string {
	if (!food.serving_g) return '';
	const grams = `${round1(food.serving_g)} g`;
	const label = food.serving_label?.trim();
	if (!label) return grams;
	// "40g" and "40 g" say nothing the grams do not
	if (/^[\d.,]+\s*(g|ml)$/i.test(label)) return grams;
	return /\d\s*(g|ml)\b/i.test(label) ? label : `${label} (${grams})`;
}
