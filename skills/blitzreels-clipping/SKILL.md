---
name: blitzreels-clipping
description: Repurpose long-form video into short vertical clips with the BlitzReels API. Use when the task mentions clipping, repurposing a long video into shorts, YouTube-to-shorts, transcript-backed short suggestions, applying a suggestion to a project, adding captions before export, or exporting reels or TikToks from a longer source.
---

# BlitzReels Clipping

Use this skill when the task is specifically "long video to short clips".

This skill should prefer smart-cropped vertical video and clip-window-aware captions whenever the product supports them.

## Default Path

1. Create a `9:16` project if the user needs a final exported short.
2. Ingest media.
3. Wait for transcript readiness.
4. Poll short suggestions.
5. Apply one suggestion with smart crop or ROI-aware reframing, not a static center crop.
6. Apply captions only for the selected clip window.
7. Export and verify duration plus aspect ratio.

## Start Conditions

- If the source is a local file, prefer a project-bound upload flow.
- If the source is a YouTube URL, treat workspace import as ingest-first until transcript and suggestions are confirmed.
- If the source already lives in workspace media, confirm it has transcript and suggestions before building the short.

## Hard Rules

- Do not trust a single duration field blindly. Cross-check suggestion timing, transcript timing, and timeline context.
- Do not assume `auto_suggest_shorts=true` means suggestions are ready immediately.
- Do not export before caption items exist on the project timeline.
- Prefer a clipping path that uses a smart-cropped derived asset or ROI-aware reframing over a static `fullscreen` crop.
- Captions must be clip-window-aware. Do not attach the full asset transcript to a trimmed clip.
- If the public API cannot apply a suggestion with smart crop plus clip-window captions, fall back to the stronger internal project-clipping path or reconstruct that behavior manually.

## Endpoint Index

| Method | Path | Stage | Operator note |
|--------|------|-------|---------------|
| POST | `/workspace/media/import/youtube` | Ingest | Use for YouTube sources when the user explicitly wants workspace import. |
| POST | `/projects/{id}/media` | Ingest | Use for project-bound local or URL ingest when you need a reliable export path. |
| GET | `/workspace/media/assets/{assetId}` | Readiness | Confirms the media object exists; does not mean clipping is ready. |
| GET | `/projects/{id}/transcript` | Readiness | Use to confirm transcript timing before trusting captions or clip windows. |
| GET | `/workspace/media/assets/{assetId}/short-suggestions` | Readiness | Do not assume asset existence means suggestions are ready. |
| POST | `/workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply` | Apply | Prefer this when it preserves smart crop and clip-window-aware captions. |
| POST | `/projects/{id}/timeline/media` | Apply fallback | Fallback only when suggestion-apply is missing or weaker than manual assembly. |
| POST | `/projects/{id}/timeline/trim` | Apply fallback | Fallback only; use to reconstruct the suggestion window after timeline insert. |
| POST | `/projects/{id}/captions` | Captions | Captions must be clip-window-aware, not full-asset transcript overlays. |
| GET | `/projects/{id}/context?mode=timeline` | Timeline verify | Use to confirm the clip, captions, and reframing actually landed correctly. |
| POST | `/projects/{id}/export` | Export | Start export only after clip and captions are verified on the timeline. |
| GET | `/jobs/{jobId}` | Export polling | Poll async ingest, transcript, or export work until complete. |
| GET | `/exports/{exportId}` | Export polling | Use for final export status and download URL. |

## Companion References

- Read [../blitzreels-video-editing/references/clipping.md](../blitzreels-video-editing/references/clipping.md) for the full workflow.
- Read [../blitzreels-video-editing/references/caption-styles.md](../blitzreels-video-editing/references/caption-styles.md) only when a caption style choice matters.
- Read [../blitzreels-video-editing/references/timeline-ops.md](../blitzreels-video-editing/references/timeline-ops.md) only when you need extra timeline operations.
- Read [examples/youtube-to-shorts.md](examples/youtube-to-shorts.md) when you need a concrete clipping example.

## Output Expectations

Return:

- source asset and project IDs
- transcript readiness
- suggestions found
- chosen suggestion and time window
- reframing path used: smart-crop asset, ROI/camera-plan, or static fallback
- caption style used
- whether captions were clip-window-aware
- export ID and download URL
- any ingest or duration inconsistency that could affect reliability
