# daily.fm · A little, every day.

An interactive, mobile-first concept for seeing evidence of a life in progress. **Do** is for meaningful output. **Be** is for real-life experiences. The interface uses a monochrome visual system with a single muted blue accent, bold sans-serif type, original geometric illustrations, a contribution grid, intentional time, and personal memories.

## Run it

Use the existing checkout at `/workspace/timerfm`. Each cloud task is already isolated; a new Git worktree is unnecessary unless explicitly requested.

```sh
npm ci --cache /workspace/.npm
npm run dev -- --hostname 0.0.0.0 --port 3000
```

For a production server, stop the development server first. Next.js uses the same `.next` output directory for development and builds.

```sh
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

Validate types with `npx tsc --noEmit`. No Supabase setup, credentials, external APIs, or font downloads are needed for this prototype. The earlier Supabase helpers and schema remain in the repository but are not used by the prototype.

## Explore

- **Today:** tap a grid square to open a daily summary; change the date range; inspect streaks and the momentum explanation.
- **Do / Be:** switch between work intentions and life activities. Add and complete tasks. Log a walk with duration and distance, or another activity in Move, Learn, Create, Explore, People, Reflect, or Rest.
- **Focus:** choose a task, start, pause, resume, and finish a count-up session. Save a “What changed?” note. The running timer survives reloads and is accessible from other screens.
- **Projects:** see focused time, sessions, active days, and completed tasks. Create a project; add or complete your own milestones.
- **Check-in:** record mood, what moved forward, and what is on your mind. Revisit and edit the same day's entry.
- **Memories:** create Explore / Build / Stretch invitations, add an experience with a photo and a note, record whether you would do it again, and browse the archive. Uploaded JPG, PNG, and WebP files are limited to 2 MB. A clearly labeled sample illustration is available for testing.
- **Weekly notes:** see the last seven days of intentional time and a category breakdown. Pattern notes are simulated from local activity data; they are not live AI analysis or health advice.

## Local data

The app starts with deterministic sample history relative to the date of first use. New actions are stored in the browser's `localStorage`, under `timerfm-prototype-v1`; the active timer has its own `timerfm-active-timer-v1` key. Data stays on the current device and browser. There is no account, synchronization, tracking, or connected health service. Sample artwork lives in `public/memories`.

`src/lib/prototype/types.ts` defines the product models, `seed.ts` supplies sample data and evidence calculations, and `storage.ts` is the persistence boundary that a future database adapter can replace. Components in `src/components/prototype` separate the grid, timer, forms, shared dialogs, and screen views.

Streaks count consecutive days with recorded activity. Momentum is a transparent prototype heuristic: up to 55 points for active days in the last 14 days, plus up to 45 points for activity frequency. It is not a productivity or well-being score.

## Validation

The prototype was checked in Chromium for task creation and completion; Do / Be switching; dog-walk logging; check-in editing; timer pause/resume, reload recovery and session saving; project milestones; photo-proof validation and challenge completion; memory detail views; custom invitations; and local persistence. All four main views were checked for horizontal overflow at 360, 390, 768, 1024, and 1440 px. The production build and TypeScript check are the final implementation checks.
