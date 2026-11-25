import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The oldest browsers the styles are written out for: the name Lightning CSS
// has for each, the name Vite has for it, and the version.
const OLDEST = [
	['chrome', 'chrome', 109, 0],
	['edge', 'edge', 109, 0],
	['firefox', 'firefox', 115, 0],
	['safari', 'safari', 15, 6],
	['ios_saf', 'ios', 15, 6]
] as const;

// Accounts, if the build was told where they are kept (src/env.ts). Then -
// and only then - a page may talk to that database, and to Open Food Facts,
// which the food diary asks about foods.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const SUPABASE_URL = (env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
// (typed as 'self' only because the policy's own type wants one of its known
// forms, and an address read at build time is just a string to it)
const ACCOUNT_HOSTS = (SUPABASE_URL ? [SUPABASE_URL, 'https://world.openfoodfacts.org'] : []) as 'self'[];

export default defineConfig({
	// Styles are written once, in today's CSS (nesting, light-dark()), and
	// lowered at build time for browsers a few years old.
	css: {
		transformer: 'lightningcss',
		lightningcss: {
			targets: Object.fromEntries(OLDEST.map(([name, , major, minor]) => [name, (major << 16) | (minor << 8)]))
		}
	},
	// ONNX Runtime (the food diary's dish recogniser) in the build that takes
	// its WebAssembly from where it is told - static/food-tools, fetched only
	// when it is used - rather than one that puts 15 MB among the site's own
	// scripts, which the diary keeps for working without a connection.
	resolve: {
		conditions: ['onnxruntime-web-use-extern-wasm', 'module', 'browser', 'development|production']
	},
	build: {
		cssMinify: 'lightningcss',
		// (the pass that makes the styles small takes its browsers from here,
		// not from the list above. Left to itself it writes "(width <= 40rem)",
		// which Safari before 16.4 does not read: every rule for a narrow
		// screen would be lost there)
		cssTarget: OLDEST.map(([, name, major, minor]) => `${name}${major}${minor ? `.${minor}` : ''}`)
	},

	plugins: [
		sveltekit({
			compilerOptions: {
				// Runes mode for this project's own components. Can go with Svelte 6.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
			},

			// Every page is made at build time: the result is plain files for
			// GitHub Pages. There is no fallback page from SvelteKit, because
			// such a page needs to know the address the site is served from;
			// static/404.html is written by hand and knows no address.
			adapter: adapter({ pages: 'build', assets: 'build', strict: true }),

			// No `paths.base`: links and files are written relative to the page
			// they are on (SvelteKit's default), so the same build works at
			// https://<user>.github.io/walka-website/ and at the root of a domain.

			// What a page may load. Pages are prerendered, so this becomes a
			// <meta http-equiv="Content-Security-Policy"> in each of them, with
			// a hash for SvelteKit's own start-up script.
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					// WebAssembly, for the food diary's readers (barcodes, labels, dishes), which run on
					// the phone. It lets a page compile WebAssembly from its own files, nothing more.
					'script-src': ['self', 'wasm-unsafe-eval'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:'],
					'font-src': ['self'],
					// The downloads page asks GitHub which version is the latest.
					'connect-src': ['self', 'https://api.github.com', ...ACCOUNT_HOSTS],
					'manifest-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			},

			// The food diary has a service worker (src/service-worker.ts), so that
			// it opens without a connection. Only that page starts it, and only
			// for itself: the public pages are never served from a cache of ours.
			serviceWorker: { register: false },

			prerender: {
				// A link to a page or an anchor that does not exist stops the build.
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		})
	]
});
