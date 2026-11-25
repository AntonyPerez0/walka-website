// Puts the food diary's three readers into static/food-tools/, from where
// the site serves them itself - nothing is loaded from anybody else:
//
//   barcode/  the barcode reader's engine (zxing-wasm, MIT), for browsers
//             that cannot read a barcode by themselves (Safari, Firefox);
//   ocr/      the label reader (tesseract.js, Apache-2.0) with its English
//             data (@tesseract.js-data/eng, Apache-2.0 data under MIT);
//   dish/     the dish recogniser: ONNX Runtime Web (MIT) and a ConvNeXt-tiny
//             model fine-tuned on Food-101 (Apache-2.0), fetched once from
//             Hugging Face at the revision below and checked by its SHA-256.
//
// Each is fetched by a phone only when the person first uses it, and runs on
// the phone: no picture is sent anywhere. The folder is made by this script
// and is not in git. Run by `npm run dev` and `npm run build`.

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'static/food-tools');
const cache = join(root, 'node_modules/.cache/walka-food-tools');
const modules = join(root, 'node_modules');

const COPIES = [
	['zxing-wasm/dist/reader/zxing_reader.wasm', 'barcode/zxing_reader.wasm'],
	['tesseract.js/dist/worker.min.js', 'ocr/worker.min.js'],
	['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'ocr/tesseract-core-simd-lstm.wasm.js'],
	['tesseract.js-core/tesseract-core-lstm.wasm.js', 'ocr/tesseract-core-lstm.wasm.js'],
	// (the reader picks the one the phone's processor can run: newer ones take this)
	['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'ocr/tesseract-core-relaxedsimd-lstm.wasm.js'],
	['@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'ocr/eng.traineddata.gz'],
	['onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', 'dish/ort-wasm-simd-threaded.wasm'],
	['onnxruntime-web/dist/ort-wasm-simd-threaded.mjs', 'dish/ort-wasm-simd-threaded.mjs']
];

// The dish model: the revision and checksum it was tried at (12 photos of
// Food-101's own test set, 9 named first and the rest among the first three).
const MODEL = {
	repo: 'juan1211/pratos-convnext-tiny-food101',
	revision: '2f29e0eab1496f94cff2c54d1841cdce23dd23cb',
	file: 'onnx/model_quantized.onnx',
	sha256: '8655ddf28090880784de3c4ff9fa10454af58c8734dea523666119e9c2bbea3e'
};

async function place(from, to) {
	await mkdir(dirname(to), { recursive: true });
	await copyFile(from, to);
}

for (const [from, to] of COPIES) await place(join(modules, from), join(out, to));

// ---- the model, fetched once and kept in node_modules/.cache ----------------------------
const kept = join(cache, `${MODEL.sha256}.onnx`);
const keptLabels = join(cache, `${MODEL.revision}-config.json`);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fetchOnce(address, file, check) {
	if (existsSync(file)) return true;
	try {
		const answer = await fetch(address, { signal: AbortSignal.timeout(300_000) });
		if (!answer.ok) throw new Error(`${answer.status}`);
		const bytes = Buffer.from(await answer.arrayBuffer());
		if (check && !check(bytes)) throw new Error('the file is not the one that was tried');
		await mkdir(cache, { recursive: true });
		await writeFile(file, bytes);
		return true;
	} catch (error) {
		console.warn(`food-tools: could not fetch ${address} (${error.message}). The dish recogniser is left out of this build.`);
		return false;
	}
}

const base = `https://huggingface.co/${MODEL.repo}/resolve/${MODEL.revision}`;
const haveModel = await fetchOnce(`${base}/${MODEL.file}`, kept, (bytes) => sha(bytes) === MODEL.sha256);
const haveLabels = await fetchOnce(`${base}/config.json`, keptLabels, (bytes) => {
	try {
		return Object.keys(JSON.parse(bytes.toString('utf8')).id2label ?? {}).length === 101;
	} catch {
		return false;
	}
});

if (haveModel && haveLabels) {
	await place(kept, join(out, 'dish/food101.onnx'));
	// "apple_pie" -> "Apple pie": the names the diary shows, in the model's own order
	const labels = JSON.parse(await readFile(keptLabels, 'utf8')).id2label;
	const names = Array.from({ length: 101 }, (_, index) => {
		const word = String(labels[String(index)] ?? '').replace(/_/g, ' ');
		return word.charAt(0).toUpperCase() + word.slice(1);
	});
	await writeFile(join(out, 'dish/labels.json'), JSON.stringify(names));
}
console.log(`food-tools: readers placed in static/food-tools${haveModel && haveLabels ? ', the dish recogniser with them' : ''}.`);
