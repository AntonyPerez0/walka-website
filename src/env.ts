import { defineEnvVars } from '@sveltejs/kit/env';

// Settings the build reads from the environment. Nothing here is a secret:
// every value marked `public` ends up in the pages that visitors download.
export const variables = defineEnvVars({
	SITE_URL: {
		description:
			'The public address of the site, for example "https://antonyperez0.github.io/walka-website". ' +
			'The deploy workflow asks GitHub Pages for it; in a local build it is empty. Only the few ' +
			'places that must name a full address use it (the canonical link, the sitemap, the picture ' +
			'for link previews). Every other link on the site is relative, so the same build works ' +
			'under the github.io address and on a domain of its own.',
		public: true,
		static: true,
		schema: (value) => (value ?? '').trim().replace(/\/+$/, '')
	}
});
