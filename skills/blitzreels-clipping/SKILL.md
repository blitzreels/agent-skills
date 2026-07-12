---
name: blitzreels-clipping
description: Repurpose long-form media into short clips. Use for selection, reframing, repair, captions, or export.
---

# BlitzReels Clipping

Use the managed clip workflow first.
It owns ingest, transcription, selection, layout, captions, QA, repair, and export sequencing.

## Workflow

1. Confirm the source: a YouTube URL or workspace asset ID.
2. Confirm selection intent.
   - Use an explicit time range when the user provides one.
   - Use a selected suggestion when the user names one.
   - Use automatic best selection only when the user delegates the choice.
3. Discover the current contract.
   - CLI: `blitzreels agent-context --command "clips create" --json`.
   - REST: inspect the `/clips` operations in OpenAPI.
4. Create the clip with a caller-generated idempotency key.
5. Follow `next_action` from the clip response: poll, reselect, repair, export, or stop.
   Do not infer readiness from asset existence or a generic job status.
6. When alternatives are available and the user retained the choice, show title, hook, time range, duration, and
   score; then reselect with the chosen ID or range.
7. Use tutorial layout only for flattened screen-share plus facecam footage.
   Keep interview and podcast footage on automatic, split, or focus layouts.
8. Review QA previews and warnings.
   Run only the repair action offered by the current state, then follow the returned `next_action` again.
9. Export only when the clip state permits it and the user has approved a paid render.
10. Poll the clip or export to a terminal state and verify the output duration, aspect ratio, captions, and framing.

## Manual branch

Use project media, transcript, timeline, caption, and preview operations only when the managed clip state reports a
specific block that requires manual control.

Do not pre-emptively rebuild the managed state machine with low-level endpoints.

## Completion

Return the clip and project IDs, selected range, applied layout, QA result, warnings, export status, and download
location.

If blocked, return the current `next_action`, blocking reason, and the exact user choice or system state required.
