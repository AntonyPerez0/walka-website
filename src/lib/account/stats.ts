// The stats page's arithmetic: totals by day, week and month, records and
// habits. Everything is worked out in the person's own browser from the
// walks their account already holds - nothing is asked for that the walks
// list does not ask for, and nothing new is kept anywhere.
//
// Days are the walk's own `local_day`: the day where the walker was. A week
// begins on a Monday. Every function here is plain arithmetic and is tried
// line by line in tests/stats.test.ts.

import { dayDate, localDay, shiftDay } from './format.ts';
import type { Walk } from './types.ts';

/** What a walk brings to these sums. */
export type StatWalk = Pick<
	Walk,
	'id' | 'local_day' | 'started_at' | 'utc_offset_min' | 'seconds' | 'distance_m' | 'steps' | 'kcal' | 'kcal_extra' | 'session' | 'steps_source' | 'distance_source' | 'calories_source'
>;

export type Sums = { walks: number; seconds: number; distance_m: number; steps: number; kcal: number };

export const nothing = (): Sums => ({ walks: 0, seconds: 0, distance_m: 0, steps: 0, kcal: 0 });

export function add(to: Sums, walk: Pick<StatWalk, 'seconds' | 'distance_m' | 'steps' | 'kcal'>): Sums {
	to.walks += 1;
	to.seconds += walk.seconds;
	to.distance_m += walk.distance_m;
	to.steps += walk.steps;
	to.kcal += walk.kcal;
	return to;
}

export function sum(walks: Pick<StatWalk, 'seconds' | 'distance_m' | 'steps' | 'kcal'>[]): Sums {
	const sums = nothing();
	for (const walk of walks) add(sums, walk);
	return sums;
}

// ---- days, weeks, months ------------------------------------------------------

/** The Monday of the week a day is in. */
export function weekOf(day: string): string {
	return shiftDay(day, -((dayDate(day).getDay() + 6) % 7));
}

/** "2026-11" */
export const monthOf = (day: string) => day.slice(0, 7);

/** 0 for Monday ... 6 for Sunday */
export const weekday = (day: string) => (dayDate(day).getDay() + 6) % 7;

function shiftMonth(month: string, by: number): string {
	const [y, m] = month.split('-').map(Number);
	const at = y * 12 + (m - 1) + by;
	return `${Math.floor(at / 12)}-${String((at % 12) + 1).padStart(2, '0')}`;
}

export type Scale = 'day' | 'week' | 'month';

/** One bar of a chart: a day, a week (by its Monday) or a month ("2026-11"), and what was walked in it. */
export type Bucket = { key: string; sums: Sums };

/** How many of each a chart shows at most, and at least (when the walks are newer than that). */
export const SPAN: Record<Scale, { most: number; least: number }> = {
	day: { most: 30, least: 14 },
	week: { most: 26, least: 8 },
	month: { most: 24, least: 6 }
};

const keyOf: Record<Scale, (day: string) => string> = { day: (day) => day, week: weekOf, month: monthOf };
const step: Record<Scale, (key: string, by: number) => string> = {
	day: shiftDay,
	week: (key, by) => shiftDay(key, by * 7),
	month: shiftMonth
};

/**
 * The walks, day by day, week by week or month by month, oldest first, up to
 * and including the one `today` is in (or the newest walk's, if that is
 * later: a walker on the other side of the world). Empty ones are there too,
 * with nothing in them. Ones before the first walk are left out, down to the
 * least a chart shows.
 */
export function buckets(walks: StatWalk[], scale: Scale, today: string = localDay()): Bucket[] {
	const { most, least } = SPAN[scale];
	const newest = walks.reduce((latest, walk) => (walk.local_day > latest ? walk.local_day : latest), today);
	const last = keyOf[scale](newest);
	const oldest = walks.reduce((first, walk) => (walk.local_day < first ? walk.local_day : first), newest);
	const firstKey = keyOf[scale](oldest);
	const keys: string[] = [];
	for (let at = 0; at < most; at++) {
		const key = step[scale](last, -at);
		if (at >= least && key < firstKey) break;
		keys.unshift(key);
	}
	const byKey = new Map(keys.map((key) => [key, nothing()]));
	for (const walk of walks) {
		const into = byKey.get(keyOf[scale](walk.local_day));
		if (into) add(into, walk);
	}
	return keys.map((key) => ({ key, sums: byKey.get(key)! }));
}

/** Today, this week and this month - and the one before each - and all time. */
export type Periods = Record<'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'all', Sums>;

export function periods(walks: StatWalk[], today: string = localDay()): Periods {
	const out: Periods = { today: nothing(), yesterday: nothing(), week: nothing(), lastWeek: nothing(), month: nothing(), lastMonth: nothing(), all: nothing() };
	const yesterday = shiftDay(today, -1);
	const week = weekOf(today);
	const lastWeek = shiftDay(week, -7);
	const month = monthOf(today);
	const lastMonth = shiftMonth(month, -1);
	for (const walk of walks) {
		const day = walk.local_day;
		add(out.all, walk);
		if (day === today) add(out.today, walk);
		if (day === yesterday) add(out.yesterday, walk);
		const itsWeek = weekOf(day);
		if (itsWeek === week) add(out.week, walk);
		if (itsWeek === lastWeek) add(out.lastWeek, walk);
		if (monthOf(day) === month) add(out.month, walk);
		if (monthOf(day) === lastMonth) add(out.lastMonth, walk);
	}
	return out;
}

// ---- records -----------------------------------------------------------------

export type Streak = { days: number; from: string; to: string };

export type Records = {
	longest: StatWalk | null;
	farthest: StatWalk | null;
	mostSteps: StatWalk | null;
	/** the day with the most time walked */
	bestDay: Bucket | null;
	/** the week with the most time walked */
	bestWeek: Bucket | null;
	/** the most days in a row with a walk */
	longestStreak: Streak | null;
	/** the days in a row up to today - or up to yesterday, while today has no walk yet */
	currentStreak: Streak | null;
	daysWalked: number;
	firstDay: string | null;
};

const most = <T>(items: T[], value: (item: T) => number): T | null => items.reduce<T | null>((best, item) => (best === null || value(item) > value(best) ? item : best), null);

export function records(walks: StatWalk[], today: string = localDay()): Records {
	const days = new Map<string, Sums>();
	const weeks = new Map<string, Sums>();
	for (const walk of walks) {
		add(days.get(walk.local_day) ?? days.set(walk.local_day, nothing()).get(walk.local_day)!, walk);
		const week = weekOf(walk.local_day);
		add(weeks.get(week) ?? weeks.set(week, nothing()).get(week)!, walk);
	}
	const dayList = [...days.keys()].sort();

	// runs of days in a row
	let longestStreak: Streak | null = null;
	let run: Streak | null = null;
	for (const day of dayList) {
		if (run !== null && shiftDay(run.to, 1) === day) run = { days: run.days + 1, from: run.from, to: day };
		else run = { days: 1, from: day, to: day };
		if (!longestStreak || run.days > longestStreak.days) longestStreak = run;
	}
	const last = run;
	const currentStreak = last && (last.to === today || last.to === shiftDay(today, -1) || last.to > today) ? last : null;

	return {
		longest: most(walks, (walk) => walk.seconds),
		farthest: most(walks, (walk) => walk.distance_m),
		mostSteps: most(walks, (walk) => walk.steps),
		bestDay: most(
			[...days].map(([key, sums]) => ({ key, sums })),
			(bucket) => bucket.sums.seconds
		),
		bestWeek: most(
			[...weeks].map(([key, sums]) => ({ key, sums })),
			(bucket) => bucket.sums.seconds
		),
		longestStreak,
		currentStreak,
		daysWalked: days.size,
		firstDay: dayList[0] ?? null
	};
}

// ---- habits ------------------------------------------------------------------

/** The hour a walk began, by the clock where it was walked - if the walk says how far that clock was from UTC. */
export function startHour(walk: Pick<StatWalk, 'started_at' | 'utc_offset_min'>): number | null {
	if (walk.utc_offset_min == null) return null;
	const at = Date.parse(walk.started_at);
	if (Number.isNaN(at)) return null;
	return new Date(at + walk.utc_offset_min * 60_000).getUTCHours();
}

export type PartOfDay = 'night' | 'morning' | 'afternoon' | 'evening';
export const PARTS: { part: PartOfDay; from: number; to: number }[] = [
	{ part: 'night', from: 0, to: 6 },
	{ part: 'morning', from: 6, to: 12 },
	{ part: 'afternoon', from: 12, to: 18 },
	{ part: 'evening', from: 18, to: 24 }
];

export type Habits = {
	/** walks by the hour they began (0-23); walks that do not say their clock are not in it */
	hours: Sums[];
	/** walks that do not say how far their clock was from UTC: typed in, or from older files */
	noClock: number;
	/** the three hours in a row in which most walks began (the first of them), if any did */
	usualHours: number | null;
	usualPart: PartOfDay | null;
	/** Monday first */
	weekdays: Sums[];
	/** the weekdays with the most time walked, best first (two at most) */
	usualDays: number[];
	/** metres a second, over every walk that went some distance */
	speed: number | null;
	/** steps a minute, over every walk with steps */
	cadence: number | null;
	/** the same, over the walks whose steps the treadmill counted */
	cadenceCounted: number | null;
	/** average time of one walk, in seconds */
	averageWalk: number | null;
	/** in a game session ("wow"); without one (started on the dashboard, or no session); not known */
	game: Sums;
	noGame: Sums;
	gameUnknown: Sums;
};

export function habits(walks: StatWalk[]): Habits {
	const hours = Array.from({ length: 24 }, nothing);
	const weekdays = Array.from({ length: 7 }, nothing);
	let noClock = 0;
	const game = nothing();
	const noGame = nothing();
	const gameUnknown = nothing();
	let moving = { seconds: 0, distance_m: 0 };
	let stepping = { seconds: 0, steps: 0 };
	let counted = { seconds: 0, steps: 0 };

	for (const walk of walks) {
		const hour = startHour(walk);
		if (hour === null) noClock += 1;
		else add(hours[hour], walk);
		add(weekdays[weekday(walk.local_day)], walk);
		add(walk.session === 'wow' ? game : walk.session === 'manual' || walk.session === 'free' ? noGame : gameUnknown, walk);
		if (walk.distance_m > 0 && walk.seconds > 0) moving = { seconds: moving.seconds + walk.seconds, distance_m: moving.distance_m + walk.distance_m };
		if (walk.steps > 0 && walk.seconds > 0) {
			stepping = { seconds: stepping.seconds + walk.seconds, steps: stepping.steps + walk.steps };
			if (walk.steps_source === 'treadmill') counted = { seconds: counted.seconds + walk.seconds, steps: counted.steps + walk.steps };
		}
	}

	// three hours in a row, round the clock: where most walks began
	let usualHours: number | null = null;
	let best = 0;
	for (let hour = 0; hour < 24; hour++) {
		const three = hours[hour].walks + hours[(hour + 1) % 24].walks + hours[(hour + 2) % 24].walks;
		if (three > best) [best, usualHours] = [three, hour];
	}
	let usualPart: PartOfDay | null = null;
	best = 0;
	for (const { part, from, to } of PARTS) {
		const walked = hours.slice(from, to).reduce((total, at) => total + at.walks, 0);
		if (walked > best) [best, usualPart] = [walked, part];
	}

	const usualDays = weekdays
		.map((sums, day) => ({ day, seconds: sums.seconds }))
		.filter((entry) => entry.seconds > 0)
		.sort((a, b) => b.seconds - a.seconds || a.day - b.day)
		.slice(0, 2)
		.map((entry) => entry.day);

	return {
		hours,
		noClock,
		usualHours,
		usualPart,
		weekdays,
		usualDays,
		speed: moving.seconds ? moving.distance_m / moving.seconds : null,
		cadence: stepping.seconds ? stepping.steps / (stepping.seconds / 60) : null,
		cadenceCounted: counted.seconds ? counted.steps / (counted.seconds / 60) : null,
		averageWalk: walks.length ? walks.reduce((total, walk) => total + walk.seconds, 0) / walks.length : null,
		game,
		noGame,
		gameUnknown
	};
}

// ---- measured, or estimated --------------------------------------------------

export type Sources = {
	steps: { treadmill: number; estimate: number; unknown: number };
	distance: { treadmill: number; speed: number; unknown: number };
	calories: { speed: number; heart_rate: number; unknown: number };
};

/** How many walks had each number measured, and how many estimated. */
export function sources(walks: StatWalk[]): Sources {
	const out: Sources = {
		steps: { treadmill: 0, estimate: 0, unknown: 0 },
		distance: { treadmill: 0, speed: 0, unknown: 0 },
		calories: { speed: 0, heart_rate: 0, unknown: 0 }
	};
	// (a word this page does not know counts as "not known")
	const known = <T extends object>(table: T, word: string | null): keyof T => (word && word in table ? (word as keyof T) : ('unknown' as keyof T));
	for (const walk of walks) {
		out.steps[known(out.steps, walk.steps_source)] += 1;
		out.distance[known(out.distance, walk.distance_source)] += 1;
		out.calories[known(out.calories, walk.calories_source)] += 1;
	}
	return out;
}
