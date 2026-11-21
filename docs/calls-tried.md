# The calls a syncing program makes, as they were tried

What a program that syncs with Walka's accounts sends, and what comes
back. [data-model.md](data-model.md) ("Syncing") is the contract; this
page is the detail under it, for whoever writes such a program.

Every line was tried on 21 November 2026 with plain HTTP requests (no
Supabase library, no browser) against a copy of the database on the
tester's own computer: Supabase's command-line tool 3.2.0, GoTrue 2.198.0
(the sign-in service), PostgREST 16.5, Postgres 17.12, with this
repository's migration. The sign-in through another site was run on a
second copy whose Site URL was the live one, `https://walka.dev/account/`,
with a stand-in for the other site. The live project was asked three
things only, none of them a sign-in: its version (2.198.0 too), whether
its gateway wants the key (it does), and `rpc/schema_version` (1).

The numbers in brackets are the entries of the full record of that run,
which is not kept here (6,000 lines). Tokens are written as
`<access token>`.

### Every request

1. Two headers: `apikey: <the project's publishable key>` and `Authorization: Bearer <access token>` (9.1).
   Without `Authorization`, or with the publishable key as the bearer, the request is a visitor's: HTTP 401,
   code `42501`, "permission denied for table walks" (9.5, 9.6, 9.10).
2. An EXPIRED access token: HTTP **401**, body `{"code":"PGRST303","message":"JWT expired"}`, header
   `WWW-Authenticate: Bearer error="invalid_token", error_description="JWT expired"` (9.12, 9.14; a real
   one issued by the sign-in service: 12.9, 12.10). That is the answer to treat as "refresh, then try once
   more" (12.11, 12.12). The database lets a token through for 30 seconds after its `exp` (9.13, 12.7); the
   sign-in service does not: `/auth/v1/user` answers 403 `bad_jwt` at once (9.16, 12.8). Any other broken
   bearer: 401 `PGRST301` (9.8, 9.9).
3. The LOCAL gateway does not check the `apikey` at all: no key and a wrong key both get through (9.2, 9.3,
   9.18; its config has no key check). The hosted gateway does refuse them: on 21 November 2026 the live
   project answered 401 to `rpc/ping` without the key and 200 with it. Always send it.
4. A POST with JSON works with `Content-Type: application/json` and also with no Content-Type (9.19);
   `text/plain` is refused (9.20).

### Signing in

5. LOCAL only: `POST /auth/v1/otp {email, create_user}` then `POST /auth/v1/verify {type:"email", email,
   token}` (1.2-1.4). `create_user:false` for an address without an account: 422 `otp_disabled` (1.1, 8.19).
   Where e-mail sign-in is switched off, `/otp` answers 422
   (`otp_disabled` with create_user:false, `email_provider_disabled` with create_user:true; tried for an
   address without an account) and nothing is sent (12.2, 12.3). On the live project the e-mail way is
   not switched off at the service, but there is no mail service behind it and the site does not offer it:
   people sign in there through Discord, GitHub or Google only.
6. What a sign-in gives (the same from `/verify`, `/token?grant_type=pkce` and `/token?grant_type=refresh_token`):
   `access_token` (a JWT; signed ES256 on the local stack), `token_type` "bearer", `expires_in` 3600, `expires_at` (seconds since 1970),
   `refresh_token` (12 characters), `user` (1.4, 1.7). Through another site there are two more keys,
   `provider_token` and `provider_refresh_token` (10.6): the other site's own tokens - a program has no use
   for them and should not keep them. Claims of the JWT: `iss, sub (= the user id), aud, exp, iat, email,
   phone, app_metadata, user_metadata, role, aal, amr, session_id, is_anonymous` (1.4, 10.6).
7. Through another site, from a program, with PKCE and a LOOPBACK address - the whole run is 10.1-10.6:
   the browser is opened at `GET /auth/v1/authorize?provider=<p>&redirect_to=http://127.0.0.1:<port>/callback&code_challenge=<c>&code_challenge_method=s256`
   (no headers); the sign-in service sends the browser to the other site, the other site sends it back to
   `/auth/v1/callback`, and that sends it to `http://127.0.0.1:<port>/callback?code=<one-time code>`;
   the program then sends `POST /auth/v1/token?grant_type=pkce` with `{"auth_code": <code>, "code_verifier": <verifier>}`.
   A wrong verifier: 400 `bad_code_verifier` (10.5) and the code is still good (10.6); a code used twice or
   unknown: 404 `flow_state_not_found` (10.12, 10.13). The person says no: the loopback address gets
   `?error=access_denied&error_description=...` (10.19, 10.20). Without `code_challenge` the session comes
   after a `#`, which a listener never sees (10.23): PKCE is needed.
8. WHICH `redirect_to` IS ALLOWED (GoTrue v2.198.0, Site URL `https://walka.dev/account/`; sections 10b):
   - with an EMPTY allow-list: every address whose host is a loopback IP ADDRESS is allowed, any port, any
     path, any scheme - `http://127.0.0.1:<any port>/...`, `http://127.0.0.2:...`, `http://[::1]:...`,
     even `walka://127.0.0.1/...`. `localhost` by NAME is not. Other IP addresses are not.
     `https://walka.dev/<any path>` is (same scheme and host as the Site URL); `http://walka.dev/...`,
     `https://walka.dev:8443/...`, `https://www.walka.dev/...`, `https://WALKA.dev/...` are not.
   - the entries `"http://127.0.0.1/**"`, `"http://127.0.0.1:*/**"` and `"http://127.0.0.1:53124/callback"`
     change NOTHING: 127.0.0.1 with any port was allowed before and stays so.
   - `"http://localhost:53124/callback"` allows exactly `http://localhost:53124/callback` (that port only).
   - `"http://localhost:*/**"` allows `http://localhost:<any port>/<any path>` (but not `http://localhost/callback`
     without a port).
   - `"walka://callback"` allows exactly `walka://callback`.
   The live project ran the same version of the sign-in service on 21 November 2026, so the same rule is
   expected there. A whole sign-in against the live project has NOT been tried: try it before building on it.
9. Refreshing: `POST /auth/v1/token?grant_type=refresh_token {"refresh_token": ...}`. The refresh token
   CHANGES every time (1.7). The old one, used again: within 10 seconds, or while it is the parent of the
   current one, it gives the current one back (1.8, 1.9, 1d); otherwise 400 `refresh_token_already_used`
   AND the whole sign-in is revoked - its newest token then also answers `refresh_token_already_used`
   (1.11, 1.17-1.19). A token that is not there (signed out, account deleted): 400 `refresh_token_not_found`
   (1.15, 1.22, 1.28, 8.15).
10. Signing out: `POST /auth/v1/logout?scope=local` with the access token as bearer: 204 (1.21). It ends
    this sign-in only (1.22, 1.23); another sign-in of the same account lives on (1.26). Without `scope` it
    ends every sign-in of the account (1.27). The access token still opens the database until its `exp`
    (1.24).
11. `GET /auth/v1/user` (1.6): 200 with the user; 403 `session_not_found` after signing out (1.23); 403
    `user_not_found` after the account was deleted (8.16).

### A new account (no row in "profiles")

12. Reads answer 200 `[]` (2.1, 2.3, 2.7). A push of walks: **400, code `23514`, "Walka is for adults."**
    (2.4). A PATCH of the profile changes nothing and says so only by its empty answer (2.5, 2.6).
13. The database lets the person's own program take the first step: a row in `profiles` with
    `adult_confirmed_at` not empty (2.14; the database writes its own time). A profile row without it does
    not open anything (2.12, 2.13). Whether a program SHOULD is the owner's decision: the website does it
    only after the person ticks "I am 18 or older, and I have read the terms and the privacy page".

### Walks

14. Adding: `POST /rest/v1/walks?on_conflict=user_id,start_key`, `Prefer: resolution=ignore-duplicates,return=representation`,
    body a list of objects that all have the same keys (3.1). HTTP 201; the rows that come back were added;
    a walk that is already there does not come back; nothing at all added is 201 with `[]` (3.2, 3.3).
    `&select=id` gives back only the ids (3.6). With `return=minimal` added and not added look the same (3.4, 3.5).
    Different keys in one batch: 400 `PGRST102` "All object keys must match" (3.22, 3.23), unless
    `&columns=...` names them (3.24).
15. "Fetch it by its start": `start_key=eq.<the start cut to the second, in UTC, no zone>` (3.11, 3.12; a
    zone written on it is IGNORED: 3.16), or `started_at=gte.<second>&started_at=lt.<next second>` (3.14).
    `started_at=eq.` misses a start that has a fraction of a second (3.13). Several at once:
    `start_key=in.(a,b,c)` (3.18). The row found may be a deleted one (`deleted_at` set): 5.19.
16. Columns: `start_key` must not be sent (400 `428C9`: 3.26). `created_at` and `updated_at` are ignored,
    at insert and at PATCH (3.27, 5.7); one's own `user_id` may be sent (3.27) and need not be. `id` is taken at insert (and never changes: 5.7); no `id` = the database
    makes one (3.25); an `id` that ANY walk of ANY account already has: **409 `23505` walks_pkey** (3.30,
    3.31). `deleted_at` at insert is taken as sent and the row is born empty (3.29). Another person's
    `user_id`: 400 `23514` "Walka is for adults." (3.28). An unknown key: 400 `PGRST204` (3.33).
17. Numbers: `steps` must be a JSON integer - `1600.0` is refused, `22P02` (section 6). `seconds`,
    `distance_m`, `kcal`, `kcal_extra` are rounded to one decimal (section 6) and come back as `1800.0`.
    `started_at`/`ended_at` are text (a number is refused: `22008`); any zone is taken; no zone = UTC.
18. Sizes: 1,000 walks in one request took 74 ms here, 200 took 64 ms with whole rows back (3.34, 3.38);
    the answer to an insert is NOT cut at 1,000 rows (3.36); 20,000 in one request (8.2 MB) worked locally
    (11.13). What the hosted gateway allows was not checked; the website sends 200 at a time.
19. Fetching what is new: the contract's filter works only with the `+` of `+00:00` written `%2B`
    (4.2 fails with 400 `22007`; 4.3 works; `urllib.parse.urlencode` does it: 4.4; writing `Z` works too: 4.5).
    The text of a timestamp has UP TO six decimals: zeros at the end are dropped (5c, 5.24). A request gets
    at most 1,000 rows whatever `limit` says (4.9, 4.10). All rows of one POST have the same `updated_at`
    (section 4, top), so the `id` half of the filter matters; the loop is right with any page size (after 4.8).
    `Prefer: count=exact` adds the total to `Content-Range` and turns 200 into 206 (4.11); HEAD works (4.17).
20. Changing: `PATCH /rest/v1/walks?id=eq.<id>&updated_at=eq.<seen, + as %2B>` with
    `Prefer: return=representation`: 200 and the row (5.1), or 200 and `[]` when the row changed in between
    (5.2). WITHOUT the Prefer header both are 204 with no body (5.3, 5.4). A PATCH with no filter: 400
    `21000` (5.12).
21. Deleting: `PATCH ... {"deleted_at": "<time>"}` (5.14). Left in the row: `id, user_id, origin, client_id,
    started_at, ended_at, local_day, utc_offset_min, created_at, updated_at, deleted_at, start_key`;
    `seconds, distance_m, steps, kcal` are 0; `kcal_extra, session, steps_source, distance_source,
    calories_source, device` are null. It stays deleted and empty (5.15, 5.16, 5c 5.27). Sent again, it does
    not come back: 201 `[]` (5.17, 5.18). `DELETE`: 403 `42501` (5.21).
22. Refusals: the table at the end of section 6. All are HTTP 400 except an id that exists (409). Codes
    seen: `23514` (a rule of the table, AND "Walka is for adults.", AND the full account), `23502` (a
    required column missing or null), `22P02`, `22003`, `22008`, `23505` (409), `PGRST102`, `PGRST204`,
    `428C9`; and `22007` for a timestamp that cannot be read in a filter (3.19, 4.2, 4.21). One bad row refuses the whole batch (6b).
23. The 20,001st walk: 400 `23514` "There is room for 20000 rows of this kind in one account, and it is
    full." (11.6). A batch that would go over is refused whole (11.4, 11.7). Walks that are already there
    can still be sent (11.8). Deleted walks still count (11.10).

### Body numbers, profile

24. Without the agreement: GET `[]`; POST 400 `23514` "Body and food numbers are kept only after you have
    agreed to that." (7.2, 7.3). The agreement is the column `profiles.body_food_consent_at`, which the
    person's own program can set (7.7); taking it back deletes the body row at once (7.20, 7.21). `body` is
    one row for an account, key `user_id`, no `id`, no `deleted_at`; a second POST is 409 (7.10); upsert with
    `on_conflict=user_id` and `resolution=merge-duplicates` (7.11). Ranges: the table at 7.14.
25. `profiles`: readable are `user_id, handle, display_name, is_public, show_days, show_steps, show_walks,
    units, adult_confirmed_at, body_food_consent_at, created_at, updated_at` (7.1). `units` is `mi` or `km`
    (7.16, 7.17).

### Functions, and an account that is gone

26. `rpc/schema_version`: `1` (8.1-8.3). `rpc/ping`: `"pong"` (8.4, 8.5). Both work for a visitor.
27. `rpc/delete_my_account`: 204 (8.9). Afterwards, with the old tokens: a push of walks is **400 `23514`
    "Walka is for adults."** - NOT 23503 (8.10); reads are 200 `[]` (8.11, 8.12); `23503` (HTTP 409) comes only
    from writing a `profiles` row (8.13, 8.14); a refresh is 400 `refresh_token_not_found` (8.15);
    `/auth/v1/user` is 403 `user_not_found` (8.16).

