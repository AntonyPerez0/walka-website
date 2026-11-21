// The site's own name, and two facts that came with it.
//
// The build is told the address it is published at (SITE_URL: the deploy
// workflow asks GitHub Pages for it). When that is a name of the site's own
// - walka.dev - the privacy page and the FAQ say a few things that are true
// only then. Under GitHub's own address (a copy of the site, a trial) and in
// a local build there is no such name, and they are left out.
//
// What the build cannot know is said here by hand, and has to be changed by
// hand if it stops being true:
//
//  - WHO keeps the name. If the name moves away from Cloudflare, or its
//    "proxy" is ever switched on there (pages would then pass through
//    Cloudflare), the privacy page's paragraph about it is no longer true.
//  - That the name was PROVED to Google (Search Console), which Google asks
//    for before its sign-in screen may say "Walka". Whoever has proved a
//    name is shown Google's counts of its own search results for it: the
//    one count the site's maker can see. If that property is ever removed
//    at Google, the sentences about it go too.
// The README says all this too.

import { SITE_URL } from '$app/env/public';

/** "walka.dev" - or '' where the site has no name of its own. */
export const OWN_NAME: string = (() => {
	try {
		const host = new URL(SITE_URL).hostname;
		return host.endsWith('.github.io') ? '' : host;
	} catch {
		return '';
	}
})();

/** The company the name is registered at, whose name servers answer for it. */
export const NAME_KEPT_AT = 'Cloudflare';
