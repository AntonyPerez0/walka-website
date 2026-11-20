-- Walka accounts: what is kept for a person who signs in.
--
-- The rules of this database, in plain words:
--
--  1. A row belongs to one person. Only that person can read it, add it or
--     change it. Row-level security on every table says so, and nothing is
--     granted to visitors who are not signed in.
--  2. What other people may see of a profile that its owner made public
--     goes out through ONE function, public_profile(), and nowhere else.
--     It gives out a name, and time and distance walked. Steps, the days
--     walked and the single walks are each a switch of their own, off at
--     first. Calories, weight, height, age and anything about food are
--     never given out.
--  3. Body numbers and the food diary are information about a person's
--     health. They are kept only after the person has said so, and when
--     the person takes that back, they are deleted at once.
--  4. Every row can be synced. A program on another device (the Walka
--     desktop program, an Android app) makes up the row's id itself;
--     "updated_at" is set by the database, never by the program; a deleted
--     row is emptied and kept as a marker ("deleted_at"), so that the
--     other devices hear of it.
--  5. A person can take everything out (the site reads their own rows and
--     saves them as a file) and delete everything (delete_my_account()).
--
-- docs/data-model.md says the same at length, with the reasons.

-- ---------------------------------------------------------------------------
-- Nothing is open by default
-- ---------------------------------------------------------------------------
-- A table or a function added later is closed until a migration opens it:
-- it needs "enable row level security", a policy and a grant of its own.

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Helpers (for triggers only)
-- ---------------------------------------------------------------------------

-- "updated_at" and "created_at" are the database's own clock, whatever the
-- program sent. (now() is the moment the transaction began: syncing counts
-- on that. Never clock_timestamp().)
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if tg_op = 'INSERT' then
		new.created_at := now();
	end if;
	new.updated_at := now();
	return new;
end;
$$;

-- A row's owner never changes, and neither does the moment it was made.
create function public.keep_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.user_id := old.user_id;
	new.created_at := old.created_at;
	return new;
end;
$$;

-- A synced row keeps the first id it got, and a deleted row stays deleted:
-- a device that never heard of the deletion cannot bring it back by sending
-- its old copy. (create trigger ... execute function keep_synced('may come back')
-- for rows that may: a food that is picked again.)
create function public.keep_synced()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.id := old.id;
	if old.deleted_at is not null and tg_nargs = 0 then
		new.deleted_at := old.deleted_at;
	end if;
	return new;
end;
$$;

-- A deleted row keeps its place for the other devices, and nothing else.
create function public.empty_deleted()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if new.deleted_at is not null then
		if tg_table_name = 'walks' then
			new.seconds := 0; new.distance_m := 0; new.steps := 0; new.kcal := 0; new.kcal_extra := null;
			new.session := null; new.steps_source := null; new.distance_source := null; new.calories_source := null;
			new.device := null;
		elsif tg_table_name = 'food_entries' then
			new.name := '-'; new.brand := null; new.meal := null; new.food_id := null; new.grams := null; new.kcal := 0;
		elsif tg_table_name = 'foods' then
			new.name := '-'; new.brand := null; new.kcal_100g := 0; new.serving_g := null; new.serving_label := null;
		end if;
	end if;
	return new;
end;
$$;

-- No one person fills the database: at most so many rows in a table. Asked
-- once for each statement that adds rows, with a lock for the person, so
-- that two requests at the same moment cannot both slip under the limit.
-- A row that is already there and is sent again does not count as added.
-- (create trigger ... after insert ... referencing new table as added
--  for each statement execute function public.limit_rows('20000'))
create function public.limit_rows()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
	who uuid;
	have bigint;
begin
	for who in select distinct user_id from added loop
		perform pg_advisory_xact_lock(hashtextextended(tg_table_name || ':' || who::text, 0));
		execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
			into have
			using who;
		if have > tg_argv[0]::bigint then
			raise exception 'There is room for % rows of this kind in one account, and it is full.', tg_argv[0]
				using errcode = 'check_violation';
		end if;
	end loop;
	return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row for each account
-- ---------------------------------------------------------------------------

create table public.profiles (
	user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,

	-- The name in the address of a public page: /u/?name=thrall. Small
	-- letters, digits, - and _. Empty until the person chooses one.
	handle text unique
		check (handle ~ '^[a-z0-9][a-z0-9_-]{2,19}$'),
	-- The name shown on the page: plain text. No invisible characters, no
	-- text that runs the other way, no address, and not the site's own name.
	display_name text
		check (
			char_length(display_name) between 1 and 40
			and display_name = btrim(display_name)
			and display_name ~ '[[:alnum:]]'
			and display_name !~ '[[:cntrl:]]'
			and display_name !~ '[­͏؜ᅟᅠ឴឵᠋-᠏​-‏ - ⁠-⁯ㅤ﻿ﾠ￹-￻]'
			and display_name !~* '(://|www\.|walka|blizzard|official|admin|moderator|support|staff)'
		),

	-- Private until the person makes it public. A public page shows the
	-- name, and time and distance walked. Everything more is a switch of
	-- its own, and off at first.
	is_public boolean not null default false,
	show_days boolean not null default false, -- the last twelve weeks day by day, and since when
	show_steps boolean not null default false, -- steps (with time and distance they give away roughly how tall)
	show_walks boolean not null default false, -- the last 20 walks, one by one

	units text not null default 'mi' check (units in ('mi', 'km')),

	-- "I am 18 or older, and I have read the terms": when it was ticked.
	-- The moment is the database's, and it is not taken back.
	adult_confirmed_at timestamptz,
	-- "Keep my body numbers and my food diary in my account": when. It can
	-- be taken back (set to null), and then all of that is deleted at once.
	body_food_consent_at timestamptz,

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	-- A public page needs an address.
	check (not is_public or handle is not null)
);

-- Names that would pass for the site itself, or for one of its own pages.
create function public.check_handle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if new.handle is not null and (
		new.handle ~ '(walka|blizzard|warcraft|admin|official|support|moderat|staff|gamemaster)'
		or translate(new.handle, '013457_-', 'oieast') ~ '(walka|admin|official|support|moderat|staff|blizzard|warcraft)'
		or translate(new.handle, '013457_-', 'oleast') ~ '(walka|admin|official|support|moderat|staff|blizzard|warcraft)'
		or new.handle = any (array[
			'mod', 'help', 'team', 'root', 'system', 'security', 'abuse', 'postmaster', 'wow', 'null', 'undefined',
			'anonymous', 'everyone', 'owner', 'account', 'accounts', 'privacy', 'terms', 'legal', 'login', 'signin',
			'sign-in', 'delete', 'export', 'food', 'safety', 'downloads', 'faq', 'api', 'www', 'antonyperez', 'antonyperez0'
		])
	) then
		raise exception 'That name is not free.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

-- The two ticks carry the database's clock. "I am 18" is not taken back.
-- Taking the consent back deletes, at once, what it covered.
create function public.stamp_consents()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if tg_op = 'UPDATE' and old.adult_confirmed_at is not null then
		new.adult_confirmed_at := old.adult_confirmed_at;
	elsif new.adult_confirmed_at is not null then
		new.adult_confirmed_at := now();
	end if;

	if tg_op = 'UPDATE' and old.body_food_consent_at is not null and new.body_food_consent_at is not null then
		new.body_food_consent_at := old.body_food_consent_at;
	elsif new.body_food_consent_at is not null then
		if new.adult_confirmed_at is null then
			raise exception 'Walka is for adults.' using errcode = 'check_violation';
		end if;
		new.body_food_consent_at := now();
	elsif tg_op = 'UPDATE' and old.body_food_consent_at is not null then
		delete from public.food_entries where user_id = old.user_id;
		delete from public.foods where user_id = old.user_id;
		delete from public.food_settings where user_id = old.user_id;
		delete from public.body where user_id = old.user_id;
	end if;
	return new;
end;
$$;

-- A page that goes private comes back bare: the extra switches go off with it.
create function public.private_resets()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if old.is_public and not new.is_public then
		new.show_days := false;
		new.show_steps := false;
		new.show_walks := false;
	end if;
	return new;
end;
$$;

-- A name that somebody had is not handed to the next person for 90 days:
-- links that were passed on must not lead to a stranger at once.
create table public.retired_handles (
	handle text primary key,
	until timestamptz not null default now() + interval '90 days'
);
alter table public.retired_handles enable row level security;
revoke all on public.retired_handles from anon, authenticated, public;

create function public.retire_handle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if tg_op = 'INSERT' then
		if new.handle is not null and exists (select 1 from public.retired_handles r where r.handle = new.handle and r.until > now()) then
			raise exception 'That name is not free.' using errcode = 'check_violation';
		end if;
		return new;
	end if;
	if tg_op = 'DELETE' or new.handle is distinct from old.handle then
		if old.handle is not null then
			insert into public.retired_handles (handle) values (old.handle)
				on conflict (handle) do update set until = excluded.until;
		end if;
	end if;
	if tg_op = 'UPDATE' and new.handle is not null and new.handle is distinct from old.handle
		and exists (select 1 from public.retired_handles r where r.handle = new.handle and r.until > now()) then
		raise exception 'That name is not free.' using errcode = 'check_violation';
	end if;
	return coalesce(new, old);
end;
$$;

create trigger profiles_handle before insert or update of handle on public.profiles
	for each row execute function public.check_handle();
create trigger profiles_retire before insert or update of handle or delete on public.profiles
	for each row execute function public.retire_handle();
create trigger profiles_consents before insert or update on public.profiles
	for each row execute function public.stamp_consents();
create trigger profiles_private before update of is_public on public.profiles
	for each row execute function public.private_resets();
create trigger profiles_keep before update on public.profiles
	for each row execute function public.keep_owner();
create trigger profiles_touch before insert or update on public.profiles
	for each row execute function public.touch_updated_at();

-- Only an adult's account holds anything: the first tick comes first.
create function public.need_adult()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if not exists (select 1 from public.profiles p where p.user_id = new.user_id and p.adult_confirmed_at is not null) then
		raise exception 'Walka is for adults.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

-- Body numbers and food are kept only after the person has agreed to that.
create function public.need_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if not exists (
		select 1 from public.profiles p
		where p.user_id = new.user_id and p.adult_confirmed_at is not null and p.body_food_consent_at is not null
	) then
		raise exception 'Body and food numbers are kept only after you have agreed to that.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- The site's owner can take a public page down, and people can report one
-- ---------------------------------------------------------------------------
-- Neither needs anybody to open an account's private rows.

create table public.profile_holds (
	user_id uuid primary key references auth.users (id) on delete cascade,
	hidden_at timestamptz not null default now(),
	reason text not null check (char_length(reason) between 1 and 200)
);
alter table public.profile_holds enable row level security;
create policy "see your own" on public.profile_holds for select to authenticated
	using ((select auth.uid()) = user_id);
revoke all on public.profile_holds from anon, authenticated, public;
grant select on public.profile_holds to authenticated;

-- For the site's owner, in the SQL editor:  select hide_profile('thrall', 'pretends to be somebody');
-- and to put it back:                         select show_profile('thrall');
create function public.hide_profile(name text, why text)
returns void
language sql
set search_path = ''
as $$
	insert into public.profile_holds (user_id, reason)
	select user_id, why from public.profiles where handle = lower(name)
	on conflict (user_id) do update set reason = excluded.reason;
$$;

create function public.show_profile(name text)
returns void
language sql
set search_path = ''
as $$
	delete from public.profile_holds where user_id in (select user_id from public.profiles where handle = lower(name));
$$;

create table public.reports (
	id bigint generated always as identity primary key,
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade, -- who reports
	handle text not null check (handle ~ '^[a-z0-9][a-z0-9_-]{2,19}$'),
	why text not null check (why in ('pretends to be somebody', 'an offensive name', 'something else')),
	note text check (char_length(note) <= 500 and note !~ '[[:cntrl:]]'),
	created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "add your own" on public.reports for insert to authenticated
	with check ((select auth.uid()) = user_id);
create policy "see your own" on public.reports for select to authenticated
	using ((select auth.uid()) = user_id);
revoke all on public.reports from anon, authenticated, public;
grant select, insert on public.reports to authenticated;
create trigger reports_limit after insert on public.reports
	referencing new table as added for each statement execute function public.limit_rows('20');

-- ---------------------------------------------------------------------------
-- body: the numbers the estimates are made from. Never public.
-- ---------------------------------------------------------------------------

create table public.body (
	user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
	-- the same limits as Walka's own settings (companion/src/walka/config.py)
	weight_kg numeric(4, 1) check (weight_kg between 30 and 250),
	height_cm numeric(4, 1) check (height_cm between 120 and 230),
	-- A year of birth, not an age: it stays right.
	birth_year smallint check (birth_year between 1900 and 2100),
	sex text check (sex in ('male', 'female')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- A year is taken only if it makes the person 18 before this year began.
-- (The year is optional: what makes an account an adult's is the first tick.)
create function public.check_adult()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if new.birth_year is not null and new.birth_year >= extract(year from now())::int - 18 then
		raise exception 'Walka is for adults.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

create trigger body_consent before insert or update on public.body
	for each row execute function public.need_consent();
create trigger body_adult before insert or update of birth_year on public.body
	for each row execute function public.check_adult();
create trigger body_keep before update on public.body
	for each row execute function public.keep_owner();
create trigger body_touch before insert or update on public.body
	for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- walks: one row for each walk
-- ---------------------------------------------------------------------------
-- The fields are Walka's own (SessionRecord in companion/src/walka/session.py),
-- without the second-by-second samples, the heart rate, the top speed, the
-- treadmill's name and the character: nothing here needs them, so they stay
-- on the person's computer.

create table public.walks (
	-- Made up by the program that adds the row.
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

	-- Where the walk comes from, and what that program calls it (a label).
	--   walka   the desktop program, or one of its files read on the website
	--           (its id of the walk: "20261119-213000")
	--   android the Android app
	--   web     typed in on the website
	--   file    a TCX file read on the website
	origin text not null check (origin in ('walka', 'android', 'web', 'file')),
	client_id text not null check (char_length(client_id) between 1 and 64),
	-- Which installation sent it: a random id each one makes once. For
	-- information only.
	device text check (char_length(device) <= 64),

	started_at timestamptz not null,
	ended_at timestamptz not null,
	-- The calendar date at the START of the walk, in the time zone the
	-- device was in then. Only the walker's device knows it, so it says it -
	-- once, when the walk is first sent.
	local_day date not null,
	-- minutes that device's clock was ahead of UTC then, if the program knows
	utc_offset_min smallint check (utc_offset_min between -720 and 840),

	seconds numeric(7, 1) not null check (seconds between 0 and 86400), -- time the belt was moving
	distance_m numeric(8, 1) not null check (distance_m between 0 and 200000),
	steps integer not null check (steps between 0 and 400000),
	kcal numeric(7, 1) not null check (kcal between 0 and 20000),
	-- of which on top of sitting at the desk; empty = not known
	kcal_extra numeric(7, 1) check (kcal_extra between 0 and 20000),

	-- With a walking session in the game ("wow"), started by hand ("manual"),
	-- or with no session at all ("free"): Walka's own three words.
	session text check (session in ('wow', 'manual', 'free')),
	-- How each number was come by: measured by the treadmill, or estimated.
	steps_source text check (steps_source in ('treadmill', 'estimate')),
	distance_source text check (distance_source in ('treadmill', 'speed')),
	calories_source text check (calories_source in ('speed', 'heart_rate')),

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz,

	-- One walk is one start second in one account, whatever road it came
	-- by: sent by the desktop program, read from its file, read from a TCX
	-- export of it - it is counted once.
	start_key timestamp generated always as (date_trunc('second', started_at at time zone 'UTC')) stored,
	constraint walks_one_start unique (user_id, start_key),

	check (ended_at >= started_at),
	check (ended_at - started_at <= interval '2 days'),
	check (started_at >= timestamptz '2000-01-01'),
	-- the belt did not move for longer than the walk lasted
	check (seconds <= extract(epoch from ended_at - started_at) + 60),
	-- the day is the day the walk was on, give or take a time zone
	check (local_day between (started_at at time zone 'UTC')::date - 1 and (ended_at at time zone 'UTC')::date + 1)
);

-- not from the days to come (a clock that is a little off is fine)
create function public.check_walk_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if new.started_at > now() + interval '2 days' then
		raise exception 'A walk cannot start in the days to come.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

create index walks_by_day on public.walks (user_id, local_day);
create index walks_by_change on public.walks (user_id, updated_at, id);
create index walks_by_client on public.walks (user_id, origin, client_id);

create trigger walks_adult before insert on public.walks
	for each row execute function public.need_adult();
create trigger walks_time before insert or update of started_at on public.walks
	for each row execute function public.check_walk_time();
create trigger walks_limit after insert on public.walks
	referencing new table as added for each statement execute function public.limit_rows('20000');
create trigger walks_keep before update on public.walks
	for each row execute function public.keep_owner();
create trigger walks_keep_synced before update on public.walks
	for each row execute function public.keep_synced();
create trigger walks_empty before insert or update on public.walks
	for each row execute function public.empty_deleted();
create trigger walks_touch before insert or update on public.walks
	for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- foods: the foods a person has picked or made, kept to be picked again
-- ---------------------------------------------------------------------------

create table public.foods (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

	-- Where it comes from: Open Food Facts (source_id is the barcode), USDA
	-- FoodData Central (its FDC id), or the person's own.
	source text not null check (source in ('off', 'usda', 'own')),
	source_id text check (char_length(source_id) between 1 and 64),

	name text not null check (char_length(name) between 1 and 120 and name !~ '[[:cntrl:]]'),
	brand text check (char_length(brand) <= 60 and brand !~ '[[:cntrl:]]'),

	-- per 100 grams (or 100 millilitres)
	kcal_100g numeric(6, 1) not null check (kcal_100g between 0 and 1000),
	-- one serving, if the source names one: "1 bar (45 g)"
	serving_g numeric(6, 1) check (serving_g > 0 and serving_g <= 5000),
	serving_label text check (char_length(serving_label) <= 60 and serving_label !~ '[[:cntrl:]]'),

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz,

	check ((source = 'own') = (source_id is null)),
	-- a food from a source is kept once (a person's own foods have no
	-- source_id, and do not collide)
	constraint foods_once unique (user_id, source, source_id)
);

create index foods_by_change on public.foods (user_id, updated_at, id);

create trigger foods_consent before insert or update on public.foods
	for each row execute function public.need_consent();
create trigger foods_limit after insert on public.foods
	referencing new table as added for each statement execute function public.limit_rows('5000');
create trigger foods_keep before update on public.foods
	for each row execute function public.keep_owner();
create trigger foods_keep_synced before update on public.foods
	for each row execute function public.keep_synced('may come back');
create trigger foods_empty before insert or update on public.foods
	for each row execute function public.empty_deleted();
create trigger foods_touch before insert or update on public.foods
	for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- food_entries: the diary. One row for each thing eaten.
-- ---------------------------------------------------------------------------
-- An entry carries its own name and calories. It stays what it was when
-- the food it was made from is changed or deleted.

create table public.food_entries (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

	local_day date not null,
	meal text check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),

	food_id uuid references public.foods (id) on delete set null,
	name text not null check (char_length(name) between 1 and 120 and name !~ '[[:cntrl:]]'),
	brand text check (char_length(brand) <= 60 and brand !~ '[[:cntrl:]]'),
	grams numeric(6, 1) check (grams > 0 and grams <= 5000),
	kcal numeric(6, 1) not null check (kcal between 0 and 10000),

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz,

	check (local_day >= date '2020-01-01')
);

-- An entry points only at a food of the same person; and it is not for a
-- day to come (two days of room for a clock on the other side of the world).
create function public.check_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if new.food_id is not null and not exists (
		select 1 from public.foods where id = new.food_id and user_id = new.user_id
	) then
		new.food_id := null;
	end if;
	if new.local_day > (now() at time zone 'UTC')::date + 2 then
		raise exception 'A diary entry cannot be for a day to come.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

create index food_entries_by_day on public.food_entries (user_id, local_day);
create index food_entries_by_change on public.food_entries (user_id, updated_at, id);

create trigger food_entries_consent before insert or update on public.food_entries
	for each row execute function public.need_consent();
create trigger food_entries_check before insert or update of food_id, local_day on public.food_entries
	for each row execute function public.check_entry();
create trigger food_entries_limit after insert on public.food_entries
	referencing new table as added for each statement execute function public.limit_rows('20000');
create trigger food_entries_keep before update on public.food_entries
	for each row execute function public.keep_owner();
create trigger food_entries_keep_synced before update on public.food_entries
	for each row execute function public.keep_synced();
create trigger food_entries_empty before insert or update on public.food_entries
	for each row execute function public.empty_deleted();
create trigger food_entries_touch before insert or update on public.food_entries
	for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- food_settings: a person's own goal
-- ---------------------------------------------------------------------------

create table public.food_settings (
	user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
	-- The goal for a day: calories eaten minus calories burned. 0 is "about
	-- as much as I burn". It cannot be set further than 500 either way:
	-- this is a walking log, not a diet.
	goal_balance_kcal integer not null default 0 check (goal_balance_kcal between -500 and 500),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- No goal below zero for a body that is underweight by its own numbers
-- (a body mass index under 18.5). When the body numbers change to that,
-- the goal goes back to "about as much as I burn". It is here, and not
-- only on the page, because other programs will write the same rows.
create function public.check_goal()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
	b public.body;
	g integer;
begin
	if tg_table_name = 'food_settings' then
		g := new.goal_balance_kcal;
		select * into b from public.body where user_id = new.user_id;
	else
		b := new;
		select goal_balance_kcal into g from public.food_settings where user_id = new.user_id;
	end if;
	if g < 0 and b.weight_kg is not null and b.height_cm is not null
		and b.weight_kg / ((b.height_cm / 100) ^ 2) < 18.5 then
		if tg_table_name = 'food_settings' then
			raise exception 'With these body numbers the goal cannot be below zero.' using errcode = 'check_violation';
		end if;
		update public.food_settings set goal_balance_kcal = 0 where user_id = new.user_id;
	end if;
	return new;
end;
$$;

create trigger food_settings_consent before insert or update on public.food_settings
	for each row execute function public.need_consent();
create trigger food_settings_goal before insert or update of goal_balance_kcal on public.food_settings
	for each row execute function public.check_goal();
create trigger food_settings_keep before update on public.food_settings
	for each row execute function public.keep_owner();
create trigger food_settings_touch before insert or update on public.food_settings
	for each row execute function public.touch_updated_at();
create trigger body_goal after insert or update of weight_kg, height_cm on public.body
	for each row execute function public.check_goal();

-- ---------------------------------------------------------------------------
-- Row-level security: your rows are yours
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.body enable row level security;
alter table public.walks enable row level security;
alter table public.foods enable row level security;
alter table public.food_entries enable row level security;
alter table public.food_settings enable row level security;

create policy "own rows" on public.profiles for all to authenticated
	using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.body for all to authenticated
	using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.walks for all to authenticated
	using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.foods for all to authenticated
	using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.food_entries for all to authenticated
	using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.food_settings for all to authenticated
	using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Nothing for a visitor who is not signed in. For a signed-in person: read,
-- add, change. Walks, foods and diary entries are not removed but marked
-- (deleted_at), so there is no "delete" on them; the body numbers can be
-- deleted outright. Deleting the account removes everything.
revoke all on public.profiles, public.body, public.walks, public.foods, public.food_entries, public.food_settings
	from anon, authenticated, public;
grant select, insert, update on public.profiles, public.walks, public.foods, public.food_entries, public.food_settings
	to authenticated;
grant select, insert, update, delete on public.body to authenticated;

-- ---------------------------------------------------------------------------
-- public_profile(): what the world may see of a public profile
-- ---------------------------------------------------------------------------
-- The one way out. It runs with the database owner's rights (the tables
-- give nothing to visitors), so every field it gives out is named here,
-- one by one. A profile that is not public, or that the site's owner has
-- taken down, is not there at all.

create function public.public_profile(name text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
	p public.profiles;
	totals jsonb;
	days jsonb := null;
	recent jsonb := null;
begin
	select * into p from public.profiles where handle = lower(name) and is_public;
	if not found or exists (select 1 from public.profile_holds h where h.user_id = p.user_id) then
		return null;
	end if;

	select jsonb_build_object(
			'walks', count(*),
			'seconds', coalesce(sum(w.seconds), 0),
			'distance_m', coalesce(sum(w.distance_m), 0)
		)
		|| case when p.show_steps then jsonb_build_object('steps', coalesce(sum(w.steps), 0)) else '{}'::jsonb end
		|| case when p.show_days then jsonb_build_object('first_day', min(w.local_day)) else '{}'::jsonb end
		into totals
		from public.walks w
		where w.user_id = p.user_id and w.deleted_at is null;

	-- the last twelve weeks, day by day
	if p.show_days then
		select coalesce(jsonb_agg(d order by d ->> 'day'), '[]'::jsonb)
			into days
			from (
				select jsonb_build_object('day', w.local_day, 'seconds', sum(w.seconds), 'distance_m', sum(w.distance_m))
					|| case when p.show_steps then jsonb_build_object('steps', sum(w.steps)) else '{}'::jsonb end as d
				from public.walks w
				where w.user_id = p.user_id and w.deleted_at is null
					and w.local_day > current_date - 85 and w.local_day <= current_date + 1
				group by w.local_day
			) per_day;
	end if;

	if p.show_walks then
		select coalesce(jsonb_agg(r), '[]'::jsonb)
			into recent
			from (
				select jsonb_build_object('day', w.local_day, 'seconds', w.seconds, 'distance_m', w.distance_m)
					|| case when p.show_steps then jsonb_build_object('steps', w.steps) else '{}'::jsonb end as r
				from public.walks w
				where w.user_id = p.user_id and w.deleted_at is null
				order by w.started_at desc
				limit 20
			) latest;
	end if;

	return jsonb_build_object(
		'handle', p.handle,
		'display_name', coalesce(p.display_name, p.handle),
		'totals', totals,
		'days', days,
		'walks', recent
	);
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_my_account(): everything, at once, by the person themselves
-- ---------------------------------------------------------------------------
-- Deleting the account's row in auth.users takes every row above with it
-- (on delete cascade), and what the sign-in service wrote in its own log
-- about this person goes too.

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
	me uuid := auth.uid();
	mail text;
begin
	if me is null then
		raise exception 'Not signed in.' using errcode = 'insufficient_privilege';
	end if;
	select email into mail from auth.users where id = me;
	delete from auth.users where id = me;
	delete from auth.audit_log_entries
		where payload ->> 'actor_id' = me::text
			or payload::text like '%' || me::text || '%'
			or (mail is not null and lower(payload ->> 'actor_username') = lower(mail));
end;
$$;

-- ---------------------------------------------------------------------------
-- ping() and schema_version()
-- ---------------------------------------------------------------------------
-- ping: is the database there? The site asks before it shows the account
-- pages, and a small job asks once a day, so that a free project is not put
-- to sleep for lack of use.
-- schema_version: a program on another device reads it when it starts. It
-- goes up only when something changes that an older program must know of.

create function public.ping()
returns text
language sql
stable
set search_path = ''
as $$ select 'pong'::text $$;

create function public.schema_version()
returns integer
language sql
immutable
set search_path = ''
as $$ select 1 $$;

-- ---------------------------------------------------------------------------
-- The sign-in service's own table: two guards
-- ---------------------------------------------------------------------------
-- 1. Nobody signs in with a password here: a code by e-mail, or another
--    site (Discord, Google, GitHub). The sign-in service would take a
--    password all the same, from anybody, for any address - and whoever
--    set one for an address that is not theirs could come back with it
--    after the real owner had signed in by e-mail. So no password is ever
--    kept.
-- 2. The service lets a signed-in person keep free notes with their own
--    account. They are kept small, so that they cannot fill the database.

create function public.guard_sign_in()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.encrypted_password := '';
	if octet_length(coalesce(new.raw_user_meta_data::text, '')) > 8192 then
		raise exception 'Too much is kept with this account.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

create trigger guard_sign_in before insert or update of encrypted_password, raw_user_meta_data on auth.users
	for each row execute function public.guard_sign_in();

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

-- the helpers are for triggers, and hide_profile / show_profile for the
-- site's owner in the SQL editor
revoke all on function
	public.touch_updated_at(), public.keep_owner(), public.keep_synced(), public.empty_deleted(), public.limit_rows(),
	public.check_handle(), public.stamp_consents(), public.private_resets(), public.retire_handle(),
	public.need_adult(), public.need_consent(), public.check_adult(), public.check_walk_time(), public.check_entry(),
	public.check_goal(), public.guard_sign_in(), public.hide_profile(text, text), public.show_profile(text)
	from anon, authenticated, public;

revoke all on function public.public_profile(text), public.ping(), public.schema_version() from public;
grant execute on function public.public_profile(text), public.ping(), public.schema_version() to anon, authenticated;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
