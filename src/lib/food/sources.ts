// Where the diary asks about foods: Open Food Facts (search and barcode,
// straight from the browser) and USDA FoodData Central (through a small
// function on the accounts' own project, which holds the key).
//
// Of a food the site keeps its name, its maker and its calories, and
// nothing else: no protein, carbohydrates or fat pass through here.
//
// Open Food Facts' rules, which this file keeps:
//   - no search while somebody types: one request when they press Search;
//   - at most 10 searches a minute, and 15 barcode lookups;
//   - an app names itself. A browser cannot set User-Agent, so the name goes
//     in X-User-Agent, which their answer to a browser allows.
// Their data is under the Open Database License: wherever a result of theirs
// is on the screen, the page says so (Sources.svelte).

import type { FoundFood } from '#lib/account/types.ts';
import { clean, LIMITS, ordinary, ordinaryBrand, round1 } from './numbers.ts';

export const OPEN_FOOD_FACTS = 'https://world.openfoodfacts.org';
export const WHO_ASKS = 'Walka-website/1.0 (https://github.com/AntonyPerez0/walka-website)';
const FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity';

/** Words to search for: 2 to 80 characters. */
export function searchWords(text: string): string | null {
	const words = clean(text, 200);
	return words.length >= 2 && words.length <= 80 ? words : null;
}

// ---- counting requests -----------------------------------------------------------

/** So many requests in a minute, and no more. Counted per tab, and a reload does not start it again. */
export class Allowance {
	#times: number[] = [];
	#name: string;
	#most: number;

	constructor(name: string, most: number) {
		this.#name = `walka-food-${name}`;
		this.#most = most;
		try {
			this.#times = (JSON.parse(globalThis.sessionStorage?.getItem(this.#name) ?? '[]') as unknown[]).filter((t): t is number => typeof t === 'number');
		} catch {
			// no storage here: counted in memory
		}
	}

	/** May one more be sent now? If so, it is counted. */
	take(now = Date.now()): boolean {
		this.#times = this.#times.filter((time) => now - time < 60_000 && time <= now);
		if (this.#times.length >= this.#most) return false;
		this.#times.push(now);
		try {
			globalThis.sessionStorage?.setItem(this.#name, JSON.stringify(this.#times));
		} catch {
			// counted in memory
		}
		return true;
	}
}

const searches = new Allowance('searches', 10);
const lookups = new Allowance('lookups', 15);

// ---- Open Food Facts ------------------------------------------------------------------

type Product = { code?: unknown; product_name?: unknown; brands?: unknown; nutriments?: Record<string, unknown> | null; serving_size?: unknown; serving_quantity?: unknown };

const amount = (value: unknown): number | null => {
	const n = typeof value === 'string' && value.trim() ? Number(value) : value;
	return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/**
 * A product of theirs as the site keeps a food - or null for one the diary
 * cannot use: no energy on record (or an impossible one), or no name.
 */
export function fromOpenFoodFacts(product: Product | null | undefined): FoundFood | null {
	if (!product) return null;
	const code = String(product.code ?? '').trim();
	if (!/^\d{1,64}$/.test(code)) return null;

	const nutriments = product.nutriments ?? {};
	let kcal = amount(nutriments['energy-kcal_100g']);
	if (kcal === null) {
		const kj = amount(nutriments['energy-kj_100g']);
		if (kj !== null) kcal = kj / 4.184;
	}
	if (kcal === null || kcal < 0 || kcal > LIMITS.kcal100) return null;

	// "Ferrero, Nutella": the first of the makers they list
	const brand = ordinaryBrand(clean(String(product.brands ?? '').split(',')[0], LIMITS.brand));
	const name = ordinary(clean(product.product_name, LIMITS.name)) || brand;
	if (!name) return null;

	const grams = amount(product.serving_quantity);
	const serving = grams !== null && grams > 0 && grams <= LIMITS.grams ? round1(grams) : null;
	return {
		source: 'off',
		source_id: code,
		name,
		brand: brand && brand !== name ? brand : null,
		kcal_100g: round1(kcal),
		serving_g: serving || null,
		serving_label: serving ? clean(product.serving_size, LIMITS.label) || null : null
	};
}

/** Open Food Facts answers slowly at times, and at times not at all. */
async function ask(address: string, fetcher: typeof fetch, named: boolean): Promise<Response> {
	const stop = new AbortController();
	const timer = setTimeout(() => stop.abort(), 15_000);
	try {
		return await fetcher(address, { headers: named ? { 'X-User-Agent': WHO_ASKS } : {}, signal: stop.signal });
	} finally {
		clearTimeout(timer);
	}
}

// The name is sent as long as it gets through. If it stops getting through
// twice in a row (their answer to a browser may one day not allow the header
// any more), the request goes without it: a search that works matters more.
let unnamed = 0;
async function askOpenFoodFacts(address: string, fetcher: typeof fetch): Promise<Response> {
	const named = unnamed < 2;
	try {
		const answer = await ask(address, fetcher, named);
		if (named) unnamed = 0;
		return answer;
	} catch (error) {
		if (named) unnamed += 1;
		throw error;
	}
}

export type Search =
	| { foods: FoundFood[]; problem?: undefined }
	/** limit: ten searches a minute are used up. silent: Open Food Facts does not answer. */
	| { foods: []; problem: 'limit' | 'silent' };

/** One search, sent when the person presses Search. */
export async function searchOpenFoodFacts(words: string, fetcher: typeof fetch = fetch): Promise<Search> {
	if (!searches.take()) return { foods: [], problem: 'limit' };
	const address = `${OPEN_FOOD_FACTS}/cgi/search.pl?search_terms=${encodeURIComponent(words)}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`;
	try {
		const answer = await askOpenFoodFacts(address, fetcher);
		if (!answer.ok) return { foods: [], problem: 'silent' };
		const body = (await answer.json()) as { products?: Product[] };
		const seen = new Set<string>();
		const foods: FoundFood[] = [];
		for (const product of Array.isArray(body.products) ? body.products : []) {
			const food = fromOpenFoodFacts(product);
			if (!food || seen.has(food.source_id!)) continue;
			seen.add(food.source_id!);
			foods.push(food);
		}
		return { foods };
	} catch {
		return { foods: [], problem: 'silent' };
	}
}

export type Lookup =
	| { food: FoundFood; missing?: undefined; problem?: undefined }
	/** unknown: they have no such barcode. energy: they have it, but not its calories. */
	| { food?: undefined; missing: 'unknown' | 'energy'; problem?: undefined }
	| { food?: undefined; missing?: undefined; problem: 'limit' | 'silent' };

/** One barcode, one request. */
export async function lookUpBarcode(code: string, fetcher: typeof fetch = fetch): Promise<Lookup> {
	if (!lookups.take()) return { problem: 'limit' };
	try {
		const answer = await askOpenFoodFacts(`${OPEN_FOOD_FACTS}/api/v3/product/${encodeURIComponent(code)}?fields=${FIELDS}`, fetcher);
		// (a barcode they do not have comes with status 404 and an answer that says so)
		const body = (await answer.json().catch(() => null)) as { product?: Product; result?: { id?: string } } | null;
		if (body?.product) {
			const food = fromOpenFoodFacts({ ...body.product, code: body.product.code ?? code });
			return food ? { food } : { missing: 'energy' };
		}
		if (answer.status === 404 || body?.result?.id === 'product_not_found') return { missing: 'unknown' };
		return { problem: 'silent' };
	} catch {
		return { problem: 'silent' };
	}
}

// ---- USDA FoodData Central, through the project's own function -----------------------------

// The function may not be there: not deployed yet, or no key set. Then the
// page quietly shows Open Food Facts results only, and does not ask again
// until it is loaded anew.
let usdaThere = true;

/** A food as the function sends it, checked again: nothing is taken on trust. */
export function fromUsda(food: Partial<Record<keyof FoundFood, unknown>> | null | undefined): FoundFood | null {
	if (!food || food.source !== 'usda') return null;
	const id = String(food.source_id ?? '');
	const name = clean(food.name, LIMITS.name);
	const kcal = amount(food.kcal_100g);
	if (!/^\d{1,64}$/.test(id) || !name || kcal === null || kcal < 0 || kcal > LIMITS.kcal100) return null;
	const grams = amount(food.serving_g);
	const serving = grams !== null && grams > 0 && grams <= LIMITS.grams ? round1(grams) : null;
	return {
		source: 'usda',
		source_id: id,
		name,
		brand: clean(food.brand, LIMITS.brand) || null,
		kcal_100g: round1(kcal),
		serving_g: serving,
		serving_label: serving ? clean(food.serving_label, LIMITS.label) || null : null
	};
}

export type Project = { url: string; key: string; token: string | null };

/** USDA's foods for these words - or none, without a word of complaint, when the function is not there. */
export async function searchUsda(words: string, project: Project, fetcher: typeof fetch = fetch): Promise<FoundFood[]> {
	if (!usdaThere || !project.token) return [];
	const stop = new AbortController();
	const timer = setTimeout(() => stop.abort(), 12_000);
	try {
		const answer = await fetcher(`${project.url}/functions/v1/usda?q=${encodeURIComponent(words)}`, {
			headers: { apikey: project.key, authorization: `Bearer ${project.token}` },
			signal: stop.signal
		});
		// 404: not deployed. 503: deployed, but no key set.
		if (answer.status === 404 || answer.status === 503) usdaThere = false;
		if (!answer.ok) return [];
		const body = (await answer.json()) as { foods?: unknown[] };
		return (Array.isArray(body.foods) ? body.foods : []).map((food) => fromUsda(food as Partial<FoundFood>)).filter((food) => food !== null);
	} catch {
		// (a function that is not deployed may answer in a way a browser does not let through at all)
		usdaThere = false;
		return [];
	} finally {
		clearTimeout(timer);
	}
}

/** For the tests: as after a reload. */
export function reloaded(): void {
	usdaThere = true;
	unnamed = 0;
}

/** Two lists as one, taking turns, so that neither source is buried under the other. */
export function inTurns<T>(first: T[], second: T[]): T[] {
	const out: T[] = [];
	for (let at = 0; at < Math.max(first.length, second.length); at++) {
		if (at < first.length) out.push(first[at]);
		if (at < second.length) out.push(second[at]);
	}
	return out;
}
