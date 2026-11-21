# Switching accounts on

The website is built two ways from the same code. Without three settings
it has no accounts: the account pages say "not open yet", and nothing on
the site talks to a database. With them it has accounts and the food
diary. This page is the list of things to do by hand, once, to get from
the first to the second - and, at the end, how to go back.

Nothing here can be done by the repository itself. The database lives in
a project at [Supabase](https://supabase.com) that you make, and its
sign-in settings are set in Supabase's dashboard.

Two warnings before anything else:

* **You will be keeping other people's data**, some of it about their
  health. The [privacy page](../src/routes/privacy/+page.svelte) and the
  [terms](../src/routes/terms/+page.svelte) say, in the present tense,
  what the site does with it. Read both as they are built with accounts
  (step 5 shows how) before anybody else can. What they say must be true
  of your project.
* **The names of the menus are Supabase's, Discord's, Google's and
  GitHub's, and they move.** They are written here as they were on
  20 November 2026. Where a name is not where this page says, look for
  the thing, not the word.

## Decide first

Three decisions. Each ends up as a setting in step 5.

1. **Which ways to sign in.** Nobody signs in with a password. The
   choices are a six-digit code by e-mail, and signing in through
   Discord, Google or GitHub.
   * *Through Discord, Google or GitHub only* is the simple start. It
     needs no mail at all.
   * *A code by e-mail* needs a mail service of your own. Supabase's
     built-in one is for trying things out: it sends 2 messages an hour,
     and only to the addresses of the project's own team. A mail service
     (Resend, Postmark, Brevo and others; connecting one is included in
     Supabase's free plan) wants a domain of yours to send from, so this
     way is easier once the site has a domain.

   Write the ones you choose as `SIGN_IN`, with commas: `discord,google`
   or `email,discord,google,github`. Left empty, the site offers e-mail
   only.
2. **The region:** where on earth the database is. Supabase asks once,
   when the project is made, and it cannot be moved afterwards. Take one
   near the people who will use it. The privacy page names it, in your
   words: write it as a place, such as `Frankfurt, Germany`
   (`ACCOUNTS_REGION`).
3. **The contact address:** an e-mail address at which people can reach
   you in private about their account or about privacy (`CONTACT`). It is
   printed on the privacy page and in the terms, so it is public: use an
   address made for this, and one you really read.

If you chose a code by e-mail, there is a fourth: the name of the mail
service, as the privacy page should name it (`MAIL_SENDER`, for example
`Resend`).

## 1. Make the Supabase project

1. Sign up at <https://supabase.com/dashboard> and make an organization
   on the **Free** plan.
2. **New project.** Give it a name (`walka`), choose the region you
   decided on, and let it make a **database password**.
3. Put that password into your password manager. The website never
   needs it. You need it only for the command line in steps 2 and 4.
4. Wait until the project is ready. Its address is in the **Connect**
   dialog at the top of the project, and looks like
   `https://abcdefghijklmnop.supabase.co`. The letters before
   `.supabase.co` are the *project ref*. Note both.

What the free plan gives, and what it does not: a database of 500 MB,
5 GB of traffic a month, two projects. A project that sees too little use
for about a week is paused; the job in step 6 keeps it awake.

## 2. Make the tables

The tables and all their rules are one file:
[`supabase/migrations/20261120000000_accounts.sql`](../supabase/migrations/20261120000000_accounts.sql).
Run it once, in one of two ways.

**In the dashboard.** *SQL Editor* → a new query → paste the whole file →
**Run**. It should end with "Success. No rows returned".

**Or from the command line,** in this repository:

```sh
npx supabase@3.2.0 login
npx supabase@3.2.0 link --project-ref <your project ref>
npx supabase@3.2.0 db push
```

`link` asks for the database password. `db push` shows what it will run
and asks before it does. This way also notes in the database that the
file has been run, which the first way does not: if you paste now and
want to use `db push` for a later file, first tell it that this one is
done (`npx supabase@3.2.0 migration repair --status applied 20261120000000`).

Then look: *Table Editor* shows nine tables - `profiles`, `body`,
`walks`, `foods`, `food_entries`, `food_settings`, `reports`,
`profile_holds`, `retired_handles` - and each says that row-level
security is on.

If the run stops with an error, stop too. A database with half its rules
is worse than none: note the message, delete the project (*Project
Settings → General*), and start again or ask.

> [!CAUTION]
> Never run `supabase config push`. [`supabase/config.toml`](../supabase/config.toml)
> describes the database on your own computer, for trying things out. Its
> settings are not the ones a public project should have, and that
> command would write them over the ones you set in step 3.

## 3. The sign-in settings

These are in the dashboard under **Authentication**. The repository
cannot set them. Each has its reason next to it.

- [ ] **Confirm email: on.** *Sign In / Providers → Email.* With it off,
      a sign-up for somebody else's address counts as confirmed at once.
- [ ] **The code: 6 digits, good for 15 minutes.** Same place: *Email OTP
      Length* 6, *Email OTP Expiration* 900 seconds. The sign-in page and
      the mail both tell people that the code works for 15 minutes
      (`src/lib/components/account/SignIn.svelte` and
      `supabase/templates/sign-in-code.html`): if you choose another
      time, change those two sentences with it.
- [ ] **Passwords.** Nobody signs in with one, and the database keeps
      none (a rule in the migration blanks any that is set). Set the
      *minimum password length* to 12 and *Secure password change* on all
      the same, so that the service itself is strict.
- [ ] **Anonymous sign-ins: off. Manual linking: off. Phone: off.**
      *Sign In / Providers.* The site uses none of them.
- [ ] **Where sign-in may come back to.** *URL Configuration.*
      * *Site URL:* `https://antonyperez0.github.io/walka-website/account/`
      * *Redirect URLs,* each written out in full, with the slash at the
        end and no `*`:
        `https://antonyperez0.github.io/walka-website/account/`,
        `https://antonyperez0.github.io/walka-website/account/walks/`,
        `https://antonyperez0.github.io/walka-website/food/`

      Signing in through another site comes back to the page it was asked
      from, and these three are the pages that ask. No `localhost` and no
      `127.0.0.1` here. When the site gets a domain, the same three
      addresses are added for it (and the Site URL changed): see the
      README, "What to do by hand".
- [ ] **The mail's words.** *Emails → Templates.* For **Magic Link** and
      for **Confirm signup**, each:
      * *Subject:* `Your Walka sign-in code: {{ .Token }}`
      * *Body:* the whole of
        [`supabase/templates/sign-in-code.html`](../supabase/templates/sign-in-code.html)

      Without this the mail carries a link and no code, and the sign-in
      page asks for a code.
- [ ] **Rate limits.** *Rate Limits.* Sign-ups and sign-ins: 30 in five
      minutes from one IP address, or lower. Code checks: 30 in five
      minutes. E-mails an hour: as low as your mail service allows.
- [ ] **Access tokens: 3600 seconds. Refresh token rotation: on.** These
      are the defaults: leave them.

### If people sign in by e-mail: the mail service

Skip this if `SIGN_IN` has no `email` in it.

1. Open an account at a mail service and let it check the domain you
   will send from. It gives you four things: a host, a port, a user name
   and a password (for some, the password is an API key).
2. *Authentication → Emails → SMTP Settings:* switch **custom SMTP** on.
   Sender address: something like `no-reply@your-domain`. Sender name:
   `Walka`. Then the host, port, user name and password.
3. Supabase now sends to every address, at most 30 mails an hour until
   you change that under *Rate Limits*.
4. The name of that service is `MAIL_SENDER` in step 5. It is given the
   e-mail address of everyone who asks for a code, and the privacy page
   says so by name.

### For each of Discord, Google, GitHub that you want

The pattern is the same three times: make an "app" at that site, tell it
the address Supabase's sign-in comes back to, and copy two values into
Supabase. The address is

    https://<your project ref>.supabase.co/auth/v1/callback

and Supabase shows it, with a **Copy** button, under *Authentication →
Sign In / Providers →* the site's name. The two values go into the same
place, and nowhere else: not into this repository, not into GitHub.

**Discord.** <https://discord.com/developers> → **New Application** →
*OAuth2* → *Redirects* → **Add Redirect**: the address above → **Save
Changes**. Under *Client information*, copy the **Client ID** and the
**Client Secret**. In Supabase: *Sign In / Providers → Discord* → enable,
paste both, **Save**.

**GitHub.** <https://github.com/settings/developers> → **New OAuth App**.
*Homepage URL:* the site's address. *Authorization callback URL:* the
address above. Leave *Enable Device Flow* off. **Register application**,
copy the **Client ID**, then **Generate a new client secret** and copy
it. In Supabase: *Sign In / Providers → GitHub* → enable, paste both,
**Save**.

**Google.** In the [Google Cloud console](https://console.cloud.google.com)
make a project, then under *Google Auth Platform*:
* *Branding:* the name people see when they are asked ("Walka").
* *Audience:* who may sign in. For everybody, the app has to be
  published; while it is in testing, only the people you list can.
* *Data Access:* the scopes `openid`, `userinfo.email` and
  `userinfo.profile`, and no others.
* *Clients* → create an OAuth client ID, type **Web application**.
  *Authorized JavaScript origins:* `https://antonyperez0.github.io`.
  *Authorized redirect URIs:* the address above. Copy the **Client ID**
  and the **Client Secret**.

In Supabase: *Sign In / Providers → Google* → enable, paste both, **Save**.

Use only sites that hand over an e-mail address they have checked. These
three do. Each hands the sign-in the person's e-mail address, and a name
and a picture's address that the website does not use: the privacy page
says this, and you should check it against a real sign-in (*Authentication
→ Users* → the user → the raw data) before you rely on it.

### Three more places, to look at once

- [ ] **Data API** (*Project Settings → Data API*, or *API*): the exposed
      schema is `public` only; *Max rows* 1000.
- [ ] **GraphQL:** if the extension `pg_graphql` is on and you do not
      use it, switch it off (*Database → Extensions*).
- [ ] **Realtime and Storage:** add none of the tables to a realtime
      publication, and make no public bucket. The site uses neither.

## 4. The USDA key, and its function (optional)

The food search asks two lists. Open Food Facts is asked by the visitor's
browser and needs nothing from you. USDA FoodData Central needs a key,
and a key must never be in a website. So a small function at Supabase
(`supabase/functions/usda` in this repository) keeps the key and passes
the search words on.

Without this step the food search uses Open Food Facts only, and
everything else works.

1. Ask for a key at <https://fdc.nal.usda.gov/api-key-signup>. It is
   free, and comes by mail.
2. Give it to the project as a secret named `USDA_API_KEY`: in the
   dashboard under *Edge Functions → Secrets*, or

   ```sh
   npx supabase@3.2.0 secrets set USDA_API_KEY=<the key>
   ```
3. Send the function:

   ```sh
   npx supabase@3.2.0 login
   npx supabase@3.2.0 link --project-ref <your project ref>
   npx supabase@3.2.0 functions deploy usda
   ```

The key is in Supabase and nowhere else: not in a file here, not in a
GitHub variable. USDA switches off a key it finds in public. It allows
1,000 requests an hour.

## 5. Tell the build

On GitHub, in this repository: **Settings → Secrets and variables →
Actions → Variables** (the tab next to *Secrets*) → **New repository
variable**. These are *variables*, not secrets: every one of them ends up
in the pages people download, and none is a secret.

| Variable | What to put in |
|---|---|
| `SUPABASE_URL` | the project's address from step 1: `https://abcdefghijklmnop.supabase.co` |
| `SUPABASE_KEY` | the project's **publishable** key. *Connect*, or *Project Settings → API Keys*. It starts with `sb_publishable_`. |
| `SIGN_IN` | the ways you switched on in step 3: `discord,google` |
| `CONTACT` | the contact address |
| `ACCOUNTS_REGION` | the region, as a place: `Frankfurt, Germany` |
| `MAIL_SENDER` | the name of the mail service - only if `SIGN_IN` has `email` in it |

> [!WARNING]
> **The publishable key, never the secret one.** The secret key
> (`sb_secret_...`) and the older `service_role` key open the whole
> database to whoever holds them. They belong in no file, no variable and
> no GitHub secret of this repository: nothing here needs them. The build
> refuses a secret key, and the check of the built site looks for one.

**Read it before the world does.** The same settings build the site on
your own computer (your values in place of these; add `MAIL_SENDER` if
people sign in by e-mail):

```sh
export SUPABASE_URL=https://abcdefghijklmnop.supabase.co SUPABASE_KEY=sb_publishable_...
export SIGN_IN=discord,google CONTACT=privacy@example.org ACCOUNTS_REGION='Frankfurt, Germany'
npm ci
npm run build && npm run verify && npm run preview
```

Open <http://127.0.0.1:4173/walka-website/privacy/> and
<http://127.0.0.1:4173/walka-website/terms/> and read them through. (The
pages can be read there. Signing in through another site cannot be tried
from there: step 3 lets it come back to the live site only.)

Then **Actions → Site → Run workflow**. The run stops at "Check the built
site", and says why in one sentence, if accounts are on and `CONTACT` or
`ACCOUNTS_REGION` is missing, or `MAIL_SENDER` while people sign in by
e-mail. When it is green, the site has accounts: an *Account* link is in
the bar along the top.

## 6. Check it

On the live site, yourself, before you tell anybody:

1. Read `/privacy/` and `/terms/` from top to bottom. They now speak of
   accounts in the present tense. Is every sentence true of your project
   - the region, the mail service, the ways to sign in, the contact
   address?
2. Open `/account/`. Sign in, in each way you switched on.
3. Tick *I am 18 or older* and open the account.
4. Add a walk on the *Walks* page.
5. Save a name for your page and switch **My page is public** on. Open
   the link "see it as others do" in a private window, where you are not
   signed in. It shows the name and your totals, and nothing else.
6. On the account page, *Save everything as a file*, and look into the
   file.
7. *Delete my account...* Then look in the dashboard: *Authentication →
   Users* no longer has you, and *Table Editor → walks* is empty.

And the job that keeps the database awake: **Actions → Keep the accounts
database awake → Run workflow.** It should say "The database answered."
From now on it runs by itself once a day.

Two things about that job:

* If it fails, GitHub sends you a mail: the database did not answer. Open
  the Supabase dashboard. A paused project has a button to wake it
  (**Resume project**, or **Restore**), and it can be woken for up to a
  year after it was paused.
* GitHub switches scheduled jobs off in a repository that has seen no
  activity for 60 days, and sends a mail before it does. A push, or
  **Enable workflow** on the job's page, keeps it going.

## 7. Looking after it

**Reports.** A signed-in person can report a public page. Reports arrive
in *Table Editor → reports*: the name of the page, one of three reasons,
a note. Nothing tells you that one has come: look once a week.

**Taking a page down,** without opening anybody's account. In the *SQL
Editor*:

```sql
select hide_profile('the-name', 'pretends to be somebody');
```

The page is gone for everybody at once, and the reason is noted with the
account. To put it back:

```sql
select show_profile('the-name');
```

**Deleting an account for somebody** who asks at the contact address and
cannot do it themselves - or a child's. Be sure the request comes from
the address itself: answer it and wait for the reply. Then *Authentication
→ Users* → the address → **Delete user**. Every row goes with it. The
sign-in's own log keeps its lines about that person, which the site's
"Delete my account" would have removed too; remove them in the *SQL
Editor*:

```sql
delete from auth.audit_log_entries
where payload::text like '%<the user id>%' or payload::text ilike '%<the address>%';
```

**How full it is.** *Usage* in the dashboard shows the database's size
against the free plan's 500 MB, and the month's traffic against 5 GB.
Nothing in this repository watches or enforces either: look once a month.

**Do not look into accounts.** As the project's owner you can read every
table. The privacy page promises that you do not, except to fix a fault
or to act on a report. That promise is kept by you, and by nothing else.

**Supabase's data processing addendum.** Supabase keeps this data on
your instructions; the agreement that says so is its
[data processing addendum](https://supabase.com/legal/customer-resources/data-processing-addendum),
which is part of its terms of service. Read it. If you want a signed copy,
the dashboard has one to ask for under the organization's settings
(*Legal Documents*). Its
[list of sub-processors](https://supabase.com/legal/customer-resources/subprocessor-list)
names the companies Supabase uses in turn; the privacy page links to it.

**When the privacy page must change.** Before you add a way to sign in, a
mail service, a new kind of data or another company's script (a CAPTCHA,
for one), change the privacy page and its date first. That is what it
promises.

**If something leaks.** If data from the accounts has reached somebody
it should not have - a key in the wrong place, a hole in a rule, a
dashboard login that was not yours - close the hole first (new keys:
*Project Settings → API Keys*; or switch accounts off, below). Then be
honest and quick. The people whose data it is have to hear of it from
you, at the address they signed in with, in plain words: what happened,
what was in it, what you have done. And in many places the law wants the
data-protection authority told within days - in the European Union,
within 72 hours of your learning of it, unless the leak is unlikely to
harm anyone. Which authority, and whether the law applies to you, depends
on where you and your walkers live: this page cannot tell you, and is not
legal advice. The contact address on the privacy page is where their
questions will come.

## What the first set-up taught (20 November 2026)

The site's accounts were switched on that day, by this list. A few things
were not as it says above, or are not in it:

* **The sign-in's own log.** *Authentication → Audit Logs → Write audit
  logs to the database.* It is off in a new project. Leave it off: no
  page needs that log, and with it on the database keeps a line, with the
  e-mail address, for every sign-in. (Either way, deleting an account
  removes what there is of it.)
* **The mail's words** cannot be changed on a free project until it has a
  mail service of its own (custom SMTP): the templates are read-only till
  then. That only matters for the six-digit code by e-mail, which needs
  the mail service anyway.
* **Data API → Exposed schemas:** a new project lists `public` and
  `graphql_public`. Take `graphql_public` out.
* **Google** does not let an app be published until its *Branding* page
  names a home page, a privacy page and the terms: give it the site's
  three addresses. Until Google has verified the app (it wants proof that
  the site's address is yours, and takes its time), its own screen says
  "to continue to `<project-ref>.supabase.co`", not "Walka". Signing in
  works all the same.
* **Two sites, one address.** A person whose Discord and GitHub accounts
  have the same e-mail address comes to ONE Walka account by either. A
  site with another address makes a second account.
* **The USDA key** is not shown on the page that is asked for it: it
  comes by e-mail.
* **The command-line tool** (`npx supabase@3.2.0`), run by a program and
  not typed into a terminal, will not ask its questions unless it is
  given `--agent no --output-format text`; `functions deploy` wants
  `--yes`.
* **The tables were made by pasting the file** into the SQL Editor, so the
  project does not know that the migration was applied. Before the tool's
  `db push` is ever used: `npx supabase@3.2.0 migration repair --status
  applied 20261120000000`. And from now on a change to the tables is a
  NEW file in `supabase/migrations/`, never a change to the first one.
* **Google's verification** is for a site at an address of its own.
  `github.io` belongs to GitHub, so Google will not take it as yours.
  When the site has its domain: verify the domain in Google Search
  Console, put it on the app's *Branding* page, and ask for verification
  there.

## What the first phone taught (21 November 2026)

With the diary on the phone's home screen, "Sign out" on the account
page in the browser did nothing: the page stood at "One moment" for ever.

The diary keeps a copy of itself on the device, and signing out used to
*delete* that database. A browser deletes a database only when every tab
has let go of it. A tab that the phone has put to sleep (the diary, in
the background) never answers that - the browser then says neither "done"
nor "blocked" - and the page waited. Worse, the sleeping tab still
*hears* that somebody signed out, starts emptying its copy, and cannot
finish: its unfinished work held the copy against every other tab.

What the site does now (`forgetDiary()` in
[`src/lib/food/local.ts`](../src/lib/food/local.ts)): the copy is
emptied, not deleted - that needs nobody's leave - the emptying is told
to finish without waiting to be answered, and no page waits longer than
four seconds for it. A database with nothing in it stays in the browser.

To see it again, a test has to really put a tab to sleep, and a headless
browser will not: there every tab counts as looked at, and a tab that is
looked at is never put to sleep. It takes a browser with a window (on a
server: `xvfb-run`), the diary in one tab, the account page opened as a
second tab of the same window - so that the first is in the background -
and then `Page.setWebLifecycleState {state: "frozen"}` sent to the first
over the browser's remote debugging port. Playwright's own pages will not
do either: it keeps each of them "in front".

## Switching accounts off again

Remove the variables (`SUPABASE_URL` is enough) and run **Actions → Site
→ Run workflow**. The site is then what it was: the account pages say
"Accounts are not open yet", the privacy page and the terms say that
accounts are planned, and nothing on the site talks to the database. The
daily job stops asking, too.

That only closes the door. Everything people put in is still in the
Supabase project, and they can no longer reach it to take it out. So if
you mean to end accounts for good, the terms promise more: say so on the
terms page first, leave people time to save their data, and only then
switch off - and delete the project (*Project Settings → General*), which
is what deletes the data.
