# Reflect

Reflect is a guided daily journal, available in desktop and mobile navigation and through the existing Today check-in. One entry is kept per local calendar date; revisiting an entry updates that day rather than creating duplicate reflections or activity history.

The three steps are:

1. Arrive: mood and energy, each on a 1–10 scale.
2. Look back: a small win, what is occupying your mind, and an optional daily perspective prompt.
3. Carry forward: something you appreciate and one kind intention for tomorrow.

Written answers are optional. Steps retain their answers while navigating Back and Continue. The entry is saved when the user chooses “Keep this reflection”; closing before then discards unsaved edits. A daily extra prompt rotates deterministically by calendar date and is stored alongside its answer so future prompt changes will not rewrite history.

History lists newest entries first, expands to show full answers, and supports inclusive From/To date filters, a Last 7 days shortcut, and clearing dates. Existing check-ins remain readable even if they have no energy or newer prompt answers. Historical entries can be edited without changing their original date.

## Storage and privacy

Entries extend the existing `DailyCheckIn` payload in owner-scoped `daily_check_ins`. The optional new fields are `energy`, `gratitude`, `tomorrow`, `dailyPrompt`, `dailyAnswer`, and `updatedAt`; existing `mood`, `movedForward`, and `reflection.text` are preserved. No extra SQL migration is needed beyond the account/owned-record migrations documented in DATABASE_SETUP.md. The account autosave, revision conflict handling, retry behavior, and row-level security apply to journal entries. Demo entries remain local to the browser. No journal content is sent to an AI service.

Validation: `npm run test:journal` covers date filtering, editing old dates without duplicates, prompt rotation, and legacy compatibility. `npm run test:security` verifies all journal fields round-trip through the database and remain private across owners.

## Future weekly perspective (not implemented)

An opt-in weekly review could offer:

- Recurring themes supported by dated excerpts the user can open.
- Things that appeared to restore or drain energy, phrased as observations rather than causal claims.
- Small wins that are easy to overlook.
- One gentle question and one practical experiment for the coming week.

Users should preview which dates and entries are included, exclude individual entries, and explicitly request a review. Missing days should not count against them. Reviews should avoid diagnoses, personality scores, or claims based on sparse entries. Decide on the AI provider, consent, data retention, account-isolated review storage, server-only credentials, cost/rate limits, and deletion behavior before enabling the feature. Begin with a capped free offering; potential paid features could include longer review history or monthly perspectives. Do not send email summaries or schedule background analysis without a separate opt-in.

Other possible later improvements: a private journal export, optional reminders, user-selected prompts, and a simple mood/energy trend with dated source entries. None are required for the current guided journal.
