---
name: blitzreels-carousels
description: Create TikTok and Instagram carousel slideshows via the BlitzReels API. Use when the user wants to create carousels, slideshows, slide-based content, image posts with text overlays, TikTok photo mode content, or batch-produce social media image content at scale. Also use when the user mentions carousel, slideshow, slides, TikTok photos, Instagram carousel, swipeable content, or "images + text" social posts.
---

# BlitzReels Carousels

Create still-slide carousels for TikTok and Instagram: background images + text overlays, exported as **individual slide images** (ZIP of PNG/JPG).

## Why this format matters

Slideshows are the most scalable content format on social media right now. Images + text — that's it. The production barrier is low so creators post consistently. The swipe mechanic keeps viewers engaged longer than passive video. And the algorithm is pushing them harder than almost any other format.

One well-structured slideshow campaign can generate millions of organic views with zero ad spend. The format lets you walk someone through a product or idea naturally, slide by slide, without it ever feeling like an ad.

## Three things that separate 10k views from 1M

### 1. Images must look native — not like AI slop

Default AI image output looks washed out and obviously synthetic. People scroll past in half a second. The fix is specificity: mimic a real camera, real lighting, real mess.

When using the `/carousels/generate` endpoint with `background_strategy: "ai_image"`, write background prompts that describe a real scene a real person would photograph:

**Bad prompts (AI slop):**
- "Professional business background"
- "Clean modern gradient"
- "Beautiful landscape"

**Good prompts (native-looking):**
- "Candid selfie angle, messy bedroom background, warm lamp lighting, slightly grainy, iPhone front camera quality"
- "Close-up of hands holding phone showing app screen, coffee shop table with crumbs, natural window light, shallow depth of field"
- "POV looking down at laptop on unmade bed, warm afternoon light through blinds, casual and unpolished"

Prompt construction rules:
- Name a specific camera ("iPhone 15 front camera", "Pixel 8 selfie cam")
- Describe imperfect lighting ("slightly overexposed", "warm lamp casting harsh shadow")
- Add texture ("light film grain", "soft lens blur in corners")
- Include environmental mess ("coffee rings", "crumbs", "tangled earbuds") — real life isn't clean
- Never use words like "professional", "stunning", "beautiful", "high-quality" — those produce the generic AI look

If the user has reference images, always prefer `background_image_url` over AI generation. Real photos outperform generated ones every time.

### 2. Copy must sound human — not like a marketer

AI writes like a copywriter by default: "Discover the power of...", "Game-changing solution...", "Revolutionary approach..." Nobody on TikTok talks like that. The disconnect is instant and people scroll.

Rules for slide text:
- Write like someone who just discovered something and is genuinely surprised
- Casual language, contractions, lowercase when it fits the tone
- Short punchy fragments, not complete sentences
- **Never use**: "game-changer", "revolutionary", "must-have", "unlock", "supercharge", "elevate", "leverage", "discover the power of"

**Hooks that work:**
- "3 things I wish I knew before starting [X]"
- "Nobody talks about this but..."
- "I tested [X] for 30 days. here's what happened"
- "Stop doing [X]. do this instead"
- "The [thing] that changed everything for me"
- "Why [controversial opinion]"

**Hooks that don't:**
- "Discover the Ultimate Guide to [X]"
- "5 Game-Changing Strategies for Success"
- "Unlock Your Full Potential with [X]"

If you have access to real comments from the user's niche (TikTok, Reddit, Twitter), study them for tone. Write the slide text in that voice.

### 3. Product integration must feel invisible

If the user is promoting an app or product, the product needs to live INSIDE the content — not next to it, not on top of it. The content should be entertaining enough to get pushed by the algorithm on its own merit. The product is the punchline: the thing the viewer didn't know they needed until they were three slides deep.

**Bad integration** (feels like an ad):
- Slide 1: Product logo
- Slide 2: Feature list
- Slide 3: "Download now"

**Good integration** (feels like content):
- Slide 1: Relatable problem everyone has
- Slide 2: The struggle / failed attempts
- Slide 3: "then I found this..." (product shown in natural use)

A format that gets millions of views but zero conversions means the product is sitting on top of the content instead of inside it. A format that converts but can't get views means the integration is too heavy — it feels like an ad and people scroll past.

## Slide formulas

### 3-Slide (TikTok)
1. **Hook**: Bold statement or question that stops the scroll
2. **Value**: Core insight, numbered list, or reveal
3. **CTA**: "Save this" / "Follow for more" / engagement prompt ("Comment 1, 2, or 3")

### 5-Slide (Instagram)
1. **Hook**: Compelling title or question
2–4. **Key Points**: One actionable insight per slide
5. **CTA + Recap**: Summary + save/follow prompt

### Storytelling (either platform)
1. Problem → 2. Struggle → 3. Discovery → 4. Result → 5. CTA

## API workflow

### Option A: One-call generation (preferred)

`POST /projects/{id}/carousels/generate` builds the full carousel in one call — backgrounds, text overlays, timeline placement.

```bash
# 1. Create carousel project
PROJECT=$(bash scripts/blitzreels.sh POST /projects '{
  "name": "My Carousel",
  "project_type": "carousel",
  "aspect_ratio": "9:16",
  "carousel_settings": {
    "platform": "tiktok",
    "safe_area_preset": "tiktok_9_16",
    "slide_count": 3,
    "background_strategy": "ai_image",
    "export_formats": ["png"],
    "jpeg_quality": 90
  }
}')
PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')

# 2. Generate slides
bash scripts/generate.sh --project-id "$PROJECT_ID" \
  --slides-json /tmp/slides.json

# 3. Check timeline
bash scripts/blitzreels.sh GET "/projects/${PROJECT_ID}/context?mode=timeline"

# 4. Export as ZIP of individual slide images
export BLITZREELS_ALLOW_EXPENSIVE=1
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" \
  '{"format":"zip","image_formats":["png"],"jpeg_quality":90}'
```

Slides JSON example (`/tmp/slides.json`):
```json
{
  "clear_existing": true,
  "slide_duration_seconds": 3,
  "background_strategy": "ai_image",
  "slides": [
    {
      "title": "3 things nobody\ntells you about [X]",
      "background_prompt": "Candid selfie angle, person looking at phone surprised, warm indoor lighting, iPhone quality, light grain"
    },
    {
      "title": "1. first thing\n2. second thing\n3. third thing",
      "background_prompt": "Clean white wall with soft window shadow, minimal, natural daylight"
    },
    {
      "title": "save this before\nyou forget",
      "background_prompt": "Dark moody background, subtle gradient, slight film grain"
    }
  ]
}
```

If `background_strategy` is `ai_image` or `mixed`, the endpoint kicks off a batch AI-image generation run and returns `ai_image_run_id`. Poll `/jobs/{job_id}` until images are ready.

### Option B: Manual assembly (full control)

Use `scripts/carousel.sh` when you have your own images:

```bash
bash scripts/carousel.sh \
  --platform tiktok \
  --name "My Carousel" \
  --slide-duration 3 \
  --images "https://.../1.jpg|https://.../2.jpg|https://.../3.jpg" \
  --titles "Hook line|Value point|CTA text" \
  --yes
```

Step-by-step if doing it manually without the script:
1. `POST /projects` — create carousel project
2. `POST /projects/{id}/media` — upload each slide background image
3. `POST /projects/{id}/timeline/media` — place each image on the timeline
4. `POST /projects/{id}/overlays` — add text overlays (use `"type": "text"`)
5. `GET /projects/{id}/context?mode=timeline` — verify layout
6. `POST /projects/{id}/export` — export as ZIP

## Export: ZIP of images, not MP4

Always export carousels as a ZIP of individual PNG/JPG slide images:

```bash
export BLITZREELS_ALLOW_EXPENSIVE=1
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" \
  '{"format":"zip","image_formats":["png","jpg"],"jpeg_quality":90}'
```

Poll for completion, then download:
```bash
bash scripts/blitzreels.sh GET "/jobs/${JOB_ID}"
bash scripts/blitzreels.sh GET "/exports/${EXPORT_ID}"
```

Do NOT export carousels as MP4. The entire point is individual slide images uploaded as native photo posts on TikTok/Instagram. An MP4 "slideshow video" defeats the purpose — it won't get the algorithm treatment that native photo carousels get.

## TikTok native text: the distribution edge

TikTok pushes native text overlays (added inside the TikTok app) harder than pre-rendered text baked into images. TikTok also tracks typing patterns — copy-pasting text gets flagged as automated behavior.

This creates two paths:

**Path A — Maximum distribution (recommended for TikTok):**
1. Build slides with background images only — skip text overlays in the API
2. Export ZIP of clean background images
3. Upload to TikTok as photo slideshow
4. Type text manually using TikTok's native text tool (don't paste)
5. This single detail can be the difference between getting pushed and getting shadowbanned

**Path B — Convenience (fine for Instagram, acceptable for TikTok):**
1. Build slides with text overlays baked in via the API
2. Export ZIP with text already rendered on images
3. Upload directly
4. Trade-off: slightly less algorithm favor on TikTok, but much faster at scale

Default to Path A for TikTok. For Instagram, Path B is fine — Instagram doesn't penalize pre-rendered text.

When doing Path A, still generate the text content so the user knows exactly what to type on each slide. Output it as a clear list they can reference while adding text in the app.

## Platform reference

### TikTok (Photo Mode)
- Aspect ratio: `9:16`
- Safe area preset: `tiktok_9_16`
- Danger zones: top 80px (status bar), right 120px (like/share buttons), bottom 450px (captions/username)
- Safe text zone: `position_x: 0.35–0.55`, `position_y: 0.15–0.65`
- Optimal slide count: 3–5

### Instagram Feed
- Aspect ratio: `4:5` (portrait) or `1:1` (square)
- Safe area preset: `instagram_4_5` or `instagram_1_1`
- Danger zones: bottom 420px on 4:5, bottom 380px on 1:1 (captions/buttons)
- Safe text zone: `position_x: 0.5` (always centered), `position_y: 0.15–0.60`
- Optimal slide count: 3–5 (max 10, engagement drops after 5)

For detailed safe area diagrams, pixel specs, and copy-paste position configs, read `references/safe-areas.md`.

## Readability rules

- **Max 40 chars/line** — mobile readable at thumb-scroll speed
- **Max 4 lines/slide** — if you need more text, add more slides
- **Min font size: 48px** — anything smaller is illegible on mobile
- Titles: 64–80px, Body: 48–64px
- **Always enable text stroke**: 6px black on white (or vice versa)
- **Bold sans-serif fonts**: Inter, Montserrat, Poppins — not serif
- **WCAG AA contrast**: 4.5:1 minimum (text vs background)

## Post-production details

These take 2 extra minutes per carousel but consistently move the needle on distribution:

1. **Film grain** — Removes the clean digital look. Use the backgrounds API:
   ```bash
   bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/backgrounds" \
     '{"style_keyword":"film","span_full_video":true,"film_grain_style":"subtle"}'
   ```
   Apply this BEFORE export so the grain renders into the slide images.

2. **Export at 1080p** — Lower resolution blends with organic content. 4K screams "produced."

3. **Compression round** — After exporting the ZIP, upload each image to Telegram, download it, then upload to TikTok/Instagram. This strips EXIF metadata and adds compression artifacts that real user content has. The algorithm treats compressed images as more authentic.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/carousel.sh` | Manual carousel assembly (own images + optional titles) |
| `scripts/generate.sh` | One-call generation via `/carousels/generate` |
| `scripts/blitzreels.sh` | Base API helper (any endpoint) |
| `scripts/validate-api.sh` | Check required endpoints exist in OpenAPI spec |

## Resources

- API docs: `https://www.blitzreels.com/docs/carousels`
- OpenAPI spec: `https://www.blitzreels.com/api/openapi.json`
- Full LLM docs: `https://www.blitzreels.com/llms-full.txt`
