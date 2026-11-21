# Brief: let Walka's desktop program send a person's walks to their Walka account

For the assistant who builds it, in the repository
`AntonyPerez0/walka-addon` (default branch
`claude/wow-walking-pad-addon-45z5i2`; the desktop program is
`companion/`, in Python). You know nothing of what came before: this
brief is all of it.

It was written on 21 November 2026 from a reading of both repositories
at that day's commits (walka-addon `25cc69c`, version 0.8.0-rc1) and from
calls tried against a real copy of the database. Line numbers are of
that day. Three reviewers then checked it against both repositories.
Where this brief and a file disagree, **the file wins**: say so, and go
by the file.

## 1. The situation

Walka is a free program for people who walk on an under-desk walking pad
while they play World of Warcraft: a desktop program for Windows and Mac
(the "companion") and an addon in the game. It only LISTENS to the
treadmill. Today it uploads nothing, and says so in many places.

Walka has a website, <https://walka.dev> (repository
`AntonyPerez0/walka-website`, public, default branch
`ccr-a2c5d66c-cbhqpm`). Since 20 November 2026 the site has accounts: a
person signs in with Discord, GitHub or Google, may show their walking
progress on a public page, and may keep a food diary. The data is in a
Supabase project (Postgres with row-level security and Supabase's
sign-in service, free plan). There is no server of Walka's own. Today a
walk gets into an account only when the person adds it on the website
themselves - by hand, or by letting the browser read Walka's own files.

**The owner now wants:** "add a syncing feature to the addon companion
so all of that stuff syncs with their accounts".

## 2. Read first

In `walka-website` (READ ONLY for you; if it is not attached to your
session, ask for read access before anything else, and do not work
without it):

- `docs/data-model.md` - THE CONTRACT. All of it; "Syncing", "From
  Walka's own record of a walk" and "Signing in from a program" above
  all.
- `docs/calls-tried.md` - the requests a syncing program makes and the
  answers they got, tried with plain HTTP.
- `docs/walka_row.py` - the website's reader of Walka's files, in
  Python, checked against the website's own code on 564 records. Take it
  over: copy it into walka-addon and test it there. (Do not import or
  run it where it lies: Python leaves a `__pycache__` folder in a
  repository that is not yours to change.)
- `supabase/migrations/20261120000000_accounts.sql` - the tables and
  rules themselves. The truth about the data.
- `src/lib/account/import.ts`, `src/lib/account/walks.ts`,
  `tests/import.test.ts`, `tests/database.test.ts`, `tests/stack.ts`.
- `src/routes/privacy/+page.svelte` and `src/routes/terms/+page.svelte`
  - what people have been promised.

In `walka-addon`: `README.md` (all 1,016 lines), `SECURITY.md`,
`DISCLAIMER.md`, `docs/SAFETY.md`, `docs/PROTOCOL.md`,
`docs/HARDWARE.md`, `companion/README.md`, `companion/pyproject.toml`,
all of `companion/src/walka/` and `companion/tests/`,
`.github/workflows/ci.yml`.

## 3. The owner's rules, in their words, and what follows from them

- "Walka today uploads nothing. Keep that promise visible: syncing and
  sharing are opt-in, profiles are private until the person makes them
  public, and a person can export and delete their account and data
  themselves."
- "Everything must run on free tiers." "Only the public anon key may
  appear in the site's code." (The same holds for the program: only the
  project's address and its PUBLISHABLE key. Never a secret key.)
- "Do not present Walka as making treadmill walking safe. The honest
  claim is narrower: Walka itself cannot move the belt."
- "Hard rule: no Blizzard artwork, logos, fonts, icons or game
  screenshots, and nothing that suggests Blizzard endorses this."
- "Calorie figures are estimates and not medical advice."
- Of Walka's own files (README.md, docs/SAFETY.md, DISCLAIMER.md,
  SECURITY.md, docs/HARDWARE.md, docs/PROTOCOL.md): "If the site and
  those files disagree, the files win."

What follows, and is not up for trade:

a. **When the program may open a connection to another machine.** Only
   when ALL of this holds: the person has signed in, sending is switched
   on for that account, and there is a walk to send - or the person has
   just pressed a button of the Walka-account view that says it asks the
   account. Never signed in - which is how it comes: no request of any
   kind and no read of the system's store for secrets, ever. Signed in
   with sending off: none at a start. A start with nothing to send:
   none. There is no timer: the access token is refreshed only when a
   request is about to be made and it has run out. (Today there is no
   connection at all: the only aiohttp import is the server.)
b. Nothing goes to an account that the person did not switch on, and
   only to the account they signed in to.
c. Only the numbers of a walk that the contract names are sent. Never
   the samples (speed and heart rate every five seconds), the heart
   rate, the top speed, the treadmill's name, the character, its name or
   realm, its road, a picture, weight, height, age or sex.
d. **Sign-in keys** - the verifier, the one-time code, the access token,
   the refresh token, the other site's tokens - live in memory, and the
   refresh token alone in the system's store for secrets. They are in NO
   file: not `config.json`, `state.json`, the new file of decision 9,
   `walka.log`, `CompanionData.lua` or anything else in the data folder
   or the game's folder; not in the snapshot (`/api/state`),
   `/api/config`, the page or its storage; not on a command line (no
   `security add-generic-password -w ...`, no `cmdkey`, no PowerShell:
   other users of the computer can read a process's arguments) and not
   in an environment variable.
e. Nothing the account does ever deletes or changes a file on the
   computer. Nothing the program does ticks "I am 18 or older", agrees
   to health data, or makes a page public.
f. A walk made with the simulated treadmill never reaches an account.
g. Recording a walk never waits for the network, and closing the
   program never waits for it either.
h. The game addon gets no new word and no new behaviour: it cannot use
   the network, and nothing in the game should suggest an online
   service.
i. Walka works in full without an account and never reminds anybody of
   one: no pill, no line in the first-run list, no toast, no word on the
   Live view for a person who is not signed in. The account's part sits
   in Settings and is quiet until it is used.

## 4. What is decided, and what is still the owner's

Decided by the assistant that wrote this brief, with the owner's leave
to choose. The owner may overrule any of it: offer them the list.

1. **First version:** walks only, one way, from the computer to the
   account. Not in it: body numbers, walks coming down from the account,
   and deletions in either direction. Each is a later step with words of
   its own. Build so that they can be added.
2. **The name.** "Sync" is taken three times over in Walka: the in-game
   "Sync" button, the dashboard's "Addon sync / Sync now / synced", and
   `addon_sync.py` with `POST /api/addon/sync`. So are "share" (the
   picture), "session" (a walk, a game session, the Windows session),
   "profile" (weight and height) - and "account": in `road.py`,
   `journey.py` and DISCLAIMER.md that is the player's GAME account. So
   never "account" alone. On the dashboard: "Walka account", and "Send
   my walks to my Walka account". In the README: "your Walka account (on
   walka.dev)". No module, route or setting called plain `account`.
3. **Signing in:** through the person's own browser (the system's -
   never Walka's own window) with Discord, GitHub or Google, coming back
   to an address on 127.0.0.1 (PKCE). See 5.2. A code by e-mail does not
   exist on the live site. Next to the sign-in buttons, before the
   browser opens: "Signing in makes a Walka account if you have none",
   with links to walka.dev/terms/ and walka.dev/privacy/, and "Nothing
   is sent until you switch that on."
4. **The first step of an account** ("I am 18 or older, and I have read
   the terms and the privacy page") is taken on the website and nowhere
   else; the program does not tick for anybody. Do not find out by
   sending: straight after signing in, and again before the question of
   decision 5, ask `GET /rest/v1/profiles?select=adult_confirmed_at` (no
   row, or an empty value: not taken). Until it is taken, sending cannot
   be switched on, and the Walka-account view says, in the owner's
   words: this sign-in has no Walka account yet; to open one - or to
   delete this sign-in - go to walka.dev/account/ and sign in there the
   same way (with GitHub, say); if you already have an account, you made
   it another way: sign out here and sign in that way. One button opens
   <https://walka.dev/account/> in the system browser; one looks again.
   The program never opens the browser by itself - not on an answer from
   the network, not at a start - and it does not poll.
5. **Switching sending on** is an act of its own: signing in never does
   it. The switch belongs to ONE account (its user id) and is kept in
   the new file of decision 9 - not in `config.json`, so that neither
   `/api/config`, a copied config nor an update can switch it on. It is
   set by a POST route of its own that wants the choice spelled out in
   the body; an empty body switches nothing. EVERY switching-on passes
   one question, and there is no road past it. Whatever words the owner
   chooses, the question says at least:
   1. which account (decision 10);
   2. what goes - of each walk: when it started and ended, the day and
      how far the clock was from world time, how long the belt moved,
      distance, steps, calories (estimates), how each number was come by
      (for the calories: from speed or from heart rate - the word, not
      the heart rate), and whether a walking session was running in the
      game - and what stays: the samples, the heart rate, the top speed,
      the treadmill's name, the character, weight, height, age and sex;
   3. where: your Walka account, in the database the site's owner runs,
      with a link to walka.dev/privacy/;
   4. how many walks would go now, and the choice: all of them, or only
      walks from now on; and that from then on each walk goes when it is
      saved, without asking again;
   5. if the account's page is public (`GET
      /rest/v1/profiles?select=handle,is_public,show_days,show_walks`):
      "Your page on walka.dev is public. Walks you send count on it as
      soon as they are sent" - and, for "all of them", that the whole
      history shows there at once;
   6. "Every walk recorded on this computer goes to this account,
      whoever walked." (The terms say "Put in your own walks".)
   7. how to stop - the switch, or signing out - and that stopping
      deletes nothing in the account.

   "Only walks from now on" is remembered as that moment: a walk that
   started before it is never sent, at this start or a later one, unless
   the person chooses "all of them" in a later question. Sending goes
   back to off, and the question is asked afresh, whenever the person
   signs out, the sign-in ends, the account is gone, or the account now
   signed in is not the one it was switched on for. Walks made while
   sending was off are counted in the next question; they are never sent
   silently.
6. **Made-up walks.** Walks from "Simulated pad" are never counted or
   sent, and the feature does nothing at all while the treadmill in use
   is the simulated one - test `treadmill.kind == "simulated"`, as
   `web.py:197` does. That is `--demo`, `--simulate`, AND `"kind":
   "simulated"` under `"treadmill"` in config.json (`cli.py:69-70`),
   which needs neither switch. A walk whose file has no `treadmill` key,
   or an empty one, cannot be told from a made-up one: look in the
   repository's history since which version a walk carries the name, and
   tell the owner. Until the owner says otherwise such walks are counted
   apart in the question ("n older walks do not say which treadmill made
   them") and are not sent.
7. **When:** at the start of the program (compare the store with what
   was sent) and after each walk is saved. A walk saved while closing
   goes at the next start.
8. **Deleting, first version.** Deleting a walk on the dashboard does
   not delete it in the account. For a walk that was sent, the question
   before deleting says where the copy is: "It stays in your account,
   and on your public page if you have one, until you delete it there:
   walka.dev/account/walks/". A walk deleted in the account stays on the
   computer and is not sent again. Rows are made from the files at the
   moment of sending: a walk deleted on the dashboard before it went is
   never sent. Switching off and signing out take effect at once: a
   batch that waits for another try is dropped.
9. **Where things are kept.**
   - The refresh token: in the system's own store for secrets (Windows
     Credential Manager - a credential that stays on this computer, not
     one that roams; the Mac's Keychain - not synchronised), reached the
     house way, with ctypes and no new library, if that can be done
     well. Where there is no such store, or it fails, there is NO
     fallback to a file. Losing the stored sign-in only ever means
     "sign in again".
   - A new file in the data folder, written like a walk's file (temp
     file, then replace), with a version number of its own. Under the
     project's address and then the account's id (`user.id` - in this
     file only): how the person signed in; whether sending is on; what
     was chosen when it was switched on (all, or from which moment);
     and for each walk dealt with, under its id AND its `start` (the
     same id with another start is another walk): ADDED (the row's id,
     when) / THERE ALREADY (it did not come back; the id the row has, if
     asked for) / SET ASIDE (code, message, Walka's version). A walk
     that is not in the file is waiting. An entry stays when its walk is
     deleted on the computer. If the file is lost, sending is off;
     switched on again, everything is sent anew and answered "there
     already".
   - A stored sign-in belongs to the address it was made at: name the
     entry in the store, and the account's part of the file, after that
     address, and never send a key to any other address.
10. **Who is signed in.** The person must be able to tell WHICH account
    before a walk leaves, and "Signed in with Google" does not say that
    (two Google accounts; an account made with Discord on the website
    and a second, empty one made by pressing GitHub in Walka; somebody
    else's browser). The Walka-account view and the question of decision
    5 show the account's e-mail address as the sign-in answers it
    (`user.email`), with the way they signed in. It may stand in the new
    file, so that it can be shown at a start without asking the network;
    never in `config.json` or `walka.log`. It does reach the snapshot,
    which a program on the computer can read - as it reads the walks,
    weight and height there already (SECURITY.md does not count that).
    Put it to the owner: whole, or shortened ("a...n@gmail.com") - but
    never the way alone.
11. **When the sign-in ends** (a refresh is refused, or the account is
    gone): forget the keys, switch sending off, keep everything on the
    computer, and say once, asking for nothing: "Walka is no longer
    signed in to your Walka account, and has stopped sending. You signed
    out elsewhere, or the account was deleted. Your walks on this
    computer are untouched." Not "please sign in again": a person who
    has just deleted their account would make a new one by doing so.
12. **No build that can reach the live database exists in public before
    the website says what it does** - not as a pre-release, and not as a
    CI artifact either: CI builds Walka.exe and both Mac applications on
    every push to every branch and keeps them as downloads
    (`ci.yml:174`, `:288`, `:373`). The website's privacy page promises
    to change first whenever "what is kept, who sees it, a company that
    is added" changes, and its terms promise the same for the rules of
    accounts. So, until the last step (which is not yours):
    - the project's address and key are read at RUN time from the
      process's environment (`WALKA_ACCOUNT_URL`, `WALKA_ACCOUNT_KEY` -
      not `SUPABASE_URL` / `SUPABASE_KEY`, which other tools export),
      and are honoured only when Walka runs from source. A packed
      program (`sys._MEIPASS` is set; `addon_sync.py:358` tests it so)
      has no account feature at all, whatever the environment says;
    - the two live values stand nowhere in the repository: not in code,
      tests, documents, `ci.yml`, a repository variable or secret, a
      commit message or an issue;
    - an address is taken only if it begins `https://`, or is
      `http://127.0.0.1:<port>` (a database on this computer).

Still the owner's. Ask, with your recommendation, before you build the
part it touches. The owner does not read code: ask in plain words.

- The words on the dashboard and the new sentences of README.md and
  SECURITY.md (these files win over the site, so their words are the
  owner's).
- Whether DISCLAIMER.md gets a line about accounts (it would become
  "version 3").
- The sign-in key is kept in the password store of Windows or of the
  Mac. If that cannot be done well with what Walka already has: may one
  more ready-made library be packed into Walka (listed in
  THIRD-PARTY-NOTICES like the others)? If no - and on Linux, where such
  a store is not always there - should the sign-in last only until Walka
  is closed, or should there be no sending there at all? Never a file.
- A Mac may ask about the Keychain again after each update of Walka
  (Walka is signed ad hoc: `docs/HARDWARE.md:243-247`). Acceptable?
- People who run Walka from its source code with Python 3.10 (not the
  downloads, which bring their own Python): may that stop working?
- Walks are sent as each one ends. With a public page that shows days or
  walks, anyone who reloads that page can tell when the person was on
  the pad, though the page itself shows no time of day. Send at once and
  say so in the question (the recommendation), or hold walks back while
  the page is public?
- On a computer or pad that several people use, every walk goes to the
  one account that is signed in. Is the sentence in the question enough,
  or should Walka ask after each walk?
- The website has no "sign out everywhere" and no list of signed-in
  computers: a computer that is lost, sold or shared stays signed in
  until somebody signs out ON it, or the account is deleted. Should the
  website get one before the release? (That is the website maintainer's
  work, not yours: put it in your report.)

## 5. The account side, in short (the contract has the rest)

### 5.1 The project

Address: `https://avejvgygkujbzjwqbdug.supabase.co`. Publishable key:
`sb_publishable_ZBWVidwBsg0j4OFWbJO0EA_uuhv1JX_`. Both are public and
stand in the website's pages. They do NOT go into walka-addon yet:
decision 12.

Every request carries `apikey: <that key>` and, for a signed-in person,
`Authorization: Bearer <access token>`. Every request says `User-Agent:
Walka/<version>` and nothing about the computer.

`POST /rest/v1/rpc/schema_version` answers `1` today. Read it before the
first send of a run - not at a start: rule 3a - and do not send if it is
higher than the program knows.

`GET /auth/v1/settings` (the key only) says what the sign-in SERVICE has
switched on. Ask it only after the person has pressed "Sign in", or not
at all: the three ways are fixed. Never offer e-mail, whatever it says:
on the live project `email` reads true and no code reaches anybody.

### 5.2 Signing in ("Signing in from a program" in the contract)

1. Make a verifier with `secrets` (never `random`), 43 to 128
   characters. Keep it in memory only.
2. Listen on 127.0.0.1 - a listener of its own for this one sign-in, on
   a port the system gives (not `localhost` by name: the service refuses
   that; not the dashboard's own server: its GETs are not
   origin-checked). Its path is at least 32 characters of
   `secrets.token_urlsafe`.
3. Open the system browser (from Python, on a thread of its own: 6.3) at
   `<project>/auth/v1/authorize?provider=<discord|github|google>&redirect_to=http://127.0.0.1:<port>/<path>&code_challenge=<base64url(SHA-256(verifier)), no "=">&code_challenge_method=s256`
4. The browser comes back with `?code=...` (or `?error=access_denied`).
5. `POST <project>/auth/v1/token?grant_type=pkce`
   `{"auth_code": <code>, "code_verifier": <verifier>}` ->
   `access_token` (good for `expires_in` seconds: go by `expires_at` in
   the answer, not by "an hour"), `refresh_token`, `user`. Throw away
   `provider_token` and `provider_refresh_token` at once: they are the
   person's Discord, GitHub or Google keys. Of `user` keep the id, and
   what decision 10 shows; nothing else, anywhere.

The listener, exactly. The path is this sign-in's "state": the service
sends back `code` and nothing else that ties the answer to the question.
So only a GET on exactly that path counts, and only once; any other
request - another path, another method, a second time - gets 404,
changes nothing and does not use the listener up. One sign-in at a time:
starting another closes the first listener and drops its verifier. Of
the query read `code`, or that `error` is there; never show
`error_description`. Make the exchange of step 5 BEFORE answering the
browser (ten seconds at most), and answer what is true, with one of
three plain pages of Walka's own - no script, link or picture, with
`Cache-Control: no-store`, `Referrer-Policy: no-referrer` and
`Content-Security-Policy: default-src 'none'`: "Walka is signed in. You
can close this tab." / "Nothing was signed in. You can close this tab."
/ "Walka could not finish signing in. Go back to Walka and try again."
A code from anybody else's sign-in fails step 5 with 400
`bad_code_verifier`. The listener writes no access log, is gone after
the answer or a few minutes, and `App.stop()` closes it with the tasks.
Starting a sign-in, signing out, switching sending on or off and
answering the question are each a POST route of the dashboard's API
under the existing guard - none is a GET, and none a key of
`/api/config`.

**Is a return to 127.0.0.1 allowed on the live project?** The service
allows `http://127.0.0.1:<any port>/<any path>` whatever the project's
list of redirect addresses says. That was tried on the same version the
live project runs, not against the live project itself. PROVE IT FIRST,
unless the owner tells you it has been done. It needs no script and no
key: make a challenge (and throw the verifier away), put it into the
address of step 3 with a port nothing listens on, and ask the owner to
open that address in their own browser and sign in the way they do on
walka.dev. If the browser ends on a page it cannot open whose address
begins `http://127.0.0.1:<port>/...`, the return is allowed: that
failure IS the proof. If it ends on `https://walka.dev/account/`, it is
not allowed: stop and report - then the owner adds a redirect address in
Supabase, or another way is found. The owner tells you which of the two
it was, and does not send you the address: nothing is signed in by this,
and no key exists.

Apart from that one proof, nothing you write, run or commit touches the
live project: no test, no CI run, no trial send, no read of a table.

Refreshing: `POST /auth/v1/token?grant_type=refresh_token`. Every
refresh gives a NEW refresh token: write it to the store before using
the access token. An old refresh token used again later can end the
whole sign-in (`refresh_token_already_used`). Two Walkas can run on one
data folder, so "refresh in one place" is not enough: read the refresh
token from the store immediately before each refresh, write the new one
at once, and keep none in memory between refreshes.

Signing out never waits and never fails. Take the access token into a
variable; delete the keys from the store and from memory; switch sending
off; the dashboard says "signed out" at once. Then, as a courtesy with a
short time limit, `POST /auth/v1/logout?scope=local` with that variable
as the bearer - only if that token has not run out (with one that has,
the service answers 403 `bad_jwt`; do not refresh in order to sign out).
No network, or whatever the answer: nothing changes. An access token
works until it runs out whatever the service was told.

### 5.3 Sending walks

`POST <project>/rest/v1/walks?on_conflict=user_id,start_key`, with
`Prefer: resolution=ignore-duplicates,return=representation`; the body a
list of rows, at most 200, all with the same keys.

- 201 always. Rows that come back were added, with the ids sent. A row
  that does not come back is already in the account, or was deleted
  there: both mean "do not send again". The id you made for it names
  nothing; the row has the id it got first.
  `GET ...walks?start_key=in.(...)&select=id,start_key,deleted_at` tells
  which, and gives that id (`start_key` in the answer is how a row is
  matched to a walk).
- The row's `id` is a random UUID made by the program. New in the whole
  table: never worked out from the walk's name, never the same for two
  accounts.
- 401 with code `PGRST303`: the token ran out. Refresh, try once more.
- 400 `23514` "Walka is for adults.": the account has not taken its
  first step - or is gone. Stop; do not go row by row. `GET
  /auth/v1/user` tells (403 `user_not_found`: gone - then decision 11).
- 400 `23514` "There is room for 20000 rows...": the account is full.
  Stop and say so.
- An answer about ONE ROW - PostgREST's JSON with a `code` that begins
  22 or 23 and is not one of the two messages above (HTTP 400, or 409):
  the batch was refused whole. Send its rows one by one; set the refused
  one aside with the code, the message and Walka's version; show it; do
  not send it again with this version of Walka; never cut a walk down to
  fit. Two refusals are not for good: `23505` `walks_pkey` (make a new
  id and send once more) and "A walk cannot start in the days to come."
  (the computer's clock was ahead: try that walk again at a later
  start).
- Anything else - `PGRST102`, `PGRST204`, `428C9` (the program built the
  request wrongly), a 401 other than `PGRST303`, 403, 404, an answer
  that is not PostgREST's JSON (a gateway's own page): it says nothing
  about any walk. Stop this run, show one line, set NOTHING aside, try
  again at the next start.
- A refresh that answers `refresh_token_not_found` or
  `refresh_token_already_used`: decision 11.
- No answer, 5xx, 429: later, with growing pauses - unless sending was
  switched off meanwhile. A free project that was not used for a while
  answers late or not at all.

### 5.4 The whole of the program's traffic

This list, and a test against the fake fails on anything else. In the
browser: `GET /auth/v1/authorize`. From Python: `POST /auth/v1/token`
(pkce, refresh_token), `POST /auth/v1/logout?scope=local`, `GET
/auth/v1/user`, `POST /rest/v1/rpc/schema_version`, `GET
/rest/v1/profiles` (the columns of decisions 4 and 5), `GET
/rest/v1/walks` (5.3), `POST /rest/v1/walks` (5.3); `GET
/auth/v1/settings` only if you use it.

Never a PATCH or DELETE, never a write to `profiles`, `body`, `foods`,
`food_entries` or `food_settings`, never `rpc/delete_my_account`: the
database lets the program's key tick "I am 18", agree to health data and
make the page public, so only this list stands in the way. Every request
goes to the project's address and nowhere else; redirects are not
followed; a certificate that cannot be checked means no request and a
plain sentence - checking is never switched off, not for a proxy, not by
a setting.

## 6. The program, as it is (read it; these are the things that bite)

**6.1 One loop.** Everything runs on one asyncio loop (in window mode on
a second thread, `walka-companion`). The walk is recorded by a 0.2 s
tick on it, and a pause longer than 5 s is cut out of the walk
(`session.py:231-233`). Nothing slow may run there: no blocking HTTP, no
blocking call into a store for secrets, no reading of hundreds of files.
Two loops that are there show how. `JourneyBook.run`
(`journey.py:455-464`) does its slow work off the loop with
`asyncio.to_thread`; it wakes on a timer. `App._connect_loop`
(`app.py:529-561`) is woken by an event (`asyncio.wait_for(
self._connect_now.wait(), timeout=...)`). Both are tasks started in
`App.start()` and kept in `App._tasks`. The sender is a third such task:
woken like the second, working off the loop like the first.

**6.2 Closing.** `App.stop()` cancels all tasks FIRST and saves the walk
AFTER (`app.py:579-585`), and Walka holds back whoever is ending it for
at most 4 s (`SAVE_WAIT_S`, `cli.py:394`). A sender that takes its time
being cancelled can cost the person their walk. Every finished walk is
written in `App._save_unsaved` - the one saved at exit too, but by then
every task is cancelled, so an event set there wakes nobody. A walk
recovered after a crash is added inside `SessionStore.__init__`, before
`App` has started anything. So: compare the store with the record of
what was sent, at every start. Do not hook into `App.sync_addon()`: it
runs on the loop inside the code that saves the walk; from there only
set an event.

**6.3 The dashboard** is a page on 127.0.0.1, port 8787 or one of the
next nine, or what `--port` or config.json say. No password. A guard
checks the Host header and, for anything but GET, the Origin and that
the body is JSON (`web.py:86-104`). The house rule is "changing anything
needs a POST". The page's policy is `default-src 'self'` with
`form-action 'none'` (`web.py:46-52`) and a test pins it: the page
cannot talk to the account or show a provider's picture. ALL account
traffic is Python's. The page shows state and sends button presses to
its own API; a route answers at once and progress shows through the
snapshot (as `POST /api/treadmill/connect` does). Outside pages open in
the system browser: `webbrowser.open` from a thread of its own, never
the loop's (on Windows that can break Bluetooth: `cli.py:602-604`,
`bleak_backend.py:23-37`).

**6.4 `config.json` is not a place for anything private:** the whole
config goes to the page twice a second, is saved in clear text, comes
back from and can be set through `/api/config`, unknown keys are dropped
on save, and a rejected value is written to the log with its value
(`config.py:202`). The snapshot can be read by any program on the
computer: what the feature adds to it is a few ready-made words and
numbers, nothing that walks the store, nothing that waits.

**6.5 `walka.log`** is the file the README asks people to attach to
PUBLIC issues. Never log a key, a code, a return address with its query,
the e-mail address or the account's id. With `-v` aiohttp's own debug
lines are no longer held back (`cli.py:1120-1122`).

**6.6 A dependency is not one line:** pyproject.toml with a comment
saying why, both hashed lock files written again with uv, a licence the
build can pack, a line in THIRD-PARTY-NOTICES.md (there are two copies,
the root one and `Walka/THIRD-PARTY-NOTICES.md`, and they already
differ), the selfcheck list. CI installs from the lock files only.
aiohttp is there already (3.14.5 locked) and its client is used in tests
- but THE PROGRAM HAS NEVER MADE AN HTTPS REQUEST, from source or
packaged. HTTPS in the packaged programs is proved by CI, not by
anything in the program people run. `selfcheck` stays offline (tests
call it): add your new modules and `ssl` to `cli.RUNTIME_MODULES` so
that the packaged program at least imports them. Beside it add a hidden
command, run only by `ci.yml`'s build jobs, that makes one GET with the
same client the feature uses to `https://walka.dev/` (expects an answer)
and one to a server with a home-made certificate that the step starts on
127.0.0.1 (expects a refusal). The project's address and key go into no
workflow. If the Mac build finds no root certificates, stop and ask the
owner about a library for them (the same question as for the store of
secrets).

**6.7 A walk** is one file, `sessions/<id>.json`, in the data folder
(`%APPDATA%\Walka`, `~/Library/Application Support/Walka`). Written
once, never rewritten. The id is the LOCAL start time
("20261119-213000", "-2" added if taken) - not a UUID, and after a walk
is deleted (the file is simply gone, no trace) the id can be given out
again. `active-session.json` is the walk still going: never send it.
Made-up walks lie among the real ones (decision 6). The store has no
lock and is changed on the loop. `state.json` is written without a temp
file: not the place for the record of what was sent. Two Walkas can run
on one data folder: read the new file again before writing it. Two
copies sending the same walk is harmless: the second is answered "there
already".

**6.8 The row.** Map from the FILE's JSON, not from the record as Walka
loads it (loading fills missing keys with words of its own; the website
sends them empty). How to keep all the rules at once: on the loop, copy
from `store.records` only each walk's `id`, `start` and `treadmill`
(cheap). Then, in `asyncio.to_thread`, open `sessions/<id>.json` for the
walks to send and map THAT JSON. A file that is gone by then was
deleted: skip it. Not `record.to_json()`: that is the loaded record
again. `started_at` comes from `start`, never from the id. `steps` and
`utc_offset_min` are ints in the JSON (66, not 66.0). No NaN. A word the
database does not know becomes null before sending. Run `outside(row,
now)` from `walka_row.py` before sending and show what it says, but do
not write its verdict into the new file: one of its answers depends on
the day.

**6.9 Tests** are plain functions that call `asyncio.run`, with a fake
clock (never `time.time()`), a simulated treadmill and aiohttp's
TestServer. Some will bite on purpose: one calls EVERY POST and DELETE
route with junk and wants an answer below 500 (`test_web.py:322-367`) -
and what the route does really happens, on CI machines that have
internet; one asserts that no task is left running
(`test_cli.py:204-205`); some pin exact sets (the config's sections:
`test_config.py:32-34`, `test_web.py:460`; three `pip install` lines in
ci.yml: `test_release.py:124`; a licence text for every packed library:
`test_release.py:40-45`); `test_share_page.py` forbids `https://`
strings in four scripts. So the account part is something handed to
`App`, absent by default. Handed in, and faked in every ordinary test:
the accounts' address, the opener of the browser (in tests a function
that fetches the address itself and follows it to the listener - no test
opens a real browser) and the store for secrets (in tests one in
memory). No ordinary test touches the real Credential Manager or
Keychain: on a developer's computer it would overwrite their own
sign-in. ONE test per system does: it writes, reads and deletes a
made-up secret under a name of its own and is skipped elsewhere. Its run
on CI's Windows and Mac machines is the only time your store code runs
before a person's computer runs it; if it cannot pass on CI's Mac (a
password box nobody sees), say so in the report. Change a pinned set
knowingly; never work around it.

**6.10 Python 3.10** is still the stated floor: no `asyncio.timeout`,
`TaskGroup`, `tomllib`, `datetime.UTC` in the program; the source keeps
to `asyncio.wait_for`. (Before 3.11 `datetime.fromisoformat` is not
expected to read a time with five decimals, which the database sends:
not tried.)

**6.11 The house voice:** plain words, short sentences, British
spelling, " - " for a dash, no exclamation marks; comments say why.
Match it.

## 7. The words that change with it

"Nothing is uploaded" and its cousins are true today and false the day
this ships, unless they change in the same piece of work. No test pins
them, so nothing will remind you. In walka-addon, at least:

- `README.md:135-137` ("Stays on your computer. Nothing is uploaded."),
  `:396` ("Nothing leaves your computer." - meant of the screen),
  `:681-682` ("Nothing is uploaded and nothing is posted for you." -
  meant of the picture), the paragraph on what is in the data folder and
  in `walka.log` (add where the sign-in is kept and what the new file
  holds), "Is this allowed?" (with sending on, one thing read off the
  game goes with each walk: whether a walking session was running - not
  the character, its name, realm or road), the README's list of modules.
- Say plainly what the stored sign-in is: not a key for walks but the
  whole account - whoever has it can read the body numbers and the food
  diary, make the page public and delete the account. Say where it is
  kept, that signing out in Walka removes it, that deleting Walka.exe
  does not, and that "Sign out" on walka.dev does not sign this computer
  out. The Walka-account view says the last of these too.
- `SECURITY.md:34-38` counts "make Walka send anything anywhere" as a
  vulnerability. It has to say what is now meant: anything its user did
  not switch on, or anywhere but the account its user signed in to; or
  sign Walka in or out, or switch sending on; and the keys of a sign-in
  join the list of what must not be readable.
- `docs/SAFETY.md:59-61` lists what the dashboard's buttons do: add
  signing in and switching sending on and off; and its tests (`:65-70`)
  check that nothing the dashboard does reaches the treadmill - the new
  routes belong in those runs.
- The dashboard: the foot of the rail, on every view, "Runs on this
  computer. Nothing is uploaded." (`static/index.html:62`) should follow
  the real state - as it is while sending is off, and saying what goes
  where while it is on; the foot of Settings (`:488`); the Share view
  (`:351`: "The picture is made on this computer. Nothing is uploaded:
  you choose where to post it." - make it say that of the picture); the
  question before a walk is deleted (`history.js:152`, decision 8).
- THIRD-PARTY-NOTICES.md (both copies) if aiohttp gains a second job or
  a library is added; `docs/images/dashboard-*.png` if the words they
  show change.

NEVER to change: "Walka only listens to your treadmill" and everything
about the belt (keep "to your treadmill" attached to "only listens"
wherever sending is described nearby); "not a safety device or a medical
device"; the lines about Blizzard; that the addon cannot use the
network.

The WEBSITE says the same things in about thirty places, and you do not
edit it. Two of them quote Walka word for word and are false the day
Walka's own words change: its privacy page gives the dashboard's rail
foot "in its own words", and its home page gives the README's six
features "in its words". At the end, write for the website's maintainer:

- exactly what the program now does: what is sent, when, what is kept on
  the computer and where, how a person stops it, what signing out and
  deleting do on each side;
- every sentence of README.md and of the dashboard that you changed -
  the old words and the new, with file and line;
- for the privacy page: that the sign-in keeps a session for each
  computer where Walka is signed in (when it began, when it was last
  renewed, the IP address, the name `Walka/<version>`) and notes each
  renewal; that Walka's requests reach Supabase through Cloudflare as a
  browser's do; that Discord, GitHub or Google learn of each sign-in
  made from Walka; that signing in from Walka makes an account's sign-in
  record for a person who has none; where a signed-in Walka keeps its
  key and what the new file holds; that a public page shows each walk as
  soon as it is sent; that "Sign out" on the website does not sign Walka
  out;
- for the terms: that a computer where Walka is signed in stays so until
  somebody signs out there, and that Walka sends every walk recorded on
  that computer.

## 8. The order of work

1. Read (section 2). Then give the owner a PLAN before any code: the
   decisions of section 4 as you would carry them out, your questions,
   the files you will add and change, the tests, and the proof of 5.2.
   Wait for their yes. This is more than one sitting: from the first
   commit keep a file `ACCOUNT-WORK.md` at the top of your branch - the
   owner's answers in their own words with the date, what is built, what
   comes next. Whoever continues gets this brief and that file. It is
   removed before the branch is merged.
2. The proof of 5.2, with the owner.
3. Build it against a FAKE of the accounts (aiohttp's TestServer
   answering as `docs/calls-tried.md` records) and, if you have Docker,
   against the real thing on your own machine: in a checkout of
   walka-website, `npx supabase@3.2.0 start` and `db reset` give the
   whole database locally. There - and only there - a test signs in with
   a code from the local mailbox (`tests/stack.ts` shows how), and that
   is the ONLY way to sign in there: no other site is switched on on a
   local stack, so the browser sign-in of 5.2 cannot be run on it as it
   stands, and its Site URL is itself on 127.0.0.1, so a return to
   127.0.0.1 that works there says nothing about the live project. Do
   not change walka-website's `supabase/config.toml`: test the browser
   part against your fake. A local stack also does not check `apikey` at
   all; the live gateway does.
4. Tests, at least:
   - the row: the three records in the website's `tests/import.test.ts`
     (EVENING `:31`, MIDNIGHT `:34`, OLD `:37`). The whole row expected
     is written out there for EVENING only (`:130-146`); the website's
     reader and `walka_row.py` give for the other two:
     MIDNIGHT -> `{"origin":"walka","client_id":"20261114-235940","started_at":"2026-11-14T22:59:40.000Z","ended_at":"2026-11-14T23:00:29.200Z","local_day":"2026-11-14","utc_offset_min":60,"seconds":45,"distance_m":51.2,"steps":79,"kcal":3.1,"kcal_extra":1.9,"session":"manual","steps_source":"estimate","distance_source":"speed","calories_source":"speed"}`
     OLD -> `{"origin":"walka","client_id":"20250302-081500","started_at":"2025-03-02T07:15:00.000Z","ended_at":"2025-03-02T07:45:00.000Z","local_day":"2025-03-02","utc_offset_min":60,"seconds":1700,"distance_m":1500,"steps":2100,"kcal":101,"kcal_extra":null,"session":"manual","steps_source":"estimate","distance_source":"speed","calories_source":"speed"}`
     and awkward ones: across midnight, a start that rounds into the
     next second, a missing key, an unknown word, 66.0 steps;
   - every answer of 5.3; a token that runs out mid-send; a refresh that
     fails; no network;
   - closing the program in the middle of a send loses no walk and
     leaves no task;
   - never signed in, and signed in with sending off, and switched on
     with nothing to send: not one outbound connection over a long run;
   - sign out, sign in as another account: not one walk is sent until
     the question is answered again;
   - a walk deleted while its send waits is not sent; switching off
     during the pauses sends nothing more;
   - made-up walks are never sent, by any of the three ways to the
     simulated treadmill;
   - the traffic is the list of 5.4 and nothing else;
   - after a whole run against the fake, search every file under the
     data folder, the log, the snapshot and `/api/config` for every key
     that was in play: none is found.
5. The words of section 7, in the same change, with the owner's yes.
6. STOP THERE. Do not put the live address and key in, do not lift the
   from-source rule of decision 12, do not touch the three version
   files, do not tag, do not release, do not merge. Report (section 10).

   DONE means: `ruff check src tests` (in `companion/`) and `python -m
   pytest` (at the top) pass; CI is green on your branch in every job;
   the owner has said yes to the words; the report is written.

   What follows is not yours: the website's maintainer changes the
   privacy page and the terms - everything in your list for them, with
   their dates - before any build that can reach the live database
   exists in public. Then the owner tries the real thing once against
   the live project, from source, with the environment set on their own
   computer. Only then does a change of a few lines add the address and
   the key, lift the from-source rule, and go out as a release under a
   new version number (a tag `v0.8.0-rc1` already exists at another
   commit, and a published release is never replaced).

General. Start from the default branch named at the top and work on a
branch of your own; push it; do not merge it into the default branch,
and do not open a pull request or release unless the owner asks. (The
default branch's README is the page people download Walka from: its
sentences about sending must not stand there before the website has
changed.) CI runs on every pushed branch and is the only place where
your Windows and Mac code runs: look at it after every push. CI pins its
actions to exact versions - keep it so; `ci.yml` cannot tag a commit
that changes `ci.yml` itself (`ci.yml:481`).

## 9. What only the owner can do

- Say yes to the plan and to the words.
- Open one address in their own browser, for the proof of 5.2, and say
  where they landed.
- Decide the open points of section 4.
- Later: try it from source against the live project, release, and - if
  the proof of 5.2 fails - add a redirect address in Supabase.

## 10. Your report at the end

- What was built: files, and what each does.
- What was tried and how (tests, the local database, CI), and what was
  NOT tried - the Mac's Keychain after an update, HTTPS in the packaged
  builds unless CI ran that check green on Windows and both Macs,
  anything on a real Windows or Mac.
- Every place where the contract (`docs/data-model.md`) was wrong or
  silent.
- For the website's maintainer: the list at the end of section 7.
- What is left before a release - the version number among it.
