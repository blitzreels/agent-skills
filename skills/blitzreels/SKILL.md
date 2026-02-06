---
name: blitzreels
description: Use the BlitzReels REST API to create projects, generate faceless videos, add captions, and export videos.
---

# BlitzReels Skill

Create and export videos via the BlitzReels API.

## Setup

Environment variables:

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"
# Optional: override API base URL (defaults to https://blitzreels.com/api/v1)
export BLITZREELS_API_BASE_URL="https://blitzreels.com/api/v1"
```

Get your API key from: https://blitzreels.com/settings/api

## Recommended Usage (Scripted)

This skill includes a helper script so you don't have to retype headers:

```bash
# From this skill directory:
bash scripts/blitzreels.sh POST /projects '{"name":"My Video","aspect_ratio":"9:16"}'
```

## Commands

Create a faceless video:

```bash
# Create project
curl -X POST https://blitzreels.com/api/v1/projects \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Video", "aspect_ratio": "9:16"}'

# Then generate faceless video
curl -X POST https://blitzreels.com/api/v1/projects/{project_id}/faceless \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "5 productivity tips",
    "voice_id": "voice_nova",
    "visual_style": "cinematic",
    "duration_seconds": 30
  }'
```

Check job status:

```bash
curl https://blitzreels.com/api/v1/jobs/{job_id} \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Export video:

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

## Workflow Example

1. Create project
2. Generate faceless video (returns job_id)
3. Poll job status until complete
4. Export project
5. Get download URL

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
