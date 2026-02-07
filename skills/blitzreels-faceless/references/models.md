# Models Reference

Available image and video generation models for faceless video creation.

## Image Models

Used for generating scene visuals (stills). Selected via `imageModelId`.

| ID | Name | Provider | Cost/image | Ref Images | Best For |
|----|------|----------|-----------|------------|----------|
| `google-gemini-2.5-flash-image` | Nano Banana (Gemini 2.5 Flash) | Google | 0.25 credits | Yes | Fast iteration, storyboarding, motion-friendly framing **(default)** |
| `google-gemini-3-pro-image` | Nano Banana Pro (Gemini 3 Pro) | Google | 0.75 credits | Yes | Vivid gradients, neon palettes, futuristic UI, premium quality |
| `openai-gpt-image-1` | GPT Image | OpenAI | 0.30 credits | No | Balanced photorealism, strong typography, UI fidelity |

### Quick Picks
- **Budget/fast**: `google-gemini-2.5-flash-image` — Nano Banana (cheapest, supports reference images)
- **Premium quality**: `google-gemini-3-pro-image` — Nano Banana Pro (3x cost but best visual fidelity)
- **Typography-heavy**: `openai-gpt-image-1` (best text rendering in images)

---

## Video Models (Image-to-Video)

Used for animating scene images into video clips. Selected via `videoModel`.

| ID | Name | Resolution | Duration | Audio | End Frame | Notes |
|----|------|-----------|----------|-------|-----------|-------|
| `kling-2.1` | Kling 2.1 | 720p | 5–10s | No | No | Budget-friendly **(default)** |
| `kling-2.6-pro` | Kling Pro | 1080p | 5–10s | Yes | Yes | High quality + native audio |
| `kling-o1` | Kling O1 | 1080p | 3–10s | No | Yes | Flexible duration range |
| `kling-3.0` | Kling 3.0 | 1080p | 5–10s | Yes | Yes | Latest Kling, native audio |
| `minimax-01` | Minimax | 720p | 6s | No | No | Fixed 6s clips |
| `minimax-hailuo-02` | Hailuo 02 | 768p | 6–10s | No | Yes | Supports end frame |
| `luma-ray-2` | Luma Ray 2 | 720p | 5s, 9s | No | Yes | Cinematic motion |
| `veo3` | Veo 3 | 1080p | 4–8s | Yes | No | Google, native audio |
| `veo3.1` | Veo 3.1 | 1080p | 4–8s | Yes | No | Latest Google model |
| `veo3.1-fast` | Veo 3.1 Fast | 1080p | 4–8s | Yes | No | Budget tier of Veo 3.1 |
| `grok-imagine` | Grok Imagine | 720p | 5–10s | Yes | No | xAI, native audio |

### Text-to-Video Models (no input image needed)
| ID | Name | Resolution | Duration | Audio | Notes |
|----|------|-----------|----------|-------|-------|
| `veo3-fast` | Veo 3 Fast | 1080p | 4–8s | Yes | Text prompt → video directly |
| `wan-2.1` | Wan 2.1 | 720p | 4–10s | No | Flexible duration |
| `grok-imagine-t2v` | Grok T2V | 720p | 5–10s | Yes | xAI text-to-video |

### Quick Picks
- **Budget**: `kling-2.1` (cheapest, good quality)
- **Best quality**: `kling-3.0` or `veo3.1` (1080p + native audio)
- **Fastest**: `veo3.1-fast` (budget tier, still 1080p)
- **Cinematic motion**: `luma-ray-2` (smooth camera movements)
- **Native audio**: `kling-2.6-pro`, `kling-3.0`, `veo3`, `veo3.1`, `grok-imagine`

---

## Generation Modes

### Full Video (default)
Generates images → animates to video → adds voiceover + music + captions.
```
storyboardOnly: false, generateAnimatedVideos: true
```

### Storyboard Only (image-only)
Generates scene images only. No video animation, no audio. Useful for previewing/drafting before committing to full generation.
```
storyboardOnly: true
```

### Images + Audio (no video animation)
Generates images and voiceover but skips video animation. Creates a slideshow-style output.
```
storyboardOnly: false, generateAnimatedVideos: false
```

## Per-Clip Video Duration

The `videoDuration` field controls how long each scene's video clip is (in seconds). Valid values: `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`. Default depends on the model's supported range.
