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
	},

	// Accounts. The three below say which Supabase project keeps them. Left
	// empty, the site has no accounts: the account pages say "not open yet"
	// and nothing on the site talks to a database.
	SUPABASE_URL: {
		description:
			'The address of the Supabase project that keeps the accounts, for example ' +
			'"https://abcdefghijklmnop.supabase.co". Empty: no accounts.',
		public: true,
		static: true,
		schema: (value) => (value ?? '').trim().replace(/\/+$/, '')
	},
	SUPABASE_KEY: {
		description:
			"That project's PUBLIC key - the one Supabase calls \"publishable\" (it starts with sb_publishable_), " +
			'or the older "anon" key. It is meant to be in the pages; the rules in the database are what ' +
			'protects the data. Never the secret key, and never the "service_role" key: the build refuses those.',
		public: true,
		static: true,
		schema: (value) => {
			const key = (value ?? '').trim();
			if (key.startsWith('sb_secret_')) throw new Error('SUPABASE_KEY is a secret key. Use the publishable key.');
			if (/^eyJ/.test(key)) {
				// an older key is a signed note that says which role it is for
				let role = '';
				try {
					role = JSON.parse(atob((key.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/'))).role ?? '';
				} catch {
					// not a key at all: the check below says so
				}
				if (role !== 'anon') throw new Error(`SUPABASE_KEY must be the public ("anon") key, and this one is for "${role || 'nobody'}".`);
			}
			return key;
		}
	},
	SIGN_IN: {
		description:
			'The ways to sign in that are switched on in the Supabase project, with commas between them: ' +
			'"email" (a six-digit code sent by e-mail), "discord", "google", "github". Empty means "email".',
		public: true,
		static: true,
		schema: (value) =>
			(value ?? '')
				.split(',')
				.map((way) => way.trim().toLowerCase())
				.filter((way) => ['email', 'discord', 'google', 'github'].includes(way))
				.join(',') || 'email'
	}
});
