---
name: blitzreels-motion-graphics
description: Editing + motion graphics workflows with BlitzReels (timeline, overlays, templates, export). Uses OpenAPI to discover endpoints.
---

# BlitzReels Motion Graphics Skill

This skill focuses on editing and motion-graphics style work inside BlitzReels:

- Timeline editing
- Text overlays / lower-thirds
- Backgrounds
- Keyframes / animation
- Applying templates
- Exporting

Because these endpoints evolve, use the OpenAPI spec as the source of truth for exact paths and request bodies.

## Setup

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"
export BLITZREELS_API_BASE_URL="https://blitzreels.com/api/v1"
```

## Full API Reference (OpenAPI)

- `https://blitzreels.com/api/openapi.json`

List endpoints related to editing (requires `jq`):

```bash
curl -sS https://blitzreels.com/api/openapi.json \
  | jq -r '.paths | keys[]' \
  | grep -Ei '(timeline|overlay|keyframe|template|background|caption|style)' || true
```

## Recommended Flow

1. Create a project
2. Upload/import media (or start from a template)
3. Add captions and overlays
4. Adjust timeline/layout (keyframes, background, etc.)
5. Export
6. Fetch export download URL

## Quickstart (Using The Helper Script)

```bash
# Create project
bash scripts/blitzreels.sh POST /projects '{"name":"Motion Graphics Test","aspect_ratio":"16:9"}'
```

## Notes

- Use `include=directives` on OpenAPI-documented endpoints (when available) to get agent-friendly sequencing guidance.
- When you need to animate, prefer the smallest number of keyframes that still communicates the motion (reduces jitter).
