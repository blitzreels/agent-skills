---
name: blitzreels-generation
description: Generate AI media with BlitzReels. Use for full videos, images, clips, voiceovers, music, or sound effects.
---

# BlitzReels Generation

Route generation requests by the current public contract.
Full AI video generation is public; standalone AI Studio media may still require the dashboard.

## Workflow

1. Load `https://www.blitzreels.com/api/capabilities.json` and identify the requested generation branch.
2. Inspect only the matching OpenAPI operations.
   Use a public operation when present; otherwise return the AI Studio route and name the missing public capability.
3. For a full video, distinguish topic from supplied script and retain the user's wording.
4. Create a video project with a caller-generated idempotency key.
5. List voices or visual styles only when the request needs that choice.
6. Start `POST /projects/{projectId}/faceless` with values accepted by the current schema.
7. Poll `/jobs/{jobId}` by its returned guidance until terminal state.
8. Read `/projects/{projectId}/context?mode=timeline` and inspect generated scenes and warnings.
9. After user approval for paid rendering, export the project and verify the downloadable output.

## Branches

- Full video from a topic or script: use the public faceless workflow.
- Standalone media: use a public operation only when discovery exposes it.
  When absent, direct the user to `/dashboard/ai-studio` without calling private tRPC procedures.
- Carousel: use `blitzreels-carousels`.
- Long-form source repurposing: use `blitzreels-clipping`.

## Generation rules

- Read model IDs, durations, aspect ratios, voices, and styles from the current schema.
- Preserve explicit prompts and scripts; improve them only when requested.
- Report input warnings and the server generation plan before polling.
- On an ambiguous timeout, inspect the project and jobs before retrying.
- Treat generated assets as pending until the job and media processing states are terminal.

## Completion

Return the public operation used, project and job IDs, generation plan, warnings, preview evidence, and export status.
An unsupported branch is complete only when the missing public capability and the exact dashboard route are stated.
