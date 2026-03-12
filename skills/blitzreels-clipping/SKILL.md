---
name: blitzreels-clipping
description: Convert long-form videos into short vertical clips with the BlitzReels Podcast Clipping API. Use when the request is about clipping, YouTube-to-shorts, podcast/interview-to-Reels, transcript-backed highlight extraction, selecting the best moment from a long source, repairing blocked clip candidates, or exporting final vertical shorts.
---

# BlitzReels Clipping

Use this skill for outcome-level clipping.

Prefer the `podcast-clips` resource and its `next_action` state machine. Do not orchestrate low-level editor primitives unless the user explicitly asks for manual timeline editing.

## API Base + Discovery

- Prefer `https://www.blitzreels.com/api/v1` for API calls.
- Treat OpenAPI as canonical contract: `https://www.blitzreels.com/api/openapi.json`.
- If a payload field is unclear, verify it in OpenAPI before sending.

## Canonical Endpoints

Use only these endpoints for normal clipping:

- `POST /podcast-clips` — create one clipping run from an uploaded asset or YouTube URL
- `GET /podcast-clips/{clip_id}` — poll state and inspect QA evidence
- `POST /podcast-clips/{clip_id}/reselect` — change suggestion or set absolute time range
- `POST /podcast-clips/{clip_id}/repair` — run one bounded repair pass
- `POST /podcast-clips/{clip_id}/export` — export a clip that is ready

One deliverable clip = one `podcast_clip` resource.

## Default Request

Use these defaults unless the user overrides them:

- `target.aspect_ratio: "9:16"`
- `selection.selection_mode: "auto_best"`
- `layout.layout_mode: "auto"`
- `captions.enabled: true`
- `qa.qa_mode: "required"`
- `export.auto_export: false`

Caption style defaults:

- `captions.style_id: "cinematic-doc-v1"` (recommended default)
- `captions.style_id: "full-sentence"` for sentence captions with subtle active-word highlight
- `captions.style_id: "single-word-instant"` for one-word-at-a-time captions

Selection overrides:

- If user gives exact timestamps, use `selection_mode: "time_range"` with absolute `start_seconds` + `end_seconds`.
- If user picks a specific candidate, use `selection_mode: "suggestion"` with `suggestion_id`.

## Execution Loop

1. Create run with `POST /podcast-clips`.
2. Poll with `GET /podcast-clips/{clip_id}` while `next_action = "poll"`.
3. If `next_action = "reselect"`, use `selection.alternatives` or manual range, then call `POST /podcast-clips/{clip_id}/reselect`.
4. If `next_action = "repair"`, run one repair pass with `POST /podcast-clips/{clip_id}/repair`.
5. If `next_action = "export"`, call `POST /podcast-clips/{clip_id}/export`.
6. Continue until terminal state (`status = "exported" | "failed"`) or `next_action = "stop"`.

Never infer next steps from assumptions; always follow `next_action`.

## Poll Fields to Read Every Time

- `status`
- `next_action`
- `blocking_reason`
- `source.analysis_status`
- `source.analysis_version`
- `selection.alternatives`
- `clip_window`
- `layout.applied_mode`
- `layout.fallback_used`
- `captions.status`
- `captions.clip_window_aware`
- `qa.status`
- `qa.blocking`
- `qa.issues`
- `qa.preview_urls`
- `qa.visual_debug_url`
- `export.status`

## Decision Rules

Fast path:

- If `qa.status = "passed"` and `next_action = "export"`, export.

Blocked path:

- `blocking_reason = "analysis_not_ready"` → keep polling
- `blocking_reason = "podcast_letterbox_rejected"` → reselect
- `blocking_reason = "invalid_selection"` → reselect
- `blocking_reason = "podcast_visual_qa_failed"` → repair once, then reselect if still blocked
- `blocking_reason = "clip_window_caption_mismatch"` → do not export

## Hard Rules

- Do not call low-level endpoints (`preview-frame`, `preview-frames`, `visual-analysis`, `timeline/trim`, `timeline/media`, `reframe-plan/apply`) while this skill is active.
- Do not call `POST /workspace/media/assets/{assetId}/reframe-analysis` during normal clipping; `POST /podcast-clips` triggers required analysis.
- Do not export when `qa.blocking = true` unless user explicitly asks to bypass and accepts quality risk.
- Do not run repeated repair loops by default. One repair pass, then reselect.
- Do not manually rebuild captions for clipping flow; trust clip-level caption status fields.
- Do not invent QA timestamps; use returned preview/debug evidence URLs only.
- Do not silently accept fallback-heavy letterbox for podcast clipping.

## Output Contract

Return:

- `final_status`: `completed` | `blocked` | `failed`
- `clip_id`
- `project_id`
- `next_action` (if not completed)
- `blocking_reason` (if blocked)
- selected clip window
- applied layout mode
- fallback used or not
- captions status
- QA status + issues
- export status
- download URL (when exported)

## References

- Read `references/recovery.md` only when clip is blocked or failed.
- Read `examples/youtube-to-shorts.md` only when a concrete execution example is needed.
