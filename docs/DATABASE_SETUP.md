# Connect a real do.daily account

The app uses Supabase Auth and PostgreSQL. Each account starts empty: sample projects, tasks, photos, and time history are never copied into your real records.

## 1. Create the Supabase project

Create a project at https://supabase.com/dashboard. Keep its database password private; this app does not need it.

Open the project's SQL Editor and run the complete contents of:

`supabase/migrations/202610250001_user_workspaces.sql`

Then run `supabase/migrations/202610260001_owned_records.sql` once. For an existing installation, apply only this second migration before running the updated app. It atomically validates/backfills existing records, preserves account revisions and array ordering, and retains the old workspace as a read-only recovery copy. Invalid legacy records abort the entire migration instead of being discarded. Old clients cannot write after this upgrade; refresh/restart all app instances with the updated code.

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

The current tables are `daily_accounts`, `daily_projects`, `daily_tasks`, `daily_sessions`, `daily_activities`, `daily_check_ins`, `daily_challenges`, and `daily_memories`. Milestones remain nested inside their owned project, and reflections inside their owned check-in; they inherit the parent row’s protection. Each top-level entity is a separate row, rather than one workspace-sized JSON value. Every table has an authenticated `user_id`; entity keys are `(user_id, id)`. Records retain their model fields in a validated JSONB `payload`, plus a `position` for stable ordering. Generated `project_id`, `task_id`, and `challenge_id` columns enforce relationships through composite foreign keys containing `user_id`. Owner/date, owner/project, and owner/session-start indexes support scoped queries. This is per-record document storage with relational ownership/references; not every model field is a standalone SQL column.

RLS limits every read/insert/update/delete to `auth.uid() = user_id`. Authenticated-only, security-invoker functions `daily_load_workspace` and `daily_save_workspace` provide the app's API. Neither accepts an authoritative owner ID from the browser. Saving locks only the caller's account revision, writes changed records, and commits entities and revision together. Any failed constraint rolls back the whole save. Obsolete unscoped prototype tables are closed to browser access. Passwords and login emails remain managed by Supabase Auth, not copied into content records.

Writes include the last loaded revision. A stale browser cannot overwrite a newer workspace. If two devices edit concurrently, the app stops and offers a local export before explicitly loading the account version. It does not silently merge or overwrite conflicts.

Pending edits also have an account-scoped browser backup. A failed write shows **Not saved to your account** with a retry button. Reloading retries pending edits when their revision still matches; otherwise it shows the conflict screen. If browser storage is unavailable, keep the tab open until the database save succeeds. Do not clear browser storage while changes remain unsaved. Database errors never fall back to sample data.

The **running timer** remains device-local and resumes on that device after reload. Completed sessions synchronize between devices. Do not run the same session independently on two devices. Demo data remains separate under its old browser key; there is no automatic demo import. Without Supabase configuration, development runs in explicitly labeled Demo mode. Production refuses to expose a demo workspace and shows an unavailable screen instead.

To inspect your saved sessions in Supabase SQL Editor:

```sql
select user_id, id, payload->>'title' as title,
       payload->>'startedAt' as started_at,
       payload->>'endedAt' as ended_at,
       payload->>'durationSeconds' as duration_seconds
from public.daily_sessions;
```

The dashboard SQL editor runs with elevated database access. Browser clients have only the account's permissions.

## Validation

```sh
npm run test:db
npm run test:security
npm run test:time
npx tsc --noEmit
npm run build
```

The database tests run the actual SQL migration in an embedded PostgreSQL engine (PGlite) and check owner isolation, anonymous denial, atomic time recording, schema validation, and stale-write protection. This is separate from validating your live Supabase project's authentication, network access, email delivery, and deployed schema.

## Remaining scale boundaries

The browser currently loads a complete user workspace and submits its state to the transactional API. Storage updates are per-record, but network payloads and client memory still grow with a user's history. The new indexed entity tables allow paginated reads and per-record mutations without another storage redesign; those API/UI changes remain a follow-up.

MVP scope: photo uploads, previews, sample-image selection, photo displays, and image statistics are removed. Memories use notes, dates, locations, and repeat preferences. Existing image data is preserved privately for compatibility, but is not displayed; new memories store empty legacy photo fields. Dedicated photo storage is deferred until after MVP, when private owner-scoped storage can be considered.

After successful signout, the app clears the local account backup and timer key. During use, browser backups remain device-local and are not end-to-end encrypted. Database permissions do not replace device/browser security. Live verification must test two real accounts after applying the new migration; local PostgreSQL tests and simulated API browser checks are not proof of live-project configuration.
