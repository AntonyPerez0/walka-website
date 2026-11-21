// The device's own copy of a person's food diary, so that the diary opens
// and takes entries without a connection.
//
// It lives in the browser's IndexedDB, in one database with five shelves.
// Nothing is put here before the person has agreed to their food diary
// being kept (store.svelte.ts sees to that), and all of it goes when they
// sign out, when somebody else signs in, and when they take their agreement
// back. A browser that has no IndexedDB (some private windows) gets a copy
// in memory instead: the diary works, and forgets when the page is closed.

const NAME = 'walka-food';

/**
 *   kv       single things: whose copy this is, the goal, the body numbers
 *   foods    the person's foods
 *   entries  the diary's entries of the days they looked at
 *   walks    recent walks: only when, how long and how many calories
 *   outbox   what has been written here and not yet sent
 */
export type Shelf = 'kv' | 'foods' | 'entries' | 'walks' | 'outbox';
const SHELVES: Record<Shelf, string> = { kv: 'key', foods: 'id', entries: 'id', walks: 'id', outbox: 'key' };

/** One change to the copy. Several are written together or not at all. */
export type Step = { shelf: Shelf; put: object } | { shelf: Shelf; remove: string } | { shelf: Shelf; empty: true };

export type Local = {
	/** False: there is no IndexedDB here, and the copy is only in memory. */
	kept: boolean;
	all<T>(shelf: Shelf): Promise<T[]>;
	/** One of the single things on the "kv" shelf. */
	get<T>(key: string): Promise<T | undefined>;
	write(steps: Step[]): Promise<void>;
	/** Empties every shelf. */
	wipe(): Promise<void>;
	close(): void;
};

const settled = <T>(request: IDBRequest<T>) =>
	new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});

const finished = (work: IDBTransaction) =>
	new Promise<void>((resolve, reject) => {
		work.oncomplete = () => resolve();
		work.onerror = work.onabort = () => reject(work.error ?? new Error('The copy on this device could not be written.'));
	});

function inMemory(): Local {
	const shelves = Object.fromEntries(Object.keys(SHELVES).map((shelf) => [shelf, new Map<string, object>()])) as Record<Shelf, Map<string, object>>;
	return {
		kept: false,
		all: async <T>(shelf: Shelf) => [...shelves[shelf].values()] as T[],
		get: async <T>(key: string) => (shelves.kv.get(key) as { value: T } | undefined)?.value,
		async write(steps) {
			for (const step of steps) {
				if ('put' in step) shelves[step.shelf].set((step.put as Record<string, string>)[SHELVES[step.shelf]], step.put);
				else if ('remove' in step) shelves[step.shelf].delete(step.remove);
				else shelves[step.shelf].clear();
			}
		},
		async wipe() {
			for (const shelf of Object.values(shelves)) shelf.clear();
		},
		close() {}
	};
}

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		// (a browser that never answers must not keep the diary waiting)
		const timer = setTimeout(() => reject(new Error('No answer from IndexedDB.')), 4000);
		const request = indexedDB.open(NAME, 1);
		request.onupgradeneeded = () => {
			for (const [shelf, key] of Object.entries(SHELVES)) {
				if (!request.result.objectStoreNames.contains(shelf)) request.result.createObjectStore(shelf, { keyPath: key });
			}
		};
		request.onsuccess = () => {
			clearTimeout(timer);
			const db = request.result;
			// another tab deletes the copy (somebody signed out there): let go of it
			db.onversionchange = () => db.close();
			resolve(db);
		};
		request.onerror = request.onblocked = () => {
			clearTimeout(timer);
			reject(request.error ?? new Error('IndexedDB is not to be had.'));
		};
	});
}

/**
 * "That was all": the browser finishes the work without waiting to be told
 * so after each answer. It matters for a tab that the phone has put to
 * sleep. Such a tab still hears that somebody signed out in another one,
 * and starts emptying its copy - and then cannot take the answers. Without
 * this, its unfinished work would hold every shelf, and no other tab could
 * read or empty the copy until the sleeping one woke.
 */
const settle = (work: IDBTransaction) => {
	try {
		work.commit?.();
	} catch {
		// an older browser, or already finished: it ends by itself, as it always did
	}
};

let opened: Promise<Local> | null = null;

/** The copy on this device. Opened once; every caller gets the same. */
export function openLocal(): Promise<Local> {
	opened ??= (async (): Promise<Local> => {
		let db: IDBDatabase;
		try {
			db = await open();
		} catch {
			return inMemory();
		}
		const all = <T>(shelf: Shelf) => settled(db.transaction(shelf).objectStore(shelf).getAll() as IDBRequest<T[]>);
		return {
			kept: true,
			all,
			get: async <T>(key: string) => ((await settled(db.transaction('kv').objectStore('kv').get(key))) as { value: T } | undefined)?.value,
			async write(steps) {
				if (!steps.length) return;
				const work = db.transaction([...new Set(steps.map((step) => step.shelf))], 'readwrite');
				for (const step of steps) {
					const shelf = work.objectStore(step.shelf);
					if ('put' in step) shelf.put(step.put);
					else if ('remove' in step) shelf.delete(step.remove);
					else shelf.clear();
				}
				await finished(work);
			},
			async wipe() {
				const work = db.transaction(Object.keys(SHELVES), 'readwrite');
				for (const shelf of Object.keys(SHELVES)) work.objectStore(shelf).clear();
				settle(work);
				await finished(work);
			},
			close: () => db.close()
		};
	})();
	return opened;
}

/** The copy, if this device has one. Asking never makes one. */
function existing(): Promise<IDBDatabase | null> {
	return new Promise((resolve) => {
		let late = false;
		const timer = setTimeout(() => {
			late = true;
			resolve(null);
		}, 3000);
		const request = indexedDB.open(NAME);
		// (there was none, and the browser is about to make one: not wanted)
		request.onupgradeneeded = () => request.transaction?.abort();
		request.onsuccess = () => {
			clearTimeout(timer);
			if (late) return request.result.close();
			resolve(request.result);
		};
		request.onerror = (event) => {
			event.preventDefault();
			clearTimeout(timer);
			resolve(null);
		};
	});
}

let forgetting: Promise<void> | null = null;

/**
 * Nothing of the diary stays on this device. For signing out, for another
 * person signing in, and for the agreement taken back.
 *
 * Every shelf is emptied; the database itself, then holding nothing, is
 * left where it is. Deleting it would need every other tab to let go of it
 * first, and one that the phone has put to sleep - the diary on the home
 * screen, in the background - never answers: the browser then says neither
 * "done" nor "blocked", this page would wait for ever, and until that tab
 * wakes nobody could open the copy again. Emptying needs nobody's leave.
 */
export function forgetDiary(): Promise<void> {
	forgetting ??= (async () => {
		const mine = await opened?.catch(() => null);
		opened = null;
		const work = (async () => {
			// through this page's own connection, if it has one that still works
			let emptied = false;
			if (mine?.kept) {
				emptied = await mine.wipe().then(
					() => true,
					() => false
				);
				mine.close();
			}
			if (emptied || typeof indexedDB === 'undefined') return;
			// otherwise through a new one - if there is a copy at all
			const db = await existing();
			if (!db) return;
			try {
				const shelves = [...db.objectStoreNames];
				if (shelves.length) {
					const emptying = db.transaction(shelves, 'readwrite');
					for (const shelf of shelves) emptying.objectStore(shelf).clear();
					settle(emptying);
					await finished(emptying);
				}
			} finally {
				db.close();
			}
		})().catch(() => {});
		// (a browser that does not answer must not keep the page standing still)
		await Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, 4000))]);
	})().finally(() => (forgetting = null));
	return forgetting;
}

/**
 * Whose diary this device holds, if any - asked before anybody has said who
 * is signed in. (Without making a copy where there is none.)
 */
export async function holder(): Promise<string | null> {
	if (typeof indexedDB === 'undefined') return null;
	try {
		if (opened) return (await (await opened).get<string>('owner')) ?? null;
		const db = await existing();
		if (!db) return null;
		try {
			return ((await settled(db.transaction('kv').objectStore('kv').get('owner'))) as { value: string } | undefined)?.value ?? null;
		} finally {
			db.close();
		}
	} catch {
		return null;
	}
}
