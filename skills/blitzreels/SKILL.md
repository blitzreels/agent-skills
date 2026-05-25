---
name: blitzreels
description: "BlitzReels API umbrella skill: auth, endpoint discovery, onboarding, public API caveats, and links to specialized BlitzReels skills. Use this whenever a user asks an agent to call BlitzReels, complete BlitzReels onboarding, debug BlitzReels API behavior, verify endpoints, or work with BlitzReels API keys before moving into clipping, video editing, caption themes, or carousels."
---

# BlitzReels Skill

Use the BlitzReels API to create and edit video projects programmatically.

For focused workflows, install the specialized skills:

- **`blitzreels-clipping`** — Long video to short vertical clipping workflows: ingest → transcript → short suggestions → smart crop or ROI reframing → clip-window captions → export. Includes clipping-specific workflow guidance.
- **`blitzreels-video-editing`** — Video editing workflows: upload media → transcribe → timeline editing → captions → editable overlays → backgrounds → export. Includes `editor.sh` subcommand script, caption/overlay/fill-layer references.
- **`blitzreels-cli`** — Shell-first workflows with `npx blitzreels`: browser/device auth with explicit `Connect CLI` confirmation, local vs production base URLs, JSON output, onboarding brand setup, media library writes, project management, preview-first edits, snapshots, and exports.

## Setup

Environment variables:

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"
# Optional: override API base URL (defaults to https://www.blitzreels.com/api/v1)
export BLITZREELS_API_BASE_URL="https://www.blitzreels.com/api/v1"
# Safety: required to call expensive endpoints like /export with the helper script
export BLITZREELS_ALLOW_EXPENSIVE=1
```

Get your API key from: https://blitzreels.com/settings/api

## LLM Resources

- `https://www.blitzreels.com/llms.txt`
- `https://www.blitzreels.com/llms-full.txt`
- `https://www.blitzreels.com/api/openapi.json` (source of truth)

## Agent Playbook (Discover Then Call)

When integrating with BlitzReels, do not guess endpoints or request fields. First try OpenAPI, then fall back to `llms-full.txt` and the installed skills if OpenAPI is unavailable:

1. Fetch OpenAPI: `https://www.blitzreels.com/api/openapi.json`
2. If OpenAPI returns `paths: {}` or an `OpenAPI generation error`, treat it as unavailable, not as proof the API has no endpoints.
3. Search `https://www.blitzreels.com/llms-full.txt` and this skill bundle before calling anything.
4. Inspect request/response schemas for required fields. Prefer documented paths over analogy-based guesses.
5. Call the endpoint with `Authorization: Bearer $BLITZREELS_API_KEY`.
6. If the operation returns a `job_id`, poll `/jobs/{job_id}` until complete. If it returns an `export_id`, poll `/exports/{export_id}`.
7. Verify state with read endpoints after write calls, especially workspace settings and timeline/caption edits.

For creative editing requests, do not invent new API fields to encode every instruction. Use the documented API/CLI controls and the specialized `blitzreels-cli` or `blitzreels-video-editing` skill guidance for safe zones, asset quality, text placement, logos, B-roll, snapshots, and export verification.

## Onboarding / Brand Setup

Use the onboarding API when an agent needs to prepare a workspace before creating videos:

```bash
curl -X POST https://www.blitzreels.com/api/v1/onboarding/brand-scan \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com","business_outcome":"book_calls"}'

curl https://www.blitzreels.com/api/v1/onboarding/brand-scans/{run_id} \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"

curl https://www.blitzreels.com/api/v1/onboarding/brand-profile \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Workflow: start a website brand scan, poll the returned `run_id`, read or patch `/onboarding/brand-profile`, optionally call `/onboarding/logo/import`, then call `/onboarding/complete` with reviewed fields. Keep scan-provider names out of user reports; rely on public status, profile, and `next_actions` fields.

## API Key Handling

- Do not store raw `br_live_...` keys in memory, notes, eval outputs, or handoff files.
- Put the key in `BLITZREELS_API_KEY` for the current shell only.
- Redact keys in reports (`br_live_2c68...c5bb`) and recommend rotation if a key was pasted into shared logs.

## Full API Reference (OpenAPI)

The full API is documented in OpenAPI:

- `https://www.blitzreels.com/api/openapi.json`

Quickly list available endpoints (requires `jq`):

```bash
curl -sS https://www.blitzreels.com/api/openapi.json | jq -r '.paths | keys[]'
```

List methods + paths + summary:

```bash
curl -sS https://www.blitzreels.com/api/openapi.json | jq -r '
  .paths
  | to_entries[]
  | .key as $path
  | .value
  | to_entries[]
  | select(.key | test("^(get|post|put|patch|delete)$"))
  | "\(.key|ascii_upcase) \($path) - \(.value.summary // .value.operationId // "")"
'
```

Search by keyword:

```bash
curl -sS https://www.blitzreels.com/api/openapi.json \
  | jq -r '.paths | keys[]' \
  | grep -iE 'caption|export|timeline|overlay|template|webhook|job|content-items' || true
```

If this returns no paths, use the fallback index:

```bash
curl -sS https://www.blitzreels.com/llms-full.txt | grep -iE 'caption|export|timeline|workspace|media|project'
```

Inspect one endpoint in detail:

```bash
PATH_TO_INSPECT="/projects/{id}/export"
curl -sS https://www.blitzreels.com/api/openapi.json \
  | jq --arg p "$PATH_TO_INSPECT" '.paths[$p]'
```

## Recommended Usage (Scripted)

This skill includes a helper script so you don't have to retype headers:

```bash
# From this skill directory:
bash scripts/blitzreels.sh POST /projects '{"name":"My Video","aspect_ratio":"9:16"}'
```

## Known Public API Caveats (checked 2026-05-24)

These are dogfood findings checked against the live OpenAPI. Re-check OpenAPI before relying on any caveat, because the public API is moving quickly.

- OpenAPI is currently the source of truth. If it ever returns `paths: {}` with an `OpenAPI generation error`, treat that as a docs-generation failure and fall back to `llms-full.txt` plus installed skills.
- Caption-theme REST routes are now public: `/caption-themes`, `/caption-themes/{themeId}`, `/caption-themes/preview`, duplicate, and set-default are registered.
- Project metadata update is now public: `PATCH /projects/{projectId}` accepts `name` and `description`.
- Workspace media asset details use `/workspace/media/assets/{assetId}`. Short guesses like `/assets/{id}`, `/media/{id}`, `/uploads/{id}`, and `/video-sources/{id}` are not registered.
- Onboarding routes are public: `/onboarding/brand-scan`, `/onboarding/brand-scans/{runId}`, `/onboarding/brand-profile`, `/onboarding/logo/import`, and `/onboarding/complete`. Poll brand scan runs before completing onboarding.
- Workspace media listing caps `limit` at `100`.
- Workspace settings `GET` returns both `safeWords` and `protected_words`, but `PATCH /workspace/settings` accepts only one of `safe_words` or `protected_words`.
- Transcript bulk corrections support single-token `replacements` and same-token-count `phrase_replacements`. They do not support token-count-changing edits such as deleting/fusing words.
- Caption blocks are project-scoped. Use `GET /projects/{projectId}/captions`, `GET /projects/{projectId}/captions/{captionId}`, and `PATCH /projects/{projectId}/captions/{captionId}` for whole-caption reads or token-count-changing edits. There is no global `GET/PATCH /captions/{captionId}` route.
- For precise word edits, use `GET /projects/{projectId}/captions/words`, optionally with `timeline_item_id` and `match_text`, then call `/captions/words/text`, `/captions/words/delete`, `/captions/words/merge`, `/captions/words/split`, `/captions/words/style`, or `/captions/words/emphasis`.
- Public timeline media insertion uses an `items` array with `asset_id` and supports media-library image/video insertions. Audio insertion is public at `POST /projects/{projectId}/timeline/audio`, but it expects an existing workspace audio asset; do not guess `/audio` or `/music`.

## Commands

Create a project:

```bash
curl -X POST https://www.blitzreels.com/api/v1/projects \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Video", "aspect_ratio": "9:16"}'
```

Check job status:

```bash
curl https://www.blitzreels.com/api/v1/jobs/{job_id} \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

Export a project:

```bash
curl -X POST https://www.blitzreels.com/api/v1/projects/{project_id}/export \
  -H "Authorization: Bearer $BLITZREELS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"resolution": "1080p"}'
```

List available voices:

```bash
curl https://www.blitzreels.com/api/v1/voices \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

List caption styles:

```bash
curl https://www.blitzreels.com/api/v1/styles \
  -H "Authorization: Bearer $BLITZREELS_API_KEY"
```

## Redirect Warning (Auth Headers)

Use `https://www.blitzreels.com/api/v1` as your base URL. `https://blitzreels.com` redirects to `www`, and some HTTP clients drop the `Authorization` header on redirects (leading to confusing `UNAUTHORIZED` errors).

## Debugging

Every API response includes:
- `X-Request-Id` (share with support)
- `X-RateLimit-*` headers (remaining + reset timestamps)

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
