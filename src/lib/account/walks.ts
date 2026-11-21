// The walks in an account, and the public page: every question this part
// of the site asks the database, and everything it sends, is in this file.
//
// The rules it keeps (docs/data-model.md):
//   - a walk is added so that sending it twice changes nothing: one walk is
//     one start second in one account, and the database says which of the
//     rows sent were new;
//   - the site makes up a row's id itself, and names every column it sends
//     and reads; the database fills in the owner and its own clock;
//   - "delete" marks a row, and a marked row stays deleted;
//   - what a public page shows comes from public_profile(), and from
//     nowhere else.

import { say } from './account.svelte.ts';
import { database, within } from './client.ts';
import { ACCOUNTS } from './config.ts';
import { localDay, shiftDay } from './format.ts';
import type { NewWalk, PublicProfile, Walk } from './types.ts';

/** How long a question may take before the page says that there is no answer. */
const WAIT = 15_000;
/** The list shows this many walks, and then this many more. */
export const AT_A_TIME = 50;
/** The database gives at most this many rows to one question. */
const THOUSAND = 1000;
/** An account holds at most this many walks (the database's limit). */
const MOST = 20_000;
/** Walks are sent this many at a time. */
const BATCH = 200;

// ---- reading ---------------------------------------------------------------

const LISTED = 'id,origin,client_id,started_at,ended_at,local_day,utc_offset_min,seconds,distance_m,steps,kcal,kcal_extra,session,steps_source,distance_source,calories_source';

/** A walk as the list shows it. */
export type ListedWalk = Pick<
	Walk,
	| 'id'
	| 'origin'
	| 'client_id'
	| 'started_at'
	| 'ended_at'
	| 'local_day'
	| 'utc_offset_min'
	| 'seconds'
	| 'distance_m'
	| 'steps'
	| 'kcal'
	| 'kcal_extra'
	| 'session'
	| 'steps_source'
	| 'distance_source'
	| 'calories_source'
>;

/**
 * The walks, newest first, 50 at a time, without the deleted ones.
 * `before` is the start of the last walk the page has: the next 50 are the
 * ones before it. (A start is a walk's own, so nothing is skipped or shown
 * twice when walks are added or deleted in between.)
 */
export async function list(before?: string): Promise<{ walks: ListedWalk[]; more: boolean }> {
	const db = await database();
	let question = db.from('walks').select(LISTED).is('deleted_at', null);
	if (before) question = question.lt('started_at', before);
	// (one more than is shown: so the page knows whether to offer more)
	const { data, error } = await within(WAIT, question.order('started_at', { ascending: false }).limit(AT_A_TIME + 1));
	if (error) throw error;
	const walks = (data ?? []) as ListedWalk[];
	return { walks: walks.slice(0, AT_A_TIME), more: walks.length > AT_A_TIME };
}

/** What the totals are added up from: a walk's day and its numbers. */
export type Counted = Pick<Walk, 'id' | 'local_day' | 'seconds' | 'distance_m' | 'steps' | 'kcal'>;

/** Every walk of the account that is not deleted, as few numbers each, fetched a thousand at a time. */
export async function everyWalk(): Promise<Counted[]> {
	const db = await database();
	const all: Counted[] = [];
	for (let from = 0; from < MOST; from += THOUSAND) {
		const { data, error } = await within(
			WAIT,
			db
				.from('walks')
				.select('id,local_day,seconds,distance_m,steps,kcal')
				.is('deleted_at', null)
				// (an order that is the same every time, so that no page of it skips a row)
				.order('started_at', { ascending: false })
				.order('id')
				.range(from, from + THOUSAND - 1)
		);
		if (error) throw error;
		all.push(...((data ?? []) as Counted[]));
		if (!data || data.length < THOUSAND) break;
	}
	return all;
}

export type Totals = { walks: number; seconds: number; distance_m: number; steps: number; kcal: number };
export type AllTotals = { all: Totals; month: Totals; week: Totals };

/**
 * All time, the last 30 days and the last 7 - today and the days before
 * it, by the day each walk counts for. `except`: walks that are on their
 * way out (deleted on the page, with "Undo" still showing).
 */
export function totals(walks: Counted[], except: ReadonlySet<string> = new Set(), today: string = localDay()): AllTotals {
	const none = (): Totals => ({ walks: 0, seconds: 0, distance_m: 0, steps: 0, kcal: 0 });
	const sums: AllTotals = { all: none(), month: none(), week: none() };
	const monthFrom = shiftDay(today, -29);
	const weekFrom = shiftDay(today, -6);
	const add = (to: Totals, walk: Counted) => {
		to.walks += 1;
		to.seconds += walk.seconds;
		to.distance_m += walk.distance_m;
		to.steps += walk.steps;
		to.kcal += walk.kcal;
	};
	for (const walk of walks) {
		if (except.has(walk.id)) continue;
		add(sums.all, walk);
		// (days are written year first, so they sort as text)
		if (walk.local_day >= monthFrom) add(sums.month, walk);
		if (walk.local_day >= weekFrom) add(sums.week, walk);
	}
	return sums;
}

// ---- adding ------------------------------------------------------------------

/** Every row of a batch must have the same fields: these, and what a walk does not say is sent as empty. */
function row(walk: NewWalk) {
	return {
		// the row's id is made up here, before the database has heard of the walk
		id: walk.id ?? crypto.randomUUID(),
		origin: walk.origin,
		client_id: walk.client_id,
		started_at: walk.started_at,
		ended_at: walk.ended_at,
		local_day: walk.local_day,
		utc_offset_min: walk.utc_offset_min ?? null,
		seconds: walk.seconds,
		distance_m: walk.distance_m,
		steps: walk.steps,
		kcal: walk.kcal,
		kcal_extra: walk.kcal_extra ?? null,
		session: walk.session ?? null,
		steps_source: walk.steps_source ?? null,
		distance_source: walk.distance_source ?? null,
		calories_source: walk.calories_source ?? null
	};
}

type Failure = { code?: string; message?: string };

/**
 * Did the database look at the row and say no (a number out of range, the
 * account full)? Then sending it again will not help. Anything else - no
 * connection, no answer, signed out - says nothing about the row.
 */
function refusal(error: Failure): boolean {
	const code = String(error.code ?? '');
	// 22...: a value that cannot be; 23...: a rule of the table - unless it is about the account, not the row.
	return /^(22|23)/.test(code) && !gone(error);
}

/**
 * The account is not there (any more). A walk sent to an account that was
 * deleted - on another device, say - is answered with 23514 and "Walka is
 * for adults.": the rule that asks for the first step finds no profile. (On
 * this site nobody gets as far as sending a walk without that step, so here
 * the answer means only this.) 23503 says the same when a profile is written.
 */
function gone(error: Failure): boolean {
	return error.code === '23503' || (error.code === '23514' && /for adults/i.test(error.message ?? ''));
}

/** Why the database would not go on, in plain words. */
function stopped(error: Failure): string {
	if (gone(error)) return 'This account is not there any more. Sign in again.';
	return say(error);
}

/** A walk typed in on the site, as a row to add. */
export function byHand(typed: { start: Date; day: string; seconds: number; distance_m: number; steps: number; kcal: number }): NewWalk {
	return {
		id: crypto.randomUUID(),
		origin: 'web',
		// the site's own name for it: there is no file and no program behind it
		client_id: crypto.randomUUID(),
		started_at: typed.start.toISOString(),
		ended_at: new Date(typed.start.getTime() + typed.seconds * 1000).toISOString(),
		local_day: typed.day,
		// how far this computer's clock was ahead of UTC at that moment
		utc_offset_min: -typed.start.getTimezoneOffset(),
		seconds: typed.seconds,
		distance_m: typed.distance_m,
		steps: typed.steps,
		kcal: typed.kcal
		// (how the numbers were come by is not said: they were typed)
	};
}

/**
 * Adds one walk that was typed in. It is sent the way every walk is, so
 * that one start second stays one walk: the row comes back if it was
 * added. If it does not, a walk that starts in the same second is there
 * already - and the answer says so in plain words, also when that walk
 * was deleted, and so cannot be seen.
 */
export async function addOne(walk: NewWalk): Promise<{ added: ListedWalk } | { refused: string }> {
	try {
		const db = await database();
		const { data, error } = await within(WAIT, db.from('walks').upsert(row(walk), { onConflict: 'user_id,start_key', ignoreDuplicates: true }).select(LISTED));
		if (error) return { refused: refusal(error) ? say(error) : stopped(error) };
		const added = (data ?? []) as ListedWalk[];
		if (added.length) return { added: added[0] };

		const second = startSecond(walk) * 1000;
		const there = await within(
			WAIT,
			db
				.from('walks')
				.select('deleted_at')
				.gte('started_at', new Date(second).toISOString())
				.lt('started_at', new Date(second + 1000).toISOString())
				.maybeSingle()
		);
		if (there.data?.deleted_at)
			return { refused: 'A walk that started at that moment was deleted here, and a deleted walk stays deleted. Change the time by a minute to add this one.' };
		return { refused: 'There is already a walk that starts at that moment.' };
	} catch (error) {
		return { refused: say(error) };
	}
}

/** The second a walk starts in: what makes it one walk and not another. */
export const startSecond = (walk: Pick<Walk, 'started_at'>) => Math.floor(Date.parse(walk.started_at) / 1000);

/**
 * Of walks read from files, the ones this account has already - by the
 * second they start in - and of those, the ones that were deleted here (a
 * deleted walk is still there, as a marker, and is not added again).
 */
export async function alreadyHere(walks: NewWalk[]): Promise<{ here: Set<number>; deleted: Set<number> }> {
	const here = new Set<number>();
	const deleted = new Set<number>();
	if (!walks.length) return { here, deleted };
	const wanted = new Set(walks.map(startSecond));
	const first = Math.min(...wanted);
	const last = Math.max(...wanted);
	const db = await database();
	for (let from = 0; from < MOST; from += THOUSAND) {
		const { data, error } = await within(
			WAIT,
			db
				.from('walks')
				.select('started_at,deleted_at')
				.gte('started_at', new Date(first * 1000).toISOString())
				.lt('started_at', new Date((last + 1) * 1000).toISOString())
				.order('started_at')
				.range(from, from + THOUSAND - 1)
		);
		if (error) throw error;
		for (const found of (data ?? []) as Pick<Walk, 'started_at' | 'deleted_at'>[]) {
			const second = startSecond(found);
			if (!wanted.has(second)) continue;
			here.add(second);
			if (found.deleted_at) deleted.add(second);
		}
		if (!data || data.length < THOUSAND) break;
	}
	return { here, deleted };
}

export type Added = {
	/** how many were new, and are in the account now */
	added: number;
	/** how many the account had already: nothing changed for them */
	here: number;
	/** the ones the database would not take, each with the reason */
	refused: { walk: NewWalk; why: string }[];
	/** how many were not sent at all, because the database stopped answering - and what it said last */
	unsent: number;
	stopped: string | null;
};

/**
 * Adds walks read from files, 200 at a time, so that sending the same file
 * twice changes nothing. The rows that come back were added; the others
 * were there already. A batch is all or nothing: if one is refused, its
 * rows are sent one by one, and the refused ones are set aside with the
 * reason - they are not tried again.
 */
export async function addMany(walks: NewWalk[]): Promise<Added> {
	const result: Added = { added: 0, here: 0, refused: [], unsent: 0, stopped: null };
	const db = await database();
	const send = async (rows: ReturnType<typeof row>[]): Promise<{ added: number } | { error: Failure }> => {
		try {
			const { data, error } = await within(WAIT, db.from('walks').upsert(rows, { onConflict: 'user_id,start_key', ignoreDuplicates: true }).select('id'));
			return error ? { error } : { added: data?.length ?? 0 };
		} catch (error) {
			return { error: error as Failure };
		}
	};

	for (let from = 0; from < walks.length; from += BATCH) {
		const batch = walks.slice(from, from + BATCH);
		const answer = await send(batch.map(row));
		if ('added' in answer) {
			result.added += answer.added;
			result.here += batch.length - answer.added;
			continue;
		}
		if (!refusal(answer.error)) {
			result.stopped = stopped(answer.error);
			result.unsent = walks.length - from;
			return result;
		}
		// one of them is refused: find out which
		for (const [index, walk] of batch.entries()) {
			const one = await send([row(walk)]);
			if ('added' in one) {
				result.added += one.added;
				result.here += 1 - one.added;
			} else if (refusal(one.error)) {
				const why = say(one.error);
				result.refused.push({ walk, why });
				if (/room for/.test(why)) {
					// the account is full: every walk after this one would get the same answer
					for (const rest of walks.slice(from + index + 1)) result.refused.push({ walk: rest, why });
					return result;
				}
			} else {
				result.stopped = stopped(one.error);
				result.unsent = walks.length - from - index;
				return result;
			}
		}
	}
	return result;
}

// ---- deleting -------------------------------------------------------------------

/**
 * Deletes a walk: marks it. The database empties the row and keeps it as a
 * marker, and it stays deleted - there is no way back. So the page sends
 * this only when its "Undo" has run out.
 */
export async function remove(id: string): Promise<void> {
	const db = await database();
	const { error } = await within(WAIT, db.from('walks').update({ deleted_at: new Date().toISOString() }).eq('id', id).is('deleted_at', null));
	if (error) throw error;
}

/**
 * The key to the account for the next hour at most, to keep while a
 * deletion waits for its "Undo" to run out - see removeWhileLeaving.
 */
export async function leavingKey(): Promise<string | null> {
	const db = await database();
	const { data } = await db.auth.getSession();
	return data.session?.access_token ?? null;
}

/**
 * The same deletion, sent while the page is hidden or left: one request
 * that the browser finishes even after the page is gone. It cannot wait
 * for anything before it goes, so it takes the key that was fetched when
 * the walk was deleted on the page. If the page is closed, nobody hears
 * whether it worked: a walk that was not deleted is then simply still
 * there the next time.
 */
export async function removeWhileLeaving(ids: string[], key: string): Promise<void> {
	if (!ids.length) return;
	const answer = await fetch(`${ACCOUNTS.url}/rest/v1/walks?id=in.(${ids.map(encodeURIComponent).join(',')})&deleted_at=is.null`, {
		method: 'PATCH',
		keepalive: true,
		headers: { apikey: ACCOUNTS.key, authorization: `Bearer ${key}`, 'content-type': 'application/json', prefer: 'return=minimal' },
		body: JSON.stringify({ deleted_at: new Date().toISOString() })
	});
	if (!answer.ok) throw new Error((await answer.json().catch(() => null))?.message ?? '');
}

// ---- the public page ----------------------------------------------------------------

/** A name that can be in a page's address (the database's own rule). */
export const HANDLE = /^[a-z0-9][a-z0-9_-]{2,19}$/;

const amount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const aDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const days = (value: unknown): value is PublicProfile['days'] =>
	value == null || (Array.isArray(value) && value.every((one) => one && aDay(one.day) && amount(one.seconds) && amount(one.distance_m)));

/**
 * What the world may see of a public page: what public_profile() gives, and
 * nothing else. Null when there is no public page with this name - a name
 * nobody has, a page that is private and a page that was taken down all
 * come back the same.
 */
export async function publicProfile(name: string): Promise<PublicProfile | null> {
	const db = await database();
	const { data, error } = await within(WAIT, db.rpc('public_profile', { name }));
	if (error) throw error;
	const page = data as PublicProfile | null;
	if (!page) return null;
	// (an answer in a shape this page does not know is not shown half)
	const whole =
		typeof page.handle === 'string' &&
		typeof page.display_name === 'string' &&
		page.totals &&
		amount(page.totals.walks) &&
		amount(page.totals.seconds) &&
		amount(page.totals.distance_m) &&
		(page.totals.first_day == null || aDay(page.totals.first_day)) &&
		days(page.days) &&
		days(page.walks);
	if (!whole) throw new Error('The answer was not a page.');
	return page;
}

export const REPORT_REASONS = ['pretends to be somebody', 'an offensive name', 'something else'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** A signed-in person tells the site's owner about a public page. The note is plain text of at most 500 characters. */
export async function report(handle: string, why: ReportReason, note: string): Promise<void> {
	const db = await database();
	// one line: the database takes no line breaks or other control characters in a note
	const plain = note.replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').trim().slice(0, 500);
	const { error } = await within(WAIT, db.from('reports').insert({ handle, why, note: plain || null }));
	if (error) throw error;
}
