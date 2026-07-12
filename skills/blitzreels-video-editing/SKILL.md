---
name: blitzreels-video-editing
description: Edit a BlitzReels project through REST. Use for timeline, captions, media, previews, or exports.
---

# BlitzReels REST Video Editing

Use the CLI skill when a local `blitzreels` command is available.
This skill covers direct REST editing and integration code.

## Workflow

1. Load the compact capability index, then only the needed OpenAPI operations.
2. Read the project and bounded timeline context.
   Load caption words, media, or other large collections only for the relevant time window.
3. Select stable IDs from the read response.
   Do not reuse IDs from an earlier timeline state after a mutation.
4. Choose the highest-level operation that owns the full change.
   - Speech removal: timeline cut with linked caption ripple.
   - Caption correction: word text, merge, split, delete, retime, or block patch as appropriate.
   - Visual placement: timeline media insertion or transform using current canvas dimensions.
   - Editable text: content items.
5. Preview risky writes when the operation supports dry run or a plan.
6. Mutate with an idempotency key when the contract accepts one.
7. Re-read the timeline and render preview frames at every changed interval.
8. Start export only after visual verification and explicit approval for paid rendering.
9. Poll the export to a terminal state and verify its output metadata.

## Editing rules

- Prefer placement presets before explicit coordinates.
- Treat safe areas as layout constraints; verify them in rendered frames.
- Use the highest-resolution source available for logos and overlays.
- List supported fonts before setting a font family.
- Patch only changed workspace or style fields.
- Treat partial failures as failures until every requested item is accounted for.

## Failure branch

On a conflict or stale ID, discard the pending edit, refresh context, and select the target again.
On a partial batch failure, report each failed item and verify successful items before retrying only the failures.

## Completion

Return affected IDs, mutation receipts, warnings, preview evidence, and export status.
The task is not complete when the API accepted a write but the resulting frame or timeline was not checked.
