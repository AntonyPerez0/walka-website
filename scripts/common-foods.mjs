// Makes static/food/common-foods.json: the plain foods the food diary finds
// at once, as somebody types, without a connection - apples, rice, milk,
// chicken breast. Run by hand when the list should be made again:
//
//   node scripts/common-foods.mjs <folder of USDA's "SR Legacy" CSV files>
//
// The folder is FoodData_Central_sr_legacy_food_csv_2018-04, from
// https://fdc.nal.usda.gov/download-datasets (the "SR Legacy" download, CSV).
// USDA's data is in the public domain; the diary names its source as it does
// for the foods its search finds (Sources.svelte).
//
// Of each food the list keeps what the diary keeps of any food: its USDA
// number (so that it is the same food as one found by the online search),
// its name, its calories in 100 g, and one serving if USDA names one.
// Baby foods, branded products and laboratory samples are left out.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = process.argv[2];
if (!folder) {
	console.error('Usage: node scripts/common-foods.mjs <folder of the SR Legacy CSV files>');
	process.exit(1);
}
const out = fileURLToPath(new URL('../static/food/common-foods.json', import.meta.url));

/** The rows of a CSV file as objects. Fields are in double quotes; a quote inside one is doubled. */
async function rows(name) {
	const text = await readFile(join(folder, name), 'utf8');
	const records = [];
	let field = '';
	let record = [];
	let quoted = false;
	for (let at = 0; at < text.length; at++) {
		const letter = text[at];
		if (quoted) {
			if (letter === '"' && text[at + 1] === '"') (field += '"'), at++;
			else if (letter === '"') quoted = false;
			else field += letter;
		} else if (letter === '"') quoted = true;
		else if (letter === ',') record.push(field), (field = '');
		else if (letter === '\n' || letter === '\r') {
			if (letter === '\r' && text[at + 1] === '\n') at++;
			record.push(field);
			field = '';
			if (record.length > 1 || record[0]) records.push(record);
			record = [];
		} else field += letter;
	}
	if (field || record.length) record.push(field), records.push(record);
	const [head, ...body] = records;
	return body.map((values) => Object.fromEntries(head.map((key, index) => [key, values[index] ?? ''])));
}

// Food categories left out (food_category.csv): baby foods, the branded
// products database, quality-control materials.
const LEFT_OUT = new Set(['3', '26', '27']);
const ENERGY_KCAL = '1008';

const foods = (await rows('food.csv')).filter((food) => !LEFT_OUT.has(food.food_category_id));
const kcal = new Map();
for (const row of await rows('food_nutrient.csv')) if (row.nutrient_id === ENERGY_KCAL) kcal.set(row.fdc_id, Number(row.amount));
const units = new Map((await rows('measure_unit.csv')).map((row) => [row.id, row.name]));
// One serving for each food: a piece of it where USDA names one ("1 medium",
// "1 slice", "1 serving"), otherwise USDA's first.
// (in this order: the first word found wins)
const PIECES = ['medium', 'serving', 'slice', 'piece', 'large', 'patty', 'link', 'roll', 'muffin', 'cookie', 'bar', 'sandwich', 'item', 'each', 'fruit', 'container', 'small'];
const rank = (portion) => {
	const words = `${portion.portion_description} ${portion.modifier}`.toLowerCase();
	if (/extra (small|large)/.test(words)) return PIECES.length;
	const at = PIECES.findIndex((piece) => new RegExp(`\\b${piece}\\b`).test(words));
	return at === -1 ? PIECES.length : at;
};
const portions = new Map();
const better = (a, b) => rank(a) - rank(b) || Number(a.seq_num) - Number(b.seq_num);
for (const row of await rows('food_portion.csv')) {
	const before = portions.get(row.fdc_id);
	if (!before || better(row, before) < 0) portions.set(row.fdc_id, row);
}

const one = (value) => Math.round(value * 10) / 10;
/** "1 cup, chopped", "1 medium (3" dia)", "1 serving" */
function servingName(portion) {
	const amount = Number(portion.amount);
	const unit = units.get(portion.measure_unit_id);
	const words = [unit && unit !== 'undetermined' ? unit : '', portion.portion_description, portion.modifier].filter(Boolean).join(', ');
	return `${Number.isFinite(amount) && amount > 0 ? `${one(amount)} ` : ''}${words}`.trim().slice(0, 60);
}

const list = [];
for (const food of foods) {
	const energy = kcal.get(food.fdc_id);
	if (energy === undefined || !Number.isFinite(energy) || energy < 0 || energy > 1000) continue;
	// "(Includes foods for USDA's Food Distribution Program)" and the like say nothing to somebody eating
	const name = food.description.replace(/\s*\((?:Includes|includes)[^)]*\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
	if (!name) continue;
	const portion = portions.get(food.fdc_id);
	const grams = portion ? Number(portion.gram_weight) : NaN;
	const item = { i: food.fdc_id, n: name, k: one(energy) };
	if (Number.isFinite(grams) && grams > 0 && grams <= 5000) Object.assign(item, { g: one(grams), s: servingName(portion) });
	list.push(item);
}
list.sort((a, b) => a.n.localeCompare(b.n, 'en'));

await mkdir(fileURLToPath(new URL('../static/food/', import.meta.url)), { recursive: true });
await writeFile(
	out,
	JSON.stringify({
		source: 'USDA FoodData Central, SR Legacy (April 2018). Public domain.',
		fields: { i: 'FDC id', n: 'name', k: 'kcal in 100 g', g: 'grams in one serving', s: 'what the serving is' },
		foods: list
	})
);
console.log(`${list.length} foods written to static/food/common-foods.json`);
