-- Walka accounts: what is kept for a person who signs in.
--
-- The rules of this database, in plain words:
--
--  1. A row belongs to one person. Only that person can read it, add it,
--     change it or delete it. Row-level security on every table says so,
--     and nothing is granted to visitors who are not signed in.
--  2. What other people may see of a profile that its owner made public
--     goes out through ONE function, public_profile(), and nowhere else.
--     It gives out a name and walking totals. Never weight, height, age,
--     heart rate, the treadmill's name, or anything about food.
--  3. Every row can be synced. A program on another device (the Walka
--     desktop program, an Android app) makes up the row's id itself, so it
--     can write the same row twice without making two; "updated_at" is set
--     by the database, never by the program; a deleted row is kept as a
--     marker ("deleted_at") so that the other devices hear of it.
--  4. A person can take everything out (the site reads their own rows and
--     saves them as a file) and delete everything (delete_my_account()).
--
-- docs/data-model.md says the same at length, with the reasons.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- "updated_at" is the database's own clock, whatever the program sent.
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
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

-- No one person fills the database: at most so many rows in a table.
-- (create trigger ... execute function public.limit_rows('20000'))
create function public.limit_rows()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
	have bigint;
begin
	execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
		into have
		using new.user_id;
	if have >= tg_argv[0]::bigint then
		raise exception 'There is room for % rows of this kind in one account, and it is full.', tg_argv[0]
			using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row for each account
-- ---------------------------------------------------------------------------

create table public.profiles (
	user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,

	-- The name in the address of a public page: /u/?name=thrall. Lower case.
	-- Empty until the person chooses one.
	handle text unique
		check (handle ~ '^[a-z0-9][a-z0-9_-]{2,19}$'),
	-- The name shown on the page.
	display_name text
		check (char_length(display_name) between 1 and 40 and display_name !~ '[[:cntrl:]]'),

	-- Private until the person makes it public. Each thing a public page
	-- may show beyond the totals is a switch of its own, and off at first.
	is_public boolean not null default false,
	show_walks boolean not null default false, -- the list of single walks
	show_kcal boolean not null default false, -- calories, in totals and walks

	units text not null default 'mi' check (units in ('mi', 'km')),

	-- "I am 18 or older, and I have read the terms" - when it was ticked.
	adult_confirmed_at timestamptz,

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),

	-- A public page needs an address.
	check (not is_public or handle is not null)
);

-- Names that would pass for the site itself, or for somebody else.
create function public.check_handle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if new.handle is not null and new.handle = any (array[
		'admin', 'administrator', 'moderator', 'mod', 'support', 'help', 'staff', 'team', 'official',
		'walka', 'walka-team', 'walka_team', 'root', 'system', 'security', 'abuse', 'postmaster',
		'blizzard', 'blizzard-entertainment', 'warcraft', 'wow', 'null', 'undefined', 'anonymous', 'everyone', 'me'
	]) then
		raise exception 'That name is not free.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

create trigger profiles_handle before insert or update of handle on public.profiles
	for each row execute function public.check_handle();
create trigger profiles_keep before update on public.profiles
	for each row execute function public.keep_owner();
create trigger profiles_touch before insert or update on public.profiles
	for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- body: the numbers the estimates are made from. Never public.
-- ---------------------------------------------------------------------------

create table public.body (
	user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
	-- the same limits as Walka's own settings (companion/src/walka/config.py)
	weight_kg numeric(4, 1) check (weight_kg between 30 and 250),
	height_cm numeric(4, 1) check (height_cm between 120 and 230),
	-- A year of birth, not an age: it stays right. Walka is for adults.
	birth_year smallint check (birth_year between 1900 and 2100),
	sex text check (sex in ('male', 'female')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create function public.check_adult()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if new.birth_year is not null and new.birth_year > extract(year from now())::int - 18 then
		raise exception 'Walka is for adults.' using errcode = 'check_violation';
	end if;
	return new;
end;
$$;

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
-- without the second-by-second samples.

create table public.walks (
	-- Made up by the program that adds the row.
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

	-- Where the walk comes from, and what that program calls it. Together
	-- they make sure that the same walk, sent twice, is one row.
	--   walka   the desktop program (its id: "20261119-213000")
	--   android the Android app
	--   web     typed in on the website
	--   file    read on the website from a file (Walka's own, or TCX)
	origin text not null check (origin in ('walka', 'android', 'web', 'file')),
	client_id text not null check (char_length(client_id) between 1 and 64),

	started_at timestamptz not null,
	ended_at timestamptz not null,
	-- The day the walk counts for, where the walker was: only the walker's
	-- device knows that, so it says it.
	local_day date not null,

	seconds integer not null check (seconds between 0 and 86400), -- time the belt was moving
	distance_m numeric(8, 1) not null check (distance_m between 0 and 200000),
	steps integer not null check (steps between 0 and 400000),
	kcal numeric(7, 1) not null check (kcal between 0 and 20000),
	-- of which on top of sitting at the desk
	kcal_extra numeric(7, 1) check (kcal_extra between 0 and 20000),
	max_kmh numeric(4, 2) check (max_kmh between 0 and 30),
	avg_hr numeric(4, 1) check (avg_hr between 20 and 250),
	max_hr smallint check (max_hr between 20 and 250),

	-- With a walking session in the game ("wow"), or without ("manual").
	session text check (session in ('wow', 'manual')),
	-- The character it was counted for: its name, never its realm.
	character_name text check (char_length(character_name) <= 40),
	-- How each number was come by: measured by the treadmill, or estimated.
	steps_source text check (steps_source in ('treadmill', 'estimate')),
	distance_source text check (distance_source in ('treadmill', 'speed')),
	calories_source text check (calories_source in ('speed', 'heart_rate')),
	treadmill text check (char_length(treadmill) <= 80),

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz,

	unique (user_id, origin, client_id),
	check (ended_at >= started_at),
	check (ended_at - started_at <= interval '2 days'),
	-- the day is the day the walk was on, give or take a time zone
	check (local_day between (started_at at time zone 'UTC')::date - 1 and (ended_at at time zone 'UTC')::date + 1)
);

create index walks_by_day on public.walks (user_id, local_day);
create index walks_by_change on public.walks (user_id, updated_at);

create trigger walks_limit before insert on public.walks
	for each row execute function public.limit_rows('20000');
create trigger walks_keep before update on public.walks
	for each row execute function public.keep_owner();
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
	brand text check (char_length(brand) <= 80 and brand !~ '[[:cntrl:]]'),

	-- per 100 grams (or 100 millilitres)
	kcal_100g numeric(6, 1) not null check (kcal_100g between 0 and 1000),
	protein_100g numeric(5, 1) check (protein_100g between 0 and 100),
	carbs_100g numeric(5, 1) check (carbs_100g between 0 and 100),
	fat_100g numeric(5, 1) check (fat_100g between 0 and 100),
	-- one serving, if the source names one: "1 bar (45 g)"
	serving_g numeric(6, 1) check (serving_g > 0 and serving_g <= 5000),
	serving_label text check (char_length(serving_label) <= 60),

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz,

	check ((source = 'own') = (source_id is null))
);

-- a food from a source is kept once
create unique index foods_once on public.foods (user_id, source, source_id) where source_id is not null;
create index foods_by_change on public.foods (user_id, updated_at);

create trigger foods_limit before insert on public.foods
	for each row execute function public.limit_rows('5000');
create trigger foods_keep before update on public.foods
	for each row execute function public.keep_owner();
create trigger foods_touch before insert or update on public.foods
	for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- food_entries: the diary. One row for each thing eaten.
-- ---------------------------------------------------------------------------
-- An entry carries its own name and numbers. It stays what it was when the
-- food it was made from is changed or deleted.

create table public.food_entries (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

	local_day date not null,
	meal text check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),

	food_id uuid references public.foods (id) on delete set null,
	name text not null check (char_length(name) between 1 and 120 and name !~ '[[:cntrl:]]'),
	brand text check (char_length(brand) <= 80 and brand !~ '[[:cntrl:]]'),
	grams numeric(6, 1) check (grams > 0 and grams <= 5000),
	kcal numeric(6, 1) not null check (kcal between 0 and 10000),
	protein_g numeric(5, 1) check (protein_g between 0 and 1000),
	carbs_g numeric(5, 1) check (carbs_g between 0 and 1000),
	fat_g numeric(5, 1) check (fat_g between 0 and 1000),

	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz,

	check (local_day between date '2020-01-01' and (now() at time zone 'UTC')::date + 2)
);

create index food_entries_by_day on public.food_entries (user_id, local_day);
create index food_entries_by_change on public.food_entries (user_id, updated_at);

create trigger food_entries_limit before insert on public.food_entries
	for each row execute function public.limit_rows('60000');
create trigger food_entries_keep before update on public.food_entries
	for each row execute function public.keep_owner();
create trigger food_entries_touch before insert or update on public.food_entries
	for each row execute function public.touch_updated_at();

-- An entry points only at a food of the same person.
create function public.check_entry_food()
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
	return new;
end;
$$;

create trigger food_entries_food before insert or update of food_id on public.food_entries
	for each row execute function public.check_entry_food();

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

create trigger food_settings_keep before update on public.food_settings
	for each row execute function public.keep_owner();
create trigger food_settings_touch before insert or update on public.food_settings
	for each row execute function public.touch_updated_at();

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

-- Nothing for a visitor who is not signed in; for a signed-in person, the
-- four things one does with one's own rows - and no more (no truncate, no
-- triggers, no references).
revoke all on public.profiles, public.body, public.walks, public.foods, public.food_entries, public.food_settings
	from anon, authenticated, public;
grant select, insert, update, delete
	on public.profiles, public.body, public.walks, public.foods, public.food_entries, public.food_settings
	to authenticated;

-- The helpers above are for triggers only.
revoke all on function
	public.touch_updated_at(), public.keep_owner(), public.limit_rows(), public.check_handle(),
	public.check_adult(), public.check_entry_food()
	from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- public_profile(): what the world may see of a public profile
-- ---------------------------------------------------------------------------
-- The one way out. It runs with the database owner's rights (the tables
-- give nothing to visitors), so every field it gives out is named here,
-- one by one. A profile that is not public is not there at all.

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
	days jsonb;
	recent jsonb := null;
begin
	select * into p from public.profiles where handle = lower(name) and is_public;
	if not found then
		return null;
	end if;

	select jsonb_build_object(
			'walks', count(*),
			'seconds', coalesce(sum(w.seconds), 0),
			'distance_m', coalesce(sum(w.distance_m), 0),
			'steps', coalesce(sum(w.steps), 0),
			'kcal', case when p.show_kcal then coalesce(sum(w.kcal), 0) end,
			'first_day', min(w.local_day),
			'last_day', max(w.local_day)
		)
		into totals
		from public.walks w
		where w.user_id = p.user_id and w.deleted_at is null;

	-- the last twelve weeks, day by day
	select coalesce(jsonb_agg(d order by d ->> 'day'), '[]'::jsonb)
		into days
		from (
			select jsonb_build_object(
					'day', w.local_day,
					'seconds', sum(w.seconds),
					'distance_m', sum(w.distance_m),
					'steps', sum(w.steps)
				) as d
			from public.walks w
			where w.user_id = p.user_id and w.deleted_at is null and w.local_day > current_date - 85
			group by w.local_day
		) per_day;

	if p.show_walks then
		select coalesce(jsonb_agg(r), '[]'::jsonb)
			into recent
			from (
				select jsonb_build_object(
						'day', w.local_day,
						'seconds', w.seconds,
						'distance_m', w.distance_m,
						'steps', w.steps,
						'kcal', case when p.show_kcal then w.kcal end
					) as r
				from public.walks w
				where w.user_id = p.user_id and w.deleted_at is null
				order by w.started_at desc
				limit 20
			) latest;
	end if;

	return jsonb_build_object(
		'handle', p.handle,
		'display_name', coalesce(p.display_name, p.handle),
		'units', p.units,
		'totals', totals,
		'days', days,
		'walks', recent
	);
end;
$$;

revoke all on function public.public_profile(text) from public;
grant execute on function public.public_profile(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- delete_my_account(): everything, at once, by the person themselves
-- ---------------------------------------------------------------------------
-- Deleting the account's row in auth.users takes every row above with it
-- (on delete cascade).

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
	me uuid := auth.uid();
begin
	if me is null then
		raise exception 'Not signed in.' using errcode = 'insufficient_privilege';
	end if;
	delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- ping(): is the database there?
-- ---------------------------------------------------------------------------
-- The site asks before it shows the account pages, and a small job asks
-- once a day, so that a free project is not put to sleep for lack of use.

create function public.ping()
returns text
language sql
stable
set search_path = ''
as $$ select 'pong'::text $$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
