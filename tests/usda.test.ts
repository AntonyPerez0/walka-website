// The "usda" function (supabase/functions/usda), tried under Node with a
// made-up fetch: nothing here asks USDA.
//
//   node --test tests/usda.test.ts

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fromUsda, handle } from '../supabase/functions/usda/handle.ts';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

const KEY = 'a-key-that-must-stay-on-the-server';

/** A token as Supabase signs one for a signed-in person. (The function does not check the signature: Supabase has.) */
function token(claims: Record<string, unknown> = {}): string {
	const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
	const body = { role: 'authenticated', sub: '5d0f3e5c-9a43-4a5e-8f0a-2c1a6b7d8e9f', exp: Math.floor(Date.now() / 1000) + 3600, ...claims };
	return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(body)}.not-checked-here`;
}

const ask = (q: string | null, more: { method?: string; authorization?: string | null } = {}) =>
	new Request(`https://project.supabase.co/functions/v1/usda${q === null ? '' : `?q=${encodeURIComponent(q)}`}`, {
		method: more.method ?? 'GET',
		headers: more.authorization === null ? {} : { authorization: more.authorization ?? `Bearer ${token()}`, apikey: 'sb_publishable_public' }
	});

/** A fetch that answers with what it is given, and remembers what it was asked. */
function usda(status = 200, body = fixture('usda-search-oats.json')) {
	const asked: { url: string; headers: Headers }[] = [];
	const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
		asked.push({ url: String(input), headers: new Headers(init?.headers) });
		return new Response(body, { status, headers: { 'content-type': 'application/json' } });
	}) as typeof fetch;
	return { asked, fetcher };
}

test('a browser may ask: OPTIONS is answered with the CORS headers, and nothing else is done', async () => {
	const { asked, fetcher } = usda();
	const answer = await handle(ask('oats', { method: 'OPTIONS', authorization: null }), { USDA_API_KEY: KEY }, fetcher);
	assert.equal(answer.status, 204);
	assert.equal(answer.headers.get('access-control-allow-origin'), '*');
	assert.deepEqual(answer.headers.get('access-control-allow-headers')!.split(/,\s*/).sort(), ['apikey', 'authorization', 'content-type']);
	assert.deepEqual(answer.headers.get('access-control-allow-methods')!.split(/,\s*/).sort(), ['GET', 'OPTIONS']);
	assert.equal(asked.length, 0);
});

test('only GET', async () => {
	const { asked, fetcher } = usda();
	for (const method of ['POST', 'PUT', 'DELETE']) {
		const answer = await handle(ask('oats', { method }), { USDA_API_KEY: KEY }, fetcher);
		assert.equal(answer.status, 405, method);
		assert.equal(answer.headers.get('access-control-allow-origin'), '*');
	}
	assert.equal(asked.length, 0);
});

test('only for a signed-in person: anything else is 401, and USDA is not asked', async () => {
	const { asked, fetcher } = usda();
	const refused = {
		'no token at all': null,
		'the public key every visitor has': 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
		'a visitor\'s token': `Bearer ${token({ role: 'anon', sub: undefined })}`,
		'a token of the service itself': `Bearer ${token({ role: 'service_role' })}`,
		'a token that names nobody': `Bearer ${token({ sub: '' })}`,
		'a token that has run out': `Bearer ${token({ exp: Math.floor(Date.now() / 1000) - 60 })}`,
		'not a token': 'Bearer a.b.c',
		'another scheme': `Basic ${token()}`
	};
	for (const [what, authorization] of Object.entries(refused)) {
		const answer = await handle(ask('oats', { authorization }), { USDA_API_KEY: KEY }, fetcher);
		assert.equal(answer.status, 401, what);
		assert.equal(answer.headers.get('access-control-allow-origin'), '*', 'a browser can read the refusal');
	}
	assert.equal(asked.length, 0);
});

test('q is 2 to 80 characters after trimming, else 400', async () => {
	const { asked, fetcher } = usda();
	for (const q of [null, '', ' ', 'a', '  a  ', 'x'.repeat(81)]) assert.equal((await handle(ask(q), { USDA_API_KEY: KEY }, fetcher)).status, 400, JSON.stringify(q));
	assert.equal(asked.length, 0);
	for (const q of ['ab', 'x'.repeat(80), `  ${'x'.repeat(80)}  `, 'crème brûlée']) assert.equal((await handle(ask(q), { USDA_API_KEY: KEY }, fetcher)).status, 200, JSON.stringify(q));
});

test('without a key it says "not set up", and asks nobody', async () => {
	const { asked, fetcher } = usda();
	for (const env of [{}, { USDA_API_KEY: '' }, { USDA_API_KEY: '  ' }]) {
		const answer = await handle(ask('oats'), env, fetcher);
		assert.equal(answer.status, 503);
		assert.deepEqual(await answer.json(), { error: 'not set up' });
	}
	assert.equal(asked.length, 0);
});

test('it asks USDA once, with the key in a header and never in the address', async () => {
	const { asked, fetcher } = usda();
	const answer = await handle(ask('  rolled oats & honey '), { USDA_API_KEY: KEY }, fetcher);
	assert.equal(answer.status, 200);
	assert.equal(asked.length, 1);
	assert.equal(asked[0].url, 'https://api.nal.usda.gov/fdc/v1/foods/search?query=rolled%20oats%20%26%20honey&dataType=Foundation,SR%20Legacy,Branded&pageSize=20');
	assert.equal(asked[0].headers.get('x-api-key'), KEY);
	assert.ok(!asked[0].url.includes(KEY));
	assert.equal(asked[0].headers.get('authorization'), null, 'the person\'s token is not passed on to USDA');
});

test('each food comes back in the site\'s own shape: a name, a maker, calories, one serving - and no other nutrient', async () => {
	const { fetcher } = usda();
	const answer = await handle(ask('oats'), { USDA_API_KEY: KEY }, fetcher);
	assert.equal(answer.status, 200);
	assert.equal(answer.headers.get('cache-control'), 'private, max-age=3600');
	assert.match(answer.headers.get('content-type')!, /^application\/json/);
	assert.equal(answer.headers.get('access-control-allow-origin'), '*');
	const text = await answer.text();
	const { foods } = JSON.parse(text);

	assert.deepEqual(foods, [
		// from USDA's own laboratory: no "Energy" (1008), so the energy by the general factors (2047)
		{ source: 'usda', source_id: '2346396', name: 'Oats, whole grain, rolled, old fashioned', brand: null, kcal_100g: 382, serving_g: null, serving_label: null },
		// the older tables: "Energy" in kcal (the same in kJ is not taken for it)
		{ source: 'usda', source_id: '173904', name: 'Cereals, oats, regular and quick, not fortified, dry', brand: null, kcal_100g: 379, serving_g: null, serving_label: null },
		// a packet from a shop: capitals made ordinary, the brand's name before its owner's, a serving in grams
		{ source: 'usda', source_id: '1889717', name: 'Oats', brand: 'Food Club', kcal_100g: 375, serving_g: 40, serving_label: '0.5 cup' },
		// no brand name: the owner's; grams spelled GRM
		{ source: 'usda', source_id: '2472891', name: 'Quick 1-minute oats', brand: 'The Quaker Oats Company', kcal_100g: 375, serving_g: 40, serving_label: '1/2 cup dry' },
		// a drink: millilitres
		{ source: 'usda', source_id: '2099123', name: 'Original oat milk', brand: 'Oatly!', kcal_100g: 50, serving_g: 240, serving_label: '1 cup' },
		// (2261420 has no energy in kcal, and is left out)
		{ source: 'usda', source_id: '2015943', name: 'Oats & honey granola bars', brand: 'General Mills Sales Inc.', kcal_100g: 452, serving_g: 42, serving_label: null }
	]);
	for (const food of foods) assert.deepEqual(Object.keys(food).sort(), ['brand', 'kcal_100g', 'name', 'serving_g', 'serving_label', 'source', 'source_id']);
	assert.doesNotMatch(text, /protein|lipid|carbohydrate|nutrient|ingredients|gtin|13\.5|5\.89/i);
	assert.ok(!text.includes(KEY));
});

test('which energy: 1008, else 2047, else 2048 - in kcal, and nothing else', () => {
	const food = (foodNutrients: object[]) => fromUsda({ fdcId: 1, description: 'Food', foodNutrients });
	const kcal = (nutrientId: number, value: number, unitName = 'KCAL') => ({ nutrientId, nutrientNumber: String(nutrientId), unitName, value });
	assert.equal(food([kcal(2048, 3), kcal(2047, 2), kcal(1008, 1)])?.kcal_100g, 1);
	assert.equal(food([kcal(2048, 3), kcal(2047, 2)])?.kcal_100g, 2);
	assert.equal(food([kcal(2048, 3)])?.kcal_100g, 3);
	assert.equal(food([kcal(1008, 1590, 'kJ'), kcal(2047, 380)])?.kcal_100g, 380, 'a number in kJ is not the kcal');
	assert.equal(food([kcal(1008, 380.04, 'kcal')])?.kcal_100g, 380, 'to one decimal, whatever the capitals of the unit');
	assert.equal(food([kcal(1062, 1590, 'kJ')]), null);
	assert.equal(food([kcal(1003, 12)]), null);
	assert.equal(food([]), null);
	assert.equal(food([kcal(1008, 0)])?.kcal_100g, 0, 'water has an energy: none');
	assert.equal(food([kcal(1008, 4000)]), null, 'more than a food can hold is a slip in their tables');
	assert.equal(fromUsda({ description: 'No id', foodNutrients: [kcal(1008, 1)] }), null);
	assert.equal(fromUsda({ fdcId: 2, description: '  ', foodNutrients: [kcal(1008, 1)] }), null);
	// a serving only in grams or millilitres
	assert.equal(fromUsda({ fdcId: 3, description: 'Food', servingSize: 1, servingSizeUnit: 'oz', householdServingFullText: '1 oz', foodNutrients: [kcal(1008, 1)] })?.serving_g, null);
	assert.equal(fromUsda({ fdcId: 3, description: 'Food', servingSize: 1, servingSizeUnit: 'oz', householdServingFullText: '1 oz', foodNutrients: [kcal(1008, 1)] })?.serving_label, null);
	assert.equal(fromUsda({ fdcId: 4, description: 'Food', servingSize: 30, servingSizeUnit: 'MLT', foodNutrients: [kcal(1008, 1)] })?.serving_g, 30);
	// what the database would refuse is cut to what it takes
	const long = fromUsda({ fdcId: 5, description: 'x'.repeat(300), brandOwner: 'y'.repeat(300), foodNutrients: [kcal(1008, 1)] })!;
	assert.equal(long.name.length, 120);
	assert.equal(long.brand!.length, 60);
	assert.equal(fromUsda({ fdcId: 6, description: 'Tab\there\u0000', foodNutrients: [kcal(1008, 1)] })?.name, 'Tab here');
});

test('when USDA says "too many", so does the function - without USDA\'s own words', async () => {
	const { fetcher } = usda(429, fixture('usda-429.json'));
	const answer = await handle(ask('oats'), { USDA_API_KEY: KEY }, fetcher);
	assert.equal(answer.status, 429);
	const text = await answer.text();
	assert.doesNotMatch(text, /OVER_RATE_LIMIT|api\.nal\.usda\.gov|contact us/);
	assert.equal(answer.headers.get('cache-control'), null, 'a refusal is not kept');
});

test('any other failure is 502 "usda", and what USDA said stays here', async () => {
	// their answer to a bad key names the key: it must not travel on
	const theirs = JSON.stringify({ error: { code: 'API_KEY_INVALID', message: `An invalid api_key was supplied: ${KEY}` } });
	for (const status of [400, 403, 404, 500, 503]) {
		const answer = await handle(ask('oats'), { USDA_API_KEY: KEY }, usda(status, theirs).fetcher);
		assert.equal(answer.status, 502, String(status));
		const text = await answer.text();
		assert.deepEqual(JSON.parse(text), { error: 'usda' });
		assert.ok(!text.includes(KEY));
	}
	// an answer that is not what it should be
	assert.equal((await handle(ask('oats'), { USDA_API_KEY: KEY }, usda(200, '<html>down for maintenance</html>').fetcher)).status, 502);
	assert.deepEqual(await (await handle(ask('oats'), { USDA_API_KEY: KEY }, usda(200, '{"foods":null}').fetcher)).json(), { foods: [] });
	// no answer at all
	const silent = (async () => {
		throw new TypeError(`fetch failed for a request with the key ${KEY}`);
	}) as typeof fetch;
	const answer = await handle(ask('oats'), { USDA_API_KEY: KEY }, silent);
	assert.equal(answer.status, 502);
	assert.ok(!(await answer.text()).includes(KEY));
});

test('the function file that Deno runs only hands the request over', () => {
	const index = readFileSync(new URL('../supabase/functions/usda/index.ts', import.meta.url), 'utf8');
	assert.match(index, /Deno\.serve\(/);
	assert.match(index, /Deno\.env\.get\('USDA_API_KEY'\)/);
	assert.doesNotMatch(index, /console\./, 'nothing is written to a log');
	assert.doesNotMatch(readFileSync(new URL('../supabase/functions/usda/handle.ts', import.meta.url), 'utf8'), /console\.|Deno\.\w/, 'no log, and nothing that only Deno has');
});
