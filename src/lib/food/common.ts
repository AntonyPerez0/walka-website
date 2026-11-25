// The common foods the diary finds at once, as somebody types, without a
// connection: USDA's list of plain foods (public domain), made into
// static/food/common-foods.json by scripts/common-foods.mjs. Nothing is
// asked of anybody for it: the file comes from this site, and the diary's
// service worker keeps it on the device.
//
// The same matching finds the person's own foods.

import type { FoundFood } from '#lib/account/types.ts';

type Item = { i: string; n: string; k: number; g?: number; s?: string };

/** A common food as the diary keeps any food: from USDA, under its own number. */
export function fromList(item: Item): FoundFood {
	return {
		source: 'usda',
		source_id: item.i,
		name: item.n,
		brand: null,
		kcal_100g: item.k,
		serving_g: item.g ?? null,
		serving_label: item.g ? (item.s ?? null) : null
	};
}

const words = (text: string) =>
	text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.split(/[^a-z0-9%]+/)
		.filter(Boolean);

/**
 * How well a name fits what was typed: null when it does not (every typed
 * word must begin a word of the name), otherwise lower is better. A name
 * whose first word fits the first typed word comes first, then names where
 * the words come early, then shorter names ("Bananas, raw" before "Bananas,
 * dehydrated, or banana powder").
 */
export function fit(typed: string[], name: string): number | null {
	if (!typed.length) return null;
	// (USDA puts some foods under a group's name first: "Beverages, coffee, brewed" is coffee)
	const own = words(name.replace(GROUP, ''));
	let score = 0;
	for (const [at, word] of typed.entries()) {
		const stem = word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
		const where = own.findIndex((part) => part.startsWith(word) || part.startsWith(stem));
		if (where === -1) return null;
		score += where * 2;
		if (at === 0 && where !== 0) score += 6;
		// a whole word ("apple", "apples") before the beginning of a longer one ("applebee's")
		const part = own[where];
		if (part !== word && part !== stem && part !== `${stem}s` && part !== `${stem}es`) score += 4;
	}
	// a restaurant's or a maker's name, in capitals, after the plain foods
	if (/\b[A-Z]{3,}/.test(name)) score += 5;
	// the food itself before what was made of it: "Apples, raw" before "Apples, dried"
	if (own.includes('raw') || own.includes('brewed') || own.includes('regular')) score -= 2;
	return score + own.length * 0.5;
}

const GROUP = /^(beverages|alcoholic beverages?|fast foods?|snacks|restaurant|cereals ready-to-eat)\s*,\s*/i;

/** The best fits among some things with a name, best first. */
export function best<T>(typed: string, items: Iterable<T>, name: (item: T) => string, most = 20): T[] {
	const wanted = words(typed);
	if (!wanted.length) return [];
	const found: { item: T; score: number }[] = [];
	for (const item of items) {
		const score = fit(wanted, name(item));
		if (score !== null) found.push({ item, score });
	}
	return found
		.sort((a, b) => a.score - b.score)
		.slice(0, most)
		.map((entry) => entry.item);
}

let loading: Promise<Item[]> | null = null;

/** The list, fetched once from this site (and kept by the diary's service worker). Empty if it cannot be had. */
export function commonFoods(address: string): Promise<Item[]> {
	loading ??= fetch(address)
		.then((answer) => (answer.ok ? answer.json() : { foods: [] }))
		.then((body: { foods?: Item[] }) => (Array.isArray(body.foods) ? body.foods : []))
		.catch(() => {
			loading = null; // (asked again next time: the connection may be back)
			return [];
		});
	return loading;
}

/** Common foods for what was typed, best first. */
export async function searchCommon(typed: string, address: string, most = 12): Promise<FoundFood[]> {
	return best(typed, await commonFoods(address), (item) => item.n, most).map(fromList);
}
