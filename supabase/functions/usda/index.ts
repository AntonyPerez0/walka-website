// The "usda" function of the accounts' Supabase project: the food diary's
// way to USDA FoodData Central. handle.ts says what it does and why.
//
// To put it on the project (once, and again after a change):
//
//   npx supabase functions deploy usda
//   npx supabase secrets set USDA_API_KEY=<a key from https://fdc.nal.usda.gov/api-key-signup>
//
// Leave "verify JWT" switched on for it (it is by default): the function
// counts on Supabase having checked the token. Without the function, or
// without the key, the diary searches Open Food Facts only and says nothing.

import { handle } from './handle.ts';

Deno.serve((request) => handle(request, { USDA_API_KEY: Deno.env.get('USDA_API_KEY') }, fetch));
