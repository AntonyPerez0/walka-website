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
own `auth` tables, not by ours. Nobody signs in with a password: a
six-digit code by e-mail, or another site (Discord, Google, GitHub). The
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
and how each number was come by (measured by the treadmill, or estimated).
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

Three kinds of program write to these tables: the website, and later the
Walka desktop program and an Android app. They sign in to the same
account and follow the same habits.

1. **The program makes up the row's id** (a UUID) when it creates the row,
   before it has talked to the database. The first id a row gets is its
   id for good.
2. **New rows are added so that sending them twice changes nothing.**
   Walks: `POST /rest/v1/walks?on_conflict=user_id,start_key` with
   `Prefer: resolution=ignore-duplicates,return=representation`, in
   batches where every object has the same keys. The rows that come back
   were added. A walk that does not come back is already there: fetch it
   (by its start) and use the id it has. Foods from a source:
   `on_conflict=user_id,source,source_id` with
   `resolution=merge-duplicates` - and if the id that comes back is not
   the one the program made, the program uses the one that came back.
   Never send `start_key` itself: name the columns you send.
3. **`updated_at` is the database's clock.** A trigger sets it on every
   insert and update, whatever the program sent. To fetch what is new, a
   program asks in pages of at most 1,000 rows, ordered by `updated_at`
   and then `id`:
   `?order=updated_at.asc,id.asc&limit=1000&or=(updated_at.gt.<u>,and(updated_at.eq.<u>,id.gt.<id>))`,
   where `<u>` and `<id>` come from the last row of the page before, until
   a page has fewer than 1,000 rows. It keeps `<u>` as the exact text the
   database sent (six decimals) and starts the next sync two minutes
   before it: two writes of the same moment may become visible in the
   other order. Rows it already has come again and are written over.
4. **Changes say which version they change.**
   `PATCH /rest/v1/walks?id=eq.<id>&updated_at=eq.<the updated_at last seen>`,
   sending only the fields that changed. An empty answer means another
   device changed the row first: fetch, then decide. So the last program
   to send wins field by field, not row by row.
5. **Deleting is marking.** The same `PATCH` with `deleted_at`. The
   database empties the row and keeps it as a marker, so that the other
   devices hear of it; and a deleted walk or diary entry stays deleted -
   an old copy sent by a device that never heard does not bring it back.
   (A food may come back: it is simply picked again.) There is no
   `DELETE` on walks, foods and diary entries. Deleting the account
   removes everything for good.
6. **A batch is all or nothing.** If one is refused (an answer 400 with
   code `23514` or `22P02`), send its rows one by one, set aside the one
   that is refused, and show it to the person. Do not retry it for ever.

### From Walka's own record of a walk

| `SessionRecord` | `walks` |
|---|---|
| `id` ("20261119-213000") | `client_id`; `origin` is `walka` |
| `start`, `end` (seconds since 1970) | `started_at`, `ended_at`, as text in UTC |
| the first eight characters of `id` | `local_day` (the day where the walk was; not worked out again later) |
| `seconds`, `distance_m`, `steps`, `kcal` | the same |
| `kcal_extra` (0 in older records) | the same; 0 with calories above 0 becomes empty: not known |
| `source` ("wow", "manual", "free") | `session` |
| `steps_source`, `distance_source`, `calories_source` | the same |
| `samples`, `avg_hr`, `max_hr`, `max_kmh`, `treadmill`, `beacon_session` | not sent |

A record the database refuses (longer than two days, more than 86,400
seconds) is set aside and shown, not retried.

### Signing in from a program

The desktop program signs in the way the website does, without a browser:
`POST /auth/v1/otp {email, create_user: false}`, then
`POST /auth/v1/verify {type: 'email', email, token: <the six digits>}`.
It keeps the refresh token in the system's keyring, not in its settings
file; refreshes in one place only, shortly before the hour is up; signs
out with `scope=local`. An answer `23503` to a push, or
`refresh_token_not_found`, means the account is gone or signed out
everywhere: stop syncing and keep the walks on the computer.

Syncing from the desktop program will be a switch the person turns on.
Until it exists, Walka uploads nothing, and the site says so.

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
and read `schema_version()` when they start: it goes up only when
something changes that an older program must know of.

Every table added later is closed until its migration opens it: it needs
`enable row level security`, a policy and a grant of its own; every new
function an explicit grant.

## Limits

One account holds at most 20,000 walks, 5,000 foods and 20,000 diary
entries, and 20 reports. Every number has a range it must be in (a walk
is not longer than a day and not from the days to come, a food has not
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
