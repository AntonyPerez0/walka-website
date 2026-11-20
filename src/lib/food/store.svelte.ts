// The food diary's data. This is the ONE place where the diary reads and
// writes the database (the tables foods, food_entries and food_settings,
// and - reading only - body and walks), and where it keeps its copy on the
// device (local.ts).
//
// How it works, in the habits of docs/data-model.md ("Syncing"):
//
//   - Everything the person does is written to the device's copy first and
//     noted in an outbox. The outbox is sent when there is a connection:
//     at once, when the browser says "online", and when the page is shown
//     again. So the diary takes entries without a connection.
//   - A row gets its id here (crypto.randomUUID()), so that sending it twice
//     changes nothing.
//   - A food from a source is kept once: it is sent with "on conflict
//     (user_id, source, source_id)", and the id that comes back is the id -
//     another device may have picked the same barcode first. Foods are sent
//     before the entries that point at them.
//   - A change to an entry says which version it changes; if another device
//     was first, the row is fetched and the change is made on that.
//   - Deleting is marking, and a deleted row stays deleted. The mark goes
//     into the outbox only when the "Undo" line has gone - or at once when
//     the page is hidden or left.
//   - A row the database refuses is set aside and shown, not sent for ever.

import type { SupabaseClient } from '@supabase/supabase-js';
import { say } from '#lib/account/account.svelte.ts';
import { database } from '#lib/account/client.ts';
import { ACCOUNTS } from '#lib/account/config.ts';
import { localDay, shiftDay } from '#lib/account/format.ts';
import type { Body, Food, FoodEntry, FoundFood, Meal, Walk } from '#lib/account/types.ts';
import { forgetDiary, holder, openLocal, type Local, type Step } from './local.ts';
import { clean, LIMITS, refusal, round1, underweight } from './numbers.ts';
import type { Project } from './sources.ts';

/** Of a walk the diary needs only when it was, how long, and its calories. */
export type WalkPart = Pick<Walk, 'id' | 'local_day' | 'started_at' | 'seconds' | 'kcal' | 'kcal_extra'>;
export type BodyPart = Pick<Body, 'weight_kg' | 'height_cm' | 'birth_year' | 'sex'>;
/** A food in the device's copy: the row, and when it was last picked here (for "Recent"). */
export type KeptFood = Food & { used: number };

type EntryField = 'local_day' | 'meal' | 'food_id' | 'name' | 'brand' | 'grams' | 'kcal';
export type EntryDraft = Pick<FoodEntry, 'meal' | 'food_id' | 'name' | 'brand' | 'grams' | 'kcal'>;
export type OwnFood = Pick<Food, 'name' | 'kcal_100g' | 'serving_g' | 'serving_label'>;

/** Something written here and not yet sent. One for each row, whatever was done to it since. */
type Waiting = {
	key: string;
	kind: 'food' | 'entry' | 'goal';
	id: string;
	/** goes up with every change, so that a change made while the row was on its way is not lost */
	turn: number;
	/** how often it has been sent without an answer */
	tries: number;
	/** the database has never had this row */
	fresh: boolean;
	/** for a change to a row the database has: which fields, and the version they change */
	fields: EntryField[];
	base: string | null;
	/** mark it as deleted */
	remove: boolean;
	/** what the database said when it refused the row: it is not sent again until it is changed */
	refused?: string;
};

const ENTRY = 'id,user_id,local_day,meal,food_id,name,brand,grams,kcal,created_at,updated_at,deleted_at';
const FOOD = 'id,user_id,source,source_id,name,brand,kcal_100g,serving_g,serving_label,created_at,updated_at,deleted_at';
const WALK = 'id,local_day,started_at,seconds,kcal,kcal_extra';
/** How many entries and walks are fetched when the diary opens: the recent days. Older days are fetched when looked at. */
const RECENT_ENTRIES = 300;
const RECENT_WALKS = 200;

export const BELOW_ZERO = 'With these body numbers, a goal below zero is not offered here. A doctor can help you change your weight safely.';

type Failure = { message?: string; code?: string; status?: number };

/**
 * What kind of "no" an answer is. "rule": a rule of the database refused
 * this row, and sending it again will not help. "away": no answer, or not
 * for now (no connection, signed out, the account is gone): stop, and try
 * the whole outbox again later.
 */
function kindOf(error: Failure): 'rule' | 'away' {
	const code = error.code ?? '';
	// no answer at all; the connection to the database, or the sign-in, is the trouble; or the account is gone (23503)
	if (!code || /^(PGRST0|PGRST3|08|53|57|58|XX)/.test(code) || code === '23503' || code === '42501') return 'away';
	return 'rule';
}

/** The session supabase-js keeps in this browser's local storage: whose it is. (client.ts names the key.) */
function storedPerson(): string | null {
	try {
		const kept = JSON.parse(localStorage.getItem('walka-account') ?? 'null');
		return typeof kept?.user?.id === 'string' ? kept.user.id : null;
	} catch {
		return null;
	}
}

/**
 * The person whose diary this device holds AND who is still signed in in
 * this browser - or null. For them the diary can open before the database
 * has answered, and when it does not answer at all.
 */
export async function atHome(): Promise<string | null> {
	const signedIn = storedPerson();
	if (!signedIn) return null;
	return (await holder()) === signedIn ? signedIn : null;
}

class Diary {
	/** The device's copy has been read: there is a diary to show. */
	ready = $state(false);
	owner = $state<string | null>(null);

	today = $state(localDay());
	/** The day that is shown. */
	day = $state(localDay());

	/** Every entry the device knows of, the deleted ones left out. */
	entries = $state.raw<FoodEntry[]>([]);
	foods = $state.raw<KeptFood[]>([]);
	/** The latest first. */
	walks = $state.raw<WalkPart[]>([]);
	body = $state.raw<BodyPart | null>(null);
	/** Calories eaten minus calories burned, for a day: the person's own goal. */
	goal = $state(0);

	waiting = $state.raw<Waiting[]>([]);
	/** What the "Undo" line is about: it is gone from the lists, and not yet marked as deleted. */
	undoing = $state.raw<{ kind: 'entry' | 'food'; id: string; name: string } | null>(null);

	online = $state(true);
	/** False: the database did not answer the last time it was asked. Null: not asked yet. */
	answered = $state<boolean | null>(null);
	/** A sentence for the page to say once (a goal the database does not take). */
	said = $state('');
	/** The database says the agreement to keep food data is no longer there: the page asks the account again. */
	consentGone = $state(false);

	#local: Local | null = null;
	#db: SupabaseClient | null = null;
	#token: string | null = null;
	#opening: Promise<void> | null = null;
	#connecting: Promise<void> | null = null;
	#syncing: Promise<void> | null = null;
	#again = false;
	#pulled = 0;
	#turn = 0;
	#undoTimer: ReturnType<typeof setTimeout> | undefined;
	#soonTimer: ReturnType<typeof setTimeout> | undefined;
	#listening = false;
	/** Entries of days after this one are all here ('' = of every day; null = not fetched yet). */
	#entriesSince: string | null = null;
	#walksSince: string | null = null;
	#fetched = new Map<string, number>();

	// ---- opening and closing ---------------------------------------------------------

	/**
	 * Reads the device's copy for this person. If it is somebody else's, it
	 * is emptied first. Called only for a person who has agreed to their food
	 * diary being kept (or whose copy is already here, which says the same).
	 */
	open(userId: string): Promise<void> {
		if (this.ready && this.owner === userId) return Promise.resolve();
		this.#opening ??= (async () => {
			const local = await openLocal();
			if ((await local.get<string>('owner')) !== userId) {
				await local.wipe();
				await local.write([{ shelf: 'kv', put: { key: 'owner', value: userId } }]);
			}
			const [entries, foods, walks, waiting, body, goal] = await Promise.all([
				local.all<FoodEntry>('entries'),
				local.all<KeptFood>('foods'),
				local.all<WalkPart>('walks'),
				local.all<Waiting>('outbox'),
				local.get<BodyPart | null>('body'),
				local.get<number>('goal')
			]);
			this.#local = local;
			this.entries = entries;
			this.foods = foods;
			this.walks = walks.sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
			this.waiting = waiting;
			this.#turn = Math.max(0, ...waiting.map((item) => item.turn));
			this.body = body ?? null;
			this.goal = goal ?? 0;
			this.owner = userId;
			this.today = this.day = localDay();
			this.online = navigator.onLine;
			this.#entriesSince = this.#walksSince = null;
			this.#fetched.clear();
			this.#listen();
			this.ready = true;
		})().finally(() => (this.#opening = null));
		return this.#opening;
	}

	/** The account has said who is signed in, and that they agreed: from now on the diary talks to the database. */
	async connect(): Promise<void> {
		this.#connecting ??= (async () => {
			const db = await database();
			this.#token = (await db.auth.getSession()).data.session?.access_token ?? null;
			db.auth.onAuthStateChange((event, session) => {
				this.#token = session?.access_token ?? null;
				// signed out, in this tab or in another: the copy on this device goes
				if (event === 'SIGNED_OUT') void this.forget();
			});
			this.#db = db;
		})();
		await this.#connecting;
		await this.sync(true);
	}

	/** Signed out, somebody else, or the agreement taken back: nothing of the diary stays on this device. */
	async forget(): Promise<void> {
		clearTimeout(this.#undoTimer);
		clearTimeout(this.#soonTimer);
		this.ready = false;
		this.owner = null;
		this.entries = [];
		this.foods = [];
		this.walks = [];
		this.waiting = [];
		this.body = null;
		this.goal = 0;
		this.undoing = null;
		this.answered = null;
		this.said = '';
		this.consentGone = false;
		this.#local = null;
		await forgetDiary();
	}

	#listen(): void {
		if (this.#listening || typeof window === 'undefined') return;
		this.#listening = true;
		window.addEventListener('online', () => {
			this.online = true;
			void this.sync(true);
		});
		window.addEventListener('offline', () => (this.online = false));
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') return this.#leaving();
			this.today = localDay();
			void this.sync();
		});
		window.addEventListener('pagehide', () => this.#leaving());
		// (a diary left open over midnight learns that it is tomorrow)
		setInterval(() => (this.today = localDay()), 60_000);
	}

	#save(steps: Step[]): void {
		// (the page already shows the change: if the device's copy cannot be written, the diary still works until it is closed)
		void this.#local?.write(steps).catch(() => {});
	}

	// ---- what the page asks ------------------------------------------------------------

	/** Is this entry (or food) written here and not yet in the database? */
	notSent(id: string): boolean {
		return this.waiting.some((item) => item.id === id);
	}

	/** Why the database refused this row, if it did. */
	refusedBecause(id: string): string {
		return this.waiting.find((item) => item.id === id)?.refused ?? '';
	}

	/** The entries of a day, as the page lists them: without the one the "Undo" line is about. */
	entriesOf(day: string): FoodEntry[] {
		const hidden = this.undoing?.kind === 'entry' ? this.undoing.id : '';
		return this.entries.filter((entry) => entry.local_day === day && entry.id !== hidden).sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
	}

	/** The person's foods, the last picked first: without the one the "Undo" line is about. */
	get myFoods(): KeptFood[] {
		const hidden = this.undoing?.kind === 'food' ? this.undoing.id : '';
		return this.foods.filter((food) => food.id !== hidden).sort((a, b) => b.used - a.used);
	}

	/** For the function that asks USDA: where it is, and the signed-in person's token. */
	async project(): Promise<Project> {
		const session = this.#db ? (await this.#db.auth.getSession()).data.session : null;
		this.#token = session?.access_token ?? this.#token;
		return { url: ACCOUNTS.url, key: ACCOUNTS.key, token: session?.access_token ?? null };
	}

	// ---- the day that is shown ------------------------------------------------------------

	/** Another day: not one to come, and not before the diary's first. */
	show(day: string): void {
		this.today = localDay();
		this.day = day > this.today ? this.today : day < LIMITS.firstDay ? LIMITS.firstDay : day;
		void this.#refreshDay(this.day);
	}

	step(by: number): void {
		this.show(shiftDay(this.day, by));
	}

	// ---- what the person does ----------------------------------------------------------------

	addEntry(draft: EntryDraft, day = this.day): FoodEntry {
		const now = new Date().toISOString();
		const entry: FoodEntry = {
			id: crypto.randomUUID(),
			user_id: this.owner!,
			local_day: day,
			meal: draft.meal,
			food_id: draft.food_id,
			name: clean(draft.name, LIMITS.name),
			brand: clean(draft.brand, LIMITS.brand) || null,
			grams: draft.grams === null ? null : round1(draft.grams),
			kcal: round1(draft.kcal),
			created_at: now,
			updated_at: now,
			deleted_at: null
		};
		this.entries = [...this.entries, entry];
		const item = this.#queue('entry', entry.id, { fresh: true });
		this.#save([
			{ shelf: 'entries', put: entry },
			{ shelf: 'outbox', put: item }
		]);
		this.#soon();
		return entry;
	}

	changeEntry(id: string, change: Partial<EntryDraft>): void {
		const before = this.entries.find((entry) => entry.id === id);
		if (!before) return;
		const after: FoodEntry = { ...before, ...change };
		if (change.name !== undefined) after.name = clean(change.name, LIMITS.name);
		if (change.brand !== undefined) after.brand = clean(change.brand, LIMITS.brand) || null;
		if (change.grams !== undefined) after.grams = change.grams === null ? null : round1(change.grams);
		if (change.kcal !== undefined) after.kcal = round1(change.kcal);
		const fields = (Object.keys(change) as EntryField[]).filter((field) => after[field] !== before[field]);
		const waits = this.waiting.find((item) => item.key === `entry:${id}`);
		if (!fields.length && !waits?.refused) return;
		this.entries = this.entries.map((entry) => (entry.id === id ? after : entry));
		const item = this.#queue('entry', id, {
			fresh: waits?.fresh ?? false,
			fields: [...new Set([...(waits?.fields ?? []), ...fields])],
			base: waits ? waits.base : before.updated_at
		});
		this.#save([
			{ shelf: 'entries', put: after },
			{ shelf: 'outbox', put: item }
		]);
		this.#soon();
	}

	/**
	 * Takes an entry (or a food) out of the lists and shows the "Undo" line
	 * for about eight seconds. Only when that line goes is it marked as
	 * deleted, for the database to hear: a deleted row stays deleted.
	 */
	remove(kind: 'entry' | 'food', id: string): void {
		this.#settleUndo(); // one line at a time: what the line before was about is deleted now
		const name = (kind === 'entry' ? this.entries : this.foods).find((row) => row.id === id)?.name;
		if (name === undefined) return;
		this.undoing = { kind, id, name };
		this.#undoTimer = setTimeout(() => this.#settleUndo(), 8000);
	}

	/** "Undo": it comes back, and nothing was ever sent. */
	undo(): void {
		clearTimeout(this.#undoTimer);
		this.undoing = null;
	}

	/** The "Undo" line has gone: now the row is marked as deleted. Returns what was marked. */
	#settleUndo(): Waiting | null {
		clearTimeout(this.#undoTimer);
		const gone = this.undoing;
		if (!gone) return null;
		this.undoing = null;
		const shelf = gone.kind === 'entry' ? 'entries' : 'foods';
		if (gone.kind === 'entry') this.entries = this.entries.filter((entry) => entry.id !== gone.id);
		else this.foods = this.foods.filter((food) => food.id !== gone.id);
		const waits = this.waiting.find((item) => item.key === `${gone.kind}:${gone.id}`);
		if (waits?.fresh && waits.tries === 0) {
			// it never left this device: there is nothing to mark
			this.waiting = this.waiting.filter((item) => item !== waits);
			this.#save([
				{ shelf, remove: gone.id },
				{ shelf: 'outbox', remove: waits.key }
			]);
			return null;
		}
		const item = this.#queue(gone.kind, gone.id, { remove: true, fresh: waits?.fresh ?? false });
		this.#save([
			{ shelf, remove: gone.id },
			{ shelf: 'outbox', put: item }
		]);
		this.#soon();
		return item;
	}

	/**
	 * The page is hidden or left while the "Undo" line still shows: the
	 * deletion is sent at once, in a way that outlives the page. (It stays in
	 * the outbox too: if this does not arrive, it is sent when the diary is
	 * opened again. Marking twice changes nothing.)
	 */
	#leaving(): void {
		const item = this.#settleUndo();
		if (!item || !this.#token || !navigator.onLine) return;
		const table = item.kind === 'entry' ? 'food_entries' : 'foods';
		try {
			void fetch(`${ACCOUNTS.url}/rest/v1/${table}?id=eq.${item.id}`, {
				method: 'PATCH',
				keepalive: true,
				headers: { apikey: ACCOUNTS.key, authorization: `Bearer ${this.#token}`, 'content-type': 'application/json', prefer: 'return=minimal' },
				body: JSON.stringify({ deleted_at: new Date().toISOString() })
			}).catch(() => {});
		} catch {
			// the outbox has it
		}
	}

	/**
	 * A food picked from a search, from the person's own foods, or made by
	 * them: kept (once) so that it can be picked again without a search.
	 */
	keepFood(found: FoundFood | KeptFood): KeptFood {
		const have = this.foods.find((food) => ('id' in found ? food.id === found.id : food.source !== 'own' && food.source === found.source && food.source_id === found.source_id));
		const now = new Date().toISOString();
		const food: KeptFood = {
			id: have?.id ?? crypto.randomUUID(),
			user_id: this.owner!,
			source: found.source,
			source_id: found.source === 'own' ? null : found.source_id,
			name: clean(found.name, LIMITS.name),
			brand: clean(found.brand, LIMITS.brand) || null,
			kcal_100g: round1(found.kcal_100g),
			serving_g: found.serving_g ? round1(found.serving_g) : null,
			serving_label: found.serving_g ? clean(found.serving_label, LIMITS.label) || null : null,
			created_at: have?.created_at ?? now,
			updated_at: have?.updated_at ?? now,
			deleted_at: null,
			used: Date.now()
		};
		this.foods = have ? this.foods.map((row) => (row.id === food.id ? food : row)) : [...this.foods, food];
		const waits = this.waiting.find((item) => item.key === `food:${food.id}`);
		const item = this.#queue('food', food.id, { fresh: have ? (waits?.fresh ?? false) : true });
		this.#save([
			{ shelf: 'foods', put: food },
			{ shelf: 'outbox', put: item }
		]);
		this.#soon();
		return food;
	}

	makeFood(own: OwnFood): KeptFood {
		return this.keepFood({ source: 'own', source_id: null, brand: null, ...own });
	}

	/**
	 * The person's own goal. A goal below zero is not taken for a body that
	 * is underweight by its own numbers - the database refuses it, and so
	 * does the page, which then says why. Returns whether it was taken.
	 */
	setGoal(goal: number): boolean {
		this.said = '';
		if (goal < 0 && underweight(this.body)) {
			this.said = BELOW_ZERO;
			return false;
		}
		this.goal = goal;
		const item = this.#queue('goal', 'goal', {});
		this.#save([
			{ shelf: 'kv', put: { key: 'goal', value: goal } },
			{ shelf: 'outbox', put: item }
		]);
		this.#soon();
		return true;
	}

	// ---- the outbox ----------------------------------------------------------------------------

	#queue(kind: Waiting['kind'], id: string, more: Partial<Pick<Waiting, 'fresh' | 'fields' | 'base' | 'remove'>>): Waiting {
		const key = kind === 'goal' ? 'goal' : `${kind}:${id}`;
		const before = this.waiting.find((item) => item.key === key);
		const item: Waiting = { key, kind, id, turn: ++this.#turn, tries: before?.tries ?? 0, fresh: false, fields: [], base: null, remove: false, ...more };
		this.waiting = [...this.waiting.filter((other) => other.key !== key), item];
		return item;
	}

	/** One item is done with: sent, or not needed any more - unless it was changed while it was on its way. */
	#done(sent: Waiting, more: Step[] = []): void {
		const now = this.waiting.find((item) => item.key === sent.key);
		if (now && now.turn === sent.turn) {
			this.waiting = this.waiting.filter((item) => item !== now);
			this.#save([...more, { shelf: 'outbox', remove: sent.key }]);
		} else {
			if (now && now.fresh) this.#requeue({ ...now, fresh: false });
			this.#save(more);
		}
	}

	#requeue(item: Waiting): void {
		this.waiting = this.waiting.map((other) => (other.key === item.key ? item : other));
		this.#save([{ shelf: 'outbox', put: item }]);
	}

	#soon(): void {
		clearTimeout(this.#soonTimer);
		this.#soonTimer = setTimeout(() => void this.sync(), 60);
	}

	/**
	 * Sends what is waiting, then fetches what is new - the fetching only if
	 * it is asked for (`fetch`) or the last time was a while ago. One at a
	 * time; asked for while it runs, it runs once more afterwards.
	 */
	sync(fetch = false): Promise<void> {
		if (!this.#db || !this.ready || !this.online) return Promise.resolve();
		if (this.#syncing) {
			this.#again = true;
			if (fetch) this.#pulled = 0;
			return this.#syncing;
		}
		const db = this.#db;
		if (fetch) this.#pulled = 0;
		this.#syncing = (async () => {
			try {
				do {
					this.#again = false;
					await this.#push(db);
					if (Date.now() - this.#pulled > 20_000) {
						await this.#pull(db);
						this.#pulled = Date.now();
					}
				} while (this.#again && this.ready);
				this.answered = true;
			} catch {
				// no answer: what is waiting keeps waiting
				if (this.ready) this.answered = false;
			} finally {
				this.#syncing = null;
			}
		})();
		return this.#syncing;
	}

	async #push(db: SupabaseClient): Promise<void> {
		const order = { food: 0, entry: 1, goal: 2 };
		for (;;) {
			if (!this.ready) return;
			// foods first: an entry points at its food by the id the database gave back
			const next = this.waiting.filter((item) => !item.refused).sort((a, b) => order[a.kind] - order[b.kind] || a.turn - b.turn)[0];
			if (!next) return;
			try {
				if (next.kind === 'food') await this.#sendFood(db, next);
				else if (next.kind === 'entry') await this.#sendEntry(db, next);
				else await this.#sendGoal(db, next);
			} catch (error) {
				const failure = error as Failure;
				if (kindOf(failure) === 'away') {
					const now = this.waiting.find((item) => item.key === next.key);
					if (now) this.#requeue({ ...now, tries: now.tries + 1 });
					throw error;
				}
				// A rule of the database refused it. It is set aside, with the reason, until the person changes it.
				if (/only after you have agreed/.test(failure.message ?? '')) this.consentGone = true;
				const now = this.waiting.find((item) => item.key === next.key);
				if (now) this.#requeue({ ...now, tries: now.tries + 1, refused: refusal(error) || say(error) });
			}
		}
	}

	async #sendFood(db: SupabaseClient, item: Waiting): Promise<void> {
		if (item.remove) {
			const { error } = await db.from('foods').update({ deleted_at: new Date().toISOString() }).eq('id', item.id);
			if (error) throw error;
			return this.#done(item);
		}
		const food = this.foods.find((row) => row.id === item.id);
		if (!food) return this.#done(item);
		// (deleted_at: null - a food that was deleted once and is picked again comes back)
		const row = { id: food.id, source: food.source, source_id: food.source_id, name: food.name, brand: food.brand, kcal_100g: food.kcal_100g, serving_g: food.serving_g, serving_label: food.serving_label, deleted_at: null };
		// A food from a source is kept once for a person; one's own foods are told apart by their id alone.
		const { data, error } = await db
			.from('foods')
			.upsert(row, { onConflict: food.source === 'own' ? 'id' : 'user_id,source,source_id' })
			.select(FOOD)
			.single();
		if (error) throw error;
		const kept = { ...(data as Food), used: food.used };
		const steps: Step[] = [{ shelf: 'foods', put: kept }];
		if (kept.id !== food.id) {
			// Another device had picked it first: its id is the id. The entries made here point at that one now.
			steps.push({ shelf: 'foods', remove: food.id });
			this.entries = this.entries.map((entry) => {
				if (entry.food_id !== food.id) return entry;
				const moved = { ...entry, food_id: kept.id };
				steps.push({ shelf: 'entries', put: moved });
				return moved;
			});
			this.foods = [...this.foods.filter((other) => other.id !== food.id && other.id !== kept.id), kept];
		} else {
			this.foods = this.foods.map((other) => (other.id === kept.id ? { ...kept, used: other.used } : other));
		}
		this.#done(item, steps);
	}

	async #sendEntry(db: SupabaseClient, item: Waiting): Promise<void> {
		if (item.remove) {
			// (deleting needs no version: whatever another device did to the row, it is deleted)
			const { error } = await db.from('food_entries').update({ deleted_at: new Date().toISOString() }).eq('id', item.id);
			if (error) throw error;
			return this.#done(item);
		}
		const entry = this.entries.find((row) => row.id === item.id);
		if (!entry) return this.#done(item);
		const whole = { id: entry.id, local_day: entry.local_day, meal: entry.meal, food_id: entry.food_id, name: entry.name, brand: entry.brand, grams: entry.grams, kcal: entry.kcal };

		let answer: FoodEntry | null = null;
		if (!item.fresh && item.base && item.fields.length) {
			// A change says which version it changes, and sends only what changed.
			const change = Object.fromEntries(item.fields.map((field) => [field, entry[field]]));
			let base = item.base;
			for (let tries = 0; tries < 3 && !answer; tries++) {
				const { data, error } = await db.from('food_entries').update(change).eq('id', entry.id).eq('updated_at', base).select(ENTRY);
				if (error) throw error;
				if (data?.length) {
					answer = data[0] as FoodEntry;
					break;
				}
				// Nothing was changed: another device changed the row first. Fetch it, then decide.
				const { data: theirs, error: failed } = await db.from('food_entries').select(ENTRY).eq('id', entry.id).maybeSingle();
				if (failed) throw failed;
				if (!theirs) break; // the database does not have it at all: it is sent whole, below
				if ((theirs as FoodEntry).deleted_at) return this.#dropEntry(item);
				base = (theirs as FoodEntry).updated_at; // our fields on their version: field by field, the last to send wins
			}
		}
		if (!answer) {
			const { data, error } = await db.from('food_entries').upsert(whole, { onConflict: 'id' }).select(ENTRY).single();
			if (error) throw error;
			answer = data as FoodEntry;
		}
		// deleted on another device in the meantime: deleted stays deleted
		if (answer.deleted_at) return this.#dropEntry(item);

		const now = this.waiting.find((other) => other.key === item.key);
		if (now && now.turn !== item.turn) {
			// changed here while it was on its way: what is here stays, on the version that came back
			this.#requeue({ ...now, fresh: false, base: answer.updated_at });
			this.entries = this.entries.map((row) => (row.id === entry.id ? { ...row, updated_at: answer.updated_at, created_at: answer.created_at } : row));
			return;
		}
		this.entries = this.entries.map((row) => (row.id === entry.id ? answer : row));
		this.#done(item, [{ shelf: 'entries', put: answer }]);
	}

	#dropEntry(item: Waiting): void {
		this.entries = this.entries.filter((row) => row.id !== item.id);
		this.waiting = this.waiting.filter((other) => other.key !== item.key);
		this.#save([
			{ shelf: 'entries', remove: item.id },
			{ shelf: 'outbox', remove: item.key }
		]);
	}

	async #sendGoal(db: SupabaseClient, item: Waiting): Promise<void> {
		const { error } = await db.from('food_settings').upsert({ user_id: this.owner, goal_balance_kcal: this.goal }, { onConflict: 'user_id' });
		if (error) {
			if (kindOf(error) === 'away') throw error;
			// Not taken (the body numbers changed on another device, say). The goal the database has is the goal.
			this.said = /cannot be below zero/.test(error.message) ? BELOW_ZERO : refusal(error) || say(error);
			this.waiting = this.waiting.filter((other) => other.key !== item.key);
			this.#save([{ shelf: 'outbox', remove: item.key }]);
			return;
		}
		this.#done(item);
	}

	// ---- fetching -------------------------------------------------------------------------------

	async #pull(db: SupabaseClient): Promise<void> {
		if (!this.ready) return;
		const [body, settings, entries, walks] = await Promise.all([
			db.from('body').select('weight_kg,height_cm,birth_year,sex').maybeSingle(),
			db.from('food_settings').select('goal_balance_kcal').maybeSingle(),
			// the recent days, the latest first (rows marked as deleted too: this device must hear of them)
			db.from('food_entries').select(ENTRY).order('local_day', { ascending: false }).order('created_at', { ascending: false }).order('id').limit(RECENT_ENTRIES),
			db.from('walks').select(WALK).is('deleted_at', null).order('started_at', { ascending: false }).limit(RECENT_WALKS),
			this.#pullFoods(db)
		]);
		for (const answer of [body, settings, entries, walks]) if (answer.error) throw answer.error;
		if (!this.ready) return;
		const steps: Step[] = [];

		this.body = (body.data as BodyPart | null) ?? null;
		steps.push({ shelf: 'kv', put: { key: 'body', value: this.body } });

		if (!this.waiting.some((item) => item.kind === 'goal')) {
			this.goal = (settings.data as { goal_balance_kcal: number } | null)?.goal_balance_kcal ?? 0;
			steps.push({ shelf: 'kv', put: { key: 'goal', value: this.goal } });
		}

		const recent = (entries.data ?? []) as FoodEntry[];
		// Every day after the oldest in the answer is whole. (If the answer is not full, every day is.)
		this.#entriesSince = recent.length < RECENT_ENTRIES ? '' : recent[recent.length - 1].local_day;
		steps.push(...this.#takeEntries(recent, (day) => day > this.#entriesSince!));

		const walked = ((walks.data ?? []) as WalkPart[]).map((walk) => ({ ...walk, seconds: Number(walk.seconds), kcal: Number(walk.kcal), kcal_extra: walk.kcal_extra === null ? null : Number(walk.kcal_extra) }));
		this.#walksSince = walked.length < RECENT_WALKS ? '' : walked[walked.length - 1].local_day;
		// (walks of older days, fetched when such a day was looked at, stay)
		const older = this.walks.filter((walk) => walk.local_day <= this.#walksSince! && !walked.some((other) => other.id === walk.id));
		this.walks = [...walked, ...older].sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
		steps.push({ shelf: 'walks', empty: true }, ...this.walks.map((walk) => ({ shelf: 'walks' as const, put: walk })));

		this.#save(steps);
		await this.#refreshDay(this.day, db);
	}

	/**
	 * What the database has, taken into the device's copy. A row that is
	 * waiting to be sent from here is left as it is here - except when the
	 * database says it is deleted. `whole(day)`: the answer holds every entry
	 * of that day, so one that is here and not in it has gone.
	 */
	#takeEntries(rows: FoodEntry[], whole: (day: string) => boolean): Step[] {
		const steps: Step[] = [];
		const theirs = new Map(rows.map((row) => [row.id, row]));
		const waiting = new Map(this.waiting.filter((item) => item.kind === 'entry').map((item) => [item.id, item]));
		const kept: FoodEntry[] = [];
		for (const mine of this.entries) {
			const row = theirs.get(mine.id);
			theirs.delete(mine.id);
			if (row?.deleted_at || (!row && whole(mine.local_day) && !waiting.has(mine.id))) {
				steps.push({ shelf: 'entries', remove: mine.id });
				if (waiting.has(mine.id)) {
					this.waiting = this.waiting.filter((item) => item.key !== `entry:${mine.id}`);
					steps.push({ shelf: 'outbox', remove: `entry:${mine.id}` });
				}
			} else if (row && !waiting.has(mine.id)) {
				const fresh = numbered(row);
				kept.push(fresh);
				if (fresh.updated_at !== mine.updated_at) steps.push({ shelf: 'entries', put: fresh });
			} else kept.push(mine);
		}
		for (const row of theirs.values()) {
			// (one that is marked as deleted and was never here; and one whose deletion is waiting here to be sent)
			if (row.deleted_at || waiting.get(row.id)?.remove) continue;
			const fresh = numbered(row);
			kept.push(fresh);
			steps.push({ shelf: 'entries', put: fresh });
		}
		this.entries = kept;
		return steps;
	}

	/**
	 * The person's foods: what has changed since the last time, in pages,
	 * ordered by the database's own clock (docs/data-model.md, "Syncing").
	 */
	async #pullFoods(db: SupabaseClient): Promise<void> {
		const cursor = await this.#local?.get<{ at: string; id: string }>('foods-seen');
		// start two minutes before the last row seen: two writes of one moment may become visible in the other order
		let from = cursor ? { at: new Date(Date.parse(cursor.at) - 120_000).toISOString(), id: '00000000-0000-0000-0000-000000000000' } : null;
		const changed: Food[] = [];
		for (;;) {
			let page = db.from('foods').select(FOOD).order('updated_at').order('id').limit(1000);
			if (from) page = page.or(`updated_at.gt."${from.at}",and(updated_at.eq."${from.at}",id.gt.${from.id})`);
			const { data, error } = await page;
			if (error) throw error;
			changed.push(...((data ?? []) as Food[]));
			if (!data || data.length < 1000) break;
			from = { at: data[data.length - 1].updated_at, id: data[data.length - 1].id };
		}
		if (!changed.length || !this.ready) return;
		const steps: Step[] = [];
		const waiting = new Set(this.waiting.filter((item) => item.kind === 'food').map((item) => item.id));
		const foods = new Map(this.foods.map((food) => [food.id, food]));
		for (const row of changed) {
			if (waiting.has(row.id)) continue; // what is waiting here is newer
			if (row.deleted_at) {
				if (foods.delete(row.id)) steps.push({ shelf: 'foods', remove: row.id });
				continue;
			}
			const food: KeptFood = {
				...row,
				kcal_100g: Number(row.kcal_100g),
				serving_g: row.serving_g === null ? null : Number(row.serving_g),
				used: Math.max(foods.get(row.id)?.used ?? 0, Date.parse(row.updated_at) || 0)
			};
			foods.set(row.id, food);
			steps.push({ shelf: 'foods', put: food });
		}
		this.foods = [...foods.values()];
		const last = changed[changed.length - 1];
		steps.push({ shelf: 'kv', put: { key: 'foods-seen', value: { at: last.updated_at, id: last.id } } });
		this.#save(steps);
	}

	/** A day that the first fetch did not cover (an older one) is fetched when it is looked at. */
	async #refreshDay(day: string, db = this.#db): Promise<void> {
		if (!db || !this.ready || !this.online) return;
		const entriesHere = this.#entriesSince !== null && day > this.#entriesSince;
		const walksHere = this.#walksSince !== null && day > this.#walksSince;
		if ((entriesHere && walksHere) || this.#entriesSince === null) return;
		if (Date.now() - (this.#fetched.get(day) ?? 0) < 60_000) return;
		this.#fetched.set(day, Date.now());
		try {
			const steps: Step[] = [];
			if (!entriesHere) {
				const { data, error } = await db.from('food_entries').select(ENTRY).eq('local_day', day).limit(1000);
				if (error) throw error;
				steps.push(...this.#takeEntries((data ?? []) as FoodEntry[], (other) => other === day));
			}
			if (!walksHere) {
				const { data, error } = await db.from('walks').select(WALK).is('deleted_at', null).eq('local_day', day).limit(200);
				if (error) throw error;
				const walked = ((data ?? []) as WalkPart[]).map((walk) => ({ ...walk, seconds: Number(walk.seconds), kcal: Number(walk.kcal), kcal_extra: walk.kcal_extra === null ? null : Number(walk.kcal_extra) }));
				this.walks = [...this.walks.filter((walk) => walk.local_day !== day), ...walked].sort((a, b) => (a.started_at < b.started_at ? 1 : -1));
				steps.push({ shelf: 'walks', empty: true }, ...this.walks.map((walk) => ({ shelf: 'walks' as const, put: walk })));
			}
			this.#save(steps);
		} catch {
			this.#fetched.delete(day);
			if (this.ready) this.answered = false;
		}
	}
}

/** The numbers of a row as numbers (the database sends them so; this makes sure of it). */
const numbered = (row: FoodEntry): FoodEntry => ({ ...row, kcal: Number(row.kcal), grams: row.grams === null ? null : Number(row.grams) });

export type { Meal };
export const diary = new Diary();
