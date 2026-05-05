# Example: Fitness App TikTok Carousel (Path A — Native Text)

**Goal**: Promote a calorie tracking app via a 3-slide TikTok carousel that feels like organic content, not an ad.

**Format found on TikTok**: "things I stopped doing to lose weight" — multiple creators getting 200k+ views with this format. Validated and repeatable.

**Integration strategy**: The app appears on slide 3 as the natural answer to the problem set up in slides 1-2. The viewer doesn't realize it's a promotion until they're already invested.

---

## Slide plan

### Slide 1 — Hook
**Text** (user types in TikTok): `3 things I stopped doing to finally lose weight`
**Background prompt** (passed to the API, which renders via fal-ai/nano-banana):
```
Candid mirror selfie in gym locker room, person partially visible holding iPhone,
fluorescent overhead lighting, slightly overexposed, messy gym bag on bench in
background, iPhone front camera quality, light film grain
```

### Slide 2 — Value
**Text** (user types in TikTok): `1. counting every calorie by hand\n2. skipping meals to "save" calories\n3. eating the same 4 boring meals`
**Background prompt**:
```
Close-up of phone screen showing a messy notes app with crossed out food items,
kitchen counter with scattered groceries in background, warm apartment lighting,
slightly out of focus edges, casual and unpolished
```

### Slide 3 — Reveal (product integration)
**Text** (user types in TikTok): `this app just... does it for you?\nlike I take a photo and it logs everything`
**Background prompt**:
```
POV looking down at phone on kitchen table, phone screen showing a colorful food
tracking interface, half-eaten sandwich next to phone, natural window light from
left, crumbs on table, iPhone quality, no filters
```

---

## API commands

Path A means we export clean backgrounds only (no text baked in) and the user types the copy inside TikTok. So the slides payload has `background_prompt` but no `title` / `body`.

```bash
export BLITZREELS_API_KEY="br_live_xxxxx"

# 1. Create the carousel project
PROJECT=$(bash scripts/blitzreels.sh POST /projects '{
  "name": "Fitness App - Stopped Doing",
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
}')
PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')

# 2. One-call generation — uploads + AI images + timeline, no baked text (Path A)
cat > /tmp/slides.json <<'JSON'
{
  "clear_existing": true,
  "slide_duration_seconds": 3,
  "background_strategy": "mixed",
  "slides": [
    { "background_prompt": "Candid mirror selfie in gym locker room, person partially visible holding iPhone, fluorescent overhead lighting, slightly overexposed, messy gym bag on bench, iPhone front camera quality, light film grain" },
    { "background_prompt": "Close-up of phone screen showing messy notes app with crossed out food items, kitchen counter with scattered groceries, warm apartment lighting, slightly out of focus edges, casual and unpolished" },
    { "background_prompt": "POV looking down at phone on kitchen table, phone screen showing colorful food tracking interface, half-eaten sandwich next to phone, natural window light from left, crumbs on table, iPhone quality" }
  ]
}
JSON

GEN=$(bash scripts/generate.sh --project-id "$PROJECT_ID" --slides-json /tmp/slides.json)
JOB_ID=$(echo "$GEN" | jq -r '.job_id')

# 3. Poll AI image run until complete (images are rendered async via trigger.dev)
while true; do
  STATUS=$(bash scripts/blitzreels.sh GET "/jobs/${JOB_ID}" | jq -r '.status')
  echo "job status: $STATUS"
  [[ "$STATUS" == "complete" ]] && break
  [[ "$STATUS" == "failed" || "$STATUS" == "canceled" ]] && { echo "AI run $STATUS, aborting"; exit 1; }
  sleep 3
done

# 4. Optional: apply subtle film grain before export (renders server-side during export)
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/backgrounds" \
  '{"style_keyword":"film","span_full_video":true,"film_grain_style":"subtle"}'

# 5. Export clean ZIP (no baked text — that goes in TikTok natively)
export BLITZREELS_ALLOW_EXPENSIVE=1
bash scripts/blitzreels.sh POST "/projects/${PROJECT_ID}/export" \
  '{"format":"zip","image_formats":["png"],"jpeg_quality":90}'

# 6. Poll the export job, then fetch the export record for the download URL
# bash scripts/blitzreels.sh GET "/jobs/${EXPORT_JOB_ID}"
# bash scripts/blitzreels.sh GET "/exports/${EXPORT_ID}"
```

For Path B (text baked in — fine for Instagram, acceptable for TikTok at scale), add `title` (and optionally `body`) to each slide entry in the JSON. The API renders them as top + lower-third overlays in 64px white with black stroke.

## After export: TikTok upload checklist

1. Download the 3 PNG slides from the ZIP
2. Optional compression: upload each to Telegram, re-download (strips metadata)
3. Open TikTok > Create > Photo mode
4. Select the 3 images in order
5. **Type** each overlay manually (don't copy-paste — TikTok flags it):
   - Slide 1: "3 things I stopped doing to finally lose weight"
   - Slide 2: "1. counting every calorie by hand" / "2. skipping meals to 'save' calories" / "3. eating the same 4 boring meals"
   - Slide 3: "this app just... does it for you?" / "like I take a photo and it logs everything"
6. Position text in the upper third (avoid right-side buttons and bottom caption zone)
7. Caption: "which one were you guilty of? comment below"
8. Post at 7-9 AM, 12-1 PM, or 7-9 PM in target audience timezone

## Why this works

- The hook is relatable and specific (not generic "5 tips to lose weight")
- The first two slides are pure content — no product mention, no pitch
- The product appears as a natural discovery, not a recommendation
- The "?" in slide 3 makes it sound like genuine surprise, not a sales pitch
- Background images are messy and casual (gym locker room, kitchen crumbs) — looks like a real person's content
- No text baked into images — TikTok native text gets algorithm priority
