# Reflect

Reflect is a guided daily journal, available in desktop and mobile navigation and through the existing Today check-in. One entry is kept per local calendar date; revisiting an entry updates that day rather than creating duplicate reflections or activity history.

The two steps are:

1. Arrive: five mood faces, from very low to great, and five energy spheres, from empty to full. Both groups support keyboard radio selection.
2. Look back: what moved forward and what is occupying your mind. Both written answers are optional.

Steps retain answers while navigating Back and Continue. The entry is saved when the user chooses “Keep this reflection”; closing before then discards unsaved edits. The carry-forward step and rotating extra prompt are removed. Existing answers to those questions are preserved and remain readable in history.

History defaults to three columns of small tiles on wide desktop screens, two at intermediate widths, and one on mobile. A Tiles/Lines switch remembers the chosen layout in this browser. Previews use the same mood and energy icons as the form, and a “Read” arrow expands the entry. Inclusive From/To filters, a Last 7 days shortcut, and clearing dates work in both layouts. Older check-ins remain readable even if they have no energy or newer prompt answers. Historical entries can be edited without changing their original date or removing their older answers.

The five new rating choices store values 2, 4, 6, 8, and 10 on the existing 1–10 scale. Older values display the nearest visual choice; editing other fields preserves the exact original score until the user selects a rating.

## Storage and privacy

Entries extend the existing `DailyCheckIn` payload in owner-scoped `daily_check_ins`. The optional new fields are `energy`, `gratitude`, `tomorrow`, `dailyPrompt`, `dailyAnswer`, and `updatedAt`; existing `mood`, `movedForward`, and `reflection.text` are preserved. No extra SQL migration is needed beyond the account/owned-record migrations documented in DATABASE_SETUP.md. The account autosave, revision conflict handling, retry behavior, and row-level security apply to journal entries. Demo entries remain local to the browser. No journal content is sent to an AI service.

Validation: `npm run test:journal` covers date filtering, editing old dates without duplicates, visual rating mapping, and legacy compatibility. `npm run test:security` verifies all journal fields round-trip through the database and remain private across owners.

## Future weekly perspective (not implemented)

An opt-in weekly review could offer:

- Recurring themes supported by dated excerpts the user can open.
- Things that appeared to restore or drain energy, phrased as observations rather than causal claims.
- Small wins that are easy to overlook.
- One gentle question and one practical experiment for the coming week.

Users should preview which dates and entries are included, exclude individual entries, and explicitly request a review. Missing days should not count against them. Reviews should avoid diagnoses, personality scores, or claims based on sparse entries. Decide on the AI provider, consent, data retention, account-isolated review storage, server-only credentials, cost/rate limits, and deletion behavior before enabling the feature. Begin with a capped free offering; potential paid features could include longer review history or monthly perspectives. Do not send email summaries or schedule background analysis without a separate opt-in.

Other possible later improvements: a private journal export, optional reminders, user-selected prompts, and a simple mood/energy trend with dated source entries. None are required for the current guided journal.

## Navigation and quote placement

Memories is hidden from navigation for now; stored memories are retained. Today’s invitation is replaced by the perspective quote previously on Projects. Weekly Notes keeps its quote. Both use a shared black card with a small inline SVG planet illustration, replacing the raster artwork. The sidebar timer shortcut reads “Start new focus”.

Visual style: Reflect icons use black and white, including mood/energy previews and selected form choices. Keep the established app palette; new colors require user approval.
