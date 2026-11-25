-- Where a person is signed in: each browser, and each computer where Walka
-- is signed in. The account page lists them, and can end one of them.
--
-- The sign-in service keeps a session for each (auth.sessions): when it
-- began, when it was last renewed, the IP address it came from, and what the
-- browser or program calls itself ("Walka/0.8.0" for Walka). A page cannot
-- read that table. These two functions give a signed-in person their OWN
-- sessions and nothing else, and end one of their own. Nothing new is kept.
--
-- Ending a session deletes it, and the sign-in service's refresh tokens of
-- that session go with it (on delete cascade). The browser or the Walka that
-- held it can no longer renew its sign-in: Walka then says that it is no
-- longer signed in, and stops sending. An access token it already holds
-- goes on working until it runs out, within the hour - as after any
-- sign-out.
--
-- schema_version() stays 1: no program that writes walks needs to know of
-- this. Like every function, these are closed until granted below.

create function public.my_sign_ins()
returns table (id uuid, began_at timestamptz, renewed_at timestamptz, user_agent text, ip text, this_one boolean)
language sql
stable
security definer
set search_path = ''
as $$
	select
		s.id,
		s.created_at,
		-- refreshed_at is written without a zone, in UTC
		coalesce((s.refreshed_at at time zone 'UTC'), s.updated_at, s.created_at),
		left(s.user_agent, 300),
		host(s.ip),
		s.id::text = coalesce(auth.jwt() ->> 'session_id', '')
	from auth.sessions s
	where s.user_id = auth.uid()
		and (s.not_after is null or s.not_after > now())
	order by 3 desc
	limit 100;
$$;

create function public.end_sign_in(sign_in uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
	me uuid := auth.uid();
	gone int;
begin
	if me is null then
		raise exception 'Not signed in.' using errcode = 'insufficient_privilege';
	end if;
	delete from auth.sessions where id = sign_in and user_id = me;
	get diagnostics gone = row_count;
	return gone > 0;
end;
$$;

revoke all on function public.my_sign_ins(), public.end_sign_in(uuid) from public, anon;
grant execute on function public.my_sign_ins(), public.end_sign_in(uuid) to authenticated;
