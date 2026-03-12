# Staged Endpoints (Manual-Control Fallback)

Use these endpoints only when the `/clips` resource cannot produce the result — custom reframe plans, manual timeline edits, or non-standard caption workflows.

When using this path, the agent is responsible for stage sequencing, readiness polling, and verification that the `/clips` resource normally handles automatically.

## Endpoint Table

| Method | Path | Stage | Use |
|--------|------|-------|-----|
| POST | `/projects` | Project | Create export target |
| POST | `/workspace/media/import/youtube` | Ingest | Import a YouTube source into workspace media |
| POST | `/projects/{id}/media` | Ingest | Ingest local file or URL into a project |
| GET | `/projects/{id}/transcript` | Readiness | Confirm transcript timing before trusting captions or clip windows |
| GET | `/workspace/media/assets/{assetId}/short-suggestions` | Readiness | Poll until suggestions exist |
| GET | `/workspace/media/assets/{assetId}/reframe-analysis` | Layout readiness | Inspect current automatic-layout analysis state |
| POST | `/workspace/media/assets/{assetId}/reframe-analysis` | Layout readiness | Trigger analysis when apply or planning needs it |
| POST | `/workspace/media/assets/{assetId}/reframe-plan` | Layout planning | Generate inspectable plan output |
| POST | `/workspace/media/assets/{assetId}/reframe-plan/apply` | Layout apply | Apply the public reframe plan to the timeline |
| POST | `/workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply` | Layout apply | Default one-call suggestion apply with `automatic_layout` |
| POST | `/projects/{id}/preview-frames` | QA | Render ordered stills for visual verification |
| POST | `/projects/{id}/visual-analysis` | QA | Run structured frame QA |
| GET | `/projects/{id}/visual-debug` | QA | Inspect layout geometry and crops |
| POST | `/projects/{id}/timeline/media-views/{timelineItemId}` | Repair | Upsert source-view crop or canvas state for one item |
| POST | `/projects/{id}/timeline/media-views/duplicate` | Repair | Duplicate a linked source view for split layouts |
| POST | `/projects/{id}/captions` | Captions | Apply a caption preset to the selected clip window |
| GET | `/projects/{id}/context?mode=timeline` | Verify | Confirm clip, captions, and framing landed correctly |
| POST | `/projects/{id}/export` | Export | Start final export |
| GET | `/jobs/{jobId}` | Export polling | Poll async jobs |
| GET | `/exports/{exportId}` | Export polling | Get export status and download URL |

## Staged Workflow

1. Create a `9:16` project.
2. Ingest media.
3. Poll transcript readiness — do not proceed until transcript timing is available.
4. Poll short suggestions — do not proceed until suggestions are non-empty.
5. Apply one suggestion with automatic layout:
   - default: `POST /workspace/media/assets/{assetId}/short-suggestions/{suggestionId}/apply` with `automatic_layout.enabled = true`
   - use `reframe-plan` or `reframe-plan/apply` when inspectable planner output or tighter control is needed
6. For podcast/interview clips, verify framing with preview-frames or visual-debug before export.
7. Apply clip-window-aware captions with `POST /projects/{id}/captions`.
8. Verify the timeline with `GET /projects/{id}/context?mode=timeline`.
9. Export.

## Layout Hints For Suggestion Apply

- `automatic_layout.enabled = true`
- `automatic_layout.content_type_hint`: `"podcast"` | `"tutorial"` | `"generic"` (preference, not constraint)
- `automatic_layout.layout_strategy`: `"auto"` | `"split"` | `"focus"` | `"letterbox"` (hard constraint)
- `automatic_layout.aspect_ratio_override`: only when project is not already `9:16`
