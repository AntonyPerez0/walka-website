// The local Supabase stack, for the tests that need a real database.
//
//   npx supabase@3.2.0 start      (once; needs Docker)
//   npm run test:database
//
// Every test signs in the way a visitor does: a six-digit code from the
// sign-in mail, read from the stack's test mailbox.

import { execFileSync } from 'node:child_process';

type Status = { API_URL: string; PUBLISHABLE_KEY: string; SERVICE_ROLE_KEY: string; MAILPIT_URL: string; DB_URL: string };

let status: Status | null = null;
export function stack(): Status {
	if (status) return status;
	try {
		status = JSON.parse(execFileSync('npx', ['-y', 'supabase@3.2.0', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
	} catch {
		throw new Error('No local Supabase stack is running. Start one: npx supabase@3.2.0 start');
	}
	return status!;
}

export type Answer = { status: number; body: any };

/** One request to the stack, as the page would make it. `token` is a signed-in person's; without one it is a visitor. */
export async function ask(method: string, path: string, body?: unknown, token?: string, extra: Record<string, string> = {}): Promise<Answer> {
	const { API_URL, PUBLISHABLE_KEY } = stack();
	const response = await fetch(`${API_URL}${path}`, {
		method,
		headers: {
			apikey: PUBLISHABLE_KEY,
			...(token ? { authorization: `Bearer ${token}` } : {}),
			'content-type': 'application/json',
			prefer: 'return=representation',
			...extra
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	});
	const text = await response.text();
	let parsed: unknown = text;
	try {
		parsed = JSON.parse(text);
	} catch {
		// not JSON: the text itself
	}
	return { status: response.status, body: parsed };
}

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** The newest sign-in mail to an address: its subject and its six digits. */
export async function mailFor(address: string): Promise<{ subject: string; code: string; text: string }> {
	const { MAILPIT_URL } = stack();
	for (let tries = 0; tries < 60; tries++) {
		const list = await (await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`)).json();
		const newest = list.messages?.[0];
		if (newest) {
			const mail = await (await fetch(`${MAILPIT_URL}/api/v1/message/${newest.ID}`)).json();
			const text: string = mail.Text || mail.HTML || '';
			const code = `${mail.Subject} ${text}`.match(/\b(\d{6})\b/)?.[1];
			if (code) return { subject: mail.Subject, code, text };
		}
		await pause(250);
	}
	throw new Error(`No sign-in mail with a code arrived for ${address}.`);
}

export type Person = { email: string; id: string; token: string };

let made = 0;
/** A new person, signed in with the code from the mail. */
export async function signIn(name = 'test'): Promise<Person> {
	const email = `${name}-${Date.now()}-${++made}@example.com`;
	const sent = await ask('POST', '/auth/v1/otp', { email, create_user: true });
	if (sent.status !== 200) throw new Error(`Asking for a code failed: ${sent.status} ${JSON.stringify(sent.body)}`);
	const { code } = await mailFor(email);
	const session = await ask('POST', '/auth/v1/verify', { type: 'email', email, token: code });
	if (session.status !== 200) throw new Error(`The code was refused: ${session.status} ${JSON.stringify(session.body)}`);
	return { email, id: session.body.user.id, token: session.body.access_token };
}

/** The first step of an account ("I am 18 or older"), and - if asked - the consent to body and food data. */
export async function open(person: Person, consent = false): Promise<void> {
	const row = { adult_confirmed_at: new Date().toISOString(), ...(consent ? { body_food_consent_at: new Date().toISOString() } : {}) };
	const made = await ask('POST', '/rest/v1/profiles', row, person.token);
	if (made.status !== 201) throw new Error(`Opening the account failed: ${made.status} ${JSON.stringify(made.body)}`);
}

/** As the database's administrator: for looking, and for setting a test up. Never as "the visitor". */
export async function admin(sql: string): Promise<string> {
	return execFileSync('psql', [stack().DB_URL, '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' }).trim();
}

export const walk = (startsAt: string, more: Record<string, unknown> = {}) => {
	const start = new Date(startsAt);
	return {
		origin: 'web',
		client_id: `w-${startsAt}`,
		started_at: start.toISOString(),
		ended_at: new Date(start.getTime() + 30 * 60_000).toISOString(),
		local_day: start.toISOString().slice(0, 10),
		seconds: 1800,
		distance_m: 1200,
		steps: 1600,
		kcal: 95,
		...more
	};
};

/** A moment some days ago, at 10:00 UTC. */
export const daysAgo = (n: number) => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - n, 10)).toISOString();
