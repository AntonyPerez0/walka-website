// The food diary's three readers, all of which run on the phone itself:
//
//   - barcodes, from the camera or a photo: the browser's own reader where
//     it has one (Chrome on Android), otherwise zxing-wasm;
//   - the calories on a nutrition label, from a photo: tesseract.js reads
//     the text, label.ts finds the numbers in it;
//   - what a dish is, from a photo: a small model (ConvNeXt-tiny, trained on
//     Food-101's 101 dishes) run by ONNX Runtime Web.
//
// Their files are served by this site itself (scripts/food-tools.mjs puts
// them in static/food-tools) and fetched only when a reader is first used.
// No picture leaves the phone: what goes on from here is a barcode's digits,
// numbers read off a label, or the name of a dish.

import { asset } from '$app/paths';
import { readLabel, type LabelReading } from './label.ts';

/** An address of this site, whole: workers and WebAssembly want one. (Taken from a file every build has, so that it is right one folder down too.) */
const here = (path: string) => new URL(path, new URL(asset('favicon.svg'), globalThis.location?.href)).href;

// ---- barcodes ------------------------------------------------------------------------

export const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] as const;

export type BarcodeReader = { detect(source: ImageBitmapSource | HTMLVideoElement): Promise<{ rawValue: string }[]> };
type ReaderMaker = (new (options: { formats: string[] }) => BarcodeReader) & { getSupportedFormats?: () => Promise<string[]> };

let reader: Promise<BarcodeReader> | null = null;

/** A barcode reader: the browser's own if it reads shop barcodes, else the one this site brings. */
export function barcodeReader(): Promise<BarcodeReader> {
	reader ??= (async () => {
		const native = (globalThis as { BarcodeDetector?: ReaderMaker }).BarcodeDetector;
		if (native) {
			try {
				const formats = (await native.getSupportedFormats?.()) ?? [];
				if (formats.includes('ean_13')) return new native({ formats: [...FORMATS] });
			} catch {
				// not usable here: the site's own
			}
		}
		const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
		prepareZXingModule({
			overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? here(`food-tools/barcode/${path}`) : prefix + path) }
		});
		return new BarcodeDetector({ formats: [...FORMATS] }) as unknown as BarcodeReader;
	})();
	reader.catch(() => (reader = null));
	return reader;
}

/** Can this browser use a camera at all? (The reader itself it always has.) */
export const hasCamera = () => Boolean(globalThis.navigator?.mediaDevices?.getUserMedia);

/** The barcode on a photo, if one can be read: its digits. */
export async function barcodeOnPhoto(file: Blob): Promise<string | null> {
	const picture = await createImageBitmap(file);
	try {
		const found = await (await barcodeReader()).detect(picture);
		return found.find((code) => /^\d{8,14}$/.test(code.rawValue))?.rawValue ?? null;
	} finally {
		picture.close();
	}
}

// ---- pictures ---------------------------------------------------------------------------

/** A photo made smaller, on a canvas: a phone's photo has far more pixels than any reader needs. */
async function shrunk(file: Blob, longest: number): Promise<HTMLCanvasElement> {
	const picture = await createImageBitmap(file);
	const scale = Math.min(1, longest / Math.max(picture.width, picture.height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(picture.width * scale);
	canvas.height = Math.round(picture.height * scale);
	canvas.getContext('2d')!.drawImage(picture, 0, 0, canvas.width, canvas.height);
	picture.close();
	return canvas;
}

/** Work that gives up after a while: a reader that cannot start must not leave the page waiting. */
function within<T>(ms: number, work: Promise<T>): Promise<T> {
	return new Promise<T>((done, fail) => {
		const timer = setTimeout(() => fail(new Error('It took too long.')), ms);
		work.then(
			(value) => (clearTimeout(timer), done(value)),
			(error) => (clearTimeout(timer), fail(error))
		);
	});
}

// ---- labels -----------------------------------------------------------------------------

type Ocr = { recognize(image: HTMLCanvasElement): Promise<{ data: { text: string } }>; terminate(): Promise<unknown> };
let ocr: Promise<Ocr> | null = null;

/** The calories on a photographed label - suggestions only, for the person to check. */
export async function readLabelPhoto(file: Blob): Promise<LabelReading & { text: string }> {
	ocr ??= within(
		90_000,
		import('tesseract.js').then(({ createWorker }) =>
			createWorker('eng', 1, {
				workerPath: here('food-tools/ocr/worker.min.js'),
				corePath: here('food-tools/ocr/'),
				langPath: here('food-tools/ocr/'),
				// (a worker from this site's own address, not one made from a blob: the page's policy allows only the first)
				workerBlobURL: false,
				gzip: true,
				// (a reader that fails says so here, instead of leaving the page waiting)
				errorHandler: () => {}
			}) as Promise<Ocr>
		)
	);
	ocr.catch(() => (ocr = null));
	const canvas = await shrunk(file, 2000);
	const { data } = await within(60_000, (await ocr).recognize(canvas));
	return { ...readLabel(data.text), text: data.text };
}

// ---- dishes -----------------------------------------------------------------------------

type Ort = typeof import('onnxruntime-web/wasm');
type Session = import('onnxruntime-web/wasm').InferenceSession;
let dish: Promise<{ ort: Ort; session: Session; names: string[] }> | null = null;

/** The dish recogniser's files, all told, for the sentence that asks before they are fetched. */
export const DISH_MEGABYTES = 49;

/** Is the dish recogniser in this build? (The build leaves it out if the model could not be fetched.) */
export async function dishThere(): Promise<boolean> {
	try {
		return (await fetch(here('food-tools/dish/labels.json'), { method: 'HEAD' })).ok;
	} catch {
		return false;
	}
}

/** Has this browser fetched the recogniser already? (Then it starts at once, without a connection.) */
export async function dishFetched(): Promise<boolean> {
	try {
		return Boolean(await (await caches.open(DISH_CACHE)).match(here('food-tools/dish/food101.onnx')));
	} catch {
		return false;
	}
}

const DISH_CACHE = 'walka-food-dish-1';

/** A file of the recogniser: from this browser's own cache, or fetched once and kept there. */
async function kept(address: string): Promise<ArrayBuffer> {
	let cache: Cache | null = null;
	try {
		cache = await caches.open(DISH_CACHE);
		const found = await cache.match(address);
		if (found) return found.arrayBuffer();
	} catch {
		// no cache here: fetched each time
	}
	const answer = await fetch(address);
	if (!answer.ok) throw new Error(`The dish recogniser could not be fetched (${answer.status}).`);
	if (cache) await cache.put(address, answer.clone()).catch(() => {});
	return answer.arrayBuffer();
}

function startDish() {
	// (49 MB on a slow connection takes a while: five minutes before it gives up)
	dish ??= within(300_000, (async () => {
		const ort = await import('onnxruntime-web/wasm');
		// one thread, in this page: GitHub Pages cannot send the headers that several threads need
		ort.env.wasm.numThreads = 1;
		ort.env.wasm.proxy = false;
		ort.env.wasm.wasmPaths = { mjs: here('food-tools/dish/ort-wasm-simd-threaded.mjs'), wasm: here('food-tools/dish/ort-wasm-simd-threaded.wasm') };
		const [model, names] = await Promise.all([kept(here('food-tools/dish/food101.onnx')), fetch(here('food-tools/dish/labels.json')).then((answer) => answer.json() as Promise<string[]>)]);
		const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
		return { ort, session, names };
	})());
	dish.catch(() => (dish = null));
	return dish;
}

/** Fetches the recogniser (once) and starts it, so that a photo is read at once. */
export const prepareDish = () => startDish().then(() => undefined);

export type DishGuess = { name: string; share: number };

/**
 * What the dish on a photo may be: the model's three likeliest of its 101
 * dishes, likeliest first, with how sure it is (0 to 1). It knows only
 * those 101 dishes, and says nothing about how much is on the plate.
 */
export async function guessDish(file: Blob): Promise<DishGuess[]> {
	const { ort, session, names } = await startDish();
	// as the model was trained: the shorter side to 256 pixels, the middle 224 x 224, ImageNet's mean and spread
	const picture = await createImageBitmap(file);
	const side = 224;
	const scale = 256 / Math.min(picture.width, picture.height);
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = side;
	const context = canvas.getContext('2d', { willReadFrequently: true })!;
	const width = picture.width * scale;
	const height = picture.height * scale;
	context.drawImage(picture, (side - width) / 2, (side - height) / 2, width, height);
	picture.close();
	const pixels = context.getImageData(0, 0, side, side).data;
	const MEAN = [0.485, 0.456, 0.406];
	const SPREAD = [0.229, 0.224, 0.225];
	const input = new Float32Array(3 * side * side);
	for (let at = 0; at < side * side; at++) {
		for (let colour = 0; colour < 3; colour++) input[colour * side * side + at] = (pixels[at * 4 + colour] / 255 - MEAN[colour]) / SPREAD[colour];
	}
	const fed = { [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, side, side]) };
	const scores = (await session.run(fed))[session.outputNames[0]].data as Float32Array;
	const top = Math.max(...scores);
	const exp = Array.from(scores, (score) => Math.exp(score - top));
	const total = exp.reduce((sum, value) => sum + value, 0);
	return exp
		.map((value, index) => ({ name: names[index] ?? '', share: value / total }))
		.sort((a, b) => b.share - a.share)
		.slice(0, 3);
}
