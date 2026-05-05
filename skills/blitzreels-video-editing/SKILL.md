---
name: blitzreels-video-editing
description: "Video editing workflows with BlitzReels API: upload, transcribe, timeline editing, captions, transcript corrections, media-library asset lookup, overlays, backgrounds, export, workspace settings, and source-view ROI-aware reframing. Use this whenever a user asks an agent to edit an existing BlitzReels project, copy fixes from a previous video, manipulate timeline items, inspect media assets, repair captions, change workspace protected words/defaults, or diagnose API editing failures."
---

# BlitzReels Video Editing

Edit videos via the BlitzReels API: upload media, transcribe, edit timeline, apply captions, add overlays and backgrounds, then export.

If the task is specifically long-form to shorts, podcast-to-shorts, suggestion-backed clipping, or public automatic-layout reframe planning, prefer the `blitzreels-clipping` skill first and come back here for lower-level timeline work.

Important: project preview and visual QA endpoints now exist. Use them when an agent needs to verify framing, caption placement, or layout visually before export. Preview and render calls can be slow; request only the timestamps you need.

Important: do not infer endpoint names from dashboard URLs or likely nouns. Public API coverage is narrower than the product UI. Search this skill, `llms-full.txt`, and `references/api-dogfood-caveats.md` before trying a new path.

## Quick Start

```bash
# Upload a video from URL
bash scripts/editor.sh upload-url PROJECT_ID "https://example.com/video.mp4"

# Add to timeline and transcribe
bash scripts/editor.sh add-media PROJECT_ID MEDIA_ID
bash scripts/editor.sh transcribe PROJECT_ID MEDIA_ID

# Trim, caption, export
bash scripts/editor.sh trim PROJECT_ID ITEM_ID 1.0 -2.0
bash scripts/editor.sh captions PROJECT_ID viral-center
bash scripts/editor.sh export PROJECT_ID --resolution 1080p
```

## Primary Workflow

1. **Create project** — `POST /projects {"name":"...", "aspect_ratio":"9:16"}`
2. **Upload media** — `editor.sh upload-url` (URL import) or 2-step presigned upload
3. **Add to timeline** — `editor.sh add-media` places media on the timeline
4. **Transcribe** — `editor.sh transcribe` generates word-level captions
5. **Get context** — `editor.sh context` to see timeline state
6. **Edit timeline** — trim, split, delete, reorder, auto-remove silences
7. **Apply/copy captions** — `editor.sh captions <presetId>` for styled subtitles, or copy settings with `GET/PATCH /projects/{id}/captions/style`
8. **Add overlays** — text overlays, motion code, motion graphics
9. **Add background** — fill layers (gradients, cinematic, patterns)
10. **Export** — `editor.sh export` renders final video with download URL

After any correction or style copy, verify with `editor.sh context PROJECT_ID full` and preview frames before export. Caption writes can change chunking; the transcript may be correct while the rendered caption blocks need manual split/repair.

## Scripts

### `scripts/editor.sh`

Subcommand wrapper for common editing operations.

| Command | Usage | Description |
|---------|-------|-------------|
| `upload-url` | `<projectId> <url> [name]` | Upload media from URL |
| `transcribe` | `<projectId> <mediaId>` | Transcribe + poll until done |
| `context` | `<projectId> [mode]` | Get project context (default: timeline) |
| `timeline-at` | `<projectId> <seconds>` | Get items at timestamp |
| `trim` | `<projectId> <itemId> <startDelta> <endDelta>` | Trim item edges |
| `split` | `<projectId> <itemId> <atSeconds>` | Split item at time |
| `delete-item` | `<projectId> <itemId>` | Delete timeline item |
| `add-media` | `<projectId> <mediaId> [startSec]` | Add media to timeline |
| `add-broll` | `<projectId> <JSON>` | Add B-roll clip |
| `captions` | `<projectId> <presetId>` | Apply caption preset |
| `words` | `<projectId> [limit] [offset]` | List caption words when endpoint is healthy |
| `transcript-corrections` | `<projectId> <assetId> <JSON>` | Apply transcript replacements |
| `list-assets` | `[limit] [offset] [assetType]` | List workspace media assets |
| `get-asset` | `<assetId>` | Get workspace media asset detail |
| `workspace-settings` | `[JSON_PATCH]` | Get or patch workspace settings |
| `export` | `<projectId> [--resolution R]` | Export + poll + download URL |

Run `bash scripts/editor.sh --help` for full usage.

### `scripts/blitzreels.sh`

Generic API helper for direct endpoint calls. Use for overlays, effects, and advanced operations where `editor.sh` doesn't have a shortcut.

```bash
bash scripts/blitzreels.sh METHOD /path [JSON_BODY]
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLITZREELS_API_KEY` | Yes | API key (`br_live_...`) |
| `BLITZREELS_API_BASE_URL` | No | Override base URL (default: `https://www.blitzreels.com/api/v1`) |
| `BLITZREELS_ALLOW_EXPENSIVE` | No | Set to `1` for export calls via `blitzreels.sh` |

## API Endpoint Index

### Projects

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Get project details |
| DELETE | `/projects/{id}` | Delete project |
| GET | `/projects` | List projects |
| PATCH | `/projects/{id}` | Update project metadata (`name`, `description`) |

`PATCH /projects/{id}` is metadata-only. Use `/projects/{id}/settings` and `/projects/{id}/captions/style` for editor/render settings.

### Media

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/media` | Import media from URL |
| POST | `/workspace/media/upload/init` | Create direct upload URL |
| POST | `/workspace/media/upload/finalize` | Finalize direct upload |
| GET | `/workspace/media/assets` | List workspace media assets (`limit` max 100) |
| GET | `/workspace/media/assets/{assetId}` | Get media asset details and signed file URL |

Use `/workspace/media/assets/{assetId}` for asset lookup. Do not try `/assets/{id}`, `/media/{id}`, `/uploads/{id}`, `/videos/{id}`, `/source-videos/{id}`, or `/long-videos/{id}`.

### Transcription

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/transcribe` | Start transcription job |
| GET | `/jobs/{jobId}` | Poll job status |
| GET | `/projects/{id}/context?mode=transcript` | Get transcript |
| GET | `/projects/{id}/transcript/segments` | Get transcript segments |
| POST | `/projects/{id}/transcript/corrections` | Bulk transcript corrections |
| POST | `/projects/{id}/transcribe` | Re-transcribe media by media asset |

Transcript corrections accept single-token `replacements` and same-token-count `phrase_replacements`. For `"Cloud Code" -> "Claude Code"`, use `phrase_replacements` with `from_words: ["Cloud", "Code"]` and `to_words: ["Claude", "Code"]`. Token-count-changing edits such as `"de Expo" -> "d'Expo"` are not supported by transcript corrections; use caption block patching or caption word merge/split/delete endpoints.

### Captions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/captions` | Apply caption preset |
| GET | `/projects/{id}/captions/style` | Get current style |
| PATCH | `/projects/{id}/captions/style` | Update style settings |
| GET | `/projects/{id}/captions` | List caption blocks |
| GET | `/projects/{id}/captions/{captionId}` | Get a caption block with words |
| PATCH | `/projects/{id}/captions/{captionId}` | Replace caption block text |
| GET | `/projects/{id}/captions/words` | List caption words for precise edits, optionally filtered by `timeline_item_id` or `match_text` |
| POST | `/projects/{id}/captions/words/emphasis` | Emphasize specific words |
| POST | `/projects/{id}/captions/words/text` | Update one caption word by ID |
| POST | `/projects/{id}/captions/words/batch-text` | Update many caption words by ID |
| POST | `/projects/{id}/captions/words/delete` | Delete caption words, including words from multiple caption blocks |
| POST | `/projects/{id}/captions/words/merge` | Merge contiguous caption words |
| POST | `/projects/{id}/captions/words/split` | Split one caption word into multiple words |
| POST | `/projects/{id}/captions/words/style` | Update per-word styling |
| GET | `/fonts?surface=captions` | List caption-renderable fonts before setting `fontFamily` |

Caption IDs are exposed on caption timeline items in `GET /projects/{id}/context?mode=full` as `captionId`. Caption routes are project-scoped; do not call guessed global routes such as `/captions/{captionId}`. To target a rendered caption block, read context, find the caption timeline item by timestamp/label, then use `captionId` with `/projects/{id}/captions/{captionId}` or list words with `GET /projects/{id}/captions/words?timeline_item_id=...`.

Typo-fix workflow: list words with `GET /projects/{id}/captions/words?limit=500`; use `sequenceIndex`, `captionId`, `timelineItemId`, `startSeconds`, and `endSeconds` to target edits. Use `/captions/words/text` for a few isolated words, `/captions/words/batch-text` for many isolated words, `/transcript/corrections` for same-token-count phrases, and merge/delete/split for token-count-changing edits. Phrase replacements can cross caption block boundaries and return `unmatched_phrase_replacements` explicitly.

### Timeline Editing

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/media` | Insert media-library image/video items with `items[]` |
| POST | `/projects/{id}/timeline/trim` | Trim item by deltas |
| POST | `/projects/{id}/timeline/split` | Split item at timestamp |
| POST | `/projects/{id}/timeline/move` | Move item start/layer |
| POST | `/projects/{id}/timeline/transform` | Set position/dimensions |
| DELETE | `/projects/{id}/timeline/items/{itemId}` | Delete item |
| POST | `/projects/{id}/timeline/edits` | Generic trim/split/delete/move/transform action |
| POST | `/projects/{id}/timeline/batch-trim` | Batch trim items |
| POST | `/projects/{id}/timeline/batch-move` | Batch move items |
| POST | `/projects/{id}/timeline/batch-transform` | Batch transform items |
| POST | `/projects/{id}/timeline/batch-delete` | Batch delete items |
| POST | `/projects/{id}/timeline/audio` | Add an existing workspace audio asset |
| GET | `/projects/{id}/keyframes?timeline_item_id=...` | List item keyframes |

`/timeline/media` is not a background-audio endpoint. It expects:

```json
{
  "items": [
    {
      "asset_id": "media-asset-uuid",
      "start_seconds": 3.2,
      "duration_seconds": 4,
      "position_preset": "full-screen"
    }
  ]
}
```

It currently supports visual media library assets. For audio, use `POST /projects/{id}/timeline/audio` with an existing workspace audio asset. Do not guess `/audio` or `/music`.

### Overlays — Text, Motion Code, Motion Graphics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/text-overlays` | List text overlays |
| POST | `/projects/{id}/text-overlays` | Add text overlay |
| POST | `/projects/{id}/overlays` | Add generic overlay |
| GET | `/projects/{id}/motion-code` | List motion code blocks |
| POST | `/projects/{id}/motion-code` | Add animated code block |
| GET | `/projects/{id}/motion-graphics` | List motion graphics |
| POST | `/projects/{id}/motion-graphics` | Add motion graphic |

### Backgrounds

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/backgrounds` | List background layers |
| POST | `/projects/{id}/backgrounds` | Add background/fill layer |

### Context & State

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/context?mode=...` | Get project context |
| GET | `/projects/{id}/timeline/at?time_seconds=X` | Items at timestamp |
| POST | `/projects/{id}/preview-frame` | Render one still preview |
| POST | `/projects/{id}/preview-frames` | Render multiple still previews |
| POST | `/projects/{id}/visual-analysis` | Run structured frame QA |
| GET | `/projects/{id}/visual-debug` | Get machine-readable layout geometry |

Preview body examples:

```json
{ "time_seconds": 12.5 }
```

```json
{ "times_seconds": [3, 12.5, 28], "target_width": 720, "image_format": "jpeg" }
```

`target_width` is optional and defaults to native render width. `image_format` defaults to `jpeg`. `preview-frames` also accepts the older alias `time_seconds_list`.

### Media View Repair

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/media-views/{timelineItemId}` | Upsert source-view crop/canvas state for one item |
| POST | `/projects/{id}/timeline/media-views/duplicate` | Duplicate a linked source view to another item |

### Clipping / Reframe Preview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/workspace/media/assets/{assetId}/reframe-plan/preview` | Generate a reframe plan plus preview stills before apply |

### Export & Jobs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/export` | Start export (expensive) |
| GET | `/exports/{exportId}` | Export status + download URL |
| GET | `/projects/{id}/exports` | Export history |
| DELETE | `/projects/{id}/exports` | Delete all exports |
| GET | `/jobs/{jobId}` | Generic job polling |

### Workspace Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspace/settings` | Read workspace name, description, protected words, icon, defaults |
| PATCH | `/workspace/settings` | Patch only fields that should change |
| POST | `/workspace/icon/upload/init` | Create presigned workspace icon upload |
| DELETE | `/workspace/icon` | Remove workspace icon |

When patching protected vocabulary, send only one alias:

```json
{
  "protected_words": ["IA", "Claude", "Codex"]
}
```

Do not mirror a GET response by sending both `safe_words` and `protected_words`; the write endpoint rejects that. Patch only changed fields so sibling fields such as `description` cannot be accidentally rewritten by a caller.

### Effects & Keyframes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/keyframes?timeline_item_id={itemId}` | List keyframes |

Timeline effect CRUD is not public in the live OpenAPI. Use public overlay/background/motion endpoints where possible, or the dashboard for zoom/mask/color-grade effect editing.

---

## Context Modes

Use `?mode=` to control what data the context endpoint returns:

| Mode | Returns |
|------|---------|
| `summary` | Project metadata, duration, media count |
| `assets` | All media assets with metadata |
| `timeline` | Full timeline with items, layers, timing |
| `transcript` | Word-level transcript from transcription |
| `full` | Everything combined |

Default: `timeline`

```bash
bash scripts/editor.sh context PROJECT_ID timeline
bash scripts/editor.sh context PROJECT_ID full
```

## Upload Modes

### URL Import (Simpler)
```bash
bash scripts/editor.sh upload-url PROJECT_ID "https://example.com/video.mp4"
```

### Direct Upload 2-Step (For Local Files)
```bash
# Step 1: Get upload URL
INIT=$(bash scripts/blitzreels.sh POST /workspace/media/upload/init \
  '{"fileName":"video.mp4","contentType":"video/mp4"}')

# Step 2: Upload to returned URL
curl -X PUT "$(echo $INIT | jq -r '.url')" \
  -H "Content-Type: video/mp4" \
  --data-binary @video.mp4

# Step 3: Finalize
bash scripts/blitzreels.sh POST /workspace/media/upload/finalize \
  "{\"storageKey\":\"$(echo $INIT | jq -r '.key')\"}"
```

## API Dogfood Tests

Runnable agent-facing scenarios live in `docs/api-dogfood-tests.md` in the BlitzReels app repo. Use that file as the canonical checklist when verifying caption edits, preview defaults, B-roll transforms, motion graphic delete, content items, font validation, upload init/finalize, and public error shapes.

## Quick Reference

- **Caption presets**: 30+ presets across 6 categories — see `references/caption-styles.md`
- **Active word animations**: highlight, scale, glow, lift, bounce, punch, slam, elastic, shake, none
- **Motion code themes**: github-dark, one-dark, dracula, nord, monokai, tokyo-night
- **Background recipes**: 38+ fill-layer-style background examples across 7 categories — see `references/fill-layers.md`
- **Timeline layer order**: caption(0) → effect(1) → image(2) → video(3) → audio(4) → background(5)

## References

- `references/clipping.md` — Long-form to short workflow, podcast QA loop, preview/repair endpoints
- `references/api-dogfood-caveats.md` — Verified public API gotchas from real agent usage
- `references/caption-styles.md` — All 30+ presets, CaptionStyleSettings schema, animations
- `references/overlays.md` — Text overlays, motion code, motion graphics schemas
- `references/fill-layers.md` — 38+ background recipes and FillLayerSettings schema; public API route is `/backgrounds`
- `references/timeline-ops.md` — Timeline endpoints, AI features, keyframes, effects
- `references/export-settings.md` — Export params, codecs, polling pattern
- `examples/edit-uploaded-video.md` — Full upload→edit→export walkthrough
- `examples/enhance-with-overlays.md` — Adding graphics to existing project

## Safety & Notes

- Use `https://www.blitzreels.com/api/v1` as base URL (avoid redirect from non-www)
- Export and B-roll generation are **expensive** — require `BLITZREELS_ALLOW_EXPENSIVE=1`
- `editor.sh export` sets this automatically; `blitzreels.sh` requires explicit opt-in
- Download URLs are temporary (24h TTL)
- Full OpenAPI spec: `https://www.blitzreels.com/api/openapi.json`

## Rate Limits

| Plan | Requests/min | Requests/day |
|------|-------------|-------------|
| Free | 10 | 100 |
| Lite | 30 | 1,000 |
| Creator | 60 | 5,000 |
| Agency | 120 | 20,000 |
