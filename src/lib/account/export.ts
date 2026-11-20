// Everything an account holds, as one file. The person's own browser reads
// their own rows and saves them: nothing is made ready on a server.

import { database } from './client.ts';

const TABLES = ['profiles', 'body', 'walks', 'foods', 'food_entries', 'food_settings'] as const;
const PAGE = 1000; // the database gives at most this many rows at a time

export async function everything(): Promise<Record<string, unknown>> {
	const db = await database();
	const out: Record<string, unknown> = {
		what: 'Everything kept in your Walka account',
		made: new Date().toISOString(),
		explained: 'https://github.com/AntonyPerez0/walka-website/blob/HEAD/docs/data-model.md'
	};
	for (const table of TABLES) {
		const rows: unknown[] = [];
		for (let from = 0; ; from += PAGE) {
			// (rows marked as deleted are in it too: they are still kept, until the account is deleted)
			const { data, error } = await db.from(table).select('*').order('created_at').range(from, from + PAGE - 1);
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
