# Example: YouTube Video to Short Clip

Use this pattern when the user gives you a YouTube URL and wants one or more short vertical clips.

## Goal

- ingest the YouTube source
- confirm transcript readiness
- confirm short suggestions exist
- confirm automatic layout readiness when framing quality matters
- apply a chosen suggestion with automatic layout
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
   - prefer `POST /workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply`
   - set `automatic_layout.enabled: true`
   - for podcast or interview clips, prefer `content_type_hint: "podcast"`
   - inspect `analysis_status`, `primary_layout`, `automatic_layout_fallback_used`, and `warnings`
   - fallback to `POST /workspace/media/assets/{assetId}/reframe-plan/apply` or manual timeline assembly only when needed
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
- caption style used
- confirmation that captions were clip-window-aware
- export ID and download URL
- any ingest or timing inconsistency
