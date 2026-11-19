// Serves the built site (the build folder) the way GitHub Pages does:
//
//   npm run preview                    -> http://127.0.0.1:4173/walka-website/
//   npm run preview -- --base /        -> http://127.0.0.1:4173/   (as on a domain of its own)
//   npm run preview -- --port 5000
//
// Like GitHub Pages it answers /page with /page/, serves 404.html (with
// status 404) for anything that is not there, compresses text, and sets no
// special headers.
// The same build has to work under a project address (/walka-website/) and
// at the root of a domain: try both before changing how links are written.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const args = process.argv.slice(2);
const option = (name, fallback) => {
	const at = args.indexOf(`--${name}`);
	return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};

const root = fileURLToPath(new URL(`../${option('dir', 'build')}`, import.meta.url));
const port = Number(option('port', '4173'));
const base = option('base', '/walka-website').replace(/\/+$/, ''); // '' at the root of a domain

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.webmanifest': 'application/manifest+json; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8',
	'.txt': 'text/plain; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.avif': 'image/avif',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2'
};

const isFile = async (path) => (await stat(path).catch(() => null))?.isFile() ?? false;
const isDirectory = async (path) => (await stat(path).catch(() => null))?.isDirectory() ?? false;

const server = createServer(async (request, response) => {
	const url = new URL(request.url ?? '/', 'http://localhost');
	let path;
	try {
		path = decodeURIComponent(url.pathname);
	} catch {
		path = url.pathname;
	}

	const send = async (file, status = 200) => {
		let body = await readFile(file);
		const type = TYPES[extname(file)] ?? 'application/octet-stream';
		const headers = { 'content-type': type, 'cache-control': 'max-age=600' };
		const text = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/.test(type);
		if (text && /\bgzip\b/.test(String(request.headers['accept-encoding'] ?? ''))) {
			body = gzipSync(body);
			headers['content-encoding'] = 'gzip';
			headers.vary = 'Accept-Encoding';
		}
		response.writeHead(status, headers);
		response.end(request.method === 'HEAD' ? undefined : body);
	};
	const redirect = (location) => {
		response.writeHead(301, { location });
		response.end();
	};
	const notFound = async () => {
		const page = join(root, '404.html');
		if (await isFile(page)) return send(page, 404);
		response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
		response.end('404');
	};

	if (base) {
		if (path === base) return redirect(`${base}/${url.search}`);
		if (!path.startsWith(`${base}/`)) return notFound();
		path = path.slice(base.length);
	}

	const file = join(root, normalize(path));
	if (file !== root && !file.startsWith(root + sep)) return notFound();

	if (path.endsWith('/')) {
		const index = join(file, 'index.html');
		return (await isFile(index)) ? send(index) : notFound();
	}
	if (await isFile(file)) return send(file);
	if (await isFile(`${file}.html`)) return send(`${file}.html`);
	if (await isDirectory(file)) return redirect(`${base}${path}/${url.search}`);
	return notFound();
});

server.listen(port, '127.0.0.1', () => {
	console.log(`Walka website, as GitHub Pages would serve it: http://127.0.0.1:${port}${base}/`);
});
