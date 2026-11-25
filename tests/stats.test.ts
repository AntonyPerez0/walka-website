// The stats page's arithmetic: every number on that page comes from here.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buckets, habits, periods, records, sources, startHour, weekOf, type StatWalk } from '../src/lib/account/stats.ts';

let made = 0;
/** A walk on a day; 30 minutes, 2 km, 3,000 steps, 120 kcal unless said otherwise. */
const walk = (day: string, more: Partial<StatWalk> = {}): StatWalk => ({
	id: `w${++made}`,
	local_day: day,
	started_at: `${day}T18:30:00.000Z`,
	utc_offset_min: 60,
	seconds: 1800,
	distance_m: 2000,
	steps: 3000,
	kcal: 120,
	kcal_extra: 80,
	session: 'wow',
	steps_source: 'estimate',
	distance_source: 'treadmill',
	calories_source: 'speed',
	...more
});

test('a week begins on a Monday', () => {
	assert.equal(weekOf('2026-11-25'), '2026-11-23', 'a Wednesday');
	assert.equal(weekOf('2026-11-23'), '2026-11-23', 'a Monday');
	assert.equal(weekOf('2026-11-29'), '2026-11-23', 'a Sunday');
	assert.equal(weekOf('2026-01-01'), '2025-12-29', 'across a year');
});

test('day by day: every day up to today, empty ones too, from the first walk', () => {
	const days = buckets([walk('2026-11-20'), walk('2026-11-20'), walk('2026-11-24')], 'day', '2026-11-25');
	assert.equal(days.length, 14, 'no fewer than fourteen days, though the walks began six days ago');
	assert.equal(days.at(-1)!.key, '2026-11-25');
	assert.equal(days.find((d) => d.key === '2026-11-20')!.sums.walks, 2);
	assert.equal(days.find((d) => d.key === '2026-11-20')!.sums.seconds, 3600);
	assert.equal(days.find((d) => d.key === '2026-11-21')!.sums.walks, 0);
	const long = buckets([walk('2026-01-01'), walk('2026-11-25')], 'day', '2026-11-25');
	assert.equal(long.length, 30, 'thirty days at most');
});

test('week by week and month by month', () => {
	const walks = [walk('2026-11-23'), walk('2026-11-29'), walk('2026-11-30'), walk('2026-10-31')];
	const weeks = buckets(walks, 'week', '2026-11-30');
	assert.equal(weeks.at(-1)!.key, '2026-11-30');
	assert.equal(weeks.at(-1)!.sums.walks, 1);
	assert.equal(weeks.at(-2)!.sums.walks, 2, 'Monday to Sunday');
	assert.equal(weeks.length, 8);
	const months = buckets(walks, 'month', '2026-11-30');
	assert.deepEqual(
		months.map((m) => m.key),
		['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']
	);
	assert.equal(months.at(-1)!.sums.walks, 3);
	assert.equal(months.at(-2)!.sums.distance_m, 2000);
	assert.equal(buckets([walk('2026-11-01')], 'month', '2027-01-05').at(-1)!.key, '2027-01', 'across a year');
	assert.equal(buckets([], 'day', '2026-11-25').length, 14, 'no walks: empty days');
});

test('a walk on a day ahead of here still has its bar', () => {
	const days = buckets([walk('2026-11-26')], 'day', '2026-11-25');
	assert.equal(days.at(-1)!.key, '2026-11-26');
	assert.equal(days.at(-1)!.sums.walks, 1);
});

test('today, this week, this month, and the one before each', () => {
	const sums = periods([walk('2026-11-25'), walk('2026-11-24'), walk('2026-11-22'), walk('2026-11-16'), walk('2026-10-30'), walk('2025-11-25')], '2026-11-25');
	assert.equal(sums.today.walks, 1);
	assert.equal(sums.yesterday.walks, 1);
	assert.equal(sums.week.walks, 2, 'Monday the 23rd onwards');
	assert.equal(sums.lastWeek.walks, 2, 'the 16th and the 22nd');
	assert.equal(sums.month.walks, 4);
	assert.equal(sums.lastMonth.walks, 1);
	assert.equal(sums.all.walks, 6);
	assert.equal(sums.all.steps, 18000);
});

test('records: the longest walk, the best day and week, and streaks', () => {
	const long = walk('2026-11-10', { seconds: 5400, distance_m: 6000, steps: 9000 });
	const r = records(
		[walk('2026-11-01'), walk('2026-11-02'), walk('2026-11-03'), walk('2026-11-03'), long, walk('2026-11-24'), walk('2026-11-25')],
		'2026-11-25'
	);
	assert.equal(r.longest, long);
	assert.equal(r.farthest, long);
	assert.equal(r.mostSteps, long);
	assert.equal(r.bestDay!.key, '2026-11-10');
	assert.equal(r.bestDay!.sums.seconds, 5400);
	assert.equal(r.bestWeek!.key, '2026-11-02', 'the 1st (a Sunday) is in the week before; the 2nd and two on the 3rd make 5,400 s - the week of the 10th has as much, and the first wins');
	assert.deepEqual(r.longestStreak, { days: 3, from: '2026-11-01', to: '2026-11-03' });
	assert.deepEqual(r.currentStreak, { days: 2, from: '2026-11-24', to: '2026-11-25' });
	assert.equal(r.daysWalked, 6);
	assert.equal(r.firstDay, '2026-11-01');
});

test('a streak still counts on a day with no walk yet, and ends the day after', () => {
	const walks = [walk('2026-11-23'), walk('2026-11-24')];
	assert.equal(records(walks, '2026-11-25').currentStreak?.days, 2);
	assert.equal(records(walks, '2026-11-26').currentStreak, null);
	assert.equal(records([], '2026-11-26').longestStreak, null);
});

test('the hour a walk began is the clock where it was walked; without that it is not counted', () => {
	assert.equal(startHour({ started_at: '2026-11-25T18:30:00.000Z', utc_offset_min: 60 }), 19);
	assert.equal(startHour({ started_at: '2026-11-25T23:30:00.000Z', utc_offset_min: 120 }), 1, 'past midnight there');
	assert.equal(startHour({ started_at: '2026-11-25T02:00:00.000Z', utc_offset_min: -300 }), 21, 'the evening before, in New York');
	assert.equal(startHour({ started_at: '2026-11-25T18:30:00.000Z', utc_offset_min: null }), null);
});

test('habits: the usual time and days, speed, steps a minute, a game session or none', () => {
	const h = habits([
		walk('2026-11-23'), // Monday 19:30
		walk('2026-11-24', { started_at: '2026-11-24T19:10:00.000Z' }), // Tuesday 20:10
		walk('2026-11-25', { started_at: '2026-11-25T07:00:00.000Z', session: 'free', steps_source: 'treadmill', steps: 3300 }), // Wednesday 08:00
		walk('2026-11-26', { utc_offset_min: null, session: null, seconds: 600, distance_m: 0, steps: 0 })
	]);
	assert.equal(h.noClock, 1);
	assert.equal(h.hours[19].walks, 1);
	assert.equal(h.hours[20].walks, 1);
	assert.equal(h.hours[8].walks, 1);
	assert.equal(h.usualHours, 18, '18:00 to 21:00 holds two of them');
	assert.equal(h.usualPart, 'evening');
	assert.equal(h.weekdays[0].walks, 1, 'Monday');
	assert.equal(h.weekdays[3].seconds, 600, 'Thursday');
	assert.deepEqual(h.usualDays, [0, 1], 'Monday and Tuesday: 30 minutes each; Wednesday too, but the first two win');
	assert.equal(h.speed, 6000 / 5400, 'the walk that went nowhere is left out');
	assert.equal(h.cadence, 9300 / 90);
	assert.equal(h.cadenceCounted, 110, 'the treadmill counted 3,300 in 30 minutes');
	assert.equal(h.averageWalk, (1800 * 3 + 600) / 4);
	assert.equal(h.game.walks, 2);
	assert.equal(h.noGame.walks, 1);
	assert.equal(h.gameUnknown.walks, 1);
});

test('habits of no walks say nothing', () => {
	const h = habits([]);
	assert.equal(h.usualHours, null);
	assert.equal(h.usualPart, null);
	assert.deepEqual(h.usualDays, []);
	assert.equal(h.speed, null);
	assert.equal(h.cadence, null);
	assert.equal(h.averageWalk, null);
});

test('how each number was come by, walk by walk', () => {
	const s = sources([walk('2026-11-25'), walk('2026-11-25', { steps_source: 'treadmill', distance_source: 'speed', calories_source: 'heart_rate' }), walk('2026-11-25', { steps_source: null, distance_source: null, calories_source: null })]);
	assert.deepEqual(s.steps, { treadmill: 1, estimate: 1, unknown: 1 });
	assert.deepEqual(s.distance, { treadmill: 1, speed: 1, unknown: 1 });
	assert.deepEqual(s.calories, { speed: 1, heart_rate: 1, unknown: 1 });
	// @ts-expect-error a word from a later Walka
	assert.deepEqual(sources([walk('2026-11-25', { steps_source: 'pedometer' })]).steps, { treadmill: 0, estimate: 0, unknown: 1 });
});
