// The food page's arithmetic. It is about people's food: every line of it is tried.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayBalance, floorFor, resting, usualPace, walkedExtra, walkingTime } from '../src/lib/account/estimates.ts';

test('the resting estimate: Mifflin-St Jeor times 1.2, or 24 kcal a kilogram when age or sex is missing', () => {
	assert.deepEqual(resting({ weight_kg: 80, height_cm: 180, birth_year: 1990, sex: 'male' }, 2026), { kcal: Math.round((800 + 1125 - 180 + 5) * 1.2), rough: false });
	assert.deepEqual(resting({ weight_kg: 60, height_cm: 165, birth_year: 1986, sex: 'female' }, 2026), { kcal: Math.round((600 + 1031.25 - 200 - 161) * 1.2), rough: false });
	assert.deepEqual(resting({ weight_kg: 70, height_cm: null, birth_year: null, sex: null }, 2026), { kcal: 1680, rough: true });
	assert.equal(resting({ weight_kg: null, height_cm: 180, birth_year: 1990, sex: 'male' }, 2026), null);
	assert.equal(resting(null), null);
});

test('a walk counts what it burned on top of sitting', () => {
	assert.equal(walkedExtra({ kcal: 150, kcal_extra: 90, seconds: 1800 }, 80), 90, 'Walka says so itself');
	assert.equal(walkedExtra({ kcal: 150, kcal_extra: null, seconds: 1800 }, 80), 150 - 1.3 * 80 * 0.5, 'worked out from the weight');
	assert.equal(walkedExtra({ kcal: 150, kcal_extra: 0, seconds: 1800 }, 80), 98, 'zero means not known');
	assert.equal(walkedExtra({ kcal: 10, kcal_extra: null, seconds: 3600 }, 80), 0, 'never less than nothing');
});

test('left to walk off is never less than zero', () => {
	const rest = { kcal: 2000, rough: false };
	assert.equal(dayBalance(1500, 200, rest, 0).left, 0);
	assert.equal(dayBalance(2500, 200, rest, 0).left, 300);
	assert.equal(dayBalance(2500, 200, rest, -300).left, 600);
	assert.equal(dayBalance(2500, 200, rest, 300).left, 0);
	assert.equal(dayBalance(0, 0, rest, -500).left, 0, 'an empty day is just an empty day');
	assert.equal(dayBalance(2500, 200, null, 0).left, null, 'no estimate without a weight');
});

test('a goal is never applied so far that it asks for less food than the floor', () => {
	const small = { kcal: 1450, rough: false }; // a small body at rest
	// burned 1450, goal -500: the aim would be 950 kcal. The floor is 1200.
	const day = dayBalance(1150, 0, small, -500, 'female');
	assert.equal(day.floored, true);
	assert.equal(day.left, 0, 'eating under the floor leaves nothing to walk off');
	assert.equal(dayBalance(1300, 0, small, -500, 'female').left, 100, 'only what is over the floor counts');
	assert.equal(dayBalance(1300, 0, small, -500, 'male').left, 0, 'the floor is 1500 where the estimate was made for a man');
	assert.equal(dayBalance(2600, 0, { kcal: 2400, rough: false }, -500, 'male').floored, false);
	assert.equal(floorFor(null), 1200);
});

test('as time: at the person\'s own pace, and not past two hours', () => {
	const walks = [
		{ kcal: 150, kcal_extra: 90, seconds: 1800 }, // 3 a minute
		{ kcal: 300, kcal_extra: 240, seconds: 3600 }, // 4 a minute
		{ kcal: 20, kcal_extra: 15, seconds: 120 }, // too short to go by
		{ kcal: 100, kcal_extra: 50, seconds: 600 } // 5 a minute
	];
	assert.equal(usualPace(walks, 80), 4, 'the middle one');
	assert.equal(usualPace([], 80), null);
	assert.equal(walkingTime(100, 4), 25);
	assert.equal(walkingTime(1000, 4), null, 'more than a walk covers');
	assert.equal(walkingTime(0, 4), null);
	assert.equal(walkingTime(100, null), null);
});
