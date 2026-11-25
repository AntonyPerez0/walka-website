# The data model

What Walka's accounts keep, where, and how the website, the Walka desktop
program and an Android app can all work on the same data.

The database is a Supabase project (Postgres). Its tables are made by the
files in [`supabase/migrations/`](../supabase/migrations/), and those
files are the truth: this page explains them. `npm run test:database`
tries every promise on this page against a real database
([`tests/database.test.ts`](../tests/database.test.ts)).

## The five rules

1. **A row belongs to one person.** Only that person can read it, add it
   or change it. Row-level security says so on every table, and a visitor
   who is not signed in is granted nothing at all.
2. **One way out.** What other people may see of a profile that its owner
   made public comes from one function, `public_profile()`. It names every
   field it gives out: a name, and time and distance walked. Steps, the
   days walked and the single walks are each a switch of their own, off at
   first. Calories, weight, height, age and anything about food are never
   given out.
3. **Health data needs a yes.** Body numbers and the food diary are
   information about a person's health. They are kept only after the
   person has agreed to that (`profiles.body_food_consent_at`, stamped by
   the database), and when the person takes it back, all of it is deleted
   at once.
4. **Every row can be synced.** See [Syncing](#syncing).
5. **Yours to take and to delete.** The website reads a person's own rows
   and saves them as one file. `delete_my_account()` deletes the account
   and every row, and the sign-in record with it. (What Supabase logs
   about requests is not ours to delete, and runs out by itself.)

## The tables

| Table | One row is | Who sees it |
|---|---|---|
| `profiles` | an account: the name in the address, the name shown, whether the page is public and what it shows, miles or kilometres, when "I am 18" was ticked, when body and food data were agreed to | its owner; the public parts, through `public_profile()`, if the owner made the page public |
| `body` | weight, height, year of birth, sex - what the estimates are made from | its owner |
| `walks` | one walk | its owner; totals (and more, switch by switch) through `public_profile()` |
| `foods` | a food the person picked or made, kept to be picked again | its owner |
| `food_entries` | one thing eaten on one day | its owner |
| `food_settings` | the person's own goal for a day | its owner |
| `reports` | "this public page pretends to be somebody" - a report by a signed-in person | the reporter; the site's owner in the dashboard |
| `profile_holds` | a public page the site's owner has taken down, and why | the page's owner |
| `retired_handles` | a name that somebody had, kept free for 90 days | nobody |

Sign-in itself (the e-mail address, the sessions) is kept by Supabase's
own `auth` tables, not by ours. Nobody signs in with a password: through
another site (Discord, Google, GitHub) - or, where the project has a
mail service, which the live one has not, a six-digit code by e-mail. The
sign-in service would take a password all the same, from anybody, for any
address - so a rule in the database sees to it that none is ever kept.

### What a public page shows

| Switch | A reader sees |
|---|---|
| `is_public` | the name, and in all: how many walks, how long, how far |
| `show_days` | the last twelve weeks day by day (which days, how long, how far), and since when |
| `show_steps` | steps - which, with time and distance, give away roughly how tall a person is, because Walka estimates steps from height |
| `show_walks` | the last 20 walks, one by one: the day, the time walked, the distance |

A page that goes private comes back bare: the other switches go off with
it. "Public" means that anyone who knows or guesses the name can see the
page; it is not a secret link. The site's owner can take a page down
(`hide_profile()`, from the dashboard) without opening the account.

### `walks`

The fields are the ones Walka's desktop program records for a walk
(`SessionRecord` in `companion/src/walka/session.py`): when, how long the
belt moved, distance, steps, calories (and how many of them on top of
sitting at the desk), whether a walking session was running in the game,
and how each number was come by (measured by the treadmill, or estimated
- and for the calories, whether from speed or from heart rate: the word
is kept, the heart rate is not).
Added: `local_day`, the calendar date at the START of the walk in the time
zone the device was in then - only the walker's device knows that, so it
says it, once.

Left on the person's computer, because nothing here needs them: the
second-by-second samples, the heart rate, the top speed, the treadmill's
name and the character.

**One walk is one start second in one account** (`start_key`, unique for a
person). Sent by the desktop program, read from its file on the website,
read from a TCX export of it: it is counted once. Two different walks that
start in the same second are, to this database, the same walk.

### Food

An entry in the diary carries its own name and calories. It stays what it
was when the food it was made from is changed or deleted later.

A food comes from one of three places, and says which:

* `off` - [Open Food Facts](https://world.openfoodfacts.org) (the id is
  the barcode). Its database is under the Open Database License; the site
  says so wherever a result from it is shown.
* `usda` - [USDA FoodData Central](https://fdc.nal.usda.gov) (the id is
  its FDC id). Public domain.
* `own` - typed in by the person.

Only what a person picked is kept, in that person's own rows, and only its
name and calories. There is no shared table of foods.

The goal (`food_settings.goal_balance_kcal`) is calories eaten minus
calories burned, for a day. `0` means "about as much as I burn". The
database does not take a goal further than 500 either way, and none below
zero for a body that is underweight by its own numbers (a body mass index
under 18.5): this is a walking log, not a diet.

## Syncing

Three kinds of program write to these tables: the website, the Walka
desktop program (since version 0.8.0, 25 November 2026: walks only, one
way, once the person has switched sending on) and, later, an Android app.
They sign in to the same account and follow the same habits.

Everything in this part was tried on 21 November 2026 with plain HTTP
requests against a real copy of the database (PostgREST 16.5, and the
sign-in service GoTrue 2.198.0 - the version the live project ran that
day). Where a thing could not be tried, it says so. The requests and their
answers, one by one, are in [calls-tried.md](calls-tried.md).

**Every request carries two headers:** `apikey: <the publishable key>`
and `Authorization: Bearer <the person's access token>`. Without the
second the request is a visitor's, and a visitor is refused (401, code
`42501`). An access token that has run out answers 401 with code
`PGRST303`, "JWT expired": refresh, and try once more. (A Supabase stack
on your own computer does not look at `apikey` at all. The hosted one
answers 401 without it. Test against both.)

**Before anything is kept, the person takes the first step on the
website:** "I am 18 or older, and I have read the terms and the privacy
page". Until then - and for an account that has been deleted - a walk
that is sent answers 400 with code `23514` and the message "Walka is for
adults." The database would let a program take that step; a program does
not. It sends the person to their account page.

1. **The program makes up the row's id** (a UUID) when it creates the row,
   before it has talked to the database. The first id a row gets is its
   id for good. The id has to be new in the whole table, not only in the
   account: an id that any walk has answers 409 with `23505`
   (`walks_pkey`) and the batch is refused. So a random one - never one
   worked out from the walk's own name, and never the same one for two
   accounts.
2. **New rows are added so that sending them twice changes nothing.**
   Walks: `POST /rest/v1/walks?on_conflict=user_id,start_key` with
   `Prefer: resolution=ignore-duplicates,return=representation` and a list
   of rows. The answer is 201 either way. The rows that come back were
   added (in the order sent, with the ids sent); an empty list means none
   was. A walk that does not come back is already in the account - or
   was deleted there. To learn which, and the id it has:
   `GET /rest/v1/walks?start_key=eq.<the start cut to the second, in UTC, no zone: 2026-11-19T20:30:00>&select=id,deleted_at`
   (several at once: `start_key=in.(a,b,c)`). Asking with
   `started_at=eq.` misses a start that has a fraction of a second.
   * Every object of a batch has the same keys, with `null` where there
     is nothing; otherwise `PGRST102`.
   * Never send `start_key` (`428C9`), nor a key the table does not have
     (`PGRST204`): name the columns you send.
   * `steps` is a whole number in the JSON itself: `66`, not `66.0`
     (`22P02`). Times are text with a zone, not seconds since 1970
     (`22008`, or `22007` when the number has a fraction); a time
     without a zone is read as UTC.
   * Not `resolution=merge-duplicates` for walks: it writes the account's
     row over with this device's copy. Not `return=minimal`: added and
     already-there then look the same.
   * Foods from a source: `on_conflict=user_id,source,source_id` with
     `resolution=merge-duplicates` - and if the id that comes back is not
     the one the program made, the program uses the one that came back.
3. **`updated_at` is the database's clock.** A trigger sets it on every
   insert and update, whatever the program sent. To fetch what is new, a
   program asks in pages, ordered by `updated_at` and then `id`:
   `?order=updated_at.asc,id.asc&limit=1000&or=(updated_at.gt.<u>,and(updated_at.eq.<u>,id.gt.<id>))`,
   where `<u>` and `<id>` come from the last row of the page before, until
   a page has fewer than 1,000 rows. A request never gets more than 1,000
   rows, whatever `limit` says, and says nothing when it cuts.
   * `<u>` goes into the address with its `+` written `%2B` (build the
     address with a function that encodes; or write `Z` for `+00:00`). As
     it comes, the `+` is read as a space and the answer is 400, `22007`.
   * The database writes a time with none to six decimals
     (`2026-11-21T06:27:37.38637+00:00`): keep the text to send it back,
     and read it as a time to compare it. Texts do not sort in time order.
   * Start the next sync two minutes before the last `<u>`: two writes of
     the same moment may become visible in the other order. Rows the
     program already has come again and are written over.
4. **Changes say which version they change.**
   `PATCH /rest/v1/walks?id=eq.<id>&updated_at=eq.<the updated_at last seen>`
   with `Prefer: return=representation`, sending only the fields that
   changed. An answer 200 with the row means changed; 200 with an empty
   list means another device changed the row first: fetch, then decide.
   (Without that header both answer 204 and cannot be told apart.) So
   the last program to send wins field by field, not row by row.
5. **Deleting is marking.** The same `PATCH` with `deleted_at`. The
   database empties the row and keeps it as a marker, so that the other
   devices hear of it; and a deleted walk or diary entry stays deleted -
   an old copy sent by a device that never heard does not bring it back
   (it is answered like a walk that is already there). `deleted_at` keeps
   the time the program sent, not the database's. A marker still counts
   toward the account's 20,000 walks. (A food may come back: it is simply
   picked again.) There is no `DELETE` on walks, foods and diary entries
   (403). Deleting the account removes everything for good.
6. **A batch is all or nothing.** A batch is refused with 400 (codes
   `23514`, `23502`, `22P02`, `22003`, `22007`, `22008`, `PGRST102`,
   `PGRST204`, `428C9`) or 409 (`23505`), and then none of its rows was
   added. Two answers with `23514` are about the account and not about a
   row, and only the message tells: "Walka is for adults." (the first step
   is not taken, or the account is gone) and "There is room for 20000
   rows of this kind in one account, and it is full." For those, stop.
   For any other, send the rows one by one, set aside the one that is
   refused, and show it to the person. Do not retry it for ever, and do
   not cut a walk down to make it fit.

### From Walka's own record of a walk

One finished walk is one file, `sessions/<id>.json`, in Walka's folder.
The website reads such a file in the browser
([`src/lib/account/import.ts`](../src/lib/account/import.ts), tried in
[`tests/import.test.ts`](../tests/import.test.ts)); a program that sends
walks makes the same row from it, field by field, so that a walk is the
same row whichever road it took. The same reader in Python, checked
against the website's on 564 records: [walka_row.py](walka_row.py).

| In the file | `walks` |
|---|---|
| `id` ("20261119-213000", or with "-2" at the end) | `client_id`; `origin` is `walka` |
| `start`, `end` (seconds since 1970, to a tenth) | `started_at`, `ended_at`: text in UTC, to the millisecond. From `start` itself, never from the id: the id drops the tenths, `start` rounds them, and about one walk in twenty would land in the second before - and be counted twice |
| the first eight characters of `id` | `local_day` (the day where the walk was; not worked out again later) |
| the id, read as a time, minus `start` | `utc_offset_min`: how many minutes that clock was ahead of UTC - a whole number, kept only if the two agree to within a second and a half, otherwise empty |
| `seconds`, `distance_m`, `kcal` | the same, to one decimal |
| `steps` | the same; a whole number, or the record is not one of Walka's |
| `kcal_extra` (missing in older records) | the same, to one decimal; 0 with calories above 0 becomes empty: not known |
| `source` ("wow", "manual", "free") | `session` |
| `steps_source`, `distance_source`, `calories_source` | the same. `calories_source` may say `heart_rate`: the word, not the heart rate |
| a word in those four that the database does not know, or a key that is missing | empty. Made empty BEFORE sending: the database refuses a word it does not know |
| `samples`, `avg_hr`, `max_hr`, `max_kmh`, `treadmill`, `beacon_session` | not sent |

Read the file itself. Walka, loading an older file, fills a missing
`source` or `*_source` with a word of its own; the website sends those
empty.

`device` - "which installation sent it: a random id each one makes once,
for information only" - is a column the website leaves empty. A program
may fill it; Walka 0.8.0 leaves it empty too. Every request Walka makes
says `User-Agent: Walka/<version>` and nothing else about the computer.

A record the database will never take is set aside and shown, not
retried and not cut to fit: longer than two days from start to end, more
than 86,400 seconds on the belt, belt time more than a minute longer
than the walk lasted, an end before the start, a start before 2000 or
more than two days ahead of now, a number outside its range. Walka's own
recorder can make some of these (a game session left on for days, a
clock that was set back or is wrong).

Two things Walka's folder holds that are not walks to send: the walk
that is still going (`active-session.json`), and walks made with the
simulated treadmill (`--demo`, `--simulate`), which are saved among the
real ones and told apart only by `treadmill` being "Simulated pad" - a
field that is not sent.

### Signing in from a program

On the live site a person signs in through another site (Discord,
GitHub, Google) and in no other way, so a program does the same: it
opens the person's own browser - the system's, not a window of its own -
and waits for the answer on an address of this computer.

1. The program makes a random secret (the "verifier", 43 to 128
   characters), keeps it in memory, and opens the browser at
   `GET /auth/v1/authorize?provider=<discord|github|google>&redirect_to=http://127.0.0.1:<port>/<path>&code_challenge=<base64url(SHA-256(verifier)), no "=">&code_challenge_method=s256`.
   `<port>` is one the program listens on, on 127.0.0.1 only.
2. The person says yes at the other site. The browser comes back to
   `http://127.0.0.1:<port>/<path>?code=<one-time code>` - or
   `?error=access_denied&error_description=...` if they said no.
3. The program sends
   `POST /auth/v1/token?grant_type=pkce` with `{"auth_code": <code>, "code_verifier": <verifier>}`
   and the `apikey` header. The answer holds `access_token`,
   `expires_in` (3,600), `expires_at`, `refresh_token` and `user`. It
   also holds `provider_token` and `provider_refresh_token` - the other
   site's own keys. The program has no use for them and does not keep
   them.

What decides whether an address may be come back to: the sign-in service
allows any address written as a number on this computer
(`http://127.0.0.1:<any port>/<any path>`, also `[::1]`) whatever the
project's list of Redirect URLs holds, and does not allow the name
`localhost` unless the list names it. Tried on GoTrue 2.198.0 with the
live project's Site URL and an empty list; the live project ran the same
version on 21 November 2026. **Not tried: a whole sign-in against the
live project.** Do that first, with a script of twenty lines, before
anything is built on it. An address that is not allowed gives no error:
the browser simply lands on the website's account page with the code.
Without `code_challenge` the keys come after a `#`, which a program
never receives.

Keeping the sign-in:

* The refresh token goes into the system's own store for secrets, never
  into a settings file, a log, or anything a page can read.
* **Refresh only when a request is about to be made and the access token
  has run out** (or the database answers 401 `PGRST303`), with
  `POST /auth/v1/token?grant_type=refresh_token {"refresh_token": ...}`.
  There is no timer: Walka renews nothing while it has nothing to send.
  Every refresh gives a NEW refresh token; write it down before using
  the access token. An old one used again later answers 400
  `refresh_token_already_used` and can end the whole sign-in. "Refresh
  in one place" is not enough: two copies of Walka can run on one data
  folder. So Walka reads the refresh token from the store immediately
  before each refresh, writes the new one at once, and keeps none in
  memory between refreshes.
* The sign-in is over when a refresh answers 400 with
  `refresh_token_not_found` or `refresh_token_already_used`: forget the
  keys, stop sending, keep the walks on the computer. Do NOT ask the
  person to sign in again - a person who has just deleted their account
  would make a new one by doing so. Walka says, once: "Walka is no
  longer signed in to your Walka account, and has stopped sending. You
  signed out elsewhere, or the Walka account was deleted. Your walks on
  this computer are untouched." `GET /auth/v1/user` could say why - 403
  `session_not_found` (signed out) or 403 `user_not_found` (the account
  is deleted), or still 200 when the keys were used twice and the
  account is there - but Walka does not ask it after a refused refresh.
  It asks it only when a push of walks answers `23514` "Walka is for
  adults.", which a deleted account answers too, the same as an account
  that has not taken the first step.
* **Signing out is forgetting first.** The program throws away the keys
  it holds, in memory and in the store, and then tells the service:
  `POST /auth/v1/logout?scope=local` (204). An access token goes on
  working until it runs out, up to an hour, whatever the service was
  told - so a program that keeps one can go on sending. "Sign out" on
  the website signs out that browser only, not a program.

A code by e-mail (`POST /auth/v1/otp`, then `POST /auth/v1/verify`) is
how the tests of this repository sign in, on a stack of their own. It
works for people only where the project has a mail service, and the live
project has none: `/otp` answers there, but no mail a person could get
is sent.

Sending from the desktop program is a switch the person turns on, in
Walka, after one question; signing in alone sends nothing. It exists
since Walka 0.8.0. What the website says of it is on the privacy page,
"Sending your walks to your Walka account". The brief it was built from
- what was decided, and the order in which Walka's words and the
website's had to change - is
[brief-walka-sends-walks.md](brief-walka-sends-walks.md).

## Changing the tables later

Once another program reads these tables, some things are fixed. Only add:
new columns that may be empty or have a default, new values in a list.
Never rename or remove a column, and never change what a number means or
its unit - add a new column instead. Fixed from the first program that
syncs: the column names and units (`distance_m` in metres, `seconds`,
`kcal`), `kcal_extra` empty = not known, what `local_day` means, the
values of `origin`, the id made by the program, `deleted_at` as the
marker. Programs name the columns they read and send, treat a value they
do not know in `origin`, `session` or the `*_source` fields as "other",
and read `schema_version()` before they write: it goes up only when
something changes that an older program must know of. Walka reads it
once in a run, just before the first walk of that run is sent - not at
a start, and not at all while it has nothing to send - and sends
nothing while it is higher than 1. Raising it stops every Walka in use
from sending.

Every table added later is closed until its migration opens it: it needs
`enable row level security`, a policy and a grant of its own; every new
function an explicit grant.

## Limits

One account holds at most 20,000 walks, 5,000 foods and 20,000 diary
entries, and 20 reports - walks and entries that were deleted still
count, as markers. Every number has a range it must be in (a walk is not
longer than two days from start to end, with at most a day of them on the
belt, and not from the days to come, a food has not
more than 1,000 kcal in 100 g, a weight is between 30 and 250 kg - the
same limits as in Walka's own settings). What a person can store within
them is small, but not nothing: the free plan's 500 MB and its monthly
traffic are watched in Supabase's dashboard, and nothing in this
repository enforces them.

Walka is for adults. An account holds nothing until "I am 18 or older"
is ticked - the database notes when, and it is not taken back. A year of
birth is taken only if it makes the person 18 before this year began.

## What is not kept

No password. No location, no contacts, no pictures, no payment details,
no advertising identifiers. Of a walk: no samples, no heart rate, no
treadmill, no character. Of a food: its name and calories. Nothing that
is not on this page.

## The numbers on the food page

They are estimates, and the page says so
([`src/lib/account/estimates.ts`](../src/lib/account/estimates.ts), tried
line by line in [`tests/estimates.test.ts`](../tests/estimates.test.ts)).

* **Walked:** for each walk, the calories on top of sitting (`kcal_extra`)
  if the walk has that number; otherwise its calories minus what sitting
  for the same time would have cost.
* **At rest:** what a body burns in a day without the walks - the
  Mifflin-St Jeor estimate of the resting rate from weight, height, age
  and sex, times 1.2 for a day mostly spent sitting. Without an age or a
  sex it is 24 kcal for each kilogram of weight, and the page says that
  this is rough.
* **Left to walk off:** calories eaten, minus those two, minus the
  person's goal. Never less than zero, and never shown as a debt. A goal
  is never applied so far that it would ask for less than about 1,200
  kcal a day (1,500 where the estimate was made for a man). As time, it
  is shown at the person's own pace, and not past two hours: more than
  that is "more than a walk covers", and nothing carries over to the
  next day.
