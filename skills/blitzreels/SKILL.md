---
name: blitzreels
description: BlitzReels API umbrella skill: auth, discovery, and links to specialized BlitzReels skills.
---

# BlitzReels Skill

Use the BlitzReels API to create and edit video projects programmatically.

For focused workflows, install the specialized skills in this repo:

- `blitzreels-faceless` (faceless video generation)
- `blitzreels-motion-graphics` (timeline/overlays/templates/export)

## Setup

Environment variables:

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"
# Optional: override API base URL (defaults to https://blitzreels.com/api/v1)
export BLITZREELS_API_BASE_URL="https://blitzreels.com/api/v1"
```

Get your API key from: https://blitzreels.com/settings/api

## Agent Playbook (Browse Then Call)

When integrating with BlitzReels, do not guess endpoints or request fields. Use OpenAPI as the source of truth:

1. Fetch OpenAPI: `https://blitzreels.com/api/openapi.json`
2. Search for the endpoint you need by keyword (path, tag, summary)
3. Inspect request/response schema for required fields
4. Call the endpoint with `Authorization: Bearer $BLITZREELS_API_KEY`
5. If the operation returns a `job_id`, poll `/jobs/{job_id}` until complete (or use webhooks)

## Full API Reference (OpenAPI)

The full API is documented in OpenAPI:

- `https://blitzreels.com/api/openapi.json`

Quickly list available endpoints (requires `jq`):

```bash
curl -sS https://blitzreels.com/api/openapi.json | jq -r '.paths | keys[]'
```

List methods + paths + summary:

```bash
curl -sS https://blitzreels.com/api/openapi.json | jq -r '
  .paths
  | to_entries[]
  | .key as $path
  | .value
  | to_entries[]
  | select(.key | test(\"^(get|post|put|patch|delete)$\"))
  | \"\\(.key|ascii_upcase) \\($path) - \\(.value.summary // .value.operationId // \"\")\"
'
```

Search by keyword:

```bash
curl -sS https://blitzreels.com/api/openapi.json \
  | jq -r '.paths | keys[]' \
  | grep -iE 'faceless|caption|export|timeline|overlay|template|webhook|job' || true
```

Inspect one endpoint in detail:

```bash
PATH_TO_INSPECT="/projects/{id}/export"
curl -sS https://blitzreels.com/api/openapi.json \
  | jq --arg p "$PATH_TO_INSPECT" '.paths[$p]'
```

## Recommended Usage (Scripted)

This skill includes a helper script so you don't have to retype headers:

```bash
# From this skill directory:
bash scripts/blitzreels.sh POST /projects '{"name":"My Video","aspect_ratio":"9:16"}'
```

## Commands

Create a project:

```bash
curl -X POST https://blitzreels.com/api/v1/projects \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Video", "aspect_ratio": "9:16"}'
```

Check job status:

```bash
curl https://blitzreels.com/api/v1/jobs/{job_id} \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Export a project:

```bash
curl -X POST https://blitzreels.com/api/v1/projects/{project_id}/export \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"resolution": "1080p"}'
```

List available voices:

```bash
curl https://blitzreels.com/api/v1/voices \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

List caption styles:

```bash
curl https://blitzreels.com/api/v1/styles \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

## What This Skill Does (Today)

- Provides a generic `scripts/blitzreels.sh` wrapper for authenticated API calls.
- Documents that BlitzReels has a public API, plus how to discover the full surface area via OpenAPI.
- Points to specialized skills for faceless generation and editing/motion graphics workflows.

## Rate Limits

- Free: 10 req/min, 100 req/day
- Lite: 30 req/min, 1,000 req/day
- Creator: 60 req/min, 5,000 req/day
- Agency: 120 req/min, 20,000 req/day

## Error Handling

Check response for error object:

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Not enough AI credits for this operation"
  }
}
```
