# Clipping Recovery

Use this reference only when the current public clipping flow is blocked, degraded, or failed.

Primary rule:

- recover by stage, not by assumption
- keep the strongest public clipping path if it can still succeed
- export only after the clip window, framing, and captions are verified

## Transcript Missing

Meaning:

- ingest completed enough to create media
- transcript timing is still unavailable

What to do:

1. Poll `GET /projects/{projectId}/transcript?media_id=...`.
2. If media processing is complete and transcript is still missing, call `POST /projects/{projectId}/transcribe`.
3. Poll `GET /jobs/{jobId}` until transcription completes.

Do not:

- assume ingest completion means suggestions or captions are ready

## Suggestions Missing

Meaning:

- transcript may exist
- highlight extraction is not ready yet

What to do:

1. Poll `GET /workspace/media/assets/{assetId}/short-suggestions`.
2. If transcript exists and suggestions stay empty, report the clip as blocked unless that deployment explicitly exposes a suggestion-generation endpoint for the asset.

Do not:

- invent a best moment without transcript-backed evidence

## Suggestion Apply Blocked Or Weak

Common cases:

- `409 podcast_letterbox_rejected`
- `409 podcast_visual_qa_failed`
- apply succeeds but framing is still visibly wrong

What to do:

1. Inspect `layout_summary`, `warnings`, and any returned `visual_qa`.
2. If available, render `POST /projects/{projectId}/preview-frames`.
3. If available, inspect `GET /projects/{projectId}/visual-debug`.
4. Prefer `POST /workspace/media/assets/{assetId}/reframe-plan/preview` or `POST /workspace/media/assets/{assetId}/reframe-plan/apply` when planner output is the stronger path.
5. If a specific timeline item is bad, run one repair path with `POST /projects/{projectId}/timeline/media-views/{timelineItemId}`.
6. Recheck previews or QA before export.

Do not:

- export a fallback-heavy letterbox podcast clip without surfacing the risk
- blind-retry suggestion apply multiple times without inspecting evidence

## Captions Misaligned To The Clip Window

Meaning:

- captions exist
- but they cover the source asset instead of the selected clip window

What to do:

1. Reapply captions for the chosen clip window with `POST /projects/{projectId}/captions`.
2. Verify `GET /projects/{projectId}/context?mode=timeline`.
3. Confirm captions start near clip time `0`, do not overlap, and do not double-render.

Do not:

- export with full-source captions attached to a trimmed short

## Export Pending Or Failed

Meaning:

- the clip itself may be correct
- export has not finished or has failed

What to do:

1. Poll `GET /jobs/{jobId}` or `GET /exports/{exportId}`.
2. If export fails, return the failure clearly and include the last known clip verification state.

Do not:

- rerun clipping from the start unless the timeline or caption state is also wrong

## Return On Failure

Return:

- `final_status: "blocked"` or `final_status: "failed"`
- `project_id`
- `asset_id`
- selected suggestion and clip window if known
- blocking stage
- last known QA or visual evidence used
- export failure details when relevant
