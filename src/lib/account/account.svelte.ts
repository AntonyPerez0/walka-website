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
import { forgetDiary } from '#lib/food/local.ts';
import { database, within } from './client.ts';
import { ACCOUNTS, type Way } from './config.ts';
import type { Profile } from './types.ts';

export type Where = 'off' | 'starting' | 'unavailable' | 'out' | 'in';

/** What went wrong, in plain words. */
export function say(error: unknown): string {
	const text = String((error as { message?: string })?.message ?? error ?? '');
	if (/only request this after|security purposes/i.test(text)) return 'A code went to this address less than a minute ago. Use that one, or wait a minute and ask for a new one.';
	if (/rate limit|too many|over_email_send/i.test(text)) return 'Too many tries in a short time. Wait a few minutes and try again.';
	if (/expired|invalid.*(otp|token)|otp.*invalid/i.test(text)) return 'That code is not right, or it is too old. Ask for a new one.';
	if (/not free|profiles_handle_key/i.test(text)) return 'That name is not free.';
	if (/display_name/i.test(text)) return 'That name cannot be shown: use plain letters, and not a name the site itself could have.';
	if (/only after you have agreed/i.test(text)) return 'Body and food numbers are kept only after you have agreed to that.';
	if (/cannot be below zero/i.test(text)) return 'With these body numbers, a goal below zero is not offered here.';
	if (/days to come|day to come/i.test(text)) return 'That is a day to come.';
	if (/walks_one_start/i.test(text)) return 'There is already a walk that starts at that moment.';
	if (/violates check constraint|out of range|invalid input/i.test(text)) return 'One of these numbers is outside what Walka takes.';
	if (/row-level security|permission denied/i.test(text)) return 'That is not yours to change.';
	if (/failed to fetch|networkerror|load failed|no answer in time/i.test(text)) return 'No answer from the database. Check your connection and try again.';
	if (/for adults/i.test(text)) return 'Walka is for adults.';
	if (/room for/i.test(text)) return text;
	return text ? `That did not work: ${text}` : 'That did not work.';
}

/**
 * Nothing of the food diary stays on this device: its copy (entries, foods,
 * body numbers, what was not sent yet) and the small marks it kept. Called
 * whenever nobody is signed in any more, and when the agreement to keep
 * body and food data is not there (any more).
 */
async function forgetHere(): Promise<void> {
	await forgetDiary().catch(() => {});
	try {
		localStorage.removeItem('walka-food-quiet');
		for (const key of Object.keys(sessionStorage)) if (key.startsWith('walka-food-')) sessionStorage.removeItem(key);
	} catch {
		// no storage: nothing was kept
	}
}

class Account {
	where = $state<Where>(ACCOUNTS.on ? 'starting' : 'off');
	userId = $state<string | null>(null);
	email = $state<string | null>(null);
	/** The person's row in "profiles". It is made at their first step in, not before. */
	profile = $state<Profile | null>(null);
	/** True once the profile has been asked for (it may still be null: a new account). */
	asked = $state(false);
	/** If the site's owner has taken this person's public page down: why. */
	held = $state<string | null>(null);

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
			await forgetHere();
			this.userId = this.email = this.profile = this.held = null;
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
		if (!data) {
			// No row: a new account - or one that was deleted on another device
			// while this one still held its sign-in. The sign-in service knows.
			const { error: gone } = await db.auth.getUser();
			if (gone) {
				await db.auth.signOut({ scope: 'local' }).catch(() => {});
				await this.#took(null);
				return;
			}
		}
		this.profile = data as Profile | null;
		this.asked = true;
		// without the agreement, nothing of the diary is kept here either
		if (!this.profile?.body_food_consent_at) await forgetHere();
		const { data: hold } = await db.from('profile_holds').select('reason').maybeSingle();
		this.held = (hold as { reason: string } | null)?.reason ?? null;
	}

	/**
	 * Where signing in comes back to: the page it was asked from (the account
	 * page, or the food diary - which, put on a phone's home screen, must come
	 * back to itself). Without what was after the "?" or the "#".
	 */
	#back(): string {
		return location.origin + location.pathname;
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

	async saveProfile(change: Partial<Pick<Profile, 'handle' | 'display_name' | 'is_public' | 'show_days' | 'show_steps' | 'show_walks' | 'units'>>): Promise<void> {
		const db = await database();
		const { data, error } = await db.from('profiles').update(change).eq('user_id', this.userId).select().single();
		if (error) throw error;
		this.profile = data as Profile;
	}

	/** "Keep my body numbers and my food diary in my account." The database notes when. */
	async agree(): Promise<void> {
		const db = await database();
		const { data, error } = await db.from('profiles').update({ body_food_consent_at: new Date().toISOString() }).eq('user_id', this.userId).select().single();
		if (error) throw error;
		this.profile = data as Profile;
	}

	/** Takes that back. The body numbers, the foods, the diary and the goal are deleted at once. */
	async withdraw(): Promise<void> {
		const db = await database();
		const { data, error } = await db.from('profiles').update({ body_food_consent_at: null }).eq('user_id', this.userId).select().single();
		if (error) throw error;
		await forgetHere();
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
