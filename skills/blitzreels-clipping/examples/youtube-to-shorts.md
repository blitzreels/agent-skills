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

## 2. Poll Until Suggestions Are Ready

```bash
curl https://www.blitzreels.com/api/v1/clips/{clip_id} \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Keep polling while `next_action = "poll"`. Once `source.suggestions_status = "ready"`, the response includes `selection.alternatives` — the ranked suggestion list.

## 3. Present Suggestions To The User

Show the user the available segments before proceeding:

```
Here are the best moments I found:

1. "Why Most Startups Fail" (score: 0.92)
   0:45 – 1:58 (73s)
   Hook: The number one reason startups fail isn't what you think

2. "The Hiring Mistake" (score: 0.85)
   3:12 – 4:28 (76s)
   Hook: We hired 10 people in 2 weeks and it nearly killed us

3. "Product-Market Fit Signal" (score: 0.78)
   7:01 – 8:15 (74s)
   Hook: The moment we knew we had product-market fit

Which one would you like to clip? Or give me a custom time range.
```

If `auto_best` already picked what the user wants, continue polling. Otherwise, reselect.

## 4. Optional Reselect

If the user picks a different suggestion:

```bash
curl -X POST https://www.blitzreels.com/api/v1/clips/{clip_id}/reselect \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "selection": {
      "selection_mode": "suggestion",
      "suggestion_id": "CHOSEN_SUGGESTION_ID",
      "start_seconds": null,
      "end_seconds": null
    }
  }'
```

If the user provides manual timestamps:

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

## 5. Optional Repair

Use this only if `next_action = "repair"`.

```bash
curl -X POST https://www.blitzreels.com/api/v1/clips/{clip_id}/repair \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "repair_mode": "auto"
  }'
```

## 6. Export

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

## 7. Final Return

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
- `clip.export.short_download_url` (clean URL, preferred)
- `clip.export.download_url` (presigned S3 URL, fallback)
