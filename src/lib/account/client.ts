// The one connection to the database, made the first time it is needed.
//
// The library is fetched only then, so the public pages never load it.

import type { SupabaseClient } from '@supabase/supabase-js';
import { ACCOUNTS } from './config.ts';

/** Under this name the sign-in is kept in this browser's local storage. */
export const KEPT_AS = 'walka-account';

let made: Promise<SupabaseClient> | null = null;

export function database(): Promise<SupabaseClient> {
	if (!ACCOUNTS.on) return Promise.reject(new Error('This site has no accounts.'));
	made ??= import('@supabase/supabase-js').then(({ createClient }) =>
		createClient(ACCOUNTS.url, ACCOUNTS.key, {
			auth: {
				// Signing in through another site comes back with a one-time code
				// in the address, never with the session itself.
				flowType: 'pkce',
				detectSessionInUrl: true,
				persistSession: true,
				autoRefreshToken: true,
				// kept in this browser's local storage, under this name
				storageKey: KEPT_AS
			}
		})
	);
	return made;
}

/** A promise that gives up: a database that is asleep answers late or never. */
export function within<T>(ms: number, work: PromiseLike<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('No answer in time.')), ms);
		Promise.resolve(work).then(
			(value) => (clearTimeout(timer), resolve(value)),
			(error) => (clearTimeout(timer), reject(error))
		);
	});
}
