// Finding common foods as somebody types.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { best, fit, fromList } from '../src/lib/food/common.ts';

const list = (JSON.parse(readFileSync(new URL('../static/food/common-foods.json', import.meta.url), 'utf8')) as { foods: { i: string; n: string; k: number; g?: number; s?: string }[] }).foods;
const names = (typed: string, most = 3) => best(typed, list, (item) => item.n, most).map((item) => item.n);

test('every typed word must begin a word of the name', () => {
	assert.equal(fit(['ban'], 'Bananas, raw'), fit(['ban'], 'Bananas, raw'));
	assert.notEqual(fit(['ban'], 'Bananas, raw'), null);
	assert.equal(fit(['nana'], 'Bananas, raw'), null);
	assert.equal(fit(['banana', 'cake'], 'Bananas, raw'), null);
	assert.notEqual(fit(['apples'], 'Apple juice, canned'), null, 'a plural finds the singular');
	assert.notEqual(fit(['creme'], 'Crème fraîche'), null, 'accents do not matter');
});

test('the plain food comes first', () => {
	assert.equal(names('banana')[0], 'Bananas, raw');
	assert.match(names('apple')[0], /^Apples?, raw/);
	assert.match(names('egg')[0], /^Egg, (whole|white|yolk)/);
	assert.match(names('milk')[0], /^Milk, /);
	assert.ok(names('rice cooked', 10).some((name) => /^Rice, white, .*cooked/.test(name)));
	assert.deepEqual(names(''), []);
});

test('a common food is a USDA food, with its serving if it has one', () => {
	const banana = list.find((item) => item.n === 'Bananas, raw')!;
	const food = fromList(banana);
	assert.equal(food.source, 'usda');
	assert.equal(food.source_id, banana.i);
	assert.equal(food.kcal_100g, 89);
	assert.equal(food.serving_g, 118);
	assert.match(food.serving_label!, /^1 medium/);
	assert.equal(fromList({ i: '1', n: 'Salt', k: 0 }).serving_label, null);
});

test('the list is whole and plausible', () => {
	assert.ok(list.length > 7000);
	for (const item of list) {
		assert.match(item.i, /^\d+$/);
		assert.ok(item.n.length > 0 && item.n.length <= 120);
		assert.ok(item.k >= 0 && item.k <= 1000, item.n);
		if (item.g !== undefined) assert.ok(item.g > 0 && item.g <= 5000 && item.s, item.n);
	}
	assert.equal(new Set(list.map((item) => item.i)).size, list.length, 'no number twice');
});
