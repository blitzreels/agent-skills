---
name: blitzreels-clipping
description: Repurpose long-form video into short vertical clips with the BlitzReels API. Use when the task mentions clipping, repurposing a long video into shorts, YouTube-to-shorts, transcript-backed short suggestions, podcast-to-shorts reframing, split-speaker podcast layouts, highlight reel extraction, choosing the best moment from a long source, vertical video from horizontal, making TikToks or Reels or Shorts from a longer asset, repairing weak framing on an applied clip, or exporting a final vertical short. Also use when the user says "clip this", "cut me a short", "best parts of this video", or "repurpose this content".
---

# BlitzReels Clipping

Use the `/clips` resource as the primary clipping path. It wraps ingest, transcription, suggestion generation, layout, captions, and QA into a single state machine driven by `next_action`. The agent follows `next_action` rather than orchestrating individual stages.

The low-level staged endpoints (suggestion apply, preview-frames, timeline/media-views, etc.) exist for manual-control scenarios but should not be used unless the `/clips` resource cannot produce the result.

## Canonical Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/clips` | Create a clip run from an asset or YouTube URL |
| GET | `/clips/{clip_id}` | Poll state — auto-advances through all stages |
| POST | `/clips/{clip_id}/reselect` | Change suggestion or set absolute time range |
| POST | `/clips/{clip_id}/repair` | Run one bounded repair pass |
| POST | `/clips/{clip_id}/export` | Export a clip that is ready |

## User-Facing Workflow

Before creating a clip, let the user choose which segment to clip. This avoids wasting an API call on content the user doesn't want.

1. **Ingest and wait for suggestions.** Create the clip with `selection_mode: "auto_best"` and poll until `source.suggestions_status = "ready"`. The first poll response with suggestions will include `selection.alternatives`.

2. **Present suggestions to the user.** Show the ranked list from `selection.alternatives`:
   - title, hook, start/end timestamps, duration, score
   - Let the user pick one, or provide their own time range.

3. **If the user picks a different suggestion** than `auto_best` selected, call `POST /clips/{clip_id}/reselect` with `selection_mode: "suggestion"` and the chosen `suggestion_id`.

4. **If the user provides manual timestamps**, call `POST /clips/{clip_id}/reselect` with `selection_mode: "time_range"` and the absolute `start_seconds` + `end_seconds`.

5. **Continue the normal poll loop** — follow `next_action` until export.

If the user says "just pick the best one" or doesn't express a preference, skip step 2 and let `auto_best` proceed.

## Default Path

1. Create the clip with `POST /clips`.
2. Poll with `GET /clips/{clip_id}` while `next_action = "poll"`.
3. When suggestions are ready, present them to the user for selection (see above).
4. If `next_action = "reselect"`, pick another candidate from `selection.alternatives` or switch to a manual time range, then call `POST /clips/{clip_id}/reselect`.
5. If `next_action = "repair"`, call `POST /clips/{clip_id}/repair` once.
6. If `next_action = "export"`, call `POST /clips/{clip_id}/export`.
7. Keep polling until `status = "exported"`, `status = "failed"`, or `next_action = "stop"`.

The clip resource handles transcription, suggestion generation, reframe analysis, layout apply, captions, and QA internally. The agent never needs to call those endpoints directly.

## Default Request

```json
{
  "source": {
    "source_type": "youtube",
    "asset_id": null,
    "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
  },
  "selection": {
    "selection_mode": "auto_best",
    "suggestion_id": null,
    "start_seconds": null,
    "end_seconds": null
  },
  "target": {
    "aspect_ratio": "9:16",
    "max_duration_seconds": 75
  },
  "layout": {
    "layout_mode": "auto"
  },
  "captions": {
    "enabled": true,
    "style_id": "documentary"
  },
  "qa": {
    "qa_mode": "required"
  },
  "export": {
    "auto_export": false
  }
}
```

Overrides:

- If the user gives an existing asset, use `source_type: "asset"` with `asset_id`.
- If the user gives exact timestamps, use `selection_mode: "time_range"` with `start_seconds` and `end_seconds`.
- If the user picks a specific suggestion, use `selection_mode: "suggestion"` with `suggestion_id`.
- `layout_mode`: `"auto"` (default, evidence-based), `"prefer_split"` (forces dual-speaker split when evidence exists), `"prefer_focus"` (forces single-subject focus-cut).
- `qa_mode`: `"required"` blocks export on QA failure; `"permissive"` allows export with warnings.

Caption style defaults:

- `documentary` — default recommendation
- `full-sentence` — sentence captions with active-word emphasis
- `single-word-instant` — one-word-at-a-time captions
- Any custom theme UUID from `/caption-themes` — use a theme ID created via the caption themes skill

## Poll Fields

Read these fields on every `GET /clips/{clip_id}`:

- `status` — current workflow state
- `next_action` — what to do next (`poll`, `reselect`, `repair`, `export`, `stop`)
- `error` — structured error with `step`, `code`, `message`, `why_failed`, `how_to_fix`, and `retryable`
- `source.analysis_status`, `source.analysis_version`
- `source.transcript_status`, `source.suggestions_status`
- `source.canonical_duration_seconds` — best-available duration (max of transcript, suggestions, and asset metadata because any single source can be wrong)
- `selection.alternatives` — ranked suggestion list with scores (present these to the user for selection)
- `clip_window` — applied start/end/duration
- `layout.applied_mode`, `layout.primary_layout`, `layout.fallback_used`, `layout.warnings`
- `captions.status`, `captions.clip_window_aware`, `captions.warnings`
- `qa.status`, `qa.blocking`, `qa.issues`, `qa.preview_urls`, `qa.visual_debug_url`
- `export.status`, `export.download_url`, `export.short_download_url`

## Suggestion Presentation Format

When presenting suggestions to the user, format each alternative clearly:

**Example:**
```
Here are the best moments I found:

1. "Why Most Startups Fail" (score: 0.92)
   0:45 – 1:58 (73s)
   Hook: The number one reason startups fail isn't what you think

2. "The Hiring Mistake" (score: 0.85)
   3:12 – 4:28 (76s)
   Hook: We hired 10 people in 2 weeks and it nearly killed us

3. "Product-Market Fit Signal" (score: 0.78)
   7:01 – 8:15 (74s)
   Hook: The moment we knew we had product-market fit

Which one would you like to clip? Or give me a custom time range.
```

## Decision Rules

Fast path:

- if `qa.status = "passed"` and `next_action = "export"`, export

Blocked path — follow `next_action`, which will be one of:

- `"poll"` when `blocking_reason` is `source_not_ready`, `suggestions_not_ready`, or `analysis_not_ready` — the clip resource is still auto-advancing through preparation stages
- `"reselect"` when `blocking_reason` is `invalid_selection` (suggestion not found or time range invalid) or `letterbox_rejected` (planner couldn't achieve split/focus layout for podcast content — choose a different suggestion or time range)
- `"repair"` when `blocking_reason` is `visual_qa_failed` — QA found critical framing issues. Run one repair pass, then poll. If still blocked after repair, `next_action` switches to `"reselect"`
- `"stop"` when `status` is terminal (`exported` or `failed`)

Repair modes:

- `"auto"` — recommended default, re-runs reframe planning
- `"prefer_split"` — when the issue is speaker visibility in a podcast/interview
- `"prefer_focus"` — when the issue is weak single-subject framing
- `"move_captions_off_faces"` — when QA flagged caption-on-face overlap

## Download URLs

The API returns two download URLs:

- `export.download_url` — presigned S3 URL (long, expires in 1 hour)
- `export.short_download_url` — clean redirect URL like `https://www.blitzreels.com/api/v1/exports/{exportId}/download` (requires auth header, 302-redirects to the presigned URL)

When presenting the download link to the user, prefer `short_download_url` for readability.

## Reasoning Behind Key Constraints

- **Follow `next_action`, not assumptions**: the clip resource's state machine handles stage sequencing internally. Asset existence does not mean transcript, suggestions, or analysis are ready — `syncClip` checks each gate on every poll and auto-advances when ready.

- **One repair pass, then reselect**: the system caps automatic repair at one pass because repeated retries accumulate planner fallbacks (more letterbox segments) and degrade quality. After one repair, if QA still blocks, `next_action` switches to `"reselect"` so a different suggestion or time range can be tried.

- **Captions are clip-window-aware by default**: the clip resource applies captions scoped to the selected clip window. Source transcripts can span an entire hour — without scoping, a 90-second short would render captions from unrelated parts of the video.

- **Letterbox rejection for podcasts**: when `layout_mode` is `"auto"` and the planner can't achieve split/focus layouts (insufficient dual-speaker evidence), it rejects rather than silently exporting a low-quality letterboxed podcast clip.

- **Duration has three sources**: asset metadata (often wrong — reports full video length even after trimming), suggestion timing, and transcript timing. `canonical_duration_seconds` takes the max of all three to avoid clipping content.

## Output Contract

Return:

- `final_status`: `completed` | `blocked` | `failed`
- `clip_id`
- `project_id`
- `next_action` if not completed
- `blocking_reason` if blocked
- selected clip window
- applied layout mode and whether fallback was used
- captions status and whether clip-window-aware
- QA status and issues
- export status
- `short_download_url` when exported (prefer this over `download_url`)

## Manual-Control Fallback

When the `/clips` resource cannot produce the result (custom reframe plans, manual timeline edits, non-standard caption workflows), fall back to the staged endpoints. Read `references/staged-endpoints.md` for the full endpoint table and workflow.

## References

- Read `references/recovery.md` only when the clip is blocked or failed and `next_action` guidance is insufficient.
- Read `references/staged-endpoints.md` only when manual-control fallback is needed.
- Read `examples/youtube-to-shorts.md` only when a concrete execution example is needed.
