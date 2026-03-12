# Example: YouTube URL to Vertical Short

Use this flow when the caller gives a YouTube URL and wants one exported vertical short.

## 1. Create The Clip

```bash
curl -X POST https://www.blitzreels.com/api/v1/clips \
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
      "style_id": "documentary"
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
curl https://www.blitzreels.com/api/v1/clips/{clip_id} \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Interpretation:

- if `next_action = "poll"`, keep polling — the clip is auto-advancing through source import, transcription, suggestions, analysis, assembly, captions, and QA
- if `next_action = "reselect"`, switch to another suggestion or a manual time range
- if `next_action = "repair"`, run one repair pass
- if `next_action = "export"`, export

## 3. Optional Reselect

Use this only if `next_action = "reselect"`.

```bash
curl -X POST https://www.blitzreels.com/api/v1/clips/{clip_id}/reselect \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": {
      "selection_mode": "suggestion",
      "suggestion_id": "PICK_FROM_ALTERNATIVES",
      "start_seconds": null,
      "end_seconds": null
    }
  }'
```

Or use a manual time range:

```bash
curl -X POST https://www.blitzreels.com/api/v1/clips/{clip_id}/reselect \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": {
      "selection_mode": "time_range",
      "suggestion_id": null,
      "start_seconds": 138.9,
      "end_seconds": 207.3
    }
  }'
```

## 4. Optional Repair

Use this only if `next_action = "repair"`.

```bash
curl -X POST https://www.blitzreels.com/api/v1/clips/{clip_id}/repair \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "repair_mode": "auto"
  }'
```

## 5. Export

Only export when `next_action = "export"` and `qa.blocking = false`.

```bash
curl -X POST https://www.blitzreels.com/api/v1/clips/{clip_id}/export \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "1080p",
    "format": "mp4",
    "allow_blocking_qa_bypass": false
  }'
```

## 6. Final Return

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
