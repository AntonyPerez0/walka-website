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
		if (kept && Date.now() - kept.at < AN_HOUR) return kept.release as Release;
	} catch {
		// no storage, or nothing kept
	}
	try {
		const response = await fetch(API, { headers: { accept: 'application/vnd.github+json' } });
		if (!response.ok) return null;
		const data = await response.json();
		if (typeof data?.tag_name !== 'string') return null;
		const release: Release = {
			version: data.tag_name.replace(/^v/, ''),
			published: String(data.published_at ?? ''),
			url: String(data.html_url ?? ''),
			sizes: Object.fromEntries(
				(Array.isArray(data.assets) ? data.assets : []).map((asset: { name: string; size: number }) => [asset.name, asset.size])
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

export function megabytes(bytes: number | undefined): string {
	if (!bytes) return '';
	const mb = bytes / (1024 * 1024);
	return mb >= 10 ? `${Math.round(mb)} MB` : mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
