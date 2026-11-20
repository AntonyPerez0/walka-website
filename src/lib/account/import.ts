// Reading walks from files, here in the browser.
//
// Two kinds of file hold a walk: one of Walka's own (it keeps every
// finished walk as sessions/<id>.json in its data folder), and a TCX file
// (Walka's export of a walk, or another program's). Out of either, only
// the numbers the database has a place for are taken: when, how long, how
// far, steps, calories, and how each number was come by. The
// second-by-second samples, the heart rate, the top speed, the treadmill's
// name and the character stay in the file, on the person's computer.
//
// Nothing here touches the page or the network: these are plain functions,
// so that tests/import.test.ts can try them without a browser.

import { localDay } from './format.ts';
import type { NewWalk } from './types.ts';

// ---- the limits of public.walks ---------------------------------------------
// The checks of the database (supabase/migrations), said again here so that
// a walk it would refuse is refused first, and the page can say which number
// it was. Nothing is cut down to fit: a walk outside the limits is not added.

const MOST_SECONDS = 86_400;
const MOST_METRES = 200_000;
const MOST_STEPS = 400_000;
const MOST_KCAL = 20_000;
const TWO_DAYS = 2 * 86_400_000;
const DAY = 86_400_000;
const YEAR_2000 = Date.UTC(2000, 0, 1);

const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
/** One decimal, as the database keeps it (and as Walka writes it). */
const tenth = (n: number) => Math.round(n * 10) / 10;

/** "2026-11-19" -> that day at midnight UTC, or null if there is no such day. */
function dayAsUtc(day: string): number | null {
	const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
	if (!parts) return null;
	const at = Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
	return new Date(at).toISOString().slice(0, 10) === day ? at : null;
}

/**
 * What about this walk the database would refuse, in plain words - or null
 * if it is within the limits. (`now` is for the tests.)
 */
export function outside(walk: NewWalk, now: number = Date.now()): string | null {
	const start = Date.parse(walk.started_at);
	const end = Date.parse(walk.ended_at);
	const day = dayAsUtc(walk.local_day);
	if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Its start or its end is not a time.';
	if (day === null) return 'Its day is not a day.';
	if (!walk.client_id || walk.client_id.length > 64) return 'Its name is longer than 64 characters.';

	if (end < start) return 'It ends before it starts.';
	if (end - start > TWO_DAYS) return 'It lasts longer than two days.';
	if (start < YEAR_2000) return 'It starts before the year 2000.';
	if (start > now + TWO_DAYS) return 'It starts in the days to come.';

	if (!number(walk.seconds) || walk.seconds < 0) return 'The time walked is not a number from zero up.';
	if (walk.seconds > MOST_SECONDS) return 'The time walked is more than a day.';
	// the belt did not move for longer than the walk lasted (a minute of room, as in the database)
	if (walk.seconds > (end - start) / 1000 + 60) return 'The time walked is longer than the walk lasted.';
	if (!number(walk.distance_m) || walk.distance_m < 0) return 'The distance is not a number from zero up.';
	if (walk.distance_m > MOST_METRES) return 'The distance is more than 200 km (124 miles).';
	if (!Number.isInteger(walk.steps) || walk.steps < 0) return 'The steps are not a whole number from zero up.';
	if (walk.steps > MOST_STEPS) return 'There are more than 400,000 steps.';
	if (!number(walk.kcal) || walk.kcal < 0) return 'The calories are not a number from zero up.';
	if (walk.kcal > MOST_KCAL) return 'There are more than 20,000 kcal.';
	if (walk.kcal_extra != null && (!number(walk.kcal_extra) || walk.kcal_extra < 0 || walk.kcal_extra > MOST_KCAL))
		return 'The calories on top of sitting are not a number from 0 to 20,000.';
	if (walk.utc_offset_min != null && (!Number.isInteger(walk.utc_offset_min) || walk.utc_offset_min < -720 || walk.utc_offset_min > 840))
		return 'Its time zone is not one there is.';

	// the day is the day the walk was on, give or take a time zone
	const firstDay = Math.floor(start / DAY) * DAY - DAY;
	const lastDay = Math.floor(end / DAY) * DAY + DAY;
	if (day < firstDay || day > lastDay) return 'Its day does not fit the time it started.';
	return null;
}

// ---- one of Walka's own files --------------------------------------------------

// The id Walka gives a walk is the local time it started: "20261119-213000".
// Two walks that start in the same second get "-2", "-3" at the end.
const WALKA_ID = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(?:-\d{1,9})?$/;

/** One of the words the database knows, or null: a word it does not know is "not known", not a reason to refuse a walk. */
function word<T extends string>(value: unknown, known: readonly T[]): T | null {
	return known.includes(value as T) ? (value as T) : null;
}

/** A moment in seconds since 1970 -> "2026-11-19T20:30:00.400Z", or null if it is no moment at all. */
function utc(seconds: number): string | null {
	const ms = Math.round(seconds * 1000);
	return Math.abs(ms) <= 8.64e15 ? new Date(ms).toISOString() : null;
}

/**
 * Walka's record of a walk (SessionRecord.to_json in
 * companion/src/walka/session.py) as a row for "walks" - by the table in
 * docs/data-model.md, "From Walka's own record of a walk". Null if it is
 * not such a record. The limits are not looked at here: see fromWalka.
 */
function walkaRecord(json: unknown): NewWalk | null {
	if (typeof json !== 'object' || json === null || Array.isArray(json)) return null;
	const record = json as Record<string, unknown>;
	const id = typeof record.id === 'string' ? WALKA_ID.exec(record.id) : null;
	if (!id) return null;
	const { start, end, seconds, distance_m, steps, kcal } = record;
	if (!number(start) || !number(end) || !number(seconds) || !number(distance_m) || !number(steps) || !number(kcal)) return null;
	// Walka writes steps as a whole number, always
	if (!Number.isInteger(steps)) return null;
	// (older records do not have it at all)
	const extra = record.kcal_extra ?? 0;
	if (!number(extra)) return null;
	const startedAt = utc(start);
	const endedAt = utc(end);
	if (!startedAt || !endedAt) return null;

	// The day where the walk was: the id says it, and it is not worked out
	// again from the time, which would give the day of whoever reads the file.
	const day = `${id[1]}-${id[2]}-${id[3]}`;
	const wall = Date.UTC(Number(id[1]), Number(id[2]) - 1, Number(id[3]), Number(id[4]), Number(id[5]), Number(id[6]));
	if (new Date(wall).toISOString().replace(/\D/g, '').slice(0, 14) !== id.slice(1, 7).join('')) return null; // "20261340-256199" is no time

	// How far that clock was ahead of UTC then: the id is the local time of
	// the same moment that "start" gives in UTC. Kept only when the two
	// agree to the second (the id drops the tenths, "start" rounds them).
	const ahead = (wall / 1000 - start) / 60;
	const minutes = Math.round(ahead);
	const offset = Math.abs(ahead - minutes) * 60 <= 1.5 && minutes >= -720 && minutes <= 840 ? minutes : null;

	return {
		origin: 'walka',
		client_id: record.id as string,
		started_at: startedAt,
		ended_at: endedAt,
		local_day: day,
		utc_offset_min: offset,
		seconds: tenth(seconds),
		distance_m: tenth(distance_m),
		steps,
		kcal: tenth(kcal),
		// 0 in a record with calories is an older record that never knew: empty, not "none"
		kcal_extra: extra === 0 && kcal > 0 ? null : tenth(extra),
		session: word(record.source, ['wow', 'manual', 'free'] as const),
		steps_source: word(record.steps_source, ['treadmill', 'estimate'] as const),
		distance_source: word(record.distance_source, ['treadmill', 'speed'] as const),
		calories_source: word(record.calories_source, ['speed', 'heart_rate'] as const)
	};
}

/**
 * One of Walka's own files, read as JSON: the walk in it, as a row to add.
 * Null for anything that is not such a record, and for a walk outside the
 * database's limits.
 */
export function fromWalka(json: unknown): NewWalk | null {
	const walk = walkaRecord(json);
	return walk && !outside(walk) ? walk : null;
}

// ---- a TCX file ---------------------------------------------------------------------
// TCX is XML, but the few things wanted from it are plain numbers and times
// between tags, so they are read with patterns and no parser. (The browser
// has one; the tests, and one day a program without a page, do not.)

/** An element's name may carry a prefix: <Steps> and <ns3:Steps> are the same thing here. */
const PREFIX = '(?:[A-Za-z_][\\w.-]*:)?';
/** <Name ...> ... </Name>, every one of them: [1] its attributes, [2] what is inside. */
const blocks = (name: string) => new RegExp(`<${PREFIX}${name}(?=[\\s>])([^>]*)>([\\s\\S]*?)</${PREFIX}${name}\\s*>`, 'g');
/** <Name>text</Name>, the first one: [1] the text. */
const text = (name: string) => new RegExp(`<${PREFIX}${name}\\s*>\\s*([^<>]*?)\\s*</${PREFIX}${name}\\s*>`);

const ACTIVITY = blocks('Activity');
const LAP = blocks('Lap');
const TRACK = blocks('Track');
const ID = text('Id');
const TOTAL_TIME = text('TotalTimeSeconds');
const DISTANCE = text('DistanceMeters');
const CALORIES = text('Calories');
const STEPS = text('Steps');
const TIMES = new RegExp(text('Time').source, 'g');
const START_TIME = /\bStartTime\s*=\s*(?:"([^"]*)"|'([^']*)')/;

/** An XML time: "2026-11-19T20:30:00Z", with or without parts of a second, with or without a zone. */
const XML_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
const XML_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function moment(value: string | undefined): number | null {
	if (!value || !XML_TIME.test(value)) return null;
	const at = Date.parse(value);
	return Number.isFinite(at) ? at : null;
}

/** The number in a tag: null when the tag is not there, NaN when what is in it is not a number. */
function amount(xml: string, tag: RegExp): number | null {
	const found = tag.exec(xml);
	if (!found) return null;
	return XML_NUMBER.test(found[1]) ? Number(found[1]) : NaN;
}

type Refusal = { what: string; why: string };

/** Every activity in a TCX file: as a walk to add, or with the reason why not. */
function activities(xml: string): { walks: NewWalk[]; refused: Refusal[] } {
	const walks: NewWalk[] = [];
	const refused: Refusal[] = [];
	// (a comment may hold anything, tags too)
	const file = xml.replace(/<!--[\s\S]*?-->/g, '');

	for (const [, , activity] of file.matchAll(ACTIVITY)) {
		const id = ID.exec(activity)?.[1] ?? '';
		const start = moment(id);
		if (start === null) {
			refused.push({ what: id || 'An activity', why: 'It does not say when it started.' });
			continue;
		}

		let seconds = 0;
		let metres = 0;
		let kcal = 0;
		let steps = 0;
		let laps = 0;
		let end = start;
		let bad = '';
		for (const [, attributes, inside] of activity.matchAll(LAP)) {
			// A track point has a <DistanceMeters> of its own: the lap's totals
			// are read from the lap without its track.
			const lap = inside.replace(TRACK, '');
			const time = amount(lap, TOTAL_TIME);
			const distance = amount(lap, DISTANCE) ?? 0;
			const calories = amount(lap, CALORIES) ?? 0;
			const counted = amount(lap, STEPS) ?? 0;
			if (time === null) bad ||= 'A lap of it does not say how long it was.';
			else if (![time, distance, calories, counted].every(Number.isFinite)) bad ||= 'One of its numbers is not a number.';
			if (bad) break;
			laps++;
			seconds += time!;
			metres += distance;
			kcal += calories;
			steps += counted;
			const began = moment(START_TIME.exec(attributes)?.slice(1).find((value) => value !== undefined));
			if (began !== null) end = Math.max(end, began + time! * 1000);
		}
		if (!bad && !laps) bad = 'It has no lap, and so no time walked.';
		if (bad) {
			refused.push({ what: id, why: bad });
			continue;
		}
		// The walk ended when its last point was recorded, or - without
		// points - when the time walked had passed since the start.
		for (const [, time] of activity.matchAll(TIMES)) {
			const at = moment(time);
			if (at !== null) end = Math.max(end, at);
		}
		end = Math.max(end, start + seconds * 1000);

		const zone = /^\d{4}-\d\d-\d\dT.*[+-]\d\d:\d\d$/.test(id);
		const walk: NewWalk = {
			origin: 'file',
			client_id: id,
			started_at: new Date(start).toISOString(),
			// (a walk that is refused for its length need not have an end that can be written)
			ended_at: new Date(Math.min(end, 8.64e15)).toISOString(),
			// If the file says how far its clock was from UTC ("...+09:00"), the
			// day is the day written in the file. If it only says the moment
			// ("...Z"), the day is the day that moment fell on here.
			local_day: zone ? id.slice(0, 10) : localDay(new Date(start)),
			seconds: tenth(seconds),
			distance_m: tenth(metres),
			steps: Math.round(steps),
			kcal: tenth(kcal)
		};
		const why = Number.isInteger(steps) ? outside(walk) : 'The steps are not a whole number from zero up.';
		if (why) refused.push({ what: id, why });
		else walks.push(walk);
	}
	return { walks, refused };
}

/**
 * The walks in a TCX file: one for each activity, its laps added up. A
 * walk without steps has 0 steps. An activity that cannot be read, or that
 * is outside the database's limits, is left out.
 */
export function fromTcx(xml: string): NewWalk[] {
	return activities(xml).walks;
}

// ---- any file the person picked ------------------------------------------------------

export type FileRead = {
	walks: NewWalk[];
	/** what was not taken, and why, in plain words - to be shown to the person */
	refused: { file: string; why: string }[];
};

/** A file the person picked, by its name and what is in it: the walks, and what was left out and why. */
export function readFile(name: string, contents: string): FileRead {
	const no = (why: string): FileRead => ({ walks: [], refused: [{ file: name, why }] });
	const body = contents.replace(/^﻿/, '').trim();

	if (body.startsWith('<')) {
		const { walks, refused } = activities(body);
		if (!walks.length && !refused.length) return no('There is no walk in this file.');
		// (in a file of several, the start says which one is meant)
		const several = walks.length + refused.length > 1;
		return { walks, refused: refused.map(({ what, why }) => ({ file: several ? `${name}, ${what}` : name, why })) };
	}

	// Next to its finished walks Walka keeps the one that is going on, so
	// that a crash does not lose it. It is finished by Walka, not here: added
	// now, it would stand in the way of the whole walk later.
	if (/(^|[\\/])active-session\.json$/i.test(name)) return no('This is the walk Walka is still recording. It can be added once Walka has finished it.');

	let json: unknown;
	try {
		json = JSON.parse(body);
	} catch {
		return no('This is not one of Walka\'s walks, and not a TCX file.');
	}
	const walk = walkaRecord(json);
	if (!walk) return no('This is not one of Walka\'s walks.');
	const why = outside(walk);
	return why ? no(why) : { walks: [walk], refused: [] };
}
