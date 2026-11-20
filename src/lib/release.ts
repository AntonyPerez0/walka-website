// The latest release of Walka, asked from GitHub's public API by the
// visitor's browser - only on the downloads page, and only to show its
// number, its date and the sizes of the files. The download buttons do not
// depend on it: they are plain links that always give the latest files.
//
// The answer is kept for an hour in this tab's session storage, so that
// moving between pages does not ask again.

const API = 'https://api.github.com/repos/AntonyPerez0/walka-addon/releases/latest';
const KEY = 'walka-latest-release';
const AN_HOUR = 60 * 60 * 1000;

export type Release = {
	/** "0.7.0" */
	version: string;
	/** ISO date of publication */
	published: string;
	/** The release's page on GitHub */
	url: string;
	/** File name -> size in bytes */
	sizes: Record<string, number>;
};

export async function latestRelease(): Promise<Release | null> {
	try {
		const kept = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
		// (only an answer this page could have kept itself: a time that is a
		// number and not ahead of the clock, a version that is not blank)
		const age = typeof kept?.at === 'number' ? Date.now() - kept.at : NaN;
		if (age >= 0 && age < AN_HOUR && typeof kept.release?.version === 'string' && kept.release.version.trim()) {
			return kept.release as Release;
		}
	} catch {
		// no storage, or nothing kept
	}
	try {
		const response = await fetch(API, { headers: { accept: 'application/vnd.github+json' } });
		if (!response.ok) return null;
		const data = await response.json();
		const version = typeof data?.tag_name === 'string' ? data.tag_name.replace(/^v/, '').trim() : '';
		if (!version) return null;
		const release: Release = {
			version,
			// (only what is what it should be is taken: a date that is a date,
			// sizes that are numbers)
			published: isDate(data.published_at) ? data.published_at : '',
			url: typeof data.html_url === 'string' ? data.html_url : '',
			sizes: Object.fromEntries(
				(Array.isArray(data.assets) ? data.assets : [])
					.filter((asset: unknown): asset is { name: string; size: number } => {
						const { name, size } = (asset ?? {}) as { name?: unknown; size?: unknown };
						return typeof name === 'string' && typeof size === 'number' && Number.isFinite(size) && size > 0;
					})
					.map((asset: { name: string; size: number }) => [asset.name, asset.size])
			)
		};
		try {
			sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), release }));
		} catch {
			// no storage: ask again next time
		}
		return release;
	} catch {
		return null; // offline, blocked or rate-limited: the page says so in plain words
	}
}

/**
 * Whether a text is a date as GitHub writes one: "2026-11-19T21:30:00Z" is,
 * "soon" is not - and neither is "soon 5", which a browser would read as a date.
 */
export function isDate(text: unknown): text is string {
	return typeof text === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(text) && Number.isFinite(Date.parse(text));
}

/** "13 MB", "1.2 MB", "114 KB" - or nothing, for anything that is not a size of at least 1 KB. */
export function megabytes(bytes: number | undefined): string {
	if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 1024) return '';
	const mb = bytes / (1024 * 1024);
	return mb >= 10 ? `${Math.round(mb)} MB` : mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
