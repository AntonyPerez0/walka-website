// Calories read off a photographed nutrition label (as text).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readLabel } from '../src/lib/food/label.ts';

test('a European label: per 100 g, and per portion beside it', () => {
	const text = `NUTRITION INFORMATION\nTypical values Per 100g Per 30g portion\nEnergy 1569kJ 471kJ\n 373kcal 112kcal\nFat 7.0g 2.1g\nCarbohydrate 60g 18g`;
	const read = readLabel(text);
	assert.equal(read.per100, 373);
	assert.equal(read.servingG, 30);
	assert.equal(read.perServing, 112);
});

test('a US label: calories per serving, worked out per 100 g', () => {
	const text = `Nutrition Facts\n8 servings per container\nServing size 2/3 cup (55g)\nAmount per serving\nCalories 230\n% Daily Value*\nTotal Fat 8g 10%`;
	const read = readLabel(text);
	assert.equal(read.perServing, 230);
	assert.equal(read.servingG, 55);
	assert.equal(read.servingName, '2/3 cup');
	assert.equal(read.per100, 418.2);
});

test('the reader\'s usual slips: "KCaI", a comma, kJ only', () => {
	assert.equal(readLabel('Energie pro 100 g 250 KCaI').per100, 250);
	assert.equal(readLabel('per 100 ml Energy 45,5 kcal').per100, 45.5);
	assert.equal(readLabel('Per 100g Energy 1046 kJ').per100, 250);
});

test('nothing that looks like calories: nothing suggested', () => {
	assert.deepEqual(readLabel('Ingredients: water, sugar, lemon juice'), { per100: null, perServing: null, servingG: null, servingName: null });
	assert.equal(readLabel('per 100 g 9999 kcal').per100, null, 'not more than 1,000 kcal in 100 g');
	assert.equal(readLabel('Calories from Fat 90').perServing, null);
});
