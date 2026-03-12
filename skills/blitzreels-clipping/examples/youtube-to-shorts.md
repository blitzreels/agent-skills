# Example: YouTube URL to Vertical Short

Use this flow when the caller gives a YouTube URL and wants one exported vertical short from the current public API.

## 1. Import The YouTube Source

```bash
curl -X POST https://www.blitzreels.com/api/v1/workspace/media/import/youtube \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }'
```

Save:

- `asset_id`

## 2. Create The Output Project

```bash
curl -X POST https://www.blitzreels.com/api/v1/projects \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "YouTube Short",
    "aspect_ratio": "9:16"
  }'
```

Save:

- `project_id`

## 3. Poll Transcript And Suggestions

```bash
curl https://www.blitzreels.com/api/v1/workspace/media/assets/{asset_id}/short-suggestions \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

If the deployment also exposes transcript polling on the project, verify transcript timing before trusting the clip window:

```bash
curl "https://www.blitzreels.com/api/v1/projects/{project_id}/transcript?media_id={asset_id}" \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Interpretation:

- keep polling until transcript timing exists and suggestions are non-empty
- do not assume YouTube import success means clipping is ready

## 4. Apply One Suggestion With Automatic Layout

Use the strongest public apply path first.
Include the project-binding field required by your deployed API; keep the `automatic_layout` block.

```bash
curl -X POST https://www.blitzreels.com/api/v1/workspace/media/assets/{asset_id}/short-suggestions/{suggestion_id}/apply \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "automatic_layout": {
      "enabled": true,
      "content_type_hint": "podcast",
      "layout_strategy": "auto",
      "aspect_ratio_override": "9:16"
    }
  }'
```

Inspect:

- `automatic_layout_applied`
- `analysis_status`
- `analysis_version`
- `layout_summary`
- `warnings`
- if present: `visual_qa_status`, `visual_qa`, `preview_frame_count`

If the clip is podcast or interview content and framing is weak, prefer planner or QA-assisted recovery before export.

## 5. Optional Visual QA

```bash
curl -X POST https://www.blitzreels.com/api/v1/projects/{project_id}/preview-frames \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 4
  }'
```

```bash
curl https://www.blitzreels.com/api/v1/projects/{project_id}/visual-debug \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Use this when:

- suggestion apply returns weak framing
- a podcast clip looks letterboxed or off-center
- you need evidence before retrying or repairing

## 6. Apply Clip-Window Captions

```bash
curl -X POST https://www.blitzreels.com/api/v1/projects/{project_id}/captions \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "style_id": "documentary"
  }'
```

Then verify:

```bash
curl "https://www.blitzreels.com/api/v1/projects/{project_id}/context?mode=timeline" \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Checks:

- captions are limited to the chosen clip window
- captions start near clip time `0`
- captions do not overlap or double-render

## 7. Export

```bash
curl -X POST https://www.blitzreels.com/api/v1/projects/{project_id}/export \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "1080p",
    "format": "mp4"
  }'
```

Poll with `GET /jobs/{jobId}` or `GET /exports/{exportId}` until the download URL is available.

## 8. Final Return

Return these fields to the caller:

- `final_status`
- `project_id`
- `asset_id`
- `suggestion_id`
- selected clip window
- reframing path used
- caption preset used
- QA status and issues when checked
- export status
- download URL
