// Who is signed in, and what the account pages need to know about them.
//
// One of these is true at any time (account.where):
//
//   off          the site has no accounts (nothing was set at build time)
//   starting     asking the database
//   unavailable  the database does not answer: the account pages say so,
//                and the rest of the site works as it always does
//   out          nobody is signed in
//   in           somebody is

import type { Session } from '@supabase/supabase-js';
import { resolve } from '$app/paths';
import { database, within } from './client.ts';
import { ACCOUNTS, type Way } from './config.ts';
import type { Profile } from './types.ts';

export type Where = 'off' | 'starting' | 'unavailable' | 'out' | 'in';

/** What went wrong, in plain words. */
export function say(error: unknown): string {
	const text = String((error as { message?: string })?.message ?? error ?? '');
	if (/rate limit|too many|over_email_send/i.test(text)) return 'Too many tries in a short time. Wait a few minutes and try again.';
	if (/expired|invalid.*(otp|token)|otp.*invalid/i.test(text)) return 'That code is not right, or it is too old. Ask for a new one.';
	if (/not free|duplicate key|profiles_handle_key/i.test(text)) return 'That name is not free.';
	if (/failed to fetch|networkerror|load failed|no answer in time/i.test(text)) return 'No answer from the database. Check your connection and try again.';
	if (/for adults/i.test(text)) return 'Walka is for adults.';
	if (/room for/i.test(text)) return text;
	return text ? `That did not work: ${text}` : 'That did not work.';
}

class Account {
	where = $state<Where>(ACCOUNTS.on ? 'starting' : 'off');
	userId = $state<string | null>(null);
	email = $state<string | null>(null);
	/** The person's row in "profiles". It is made at their first step in, not before. */
	profile = $state<Profile | null>(null);
	/** True once the profile has been asked for (it may still be null: a new account). */
	asked = $state(false);

	#started = false;

	/** Called by the account pages when they open. The public pages never call it. */
	async start(): Promise<void> {
		if (!ACCOUNTS.on || this.#started) return;
		this.#started = true;
		try {
			const db = await database();
			// Is the database there? A free project is put to sleep when it is
			// not used, and then it answers late or not at all.
			const { error } = await within(8000, db.rpc('ping'));
			if (error) throw error;
			const { data } = await db.auth.getSession();
			await this.#took(data.session);
			// (not awaited inside the callback: the library asks for that)
			db.auth.onAuthStateChange((_event, session) => void setTimeout(() => this.#took(session), 0));
		} catch {
			this.where = 'unavailable';
		}
	}

	/** "Try again" on the page that says the database does not answer. */
	retry(): Promise<void> {
		this.#started = false;
		this.where = 'starting';
		return this.start();
	}

	async #took(session: Session | null): Promise<void> {
		if (!session) {
			this.userId = this.email = this.profile = null;
			this.asked = false;
			this.where = 'out';
			return;
		}
		const same = this.userId === session.user.id;
		this.userId = session.user.id;
		this.email = session.user.email ?? null;
		this.where = 'in';
		if (!same || !this.asked) await this.loadProfile();
	}

	async loadProfile(): Promise<void> {
		if (!this.userId) return;
		const db = await database();
		const { data, error } = await db.from('profiles').select('*').eq('user_id', this.userId).maybeSingle();
		if (error) throw error;
		this.profile = data as Profile | null;
		this.asked = true;
	}

	/** Where signing in comes back to: the account page, wherever the site is served from. */
	#back(): string {
		return new URL(resolve('account/'), location.href).href;
	}

	/** Sends a six-digit code to the address. */
	async sendCode(email: string): Promise<void> {
		const db = await database();
		const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: this.#back() } });
		if (error) throw error;
	}

	async useCode(email: string, code: string): Promise<void> {
		const db = await database();
		const { data, error } = await db.auth.verifyOtp({ email, token: code.replace(/\D/g, ''), type: 'email' });
		if (error) throw error;
		await this.#took(data.session);
	}

	/** Leaves for the other site (Discord, Google, GitHub), which sends the visitor back. */
	async signInWith(way: Exclude<Way, 'email'>): Promise<void> {
		const db = await database();
		const { error } = await db.auth.signInWithOAuth({ provider: way, options: { redirectTo: this.#back() } });
		if (error) throw error;
	}

	async signOut(): Promise<void> {
		const db = await database();
		await db.auth.signOut({ scope: 'local' });
		await this.#took(null);
	}

	/** The first step in: "I am 18 or older, and I have read the terms." Makes the profile row. */
	async begin(): Promise<void> {
		const db = await database();
		const { data, error } = await db
			.from('profiles')
			.upsert({ user_id: this.userId, adult_confirmed_at: new Date().toISOString() }, { onConflict: 'user_id' })
			.select()
			.single();
		if (error) throw error;
		this.profile = data as Profile;
	}

	async saveProfile(change: Partial<Pick<Profile, 'handle' | 'display_name' | 'is_public' | 'show_walks' | 'show_kcal' | 'units'>>): Promise<void> {
		const db = await database();
		const { data, error } = await db.from('profiles').update(change).eq('user_id', this.userId).select().single();
		if (error) throw error;
		this.profile = data as Profile;
	}

	/** Deletes the account and every row with it. There is no way back. */
	async remove(): Promise<void> {
		const db = await database();
		const { error } = await db.rpc('delete_my_account');
		if (error) throw error;
		await db.auth.signOut({ scope: 'local' }).catch(() => {});
		await this.#took(null);
	}
}

export const account = new Account();
