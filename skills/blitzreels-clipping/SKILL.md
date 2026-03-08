---
name: blitzreels-clipping
description: Repurpose long-form video into short vertical clips with the BlitzReels API. Use when the task mentions clipping, repurposing a long video into shorts, YouTube-to-shorts, transcript-backed short suggestions, applying a suggestion to a project, podcast-to-shorts reframing, split-speaker podcast clips, adding captions before export, or exporting reels or TikToks from a longer source.
---

# BlitzReels Clipping

Use this skill when the task is specifically "long video to short clips".

This skill should prefer smart-cropped vertical video, source-view ROI-aware reframing, automatic layout planning, and clip-window-aware captions whenever the product supports them.

Current API shape: clipping is a multi-step orchestration built from ingest, transcript, suggestion, automatic layout, preview, visual QA, repair, caption, and export endpoints. There is no one-shot public endpoint that takes a YouTube URL and returns a finished short.

Default assumption: use planner-first clipping, not static center crop. Prefer automatic layout from reframe analysis. Treat derived smart-crop video as optional legacy help, not the canonical path.

## Default Path

1. Create a `9:16` project if the user needs a final exported short.
2. Ingest media.
3. Wait for transcript readiness.
4. Poll short suggestions.
5. If framing quality matters, confirm reframe analysis readiness before apply.
6. Apply one suggestion with automatic layout enabled.
7. For podcast or two-speaker clips, run visual QA before export.
8. If visual QA fails, prefer one repair pass over exporting a bad frame.
9. Verify captions were added only for the selected clip window.
10. Export and verify duration plus aspect ratio.

## Normal Podcast Path

For podcast, interview, or two-speaker clipping, the normal flow is now:

1. apply clip
2. render preview frames
3. run visual analysis
4. inspect visual debug if needed
5. if blocked, try one repair path
6. rerender previews
7. rerun visual analysis
8. export only if QA passed

Default QA gate for podcast:

- blocking by default
- no invalid crop values
- no thin strip inside a large wrapper
- no obvious face loss from bad crop
- no captions sitting on faces when split gap or free space exists
- only bypass if the caller explicitly sets `allow_unverified_export: true`

## Start Conditions

- If the source is a local file, prefer a project-bound upload flow.
- If the source is a YouTube URL, treat workspace import as ingest-first until transcript and suggestions are confirmed.
- If the source already lives in workspace media, confirm it has transcript and suggestions before building the short.
- If the user explicitly wants podcast clipping, two-speaker reframing, host/guest split, or source-view layouts, read `../blitzreels-video-editing/references/podcast-reframe.md` before applying the suggestion or generating a reframe plan.

## Hard Rules

- Do not trust a single duration field blindly. Cross-check suggestion timing, transcript timing, and timeline context.
- Do not assume `auto_suggest_shorts=true` means suggestions are ready immediately.
- Do not export before caption items exist on the project timeline.
- Do not imply that the public API has a single endpoint that takes a YouTube URL and fully completes clipping in one request.
- Prefer a clipping path that uses automatic layout, a smart-cropped derived asset, or ROI-aware reframing over a static `fullscreen` crop.
- For podcast clips, prefer the public reframe analysis/plan/apply endpoints or `automatic_layout` on suggestion apply over a baked smart-crop asset.
- Captions must be clip-window-aware. Do not attach the full asset transcript to a trimmed clip.
- If `automatic_layout_applied=true`, still inspect `primary_layout`, `automatic_layout_fallback_used`, and `layout_summary`. Do not assume that means the clip got a strong split or focus layout.
- If suggestion apply returns `409` with `podcast_letterbox_rejected`, stop and report `final_status: "blocked"`. Do not export a fallback-heavy podcast letterbox result unless the caller explicitly asked for letterbox.
- For podcast or two-speaker clips, do not treat suggestion apply success as enough. Check `visual_qa_status`, `visual_qa_required`, `visual_qa_passed`, and `preview_frame_count`.
- If suggestion apply returns `409` with `podcast_visual_qa_failed`, stop and inspect the returned visual QA payload. Do not export unless the caller explicitly asked for `allow_unverified_export: true`.
- If visual QA says the clip is blocked, prefer `reframe-plan/preview`, project preview endpoints, visual debug, and media-view repair over blind retries.
- If the public API cannot apply a suggestion with automatic layout plus clip-window captions, fall back to the stronger project-clipping path or reconstruct that behavior manually.

## Endpoint Index

| Method | Path | Stage | Operator note |
|--------|------|-------|---------------|
| POST | `/workspace/media/import/youtube` | Ingest | Use for YouTube sources when the user explicitly wants workspace import. |
| POST | `/projects/{id}/media` | Ingest | Use for project-bound local or URL ingest when you need a reliable export path. |
| GET | `/workspace/media/assets/{assetId}` | Readiness | Confirms the media object exists; does not mean clipping is ready. |
| GET | `/workspace/media/assets/{assetId}/reframe-analysis` | Layout readiness | Read current public automatic-layout analysis state and summary. |
| POST | `/workspace/media/assets/{assetId}/reframe-analysis` | Layout readiness | Queue or materialize reframe analysis before plan/apply when needed. |
| POST | `/workspace/media/assets/{assetId}/reframe-plan` | Layout planning | Generate an inspectable automatic-layout plan with segments, views, and warnings. |
| POST | `/workspace/media/assets/{assetId}/reframe-plan/preview` | Layout planning | Generate an inspectable automatic-layout plan plus still previews before apply. |
| POST | `/workspace/media/assets/{assetId}/reframe-plan/apply` | Layout apply | Apply the public source-view reframe plan to a project timeline. |
| GET | `/projects/{id}/transcript` | Readiness | Use to confirm transcript timing before trusting captions or clip windows. |
| GET | `/workspace/media/assets/{assetId}/short-suggestions` | Readiness | Do not assume asset existence means suggestions are ready. |
| POST | `/workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply` | Apply | Prefer this with `automatic_layout` when you want one-call clipping plus planner-backed layout. |
| POST | `/projects/{id}/preview-frame` | Visual QA | Render one still for quick verification. |
| POST | `/projects/{id}/preview-frames` | Visual QA | Render several ordered stills for QA. |
| POST | `/projects/{id}/visual-analysis` | Visual QA | Get structured issues from preview stills. |
| GET | `/projects/{id}/visual-debug` | Visual QA | Inspect layout geometry, visible rects, crops, and caption rects. |
| POST | `/projects/{id}/timeline/media-views/{timelineItemId}` | Repair | Upsert crop/canvas/fit/planner state for one item. |
| POST | `/projects/{id}/timeline/media-views/duplicate` | Repair | Duplicate a linked source view to another item for split layouts. |
| POST | `/projects/{id}/timeline/media` | Apply fallback | Fallback only when suggestion-apply is missing or weaker than manual assembly. |
| POST | `/projects/{id}/timeline/trim` | Apply fallback | Fallback only; use to reconstruct the suggestion window after timeline insert. |
| INTERNAL | `timeline.generateReframePlan` | Podcast reframe | Internal app/editor API only. Use only when operating inside the editor stack and the public API is unavailable. |
| INTERNAL | `timeline.applyReframePlan` | Podcast reframe | Internal app/editor API only. Use only when operating inside the editor stack and the public API is unavailable. |
| POST | `/projects/{id}/captions` | Captions | Captions must be clip-window-aware, not full-asset transcript overlays. |
| GET | `/projects/{id}/context?mode=timeline` | Timeline verify | Use to confirm the clip, captions, and reframing actually landed correctly. |
| POST | `/projects/{id}/export` | Export | Start export only after clip and captions are verified on the timeline. |
| GET | `/jobs/{jobId}` | Export polling | Poll async ingest, transcript, or export work until complete. |
| GET | `/exports/{exportId}` | Export polling | Use for final export status and download URL. |

## Default Hints

- For podcast, interview, or two-speaker sources:
  - `automatic_layout.enabled: true`
  - `automatic_layout.content_type_hint: "podcast"`
  - `automatic_layout.layout_strategy: "auto"`
- For tutorial or screen-recording sources:
  - `automatic_layout.enabled: true`
  - `automatic_layout.content_type_hint: "tutorial"`
  - `automatic_layout.layout_strategy: "focus"`
- If the project already has the target aspect ratio, do not send a conflicting `aspect_ratio_override`.

## Companion References

- Read [../blitzreels-video-editing/references/clipping.md](../blitzreels-video-editing/references/clipping.md) for the full workflow.
- Read [../blitzreels-video-editing/references/podcast-reframe.md](../blitzreels-video-editing/references/podcast-reframe.md) when the user wants podcast-to-shorts, split-speaker layouts, or source-view reframing.
- Read [../blitzreels-video-editing/references/caption-styles.md](../blitzreels-video-editing/references/caption-styles.md) only when a caption style choice matters.
- Read [../blitzreels-video-editing/references/timeline-ops.md](../blitzreels-video-editing/references/timeline-ops.md) only when you need extra timeline operations.
- Read [references/recovery.md](references/recovery.md) when a stage is blocked, missing, or failed.
- Read [examples/youtube-to-shorts.md](examples/youtube-to-shorts.md) when you need a concrete clipping example.

## Output Expectations

Return:

- final status: `completed`, `blocked`, or `failed`
- next action if not completed
- blocking reason if blocked
- source asset and project IDs
- transcript readiness
- suggestions found
- chosen suggestion and time window
- analysis status and analysis version
- reframing path used: `automatic_layout` on suggestion apply, explicit reframe plan/apply, smart-crop asset, ROI/camera-plan, or static fallback
- primary layout used
- layout summary and any warnings or fallback reasons
- whether automatic layout fell back
- whether speaker-aware podcast reframing was applied
- visual QA status
- whether visual QA was required
- whether visual QA passed
- preview frame count
- whether QA was bypassed
- caption style used
- whether captions were clip-window-aware
- captions added count
- export ID and download URL
- any ingest or duration inconsistency that could affect reliability
