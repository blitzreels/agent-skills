---
name: blitzreels-carousels
description: Build slide-based social content (backgrounds + text, exported as image ZIPs) via the BlitzReels API. Use whenever the user wants to produce multi-image posts for TikTok, Instagram, LinkedIn, or Pinterest — carousels, slideshows, photo dumps, photo-mode posts, swipe-through decks, slide decks for social, or "images + text" posts. Also trigger when the user says "break this blog post / thread / video into slides," "turn this into a carousel," "make a swipe post," "produce slides to post," or asks to batch-produce image posts at scale. Trigger even if the word "carousel" is not used — anything that ends up as a multi-image social post with captions belongs here, since format-specific rules (safe zones, readability, TikTok native-text distribution) materially change the output.
---

# BlitzReels Carousels

Create still-slide carousels for TikTok and Instagram: background images + text overlays, exported as **individual slide images** (ZIP of PNG/JPG).

## Happy path

Two shell helpers. Pick one based on where the background images come from.

### `generate.sh` — one-call (default)

Use when any slide needs an AI-generated background, or when you want solid/gradient fills, or when you want a single call to handle uploads + timeline + overlays.

```bash
# 1. Create the carousel project
PROJECT=$(bash scripts/blitzreels.sh POST /projects '{
  "name": "My Carousel",
  "project_type": "carousel",
  "aspect_ratio": "9:16",
  "carousel_settings": { "platform": "tiktok", "safe_area_preset": "tiktok_9_16", "slide_count": 3, "background_strategy": "mixed" }
}')
PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')

# 2. Write the slides payload and generate
cat > /tmp/slides.json <<'JSON'
{
  "clear_existing": true,
  "slide_duration_seconds": 3,
  "background_strategy": "mixed",
  "slides": [
    { "title": "Hook line", "body": "one-liner",  "background_prompt": "candid iPhone selfie, messy bedroom, warm lamp, light film grain" },
    { "title": "Point",     "background_image_url": "https://cdn.example.com/slide2.jpg" },
    { "title": "CTA",       "body": "save this",  "background_color": "#0b0b0f" }
  ]
}
JSON
bash scripts/generate.sh --project-id "$PROJECT_ID" --slides-json /tmp/slides.json
```

### `carousel.sh` — synchronous-only (all backgrounds are URLs you already have)

Simpler, no job polling. Use when every slide background is a URL and you just want "stitch these with titles, export."

```bash
bash scripts/carousel.sh \
  --platform tiktok \
  --name "My Carousel" \
  --slide-duration 3 \
  --images "https://.../1.jpg|https://.../2.jpg|https://.../3.jpg" \
  --titles "Hook line|Value point|CTA text" \
  --yes
```

Omit `--titles` for Path A (see "TikTok native text" below).

### Drafting slide content

Before writing slide titles/bodies or `background_prompt` values, read `references/playbook.md`. API-level correctness is what earns *any* distribution; content quality is what separates 10k views from 1M. The playbook covers native-looking images, human-sounding copy, and product integration that doesn't feel like an ad.

## Polling (only when AI images are involved)

`generate.sh` returns `job_id: null` if every slide used a URL or fill color — the carousel is ready to export immediately.

If the response includes a non-null `job_id`, AI images are still rendering via trigger.dev. Poll:

```bash
bash scripts/blitzreels.sh GET "/jobs/${JOB_ID}"
```

Terminal states: `complete` (ready to export) or a failure state. Recommended cadence: every 3–5s, give up after ~120s. Do not start an export before the job reports `complete` — missing assets render as blank backgrounds.

## Export

Export is expensive, so `blitzreels.sh` gates it behind `BLITZREELS_ALLOW_EXPENSIVE=1`:

```bash
export BLITZREELS_ALLOW_EXPENSIVE=1
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" \
  '{"format":"zip","image_formats":["png","jpg"],"jpeg_quality":90}'
```

Poll `/jobs/{job_id}` until done, then read `/exports/{export_id}` for the download URL.

Export as ZIP of images, not MP4. TikTok and Instagram route native photo carousels through a different (and currently favored) distribution bucket than videos; a "slideshow video" lands in the video bucket and loses that edge. MP4 is fine only if the user explicitly asks for a reel-style video.

## TikTok native text: the distribution edge

TikTok boosts native text (typed inside the app) over pre-rendered text baked into images. TikTok also flags copy-paste typing patterns as automation, so the user should type — not paste — the text in-app.

Two paths:

- **Path A (default for TikTok)** — generate slides with backgrounds only (skip `title`/`body` in the slides payload, or pass `carousel.sh` without `--titles`). Export clean background-only images. User types text inside TikTok. Lift from native text usually outweighs the extra step. Still draft the text for each slide so the user can reference it while typing.
- **Path B (default for Instagram, acceptable for TikTok)** — include `title`/`body` per slide. Text is baked into the export. Instagram's algorithm doesn't track text-layer source, so baked-in text is pure time savings. On TikTok it trades some distribution for speed at scale.

## API reference (manual path)

Use this when the two helpers don't cover a variation. Field names are spelled out here because the OpenAPI spec is currently broken (see Resources).

**0. Generate in one call** — `POST /projects/{id}/carousels/generate`
```json
{
  "clear_existing": false,
  "slide_duration_seconds": 3,
  "background_strategy": "mixed",
  "image_model_id": "fal-ai/nano-banana",
  "slides": [
    { "title": "Hook", "body": "sub", "background_prompt": "candid iPhone selfie, warm lamp, light grain" },
    { "title": "Point", "background_image_url": "https://cdn.example.com/p.jpg" },
    { "title": "CTA", "body": "save this", "background_color": "#0b0b0f" }
  ]
}
```
Strategy → required per-slide field:
- `image` — every slide needs `background_image_url` (400 otherwise)
- `mixed` — each slide needs `background_image_url` **or** `background_prompt` (400 if neither)
- `solid` — uses `background_color` (default `#000000`); image fields ignored
- `gradient` — same as `solid` but renders a gradient fill

Platform caps (from `carousel_settings.platform`): TikTok 35, Instagram 10, default 35. Slide count over the cap returns 400.

Default image model: `fal-ai/nano-banana` (~5¢/image). Cheapest: `fal-ai/bytedance/seedream/v5/lite/text-to-image` (~4¢).

Response: `{ project_id, slide_count, job_id, ai_image_run_id, timeline_item_ids, text_overlay_ids, fill_layer_ids, ai_asset_ids, message }`. `job_id` is null unless AI images were requested.

Requires `project_type: "carousel"`; returns 400 otherwise.

**1. Create project** — `POST /projects`
```json
{
  "name": "My Carousel",
  "project_type": "carousel",
  "aspect_ratio": "9:16",
  "carousel_settings": {
    "platform": "tiktok",
    "safe_area_preset": "tiktok_9_16",
    "slide_count": 3,
    "background_strategy": "mixed",
    "export_formats": ["png"],
    "jpeg_quality": 90
  }
}
```
`background_strategy` ∈ `solid | gradient | image | mixed`. Response: `{ "id": "..." }`.

**2. Upload each slide background** (when not using `carousels/generate`) — `POST /projects/{id}/media` with `{ "url": "https://...jpg", "name": "Slide 1" }`. The field is `url`, not `source_url`. Response: `{ "media": { "id": "..." } }`. Grab `.media.id`.

**3. Place images on timeline** — `POST /projects/{id}/timeline/media` with items array:
```json
{ "items": [{ "asset_id": "<media.id>", "start_seconds": 0, "duration_seconds": 3, "position_preset": "fullscreen" }], "allow_duplicate": false }
```
Response: `{ "inserted": [{ "success": true, ... }] }`.

**4. Add text overlays** — `POST /projects/{id}/text-overlays`, one per overlay. Body: `text`, `start_seconds`, `duration_seconds`, `position_x`, `position_y`, `style` (see `carousel.sh` for a safe default). Response: `{ "success": true, ... }`.

**5. Verify** — `GET /projects/{id}/context?mode=timeline` returns the assembled slide stack. Check order and timing before spending credits on export.

## Post-production: film grain

Subtle film grain removes the clean digital look and reliably improves distribution. Apply via the API before export — grain is rendered server-side during export, so anything added afterward would require re-exporting and re-spending credits.

```bash
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/backgrounds" \
  '{"style_keyword":"film","span_full_video":true,"film_grain_style":"subtle"}'
```

Other post-production moves (1080p over 4K, Telegram compression round) are content-craft rather than API calls — see `references/playbook.md`.

## Platform specifics

For aspect ratios, safe zones, and readability rules per platform, read `references/platforms.md`. For pixel-perfect safe-area diagrams and copy-paste position configs, read `references/safe-areas.md`.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/generate.sh` | One-call carousel build via `/carousels/generate` (handles AI image gen, fills, overlays) |
| `scripts/carousel.sh` | Synchronous assembly when every background is a URL you already have |
| `scripts/blitzreels.sh` | Base API helper for any endpoint; fails loudly on non-2xx |
| `scripts/validate-api.sh` | Smoke-check that carousel endpoints exist on the API |

## Resources

- API docs: `https://www.blitzreels.com/docs/carousels`
- OpenAPI spec: `https://www.blitzreels.com/api/openapi.json` — **currently broken** (returns `"paths": {}` due to a Zod schema error). Use this skill as the source of truth until it's fixed.
- Full LLM docs: `https://www.blitzreels.com/llms-full.txt`
- Content playbook: `references/playbook.md`
- Platform settings + readability: `references/platforms.md`
- Pixel-level safe areas: `references/safe-areas.md`
- Worked example (fitness app, Path A): `examples/fitness-app-tiktok.md`
