// Which download to put first. A guess from what the browser says about the
// computer - never sent anywhere, and every download stays one click away.
//
// The guess itself is made in src/app.html, before the page is drawn, and
// written on <html data-system>. Styles can read it there from the first
// moment; this is how a script reads it.

export type Platform = 'windows' | 'mac' | 'other';

export function detectPlatform(): Platform {
	if (typeof document === 'undefined') return 'other';
	const said = document.documentElement.dataset.system;
	return said === 'windows' || said === 'mac' ? said : 'other';
}
