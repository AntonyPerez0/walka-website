// Everything an account holds, as one file. The person's own browser reads
// their own rows and saves them: nothing is made ready on a server.

import { database } from './client.ts';

const TABLES = ['profiles', 'body', 'walks', 'foods', 'food_entries', 'food_settings', 'reports'] as const;
const PAGE = 1000; // the database gives at most this many rows at a time

export async function everything(): Promise<Record<string, unknown>> {
	const db = await database();
	const out: Record<string, unknown> = {
		what: 'Everything kept in your Walka account',
		made: new Date().toISOString(),
		explained: 'https://github.com/AntonyPerez0/walka-website/blob/HEAD/docs/data-model.md'
	};
	// what the sign-in itself keeps: the address, when the account was made, the last sign-in, the ways in
	const { data: signIn } = await db.auth.getUser();
	out.sign_in = signIn.user
		? {
				email: signIn.user.email,
				created_at: signIn.user.created_at,
				last_sign_in_at: signIn.user.last_sign_in_at,
				ways: signIn.user.identities?.map((identity) => identity.provider) ?? []
			}
		: null;
	for (const table of TABLES) {
		const rows: unknown[] = [];
		for (let from = 0; ; from += PAGE) {
			// (rows marked as deleted are in it too: they are still kept, until the account is deleted)
			// (in an order that is the same every time, so that no page of it skips a row)
			const key = table === 'profiles' || table === 'body' || table === 'food_settings' ? 'user_id' : 'id';
			const { data, error } = await db.from(table).select('*').order('created_at').order(key).range(from, from + PAGE - 1);
			if (error) throw error;
			rows.push(...(data ?? []));
			if (!data || data.length < PAGE) break;
		}
		out[table] = rows;
	}
	return out;
}

/** Hands the visitor a file to save. */
export function save(name: string, text: string, type = 'application/json'): void {
	const link = document.createElement('a');
	link.href = URL.createObjectURL(new Blob([text], { type }));
	link.download = name;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}
