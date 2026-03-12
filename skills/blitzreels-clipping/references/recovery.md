# Clipping Recovery

Use this reference only when a clip is blocked or failed and `next_action` guidance needs additional context.

Primary rule: trust `next_action` and use `error` + `blocking_reason` as supporting context.

## `next_action = "poll"`

Meaning: source import, transcription, suggestion generation, analysis, assembly, QA, or export is still running.

What to do:

1. Call `GET /clips/{clip_id}` again.
2. Keep polling until `next_action` changes or `status` becomes terminal.

Do not:

- trigger low-level transcript, suggestion, or analysis endpoints — the clip resource manages these internally
- render your own preview frames

## `next_action = "reselect"`

Common reasons:

- `blocking_reason = "invalid_selection"` — requested suggestion not found or time range invalid
- `blocking_reason = "letterbox_rejected"` — planner couldn't achieve split/focus for podcast content, fell back to mostly-letterbox segments which have poor vertical density

What to do:

1. Inspect `selection.alternatives` for other scored suggestions.
2. Pick another suggestion if one is available.
3. If no good suggestion exists, use a manual `time_range` with absolute `start_seconds` + `end_seconds`.
4. Call `POST /clips/{clip_id}/reselect`.

Do not:

- export a fallback-heavy letterbox clip without surfacing the risk
- keep retrying the same rejected selection

## `next_action = "repair"`

Common reason: `blocking_reason = "visual_qa_failed"` — automated frame inspection found critical issues (missing faces, thin strip splits, captions overlapping faces).

What to do:

1. Inspect `qa.issues` for severity, code, and `suggested_fix`.
2. Choose a repair mode based on the issue:
   - `"auto"` — default, re-runs reframe planning
   - `"prefer_split"` — when the issue is speaker visibility or split composition
   - `"prefer_focus"` — when the issue is weak focus framing
   - `"move_captions_off_faces"` — when the issue is caption overlap
3. Run exactly one repair pass with `POST /clips/{clip_id}/repair`.
4. Poll the clip again.
5. If still blocked after repair, `next_action` will be `"reselect"` — do not loop repairs.

## `next_action = "export"`

Meaning: clip is assembled, QA passed or is not blocking, captions are ready.

What to do:

1. Confirm `qa.blocking = false`.
2. Call `POST /clips/{clip_id}/export`.
3. Poll until export completes.

Do not:

- bypass QA unless the user explicitly asks (set `allow_blocking_qa_bypass: true`)

## `next_action = "stop"`

Meaning: the run reached a terminal state.

What to do:

1. If `status = "exported"`, return the download URL.
2. If `status = "failed"`, surface the `error` object which includes `step`, `code`, `why_failed`, and `how_to_fix`.
3. If the clip is blocked without a valid follow-up, report the blocking reason and stop.

## Return On Failure

Return:

- `final_status: "blocked"` or `final_status: "failed"`
- `clip_id`
- `project_id`
- `blocking_reason`
- `error.step` — which workflow stage failed
- `error.why_failed` and `error.how_to_fix`
- `qa.issues` if relevant
- export failure details when relevant
