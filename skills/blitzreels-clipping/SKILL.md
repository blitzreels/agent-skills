---
name: blitzreels-clipping
description: Repurpose long-form video into short vertical clips with the BlitzReels API. Use when the task mentions clipping, repurposing a long video into shorts, YouTube-to-shorts, transcript-backed short suggestions, podcast-to-shorts reframing, split-speaker podcast layouts, highlight reel extraction, choosing the best moment from a long source, vertical video from horizontal, making TikToks or Reels or Shorts from a longer asset, repairing weak framing on an applied clip, or exporting a final vertical short. Also use when the user says "clip this", "cut me a short", "best parts of this video", or "repurpose this content".
---

# BlitzReels Clipping

Use this skill for outcome-level long-form-to-short workflows.

Clipping is a staged workflow: ingest, transcript, short suggestions, automatic layout or reframe planning, preview or visual QA, clip-window captions, and export. Each stage has its own readiness gate because earlier stages (like ingest) can complete before later ones (like transcript or suggestions) are ready. The old one-shot clipping resource was deprecated because it skipped these gates and produced clips with missing captions, wrong framing, or bad duration.

Keep the workflow stage-driven:

- prefer automatic layout over manual timeline assembly because it analyzes faces, subjects, and motion tracks to produce tighter vertical framing — manual mode just letterboxes and leaves dead space
- prefer the reframe-analysis + reframe-plan path when the user wants to inspect or adjust the plan before committing, or when suggestion apply already failed once
- use preview or visual QA before retrying a weak podcast clip because the system caps automatic repair at one pass — beyond that, human judgment is needed
- fall back to low-level `timeline/media` or `timeline/trim` only when the public apply paths cannot produce the result, since those bypass layout intelligence

## Default Path

1. Create a `9:16` project if the user needs a final exported short.
2. Ingest media.
3. Wait for transcript readiness.
4. Wait for short suggestions.
5. Apply one suggestion with the strongest public layout path:
   - default: `POST /workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply`
   - use `reframe-analysis` plus `reframe-plan` or `reframe-plan/apply` when the user wants inspectable planner output or tighter control
6. For podcast, interview, or two-speaker clips, verify framing before export when preview or QA endpoints are available.
7. Apply clip-window-aware captions.
8. Verify the timeline and export.

## Canonical Endpoints

Use these endpoints for normal clipping:

| Method | Path | Stage | Use |
|--------|------|-------|-----|
| POST | `/projects` | Project | Create export target |
| POST | `/workspace/media/import/youtube` | Ingest | Import a YouTube source into workspace media |
| POST | `/projects/{id}/media` | Ingest | Ingest local file or URL into a project |
| GET | `/projects/{id}/transcript` | Readiness | Confirm transcript timing before trusting captions or clip windows |
| GET | `/workspace/media/assets/{assetId}/short-suggestions` | Readiness | Poll until suggestions exist |
| GET | `/workspace/media/assets/{assetId}/reframe-analysis` | Layout readiness | Inspect current automatic-layout analysis state |
| POST | `/workspace/media/assets/{assetId}/reframe-analysis` | Layout readiness | Trigger analysis when apply or planning needs it |
| POST | `/workspace/media/assets/{assetId}/reframe-plan` | Layout planning | Generate inspectable plan output |
| POST | `/workspace/media/assets/{assetId}/reframe-plan/apply` | Layout apply | Apply the public reframe plan to the timeline |
| POST | `/workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply` | Layout apply | Default one-call suggestion apply with `automatic_layout` |
| POST | `/projects/{id}/preview-frames` | QA | Render ordered stills for visual verification |
| POST | `/projects/{id}/visual-analysis` | QA | Run structured frame QA |
| GET | `/projects/{id}/visual-debug` | QA | Inspect layout geometry and crops |
| POST | `/projects/{id}/timeline/media-views/{timelineItemId}` | Repair | Upsert source-view crop or canvas state for one item |
| POST | `/projects/{id}/timeline/media-views/duplicate` | Repair | Duplicate a linked source view for split layouts |
| POST | `/projects/{id}/captions` | Captions | Apply a caption preset to the selected clip window |
| GET | `/projects/{id}/context?mode=timeline` | Verify | Confirm clip, captions, and framing landed correctly |
| POST | `/projects/{id}/export` | Export | Start final export |
| GET | `/jobs/{jobId}` | Export polling | Poll async jobs |
| GET | `/exports/{exportId}` | Export polling | Get export status and download URL |

## Default Hints

Use these defaults unless the user overrides them:

- target aspect ratio: `9:16`
- suggestion apply: `automatic_layout.enabled = true`
- `content_type_hint` biases segment-level layout decisions (it does not control aspect ratio or cropping directly):
  - `"podcast"` — prefers split-speaker or focus-cut layouts when dual-speaker evidence exists
  - `"tutorial"` — avoids split layout, favors focus-cut or letterbox since screen content matters more than faces
  - `"generic"` — no bias, uses evidence-based decisions
- `layout_strategy` is a hard constraint (unlike hint which is a preference):
  - `"auto"` (default) — evidence-based, recommended in most cases
  - `"split"` — forces dual-speaker split if evidence supports it, falls back with a warning otherwise
  - `"focus"` — forces single-subject focus-cut if a dominant subject exists
  - `"letterbox"` — forces letterbox on all segments regardless of evidence
- only send `automatic_layout.aspect_ratio_override` when the project is not already `9:16`

Caption style defaults:

- `documentary` as the default recommendation
- `full-sentence` for sentence captions with active-word emphasis
- `single-word-instant` for one-word-at-a-time captions

## Decision Rules

Read these signals after suggestion apply or planner apply:

- `automatic_layout_applied`
- `analysis_status`
- `analysis_version`
- `layout_summary`
- `warnings`
- if exposed by the deployment: `visual_qa_status`, `visual_qa_required`, `visual_qa_passed`, `visual_qa`, `preview_frame_count`

Fast path:

- if framing is good, captions are clip-window-aware, and the timeline verifies cleanly, export

Blocked path:

- transcript missing after ingest completes — recover transcript before clipping, because captions and clip windows depend on transcript timing
- suggestions missing — keep polling; only call a suggestion-generation endpoint if that deployment explicitly exposes one
- `409 podcast_letterbox_rejected` — the planner couldn't find enough dual-speaker or subject evidence to produce split/focus layouts, so it fell back to mostly-letterbox segments. This blocks export because letterbox podcast clips have poor vertical density. Choose a different suggestion or try the reframe-plan path with adjusted hints
- `409 podcast_visual_qa_failed` — automated frame inspection found critical issues (missing faces, thin strip splits, captions overlapping faces). Inspect the returned issue list and suggested fixes, try one repair pass via `timeline/media-views`, then recheck QA
- captions cover the full source instead of the selected window — source transcripts span the entire asset, so a trimmed short would show captions from completely unrelated parts of the video. Rebuild captions for the clip window before export

## Reasoning Behind Key Constraints

These constraints exist because of real failure modes in the pipeline:

- **Stage gates matter**: asset existence does not mean transcript or suggestions are ready. Ingest, transcription, and suggestion generation are async — proceeding early produces clips with no captions, wrong timing, or no highlight selection.

- **Duration has three sources**: asset metadata (often wrong — reports full video length even after trimming), suggestion timing, and transcript timing (maximum end time of detected speech). The system takes the maximum of all three to avoid clipping content. Prefer suggestion timing for clip windows, transcript timing for caption alignment.

- **One repair pass, then stop**: the system automatically attempts one repair pass after suggestion apply. Beyond that, each retry can accumulate planner fallbacks (more letterbox segments) and degrade quality. Inspect `layout_summary`, previews, or visual-debug data to understand what went wrong before deciding the next action.

- **Clip-window captions**: source transcripts can span an entire hour-long podcast. Without clip-window scoping, a 90-second short would render captions from random parts of the source. The captions endpoint calculates overlap with the trimmed window and only includes matching portions.

- **Letterbox risk for podcasts**: podcast clips with `content_type_hint = "podcast"` are expected to have tight speaker framing. When the planner can't achieve that, it surfaces the risk rather than silently exporting a low-quality letterboxed clip.

## Output Contract

Return:

- `final_status`: `completed` | `blocked` | `failed`
- `project_id`
- `asset_id`
- chosen suggestion and clip window
- transcript readiness
- suggestions readiness
- analysis status and analysis version when used
- reframing path used: `suggestion-apply`, `reframe-plan/apply`, or `manual-fallback`
- primary layout or fallback summary
- caption preset used
- whether captions were clip-window-aware
- QA status and issues when checked
- export status
- download URL when exported

## References

- Read `../blitzreels-video-editing/references/clipping.md` for the full staged workflow.
- Read `../blitzreels-video-editing/references/podcast-reframe.md` when the clip is podcast, interview, or two-speaker content.
- Read `../blitzreels-video-editing/references/caption-styles.md` only when caption preset choice matters.
- Read `references/recovery.md` only when the flow is blocked, degraded, or failed.
- Read `examples/youtube-to-shorts.md` only when a concrete clipping example is needed.
