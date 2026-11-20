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
	},

	// Three things the privacy page and the terms say once the site has
	// accounts. They are words for a page, not switches. A site with accounts
	// that names nobody to write to would break its own promise, so
	// scripts/verify.mjs refuses such a build and says which one is missing.
	CONTACT: {
		description:
			'An e-mail address at which the owner of the site can be reached in private about an account or ' +
			'about privacy, for example "privacy@example.org". With accounts it is shown on the privacy page and ' +
			'in the terms, so it is public: use an address made for this. It must look like an e-mail address, ' +
			'or be empty.',
		public: true,
		static: true,
		schema: (value) => {
			const address = (value ?? '').trim();
			if (address && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>".]+$/.test(address)) {
				throw new Error('CONTACT must be an e-mail address, like "privacy@example.org", or be left empty.');
			}
			return address;
		}
	},
	ACCOUNTS_REGION: {
		description:
			'Where the Supabase project keeps its data, in the words the privacy page should use, for example ' +
			'"Frankfurt, Germany". It is the region chosen when the project was made, written as a place and ' +
			"not as Supabase's code for it.",
		public: true,
		static: true,
		schema: (value) => (value ?? '').trim()
	},
	MAIL_SENDER: {
		description:
			'The name of the service that sends the sign-in mail, as the privacy page should name it, for example ' +
			'"Resend": the mail service (SMTP) set up in the Supabase project. It is given the e-mail address of ' +
			'everyone who asks for a sign-in code. Needed only when SIGN_IN has "email" in it.',
		public: true,
		static: true,
		schema: (value) => (value ?? '').trim()
	}
});
