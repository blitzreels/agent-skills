# Clipping Reference

Use this reference when the user wants to turn long-form video into short-form clips with captions and export.

## What Good Looks Like

- transcript exists and has non-zero words
- short suggestions exist
- chosen suggestion is applied to a project timeline
- the clip uses a smart-cropped vertical asset or ROI-aware reframing when available
- caption items exist on the timeline before export
- captions only cover the selected clip window
- there are no overlapping duplicate captions
- final export duration matches the chosen suggestion envelope within a small frame-rounding delta

## Preferred Flow

### Local file to exported short

Use this path when the user wants a reliable end-to-end result.

1. `POST /projects`
2. `POST /projects/{projectId}/media` with `file_name` and `content_type` to get upload info
3. `PUT` file to the presigned URL
4. `POST /projects/{projectId}/media` with `storage_key`, `file_name`, `content_type`, `file_size_bytes`, `auto_transcribe`, `auto_suggest_shorts`
5. Poll transcript readiness:
   - `GET /projects/{projectId}/transcript?media_id=...`
6. If transcript is still missing after project media processing is `completed`, recover with:
   - `POST /projects/{projectId}/transcribe`
   - then poll `GET /jobs/{jobId}`
7. Poll suggestions:
   - `GET /workspace/media/assets/{assetId}/short-suggestions`
8. Pick a suggestion and apply it through the strongest available path:
   - prefer a project or API flow that resolves the smart-cropped vertical asset
   - prefer a flow that inserts only caption overlaps for the chosen clip window
   - avoid static `fullscreen` crop plus later trim if a smarter path exists
9. Apply captions only for the chosen clip window:
   - if captions are attached by source asset timing, rebase them to the clip start
   - do not attach the entire source transcript to the project timeline
10. Verify timeline:
   - `GET /projects/{projectId}/context?mode=timeline`
   - confirm reframing is not just a static center crop unless no better option exists
   - confirm captions do not overlap or double-render
11. Export:
   - `POST /projects/{projectId}/export`
   - poll `GET /jobs/{jobId}` or `GET /exports/{exportId}`

### YouTube URL to suggestions

Use this when the user explicitly wants BlitzReels to fetch the YouTube video.

1. `POST /workspace/media/import/youtube`
2. Poll:
   - `GET /workspace/media/assets/{assetId}`
   - `GET /workspace/media/assets/{assetId}/short-suggestions`
3. Do not assume success means transcript or suggestions exist.
4. If the user needs a final exported short and the YouTube path does not produce transcript plus suggestions, fall back to a project-bound ingest path.

## Polling Rules

- Asset detail answers "is the media object created?" not "is clipping ready?"
- Transcript answers "can captions and suggestions trust text timing?"
- Short suggestions answer "is clipping ideation ready?"
- Timeline context answers "did the chosen clip and captions actually land in the project?"
- Export status answers "is the deliverable downloadable?"

## Apply Suggestion Manually

Public API does not currently expose a direct "create project from suggestion" flow. Apply it with:

1. Resolve the best clip source first
   - prefer a derived vertical smart-crop asset
   - otherwise use ROI or analysis-driven reframing
   - only use a static center crop as a fallback
2. Insert the clip with source trim values that match the suggestion window
3. Insert captions only where caption timing overlaps the chosen clip window
4. Rebase caption timeline start times so the clip begins at `0`
5. Verify the new timeline duration matches the suggestion window

Prefer transcript or suggestion timing over asset detail timing if they disagree.

## Known Failure Modes

### Processing complete, transcript missing

Meaning:
- ingest pipeline completed enough to mark the asset as processed
- transcription is not yet available or did not run

Recovery:
- call `POST /projects/{projectId}/transcribe`
- poll `GET /jobs/{jobId}`

### Transcript exists but suggestions are empty

Meaning:
- auto-suggest may not have run yet
- or the asset is not eligible

Recovery:
- poll again
- then use `POST /workspace/media/assets/{assetId}/short-suggestions` if available for the asset

### Durations disagree across endpoints

Treat this as a reliability risk.

Use this priority order:
1. chosen suggestion window
2. transcript timing
3. timeline context after trim
4. asset detail duration

### YouTube import gives media but no shorts

Treat YouTube workspace import as ingest-only until transcript and suggestions are confirmed.

## QA Checklist

- suggestion title matches the actual spoken content
- clip starts with a real hook in the first 1 to 2 seconds
- no dead air at the start or end
- framing follows the area of interest instead of a blind center crop when smart crop or analysis exists
- captions exist on the timeline
- captions are limited to the clip window
- no duplicate or overlapping caption overlays appear
- captions are readable against the video background
- export duration is close to the target clip duration
- export format and aspect ratio match the request

## Minimal Commands

```bash
# Poll transcript
bash scripts/blitzreels.sh GET "/projects/${PROJECT_ID}/transcript?media_id=${MEDIA_ID}"

# Poll suggestions
bash scripts/blitzreels.sh GET "/workspace/media/assets/${MEDIA_ID}/short-suggestions"

# Add and trim manually
bash scripts/editor.sh add-media "${PROJECT_ID}" "${MEDIA_ID}"
bash scripts/editor.sh trim "${PROJECT_ID}" "${ITEM_ID}" "${START_DELTA}" "${END_DELTA}"

# Apply captions and export
bash scripts/editor.sh captions "${PROJECT_ID}" viral-center
bash scripts/editor.sh export "${PROJECT_ID}" --resolution 1080p
```
