# The data model

What Walka's accounts keep, where, and how the website, the Walka desktop
program and an Android app can all work on the same data.

The database is a Supabase project (Postgres). Its tables are made by the
files in [`supabase/migrations/`](../supabase/migrations/), and those
files are the truth: this page explains them.

## The four rules

1. **A row belongs to one person.** Only that person can read it, add it,
   change it or delete it. Row-level security says so on every table, and
   a visitor who is not signed in is granted nothing at all.
2. **One way out.** What other people may see of a profile that its owner
   made public comes from one function, `public_profile()`. It names every
   field it gives out. It gives out a name and walking totals - never
   weight, height, age, heart rate, the treadmill's name, a character's
   name, or anything about food.
3. **Every row can be synced.** See [Syncing](#syncing).
4. **Yours to take and to delete.** The website reads a person's own rows
   and saves them as one file. `delete_my_account()` deletes the account
   and, with it, every row.

## The tables

| Table | One row is | Who sees it |
|---|---|---|
| `profiles` | an account: the name in the address, the name shown, whether the page is public and what it shows, miles or kilometres | its owner; the public parts, through `public_profile()`, if the owner made the profile public |
| `body` | weight, height, year of birth, sex - what the estimates are made from | its owner |
| `walks` | one walk | its owner; totals (and single walks, if the owner switched that on) through `public_profile()` |
| `foods` | a food the person picked or made, kept to be picked again | its owner |
| `food_entries` | one thing eaten on one day | its owner |
| `food_settings` | the person's own goal for a day | its owner |

Sign-in itself (the e-mail address, the sessions) is kept by Supabase's
own `auth` tables, not by ours.

### `walks`

The fields are the ones Walka's desktop program records for a walk
(`SessionRecord` in `companion/src/walka/session.py`): when, how long the
belt moved, distance, steps, calories (and how many of them on top of
sitting at the desk), top speed, average and highest heart rate, whether a
walking session was running in the game, how each number was come by
(measured by the treadmill, or estimated), and the treadmill's name. Two
things are added:

* `local_day` - the day the walk counts for. Only the walker's own device
  knows what day it was there, so the device says it.
* `character_name` - the character the walk was counted for. Its name
  only, never its realm, as in Walka itself.

The second-by-second samples (speed and heart rate) stay on the computer.
They are large, and nothing here needs them.

### Food

An entry in the diary carries its own name and numbers. It stays what it
was when the food it was made from is changed or deleted later.

A food comes from one of three places, and says which:

* `off` - [Open Food Facts](https://world.openfoodfacts.org) (the id is
  the barcode). Its database is under the Open Database License; the site
  says so wherever a result from it is shown.
* `usda` - [USDA FoodData Central](https://fdc.nal.usda.gov) (the id is
  its FDC id). Public domain.
* `own` - typed in by the person.

Only what a person picked is kept, in that person's own rows. There is no
shared table of foods.

The goal (`food_settings.goal_balance_kcal`) is calories eaten minus
calories burned, for a day. `0` means "about as much as I burn". The
database does not take a goal further than 500 either way: this is a
walking log, not a diet.

## Syncing

Three kinds of program write to these tables: the website, and later the
Walka desktop program and an Android app. They sign in to the same
account and follow the same four habits.

1. **The program makes up the row's id** (a UUID) when it creates the row,
   before it has talked to the database. Sending the same row twice then
   changes nothing. A walk also carries where it comes from (`origin`) and
   what that program calls it (`client_id`): the pair is unique for a
   person, so the desktop program can send its whole history again and
   again and no walk is counted twice.

   | `origin` | Added by | `client_id` |
   |---|---|---|
   | `walka` | the desktop program | its own id of the walk, e.g. `20261119-213000` |
   | `android` | the Android app | its own id |
   | `web` | typed in on the website | made up by the website |
   | `file` | read on the website from a file of Walka's, or a TCX file | the walk's id in the file, or its start time |

2. **`updated_at` is the database's clock.** A trigger sets it on every
   insert and update, whatever the program sent. To fetch what is new, a
   program asks for its rows with `updated_at` later than the latest one
   it has seen - minus a few minutes, because two writes that happen at
   the same moment may become visible in the other order. Rows it already
   has come again and are simply written over.
3. **Deleting is marking.** A program sets `deleted_at` and leaves the row
   in place, so that the other devices hear of it. The website does the
   same, and hides such rows. (Deleting the account removes everything
   for good.)
4. **The last write wins,** row by row. Walks and diary entries are small
   and are rarely changed in two places at once; nothing more clever is
   needed.

A program signs in the way the website does: Supabase's sign-in, with the
project's public key. A desktop or phone program can use the six-digit
code that is sent by e-mail, typed into the program, so it needs no
browser and no password of its own.

## Limits

One account holds at most 20,000 walks, 5,000 foods and 60,000 diary
entries. Every number has a range it must be in (a walk is not longer than
a day, a food has not more than 1,000 kcal in 100 g, a weight is between
30 and 250 kg - the same limits as in Walka's own settings). The limits
are there so that a mistake, or mischief, cannot fill the database.

Walka is for adults: a year of birth that makes a person younger than 18
is not taken.

## What is not kept

No location, no contacts, no pictures, no payment details, no advertising
identifiers. No second-by-second samples of a walk. Of a character, its
name only. Nothing that is not on this page.

## The numbers on the food page

They are estimates, and the page says so.

* **Walked:** for each walk, the calories on top of sitting (`kcal_extra`)
  if the walk has that number; otherwise its calories minus what sitting
  for the same time would have cost.
* **At rest:** what a body burns in a day without the walks - the
  Mifflin-St Jeor estimate of the resting rate from weight, height, age
  and sex, times 1.2 for a day mostly spent sitting. Without an age or a
  sex it is 24 kcal for each kilogram of weight, and the page says that
  this is rough.
* **Left to walk off:** calories eaten, minus those two, minus the
  person's goal. Never less than zero, and never shown as a debt.
