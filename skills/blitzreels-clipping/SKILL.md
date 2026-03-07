---
name: blitzreels-clipping
description: Repurpose long-form video into short vertical clips with the BlitzReels API. Use when the task mentions clipping, repurposing a long video into shorts, YouTube-to-shorts, transcript-backed short suggestions, applying a suggestion to a project, adding captions before export, or exporting reels or TikToks from a longer source.
---

# BlitzReels Clipping

Use this skill when the task is specifically "long video to short clips".

Current API shape: clipping is a multi-step orchestration built from ingest, transcript, suggestion, automatic layout, caption, and export endpoints. There is no one-shot public endpoint that takes a YouTube URL and returns a finished short.

Default assumption: use planner-first clipping, not static center crop. Prefer automatic layout from reframe analysis. Treat derived smart-crop video as optional legacy help, not the canonical path.

## Default Path

1. Create a `9:16` project if the user needs a final exported short.
2. Ingest media.
3. Wait for transcript readiness.
4. Poll short suggestions.
5. If framing quality matters, confirm reframe analysis readiness before apply.
6. Apply one suggestion with automatic layout enabled.
7. Verify captions were added only for the selected clip window.
8. Export and verify duration plus aspect ratio.

## Start Conditions

- If the source is a local file, prefer a project-bound upload flow.
- If the source is a YouTube URL, treat workspace import as ingest-first until transcript and suggestions are confirmed.
- If the source already lives in workspace media, confirm it has transcript and suggestions before building the short.

## Hard Rules

- Do not trust a single duration field blindly. Cross-check suggestion timing, transcript timing, and timeline context.
- Do not assume `auto_suggest_shorts=true` means suggestions are ready immediately.
- Do not export before caption items exist on the project timeline.
- Prefer automatic layout from reframe analysis over a static `fullscreen` crop.
- Captions must be clip-window-aware. Do not attach the full asset transcript to a trimmed clip.
- If `automatic_layout_applied=true`, still inspect `primary_layout`, `automatic_layout_fallback_used`, and `layout_summary`. Do not assume that means the clip got a strong split or focus layout.
- If the public API cannot apply a suggestion with automatic layout plus clip-window captions, fall back to manual timeline assembly and rebase captions to the clip window.

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
- reframing path used: suggestion-apply, reframe-plan apply, or manual fallback
- primary layout used
- whether automatic layout fell back
- caption style used
- whether captions were clip-window-aware
- captions added count
- export ID and download URL
- any ingest or duration inconsistency that could affect reliability
