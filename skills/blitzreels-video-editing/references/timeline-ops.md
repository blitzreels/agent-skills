# Timeline Operations Reference

## Core Edit Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/trim` | Trim item by start/end deltas (seconds) |
| POST | `/projects/{id}/timeline/split` | Split item at timestamp (non-destructive) |
| POST | `/projects/{id}/timeline/media` | Add media asset to timeline |
| DELETE | `/projects/{id}/timeline/items/{itemId}` | Delete timeline item |
| PATCH | `/projects/{id}/timeline/items/{itemId}` | Update item properties |
| POST | `/projects/{id}/timeline/items/batch-update` | Batch update multiple items |

### Trim Input
```json
{
  "item_id": "string",
  "start_delta_seconds": 0.5,
  "end_delta_seconds": -1.2
}
```
Positive `start_delta` trims from beginning; negative `end_delta` trims from end.

### Split Input
```json
{
  "item_id": "string",
  "at_seconds": 15.5
}
```
Creates two items from one at the split point.

---

## Transform & Position

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/projects/{id}/timeline/items/{itemId}/volume` | Set volume (0–2.0) |
| PATCH | `/projects/{id}/timeline/items/{itemId}/position` | Set position on timeline |
| PATCH | `/projects/{id}/timeline/items/{itemId}/dimensions` | Set width/height |
| PATCH | `/projects/{id}/timeline/items/{itemId}/transform` | Set scale, rotation, position |
| POST | `/projects/{id}/timeline/items/batch-layer` | Batch update layer indices |

---

## Clip Management

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/clips` | Add clip to timeline |
| DELETE | `/projects/{id}/timeline/clips/{clipId}` | Remove clip |
| POST | `/projects/{id}/timeline/clips-with-captions` | Add clip + auto-add captions |
| DELETE | `/projects/{id}/timeline/clips-with-captions/{clipId}` | Remove clip + associated captions |
| POST | `/projects/{id}/timeline/replace-media` | Replace backing media asset |

---

## Packing & Ordering

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/pack-clips` | Remove gaps between clips on a track |
| POST | `/projects/{id}/timeline/pack-tracks` | Consolidate tracks (remove empty) |
| POST | `/projects/{id}/timeline/items/bulk-commit-drag` | Commit drag operation positions |

---

## AI-Powered Features

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/silence-detection` | Detect silent regions |
| POST | `/projects/{id}/timeline/apply-silence-plan` | Cut detected silences |
| POST | `/projects/{id}/timeline/mistake-detection` | AI-detect verbal mistakes |
| POST | `/projects/{id}/timeline/apply-mistake-plan` | Cut detected mistakes |
| POST | `/projects/{id}/timeline/caption-recut` | Generate recut plan from captions |
| POST | `/projects/{id}/timeline/apply-caption-recut` | Apply caption-based recut |

### Silence Detection Flow
1. `POST /timeline/silence-detection` → returns plan with silent regions
2. Review plan (optional: filter by duration threshold)
3. `POST /timeline/apply-silence-plan` with plan → removes silences

### Mistake Detection Flow
1. `POST /timeline/mistake-detection` → AI analyzes transcript for verbal mistakes
2. Returns verdicts per segment (keep/cut)
3. `POST /timeline/apply-mistake-plan` with verdicts → cuts mistakes

---

## Effects

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/effects/zoom` | Add zoom effect to item |
| POST | `/projects/{id}/timeline/effects/mask` | Add mask effect |
| POST | `/projects/{id}/timeline/effects/color-grade` | Add color grade effect |
| PATCH | `/projects/{id}/timeline/effects/{effectId}` | Update effect settings |

---

## Keyframes

Animate properties over time with keyframes.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects/{id}/timeline/items/{itemId}/keyframes` | List keyframes |
| POST | `/projects/{id}/timeline/items/{itemId}/keyframes` | Create keyframe |
| PATCH | `/projects/{id}/timeline/keyframes/{kfId}` | Update keyframe |
| DELETE | `/projects/{id}/timeline/keyframes/{kfId}` | Delete keyframe |

### Keyframe Properties
`positionX` · `positionY` · `scale` · `rotation` · `opacity`

### Keyframe Easing
`linear` · `ease-in` · `ease-out` · `ease-in-out` · `bounce` · `elastic`

### Keyframe Input
```json
{
  "property": "scale",
  "time_seconds": 2.5,
  "value": 1.5,
  "easing": "ease-out"
}
```

---

## Undo / Redo

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/undo` | Undo last action |
| POST | `/projects/{id}/timeline/redo` | Redo undone action |
| GET | `/projects/{id}/timeline/can-undo` | Check if undo available |
| GET | `/projects/{id}/timeline/can-redo` | Check if redo available |

---

## Watermarks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects/{id}/timeline/watermark` | Add watermark |
| PATCH | `/projects/{id}/timeline/watermark/{wid}` | Update watermark |
| DELETE | `/projects/{id}/timeline/watermark/{wid}` | Remove watermark |

---

## Layer Index Defaults

| Layer | Index | Content |
|-------|-------|---------|
| Caption | 0 | Caption text overlays |
| Effect | 1 | Zoom, mask, color grade |
| Image | 2 | Image overlays |
| Video | 3 | Video clips |
| Audio | 4 | Audio tracks |
| Background | 5 | Fill layers |
