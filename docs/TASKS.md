# Tasks

Tasks have their own detail pages at `/tasks/{id}`, accessed from their parent project (or an existing Today task). There is no Tasks navigation tab or global task index; `/tasks` redirects to Projects. Task pages return to the parent project, or the projects overview for standalone legacy tasks. The checkbox still completes/reopens the task directly.

Project pages show two columns: project tasks on the left, with a black “Add a Task” action and Open / Done / Archived filters; today’s completed tasks for that project on the right. The completion feed excludes other dates, other projects, reopened tasks, and legacy milestone events. The columns stack on mobile. Milestone controls are removed; existing milestone data is retained. Starting focus from a project keeps the user on that project, including when another timer needs attention.

A task has a title, optional description, To do / In progress / Done status, and a stream of dated progress notes. Notes can be edited and deleted, with confirmation before deletion. Existing project links are displayed, but there are no project assignment or move controls on the task page. Existing creation flows are preserved.

The task page shows all saved sessions linked by `taskId`, across all dates: total focused time, session count, days with saved focus, exact start/end times, individual focused duration, and session notes. Totals sum saved session durations once; the mirrored activity records are not counted again. Pauses are excluded. An active session is displayed separately until saved. Historical sessions without end timestamps say “End time not recorded”.

Start focus links a timer to the task and marks it In progress. Completing a task from any task control automatically stops and saves its active timer, including a paused timer, and completes the task in one workspace update. Completing a different task leaves the running timer alone. Repeated completion does not duplicate the saved session. Reopening preserves recorded time and notes. The existing one-running-timer rule still applies.

A session’s note or task assignment can be corrected from its history entry. This updates the saved session and matching activity record together, keeping the original duration and timestamps. Project attribution follows the target task’s existing link; the task itself is never moved.

Archiving hides tasks from active lists while retaining their sessions, descriptions, and notes. Archived tasks can be viewed and restored from the parent project’s Archived filter. An active task must have its session finished before archiving. Task deletion is not offered.

## Storage

`Task` extends the existing owner-scoped `daily_tasks.payload` with optional `description`, `status`, `notes`, and `archivedAt`. Each note contains `id`, `text`, `createdAt`, and optional `updatedAt`. The existing `completed` field stays synchronized for compatibility. Legacy tasks without new fields remain usable. All fields inherit the parent task’s per-user row-level security; no additional database migration or service credentials are required.

Workspace account autosave, local pending-change recovery, and revision-conflict handling apply to edits, notes, session corrections, and automatic completion. Running timers remain device-local. This does not add realtime synchronization between devices.

## Validation

`npm run test:tasks` verifies focused-time totals, automatic completion, paused timers, repeated Done, reopening, unrelated timers, session corrections, and legacy status handling. `npm run test:security` verifies rich task payloads round-trip through the real PostgreSQL-compatible test database and cannot be read or changed by another owner. Browser checks cover task creation, deep-link reloads, descriptions, note editing/deletion, automatic completion, standalone task sessions, archive/restore, and desktop/mobile layouts.
