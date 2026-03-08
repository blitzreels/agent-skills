# Example: YouTube Podcast to Vertical Clip

Use this flow when the caller gives a YouTube URL and wants one strong vertical podcast clip.

## 1. Create

```bash
curl -X POST https://www.blitzreels.com/api/v1/podcast-clips \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
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
      "style_id": "clean-bold"
    },
    "qa": {
      "qa_mode": "required"
    },
    "export": {
      "auto_export": false
    }
  }'
```

Save:

- `clip.clip_id`

## 2. Poll

```bash
curl https://www.blitzreels.com/api/v1/podcast-clips/{clip_id} \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Interpretation:

- if `next_action = "poll"`, keep polling
- if `next_action = "reselect"`, switch to another suggestion or a manual time range
- if `next_action = "repair"`, run one repair pass
- if `next_action = "export"`, export

## 3. Optional Reselect

Use this only if the API asks for reselection or the user wants a different segment.

```bash
curl -X POST https://www.blitzreels.com/api/v1/podcast-clips/{clip_id}/reselect \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": {
      "selection_mode": "time_range",
      "suggestion_id": null,
      "start_seconds": 138.9,
      "end_seconds": 307.285
    }
  }'
```

## 4. Optional Repair

Use this only if `next_action = "repair"`.

```bash
curl -X POST https://www.blitzreels.com/api/v1/podcast-clips/{clip_id}/repair \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "repair_mode": "auto"
  }'
```

## 5. Export

Only export when `next_action = "export"` and `qa.blocking = false`.

```bash
curl -X POST https://www.blitzreels.com/api/v1/podcast-clips/{clip_id}/export \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "1080p",
    "format": "mp4",
    "allow_blocking_qa_bypass": false
  }'
```

## 6. Final Checks

Return these fields to the caller:

- `clip.clip_id`
- `clip.project_id`
- `clip.clip_window`
- `clip.layout.applied_mode`
- `clip.layout.fallback_used`
- `clip.captions.status`
- `clip.qa.status`
- `clip.qa.issues`
- `clip.export.status`
- `clip.export.download_url`
