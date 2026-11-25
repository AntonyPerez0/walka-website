// What a photographed nutrition label says about calories, from the text
// the label reader made of it. Text read off a photo is often wrong in
// places, so this only suggests numbers: the person sees them, can change
// them, and nothing is written down until they say so.
//
// Two kinds of label are common:
//   - "per 100 g" (Europe, the UK, much of the world): "Energy 1046 kJ /
//     250 kcal", often with a second column per portion;
//   - "per serving" (the US, Canada): "Serving size 2/3 cup (55g)" and
//     "Calories 230".

export type LabelReading = {
	/** calories in 100 g (or 100 ml), if the label says so or it can be worked out */
	per100: number | null;
	/** calories in one serving, if the label says so */
	perServing: number | null;
	/** grams in one serving, if the label says so */
	servingG: number | null;
	/** what the serving is called, if the label says ("2/3 cup") */
	servingName: string | null;
};

const number = (text: string) => Number(text.replace(',', '.'));
const plausible = (kcal: number) => Number.isFinite(kcal) && kcal >= 0 && kcal <= 1000;

export function readLabel(raw: string): LabelReading {
	// The reader confuses some letters with digits, and writes "kcal" in many ways.
	const text = raw
		.replace(/\r/g, '')
		.replace(/[|]/g, ' ')
		.replace(/\b[kK][cC]a[lI1]\b/g, 'kcal')
		.replace(/\b[kK][jJ]\b/g, 'kJ')
		.replace(/(\d)\s+(?=kcal|kJ|g\b)/g, '$1 ');
	const lower = text.toLowerCase();

	// ---- the serving: "Serving size 2/3 cup (55g)", "per portion (30 g)", "1 serving = 40 g"
	let servingG: number | null = null;
	let servingName: string | null = null;
	const serving =
		/serving size[:\s]*([^\n(]*?)\s*\(?\s*(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i.exec(text) ??
		/(?:per|1)\s*(?:portion|serving)[^\d\n]{0,12}\(?\s*(\d+(?:[.,]\d+)?)\s*(?:g|ml)\b/i.exec(text) ??
		/per\s*(?!100\s*(?:g|ml))(\d+(?:[.,]\d+)?)\s*(?:g|ml)\s*(?:portion|serving)/i.exec(text);
	if (serving) {
		const grams = number(serving[serving.length - 1]);
		if (grams > 0 && grams <= 5000) servingG = Math.round(grams * 10) / 10;
		const name = serving.length > 2 ? serving[1].trim().replace(/\s+/g, ' ') : '';
		servingName = name && name.length <= 40 && /[a-z]/i.test(name) ? name : null;
	}

	// ---- "per 100 g": the first kcal figure near "energy", on a label that says "100 g"
	let per100: number | null = null;
	let perServing: number | null = null;
	const kcals = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*kcal/gi)].map((match) => number(match[1])).filter(plausible);
	const says100 = /(per|pour|pro|je|por)?\s*100\s*(g|ml)\b/i.test(text);
	if (kcals.length && says100) {
		per100 = kcals[0];
		if (kcals.length > 1 && servingG) perServing = kcals[1];
	} else if (kcals.length && !says100) {
		perServing = kcals[0];
	}

	// ---- US style: "Calories 230" (per serving)
	if (per100 === null && perServing === null) {
		const calories = /calories[^\d\n]{0,8}(\d{1,4})\b/i.exec(lower);
		if (calories && !/calories from fat/i.test(calories[0])) {
			const kcal = Number(calories[1]);
			if (plausible(kcal) || (kcal > 0 && kcal <= 5000)) perServing = kcal;
		}
	}

	// ---- kJ only: worked out (1 kcal = 4.184 kJ)
	if (per100 === null && says100) {
		const kj = /(\d+(?:[.,]\d+)?)\s*kJ/i.exec(text);
		if (kj) {
			const kcal = Math.round(number(kj[1]) / 4.184);
			if (plausible(kcal)) per100 = kcal;
		}
	}

	if (per100 === null && perServing !== null && servingG) {
		const kcal = Math.round((perServing / servingG) * 1000) / 10;
		if (plausible(kcal)) per100 = kcal;
	}
	return { per100, perServing, servingG, servingName };
}
