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

It also has accounts and a food diary, since 20 November 2026. They are
switched on by settings of the build: a copy of the site that is built
without them has neither, and says so. See
[Accounts and the food diary](#accounts-and-the-food-diary).

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
| The account pages | `/account/`, `/account/walks/`, `/food/`, `/u/` | A person's account, their walks, the food diary, a walker's public page. Without accounts they say "not open yet". |

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
npm run preview -- --base /     # the built site as the live one is served,
                                #   at the root: http://127.0.0.1:4173/
npm run preview   # ... and one folder down, as GitHub serves a copy
                  #   that has no domain: http://127.0.0.1:4173/walka-website/
```

`npm test` is three steps, which also run one by one:

* `npm run check` - the code (Svelte and TypeScript).
* `npm run build` - makes the site in `build/`. A link to a page or an
  anchor that does not exist stops the build.
* `npm run verify` - reads the built site and holds it to its rules: every
  link is relative, nothing is loaded from another site, every page has a
  title, a description, one main heading and the "not affiliated with
  Blizzard" line, the download buttons are the links Walka's README uses,
  nothing that looks like a secret key is in it, and no media query in the
  styles is in the form `(width <= 40rem)`, which the oldest browsers the
  site is built for cannot read (the list is in `vite.config.ts`). A site
  built with accounts must also name who to write to, where the accounts
  are kept and who sends its sign-in mail. The rules, and the short list
  of outside addresses the site's code may talk to, are at the top of
  [`scripts/verify.mjs`](scripts/verify.mjs).

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

The site is at **<https://walka.dev/>**. (It started at
`https://antonyperez0.github.io/walka-website/`; GitHub sends that
address, and every page under it, on to the domain.)

It is built without knowing where it will be served from. Every link in
it is relative to the page it is on, so the same files work at the root
of a domain and one folder down, where GitHub puts a site that has none.
Nothing in the code names either.

One thing is told to the build: the full public address, for the few
places that must name it (the sitemap, `robots.txt`, the canonical link,
the picture for link previews). The privacy page and the FAQ read it too:
they say a few things only when the site has a name of its own
([`src/lib/own-name.ts`](src/lib/own-name.ts)). The workflow asks GitHub
Pages for the address at each run and passes it as `SITE_URL` (see
[`src/env.ts`](src/env.ts)). So when a
domain is added or changed under *Settings → Pages → Custom domain*, the
site keeps working at once, and the next run of the workflow (*Actions →
Site → Run workflow*) puts the new address into the sitemap.

`static/404.html` is the one page written by hand: GitHub shows it at any
address that is not there, so it cannot use relative links, and it works
out where the front page is by itself.

Try both before changing how links are written: `npm run preview` serves
the build under `/walka-website/`, `npm run preview -- --base /` at the
root.

## What to do by hand

Three things the repository cannot do for itself. They are done in
GitHub's settings, at the place the domain is kept, and in Supabase's
dashboard.

1. **GitHub Pages.** *Settings → Pages → Build and deployment → Source:*
   **GitHub Actions**. This is done already: it is why the site is live.

2. **The domain.** Done on 21 November 2026: `walka.dev`, registered at
   Cloudflare, where its DNS is kept too. What was done, in the order
   that never breaks signing in - for the day the site moves again:
   1. If the site has accounts: in Supabase, *Authentication → URL
      Configuration → Redirect URLs*, **add** the account pages' new
      addresses ([docs/accounts-setup.md](docs/accounts-setup.md),
      step 3). Adding is harmless.
   2. On GitHub, under your own *Settings → Pages → Add a domain*: GitHub
      shows a `TXT` record. Put it where the DNS is kept and press
      **Verify**. Nobody else can then point a site of theirs at the
      domain.
   3. Where the domain's DNS is kept - at Cloudflare: *DNS → Records* -
      add these, each with the proxy **off** ("DNS only", the grey cloud):

      | Type | Name | Points to |
      |---|---|---|
      | `A` | `@` | `185.199.108.153` |
      | `A` | `@` | `185.199.109.153` |
      | `A` | `@` | `185.199.110.153` |
      | `A` | `@` | `185.199.111.153` |
      | `AAAA` | `@` | `2606:50c0:8000::153` |
      | `AAAA` | `@` | `2606:50c0:8001::153` |
      | `AAAA` | `@` | `2606:50c0:8002::153` |
      | `AAAA` | `@` | `2606:50c0:8003::153` |
      | `CNAME` | `www` | `antonyperez0.github.io` |

   4. In the repository, *Settings → Pages → Custom domain:* type the
      domain (without `www`), **Save**. Wait until the check of the
      domain is green, then tick **Enforce HTTPS**. (GitHub fetches the
      certificate itself; that can take a while after the records are in.)
   5. *Actions → Site → Run workflow*, once, so that the sitemap and the
      link previews name the new address.
   6. If the site has accounts: change Supabase's *Site URL* to the new
      address, and the addresses that the sign-in services hold
      ([docs/accounts-setup.md](docs/accounts-setup.md), step 3). When
      signing in works at the new address, take the old addresses out of
      the *Redirect URLs*. People who were signed in at the old address
      sign in once more at the new one, and a food diary on a phone's
      home screen is put there again from the new address.
   7. **What the old address leaves behind.** A browser keeps what a site
      stores under the site's address. Whoever signed in at the old
      address still has, in that browser, the sign-in, the food diary's
      copy and the diary's own files - under the old address, where every
      page now only sends them on, so that no page of the site can ever
      remove them. Signing out at the new address does not reach them.
      * In Supabase, *Authentication → Users*: end every session that was
        made before the move, so that the keys left in those browsers
        open nothing.
      * On your own devices: clear the site data for the old address in
        the browser's settings, and take a food diary that was put on a
        home screen from the old address off again (not only put a new
        one there).
      * The privacy page tells everybody else ("If you signed in before
        21 November 2026"). That paragraph can go when nobody is left
        whom it concerns: when Supabase's list of users shows no account
        made before the move but your own. It is in
        [`src/routes/privacy/+page.svelte`](src/routes/privacy/+page.svelte);
        the old address and the date are in
        [`src/lib/own-name.ts`](src/lib/own-name.ts).

   **Keep at Cloudflare as it is:**
   * **The proxy stays off,** on every record, for good. With it on, every
     page would pass through Cloudflare, and the privacy page - which says
     that no page does - would no longer be true. For the same reason: no
     Web Analytics, no Workers, no Page Rules there. (That sentence of the
     privacy page names Cloudflare; if the domain's DNS ever moves to
     another company, change the name in
     [`src/lib/own-name.ts`](src/lib/own-name.ts).)
   * **DNSSEC is on.** Before the DNS is ever moved to another company,
     switch DNSSEC off at Cloudflare first and wait a day (or carry the
     keys over): otherwise the name stops resolving for everybody whose
     resolver checks.
   * **The `TXT` record for Google stays,** and so does the domain's
     property in Google Search Console. Google's verification of the
     sign-in screen ("... to continue to Walka") rests on it. It is also
     why the privacy page names one count that the site's maker can see:
     Search Console shows the owner of a name how often its pages were
     shown and clicked in Google's search. If the property is ever
     removed, take that paragraph out
     ([`src/routes/privacy/+page.svelte`](src/routes/privacy/+page.svelte),
     "The one count the site's maker can see") and the half-sentence in
     the FAQ.
   * **Auto-renew stays on.** The domain is paid by the year (it is the
     one thing here that costs money). If it lapsed, whoever registered
     it next would be where the site's sign-ins come back to. Should the
     domain ever be given up on purpose: first take its addresses out of
     Supabase's *Redirect URLs* and *Site URL* and out of Google's
     *Authorized JavaScript origins*, and remove the custom domain under
     *Settings → Pages*.

3. **Accounts.** Making the database, its sign-in settings and the
   settings of the build: [docs/accounts-setup.md](docs/accounts-setup.md),
   step by step.

## Changing the site

It is [SvelteKit](https://svelte.dev/docs/kit) with the static adapter:
every page is a `.svelte` file that is turned into plain HTML at build
time. A page is mostly ordinary HTML.

SvelteKit was chosen because it writes every page out as plain HTML at
build time, which is all GitHub Pages can serve, while the header, the
footer and the styles are written once.

```
src/
  env.ts                the settings the build reads from the environment
  routes/               one folder per page: safety/+page.svelte is /safety/
    +layout.svelte      what every page is wrapped in: fonts, styles, header, footer
    (app)/              the account pages: account/, account/walks/, food/, u/
  lib/
    site.ts             names and addresses: the download links, links into Walka's repository
    nav.ts              the pages in the navigation
    components/         the header, the footer, the frame, pictures, callouts ...
    account/            accounts: the one connection to the database, who is signed in, the rows
    styles/tokens.css   the colours, the type, the spacing - once, for dark and light
    styles/base.css     what plain HTML looks like, and a few shared classes
    styles/app.css      the forms and panels of the account pages
  images/               the pictures, as they came out of Walka
static/                 files that are published as they are (icons, the 404 page)
scripts/                the build's helpers: pictures, the preview server, the checks
supabase/               the database of the accounts: its tables and rules, the sign-in mail
docs/                   the data model, and how to switch accounts on
tests/                  the promises of the database, tried against a real one
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

## Accounts and the food diary

Two things are built, and the live site has had both since 20 November
2026:

1. **Accounts**, for people who want to share their walking progress.
2. **A food diary** for signed-in people, as a web app that can be put on
   a phone's home screen.

GitHub Pages cannot hold data, so both keep theirs in a hosted database
(Supabase), with rules that let each person read and write only their own
rows. The site is told where that database is by three settings of the
build - `SUPABASE_URL`, `SUPABASE_KEY` and `SIGN_IN`
([`src/env.ts`](src/env.ts)). Until they are there, the site has no
accounts: the account pages say "not open yet", the pages that speak of
accounts say that they are planned and not built, and nothing talks to a
database.
Switching them on is done by hand:
[docs/accounts-setup.md](docs/accounts-setup.md).

**One code, two sites.** Every page that speaks of accounts says one
thing when the site is built without them and another when it is built
with them (`ACCOUNTS.on` in `src/lib/account/config.ts`). The privacy
page and the terms are the long cases. After changing such a page, build
it both ways and read both.

**Only the database's public key** is ever in this repository's settings
or in the pages: the one Supabase calls *publishable*. What protects a
person's rows is the rules in the database, not the key. The build
refuses a secret key.

Where the pieces are:

* [`supabase/migrations/`](supabase/migrations/) - the tables and their
  rules. They are the truth about what is kept;
  [docs/data-model.md](docs/data-model.md) explains them.
* [`supabase/config.toml`](supabase/config.toml) and
  [`supabase/templates/`](supabase/templates/) - the database on your own
  computer, and the sign-in mail. (The settings of the real project are
  set in Supabase's dashboard: the guide says which.)
* [`src/lib/account/`](src/lib/account/) - the one connection to the
  database, who is signed in, the rows as the site reads them, the food
  diary's arithmetic, and the file a person can save.
* `src/routes/(app)/` - the account pages, and
  [`src/lib/components/account/`](src/lib/components/account/), what they
  show before their own content: "not open yet", "temporarily
  unavailable", the sign-in.
* [`src/lib/food/`](src/lib/food/) and
  [`src/lib/components/food/`](src/lib/components/food/) - the food
  diary: its copy on the device, what waits to be sent, the two food
  lists. [`src/service-worker.ts`](src/service-worker.ts) keeps the
  diary's own files, so that it opens without a connection (it belongs
  to that page alone), and `static/food.webmanifest` makes it an app on
  a phone's home screen.
* [`supabase/functions/usda/`](supabase/functions/usda/) - the way to
  USDA's food list: its key stays on the database's side.
* [`tests/`](tests/) - each promise the site makes about the database,
  tried against a real one (`npm run test:database`), and the tests that
  need none: the food diary's arithmetic, the reading of walk files, the
  USDA function (`npm run test:unit`).
* [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) -
  asks the database one small thing a day, so that a free project is not
  put to sleep.

To try them on your own computer you need [Docker](https://www.docker.com),
which runs a whole Supabase there:

```sh
npx supabase@3.2.0 start     # the database, the sign-in and a test mailbox, on this computer
. scripts/accounts-env.sh    # points this shell's builds at it
npm run dev                  # the site with accounts, at http://localhost:5173
npm run test:database        # the promises of the database, tried
```

The sign-in mail does not leave your computer: it lands in the test
mailbox at <http://127.0.0.1:54324>. `npx supabase@3.2.0 stop` ends it.

The promises that go with accounts are on the
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
