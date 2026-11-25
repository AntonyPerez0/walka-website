// The promises of the database, tried against a real one (see stack.ts).
// Each test is a sentence the site says in public.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { admin, ask, daysAgo, mailFor, open, signIn, stack, walk } from './stack.ts';

test('the sign-in mail carries a six-digit code', async () => {
	const email = `mail-${Date.now()}@example.com`;
	assert.equal((await ask('POST', '/auth/v1/otp', { email, create_user: true })).status, 200);
	const mail = await mailFor(email);
	assert.match(mail.code, /^\d{6}$/);
	assert.match(mail.subject, /Walka sign-in code/);
});

test('nobody signs in with a password: one set for an address is never kept', async () => {
	const email = `password-${Date.now()}@example.com`;
	// somebody else sets a password for the address before its owner comes ...
	await ask('POST', '/auth/v1/signup', { email, password: 'correct horse battery staple' });
	// ... the owner signs in with the code from their mail ...
	await ask('POST', '/auth/v1/otp', { email, create_user: true });
	const { code } = await mailFor(email);
	const owner = await ask('POST', '/auth/v1/verify', { type: 'email', email, token: code });
	assert.equal(owner.status, 200);
	// ... and the password opens nothing.
	const thief = await ask('POST', '/auth/v1/token?grant_type=password', { email, password: 'correct horse battery staple' });
	assert.notEqual(thief.status, 200);
	assert.equal(thief.body.access_token, undefined);
	assert.equal(await admin(`select count(*) from auth.users where email = '${email}' and coalesce(encrypted_password, '') <> ''`), '0');
});

test('a row belongs to one person: another person and a visitor get nothing', async () => {
	const [a, b] = [await signIn('a'), await signIn('b')];
	await open(a, true);
	await open(b, true);
	const mine = await ask('POST', '/rest/v1/walks', walk(daysAgo(2)), a.token);
	assert.equal(mine.status, 201);
	await ask('POST', '/rest/v1/body', { weight_kg: 80, height_cm: 180 }, a.token);
	const id = mine.body[0].id;

	for (const table of ['profiles', 'body', 'walks', 'foods', 'food_entries', 'food_settings']) {
		assert.deepEqual((await ask('GET', `/rest/v1/${table}?select=*`, undefined, b.token)).body.filter((row: any) => row.user_id === a.id), [], `${table}: the other person reads none of it`);
		assert.equal((await ask('GET', `/rest/v1/${table}?select=*`)).status, 401, `${table}: a visitor is refused`);
	}
	assert.deepEqual((await ask('PATCH', `/rest/v1/walks?id=eq.${id}`, { steps: 1 }, b.token)).body, []);
	assert.ok((await ask('POST', '/rest/v1/walks', { ...walk(daysAgo(3)), user_id: a.id }, b.token)).status >= 400, 'a walk cannot be added in another person\'s name');
	assert.equal(await admin(`select count(*) from public.walks where user_id = '${a.id}'`), '1');
	// one's own row cannot be handed to somebody else, nor re-dated
	const moved = await ask('PATCH', `/rest/v1/walks?id=eq.${id}`, { user_id: b.id, updated_at: '2001-01-01T00:00:00Z', created_at: '2001-01-01T00:00:00Z' }, a.token);
	assert.equal(moved.body[0].user_id, a.id);
	assert.ok(moved.body[0].updated_at > '2020', 'updated_at is the database\'s clock');
	assert.ok(moved.body[0].created_at > '2020', 'created_at does not change');
	assert.equal((await ask('GET', `/rest/v1/walks?id=eq.${id}&select=steps`, undefined, a.token)).body[0].steps, 1600);
});

test('a public page shows the name, time and distance - and more only switch by switch', async () => {
	const a = await signIn('public');
	await open(a);
	const name = `p${Date.now().toString(36)}`;
	for (const n of [1, 2, 9]) assert.equal((await ask('POST', '/rest/v1/walks', walk(daysAgo(n)), a.token)).status, 201);
	const see = async () => (await ask('POST', '/rest/v1/rpc/public_profile', { name })).body;

	await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { handle: name, display_name: 'Thrall' }, a.token);
	assert.equal(await see(), null, 'private until made public');

	await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { is_public: true }, a.token);
	const bare = await see();
	assert.deepEqual(Object.keys(bare).sort(), ['days', 'display_name', 'handle', 'totals', 'walks']);
	assert.deepEqual(Object.keys(bare.totals).sort(), ['distance_m', 'seconds', 'walks']);
	assert.equal(bare.days, null);
	assert.equal(bare.walks, null);
	assert.equal(bare.totals.walks, 3);

	await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { show_steps: true, show_days: true, show_walks: true }, a.token);
	const full = await see();
	assert.equal(full.totals.steps, 4800);
	assert.equal(full.days.length, 3);
	assert.deepEqual(Object.keys(full.days[0]).sort(), ['day', 'distance_m', 'seconds', 'steps']);
	assert.deepEqual(Object.keys(full.walks[0]).sort(), ['day', 'distance_m', 'seconds', 'steps']);
	assert.doesNotMatch(JSON.stringify(full), /kcal|weight|height|birth|user_id|email|started_at|origin|client_id/);

	// private again takes everything back at once, and public again comes back bare
	await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { is_public: false }, a.token);
	assert.equal(await see(), null);
	await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { is_public: true }, a.token);
	assert.deepEqual(Object.keys((await see()).totals).sort(), ['distance_m', 'seconds', 'walks']);

	// the site's owner can take a page down; a missing page and a hidden one look the same
	await admin(`select public.hide_profile('${name}', 'a test')`);
	assert.equal(await see(), null);
	assert.ok((await ask('POST', '/rest/v1/rpc/hide_profile', { name, why: 'x' }, a.token)).status >= 400, 'not for a signed-in person to call');
	assert.ok((await ask('POST', '/rest/v1/rpc/show_profile', { name }, a.token)).status >= 400);
	assert.equal(await see(), null);
});

test('names that would pass for the site, or run the wrong way, are not taken', async () => {
	const a = await signIn('names');
	await open(a);
	const set = (change: object) => ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, change, a.token);
	for (const handle of ['walka', 'walka-official', 'w-a-l-k-a', 'wa1ka', 'admin1', '4dm1n', 'support', 'api', 'privacy', 'Thrall', 'ab', 'a b c'])
		assert.notEqual((await set({ handle })).status, 200, `the name "${handle}" must be refused`);
	for (const display_name of ['Walka Team', 'Official Admin', '   ', 'http://x.example', 'Thr‮all', 'Thr​all', '...'])
		assert.notEqual((await set({ display_name })).status, 200, `the shown name ${JSON.stringify(display_name)} must be refused`);
	for (const display_name of ['Thrall', 'Zoë 2', 'Jaina P.', '走る人'])
		assert.equal((await set({ display_name })).status, 200, `the shown name "${display_name}" is fine`);

	// a name that somebody had is not free for the next person at once
	const first = `n${Date.now().toString(36)}`;
	assert.equal((await set({ handle: first })).status, 200);
	assert.equal((await set({ handle: `${first}x` })).status, 200);
	const b = await signIn('names-b');
	await open(b);
	assert.notEqual((await ask('PATCH', `/rest/v1/profiles?user_id=eq.${b.id}`, { handle: first }, b.token)).status, 200);
});

test('"I am 18" comes first, carries the database\'s clock, and is not taken back', async () => {
	const a = await signIn('adult');
	assert.equal((await ask('POST', '/rest/v1/walks', walk(daysAgo(1)), a.token)).status, 400, 'no walk before the tick');
	assert.equal((await ask('POST', '/rest/v1/reports', { handle: 'somebody', why: 'something else' }, a.token)).status, 400, 'no report before the tick');
	const made = await ask('POST', '/rest/v1/profiles', { adult_confirmed_at: '1970-01-01T00:00:00Z' }, a.token);
	assert.ok(made.body[0].adult_confirmed_at > '2020', 'the moment is the database\'s');
	const back = await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { adult_confirmed_at: null }, a.token);
	assert.ok(back.body[0].adult_confirmed_at, 'it is not taken back');
	assert.equal((await ask('POST', '/rest/v1/walks', walk(daysAgo(1)), a.token)).status, 201);
});

test('body numbers and food are kept only with consent, and go when it is taken back', async () => {
	const a = await signIn('consent');
	await open(a);
	const refused = await ask('POST', '/rest/v1/body', { weight_kg: 80 }, a.token);
	assert.equal(refused.status, 400);
	assert.match(refused.body.message, /only after you have agreed/);
	assert.equal((await ask('POST', '/rest/v1/food_entries', { local_day: daysAgo(0).slice(0, 10), name: 'Bread', kcal: 250 }, a.token)).status, 400);

	const agreed = await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { body_food_consent_at: '1999-01-01T00:00:00Z' }, a.token);
	assert.ok(agreed.body[0].body_food_consent_at > '2020', 'the moment is the database\'s');
	assert.equal((await ask('POST', '/rest/v1/body', { weight_kg: 80, height_cm: 180, birth_year: 1990, sex: 'male' }, a.token)).status, 201);
	assert.equal((await ask('POST', '/rest/v1/food_entries', { local_day: daysAgo(0).slice(0, 10), name: 'Bread', kcal: 250 }, a.token)).status, 201);
	assert.equal((await ask('POST', '/rest/v1/foods', { source: 'own', name: 'My bread', kcal_100g: 250 }, a.token)).status, 201);
	assert.equal((await ask('POST', '/rest/v1/food_settings', { goal_balance_kcal: -300 }, a.token)).status, 201);
	assert.equal((await ask('POST', '/rest/v1/walks', walk(daysAgo(1)), a.token)).status, 201);

	await ask('PATCH', `/rest/v1/profiles?user_id=eq.${a.id}`, { body_food_consent_at: null }, a.token);
	const left = await admin(`select (select count(*) from public.body where user_id = '${a.id}') || ' ' || (select count(*) from public.foods where user_id = '${a.id}') || ' ' || (select count(*) from public.food_entries where user_id = '${a.id}') || ' ' || (select count(*) from public.food_settings where user_id = '${a.id}') || ' ' || (select count(*) from public.walks where user_id = '${a.id}')`);
	assert.equal(left, '0 0 0 0 1', 'body, foods, diary and goal are gone; the walk stays');
});

test('Walka is for adults: a year of birth that could be 17 is not taken', async () => {
	const a = await signIn('year');
	await open(a, true);
	const year = new Date().getFullYear();
	assert.equal((await ask('POST', '/rest/v1/body', { birth_year: year - 18 }, a.token)).status, 400);
	assert.equal((await ask('POST', '/rest/v1/body', { birth_year: year - 19 }, a.token)).status, 201);
});

test('a goal is never further than 500 either way, and never below zero for an underweight body', async () => {
	const a = await signIn('goal');
	await open(a, true);
	assert.equal((await ask('POST', '/rest/v1/food_settings', { goal_balance_kcal: -600 }, a.token)).status, 400);
	assert.equal((await ask('POST', '/rest/v1/food_settings', { goal_balance_kcal: -500 }, a.token)).status, 201);
	assert.equal((await ask('POST', '/rest/v1/body', { weight_kg: 50, height_cm: 170 }, a.token)).status, 201); // a body mass index of 17.3
	assert.equal((await ask('GET', '/rest/v1/food_settings?select=goal_balance_kcal', undefined, a.token)).body[0].goal_balance_kcal, 0, 'the goal went back to zero');
	const again = await ask('PATCH', `/rest/v1/food_settings?user_id=eq.${a.id}`, { goal_balance_kcal: -100 }, a.token);
	assert.equal(again.status, 400);
	assert.match(again.body.message, /cannot be below zero/);
});

test('one walk is one start second, whatever road it came by', async () => {
	const a = await signIn('once');
	await open(a);
	const start = daysAgo(4);
	const add = (row: object) => ask('POST', '/rest/v1/walks?on_conflict=user_id,start_key', row, a.token, { prefer: 'resolution=ignore-duplicates,return=representation' });
	assert.equal((await add(walk(start, { origin: 'walka', client_id: '20261116-100000' }))).body.length, 1, 'sent by the desktop program');
	assert.equal((await add(walk(start, { origin: 'walka', client_id: '20261116-100000' }))).body.length, 0, 'sent again');
	assert.equal((await add(walk(start, { origin: 'file', client_id: start }))).body.length, 0, 'read from a TCX export of it');
	assert.equal((await ask('POST', '/rest/v1/walks', walk(start, { origin: 'web', client_id: 'by-hand' }), a.token)).status, 409, 'typed in for the same second');
	assert.equal((await ask('GET', '/rest/v1/walks?select=id', undefined, a.token)).body.length, 1);
});

test('a deleted walk is emptied, stays deleted, and does not come back', async () => {
	const a = await signIn('deleted');
	await open(a);
	const start = daysAgo(5);
	const row = (await ask('POST', '/rest/v1/walks', walk(start, { session: 'free', steps_source: 'estimate' }), a.token)).body[0];
	assert.equal((await ask('DELETE', `/rest/v1/walks?id=eq.${row.id}`, undefined, a.token)).status, 403, 'there is no removing, only marking');
	const marked = (await ask('PATCH', `/rest/v1/walks?id=eq.${row.id}`, { deleted_at: new Date().toISOString() }, a.token)).body[0];
	assert.deepEqual([marked.seconds, marked.distance_m, marked.steps, marked.kcal, marked.session, marked.steps_source], [0, 0, 0, 0, null, null]);
	// another device, which never heard of it, sends its old copy
	const old = await ask('PATCH', `/rest/v1/walks?id=eq.${row.id}`, { deleted_at: null, steps: 1600 }, a.token);
	assert.ok(old.body[0].deleted_at, 'deleted stays deleted');
	assert.deepEqual([old.body[0].steps, old.body[0].seconds, old.body[0].kcal], [0, 0, 0], 'and stays empty: the old numbers are not kept again');
	const again = await ask('POST', '/rest/v1/walks?on_conflict=user_id,start_key', walk(start), a.token, { prefer: 'resolution=ignore-duplicates,return=representation' });
	assert.equal(again.body.length, 0, 'the same walk sent again does not bring it back');
});

test('what Walka really records is taken; what cannot be true is refused', async () => {
	const a = await signIn('walks');
	await open(a);
	const add = (more: object, at = daysAgo(6)) => ask('POST', '/rest/v1/walks', walk(at, more), a.token);
	assert.equal((await add({ session: 'free', seconds: 1799.4, kcal_extra: 41.2, steps_source: 'treadmill', distance_source: 'speed', calories_source: 'speed' })).status, 201);
	assert.equal((await add({ seconds: 99999 }, daysAgo(7))).status, 400, 'longer than a day');
	assert.equal((await add({ seconds: 3000 }, daysAgo(8))).status, 400, 'the belt moved longer than the walk lasted');
	assert.equal((await add({}, new Date(Date.now() + 10 * 86_400_000).toISOString())).status, 400, 'in the days to come');
	assert.equal((await add({}, '1995-01-01T10:00:00Z')).status, 400, 'long before Walka');
	assert.equal((await add({ steps: 'NaN' }, daysAgo(9))).status, 400);
	assert.equal((await add({ treadmill: 'UREVO' }, daysAgo(10))).status, 400, 'a field the database does not keep');
});

test('a food from a source is kept once, and a diary entry points only at one\'s own food', async () => {
	const [a, b] = [await signIn('food-a'), await signIn('food-b')];
	await open(a, true);
	await open(b, true);
	const food = { source: 'off', source_id: '3017620422003', name: 'Hazelnut spread', kcal_100g: 539 };
	const first = await ask('POST', '/rest/v1/foods', food, a.token);
	assert.equal(first.status, 201);
	const second = await ask('POST', '/rest/v1/foods?on_conflict=user_id,source,source_id', { ...food, id: crypto.randomUUID(), name: 'Hazelnut spread, again' }, a.token, { prefer: 'resolution=merge-duplicates,return=representation' });
	assert.equal(second.body[0].id, first.body[0].id, 'the row that was there first keeps its id');
	const entry = await ask('POST', '/rest/v1/food_entries', { local_day: daysAgo(0).slice(0, 10), name: 'Spread', kcal: 80, food_id: first.body[0].id }, b.token);
	assert.equal(entry.body[0].food_id, null, 'another person\'s food is not linked');
	assert.equal((await ask('POST', '/rest/v1/food_entries', { local_day: '2031-01-01', name: 'Later', kcal: 80 }, b.token)).status, 400, 'not for a day to come');
});

test('the account holds only so much', async () => {
	const a = await signIn('limits');
	await open(a);
	const reports = Array.from({ length: 21 }, () => ({ handle: 'somebody', why: 'something else' }));
	assert.equal((await ask('POST', '/rest/v1/reports', reports, a.token)).status, 400, 'more than there is room for, in one go');
	assert.equal((await ask('POST', '/rest/v1/reports', reports.slice(0, 20), a.token)).status, 201);
	assert.equal((await ask('POST', '/rest/v1/reports', reports.slice(0, 1), a.token)).status, 400);
	assert.equal((await ask('PUT', '/auth/v1/user', { data: { note: 'x'.repeat(20_000) } }, a.token)).status >= 400, true, 'no large notes with the sign-in');
});

test('deleting the account deletes everything, the sign-in and its log', async () => {
	const a = await signIn('gone');
	await open(a, true);
	await ask('POST', '/rest/v1/walks', walk(daysAgo(1)), a.token);
	await ask('POST', '/rest/v1/body', { weight_kg: 80 }, a.token);
	assert.equal((await ask('POST', '/rest/v1/rpc/delete_my_account', {})).status, 401, 'not for a visitor');
	assert.equal((await ask('POST', '/rest/v1/rpc/delete_my_account', {}, a.token)).status, 204);
	const left = await admin(`select (select count(*) from auth.users where id = '${a.id}') + (select count(*) from public.profiles where user_id = '${a.id}') + (select count(*) from public.walks where user_id = '${a.id}') + (select count(*) from public.body where user_id = '${a.id}') + (select count(*) from auth.audit_log_entries where payload::text like '%${a.id}%' or payload::text ilike '%${a.email}%') + (select count(*) from auth.flow_state where user_id = '${a.id}') + (select count(*) from auth.identities where user_id = '${a.id}') + (select count(*) from auth.sessions where user_id = '${a.id}')`);
	assert.equal(left, '0');
});

test('a visitor reaches three functions and nothing else; a table added later is closed', async () => {
	assert.equal((await ask('POST', '/rest/v1/rpc/ping', {})).body, 'pong');
	assert.equal((await ask('POST', '/rest/v1/rpc/schema_version', {})).body, 1);
	for (const helper of ['touch_updated_at', 'limit_rows', 'stamp_consents', 'guard_sign_in', 'show_profile'])
		assert.equal((await ask('POST', `/rest/v1/rpc/${helper}`, {})).status, 404, `${helper} is not for calling`);
	const open = await admin(`begin; create table public.later (x int); select has_table_privilege('anon', 'public.later', 'select') or has_table_privilege('authenticated', 'public.later', 'select'); rollback;`);
	assert.match(open, /\bf\b/);
	assert.ok(stack().PUBLISHABLE_KEY.startsWith('sb_publishable_'));
});

test('many walks are deleted at once - one\'s own, and nobody else\'s', async () => {
	const a = await signIn('many');
	const b = await signIn('bystander');
	await open(a);
	await open(b);
	const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
	const theirs = crypto.randomUUID();
	for (const [n, id] of ids.entries()) assert.equal((await ask('POST', '/rest/v1/walks', { ...walk(daysAgo(n + 1)), id }, a.token)).status, 201);
	assert.equal((await ask('POST', '/rest/v1/walks', { ...walk(daysAgo(1)), id: theirs }, b.token)).status, 201);
	const marked = await ask('PATCH', `/rest/v1/walks?id=in.(${ids[0]},${ids[1]},${theirs})&deleted_at=is.null&select=id`, { deleted_at: new Date().toISOString() }, a.token);
	assert.equal(marked.status, 200);
	assert.deepEqual(marked.body.map((row: { id: string }) => row.id).sort(), [ids[0], ids[1]].sort(), 'the other person\'s walk is not among them');
	assert.equal(await admin(`select count(*) from public.walks where id = '${theirs}' and deleted_at is null`), '1');
	assert.equal(await admin(`select count(*) from public.walks where id = '${ids[2]}' and deleted_at is null`), '1', 'one not asked for stays');
	const again = await ask('PATCH', `/rest/v1/walks?id=in.(${ids[0]})&deleted_at=is.null&select=id`, { deleted_at: new Date().toISOString() }, a.token);
	assert.deepEqual(again.body, [], 'deleted already: not counted twice');
});

test('a person sees where they are signed in, and can end a sign-in - their own only', async () => {
	// one person, signed in twice (as two browsers, or a browser and Walka)
	const email = `twice-${Date.now()}@example.com`;
	const signInOnce = async (before?: string) => {
		await ask('POST', '/auth/v1/otp', { email, create_user: true });
		let code = '';
		for (let tries = 0; tries < 40 && (!code || code === before); tries++) {
			code = (await mailFor(email)).code;
			if (code === before) await new Promise((done) => setTimeout(done, 250));
		}
		const session = await ask('POST', '/auth/v1/verify', { type: 'email', email, token: code }, undefined, { 'user-agent': before ? 'Walka/0.8.0' : 'TestBrowser/1' });
		assert.equal(session.status, 200, JSON.stringify(session.body));
		return { code, token: session.body.access_token as string, refresh: session.body.refresh_token as string };
	};
	const first = await signInOnce();
	const second = await signInOnce(first.code);
	const stranger = await signIn('stranger');

	assert.notEqual((await ask('POST', '/rest/v1/rpc/my_sign_ins', {})).status, 200, 'not for a visitor');
	const mine = await ask('POST', '/rest/v1/rpc/my_sign_ins', {}, second.token);
	assert.equal(mine.status, 200);
	assert.equal(mine.body.length, 2);
	assert.equal(mine.body.filter((one: { this_one: boolean }) => one.this_one).length, 1, 'the one asking is marked');
	assert.ok(mine.body.some((one: { user_agent: string }) => one.user_agent === 'Walka/0.8.0'), 'what it calls itself');
	assert.ok(mine.body.every((one: { began_at: string; renewed_at: string }) => !Number.isNaN(Date.parse(one.began_at)) && !Number.isNaN(Date.parse(one.renewed_at))));
	const theirs = await ask('POST', '/rest/v1/rpc/my_sign_ins', {}, stranger.token);
	assert.equal(theirs.body.length, 1, 'another person sees only their own');

	const firstId = mine.body.find((one: { this_one: boolean }) => !one.this_one).id;
	assert.equal((await ask('POST', '/rest/v1/rpc/end_sign_in', { sign_in: firstId }, stranger.token)).body, false, 'nobody ends another person\'s sign-in');
	assert.equal((await ask('POST', '/rest/v1/rpc/end_sign_in', { sign_in: firstId })).status === 200, false, 'nor a visitor');
	assert.equal((await ask('POST', '/rest/v1/rpc/end_sign_in', { sign_in: firstId }, second.token)).body, true);
	assert.equal((await ask('POST', '/rest/v1/rpc/my_sign_ins', {}, second.token)).body.length, 1);
	const renewed = await ask('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: first.refresh });
	assert.equal(renewed.status, 400, 'the ended sign-in cannot be renewed: Walka says it is no longer signed in');
	assert.match(String(renewed.body.error_code ?? renewed.body.code), /refresh_token_not_found|session_not_found/);
	assert.equal((await ask('POST', '/rest/v1/rpc/schema_version', {})).body, 1, 'and the schema version is what every Walka knows');
});
