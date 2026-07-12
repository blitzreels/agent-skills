---
name: blitzreels-cli
description: Operate BlitzReels from a shell. Use for workspace inspection, editing, captions, cuts, or exports.
---

# BlitzReels CLI

Use the CLI as the preferred control surface for agent-driven edits.
Discover exact flags from the installed version instead of carrying a static command catalog.

## Workflow

1. Confirm the binary: `command -v blitzreels`.
   If absent, ask the user to install the CLI; do not substitute `npx` for an unknown version.
2. Probe the session with `blitzreels projects list --status active --json`.
   Run `blitzreels auth login` only when that read reports an unauthenticated session.
3. State the target environment.
   Production is the default; local development uses `--base-url http://localhost:3100/api/v1`.
4. Discover commands with `blitzreels agent-context --json`.
   Inspect one exact contract with `blitzreels agent-context --command "COMMAND" --json`.
5. Read the target project and timeline before selecting IDs.
6. Use the highest-level matching operation.
   Prefer `timeline cut` for speech cuts, caption word commands for transcript display fixes, and placement presets
   for media attachment.
7. Check the command contract for dry-run and destructive requirements.
   Review a preview before passing a confirmation flag.
8. Re-read the affected state and render snapshots at changed timestamps.
9. Report changed IDs, receipts, warnings, and visual verification.

## Useful discovery

```bash
blitzreels agent-context --command "timeline cut" --json
blitzreels agent-context --command "captions words list" --json
blitzreels agent-context --command "media attach" --json
blitzreels agent-context --command "project snapshots" --json
```

Use `project inspect --mode full` only when deep word-level metadata is required.
Prefer bounded project, timeline, media, and caption reads for routine work.

## Safety branches

- For deletion or speech cuts, review the plan or dry run before confirmation.
- For exports or paid generation, confirm intent after the project is visually verified.
- After attaching transcribed media, re-read the timeline before adding more layers; imported captions can overlap.
- If a validation error includes usage or suggestions, follow that contract instead of guessing another flag.
- If an API error may have reached the server, read current state before retrying.

## Completion

An edit is complete only when the changed IDs are visible in a follow-up read and affected frames have been checked.
An export is complete only when the export reaches a terminal success state and its output is retrievable.
