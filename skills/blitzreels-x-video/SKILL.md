---
name: blitzreels-x-video
description: Turn an X or Twitter post, native X video, thread, conversation, or current trend into short-form video with BlitzReels. Use when the user provides an x.com URL or asks to research X and create clips, a faceless explainer, a trend response, or platform-ready video.
---

# BlitzReels X-to-video

Combine current X evidence with the BlitzReels MCP tools. Do not treat popularity, sentiment, or a post's text as
verified unless the host can read the live source.

## Resolve the source

1. Open the supplied X links or use the host's X search capability when available.
2. Preserve the source URLs, author attribution, and publication time. Separate quoted claims from verified facts.
3. Choose one branch:
   - Native X video to clips: use the X post URL with `clips_create`.
   - Existing BlitzReels media: use its asset ID with `clips_create`.
   - Text post, thread, or trend to a new video: prepare a sourced brief, then follow `blitzreels-generation`.
4. Ask for the intended angle only when the source supports several materially different stories.

Completion: a reachable source, a clear video angle, and one selected production branch.

## Clip native X video

1. Call `clips_create` once with the X URL and a caller-generated idempotency key.
2. Follow `batch.polling` with `clips_get`; do not create a second batch while the first is active.
3. Present completed clips before items needing review. Include verified titles, download URLs, and the studio URL.
4. Start or retry a paid export only after approval when the returned state requires it.

Completion: a terminal batch or a bounded active status with its batch ID and studio URL.

## Create a video from an X discussion

1. Build a short brief with the hook, verified context, narration, visual direction, target duration, and aspect ratio.
2. Cite the X sources in the reviewable brief. Do not present an X claim as independent confirmation.
3. Follow `blitzreels-generation` for planning, cost review, asset generation, visual QA, and export.
4. Keep paid generation and export behind separate approval unless the user has already approved the disclosed cost.

Completion: a verified downloadable video plus the source list and any unresolved factual caveats.

## Boundaries

- Do not imitate a real person's voice or likeness without rights and explicit user intent.
- Do not download private, access-controlled, or deleted X media.
- Do not claim that BlitzReels publishes to X. Return a verified asset; use a separate authorized X tool for posting.
- Require approval immediately before publishing, deleting, purchasing, or spending credits.
