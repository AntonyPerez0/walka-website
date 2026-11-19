import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Styles are written once, in today's CSS (nesting, light-dark()), and
	// lowered at build time for browsers a few years old.
	css: {
		transformer: 'lightningcss',
		lightningcss: {
			targets: {
				chrome: 109 << 16,
				edge: 109 << 16,
				firefox: 115 << 16,
				safari: (15 << 16) | (6 << 8),
				ios_saf: (15 << 16) | (6 << 8)
			}
		}
	},
	build: { cssMinify: 'lightningcss' },

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
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:'],
					'font-src': ['self'],
					// The downloads page asks GitHub which version is the latest.
					'connect-src': ['self', 'https://api.github.com'],
					'manifest-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			},

			prerender: {
				// A link to a page or an anchor that does not exist stops the build.
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		})
	]
});
