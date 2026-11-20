// Reading walks from files (src/lib/account/import.ts), tried on the real
// thing: the records below are what Walka's session.py wrote, and the TCX
// files what its export.py made of them (three short walks, made by running
// Walka's own code with a clock set to Berlin).
//
//   node --test tests/import.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromTcx, fromWalka, outside, readFile } from '../src/lib/account/import.ts';
import type { NewWalk } from '../src/lib/account/types.ts';

// The computer that reads a file need not be where the walk was.
function inZone<T>(zone: string, work: () => T): T {
	const before = process.env.TZ;
	process.env.TZ = zone;
	try {
		return work();
	} finally {
		if (before === undefined) delete process.env.TZ;
		else process.env.TZ = before;
	}
}

/** Everything the site may send for a walk (NewWalk in types.ts). Nothing else may come out of a file. */
const MAY_BE_SENT = ['origin', 'client_id', 'started_at', 'ended_at', 'local_day', 'seconds', 'distance_m', 'steps', 'kcal', 'id', 'utc_offset_min', 'kcal_extra', 'session', 'steps_source', 'distance_source', 'calories_source', 'device'];

// ---- what Walka wrote -----------------------------------------------------------

// 21:30:00 on 19 November 2026 in Berlin, with a walking session in the game, counted by the treadmill
const EVENING = `{"id":"20261119-213000","start":1795120200.4,"end":1795120244.6,"seconds":40.0,"distance_m":34.7,"steps":66,"kcal":2.5,"kcal_extra":1.4,"max_kmh":3.2,"avg_hr":null,"max_hr":null,"source":"wow","beacon_session":7,"steps_source":"treadmill","distance_source":"treadmill","calories_source":"speed","treadmill":"UREVO-E1 <pad>","samples":[[1.0,3.2,null],[6.0,3.2,null],[11.0,3.2,null],[16.0,3.2,null],[21.0,3.2,null],[26.0,3.2,null],[31.0,3.2,null],[36.0,3.2,null]]}`;

// 23:59:40 on 14 November 2026 in Berlin: it ends on the 15th. Started by hand, with a heart rate.
const MIDNIGHT = `{"id":"20261114-235940","start":1794697180,"end":1794697229.2,"seconds":45.0,"distance_m":51.2,"steps":79,"kcal":3.1,"kcal_extra":1.9,"max_kmh":4.1,"avg_hr":131.0,"max_hr":131,"source":"manual","beacon_session":null,"steps_source":"estimate","distance_source":"speed","calories_source":"speed","treadmill":"UREVO-E1 <pad>","samples":[[1.0,4.1,131],[6.0,4.1,131],[11.0,4.1,131],[16.0,4.1,131],[21.0,4.1,131],[26.0,4.1,131],[31.0,4.1,131],[36.0,4.1,131],[41.0,4.1,131]]}`;

// an older record: it never knew the calories on top of sitting, and has no samples
const OLD = `{"id":"20250302-081500","start":1740899700,"end":1740901500,"seconds":1700.0,"distance_m":1500.0,"steps":2100,"kcal":101.0,"kcal_extra":0.0,"max_kmh":0.0,"avg_hr":null,"max_hr":null,"source":"manual","beacon_session":null,"steps_source":"estimate","distance_source":"speed","calories_source":"speed","treadmill":"","samples":[]}`;

const point = (time: string, metres: string, heart = '') => `          <Trackpoint>
            <Time>${time}</Time>
            <DistanceMeters>${metres}</DistanceMeters>${heart && `\n            <HeartRateBpm><Value>${heart}</Value></HeartRateBpm>`}
            <Cadence>47</Cadence>
            <Extensions><ns3:TPX><ns3:Speed>0.889</ns3:Speed><ns3:RunCadence>47</ns3:RunCadence></ns3:TPX></Extensions>
          </Trackpoint>`;

// walka-20261119-213000.tcx, as export.py wrote it (of its eight points, the first two and the last)
const EVENING_TCX = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Other">
      <Id>2026-11-19T20:30:00Z</Id>
      <Lap StartTime="2026-11-19T20:30:00Z">
        <TotalTimeSeconds>40.0</TotalTimeSeconds>
        <DistanceMeters>34.7</DistanceMeters>
        <MaximumSpeed>0.889</MaximumSpeed>
        <Calories>2</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
${point('2026-11-19T20:30:01Z', '0.0')}
${point('2026-11-19T20:30:06Z', '5.0')}
${point('2026-11-19T20:30:36Z', '34.7')}
        </Track>
        <Extensions><ns3:LX><ns3:Steps>66</ns3:Steps></ns3:LX></Extensions>
      </Lap>
      <Notes>Walka walking-pad session (wow); 66 steps (treadmill), UREVO-E1 &lt;pad&gt;</Notes>
    </Activity>
  </Activities>
</TrainingCenterDatabase>
`;

// walka-20261114-235940.tcx: its last point is past midnight in Berlin
const MIDNIGHT_TCX = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Other">
      <Id>2026-11-14T22:59:40Z</Id>
      <Lap StartTime="2026-11-14T22:59:40Z">
        <TotalTimeSeconds>45.0</TotalTimeSeconds>
        <DistanceMeters>51.2</DistanceMeters>
        <MaximumSpeed>1.139</MaximumSpeed>
        <Calories>3</Calories>
        <AverageHeartRateBpm><Value>131</Value></AverageHeartRateBpm>
        <MaximumHeartRateBpm><Value>131</Value></MaximumHeartRateBpm>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
${point('2026-11-14T22:59:41Z', '0.0', '131')}
${point('2026-11-14T23:00:21Z', '51.2', '131')}
        </Track>
        <Extensions><ns3:LX><ns3:Steps>79</ns3:Steps></ns3:LX></Extensions>
      </Lap>
      <Notes>Walka walking-pad session (manual); 79 steps (estimate), UREVO-E1 &lt;pad&gt;</Notes>
    </Activity>
  </Activities>
</TrainingCenterDatabase>
`;

// walka-20250302-081500.tcx: a walk without samples gets no Track at all
const OLD_TCX = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
  <Activities>
    <Activity Sport="Other">
      <Id>2025-03-02T07:15:00Z</Id>
      <Lap StartTime="2025-03-02T07:15:00Z">
        <TotalTimeSeconds>1700.0</TotalTimeSeconds>
        <DistanceMeters>1500.0</DistanceMeters>
        <MaximumSpeed>0.000</MaximumSpeed>
        <Calories>101</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Extensions><ns3:LX><ns3:Steps>2100</ns3:Steps></ns3:LX></Extensions>
      </Lap>
      <Notes>Walka walking-pad session (manual); 2100 steps (estimate), treadmill</Notes>
    </Activity>
  </Activities>
</TrainingCenterDatabase>
`;

const record = (text: string, change: Record<string, unknown> = {}) => ({ ...JSON.parse(text), ...change });
const without = (text: string, ...keys: string[]) => {
	const made = JSON.parse(text);
	for (const key of keys) delete made[key];
	return made;
};

// ---- one of Walka's own files ----------------------------------------------------

test('a walk as Walka writes it becomes a row, field by field as docs/data-model.md says', () => {
	assert.deepEqual(fromWalka(JSON.parse(EVENING)), {
		origin: 'walka',
		client_id: '20261119-213000',
		started_at: '2026-11-19T20:30:00.400Z',
		ended_at: '2026-11-19T20:30:44.600Z',
		local_day: '2026-11-19',
		utc_offset_min: 60,
		seconds: 40,
		distance_m: 34.7,
		steps: 66,
		kcal: 2.5,
		kcal_extra: 1.4,
		session: 'wow',
		steps_source: 'treadmill',
		distance_source: 'treadmill',
		calories_source: 'speed'
	} satisfies NewWalk);
});

test('nothing that the database has no place for gets through: no samples, heart rate, top speed, treadmill or character', () => {
	for (const text of [EVENING, MIDNIGHT, OLD]) {
		// ... not even when the file holds more than Walka writes today
		const walk = fromWalka(record(text, { character: 'Thrall-Draenor', realm: 'Draenor', email: 'someone@example.com', device: 'this-pc', id_token: 'secret' }));
		assert.ok(walk);
		for (const key of Object.keys(walk)) assert.ok(MAY_BE_SENT.includes(key), `"${key}" is not something the site sends`);
		for (const key of ['samples', 'avg_hr', 'max_hr', 'max_kmh', 'treadmill', 'beacon_session', 'source', 'start', 'end', 'character', 'realm', 'email', 'device', 'id_token', 'user_id', 'start_key', 'created_at', 'updated_at', 'deleted_at'])
			assert.ok(!(key in walk), `"${key}" stays in the file`);
		assert.doesNotMatch(JSON.stringify(walk), /UREVO|131|3\.2,|4\.1|Thrall|example\.com|secret/);
	}
});

test('kcal_extra 0 in a record with calories means "not known", and is sent as empty', () => {
	const old = fromWalka(JSON.parse(OLD));
	assert.equal(old?.kcal, 101);
	assert.equal(old?.kcal_extra, null);
	// a record older still does not have the field at all
	assert.equal(fromWalka(without(OLD, 'kcal_extra'))?.kcal_extra, null);
	// no calories at all, and none on top: that is a nought, not a gap
	assert.equal(fromWalka(record(OLD, { kcal: 0, kcal_extra: 0 }))?.kcal_extra, 0);
	assert.equal(fromWalka(JSON.parse(MIDNIGHT))?.kcal_extra, 1.9);
});

test('a record without its optional fields is still a walk, and what it does not say is sent as empty', () => {
	const bare = fromWalka(without(EVENING, 'kcal_extra', 'max_kmh', 'avg_hr', 'max_hr', 'source', 'beacon_session', 'steps_source', 'distance_source', 'calories_source', 'treadmill', 'samples'));
	assert.deepEqual(bare, {
		origin: 'walka',
		client_id: '20261119-213000',
		started_at: '2026-11-19T20:30:00.400Z',
		ended_at: '2026-11-19T20:30:44.600Z',
		local_day: '2026-11-19',
		utc_offset_min: 60,
		seconds: 40,
		distance_m: 34.7,
		steps: 66,
		kcal: 2.5,
		kcal_extra: null,
		session: null,
		steps_source: null,
		distance_source: null,
		calories_source: null
	});
	// a word a later Walka might write, and the database does not know: not known, and the walk is kept
	const later = fromWalka(record(EVENING, { source: 'android', steps_source: 'watch', calories_source: 7 }));
	assert.deepEqual([later?.session, later?.steps_source, later?.distance_source, later?.calories_source], [null, null, 'treadmill', null]);
	assert.equal(fromWalka(record(EVENING, { source: 'free' }))?.session, 'free');
	assert.equal(fromWalka(JSON.parse(MIDNIGHT))?.session, 'manual');
});

test('a walk across midnight counts for the day it started on, wherever the file is read', () => {
	for (const zone of ['Europe/Berlin', 'America/Los_Angeles', 'Pacific/Auckland', 'UTC']) {
		const walk = inZone(zone, () => fromWalka(JSON.parse(MIDNIGHT)));
		assert.equal(walk?.local_day, '2026-11-14', `read in ${zone}`);
		assert.equal(walk?.started_at, '2026-11-14T22:59:40.000Z');
		assert.equal(walk?.ended_at, '2026-11-14T23:00:29.200Z');
		assert.equal(walk?.utc_offset_min, 60);
	}
	// a second walk that started in the same second: Walka adds "-2" to its id
	assert.equal(fromWalka(record(MIDNIGHT, { id: '20261114-235940-2' }))?.client_id, '20261114-235940-2');
	// a clock far from UTC, and one that is not on the hour
	assert.equal(fromWalka(record(MIDNIGHT, { id: '20261115-115940' }))?.utc_offset_min, 13 * 60);
	assert.equal(fromWalka(record(MIDNIGHT, { id: '20261115-042940' }))?.utc_offset_min, 330);
	// an id that does not agree with the start to the second says nothing about the clock
	assert.equal(fromWalka(record(MIDNIGHT, { id: '20261114-235917' }))?.utc_offset_min, null);
});

test('what is not one of Walka\'s walks is refused', () => {
	const others: unknown[] = [
		null,
		undefined,
		42,
		'20261119-213000',
		[],
		[JSON.parse(EVENING)],
		{},
		// another program's JSON
		{ name: 'walka-website', version: '0.1.0', private: true },
		{ id: 17, start: '2026-11-19T20:30:00Z', end: '2026-11-19T21:00:00Z', steps: 3000 },
		{ type: 'Run', id: '20261119-213000', start_date: '2026-11-19T20:30:00Z', distance: 5000 },
		// Walka's own settings file, from the same folder
		{ version: 3, profile: { weight_kg: 80, height_cm: 180 }, wow: { capture_fps: 10 } },
		// a record with a number missing, or a number that is text
		without(EVENING, 'seconds'),
		without(EVENING, 'start'),
		without(EVENING, 'id'),
		record(EVENING, { distance_m: '34.7' }),
		record(EVENING, { steps: null }),
		record(EVENING, { steps: 66.5 }),
		record(EVENING, { kcal: Number.NaN }),
		record(EVENING, { end: Number.POSITIVE_INFINITY }),
		record(EVENING, { kcal_extra: 'none' }),
		// an id that is no time
		record(EVENING, { id: 'walk-1' }),
		record(EVENING, { id: '20261340-256199' }),
		record(EVENING, { id: '2026-11-19T21:30:00' })
	];
	for (const other of others) assert.equal(fromWalka(other), null, JSON.stringify(other)?.slice(0, 80));
});

test('a number outside what the database takes is refused, and not cut down to fit', () => {
	const day = 86_400;
	const start = JSON.parse(EVENING).start as number;
	const refused: [string, Record<string, unknown>][] = [
		['longer than a day', { seconds: 86_400.1, end: start + 2 * day }],
		['less than no time', { seconds: -1 }],
		['more than 200 km', { distance_m: 200_000.1 }],
		['a distance below zero', { distance_m: -0.1 }],
		['more than 400,000 steps', { steps: 400_001 }],
		['steps below zero', { steps: -1 }],
		['more than 20,000 kcal', { kcal: 20_000.1 }],
		['calories below zero', { kcal: -5 }],
		['calories on top of sitting below zero', { kcal_extra: -0.1 }],
		['it ends before it starts', { end: start - 60 }],
		['it lasts longer than two days', { end: start + 2 * day + 1 }],
		['the belt moved for longer than the walk lasted', { seconds: 200 }],
		['long before Walka', { id: '19991231-230000', start: 946_681_200 - 3600, end: 946_681_200 - 3000 }],
		['in the days to come', { id: '20991119-213000', start: 4_098_889_800, end: 4_098_889_860 }],
		['a day that is not the day it started', { id: '20261122-213000' }]
	];
	for (const [what, change] of refused) assert.equal(fromWalka(record(EVENING, change)), null, what);

	// right at the limits it is taken
	const most = fromWalka(record(EVENING, { seconds: 86_400, end: start + day, distance_m: 200_000, steps: 400_000, kcal: 20_000, kcal_extra: 20_000 }));
	assert.deepEqual([most?.seconds, most?.distance_m, most?.steps, most?.kcal, most?.kcal_extra], [86_400, 200_000, 400_000, 20_000, 20_000]);
	assert.ok(fromWalka(record(EVENING, { seconds: 0, distance_m: 0, steps: 0, kcal: 0 })));
	// a clock that is a little ahead is fine: two days of room, as in the database
	const soon = Date.now() / 1000 + 3600;
	const at = new Date((soon + 3600) * 1000).toISOString();
	const id = `${at.slice(0, 10).replace(/-/g, '')}-${at.slice(11, 19).replace(/:/g, '')}`;
	assert.ok(fromWalka(record(EVENING, { id, start: soon, end: soon + 60 })));
});

test('outside() says which number it is', () => {
	const walk = fromWalka(JSON.parse(OLD))!;
	assert.equal(outside(walk), null);
	assert.match(outside({ ...walk, seconds: 90_000 })!, /time walked is more than a day/);
	assert.match(outside({ ...walk, seconds: 1900 })!, /longer than the walk lasted/);
	assert.match(outside({ ...walk, distance_m: 250_000 })!, /distance is more than 200 km/);
	assert.match(outside({ ...walk, steps: 500_000 })!, /more than 400,000 steps/);
	assert.match(outside({ ...walk, steps: 12.5 })!, /whole number/);
	assert.match(outside({ ...walk, kcal: 30_000 })!, /more than 20,000 kcal/);
	assert.match(outside({ ...walk, ended_at: '2025-03-01T07:15:00.000Z' })!, /ends before it starts/);
	assert.match(outside({ ...walk, local_day: '2025-03-09' })!, /day does not fit/);
	assert.match(outside({ ...walk, local_day: '2025-02-30' })!, /not a day/);
	assert.match(outside({ ...walk, started_at: 'yesterday' })!, /not a time/);
	assert.match(outside({ ...walk, client_id: 'x'.repeat(65) })!, /longer than 64/);
	assert.match(outside(walk, Date.parse('2025-02-01T00:00:00Z'))!, /days to come/);
	// the day before and the day after are both possible, somewhere on Earth
	assert.equal(outside({ ...walk, local_day: '2025-03-01' }), null);
	assert.equal(outside({ ...walk, local_day: '2025-03-03' }), null);
});

// ---- a TCX file ----------------------------------------------------------------------

test('a TCX file as Walka exports it becomes a walk', () => {
	const walks = inZone('Europe/Berlin', () => fromTcx(EVENING_TCX));
	assert.deepEqual(walks, [
		{
			origin: 'file',
			client_id: '2026-11-19T20:30:00Z',
			started_at: '2026-11-19T20:30:00.000Z',
			// 40 seconds walked: later than its last point, at 20:30:36
			ended_at: '2026-11-19T20:30:40.000Z',
			local_day: '2026-11-19',
			seconds: 40,
			// the lap's distance, not a track point's
			distance_m: 34.7,
			steps: 66,
			kcal: 2
		} satisfies NewWalk
	]);
	// a walk without a track
	assert.deepEqual(inZone('Europe/Berlin', () => fromTcx(OLD_TCX)), [
		{ origin: 'file', client_id: '2025-03-02T07:15:00Z', started_at: '2025-03-02T07:15:00.000Z', ended_at: '2025-03-02T07:43:20.000Z', local_day: '2025-03-02', seconds: 1700, distance_m: 1500, steps: 2100, kcal: 101 }
	]);
});

test('nothing but the totals is taken from a TCX file: not its notes, its heart rate or its points', () => {
	for (const text of [EVENING_TCX, MIDNIGHT_TCX, OLD_TCX]) {
		const [walk] = fromTcx(text);
		assert.deepEqual(Object.keys(walk).sort(), ['client_id', 'distance_m', 'ended_at', 'kcal', 'local_day', 'origin', 'seconds', 'started_at', 'steps'].sort());
		assert.doesNotMatch(JSON.stringify(walk), /UREVO|pad|session|131|treadmill|0\.889/);
	}
});

test('the same walk from Walka\'s own file and from its TCX export starts in the same second, so the database counts it once', () => {
	const second = (walk: NewWalk | null | undefined) => Math.floor(Date.parse(walk!.started_at) / 1000);
	assert.equal(second(fromTcx(EVENING_TCX)[0]), second(fromWalka(JSON.parse(EVENING))));
	assert.equal(second(fromTcx(MIDNIGHT_TCX)[0]), second(fromWalka(JSON.parse(MIDNIGHT))));
	assert.equal(second(fromTcx(OLD_TCX)[0]), second(fromWalka(JSON.parse(OLD))));
});

test('a walk from a TCX file counts for the day it started on this computer', () => {
	// 23:59:40 on the 14th in Berlin, and its last point is on the 15th there
	const berlin = inZone('Europe/Berlin', () => fromTcx(MIDNIGHT_TCX))[0];
	assert.equal(berlin.local_day, '2026-11-14');
	assert.equal(berlin.ended_at, '2026-11-14T23:00:25.000Z');
	assert.equal(inZone('America/Los_Angeles', () => fromTcx(MIDNIGHT_TCX))[0].local_day, '2026-11-14');
	assert.equal(inZone('Asia/Tokyo', () => fromTcx(MIDNIGHT_TCX))[0].local_day, '2026-11-15');
	// a time written with its own zone is that moment all the same
	const zoned = inZone('Europe/Berlin', () => fromTcx(OLD_TCX.replaceAll('2025-03-02T07:15:00Z', '2025-03-02T23:45:00.000-08:00')))[0];
	assert.equal(zoned.started_at, '2025-03-03T07:45:00.000Z');
	assert.equal(zoned.local_day, '2025-03-03');
	assert.equal(zoned.client_id, '2025-03-02T23:45:00.000-08:00');
});

// what another program writes: its own prefixes, several laps, no steps, a comment, two activities
const ELSEWHERE = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<tcx:TrainingCenterDatabase xmlns:tcx="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ax="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
<!-- <Activity><Id>2020-01-01T00:00:00Z</Id><Lap><TotalTimeSeconds>60</TotalTimeSeconds></Lap></Activity> -->
<tcx:Activities>
<tcx:Activity Sport="Running">
<tcx:Id>2026-10-04T06:10:00.000Z</tcx:Id>
<tcx:Lap StartTime='2026-10-04T06:10:00.000Z'><tcx:TotalTimeSeconds>600</tcx:TotalTimeSeconds><tcx:DistanceMeters>805.25</tcx:DistanceMeters><tcx:Calories>40</tcx:Calories>
<tcx:Track><tcx:Trackpoint><tcx:Time>2026-10-04T06:15:00.000Z</tcx:Time><tcx:DistanceMeters>400</tcx:DistanceMeters></tcx:Trackpoint></tcx:Track>
<tcx:Extensions><ax:LX><ax:AvgSpeed>1.34</ax:AvgSpeed><ax:Steps>1010</ax:Steps></ax:LX></tcx:Extensions></tcx:Lap>
<tcx:Lap StartTime="2026-10-04T06:25:00.000Z"><tcx:TotalTimeSeconds>3.0E2</tcx:TotalTimeSeconds><tcx:DistanceMeters>400.5</tcx:DistanceMeters><tcx:Calories>21</tcx:Calories>
<tcx:Track><tcx:Trackpoint><tcx:Time>2026-10-04T06:31:30.000Z</tcx:Time><tcx:DistanceMeters>1205.75</tcx:DistanceMeters></tcx:Trackpoint></tcx:Track>
<tcx:Extensions><ax:LX><ax:Steps>505</ax:Steps></ax:LX></tcx:Extensions></tcx:Lap>
<tcx:Creator><tcx:Name>Some watch</tcx:Name><tcx:UnitId>3900000000</tcx:UnitId><tcx:ProductID>1234</tcx:ProductID></tcx:Creator>
</tcx:Activity>
<tcx:Activity Sport="Other">
<tcx:Id>2026-10-05T17:00:00Z</tcx:Id>
<tcx:Lap StartTime="2026-10-05T17:00:00Z"><tcx:TotalTimeSeconds>1200.0</tcx:TotalTimeSeconds><tcx:DistanceMeters>1500.0</tcx:DistanceMeters><tcx:Calories>80</tcx:Calories><tcx:Intensity>Active</tcx:Intensity></tcx:Lap>
</tcx:Activity>
</tcx:Activities>
</tcx:TrainingCenterDatabase>`;

test('a TCX file from elsewhere: its laps are added up, a walk without steps has 0, several activities are several walks', () => {
	const walks = inZone('UTC', () => fromTcx(ELSEWHERE));
	assert.deepEqual(walks, [
		{
			origin: 'file',
			client_id: '2026-10-04T06:10:00.000Z',
			started_at: '2026-10-04T06:10:00.000Z',
			// its last point, after a pause between the laps
			ended_at: '2026-10-04T06:31:30.000Z',
			local_day: '2026-10-04',
			seconds: 900,
			distance_m: 1205.8,
			steps: 1515,
			kcal: 61
		},
		{ origin: 'file', client_id: '2026-10-05T17:00:00Z', started_at: '2026-10-05T17:00:00.000Z', ended_at: '2026-10-05T17:20:00.000Z', local_day: '2026-10-05', seconds: 1200, distance_m: 1500, steps: 0, kcal: 80 }
	]);
	// steps without a prefix, as some programs write them
	assert.equal(fromTcx(OLD_TCX.replace('<ns3:LX><ns3:Steps>2100</ns3:Steps></ns3:LX>', '<LX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2"><Steps>2100</Steps></LX>'))[0].steps, 2100);
	// no distance and no calories in a lap: none are made up
	const bare = fromTcx('<TrainingCenterDatabase><Activities><Activity Sport="Other"><Id>2026-10-05T17:00:00Z</Id><Lap StartTime="2026-10-05T17:00:00Z"><TotalTimeSeconds>60</TotalTimeSeconds></Lap></Activity></Activities></TrainingCenterDatabase>');
	assert.deepEqual([bare[0].seconds, bare[0].distance_m, bare[0].steps, bare[0].kcal], [60, 0, 0, 0]);
});

test('what is not a walk in a TCX file is left out', () => {
	const activity = (inside: string) => `<TrainingCenterDatabase><Activities><Activity Sport="Biking">${inside}</Activity></Activities></TrainingCenterDatabase>`;
	const lap = (inside: string, start = '2026-10-05T17:00:00Z') => `<Id>${start}</Id><Lap StartTime="${start}">${inside}</Lap>`;
	const nothing = [
		'',
		'not a file of walks',
		EVENING,
		'<html><body><h1>Activity</h1></body></html>',
		'<TrainingCenterDatabase><Activities></Activities></TrainingCenterDatabase>',
		'<TrainingCenterDatabase><Courses><Course><Name>Round the lake</Name><Lap><TotalTimeSeconds>600</TotalTimeSeconds><DistanceMeters>900</DistanceMeters></Lap></Course></Courses></TrainingCenterDatabase>',
		// no start, or one that is not a time
		activity('<Lap><TotalTimeSeconds>600</TotalTimeSeconds></Lap>'),
		activity(lap('<TotalTimeSeconds>600</TotalTimeSeconds>', 'last Thursday')),
		activity(lap('<TotalTimeSeconds>600</TotalTimeSeconds>', '2026-13-45T99:00:00Z')),
		// no lap, a lap without its time, a number that is not one
		activity('<Id>2026-10-05T17:00:00Z</Id>'),
		activity(lap('<DistanceMeters>900</DistanceMeters>')),
		activity(lap('<TotalTimeSeconds>ten minutes</TotalTimeSeconds>')),
		activity(lap('<TotalTimeSeconds>600</TotalTimeSeconds><DistanceMeters>0x10</DistanceMeters>')),
		activity(lap('<TotalTimeSeconds>600</TotalTimeSeconds><Extensions><LX><Steps>10.5</Steps></LX></Extensions>')),
		// outside the database's limits: a ride of 300 km, a week on the road, a walk in the year 2099
		activity(lap('<TotalTimeSeconds>36000</TotalTimeSeconds><DistanceMeters>300000</DistanceMeters>')),
		activity(lap('<TotalTimeSeconds>600000</TotalTimeSeconds><DistanceMeters>900</DistanceMeters>')),
		activity(lap('<TotalTimeSeconds>600</TotalTimeSeconds><Track><Trackpoint><Time>2026-10-12T17:00:00Z</Time></Trackpoint></Track>')),
		activity(lap('<TotalTimeSeconds>600</TotalTimeSeconds>', '2099-10-05T17:00:00Z')),
		activity(lap('<TotalTimeSeconds>-5</TotalTimeSeconds>'))
	];
	for (const text of nothing) assert.deepEqual(fromTcx(text), [], text.slice(0, 120));
	// one bad activity does not take the good one with it
	assert.equal(fromTcx(ELSEWHERE.replace('<tcx:TotalTimeSeconds>1200.0</tcx:TotalTimeSeconds>', '<tcx:TotalTimeSeconds>soon</tcx:TotalTimeSeconds>')).length, 1);
});

// ---- any file the person picked ----------------------------------------------------------

test('a picked file gives its walks, or a plain reason why not', () => {
	assert.deepEqual(readFile('20261119-213000.json', EVENING), { walks: [fromWalka(JSON.parse(EVENING))], refused: [] });
	assert.deepEqual(readFile('walka-20261119-213000.tcx', EVENING_TCX), { walks: fromTcx(EVENING_TCX), refused: [] });
	// (a file saved with a mark at its very start, as some editors do)
	assert.equal(readFile('20261119-213000.json', `\uFEFF${EVENING}\n`).walks.length, 1);
	assert.equal(readFile('export.xml', `\uFEFF\n${EVENING_TCX}`).walks.length, 1);

	const why = (name: string, text: string) => {
		const read = readFile(name, text);
		assert.deepEqual(read.walks, []);
		assert.equal(read.refused.length, 1);
		assert.equal(read.refused[0].file, name);
		return read.refused[0].why;
	};
	assert.match(why('config.json', '{"version":3,"profile":{"weight_kg":80}}'), /not one of Walka's walks/);
	assert.match(why('notes.txt', 'walked a lot today'), /not one of Walka's walks, and not a TCX file/);
	assert.match(why('empty.json', ''), /not one of Walka's walks/);
	assert.match(why('page.tcx', '<TrainingCenterDatabase></TrainingCenterDatabase>'), /no walk in this file/);
	assert.match(why('20261119-213000.json', JSON.stringify(record(EVENING, { steps: 900_000 }))), /more than 400,000 steps/);
	// the walk that is still going on is Walka's to finish
	assert.match(why('active-session.json', EVENING), /still recording/);
	assert.match(why('C:\\Users\\me\\AppData\\Roaming\\Walka\\active-session.json', EVENING), /still recording/);

	// in a file of several walks, the one left out is named by its start
	const mixed = readFile('october.tcx', ELSEWHERE.replace('<tcx:DistanceMeters>1500.0</tcx:DistanceMeters>', '<tcx:DistanceMeters>250000</tcx:DistanceMeters>'));
	assert.equal(mixed.walks.length, 1);
	assert.deepEqual(mixed.refused, [{ file: 'october.tcx, 2026-10-05T17:00:00Z', why: 'The distance is more than 200 km (124 miles).' }]);
});
