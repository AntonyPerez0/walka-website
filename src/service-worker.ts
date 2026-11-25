/// <reference lib="webworker" />
// The food diary opens without a connection.
//
// This worker belongs to the food diary alone: only that page starts it
// (src/routes/(app)/food/+page.svelte), and only for its own folder. The
// public pages are never served from a cache of ours.
//
// What it does:
//  - keeps the files the diary is made of - the scripts, styles and fonts
//    (their names carry a mark of their contents, so a kept copy is never
//    out of date), the diary's own page, its manifest and its icons;
//  - answers those scripts, styles and fonts from what it kept;
//  - asks the network for the diary's page first, and gives the kept copy
//    only when there is no answer;
//  - never touches a request to anybody else (the database, Open Food
//    Facts), nor anything that is not a plain "give me this".

import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

const KEPT = `walka-food-${version}`;
const OURS = 'walka-food-';

// The build names its files from the folder this worker is in: the site's
// own folder, wherever the site is served from.
type Named = string | { path: string };
const here = (file: Named) => new URL(typeof file === 'string' ? file : file.path, self.location.href).href;

// (not WebAssembly: what the readers need is large, is fetched only when a reader is used, and is not kept here)
const SCRIPTS_AND_STYLES = immutable.filter((file: Named) => !/\.wasm$/.test(typeof file === 'string' ? file : file.path)).map(here);
const DIARY = here(prerendered.map((page: Named) => (typeof page === 'string' ? page : page.path)).find((path: string) => /^\/?food\/?(index\.html)?$/.test(path)) ?? 'food/');
// of everything in static/: what a phone needs to show the diary as an app
// (and the list of common foods, which the search finds without a connection; the readers in
// food-tools/ are large, are fetched only when first used, and are not kept here)
const ITS_OWN = assets.map(here).filter((address: string) => /\/(food\.webmanifest|icon-192\.png|icon-512\.png|icon-maskable-512\.png|favicon\.svg|favicon-32\.png|food\/common-foods\.json)$/.test(address));

const keep = new Set([...SCRIPTS_AND_STYLES, ...ITS_OWN]);

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(KEPT);
			// (one file that cannot be fetched must not stop the rest)
			await Promise.allSettled([...keep, DIARY].map((address) => cache.add(new Request(address, { cache: 'reload' }))));
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// what an older version of the diary kept is not needed any more
			for (const name of await caches.keys()) {
				if (name.startsWith(OURS) && name !== KEPT) await caches.delete(name);
			}
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const address = new URL(request.url);
	if (address.origin !== self.location.origin) return; // somebody else's: not ours to answer

	const plain = address.origin + address.pathname;

	// scripts, styles, fonts, icons: the kept copy, if there is one
	if (keep.has(plain)) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(KEPT);
				const kept = await cache.match(plain);
				if (kept) return kept;
				const fresh = await fetch(request);
				if (fresh.ok) void cache.put(plain, fresh.clone());
				return fresh;
			})()
		);
		return;
	}

	// the diary's own page: the network first, the kept copy when there is no answer
	if (request.mode === 'navigate') {
		event.respondWith(
			(async () => {
				const cache = await caches.open(KEPT);
				try {
					const fresh = await fetch(request);
					if (fresh.ok && plain === DIARY) void cache.put(DIARY, fresh.clone());
					return fresh;
				} catch (error) {
					const kept = await cache.match(DIARY);
					if (kept) return kept;
					throw error;
				}
			})()
		);
	}
	// anything else goes to the network as if this worker were not here
});
