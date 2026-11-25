// What the "usda" function does, as one plain function: a request in, an
// answer out. Nothing here belongs to Deno, so that tests/usda.test.ts can
// run it under Node with a made-up fetch. index.ts hands it to Deno.
//
// Why there is a function at all: USDA FoodData Central wants a key with
// every request, and the only key that may be in the site's pages is the
// database's public one. So the food diary asks this function, the function
// asks USDA with the key, and the key never leaves the server: it is not in
// an address, not in an answer and not in a log.
//
// Of a food it passes on its name, its maker, its calories and one serving -
// the site's FoundFood (src/lib/account/types.ts). No other nutrient.

export type Env = { USDA_API_KEY?: string };

/** The same shape as FoundFood in src/lib/account/types.ts (a function is deployed on its own, so it cannot import it). */
export type UsdaFood = {
	source: 'usda';
	source_id: string;
	name: string;
	brand: string | null;
	kcal_100g: number;
	serving_g: number | null;
	serving_label: string | null;
};

const USDA = 'https://api.nal.usda.gov/fdc/v1/foods/search';

const CORS: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
	'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

const answer = (status: number, body: unknown, more: Record<string, string> = {}) =>
	new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', ...more } });

/**
 * Who is asking. Supabase has checked the token's signature before the
 * function runs; what is left to ask is whether it is a signed-in person's
 * (and not the public key every visitor has).
 */
function signedIn(request: Request): boolean {
	const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1];
	const middle = token?.split('.');
	if (middle?.length !== 3) return false;
	try {
		const text = atob(middle[1].replace(/-/g, '+').replace(/_/g, '/'));
		const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(text, (letter) => letter.charCodeAt(0)))) as Record<string, unknown>;
		if (claims.role !== 'authenticated' || typeof claims.sub !== 'string' || !claims.sub) return false;
		return typeof claims.exp !== 'number' || claims.exp * 1000 > Date.now();
	} catch {
		return false;
	}
}

// ---- from USDA's food to ours -----------------------------------------------------

/** Plain text: no control characters, one space between words, not longer than the database takes. */
function clean(text: unknown, max: number): string {
	const plain = String(text ?? '')
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const letters = Array.from(plain);
	return letters.length > max ? letters.slice(0, max).join('').trim() : plain;
}

const shouts = (text: string) => text === text.toUpperCase() && text !== text.toLowerCase();
const capital = (text: string) => text.toLowerCase().replace(/\p{L}/u, (first) => first.toUpperCase());

/** "OATS, ROLLED" -> "Oats, rolled". Branded foods come in capitals; the others do not, and are left alone. */
const ordinary = (text: string) => (shouts(text) ? capital(text) : text);
/** "FOOD CLUB" -> "Food Club" */
const ordinaryBrand = (text: string) =>
	shouts(text)
		? text
				.split(' ')
				// ("S.A." stays as it is; "INC." becomes "Inc.")
				.map((word) => (/\.\p{L}/u.test(word) ? word : capital(word)))
				.join(' ')
		: text;

const round1 = (n: number) => Math.round(n * 10) / 10;

type Nutrient = { nutrientId?: unknown; nutrientNumber?: unknown; unitName?: unknown; value?: unknown };
type Theirs = {
	fdcId?: unknown;
	description?: unknown;
	brandName?: unknown;
	brandOwner?: unknown;
	servingSize?: unknown;
	servingSizeUnit?: unknown;
	householdServingFullText?: unknown;
	gtinUpc?: unknown;
	foodNutrients?: Nutrient[];
};

// Energy in kilocalories, as USDA numbers it: 1008 is "Energy"; foods from
// its own laboratory carry 2047 or 2048 instead (energy worked out from
// protein, fat and carbohydrate by the general or the specific factors).
const ENERGY = [1008, 2047, 2048];

function energy(food: Theirs): number | null {
	const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
	for (const id of ENERGY) {
		const found = nutrients.find((nutrient) => Number(nutrient?.nutrientId) === id && String(nutrient?.unitName ?? '').toUpperCase() === 'KCAL');
		if (found && typeof found.value === 'number' && Number.isFinite(found.value)) return found.value;
	}
	return null;
}

/** One food of theirs as one of ours - or null for a food the diary cannot use (no energy, no name). */
export function fromUsda(food: Theirs | null | undefined): UsdaFood | null {
	if (!food || (typeof food.fdcId !== 'number' && typeof food.fdcId !== 'string')) return null;
	const id = String(food.fdcId);
	const name = ordinary(clean(food.description, 120));
	const kcal = energy(food);
	if (!/^\d{1,64}$/.test(id) || !name || kcal === null || kcal < 0 || kcal > 1000) return null;

	// one serving, when it is given in grams or millilitres (newer records spell them GRM and MLT)
	const unit = String(food.servingSizeUnit ?? '').toLowerCase();
	const size = typeof food.servingSize === 'number' && ['g', 'ml', 'grm', 'mlt'].includes(unit) && food.servingSize > 0 && food.servingSize <= 5000 ? round1(food.servingSize) : null;
	const household = size ? clean(food.householdServingFullText, 60) : '';

	return {
		source: 'usda',
		source_id: id,
		name,
		brand: ordinaryBrand(clean(food.brandName || food.brandOwner, 60)) || null,
		kcal_100g: round1(kcal),
		serving_g: size || null,
		serving_label: household ? (shouts(household) ? household.toLowerCase() : household) : null
	};
}

// ---- the function ------------------------------------------------------------------------

/** A barcode without the zeros in front of it: "0853910006170" and "853910006170" are the same product. */
const bare = (code: string) => code.replace(/^0+/, '');

/**
 * The ways USDA may have written a barcode down: as it was read, and - for
 * the usual US products - as twelve digits (UPC-A) or thirteen (EAN-13, a
 * zero in front). USDA finds a barcode only as it was written down.
 */
export function barcodeForms(code: string): string[] {
	const forms = [code, bare(code).padStart(12, '0'), bare(code).padStart(13, '0'), bare(code)];
	return [...new Set(forms)].filter((form) => form.length >= 8 && form.length <= 14).slice(0, 3);
}

type Asked = { foods: Theirs[] } | { error: Response };

async function askUsda(query: string, kinds: string, size: number, key: string, fetcher: typeof fetch): Promise<Asked> {
	let theirs: Response;
	try {
		// the key goes in a header: an address ends up in logs
		theirs = await fetcher(`${USDA}?query=${encodeURIComponent(query)}&dataType=${kinds}&pageSize=${size}`, {
			headers: { 'X-Api-Key': key, Accept: 'application/json' },
			signal: AbortSignal.timeout(10_000)
		});
	} catch {
		return { error: answer(502, { error: 'usda' }) };
	}
	// Their own words are not passed on: an answer of theirs may name the key.
	if (theirs.status === 429) return { error: answer(429, { error: 'usda is busy' }) };
	if (!theirs.ok) return { error: answer(502, { error: 'usda' }) };
	try {
		const body = (await theirs.json()) as { foods?: Theirs[] };
		return { foods: Array.isArray(body?.foods) ? body.foods : [] };
	} catch {
		return { error: answer(502, { error: 'usda' }) };
	}
}

export async function handle(request: Request, env: Env, fetcher: typeof fetch): Promise<Response> {
	// a browser asks first whether it may ask
	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
	if (request.method !== 'GET') return answer(405, { error: 'method' }, { Allow: 'GET, OPTIONS' });
	if (!signedIn(request)) return answer(401, { error: 'sign in' });

	const params = new URL(request.url).searchParams;
	const gtin = (params.get('gtin') ?? '').trim();
	const q = (params.get('q') ?? '').trim();
	if (gtin ? !/^\d{8,14}$/.test(gtin) : Array.from(q).length < 2 || Array.from(q).length > 80) return answer(400, { error: gtin ? 'gtin' : 'q' });

	const key = (env.USDA_API_KEY ?? '').trim();
	if (!key) return answer(503, { error: 'not set up' });

	// ---- one barcode: USDA's branded foods, the product whose barcode it is, or none
	if (gtin) {
		for (const form of barcodeForms(gtin)) {
			const asked = await askUsda(form, 'Branded', 5, key, fetcher);
			if ('error' in asked) return asked.error;
			const match = asked.foods.find((food) => bare(String(food.gtinUpc ?? '')) === bare(gtin));
			const ours = match ? fromUsda(match) : null;
			if (match) return answer(200, { foods: ours ? [ours] : [], found: true }, { 'Cache-Control': 'private, max-age=86400' });
		}
		return answer(200, { foods: [], found: false }, { 'Cache-Control': 'private, max-age=3600' });
	}

	// ---- words
	const asked = await askUsda(q, 'Foundation,SR%20Legacy,Branded', 20, key, fetcher);
	if ('error' in asked) return asked.error;
	const seen = new Set<string>();
	const foods: UsdaFood[] = [];
	for (const food of asked.foods) {
		const ours = fromUsda(food);
		if (!ours || seen.has(ours.source_id)) continue;
		seen.add(ours.source_id);
		foods.push(ours);
	}
	// the same words give the same foods for a while: the person's own browser may keep the answer for an hour
	return answer(200, { foods }, { 'Cache-Control': 'private, max-age=3600' });
}
