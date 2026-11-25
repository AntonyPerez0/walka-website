// A person's walks as a spreadsheet file (CSV): one line for each walk,
// every number the account holds of it. Made in the person's own browser.
//
// The columns are the database's own (docs/data-model.md explains each),
// with two more that a spreadsheet wants: the start by the walker's own
// clock, and the distance in kilometres and miles. Calories are estimates,
// and their columns say so.

import type { Walk } from './types.ts';

export type CsvWalk = Pick<
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

const COLUMNS: [string, (walk: CsvWalk) => string | number | null][] = [
	['day', (walk) => walk.local_day],
	['local_start', (walk) => localStart(walk)],
	['started_at_utc', (walk) => walk.started_at],
	['ended_at_utc', (walk) => walk.ended_at],
	['utc_offset_min', (walk) => walk.utc_offset_min],
	['seconds_on_belt', (walk) => walk.seconds],
	['distance_m', (walk) => walk.distance_m],
	['distance_km', (walk) => round(walk.distance_m / 1000, 3)],
	['distance_mi', (walk) => round(walk.distance_m / 1609.344, 3)],
	['steps', (walk) => walk.steps],
	['kcal_estimate', (walk) => walk.kcal],
	['kcal_on_top_of_sitting_estimate', (walk) => walk.kcal_extra],
	['game_session', (walk) => walk.session],
	['steps_source', (walk) => walk.steps_source],
	['distance_source', (walk) => walk.distance_source],
	['calories_source', (walk) => walk.calories_source],
	['came_from', (walk) => walk.origin],
	['name_on_computer', (walk) => walk.client_id],
	['id', (walk) => walk.id]
];

const round = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

/** "2026-11-19 21:30": the start by the clock it was walked under, if the walk says what that was. */
function localStart(walk: CsvWalk): string | null {
	if (walk.utc_offset_min == null) return null;
	const at = Date.parse(walk.started_at);
	if (Number.isNaN(at)) return null;
	return new Date(at + walk.utc_offset_min * 60_000).toISOString().slice(0, 16).replace('T', ' ');
}

/** One cell. A text that a spreadsheet would take for a formula is kept as text. */
function cell(value: string | number | null): string {
	if (value === null || value === undefined) return '';
	let text = String(value);
	if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
	return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The whole file, oldest walk first, with a line of column names at the top. */
export function walksCsv(walks: CsvWalk[]): string {
	const sorted = [...walks].sort((a, b) => (a.started_at < b.started_at ? -1 : a.started_at > b.started_at ? 1 : 0));
	const lines = [COLUMNS.map(([name]) => name).join(',')];
	for (const walk of sorted) lines.push(COLUMNS.map(([, value]) => cell(value(walk))).join(','));
	return `${lines.join('\r\n')}\r\n`;
}
