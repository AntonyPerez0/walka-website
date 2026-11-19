// The pages in the navigation, in order. `path` is the page's address inside
// the site, written without a slash in front and with one at the end - which
// is how resolve() from $app/paths wants a page.

export const NAV = [
	{ path: 'how-it-works/', label: 'How it works' },
	{ path: 'safety/', label: 'Safety' },
	{ path: 'faq/', label: 'FAQ' },
	{ path: 'downloads/', label: 'Downloads' }
] as const;

export const LEGAL = [
	{ path: 'privacy/', label: 'Privacy' },
	{ path: 'terms/', label: 'Terms' }
] as const;

export type PagePath = (typeof NAV)[number]['path'] | (typeof LEGAL)[number]['path'];
