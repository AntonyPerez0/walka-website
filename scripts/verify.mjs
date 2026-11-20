// Checks the built site (the build folder) before it is published.
//
//   npm run build && npm run verify
//
// What it holds the site to:
//
//  1. It works from any address. No page, stylesheet or picture is asked for
//     by a path that starts at the root of the domain ("/img/x.png"), because
//     on GitHub Pages the site lives under /walka-website/ until it has a
//     domain of its own. Everything is relative - and everything a page asks
//     for is really in the build.
//  2. It loads nothing from anyone else. Fonts, scripts, styles and pictures
//     all come from the site itself. Links to other sites are fine; fetching
//     from them when a page opens is not. Every page carries a
//     Content-Security-Policy that has the browser enforce this, and this
//     script checks that policy: the few outside addresses a page's scripts
//     may talk to are listed in MAY_TALK_TO below, and nothing else is let in.
//  3. Every page has what a page needs: a language, a title, a description,
//     one main heading - and the line that says Walka is not Blizzard's. On
//     the pages that invite someone to download or to walk (INVITING below)
//     the description says "at your own risk": it is what a search result
//     and a link preview show.
//  4. The download buttons are the links Walka's README uses.
//  5. Nothing that looks like a secret key is in what gets published.
//  6. Nothing says that Walka moves a belt. Since version 0.7 Walka only
//     listens to the treadmill; the words of the Walka that drove one (the
//     belt that follows the character, the STOP key, the speed cap) must
//     not come back, in a page's text, its descriptions or its pictures'
//     alt text. Nor may a page link to a withdrawn version.
//  7. No media query is in the form "(width <= 40rem)", which the oldest
//     browsers the site is built for cannot read.
//  8. A site with accounts says who to write to. When the build is told
//     where accounts are kept (SUPABASE_URL), it must also be told the
//     contact address, the place the data is kept in and - if people sign
//     in by e-mail - who sends that mail (CONTACT, ACCOUNTS_REGION,
//     MAIL_SENDER: src/env.ts), and the privacy page must really name them.
//     So this script is given the same settings as the build.
//
// It reads files only: no browser, nothing to install.

import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../build', import.meta.url));

// Outside addresses the site's scripts may talk to (the policy's connect-src).
// A new one here is a decision: it means visitors' browsers will talk to
// that host. It has to be added in vite.config.ts as well.
const MAY_TALK_TO = new Set([
	'https://api.github.com' // the downloads page asks which version is the latest
]);
// With accounts (the build is told where they are kept: src/env.ts), the
// account pages talk to that database, and to Open Food Facts about foods.
const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
if (SUPABASE_URL) {
	MAY_TALK_TO.add(SUPABASE_URL);
	MAY_TALK_TO.add('https://world.openfoodfacts.org');
}

// What the privacy page and the terms of a site with accounts must name.
// Read from the environment as the build reads them (src/env.ts).
const setting = (name) => (process.env[name] ?? '').trim();
const CONTACT = setting('CONTACT');
const ACCOUNTS_REGION = setting('ACCOUNTS_REGION');
const MAIL_SENDER = setting('MAIL_SENDER');
// (an empty SIGN_IN means "email", as it does to the build)
const SIGN_IN = setting('SIGN_IN')
	.split(',')
	.map((way) => way.trim().toLowerCase())
	.filter((way) => ['email', 'discord', 'google', 'github'].includes(way));
const BY_EMAIL = SIGN_IN.length === 0 || SIGN_IN.includes('email');
// The privacy page, and the part of it that only a site with accounts has.
const PRIVACY_PAGE = 'privacy/index.html';
const ACCOUNT_PART = /\sid="your-account"/;

// What each part of the policy may name besides the site itself.
const POLICY = {
	'default-src': [],
	'script-src': [], // plus the hashes of SvelteKit's own start-up script
	'style-src': ["'unsafe-inline'"],
	'img-src': ['data:'],
	'font-src': [],
	'connect-src': [...MAY_TALK_TO],
	'manifest-src': [],
	'object-src': [],
	'base-uri': [],
	'form-action': []
};

const DISCLAIMER = 'not affiliated with or endorsed by Blizzard Entertainment';

const DOWNLOADS = [
	'https://github.com/AntonyPerez0/walka-addon/releases/latest/download/Walka.exe',
	'https://github.com/AntonyPerez0/walka-addon/releases/latest/download/Walka-mac-apple-silicon.zip',
	'https://github.com/AntonyPerez0/walka-addon/releases/latest/download/Walka-mac-intel.zip',
	'https://github.com/AntonyPerez0/walka-addon/releases/latest/download/Walka-addon.zip'
];
const PAGES_WITH_DOWNLOADS = ['index.html', 'downloads/index.html'];

// The pages that invite someone to download or to walk. (A new page that
// does belongs in this list.)
const INVITING = ['index.html', 'how-it-works/index.html', 'safety/index.html', 'downloads/index.html'];

// What the site said about the Walka that drove the belt (up to 0.6.1).
// None of it is true any more. Each is looked for in everything a visitor
// can read on a page: its text, its title and description, alt text, labels.
const GONE = [
	[/the belt follows/i, '"the belt follows"'],
	[/follows? your character/i, '"follows your character"'],
	[/faster when it runs/i, '"faster when it runs"'],
	[/links your walking pad/i, '"links your walking pad"'],
	[/ctrl\s*\+\s*alt\s*\+\s*x/i, 'the STOP key Ctrl+Alt+X'],
	[/control\s*\+\s*option\s*\+\s*x/i, 'the STOP key Control+Option+X'],
	[/red stop\b/i, 'the red STOP button'],
	[/speed cap/i, 'the speed cap'],
	[/safety limits/i, 'the "Safety limits" settings'],
	[/keep ?walking/i, '"keep walking"'],
	[/built around stopping/i, '"built around stopping"'],
	[/stopping the belt/i, '"Stopping the belt"'],
	[/walka (version )?v?0\.[0-6]\.\d/i, 'a version of Walka that has been withdrawn']
];
// A link to a release or a tag from before 0.7.
const WITHDRAWN = /walka-addon\/(releases\/(tag|download)|tree|blob)\/v0\.[0-6]\.\d/i;

// Things that would be a secret if they were real. The public "anon" key of
// the database is not one of them; a "service_role" key is.
const SECRETS = [
	[/service_role/, 'a Supabase service_role key (or its name)'],
	[/sb_secret_[A-Za-z0-9_-]{8,}/, 'a Supabase secret key'],
	[/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
	[/gh[pousr]_[A-Za-z0-9]{30,}/, 'a GitHub token']
];

// Tags that fetch what their address names as soon as the page opens.
const FETCHING = new Set(['script', 'img', 'source', 'iframe', 'video', 'audio', 'embed', 'object', 'track', 'input']);
const FETCHING_LINKS = /\b(stylesheet|preload|modulepreload|prefetch|icon|apple-touch-icon|manifest)\b/i;

const problems = [];
const problem = (file, message) => problems.push(`${file}: ${message}`);

async function walk(dir) {
	const files = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await walk(path)));
		else files.push(path);
	}
	return files;
}

const toUrlPath = (file) => relative(root, file).split(sep).join('/');

/** The page a relative address points at, as a path inside the build - or null if it leaves the site. */
function resolveInSite(fromFile, address) {
	const [path] = address.split(/[?#]/);
	const from = posix.dirname('/' + fromFile);
	const target = posix.normalize(posix.join(from, path));
	if (posix.join(from, path).startsWith('..') || target.startsWith('/..')) return null;
	return target.replace(/^\//, '');
}

function existsInSite(target) {
	const file = join(root, target);
	if (!existsSync(file)) return null;
	if (target === '' || target.endsWith('/')) return existsSync(join(file, 'index.html')) ? posix.join(target, 'index.html') : null;
	return target;
}

const idsOf = new Map();
async function ids(htmlFile) {
	if (!idsOf.has(htmlFile)) {
		const html = await readFile(join(root, htmlFile), 'utf8');
		idsOf.set(htmlFile, new Set([...html.matchAll(/\sid=(?:"([^"]*)"|'([^']*)')/g)].map((m) => m[1] ?? m[2])));
	}
	return idsOf.get(htmlFile);
}

const decode = (text) =>
	text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function checkAddress(file, tag, attribute, raw, rel) {
	const address = decode(raw.trim());
	if (address === '' || /^(mailto:|tel:|data:|blob:|javascript:void)/i.test(address)) return;

	const fetches = FETCHING.has(tag) || (tag === 'link' && FETCHING_LINKS.test(rel ?? ''));

	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(address) || address.startsWith('//')) {
		if (fetches) problem(file, `<${tag} ${attribute}> loads from another site: ${address}`);
		else if (!/^https:\/\//i.test(address)) problem(file, `link without https: ${address}`);
		return;
	}

	if (address.startsWith('/')) {
		if (file === '404.html' && address === '/') return; // the one link that page cannot know better
		problem(file, `<${tag} ${attribute}="${address}"> starts at the root of the domain; it breaks under /walka-website/`);
		return;
	}

	if (address.startsWith('#')) {
		const id = decodeURIComponent(address.slice(1));
		if (id && !(await ids(file)).has(id)) problem(file, `link to #${id}, which is not on the page`);
		return;
	}

	const target = resolveInSite(file, address);
	if (target === null) return problem(file, `<${tag} ${attribute}="${address}"> points outside the site`);
	const found = existsInSite(target);
	if (!found) return problem(file, `<${tag} ${attribute}="${address}"> points at nothing in the build`);

	const fragment = address.includes('#') ? decodeURIComponent(address.split('#')[1]) : '';
	if (fragment && found.endsWith('.html') && !(await ids(found)).has(fragment)) {
		problem(file, `link to ${address}: there is no #${fragment} on that page`);
	}
}

async function checkHtml(file) {
	const full = await readFile(join(root, file), 'utf8');
	const text = full
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => tag.match(/^<script\b[^>]*>/i)[0] + '</script>')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

	for (const [, tagName, attributes] of text.matchAll(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g)) {
		const tag = tagName.toLowerCase();
		const read = (name) => {
			const m = attributes.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
			return m ? (m[1] ?? m[2]) : undefined;
		};
		const rel = read('rel');
		for (const attribute of ['href', 'src', 'poster', 'action', 'data']) {
			const value = read(attribute);
			if (value !== undefined) await checkAddress(file, tag, attribute, value, rel);
		}
		for (const attribute of ['srcset', 'imagesrcset']) {
			const value = read(attribute);
			if (value === undefined) continue;
			for (const candidate of value.split(',')) {
				const address = candidate.trim().split(/\s+/)[0];
				if (address) await checkAddress(file, tag === 'link' ? 'img' : tag, attribute, address, rel);
			}
		}
		if (tag === 'a' && read('target') === '_blank' && !/\bnoopener\b/.test(rel ?? '')) {
			problem(file, `a link that opens a new tab without rel="noopener": ${read('href')}`);
		}
		if (tag === 'img' && read('alt') === undefined) problem(file, `a picture without alt text: ${read('src')}`);
	}

	// SvelteKit's start-up script names its files relative to the page, too.
	if (/["'(]\/_app\//.test(full)) problem(file, 'names a file under /_app/ from the root of the domain');

	if (!/<html[^>]*\slang="[a-z-]+"/i.test(full)) problem(file, 'no language on <html>');
	const title = full.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
	if (!title) problem(file, 'no <title>');
	if (!/<meta\s+name="viewport"/i.test(full)) problem(file, 'no viewport meta');
	const headings = [...text.matchAll(/<h1\b/gi)].length;
	if (headings !== 1) problem(file, `${headings} <h1> headings (one is right)`);
	if (!full.replace(/\s+/g, ' ').includes(DISCLAIMER)) problem(file, `the line "${DISCLAIMER}" is missing`);
	if (file !== '404.html') {
		const description = full.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1]?.trim();
		if (!description) problem(file, 'no meta description');
		else if (description.length > 200) problem(file, `meta description is ${description.length} characters (keep it under 200)`);
		// The description is what a search result and a link preview say. On
		// the pages that invite someone to download or to walk, it says the
		// warning as well.
		if (description && INVITING.includes(file) && !/\bown risk\b/i.test(description)) {
			problem(file, 'the meta description invites without saying "at your own risk"');
		}
	}
	if (file !== '404.html') checkPolicy(file, full);

	// Everything a visitor can read: the words between the tags, and the
	// words inside them that are read out or shown (alt, title, labels, the
	// descriptions for search engines and link previews).
	const said = [...full.matchAll(/\s(?:alt|title|aria-label|content|placeholder)="([^"]*)"/gi)].map((m) => m[1]);
	const read = decode(
		`${said.join(' | ')} | ${full
			.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
			.replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
			.replace(/<[^>]+>/g, '')}`
	).replace(/\s+/g, ' ');
	for (const [pattern, what] of GONE) {
		const found = read.match(pattern);
		if (found) {
			const at = Math.max(0, found.index - 50);
			problem(file, `says something about ${what}, which Walka no longer has: "...${read.slice(at, found.index + found[0].length + 40).trim()}..."`);
		}
	}
	if (WITHDRAWN.test(full)) problem(file, 'links to a version of Walka that has been withdrawn');

	return { title };
}

/** The page's Content-Security-Policy: there, complete, and letting in nothing that is not listed. */
function checkPolicy(file, html) {
	const content = html.match(/<meta\s+http-equiv="content-security-policy"\s+content="([^"]*)"/i)?.[1];
	if (!content) return problem(file, 'no Content-Security-Policy');
	const policy = new Map(
		decode(content)
			.split(';')
			.map((part) => part.trim().split(/\s+/))
			.filter((words) => words[0])
			.map(([name, ...sources]) => [name, sources])
	);
	for (const [name, extra] of Object.entries(POLICY)) {
		const sources = policy.get(name);
		if (!sources) {
			problem(file, `the Content-Security-Policy has no ${name}`);
			continue;
		}
		for (const source of sources) {
			const fine =
				source === "'self'" ||
				source === "'none'" ||
				extra.includes(source) ||
				(name === 'script-src' && /^'sha(256|384|512)-[A-Za-z0-9+/=]+'$/.test(source));
			if (!fine) problem(file, `the Content-Security-Policy lets in ${source} for ${name}. If that is meant, list it in scripts/verify.mjs`);
		}
	}
}

async function checkCss(file) {
	const css = await readFile(join(root, file), 'utf8');
	for (const [, raw] of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/g).map((m) => [m[0], m[1] ?? m[2] ?? m[3]])) {
		const address = raw.trim();
		if (address === '' || address.startsWith('data:') || address.startsWith('#')) continue;
		if (/^[a-z][a-z0-9+.-]*:\/\//i.test(address) || address.startsWith('//')) problem(file, `stylesheet loads from another site: ${address}`);
		else if (address.startsWith('/')) problem(file, `stylesheet names ${address} from the root of the domain`);
		else {
			const target = resolveInSite(file, address);
			if (target === null || !existsInSite(target)) problem(file, `stylesheet names ${address}, which is not in the build`);
		}
	}
	if (/@import\s+(?:url\()?["']?https?:/i.test(css)) problem(file, 'stylesheet imports from another site');
	// "@media (width <= 40rem)" is today's way to write (max-width: 40rem).
	// Safari before 16.4 does not read it, and would lose every rule for a
	// narrow screen. vite.config.ts has the build write the old form.
	// ("<" or ">" before the first brace of an @media rule is always that
	// form, whatever is compared.)
	const ranged = css.match(/@media[^{]*[<>][^{]*/i);
	if (ranged) problem(file, `a media query older browsers cannot read: "${ranged[0].trim()}". See build.cssTarget in vite.config.ts`);
}

/**
 * A site with accounts names who to write to, where the accounts are kept and
 * who sends its mail - in the settings, and on the privacy page as it was
 * built. (A problem with a setting is one plain sentence, with no file in
 * front of it: it is not a page that is wrong.)
 */
async function checkAccounts(files) {
	const html = files.includes(PRIVACY_PAGE) ? await readFile(join(root, PRIVACY_PAGE), 'utf8') : '';
	const built = ACCOUNT_PART.test(html);

	if (!SUPABASE_URL) {
		if (built) problems.push('The site was built with accounts, but this check was not told where they are kept: give it the same SUPABASE_URL as the build.');
		return;
	}
	if (!built) {
		problems.push('This check was told that the site has accounts (SUPABASE_URL), but the privacy page was built without them: build with SUPABASE_URL and SUPABASE_KEY, and check with the same settings.');
	}
	if (!CONTACT) problems.push('The site is built with accounts, but nobody can be reached in private about them: set CONTACT.');
	if (!ACCOUNTS_REGION) problems.push('The site is built with accounts, but the privacy page cannot say where they are kept: set ACCOUNTS_REGION.');
	if (BY_EMAIL && !MAIL_SENDER) {
		problems.push('The site is built with accounts and a sign-in code by e-mail, but the privacy page cannot say who sends that mail: set MAIL_SENDER.');
	}
	if (!built) return;

	// The page as it was built says them: a build made with other settings
	// than this check was given would promise something else.
	const said = decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
	if (CONTACT && !decode(html).includes(`href="mailto:${CONTACT}"`)) problem(PRIVACY_PAGE, `does not give the contact address ${CONTACT}. Was the site built with another CONTACT?`);
	if (ACCOUNTS_REGION && !said.includes(ACCOUNTS_REGION)) problem(PRIVACY_PAGE, `does not say that the accounts are kept in ${ACCOUNTS_REGION}. Was the site built with another ACCOUNTS_REGION?`);
	if (BY_EMAIL && MAIL_SENDER && !said.includes(MAIL_SENDER)) problem(PRIVACY_PAGE, `does not name ${MAIL_SENDER}, which sends the sign-in mail. Was the site built with another MAIL_SENDER or SIGN_IN?`);
}

async function main() {
	if (!existsSync(root)) {
		console.error('verify: there is no build folder. Run `npm run build` first.');
		process.exit(1);
	}

	const files = (await walk(root)).map(toUrlPath).sort();
	const pages = files.filter((f) => f.endsWith('.html'));
	const titles = new Map();

	await checkAccounts(files);

	for (const file of files) {
		const kind = extname(file);
		if (kind === '.html') {
			const { title } = await checkHtml(file);
			if (title) titles.set(title, [...(titles.get(title) ?? []), file]);
		} else if (kind === '.css') await checkCss(file);

		if (['.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.webmanifest', '.svg'].includes(kind)) {
			const text = await readFile(join(root, file), 'utf8');
			for (const [pattern, what] of SECRETS) if (pattern.test(text)) problem(file, `contains what looks like ${what}`);
		}
	}

	for (const [title, where] of titles) {
		if (where.length > 1) problem(where.join(', '), `share the title "${title}"`);
	}

	for (const page of PAGES_WITH_DOWNLOADS) {
		if (!files.includes(page)) continue;
		const html = await readFile(join(root, page), 'utf8');
		for (const link of DOWNLOADS) if (!html.includes(`href="${link}"`)) problem(page, `the download link ${link} is missing`);
	}

	for (const needed of ['index.html', '404.html', 'favicon.svg', 'robots.txt']) {
		if (!files.includes(needed)) problem(needed, 'is missing from the build');
	}

	const bytes = (await Promise.all(files.map((f) => stat(join(root, f))))).reduce((sum, s) => sum + s.size, 0);
	console.log(`verify: ${pages.length} pages, ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);

	if (problems.length) {
		console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:\n`);
		for (const line of problems) console.error(`  - ${line}`);
		console.error('');
		process.exit(1);
	}
	console.log('verify: all good - relative links, nothing loaded from other sites, every page complete.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
