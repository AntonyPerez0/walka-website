// The pages of the site, found from the folders under src/routes: a new page
// is in the sitemap without anyone adding it to a list.
const files = import.meta.glob('/src/routes/**/+page.svelte');

/** Paths like "" (the home page), "safety/", "how-it-works/". */
export const PAGE_PATHS: string[] = Object.keys(files)
	// (the account pages are a person's own: they are not for a sitemap)
	.filter((file) => !file.includes('/(app)/'))
	.map((file) => file.replace('/src/routes/', '').replace('+page.svelte', ''))
	// (group) folders are not part of the address
	.map((path) => path.replace(/\([^)]*\)\//g, ''))
	.filter((path) => !path.includes('['))
	.sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
