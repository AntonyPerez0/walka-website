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
				await finished(work);
			},
			close: () => db.close()
		};
	})();
	return opened;
}

/**
 * Removes the copy from this device, whole. For signing out, for another
 * person signing in, and for the agreement taken back.
 */
export async function forgetDiary(): Promise<void> {
	const local = await opened?.catch(() => null);
	opened = null;
	// (emptied first: if the database itself cannot be deleted just now - another tab holds it - nothing is left in it)
	await local?.wipe().catch(() => {});
	local?.close();
	if (typeof indexedDB === 'undefined') return;
	await new Promise<void>((resolve) => {
		const request = indexedDB.deleteDatabase(NAME);
		request.onsuccess = request.onerror = request.onblocked = () => resolve();
	});
}

/**
 * Whose diary this device holds, if any - asked before anybody has said who
 * is signed in. (Without opening a copy where there is none.)
 */
export async function holder(): Promise<string | null> {
	if (typeof indexedDB === 'undefined') return null;
	try {
		// (where the browser can say which databases there are, none is made just for asking)
		const names = await indexedDB.databases?.();
		if (names && !names.some((database) => database.name === NAME)) return null;
		const owner = (await (await openLocal()).get<string>('owner')) ?? null;
		// (a browser that cannot say had to open one to look: an empty one is not left behind)
		if (!owner) await forgetDiary();
		return owner;
	} catch {
		return null;
	}
}
