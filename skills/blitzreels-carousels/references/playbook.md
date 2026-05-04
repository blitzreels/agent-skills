# Carousel content playbook

Read this **before drafting slide text or background prompts** — without it, the output will be technically valid but won't earn distribution. The API side works every time; the content side is what separates 10k views from 1M.

## Why this format matters

Slideshows are the most scalable content format on social media right now. Images + text — that's it. The production barrier is low so creators post consistently. The swipe mechanic keeps viewers engaged longer than passive video. And the algorithm is pushing them harder than almost any other format.

One well-structured slideshow campaign can generate millions of organic views with zero ad spend. The format lets you walk someone through a product or idea naturally, slide by slide, without it ever feeling like an ad.

## Three things that separate 10k views from 1M

### 1. Images must look native — not like AI slop

Default AI image output looks washed out and obviously synthetic. People scroll past in half a second. The fix is specificity: mimic a real camera, real lighting, real mess.

There are two ways to get background images: pass URLs from your own generator (Midjourney, DALL-E, Flux, stock photos) into `/projects/{id}/media` or `carousel.sh`, or let the API generate them by passing `background_prompt` per slide to `/carousels/generate` (default model: `fal-ai/nano-banana` at ~5¢/image). Either way, prompt quality is what matters. Write prompts that describe a real scene a real person would photograph:

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
- Avoid words like "professional", "stunning", "beautiful", "high-quality" — image models have learned these as shorthand for the same glossy AI aesthetic viewers trained themselves to scroll past

If the user has reference photos, prefer those over AI-generated images. Real photos outperform generated ones every time.

### 2. Copy must sound human — not like a marketer

AI writes like a copywriter by default: "Discover the power of...", "Game-changing solution...", "Revolutionary approach..." Nobody on TikTok talks like that. The disconnect is instant and people scroll.

Rules for slide text:
- Write like someone who just discovered something and is genuinely surprised
- Casual language, contractions, lowercase when it fits the tone
- Short punchy fragments, not complete sentences
- Avoid marketer-coded words — "game-changer", "revolutionary", "must-have", "unlock", "supercharge", "elevate", "leverage", "discover the power of". Each pattern-matches to "paid content" in viewers' minds and kills trust within the first half-second.

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

Pick the one that matches the user's length and platform.

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

## Post-production craft (content side)

These aren't mandatory, but they reliably move distribution:

- **Export at 1080p, not 4K** — 4K scans as "produced" and tanks organic reach; 1080p blends with organic content
- **Compression round** — after exporting the ZIP, upload each image to Telegram, download it, then upload to TikTok/Instagram. This strips EXIF metadata and adds compression artifacts that real user content has. Algorithms treat compressed images as more authentic.
- **Film grain** — this one is applied via the API (see SKILL.md's "Export" section), not in post. Apply before export so the grain renders into the slide images.
