---
name: blitzreels-faceless
description: Faceless AI video generation workflows with BlitzReels (voices, visual styles, jobs, exports).
---

# BlitzReels Faceless Video Skill

This skill is focused on the faceless generation flow:

1. Create project
2. Start faceless generation
3. Poll job status until complete
4. Export
5. Fetch export download URL

## Setup

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"
export BLITZREELS_API_BASE_URL="https://www.blitzreels.com/api/v1"
# Safety: required to call /faceless and /export with the helper script
export BLITZREELS_ALLOW_EXPENSIVE=1
```

## Full API Reference (OpenAPI)

- `https://www.blitzreels.com/api/openapi.json`

Browse relevant endpoints:

```bash
curl -sS https://www.blitzreels.com/api/openapi.json \
  | jq -r '.paths | keys[]' \
  | grep -iE 'faceless|voice|visual|caption|export|job' || true
```

## Quickstart (Using The Helper Script)

```bash
# Create project
PROJECT_JSON=$(bash scripts/blitzreels.sh POST /projects '{"name":"Faceless Test","aspect_ratio":"9:16"}')
echo "$PROJECT_JSON"
```

Then use the returned `id` as `project_id`.

## Common Calls

Start faceless generation:

```bash
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/faceless" '{
  "topic": "5 productivity tips",
  "duration_seconds": 30,
  "visual_style": "cinematic",
  "voice_id": "voice_nova"
}'
```

Poll job status:

```bash
bash scripts/blitzreels.sh GET "/jobs/${JOB_ID}"
```

When the job is `complete`, prefer following `next_actions` from the job response. For faceless generation, the usual next call is:

```bash
# Inspect generated scenes/timeline
bash scripts/blitzreels.sh GET "/projects/${PROJECT_ID}/context?mode=timeline"
```

Export:

```bash
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" '{"resolution":"1080p","format":"mp4"}'
```

## Notes

- Use `https://www.blitzreels.com/api/v1` as your base URL. `https://blitzreels.com` redirects to `www`, and some HTTP clients drop the `Authorization` header on redirects (leading to confusing `UNAUTHORIZED` errors).
- Prefer passing either `topic` or a fully written `script`. If both are present, the API uses `script`.
- If you want control over scene breaks, pass `script` with paragraph breaks (each paragraph becomes a scene, with a safety cap).
- `POST /projects/{id}/faceless` returns a `plan` and `input_warnings` to help you predict what will be generated.
- Use the OpenAPI spec to confirm which fields are supported for your account and current API version.
