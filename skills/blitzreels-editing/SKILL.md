---
name: blitzreels-editing
description: Edit BlitzReels projects through CLI or REST. Use for timeline, caption, media, preview, or export changes.
---

# BlitzReels Editing

Treat CLI and REST as execution branches of the same project edit.
Use the installed CLI for direct workspace operation and REST for integrations or explicit API work.

## Workflow

1. Choose the surface.
   - CLI: confirm `command -v blitzreels`, then inspect the exact command with `agent-context --command`.
   - REST: load the capability index, then inspect only the required OpenAPI operations.
   - If the CLI is absent, continue through REST when the public contract supports the edit.
2. Read the project and bounded timeline context before selecting IDs.
   Load caption words or media only for the affected interval.
3. Choose the highest-level operation that owns the full change.
   - Speech removal: timeline cut with caption ripple.
   - Caption correction: word text, merge, split, delete, retime, or block patch.
   - Visual placement: media insertion or transform using placement presets first.
   - Editable text: content items.
4. Preview risky writes with dry run or a plan.
   Review destructive output before passing a confirmation flag.
5. Mutate with an idempotency key when the contract accepts one.
6. Re-read the affected state and render frames at every changed interval.
7. Start an export only after visual verification and approval for paid rendering.
   Poll it to terminal success and verify that the output is retrievable.

## CLI discovery

```bash
blitzreels agent-context --command "timeline cut" --json
blitzreels agent-context --command "captions words list" --json
blitzreels agent-context --command "media attach" --json
blitzreels agent-context --command "project snapshots" --json
```

Use `project inspect --mode full` only when deep word-level metadata is required.

## Recovery

- On a stale ID or conflict, discard the pending edit, refresh context, and select the target again.
- On partial failure, account for every item and retry only failed items after verification.
- When an API call may have reached the server, read current state before retrying.
- After attaching transcribed media, refresh the timeline before adding layers because captions can overlap.

## Completion

Return the surface used, affected IDs, mutation receipts, warnings, preview evidence, and export status.
The edit is complete only when follow-up reads and rendered frames prove the requested state.
