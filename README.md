# daily.fm · A little, every day.

An interactive, mobile-first concept for seeing evidence of a life in progress. **Do** is for meaningful output. **Be** is for real-life experiences. The interface uses a monochrome visual system with a single muted blue accent, bold sans-serif type, original geometric illustrations, a contribution grid, intentional time, and personal memories.

## Run it

Use the existing checkout at `/workspace/dailyfm`. Each cloud task is already isolated; a new Git worktree is unnecessary unless explicitly requested.

```sh
npm ci --cache /workspace/.npm
npm run dev -- --hostname 0.0.0.0 --port 3000
```

For a production server, stop the development server first. Next.js uses the same `.next` output directory for development and builds.

```sh
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

Validate types with `npx tsc --noEmit`. For real accounts and persistent time logs, follow [Database setup](docs/DATABASE_SETUP.md). Without Supabase configuration the app runs in clearly labeled browser-only demo mode. No external fonts are required.

## Explore

- **Today:** tap a grid square to open a daily summary; change the date range; inspect streaks and the momentum explanation.
- **Do / Be:** switch between work intentions and life activities. Add and complete tasks. Log a walk with duration and distance, or another activity in Move, Learn, Create, Explore, People, Reflect, or Rest.
- **Focus:** choose a task, start, pause, resume, and finish a count-up session. Save a “What changed?” note. The running timer survives reloads and is accessible from other screens.
- **Projects:** see focused time, sessions, active days, and completed tasks. Create a project; add or complete your own milestones.
- **Check-in:** record mood, what moved forward, and what is on your mind. Revisit and edit the same day's entry.
- **Memories:** create Explore / Build / Stretch invitations, add an experience with a photo and a note, record whether you would do it again, and browse the archive. Uploaded JPG, PNG, and WebP files are limited to 2 MB. A clearly labeled sample illustration is available for testing.
- **Weekly notes:** see the last seven days of intentional time and a category breakdown. Pattern notes are simulated from local activity data; they are not live AI analysis or health advice.

## Account data and demo data

Supabase-backed accounts start empty and save tasks, projects, completed sessions, activities, check-ins, and memories privately to PostgreSQL. Saving happens automatically; failed writes show a retry banner. Pending changes are backed up per account in the browser; revision checks prevent another device from silently overwriting them. A running timer is device-local; completed sessions synchronize. See [Database setup and recovery](docs/DATABASE_SETUP.md).

Without database configuration, deterministic sample history and edits stay under the `timerfm-prototype-v1` browser key. Demo data is never imported into a real account automatically. Sample artwork lives in `public/memories`.

Streaks count consecutive days with recorded activity. Momentum is a transparent prototype heuristic: up to 55 points for active days in the last 14 days, plus up to 45 points for activity frequency. It is not a productivity or well-being score.

## Validation

The prototype was checked in Chromium for task creation and completion; Do / Be switching; dog-walk logging; check-in editing; timer pause/resume, reload recovery and session saving; project milestones; photo-proof validation and challenge completion; memory detail views; custom invitations; and local persistence. All four main views were checked for horizontal overflow at 360, 390, 768, 1024, and 1440 px. The production build and TypeScript check are the final implementation checks.
