// Makes the web versions of the pictures in src/images.
//
// Each picture is written to static/img as AVIF and WebP at a few widths,
// plus one fallback in its own format, and listed in
// src/lib/generated/images.json - which is what <Picture> reads.
//
// A file's name carries a hash of the picture it was made from, so a picture
// that changes gets a new address, and one that has not changed is not made
// again. Both folders are made by this script and are not in git: put a
// picture in src/images and run `npm run dev` or `npm run build`.

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceDir = join(root, 'src/images');
const outDir = join(root, 'static/img');
const manifestFile = join(root, 'src/lib/generated/images.json');

// The widths a picture is offered at (never wider than the picture itself).
// The widest is enough for the largest picture on the site on a screen with
// two device pixels to the pixel.
const WIDTHS = [480, 768, 1080, 1440, 1920, 2560];
// The fallback, for the few browsers that read neither AVIF nor WebP.
const FALLBACK_WIDTH = 1080;
// Bump this to make every picture again after changing the settings below.
const RECIPE = 'v2';

const ENCODERS = {
	// Screenshots are flat colour and small text: keep the colour detail.
	// (effort 3: a higher effort makes files a tenth smaller and takes seven
	// times as long, which every build on GitHub would pay.)
	avif: (image) => image.avif({ quality: 62, effort: 3, chromaSubsampling: '4:4:4' }),
	webp: (image) => image.webp({ quality: 84, effort: 4, smartSubsample: true }),
	png: (image) => image.png({ palette: true, quality: 90, effort: 8 }),
	jpg: (image) => image.jpeg({ quality: 84, mozjpeg: true })
};

const TYPES = { avif: 'image/avif', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' };

function widthsFor(sourceWidth) {
	const widest = WIDTHS.at(-1);
	if (sourceWidth >= widest) return [...WIDTHS];
	const widths = WIDTHS.filter((w) => w < sourceWidth);
	// The picture's own width is the largest one - unless a listed width is
	// already within a tenth of it.
	const last = widths.at(-1);
	if (!last || sourceWidth / last > 1.1) widths.push(sourceWidth);
	else widths[widths.length - 1] = sourceWidth;
	return widths;
}

/** Runs the jobs, a few at a time (as many as the computer has cores). */
async function inParallel(jobs) {
	let next = 0;
	const worker = async () => {
		while (next < jobs.length) await jobs[next++]();
	};
	await Promise.all(Array.from({ length: Math.min(availableParallelism(), jobs.length) }, worker));
}

async function main() {
	const entries = existsSync(sourceDir) ? await readdir(sourceDir) : [];
	const pictures = entries.filter((name) => /\.(png|jpe?g)$/i.test(name)).sort();
	await mkdir(outDir, { recursive: true });
	await mkdir(join(root, 'src/lib/generated'), { recursive: true });

	const manifest = {};
	const wanted = new Set();
	const jobs = []; // the files that are not there yet
	let made = 0;

	for (const file of pictures) {
		const name = basename(file, extname(file));
		const bytes = await readFile(join(sourceDir, file));
		const hash = createHash('sha256').update(RECIPE).update(bytes).digest('hex').slice(0, 8);
		const { width, height } = await sharp(bytes).metadata();
		const own = /\.png$/i.test(file) ? 'png' : 'jpg';

		const write = (format, w) => {
			const out = `${name}.${hash}-${w}.${format}`;
			wanted.add(out);
			if (!existsSync(join(outDir, out))) {
				jobs.push(async () => {
					const image = sharp(bytes).resize({ width: w, withoutEnlargement: true });
					// (written under another name first: a build that is stopped
					// half-way must not leave half a picture behind)
					await ENCODERS[format](image).toFile(join(outDir, `${out}.part`));
					await rename(join(outDir, `${out}.part`), join(outDir, out));
					made += 1;
				});
			}
			return { file: `img/${out}`, width: w };
		};

		const widths = widthsFor(width);
		const sources = [];
		for (const format of ['avif', 'webp']) {
			sources.push({ type: TYPES[format], set: widths.map((w) => write(format, w)) });
		}
		const fallbackWidth = Math.min(FALLBACK_WIDTH, width);
		const fallback = write(own, fallbackWidth);

		manifest[name] = {
			width,
			height,
			sources,
			fallback: { ...fallback, height: Math.round((height * fallbackWidth) / width), type: TYPES[own] }
		};
	}

	await inParallel(jobs);

	// Whatever is left over from a picture that changed or was removed.
	for (const old of await readdir(outDir)) {
		if (!wanted.has(old)) await rm(join(outDir, old));
	}

	const json = JSON.stringify(manifest, null, '\t') + '\n';
	const before = existsSync(manifestFile) ? await readFile(manifestFile, 'utf8') : '';
	if (json !== before) await writeFile(manifestFile, json);

	console.log(`images: ${pictures.length} pictures, ${wanted.size} files in static/img (${made} made now)`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
