// Accounts: where they are kept, and whether the site has any.
//
// The three settings come from the build (src/env.ts). The key is the
// project's PUBLIC key. It is meant to be in the page: what protects a
// person's rows is the rules in the database (supabase/migrations), which
// let a signed-in person at their own rows and nobody at anyone else's.

import { SIGN_IN, SUPABASE_KEY, SUPABASE_URL } from '$app/env/public';

export type Way = 'email' | 'discord' | 'google' | 'github';

export const ACCOUNTS = {
	/** False: the site has no accounts, and talks to no database. */
	on: Boolean(SUPABASE_URL && SUPABASE_KEY),
	url: SUPABASE_URL,
	key: SUPABASE_KEY,
	/** The ways to sign in that the project has switched on. */
	ways: SIGN_IN.split(',').filter(Boolean) as Way[]
};

export const WAY_NAMES: Record<Exclude<Way, 'email'>, string> = {
	discord: 'Discord',
	google: 'Google',
	github: 'GitHub'
};
