# Connect a real do.daily account

The app uses Supabase Auth and PostgreSQL. Each account starts empty: sample projects, tasks, photos, and time history are never copied into your real records.

## 1. Create the Supabase project

Create a project at https://supabase.com/dashboard. Keep its database password private; this app does not need it.

Open the project's SQL Editor and run the complete contents of:

`supabase/migrations/202610250001_user_workspaces.sql`

Run this migration, **not** the old `supabase/schema.sql`. The old tables belong to an earlier UI and are unused by the current application. The new migration is additive and can be rerun. It enables row-level security and grants access only to the signed-in owner's record. Do not disable RLS.

## 2. Configure the application

Copy `.env.local.example` to `.env.local` on the machine running Next.js and enter these values from Supabase's project connection/API settings:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

An older project's **public anon key** can be provided as `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead. Never use a `service_role` or secret API key in a `NEXT_PUBLIC_` variable. The browser receives these public variables; authentication and row-level security protect private data.

For Codex cloud, add the values through environment settings instead of committing an environment file or sending credentials in chat. Requirements for the URL and publishable key are already declared in the draft. Add your project's exact hostname to the cloud network allowlist when remote validation needs access. Review/save configuration and publish it to reuse the environment. Production hosting needs the same variables in its own settings.

Restart `npm run dev` after configuring variables. Production deployments must rebuild, since Next.js embeds public variables at build time.

## 3. Create your account and record time

In Supabase Authentication settings, enable Email/password sign-in. Keep email confirmation enabled. Set the Site URL and allowed redirect URLs to the address where you run the app (your local development origin or deployed site). For reliable production email delivery, configure Supabase's SMTP service settings with your email provider.

Open the app, choose **Create an account**, and confirm your email when requested. Then sign in and press Start focus. The timer starts immediately. On Finish, add a title, category, and optionally assign or create a task/project, then save the session. Changes save automatically. If a failed-save banner appears, retry and keep the page open until it clears. Open the app in another browser/device and sign in to verify the session appears there.

Click your sidebar profile to edit your name or sign out. Finish/discard a timer and save outstanding changes before signing out.

## Storage and recovery

`public.user_workspaces` stores one versioned JSONB workspace per authenticated user: projects, tasks, completed time sessions, activity history, check-ins, invitations, and memories. A session and its activity are saved atomically in one database update. All views read the same account data. PostgreSQL RLS checks `auth.uid() = user_id` on reads and writes.

Writes include the last loaded revision. A stale browser cannot overwrite a newer workspace. If two devices edit concurrently, the app stops and offers a local export before explicitly loading the account version. It does not silently merge or overwrite conflicts.

Pending edits also have an account-scoped browser backup. A failed write shows **Not saved to your account** with a retry button. Reloading retries pending edits when their revision still matches; otherwise it shows the conflict screen. If browser storage is unavailable, keep the tab open until the database save succeeds. Do not clear browser storage while changes remain unsaved. Database errors never fall back to sample data.

The **running timer** remains device-local and resumes on that device after reload. Completed sessions synchronize between devices. Do not run the same session independently on two devices. Demo data remains separate under its old browser key; there is no automatic demo import. With no Supabase configuration, the app is explicitly labeled Demo mode.

To inspect your saved sessions in Supabase SQL Editor:

```sql
select user_id, revision, data->'sessions' as sessions
from public.user_workspaces;
```

The dashboard SQL editor runs with elevated database access. Browser clients have only the account's permissions.

## Validation

```sh
npm run test:db
npm run test:time
npx tsc --noEmit
npm run build
```

The database tests run the actual SQL migration in an embedded PostgreSQL engine (PGlite) and check owner isolation, anonymous denial, atomic time recording, schema validation, and stale-write protection. This is separate from validating your live Supabase project's authentication, network access, email delivery, and deployed schema.
