---
name: blitzreels-carousels
description: Create still-slide carousels with BlitzReels. Use for multi-image posts, photo mode, or swipe decks.
---

# BlitzReels Carousels

Build a carousel project and export individual slide images.
Do not assume platform ranking behavior or hardcode a generation model or price.

## Workflow

1. Confirm platform, aspect ratio, slide count, source material, and whether text should be baked into the slides.
2. Draft one purpose per slide: hook, ordered value, and final action when relevant.
3. Create a project with `project_type: "carousel"` and current platform-safe metadata.
4. Load the current carousel-generation schema from OpenAPI.
5. Choose the build path.
   - Use one-call generation for prompted, solid, gradient, or mixed backgrounds.
   - Use media import plus timeline placement when every image already exists and manual control is needed.
6. If generation returns a job ID, poll it to a terminal state before preview or export.
7. Read timeline context and render representative slides.
   Check order, crop, text wrapping, contrast, and safe areas.
8. Fix the project, then export a ZIP of slide images unless the user explicitly requests a video.
9. Poll the export and verify the archive format and slide count.

## Content rules

- Preserve the user's voice and claims; do not add unsupported performance promises.
- Keep slide copy scannable and visually balanced.
- Describe background scenes concretely when generation is requested.
- Treat safe-area presets as metadata until rendered frames prove the placement.

## Completion

Return the project ID, slide count, generation status, preview evidence, export status, and archive location.
The task is incomplete if generated assets are still pending or the exported archive has not been verified.
