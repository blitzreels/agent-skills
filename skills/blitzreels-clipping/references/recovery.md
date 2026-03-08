# Clipping Recovery

Use this reference only when a `podcast_clip` is blocked or failed.

Primary rule:

- trust `next_action`
- use `status` and `blocking_reason` as supporting context

## `next_action = "poll"`

Meaning:

- source import, transcription, suggestion generation, assembly, QA, or export is still running

What to do:

1. Call `GET /podcast-clips/{clip_id}` again.
2. Keep polling until `next_action` changes or `status` becomes terminal.

Do not:

- trigger low-level transcript tools
- trigger suggestion generation manually
- render your own preview frames

## `next_action = "reselect"`

Common reasons:

- `blocking_reason = "invalid_selection"`
- `blocking_reason = "podcast_letterbox_rejected"`
- repair did not produce a safe result

What to do:

1. Inspect `selection.alternatives`.
2. Pick another suggestion if one is available.
3. If no good suggestion exists, use a manual absolute `time_range`.
4. Call `POST /podcast-clips/{clip_id}/reselect`.

Do not:

- export a fallback-heavy letterbox clip
- keep retrying the same rejected selection

## `next_action = "repair"`

Common reason:

- `blocking_reason = "podcast_visual_qa_failed"`

What to do:

1. Inspect `qa.issues`.
2. Run exactly one repair pass with `POST /podcast-clips/{clip_id}/repair`.
3. Poll the clip again.
4. If the clip is still blocked, reselect instead of looping repairs.

Preferred repair modes:

- `auto` first
- `prefer_split` if the issue is speaker visibility or split composition
- `prefer_focus` if the issue is weak focus framing
- `move_captions_off_faces` if the issue is caption overlap

## `next_action = "export"`

Meaning:

- the clip is ready to deliver

What to do:

1. Confirm `qa.blocking = false`.
2. Call `POST /podcast-clips/{clip_id}/export`.
3. Poll until export completes.

Do not:

- bypass QA unless the user explicitly asks for it

## `next_action = "stop"`

Meaning:

- the run is terminal for now

What to do:

1. If `status = "exported"`, return the download URL.
2. If `status = "failed"`, surface the failure clearly.
3. If the clip is blocked without a valid follow-up action, report the blocking reason and stop.

## Terminal Failure

Treat the run as failed when:

- `status = "failed"`
- `export.status = "failed"`
- the API returns a non-retryable error

Return:

- `final_status: "failed"`
- `clip_id`
- `blocking_reason` if present
- `qa.issues` if relevant
- any export failure details
