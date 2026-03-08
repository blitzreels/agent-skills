# Example: YouTube Video to Short Clip

Use this pattern when the user gives you a YouTube URL and wants one or more short vertical clips.

This is an orchestration example, not a single one-shot API call.

## Goal

- ingest the YouTube source
- confirm transcript readiness
- confirm short suggestions exist
- confirm automatic layout readiness when framing quality matters
- apply a chosen suggestion with automatic layout, smart crop, source-view podcast reframe, or ROI-aware reframing
- add clip-window-aware captions
- export the short

## Example Flow

1. Ingest stage:
   - use `POST /workspace/media/import/youtube`
2. Readiness stage:
   - poll `GET /workspace/media/assets/{assetId}`
   - confirm suggestions with `GET /workspace/media/assets/{assetId}/short-suggestions`
   - confirm layout readiness with `GET /workspace/media/assets/{assetId}/reframe-analysis`
   - if layout status is `missing`, queue `POST /workspace/media/assets/{assetId}/reframe-analysis`
3. Pick the strongest short suggestion based on hook quality and timing.
4. Apply stage:
   - prefer `POST /workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply` with `automatic_layout`
   - if the task is a podcast clip and the user wants inspectable planner output, prefer `POST /workspace/media/assets/{assetId}/reframe-plan` then `POST /workspace/media/assets/{assetId}/reframe-plan/apply`
   - prefer a derived vertical smart-crop asset
   - otherwise use source-view ROI-aware reframing or camera-plan motion
   - for podcast or interview clips, prefer `content_type_hint: "podcast"`
   - if the API returns `409` with `podcast_letterbox_rejected`, stop and report `final_status: "blocked"`
   - inspect `analysis_status`, `primary_layout`, `automatic_layout_fallback_used`, `speaker_aware_applied`, `layout_summary`, and `warnings`
   - fallback to manual timeline assembly only when needed
5. Captions and timeline verification stage:
   - verify `captions_added > 0`
   - verify with `GET /projects/{id}/context?mode=timeline`
   - confirm captions only cover the selected clip window
6. Export and verify:
   - `9:16` aspect ratio
   - duration matches the chosen suggestion window
   - no overlapping captions
   - framing uses split, focus, or another intentional layout instead of blind center crop

## Example Output Checklist

- source asset ID
- project ID
- chosen suggestion ID and time window
- analysis status
- reframing path used
- primary layout
- whether automatic layout fell back
- whether speaker-aware reframing was applied
- layout summary and warnings
- caption style used
- confirmation that captions were clip-window-aware
- export ID and download URL
- any ingest or timing inconsistency
