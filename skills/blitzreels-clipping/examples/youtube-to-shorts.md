# Example: YouTube Video to Short Clip

Use this pattern when the user gives you a YouTube URL and wants one or more short vertical clips.

This is an orchestration example, not a single one-shot API call.

## Goal

- ingest the YouTube source
- confirm transcript readiness
- confirm short suggestions exist
- apply a chosen suggestion with smart crop or ROI-aware reframing
- add clip-window-aware captions
- export the short

## Example Flow

1. Ingest stage:
   - use `POST /workspace/media/import/youtube`
2. Readiness stage:
   - poll `GET /workspace/media/assets/{assetId}`
   - confirm transcript with `GET /projects/{id}/transcript` when working from a project-bound path
   - confirm suggestions with `GET /workspace/media/assets/{assetId}/short-suggestions`
3. Pick the strongest short suggestion based on hook quality and timing.
4. Apply stage:
   - prefer `POST /workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply`
   - prefer a derived vertical smart-crop asset
   - otherwise use ROI-aware reframing or camera-plan motion
   - avoid static center crop unless there is no better option
   - fallback to `POST /projects/{id}/timeline/media` plus `POST /projects/{id}/timeline/trim` only when needed
5. Captions and timeline verification stage:
   - use `POST /projects/{id}/captions`
   - verify with `GET /projects/{id}/context?mode=timeline`
   - insert captions only for the selected clip window
6. Export and polling stage:
   - use `POST /projects/{id}/export`
   - poll with `GET /jobs/{jobId}` or `GET /exports/{exportId}`
7. Verify:
   - `9:16` aspect ratio
   - duration matches the chosen suggestion window
   - no overlapping captions
   - framing follows the subject instead of the center by default

## Example Output Checklist

- source asset ID
- project ID
- chosen suggestion ID and time window
- reframing path used
- caption style used
- confirmation that captions were clip-window-aware
- export ID and download URL
- any ingest or timing inconsistency
