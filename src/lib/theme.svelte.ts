// Light or dark.
//
// The page follows the system until the visitor uses the switch. Their choice
// is then kept in this browser (local storage, key "walka-theme") and put on
// <html data-theme="..."> by the small script in src/app.html before the page
// is drawn. Choosing what the system already says removes the choice again,
// so the page goes back to following the system.

import { browser } from '$app/env';

export type Theme = 'light' | 'dark';

const KEY = 'walka-theme';
const systemQuery = browser ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function chosen(): Theme | null {
	if (!browser) return null;
	const value = document.documentElement.dataset.theme;
	return value === 'light' || value === 'dark' ? value : null;
}

class ThemeState {
	/** What the system asks for. */
	system = $state<Theme>(systemQuery?.matches === false ? 'light' : 'dark');
	/** What the visitor chose here, if anything. */
	choice = $state<Theme | null>(chosen());
	/** What is on screen. On the server nobody knows: the styles decide. */
	current = $derived<Theme>(this.choice ?? this.system);

	constructor() {
		systemQuery?.addEventListener('change', (event) => {
			this.system = event.matches ? 'dark' : 'light';
		});
	}

	toggle() {
		const next: Theme = this.current === 'dark' ? 'light' : 'dark';
		this.choice = next === this.system ? null : next;
		const root = document.documentElement;
		if (this.choice) root.dataset.theme = this.choice;
		else delete root.dataset.theme;
		try {
			if (this.choice) localStorage.setItem(KEY, this.choice);
			else localStorage.removeItem(KEY);
		} catch {
			// Storage is switched off: the choice holds until the page is closed.
		}
	}
}

export const theme = new ThemeState();
