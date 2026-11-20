#!/bin/sh
# Points a build at the Supabase stack on this computer (`npx supabase start`):
#
#   . scripts/accounts-env.sh && npm run build
#
# It only sets three settings for this shell (src/env.ts says what they are).
status=$(npx -y supabase@3.2.0 status -o json 2>/dev/null) || { echo "No local Supabase stack is running. Start one: npx supabase@3.2.0 start" >&2; return 1 2>/dev/null || exit 1; }
SUPABASE_URL=$(printf '%s' "$status" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).API_URL))")
SUPABASE_KEY=$(printf '%s' "$status" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).PUBLISHABLE_KEY))")
SIGN_IN=${SIGN_IN:-email}
export SUPABASE_URL SUPABASE_KEY SIGN_IN
echo "Accounts: $SUPABASE_URL (sign-in: $SIGN_IN)"
