// Numbers, as the site writes them.

import type { Units } from './types.ts';

const whole = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const two = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const count = (n: number) => whole.format(Math.round(n));

/** "1.24 mi", "12.4 km" */
export function distance(metres: number, units: Units): string {
	const value = units === 'mi' ? metres / 1609.344 : metres / 1000;
	return `${value >= 100 ? one.format(value) : two.format(value)} ${units}`;
}

/** "45 min", "1 h 05 min" */
export function duration(seconds: number): string {
	if (seconds > 0 && seconds < 30) return 'under 1 min';
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} min`;
	return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

/** "about 240 kcal": every calorie figure on the site is an estimate */
export const kcal = (n: number) => `${count(n)} kcal`;

/** The day it is here, now - or on which a moment fell here: "2026-11-19". */
export function localDay(when: Date = new Date()): string {
	const y = when.getFullYear();
	const m = String(when.getMonth() + 1).padStart(2, '0');
	const d = String(when.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** "2026-11-19" -> a Date at noon of that day here (noon: no clock change can move it to another day) */
export const dayDate = (day: string) => new Date(`${day}T12:00:00`);

/** "Thursday 19 November" - with the year when it is not this year */
export function dayName(day: string): string {
	const date = dayDate(day);
	const thisYear = date.getFullYear() === new Date().getFullYear();
	return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', ...(thisYear ? {} : { year: 'numeric' }) }).format(date);
}

/** "19 Nov" */
export const dayShort = (day: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(dayDate(day));

/** The day before or after: shiftDay("2026-11-19", -1) -> "2026-11-18" */
export function shiftDay(day: string, by: number): string {
	const date = dayDate(day);
	date.setDate(date.getDate() + by);
	return localDay(date);
}

/** "Mon": the day of the week, short */
export const weekdayShort = (day: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(dayDate(day));

/** "November 2026" from "2026-11" */
export const monthName = (month: string) => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(dayDate(`${month}-15`));

/** "Nov" from "2026-11" - with "’26" when it is not this year */
export function monthShort(month: string): string {
	const date = dayDate(`${month}-15`);
	const name = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date);
	return date.getFullYear() === new Date().getFullYear() ? name : `${name} ’${String(date.getFullYear()).slice(2)}`;
}

/** "4.1 km/h", "2.6 mph": a speed given in metres a second */
export function speed(metresPerSecond: number, units: Units): string {
	const value = units === 'mi' ? (metresPerSecond * 3600) / 1609.344 : (metresPerSecond * 3600) / 1000;
	return `${one.format(value)} ${units === 'mi' ? 'mph' : 'km/h'}`;
}

/** "14:38 min/km": how long one kilometre or mile takes at that speed */
export function pace(metresPerSecond: number, units: Units): string {
	if (!(metresPerSecond > 0)) return '-';
	const seconds = Math.round((units === 'mi' ? 1609.344 : 1000) / metresPerSecond);
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} min/${units}`;
}

/** "19:00" */
export const hourName = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`;
