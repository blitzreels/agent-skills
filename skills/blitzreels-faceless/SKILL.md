---
name: blitzreels-faceless
description: Faceless video generation workflows with BlitzReels (voices, visual styles, jobs, exports).
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
export BLITZREELS_API_BASE_URL="https://blitzreels.com/api/v1"
```

## Full API Reference (OpenAPI)

- `https://blitzreels.com/api/openapi.json`

Browse relevant endpoints:

```bash
curl -sS https://blitzreels.com/api/openapi.json \
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

Export:

```bash
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" '{"resolution":"1080p","format":"mp4"}'
```

## Notes

- Prefer passing either `topic` or a fully written `script`. If both are present, the API may prioritize one depending on the endpoint.
- Use the OpenAPI spec to confirm which fields are supported for your account and current API version.
