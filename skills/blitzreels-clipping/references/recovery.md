# Clipping Recovery

Use this reference when a clipping run is blocked, inconsistent, or partially successful.

## Transcript Missing

Meaning:
- media ingest exists
- transcript timing is not ready yet

Next action:
1. Poll again if the asset is still processing.
2. If ingest is complete but transcript is still missing on a project-bound path, call `POST /projects/{projectId}/transcribe`.
3. Poll `GET /jobs/{jobId}` until complete.

Return:
- `final_status: "blocked"`
- `next_action: "wait_for_transcript"` or `next_action: "start_transcription"`

## Suggestions Empty

Meaning:
- transcript may exist
- clipping ideation is not ready yet

Next action:
1. Poll `GET /workspace/media/assets/{assetId}/short-suggestions` again.
2. If the asset supports generation and suggestions still do not exist, call `POST /workspace/media/assets/{assetId}/short-suggestions`.

Return:
- `final_status: "blocked"`
- `next_action: "wait_for_suggestions"` or `next_action: "generate_suggestions"`

## Reframe Analysis Missing, Pending, or Failed

Meaning:
- the source may be clip-ready
- automatic layout quality is not confirmed yet

Next action:
1. Read `GET /workspace/media/assets/{assetId}/reframe-analysis`.
2. If status is `missing`, call `POST /workspace/media/assets/{assetId}/reframe-analysis`.
3. If status is `pending` or `processing`, poll until complete.
4. If status is `failed`, either retry analysis or fall back to manual timeline assembly.

Notes:
- Do not treat `automatic_layout_applied=true` as proof of strong reframing.
- Inspect `primary_layout`, `automatic_layout_fallback_used`, `speaker_aware_applied`, `layout_summary`, and `warnings` to see whether the result was split, focus, letterbox, fallback-heavy, or speaker-aware.

Return:
- `final_status: "blocked"` when waiting
- `next_action: "wait_for_reframe_analysis"` or `next_action: "retry_reframe_analysis"`
- `final_status: "completed"` with `fallback_used: true` if manual fallback succeeds

## Podcast Layout Rejected

Meaning:
- the API refused to apply a podcast clip because the best available result was still fallback-heavy or letterboxed

Next action:
1. Read the `layout_summary` and `warnings` from the `409` response.
2. Return `blocking_reason: "podcast_letterbox_rejected"`.
3. Do not export unless the caller explicitly wants letterbox.

Return:
- `final_status: "blocked"`
- `next_action: "pick_another_clip_or_allow_letterbox"`

## Captions Added Is Zero

Meaning:
- suggestion apply may have succeeded
- caption insertion did not produce usable timeline captions

Next action:
1. Verify transcript timing exists.
2. Inspect timeline context.
3. If only full-asset captions exist, rebuild captions for the clip window only.
4. Do not export until caption timeline items exist.

Return:
- `final_status: "blocked"`
- `next_action: "repair_clip_window_captions"`

## Duration Mismatch

Meaning:
- the chosen suggestion window disagrees with transcript, asset, or final timeline duration

Priority order:
1. chosen suggestion window
2. transcript timing
3. timeline context after apply
4. asset detail duration

Next action:
1. Re-check the chosen suggestion start and end.
2. Re-check transcript-backed timing.
3. Verify the timeline after apply before exporting.

Return:
- `final_status: "blocked"`
- `next_action: "resolve_duration_conflict"`

## Export Failed

Meaning:
- the project was assembled
- render delivery did not complete

Next action:
1. Poll `GET /exports/{exportId}` or `GET /jobs/{jobId}` again if still running.
2. If failed, return the export error and keep the project plus chosen suggestion metadata.
3. Do not silently restart export more than once without surfacing the failure.

Return:
- `final_status: "failed"`
- `next_action: "inspect_export_failure"`
