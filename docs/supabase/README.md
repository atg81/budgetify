# Supabase: Applying Budgetify schema and policies

This document explains how to apply the SQL migration created in `db/migrations/001_init_schema.sql` to your Supabase project.

Important: run these commands with an admin/service-role account (or use the Supabase SQL editor). Some actions (creating triggers on `auth.users`) require elevated privileges.

Quick steps (recommended):

1. Install supabase CLI and login:
   - `npm i -g supabase`
   - `supabase login`

2. Pull your project's database connection info:
   - `supabase link --project-ref <your-project-ref>` (optional)

3. Apply the migration SQL file with the Supabase SQL editor (easiest for first-time):
   - Open Supabase Dashboard → SQL Editor → New query
   - Paste the content of `db/migrations/001_init_schema.sql` and run

Or apply using psql if you have a connection string:

   - `psql <CONNECTION_STRING> -f db/migrations/001_init_schema.sql`

Notes & next steps
- The migration creates row-level security (RLS) and attaches a trigger to `auth.users` to create a `profiles` row and default categories upon signup.
- Verify that the trigger executed successfully by creating a test account and confirming `profiles` and `categories` rows exist for that user.
- If you prefer to manually create default categories or seed them differently, edit the `handle_new_user` function before applying.

Security
- Do NOT commit your `service_role` key to source control. Use environment variables and the Supabase dashboard to manage secrets.

If you'd like, I can:
- Generate a migration file split into smaller numbered migrations (for easier rollbacks)
- Add seed files and a small JS/Python script to run seeds against local Postgres
- Set up a CI job to run migrations on deploy

Tell me how you'd like to proceed and I'll continue.