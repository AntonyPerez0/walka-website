// The spreadsheet file of a person's walks.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { walksCsv, type CsvWalk } from '../src/lib/account/csv.ts';

const base: CsvWalk = {
	id: '0c8e4a2e-6a7b-4f4c-9d2a-1d2f3e4a5b6c',
	origin: 'walka',
	client_id: '20261119-213000',
	started_at: '2026-11-19T20:30:00.000Z',
	ended_at: '2026-11-19T21:05:12.400Z',
	local_day: '2026-11-19',
	utc_offset_min: 60,
	seconds: 2040,
	distance_m: 2512.4,
	steps: 3360,
	kcal: 142.5,
	kcal_extra: 98.1,
	session: 'wow',
	steps_source: 'estimate',
	distance_source: 'treadmill',
	calories_source: 'heart_rate'
};

test('one line for each walk, oldest first, under a line of names', () => {
	const later = { ...base, id: 'b', started_at: '2026-11-20T08:00:00.000Z', local_day: '2026-11-20', utc_offset_min: null, kcal_extra: null, session: null };
	const lines = walksCsv([later, base]).split('\r\n');
	assert.equal(lines[0], 'day,local_start,started_at_utc,ended_at_utc,utc_offset_min,seconds_on_belt,distance_m,distance_km,distance_mi,steps,kcal_estimate,kcal_on_top_of_sitting_estimate,game_session,steps_source,distance_source,calories_source,came_from,name_on_computer,id');
	assert.equal(lines[1], '2026-11-19,2026-11-19 21:30,2026-11-19T20:30:00.000Z,2026-11-19T21:05:12.400Z,60,2040,2512.4,2.512,1.561,3360,142.5,98.1,wow,estimate,treadmill,heart_rate,walka,20261119-213000,0c8e4a2e-6a7b-4f4c-9d2a-1d2f3e4a5b6c');
	assert.equal(lines[2], '2026-11-20,,2026-11-20T08:00:00.000Z,2026-11-19T21:05:12.400Z,,2040,2512.4,2.512,1.561,3360,142.5,,,estimate,treadmill,heart_rate,walka,20261119-213000,b', 'what is not known is an empty cell');
	assert.equal(lines[3], '', 'the file ends with a line break');
});

test('a name that a spreadsheet would run as a formula stays text, and commas and quotes are kept', () => {
	const odd = walksCsv([{ ...base, client_id: '=HYPERLINK("x")' }]).split('\r\n')[1];
	assert.ok(odd.includes(`"'=HYPERLINK(""x"")"`), odd);
	assert.ok(walksCsv([{ ...base, client_id: 'a,b' }]).includes('"a,b"'));
	assert.ok(walksCsv([{ ...base, client_id: '-2' }]).includes(",'-2,"));
});

test('no walks: the names alone', () => {
	assert.equal(walksCsv([]).split('\r\n').length, 2);
});
