# Walka website

The website for [Walka](https://github.com/AntonyPerez0/walka-addon), which
counts your steps, miles and calories while you walk on your walking pad
and play World of Warcraft, and draws your character's road on the map.
This repository holds only the website. Walka itself - the game
addon and the companion program - lives in
[walka-addon](https://github.com/AntonyPerez0/walka-addon).

The site is plain files, made at build time and served by GitHub Pages. It
has no server of its own, no cookies, no analytics, and it loads nothing
from anyone else: fonts, scripts and pictures all come from the site
itself.

## What is in it

| Page | Address | What it is for |
|---|---|---|
| Home | `/` | What Walka is, what you get, the downloads |
| How it works | `/how-it-works/` | The two pieces, what Walka looks at, getting started, the numbers, the Share picture |
| Safety | `/safety/` | Walka only listens to the treadmill; walking while you play is at your own risk; what Walka is and is not |
| FAQ | `/faq/` | Short answers, with links to the long ones |
| Downloads | `/downloads/` | The files, which treadmills work, is the download safe |
| Privacy | `/privacy/` | What Walka and this site do with data: nothing is uploaded |
| Terms | `/terms/` | The terms of the website, in plain words |

Everything the site says about Walka is taken from Walka's own
`README.md`, `DISCLAIMER.md` and `docs/`. When those change, the site
follows them - not the other way round. (It was written for Walka 0.7,
which only listens to a treadmill and cannot move its belt. The site must
never say that Walka starts, stops or steers a belt.)

## Run it on your computer

You need [Node.js](https://nodejs.org) 22.17 or newer.

```sh
npm ci            # install exactly what package-lock.json names
npm run dev       # the site at http://localhost:5173, reloading as you edit
```

Before you push:

```sh
npm test          # check the code, build the site, check the built site
npm run preview   # the built site, as GitHub Pages would serve it:
                  #   http://127.0.0.1:4173/walka-website/
npm run preview -- --base /     # ... and as a domain of its own would
```

`npm test` is three steps, which also run one by one:

* `npm run check` - the code (Svelte and TypeScript).
* `npm run build` - makes the site in `build/`. A link to a page or an
  anchor that does not exist stops the build.
* `npm run verify` - reads the built site and holds it to its rules: every
  link is relative, nothing is loaded from another site, every page has a
  title, a description, one main heading and the "not affiliated with
  Blizzard" line, the download buttons are the links Walka's README uses,
  and nothing that looks like a secret key is in it. The rules, and the
  short list of outside addresses the site's code may talk to, are at the
  top of [`scripts/verify.mjs`](scripts/verify.mjs).

## How it is published

[`.github/workflows/site.yml`](.github/workflows/site.yml) builds and
checks the site on every push and pull request. From the default branch it
then publishes it to GitHub Pages. In the repository's settings, *Pages →
Build and deployment → Source* has to be **GitHub Actions**; until it is,
the workflow builds and checks and says in its log that nothing was
published.

* The actions are named by the commit they are at, not by a tag, as
  Walka's own build does. Once a month Dependabot proposes newer ones, and
  newer npm packages, each kind in one pull request
  ([`.github/dependabot.yml`](.github/dependabot.yml)): green means merge.
* `npm ci` installs exactly what `package-lock.json` names, checksums
  included.

### The address, and a domain of its own

The site is built without knowing where it will be served from. Every
link in it is relative to the page it is on, so the same files work at
`https://antonyperez0.github.io/walka-website/` and at the root of a
domain. Nothing in the code names either.

One thing is told to the build: the full public address, for the few
places that must name it (the sitemap, the canonical link, the picture
for link previews). The workflow asks GitHub Pages for it at each run and
passes it as `SITE_URL` (see [`src/env.ts`](src/env.ts)). So when the
domain is added under *Settings → Pages → Custom domain*, the site keeps
working at once, and the next run of the workflow (*Actions → Site → Run
workflow*) puts the new address into the sitemap.

`static/404.html` is the one page written by hand: GitHub shows it at any
address that is not there, so it cannot use relative links, and it works
out where the front page is by itself.

Try both before changing how links are written: `npm run preview` serves
the build under `/walka-website/`, `npm run preview -- --base /` at the
root.

## Changing the site

It is [SvelteKit](https://svelte.dev/docs/kit) with the static adapter:
every page is a `.svelte` file that is turned into plain HTML at build
time. A page is mostly ordinary HTML.

```
src/
  routes/               one folder per page: safety/+page.svelte is /safety/
    +layout.svelte      what every page is wrapped in: fonts, styles, header, footer
  lib/
    site.ts             names and addresses: the download links, links into Walka's repository
    nav.ts              the pages in the navigation
    components/         the header, the footer, the frame, pictures, callouts ...
    styles/tokens.css   the colours, the type, the spacing - once, for dark and light
    styles/base.css     what plain HTML looks like, and a few shared classes
  images/               the pictures, as they came out of Walka
static/                 files that are published as they are (icons, the 404 page)
scripts/                the build's helpers: pictures, the preview server, the checks
```

**A new page:** add `src/routes/<name>/+page.svelte`, starting from an
existing one - `src/routes/downloads/+page.svelte` shows the pieces. Give
it a `<Seo title description />` and a `<PageHero>` (which holds the
page's one `<h1>`). It is in the sitemap by itself; to put it in the
navigation, add it to `src/lib/nav.ts`.

**Links.** To another page: `href={resolve('safety/')}`, with `resolve`
from `$app/paths` - never `href="/safety/"`, which would break under
`/walka-website/`. To Walka's repository: the entries in
`src/lib/site.ts`.

**The words.** Plain words, short sentences, as Walka's README has them.
Say what Walka is built to do, not what it guarantees. Wherever the page
invites someone to download or to walk, "experimental, and at your own
risk" is near by, with the disclaimer. It is in such a page's description
too (what a search result and a link preview show): `npm run verify`
checks the pages listed as `INVITING` in `scripts/verify.mjs`.

### Pictures

The pictures are Walka's own output: the dashboard and the Share pictures,
made with its demo mode (`python -m walka --demo`, a simulated treadmill
and a made-up character). There are no game screenshots on the site, and
there must not be.

Put a picture in `src/images/` and use it by its name:

```svelte
<Picture name="share-sapphire" alt="..." sizes="(min-width: 60rem) 30rem, 100vw" />
<ThemedPicture name="dashboard" narrow="dashboard-phone" alt="..." />
```

`npm run dev` and `npm run build` first run
[`scripts/images.mjs`](scripts/images.mjs), which makes AVIF and WebP
versions at several widths in `static/img/` (not in git). `ThemedPicture`
shows `<name>-dark` or `<name>-light`, whichever matches the page.

To renew the screenshots: run Walka's demo, open the dashboard at
`127.0.0.1:8787`, and take them at twice the size they are shown at (the
ones here are a 1440-wide window at 2x, and a 390-wide one at 3x for the
phone). The Share pictures are the PNG files that the Share page's
*Download PNG* gives, at 1080×1350.

`static/og.png` is the picture that link previews show: the front page's
first screen at 1200×630, dark, without the navigation and the buttons.
`static/favicon-32.png`, `static/apple-touch-icon.png` and the
`icon-*.png` files are made from Walka's mark by `node scripts/icons.mjs`.

### The look

The site should feel like the same product as the dashboard and the Share
picture. Its dark side is the Share picture's Sapphire theme, its light
side the Parchment theme; the blue is the dashboard's. Gold is for the
frame around what matters, and little else. Headings are set in Spectral,
everything else in Inter.

Everything on it is Walka's own drawing, in CSS and SVG: no artwork, logos,
fonts, icons or screenshots of Blizzard's, and nothing that imitates them
or suggests that Blizzard endorses Walka. The line that says so is in the
footer of every page, and `npm run verify` fails without it.

## What comes later

The site is planned to grow in two steps, neither of which is built yet:

1. **Accounts**, for people who want to share their walking progress.
2. **Food tracking** for signed-in people, as a web app that can be
   installed on a phone.

GitHub Pages cannot hold data, so both will keep theirs in a hosted
database (Supabase), with rules that let each person read and write only
their own rows. Only that database's public key will ever be in this
repository. The promises that go with it are on the
[privacy page](src/routes/privacy/+page.svelte): opt-in, private until you
say otherwise, and yours to export and delete.

## Licence and notices

The website's code is published under the [MIT licence](LICENSE), like
Walka's. The fonts are open-licensed; they and the other things the site
is made with are listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

Walka is a fan-made tool. It is not affiliated with or endorsed by
Blizzard Entertainment, UREVO, WELLFIT or any other maker of treadmills.
World of Warcraft is a trademark of Blizzard Entertainment, Inc.; the
other names belong to their owners.
