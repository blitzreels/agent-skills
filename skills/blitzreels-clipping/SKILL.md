---
name: blitzreels-clipping
description: Create, select, reframe, repair, caption, or export short clips from long-form media.
---

# BlitzReels Clipping

Use the managed clip **state machine**.
It owns ingest, transcription, selection, layout, captions, QA, repair, and export sequencing.

## Steps

1. Resolve the source as a YouTube URL or workspace asset ID and resolve selection intent.
   Use a provided time range or suggestion; use automatic best selection only when choice is delegated.
   Complete when source and selection mode are explicit.
2. Discover the current contract with
   `blitzreels agent-context --command "clips create" --json` or the OpenAPI `/clips` operations.
   Complete when required inputs, mutation effects, and state fields are known.
3. Create with a caller-generated idempotency key.
   Complete when the response contains a clip ID, project ID, state, and `next_action`.
4. Follow `next_action`: poll, reselect, repair, export, or stop.
   Complete each transition only when the next response advances or reaches a terminal state.
5. When the user retained selection choice, present available alternatives with title, hook, range,
   duration, and score; reselect the approved ID or range.
   Complete when the chosen selection is persisted.
6. Validate layout intent.
   Tutorial layout is for flattened screen-share plus facecam footage.
   Interview and podcast footage use automatic, split, or focus layouts.
   Complete when applied layout and content type agree.
7. Review QA previews and warnings; run only the repair action offered by current state.
   Complete when QA passes or the state reports a specific unresolved block.
8. Start a paid export only after user approval and an export-ready state.
   Poll to terminal and verify output duration, aspect ratio, captions, framing, and download location.

## Manual branch

Use low-level project media, transcript, timeline, caption, and preview operations only when managed state reports
a specific block requiring manual control.

Return to the managed clip after the repair instead of rebuilding its state machine with low-level calls.

## Completion

Return clip and project IDs, selected range, applied layout, QA result, warnings, export status,
and download location.

If blocked, return `next_action`, the exact blocking state, and the user choice or system state required.
Completion requires a verified terminal output or an explicit managed-state blocker.
